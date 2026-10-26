/**
 * lib/connections-backend.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * FR8X Authoritative Connections & Notifications Enterprise Engine
 *
 * Implements real-world multi-user networking persistence for 1000s of users.
 * Supports:
 *   1. Supabase PostgreSQL `public.connections` and `public.notifications` tables
 *   2. Authenticated user SSR cookies via createServerSupabaseClient
 *   3. Service-role admin client when configured
 *   4. Multi-process persistent disk storage (`data/connections_store.json`)
 *   5. In-memory synchronization with `peopleDirectoryStore`
 *   6. Cross-account instant delivery without mock or dummy data
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { NextRequest } from 'next/server';
import { authenticateUserSession } from '@/lib/auth-guard';
import {
  createClient as createSupabaseServerClient,
  createAdminClient,
  getDbClient,
} from '@/lib/supabase/server';
import { peopleDirectoryStore, DirectoryMember } from '@/lib/people-directory';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { resolveDisplayName } from '@/lib/utils';

export interface PersistentConnectionRecord {
  id: string;
  requester_id: string;
  recipient_id: string;
  receiver_id: string;
  requester_aliases?: string[];
  recipient_aliases?: string[];
  status: 'pending' | 'accepted' | 'rejected' | 'cancelled' | 'withdrawn' | 'blocked' | 'hold';
  note?: string | null;
  message?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PersistentNotificationRecord {
  id: string;
  user_id: string;
  type: string;
  category?: string;
  title: string;
  message?: string;
  description?: string;
  target_url?: string;
  link?: string;
  related_id?: string;
  read: boolean;
  metadata?: Record<string, any>;
  created_at: string;
}

export interface NormalizedProfileData {
  id: string;
  uid: string;
  full_name: string;
  display_name: string;
  first_name?: string;
  last_name?: string;
  headline: string;
  designation: string;
  company: string;
  company_name: string;
  location: string;
  city?: string;
  state?: string;
  country?: string;
  avatar_url?: string | null;
  is_verified?: boolean;
  has_golden_tick?: boolean;
  email?: string;
}

// ── Persistent Storage on Disk ───────────────────────────────────────────────
const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'connections_store.json');

interface DiskStoreSchema {
  connections: PersistentConnectionRecord[];
  notifications: PersistentNotificationRecord[];
  lastUpdated: string;
}

function loadDiskStore(): DiskStoreSchema {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const raw = fs.readFileSync(STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed?.connections) && Array.isArray(parsed?.notifications)) {
        return parsed;
      }
    }
  } catch {
    // ignore read error
  }
  return { connections: [], notifications: [], lastUpdated: new Date().toISOString() };
}

function saveDiskStore(store: DiskStoreSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    store.lastUpdated = new Date().toISOString();
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Non-blocking write failure (e.g. read-only serverless environment)
  }
}

// Memory mirrors
let memoryConnections: PersistentConnectionRecord[] = [];
let memoryNotifications: PersistentNotificationRecord[] = [];
let isInitialized = false;

function initStore() {
  if (isInitialized) return;
  const disk = loadDiskStore();
  memoryConnections = disk.connections;
  memoryNotifications = disk.notifications;
  isInitialized = true;
}

function getEffectiveSupabaseClient(userToken?: string) {
  const admin = createAdminClient();
  if (admin) return admin;
  if (userToken) return getDbClient(userToken);
  try {
    return createSupabaseServerClient() || getDbClient();
  } catch {
    return getDbClient();
  }
}

/**
 * Fast network timeout wrapper — guarantees server operations never hang
 * on unreachable external database sockets.
 */
export async function queryWithTimeout<T = any>(promise: Promise<any>, ms = 1200, fallback: T = { data: null, error: true } as unknown as T): Promise<T> {
  let timer: any;
  const timeoutPromise = new Promise<T>((resolve) => {
    timer = setTimeout(() => resolve(fallback), ms);
  });
  try {
    const res = await Promise.race([promise, timeoutPromise]);
    clearTimeout(timer);
    return res as T;
  } catch {
    clearTimeout(timer);
    return fallback;
  }
}

/**
 * Resolves request from shared Supabase table with strict timeout to prevent hangs.
 */
async function findConnectionInSupabase(requestId: string, userToken?: string): Promise<PersistentConnectionRecord | undefined> {
  try {
    const client = getEffectiveSupabaseClient(userToken);
    const query = client
      .from('connections')
      .select('id, requester_id, recipient_id, receiver_id, status, note, created_at, updated_at')
      .eq('id', requestId)
      .maybeSingle();

    const res: any = await queryWithTimeout(query, 1200, { data: null, error: true });
    const data = res?.data;
    const error = res?.error;

    if (error || !data) return undefined;

    return {
      id: data.id,
      requester_id: data.requester_id,
      recipient_id: data.recipient_id || data.receiver_id || '',
      receiver_id: data.receiver_id || data.recipient_id || '',
      status: data.status,
      note: data.note,
      created_at: data.created_at,
      updated_at: data.updated_at || data.created_at,
    } as PersistentConnectionRecord;
  } catch {
    return undefined;
  }
}

// ── User Resolution ──────────────────────────────────────────────────────────
export async function resolveCallerIdentity(req: NextRequest): Promise<{
  userId: string | null;
  token?: string;
  userEmail?: string;
  profile?: any;
}> {
  // 1. Session Guard check
  const { authenticated, user } = authenticateUserSession(req);
  if (authenticated && user?.uid) {
    return {
      userId: user.uid,
      token: user.token,
      userEmail: user.email,
      profile: user,
    };
  }

  // 2. Direct Supabase server auth check
  try {
    const supabase = createSupabaseServerClient();
    const {
      data: { user: sbUser },
    } = await supabase.auth.getUser();
    if (sbUser?.id) {
      return {
        userId: sbUser.id,
        userEmail: sbUser.email,
        profile: sbUser.user_metadata,
      };
    }
  } catch {
    // Continue
  }

  // 3. Direct header check fallback (x-fr8x-user-uid / x-fr8x-session)
  const headerUid = req.headers.get('x-fr8x-user-uid') || req.headers.get('x-fr8x-session');
  if (headerUid && headerUid.trim()) {
    const cleanUid = headerUid.trim();
    const prof = await lookupProfileById(cleanUid);
    return {
      userId: cleanUid,
      userEmail: prof?.email || `${cleanUid}@fr8x.in`,
      profile: prof,
    };
  }

  return { userId: null };
}

// ── Profile Normalization & Hydration ────────────────────────────────────────
export function normalizeMemberProfile(raw: any, fallbackId?: string): NormalizedProfileData {
  if (!raw) {
    return {
      id: fallbackId || '',
      uid: fallbackId || '',
      full_name: 'Freight Professional',
      display_name: 'Freight Professional',
      headline: 'Freight Professional',
      designation: 'Freight Professional',
      company: 'Enterprise Logistics',
      company_name: 'Enterprise Logistics',
      location: 'India',
      city: 'Mumbai',
      country: 'India',
      avatar_url: null,
      is_verified: false,
      has_golden_tick: false,
    };
  }

  const rawFirst = raw.first_name || raw.firstName || '';
  const rawLast = raw.last_name || raw.lastName || '';
  const rawDisplay = raw.display_name || raw.displayName || '';
  const fullName = resolveDisplayName({
    firstName: rawFirst,
    lastName: rawLast,
    displayName: rawDisplay,
    email: raw.email,
  }, 'Freight Professional');

  const designation =
    raw.designation ||
    raw.position ||
    raw.headline ||
    'Freight Professional';

  const company =
    raw.company_name ||
    raw.company ||
    raw.companyName ||
    'Enterprise Logistics';

  const city = raw.city || '';
  const state = raw.state || '';
  const country = raw.country || 'India';
  const location =
    raw.location ||
    [city, state, country].filter(Boolean).join(', ') ||
    'India';

  return {
    id: raw.id || raw.uid || fallbackId || '',
    uid: raw.uid || raw.id || fallbackId || '',
    full_name: fullName,
    display_name: fullName,
    first_name: rawFirst || fullName.split(' ')[0],
    last_name: rawLast || (fullName.split(' ').length > 1 ? fullName.split(' ').slice(1).join(' ') : ''),
    headline: designation,
    designation,
    company,
    company_name: company,
    location,
    city,
    state,
    country,
    avatar_url: raw.avatar_url || raw.avatarUrl || null,
    is_verified: Boolean(raw.is_verified || raw.isVerified || raw.email_verified),
    has_golden_tick: Boolean(raw.has_golden_tick || raw.hasGoldenTick || raw.plan === 'premium'),
    email: raw.email || '',
  };
}

