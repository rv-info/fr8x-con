/**
 * lib/db/contacts.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Enterprise Contacts CRM.
 * Manages B2B logistics contacts, deal stages, private notes, tags, and
 * seamless bidirectional sync with DBMS connections and real-time presence.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import fs from 'fs';
import path from 'path';
import { getDbClient, createAdminClient, createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { getAllPresence } from '@/lib/db/presence';
import { peopleDirectoryStore } from '@/lib/people-directory';
import { getAcceptedConnectionsForUser, removeConnectionBackend } from '@/lib/connections-backend';

export interface ContactRecord {
  id: string;
  owner_id: string;
  contact_profile_id?: string | null;
  name: string;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  designation?: string | null;
  category: 'Freight Forwarder' | 'Shipping Line / Carrier' | 'Customs Broker' | 'Shipper (BCO)' | 'Transporter / Fleet' | 'Port / Terminal' | 'Other';
  status: 'live' | 'online' | 'away' | 'busy' | 'offline';
  stage: 'Prospect / Lead' | 'Rate Quoted' | 'Active Partner' | 'VIP / Key Account' | 'Carrier Partner' | 'On Hold';
  notes?: string | null;
  tags: string[];
  is_favorite: boolean;
  avatar_url?: string | null;
  is_verified?: boolean;
  has_golden_tick?: boolean;
  location?: string | null;
  last_contacted_at?: string | null;
  is_connection?: boolean;
  created_at: string;
  updated_at: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CONTACTS_STORE_PATH = path.join(DATA_DIR, 'contacts_store.json');

function loadLocalContacts(): Record<string, ContactRecord[]> {
  try {
    if (fs.existsSync(CONTACTS_STORE_PATH)) {
      const raw = fs.readFileSync(CONTACTS_STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (typeof parsed === 'object' && parsed !== null) {
        return parsed;
      }
    }
  } catch {
    // Ignore read errors
  }
  return {};
}

function saveLocalContacts(store: Record<string, ContactRecord[]>) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CONTACTS_STORE_PATH, JSON.stringify(store, null, 2), 'utf8');
  } catch {
    // Non-blocking write failure in read-only environments
  }
}

function getEffectiveClient(userToken?: string) {
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
 * Fetch all unified contacts for a user:
 * 1. Custom CRM Contacts from `public.contacts`
 * 2. Merged with verified DBMS connections from `public.accepted_connections`
 * 3. Enriched with real-time status from `public.presence`
 */
