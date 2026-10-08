/**
 * lib/supabase/types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative TypeScript Database Schema Types for FR8X Supabase Backend.
 * Column names here EXACTLY match the PostgreSQL schema in
 * supabase/migrations/20261005000010_fr8x_master_schema.sql.
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
      profiles:      { Row: ProfileRow;      Insert: ProfileInsert;      Update: ProfileUpdate      };
      companies:     { Row: CompanyRow;      Insert: CompanyInsert;      Update: CompanyUpdate      };
      rates:         { Row: RateRow;         Insert: RateInsert;         Update: RateUpdate         };
      auctions:      { Row: AuctionRow;      Insert: AuctionInsert;      Update: AuctionUpdate      };
      auction_bids:  { Row: AuctionBidRow;   Insert: AuctionBidInsert;   Update: AuctionBidUpdate   };
      posts:         { Row: PostRow;         Insert: PostInsert;         Update: PostUpdate         };
      comments:      { Row: CommentRow;      Insert: CommentInsert;      Update: CommentUpdate      };
      connections:   { Row: ConnectionRow;   Insert: ConnectionInsert;   Update: ConnectionUpdate   };
      notifications: { Row: NotificationRow; Insert: NotificationInsert; Update: NotificationUpdate };
      messages:      { Row: MessageRow;      Insert: MessageInsert;      Update: MessageUpdate      };
      jobs:          { Row: JobRow;          Insert: JobInsert;          Update: JobUpdate          };
      cases:         { Row: CaseRow;         Insert: CaseInsert;         Update: CaseUpdate         };
      transactions:  { Row: TransactionRow;  Insert: TransactionInsert;  Update: TransactionUpdate  };
      reviews:       { Row: ReviewRow;       Insert: ReviewInsert;       Update: ReviewUpdate       };
      events:        { Row: EventRow;        Insert: EventInsert;        Update: EventUpdate        };
      intents:       { Row: IntentRow;       Insert: IntentInsert;       Update: IntentUpdate       };
      presence:      { Row: PresenceRow;     Insert: PresenceInsert;     Update: PresenceUpdate     };
      verifications: { Row: VerificationRow; Insert: VerificationInsert; Update: VerificationUpdate };
      audit_logs:    { Row: AuditLogRow;     Insert: AuditLogInsert;     Update: AuditLogUpdate     };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}

// ─── PROFILES ────────────────────────────────────────────────────────────────
export interface ProfileRow {
  id:                        string;        // UUID — references auth.users(id)
  uid:                       string | null; // Legacy short ID e.g. "u-rajat"
  email:                     string;
  first_name:                string | null;
  last_name:                 string | null;
  display_name:              string | null;
  phone:                     string | null;
  mobile:                    string | null;
  isd_code:                  string | null;
  whatsapp_same_as_mobile:   boolean | null;
  designation:               string | null;
  position:                  string | null;
  company_name:              string | null;
  company_id:                string | null;
  department:                string | null;
  bio:                       string | null;
  summary:                   string | null;
  city:                      string | null;
  state:                     string | null;
  district:                  string | null;
  country:                   string | null;
  area:                      string | null;
  postal_code:               string | null;
  formatted_address:         string | null;
  address:                   string | null;
  location:                  string | null;
  timezone:                  string | null;
  avatar_url:                string | null;
  company_logo_url:          string | null;
  role:                      string | null;
  plan:                      string | null;
  has_golden_tick:           boolean | null;
  is_verified:               boolean | null;
  status:                    string | null;
  account_status:            string | null;
  first_login_completed:     boolean | null;
  email_verified:            boolean | null;
  failed_login_attempts:     number | null;
  preferred_contact_method:  string | null;
  contact_availability:     string | null;
  experiences:               Json | null;
  educations:                Json | null;
  certifications:            Json | null;
  privacy_settings:          Json | null;
  contacts:                  Json | null;
  specializations:           Json | null;
  skills:                    Json | null;
  languages:                 Json | null;
  key_trade_lanes:           Json | null;
  gstn:                      string | null;
  pan:                       string | null;
  cin:                       string | null;
  iec:                       string | null;
  mto:                       string | null;
  kyc_status:                string | null;
  kyc_country:               string | null;
  tax_id:                    string | null;
  tax_id_label:              string | null;
  corporate_reg_number:      string | null;
  corporate_reg_label:       string | null;
  trade_customs_code:        string | null;
  trade_customs_label:       string | null;
  logistics_license_number:  string | null;
  logistics_license_label:   string | null;
  statutory_country:         string | null;
  iata_code:                 string | null;
  fiata_reg:                 string | null;
  fmc_number:                string | null;
  aeo_tier:                  string | null;
  association_name:          string | null;
  association_id:            string | null;
  created_at:                string;
  updated_at:                string;
  last_login_at:             string | null;
}
export type ProfileInsert = Partial<ProfileRow> & { id: string; email: string };
export type ProfileUpdate  = Partial<ProfileRow>;

// ─── CONNECTIONS ─────────────────────────────────────────────────────────────
export interface ConnectionRow {
  id:           string; // UUID
  requester_id: string; // UUID references auth.users(id)
  recipient_id: string; // UUID references auth.users(id)
  status:       string; // pending | accepted | declined | blocked
  note:         string | null;
  created_at:   string;
  updated_at:   string;
}
export type ConnectionInsert = Partial<ConnectionRow> & { requester_id: string; recipient_id: string };
export type ConnectionUpdate = Partial<ConnectionRow>;

// ─── NOTIFICATIONS ───────────────────────────────────────────────────────────
export interface NotificationRow {
  id:          string; // UUID
  user_id:     string; // UUID references auth.users(id)
  type:        string;
  category:    string;
  title:       string;
  description: string | null;
  read:        boolean;
  target_url:  string | null;
  related_id:  string | null;
  metadata:    Json | null;
  created_at:  string;
}
export type NotificationInsert = Partial<NotificationRow> & { user_id: string; title: string };
export type NotificationUpdate = Partial<NotificationRow>;

// ─── MESSAGES ────────────────────────────────────────────────────────────────
export interface MessageRow {
  id:              string; // UUID
  conversation_id: string;
  sender_id:       string; // UUID
  recipient_id:    string; // UUID
  text:            string;
  read:            boolean;
  metadata:        Json | null;
  created_at:      string;
}
export type MessageInsert = Partial<MessageRow> & { sender_id: string; recipient_id: string; text: string };
export type MessageUpdate = Partial<MessageRow>;


// ─── COMPANIES ───────────────────────────────────────────────────────────────
export interface CompanyRow {
  id:                    string;
  name:                  string | null;   // Display/short name
  legal_name:            string;
  trade_name:            string | null;
  cin:                   string | null;
  pan:                   string | null;
  gstn:                  string | null;   // Canonical column
  gstin:                 string | null;   // Alias stored alongside gstn
  iec:                   string | null;
  mto:                   string | null;
  entity_type:           string | null;
  industry:              string | null;
  website:               string | null;
  contact_email:         string | null;
  contact_phone:         string | null;
  primary_contact_name:  string | null;
  primary_contact_email: string | null;
  primary_contact_phone: string | null;
  address:               string | null;
  registered_address:    string | null;
  operating_address:     string | null;
  city:                  string | null;
  state:                 string | null;
  country:               string | null;
  postal_code:           string | null;
  status:                string | null;
  kyc_status:            string | null;
  verified:              boolean | null;
  is_verified:           boolean | null;
  member_count:          number | null;
  admin_notes:           Json | null;
  created_at:            string;
  updated_at:            string;
}
export type CompanyInsert = Partial<CompanyRow> & { id: string; legal_name: string };
export type CompanyUpdate  = Partial<CompanyRow>;

// ─── RATES ───────────────────────────────────────────────────────────────────
export interface RateRow {
  id:             string;
  sp:             string;              // Service Provider
  line:           string;              // Shipping Line
  por:            string;              // Place of Receipt
  pol:            string;              // Port of Loading
  pod:            string;              // Port of Discharge
  fpod:           string;              // Final Place of Delivery
  rate20:         number;
  rate40:         number;
  rate40hc:       number;
  currency:       string | null;
  type:           string | null;
  ft:             number | null;       // Free Time days
  validity:       string;              // DATE stored as ISO string
  transit_time:   string | null;
  owner_uid:      string | null;       // UUID → auth.users
  created_by:     string | null;       // UUID → auth.users
  is_owner:       boolean | null;
  is_self_posted: boolean | null;
  status:         string | null;
  created_at:     string;
  updated_at:     string;
}
export type RateInsert = Partial<RateRow> & { id: string; sp: string; pol: string; pod: string; fpod: string; validity: string };
export type RateUpdate  = Partial<RateRow>;

// ─── AUCTIONS ────────────────────────────────────────────────────────────────
export interface AuctionRow {
  id:                   string;
  title:                string;
  rfq_id:               string | null;
  creator_uid:          string | null;  // UUID → auth.users
  creator_name:         string | null;
  creator_company:      string | null;
  auction_type:         string | null;
  start_date:           string | null;
  start_time:           string | null;
  duration_minutes:     number | null;
  end_date_time:        string | null;
  timezone:             string | null;
  status:               string | null;
  rank:                 string | null;
  time_left:            string | null;
  is_published:         boolean | null;
  published_at:         string | null;
  competition_ceiling:  number | null;
  bids_submitted_count: number | null;
  payment_status:       string | null;
  posting_fee_inr:      number | null;
  shipment:             Json;
  containers:           Json;
  origin_charges:       Json | null;
  destination_charges:  Json | null;
  created_at:           string;
  updated_at:           string;
}
export type AuctionInsert = Partial<AuctionRow> & { id: string; title: string };
export type AuctionUpdate  = Partial<AuctionRow>;

// ─── AUCTION BIDS ────────────────────────────────────────────────────────────
export interface AuctionBidRow {
  id:              string;
  auction_id:      string;
  bidder_uid:      string;            // UUID → auth.users (NOT bidder_id)
  bidder_name:     string | null;
  bidder_company:  string | null;
  amount:          number;
  currency:        string | null;
  transit_days:    number | null;
  free_days:       number | null;
  carrier:         string | null;
  routing:         string | null;
  remarks:         string | null;
  rank:            number | null;
  status:          string | null;
  details:         Json | null;
  submitted_at:    string;
  created_at:      string;
}
export type AuctionBidInsert = Partial<AuctionBidRow> & { id: string; auction_id: string; bidder_uid: string; amount: number };
export type AuctionBidUpdate  = Partial<AuctionBidRow>;

// ─── POSTS ───────────────────────────────────────────────────────────────────
export interface PostRow {
  id:              string;
  author_uid:      string;            // UUID → auth.users (NOT author_id)
  author_id:       string | null;     // Legacy alias column
  author_name:     string | null;
  author_company:  string | null;
  author_avatar:   string | null;
  content:         string;
  media_url:       string | null;
  media_type:      string | null;
  likes_count:     number | null;
  comments_count:  number | null;
  tags:            string[] | null;
  is_published:    boolean | null;
  created_at:      string;
  updated_at:      string;
}
export type PostInsert = Partial<PostRow> & { id: string; author_uid: string; content: string };
export type PostUpdate  = Partial<PostRow>;

// ─── COMMENTS ────────────────────────────────────────────────────────────────
export interface CommentRow {
  id:             string;
  post_id:        string;
  author_uid:     string;             // UUID → auth.users
  author_id:      string | null;      // Legacy alias
  author_name:    string | null;
  author_company: string | null;
  author_avatar:  string | null;
  content:        string;
  created_at:     string;
}
export type CommentInsert = Partial<CommentRow> & { id: string; post_id: string; author_uid: string; content: string };
export type CommentUpdate  = Partial<CommentRow>;

// ─── JOBS ────────────────────────────────────────────────────────────────────
export interface JobRow {
  id:           string;
  title:        string;
  company_id:   string | null;
  company_name: string | null;
  location:     string | null;
  job_type:     string | null;
  description:  string | null;
  requirements: string | null;
  salary_range: string | null;
  status:       string | null;
  created_at:   string;
  updated_at:   string;
}
export type JobInsert = Partial<JobRow> & { id: string; title: string };
export type JobUpdate  = Partial<JobRow>;

// ─── CASES ───────────────────────────────────────────────────────────────────
export interface CaseRow {
  id:          string;
  title:       string;
  description: string | null;
  user_id:     string | null;
  company_id:  string | null;
  category:    string | null;
  priority:    string | null;
  status:      string | null;
  metadata:    Json | null;
  created_at:  string;
  updated_at:  string;
}
export type CaseInsert = Partial<CaseRow> & { id: string; title: string };
export type CaseUpdate  = Partial<CaseRow>;

// ─── TRANSACTIONS ─────────────────────────────────────────────────────────────
export interface TransactionRow {
  id:          string;
  order_id:    string;
  payment_id:  string | null;
  user_id:     string | null;
  user_email:  string | null;
  amount:      number;
  currency:    string | null;
  plan_id:     string | null;
  item_type:   string | null;
  item_title:  string | null;
  status:      string | null;
  gateway:     string | null;
  raw_payload: Json | null;
  created_at:  string;
  updated_at:  string;
}
export type TransactionInsert = Partial<TransactionRow> & { id: string; order_id: string; amount: number };
export type TransactionUpdate  = Partial<TransactionRow>;

// ─── REVIEWS ─────────────────────────────────────────────────────────────────
export interface ReviewRow {
  id:                string;
  target_company_id: string;
  reviewer_id:       string | null;
  reviewer_name:     string | null;
  reviewer_company:  string | null;
  rating:            number;
  comment:           string | null;
  created_at:        string;
}
export type ReviewInsert = Partial<ReviewRow> & { id: string; target_company_id: string; rating: number };
export type ReviewUpdate  = Partial<ReviewRow>;

// ─── EVENTS ──────────────────────────────────────────────────────────────────
export interface EventRow {
  id:         string;
  event_type: string;
  user_id:    string | null;
  session_id: string | null;
  payload:    Json | null;
  timestamp:  string;
}
export type EventInsert = Partial<EventRow> & { event_type: string };
export type EventUpdate  = Partial<EventRow>;

// ─── INTENTS ─────────────────────────────────────────────────────────────────
export interface IntentRow {
  user_id:               string;
  recent_searched_ports: Json | null;
  viewed_rates:          Json | null;
  active_auction_routes: Json | null;
  saved_trade_lanes:     Json | null;
  followed_commodities:  Json | null;
  carrier_searches:      Json | null;
  last_active_at:        string;
  expires_at:            string | null;
}
export type IntentInsert = Partial<IntentRow> & { user_id: string };
export type IntentUpdate  = Partial<IntentRow>;

// ─── PRESENCE ────────────────────────────────────────────────────────────────
export interface PresenceRow {
  user_id:       string;
  online:        boolean;
  last_seen:     string;
  active_device: Json | null;
  status:        string;
  updated_at:    string;
}
export type PresenceInsert = Partial<PresenceRow> & { user_id: string };
export type PresenceUpdate  = Partial<PresenceRow>;

// ─── VERIFICATIONS ───────────────────────────────────────────────────────────
export interface VerificationRow {
  id:         string;
  token_hash: string;
  user_id:    string;
  email:      string;
  expires_at: string;
  used:       boolean;
  created_at: string;
}
export type VerificationInsert = Partial<VerificationRow> & { token_hash: string; user_id: string; email: string; expires_at: string };
export type VerificationUpdate  = Partial<VerificationRow>;

// ─── AUDIT LOGS ──────────────────────────────────────────────────────────────
export interface AuditLogRow {
  id:            string;
  actor_uid:     string | null;       // UUID → auth.users
  user_id:       string | null;       // Legacy alias as text
  action:        string;
  target_entity: string;
  target_id:     string;
  entity:        string | null;       // Legacy alias for target_entity
  entity_id:     string | null;       // Legacy alias for target_id
  old_data:      Json | null;
  new_data:      Json | null;
  metadata:      Json | null;
  ip_address:    string | null;
  user_agent:    string | null;
  created_at:    string;
}
export type AuditLogInsert = Partial<AuditLogRow> & { action: string; target_entity: string; target_id: string };
export type AuditLogUpdate  = Partial<AuditLogRow>;
