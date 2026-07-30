// FR8X-CON Auction Published Email Notification — Server-Side Only
// Queues and sends professional email notifications to invited bidders.
// Uses COLLECTIONS.EMAIL_QUEUE for reliability logging.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase/admin";

type AuctionEmailPayload = {
  auctionId: string;
  auctionRef: string;
  cargoType: string;
  origin: string;
  destination: string;
  bidDeadline: string;
  invitedBidderIds: string[];
  publisherName: string;
  publisherCompany: string;
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. Authenticate request
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let uid: string;
    try {
      const decoded = await adminAuth.verifyIdToken(token);
      uid = decoded.uid;
    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse and validate payload
    const body = (await request.json()) as Partial<AuctionEmailPayload>;
    const {
      auctionId,
      auctionRef,
      cargoType,
      origin,
      destination,
      bidDeadline,
      invitedBidderIds,
      publisherName,
      publisherCompany,
    } = body;

    if (!auctionId || !auctionRef || !Array.isArray(invitedBidderIds) || invitedBidderIds.length === 0) {
      return NextResponse.json({ error: "Invalid request payload" }, { status: 400 });
    }

    // 3. Fetch bidder email addresses from Firestore
    const bidderEmails: string[] = [];
    for (const bidderId of invitedBidderIds.slice(0, 100)) {
      try {
        const userRecord = await adminAuth.getUser(bidderId);
        if (userRecord.email) bidderEmails.push(userRecord.email);
      } catch {
        // Skip unavailable users — don't halt entire batch
      }
    }

    // 4. Write email queue entries to Firestore for reliable delivery
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://con.fr8x.in";
    const now = new Date().toISOString();
    const batch = adminDb.batch();

    for (const recipientEmail of bidderEmails) {
      const docRef = adminDb.collection("emailQueue").doc();
      batch.set(docRef, {
        to: recipientEmail,
        subject: `[FR8X] New RFQ Published — ${auctionRef || "Ref. Pending"}`,
        template: "auction_invitation",
        templateData: {
          auctionRef: auctionRef || auctionId,
          cargoType: cargoType || "General Cargo",
          origin: origin || "TBD",
          destination: destination || "TBD",
          bidDeadline: bidDeadline || "Refer to platform",
          publisherName: publisherName || "FR8X Member",
          publisherCompany: publisherCompany || "FR8X Network",
          bidUrl: `${appUrl}/auctions/${auctionId}`,
        },
        status: "pending",
        createdAt: now,
        createdBy: uid,
      });
    }

    await batch.commit();

    // 5. Log the dispatch event to audit collection
    await adminDb.collection("audit").add({
      action: "auction.email_queued",
      description: `Email notifications queued for auction ${auctionRef} — ${bidderEmails.length} recipients`,
      actorId: uid,
      auctionId,
      recipientCount: bidderEmails.length,
      createdAt: now,
    });

    return NextResponse.json({
      queued: bidderEmails.length,
      auctionId,
    }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Notification dispatch failed." }, { status: 500 });
  }
}
