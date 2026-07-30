// FR8X-CON GodMode Account Provisioning & Seeding API Route
// Automatically creates/promotes support@fr8x.in with QWERTY@123x & isGodMode: true in Firestore

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "support@fr8x.in").trim().toLowerCase();
    const password = body.password || "QWERTY@123x";
    const displayName = body.displayName || "GodMode Administrator";

    let uid = "";

    // 1. Check if user exists in Firebase Auth
    try {
      if (adminAuth.getUserByEmail) {
        const existingUser = await adminAuth.getUserByEmail(email);
        uid = existingUser.uid;
        // Update password to ensure synchronization
        await adminAuth.updateUser(uid, { password, displayName, emailVerified: true });
      }
    } catch (authErr: any) {
      // User not found in Firebase Auth — create new user
      if (authErr.code === "auth/user-not-found" && adminAuth.createUser) {
        const newUser = await adminAuth.createUser({
          email,
          password,
          displayName,
          emailVerified: true,
        });
        uid = newUser.uid;
      } else {
        // If Admin SDK lacks credentials, body may pass uid if client created user
        uid = body.uid || "";
      }
    }

    // If UID is still empty (e.g. client created account and passed UID)
    if (!uid && body.uid) {
      uid = body.uid;
    }

    if (!uid) {
      return NextResponse.json({
        success: false,
        error: "Unable to provision Firebase Auth user. Please register at /register first or pass user UID.",
      }, { status: 400 });
    }

    // 2. Ensure Firestore user document has isGodMode: true & admin role
    if (adminDb.collection) {
      await adminDb.collection("users").doc(uid).set(
        {
          email,
          displayName,
          role: "admin",
          isGodMode: true,
          membershipTier: "premium",
          status: "active",
          emailVerified: true,
          updatedAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    return NextResponse.json({
      success: true,
      message: `GodMode user ${email} successfully provisioned and elevated with isGodMode: true`,
      uid,
      email,
      role: "admin",
      isGodMode: true,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal provisioning error";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    info: "FR8X-CON GodMode Provisioning Endpoint",
    targetUser: "support@fr8x.in",
    action: "Send POST request to auto-provision or elevate GodMode credentials.",
  });
}
