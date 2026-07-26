export type LocationType =
  | "sea"
  | "air"
  | "rail"
  | "road"
  | "icd"
  | "cfs"
  | "warehouse"
  | "border"
  | "hub";

export type TransportMode = "ocean" | "air" | "rail" | "road" | "multimodal";

export type LocationStatus =
  | "approved"
  | "pending_verification"
  | "rejected"
  | "merged";

export type LocationSource =
  | "unlocode"
  | "ourairports"
  | "geonames"
  | "manual"
  | "sync"
  | "seed";

export interface VerificationAudit {
  verifiedBy?: string;
  verifiedAt?: string;
  notes?: string;
}

export interface LocationDoc {
  id: string;
  fr8xLocationId: string;
  code: string;
  name: string;
  city: string;
  state?: string;
  country: string;
  countryCode: string;
  type: LocationType;
  transportModes: TransportMode[];
  status: LocationStatus;
  source: LocationSource;
  
  unlocode?: string;
  portCode?: string;
  iataCode?: string;
  icaoCode?: string;
  icdCode?: string;
  cfsCode?: string;
  railCode?: string;
  postalCode?: string;
  
  coordinates?: {
    lat: number;
    lng: number;
  };
  timezone?: string;
  customsOffice?: string;
  portAuthority?: string;
  terminalOperator?: string;
  aliases?: string[];
  searchFrequency?: number;

  mergedIntoId?: string;
  rejectionReason?: string;
  verificationAudit?: VerificationAudit;
  
  createdAt?: string | number;
  updatedAt?: string | number;
  createdBy?: string;
}
