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
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

export interface ProfileRow {
  id: string; // UUID references auth.users(id)
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
