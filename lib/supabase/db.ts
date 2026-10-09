/**
 * lib/supabase/db.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase Database Service for FR8X.
 * Replaces Firestore operations with strongly-typed PostgreSQL queries,
 * transactions, and RLS enforcement.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { createClient } from './client';
import { UserProfile, RateItem, Auction, SubmittedBid, FeedPost } from '@/lib/types';

// Map database row (snake_case) to application UserProfile (camelCase)
export function mapRowToProfile(row: any): UserProfile {
  if (!row) return {} as UserProfile;
  const nameParts = (row.display_name || '').split(' ');
  return {
    uid: row.id,
    email: row.email,
    firstName: row.first_name || nameParts[0] || '',
    lastName: row.last_name || nameParts.slice(1).join(' ') || '',
    displayName: row.display_name || `${row.first_name || ''} ${row.last_name || ''}`.trim() || row.email,
    mobile: row.mobile || row.phone || '',
    phone: row.phone || row.mobile || '',
    isdCode: row.isd_code || '+91',
    whatsappSameAsMobile: row.whatsapp_same_as_mobile ?? true,
    designation: row.designation || row.position || '',
    position: row.position || row.designation || '',
    company: row.company_name || 'Enterprise Entity',
    companyName: row.company_name || 'Enterprise Entity',
    companyId: row.company_id || '',
    department: row.department || 'Logistics & Supply Chain',
    city: row.city || '',
    state: row.state || '',
    district: row.district || '',
    country: row.country || 'India',
    area: row.area || '',
    postalCode: row.postal_code || '',
    formattedAddress: row.formatted_address || row.address || '',
    address: row.address || row.formatted_address || '',
    location: row.location || [row.city, row.state, row.country].filter(Boolean).join(', ') || row.formatted_address || '',
    timezone: row.timezone || 'Asia/Kolkata',
    preferredContactMethod: 'email',
    contactAvailability: 'Anytime',
    avatarUrl: row.avatar_url || '',
    photoURL: row.avatar_url || '',
    companyLogoUrl: row.company_logo_url || '',
    role: row.role || 'user',
    plan: row.plan || 'trial',
    hasGoldenTick: Boolean(row.has_golden_tick),
    isVerified: Boolean(row.is_verified),
    email_verified: Boolean(row.email_verified),
    status: row.status || 'active',
    accountStatus: row.account_status || 'active',
    experiences: Array.isArray(row.experiences) ? row.experiences : [],
    educations: Array.isArray(row.educations) ? row.educations : [],
    certifications: Array.isArray(row.certifications) ? row.certifications : [],
    privacySettings: row.privacy_settings || {},
    contacts: Array.isArray(row.contacts) ? row.contacts : [],
    gstn: row.gstn || '',
    pan: row.pan || '',
    cin: row.cin || '',
    iec: row.iec || '',
    mto: row.mto || '',
    kycCountry: row.kyc_country || '',
    taxId: row.tax_id || '',
    taxIdLabel: row.tax_id_label || '',
    corporateRegNumber: row.corporate_reg_number || '',
    corporateRegLabel: row.corporate_reg_label || '',
    tradeCustomsCode: row.trade_customs_code || '',
    tradeCustomsLabel: row.trade_customs_label || '',
    logisticsLicenseNumber: row.logistics_license_number || '',
    logisticsLicenseLabel: row.logistics_license_label || '',
    statutoryCountry: row.statutory_country || '',
    iataCode: row.iata_code || '',
    fiataReg: row.fiata_reg || '',
    fmcNumber: row.fmc_number || '',
    aeoTier: row.aeo_tier || '',
    associationName: row.association_name || '',
    associationId: row.association_id || '',
    kycStatus: row.kyc_status || 'not_submitted',
    specializations: Array.isArray(row.specializations) ? row.specializations : [],
    skills: Array.isArray(row.skills) ? row.skills : [],
    languages: Array.isArray(row.languages) ? row.languages : [],
    keyTradeLanes: Array.isArray(row.key_trade_lanes) ? row.key_trade_lanes : [],
    summary: row.summary || '',
    bio: row.bio || '',
    createdAt: row.created_at || new Date().toISOString(),
    updatedAt: row.updated_at || new Date().toISOString(),
    lastLoginAt: row.last_login_at,
  };
}

// Map application UserProfile updates to PostgreSQL columns (snake_case)
export function mapProfileToRow(updates: Record<string, any>): Record<string, any> {
  const row: Record<string, any> = {};

  if (updates.email !== undefined) row.email = updates.email.trim().toLowerCase();
  if (updates.firstName !== undefined) row.first_name = updates.firstName;
  if (updates.lastName !== undefined) row.last_name = updates.lastName;
  if (updates.displayName !== undefined) row.display_name = updates.displayName;

  // Unify mobile and phone
  if (updates.mobile !== undefined || updates.phone !== undefined || updates.mobileNumber !== undefined) {
    const m = (updates.mobile !== undefined ? updates.mobile : (updates.phone !== undefined ? updates.phone : updates.mobileNumber)) || '';
    row.mobile = String(m).trim();
    row.phone = String(m).trim();
  }

  if (updates.isdCode !== undefined) row.isd_code = updates.isdCode;
  if (updates.whatsappSameAsMobile !== undefined) row.whatsapp_same_as_mobile = updates.whatsappSameAsMobile;

  // Unify designation and position
  if (updates.designation !== undefined || updates.position !== undefined) {
    const d = (updates.designation !== undefined ? updates.designation : updates.position) || '';
    row.designation = String(d).trim();
    row.position = String(d).trim();
  }

  if (updates.company !== undefined || updates.companyName !== undefined) {
    row.company_name = updates.companyName || updates.company;
  }
  if (updates.companyId !== undefined) row.company_id = updates.companyId;
  if (updates.department !== undefined) row.department = updates.department;

  if (updates.city !== undefined) row.city = String(updates.city).trim();
  if (updates.state !== undefined) row.state = String(updates.state).trim();
  if (updates.district !== undefined) row.district = String(updates.district).trim();
  if (updates.country !== undefined) row.country = String(updates.country).trim();
  if (updates.area !== undefined) row.area = updates.area;
  if (updates.postalCode !== undefined) row.postal_code = updates.postalCode;
  if (updates.postal_code !== undefined) row.postal_code = updates.postal_code;

  // Unify address, formattedAddress, and registeredAddress
  if (updates.formattedAddress !== undefined || updates.address !== undefined || updates.registeredAddress !== undefined) {
    const addr = updates.registeredAddress !== undefined ? updates.registeredAddress : (updates.formattedAddress !== undefined ? updates.formattedAddress : updates.address);
    row.formatted_address = String(addr).trim();
    row.address = String(addr).trim();
  }

  // Location string
  if (updates.location !== undefined) {
    row.location = String(updates.location).trim();
  } else if (row.city || row.state || row.country) {
    row.location = [row.city, row.state, row.country].filter(Boolean).join(', ');
  }

  if (updates.timezone !== undefined) row.timezone = updates.timezone;
  if (updates.preferredContactMethod !== undefined) row.preferred_contact_method = updates.preferredContactMethod;
  if (updates.contactAvailability !== undefined) row.contact_availability = updates.contactAvailability;
  if (updates.avatarUrl !== undefined || updates.photoURL !== undefined) {
    row.avatar_url = updates.avatarUrl !== undefined ? updates.avatarUrl : updates.photoURL;
  }
  if (updates.companyLogoUrl !== undefined) row.company_logo_url = updates.companyLogoUrl;
  if (updates.experiences !== undefined) row.experiences = updates.experiences;
  if (updates.educations !== undefined) row.educations = updates.educations;
  if (updates.certifications !== undefined) row.certifications = updates.certifications;
  if (updates.privacySettings !== undefined) row.privacy_settings = updates.privacySettings;
  if (updates.privacy_settings !== undefined) row.privacy_settings = updates.privacy_settings;
  if (updates.contacts !== undefined) row.contacts = updates.contacts;

  // Statutory & KYC fields
  if (updates.gstn !== undefined) row.gstn = updates.gstn;
  if (updates.pan !== undefined) row.pan = updates.pan;
  if (updates.cin !== undefined) row.cin = updates.cin;
  if (updates.iec !== undefined || updates.iecCode !== undefined) row.iec = updates.iec !== undefined ? updates.iec : updates.iecCode;
  if (updates.mto !== undefined || updates.mtoNumber !== undefined) row.mto = updates.mto !== undefined ? updates.mto : updates.mtoNumber;
  if (updates.role !== undefined) row.role = updates.role;
  if (updates.plan !== undefined) row.plan = updates.plan;
  if (updates.kycCountry !== undefined) row.kyc_country = updates.kycCountry;
  if (updates.taxId !== undefined) row.tax_id = updates.taxId;
  if (updates.taxIdLabel !== undefined) row.tax_id_label = updates.taxIdLabel;
  if (updates.corporateRegNumber !== undefined) row.corporate_reg_number = updates.corporateRegNumber;
  if (updates.corporateRegLabel !== undefined) row.corporate_reg_label = updates.corporateRegLabel;
  if (updates.tradeCustomsCode !== undefined) row.trade_customs_code = updates.tradeCustomsCode;
  if (updates.tradeCustomsLabel !== undefined) row.trade_customs_label = updates.tradeCustomsLabel;
  if (updates.logisticsLicenseNumber !== undefined) row.logistics_license_number = updates.logisticsLicenseNumber;
  if (updates.logisticsLicenseLabel !== undefined) row.logistics_license_label = updates.logisticsLicenseLabel;
  if (updates.statutoryCountry !== undefined) row.statutory_country = updates.statutoryCountry;
  if (updates.iataCode !== undefined) row.iata_code = updates.iataCode;
  if (updates.fiataReg !== undefined) row.fiata_reg = updates.fiataReg;
  if (updates.fmcNumber !== undefined) row.fmc_number = updates.fmcNumber;
  if (updates.aeoTier !== undefined) row.aeo_tier = updates.aeoTier;
  if (updates.associationName !== undefined) row.association_name = updates.associationName;
  if (updates.associationId !== undefined) row.association_id = updates.associationId;
  if (updates.kycStatus !== undefined) row.kyc_status = updates.kycStatus;

  if (updates.specializations !== undefined) row.specializations = updates.specializations;
  if (updates.skills !== undefined) row.skills = updates.skills;
  if (updates.languages !== undefined) row.languages = updates.languages;
  if (updates.keyTradeLanes !== undefined) row.key_trade_lanes = updates.keyTradeLanes;

  if (updates.summary !== undefined) row.summary = updates.summary;
  if (updates.bio !== undefined) row.bio = updates.bio;

  return row;
}


// ─── USER PROFILE SERVICE ────────────────────────────────────────────────────
export const profileService = {
  /**
   * Fetches profile by Supabase Auth user ID, legacy UID, or email from authoritative PostgreSQL table
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    if (!userId) return null;
    const cleanId = userId.trim();
    const supabase = createClient();

    let query = supabase.from('profiles').select('*');
    if (cleanId.includes('@')) {
      query = query.ilike('email', cleanId.toLowerCase());
    } else {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);
      if (isUuid) {
        query = query.eq('id', cleanId);
      } else {
        query = query.eq('uid', cleanId);
      }
    }

    const { data, error } = await query.maybeSingle();

    if (error || !data) {
      if (error && error.code !== 'PGRST116' && error.code !== 'PGRST205') {
        console.warn('[profileService] getProfile error:', error.message);
      }
      return null;
    }
    return mapRowToProfile(data);
  },

  /**
   * Updates profile in PostgreSQL and returns the freshly confirmed database row.
   * Eliminates the persistence bug by directly reading back the written record.
   * Performs an upsert if the record does not yet exist.
   */
  async updateProfile(
    userId: string,
    updates: Record<string, any>
  ): Promise<{ success: boolean; error?: string; user?: UserProfile }> {
    if (!userId) {
      return { success: false, error: 'User ID is required to update profile.' };
    }

    const cleanId = userId.trim();
    const supabase = createClient();
    const rowUpdates = mapProfileToRow(updates);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(cleanId);

    // 1. If UUID, attempt update by primary key
    if (isUuid) {
      let { data, error } = await supabase
        .from('profiles')
        .update(rowUpdates)
        .eq('id', cleanId)
        .select('*')
        .maybeSingle();

      if (!error && data) {
        return { success: true, user: mapRowToProfile(data) };
      }

      // Check for schema error (PGRST205 or schema cache missing)
      if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
        return {
          success: false,
          error: "Could not find the table 'public.profiles' in the schema cache. The PostgreSQL schema migration needs to be applied to Supabase.",
        };
      }

      // If record not found, perform upsert
      if (!data && !error) {
        const payload = {
          ...rowUpdates,
          id: cleanId,
          email: (updates.email || '').trim().toLowerCase() || `${cleanId}@fr8x.in`,
        };
        const upsertRes = await supabase
          .from('profiles')
          .upsert(payload, { onConflict: 'id' })
          .select('*')
          .maybeSingle();

        if (upsertRes.data) {
          return { success: true, user: mapRowToProfile(upsertRes.data) };
        }
        if (upsertRes.error) {
          console.error('[profileService] updateProfile upsert error:', upsertRes.error);
          const errMsg = (upsertRes.error.code === 'PGRST205' || upsertRes.error.message?.includes('schema cache'))
            ? "Could not find the table 'public.profiles' in the schema cache. The PostgreSQL schema migration needs to be applied to Supabase."
            : upsertRes.error.message;
          return { success: false, error: errMsg };
        }
      }

      if (error) {
        console.error('[profileService] updateProfile error:', error);
        return { success: false, error: error.message };
      }
    }

    // 2. Non-UUID lookup (legacy UID or email)
    let matchQuery = supabase.from('profiles').select('id');
    if (cleanId.includes('@')) {
      matchQuery = matchQuery.ilike('email', cleanId.toLowerCase());
    } else {
      matchQuery = matchQuery.eq('uid', cleanId);
    }

    const { data: matched } = await matchQuery.maybeSingle();
    const targetId = matched?.id;

    if (targetId) {
      const { data, error } = await supabase
        .from('profiles')
        .update(rowUpdates)
        .eq('id', targetId)
        .select('*')
        .single();

      if (error) {
        return { success: false, error: error.message };
      }
      return { success: true, user: mapRowToProfile(data) };
    }

    // 3. Fallback to API route for server-side elevated execution
    try {
      const apiRes = await fetch('/api/user/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid: cleanId, ...updates }),
      });
      if (apiRes.ok) {
        const apiData = await apiRes.json();
        if (apiData.success && apiData.user) {
          return { success: true, user: apiData.user };
        }
      }
    } catch {}

    return { success: false, error: 'User record not found to update.' };
  },
};

