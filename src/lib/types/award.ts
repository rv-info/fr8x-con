// FR8X-CON Award & Blacklist Types

import type { AuditFields } from "./common";

export type AwardCategory =
  | "top_forwarder"
  | "fastest_response"
  | "best_rates"
  | "highest_acceptance"
  | "trusted_partner";

export const AWARD_LABELS: Record<AwardCategory, string> = {
  top_forwarder: "Top Forwarder",
  fastest_response: "Fastest Response",
  best_rates: "Best Rates",
  highest_acceptance: "Highest Acceptance",
  trusted_partner: "Trusted Partner",
};

export type Award = {
  id: string;
  recipientId: string;
  recipientName: string;
  recipientCompany: string;
  category: AwardCategory;
  year: number;
  quarter?: number;
  issuedBy: string;
  issuedByName: string;
  description?: string;
} & AuditFields;

export type AppealStatus = "none" | "pending" | "under_review" | "approved" | "denied";

export type BlacklistEntry = {
  id: string;
  userId: string;
  userName: string;
  userCompany: string;
  reason: string;
  issuedBy: string;
  issuedByName: string;
  issuedDate: string;
  appealStatus: AppealStatus;
  appealDate?: string;
  appealReason?: string;
  enforcementHistory: EnforcementRecord[];
  expiresAt?: string;
} & AuditFields;

export type EnforcementRecord = {
  id: string;
  action: "added" | "removed" | "extended" | "appealed" | "appeal_denied" | "appeal_approved";
  date: string;
  performedBy: string;
  performedByName: string;
  reason: string;
};
