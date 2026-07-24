// FR8X-CON Application Constants

export const APP_NAME = "FR8X-CON" as const;
export const APP_DESCRIPTION = "Enterprise Freight Reverse-Auction & Logistics Collaboration Platform" as const;

// Routes
export const ROUTES = {
  // Auth
  LOGIN: "/login",
  REGISTER: "/register",
  FORGOT_PASSWORD: "/forgot-password",
  TERMS: "/terms",

  // Dashboard
  FEEDS: "/feeds",
  PROFILE: "/profile",
  PROFILE_VIEW: (userId: string) => `/profile/${userId}` as const,

  // Auctions
  AUCTIONS: "/auctions",
  AUCTION_CREATE: "/auctions/create",
  AUCTION_DETAIL: (id: string) => `/auctions/${id}` as const,
  AUCTION_BID: (id: string) => `/auctions/${id}/bid` as const,

  // Rates
  RATES: "/rates",

  // Awards & Blacklist
  AWARDS: "/awards",
  BLACKLIST: "/blacklist",

  // Jobs
  JOBS: "/jobs",

  // Admin / GodMode
  GODMODE: "/godmode",
  GODMODE_LOGIN: "/godmode/login",
  GODMODE_USERS: "/godmode/users",
  GODMODE_COMPANIES: "/godmode/companies",
  GODMODE_AUCTIONS: "/godmode/auctions",
  GODMODE_AWARDS: "/godmode/awards",
  GODMODE_BLACKLIST: "/godmode/blacklist",
  GODMODE_MODERATION: "/godmode/moderation",
  GODMODE_VERIFICATION: "/godmode/verification",
  GODMODE_BILLING: "/godmode/billing",
  GODMODE_AUDIT: "/godmode/audit",
  GODMODE_SETTINGS: "/godmode/settings",
} as const;

// Firestore Collections
export const COLLECTIONS = {
  USERS: "users",
  PROFILES: "profiles",
  COMPANIES: "companies",
  POSTS: "posts",
  COMMENTS: "comments",
  LIKES: "likes",
  BOOKMARKS: "bookmarks",
  AWARDS: "awards",
  BLACKLISTS: "blacklists",
  AUCTIONS: "auctions",
  AUCTION_ITEMS: "auctionItems",
  AUCTION_PARTICIPANTS: "auctionParticipants",
  BIDS: "bids",
  LIVE_RANKS: "liveRanks",
  RATES: "rates",
  CURRENCIES: "currencies",
  NOTIFICATIONS: "notifications",
  LOGS: "logs",
  AUDIT: "audit",
  SETTINGS: "settings",
  JOBS: "jobs",
  JOB_APPLICATIONS: "jobApplications",
  TRANSACTIONS: "transactions",
} as const;

// Bid constraints
export const BID_MAX_SUBMISSIONS = 5;

// Industry & Service Tags (spec page 2)
export const INDUSTRY_TAGS = [
  "NVOCC",
  "Freight Forwarding",
  "FCL",
  "LCL",
  "Ocean Freight",
  "Customs Clearance",
  "Dangerous Goods",
  "Cross-border Trade",
  "Air Freight",
  "Inland Haulage",
  "Warehousing",
  "Cold Chain",
  "Project Cargo",
  "Multimodal",
] as const;

// User Roles & Business Verticals (spec page 2 & 11)
export const USER_ROLES = [
  { value: "freight_forwarder", label: "Freight Forwarder" },
  { value: "mlo", label: "Shipping Line / MLO" },
  { value: "exporter", label: "Exporter" },
  { value: "importer", label: "Importer" },
  { value: "cha", label: "CHA (Custom House Agent)" },
  { value: "customs_broker", label: "Customs Broker" },
  { value: "transporter", label: "Transporter" },
  { value: "warehouse", label: "Warehouse Operator" },
  { value: "nvocc", label: "NVOCC" },
  { value: "shipping_agent", label: "Shipping Agent" },
] as const;

// Feed categories (spec page 3 — extended)
export const FEED_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "nvocc", label: "NVOCC" },
  { value: "freight_forwarding", label: "Freight Forwarding" },
  { value: "project_cargo", label: "Project Cargo" },
  { value: "fcl", label: "FCL" },
  { value: "lcl", label: "LCL" },
  { value: "air", label: "Air" },
  { value: "ocean", label: "Ocean" },
  { value: "road", label: "Road" },
  { value: "customs", label: "Customs" },
  { value: "warehousing", label: "Warehousing" },
  { value: "cold_chain", label: "Cold Chain" },
  { value: "multimodal", label: "Multimodal" },
  { value: "rig_to_destination", label: "Rig to destination (sea/air)" },
] as const;

