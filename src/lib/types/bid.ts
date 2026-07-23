// FR8X-CON Bid Types

import type { AuditFields } from "./common";

export type Bid = {
  id: string;
  auctionId: string;
  participantId: string;
  freight: BidFreight;
  localCharges: BidChargeRow[];
  destinationCharges: BidChargeRow[];
  containerCharges: ContainerCharge[];
  freeTime: FreeTime;
  sailingSchedule: SailingSchedule;
  transitTime: number; // days
  transhipment: "direct" | "transhipment";
  remarks: string;
  currency: string;
  totalAmount: number;
  submissionNumber: number; // 1–5
  rank?: number;
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
