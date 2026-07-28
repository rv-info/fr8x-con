import { NextRequest, NextResponse } from "next/server";
import nodemailer from "nodemailer";
import { adminAuth } from "@/lib/firebase/admin";
import { generateWelcomeEmail } from "@/lib/email/templates/welcome";
import { generateResetEmail } from "@/lib/email/templates/reset";

// Simple in-memory rate limiting map: IP -> array of timestamps
const rateLimitMap = new Map<string, number[]>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const timestamps = rateLimitMap.get(ip) || [];
  const validTimestamps = timestamps.filter((ts) => now - ts < RATE_LIMIT_WINDOW_MS);
  
  if (validTimestamps.length >= MAX_REQUESTS_PER_WINDOW) {
    return true;
  }
  
  validTimestamps.push(now);
  rateLimitMap.set(ip, validTimestamps);
  return false;
}

export async function POST(req: NextRequest) {
  try {
    // 1. Basic security / rate limiting
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    if (isRateLimited(ip)) {
      return NextResponse.json(
        { success: false, error: "Too many requests. Please try again later." },
        { status: 429 }
      );
    }

    // 2. Parse request body
    const body = await req.json().catch(() => null);
    if (!body || !body.email || !body.type) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: email and type." },
        { status: 400 }
      );
    }

    const { email, type, displayName } = body;

    if (type !== "welcome" && type !== "reset") {
      return NextResponse.json(
        { success: false, error: "Invalid type. Must be 'welcome' or 'reset'." },
        { status: 400 }
      );
    }

    // 3. Obtain origin for reset redirect URL
    const hostHeader = req.headers.get("host") || "localhost:3000";
    const protocol = req.headers.get("x-forwarded-proto") || (hostHeader.includes("localhost") ? "http" : "https");
    const origin = req.headers.get("origin") || `${protocol}://${hostHeader}`;

    // 4. Configure nodemailer transporter with Zoho SMTP
    const smtpHost = process.env.ZOHO_SMTP_HOST || "smtp.zoho.com";
    const smtpPort = parseInt(process.env.ZOHO_SMTP_PORT || "465", 10);
    const smtpUser = process.env.ZOHO_SMTP_USER || "";
    const smtpPass = process.env.ZOHO_SMTP_PASS || "";

    // Build email content based on type
    let subject = "";
    let html = "";
    let text = "";

    if (type === "welcome") {
      const loginUrl = `${origin}/login`;
      const template = generateWelcomeEmail({
        displayName: displayName || email.split("@")[0],
        loginUrl,
        appName: "FR8X-CON",
      });
      subject = template.subject;
      html = template.html;
      text = template.text;
    } else if (type === "reset") {
      let resetLink = `${origin}/reset-password`;
      
      try {
        // Generate Firebase password reset link using Admin SDK
        const actionCodeSettings = {
          url: `${origin}/reset-password`,
          handleCodeInApp: true,
        };
        resetLink = await adminAuth.generatePasswordResetLink(email, actionCodeSettings);
      } catch (adminErr: unknown) {
        console.warn(
          "[Send-Email API] Firebase Admin generatePasswordResetLink failed or credentials not set. Falling back to default URL:",
          adminErr instanceof Error ? adminErr.message : adminErr
        );
        resetLink = `${origin}/reset-password?email=${encodeURIComponent(email)}`;
      }

      const template = generateResetEmail({
        resetLink,
        appName: "FR8X-CON",
      });
      subject = template.subject;
      html = template.html;
      text = template.text;
    }

    // If SMTP credentials are configured, send real email via Zoho SMTP
    if (smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      });

      await transporter.sendMail({
        from: `"FR8X-CON" <${smtpUser}>`,
        to: email,
        subject,
        html,
        text,
      });

      return NextResponse.json({ success: true, message: "Email sent successfully via Zoho SMTP." });
    } else {
      // Log for local development when credentials aren't present yet
      console.log(`[Send-Email API Dev Mode] Mocking ${type} email dispatch to ${email}:`);
      console.log(`Subject: ${subject}`);

      return NextResponse.json({
        success: true,
        mocked: true,
        message: "Email dispatch simulated (ZOHO_SMTP_USER and ZOHO_SMTP_PASS not provided in environment).",
      });
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error dispatching email.";
    console.error("[Send-Email API Error]:", message);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
