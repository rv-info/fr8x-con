import { PlanTier, UserRole, FeedPost, Auction, RateItem, JobPost, NexusTopic, CompanyReview, BlacklistCase, PostReport } from '@/lib/types';

export type GodfatherRole =
  | 'godfather_owner'
  | 'godfather_operations'
  | 'godfather_moderator'
  | 'godfather_finance'
  | 'godfather_compliance'
  | 'godfather_support';

export interface GodfatherOperator {
  uid: string;
  email: string;
  displayName: string;
  role: GodfatherRole;
  roleTitle: string;
  avatarUrl?: string;
  mfaEnabled: boolean;
  mfaVerified: boolean;
  lastStepUpAt?: string;
  lastLoginAt: string;
  ipAddress?: string;
  location?: string;
  activeSessionExpiry: string;
}

export type BlockScope =
  | 'login'
  | 'feed_post'
  | 'chat'
  | 'nexus'
  | 'auction_bid'
  | 'auction_create'
  | 'rate_pub'
  | 'job_pub';

export interface BlockAction {
  blockId: string;
  subjectType: 'user' | 'company';
  subjectId: string;
  subjectName: string;
  subjectEmail?: string;
  scopes: BlockScope[];
  reasonCode: 'fraud_risk' | 'abuse' | 'policy_violation' | 'non_payment' | 'document_issue' | 'sanctions' | 'spam' | 'impersonation' | 'other';
  reasonText: string;
  evidenceRefs: string[];
  status: 'active' | 'lifted' | 'expired';
  expiresAt?: string;
  createdBy: string;
  createdByName: string;
  createdAt: string;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: string;
}

export interface AdminAction {
  actionId: string;
  actorUid: string;
  actorEmail: string;
  actorName: string;
  actorRole: GodfatherRole;
  targetType:
    | 'user'
    | 'company'
    | 'auction'
    | 'bid'
    | 'rate'
    | 'rate_import'
    | 'job'
    | 'post'
    | 'comment'
    | 'nexus_topic'
    | 'review'
    | 'blacklist'
    | 'plan'
    | 'payment_config'
    | 'fee'
    | 'template'
    | 'config'
    | 'role'
    | 'report'
    | 'case';
  targetId: string;
  targetLabel?: string;
  actionType: string;
  beforeSnapshot?: any;
  afterSnapshot?: any;
  reason: string;
  correlationId: string;
  createdAt: string;
  ipHash?: string;
  deviceInfo?: string;
  stepUpVerified?: boolean;
}