// Feed sort options
export const FEED_SORT_OPTIONS = [
  { value: "latest", label: "Latest" },
  { value: "popular", label: "Popular" },
  { value: "following", label: "Following" },
  { value: "my_posts", label: "My Posts" },
] as const;

// Container sizes
export const CONTAINER_SIZES = [
  { value: "20ft", label: "20' Standard" },
  { value: "40ft", label: "40' Standard" },
  { value: "40ft_hc", label: "40' High Cube" },
  { value: "45ft", label: "45' High Cube" },
] as const;

// Membership tiers (spec page 2 — Trail = 2 days)
export const MEMBERSHIP_TIERS = [
  {
    id: "trial",
    name: "Trail",
    priceINR: 0,
    priceUSD: 0,
    period: "2 days",
    features: ["Verified badge", "RFQ posting", "0 saved searches"],
    comingSoon: false,
  },
  {
    id: "basic",
    name: "Basic",
    priceINR: 1499,
    priceUSD: 25,
    period: "mo",
    features: [
      "Verified badge",
      "Bidding and rates posting",
      "Unlimited rates search and requests",
    ],
    comingSoon: false,
  },
  {
    id: "premium",
    name: "Premium",
    priceINR: null,
    priceUSD: null,
    period: null,
    label: "Custom",
    features: [
      "Multi-seat access",
      "Dedicated account manager",
      "API integration",
    ],
    comingSoon: true,
  },
] as const;

// Job posting constants (spec page 6)
export const JOB_INDUSTRIES = [
  "Logistics",
  "Freight",
  "NVOCC",
  "Shipping",
  "Customs",
  "Warehousing",
  "Supply Chain",
] as const;

export const JOB_EMPLOYMENT_TYPES = [
  "Full-Time",
  "Part-Time",
  "Contract",
  "Internship",
  "Temporary",
] as const;

export const JOB_EXPERIENCE_LEVELS = [
  "Fresher",
  "1-2 Yrs",
  "3-5 Yrs",
  "5-10 Yrs",
  "10+ Yrs",
] as const;

export const JOB_CARGO_TYPES = [
  "FCL",
  "LCL",
  "Air",
  "Ocean",
  "Project Cargo",
  "Breakbulk",
  "Reefer",
  "DG",
] as const;

export const JOB_CATEGORIES = [
  "Operations",
  "Sales",
  "Pricing",
  "Documentation",
  "Customs",
  "Warehouse",
  "HR",
  "Finance",
  "IT",
] as const;

export const JOB_APPLY_VIA = ["Portal", "Email", "External Link"] as const;
export const JOB_WORK_MODES = ["On-site", "Hybrid", "Remote"] as const;
export const JOB_SALARY_TYPES = ["Monthly", "Annual"] as const;
export const JOB_PREFERRED_SOFTWARE = ["CargoWise", "SAP", "ERP", "Tally", "MS Office", "Other"] as const;
export const JOB_LANGUAGES = ["English", "Hindi", "Other"] as const;

export const JOB_SUBMISSION_FEE_INR = 499;
export const JOB_VALIDITY_DAYS = 2;
export const JOB_RENEWAL_FEE_INR = 499;

// Mandatory rate heads (spec page 8)
export const MANDATORY_RATE_HEADS = [
  "Ocean Freight Rate (All-in)",
  "Terminal Handling Charges - Origin",
  "Terminal Handling Charges - Destination",
  "Documentation Charges",
  "Customs Clearance Charges - Origin",
  "Customs Clearance Charges - Destination",
  "Other Surcharges (specify)",
  "Inland Transportation - Origin",
  "Inland Transportation - Destination",
  "Warehousing / Storage Charges",
  "Cargo Insurance Charges",
  "Packing / Crating Charges",
  "BAF / CAF / THC / ISPS / other surcharges",
] as const;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Currency cache TTL (seconds)
export const CURRENCY_CACHE_TTL = 300; // 5 minutes

// Responsive breakpoints (matching Tailwind)
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
  "2XL": 1536,
} as const;
