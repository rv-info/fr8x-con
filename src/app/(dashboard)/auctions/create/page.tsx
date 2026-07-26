// FR8X-CON Intelligent Multi-Modal Auction Create Page - 5-Step Form Workflow
// Adapts dynamically for Ocean FCL, Ocean LCL, Air Freight, Break Bulk, Project Cargo, RoRo, Rail Freight, Road Freight, and Multimodal.

"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/providers/AuthProvider";
import { setDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { logAuditEvent } from "@/lib/utils/auditLogger";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Ship,
  Package,
  Gavel,
  DollarSign,
  CheckCircle,
  Loader2,
  Info,
  Boxes,
  Plane,
  PackageCheck,
  Factory,
  Truck,
  Train,
  Container as ContainerIcon,
  GitMerge,
  Calculator,
  ShieldAlert,
} from "lucide-react";

import { auctionCreateSchema, type AuctionCreateFormData } from "@/lib/validators/auction";
import { ROUTES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import LocationSearchInput from "@/components/ui/LocationSearchInput";
import { FREIGHT_CURRENCIES as CURRENCY_LIST } from "@/lib/types/currency";
import {
  TRANSPORT_MODES,
  FCL_EQUIPMENT_TYPES,
  AIR_CARGO_CATEGORIES,
  BREAK_BULK_CATEGORIES,
  RAIL_SERVICE_TYPES,
  ROAD_TRANSPORT_TYPES,
  RORO_VEHICLE_TYPES,
  INCOTERMS_RULES,
  calculateAirVolumetricWeight,
  calculateChargeableWeight,
  calculateLclWM,
  type TransportMode,
  type IncotermCode,
} from "@/lib/utils/logisticsEngine";

const STEPS = [
  { id: 1, title: "Mode & Shipment Details", icon: Ship },
  { id: 2, title: "Cargo & Equipment Details", icon: Package },
  { id: 3, title: "Bid Rules & Visibility", icon: Gavel },
  { id: 4, title: "Dynamic Charges Structure", icon: DollarSign },
  { id: 5, title: "Review & Submit", icon: CheckCircle },
];

export default function AuctionCreatePage() {
  const router = useRouter();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setStatusMessage(msg);
    setTimeout(() => setStatusMessage(null), 3000);
  };

  const { register, control, handleSubmit, watch, setValue } = useForm<AuctionCreateFormData>({
    resolver: zodResolver(auctionCreateSchema),
    defaultValues: {
      title: "",
      shipmentDetails: {
        origin: "",
        destination: "",
        originPort: "",
        destinationPort: "",
        mode: "fcl",
        incoTerms: "FOB",
        cargoReadyDate: "",
        requiredDeliveryDate: "",
        additionalRouting: "",
        serviceType: "Standard Direct",
        preferredCarrier: "",
      },
      containerDetails: [
        {
          id: "1",
          containerSize: "20'DV",
          numberOfContainers: 1,
          hazStatus: "non_haz",
          grossWeight: 10000,
          remarks: "",
        },
      ],
      commodityDetails: [
        {
          id: "1",
          description: "General Commercial Cargo",
          grossWeight: 10000,
          cbm: 15,
        },
      ],
      modeSpecificDetails: {
        cbm: 15,
        wmRatio: 1,
        isConsolidated: false,
        minChargeBasis: "1 CBM / 1 TON",
        airCargoCategory: "general",
        chargeableWeightKg: 0,
        volumetricWeightKg: 0,
        lengthCm: 100,
        widthCm: 100,
        heightCm: 100,
        breakBulkCategory: "heavy_lift",
        maxUnitWeightMt: 25,
        maxDimensionsMeters: "12m x 3m x 3.2m",
        centerOfGravityInfo: "Marked on main chassis frame",
        liftingPlanRequired: true,
        lashingRequired: true,
        roroVehicleType: "drivable_vehicle",
        isDrivable: true,
        vehicleDimensionsMeters: "4.5m x 1.8m x 1.5m",
        unitWeightMt: 2.2,
        railServiceType: "container_rail",
        wagonCount: 2,
        rakeCapacity: "45 Containers",
        sidingDetails: "Private Rail Siding Terminal",
        roadTransportType: "ftl",
        vehicleCount: 1,
        axleLoadLimit: "12 Tons / Axle",
        specialPermitsRequired: false,
        legsDescription: "Leg 1: Road Haulage -> Leg 2: Ocean Line -> Leg 3: Final Destination Rail",
      },
      bidRules: {
        maxSubmissions: 5,
        allowedCurrencies: ["USD", "INR"],
        defaultCurrency: "USD",
        visibilityRules: {
          showParticipantNames: false,
          showBidAmounts: false,
          showRankToParticipant: true,
          showTotalParticipants: true,
        },
        rankingRules: {
          criteria: "lowest_total",
        },
      },
      chargesStructure: {
        includeFreight: true,
        includeLocalCharges: true,
        includeDestinationCharges: true,
        includeFreeTime: true,
        chargesHeads: [
          { id: "1", name: "Freight Rate (All-in)", type: "freight", isRequired: true },
          { id: "2", name: "Terminal Handling Charges - Origin (OTHC)", type: "local", isRequired: true },
          { id: "3", name: "Terminal Handling Charges - Destination (DTHC)", type: "destination", isRequired: true },
          { id: "4", name: "Customs Clearance & Documentation", type: "local", isRequired: false },
        ],
      },
      startDate: new Date().toISOString().split("T")[0],
      startTime: "12:00",
      period: 120,
      endDate: "",
    },
  });

  const selectedMode = watch("shipmentDetails.mode") as TransportMode;
  const selectedIncoterm = watch("shipmentDetails.incoTerms") as IncotermCode;

  const incotermInfo = useMemo(() => {
    return INCOTERMS_RULES[selectedIncoterm] || INCOTERMS_RULES["FOB"];
  }, [selectedIncoterm]);

  const {
    fields: containerFields,
    append: appendContainer,
    remove: removeContainer,
  } = useFieldArray({ control, name: "containerDetails" });

  const {
    fields: commodityFields,
    append: appendCommodity,
  } = useFieldArray({ control, name: "commodityDetails" });

  // Air calculation handlers
  const lengthCm = watch("modeSpecificDetails.lengthCm") || 0;
  const widthCm = watch("modeSpecificDetails.widthCm") || 0;
  const heightCm = watch("modeSpecificDetails.heightCm") || 0;
  const grossWtKg = watch("commodityDetails.0.grossWeight") || 0;

  const calculatedVolumetric = useMemo(() => {
    return calculateAirVolumetricWeight(lengthCm, widthCm, heightCm, 1, 6000);
  }, [lengthCm, widthCm, heightCm]);

  const calculatedChargeable = useMemo(() => {
    return calculateChargeableWeight(grossWtKg, calculatedVolumetric);
  }, [grossWtKg, calculatedVolumetric]);

  // LCL calculation
  const lclCbm = watch("modeSpecificDetails.cbm") || 1;
  const lclWeightTon = grossWtKg / 1000;
  const lclWMInfo = useMemo(() => {
    return calculateLclWM(lclCbm, lclWeightTon);
  }, [lclCbm, lclWeightTon]);

  const onSubmit = async (data: AuctionCreateFormData) => {
    if (!user) {
      showNotification("You must be logged in to create an auction.");
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Add required system fields
      const auctionId = crypto.randomUUID();
      const now = new Date();
      const startDt = new Date(`${data.startDate}T${data.startTime || "12:00"}`);
      const endDt = new Date(startDt.getTime() + (data.period || 120) * 60000);
      const computedEndDateString = endDt.toISOString().slice(0, 16).replace("T", " ");

      // Dynamic lifecycle status
      let initialStatus: "active" | "scheduled" = "active";
      if (startDt.getTime() > now.getTime() + 5 * 60000) {
        initialStatus = "scheduled";
      }

      const payload = {
        ...data,
        auctionType: (data as any).auctionType || "general",
        selectiveFilters: (data as any).selectiveFilters || {},
        scoringWeights: (data as any).scoringWeights || {
          priceWeight: 60,
          performanceWeight: 15,
          onTimeWeight: 10,
          spaceAvailabilityWeight: 10,
          docAccuracyWeight: 5,
        },
        endDate: computedEndDateString,
        id: auctionId,
        creatorId: user.uid,
        creatorName: user.displayName || "Procurement Authority",
        creatorCompany: user.companyId || "Enterprise Buyer",
        status: initialStatus,
        participantsCount: data.invitedBidders?.length || 0,
        activeParticipantsCount: 0,
        bidsCount: 0,
        totalRevisionsCount: 0,
        evaluationCurrency: data.bidRules?.defaultCurrency || "USD",
        createdAt: new Date().toISOString(),
        lastActivityAt: new Date().toISOString(),
      };
      
      await setDocument(COLLECTIONS.AUCTIONS, auctionId, payload);
      
      // Permanently record audit log
      await logAuditEvent(
        "AUCTION_CREATED",
        `Created ${payload.auctionType.toUpperCase()} Reverse Auction [Ref: ${(data as any).referenceNumber || auctionId}]`,
        { uid: user.uid, name: user.displayName || "Procurement Officer", role: "buyer" },
        { auctionType: payload.auctionType, title: data.title, mode: data.shipmentDetails?.mode, status: initialStatus },
        auctionId
      );

      console.log("Submitted reverse auction data:", payload);
      showNotification("Auction published successfully!");
      router.push(ROUTES.AUCTIONS);
    } catch (error) {
      console.error("Failed to create auction:", error);
      showNotification("Failed to publish auction. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getModeIcon = (modeId: TransportMode) => {
    switch (modeId) {
      case "fcl": return Ship;
      case "lcl": return Boxes;
      case "air": return Plane;
      case "break_bulk": return PackageCheck;
      case "project_cargo": return Factory;
      case "roro": return Truck;
      case "rail": return Train;
      case "road": return ContainerIcon;
      case "multimodal": return GitMerge;
      default: return Ship;
    }
  };

  return (
    <div className="w-full max-w-full px-4 lg:px-8 space-y-6">
      {/* Back button */}
      <button
        onClick={() => router.push(ROUTES.AUCTIONS)}
        className="flex items-center gap-1 text-body-sm text-foreground-secondary hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Auctions
      </button>

      {/* Header */}
      <div>
        <h1 className="text-display-sm text-foreground">Intelligent Freight Quotation & Auction Engine</h1>
        <p className="mt-1 text-body-md text-foreground-secondary">
          Unified multi-modal reverse auction posting engine with dynamic field rendering & Incoterms® logic
        </p>
        {statusMessage && (
          <div className="mt-3 p-3 bg-brand-50 border border-brand-200 text-brand-900 text-body-sm rounded">
            {statusMessage}
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2 border-b border-border">
        {STEPS.map((step, index) => {
          const Icon = step.icon;
          const isActive = currentStep === step.id;
          const isCompleted = currentStep > step.id;

          return (
            <div key={step.id} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(step.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded text-body-sm font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-[var(--fr8x-periwinkle)] text-white"
                    : isCompleted
                    ? "text-success bg-success-light"
                    : "text-foreground-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {step.title}
              </button>
              {index < STEPS.length - 1 && (
                <ChevronRight className="h-4 w-4 text-foreground-muted flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>

      <form onSubmit={handleSubmit(onSubmit)}>
        <AnimatePresence mode="wait">
          {/* STEP 1: MODE & SHIPMENT DETAILS */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Transport Mode Selection Grid */}
              <div className="fr8x-card p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-heading-lg text-foreground flex items-center gap-2">
                    <Ship className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
                    1. Select Transport Mode
                  </h2>
                  <span className="fr8x-badge fr8x-badge-info uppercase">
                    Active Mode: {selectedMode.toUpperCase()}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-9 gap-2">
                  {TRANSPORT_MODES.map((mode) => {
                    const ModeIcon = getModeIcon(mode.id);
                    const isSelected = selectedMode === mode.id;

                    return (
                      <button
                        key={mode.id}
                        type="button"
                        onClick={() => {
                          setValue("shipmentDetails.mode", mode.id);
                          if (mode.id === "fcl") setValue("containerDetails.0.containerSize", "20'DV");
                          else if (mode.id === "air") setValue("containerDetails.0.containerSize", "Air Cargo (Standard)");
                          else if (mode.id === "lcl") setValue("containerDetails.0.containerSize", "LCL Loose Cargo");
                          else if (mode.id === "break_bulk") setValue("containerDetails.0.containerSize", "Break Bulk Heavy Lot");
                          else if (mode.id === "roro") setValue("containerDetails.0.containerSize", "RoRo Vehicle Unit");
                          else if (mode.id === "rail") setValue("containerDetails.0.containerSize", "Rail Wagon / Container");
                          else if (mode.id === "road") setValue("containerDetails.0.containerSize", "FTL Truck");
                          else if (mode.id === "multimodal") setValue("containerDetails.0.containerSize", "Multimodal Unit Load");
                        }}
                        className={cn(
                          "flex flex-col items-center justify-center p-3 rounded border text-center transition-all duration-150 cursor-pointer h-24",
                          isSelected
                            ? "border-[var(--fr8x-periwinkle)] bg-[var(--fr8x-mist)] ring-1 ring-[var(--fr8x-periwinkle)] text-[var(--fr8x-jet)] font-semibold shadow-sm"
                            : "border-border bg-white text-foreground-secondary hover:bg-gray-50 hover:border-gray-300"
                        )}
                      >
                        <ModeIcon className={cn("h-5 w-5 mb-1.5", isSelected ? "text-[var(--fr8x-periwinkle)]" : "text-gray-500")} />
                        <span className="text-[11px] leading-tight font-medium">{mode.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* General Shipment & Incoterm Details */}
              <div className="fr8x-card p-5 space-y-5">
                <h2 className="text-heading-lg text-foreground">General Shipment Information</h2>

                <div>
                  <label className="fr8x-label">Auction Title *</label>
                  <input
                    className="fr8x-input mt-1"
                    {...register("title")}
                    placeholder={`e.g., ${selectedMode.toUpperCase()} Shipment - ${watch("shipmentDetails.origin") || "Origin"} to ${watch("shipmentDetails.destination") || "Destination"}`}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <LocationSearchInput
                      value={watch("shipmentDetails.origin") || ""}
                      onChange={(val) => setValue("shipmentDetails.origin", val)}
                      label="Shipment Origin (City/Country) *"
                      placeholder="e.g. Mumbai, India"
                      isPlaceOfReceiptOrDelivery={true}
                    />
                  </div>
                  <div>
                    <LocationSearchInput
                      value={watch("shipmentDetails.destination") || ""}
                      onChange={(val) => setValue("shipmentDetails.destination", val)}
                      label="Shipment Destination (City/Country) *"
                      placeholder="e.g. Hamburg, Germany"
                      isPlaceOfReceiptOrDelivery={true}
                    />
                  </div>
                  <div>
                    <label className="fr8x-label">Incoterms® 2020 *</label>
                    <select className="fr8x-input mt-1 font-semibold text-[var(--fr8x-jet)]" {...register("shipmentDetails.incoTerms")}>
                      {Object.keys(INCOTERMS_RULES).map((term) => (
                        <option key={term} value={term}>
                          {term} – {INCOTERMS_RULES[term as IncotermCode].name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Incoterm Intelligent Responsibility Matrix Banner */}
                <div className="p-3 bg-[var(--fr8x-mist)] border border-[var(--fr8x-lavender)] rounded text-[11px] space-y-2">
                  <div className="flex items-center gap-2 font-semibold text-[var(--fr8x-jet)]">
                    <Info className="h-4 w-4 text-[var(--fr8x-periwinkle)] flex-shrink-0" />
                    <span>Incoterm Responsibility Breakdown: {incotermInfo.name}</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                    <div>
                      <span className="font-semibold text-success-dark block mb-0.5">Seller / Supplier Cost Responsibilities:</span>
                      <ul className="list-disc list-inside text-foreground-secondary space-y-0.5">
                        {incotermInfo.sellerResponsibility.map((res, i) => (
                          <li key={i}>{res}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <span className="font-semibold text-brand-800 block mb-0.5">Buyer / Freight Payer Responsibilities:</span>
                      <ul className="list-disc list-inside text-foreground-secondary space-y-0.5">
                        {incotermInfo.buyerResponsibility.map((res, i) => (
                          <li key={i}>{res}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <LocationSearchInput
                      value={watch("shipmentDetails.originPort") || ""}
                      onChange={(val) => setValue("shipmentDetails.originPort", val)}
                      label="POL / Origin Hub / Terminal (Optional)"
                      placeholder="e.g. INNSA / BOM / Rail Depot"
                    />
                  </div>
                  <div>
                    <LocationSearchInput
                      value={watch("shipmentDetails.destinationPort") || ""}
                      onChange={(val) => setValue("shipmentDetails.destinationPort", val)}
                      label="POD / Destination Hub / Terminal (Optional)"
                      placeholder="e.g. DEHAM / FRA / Dest Ramp"
                    />
                  </div>
                  <div>
                    <label className="fr8x-label">Preferred Carrier / Operator (Optional)</label>
                    <input className="fr8x-input mt-1" {...register("shipmentDetails.preferredCarrier")} placeholder="e.g. Maersk / Lufthansa / CONCOR" />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                  <div>
                    <label className="fr8x-label">Cargo Readiness Date *</label>
                    <input type="date" className="fr8x-input mt-1" {...register("shipmentDetails.cargoReadyDate")} />
                  </div>
                  <div>
                    <label className="fr8x-label">Required Delivery Date *</label>
                    <input type="date" className="fr8x-input mt-1" {...register("shipmentDetails.requiredDeliveryDate")} />
                  </div>
                  <div>
                    <label className="fr8x-label">Auction Date *</label>
                    <input type="date" className="fr8x-input mt-1" {...register("startDate")} />
                  </div>
                  <div>
                    <label className="fr8x-label">Start Time *</label>
                    <input type="time" className="fr8x-input mt-1" {...register("startTime")} />
                  </div>
                  <div>
                    <label className="fr8x-label">Period (Minutes) *</label>
                    <input type="number" min="1" className="fr8x-input mt-1" {...register("period", { valueAsNumber: true })} />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 2: CARGO & MODE-SPECIFIC EQUIPMENT DETAILS */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Dynamic Mode-Specific Header Notice */}
              <div className="fr8x-card p-4 border-l-4 border-l-[var(--fr8x-periwinkle)] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calculator className="h-5 w-5 text-[var(--fr8x-periwinkle)] flex-shrink-0" />
                  <div>
                    <h3 className="text-heading-sm font-semibold text-[var(--fr8x-jet)]">
                      Dynamic Cargo Fields for {selectedMode.toUpperCase()}
                    </h3>
                    <p className="text-caption text-foreground-secondary">
                      Displaying equipment, volumetric inputs, and weight specs tailored for {selectedMode.toUpperCase()} cargo.
                    </p>
                  </div>
                </div>
              </div>

              {/* Mode-Specific Special Config Panel */}
              {selectedMode === "air" && (
                <div className="fr8x-card p-5 space-y-4">
                  <h3 className="text-heading-lg text-foreground flex items-center gap-2">
                    <Plane className="h-4 w-4 text-brand-600" />
                    Air Freight Volumetric & Chargeable Weight Engine
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="fr8x-label">Air Cargo Sub-Category</label>
                      <select className="fr8x-input mt-1" {...register("modeSpecificDetails.airCargoCategory")}>
                        {AIR_CARGO_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="fr8x-label">Length (cm)</label>
                      <input type="number" className="fr8x-input mt-1" {...register("modeSpecificDetails.lengthCm", { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="fr8x-label">Width (cm)</label>
                      <input type="number" className="fr8x-input mt-1" {...register("modeSpecificDetails.widthCm", { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="fr8x-label">Height (cm)</label>
                      <input type="number" className="fr8x-input mt-1" {...register("modeSpecificDetails.heightCm", { valueAsNumber: true })} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-brand-50 rounded border border-brand-200">
                    <div>
                      <span className="text-[10px] text-foreground-secondary uppercase block">Calculated Volumetric Weight (L×W×H / 6000):</span>
                      <span className="text-lg font-bold text-brand-900">{calculatedVolumetric} KG</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-foreground-secondary uppercase block">Final Chargeable Weight (Max Gross vs Volumetric):</span>
                      <span className="text-lg font-bold text-success-dark">{calculatedChargeable} KG</span>
                    </div>
                  </div>
                </div>
              )}

              {selectedMode === "lcl" && (
                <div className="fr8x-card p-5 space-y-4">
                  <h3 className="text-heading-lg text-foreground flex items-center gap-2">
                    <Boxes className="h-4 w-4 text-warning-dark" />
                    Ocean LCL Consolidation & W/M (Weight/Measurement) Engine
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="fr8x-label">Total Volume (CBM)</label>
                      <input type="number" step="0.1" className="fr8x-input mt-1" {...register("modeSpecificDetails.cbm", { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="fr8x-label">Gross Weight (KG)</label>
                      <input
                        type="number"
                        className="fr8x-input mt-1"
                        {...register("commodityDetails.0.grossWeight", { valueAsNumber: true })}
                      />
                    </div>
                    <div>
                      <label className="fr8x-label">Min Charge Basis</label>
                      <input className="fr8x-input mt-1" {...register("modeSpecificDetails.minChargeBasis")} />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                        <input type="checkbox" className="h-4 w-4 text-[var(--fr8x-periwinkle)] rounded" {...register("modeSpecificDetails.isConsolidated")} />
                        <span>Requires Port CFS Consolidation</span>
                      </label>
                    </div>
                  </div>

                  <div className="p-3 bg-warning-light/40 border border-warning/30 rounded flex items-center justify-between text-[11px]">
                    <span>W/M Basis Ratio: <strong>{lclWMInfo.wmBasis} {lclWMInfo.billingUnit}</strong></span>
                    <span className="text-foreground-secondary">Billing will be charged on {lclWMInfo.billingUnit} basis</span>
                  </div>
                </div>
              )}

              {(selectedMode === "break_bulk" || selectedMode === "project_cargo") && (
                <div className="fr8x-card p-5 space-y-4">
                  <h3 className="text-heading-lg text-foreground flex items-center gap-2">
                    <PackageCheck className="h-4 w-4 text-purple-600" />
                    Break Bulk & Project Heavy Lift Engineering Specs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="fr8x-label">Cargo Sub-Category</label>
                      <select className="fr8x-input mt-1" {...register("modeSpecificDetails.breakBulkCategory")}>
                        {BREAK_BULK_CATEGORIES.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="fr8x-label">Max Unit Weight (MT)</label>
                      <input type="number" className="fr8x-input mt-1" {...register("modeSpecificDetails.maxUnitWeightMt", { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="fr8x-label">Max Dimensions (L x W x H meters)</label>
                      <input className="fr8x-input mt-1" {...register("modeSpecificDetails.maxDimensionsMeters")} />
                    </div>
                    <div>
                      <label className="fr8x-label">Center of Gravity (CoG) Details</label>
                      <input className="fr8x-input mt-1" {...register("modeSpecificDetails.centerOfGravityInfo")} />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                      <input type="checkbox" className="h-4 w-4 text-[var(--fr8x-periwinkle)] rounded" {...register("modeSpecificDetails.liftingPlanRequired")} />
                      <span className="font-medium">Rigging & Lifting Plan Required</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                      <input type="checkbox" className="h-4 w-4 text-[var(--fr8x-periwinkle)] rounded" {...register("modeSpecificDetails.lashingRequired")} />
                      <span className="font-medium">Special Sea Lashing & Dunnage Needed</span>
                    </label>
                  </div>
                </div>
              )}

              {selectedMode === "roro" && (
                <div className="fr8x-card p-5 space-y-4">
                  <h3 className="text-heading-lg text-foreground flex items-center gap-2">
                    <Truck className="h-4 w-4 text-emerald-600" />
                    RoRo Vehicle & Mafi Unit Specs
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="fr8x-label">RoRo Unit Type</label>
                      <select className="fr8x-input mt-1" {...register("modeSpecificDetails.roroVehicleType")}>
                        {RORO_VEHICLE_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="fr8x-label">Unit Weight (MT)</label>
                      <input type="number" step="0.1" className="fr8x-input mt-1" {...register("modeSpecificDetails.unitWeightMt", { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="fr8x-label">Vehicle Dimensions (L×W×H meters)</label>
                      <input className="fr8x-input mt-1" {...register("modeSpecificDetails.vehicleDimensionsMeters")} />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                        <input type="checkbox" className="h-4 w-4 text-[var(--fr8x-periwinkle)] rounded" {...register("modeSpecificDetails.isDrivable")} />
                        <span className="font-medium">Self-Propelled / Drivable</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {selectedMode === "rail" && (
                <div className="fr8x-card p-5 space-y-4">
                  <h3 className="text-heading-lg text-foreground flex items-center gap-2">
                    <Train className="h-4 w-4 text-indigo-600" />
                    Rail Freight & Rake Movement Configuration
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="fr8x-label">Rail Service Type</label>
                      <select className="fr8x-input mt-1" {...register("modeSpecificDetails.railServiceType")}>
                        {RAIL_SERVICE_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="fr8x-label">Wagon Count</label>
                      <input type="number" className="fr8x-input mt-1" {...register("modeSpecificDetails.wagonCount", { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="fr8x-label">Rake Capacity</label>
                      <input className="fr8x-input mt-1" {...register("modeSpecificDetails.rakeCapacity")} placeholder="e.g. 45 Wagons / Rake" />
                    </div>
                    <div>
                      <label className="fr8x-label">Private / ICD Siding Details</label>
                      <input className="fr8x-input mt-1" {...register("modeSpecificDetails.sidingDetails")} placeholder="e.g. TKD Rail Depot" />
                    </div>
                  </div>
                </div>
              )}

              {selectedMode === "road" && (
                <div className="fr8x-card p-5 space-y-4">
                  <h3 className="text-heading-lg text-foreground flex items-center gap-2">
                    <ContainerIcon className="h-4 w-4 text-blue-600" />
                    Road Fleet & Hydraulic Trailer Specifications
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                      <label className="fr8x-label">Road Transport Type</label>
                      <select className="fr8x-input mt-1" {...register("modeSpecificDetails.roadTransportType")}>
                        {ROAD_TRANSPORT_TYPES.map((type) => (
                          <option key={type.id} value={type.id}>{type.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="fr8x-label">Vehicle Count</label>
                      <input type="number" className="fr8x-input mt-1" {...register("modeSpecificDetails.vehicleCount", { valueAsNumber: true })} />
                    </div>
                    <div>
                      <label className="fr8x-label">Axle Load Limit</label>
                      <input className="fr8x-input mt-1" {...register("modeSpecificDetails.axleLoadLimit")} placeholder="e.g. 15 T / Axle" />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                        <input type="checkbox" className="h-4 w-4 text-[var(--fr8x-periwinkle)] rounded" {...register("modeSpecificDetails.specialPermitsRequired")} />
                        <span className="font-medium">ODC Transit Permit Required</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}

              {selectedMode === "multimodal" && (
                <div className="fr8x-card p-5 space-y-4">
                  <h3 className="text-heading-lg text-foreground flex items-center gap-2">
                    <GitMerge className="h-4 w-4 text-rose-600" />
                    Multimodal Transport Chain Breakdown
                  </h3>
                  <div>
                    <label className="fr8x-label">Multimodal Transport Route Legs Description</label>
                    <textarea
                      className="fr8x-input mt-1 min-h-[60px]"
                      {...register("modeSpecificDetails.legsDescription")}
                      placeholder="Specify Leg 1 (Road), Leg 2 (Sea), Leg 3 (Rail), Leg 4 (Final Road Delivery)..."
                    />
                  </div>
                </div>
              )}

              {/* Handling & Loading Equipment Details */}
              <div className="fr8x-card p-5 space-y-4">
                <h3 className="text-heading-lg text-foreground flex items-center gap-2">
                  <Factory className="h-4 w-4 text-[var(--fr8x-jet)]" />
                  Handling & Loading Equipment Details
                </h3>
                <div>
                  <label className="fr8x-label">Loader / Special Equipment Needed (Optional)</label>
                  <input className="fr8x-input mt-1" {...register("modeSpecificDetails.loaderEquipmentRequired")} placeholder="e.g. 50T Mobile Crane, Heavy Forklift, Reach Stacker" />
                </div>
              </div>

              {/* Equipment & Unit Breakdown Table */}
              <div className="fr8x-card p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-heading-lg text-foreground">Cargo Units & Equipment Details</h2>
                  <button
                    type="button"
                    onClick={() =>
                      appendContainer({
                        id: String(containerFields.length + 1),
                        containerSize: selectedMode === "fcl" ? "40'HC" : `${selectedMode.toUpperCase()} Unit`,
                        numberOfContainers: 1,
                        hazStatus: "non_haz",
                        grossWeight: 10000,
                        remarks: "",
                      })
                    }
                    className="fr8x-btn-secondary text-body-sm flex items-center gap-1.5 px-3 py-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Equipment / Cargo Row
                  </button>
                </div>

                {containerFields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-heading-sm text-foreground font-semibold">
                        Unit Line #{index + 1} ({selectedMode.toUpperCase()})
                      </h3>
                      {containerFields.length > 1 && (
                        <button type="button" onClick={() => removeContainer(index)} className="text-danger hover:text-danger-dark">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <div>
                        <label className="fr8x-label">Equipment / Container Type</label>
                        {selectedMode === "fcl" ? (
                          <select className="fr8x-input mt-1" {...register(`containerDetails.${index}.containerSize`)}>
                            {FCL_EQUIPMENT_TYPES.map((eq) => (
                              <option key={eq.id} value={eq.label}>{eq.label}</option>
                            ))}
                          </select>
                        ) : (
                          <input className="fr8x-input mt-1" {...register(`containerDetails.${index}.containerSize`)} />
                        )}
                      </div>
                      <div>
                        <label className="fr8x-label">Number of Units</label>
                        <input type="number" min="1" className="fr8x-input mt-1" {...register(`containerDetails.${index}.numberOfContainers`, { valueAsNumber: true })} />
                      </div>
                      <div>
                        <label className="fr8x-label">Haz / Non-Haz</label>
                        <select className="fr8x-input mt-1" {...register(`containerDetails.${index}.hazStatus`)}>
                          <option value="non_haz">Non-Haz (General)</option>
                          <option value="haz">Hazardous (DG)</option>
                        </select>
                      </div>
                      <div>
                        <label className="fr8x-label">Gross Weight per Unit (KG)</label>
                        <input type="number" className="fr8x-input mt-1" {...register(`containerDetails.${index}.grossWeight`, { valueAsNumber: true })} />
                      </div>
                    </div>

                    {/* Conditional Dimensions for Special/OOG Equipment */}
                    {(
                      watch(`containerDetails.${index}.containerSize`)?.includes("FR") ||
                      watch(`containerDetails.${index}.containerSize`)?.includes("FB") ||
                      watch(`containerDetails.${index}.containerSize`)?.includes("OT") ||
                      watch(`containerDetails.${index}.containerSize`)?.includes("SPEC")
                    ) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-blue-50 rounded border border-blue-200">
                        <div className="col-span-1 md:col-span-2 flex items-center gap-1.5 text-blue-800 font-semibold text-[11px]">
                          <Info className="h-4 w-4" /> Oversized Cargo Dimensions (L x W x H)
                        </div>
                        <div className="col-span-1 md:col-span-2">
                          <input className="fr8x-input mt-1" {...register(`containerDetails.${index}.dimensions`)} placeholder="e.g. 10m x 2.4m x 3.1m" />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="fr8x-label">Unit Remarks / Cargo Description</label>
                        <input className="fr8x-input mt-1" {...register(`containerDetails.${index}.remarks`)} placeholder="e.g. Needs tarpaulin cover, Fragile top" />
                      </div>
                    </div>

                    {/* Conditional Hazardous Goods Block */}
                    {watch(`containerDetails.${index}.hazStatus`) === "haz" && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-warning-light rounded border border-warning/30">
                        <div className="col-span-4 flex items-center gap-1.5 text-warning-dark font-semibold text-[11px]">
                          <ShieldAlert className="h-4 w-4" /> Hazardous Goods (IMO/IATA/ADR) Specifications
                        </div>
                        <div>
                          <label className="fr8x-label">Haz Class *</label>
                          <input className="fr8x-input mt-1" {...register(`containerDetails.${index}.hazClass`)} placeholder="e.g. Class 3 Flammable" />
                        </div>
                        <div>
                          <label className="fr8x-label">UN Number *</label>
                          <input className="fr8x-input mt-1" {...register(`containerDetails.${index}.unNumber`)} placeholder="e.g. UN 1993" />
                        </div>
                        <div>
                          <label className="fr8x-label">Flash Point (°C)</label>
                          <input className="fr8x-input mt-1" {...register(`containerDetails.${index}.flashPoint`)} placeholder="e.g. 23°C" />
                        </div>
                        <div>
                          <label className="fr8x-label">Packing Group</label>
                          <input className="fr8x-input mt-1" {...register(`containerDetails.${index}.packingGroup`)} placeholder="e.g. PG II" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* Commodity Descriptions */}
              <div className="fr8x-card p-5 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-heading-lg text-foreground">Commodity & HS Code Description</h2>
                  <button
                    type="button"
                    onClick={() => appendCommodity({ id: String(commodityFields.length + 1), description: "", grossWeight: 10000 })}
                    className="fr8x-btn-secondary text-body-sm flex items-center gap-1.5 px-3 py-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Commodity
                  </button>
                </div>

                {commodityFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-border rounded-lg">
                    <div>
                      <label className="fr8x-label">Commodity Description</label>
                      <input className="fr8x-input mt-1" {...register(`commodityDetails.${index}.description`)} />
                    </div>
                    <div>
                      <label className="fr8x-label">HS Code (Optional)</label>
                      <input className="fr8x-input mt-1" {...register(`commodityDetails.${index}.hsCode`)} placeholder="e.g. 8471.30" />
                    </div>
                    <div>
                      <label className="fr8x-label">Total Gross Weight (KG)</label>
                      <input type="number" className="fr8x-input mt-1" {...register(`commodityDetails.${index}.grossWeight`, { valueAsNumber: true })} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* STEP 3: BID RULES & SOURCING STRATEGY */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fr8x-card p-5 space-y-6"
            >
              <h2 className="text-heading-lg text-foreground">Procurement Strategy, Bidding Rules & Visibility</h2>

              {/* Auction Strategy Type Selection */}
              <div className="space-y-3 p-4 bg-gray-50 rounded border border-border">
                <h3 className="text-heading-sm text-foreground font-semibold flex items-center gap-2">
                  <Gavel className="h-4 w-4 text-[var(--fr8x-periwinkle)]" />
                  1. Select Auction Strategy Type
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className={cn(
                    "flex flex-col p-3 rounded border cursor-pointer transition-all",
                    (watch("auctionType" as any) || "general") === "general"
                      ? "border-[var(--fr8x-periwinkle)] bg-[var(--fr8x-mist)] ring-1 ring-[var(--fr8x-periwinkle)]"
                      : "border-border bg-white"
                  )}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="general"
                        checked={(watch("auctionType" as any) || "general") === "general"}
                        onChange={() => setValue("auctionType" as any, "general")}
                        className="h-4 w-4 text-[var(--fr8x-periwinkle)]"
                      />
                      <span className="font-bold text-[12px] text-[var(--fr8x-jet)]">General Reverse Auction</span>
                    </div>
                    <p className="text-[10px] text-foreground-secondary mt-1 pl-6">
                      Visible to all eligible registered suppliers meeting participation criteria. Open bidding without prior invitation.
                    </p>
                  </label>

                  <label className={cn(
                    "flex flex-col p-3 rounded border cursor-pointer transition-all",
                    watch("auctionType" as any) === "premium"
                      ? "border-[var(--fr8x-periwinkle)] bg-[var(--fr8x-mist)] ring-1 ring-[var(--fr8x-periwinkle)]"
                      : "border-border bg-white"
                  )}>
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        value="premium"
                        checked={watch("auctionType" as any) === "premium"}
                        onChange={() => setValue("auctionType" as any, "premium")}
                        className="h-4 w-4 text-[var(--fr8x-periwinkle)]"
                      />
                      <span className="font-bold text-[12px] text-[var(--fr8x-jet)]">Premium / Selective Reverse Auction</span>
                    </div>
                    <p className="text-[10px] text-foreground-secondary mt-1 pl-6">
                      Visible exclusively to suppliers explicitly selected by the buyer. Automatic professional email notifications sent on publication.
                    </p>
                  </label>
                </div>
              </div>

              {/* Selective Filters (for Premium / Selective Auction) */}
              {watch("auctionType" as any) === "premium" && (
                <div className="space-y-3 p-4 bg-blue-50/50 border border-blue-200 rounded">
                  <h3 className="text-heading-sm text-blue-900 font-semibold flex items-center gap-2">
                    <Info className="h-4 w-4 text-blue-600" />
                    Targeted Supplier Selection Filters
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="fr8x-label">Country / Region Filter</label>
                      <input className="fr8x-input mt-1" {...register("selectiveFilters.countries" as any)} placeholder="e.g. India, Germany, UAE" />
                    </div>
                    <div>
                      <label className="fr8x-label">Supplier Vertical Role</label>
                      <select className="fr8x-input mt-1" {...register("selectiveFilters.supplierRoles" as any)}>
                        <option value="">All Supplier Roles</option>
                        <option value="freight_forwarder">Freight Forwarder</option>
                        <option value="mlo">Shipping Line / MLO</option>
                        <option value="airline">Airline Cargo</option>
                        <option value="cha">CHA / Customs Broker</option>
                        <option value="transporter">Transporter / Fleet</option>
                        <option value="warehouse">Warehouse Operator</option>
                      </select>
                    </div>
                    <div>
                      <label className="fr8x-label">Min Supplier Performance Rating</label>
                      <select className="fr8x-input mt-1" {...register("selectiveFilters.minPerformanceRating" as any)}>
                        <option value="0">All Rated Suppliers</option>
                        <option value="4">4.0+ Stars (Top Performers)</option>
                        <option value="4.5">4.5+ Stars (Tier 1 Preferred)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-blue-950 font-medium">
                      <input type="checkbox" className="h-4 w-4 rounded text-[var(--fr8x-periwinkle)]" {...register("selectiveFilters.preferredVendorListOnly" as any)} />
                      <span>Limit to Preferred Vendor List (PVL)</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer text-[11px] text-blue-950 font-medium">
                      <input type="checkbox" className="h-4 w-4 rounded text-[var(--fr8x-periwinkle)]" {...register("selectiveFilters.previousBusinessRelationshipOnly" as any)} />
                      <span>Require Prior Business Relationship</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Economic & Strategic Procurement Scoring Weights */}
              <div className="space-y-3 p-4 bg-gray-50 rounded border border-border">
                <h3 className="text-heading-sm text-foreground font-semibold">
                  Total Cost of Ownership (TCO) & Strategic Scoring Model
                </h3>
                <p className="text-[10px] text-foreground-secondary">
                  Configure evaluation weights to balance commercial quote price against supplier performance, reliability, and service quality.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div>
                    <label className="fr8x-label">Commercial Price %</label>
                    <input type="number" min="0" max="100" defaultValue="60" className="fr8x-input mt-1 font-bold" {...register("scoringWeights.priceWeight" as any, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="fr8x-label">Performance Rating %</label>
                    <input type="number" min="0" max="100" defaultValue="15" className="fr8x-input mt-1" {...register("scoringWeights.performanceWeight" as any, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="fr8x-label">On-Time Delivery %</label>
                    <input type="number" min="0" max="100" defaultValue="10" className="fr8x-input mt-1" {...register("scoringWeights.onTimeWeight" as any, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="fr8x-label">Space Availability %</label>
                    <input type="number" min="0" max="100" defaultValue="10" className="fr8x-input mt-1" {...register("scoringWeights.spaceAvailabilityWeight" as any, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label className="fr8x-label">Doc Accuracy %</label>
                    <input type="number" min="0" max="100" defaultValue="5" className="fr8x-input mt-1" {...register("scoringWeights.docAccuracyWeight" as any, { valueAsNumber: true })} />
                  </div>
                </div>
              </div>

              {/* Standard Rules */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div>
                  <label className="fr8x-label">Max Bid Submissions per Carrier</label>
                  <input type="number" min="1" max="10" className="fr8x-input mt-1" {...register("bidRules.maxSubmissions", { valueAsNumber: true })} />
                  <p className="mt-1 text-caption text-foreground-muted">Default: 5 submissions maximum per bidder</p>
                </div>
                <div>
                  <label className="fr8x-label">Default Auction Currency</label>
                  <select className="fr8x-input mt-1" {...register("bidRules.defaultCurrency")}>
                    {CURRENCY_LIST.map((code) => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="fr8x-label">Ranking Criteria Algorithm</label>
                  <select className="fr8x-input mt-1" {...register("bidRules.rankingRules.criteria")}>
                    <option value="lowest_total">Lowest Total Cost (Standard Reverse Auction)</option>
                    <option value="weighted">Strategic TCO Weighted Evaluation</option>
                    <option value="custom">Custom Evaluation Matrix</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-heading-sm text-foreground font-semibold">Participant Visibility Rules</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-[var(--fr8x-periwinkle)]" {...register("bidRules.visibilityRules.showRankToParticipant")} />
                  <span className="text-body-sm text-foreground">Show live rank (e.g. Rank #1 out of 5) to participant</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-[var(--fr8x-periwinkle)]" {...register("bidRules.visibilityRules.showTotalParticipants")} />
                  <span className="text-body-sm text-foreground">Show total number of participating bidders</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-[var(--fr8x-periwinkle)]" {...register("bidRules.visibilityRules.showParticipantNames")} />
                  <span className="text-body-sm text-foreground">Show participant company names (Public Bidding)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-[var(--fr8x-periwinkle)]" {...register("bidRules.visibilityRules.showBidAmounts")} />
                  <span className="text-body-sm text-foreground">Show public bid amounts to all participants</span>
                </label>
              </div>

              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-heading-sm text-foreground font-semibold">Invited Bidders & Exclusive Notifications</h3>
                <p className="text-body-sm text-foreground-secondary">
                  Select specific carrier organizations to receive direct invitation alerts.
                </p>
                <div>
                   <label className="fr8x-label">Select Registered Bidders</label>
                   <select multiple className="fr8x-input mt-1 min-h-[80px]" {...register("invitedBidders")}>
                     <option value="comp_1">Maersk Line</option>
                     <option value="comp_2">Hapag-Lloyd</option>
                     <option value="comp_3">Kuehne+Nagel</option>
                     <option value="comp_4">DHL Global Forwarding</option>
                     <option value="comp_5">DB Schenker</option>
                     <option value="comp_6">CMA CGM</option>
                     <option value="comp_7">MSC Mediterranean Shipping Company</option>
                     <option value="comp_8">ONE (Ocean Network Express)</option>
                   </select>
                   <p className="mt-1 text-caption text-foreground-muted">Hold Ctrl/Cmd to select multiple bidders.</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 4: CHARGES STRUCTURE */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fr8x-card p-5 space-y-5"
            >
              <h2 className="text-heading-lg text-foreground">Mandatory & Optional Charge Heads Structure</h2>
              <p className="text-body-sm text-foreground-secondary">
                Configured automatically based on selected Incoterm <strong>({selectedIncoterm})</strong> and Transport Mode <strong>({selectedMode.toUpperCase()})</strong>.
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-3 bg-gray-50 rounded border border-border">
                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-[var(--fr8x-periwinkle)]" {...register("chargesStructure.includeFreight")} />
                  <span className="font-semibold">Include Freight</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-[var(--fr8x-periwinkle)]" {...register("chargesStructure.includeLocalCharges")} />
                  <span className="font-semibold">Include Origin Charges</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-[var(--fr8x-periwinkle)]" {...register("chargesStructure.includeDestinationCharges")} />
                  <span className="font-semibold">Include Dest Charges</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-[var(--fr8x-periwinkle)]" {...register("chargesStructure.includeFreeTime")} />
                  <span className="font-semibold">Include Free Time</span>
                </label>
              </div>

              <div className="space-y-2">
                <h3 className="text-heading-sm text-foreground font-semibold">Charge Heads Configuration for {selectedIncoterm}:</h3>
                <div className="divide-y divide-border border border-border rounded overflow-hidden">
                  {incotermInfo.applicableChargeHeads.map((headName, i) => (
                    <div key={i} className="p-2.5 flex items-center justify-between bg-white hover:bg-[var(--fr8x-mist)] text-[11px]">
                      <label className="flex items-center gap-2 cursor-pointer font-medium text-[var(--fr8x-jet)]">
                        <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-border text-[var(--fr8x-periwinkle)]" />
                        {headName}
                      </label>
                      <span className="fr8x-badge bg-gray-100 text-gray-600 border border-gray-200">Required Head</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* STEP 5: REVIEW & SUBMIT */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fr8x-card p-5 space-y-5"
            >
              <h2 className="text-heading-lg text-foreground">Review Multi-Modal Auction Details</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-border bg-[var(--fr8x-mist)] rounded text-[11px]">
                <div>
                  <span className="text-foreground-secondary block">Transport Mode:</span>
                  <strong className="text-base text-[var(--fr8x-jet)] uppercase">{selectedMode}</strong>
                </div>
                <div>
                  <span className="text-foreground-secondary block">Incoterm:</span>
                  <strong className="text-base text-[var(--fr8x-jet)]">{selectedIncoterm}</strong>
                </div>
                <div>
                  <span className="text-foreground-secondary block">Route:</span>
                  <strong className="text-base text-[var(--fr8x-jet)]">{watch("shipmentDetails.origin")} → {watch("shipmentDetails.destination")}</strong>
                </div>
              </div>

              <div className="p-4 border border-warning/30 bg-warning-light rounded-lg text-[11px]">
                <p className="text-warning-dark font-medium">
                  ⚠️ Note: Once published, auction mode specifications and Incoterms responsibilities will be locked for all live bidding carriers.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step Navigation Controls */}
        <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="fr8x-btn-secondary px-5 py-2 flex items-center gap-2 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
              className="fr8x-btn-primary px-5 py-2 flex items-center gap-2"
            >
              Next Step
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="fr8x-btn-primary bg-[var(--fr8x-periwinkle)] px-8 py-2 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Publishing Auction...
                </>
              ) : (
                <>
                  <Gavel className="h-4 w-4" />
                  Publish Reverse Auction
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
