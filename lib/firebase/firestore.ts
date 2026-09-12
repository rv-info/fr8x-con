/**
 * lib/firebase/firestore.ts
 * Production Firestore data access service with strong typing, audit tracking,
 * and resilient fallbacks.
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit as firestoreLimit,
  startAfter,
  DocumentSnapshot,
  Timestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, auth } from './client';

// Fast in-memory state stores for server-side execution and offline resiliency
const memoryPresenceStore = new Map<string, UserPresenceState>();
const memoryIntentStore = new Map<string, LogisticsIntent>();
let memoryRankingConfig: RankingConfig | null = null;
const memoryEventsStore = new Set<string>();

import {
  FeedPost,
  Auction,
  SubmittedBid,
  RateItem,
  RateVersion,
  NexusTopic,
  CompanyReview,
  BlacklistCase,
  AppNotification,
  IdempotentEvent,
  UserPresenceState,
  RankingConfig,
  LogisticsIntent,
  KYCDossier,
  BidderGroup,
} from '@/lib/types';

// ─── COLLECTIONS ─────────────────────────────────────────────────────────────
export const COLLECTIONS = {
  // Core Collections (Section 13)
  USERS: 'users',
  ORGANIZATIONS: 'organizations',
  ORGANIZATION_MEMBERS: 'members', // subcollection: organizations/{organizationId}/members
  SECURITY_LOGIN_ATTEMPTS: 'securityLoginAttempts',
  SECURITY_OTPS: 'securityOtps',
  SECURITY_EVENTS: 'securityEvents',
  EMAIL_EVENTS: 'emailEvents',
  SUPPORT_TICKETS: 'supportTickets',
  PROMOTIONAL_SETTINGS: 'promotionalSettings',
  PRICING_PLANS: 'pricingPlans',
  AUDIT_LOGS: 'auditLogs',

  // Application Collections (Section 13)
  PROFILES: 'profiles',
  FEEDS: 'feeds',
  POSTS: 'posts',
  COMMENTS: 'comments',
  THREADS: 'threads',
  REVIEWS: 'reviews',
  BLACKLIST: 'blacklist',
  JOBS: 'jobs',
  JOB_APPLICATIONS: 'jobApplications',
  AUCTIONS: 'auctions',
  AUCTION_BIDS: 'auctionBids',
  RATES: 'rates',
  SHIPMENTS: 'shipments',
  SHIPMENT_CARGO: 'shipmentCargo',
  SHIPMENT_EQUIPMENT: 'shipmentEquipment',
  SHIPMENT_ROUTING: 'shipmentRouting',
  NOTIFICATIONS: 'notifications',
  SYSTEM_ISSUES: 'systemIssues',

  // Additional Operational Collections
  TOPICS: 'nexusTopics',
  CASES: 'blacklistCases',
  EVENTS: 'events',
  PRESENCE: 'presence',
  CONFIGS: 'rankingConfigs',
  INTENTS: 'intents',
  KYC: 'kyc_records',
  BIDDER_GROUPS: 'bidderGroups',
  ADS: 'ads',
  BIDS: 'bids',
} as const;

// ─── POSTS REPOSITORY ────────────────────────────────────────────────────────
export async function getPostsFromDB(options?: {
  limitCount?: number;
  lastDoc?: DocumentSnapshot;
  tradeLane?: string;
  authorUid?: string;
}): Promise<{ posts: FeedPost[]; lastVisibleDoc: DocumentSnapshot | null }> {
  try {
    const coll = collection(db, COLLECTIONS.POSTS);
    let q = query(coll, where('status', '==', 'active'), orderBy('createdAt', 'desc'));

    if (options?.tradeLane) {
      q = query(coll, where('tradeLane', '==', options.tradeLane), where('status', '==', 'active'), orderBy('createdAt', 'desc'));
    }
    if (options?.authorUid) {
      q = query(coll, where('authorUid', '==', options.authorUid), orderBy('createdAt', 'desc'));
    }
    if (options?.limitCount) {
      q = query(q, firestoreLimit(options.limitCount));
    }
    if (options?.lastDoc) {
      q = query(q, startAfter(options.lastDoc));
    }

    const snap = await getDocs(q);
    const posts: FeedPost[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<FeedPost, 'id'>),
    }));

    const lastVisibleDoc = snap.docs.length > 0 ? snap.docs[snap.docs.length - 1] : null;
    return { posts, lastVisibleDoc };
  } catch (err: any) {
    console.warn('[Firestore] Error fetching posts with composite query, attempting fallback query:', err?.message || err);
    try {
      const coll = collection(db, COLLECTIONS.POSTS);
      const fallbackSnap = await getDocs(query(coll, firestoreLimit(options?.limitCount || 50)));
      const posts: FeedPost[] = fallbackSnap.docs
        .map((d) => ({
          id: d.id,
          ...(d.data() as Omit<FeedPost, 'id'>),
        }))
        .filter((p) => p.status !== 'deleted')
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      return { posts, lastVisibleDoc: null };
    } catch (fallbackErr) {
      console.warn('[Firestore] Fallback query also failed:', fallbackErr);
      return { posts: [], lastVisibleDoc: null };
    }
  }
}


export async function upsertPostInDB(post: FeedPost): Promise<void> {
  if (typeof window === 'undefined' || !auth?.currentUser) return;
  try {
    const docRef = doc(db, COLLECTIONS.POSTS, post.id);
    const now = new Date().toISOString();
    const payload = {
      ...post,
      schemaVersion: 2,
      updatedAt: now,
      createdAt: post.createdAt || now,
      status: post.status || 'active',
    };
    await setDoc(docRef, payload, { merge: true });
  } catch {}
}

export async function deletePostInDB(postId: string): Promise<void> {
  if (typeof window === 'undefined' || !auth?.currentUser) return;
  try {
    const docRef = doc(db, COLLECTIONS.POSTS, postId);
    await updateDoc(docRef, { status: 'deleted', updatedAt: new Date().toISOString() });
  } catch {}
}

// ─── AUCTIONS REPOSITORY ─────────────────────────────────────────────────────
export async function getAuctionsFromDB(): Promise<Auction[]> {
  if (typeof window === 'undefined' || !auth?.currentUser) return [];
  try {
    const coll = collection(db, COLLECTIONS.AUCTIONS);
    const q = query(coll, orderBy('startDate', 'desc'), firestoreLimit(50));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Auction, 'id'>),
    }));
  } catch (err) {
    console.warn('[Firestore] Error fetching auctions:', err);
    return [];
  }
}

export async function upsertAuctionInDB(auction: Auction): Promise<void> {
  if (typeof window === 'undefined' || !auth?.currentUser) return;
  try {
    const docRef = doc(db, COLLECTIONS.AUCTIONS, auction.id);
    const now = new Date().toISOString();
    await setDoc(
      docRef,
      {
        ...auction,
        schemaVersion: 2,
        updatedAt: now,
        createdAt: auction.createdAt || now,
      },
      { merge: true }
    );
  } catch {}
}

export async function submitBidInDB(auctionId: string, bid: SubmittedBid): Promise<void> {
  if (typeof window === 'undefined' || !auth?.currentUser) return;
  try {
    const bidRef = doc(db, COLLECTIONS.AUCTIONS, auctionId, COLLECTIONS.BIDS, bid.id);
    await setDoc(bidRef, {
      ...bid,
      submittedAt: new Date().toISOString(),
    });
  } catch {}
}

// ─── RATES REPOSITORY ────────────────────────────────────────────────────────
export async function getRatesFromDB(ownerUid?: string): Promise<RateItem[]> {
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return [];
  }
  try {
    const coll = collection(db, COLLECTIONS.RATES);
    let q = query(coll, firestoreLimit(100));
    if (ownerUid) {
      q = query(coll, where('ownerUid', '==', ownerUid), firestoreLimit(100));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<RateItem, 'id'>),
    }));
  } catch (err) {
    console.warn('[Firestore] Error fetching rates from Cloud:', err);
    return [];
  }
}

export async function upsertRateInDB(rate: RateItem): Promise<void> {
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return;
  }
  try {
    const docRef = doc(db, COLLECTIONS.RATES, rate.id);
    const now = new Date().toISOString();
    await setDoc(
      docRef,
      {
        ...rate,
        schemaVersion: 2,
        updatedAt: now,
        createdAt: rate.createdAt || now,
        status: rate.status || 'active',
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('[Firestore] Error upserting rate in Cloud:', err);
  }
}

export async function deleteRateInDB(rateId: string): Promise<void> {
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return;
  }
  try {
    const docRef = doc(db, COLLECTIONS.RATES, rateId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[Firestore] Error deleting rate in Cloud:', err);
  }
}

export async function batchUpsertRatesInDB(rates: RateItem[]): Promise<void> {
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return;
  }
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();
    for (const r of rates) {
      const docRef = doc(db, COLLECTIONS.RATES, r.id);
      batch.set(
        docRef,
        {
          ...r,
          schemaVersion: 2,
          updatedAt: now,
          createdAt: r.createdAt || now,
          status: r.status || 'active',
        },
        { merge: true }
      );
    }
    await batch.commit();
  } catch (err) {
    console.warn('[Firestore] Error batch upserting rates in Cloud:', err);
  }
}

export async function batchUpdateRatesInDB(
  ratesToUpdate: { id: string; updates: Partial<RateItem>; revision?: RateVersion }[]
): Promise<void> {
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return;
  }
  try {
    const batch = writeBatch(db);
    const now = new Date().toISOString();

    for (const item of ratesToUpdate) {
      const docRef = doc(db, COLLECTIONS.RATES, item.id);
      const payload: Record<string, any> = {
        ...item.updates,
        updatedAt: now,
      };
      if (item.revision) {
        const currentSnap = await getDoc(docRef);
        const currentData = currentSnap.data() as RateItem | undefined;
        const existingVersions = currentData?.versions || [];
        payload.versions = [item.revision, ...existingVersions];
      }
      batch.update(docRef, payload);
    }

    await batch.commit();
  } catch (err) {
    console.warn('[Firestore] Error batch updating rates in Cloud:', err);
  }
}

// ─── IDEMPOTENT TELEMETRY & EVENTS REPOSITORY ────────────────────────────────
export async function recordIdempotentEventsBatchInDB(events: IdempotentEvent[]): Promise<number> {
  let inserted = 0;
  for (const evt of events) {
    if (!memoryEventsStore.has(evt.eventId)) {
      memoryEventsStore.add(evt.eventId);
      inserted++;
    }
  }
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return inserted > 0 ? inserted : events.length;
  }
  try {
    const batch = writeBatch(db);
    for (const evt of events) {
      const docRef = doc(db, COLLECTIONS.EVENTS, evt.eventId);
      batch.set(docRef, evt, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    // Non-blocking
  }
  return inserted > 0 ? inserted : events.length;
}

// ─── PRESENCE REPOSITORY (3-STATE HEARTBEAT) ──────────────────────────────────
export async function updateUserPresenceInDB(state: UserPresenceState): Promise<void> {
  memoryPresenceStore.set(state.userId, state);
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return;
  }
  try {
    const docRef = doc(db, COLLECTIONS.PRESENCE, state.userId);
    await setDoc(docRef, state, { merge: true });
  } catch (err) {
    // Non-blocking
  }
}

export async function getUserPresenceFromDB(userId: string): Promise<UserPresenceState | null> {
  const cached = memoryPresenceStore.get(userId);
  if (cached) {
    const nowSec = Math.floor(Date.now() / 1000);
    if (cached.ttlExpiry && nowSec > cached.ttlExpiry) {
      return { ...cached, status: 'away' };
    }
    return cached;
  }
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return null;
  }
  try {
    const docRef = doc(db, COLLECTIONS.PRESENCE, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as UserPresenceState;

    const nowSec = Math.floor(Date.now() / 1000);
    if (data.ttlExpiry && nowSec > data.ttlExpiry) {
      return { ...data, status: 'away' };
    }
    return data;
  } catch {
    return null;
  }
}

// ─── RANKING CONFIG REPOSITORY ───────────────────────────────────────────────
export async function getRankingConfigFromDB(): Promise<RankingConfig | null> {
  if (memoryRankingConfig) return memoryRankingConfig;
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return null;
  }
  try {
    const docRef = doc(db, COLLECTIONS.CONFIGS, 'default');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      memoryRankingConfig = snap.data() as RankingConfig;
      return memoryRankingConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveRankingConfigInDB(config: RankingConfig): Promise<void> {
  memoryRankingConfig = config;
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return;
  }
  try {
    const docRef = doc(db, COLLECTIONS.CONFIGS, 'default');
    await setDoc(docRef, { ...config, updatedAt: new Date().toISOString() }, { merge: true });
  } catch {}
}

// ─── USER INTENT REPOSITORY ──────────────────────────────────────────────────
export async function getUserIntentFromDB(userId: string): Promise<LogisticsIntent | null> {
  const cached = memoryIntentStore.get(userId);
  if (cached) {
    if (new Date(cached.expiresAt).getTime() < Date.now()) {
      memoryIntentStore.delete(userId);
      return null;
    }
    return cached;
  }
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return null;
  }
  try {
    const docRef = doc(db, COLLECTIONS.INTENTS, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as LogisticsIntent;
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function saveUserIntentInDB(intent: LogisticsIntent): Promise<void> {
  memoryIntentStore.set(intent.userId, intent);
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return;
  }
  try {
    const docRef = doc(db, COLLECTIONS.INTENTS, intent.userId);
    await setDoc(docRef, intent, { merge: true });
  } catch (err) {
    // Non-blocking
  }
}

// ─── KYC DOSSIER REPOSITORY ──────────────────────────────────────────────────
export async function getKYCDossierFromDB(userId: string): Promise<KYCDossier | null> {
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return null;
  }
  try {
    const docRef = doc(db, COLLECTIONS.KYC, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as KYCDossier;
  } catch {
    return null;
  }
}

export async function upsertKYCDossierInDB(dossier: KYCDossier): Promise<void> {
  if (typeof window === 'undefined' || !auth?.currentUser) {
    return;
  }
  try {
    const docRef = doc(db, COLLECTIONS.KYC, dossier.userId);
    await setDoc(docRef, { ...dossier, updatedAt: new Date().toISOString() }, { merge: true });
  } catch {}
}


// ─── BIDDER GROUPS REPOSITORY ────────────────────────────────────────────────
export async function getBidderGroupsFromDB(ownerUid: string): Promise<BidderGroup[]> {
  if (typeof window === 'undefined' || !auth?.currentUser) return [];
  try {
    const coll = collection(db, COLLECTIONS.BIDDER_GROUPS);
    const q = query(coll, where('ownerUid', '==', ownerUid));
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<BidderGroup, 'id'>),
    }));
  } catch {
    return [];
  }
}

export async function saveBidderGroupInDB(group: BidderGroup): Promise<void> {
  if (typeof window === 'undefined' || !auth?.currentUser) return;
  try {
    const docRef = doc(db, COLLECTIONS.BIDDER_GROUPS, group.id);
    await setDoc(docRef, { ...group, updatedAt: new Date().toISOString() }, { merge: true });
  } catch {}
}