export async function lookupProfileById(userId: string, userToken?: string): Promise<NormalizedProfileData> {
  if (!userId) return normalizeMemberProfile(null, userId);

  // 1. Check in-memory peopleDirectoryStore
  const mem = peopleDirectoryStore.getMemberById(userId);
  if (mem) {
    return normalizeMemberProfile(mem, userId);
  }

  // 2. Check serverSecurityStore
  const secUser = serverSecurityStore.getUser(userId) || serverSecurityStore.getUserByEmailOrUid(userId);
  if (secUser) {
    return normalizeMemberProfile(secUser, userId);
  }

  // 3. Query Supabase profiles table
  try {
    const client = getEffectiveSupabaseClient(userToken);

    const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);
    let q = client.from('profiles').select('*');
    if (isUuid) {
      q = q.eq('id', userId);
    } else if (userId.includes('@')) {
      q = q.ilike('email', userId.trim().toLowerCase());
    } else {
      q = q.or(`uid.eq.${userId},id.eq.${userId}`);
    }

    const { data, error } = await queryWithTimeout(q.maybeSingle(), 1000, { data: null, error: true });
    if (!error && data) {
      return normalizeMemberProfile(data, userId);
    }
  } catch {
    // fallback
  }

  return normalizeMemberProfile(null, userId);
}

export async function lookupProfilesBatch(
  userIds: string[],
  userToken?: string
): Promise<Map<string, NormalizedProfileData>> {
  const profileMap = new Map<string, NormalizedProfileData>();
  if (!userIds || userIds.length === 0) return profileMap;

  const uniqueIds = Array.from(new Set(userIds.map((id) => (id || '').trim()).filter(Boolean)));
  const pendingIds: string[] = [];

  for (const id of uniqueIds) {
    // 1. Check in-memory peopleDirectoryStore
    const mem = peopleDirectoryStore.getMemberById(id);
    if (mem) {
      profileMap.set(id, normalizeMemberProfile(mem, id));
      continue;
    }
    // 2. Check serverSecurityStore
    const secUser = serverSecurityStore.getUser(id) || serverSecurityStore.getUserByEmailOrUid(id);
    if (secUser) {
      profileMap.set(id, normalizeMemberProfile(secUser, id));
      continue;
    }
    pendingIds.push(id);
  }

  if (pendingIds.length === 0) {
    return profileMap;
  }

  // 3. Batch query Supabase profiles table in one shot with fast timeout
  try {
    const client = getEffectiveSupabaseClient(userToken);
    const uuids = pendingIds.filter((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    );
    const emails = pendingIds.filter((id) => id.includes('@'));
    const others = pendingIds.filter(
      (id) => !uuids.includes(id) && !emails.includes(id)
    );

    const queryPromises: Promise<any>[] = [];

    if (uuids.length > 0) {
      queryPromises.push(client.from('profiles').select('*').in('id', uuids));
    }
    if (emails.length > 0) {
      queryPromises.push(client.from('profiles').select('*').in('email', emails.map((e) => e.toLowerCase())));
    }
    if (others.length > 0) {
      queryPromises.push(client.from('profiles').select('*').in('uid', others));
    }

    const results: any[] = await queryWithTimeout<any[]>(Promise.all(queryPromises), 1200, []);
    for (const res of results) {
      if (res && !res.error && Array.isArray(res.data)) {
        for (const row of res.data) {
          const prof = normalizeMemberProfile(row, row.id || row.uid);
          if (row.id) profileMap.set(row.id, prof);
          if (row.uid) profileMap.set(row.uid, prof);
          if (row.email) profileMap.set(row.email.toLowerCase(), prof);
        }
      }
    }
  } catch (err) {
    console.warn('[ConnectionsBackend] Batch lookup error:', err);
  }

  // Fallback for any IDs still not found
  for (const id of uniqueIds) {
    if (!profileMap.has(id)) {
      profileMap.set(id, normalizeMemberProfile(null, id));
    }
  }

  return profileMap;
}

export async function resolveUserAliases(userId: string, userToken?: string): Promise<string[]> {
  const aliases = new Set<string>();
  if (!userId) return [];
  aliases.add(userId);

  try {
    const prof = await lookupProfileById(userId, userToken);
    if (prof.id) aliases.add(prof.id);
    if (prof.uid) aliases.add(prof.uid);
    if (prof.email) aliases.add(prof.email.toLowerCase());
  } catch {}

  const mem = peopleDirectoryStore.getMemberById(userId);
  if (mem) {
    if (mem.id) aliases.add(mem.id);
    if (mem.email) aliases.add(mem.email.toLowerCase());
  }

  const sec = serverSecurityStore.getUser(userId) || serverSecurityStore.getUserByEmailOrUid(userId);
  if (sec) {
    if (sec.uid) aliases.add(sec.uid);
    if (sec.email) aliases.add(sec.email.toLowerCase());
  }

  return Array.from(aliases).filter(Boolean);
}

// ── GET Connections Tabs ─────────────────────────────────────────────────────

export async function getIncomingRequestsForUser(userId: string, limit = 50, userToken?: string) {
  initStore();
  const results: any[] = [];
  const seenIds = new Set<string>();
  const resolvedIds = new Set<string>();
  const acceptedPartnerIds = new Set<string>();
  const aliases = await resolveUserAliases(userId, userToken);
  const aliasSet = new Set(aliases.map((a) => a.toLowerCase()));

  // 0. Pre-scan disk store to identify all resolved requests and accepted partners
  const disk = loadDiskStore();
  for (const c of disk.connections) {
    const reqId = (c.requester_id || '').toLowerCase();
    const recId = (c.recipient_id || c.receiver_id || '').toLowerCase();
    const reqAliases = (c.requester_aliases || []).map((a) => a.toLowerCase());
    const recAliases = (c.recipient_aliases || []).map((a) => a.toLowerCase());

    const isUserInvolved =
      aliasSet.has(reqId) ||
      aliasSet.has(recId) ||
      reqAliases.some((a) => aliasSet.has(a)) ||
      recAliases.some((a) => aliasSet.has(a));

    if (isUserInvolved) {
      if (c.status === 'accepted') {
        const partner = aliasSet.has(recId) || recAliases.some((a) => aliasSet.has(a)) ? reqId : recId;
        if (partner) acceptedPartnerIds.add(partner.toLowerCase());
        resolvedIds.add(c.id);
      } else if (['cancelled', 'withdrawn', 'declined', 'rejected'].includes(c.status as string)) {
        resolvedIds.add(c.id);
      }
    }
  }

  // Also include accepted connections from in-memory directory store
  for (const alias of aliases) {
    for (const memConn of peopleDirectoryStore.getConnections(alias)) {
      if (memConn?.id) acceptedPartnerIds.add(memConn.id.toLowerCase());
    }
  }

  // 1. Authoritative Supabase query from `connections` table (with fast timeout)
  let dbRows: any[] = [];
  try {
    const client = getEffectiveSupabaseClient(userToken);

    const orClauses: string[] = [];
    for (const a of aliases) {
      orClauses.push(`recipient_id.eq.${a}`);
      orClauses.push(`receiver_id.eq.${a}`);
    }

    const query = client
      .from('connections')
      .select('id, requester_id, recipient_id, receiver_id, status, note, created_at, updated_at')
      .or(orClauses.join(','))
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data, error: dbErr } = await queryWithTimeout(query, 1200, { data: null, error: true });

    if (!dbErr && Array.isArray(data)) {
      dbRows = data;
    }
  } catch (err) {
    console.warn('[ConnectionsBackend] Supabase incoming query warning:', err);
  }

  // 2. Disk store candidates with deep alias matching
  const diskCandidates = disk.connections.filter((c) => {
    const recId = (c.recipient_id || '').toLowerCase();
    const recvId = (c.receiver_id || '').toLowerCase();
    const recAliases = (c.recipient_aliases || []).map((a) => a.toLowerCase());
    const isTarget =
      aliasSet.has(recId) ||
      aliasSet.has(recvId) ||
      recAliases.some((a) => aliasSet.has(a)) ||
      (c.recipient_id && c.recipient_id.toLowerCase() === userId.toLowerCase()) ||
      (c.receiver_id && c.receiver_id.toLowerCase() === userId.toLowerCase());
    return isTarget && c.status === 'pending';
  });

  // Batch resolve all needed requester profiles in a single query
  const allRequesterIds = [
    ...dbRows.map((r) => r.requester_id),
    ...diskCandidates.map((c) => c.requester_id),
  ].filter(Boolean);
  const profileMap = await lookupProfilesBatch(allRequesterIds, userToken);

  for (const row of dbRows) {
    if (!row.id || seenIds.has(row.id) || resolvedIds.has(row.id)) continue;
    const senderId = (row.requester_id || '').toLowerCase();
    if (acceptedPartnerIds.has(senderId)) continue;

    seenIds.add(row.id);
    const reqProfile = profileMap.get(row.requester_id) || normalizeMemberProfile(null, row.requester_id);
    results.push({
      id: row.id,
      message: row.note || '',
      created_at: row.created_at || new Date().toISOString(),
      status: 'pending',
      requester_id: row.requester_id,
      recipient_id: row.recipient_id || row.receiver_id || userId,
      profiles: reqProfile,
    });

    upsertMemoryConnection({
      id: row.id,
      requester_id: row.requester_id,
      recipient_id: row.recipient_id || userId,
      receiver_id: row.receiver_id || userId,
      status: 'pending',
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at || row.created_at,
    });
  }

  for (const c of diskCandidates) {
    if (seenIds.has(c.id) || resolvedIds.has(c.id)) continue;
    const senderId = (c.requester_id || '').toLowerCase();
    if (acceptedPartnerIds.has(senderId)) continue;

    seenIds.add(c.id);
    const reqProfile = profileMap.get(c.requester_id) || normalizeMemberProfile(null, c.requester_id);
    results.push({
      id: c.id,
      message: c.note || c.message || '',
      created_at: c.created_at,
      status: 'pending',
      requester_id: c.requester_id,
      recipient_id: c.recipient_id || userId,
      profiles: reqProfile,
    });
  }

  // 3. Merge from peopleDirectoryStore in-memory fallback
  for (const alias of aliases) {
    const memIncoming = peopleDirectoryStore.getIncoming(alias);
    for (const m of memIncoming) {
      if (seenIds.has(m.id) || resolvedIds.has(m.id)) continue;
      const senderId = (m.requester?.id || m.requester_id || '').toLowerCase();
      if (acceptedPartnerIds.has(senderId) || peopleDirectoryStore.isConnected(alias, senderId)) {
        m.status = 'accepted';
        continue;
      }
      if (m.status !== 'pending' && m.status !== 'hold') continue;

      seenIds.add(m.id);
      results.push({
        id: m.id,
        message: m.message || '',
        created_at: m.created_at,
        status: m.status,
        requester_id: m.requester?.id || '',
        recipient_id: userId,
        profiles: normalizeMemberProfile(m.requester),
      });
    }
  }

  return results.slice(0, limit);
}

