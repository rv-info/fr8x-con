// FR8X-CON GodMode Server-Side Verification API
// Verifies Firebase ID token AND Firestore isGodMode field.
// Returns 403 if either check fails. Logs all access attempts.

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Missing authorization token." }, { status: 401 });
    }

    const idToken = authHeader.slice(7);
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    // Verify Firebase ID token
    let decodedToken;
    try {
      decodedToken = await adminAuth.verifyIdToken(idToken, true); // checkRevoked=true
    } catch {
      await logGodModeAccessAttempt(null, ip, false, "Invalid or expired token");
      return NextResponse.json({ error: "Invalid or expired token." }, { status: 401 });
    }

    const uid = decodedToken.uid;

    // Verify isGodMode in Firestore (cannot be spoofed via client)
    const userDoc = await adminDb.collection("users").doc(uid).get();
    if (!userDoc.exists || userDoc.data()?.isGodMode !== true) {
      await logGodModeAccessAttempt(uid, ip, false, "GodMode flag not set in Firestore");
      return NextResponse.json(
        { error: "Access denied. GodMode privileges not found." },
        { status: 403 }
      );
    }

    // Log successful GodMode access
    await logGodModeAccessAttempt(uid, ip, true, "GodMode access granted");

    return NextResponse.json({
      verified: true,
      uid,
      email: decodedToken.email,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal server error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

async function logGodModeAccessAttempt(
  uid: string | null,
  ip: string,
  success: boolean,
  reason: string
) {
  try {
    await adminDb.collection("audit").add({
      type: "godmode_access",
      uid,
      ip,
      success,
      reason,
      timestamp: FieldValue.serverTimestamp(),
    });
  } catch {
    // Audit log failures should not block the response
  }
}
