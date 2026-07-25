// FR8X-CON User & Profile Types

import type { AuditFields, Status } from "./common";
import type { MembershipTier, UserRole } from "./auth";

export type User = {
  uid: string;
  email: string;
  role: UserRole;
  companyId: string;
  membershipTier: MembershipTier;
  isGodMode: boolean;
  status: Status;
  lastLoginAt: AuditFields["createdAt"];
} & AuditFields;

export type Profile = {
  id: string;
  userId: string;
  fullName: string;
  designation: string;
  location: string;
  country: string;
  about: string;
  companyName: string;
  photoURL: string | null;
  verifiedBadge: boolean;
  followers: string[];
  following: string[];
  followersCount: number;
  followingCount: number;
  postsCount: number;
  awardsCount: number;
  currentAuctions: string[];
  completedAuctions: string[];
  blacklistStatus: BlacklistStatus;
  industryTags: string[];
  serviceTags: string[];
  workExperience: WorkExperience[];
  publicId?: string; // e.g. @RAJAT001
  followedTags?: string[];
} & AuditFields;

export type WorkExperience = {
  id: string;
  companyName: string;
  designation: string;
  location: string;
  startDate: string;
  endDate: string | null;
  isCurrent: boolean;
};

export type BlacklistStatus = "clean" | "blacklisted" | "appealing" | "resolved";

export type Company = {
  id: string;
  name: string;
  country: string;
  region: string;
  industry: string;
  serviceTags: string[];
  verified: boolean;
  memberCount: number;
  logoURL: string | null;
  bannerURL?: string | null;
  publicId?: string; // e.g. @COMP-0001
  gstn?: string;
  pan?: string;
  cin?: string;
  iec?: string;
  businessRegistrationNumber?: string;
  companyType?: string;
  yearEstablished?: string;
  about?: string;
} & AuditFields;

export type ConnectionRelation = {
  id: string;
  users: string[]; // [uid1, uid2]
  status: 'pending' | 'accepted' | 'rejected' | 'blocked';
  requesterId: string;
  blockedById?: string;
  createdAt: any;
  updatedAt: any;
};

export type Connection = {
  id: string;
  userId: string;
  fullName: string;
  companyName: string;
  designation: string;
  location: string;
  photoURL: string | null;
  country: string;
  publicId?: string;
};

export type SuggestedConnection = Connection & {
  mutualConnections: number;
};