export async function getOutgoingRequestsForUser(userId: string, limit = 50, userToken?: string) {
  initStore();
  const results: any[] = [];
  const seenIds = new Set<string>();
  const resolvedIds = new Set<string>();
  const acceptedPartnerIds = new Set<string>();
  const aliases = await resolveUserAliases(userId, userToken);
  const aliasSet = new Set(aliases.map((a) => a.toLowerCase()));

  // 0. Pre-scan disk store to identify all resolved requests and accepted partners
  const disk = loadDiskStore();
  for (const c of disk.connections) {
    const reqId = (c.requester_id || '').toLowerCase();
    const recId = (c.recipient_id || c.receiver_id || '').toLowerCase();
    const reqAliases = (c.requester_aliases || []).map((a) => a.toLowerCase());
    const recAliases = (c.recipient_aliases || []).map((a) => a.toLowerCase());

    const isUserInvolved =
      aliasSet.has(reqId) ||
      aliasSet.has(recId) ||
      reqAliases.some((a) => aliasSet.has(a)) ||
      recAliases.some((a) => aliasSet.has(a));

    if (isUserInvolved) {
      if (c.status === 'accepted') {
        const partner = aliasSet.has(reqId) || reqAliases.some((a) => aliasSet.has(a)) ? recId : reqId;
        if (partner) acceptedPartnerIds.add(partner.toLowerCase());
        resolvedIds.add(c.id);
      } else if (['cancelled', 'withdrawn', 'declined', 'rejected'].includes(c.status as string)) {
        resolvedIds.add(c.id);
      }
    }
  }

  // Also include accepted connections from in-memory directory store
  for (const alias of aliases) {
    for (const memConn of peopleDirectoryStore.getConnections(alias)) {
      if (memConn?.id) acceptedPartnerIds.add(memConn.id.toLowerCase());
    }
  }

  // 1. Authoritative Supabase query from `connections` table (with fast timeout)
  let dbRows: any[] = [];
  try {
    const client = getEffectiveSupabaseClient(userToken);
    const orClauses = aliases.map((a) => `requester_id.eq.${a}`).join(',');

    const query = client
      .from('connections')
      .select('id, requester_id, recipient_id, receiver_id, status, note, created_at, updated_at')
      .or(orClauses)
      .in('status', ['pending', 'hold'])
      .order('created_at', { ascending: false })
      .limit(limit);

    const { data, error: dbErr } = await queryWithTimeout(query, 1200, { data: null, error: true });

    if (!dbErr && Array.isArray(data)) {
      dbRows = data;
    }
  } catch (err) {
    console.warn('[ConnectionsBackend] Supabase outgoing query warning:', err);
  }

  // 2. Disk store candidates with deep alias matching
  const diskCandidates = disk.connections.filter((c) => {
    const reqId = (c.requester_id || '').toLowerCase();
    const reqAliases = (c.requester_aliases || []).map((a) => a.toLowerCase());
    const isSender =
      aliasSet.has(reqId) ||
      reqAliases.some((a) => aliasSet.has(a)) ||
      (c.requester_id && c.requester_id.toLowerCase() === userId.toLowerCase());
    return isSender && (c.status === 'pending' || c.status === 'hold');
  });

  // Batch resolve all needed recipient profiles in a single query
  const allRecipientIds = [
    ...dbRows.map((r) => r.recipient_id || r.receiver_id),
    ...diskCandidates.map((c) => c.recipient_id || c.receiver_id),
  ].filter(Boolean);
  const profileMap = await lookupProfilesBatch(allRecipientIds, userToken);

  for (const row of dbRows) {
    if (!row.id || seenIds.has(row.id) || resolvedIds.has(row.id)) continue;
    const targetId = row.recipient_id || row.receiver_id;
    if (!targetId || acceptedPartnerIds.has(targetId.toLowerCase())) continue;

    seenIds.add(row.id);
    const recProfile = profileMap.get(targetId) || normalizeMemberProfile(null, targetId);
    results.push({
      id: row.id,
      message: row.note || '',
      created_at: row.created_at || new Date().toISOString(),
      status: row.status || 'pending',
      requester_id: userId,
      recipient_id: targetId,
      profiles: recProfile,
    });

    upsertMemoryConnection({
      id: row.id,
      requester_id: userId,
      recipient_id: targetId,
      receiver_id: targetId,
      status: (row.status as any) || 'pending',
      note: row.note,
      created_at: row.created_at,
      updated_at: row.updated_at || row.created_at,
    });
  }

  for (const c of diskCandidates) {
    if (seenIds.has(c.id) || resolvedIds.has(c.id)) continue;
    const targetId = c.recipient_id || c.receiver_id;
    if (!targetId || acceptedPartnerIds.has(targetId.toLowerCase())) continue;

    seenIds.add(c.id);
    const recProfile = profileMap.get(targetId) || normalizeMemberProfile(null, targetId);
    results.push({
      id: c.id,
      message: c.note || c.message || '',
      created_at: c.created_at,
      status: c.status,
      requester_id: userId,
      recipient_id: targetId,
      profiles: recProfile,
    });
  }

  // 3. Merge from peopleDirectoryStore fallback
  for (const alias of aliases) {
    const memOutgoing = peopleDirectoryStore.getOutgoing(alias);
    for (const m of memOutgoing) {
      if (seenIds.has(m.id) || resolvedIds.has(m.id)) continue;
      const targetId = (m.recipient?.id || m.recipient_id || '').toLowerCase();
      if (acceptedPartnerIds.has(targetId) || peopleDirectoryStore.isConnected(alias, targetId)) {
        m.status = 'accepted';
        continue;
      }
      if (m.status !== 'pending' && m.status !== 'hold') continue;

      seenIds.add(m.id);
      results.push({
        id: m.id,
        message: m.message || '',
        created_at: m.created_at,
        status: m.status,
        requester_id: userId,
        recipient_id: m.recipient?.id || '',
        profiles: normalizeMemberProfile(m.recipient),
      });
    }
  }

  return results.slice(0, limit);
}

