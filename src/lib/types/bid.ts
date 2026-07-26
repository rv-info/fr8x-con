// FR8X-CON Bid Types

import type { AuditFields } from "./common";

export type BidRevisionSnapshot = {
  revisionNumber: number;
  totalAmount: number;
  totalAmountUSD: number;
  currency: string;
  submittedAt: string;
};

export type Bid = {
  id: string;
  auctionId: string;
  participantId: string;
  bidderId?: string;
  bidderName?: string;
  bidderCompany?: string;
  freight?: BidFreight;
  freightCharges?: any[];
  localCharges: BidChargeRow[];
  destinationCharges?: BidChargeRow[];
  containerCharges?: ContainerCharge[];
  freeTime?: FreeTime;
  sailingSchedule?: SailingSchedule;
  transitTime?: number; // days
  transhipment?: "direct" | "transhipment";
  remarks?: string;
  currency: string;
  quoteCurrency?: string;
  totalAmount: number;
  totalAmountUSD?: number;
  totalAmountINR?: number;
  submissionNumber: number; // 1–5
  revisionNumber?: number;
  previousRevisions?: BidRevisionSnapshot[];
  rank?: number;
  tcoScore?: number;
} & AuditFields;

export type BidFreight = {
  amount: number;
  currency: string;
  perUnit: "container" | "cbm" | "ton" | "shipment";
};

export type BidChargeRow = {
  id: string;
  chargesHead: string;
  type: string;
  currency: string;
  amount: number;
};

export type ContainerCharge = {
  id: string;
  containerSize: string;
  chargesHead: string;
  type: string;
  currency: string;
  amount: number;
};

export type FreeTime = {
  detentionDays: number;
  demurrageDays: number;
  combinedDays?: number;
};

export type SailingSchedule = {
  vessel?: string;
  voyage?: string;
  etd: string; // ISO date
  eta: string; // ISO date
  frequency?: string;
};

export type LiveRank = {
  id: string;
  auctionId: string;
  participantId: string;
  rank: number;
  totalParticipants: number;
  submissionsUsed: number;
  maxSubmissions: number;
  lastUpdated: AuditFields["createdAt"];
};
