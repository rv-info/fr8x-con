export type PlanTier = 'trial' | 'professional' | 'premium';

export type UserRole = 'user' | 'company_admin' | 'moderator' | 'super_admin';

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
  mobile: string;
  alternateMobile?: string;
  timezone: string; // IANA string e.g. "Asia/Kolkata", "Europe/Rotterdam"
  preferredContactMethod: 'email' | 'mobile' | 'whatsapp' | 'tradeChat';
  contactAvailability: string;
  plan: PlanTier;
  hasGoldenTick: boolean;
  isVerified: boolean;
  role: UserRole;
  avatarUrl?: string;
  bio?: string;
  summary?: string;
  specializations?: string[];
  skills?: string[];
  languages?: string[];
  trialUsedYear?: number;
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
  id: string | number;
  authorUid?: string;
  author: string;
  authorRole: string;
  authorCompany?: string;
  authorTimezone?: string;
  hasGoldenTick?: boolean;
  time: string;
  text: string;
  likes: number;
  dis: number;
  liked?: boolean;
  disliked?: boolean;
  isSaved?: boolean;
  comments: PostComment[];
  isOwner?: boolean;
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
  postedBy: string;
  posterEmail: string;
  posterTimezone?: string;
  postedDate: string;
  isOwner?: boolean;
}

export interface AdBooking {
  id: string;
  businessName: string;
  email: string;
  headline: string;
  imageUrl: string;
  durationDays: number;
  amount: number;
  status: 'draft' | 'pending_moderation' | 'active' | 'expired';
  createdAt: string;
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
  commentsCount: number;
  createdAt: string;
  replies: {
    author: string;
    text: string;
    time: string;
    hasGoldenTick?: boolean;
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
    author: string;
    rating: number;
    text: string;
    date: string;
    verified: boolean;
  }[];
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
  description: string;
  evidenceRef: string;
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
  status: 'Live' | 'Closed' | 'Draft' | 'Awarded';
  rank?: string;
  timeLeft?: string;
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
  selectedBidders: {
    id: string;
    name: string;
    company: string;
    role: string;
    location: string;
    timezone: string;
    hasGoldenTick?: boolean;
  }[];
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
}

export interface ChatMessage {
  id: string;
  senderUid: string;
  senderName: string;
  me: boolean;
  text: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
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

export interface ProfileExperience {
  id: string;
  company: string;
  designation: string;
  employmentType: string;
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
