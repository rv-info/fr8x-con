export type PlanTier = 'trial' | 'professional' | 'premium';

export type UserRole = 'user' | 'company_admin' | 'moderator' | 'super_admin';

export type PostType =
  | 'general'
  | 'job'
  | 'business_update'
  | 'rate_info'
  | 'auction_ref'
  | 'logistics_discussion'
  | 'announcement';

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface TermsAcceptance {
  termsVersion: string;
  privacyVersion: string;
  acceptedAt: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface ProfileExperience {
  id: string;
  company: string;
  designation: string;
  employmentType: 'Full-time' | 'Part-time' | 'Contract' | 'Freelance' | 'Internship';
  location: string;
  startDate: string;
  endDate?: string;
  isCurrent: boolean;
  description: string;
  skills: string;
  visibility: 'public' | 'network' | 'private';
}

export interface ProfileEducation {
  id: string;
  institution: string;
  qualification: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  grade?: string;
  description?: string;
  visibility: 'public' | 'network' | 'private';
}

export interface ProfileCertification {
  id: string;
  title: string;
  issuingAuthority: string;
  certificateNumber: string;
  issueDate: string;
  expiryDate?: string;
  verificationStatus: 'verified' | 'pending';
  credentialUrl?: string;
  visibility: 'public' | 'network' | 'private';
}

export interface UserProfile {
  uid: string;
  email: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  displayName: string;
  designation: string;
  company: string;
  companyId: string;
  city: string;
  state: string;
  country: string;
  formattedAddress?: string;
  coordinates?: Coordinates;
  mobile: string;
  alternateMobile?: string;
  timezone: string; // IANA string e.g. "Asia/Kolkata", "Europe/Rotterdam", "America/New_York"
  preferredContactMethod: 'email' | 'mobile' | 'whatsapp' | 'tradeChat';
  contactAvailability: string;
  plan: PlanTier;
  hasGoldenTick: boolean;
  isVerified: boolean;
  role: UserRole;
  avatarUrl?: string;
  companyLogoUrl?: string;
  bio?: string;
  summary?: string;
  specializations?: string[];
  skills?: string[];
  languages?: string[];
  trialUsedYear?: number;
  // Professional business information
  gstn?: string;
  pan?: string;
  iec?: string;
  mto?: string;
  website?: string;
  termsAcceptance?: TermsAcceptance;
  // Professional credentials lists
  experiences?: ProfileExperience[];
  educations?: ProfileEducation[];
  certifications?: ProfileCertification[];
}

export interface NestedReply {
  id: string;
  parentReplyId?: string;
  author: string;
  authorUid?: string;
  authorRole?: string;
  authorCompany?: string;
  authorTimezone?: string;
  hasGoldenTick?: boolean;
  text: string;
  time: string;
  likes: number;
  dis: number;
  liked?: boolean;
  disliked?: boolean;
}

export interface CommentReply {
  id: string;
  author: string;
  authorUid?: string;
  authorRole?: string;
  authorCompany?: string;
  authorTimezone?: string;
  hasGoldenTick?: boolean;
  text: string;
  time: string;
  likes: number;
  dis: number;
  liked?: boolean;
  disliked?: boolean;
  replies?: NestedReply[]; // 3-tier nesting: Comment -> Reply -> Reply to Reply
}

export interface PostComment {
  id: string;
  author: string;
  authorUid?: string;
  authorRole?: string;
  authorCompany?: string;
  authorTimezone?: string;
  hasGoldenTick?: boolean;
  text: string;
  time: string;
  likes: number;
  dis: number;
  liked?: boolean;
  disliked?: boolean;
  replies: CommentReply[];
}

export interface FeedPost {
  id: string;
  authorUid?: string;
  author: string;
  authorRole: string;
  authorCompany?: string;
  authorTimezone?: string;
  hasGoldenTick?: boolean;
  time: string;
  text: string;
  postType?: PostType;
  likes: number;
  dis: number;
  liked?: boolean;
  disliked?: boolean;
  isSaved?: boolean;
  comments: PostComment[];
  isOwner?: boolean;
  isAuctionAnnouncement?: boolean;
  auctionRefId?: string;
  tags?: string[];
}

export interface JobPost {
  id: string;
  title: string;
  company: string;
  location: string;
  experience: string;
  packageDetails: string;
  employmentType: string;
  requirements: string;
  responsibilities?: string;
  qualifications?: string;
  skills?: string[];
  closingDate?: string;
  postedBy: string;
  posterUid?: string;
  posterEmail: string;
  showEmailPublicly?: boolean;
  posterTimezone?: string;
  postedDate: string;
  status: 'active' | 'closed';
  isOwner?: boolean;
}

export interface PostReport {
  id: string;
  targetId: string;
  targetType: 'post' | 'comment' | 'job' | 'user' | 'review';
  reporterUid: string;
  reporterName: string;
  category: 'malicious' | 'spam' | 'fraud' | 'copyright' | 'harassment' | 'misleading' | 'prohibited' | 'other';
  description: string;
  createdAt: string;
  status: 'pending' | 'reviewed' | 'action_taken' | 'dismissed';
}

export interface NexusTopic {
  id: string;
  title: string;
  author: string;
  authorUid?: string;
  authorCompany?: string;
  authorTimezone?: string;
  hasGoldenTick?: boolean;
  category: string;
  text: string;
  likes: number;
  dis: number;
  liked?: boolean;
  disliked?: boolean;
  views?: number;
  commentsCount: number;
  createdAt: string;
  replies: {
    id?: string;
    author: string;
    authorUid?: string;
    text: string;
    time: string;
    hasGoldenTick?: boolean;
    likes?: number;
    dis?: number;
    liked?: boolean;
    disliked?: boolean;
  }[];
}

export interface CompanyReview {
  id: string;
  companyName: string;
  location: string;
  ratingAverage: number;
  totalReviews: number;
  starDistribution: [number, number, number, number, number]; // [5-star, 4-star, 3-star, 2-star, 1-star]
  recentReviews: {
    id: string;
    author: string;
    authorUid?: string;
    rating: number;
    text: string;
    date: string;
    verified: boolean;
    likes?: number;
    dis?: number;
    liked?: boolean;
    disliked?: boolean;
    tags?: string[];
  }[];
}

export interface BlacklistDispute {
  id: string;
  author: string;
  authorCompany: string;
  authorUid?: string;
  date: string;
  text: string;
  evidenceDoc?: string;
  status: 'under_review' | 'verified' | 'rejected';
}

export interface BlacklistCase {
  id: string;
  companyName: string;
  location: string;
  reason: string;
  severity: 'high' | 'critical' | 'moderate';
  reportedDate: string;
  status: 'active' | 'under_investigation' | 'resolved';
  reporter: string;
  reporterUid?: string;
  description: string;
  evidenceRef: string;
  agreedCount?: number;
  disputeCount?: number;
  userAgreed?: boolean;
  userDisputed?: boolean;
  disputes?: BlacklistDispute[];
}

export interface ContainerEquipmentRow {
  id: string;
  equipmentType: string; // 20DV, 40DV, 40HC, 20RF, 40RF, 20OT, 40OT, 20FR, 40FR, ISO Tank
  containerType: 'Standard' | 'Reefer' | 'OOG' | 'Tank';
  quantity: number;
  containerSplit?: string;
  pickupLocation: string;
  emptyReturnLocation: string;
  isSpecial: boolean;
  commodity: string;
  hsCode: string;
  grossWeight: number;
  weightUnit?: 'KG' | 'MT';
  dimensions?: string;
  specialInstructions?: string;
}

export interface SelectedBidder {
  id: string;
  name: string;
  company: string;
  role: string;
  location: string;
  timezone: string;
  hasGoldenTick?: boolean;
}

export interface BidItemRow {
  equipment: string;
  quantity: number;
  oceanFreight: number;
  freightSurcharges: number;
  originTransport: number;
  originClearance: number;
  originLocal: number;
  destTransport: number;
  destClearance: number;
  destLocal: number;
  totalUnit: number;
}

export interface SubmittedBid {
  id: string;
  auctionId: string;
  bidderUid: string;
  bidderName: string;
  bidderCompany: string;
  bidderHasGoldenTick: boolean;
  charges: BidItemRow[];
  grandTotalUSD: number;
  rank: number;
  feePaid: number;
  currency: string;
  submittedAt: string;
  status: 'active' | 'withdrawn' | 'winning' | 'outbid';
}

export type AuctionResult = 'won' | 'lost' | 'cancelled' | 'no_result' | 'expired' | 'pending';

export interface AuctionTimelineEvent {
  event: string;
  timestamp: string;
  detail?: string;
}

export interface Auction {
  id: string;
  title: string;
  rfqId: string;
  creatorUid: string;
  creatorName: string;
  creatorCompany: string;
  auctionType: 'Specific bidder' | 'General bidding';
  startDate: string;
  startTime: string;
  durationMinutes: number;
  endDateTime: string;
  timezone: string;
  status: 'Live' | 'Closed' | 'Draft' | 'Awarded' | 'Cancelled' | 'Expired';
  rank?: string;
  timeLeft?: string;
  isPublished: boolean;
  publishedAt?: string;
  draftedAt?: string;
  closedAt?: string;
  result?: AuctionResult;
  resultDetail?: string;
  postingFeeINR?: number;
  postingFeeUSD?: number;
  timeline?: AuctionTimelineEvent[];
  shipment: {
    por: string;
    pol: string;
    pod: string;
    finalDestination: string;
    cargoReadyDate: string;
    shipmentType: 'FCL' | 'LCL' | 'Breakbulk' | 'RoRo';
    movementType?: string;
    incoterm: string;
    blType?: string;
    rateCurrency: string;
    commodity: string;
    hsCode: string;
    weightKg: number;
    cbm: number;
    isHazardous?: boolean;
    unNumber?: string;
    imoClass?: string;
    specialRequirements?: string;
  };
  containers: ContainerEquipmentRow[];
  originCharges: {
    transportation: boolean;
    clearance: boolean;
    carrierLocal: boolean;
    pickupAddress?: string;
    handoverLocation?: string;
    factoryStuffing?: boolean;
    cfsStuffing?: boolean;
  };
  destinationCharges: {
    transportation: boolean;
    clearance: boolean;
    carrierLocal: boolean;
    destuffingAddress?: string;
    dutyPaidBy?: 'us' | 'consignee' | 'none';
    cargoCommodity?: string;
    hsCode?: string;
    approxCargoValue?: string;
  };
  selectedBidders: SelectedBidder[];
  blockedBidders: string[]; // bidder IDs
  rules: {
    autoExtension: boolean;
    rankingVisible: boolean;
    hideCompetitorNames: boolean;
    bidderAnonymity: boolean;
    bidLimit: number;
  };
  competitionCeiling: number;
  bidsSubmittedCount: number;
  bids?: SubmittedBid[];
  winningBidId?: string;
  awardedDetails?: {
    awardedAt: string;
    docketId: string;
    winningCompany: string;
    winningContact: string;
    winningRateUSD: number;
    carrier: string;
    transitTime: string;
    freeTimeOrigin: string;
    freeTimeDest: string;
    equipmentBreakdown: string;
    shipperCompany: string;
    shipperContact: string;
    settlementTerms: string;
  };
  historicalSnapshot?: {
    publishedAt: string;
    creatorSnapshot: {
      name: string;
      company: string;
      email: string;
      location: string;
    };
  };
}

export interface RateVersion {
  id: string;
  version: number;
  status: 'current' | 'previous' | 'expired' | 'replaced';
  createdAt: string;
  d20: number;
  h40: number;
  valid: string;
  remark: string;
}

export interface RateItem {
  id: string; // RT-###### (Market) or IRT-###### (i-Rate)
  sp: string; // Service Provider
  carrier: string;
  por: string;
  pol: string;
  pod: string;
  fpod: string;
  d20: number; // 20DV USD
  d20Type?: string;
  h40: number; // 40HC USD
  h40Type?: string;
  ft: string; // Free Time e.g. "14 days"
  tt: string; // Transit Time e.g. "29 days"
  valid: string; // Validity date
  rateType?: string;
  route: string;
  remark: string;
  ownerUid?: string;
  isOwner?: boolean;
  versions?: RateVersion[];
  isExpiringSoon?: boolean; // computed: within 7 days of valid date
}

export interface ChatMessage {
  id: string;
  conversationId?: string;
  senderUid: string;
  senderName: string;
  me: boolean;
  text: string;
  time: string;
  createdAt?: string;
  status?: 'sent' | 'delivered' | 'read';
  replyToMessageId?: string;
  relatedRecordId?: string;
}

export interface ChatContact {
  id: string;
  name: string;
  role: string;
  company: string;
  location: string;
  timezone: string;
  online: boolean;
  unreadCount: number;
  hasGoldenTick?: boolean;
  contextRecord?: {
    type: 'auction' | 'rate' | 'job' | 'company';
    id: string;
    title: string;
  };
}

export interface ActiveChatWindow {
  contactId: string;
  isMinimized: boolean;
}

export type NotificationType =
  | 'auction_invite'
  | 'bid_received'
  | 'auction_published'
  | 'auction_closed'
  | 'auction_result'
  | 'chat_message'
  | 'feed_interaction'
  | 'job_posted'
  | 'system'
  | 'subscription';

export type NotificationCategory = 'auctions' | 'bids' | 'chat' | 'feeds' | 'jobs' | 'profile' | 'system' | 'subscription';

export interface AppNotification {
  id: string;
  title: string;
  desc: string;
  time: string;
  createdAt: string;
  read: boolean;
  type: NotificationType;
  category: NotificationCategory;
  targetUrl?: string;
  relatedId?: string;
  actionLabel?: string;
}

// Global Sovereign Master Data Definitions for CON.FR8X.IN

export type LocationType =
  | 'Seaport'
  | 'Inland Container Depot (ICD)'
  | 'Container Freight Station (CFS)'
  | 'Airport'
  | 'Land Border'
  | 'River Port'
  | 'Dry Port';

export interface LocationMasterItem {
  id: string;
  unLocode: string;
  name: string;
  country: string;
  countryCode: string;
  region: string;
  type: LocationType;
  capabilities: {
    isPOR: boolean; // Place of Receipt
    isPOL: boolean; // Port of Loading
    isPOD: boolean; // Port of Discharge
    isFPOD: boolean; // Final Place of Delivery
  };
  terminals: string[];
  coordinates: {
    lat: number;
    lng: number;
  };
  customsZoneCode?: string;
  status: 'active' | 'maintenance' | 'restricted' | 'inactive';
  remarks?: string;
}

export type CarrierType =
  | 'MLO' // Main Line Operator / Vessel Operating Common Carrier
  | 'NVOCC' // Non-Vessel Operating Common Carrier
  | 'Feeder Operator'
  | 'Air Freight Carrier'
  | 'Rail / Intermodal';

export type CarrierAlliance =
  | 'Gemini Cooperation'
  | 'Ocean Alliance'
  | 'THE Alliance / Premier'
  | 'Independent'
  | 'Global Forwarder'
  | 'Regional Feeder'
  | 'National Rail';

export interface CarrierMasterItem {
  id: string;
  name: string;
  scacCode: string;
  carrierCode: string;
  type: CarrierType;
  alliance: CarrierAlliance;
  country: string;
  fleetTEU?: string;
  bookingEmail: string;
  trackingApiEndpoint?: string;
  supportedEquipment: string[];
  status: 'active' | 'suspended' | 'under_review';
  remarks?: string;
}

export type EquipmentCategory =
  | 'Dry Standard'
  | 'High Cube'
  | 'Reefer'
  | 'Open Top'
  | 'Flat Rack'
  | 'ISO Tank'
  | 'Special Bulk';

export interface EquipmentMasterItem {
  id: string;
  isoCode: string;
  isoGroup: string;
  name: string;
  category: EquipmentCategory;
  lengthFt: number;
  heightFt: number;
  maxGrossKg: number;
  tareWeightKg: number;
  maxPayloadKg: number;
  volumeCbm: number;
  isHazardousAllowed: boolean;
  isReefer: boolean;
  isOogAllowed: boolean;
  status: 'active' | 'deprecated';
  remarks?: string;
}

export interface CommodityMasterItem {
  id: string;
  hsCode: string;
  chapter: string;
  heading: string;
  name: string;
  isHazardous: boolean;
  imoClass?: string;
  unNumber?: string;
  storageReqs?: string;
  status: 'active' | 'restricted' | 'prohibited';
}

export interface IncotermMasterItem {
  id: string;
  code: string;
  name: string;
  category: 'Sea & Inland Waterway' | 'Any Transport Mode';
  riskTransferPoint: string;
  costFreight: 'Seller' | 'Buyer';
  costOriginTHC: 'Seller' | 'Buyer';
  costDestTHC: 'Seller' | 'Buyer';
  costCustomsExport: 'Seller' | 'Buyer';
  costCustomsImport: 'Seller' | 'Buyer';
  costInsurance: 'Seller' | 'Buyer' | 'Optional';
  status: 'active' | 'inactive';
}

export interface TaxSACMasterItem {
  id: string;
  sacCode: string;
  description: string;
  standardGSTRate: number;
  rcmApplicable: boolean;
  category: string;
  status: 'active' | 'inactive';
}

