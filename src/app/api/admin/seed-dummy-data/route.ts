// FR8X-CON API Route — Provision Dummy Data & Auto-Approve All KYC/Permissions
import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    const dummyEntities = {
      users: [
        {
          uid: "godmode_admin_001",
          email: "support@fr8x.in",
          displayName: "GodMode Administrator",
          role: "admin",
          isGodMode: true,
          membershipTier: "premium",
          kycStatus: "verified",
          kycApprovedBy: "GODMODE_ADMIN",
          status: "active",
          verifiedBadge: true,
          verificationLevel: "Tier-3 Enterprise Gold Verified",
          updatedAt: new Date().toISOString(),
        },
        {
          uid: "user_mgt_raivega_2026",
          email: "mgt@raivega.in",
          displayName: "Management (Rai Vega)",
          role: "freight_forwarder",
          isGodMode: false,
          membershipTier: "premium",
          kycStatus: "verified",
          kycApprovedBy: "GODMODE_ADMIN",
          status: "active",
          companyId: "comp_raivega_001",
          verifiedBadge: true,
          verificationLevel: "Tier-3 Enterprise Gold Verified",
          updatedAt: new Date().toISOString(),
        },
      ],
      companies: [
        {
          id: "comp_raivega_001",
          name: "Rai Vega Logistics Pvt Ltd",
          registrationNumber: "CIN-U74999MH2024PTC123456",
          kycStatus: "verified",
          verificationLevel: "Tier-3 Enterprise Gold Verified",
          approvedBy: "GODMODE_ADMIN",
          status: "active",
          location: "JNPT / Nhava Sheva, Maharashtra",
          updatedAt: new Date().toISOString(),
        },
        {
          id: "comp_acme_002",
          name: "ACME Global Exports Ltd",
          registrationNumber: "CIN-U74999DL2023PTC654321",
          kycStatus: "verified",
          verificationLevel: "Tier-3 Enterprise Gold Verified",
          approvedBy: "GODMODE_ADMIN",
          status: "active",
          location: "New Delhi, NCR, India",
          updatedAt: new Date().toISOString(),
        },
      ],
    };

    // If Firestore Admin SDK is available, update Firestore collections
    if (adminDb && typeof adminDb.collection === "function") {
      for (const u of dummyEntities.users) {
        await adminDb.collection("users").doc(u.uid).set(u, { merge: true });
      }
      for (const c of dummyEntities.companies) {
        await adminDb.collection("companies").doc(c.id).set(c, { merge: true });
      }
    }

    return NextResponse.json({
      success: true,
      message: "Successfully seeded dummy data and auto-approved all accounts & companies for GodMode.",
      entities: dummyEntities,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : "Error seeding dummy data";
    return NextResponse.json({ success: false, error: errorMsg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: "/api/admin/seed-dummy-data",
    description: "POST to this endpoint to seed pre-approved dummy users, companies, and permissions.",
  });
}
