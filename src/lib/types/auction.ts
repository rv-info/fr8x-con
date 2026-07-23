// FR8X-CON Auction Types

import type { AuditFields, Status } from "./common";

export type AuctionStatus =
  | "draft"
  | "active"
  | "closed"
  | "awarded"
  | "cancelled"
  | "expired";

export type ShipmentMode = "fcl" | "lcl" | "air" | "road" | "multimodal";
export type IncoTerms = "FOB" | "CIF" | "CFR" | "EXW" | "DDP" | "DAP" | "FCA" | "CPT" | "CIP";
export type HazStatus = "haz" | "non_haz";
export type TransshipmentType = "direct" | "transhipment";

export type Auction = {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorCompany: string;
  title: string;
  referenceNumber: string;
  shipmentDetails: ShipmentDetails;
  containerDetails: ContainerDetail[];
  commodityDetails: CommodityDetail[];
  bidRules: BidRules;
  chargesStructure: ChargesStructure;
  status: AuctionStatus;
  participantsCount: number;
  bidsCount: number;
  startDate: string;
  endDate: string;
  lockedAt?: AuditFields["createdAt"];
} & AuditFields;

export type ShipmentDetails = {
  origin: string;
  destination: string;
  originPort: string;
  destinationPort: string;
  mode: ShipmentMode;
  incoTerms: IncoTerms;
  cargoReadyDate: string;
  requiredDeliveryDate: string;
};

export type ContainerDetail = {
  id: string;
  containerSize: "20ft" | "40ft" | "40ft_hc" | "45ft";
  numberOfContainers: number;
  hazStatus: HazStatus;
  hazClass?: string;
  unNumber?: string;
  flashPoint?: string;
  packingGroup?: string;
  packagesPerContainer?: number;
  grossWeight: number;
  remarks?: string;
};

export type CommodityDetail = {
  id: string;
  description: string;
  hsCode?: string;
  grossWeight: number;
  volume?: number;
  remarks?: string;
};

export type BidRules = {
  maxSubmissions: number; // Default: 5
  allowedCurrencies: string[];
  defaultCurrency: string;
  visibilityRules: VisibilityRules;
  rankingRules: RankingRules;
};

export type VisibilityRules = {
  showParticipantNames: boolean; // Default: false
  showBidAmounts: boolean;
  showRankToParticipant: boolean; // Default: true
  showTotalParticipants: boolean;
};

export type RankingRules = {
  criteria: "lowest_total" | "weighted" | "custom";
  weights?: Record<string, number>;
};

export type ChargesStructure = {
  includeFreight: boolean;
  includeLocalCharges: boolean;
  includeDestinationCharges: boolean;
  includeFreeTime: boolean;
  chargesHeads: ChargesHead[];
};

export type ChargesHead = {
  id: string;
  name: string;
  type: "freight" | "local" | "destination" | "other";
  isRequired: boolean;
};

export type AuctionParticipant = {
  id: string;
  auctionId: string;
  userId: string;
  userName: string;
  userCompany: string;
  status: "invited" | "joined" | "declined" | "withdrawn";
  invitedAt: AuditFields["createdAt"];
  joinedAt?: AuditFields["createdAt"];
} & AuditFields;
