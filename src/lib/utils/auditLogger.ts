// FR8X-CON Audit Logging System — Permanent Immutable Audit Trail
"use client";

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
  | "UPDATE_PAYMENT_CONFIG"
  | "UPDATE_SUBSCRIPTION_PLANS"
  | "UPDATE_SYSTEM_SETTINGS"
  | "ADMIN_OVERRIDE";

export type AuditLogEntry = {
  id: string;
  eventType: AuditEventType;
  action: string;
  module?: string;
  auctionId?: string;
  bidId?: string;
  supplierId?: string;
  performedByUserId: string;
  performedByName: string;
  performedByRole: string; // "buyer" | "supplier" | "godmode_admin"
  details: Record<string, any> | string;
  timestamp: string;
};

/**
 * Write an immutable audit entry to Firestore COLLECTIONS.AUDIT
 */
export async function logAuditEvent(
  eventType: AuditEventType,
  action: string,
  user: { uid: string; name?: string; role?: string },
  details: Record<string, any> | string,
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
    performedByName: user.name || "GodMode Administrator",
    performedByRole: user.role || "godmode_admin",
    details,
    timestamp: new Date().toISOString(),
  };

  try {
    await setDocument(COLLECTIONS.AUDIT, auditId, entry);
    console.log(`[AUDIT LOGGED] ${eventType}: ${action}`);

    // Store in local storage for admin audit trail component
    if (typeof window !== "undefined") {
      const existing = getStoredAuditLogs();
      localStorage.setItem("fr8x_audit_logs", JSON.stringify([entry, ...existing.slice(0, 99)]));
    }
  } catch (err) {
    console.error("[AUDIT LOG ERROR] Failed to record audit entry:", err);
  }

  return auditId;
}

/**
 * Helper to log configuration audit actions
 */
export function logAuditAction(payload: { action: string; module: string; details: string }) {
  return logAuditEvent(
    payload.action as AuditEventType,
    payload.action,
    { uid: "admin_godmode", name: "GodMode Administrator", role: "godmode_admin" },
    payload.details
  );
}

/**
 * Retrieve local cached audit logs
 */
export function getStoredAuditLogs(): AuditLogEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem("fr8x_audit_logs");
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading audit logs:", err);
  }
  return [
    {
      id: "audit_init_01",
      eventType: "ADMIN_OVERRIDE",
      action: "UPDATE_PAYMENT_CONFIG",
      module: "Billing & Gateways",
      performedByUserId: "admin_godmode",
      performedByName: "GodMode Administrator",
      performedByRole: "godmode_admin",
      details: "GodMode initialized payment gateways and UPI QR configuration.",
      timestamp: new Date(Date.now() - 3600000).toISOString(),
    },
  ];
}