export async function getUserContacts(userId: string, userToken?: string): Promise<ContactRecord[]> {
  const localStore = loadLocalContacts();
  const userLocal = localStore[userId] || [];
  const client = getEffectiveClient(userToken);

  let dbContacts: ContactRecord[] = [];
  try {
    const { data, error } = await client
      .from('contacts')
      .select('*')
      .eq('owner_id', userId)
      .order('is_favorite', { ascending: false })
      .order('updated_at', { ascending: false });

    if (!error && Array.isArray(data)) {
      dbContacts = data.map((c: any) => ({
        ...c,
        tags: Array.isArray(c.tags) ? c.tags : [],
        is_favorite: Boolean(c.is_favorite),
        is_connection: Boolean(c.contact_profile_id),
      }));
    }
  } catch {
    // Fallback to local store if contacts table is still being initialized
    dbContacts = userLocal;
  }

  // Fetch real-time presence map
  let presenceMap: Record<string, any> = {};
  try {
    presenceMap = await getAllPresence();
  } catch {}

  // Fetch accepted connections from authoritative network backend
  let acceptedConnections: any[] = [];
  try {
    const conns = await getAcceptedConnectionsForUser(userId, 100, userToken);
    if (Array.isArray(conns)) {
      acceptedConnections = conns;
    }
  } catch (err) {
    console.warn('[Contacts] getAcceptedConnectionsForUser fallback warning:', err);
    try {
      const memoryConns = peopleDirectoryStore.getConnections(userId);
      acceptedConnections = memoryConns.map((p: any) => ({
        connected_to: p.id,
        created_at: new Date().toISOString(),
        profiles: p,
      }));
    } catch {}
  }

  // Build merged map keyed by profile ID / contact ID
  const contactMap = new Map<string, ContactRecord>();

  // 1. Add explicitly created contacts first
  for (const c of dbContacts.length > 0 ? dbContacts : userLocal) {
    const key = c.contact_profile_id || c.id;
    // Enrich with live presence if available
    if (c.contact_profile_id && presenceMap[c.contact_profile_id]) {
      const p = presenceMap[c.contact_profile_id];
      c.status = (p.status as any) || (p.online ? 'live' : 'offline');
    }
    contactMap.set(key, c);
  }

  // 2. Merge all accepted connections so every connection is in the CRM
  for (const conn of acceptedConnections) {
    const profile = conn.profiles;
    if (!profile) continue;

    const profileId = profile.id || conn.connected_to;
    if (!profileId) continue;

    const existing = contactMap.get(profileId);
    const presence = presenceMap[profileId];
    const liveStatus = presence ? (presence.status as any) || (presence.online ? 'live' : 'offline') : 'offline';

    const displayName = profile.display_name?.trim() || profile.full_name?.trim() || `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || 'FR8X Member';
    const company = profile.company || profile.company_name || 'Independent Freight Operator';
    const designation = profile.designation || profile.headline || 'Logistics Member';
    const location = [profile.city, profile.country].filter(Boolean).join(', ') || undefined;

    if (existing) {
      // Refresh dynamic connection fields
      existing.is_connection = true;
      existing.avatar_url = profile.avatar_url || existing.avatar_url;
      existing.has_golden_tick = Boolean(profile.has_golden_tick);
      existing.is_verified = Boolean(profile.is_verified);
      existing.location = location || existing.location;
      existing.status = liveStatus !== 'offline' ? liveStatus : existing.status;
    } else {
      // Auto-create connection CRM entry
      const newEntry: ContactRecord = {
        id: `conn_${profileId}`,
        owner_id: userId,
        contact_profile_id: profileId,
        name: displayName,
        email: profile.email || null,
        phone: profile.phone || null,
        company,
        designation,
        category: 'Freight Forwarder',
        status: liveStatus,
        stage: 'Active Partner',
        notes: 'Connected via FR8X Global Container Network.',
        tags: ['Verified Connection', 'FR8X Member'],
        is_favorite: false,
        avatar_url: profile.avatar_url || null,
        is_verified: Boolean(profile.is_verified),
        has_golden_tick: Boolean(profile.has_golden_tick),
        location,
        is_connection: true,
        created_at: conn.created_at || new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      contactMap.set(profileId, newEntry);
    }
  }

  const result = Array.from(contactMap.values());

  // Sort: Favorites first, then Live/Online, then recently updated
  result.sort((a, b) => {
    if (a.is_favorite !== b.is_favorite) return a.is_favorite ? -1 : 1;
    const aLive = a.status === 'live' || a.status === 'online';
    const bLive = b.status === 'live' || b.status === 'online';
    if (aLive !== bLive) return aLive ? -1 : 1;
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  // Keep local store in sync
  localStore[userId] = result;
  saveLocalContacts(localStore);

  return result;
}

/**
 * Create a new Contact in the CRM
 */
export async function createContact(userId: string, payload: Partial<ContactRecord>, userToken?: string): Promise<ContactRecord> {
  const now = new Date().toISOString();
  const newContact: ContactRecord = {
    id: payload.id || `ct_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    owner_id: userId,
    contact_profile_id: payload.contact_profile_id || null,
    name: payload.name?.trim() || 'New Contact',
    email: payload.email?.trim() || null,
    phone: payload.phone?.trim() || null,
    company: payload.company?.trim() || 'Enterprise Logistics',
    designation: payload.designation?.trim() || 'Trade Representative',
    category: payload.category || 'Freight Forwarder',
    status: payload.status || 'offline',
    stage: payload.stage || 'Active Partner',
    notes: payload.notes?.trim() || null,
    tags: Array.isArray(payload.tags) ? payload.tags : [],
    is_favorite: Boolean(payload.is_favorite),
    avatar_url: payload.avatar_url || null,
    location: payload.location || null,
    is_connection: Boolean(payload.contact_profile_id),
    created_at: now,
    updated_at: now,
  };

  const client = getEffectiveClient(userToken);
  try {
    const { data, error } = await client
      .from('contacts')
      .insert({
        owner_id: userId,
        contact_profile_id: newContact.contact_profile_id,
        name: newContact.name,
        email: newContact.email,
        phone: newContact.phone,
        company: newContact.company,
        designation: newContact.designation,
        category: newContact.category,
        status: newContact.status,
        stage: newContact.stage,
        notes: newContact.notes,
        tags: newContact.tags,
        is_favorite: newContact.is_favorite,
      })
      .select()
      .single();

    if (!error && data) {
      newContact.id = data.id;
    }
  } catch (err: any) {
    console.warn('[lib/db/contacts] Supabase insert warning (falling back to resilient store):', err.message);
  }

  // Update local file store
  const store = loadLocalContacts();
  const list = store[userId] || [];
  list.unshift(newContact);
  store[userId] = list;
  saveLocalContacts(store);

  return newContact;
}

