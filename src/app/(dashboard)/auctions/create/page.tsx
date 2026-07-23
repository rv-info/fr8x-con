// FR8X-CON Auction Create Page - Multi-step form

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { motion, AnimatePresence } from "framer-motion";
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
} from "lucide-react";

import { auctionCreateSchema, type AuctionCreateFormData } from "@/lib/validators/auction";
import { ROUTES, CONTAINER_SIZES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { FREIGHT_CURRENCIES as CURRENCY_LIST } from "@/lib/types/currency";

const STEPS = [
  { id: 1, title: "Shipment Details", icon: Ship },
  { id: 2, title: "Container & Commodity", icon: Package },
  { id: 3, title: "Bid Rules", icon: Gavel },
  { id: 4, title: "Charges Structure", icon: DollarSign },
  { id: 5, title: "Review & Submit", icon: CheckCircle },
];

export default function AuctionCreatePage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, control, handleSubmit, watch } = useForm<AuctionCreateFormData>({
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
      },
      containerDetails: [
        {
          id: "1",
          containerSize: "20ft",
          numberOfContainers: 1,
          hazStatus: "non_haz",
          grossWeight: 0,
        },
      ],
      commodityDetails: [
        {
          id: "1",
          description: "",
          grossWeight: 0,
        },
      ],
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
        chargesHeads: [],
      },
      startDate: "",
      endDate: "",
    },
  });

  const {
    fields: containerFields,
    append: appendContainer,
    remove: removeContainer,
  } = useFieldArray({ control, name: "containerDetails" });

  const {
    fields: commodityFields,
    append: appendCommodity,
  } = useFieldArray({ control, name: "commodityDetails" });

  const onSubmit = async (data: AuctionCreateFormData) => {
    setIsSubmitting(true);
    try {
      console.log("Auction data:", data);
      router.push(ROUTES.AUCTIONS);
    } catch (error) {
      console.error("Failed to create auction:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-full px-4 lg:px-8 space-y-8">
      {/* Back button */}
      <button
        onClick={() => router.push(ROUTES.AUCTIONS)}
        className="flex items-center gap-1 text-body-sm text-foreground-secondary hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Back to Auctions
      </button>

      {/* Title */}
      <div>
        <h1 className="text-display-sm text-foreground">Create Auction</h1>
        <p className="mt-1 text-body-md text-foreground-secondary">
          Post a new reverse auction for competitive freight bidding
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-2">
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
                  "flex items-center gap-2 px-3 py-2 rounded-lg text-body-sm font-medium transition-all whitespace-nowrap",
                  isActive
                    ? "bg-brand-50 text-brand-700 ring-1 ring-brand-200"
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
          {/* Step 1: Shipment Details */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fr8x-card p-6 space-y-5"
            >
              <h2 className="text-heading-lg text-foreground">Shipment Details</h2>

              <div>
                <label className="fr8x-label">Auction Title</label>
                <input className="fr8x-input mt-1.5" {...register("title")} placeholder="e.g., FCL Nhava Sheva to Rotterdam" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="fr8x-label">Origin</label>
                  <input className="fr8x-input mt-1.5" {...register("shipmentDetails.origin")} placeholder="City, Country" />
                </div>
                <div>
                  <label className="fr8x-label">Destination</label>
                  <input className="fr8x-input mt-1.5" {...register("shipmentDetails.destination")} placeholder="City, Country" />
                </div>
                <div>
                  <label className="fr8x-label">Origin Port</label>
                  <input className="fr8x-input mt-1.5" {...register("shipmentDetails.originPort")} placeholder="Port code" />
                </div>
                <div>
                  <label className="fr8x-label">Destination Port</label>
                  <input className="fr8x-input mt-1.5" {...register("shipmentDetails.destinationPort")} placeholder="Port code" />
                </div>
                <div>
                  <label className="fr8x-label">Shipment Mode</label>
                  <select className="fr8x-input mt-1.5" {...register("shipmentDetails.mode")}>
                    <option value="fcl">FCL</option>
                    <option value="lcl">LCL</option>
                    <option value="air">Air</option>
                    <option value="road">Road</option>
                    <option value="multimodal">Multimodal</option>
                  </select>
                </div>
                <div>
                  <label className="fr8x-label">Incoterms</label>
                  <select className="fr8x-input mt-1.5" {...register("shipmentDetails.incoTerms")}>
                    {["FOB", "CIF", "CFR", "EXW", "DDP", "DAP", "FCA", "CPT", "CIP"].map((term) => (
                      <option key={term} value={term}>{term}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="fr8x-label">Cargo Ready Date</label>
                  <input type="date" className="fr8x-input mt-1.5" {...register("shipmentDetails.cargoReadyDate")} />
                </div>
                <div>
                  <label className="fr8x-label">Required Delivery Date</label>
                  <input type="date" className="fr8x-input mt-1.5" {...register("shipmentDetails.requiredDeliveryDate")} />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="fr8x-label">Auction Start Date</label>
                  <input type="date" className="fr8x-input mt-1.5" {...register("startDate")} />
                </div>
                <div>
                  <label className="fr8x-label">Auction End Date</label>
                  <input type="date" className="fr8x-input mt-1.5" {...register("endDate")} />
                </div>
              </div>
            </motion.div>
          )}

          {/* Step 2: Container & Commodity Details */}
          {currentStep === 2 && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Container details */}
              <div className="fr8x-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-heading-lg text-foreground">Container Details</h2>
                  <button
                    type="button"
                    onClick={() => appendContainer({
                      id: String(containerFields.length + 1),
                      containerSize: "20ft",
                      numberOfContainers: 1,
                      hazStatus: "non_haz",
                      grossWeight: 0,
                    })}
                    className="fr8x-btn-secondary text-body-sm flex items-center gap-1.5 px-3 py-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Container
                  </button>
                </div>

                {containerFields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-border rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-heading-sm text-foreground">Container {index + 1}</h3>
                      {containerFields.length > 1 && (
                        <button type="button" onClick={() => removeContainer(index)} className="text-danger hover:text-danger-dark">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="fr8x-label">Container Size</label>
                        <select className="fr8x-input mt-1.5" {...register(`containerDetails.${index}.containerSize`)}>
                          {CONTAINER_SIZES.map((size) => (
                            <option key={size.value} value={size.value}>{size.label}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="fr8x-label">Number of Containers</label>
                        <input type="number" min="1" className="fr8x-input mt-1.5" {...register(`containerDetails.${index}.numberOfContainers`, { valueAsNumber: true })} />
                      </div>
                      <div>
                        <label className="fr8x-label">Haz / Non-Haz</label>
                        <select className="fr8x-input mt-1.5" {...register(`containerDetails.${index}.hazStatus`)}>
                          <option value="non_haz">Non-Haz</option>
                          <option value="haz">Haz</option>
                        </select>
                      </div>
                    </div>

                    {/* Conditional haz fields */}
                    {watch(`containerDetails.${index}.hazStatus`) === "haz" && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-3 bg-warning-light rounded-md">
                        <div>
                          <label className="fr8x-label">Class</label>
                          <input className="fr8x-input mt-1.5" {...register(`containerDetails.${index}.hazClass`)} />
                        </div>
                        <div>
                          <label className="fr8x-label">UN Number</label>
                          <input className="fr8x-input mt-1.5" {...register(`containerDetails.${index}.unNumber`)} />
                        </div>
                        <div>
                          <label className="fr8x-label">Flash Point</label>
                          <input className="fr8x-input mt-1.5" {...register(`containerDetails.${index}.flashPoint`)} />
                        </div>
                        <div>
                          <label className="fr8x-label">Packing Group</label>
                          <input className="fr8x-input mt-1.5" {...register(`containerDetails.${index}.packingGroup`)} />
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="fr8x-label">Gross Weight (KG)</label>
                        <input type="number" className="fr8x-input mt-1.5" {...register(`containerDetails.${index}.grossWeight`, { valueAsNumber: true })} />
                      </div>
                      <div>
                        <label className="fr8x-label">Remarks</label>
                        <input className="fr8x-input mt-1.5" {...register(`containerDetails.${index}.remarks`)} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Commodity details */}
              <div className="fr8x-card p-6 space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-heading-lg text-foreground">Commodity Details</h2>
                  <button
                    type="button"
                    onClick={() => appendCommodity({
                      id: String(commodityFields.length + 1),
                      description: "",
                      grossWeight: 0,
                    })}
                    className="fr8x-btn-secondary text-body-sm flex items-center gap-1.5 px-3 py-1.5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Commodity
                  </button>
                </div>

                {commodityFields.map((field, index) => (
                  <div key={field.id} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border border-border rounded-lg">
                    <div className="md:col-span-2">
                      <label className="fr8x-label">Commodity Description</label>
                      <input className="fr8x-input mt-1.5" {...register(`commodityDetails.${index}.description`)} />
                    </div>
                    <div>
                      <label className="fr8x-label">Gross Weight (KG)</label>
                      <input type="number" className="fr8x-input mt-1.5" {...register(`commodityDetails.${index}.grossWeight`, { valueAsNumber: true })} />
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 3: Bid Rules */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fr8x-card p-6 space-y-5"
            >
              <h2 className="text-heading-lg text-foreground">Bid Rules</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="fr8x-label">Max Bid Submissions</label>
                  <input type="number" min="1" max="10" className="fr8x-input mt-1.5" {...register("bidRules.maxSubmissions", { valueAsNumber: true })} />
                  <p className="mt-1 text-caption text-foreground-muted">Default: 5 submissions per participant</p>
                </div>
                <div>
                  <label className="fr8x-label">Default Currency</label>
                  <select className="fr8x-input mt-1.5" {...register("bidRules.defaultCurrency")}>
                    {CURRENCY_LIST.map((code) => (
                      <option key={code} value={code}>{code}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="fr8x-label">Ranking Criteria</label>
                  <select className="fr8x-input mt-1.5" {...register("bidRules.rankingRules.criteria")}>
                    <option value="lowest_total">Lowest Total</option>
                    <option value="weighted">Weighted</option>
                    <option value="custom">Custom</option>
                  </select>
                </div>
              </div>

              {/* Visibility rules */}
              <div className="space-y-3 pt-4 border-t border-border">
                <h3 className="text-heading-sm text-foreground">Visibility Rules</h3>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-brand-500" {...register("bidRules.visibilityRules.showRankToParticipant")} />
                  <span className="text-body-sm text-foreground">Show rank to participant</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-brand-500" {...register("bidRules.visibilityRules.showTotalParticipants")} />
                  <span className="text-body-sm text-foreground">Show total participants count</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-brand-500" {...register("bidRules.visibilityRules.showParticipantNames")} />
                  <span className="text-body-sm text-foreground">Show participant names (not recommended)</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-brand-500" {...register("bidRules.visibilityRules.showBidAmounts")} />
                  <span className="text-body-sm text-foreground">Show bid amounts publicly</span>
                </label>
              </div>
            </motion.div>
          )}

          {/* Step 4: Charges Structure */}
          {currentStep === 4 && (
            <motion.div
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fr8x-card p-6 space-y-5"
            >
              <h2 className="text-heading-lg text-foreground">Charges Structure</h2>
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-brand-500" {...register("chargesStructure.includeFreight")} />
                  <span className="text-body-sm text-foreground">Include Freight</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-brand-500" {...register("chargesStructure.includeLocalCharges")} />
                  <span className="text-body-sm text-foreground">Include Local Charges</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-brand-500" {...register("chargesStructure.includeDestinationCharges")} />
                  <span className="text-body-sm text-foreground">Include Destination Charges</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="h-4 w-4 rounded border-border text-brand-500" {...register("chargesStructure.includeFreeTime")} />
                  <span className="text-body-sm text-foreground">Include Free Time</span>
                </label>
              </div>
            </motion.div>
          )}

          {/* Step 5: Review */}
          {currentStep === 5 && (
            <motion.div
              key="step5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="fr8x-card p-6 space-y-5"
            >
              <h2 className="text-heading-lg text-foreground">Review & Submit</h2>
              <p className="text-body-md text-foreground-secondary">
                Review your auction details before posting. Once submitted, shipment and container details will be locked.
              </p>
              <div className="p-4 border border-warning/30 bg-warning-light rounded-lg">
                <p className="text-body-sm text-warning-dark font-medium">
                  ⚠️ After submission, posted data will be locked and cannot be edited.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Step navigation */}
        <div className="flex items-center justify-between mt-6">
          <button
            type="button"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="fr8x-btn-secondary px-5 py-2.5 flex items-center gap-2 disabled:opacity-40"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          {currentStep < 5 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(Math.min(5, currentStep + 1))}
              className="fr8x-btn-primary px-5 py-2.5 flex items-center gap-2"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={isSubmitting}
              className="fr8x-btn-primary px-8 py-2.5 flex items-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Posting...
                </>
              ) : (
                <>
                  <Gavel className="h-4 w-4" />
                  Post Auction
                </>
              )}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
