// FR8X-CON Email OTP Generation & Dispatch — Server-Side Only
// Backend-only OTP: generated, hashed, stored in Firestore, emailed.
// OTP is NEVER returned to client.

import { NextResponse, type NextRequest } from "next/server";
import * as crypto from "crypto";
import { adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// Rate limiting: in-memory store per IP (resets on cold start)
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();

const OTP_EXPIRY_MS = 10 * 60 * 1000;       // 10 minutes
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const RATE_LIMIT_MAX = 3;                     // max 3 OTP requests per 10 min per IP
const OTP_LENGTH = 6;

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function generateOTP(): string {
  // Cryptographically random 6-digit OTP
  const buffer = crypto.randomBytes(4);
  const num = buffer.readUInt32BE(0) % 1_000_000;
  return num.toString().padStart(OTP_LENGTH, "0");
}

function hashOTP(otp: string, salt: string): string {
  return crypto
    .createHmac("sha256", process.env.OTP_SECRET_KEY || "fr8x-otp-secret-change-in-prod")
    .update(otp + salt)
    .digest("hex");
}

function checkRateLimit(ip: string): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { allowed: true };
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIP(request);
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        {
          error: `Too many OTP requests. Please wait ${rateCheck.retryAfter} seconds before trying again.`,
        },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body.email !== "string") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    // Generate OTP and hash it
    const otp = generateOTP();
    const salt = crypto.randomBytes(16).toString("hex");
    const hashedOtp = hashOTP(otp, salt);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);
    const otpId = `otp_${email.replace(/[^a-zA-Z0-9]/g, "_")}_${Date.now()}`;

    // Store hashed OTP in Firestore (server Admin SDK only)
    await adminDb.collection("otps").doc(otpId).set({
      email,
      hashedOtp,
      salt,
      expiresAt,
      usedAt: null,
      retryCount: 0,
      lockedUntil: null,
      ip,
      createdAt: FieldValue.serverTimestamp(),
    });

    // Send OTP via email API
    const emailApiUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/send-email`;
    const emailRes = await fetch(emailApiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        type: "otp",
        otp, // Only sent via email, never in API response
        otpId,
      }),
    });

    if (!emailRes.ok) {
      // Clean up OTP doc if email fails
      await adminDb.collection("otps").doc(otpId).delete();
      return NextResponse.json(
        { error: "Failed to send OTP email. Please check your email address." },
        { status: 502 }
      );
    }

    // Return only success — never return OTP or otpId to client
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
