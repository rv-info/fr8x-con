// FR8X-CON Auction Types — Multi-Modal Engine

import type { AuditFields } from "./common";
import type { TransportMode, IncotermCode } from "@/lib/utils/logisticsEngine";

export type AuctionStatus =
  | "draft"
  | "scheduled"
  | "active"
  | "closing_soon"
  | "closed"
  | "awarded"
  | "cancelled"
  | "expired";

export type AuctionType = "general" | "premium";

export type SelectiveFilters = {
  countries?: string[];
  regions?: string[];
  supplierRoles?: string[];
  minPerformanceRating?: number;
  preferredVendorListOnly?: boolean;
  previousBusinessRelationshipOnly?: boolean;
};

export type StrategicScoringWeights = {
  priceWeight: number; // e.g. 60%
  performanceWeight: number; // e.g. 15%
  onTimeWeight: number; // e.g. 10%
  spaceAvailabilityWeight: number; // e.g. 10%
  docAccuracyWeight: number; // e.g. 5%
};

export type ShipmentMode = TransportMode;
export type IncoTerms = IncotermCode;
export type HazStatus = "haz" | "non_haz";
export type TransshipmentType = "direct" | "transhipment";

export type Auction = {
  id: string;
  creatorId: string;
  creatorName: string;
  creatorCompany: string;
  title: string;
  referenceNumber: string;
  auctionType?: AuctionType; // "general" | "premium"
  selectiveFilters?: SelectiveFilters;
  scoringWeights?: StrategicScoringWeights;
  shipmentDetails: ShipmentDetails;
  containerDetails: ContainerDetail[];
  commodityDetails: CommodityDetail[];
  modeSpecificDetails?: ModeSpecificDetails;
  bidRules: BidRules;
  chargesStructure: ChargesStructure;
  status: AuctionStatus;
  participantsCount: number;
  activeParticipantsCount?: number;
  bidsCount: number;
  totalRevisionsCount?: number;
  lowestBidAmount?: number;
  highestBidAmount?: number;
  averageBidAmount?: number;
  evaluationCurrency?: string;
  startDate: string;
  endDate: string;
  invitedBidders?: string[];
  cancellationReason?: string;
  cancelledBy?: string;
  cancelledAt?: string;
  awardedTo?: string;
  awardedBidId?: string;
  awardedAt?: string;
  priority?: "standard" | "urgent" | "critical";
  lastActivityAt?: string;
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
  additionalRouting?: string;
  serviceType?: string;
  preferredCarrier?: string;
};

export type ContainerDetail = {
  id: string;
  containerSize: string;
  numberOfContainers: number;
  hazStatus: HazStatus;
  hazClass?: string;
  unNumber?: string;
  flashPoint?: string;
  packingGroup?: string;
  packagesPerContainer?: number;
  grossWeight: number;
  dimensions?: string;
  remarks?: string;
};

export type CommodityDetail = {
  id: string;
  description: string;
  hsCode?: string;
  grossWeight: number;
  volume?: number;
  cbm?: number;
  chargeableWeight?: number;
  remarks?: string;
};

export type ModeSpecificDetails = {
  // LCL
  cbm?: number;
  wmRatio?: number;
  isConsolidated?: boolean;
  minChargeBasis?: string;

  // Air
  airCargoCategory?: string;
  chargeableWeightKg?: number;
  volumetricWeightKg?: number;
  lengthCm?: number;
  widthCm?: number;
  heightCm?: number;

  // Break Bulk & Project
  breakBulkCategory?: string;
  maxUnitWeightMt?: number;
  maxDimensionsMeters?: string;
  centerOfGravityInfo?: string;
  liftingPlanRequired?: boolean;
  lashingRequired?: boolean;
  loaderEquipmentRequired?: string;

  // RoRo
  roroVehicleType?: string;
  isDrivable?: boolean;
  vehicleDimensionsMeters?: string;
  unitWeightMt?: number;

  // Rail
  railServiceType?: string;
  wagonCount?: number;
  rakeCapacity?: string;
  sidingDetails?: string;

  // Road
  roadTransportType?: string;
  vehicleCount?: number;
  axleLoadLimit?: string;
  specialPermitsRequired?: boolean;

  // Multimodal
  legsDescription?: string;
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
