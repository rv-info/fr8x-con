/**
 * lib/supabase/types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative TypeScript Database Schema Types for FR8X Supabase Backend.
 * Represents all PostgreSQL tables, insert payloads, update payloads,
 * and mapped domain entities.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      companies: {
        Row: CompanyRow;
        Insert: CompanyInsert;
        Update: CompanyUpdate;
      };
      rates: {
        Row: RateRow;
        Insert: RateInsert;
        Update: RateUpdate;
      };
      auctions: {
        Row: AuctionRow;
        Insert: AuctionInsert;
        Update: AuctionUpdate;
      };
      auction_bids: {
        Row: AuctionBidRow;
        Insert: AuctionBidInsert;
        Update: AuctionBidUpdate;
      };
      posts: {
        Row: PostRow;
        Insert: PostInsert;
        Update: PostUpdate;
      };
      comments: {
        Row: CommentRow;
        Insert: CommentInsert;
        Update: CommentUpdate;
      };
      audit_logs: {
        Row: AuditLogRow;
        Insert: AuditLogInsert;
        Update: AuditLogUpdate;
      };
      jobs: {
        Row: JobRow;
        Insert: JobInsert;
        Update: JobUpdate;
      };
      cases: {
        Row: CaseRow;
        Insert: CaseInsert;
        Update: CaseUpdate;
      };
      transactions: {
        Row: TransactionRow;
        Insert: TransactionInsert;
        Update: TransactionUpdate;
      };
      reviews: {
        Row: ReviewRow;
        Insert: ReviewInsert;
        Update: ReviewUpdate;
      };
      events: {
        Row: EventRow;
        Insert: EventInsert;
        Update: EventUpdate;
      };
      intents: {
        Row: IntentRow;
        Insert: IntentInsert;
        Update: IntentUpdate;
      };
      presence: {
        Row: PresenceRow;
        Insert: PresenceInsert;
        Update: PresenceUpdate;
      };
      verifications: {
        Row: VerificationRow;
        Insert: VerificationInsert;
        Update: VerificationUpdate;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export interface ProfileRow {
  id: string; // UUID references auth.users(id)
  uid?: string | null; // Legacy user identifier e.g. u-rajat
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  phone: string | null;
  mobile: string | null;
  isd_code: string | null;
  whatsapp_same_as_mobile: boolean | null;
  designation: string | null;
  position: string | null;
  company_name: string | null;
  company_id: string | null;
  department: string | null;
  city: string | null;
  state: string | null;
  district: string | null;
  country: string | null;
  area: string | null;
  postal_code: string | null;
  formatted_address: string | null;
  address: string | null;
  location: string | null;
  timezone: string | null;
  avatar_url: string | null;
  company_logo_url: string | null;
  role: string | null;
  plan: string | null;
  has_golden_tick: boolean | null;
  is_verified: boolean | null;
  status: string | null;
  account_status: string | null;
  first_login_completed: boolean | null;
  email_verified: boolean | null;
  failed_login_attempts: number | null;
  experiences: Json | null;
  educations: Json | null;
  certifications: Json | null;
  privacy_settings: Json | null;
  gstn: string | null;
  pan: string | null;
  cin: string | null;
  iec: string | null;
  mto: string | null;
  summary: string | null;
  bio: string | null;
  created_at: string;
  updated_at: string;
  last_login_at: string | null;
}

export type ProfileInsert = Partial<ProfileRow> & { id: string; email: string };
export type ProfileUpdate = Partial<ProfileRow>;

export interface CompanyRow {
  id: string;
  name: string;
  legal_name: string | null;
  cin: string | null;
  pan: string | null;
  gstin: string | null;
  entity_type: string | null;
  industry: string | null;
  website: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  postal_code: string | null;
  status: string | null;
  kyc_status: string | null;
  is_verified: boolean | null;
  created_at: string;
  updated_at: string;
}

export type CompanyInsert = Partial<CompanyRow> & { id: string; name: string };
export type CompanyUpdate = Partial<CompanyRow>;

export interface RateRow {
  id: string;
  origin_port: string;
  destination_port: string;
  container_type: string | null;
  rate_20: number | null;
  rate_40: number | null;
  rate_40hc: number | null;
  currency: string | null;
  shipping_line: string | null;
  transit_time_days: number | null;
  valid_from: string | null;
  valid_to: string | null;
  is_active: boolean | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export type RateInsert = Partial<RateRow> & {
  id: string;
  origin_port: string;
  destination_port: string;
};
export type RateUpdate = Partial<RateRow>;

export interface AuctionRow {
  id: string;
  title: string;
  origin_port: string;
  destination_port: string;
  cargo_description: string | null;
  container_count: number | null;
  container_type: string | null;
  starting_price: number | null;
  reserve_price: number | null;
  current_lowest_bid: number | null;
  currency: string | null;
  status: string | null;
  creator_id: string | null;
  winner_id: string | null;
  starts_at: string | null;
  expires_at: string | null;
  created_at: string;
  updated_at: string;
}

export type AuctionInsert = Partial<AuctionRow> & {
  id: string;
  title: string;
  origin_port: string;
  destination_port: string;
};
export type AuctionUpdate = Partial<AuctionRow>;

export interface AuctionBidRow {
  id: string;
  auction_id: string;
  bidder_id: string;
  bidder_company: string | null;
  amount: number;
  transit_days: number | null;
  free_days: number | null;
  carrier: string | null;
  routing: string | null;
  remarks: string | null;
  status: string | null;
  submitted_at: string;
}

export type AuctionBidInsert = Partial<AuctionBidRow> & {
  id: string;
  auction_id: string;
  bidder_id: string;
  amount: number;
};
export type AuctionBidUpdate = Partial<AuctionBidRow>;

export interface PostRow {
  id: string;
  author_id: string;
  author_name: string | null;
  author_company: string | null;
  author_avatar: string | null;
  content: string;
  media_url: string | null;
  media_type: string | null;
  tags: string[] | null;
  likes_count: number | null;
  comments_count: number | null;
  is_published: boolean | null;
  created_at: string;
  updated_at: string;
}

export type PostInsert = Partial<PostRow> & {
  id: string;
  author_id: string;
  content: string;
};
export type PostUpdate = Partial<PostRow>;

export interface CommentRow {
  id: string;
  post_id: string;
  author_id: string;
  author_name: string | null;
  author_avatar: string | null;
  content: string;
  created_at: string;
}

export type CommentInsert = Partial<CommentRow> & {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
};
export type CommentUpdate = Partial<CommentRow>;

export interface AuditLogRow {
  id: string;
  user_id: string | null;
  action: string;
  entity: string;
  entity_id: string | null;
  old_data: Json | null;
  new_data: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
}

export type AuditLogInsert = Partial<AuditLogRow> & {
  action: string;
  entity: string;
};
export type AuditLogUpdate = Partial<AuditLogRow>;

export interface JobRow {
  id: string;
  title: string;
  company_id: string | null;
  company_name: string | null;
  location: string | null;
  job_type: string | null;
  description: string | null;
  requirements: string | null;
  salary_range: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}
export type JobInsert = Partial<JobRow> & { id: string; title: string };
export type JobUpdate = Partial<JobRow>;

export interface CaseRow {
  id: string;
  title: string;
  description: string | null;
  user_id: string | null;
  company_id: string | null;
  category: string | null;
  priority: string | null;
  status: string | null;
  metadata: Json | null;
  created_at: string;
  updated_at: string;
}
export type CaseInsert = Partial<CaseRow> & { id: string; title: string };
export type CaseUpdate = Partial<CaseRow>;

export interface TransactionRow {
  id: string;
  order_id: string;
  payment_id: string | null;
  user_id: string | null;
  user_email: string | null;
  amount: number;
  currency: string | null;
  plan_id: string | null;
  item_type: string | null;
  item_title: string | null;
  status: string | null;
  gateway: string | null;
  raw_payload: Json | null;
  created_at: string;
  updated_at: string;
}
export type TransactionInsert = Partial<TransactionRow> & { id: string; order_id: string; amount: number };
export type TransactionUpdate = Partial<TransactionRow>;

export interface ReviewRow {
  id: string;
  target_company_id: string;
  reviewer_id: string | null;
  reviewer_name: string | null;
  reviewer_company: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
}
export type ReviewInsert = Partial<ReviewRow> & { id: string; target_company_id: string; rating: number };
export type ReviewUpdate = Partial<ReviewRow>;

export interface EventRow {
  id: string;
  event_type: string;
  user_id: string | null;
  session_id: string | null;
  payload: Json | null;
  timestamp: string;
}
export type EventInsert = Partial<EventRow> & { id: string; event_type: string };
export type EventUpdate = Partial<EventRow>;

export interface IntentRow {
  user_id: string;
  recent_searched_ports: Json | null;
  viewed_rates: Json | null;
  active_auction_routes: Json | null;
  saved_trade_lanes: Json | null;
  followed_commodities: Json | null;
  carrier_searches: Json | null;
  last_active_at: string;
  expires_at: string | null;
}
export type IntentInsert = Partial<IntentRow> & { user_id: string };
export type IntentUpdate = Partial<IntentRow>;

export interface PresenceRow {
  user_id: string;
  online: boolean;
  last_seen: string;
  active_device: Json | null;
  status: string;
  updated_at: string;
}
export type PresenceInsert = Partial<PresenceRow> & { user_id: string };
export type PresenceUpdate = Partial<PresenceRow>;

export interface VerificationRow {
  id: string;
  token_hash: string;
  user_id: string;
  email: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}
export type VerificationInsert = Partial<VerificationRow> & { token_hash: string; user_id: string; email: string; expires_at: string };
export type VerificationUpdate = Partial<VerificationRow>;
