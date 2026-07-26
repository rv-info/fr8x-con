// FR8X-CON Supplier Governance & Performance Management Types

import type { AuditFields } from "./common";

export type GovernanceStatus = "active" | "warning" | "restricted" | "suspended";

export type SupplierServiceKPIs = {
  spaceAvailability: number; // 1-5 stars
  bookingConfirmation: number;
  onTimeEquipmentPlacement: number;
  documentationAccuracy: number;
  freightAccuracy: number;
  cargoHandling: number;
  communication: number;
  responsiveness: number;
  scheduleReliability: number;
  operationalPerformance: number;
  overallServiceQuality: number;
};

export type SupplierServiceRating = {
  id: string;
  supplierId: string;
  supplierName: string;
  supplierCompany: string;
  buyerId: string;
  buyerName: string;
  buyerCompany: string;
  auctionId?: string;
  awardId?: string;
  shipmentRef?: string;
  kpis: SupplierServiceKPIs;
  averageScore: number;
  feedback?: string;
  isPoorPerformanceRecord: boolean; // averageScore < 3.0 or any KPI <= 2
  createdAt: string;
};

export type SupplierGovernanceProfile = {
  supplierId: string;
  supplierName: string;
  supplierCompany: string;
  supplierRole: string; // forwarder, mlo, cha, transporter, etc.
  country?: string;
  region?: string;
  overallRating: number; // e.g., 4.2 out of 5
  totalEvaluations: number;
  warningsCount: number;
  poorPerformanceRecords: number; // 1, 2, or 3
  status: GovernanceStatus;
  restrictionReason?: string;
  reviewNotes?: string;
  isRestoredByGodMode?: boolean;
  restoredAt?: string;
  restoredBy?: string;
  onTimeDeliveryPct: number;
  spaceAvailabilityPct: number;
  documentationAccuracyPct: number;
  cargoClaimRatioPct: number;
  cancellationRatioPct: number;
  averageResponseTimeHours: number;
} & AuditFields;

export const KPI_LABELS: Record<keyof SupplierServiceKPIs, string> = {
  spaceAvailability: "Space Availability",
  bookingConfirmation: "Booking Confirmation Speed",
  onTimeEquipmentPlacement: "On-Time Equipment Placement",
  documentationAccuracy: "Documentation Accuracy (B/L, Invoices)",
  freightAccuracy: "Freight & Surcharge Billing Accuracy",
  cargoHandling: "Cargo Handling & Zero Damage",
  communication: "Communication & Proactive Updates",
  responsiveness: "Responsiveness to Inquiries",
  scheduleReliability: "Schedule Reliability & Transit Time",
  operationalPerformance: "Operational Execution & Exception Handling",
  overallServiceQuality: "Overall Service Quality & Value",
};