// ─── CONNECTIONS SERVICE ─────────────────────────────────────────────────────
export const connectionDbService = {
  async getConnections(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('connections')
      .select('*')
      .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
      .eq('status', 'accepted');

    if (error) return [];
    return data || [];
  },

  async sendConnectionRequest(requesterId: string, recipientId: string, note?: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('connections')
      .upsert({
        requester_id: requesterId,
        recipient_id: recipientId,
        status: 'pending',
        note: note || null,
        updated_at: new Date().toISOString(),
      }, { onConflict: 'requester_id,recipient_id' })
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, connection: data };
  },

  async respondToRequest(connectionId: string, status: 'accepted' | 'declined') {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('connections')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', connectionId)
      .select()
      .single();

    if (error) return { success: false, error: error.message };
    return { success: true, connection: data };
  },
};

// ─── NOTIFICATIONS SERVICE ───────────────────────────────────────────────────
export const notificationDbService = {
  async getNotifications(userId: string) {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) return [];
    return data || [];
  },

  async markAsRead(notificationId: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId);

    return !error;
  },
};


// ─── RATES SERVICE ───────────────────────────────────────────────────────────
export const rateDbService = {
  async getRates(): Promise<RateItem[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('rates')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[rateDbService] getRates error:', error.message);
      return [];
    }

    return (data || []).map((r: any) => ({
      id: r.id,
      sp: r.sp,
      line: r.line,
      por: r.por,
      pol: r.pol,
      pod: r.pod,
      fpod: r.fpod,
      rate20: Number(r.rate20),
      rate40: Number(r.rate40),
      rate40hc: Number(r.rate40hc),
      currency: r.currency,
      type: r.type,
      ft: r.ft,
      validity: r.validity,
      transitTime: r.transit_time,
      ownerUid: r.owner_uid,
      createdBy: r.created_by,
      isOwner: r.is_owner,
      isSelfPosted: r.is_self_posted,
      status: r.status,
      createdAt: r.created_at,
      updatedAt: r.updated_at,
    }));
  },

  async upsertRate(rate: Partial<RateItem>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase.from('rates').upsert({
      id: rate.id,
      sp: rate.sp || '',
      line: rate.carrier || (rate as any).line || '',
      por: rate.por || '',
      pol: rate.pol || '',
      pod: rate.pod || '',
      fpod: rate.fpod || '',
      rate20: rate.d20 ?? (rate as any).rate20 ?? 0,
      rate40: rate.h40 ?? (rate as any).rate40 ?? 0,
      rate40hc: rate.h40 ?? (rate as any).rate40hc ?? 0,
      currency: (rate as any).currency || 'USD',
      type: rate.rateType || (rate as any).type || 'Direct Spot',
      ft: rate.ft || '14 days',
      validity: rate.valid || rate.validityTo || (rate as any).validity || '',
      transit_time: rate.tt || (rate as any).transitTime || '',
      status: rate.status || 'active',
      is_owner: true,
      is_self_posted: true,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async deleteRate(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('rates').delete().eq('id', id);
    return !error;
  },
};

// ─── AUCTIONS SERVICE ────────────────────────────────────────────────────────
export const auctionDbService = {
  async getAuctions(): Promise<Auction[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('auctions')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.warn('[auctionDbService] getAuctions error:', error.message);
      return [];
    }

    return (data || []).map((a: any) => ({
      id: a.id,
      title: a.title,
      rfqId: a.rfq_id,
      creatorUid: a.creator_uid,
      creatorName: a.creator_name,
      creatorCompany: a.creator_company,
      auctionType: a.auction_type,
      startDate: a.start_date,
      startTime: a.start_time,
      durationMinutes: a.duration_minutes,
      endDateTime: a.end_date_time,
      timezone: a.timezone,
      status: a.status,
      rank: a.rank,
      timeLeft: a.time_left,
      isPublished: a.is_published,
      competitionCeiling: a.competition_ceiling ? Number(a.competition_ceiling) : undefined,
      bidsSubmittedCount: a.bids_submitted_count || 0,
      paymentStatus: a.payment_status,
      postingFeeINR: a.posting_fee_inr,
      shipment: a.shipment || {},
      containers: a.containers || [],
      originCharges: a.origin_charges || {},
      destinationCharges: a.destination_charges || {},
      createdAt: a.created_at,
      updatedAt: a.updated_at,
    }));
  },

  async upsertAuction(auction: Partial<Auction>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase.from('auctions').upsert({
      id: auction.id,
      title: auction.title,
      rfq_id: auction.rfqId,
      creator_name: auction.creatorName,
      creator_company: auction.creatorCompany,
      auction_type: auction.auctionType || 'Specific bidder',
      start_date: auction.startDate,
      start_time: auction.startTime,
      duration_minutes: auction.durationMinutes || 120,
      end_date_time: auction.endDateTime,
      timezone: auction.timezone || 'Asia/Kolkata',
      status: auction.status || 'Draft',
      competition_ceiling: auction.competitionCeiling,
      bids_submitted_count: auction.bidsSubmittedCount || 0,
      payment_status: auction.paymentStatus || 'unpaid',
      posting_fee_inr: auction.postingFeeINR || 300,
      shipment: auction.shipment || {},
      containers: auction.containers || [],
      origin_charges: auction.originCharges || {},
      destination_charges: auction.destinationCharges || {},
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async submitBid(bid: Partial<SubmittedBid> & { auctionId: string }): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase.from('auction_bids').insert({
      id: bid.id || `bid-${Date.now()}`,
      auction_id: bid.auctionId,
      bidder_uid: bid.bidderUid,
      bidder_name: bid.bidderName,
      bidder_company: bid.bidderCompany,
      amount: (bid as any).amount || bid.grandTotalUSD || 0,
      currency: bid.currency || 'USD',
      transit_days: (bid as any).transitDays || null,
      free_days: (bid as any).freeDays || null,
      carrier: (bid as any).carrier || null,
      routing: (bid as any).routing || null,
      remarks: (bid as any).remarks || null,
      details: bid,
    });

    if (error) return { success: false, error: error.message };
    return { success: true };
  },
};

// ─── POSTS SERVICE ───────────────────────────────────────────────────────────
export const postDbService = {
  async getPosts(): Promise<FeedPost[]> {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) return [];
    return (data || []).map((p: any) => ({
      id: p.id,
      authorUid: p.author_uid,
      authorName: p.author_name,
      authorCompany: p.author_company,
      authorAvatar: p.author_avatar,
      content: p.content,
      mediaUrl: p.media_url,
      mediaType: p.media_type,
      likesCount: p.likes_count,
      commentsCount: p.comments_count,
      tags: p.tags,
      createdAt: p.created_at,
    }));
  },

  async upsertPost(post: Partial<FeedPost>): Promise<{ success: boolean; error?: string }> {
    const supabase = createClient();
    const { error } = await supabase.from('posts').upsert({
      id: post.id,
      author_uid: post.authorUid,
      author_name: post.author || (post as any).authorName || 'Member',
      author_company: post.authorCompany || '',
      author_avatar: post.authorPhotoUrl || (post as any).authorAvatar || '',
      content: post.text || (post as any).content || '',
      media_url: (post as any).mediaUrl || null,
      media_type: (post as any).mediaType || null,
      tags: post.tags || [],
    });
    if (error) return { success: false, error: error.message };
    return { success: true };
  },

  async deletePost(id: string): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.from('posts').delete().eq('id', id);
    return !error;
  },
};