export async function getAcceptedConnectionsForUser(userId: string, limit = 100, userToken?: string) {
  initStore();
  const results: any[] = [];
  const seenTargets = new Set<string>();
  const aliases = await resolveUserAliases(userId, userToken);
  const aliasSet = new Set(aliases.map((a) => a.toLowerCase()));

  // 1. Authoritative Supabase query from `connections` table (with fast timeout)
  let dbRows: any[] = [];
  try {
    const client = getEffectiveSupabaseClient(userToken);

    const orClauses: string[] = [];
    for (const a of aliases) {
      orClauses.push(`requester_id.eq.${a}`);
      orClauses.push(`recipient_id.eq.${a}`);
      orClauses.push(`receiver_id.eq.${a}`);
    }

    const query = client
      .from('connections')
      .select('id, requester_id, recipient_id, receiver_id, status, created_at, updated_at')
      .or(orClauses.join(','))
      .eq('status', 'accepted')
      .order('updated_at', { ascending: false })
      .limit(limit);

    const { data, error: dbErr } = await queryWithTimeout(query, 1200, { data: null, error: true });

    if (!dbErr && Array.isArray(data)) {
      dbRows = data;
    }
  } catch (err) {
    console.warn('[ConnectionsBackend] Supabase connections query warning:', err);
  }

  // 2. Disk store candidates with deep alias matching
  const disk = loadDiskStore();
  const diskCandidates = disk.connections.filter((c) => {
    if (c.status !== 'accepted') return false;
    const reqId = (c.requester_id || '').toLowerCase();
    const recId = (c.recipient_id || c.receiver_id || '').toLowerCase();
    const reqAliases = (c.requester_aliases || []).map((a) => a.toLowerCase());
    const recAliases = (c.recipient_aliases || []).map((a) => a.toLowerCase());
    return (
      aliasSet.has(reqId) ||
      aliasSet.has(recId) ||
      reqAliases.some((a) => aliasSet.has(a)) ||
      recAliases.some((a) => aliasSet.has(a))
    );
  });

  // Identify all partner IDs for batch loading
  const neededPartnerIds: string[] = [];
  for (const row of dbRows) {
    const isRequester = aliasSet.has((row.requester_id || '').toLowerCase());
    const otherId = isRequester ? (row.recipient_id || row.receiver_id) : row.requester_id;
    if (otherId && !aliasSet.has(otherId.toLowerCase())) neededPartnerIds.push(otherId);
  }
  for (const c of diskCandidates) {
    const isReq = aliasSet.has((c.requester_id || '').toLowerCase());
    const isRec = aliasSet.has((c.recipient_id || '').toLowerCase()) || aliasSet.has((c.receiver_id || '').toLowerCase());
    let otherId: string | null = null;
    if (isReq) otherId = c.recipient_id || c.receiver_id;
    else if (isRec) otherId = c.requester_id;
    if (otherId && !aliasSet.has(otherId.toLowerCase())) neededPartnerIds.push(otherId);
  }

  const profileMap = await lookupProfilesBatch(neededPartnerIds, userToken);

  for (const row of dbRows) {
    const isRequester = aliasSet.has((row.requester_id || '').toLowerCase());
    const otherId = isRequester ? (row.recipient_id || row.receiver_id) : row.requester_id;
    if (!otherId || aliasSet.has(otherId.toLowerCase()) || seenTargets.has(otherId)) continue;
    seenTargets.add(otherId);

    const otherProfile = profileMap.get(otherId) || normalizeMemberProfile(null, otherId);
    results.push({
      id: row.id,
      connected_at: row.updated_at || row.created_at || new Date().toISOString(),
      connected_to: otherId,
      profiles: otherProfile,
    });

    peopleDirectoryStore.upsertConnection(userId, otherId);
  }

  for (const c of diskCandidates) {
    const isReq = aliasSet.has((c.requester_id || '').toLowerCase());
    const isRec = aliasSet.has((c.recipient_id || '').toLowerCase()) || aliasSet.has((c.receiver_id || '').toLowerCase());
    let otherId: string | null = null;
    if (isReq) otherId = c.recipient_id || c.receiver_id;
    else if (isRec) otherId = c.requester_id;

    if (otherId && !aliasSet.has(otherId.toLowerCase()) && !seenTargets.has(otherId)) {
      seenTargets.add(otherId);
      const otherProfile = profileMap.get(otherId) || normalizeMemberProfile(null, otherId);
      results.push({
        id: c.id,
        connected_at: c.updated_at || c.created_at,
        connected_to: otherId,
        profiles: otherProfile,
      });
      peopleDirectoryStore.upsertConnection(userId, otherId);
    }
  }

  // 3. Merge from peopleDirectoryStore fallback
  for (const alias of aliases) {
    const memConns = peopleDirectoryStore.getConnections(alias);
    for (const m of memConns) {
      if (m.id && !aliasSet.has(m.id.toLowerCase()) && !seenTargets.has(m.id)) {
        seenTargets.add(m.id);
        results.push({
          id: `conn_${m.id}`,
          connected_at: new Date().toISOString(),
          connected_to: m.id,
          profiles: normalizeMemberProfile(m),
        });
      }
    }
  }

  return results.slice(0, limit);
}

export async function getWithdrawnRequestsForUser(userId: string, limit = 50, userToken?: string) {
  initStore();
  const results: any[] = [];
  const seenIds = new Set<string>();
  const aliases = await resolveUserAliases(userId, userToken);
  const aliasSet = new Set(aliases.map((a) => a.toLowerCase()));

  // 1. Authoritative Supabase query (with fast timeout)
  let dbRows: any[] = [];
  try {
    const client = getEffectiveSupabaseClient(userToken);
    const orClauses = aliases.map((a) => `requester_id.eq.${a}`).join(',');

    const query = client
      .from('connections')
      .select('id, requester_id, recipient_id, receiver_id, status, note, created_at, updated_at')
      .or(orClauses)
      .in('status', ['cancelled', 'withdrawn', 'rejected'])
      .order('updated_at', { ascending: false })
      .limit(limit);

    const { data, error: dbErr } = await queryWithTimeout(query, 1200, { data: null, error: true });

    if (!dbErr && Array.isArray(data)) {
      dbRows = data;
    }
  } catch (err) {
    console.warn('[ConnectionsBackend] Supabase withdrawn query warning:', err);
  }

  // 2. Disk store candidates
  const disk = loadDiskStore();
  const diskCandidates = disk.connections.filter((c) => {
    const reqId = (c.requester_id || '').toLowerCase();
    return aliasSet.has(reqId) && (c.status === 'cancelled' || c.status === 'rejected' || c.status === 'withdrawn');
  });

  // Batch resolve all partner profiles
  const allTargetIds = [
    ...dbRows.map((r) => r.recipient_id || r.receiver_id),
    ...diskCandidates.map((c) => c.recipient_id || c.receiver_id),
  ].filter(Boolean);
  const profileMap = await lookupProfilesBatch(allTargetIds, userToken);

  for (const row of dbRows) {
    if (!row.id || seenIds.has(row.id)) continue;
    seenIds.add(row.id);
    const targetId = row.recipient_id || row.receiver_id;
    const recProfile = profileMap.get(targetId) || normalizeMemberProfile(null, targetId);
    results.push({
      id: row.id,
      message: row.note || '',
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || row.created_at || new Date().toISOString(),
      status: 'cancelled',
      requester_id: userId,
      recipient_id: targetId,
      profiles: recProfile,
    });
  }

  for (const c of diskCandidates) {
    if (!seenIds.has(c.id)) {
      seenIds.add(c.id);
      const targetId = c.recipient_id || c.receiver_id;
      const recProfile = profileMap.get(targetId) || normalizeMemberProfile(null, targetId);
      results.push({
        id: c.id,
        message: c.note || c.message || '',
        created_at: c.created_at,
        updated_at: c.updated_at || c.created_at,
        status: 'cancelled',
        requester_id: userId,
        recipient_id: targetId,
        profiles: recProfile,
      });
    }
  }

  // 3. Merge from peopleDirectoryStore fallback
  for (const alias of aliases) {
    const memWithdrawn = peopleDirectoryStore.getWithdrawn(alias);
    for (const m of memWithdrawn) {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        results.push({
          id: m.id,
          message: m.message || '',
          created_at: m.created_at,
          updated_at: m.updated_at,
          status: 'cancelled',
          requester_id: userId,
          recipient_id: m.recipient?.id || '',
          profiles: normalizeMemberProfile(m.recipient),
        });
      }
    }
  }

  return results.slice(0, limit);
}

// ── MUTATIONS (Send, Accept, Cancel, Decline) ────────────────────────────────