export interface AdminCase {
  caseId: string;
  title: string;
  type: 'compliance' | 'moderation' | 'kyc_dispute' | 'payment_dispute' | 'fraud_alert' | 'support_escalation';
  subjectType: 'user' | 'company' | 'auction' | 'payment';
  subjectId: string;
  subjectLabel: string;
  status: 'open' | 'investigating' | 'escalated' | 'resolved' | 'dismissed';
  severity: 'low' | 'medium' | 'high' | 'critical';
  assignedToUid: string;
  assignedToName: string;
  notes: {
    id: string;
    authorName: string;
    authorRole: GodfatherRole;
    text: string;
    createdAt: string;
  }[];
  evidenceRefs: {
    name: string;
    url: string;
    type: string;
    uploadedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
  resolutionSummary?: string;
}

export interface PlanVersion {
  planVersionId: string;
  plan: PlanTier;
  planName: string;
  version: number;
  countryScope: 'India' | 'International' | 'Global';
  currency: 'INR' | 'USD';
  monthlyPrice: number;
  taxPolicy: 'inclusive_gst' | 'exclusive_gst' | 'inclusive_tax' | 'exclusive_tax';
  effectiveFrom: string;
  effectiveTo?: string;
  active: boolean;
  featureFlags: {
    goldVerification: boolean;
    unlimitedSearches: boolean;
    unlimitedChat: boolean;
    directCarrierTenders: boolean;
    marketAnalytics: boolean;
    apiAccess: boolean;
  };
  limits: {
    monthlyAuctions: number;
    monthlyBids: number;
    subAccounts: number;
    rateInventoryMax: number;
  };
  bidFee: number;
  bidDiscountPercent: number;
  trialDurationDays?: number;
  trialEligibility: string;
  legacyGrandfatheringPolicy: 'maintain_original_price' | 'notify_and_upgrade_in_90_days' | 'auto_migrate';
  notes?: string;
  createdBy: string;
  createdAt: string;
}

export interface PaymentConfig {
  configId: string;
  provider: 'Razorpay' | 'Cashfree' | 'Stripe_India' | 'Stripe_Global';
  environment: 'production' | 'sandbox' | 'staging';
  countryScope: 'India' | 'International' | 'Global';
  currencies: string[];
  enabled: boolean;
  publicConfigRef: string; // e.g. rzp_live_xxxxxxxx
  secretRefOnly: string; // Masked e.g. "•••••••••••••••• (Stored in KMS / Vault)"
  webhookStatus: 'healthy' | 'degraded' | 'failing' | 'disabled';
  lastValidatedAt: string;
  status: 'active' | 'pending_approval' | 'deprecated';
  updatedBy: string;
  updatedAt: string;
  pendingChangeRequest?: {
    requestId: string;
    requestedBy: string;
    requestedAt: string;
    changeDetails: string;
    approvalStatus: 'pending_second_approver' | 'approved' | 'rejected';
    approvedBy?: string;
  };
}

export interface CompanyVerificationItem {
  companyId: string;
  legalName: string;
  tradeName?: string;
  country: string;
  city: string;
  gstn?: string;
  pan?: string;
  iec?: string;
  mto?: string;
  status: 'pending' | 'verified' | 'rejected' | 'suspended' | 'additional_info_required';
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  adminNotes: string[];
  documents: {
    docId: string;
    type: 'GST_CERTIFICATE' | 'PAN_CARD' | 'IEC_LICENSE' | 'MTO_REGISTRATION' | 'INCORPORATION_CERT' | 'BANK_STATEMENT';
    name: string;
    fileUrl: string;
    verified: boolean;
    uploadedAt: string;
  }[];
  primaryContactName: string;
  primaryContactEmail: string;
  primaryContactPhone: string;
}

export interface RateImportBatch {
  importId: string;
  batchCode: string;
  filename: string;
  uploaderUid: string;
  uploaderName: string;
  uploaderCompany: string;
  uploadedAt: string;
  status: 'Uploaded' | 'Validating' | 'Needs Review' | 'Approved' | 'Finalized' | 'Failed';
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  validationReport: {
    rowNumber: number;
    errorType: 'MISSING_POR' | 'INVALID_DATE' | 'CURRENCY_MISMATCH' | 'DUPLICATE_ID' | 'OUT_OF_BOUND_RATE';
    field: string;
    message: string;
  }[];
  sampleRows: any[];
  approvedBy?: string;
  approvedAt?: string;
  finalizedBy?: string;
  finalizedAt?: string;
}

export interface NotificationTemplate {
  templateId: string;
  code: string;
  name: string;
  category: 'auctions' | 'bids' | 'payments' | 'subscriptions' | 'verifications' | 'moderation' | 'security';
  subject: string;
  bodyTemplate: string;
  variables: string[];
  version: number;
  isLocalized: boolean;
  locales: string[];
  isPublished: boolean;
  updatedAt: string;
  updatedBy: string;
}

export interface InvoiceRecord {
  invoiceId: string;
  invoiceNumber: string;
  userUid: string;
  userName: string;
  userEmail: string;
  companyName: string;
  companyGstn?: string;
  companyAddress?: string;
  date: string;
  dueDate: string;
  planTier: PlanTier;
  amountSubtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalTax: number;
  amountTotal: number;
  currency: 'INR' | 'USD';
  status: 'paid' | 'pending' | 'failed' | 'refunded' | 'adjusted';
  paymentProvider: 'Razorpay' | 'Stripe' | 'Bank_Wire';
  paymentRef: string;
  refundRef?: string;
  refundReason?: string;
  sacCode: string;
}

export interface CustomerDossier {
  user: any;
  company?: any;
  verification?: CompanyVerificationItem;
  blockStatus?: BlockAction;
  activePlan: PlanVersion;
  invoices: InvoiceRecord[];
  auctionsCreated: Auction[];
  bidsSubmitted: any[];
  ratesPosted: RateItem[];
  jobsPosted: JobPost[];
  postsCount: number;
  reportsReceived: PostReport[];
  reportsFiled: PostReport[];
  activeCases: AdminCase[];
  riskScore: number; // 0 - 100
  riskFactors: string[];
}

export interface GlobalSearchResult {
  id: string;
  title: string;
  subtitle: string;
  type:
    | 'user'
    | 'company'
    | 'auction'
    | 'bid'
    | 'rate'
    | 'job'
    | 'post'
    | 'nexus_topic'
    | 'review'
    | 'blacklist'
    | 'invoice'
    | 'case'
    | 'report';
  category: 'Operations' | 'Trust & Safety' | 'Commerce' | 'Platform' | 'Support';
  status?: string;
  statusBadgeVariant?: 'green' | 'blue' | 'amber' | 'red' | 'gold' | 'gray';
  createdAt?: string;
  detailsUrl: string;
  metadata?: Record<string, any>;
  rawObject: any;
}
