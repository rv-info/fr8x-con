// FR8X-CON Zod Validators: Auction & Bid schemas (Multi-Modal Logistics Engine)

import { z } from "zod";

export const shipmentDetailsSchema = z.object({
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  originPort: z.string().min(1, "Origin port / location is required"),
  destinationPort: z.string().min(1, "Destination port / location is required"),
  mode: z.enum([
    "fcl",
    "lcl",
    "air",
    "break_bulk",
    "project_cargo",
    "roro",
    "rail",
    "road",
    "multimodal",
  ]),
  incoTerms: z.enum([
    "EXW",
    "FCA",
    "FAS",
    "FOB",
    "CFR",
    "CIF",
    "CPT",
    "CIP",
    "DAP",
    "DPU",
    "DDP",
  ]),
  cargoReadyDate: z.string().min(1, "Cargo ready date is required"),
  requiredDeliveryDate: z.string().min(1, "Required delivery date is required"),
  additionalRouting: z.string().optional(),
  serviceType: z.string().optional(),
  preferredCarrier: z.string().optional(),
});

export const containerDetailSchema = z
  .object({
    id: z.string(),
    containerSize: z.string().min(1, "Equipment size / type required"),
    numberOfContainers: z.number().min(1, "At least 1 unit required").int(),
    hazStatus: z.enum(["haz", "non_haz"]),
    hazClass: z.string().optional(),
    unNumber: z.string().optional(),
    flashPoint: z.string().optional(),
    packingGroup: z.string().optional(),
    packagesPerContainer: z.number().int().positive().optional(),
    grossWeight: z.number().positive("Gross weight must be positive"),
    dimensions: z.string().optional(),
    remarks: z.string().max(500).optional(),
  })
  .refine(
    (data) => {
      if (data.hazStatus === "haz") {
        return !!data.hazClass && !!data.unNumber;
      }
      return true;
    },
    {
      message: "Haz class and UN number are required for hazardous cargo",
      path: ["hazClass"],
    }
  );

export const commodityDetailSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Commodity description is required").max(500),
  hsCode: z.string().optional(),
  grossWeight: z.number().positive("Gross weight must be positive"),
  volume: z.number().positive().optional(),
  cbm: z.number().optional(),
  chargeableWeight: z.number().optional(),
  remarks: z.string().max(500).optional(),
});

export const modeSpecificDetailsSchema = z.object({
  cbm: z.number().optional(),
  wmRatio: z.number().optional(),
  isConsolidated: z.boolean().optional(),
  minChargeBasis: z.string().optional(),

  airCargoCategory: z.string().optional(),
  chargeableWeightKg: z.number().optional(),
  volumetricWeightKg: z.number().optional(),
  lengthCm: z.number().optional(),
  widthCm: z.number().optional(),
  heightCm: z.number().optional(),

  breakBulkCategory: z.string().optional(),
  maxUnitWeightMt: z.number().optional(),
  maxDimensionsMeters: z.string().optional(),
  centerOfGravityInfo: z.string().optional(),
  liftingPlanRequired: z.boolean().optional(),
  lashingRequired: z.boolean().optional(),

  roroVehicleType: z.string().optional(),
  isDrivable: z.boolean().optional(),
  vehicleDimensionsMeters: z.string().optional(),
  unitWeightMt: z.number().optional(),

  railServiceType: z.string().optional(),
  wagonCount: z.number().optional(),
  rakeCapacity: z.string().optional(),
  sidingDetails: z.string().optional(),

  roadTransportType: z.string().optional(),
  vehicleCount: z.number().optional(),
  axleLoadLimit: z.string().optional(),
  specialPermitsRequired: z.boolean().optional(),

  legsDescription: z.string().optional(),
}).optional();

export const bidRulesSchema = z.object({
  maxSubmissions: z.number().int().min(1).max(10).default(5),
  allowedCurrencies: z.array(z.string()).min(1),
  defaultCurrency: z.string().min(1),
  visibilityRules: z.object({
    showParticipantNames: z.boolean().default(false),
    showBidAmounts: z.boolean().default(false),
    showRankToParticipant: z.boolean().default(true),
    showTotalParticipants: z.boolean().default(true),
  }),
  rankingRules: z.object({
    criteria: z.enum(["lowest_total", "weighted", "custom"]),
    weights: z.record(z.number()).optional(),
  }),
});

export const chargesHeadSchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Charges head name is required"),
  type: z.enum(["freight", "local", "destination", "other"]),
  isRequired: z.boolean(),
});

export const auctionCreateSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  shipmentDetails: shipmentDetailsSchema,
  containerDetails: z.array(containerDetailSchema).min(1, "At least one container/unit detail is required"),
  commodityDetails: z.array(commodityDetailSchema).min(1, "At least one commodity detail is required"),
  modeSpecificDetails: modeSpecificDetailsSchema,
  bidRules: bidRulesSchema,
  chargesStructure: z.object({
    includeFreight: z.boolean(),
    includeLocalCharges: z.boolean(),
    includeDestinationCharges: z.boolean(),
    includeFreeTime: z.boolean(),
    chargesHeads: z.array(chargesHeadSchema),
  }),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().min(1, "End date is required"),
});

export type AuctionCreateFormData = z.infer<typeof auctionCreateSchema>;

// Bid submission schema
export const bidChargeRowSchema = z.object({
  id: z.string(),
  chargesHead: z.string().min(1, "Charges head is required"),
  type: z.string().min(1, "Type is required"),
  currency: z.string().min(1, "Currency is required"),
  amount: z.number().min(0, "Amount must be non-negative"),
});

export const bidSubmitSchema = z.object({
  freight: z.object({
    amount: z.number().min(0, "Freight amount must be non-negative"),
    currency: z.string().min(1, "Currency is required"),
    perUnit: z.enum(["container", "cbm", "ton", "shipment", "kg", "vehicle", "wagon", "rake"]),
  }),
  localCharges: z.array(bidChargeRowSchema),
  destinationCharges: z.array(bidChargeRowSchema),
  containerCharges: z.array(
    z.object({
      id: z.string(),
      containerSize: z.string(),
      chargesHead: z.string(),
      type: z.string(),
      currency: z.string(),
      amount: z.number().min(0),
    })
  ).optional(),
  freeTime: z.object({
    detentionDays: z.number().int().min(0),
    demurrageDays: z.number().int().min(0),
    combinedDays: z.number().int().min(0).optional(),
  }),
  sailingSchedule: z.object({
    vessel: z.string().optional(),
    voyage: z.string().optional(),
    etd: z.string().min(1, "ETD / Departure is required"),
    eta: z.string().min(1, "ETA / Arrival is required"),
    frequency: z.string().optional(),
  }),
  transitTime: z.number().int().positive("Transit time must be positive"),
  transhipment: z.enum(["direct", "transhipment"]),
  remarks: z.string().max(1000).optional(),
  currency: z.string().min(1, "Currency is required"),
});

export type BidSubmitFormData = z.infer<typeof bidSubmitSchema>;