export async function sendConnectionRequestBackend(
  senderId: string,
  recipientId: string,
  message?: string,
  userToken?: string
): Promise<{ success: boolean; request_id?: string; status?: string; error?: string; code?: string }> {
  initStore();

  if (!senderId || !recipientId) {
    return { success: false, error: 'Sender and recipient IDs are required.', code: 'BAD_REQUEST' };
  }

  const senderAliases = await resolveUserAliases(senderId, userToken);
  const recipientAliases = await resolveUserAliases(recipientId, userToken);
  const senderAliasSet = new Set(senderAliases.map((a) => a.toLowerCase()));
  const recipientAliasSet = new Set(recipientAliases.map((a) => a.toLowerCase()));

  // Self-request invariant
  for (const s of senderAliasSet) {
    if (recipientAliasSet.has(s)) {
      return { success: false, error: 'Cannot send connection request to yourself.', code: 'SELF_REQUEST' };
    }
  }

  const disk = loadDiskStore();

  // Check if existing pending or accepted connection between any aliases
  const existingConn = disk.connections.find((c) => {
    const req = (c.requester_id || '').toLowerCase();
    const rec = (c.recipient_id || c.receiver_id || '').toLowerCase();
    const matchForward = senderAliasSet.has(req) && recipientAliasSet.has(rec);
    const matchReverse = recipientAliasSet.has(req) && senderAliasSet.has(rec);
    return (matchForward || matchReverse) && (c.status === 'pending' || c.status === 'accepted');
  });

  if (existingConn) {
    if (existingConn.status === 'accepted') {
      return { success: false, error: 'You are already connected to this member.', code: 'ALREADY_CONNECTED' };
    }
    // If pending request was sent by the other party, auto-accept it!
    const isReverse = recipientAliasSet.has((existingConn.requester_id || '').toLowerCase());
    if (isReverse) {
      await acceptConnectionRequestBackend(senderId, existingConn.id, undefined, userToken);
      return { success: true, request_id: existingConn.id, status: 'accepted' };
    }
    return { success: false, error: 'A pending request already exists.', code: 'DUPLICATE_REQUEST' };
  }

  // Remove any stale cancelled or rejected entries between these users so they can cleanly reconnect
  disk.connections = disk.connections.filter((c) => {
    const req = (c.requester_id || '').toLowerCase();
    const rec = (c.recipient_id || c.receiver_id || '').toLowerCase();
    const isPair = (senderAliasSet.has(req) && recipientAliasSet.has(rec)) || (recipientAliasSet.has(req) && senderAliasSet.has(rec));
    return !(isPair && (c.status === 'cancelled' || c.status === 'rejected' || c.status === 'withdrawn'));
  });

  const newReqId =
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;

  const now = new Date().toISOString();
  const record: PersistentConnectionRecord = {
    id: newReqId,
    requester_id: senderId,
    recipient_id: recipientId,
    receiver_id: recipientId,
    requester_aliases: senderAliases,
    recipient_aliases: recipientAliases,
    status: 'pending',
    note: message ? message.trim().slice(0, 300) : null,
    message: message ? message.trim().slice(0, 300) : null,
    created_at: now,
    updated_at: now,
  };

  // 1. Save to Persistent Disk Store and in-memory stores IMMEDIATELY
  upsertMemoryConnection(record);
  disk.connections.push(record);

  // 2. Fetch sender profile for accurate notification title
  const senderProfile = await lookupProfileById(senderId, userToken);
  const senderName = senderProfile.display_name || 'A freight colleague';

  // 3. Create Notification Record for recipient
  const notifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const notifRecord: PersistentNotificationRecord = {
    id: notifId,
    user_id: recipientId,
    type: 'connection_request',
    category: 'network',
    title: `${senderName} sent you a connection request`,
    description: message
      ? `"${message.slice(0, 150)}"`
      : 'Review and respond to grow your professional freight network.',
    target_url: '/people?tab=incoming',
    link: '/people?tab=incoming',
    related_id: newReqId,
    read: false,
    metadata: {
      requester_id: senderId,
      request_id: newReqId,
      requester_name: senderName,
      requester_company: senderProfile.company_name || senderProfile.company,
      requester_avatar: senderProfile.avatar_url,
      actionLabel: 'Review Request',
    },
    created_at: now,
  };

  upsertMemoryNotification(notifRecord);
  disk.notifications.push(notifRecord);
  saveDiskStore(disk);

  // 4. Mirror to peopleDirectoryStore
  peopleDirectoryStore.upsertRequest({
    id: newReqId,
    requester_id: senderId,
    recipient_id: recipientId,
    status: 'pending',
    message: record.note || undefined,
    created_at: now,
    updated_at: now,
  });

  // 5. Asynchronously sync to Supabase in background (never blocks user or causes failures)
  (async () => {
    try {
      const client = getEffectiveSupabaseClient(userToken);
      const insertQuery = client.from('connections').insert({
        id: newReqId,
        requester_id: senderId,
        recipient_id: recipientId,
        receiver_id: recipientId,
        status: 'pending',
        note: record.note,
        created_at: now,
        updated_at: now,
      });
      await queryWithTimeout(insertQuery, 1200, null);

      const notifQuery = client.from('notifications').insert({
        id: notifId,
        user_id: recipientId,
        type: 'connection_request',
        category: 'network',
        title: notifRecord.title,
        description: notifRecord.description,
        target_url: notifRecord.target_url,
        related_id: newReqId,
        read: false,
        metadata: notifRecord.metadata,
        created_at: now,
      });
      await queryWithTimeout(notifQuery, 1200, null);
    } catch (syncErr) {
      console.warn('[ConnectionsBackend] Background Supabase insert warning:', syncErr);
    }
  })();

  return { success: true, request_id: newReqId, status: 'pending' };
}

export async function acceptConnectionRequestBackend(
  recipientId: string,
  requestId?: string,
  requesterId?: string,
  userToken?: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  initStore();
  const now = new Date().toISOString();
  const recipientAliases = await resolveUserAliases(recipientId, userToken);
  const recipientAliasSet = new Set(recipientAliases.map((a) => a.toLowerCase()));

  const disk = loadDiskStore();
  let targetRecord: PersistentConnectionRecord | undefined;

  if (requestId) {
    targetRecord = disk.connections.find((c) => c.id === requestId || c.id.includes(requestId));
    if (!targetRecord) {
      const memReq = peopleDirectoryStore.getRequestById(requestId);
      if (memReq) {
        targetRecord = {
          id: memReq.id,
          requester_id: memReq.requester_id,
          recipient_id: memReq.recipient_id,
          receiver_id: memReq.recipient_id,
          status: memReq.status as any,
          created_at: memReq.created_at,
          updated_at: memReq.updated_at,
        };
      }
    }
    if (!targetRecord) {
      targetRecord = await findConnectionInSupabase(requestId, userToken);
    }
  }

  if (!targetRecord && requesterId) {
    targetRecord = disk.connections.find((c) => {
      const rec = (c.recipient_id || c.receiver_id || '').toLowerCase();
      const req = (c.requester_id || '').toLowerCase();
      return (
        recipientAliasSet.has(rec) &&
        (req === requesterId.toLowerCase() || req.includes(requesterId.toLowerCase())) &&
        c.status === 'pending'
      );
    });
  }

  // Strict Authorization: Only the intended recipient can accept the request
  if (targetRecord) {
    const targetRec = (targetRecord.recipient_id || targetRecord.receiver_id || '').toLowerCase();
    const targetAliases = (targetRecord.recipient_aliases || []).map((a) => a.toLowerCase());
    const isAuthorized =
      recipientAliasSet.has(targetRec) ||
      targetAliases.some((a) => recipientAliasSet.has(a)) ||
      targetRec === recipientId.toLowerCase();

    if (!isAuthorized) {
      return {
        success: false,
        code: 'FORBIDDEN',
        error: 'You are not authorized to accept this connection request.',
      };
    }
    if (targetRecord.status !== 'pending' && targetRecord.status !== 'hold') {
      if (targetRecord.status === 'accepted') {
        return { success: true };
      }
      return {
        success: false,
        code: 'INVALID_STATE',
        error: `Cannot accept request with status ${targetRecord.status}.`,
      };
    }
  } else {
    return {
      success: false,
      code: 'NOT_FOUND',
      error: 'Connection request not found.',
    };
  }

  const actualReqId = targetRecord.id;
  const actualSenderId = targetRecord.requester_id;

  // 1. Asynchronously update Supabase in background
  (async () => {
    try {
      const client = getEffectiveSupabaseClient(userToken);

      if (actualReqId && actualReqId.includes('-')) {
        await queryWithTimeout(
          client
            .from('connections')
            .update({ status: 'accepted', updated_at: now })
            .eq('id', actualReqId),
          1200,
          null
        );
      }
      if (actualSenderId) {
        const orClauses = recipientAliases.map((a) => `recipient_id.eq.${a},receiver_id.eq.${a}`).join(',');
        await queryWithTimeout(
          client
            .from('connections')
            .update({ status: 'accepted', updated_at: now })
            .eq('requester_id', actualSenderId)
            .or(orClauses),
          1200,
          null
        );

        // Synchronize canonical mutual connection in DBMS accepted_connections table
        await queryWithTimeout(
          client.from('accepted_connections').upsert([
            { user_id: recipientId, connected_to: actualSenderId, created_at: now },
            { user_id: actualSenderId, connected_to: recipientId, created_at: now },
          ], { onConflict: 'user_id,connected_to' }),
          1200,
          null
        );
      }
    } catch (err) {
      console.warn('[ConnectionsBackend] Supabase accept update warning:', err);
    }
  })();

  // 2. Emit acceptance notification to sender
  if (actualSenderId) {
    const recipientProfile = await lookupProfileById(recipientId, userToken);
    const recName = recipientProfile.display_name || 'A freight colleague';
    const accNotifId = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const accNotif: PersistentNotificationRecord = {
      id: accNotifId,
      user_id: actualSenderId,
      type: 'connection_accepted',
      category: 'network',
      title: `${recName} accepted your connection request`,
      description: 'You are now directly connected. Start collaborating and exchange trade lanes.',
      target_url: '/people?tab=connections',
      link: '/people?tab=connections',
      related_id: actualReqId,
      read: false,
      metadata: {
        partner_id: recipientId,
        partner_name: recName,
        partner_company: recipientProfile.company_name || recipientProfile.company,
        actionLabel: 'View Contact',
      },
      created_at: now,
    };

    upsertMemoryNotification(accNotif);
    disk.notifications.push(accNotif);

    (async () => {
      try {
        const client = getEffectiveSupabaseClient(userToken);
        await queryWithTimeout(
          client.from('notifications').insert({
            id: accNotifId,
            user_id: actualSenderId,
            type: 'connection_accepted',
            category: 'network',
            title: accNotif.title,
            description: accNotif.description,
            target_url: accNotif.target_url,
            related_id: actualReqId,
            read: false,
            metadata: accNotif.metadata,
            created_at: now,
          }),
          1200,
          null
        );
      } catch {}
    })();
  }

  // 3. Mark recipient's original connection_request notification as read
  for (const n of disk.notifications) {
    if (n.related_id === actualReqId || n.metadata?.request_id === actualReqId) {
      n.read = true;
    }
  }
  for (const n of memoryNotifications) {
    if (n.related_id === actualReqId || n.metadata?.request_id === actualReqId) {
      n.read = true;
    }
  }

  (async () => {
    try {
      const client = getEffectiveSupabaseClient(userToken);
      if (actualReqId) {
        await queryWithTimeout(
          client
            .from('notifications')
            .update({ read: true })
            .in('user_id', recipientAliases)
            .eq('related_id', actualReqId),
          1200,
          null
        );
      }
    } catch {}
  })();

  // 4. Update memory & disk store
  targetRecord.status = 'accepted';
  targetRecord.updated_at = now;
  const diskIndex = disk.connections.findIndex((c) => c.id === targetRecord!.id);
  if (diskIndex >= 0) {
    disk.connections[diskIndex] = targetRecord;
  } else {
    disk.connections.push(targetRecord);
  }
  saveDiskStore(disk);
  upsertMemoryConnection(targetRecord);

  // 5. Mirror to peopleDirectoryStore (bidirectionally so both participants see each other)
  if (actualSenderId) {
    peopleDirectoryStore.upsertConnection(recipientId, actualSenderId);
    peopleDirectoryStore.upsertConnection(actualSenderId, recipientId);
    if (actualReqId) {
      peopleDirectoryStore.acceptRequest(recipientId, actualReqId);
    }
  }

  return { success: true };
}

