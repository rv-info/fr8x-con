// FR8X-CON Email OTP Verification — Server-Side Only
// Verifies hashed OTP, enforces expiry, retry limits, and replay protection.
// On success: returns Firebase custom token for signInWithCustomToken.

import { NextResponse, type NextRequest } from "next/server";
import * as crypto from "crypto";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

const MAX_RETRIES = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

function hashOTP(otp: string, salt: string): string {
  return crypto
    .createHmac("sha256", process.env.OTP_SECRET_KEY || "fr8x-otp-secret-change-in-prod")
    .update(otp + salt)
    .digest("hex");
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  try {
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    if (!body || typeof body.email !== "string" || typeof body.otp !== "string") {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const email = body.email.trim().toLowerCase();
    const submittedOtp = body.otp.trim().replace(/\s/g, "");

    if (!/^\d{6}$/.test(submittedOtp)) {
      return NextResponse.json({ error: "OTP must be a 6-digit number." }, { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }

    const now = new Date();

    // Find the most recent unused, unexpired OTP for this email
    const otpQuery = await adminDb
      .collection("otps")
      .where("email", "==", email)
      .where("usedAt", "==", null)
      .orderBy("createdAt", "desc")
      .limit(1)
      .get();

    if (otpQuery.empty) {
      return NextResponse.json(
        { error: "No active OTP found. Please request a new one." },
        { status: 400 }
      );
    }

    const otpDoc = otpQuery.docs[0]!;
    const otpData = otpDoc.data();
    const otpRef = otpDoc.ref;

    // Check lockout
    if (otpData.lockedUntil && otpData.lockedUntil.toDate() > now) {
      const waitSecs = Math.ceil(
        (otpData.lockedUntil.toDate().getTime() - now.getTime()) / 1000
      );
      return NextResponse.json(
        { error: `Account locked due to too many attempts. Try again in ${Math.ceil(waitSecs / 60)} minutes.` },
        { status: 429 }
      );
    }

    // Check expiry
    if (otpData.expiresAt.toDate() < now) {
      return NextResponse.json(
        { error: "OTP has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Check max retries
    if (otpData.retryCount >= MAX_RETRIES) {
      // Lock account
      await otpRef.update({
        lockedUntil: new Date(Date.now() + LOCKOUT_DURATION_MS),
      });
      return NextResponse.json(
        { error: "Too many failed attempts. Please request a new OTP." },
        { status: 429 }
      );
    }

    // Verify OTP using timing-safe comparison
    const expectedHash = hashOTP(submittedOtp, otpData.salt);
    const isValid = timingSafeEqual(expectedHash, otpData.hashedOtp);

    if (!isValid) {
      // Increment retry count
      const newCount = (otpData.retryCount || 0) + 1;
      const updates: Record<string, unknown> = { retryCount: newCount };
      if (newCount >= MAX_RETRIES) {
        updates.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS);
      }
      await otpRef.update(updates);

      const remaining = MAX_RETRIES - newCount;
      return NextResponse.json(
        {
          error:
            remaining > 0
              ? `Invalid OTP. ${remaining} attempt${remaining === 1 ? "" : "s"} remaining.`
              : "Too many failed attempts. Please request a new OTP.",
        },
        { status: 400 }
      );
    }

    // OTP is valid — mark as used (replay protection)
    await otpRef.update({ usedAt: FieldValue.serverTimestamp() });

    // Look up or create Firebase user for this email
    let uid: string;
    try {
      const existingUser = await adminAuth.getUserByEmail(email);
      uid = existingUser.uid;
    } catch {
      // User doesn't exist yet — create with email (no password, OTP-based)
      const newUser = await adminAuth.createUser({ email, emailVerified: true });
      uid = newUser.uid;
    }

    // Mark email as verified
    await adminAuth.updateUser(uid, { emailVerified: true });

    // Generate Firebase custom token (short-lived, client uses to sign in)
    const customToken = await adminAuth.createCustomToken(uid, {
      email,
      otpVerified: true,
    });

    return NextResponse.json({ success: true, customToken });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
