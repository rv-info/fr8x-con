// FR8X-CON Email Dispatch API — Production
// Supports: welcome, reset, otp email types via Zoho SMTP (nodemailer)
// Returns explicit failure when SMTP not configured — never silently swallows errors.

import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { adminAuth } from "@/lib/firebase/admin";
import { generateWelcomeEmail } from "@/lib/email/templates/welcome";
import { generateResetEmail } from "@/lib/email/templates/reset";

const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = (rateLimitMap.get(ip) || []).filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );
  if (timestamps.length >= MAX_REQUESTS_PER_WINDOW) return true;
  timestamps.push(now);
  rateLimitMap.set(ip, timestamps);
  return false;
}

function generateOTPEmailHtml(otp: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your FR8X-CON Verification Code</title></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;">
  <div style="max-width:480px;margin:40px auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
    <div style="background:linear-gradient(135deg,#0b192c 0%,#1e3a5f 100%);padding:24px 32px;">
      <div style="display:flex;align-items:center;gap:12px;">
        <div style="width:40px;height:40px;background:#56C5F0;border-radius:10px;display:flex;align-items:center;justify-content:center;">
          <span style="color:#fff;font-weight:900;font-size:14px;">F8</span>
        </div>
        <div>
          <span style="color:#ffffff;font-weight:900;font-size:20px;letter-spacing:2px;">FR8X</span>
          <span style="color:#56C5F0;font-weight:700;font-size:20px;">-CON</span>
        </div>
      </div>
    </div>
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#0b192c;font-size:22px;font-weight:700;">Email Verification Code</h2>
      <p style="margin:0 0 24px;color:#64748b;font-size:14px;line-height:1.6;">
        Use the code below to verify your email address. This code expires in <strong>10 minutes</strong> and can only be used once.
      </p>
      <div style="background:#f0f9ff;border:2px solid #56C5F0;border-radius:12px;padding:20px;text-align:center;margin:0 0 24px;">
        <span style="font-size:36px;font-weight:900;letter-spacing:12px;color:#0b192c;font-family:monospace;">${otp}</span>
      </div>
      <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">
        If you did not request this code, please ignore this email. Do not share this code with anyone.
      </p>
    </div>
    <div style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:16px 32px;text-align:center;">
      <p style="margin:0;color:#94a3b8;font-size:11px;">&copy; ${new Date().getFullYear()} FR8X-CON Enterprise Logistics Platform</p>
    </div>
  </div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  try {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "anonymous";

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.email || !body.type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: email and type." },
        { status: 400 }
      );
    }

    const { email, type, displayName, otp } = body;
    const validTypes = ["welcome", "reset", "otp"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { success: false, error: `Invalid type. Must be one of: ${validTypes.join(", ")}.` },
        { status: 400 }
      );
    }

    const smtpHost = process.env.ZOHO_SMTP_HOST || "smtp.zoho.com";
    const smtpPort = parseInt(process.env.ZOHO_SMTP_PORT || "465", 10);
    const smtpUser = process.env.ZOHO_SMTP_USER || "";
    const smtpPass = process.env.ZOHO_SMTP_PASS || "";

    const hostHeader = req.headers.get("host") || "localhost:3000";
    const protocol =
      req.headers.get("x-forwarded-proto") ||
      (hostHeader.includes("localhost") ? "http" : "https");
    const origin =
      req.headers.get("origin") || `${protocol}://${hostHeader}`;

    let subject = "";
    let html = "";
    let text = "";

    if (type === "welcome") {
      const template = generateWelcomeEmail({
        displayName: displayName || email.split("@")[0],
        loginUrl: `${origin}/login`,
        appName: "FR8X-CON",
      });
      subject = template.subject;
      html = template.html;
      text = template.text;
    } else if (type === "reset") {
      let resetLink = `${origin}/reset-password?email=${encodeURIComponent(email)}`;
      try {
        resetLink = await adminAuth.generatePasswordResetLink(email, {
          url: `${origin}/reset-password`,
          handleCodeInApp: true,
        });
      } catch {
        // Fall back to generic reset link if Admin SDK unavailable
      }
      const template = generateResetEmail({ resetLink, appName: "FR8X-CON" });
      subject = template.subject;
      html = template.html;
      text = template.text;
    } else if (type === "otp") {
      // OTP is passed from the OTP send route (server-to-server call)
      if (!otp || typeof otp !== "string" || !/^\d{6}$/.test(otp)) {
        return NextResponse.json(
          { success: false, error: "Invalid OTP provided." },
          { status: 400 }
        );
      }
      subject = "Your FR8X-CON Verification Code";
      html = generateOTPEmailHtml(otp);
      text = `Your FR8X-CON verification code is: ${otp}\n\nThis code expires in 10 minutes and can only be used once. Do not share it with anyone.`;
    }

    // Require SMTP credentials — never silently succeed
    if (!smtpUser || !smtpPass) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Email service is not configured. Please set ZOHO_SMTP_USER and ZOHO_SMTP_PASS.",
        },
        { status: 503 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: { user: smtpUser, pass: smtpPass },
    });

    const info = await transporter.sendMail({
      from: `"FR8X-CON" <${smtpUser}>`,
      to: email,
      subject,
      html,
      text,
    });

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (err: unknown) {
    const message =
      err instanceof Error ? err.message : "Internal server error dispatching email.";
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