export async function cancelConnectionRequestBackend(
  senderId: string,
  requestId?: string,
  recipientId?: string,
  userToken?: string
): Promise<{ success: boolean; status: string; message: string; code?: string; error?: string }> {
  initStore();
  const now = new Date().toISOString();
  const senderAliases = await resolveUserAliases(senderId, userToken);
  const senderAliasSet = new Set(senderAliases.map((a) => a.toLowerCase()));
  let recipientAliasSet = new Set<string>();
  if (recipientId) {
    const rAliases = await resolveUserAliases(recipientId, userToken);
    rAliases.forEach((a) => recipientAliasSet.add(a.toLowerCase()));
  }

  const disk = loadDiskStore();
  let targetRecord: PersistentConnectionRecord | undefined;

  if (requestId) {
    targetRecord = disk.connections.find((c) => c.id === requestId || c.id.includes(requestId));
    if (!targetRecord) {
      const memReq = peopleDirectoryStore.getRequestById(requestId);
      if (memReq) {
        targetRecord = {
          id: memReq.id,
          requester_id: memReq.requester_id,
          recipient_id: memReq.recipient_id,
          receiver_id: memReq.recipient_id,
          status: memReq.status as any,
          created_at: memReq.created_at,
          updated_at: memReq.updated_at,
        };
      }
    }
    if (!targetRecord) {
      targetRecord = await findConnectionInSupabase(requestId, userToken);
    }
  }

  if (!targetRecord && recipientId) {
    targetRecord = disk.connections.find((c) => {
      const req = (c.requester_id || '').toLowerCase();
      const rec = (c.recipient_id || c.receiver_id || '').toLowerCase();
      return (
        senderAliasSet.has(req) &&
        (recipientAliasSet.has(rec) || rec === recipientId.toLowerCase()) &&
        c.status === 'pending'
      );
    });
  }

  // Strict Authorization: Only the actual requester can withdraw their outgoing request
  if (targetRecord) {
    const reqOwner = (targetRecord.requester_id || '').toLowerCase();
    const reqAliases = (targetRecord.requester_aliases || []).map((a) => a.toLowerCase());
    const isAuthorized =
      senderAliasSet.has(reqOwner) ||
      reqAliases.some((a) => senderAliasSet.has(a)) ||
      reqOwner === senderId.toLowerCase();

    if (!isAuthorized) {
      return {
        success: false,
        code: 'FORBIDDEN',
        status: 'forbidden',
        error: 'You are not authorized to withdraw this connection request.',
        message: 'You are not authorized to withdraw this connection request.',
      };
    }
  } else {
    return {
      success: false,
      code: 'NOT_FOUND',
      status: 'not_found',
      error: 'Connection request not found.',
      message: 'Connection request not found.',
    };
  }

  const actualReqId = targetRecord.id;
  const actualTargetId = targetRecord.recipient_id || targetRecord.receiver_id || recipientId || '';

  // 1. Asynchronously update Supabase in background
  (async () => {
    try {
      const client = getEffectiveSupabaseClient(userToken);

      if (actualReqId && actualReqId.includes('-')) {
        await queryWithTimeout(
          client
            .from('connections')
            .update({ status: 'cancelled', updated_at: now })
            .eq('id', actualReqId),
          1200,
          null
        );
      }
      if (actualTargetId) {
        const orClauses = Array.from(recipientAliasSet).map((a) => `recipient_id.eq.${a},receiver_id.eq.${a}`).join(',');
        let q = client
          .from('connections')
          .update({ status: 'cancelled', updated_at: now })
          .in('requester_id', senderAliases);
        if (orClauses) q = q.or(orClauses);
        await queryWithTimeout(q, 1200, null);
      }
    } catch (err) {
      console.warn('[ConnectionsBackend] Supabase cancel update warning:', err);
    }
  })();

  // 2. Update notification to withdrawn for recipient
  for (const n of disk.notifications) {
    if (n.related_id === actualReqId || n.metadata?.request_id === actualReqId) {
      n.read = true;
      n.description = 'This connection request was withdrawn by the sender.';
    }
  }
  for (const n of memoryNotifications) {
    if (n.related_id === actualReqId || n.metadata?.request_id === actualReqId) {
      n.read = true;
      n.description = 'This connection request was withdrawn by the sender.';
    }
  }

  (async () => {
    try {
      const client = getEffectiveSupabaseClient(userToken);
      await queryWithTimeout(
        client
          .from('notifications')
          .update({ read: true, description: 'This connection request was withdrawn by the sender.' })
          .eq('related_id', actualReqId),
        1200,
        null
      );
    } catch {}
  })();

  // 3. Update memory and disk
  targetRecord.status = 'cancelled';
  targetRecord.updated_at = now;
  const diskIndexCancel = disk.connections.findIndex((c) => c.id === targetRecord!.id);
  if (diskIndexCancel >= 0) {
    disk.connections[diskIndexCancel] = targetRecord;
  } else {
    disk.connections.push(targetRecord);
  }
  saveDiskStore(disk);
  upsertMemoryConnection(targetRecord);

  // 4. Mirror to peopleDirectoryStore
  peopleDirectoryStore.cancelRequest(senderId, actualReqId, actualTargetId);

  return { success: true, status: 'cancelled', message: 'Connection request withdrawn.' };
}

export async function declineConnectionRequestBackend(
  recipientId: string,
  requestId?: string,
  requesterId?: string,
  userToken?: string
): Promise<{ success: boolean; error?: string; code?: string }> {
  initStore();
  const now = new Date().toISOString();
  const recipientAliases = await resolveUserAliases(recipientId, userToken);
  const recipientAliasSet = new Set(recipientAliases.map((a) => a.toLowerCase()));

  const disk = loadDiskStore();
  let targetRecord: PersistentConnectionRecord | undefined;

  if (requestId) {
    targetRecord = disk.connections.find((c) => c.id === requestId || c.id.includes(requestId));
    if (!targetRecord) {
      const memReq = peopleDirectoryStore.getRequestById(requestId);
      if (memReq) {
        targetRecord = {
          id: memReq.id,
          requester_id: memReq.requester_id,
          recipient_id: memReq.recipient_id,
          receiver_id: memReq.recipient_id,
          status: memReq.status as any,
          created_at: memReq.created_at,
          updated_at: memReq.updated_at,
        };
      }
    }
    if (!targetRecord) {
      targetRecord = await findConnectionInSupabase(requestId, userToken);
    }
  }

  if (!targetRecord && requesterId) {
    targetRecord = disk.connections.find((c) => {
      const rec = (c.recipient_id || c.receiver_id || '').toLowerCase();
      const req = (c.requester_id || '').toLowerCase();
      return (
        recipientAliasSet.has(rec) &&
        (req === requesterId.toLowerCase() || req.includes(requesterId.toLowerCase())) &&
        c.status === 'pending'
      );
    });
  }

  // Strict Authorization: Only the intended recipient can decline
  if (targetRecord) {
    const targetRec = (targetRecord.recipient_id || targetRecord.receiver_id || '').toLowerCase();
    const targetAliases = (targetRecord.recipient_aliases || []).map((a) => a.toLowerCase());
    const isAuthorized =
      recipientAliasSet.has(targetRec) ||
      targetAliases.some((a) => recipientAliasSet.has(a)) ||
      targetRec === recipientId.toLowerCase();

    if (!isAuthorized) {
      return {
        success: false,
        code: 'FORBIDDEN',
        error: 'You are not authorized to decline this connection request.',
      };
    }
  } else {
    return {
      success: false,
      code: 'NOT_FOUND',
      error: 'Connection request not found.',
    };
  }

  const actualReqId = targetRecord.id;
  const actualRequesterId = targetRecord.requester_id;

  // 1. Asynchronously update Supabase in background
  (async () => {
    try {
      const client = getEffectiveSupabaseClient(userToken);

      if (actualReqId && actualReqId.includes('-')) {
        await queryWithTimeout(
          client
            .from('connections')
            .update({ status: 'rejected', updated_at: now })
            .eq('id', actualReqId),
          1200,
          null
        );
      }
      if (actualRequesterId) {
        const orClauses = recipientAliases.map((a) => `recipient_id.eq.${a},receiver_id.eq.${a}`).join(',');
        await queryWithTimeout(
          client
            .from('connections')
            .update({ status: 'rejected', updated_at: now })
            .eq('requester_id', actualRequesterId)
            .or(orClauses),
          1200,
          null
        );
      }
    } catch {}
  })();

  // 2. Mark recipient notification read
  for (const n of disk.notifications) {
    if (n.related_id === actualReqId || n.metadata?.request_id === actualReqId) {
      n.read = true;
    }
  }
  for (const n of memoryNotifications) {
    if (n.related_id === actualReqId || n.metadata?.request_id === actualReqId) {
      n.read = true;
    }
  }

  // 3. Update memory & disk
  targetRecord.status = 'rejected';
  targetRecord.updated_at = now;
  const diskIndexDecline = disk.connections.findIndex((c) => c.id === targetRecord!.id);
  if (diskIndexDecline >= 0) {
    disk.connections[diskIndexDecline] = targetRecord;
  } else {
    disk.connections.push(targetRecord);
  }
  saveDiskStore(disk);
  upsertMemoryConnection(targetRecord);

  // 4. Mirror in peopleDirectoryStore
  if (actualReqId) {
    peopleDirectoryStore.declineRequest(recipientId, actualReqId);
  }

  return { success: true };
}