/**
 * Update an existing Contact in the CRM
 */
export async function updateContact(userId: string, contactId: string, updates: Partial<ContactRecord>, userToken?: string): Promise<ContactRecord | null> {
  const now = new Date().toISOString();
  const client = getEffectiveClient(userToken);

  try {
    await client
      .from('contacts')
      .update({
        name: updates.name,
        email: updates.email,
        phone: updates.phone,
        company: updates.company,
        designation: updates.designation,
        category: updates.category,
        status: updates.status,
        stage: updates.stage,
        notes: updates.notes,
        tags: updates.tags,
        is_favorite: updates.is_favorite,
        last_contacted_at: updates.last_contacted_at,
        updated_at: now,
      })
      .eq('id', contactId)
      .eq('owner_id', userId);
  } catch (err: any) {
    console.warn('[lib/db/contacts] Supabase update warning:', err.message);
  }

  // Update local file store
  const store = loadLocalContacts();
  const list = store[userId] || [];
  const idx = list.findIndex((c) => c.id === contactId || (c.contact_profile_id && c.contact_profile_id === contactId));
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...updates, updated_at: now };
    store[userId] = list;
    saveLocalContacts(store);
    return list[idx];
  }

  return null;
}

/**
 * Delete Contact and optionally remove connection from DBMS
 */
export async function deleteContact(
  userId: string,
  contactId: string,
  deleteConnection = false,
  userToken?: string
): Promise<{ success: boolean; connectionRemoved: boolean }> {
  const client = getEffectiveClient(userToken);
  let targetProfileId: string | null = null;

  // Find target in local store to check if it links to a profile
  const store = loadLocalContacts();
  const list = store[userId] || [];
  const target = list.find((c) => c.id === contactId || c.contact_profile_id === contactId);
  if (target?.contact_profile_id) {
    targetProfileId = target.contact_profile_id;
  }

  // 1. Delete from public.contacts in Supabase
  try {
    await client
      .from('contacts')
      .delete()
      .eq('owner_id', userId)
      .or(`id.eq.${contactId},contact_profile_id.eq.${contactId}`);
  } catch (err: any) {
    console.warn('[lib/db/contacts] Supabase delete warning:', err.message);
  }

  // 2. If requested to delete connection, remove from connections backend
  let connectionRemoved = false;
  if (deleteConnection && targetProfileId) {
    try {
      await removeConnectionBackend(userId, targetProfileId, userToken);
      connectionRemoved = true;
    } catch (err: any) {
      console.warn('[lib/db/contacts] Remove connection warning:', err?.message);
    }
  }

  // 3. Update local store
  store[userId] = list.filter((c) => c.id !== contactId && c.contact_profile_id !== contactId);
  saveLocalContacts(store);

  return { success: true, connectionRemoved };
}
