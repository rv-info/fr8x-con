// FR8X-CON Rate Types

import type { AuditFields, Status } from "./common";

export type Rate = {
  id: string;
  origin: string;
  originPort: string;
  destination: string;
  destinationPort: string;
  containerType: string;
  carrier: string;
  carrierCode: string;
  rate: number;
  currency: string;
  validFrom: string;
  validTo: string;
  transitTime: number;
  transhipment: "direct" | "transhipment";
  freeTime: number;
  localCharges: RateChargeRow[];
  destinationCharges: RateChargeRow[];
  status: RateStatus;
  submittedBy: string;
  approvedBy?: string;
  approvedAt?: AuditFields["createdAt"];
  rejectionReason?: string;
  previousVersionId?: string;
} & AuditFields;

export type RateChargeRow = {
  id: string;
  chargesHead: string;
  type: string;
  currency: string;
  amount: number;
};

export type RateStatus = "draft" | "submitted" | "approved" | "rejected" | "expired";

export type RateFilter = {
  origin?: string;
  destination?: string;
  containerType?: string;
  carrier?: string;
  validOn?: string;
  status?: RateStatus;
};

export type RateCompare = {
  rateIds: string[];
  rates: Rate[];
};