// ── Hold Connection Request Mutation ──────────────────────────────────────────

export async function holdConnectionRequestBackend(
  recipientId: string,
  requestId?: string,
  requesterId?: string,
  userToken?: string
): Promise<{ success: boolean; status?: string; message?: string; error?: string; code?: string }> {
  initStore();
  const now = new Date().toISOString();
  const recipientAliases = await resolveUserAliases(recipientId, userToken);
  const recipientAliasSet = new Set(recipientAliases.map((a) => a.toLowerCase()));

  const disk = loadDiskStore();
  let targetRecord: PersistentConnectionRecord | undefined;

  if (requestId) {
    targetRecord = disk.connections.find((c) => c.id === requestId || c.id.includes(requestId));
    if (!targetRecord) {
      const memReq = peopleDirectoryStore.getRequestById(requestId);
      if (memReq) {
        targetRecord = {
          id: memReq.id,
          requester_id: memReq.requester_id,
          recipient_id: memReq.recipient_id,
          receiver_id: memReq.recipient_id,
          status: memReq.status as any,
          created_at: memReq.created_at,
          updated_at: memReq.updated_at,
        };
      }
    }
    if (!targetRecord) {
      targetRecord = await findConnectionInSupabase(requestId, userToken);
    }
  }

  if (!targetRecord && requesterId) {
    targetRecord = disk.connections.find((c) => {
      const rec = (c.recipient_id || c.receiver_id || '').toLowerCase();
      const req = (c.requester_id || '').toLowerCase();
      return (
        recipientAliasSet.has(rec) &&
        (req === requesterId.toLowerCase() || req.includes(requesterId.toLowerCase())) &&
        (c.status === 'pending' || c.status === 'hold')
      );
    });
  }

  if (targetRecord) {
    const targetRec = (targetRecord.recipient_id || targetRecord.receiver_id || '').toLowerCase();
    const targetAliases = (targetRecord.recipient_aliases || []).map((a) => a.toLowerCase());
    const isAuthorized =
      recipientAliasSet.has(targetRec) ||
      targetAliases.some((a) => recipientAliasSet.has(a)) ||
      targetRec === recipientId.toLowerCase();

    if (!isAuthorized) {
      return {
        success: false,
        code: 'FORBIDDEN',
        error: 'You are not authorized to put this connection request on hold.',
      };
    }
  } else {
    return {
      success: false,
      code: 'NOT_FOUND',
      error: 'Connection request not found.',
    };
  }

  const actualReqId = targetRecord.id;

  // 1. Asynchronously update Supabase in background
  (async () => {
    try {
      const client = getEffectiveSupabaseClient(userToken);
      if (actualReqId && actualReqId.includes('-')) {
        await queryWithTimeout(
          client
            .from('connections')
            .update({ status: 'hold', updated_at: now })
            .eq('id', actualReqId),
          1200,
          null
        );
      }
    } catch (err) {
      console.warn('[ConnectionsBackend] Supabase hold update warning:', err);
    }
  })();

  // 2. Update memory & disk
  targetRecord.status = 'hold';
  targetRecord.updated_at = now;
  const diskIndexHold = disk.connections.findIndex((c) => c.id === targetRecord!.id);
  if (diskIndexHold >= 0) {
    disk.connections[diskIndexHold] = targetRecord;
  } else {
    disk.connections.push(targetRecord);
  }
  saveDiskStore(disk);
  upsertMemoryConnection(targetRecord);

  // 3. Mirror in peopleDirectoryStore
  if (actualReqId) {
    peopleDirectoryStore.holdRequest(recipientId, actualReqId);
  }

  return { success: true, status: 'hold', message: 'Connection request placed on hold for further review.' };
}

// ── Get Held Requests For User ────────────────────────────────────────────────

export async function getHeldRequestsForUser(userId: string, limit = 50, userToken?: string) {
  initStore();
  const results: any[] = [];
  const seenIds = new Set<string>();
  const aliases = await resolveUserAliases(userId, userToken);
  const aliasSet = new Set(aliases.map((a) => a.toLowerCase()));

  // 1. Authoritative Supabase query from `connections` table (with fast timeout)
  let dbRows: any[] = [];
  try {
    const client = getEffectiveSupabaseClient(userToken);
    const orClauses = aliases.map((a) => `recipient_id.eq.${a},receiver_id.eq.${a}`).join(',');

    const query = client
      .from('connections')
      .select('id, requester_id, recipient_id, receiver_id, status, note, created_at, updated_at')
      .or(orClauses)
      .eq('status', 'hold')
      .order('updated_at', { ascending: false })
      .limit(limit);

    const { data, error: dbErr } = await queryWithTimeout(query, 1200, { data: null, error: true });

    if (!dbErr && Array.isArray(data)) {
      dbRows = data;
    }
  } catch (err) {
    console.warn('[ConnectionsBackend] Supabase held query warning:', err);
  }

  // 2. Merge from persistent store
  const disk = loadDiskStore();
  const diskCandidates = disk.connections.filter((c) => {
    const recId = (c.recipient_id || '').toLowerCase();
    const recvId = (c.receiver_id || '').toLowerCase();
    return (aliasSet.has(recId) || aliasSet.has(recvId)) && c.status === 'hold';
  });

  // Batch resolve all needed requester profiles in a single query
  const allRequesterIds = [
    ...dbRows.map((r) => r.requester_id),
    ...diskCandidates.map((c) => c.requester_id),
  ].filter(Boolean);
  const profileMap = await lookupProfilesBatch(allRequesterIds, userToken);

  for (const row of dbRows) {
    if (!row.id || seenIds.has(row.id)) continue;
    seenIds.add(row.id);
    const reqProfile = profileMap.get(row.requester_id) || normalizeMemberProfile(null, row.requester_id);
    results.push({
      id: row.id,
      message: row.note || '',
      created_at: row.created_at || new Date().toISOString(),
      updated_at: row.updated_at || row.created_at || new Date().toISOString(),
      status: 'hold',
      requester_id: row.requester_id,
      recipient_id: row.recipient_id || userId,
      profiles: reqProfile,
    });
  }

  for (const c of diskCandidates) {
    if (!seenIds.has(c.id)) {
      seenIds.add(c.id);
      const reqProfile = profileMap.get(c.requester_id) || normalizeMemberProfile(null, c.requester_id);
      results.push({
        id: c.id,
        message: c.note || c.message || '',
        created_at: c.created_at,
        updated_at: c.updated_at || c.created_at,
        status: 'hold',
        requester_id: c.requester_id,
        recipient_id: c.recipient_id || userId,
        profiles: reqProfile,
      });
    }
  }

  // 3. Merge from peopleDirectoryStore fallback
  for (const alias of aliases) {
    const memHeld = peopleDirectoryStore.getHeld(alias);
    for (const m of memHeld) {
      if (!seenIds.has(m.id)) {
        seenIds.add(m.id);
        results.push({
          id: m.id,
          message: m.message || '',
          created_at: m.created_at,
          updated_at: m.updated_at,
          status: 'hold',
          requester_id: m.requester?.id || '',
          recipient_id: userId,
          profiles: normalizeMemberProfile(m.requester),
        });
      }
    }
  }

  return results.slice(0, limit);
}

// ── Notifications Retrieval ──────────────────────────────────────────────────

