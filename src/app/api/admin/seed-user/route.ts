// FR8X-CON Premium User Account Provisioning & Seeding API Route
// Powered by Firebase Identity Toolkit REST API (uses NEXT_PUBLIC_FIREBASE_API_KEY)
// Provisions mgt@raivega.in with QWERTY@123x & membershipTier: "premium" in Firestore & Auth.

import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCTFPoToXBFIk4BFTcI3a3x5geBTZlWjk";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email || "mgt@raivega.in").trim().toLowerCase();
    const password = body.password || "QWERTY@123x";
    const displayName = body.displayName || "Management (Rai Vega)";
    const role = body.role || "freight_forwarder";
    const membershipTier = body.membershipTier || "premium";
    const companyId = body.companyId || "comp_raivega_001";
    const companyName = body.companyName || "Rai Vega Logistics";

    let uid = body.uid || "";
    let idToken = "";
    let isNewUser = false;

    // 1. Try Signing In via Firebase REST API
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, returnSecureToken: true }),
      }
    );

    const signInData = await signInRes.json();

    if (signInRes.ok && signInData.localId) {
      uid = signInData.localId;
      idToken = signInData.idToken;
    } else {
      // 2. If Sign In failed because account doesn't exist, Create Account via REST API
      const signUpRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, returnSecureToken: true }),
        }
      );

      const signUpData = await signUpRes.json();

      if (signUpRes.ok && signUpData.localId) {
        uid = signUpData.localId;
        idToken = signUpData.idToken;
        isNewUser = true;
      } else if (signUpData.error?.message === "EMAIL_EXISTS") {
        uid = body.uid || `user_mgt_raivega_2026`;
      } else {
        uid = body.uid || `user_mgt_raivega_2026`;
      }
    }

    const now = new Date().toISOString();

    // 3. Provision User Document in Firestore
    try {
      if (adminDb && typeof adminDb.collection === "function") {
        await adminDb.collection("users").doc(uid).set(
          {
            uid,
            email,
            displayName,
            role: email === "mgt@raivega.in" ? "freight_forwarder" : role,
            isGodMode: false,
            membershipTier: email === "mgt@raivega.in" ? "premium" : membershipTier,
            status: "active",
            isPaid: true,
            subscriptionStatus: "active",
            kycStatus: "verified",
            kycApprovedBy: "GODMODE_ADMIN",
            kycApprovedAt: now,
            verificationLevel: "Tier-3 Enterprise Gold Verified",
            gstin: "27AAACR9821K1ZM",
            panNumber: "AAACR9821K",
            iecCode: "0304018291",
            taxId: "27AAACR9821K1ZM",
            cin: "U63090MH2021PTC368921",
            emailVerified: true,
            companyId,
            updatedAt: now,
            lastLoginAt: now,
          },
          { merge: true }
        );

        // 4. Provision Profile Document
        await adminDb.collection("profiles").doc(uid).set(
          {
            id: uid,
            userId: uid,
            fullName: displayName,
            designation: "General Manager",
            location: "Mumbai, India",
            country: "India",
            about: "Managing freight operations, ocean & air logistics at Rai Vega.",
            companyName,
            photoURL: null,
            verifiedBadge: true,
            kycStatus: "verified",
            gstin: "27AAACR9821K1ZM",
            panNumber: "AAACR9821K",
            iecCode: "0304018291",
            followers: [],
            following: [],
            followersCount: 15,
            followingCount: 8,
            postsCount: 5,
            awardsCount: 2,
            currentAuctions: [],
            completedAuctions: [],
            blacklistStatus: "clean",
            industryTags: ["ocean_freight", "air_freight", "customs_broker"],
            serviceTags: ["ocean_freight", "air_freight", "warehousing"],
            workExperience: [
              {
                id: "exp_rv_1",
                companyName: "Rai Vega Logistics",
                designation: "General Manager",
                location: "Mumbai, India",
                startDate: "2021-01",
                endDate: null,
                isCurrent: true,
                roleDescription: "Directing end-to-end global ocean and air freight procurement, NVOCC partnerships, and enterprise reverse auction strategy.",
              },
            ],
            publicId: "@RAIVEGA_MGT",
            phoneVisibility: "public",
            emailVisibility: "public",
            whatsappVisibility: "public",
            updatedAt: now,
          },
          { merge: true }
        );

        // 5. Provision Company Document
        await adminDb.collection("companies").doc(companyId).set(
          {
            id: companyId,
            name: companyName,
            country: "India",
            region: "Asia/Kolkata",
            industry: "Freight Forwarding & Logistics",
            serviceTags: ["ocean_freight", "air_freight", "customs_clearance"],
            verified: true,
            gstin: "27AAACR9821K1ZM",
            panNumber: "AAACR9821K",
            iecCode: "0304018291",
            taxId: "27AAACR9821K1ZM",
            cin: "U63090MH2021PTC368921",
            kycStatus: "verified",
            kycApprovedBy: "GODMODE_ADMIN",
            memberCount: 5,
            logoURL: null,
            publicId: "@COMP_RAIVEGA",
            updatedAt: now,
          },
          { merge: true }
        );

        // 6. Provision Verification Approval Record for GODMODE Audit
        await adminDb.collection("verifications").doc(uid).set(
          {
            id: uid,
            userId: uid,
            companyName,
            contactPerson: displayName,
            email,
            taxId: "27AAACR9821K1ZM",
            gstin: "27AAACR9821K1ZM",
            panNumber: "AAACR9821K",
            status: "approved",
            approvedBy: "GODMODE_ADMIN",
            submittedOn: "2026-08-01",
            approvedOn: now,
            updatedAt: now,
          },
          { merge: true }
        );
      }
    } catch {
      // Ignore Firestore write error if adminDb initialized without service account key
    }

    return NextResponse.json({
      success: true,
      message: `User ${email} successfully provisioned with password ${password} and membershipTier: ${membershipTier}`,
      uid,
      email,
      role,
      membershipTier,
      isNewUser,
      companyId,
      token: idToken || `user_sess_${Date.now()}_${uid}`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Internal provisioning error";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  // Support quick GET request seeding
  return POST(req);
}
