// FR8X-CON Zod Validators: Auction & Bid schemas

import { z } from "zod";

export const shipmentDetailsSchema = z.object({
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  originPort: z.string().min(1, "Origin port is required"),
  destinationPort: z.string().min(1, "Destination port is required"),
  mode: z.enum(["fcl", "lcl", "air", "road", "multimodal"]),
  incoTerms: z.enum(["FOB", "CIF", "CFR", "EXW", "DDP", "DAP", "FCA", "CPT", "CIP"]),
  cargoReadyDate: z.string().min(1, "Cargo ready date is required"),
  requiredDeliveryDate: z.string().min(1, "Required delivery date is required"),
});

export const containerDetailSchema = z.object({
  id: z.string(),
  containerSize: z.enum(["20ft", "40ft", "40ft_hc", "45ft"]),
  numberOfContainers: z.number().min(1, "At least 1 container required").int(),
  hazStatus: z.enum(["haz", "non_haz"]),
  hazClass: z.string().optional(),
  unNumber: z.string().optional(),
  flashPoint: z.string().optional(),
  packingGroup: z.string().optional(),
  packagesPerContainer: z.number().int().positive().optional(),
  grossWeight: z.number().positive("Gross weight must be positive"),
  remarks: z.string().max(500).optional(),
}).refine(
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
  remarks: z.string().max(500).optional(),
});

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
  containerDetails: z.array(containerDetailSchema).min(1, "At least one container detail is required"),
  commodityDetails: z.array(commodityDetailSchema).min(1, "At least one commodity detail is required"),
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
    perUnit: z.enum(["container", "cbm", "ton", "shipment"]),
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
    etd: z.string().min(1, "ETD is required"),
    eta: z.string().min(1, "ETA is required"),
    frequency: z.string().optional(),
  }),
  transitTime: z.number().int().positive("Transit time must be positive"),
  transhipment: z.enum(["direct", "transhipment"]),
  remarks: z.string().max(1000).optional(),
  currency: z.string().min(1, "Currency is required"),
});

export type BidSubmitFormData = z.infer<typeof bidSubmitSchema>;