export async function getNotificationsForUser(userId: string, limit = 50, unreadOnly = false, userToken?: string) {
  initStore();
  const list: any[] = [];
  const seenIds = new Set<string>();
  const aliases = await resolveUserAliases(userId, userToken);
  const aliasSet = new Set(aliases.map((a) => a.toLowerCase()));

  // 1. Query Supabase `notifications` table
  try {
    const client = getEffectiveSupabaseClient(userToken);

    let q = client
      .from('notifications')
      .select('*')
      .in('user_id', aliases)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (unreadOnly) {
      q = q.eq('read', false);
    }

    const { data, error } = await q;
    if (!error && Array.isArray(data)) {
      for (const n of data) {
        if (!n.id || seenIds.has(n.id)) continue;
        seenIds.add(n.id);
        list.push({
          id: String(n.id),
          title: n.title || 'Notification',
          desc: n.description || n.message || '',
          time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          createdAt: n.created_at || new Date().toISOString(),
          read: Boolean(n.read),
          type: n.type || 'network',
          category: n.category || 'platform',
          targetUrl: n.target_url || n.link || undefined,
          relatedId: n.related_id || undefined,
          actionLabel: n.metadata?.actionLabel || (n.type?.includes('connection') ? 'Review Request' : undefined),
          metadata: n.metadata || {},
        });

        upsertMemoryNotification({
          id: n.id,
          user_id: userId,
          type: n.type,
          category: n.category,
          title: n.title,
          description: n.description,
          target_url: n.target_url,
          related_id: n.related_id,
          read: Boolean(n.read),
          metadata: n.metadata,
          created_at: n.created_at,
        });
      }
    }
  } catch (err) {
    console.warn('[ConnectionsBackend] Supabase notifications query warning:', err);
  }

  // 2. Merge from persistent disk store
  const disk = loadDiskStore();
  for (const n of disk.notifications) {
    const targetUserId = (n.user_id || '').toLowerCase();
    if (aliasSet.has(targetUserId) && !seenIds.has(n.id)) {
      if (unreadOnly && n.read) continue;
      seenIds.add(n.id);
      list.push({
        id: n.id,
        title: n.title,
        desc: n.description || n.message || '',
        time: n.created_at ? new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
        createdAt: n.created_at,
        read: n.read,
        type: n.type,
        category: n.category || 'platform',
        targetUrl: n.target_url || n.link || undefined,
        relatedId: n.related_id || undefined,
        actionLabel: n.metadata?.actionLabel || (n.type?.includes('connection') ? 'Review Request' : undefined),
        metadata: n.metadata || {},
      });
    }
  }

  // 3. Merge from peopleDirectoryStore fallback
  for (const alias of aliases) {
    const memNotifs = peopleDirectoryStore.getNotifications(alias);
    for (const mn of memNotifs) {
      if (!seenIds.has(mn.id)) {
        if (unreadOnly && mn.read) continue;
        seenIds.add(mn.id);
        list.push({
          id: mn.id,
          title: mn.title,
          desc: mn.description,
          time: mn.created_at ? new Date(mn.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
          createdAt: mn.created_at,
          read: mn.read,
          type: mn.type,
          category: mn.category,
          targetUrl: mn.target_url,
          relatedId: mn.related_id,
          actionLabel: mn.metadata?.actionLabel || (mn.type?.includes('connection') ? 'Review Request' : undefined),
          metadata: mn.metadata || {},
        });
      }
    }
  }

  return list.slice(0, limit);
}

// ── Helpers ──────────────────────────────────────────────────────────────────

export async function markNotificationReadBackend(
  userId: string,
  notifId?: string,
  userToken?: string
) {
  initStore();
  const aliases = await resolveUserAliases(userId, userToken);
  const aliasSet = new Set(aliases.map((a) => a.toLowerCase()));

  // 1. Supabase update
  try {
    const client = getEffectiveSupabaseClient(userToken);

    let q = client.from('notifications').update({ read: true }).in('user_id', aliases);
    if (notifId) {
      q = q.eq('id', notifId);
    } else {
      q = q.eq('read', false);
    }
    await q;
  } catch (err) {
    console.warn('[ConnectionsBackend] markNotificationRead Supabase error:', err);
  }

  // 2. Persistent Disk Store update
  const disk = loadDiskStore();
  let modified = false;
  for (const n of disk.notifications) {
    const notifUser = (n.user_id || '').toLowerCase();
    const matchesUser = aliasSet.has(notifUser);
    const matchesId = notifId ? n.id === notifId : true;

    if (notifId ? matchesId : matchesUser) {
      if (!n.read) {
        n.read = true;
        modified = true;
      }
    }
  }
  if (modified) {
    saveDiskStore(disk);
  }

  // 3. Mirror in peopleDirectoryStore
  peopleDirectoryStore.markNotificationRead(userId, notifId);
  for (const alias of aliases) {
    if (alias !== userId) {
      peopleDirectoryStore.markNotificationRead(alias, notifId);
    }
  }

  return { success: true };
}

export async function clearNotificationBackend(
  userId: string,
  notifId?: string,
  userToken?: string
) {
  initStore();
  const aliases = await resolveUserAliases(userId, userToken);
  const aliasSet = new Set(aliases.map((a) => a.toLowerCase()));

  // 1. Supabase delete
  try {
    const client = getEffectiveSupabaseClient(userToken);

    let q = client.from('notifications').delete().in('user_id', aliases);
    if (notifId) {
      q = q.eq('id', notifId);
    }
    await q;
  } catch (err) {
    console.warn('[ConnectionsBackend] clearNotification Supabase error:', err);
  }

  // 2. Persistent Disk Store delete
  const disk = loadDiskStore();
  const initialLen = disk.notifications.length;
  disk.notifications = disk.notifications.filter((n) => {
    const notifUser = (n.user_id || '').toLowerCase();
    const matchesUser = aliasSet.has(notifUser);
    const matchesId = notifId ? n.id === notifId : true;

    if (notifId) {
      return !matchesId;
    }
    return !matchesUser;
  });

  if (disk.notifications.length !== initialLen) {
    saveDiskStore(disk);
  }

  // 3. Mirror in peopleDirectoryStore
  peopleDirectoryStore.clearNotifications(userId, notifId);
  for (const alias of aliases) {
    if (alias !== userId) {
      peopleDirectoryStore.clearNotifications(alias, notifId);
    }
  }

  return { success: true };
}

function upsertMemoryConnection(record: PersistentConnectionRecord) {
  const disk = loadDiskStore();
  const idx = disk.connections.findIndex((c) => c.id === record.id);
  if (idx >= 0) {
    disk.connections[idx] = { ...disk.connections[idx], ...record };
  } else {
    disk.connections.unshift(record);
  }
  saveDiskStore(disk);
}

function upsertMemoryNotification(record: PersistentNotificationRecord) {
  const disk = loadDiskStore();
  const idx = disk.notifications.findIndex((n) => n.id === record.id);
  if (idx >= 0) {
    disk.notifications[idx] = { ...disk.notifications[idx], ...record };
  } else {
    disk.notifications.unshift(record);
  }
  saveDiskStore(disk);
}

export async function removeConnectionBackend(
  userId: string,
  targetId: string,
  userToken?: string
): Promise<{ success: boolean; error?: string }> {
  initStore();
  const aliases = await resolveUserAliases(userId, userToken);
  const targetAliases = await resolveUserAliases(targetId, userToken);
  const aliasSet = new Set(aliases.map((a) => a.toLowerCase()));
  const targetSet = new Set(targetAliases.map((a) => a.toLowerCase()));

  // 1. Supabase deletion
  (async () => {
    try {
      const client = getEffectiveSupabaseClient(userToken);
      const orClauses: string[] = [];
      for (const a of aliases) {
        for (const ta of targetAliases) {
          orClauses.push(`and(requester_id.eq.${a},recipient_id.eq.${ta})`);
          orClauses.push(`and(requester_id.eq.${ta},recipient_id.eq.${a})`);
          orClauses.push(`and(requester_id.eq.${a},receiver_id.eq.${ta})`);
          orClauses.push(`and(requester_id.eq.${ta},receiver_id.eq.${a})`);
        }
      }
      if (orClauses.length > 0) {
        await queryWithTimeout(
          client.from('connections').delete().or(orClauses.join(',')),
          1500,
          null
        );
      }
    } catch (err: any) {
      console.warn('[ConnectionsBackend] removeConnection Supabase warning:', err?.message);
    }
  })();

  // 2. Remove from disk store
  const disk = loadDiskStore();
  const initialLen = disk.connections.length;
  disk.connections = disk.connections.filter((c) => {
    const req = (c.requester_id || '').toLowerCase();
    const rec = (c.recipient_id || c.receiver_id || '').toLowerCase();
    const isConn = (aliasSet.has(req) && targetSet.has(rec)) || (targetSet.has(req) && aliasSet.has(rec));
    return !isConn;
  });
  if (disk.connections.length !== initialLen) {
    saveDiskStore(disk);
  }

  // 3. Remove from memory and peopleDirectoryStore
  for (const a of aliases) {
    for (const ta of targetAliases) {
      peopleDirectoryStore.removeConnection(a, ta);
      peopleDirectoryStore.removeConnection(ta, a);
    }
  }

  return { success: true };
}
