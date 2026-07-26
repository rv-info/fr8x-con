// FR8X-CON Audit Logging System — Permanent Immutable Audit Trail

import { setDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

export type AuditEventType =
  | "AUCTION_CREATED"
  | "AUCTION_MODIFIED"
  | "AUCTION_CANCELLED"
  | "AUCTION_AWARDED"
  | "BID_SUBMITTED"
  | "BID_REVISED"
  | "BID_WITHDRAWN"
  | "SUPPLIER_RATED"
  | "SUPPLIER_WARNING_ISSUED"
  | "SUPPLIER_RESTRICTED"
  | "SUPPLIER_SUSPENDED"
  | "SUPPLIER_PRIVILEGES_RESTORED"
  | "ADMIN_OVERRIDE";

export type AuditLogEntry = {
  id: string;
  eventType: AuditEventType;
  action: string;
  auctionId?: string;
  bidId?: string;
  supplierId?: string;
  performedByUserId: string;
  performedByName: string;
  performedByRole: string; // "buyer" | "supplier" | "godmode_admin"
  details: Record<string, any>;
  timestamp: string;
};

/**
  Write an immutable audit entry to Firestore COLLECTIONS.AUDIT
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  action: string,
  user: { uid: string; name?: string; role?: string },
  details: Record<string, any>,
  auctionId?: string,
  bidId?: string,
  supplierId?: string
): Promise<string> {
  const auditId = `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const entry: AuditLogEntry = {
    id: auditId,
    eventType,
    action,
    auctionId,
    bidId,
    supplierId,
    performedByUserId: user.uid,
    performedByName: user.name || "System User",
    performedByRole: user.role || "user",
    details,
    timestamp: new Date().toISOString(),
  };

  try {
    await setDocument(COLLECTIONS.AUDIT, auditId, entry);
    console.log(`[AUDIT LOGGED] ${eventType}: ${action}`);
  } catch (err) {
    console.error("[AUDIT LOG ERROR] Failed to record audit entry:", err);
  }

  return auditId;
}
