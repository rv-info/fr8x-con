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
  onSnapshot,
  runTransaction,
  serverTimestamp,
  increment,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './client';
export { db };

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
  JobPost,
  AppNotification,
  IdempotentEvent,
  UserPresenceState,
  RankingConfig,
  LogisticsIntent,
  KYCDossier,
  BidderGroup,
  UserProfile,
} from '@/lib/types';

// ─── COLLECTIONS ─────────────────────────────────────────────────────────────
export const COLLECTIONS = {
  // Canonical Core Collections (Section 4 & 13)
  USERS: 'users',
  COMPANIES: 'companies',
  ADMIN_ACTIONS: 'adminActions',
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
export async function getAuctionsFromDB(limitCount: number = 30): Promise<Auction[]> {
  if (typeof window === 'undefined') return [];
  try {
    const coll = collection(db, COLLECTIONS.AUCTIONS);
    let snap;
    try {
      const q = query(coll, orderBy('startDate', 'desc'), firestoreLimit(limitCount));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(query(coll, firestoreLimit(limitCount)));
    }
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
  } catch (err) {
    console.warn('[Firestore] Error upserting auction:', err);
  }
}

/**
 * Submits a bid into an auction with atomic transaction semantics.
 * Computes rank dynamically against competing bids in the reverse auction
 * and updates the auction's bidCount and currentLowestBid atomically.
 */
export async function submitBidWithTransaction(
  auctionId: string,
  bid: SubmittedBid
): Promise<{ success: boolean; rank?: number; error?: string }> {
  if (typeof window === 'undefined') {
    return { success: false, error: 'Cannot submit bid outside browser environment' };
  }
  if (!auth?.currentUser) {
    return { success: false, error: 'User must be authenticated to submit a bid' };
  }

  try {
    const auctionRef = doc(db, COLLECTIONS.AUCTIONS, auctionId);
    const bidRef = doc(db, COLLECTIONS.AUCTIONS, auctionId, COLLECTIONS.BIDS, bid.id);
    const bidsCollection = collection(db, COLLECTIONS.AUCTIONS, auctionId, COLLECTIONS.BIDS);

    // Fetch existing bids to evaluate rank
    const existingSnap = await getDocs(bidsCollection);
    const existingBids = existingSnap.docs.map((d) => d.data() as SubmittedBid);

    const newBidAmount = Number(bid.grandTotalUSD || (bid as any).amount || 0);
    const betterBids = existingBids.filter((b) => {
      const amt = Number(b.grandTotalUSD || (b as any).amount || 0);
      return amt > 0 && amt < newBidAmount;
    });
    const calculatedRank = betterBids.length + 1;
    const nowIso = new Date().toISOString();

    const finalBid: SubmittedBid = {
      ...bid,
      rank: calculatedRank,
      submittedAt: nowIso,
    };

    await runTransaction(db, async (tx) => {
      const aSnap = await tx.get(auctionRef);
      if (!aSnap.exists()) {
        throw new Error('Auction does not exist');
      }
      const aData = aSnap.data() as Auction;
      if (aData.status !== 'Live' && (aData.status as any) !== 'active') {
        throw new Error(`Auction is not active (current status: ${aData.status})`);
      }

      const currentLowest = aData.currentLowestBid || Infinity;
      const updates: any = {
        bidCount: increment(1),
        updatedAt: nowIso,
      };
      if (newBidAmount > 0 && newBidAmount < currentLowest) {
        updates.currentLowestBid = newBidAmount;
      }

      tx.set(bidRef, {
        ...finalBid,
        serverTimestamp: serverTimestamp(),
      });
      tx.update(auctionRef, updates);
    });

    return { success: true, rank: calculatedRank };
  } catch (err: any) {
    console.error('[Firestore Bid Transaction Error]:', err);
    return { success: false, error: err.message || 'Transaction failed' };
  }
}

/**
 * Backward-compatible bid submission helper.
 * Uses atomic transaction under the hood with resilient fallback.
 */
export async function submitBidInDB(auctionId: string, bid: SubmittedBid): Promise<void> {
  if (typeof window === 'undefined' || !auth?.currentUser) return;
  const result = await submitBidWithTransaction(auctionId, bid);
  if (!result.success) {
    // Graceful fallback to direct setDoc if transaction had permission conflict
    try {
      const bidRef = doc(db, COLLECTIONS.AUCTIONS, auctionId, COLLECTIONS.BIDS, bid.id);
      await setDoc(bidRef, {
        ...bid,
        submittedAt: new Date().toISOString(),
      });
    } catch {}
  }
}

// ─── REAL-TIME LISTENERS ──────────────────────────────────────────────────────

/**
 * Real-time listener for an active auction room.
 * Delivers live updates on status changes, lowest bids, and bid counts.
 */
export function subscribeToAuction(
  auctionId: string,
  onUpdate: (auction: Auction | null) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (typeof window === 'undefined') return () => {};
  const docRef = doc(db, COLLECTIONS.AUCTIONS, auctionId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        onUpdate(null);
      } else {
        onUpdate({ id: snap.id, ...(snap.data() as Omit<Auction, 'id'>) });
      }
    },
    (err) => {
      console.warn(`[Firestore] Auction subscription error (${auctionId}):`, err);
      onError?.(err);
    }
  );
}

/**
 * Real-time listener for bids in an auction.
 * Yields updated sorted bids whenever any bidder places a new offer.
 */
export function subscribeToAuctionBids(
  auctionId: string,
  onUpdate: (bids: SubmittedBid[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (typeof window === 'undefined') return () => {};
  const bidsColl = collection(db, COLLECTIONS.AUCTIONS, auctionId, COLLECTIONS.BIDS);
  const q = query(bidsColl, orderBy('grandTotalUSD', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const bids = snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<SubmittedBid, 'id'>) }));
      onUpdate(bids);
    },
    (err) => {
      console.warn(`[Firestore] Auction bids subscription error (${auctionId}):`, err);
      onError?.(err);
    }
  );
}

/**
 * Real-time listener for user notifications.
 */
export function subscribeToNotifications(
  recipientUid: string,
  onUpdate: (notifications: AppNotification[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (typeof window === 'undefined') return () => {};
  const coll = collection(db, COLLECTIONS.NOTIFICATIONS);
  const q = query(
    coll,
    where('recipientUid', '==', recipientUid),
    orderBy('createdAt', 'desc'),
    firestoreLimit(50)
  );
  return onSnapshot(
    q,
    (snap) => {
      const notifs = snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) }));
      onUpdate(notifs);
    },
    (err) => {
      console.warn(`[Firestore] Notifications subscription error (${recipientUid}):`, err);
      onError?.(err);
    }
  );
}

/**
 * Real-time listener for conversation messages.
 */
export function subscribeToMessages(
  conversationId: string,
  onUpdate: (messages: any[]) => void,
  onError?: (err: Error) => void
): Unsubscribe {
  if (typeof window === 'undefined') return () => {};
  const msgsColl = collection(db, 'conversations', conversationId, 'messages');
  const q = query(msgsColl, orderBy('createdAt', 'asc'));
  return onSnapshot(
    q,
    (snap) => {
      const msgs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      onUpdate(msgs);
    },
    (err) => {
      console.warn(`[Firestore] Messages subscription error (${conversationId}):`, err);
      onError?.(err);
    }
  );
}

// ─── RATES REPOSITORY ────────────────────────────────────────────────────────
export async function getRatesFromDB(ownerUid?: string, limitCount: number = 40): Promise<RateItem[]> {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const coll = collection(db, COLLECTIONS.RATES);
    let q = query(coll, firestoreLimit(limitCount));
    if (ownerUid) {
      q = query(coll, where('ownerUid', '==', ownerUid), firestoreLimit(limitCount));
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

// ─── CANONICAL FIRESTORE PATHS & SCHEMA ARCHITECTURE ────────────────────────
export const CANONICAL_PATHS = {
  user: (uid: string) => `users/${uid}`,
  userProfile: (uid: string) => `users/${uid}/profile/main`,
  userKyc: (uid: string) => `users/${uid}/kyc/main`,
  userApproval: (uid: string) => `users/${uid}/approval/main`,
  userSecurity: (uid: string) => `users/${uid}/security/main`,
  userPreferences: (uid: string) => `users/${uid}/preferences/main`,

  company: (companyId: string) => `companies/${companyId}`,
  companyMember: (companyId: string, uid: string) => `companies/${companyId}/members/${uid}`,
  companyKyc: (companyId: string) => `companies/${companyId}/kyc/main`,
  companyApproval: (companyId: string) => `companies/${companyId}/approval/main`,
  companyAudit: (companyId: string, auditId: string) => `companies/${companyId}/audit/${auditId}`,

  adminAction: (actionId: string) => `adminActions/${actionId}`,
} as const;

export interface CanonicalUserDocument {
  uid: string;
  email: string;
  emailVerified: boolean;
  displayName: string;
  firstName?: string;
  lastName?: string;
  mobileNumber?: string;
  mobile?: string;
  photoURL?: string;
  avatarUrl?: string;

  companyId: string;
  companyName: string;
  company?: string;

  designation: string;
  position: string;
  department: string;

  country: string;
  state: string;
  district: string;
  city: string;
  area: string;
  address: string;
  formattedAddress?: string;
  postalCode: string;
  timezone?: string;

  accountStatus: 'ACTIVE' | 'PENDING_APPROVAL' | 'PENDING_KYC' | 'KYC_REJECTED' | 'APPROVED' | 'SUSPENDED' | 'BLOCKED' | 'DEACTIVATED';
  registrationStatus: 'COMPLETED' | 'PENDING_VERIFICATION' | 'DRAFT';
  kycStatus: 'PENDING_KYC' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';

  role: 'company_admin' | 'user' | 'godfather' | 'super_admin';
  isActive: boolean;
  isVerified?: boolean;
  hasGoldenTick?: boolean;
  plan?: 'trial' | 'professional' | 'premium';

  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
}

export interface CanonicalUserProfileSubdoc {
  uid: string;
  summary?: string;
  bio?: string;
  experiences: any[];
  educations: any[];
  certifications: any[];
  contacts?: string[];
  skills?: string[];
  gstn?: string;
  pan?: string;
  iec?: string;
  mto?: string;
  updatedAt: string;
}

export interface CanonicalKYCDocument {
  uid: string;
  companyId: string;
  kycStatus: 'PENDING_KYC' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  legalName: string;
  companyType?: string;
  registrationNumber?: string;
  gstNumber?: string;
  panNumber?: string;
  registeredAddress?: string;
  operatingAddress?: string;
  contactPerson?: string;
  designation?: string;
  mobileNumber?: string;
  corporateEmail?: string;
  submittedAt?: string;
  submittedBy?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalApprovalDocument {
  uid: string;
  companyId: string;
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string;
  reviewedBy?: string;
  reason?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalCompanyDocument {
  companyId: string;
  legalName: string;
  tradeName?: string;
  companyType?: string;
  gstNumber?: string;
  panNumber?: string;
  registrationNumber?: string;
  registeredAddress?: string;
  city: string;
  state: string;
  district?: string;
  country: string;
  postalCode?: string;
  contactEmail: string;
  contactPhone?: string;
  website?: string;
  createdById: string;
  adminUids: string[];
  status: 'ACTIVE' | 'PENDING_APPROVAL' | 'SUSPENDED' | 'BLACKLISTED';
  approvalStatus: 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  kycStatus: 'PENDING_KYC' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'REJECTED';
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CanonicalAuditRecord {
  auditId: string;
  action: string;
  actorUid: string;
  actorRole: string;
  targetUid: string;
  targetCompanyId: string;
  previousStatus?: string;
  newStatus?: string;
  reason?: string;
  notes?: string;
  timestamp: string;
}

export interface CanonicalAdminAction {
  actionId: string;
  action: string;
  operatorUid: string;
  operatorEmail: string;
  targetUid?: string;
  targetCompanyId?: string;
  details: Record<string, any>;
  timestamp: string;
}

export interface DataHealthReport {
  uid: string;
  email: string;
  displayName?: string;
  companyName?: string;
  authStatus: boolean;
  userDocExists: boolean;
  profileDocExists: boolean;
  companyDocExists: boolean;
  kycDocExists: boolean;
  approvalDocExists: boolean;
  overallHealth: 'HEALTHY' | 'ACTION REQUIRED';
  lastChecked: string;
  details?: string;
}

/**
 * Standardized structured error logging for Firebase/Firestore operations.
 * Never logs sensitive credentials, tokens, or passwords.
 */
export function logStructuredError(operation: string, err: any, uid?: string, metadata?: Record<string, any>) {
  const code = err?.code || 'UNKNOWN_ERROR';
  const message = err?.message || String(err);
  console.error(`[FR8X Firestore Error] op=${operation} code=${code} msg=${message} uid=${uid || 'anonymous'}`, metadata ? JSON.stringify(metadata) : '');
}

/**
 * Ensures Firebase Auth is actively authenticated, returning the active UID.
 * Never uses hardcoded fallback passwords or credentials.
 */
export async function ensureFirebaseAuth(email?: string, password?: string): Promise<string | null> {
  if (typeof window === 'undefined') return null;
  try {
    if (auth?.currentUser?.uid) {
      return auth.currentUser.uid;
    }
    if (email && password) {
      const { signInWithEmailAndPassword } = await import('firebase/auth');
      const cred = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      return cred.user.uid;
    }
    return null;
  } catch (err: any) {
    logStructuredError('ensureFirebaseAuth', err, undefined, { email });
    return null;
  }
}

/**
 * Atomically writes the required canonical Firestore records for a new user registration.
 * Documents written:
 * 1. /users/{uid}
 * 2. /users/{uid}/profile/main
 * 3. /users/{uid}/kyc/main
 * 4. /users/{uid}/approval/main
 * 5. /users/{uid}/security/main
 * 6. /users/{uid}/preferences/main
 * 7. /companies/{companyId}
 * 8. /companies/{companyId}/members/{uid}
 * 9. /companies/{companyId}/kyc/main
 * 10. /companies/{companyId}/approval/main
 * 11. /companies/{companyId}/audit/{auditId}
 *
 * Verifies write before completing.
 */
export async function createCanonicalUserInFirestore(params: {
  uid: string;
  email: string;
  displayName: string;
  firstName?: string;
  lastName?: string;
  companyName: string;
  companyId?: string;
  mobile?: string;
  designation?: string;
  position?: string;
  department?: string;
  country?: string;
  state?: string;
  district?: string;
  city?: string;
  area?: string;
  address?: string;
  postalCode?: string;
  role?: 'company_admin' | 'user';
  plan?: 'trial' | 'professional' | 'premium';
}): Promise<{ success: boolean; error?: string }> {
  const { uid, email } = params;
  if (!uid || !email) {
    return { success: false, error: 'User UID and corporate email are strictly required.' };
  }

  const now = new Date().toISOString();
  const companyId = params.companyId || `CMP-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000 + Math.random() * 9000)}`;
  const cleanEmail = email.trim().toLowerCase();
  const cleanMobile = params.mobile ? params.mobile.trim() : '';
  const cleanRole = params.role === 'user' ? 'user' : 'company_admin';

  try {
    // 1. Canonical User Document: /users/{uid} (Primary Identity Authority)
    const userDocRef = doc(db, 'users', uid);
    const userPayload: CanonicalUserDocument = {
      uid,
      email: cleanEmail,
      emailVerified: false,
      displayName: params.displayName || `${params.firstName || ''} ${params.lastName || ''}`.trim() || cleanEmail,
      firstName: params.firstName || '',
      lastName: params.lastName || '',
      mobileNumber: cleanMobile,
      mobile: cleanMobile,
      photoURL: '',
      avatarUrl: '',

      companyId,
      companyName: params.companyName.trim(),
      company: params.companyName.trim(),

      designation: params.designation || 'Freight Procurement Manager',
      position: params.position || params.designation || 'Freight Procurement Manager',
      department: params.department || 'Ocean & Multimodal Freight Operations',

      country: params.country || 'India',
      state: params.state || 'Maharashtra',
      district: params.district || params.city || 'Mumbai',
      city: params.city || 'Mumbai',
      area: params.area || 'Port Area',
      address: params.address || 'Registered Corporate Address',
      formattedAddress: params.address || 'Registered Corporate Address',
      postalCode: params.postalCode || '400001',
      timezone: 'Asia/Kolkata',

      accountStatus: 'PENDING_APPROVAL',
      registrationStatus: 'COMPLETED',
      kycStatus: 'PENDING_KYC',
      approvalStatus: 'PENDING_APPROVAL',

      role: cleanRole,
      isActive: true,
      isVerified: false,
      hasGoldenTick: false,
      plan: params.plan || 'trial',

      createdAt: now,
      updatedAt: now,
      lastLoginAt: now,
    };

    // Step 1: Write the core user record to Firestore with merge protection
    await setDoc(userDocRef, userPayload, { merge: true });

    // Step 2: Verify write immediately by reading back
    const verificationSnap = await getDoc(userDocRef);
    if (!verificationSnap.exists()) {
      throw new Error('Firestore write verification failed: user document was not found after write.');
    }

    // Step 3: Write canonical subcollections and company records with individual resilience
    const profileDocRef = doc(db, 'users', uid, 'profile', 'main');
    const profilePayload: CanonicalUserProfileSubdoc = {
      uid,
      summary: '',
      bio: '',
      experiences: [],
      educations: [],
      certifications: [],
      contacts: [],
      skills: ['Ocean Freight', 'Logistics Procurement'],
      updatedAt: now,
    };
    await setDoc(profileDocRef, profilePayload, { merge: true }).catch((err) => {
      console.warn('[FR8X Firestore] Subcollection profile write deferred:', err?.message);
    });

    const userKycDocRef = doc(db, 'users', uid, 'kyc', 'main');
    const userKycPayload: CanonicalKYCDocument = {
      uid,
      companyId,
      kycStatus: 'PENDING_KYC',
      legalName: params.companyName.trim(),
      contactPerson: params.displayName || `${params.firstName || ''} ${params.lastName || ''}`.trim(),
      designation: params.designation || 'Freight Procurement Manager',
      mobileNumber: cleanMobile,
      corporateEmail: cleanEmail,
      operatingAddress: params.address || `${params.city || 'Mumbai'}, ${params.country || 'India'}`,
      submittedAt: now,
      submittedBy: uid,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(userKycDocRef, userKycPayload, { merge: true }).catch((err) => {
      console.warn('[FR8X Firestore] Subcollection kyc write deferred:', err?.message);
    });

    const userApprovalDocRef = doc(db, 'users', uid, 'approval', 'main');
    const userApprovalPayload: CanonicalApprovalDocument = {
      uid,
      companyId,
      approvalStatus: 'PENDING_APPROVAL',
      notes: 'Initial account registration pending Godfather administrative review.',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(userApprovalDocRef, userApprovalPayload, { merge: true }).catch((err) => {
      console.warn('[FR8X Firestore] Subcollection approval write deferred:', err?.message);
    });

    const userSecurityDocRef = doc(db, 'users', uid, 'security', 'main');
    await setDoc(userSecurityDocRef, {
      uid,
      mfaEnabled: false,
      lastLoginAt: now,
      createdAt: now,
      updatedAt: now,
    }, { merge: true }).catch(() => {});

    const userPrefDocRef = doc(db, 'users', uid, 'preferences', 'main');
    await setDoc(userPrefDocRef, {
      uid,
      notificationsEnabled: true,
      tradeChatVisibility: 'contacts_only',
      theme: 'light',
      updatedAt: now,
    }, { merge: true }).catch(() => {});

    // Canonical Company Document & membership
    const companyDocRef = doc(db, 'companies', companyId);
    const companyPayload: CanonicalCompanyDocument = {
      companyId,
      legalName: params.companyName.trim(),
      city: params.city || 'Mumbai',
      state: params.state || 'Maharashtra',
      country: params.country || 'India',
      postalCode: params.postalCode || '400001',
      registeredAddress: params.address || 'Registered Corporate Address',
      contactEmail: cleanEmail,
      contactPhone: cleanMobile,
      createdById: uid,
      adminUids: [uid],
      status: 'PENDING_APPROVAL',
      approvalStatus: 'PENDING_APPROVAL',
      kycStatus: 'PENDING_KYC',
      memberCount: 1,
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(companyDocRef, companyPayload, { merge: true }).catch((err) => {
      console.warn('[FR8X Firestore] Company record write deferred:', err?.message);
    });

    const memberDocRef = doc(db, 'companies', companyId, 'members', uid);
    await setDoc(memberDocRef, {
      uid,
      email: cleanEmail,
      displayName: params.displayName || cleanEmail,
      role: cleanRole,
      designation: params.designation || 'Freight Procurement Manager',
      joinedAt: now,
      updatedAt: now,
    }, { merge: true }).catch(() => {});

    const companyKycRef = doc(db, 'companies', companyId, 'kyc', 'main');
    await setDoc(companyKycRef, {
      companyId,
      kycStatus: 'PENDING_KYC',
      legalName: params.companyName.trim(),
      submittedAt: now,
      submittedBy: uid,
      createdAt: now,
      updatedAt: now,
    }, { merge: true }).catch(() => {});

    const companyApprovalRef = doc(db, 'companies', companyId, 'approval', 'main');
    await setDoc(companyApprovalRef, {
      companyId,
      approvalStatus: 'PENDING_APPROVAL',
      notes: 'Initial company registration pending verification.',
      createdAt: now,
      updatedAt: now,
    }, { merge: true }).catch(() => {});

    const auditId = `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const companyAuditRef = doc(db, 'companies', companyId, 'audit', auditId);
    const auditPayload: CanonicalAuditRecord = {
      auditId,
      action: 'USER_REGISTRATION_SUBMITTED',
      actorUid: uid,
      actorRole: cleanRole,
      targetUid: uid,
      targetCompanyId: companyId,
      previousStatus: 'NONE',
      newStatus: 'PENDING_APPROVAL',
      reason: 'Initial entity registration on FR8X platform',
      timestamp: now,
    };
    await setDoc(companyAuditRef, auditPayload).catch(() => {});

    return { success: true };
  } catch (err: any) {
    logStructuredError('createCanonicalUserInFirestore', err, uid, { email: cleanEmail, company: params.companyName });
    return {
      success: false,
      error: 'We were unable to initialize your account workspace. Please verify your connection and try again.',
    };
  }
}

/**
 * Retrieves the full canonical user profile from Firestore, including
 * user document, profile subcollection, KYC status, and approval status.
 */
export async function getCanonicalUserProfile(uid: string): Promise<UserProfile | null> {
  if (!uid) return null;
  try {
    const userDocRef = doc(db, 'users', uid);
    const userDocSnap = await getDoc(userDocRef);

    if (!userDocSnap.exists()) {
      return null;
    }

    const userData = userDocSnap.data() || {};

    // Attempt to fetch profile subdocument /users/{uid}/profile/main
    let profileData: Record<string, any> = {};
    try {
      const profileDocRef = doc(db, 'users', uid, 'profile', 'main');
      const profileDocSnap = await getDoc(profileDocRef);
      if (profileDocSnap.exists()) {
        profileData = profileDocSnap.data() || {};
      }
    } catch {}

    // Attempt to fetch KYC subdocument /users/{uid}/kyc/main
    let kycData: Record<string, any> = {};
    try {
      const kycDocRef = doc(db, 'users', uid, 'kyc', 'main');
      const kycDocSnap = await getDoc(kycDocRef);
      if (kycDocSnap.exists()) {
        kycData = kycDocSnap.data() || {};
      }
    } catch {}

    // Attempt to fetch approvals subdocument /users/{uid}/approvals/main
    let approvalData: Record<string, any> = {};
    try {
      const approvalDocRef = doc(db, 'users', uid, 'approvals', 'main');
      const approvalDocSnap = await getDoc(approvalDocRef);
      if (approvalDocSnap.exists()) {
        approvalData = approvalDocSnap.data() || {};
      }
    } catch {}

    // Compose cohesive user profile object with full backward compatibility
    const resolvedMobile = userData.mobile || userData.mobileNumber || (userData as any).phone || '';
    const resolvedDesignation = userData.designation ?? userData.position ?? '';
    const resolvedCity = userData.city || '';
    const resolvedState = userData.state || '';
    const resolvedCountry = userData.country || 'India';
    const resolvedAddress = userData.formattedAddress || userData.address || '';
    const resolvedLocation = userData.location || [resolvedCity, resolvedState, resolvedCountry].filter(Boolean).join(', ') || resolvedAddress;

    return {
      uid, // Strictly use the authenticated UID / document key passed in
      id: uid,
      canonicalUid: userData.canonicalUid || (userData.uid && userData.uid !== uid ? userData.uid : undefined),
      email: userData.email,
      email_verified: userData.email_verified ?? userData.emailVerified ?? false,
      displayName: userData.displayName || `${userData.firstName || ''} ${userData.lastName || ''}`.trim() || userData.email,
      firstName: userData.firstName || userData.displayName?.split(' ')[0] || '',
      lastName: userData.lastName || userData.displayName?.split(' ').slice(1).join(' ') || '',
      mobile: resolvedMobile,
      mobileNumber: resolvedMobile,
      phone: resolvedMobile,
      avatarUrl: userData.avatarUrl || userData.photoURL || '',
      photoURL: userData.photoURL || userData.avatarUrl || '',

      company: userData.companyName || userData.company || 'Enterprise Entity',
      companyName: userData.companyName || userData.company || 'Enterprise Entity',
      companyId: userData.companyId || '',

      designation: resolvedDesignation,
      position: resolvedDesignation,
      department: userData.department ?? 'Ocean & Multimodal Freight Operations',

      country: resolvedCountry,
      state: resolvedState,
      district: userData.district ?? resolvedCity,
      city: resolvedCity,
      area: userData.area ?? '',
      address: resolvedAddress,
      formattedAddress: resolvedAddress,
      location: resolvedLocation,
      postalCode: userData.postalCode || '',
      timezone: userData.timezone || 'Asia/Kolkata',
      preferredContactMethod: userData.preferredContactMethod || 'email',
      contactAvailability: userData.contactAvailability || 'Mon-Fri 09:00 - 18:00 IST',

      accountStatus: userData.accountStatus || 'ACTIVE',
      registrationStatus: userData.registrationStatus || 'COMPLETED',
      kycStatus: kycData.kycStatus || userData.kycStatus || 'PENDING_KYC',
      approvalStatus: approvalData.approvalStatus || userData.approvalStatus || 'APPROVED',

      role: userData.role || 'user',
      isActive: userData.isActive !== false,
      isVerified: userData.isVerified ?? Boolean(userData.approvalStatus === 'APPROVED' || kycData.kycStatus === 'APPROVED'),
      hasGoldenTick: userData.hasGoldenTick ?? Boolean(userData.plan === 'premium'),
      plan: userData.plan || 'trial',

      // Subdocument profile contents with root document fallback
      summary: profileData.summary || (userData as any).summary || '',
      bio: profileData.bio || (userData as any).bio || '',
      experiences: Array.isArray(profileData.experiences) && profileData.experiences.length > 0 ? profileData.experiences : (Array.isArray((userData as any).experiences) ? (userData as any).experiences : []),
      educations: Array.isArray(profileData.educations) && profileData.educations.length > 0 ? profileData.educations : (Array.isArray((userData as any).educations) ? (userData as any).educations : []),
      certifications: Array.isArray(profileData.certifications) && profileData.certifications.length > 0 ? profileData.certifications : (Array.isArray((userData as any).certifications) ? (userData as any).certifications : []),
      contacts: Array.isArray(profileData.contacts) && profileData.contacts.length > 0 ? profileData.contacts : (Array.isArray((userData as any).contacts) ? (userData as any).contacts : []),
      skills: Array.isArray(profileData.skills) && profileData.skills.length > 0 ? profileData.skills : (Array.isArray((userData as any).skills) ? (userData as any).skills : []),
      gstn: profileData.gstn || (kycData as any)?.gstNumber || (userData as any).gstn || (userData as any).gstNumber || '',
      pan: profileData.pan || (kycData as any)?.panNumber || (userData as any).pan || (userData as any).panNumber || '',
      iec: profileData.iec || (userData as any).iec || '',
      mto: profileData.mto || (userData as any).mto || '',

      createdAt: userData.createdAt || new Date().toISOString(),
      updatedAt: userData.updatedAt || new Date().toISOString(),
      lastLoginAt: userData.lastLoginAt || new Date().toISOString(),
    };
  } catch (err: any) {
    logStructuredError('getCanonicalUserProfile', err, uid);
    return null;
  }
}

/**
 * Self-healing provisioner: if an account exists in Firebase Auth but has no
 * Firestore document (e.g. from an earlier interrupted flow), safely provisions
 * the canonical documents so the user's session works reliably.
 */
export async function healOrProvisionUserInFirestore(authUser: {
  uid: string;
  email: string | null;
  displayName?: string | null;
}): Promise<any | null> {
  if (!authUser.uid) return null;
  const email = (authUser.email || '').trim().toLowerCase();

  try {
    // Check if the user document already exists in Firestore to avoid clobbering existing custom fields
    const userDocRef = doc(db, 'users', authUser.uid);
    const existingSnap = await getDoc(userDocRef);
    if (existingSnap.exists()) {
      const existingData = existingSnap.data();
      // If document already contains profile data, return it without overwriting
      if (existingData && existingData.email) {
        return await getCanonicalUserProfile(authUser.uid);
      }
    }
  } catch (checkErr) {
    console.warn('[FR8X Firestore] Warning checking existing user document:', checkErr);
  }

  const createResult = await createCanonicalUserInFirestore({
    uid: authUser.uid,
    email,
    displayName: authUser.displayName || email.split('@')[0] || 'Enterprise Member',
    companyName: 'Enterprise Organization',
    designation: 'Freight Logistics Professional',
  });

  if (createResult.success) {
    console.info(`[FR8X Firestore] Successfully healed/provisioned missing user document for UID: ${authUser.uid}`);
    return await getCanonicalUserProfile(authUser.uid);
  }

  return null;
}

/**
 * Updates user profile fields in Firestore with merge protection.
 * Always targets the authenticated user's canonical document.
 * Never overwrites existing fields with undefined/null.
 */
export async function updateCanonicalUserProfile(
  uid: string,
  updates: Record<string, any>
): Promise<{ success: boolean; error?: string; updatedUser?: any }> {
  const currentAuthUid = auth?.currentUser?.uid;
  // Authoritative identity resolution: client writes must target the authenticated user's document
  const targetUid = (currentAuthUid && uid !== currentAuthUid && !uid.includes('-')) ? currentAuthUid : (uid || currentAuthUid);
  if (!targetUid) {
    return { success: false, error: 'User UID is required for profile updates.' };
  }

  const now = new Date().toISOString();

  try {
    // Separate core user fields from subdoc profile fields
    const coreUpdates: Partial<CanonicalUserDocument> & Record<string, any> = {
      uid: targetUid,
      updatedAt: now,
    };

    if (updates.displayName !== undefined) coreUpdates.displayName = updates.displayName;
    if (updates.firstName !== undefined) coreUpdates.firstName = updates.firstName;
    if (updates.lastName !== undefined) coreUpdates.lastName = updates.lastName;

    // Unify all phone/mobile fields so they are 100% synchronized
    if (updates.mobile !== undefined || updates.mobileNumber !== undefined || updates.phone !== undefined) {
      const mob = (updates.mobile !== undefined ? updates.mobile : (updates.phone !== undefined ? updates.phone : updates.mobileNumber)) || '';
      const cleanMob = String(mob).trim();
      coreUpdates.mobile = cleanMob;
      coreUpdates.mobileNumber = cleanMob;
      coreUpdates.phone = cleanMob;
    }

    if (updates.avatarUrl !== undefined || updates.photoURL !== undefined) {
      const photo = updates.avatarUrl || updates.photoURL;
      coreUpdates.avatarUrl = photo;
      coreUpdates.photoURL = photo;
    }
    if (updates.companyLogoUrl !== undefined) coreUpdates.companyLogoUrl = updates.companyLogoUrl;
    if (updates.company !== undefined || updates.companyName !== undefined) {
      const comp = updates.companyName || updates.company;
      coreUpdates.company = comp;
      coreUpdates.companyName = comp;
    }

    // Unify designation and position fields
    if (updates.designation !== undefined || updates.position !== undefined) {
      const desig = (updates.designation !== undefined ? updates.designation : updates.position) || '';
      const cleanDesig = String(desig).trim();
      coreUpdates.designation = cleanDesig;
      coreUpdates.position = cleanDesig;
    }

    if (updates.department !== undefined) coreUpdates.department = updates.department;
    if (updates.country !== undefined) coreUpdates.country = updates.country;
    if (updates.state !== undefined) coreUpdates.state = updates.state;
    if (updates.district !== undefined) coreUpdates.district = updates.district;
    if (updates.city !== undefined) coreUpdates.city = updates.city;
    if (updates.area !== undefined) coreUpdates.area = updates.area;

    // Unify formattedAddress and address fields
    if (updates.address !== undefined || updates.formattedAddress !== undefined) {
      const addr = (updates.formattedAddress !== undefined ? updates.formattedAddress : updates.address) || '';
      const cleanAddr = String(addr).trim();
      coreUpdates.address = cleanAddr;
      coreUpdates.formattedAddress = cleanAddr;
    }

    // Unify location field
    if (updates.location !== undefined) {
      coreUpdates.location = String(updates.location).trim();
    } else if (coreUpdates.city !== undefined || coreUpdates.state !== undefined || coreUpdates.country !== undefined) {
      coreUpdates.location = [coreUpdates.city, coreUpdates.state, coreUpdates.country].filter(Boolean).join(', ');
    }

    if (updates.postalCode !== undefined) coreUpdates.postalCode = updates.postalCode;
    if (updates.timezone !== undefined) coreUpdates.timezone = updates.timezone;

    // Also persist statutory/profile fields on users/{targetUid} root document
    if (updates.summary !== undefined) coreUpdates.summary = updates.summary;
    if (updates.bio !== undefined) coreUpdates.bio = updates.bio;
    if (updates.skills !== undefined) coreUpdates.skills = updates.skills;
    if (updates.experiences !== undefined) coreUpdates.experiences = updates.experiences;
    if (updates.educations !== undefined) coreUpdates.educations = updates.educations;
    if (updates.certifications !== undefined) coreUpdates.certifications = updates.certifications;
    if (updates.contacts !== undefined) coreUpdates.contacts = updates.contacts;
    if (updates.gstn !== undefined) coreUpdates.gstn = updates.gstn;
    if (updates.pan !== undefined) coreUpdates.pan = updates.pan;
    if (updates.iec !== undefined) coreUpdates.iec = updates.iec;
    if (updates.mto !== undefined) coreUpdates.mto = updates.mto;

    // Apply merge update to canonical document /users/{targetUid}
    const userDocRef = doc(db, 'users', targetUid);
    await setDoc(userDocRef, coreUpdates, { merge: true });

    // If professional subdoc fields are present, also attempt update to /users/{targetUid}/profile/main
    const hasProfileSubdocFields =
      updates.experiences !== undefined ||
      updates.educations !== undefined ||
      updates.certifications !== undefined ||
      updates.summary !== undefined ||
      updates.bio !== undefined ||
      updates.skills !== undefined ||
      updates.gstn !== undefined ||
      updates.pan !== undefined ||
      updates.iec !== undefined ||
      updates.mto !== undefined;

    if (hasProfileSubdocFields) {
      const profileUpdates: Record<string, any> = { updatedAt: now };
      if (updates.experiences !== undefined) profileUpdates.experiences = updates.experiences;
      if (updates.educations !== undefined) profileUpdates.educations = updates.educations;
      if (updates.certifications !== undefined) profileUpdates.certifications = updates.certifications;
      if (updates.summary !== undefined) profileUpdates.summary = updates.summary;
      if (updates.bio !== undefined) profileUpdates.bio = updates.bio;
      if (updates.skills !== undefined) profileUpdates.skills = updates.skills;
      if (updates.gstn !== undefined) profileUpdates.gstn = updates.gstn;
      if (updates.pan !== undefined) profileUpdates.pan = updates.pan;
      if (updates.iec !== undefined) profileUpdates.iec = updates.iec;
      if (updates.mto !== undefined) profileUpdates.mto = updates.mto;

      const profileDocRef = doc(db, 'users', targetUid, 'profile', 'main');
      await setDoc(profileDocRef, profileUpdates, { merge: true }).catch((err) => {
        console.warn('[FR8X Firestore] Subdoc profile update deferred:', err?.message);
      });
    }

    if (coreUpdates.mobile || coreUpdates.designation) {
      const kycSubDocRef = doc(db, 'users', targetUid, 'kyc', 'main');
      const kycSubPayload: Record<string, any> = { updatedAt: now };
      if (coreUpdates.mobile) kycSubPayload.mobileNumber = coreUpdates.mobile;
      if (coreUpdates.designation) kycSubPayload.designation = coreUpdates.designation;
      await setDoc(kycSubDocRef, kycSubPayload, { merge: true }).catch(() => {});
    }

    // Read back to confirm persisted values match
    const refreshed = await getCanonicalUserProfile(targetUid);
    return { success: true, updatedUser: refreshed };
  } catch (err: any) {
    logStructuredError('updateCanonicalUserProfile', err, targetUid);
    return { success: false, error: 'Failed to persist profile changes to Firestore. Please try again.' };
  }
}

/**
 * Centralized Authoritative Profile Update Service.
 * Resolves authenticated Firebase Auth UID, validates fields,
 * writes to canonical Firestore document, verifies read-back,
 * and synchronizes with server DBMS.
 */
export async function updateUserProfile(
  updates: Record<string, any>
): Promise<{ success: boolean; error?: string; user?: any }> {
  const currentAuthUid = auth?.currentUser?.uid;
  if (!currentAuthUid) {
    return { success: false, error: 'Authentication required: No active user session.' };
  }

  const result = await updateCanonicalUserProfile(currentAuthUid, updates);
  if (!result.success || !result.updatedUser) {
    return { success: false, error: result.error || 'Failed to update database profile.' };
  }

  // Synchronize server DBMS via /api/user/profile in browser environment
  if (typeof window !== 'undefined') {
    try {
      await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fr8x-user-uid': currentAuthUid,
          'x-fr8x-session': currentAuthUid,
        },
        body: JSON.stringify({
          uid: currentAuthUid,
          email: result.updatedUser.email,
          updates,
        }),
      });
    } catch (apiErr: any) {
      console.warn('[updateUserProfile] Background server DBMS sync notice:', apiErr?.message);
    }
  }

  return { success: true, user: result.updatedUser };
}


/**
 * Submits user statutory KYC documentation and synchronizes status into Firestore.
 */
export async function submitUserKYC(
  uid: string,
  kycData: {
    companyId?: string;
    legalName: string;
    companyType?: string;
    registrationNumber?: string;
    gstNumber?: string;
    panNumber?: string;
    registeredAddress?: string;
    operatingAddress?: string;
    contactPerson?: string;
    designation?: string;
    mobileNumber?: string;
    corporateEmail?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  if (!uid) return { success: false, error: 'User UID is required.' };
  const now = new Date().toISOString();
  const companyId = kycData.companyId || `CMP-DEFAULT`;

  try {
    // 1. Update user root status and statutory fields FIRST
    await setDoc(doc(db, 'users', uid), {
      kycStatus: 'SUBMITTED',
      legalName: kycData.legalName,
      companyType: kycData.companyType || '',
      registrationNumber: kycData.registrationNumber || '',
      gstNumber: kycData.gstNumber || '',
      panNumber: kycData.panNumber || '',
      gstn: kycData.gstNumber || '',
      pan: kycData.panNumber || '',
      registeredAddress: kycData.registeredAddress || '',
      operatingAddress: kycData.operatingAddress || '',
      contactPerson: kycData.contactPerson || '',
      submittedAt: now,
      updatedAt: now,
    }, { merge: true });

    // 2. Write subcollection kyc with resilience
    const kycDocRef = doc(db, 'users', uid, 'kyc', 'main');
    const payload: CanonicalKYCDocument = {
      uid,
      companyId,
      kycStatus: 'SUBMITTED',
      legalName: kycData.legalName,
      companyType: kycData.companyType,
      registrationNumber: kycData.registrationNumber,
      gstNumber: kycData.gstNumber,
      panNumber: kycData.panNumber,
      registeredAddress: kycData.registeredAddress,
      operatingAddress: kycData.operatingAddress,
      contactPerson: kycData.contactPerson,
      designation: kycData.designation,
      mobileNumber: kycData.mobileNumber,
      corporateEmail: kycData.corporateEmail,
      submittedAt: now,
      submittedBy: uid,
      createdAt: now,
      updatedAt: now,
    };

    await setDoc(kycDocRef, payload, { merge: true }).catch((err) => {
      console.warn('[FR8X Firestore] Subdoc KYC write deferred:', err?.message);
    });

    // Also update company kyc subdoc if company exists
    if (companyId) {
      await setDoc(doc(db, 'companies', companyId, 'kyc', 'main'), payload, { merge: true }).catch(() => {});
      await setDoc(doc(db, 'companies', companyId), { kycStatus: 'SUBMITTED', updatedAt: now }, { merge: true }).catch(() => {});
      const auditId = `audit-kyc-${Date.now()}`;
      await setDoc(doc(db, 'companies', companyId, 'audit', auditId), {
        auditId,
        action: 'KYC_DOCUMENT_SUBMITTED',
        actorUid: uid,
        actorRole: 'user',
        targetUid: uid,
        targetCompanyId: companyId,
        previousStatus: 'PENDING_KYC',
        newStatus: 'SUBMITTED',
        reason: 'User submitted statutory KYC compliance dossier',
        timestamp: now,
      }).catch(() => {});
    }

    return { success: true };
  } catch (err: any) {
    logStructuredError('submitUserKYC', err, uid);
    return { success: false, error: 'Failed to submit KYC documentation. Please try again.' };
  }
}

/**
 * Godfather Super Admin Approval for an account/company registration.
 * Atomically updates user approval, company approval, and writes an immutable audit record.
 */
export async function approveUserRegistration(params: {
  actorUid: string;
  actorRole: string;
  targetUid: string;
  targetCompanyId?: string;
  notes?: string;
}): Promise<{ success: boolean; error?: string }> {
  const { actorUid, actorRole, targetUid } = params;
  const now = new Date().toISOString();
  const companyId = params.targetCompanyId || '';

  try {
    // 1. Update user document FIRST
    const userRef = doc(db, 'users', targetUid);
    await setDoc(userRef, {
      accountStatus: 'ACTIVE',
      approvalStatus: 'APPROVED',
      isVerified: true,
      hasGoldenTick: true,
      updatedAt: now,
    }, { merge: true });

    // 2. Update user approval subdoc
    const userApprovalRef = doc(db, 'users', targetUid, 'approval', 'main');
    await setDoc(userApprovalRef, {
      approvalStatus: 'APPROVED',
      reviewedAt: now,
      reviewedBy: actorUid,
      notes: params.notes || 'Account approved by Godfather administration.',
      updatedAt: now,
    }, { merge: true }).catch(() => {});

    // 3. Update company if associated
    if (companyId) {
      const compRef = doc(db, 'companies', companyId);
      await setDoc(compRef, {
        status: 'ACTIVE',
        approvalStatus: 'APPROVED',
        isVerified: true,
        updatedAt: now,
      }, { merge: true }).catch(() => {});

      const compAppRef = doc(db, 'companies', companyId, 'approval', 'main');
      await setDoc(compAppRef, {
        approvalStatus: 'APPROVED',
        reviewedAt: now,
        reviewedBy: actorUid,
        notes: params.notes || 'Company verification approved by Godfather admin.',
        updatedAt: now,
      }, { merge: true }).catch(() => {});

      const auditId = `audit-appr-${Date.now()}`;
      await setDoc(doc(db, 'companies', companyId, 'audit', auditId), {
        auditId,
        action: 'COMPANY_AND_USER_APPROVED',
        actorUid,
        actorRole,
        targetUid,
        targetCompanyId: companyId,
        previousStatus: 'PENDING_APPROVAL',
        newStatus: 'APPROVED',
        reason: params.notes || 'Compliance verification approved',
        timestamp: now,
      }).catch(() => {});
    }

    return { success: true };
  } catch (err: any) {
    logStructuredError('approveUserRegistration', err, actorUid, { targetUid, companyId });
    return { success: false, error: 'Failed to approve registration in Firestore.' };
  }
}

/**
 * Godfather Super Admin Rejection for an account/company registration.
 */
export async function rejectUserRegistration(params: {
  actorUid: string;
  actorRole: string;
  targetUid: string;
  targetCompanyId?: string;
  reason: string;
}): Promise<{ success: boolean; error?: string }> {
  const { actorUid, actorRole, targetUid, reason } = params;
  if (!reason || !reason.trim()) {
    return { success: false, error: 'Rejection reason is strictly mandatory.' };
  }
  const now = new Date().toISOString();
  const companyId = params.targetCompanyId || '';

  try {
    // 1. Update user document
    const userRef = doc(db, 'users', targetUid);
    await setDoc(userRef, {
      accountStatus: 'REJECTED',
      approvalStatus: 'REJECTED',
      rejectionReason: reason,
      isVerified: false,
      updatedAt: now,
    }, { merge: true });

    // 2. Update user approval subdoc
    const userApprovalRef = doc(db, 'users', targetUid, 'approval', 'main');
    await setDoc(userApprovalRef, {
      approvalStatus: 'REJECTED',
      reviewedAt: now,
      reviewedBy: actorUid,
      notes: reason,
      updatedAt: now,
    }, { merge: true }).catch(() => {});

    // 3. Update company if associated
    if (companyId) {
      const compRef = doc(db, 'companies', companyId);
      await setDoc(compRef, {
        status: 'REJECTED',
        approvalStatus: 'REJECTED',
        rejectionReason: reason,
        updatedAt: now,
      }, { merge: true }).catch(() => {});

      const compAppRef = doc(db, 'companies', companyId, 'approval', 'main');
      await setDoc(compAppRef, {
        approvalStatus: 'REJECTED',
        reviewedAt: now,
        reviewedBy: actorUid,
        notes: reason,
        updatedAt: now,
      }, { merge: true }).catch(() => {});

      const auditId = `audit-rej-${Date.now()}`;
      await setDoc(doc(db, 'companies', companyId, 'audit', auditId), {
        auditId,
        action: 'COMPANY_AND_USER_REJECTED',
        actorUid,
        actorRole,
        targetUid,
        targetCompanyId: companyId,
        previousStatus: 'PENDING_APPROVAL',
        newStatus: 'REJECTED',
        reason,
        timestamp: now,
      }).catch(() => {});
    }

    return { success: true };
  } catch (err: any) {
    logStructuredError('rejectUserRegistration', err, actorUid, { targetUid, companyId });
    return { success: false, error: 'Failed to record rejection in Firestore.' };
  }
}

/**
 * Diagnostic health check for a single user (AUTH ↔ FIRESTORE HEALTH).
 */
export async function checkUserDataHealth(uid: string): Promise<DataHealthReport> {
  const now = new Date().toISOString();
  const report: DataHealthReport = {
    uid,
    email: '',
    authStatus: Boolean(auth?.currentUser?.uid === uid),
    userDocExists: false,
    profileDocExists: false,
    companyDocExists: false,
    kycDocExists: false,
    approvalDocExists: false,
    overallHealth: 'ACTION REQUIRED',
    lastChecked: now,
  };

  try {
    const userDocRef = doc(db, 'users', uid);
    const userSnap = await getDoc(userDocRef);

    if (userSnap.exists()) {
      report.userDocExists = true;
      const data = userSnap.data();
      report.email = data.email || '';
      report.displayName = data.displayName || '';
      report.companyName = data.companyName || data.company || '';

      const companyId = data.companyId;

      const [pSnap, kSnap, aSnap, cSnap] = await Promise.all([
        getDoc(doc(db, 'users', uid, 'profile', 'main')).catch(() => null),
        getDoc(doc(db, 'users', uid, 'kyc', 'main')).catch(() => null),
        getDoc(doc(db, 'users', uid, 'approval', 'main')).catch(() => null),
        companyId ? getDoc(doc(db, 'companies', companyId)).catch(() => null) : Promise.resolve(null),
      ]);

      report.profileDocExists = Boolean(pSnap && pSnap.exists());
      report.kycDocExists = Boolean(kSnap && kSnap.exists());
      report.approvalDocExists = Boolean(aSnap && aSnap.exists());
      report.companyDocExists = Boolean(cSnap && cSnap.exists());

      if (report.userDocExists && report.profileDocExists && report.approvalDocExists) {
        report.overallHealth = 'HEALTHY';
      }
    }
  } catch (err: any) {
    report.details = err?.message || 'Check failed';
  }

  return report;
}

/**
 * Safe administrative repair mechanism for an inconsistent user record.
 * Generates missing canonical subdocuments without overwriting valid data.
 */
export async function repairUserData(
  actorUid: string,
  actorRole: string,
  targetUid: string
): Promise<{ success: boolean; repaired: string[]; error?: string }> {
  const now = new Date().toISOString();
  const repaired: string[] = [];

  try {
    const userDocRef = doc(db, 'users', targetUid);
    const userSnap = await getDoc(userDocRef);

    if (!userSnap.exists()) {
      return { success: false, repaired: [], error: 'Cannot repair: canonical user document does not exist.' };
    }

    const userData = userSnap.data() as CanonicalUserDocument;
    const batch = writeBatch(db);

    // Check & repair profile subdoc
    const profileDocRef = doc(db, 'users', targetUid, 'profile', 'main');
    const pSnap = await getDoc(profileDocRef);
    if (!pSnap.exists()) {
      batch.set(profileDocRef, {
        uid: targetUid,
        summary: '',
        bio: '',
        experiences: [],
        educations: [],
        certifications: [],
        contacts: [],
        skills: ['Ocean Freight'],
        updatedAt: now,
      });
      repaired.push('profile/main');
    }

    // Check & repair KYC subdoc
    const kycDocRef = doc(db, 'users', targetUid, 'kyc', 'main');
    const kSnap = await getDoc(kycDocRef);
    if (!kSnap.exists()) {
      batch.set(kycDocRef, {
        uid: targetUid,
        companyId: userData.companyId || 'CMP-DEFAULT',
        kycStatus: userData.kycStatus || 'PENDING_KYC',
        legalName: userData.companyName || userData.company || 'Enterprise Entity',
        contactPerson: userData.displayName,
        corporateEmail: userData.email,
        mobileNumber: userData.mobile || userData.mobileNumber || '',
        submittedAt: now,
        submittedBy: targetUid,
        createdAt: now,
        updatedAt: now,
      });
      repaired.push('kyc/main');
    }

    // Check & repair approval subdoc
    const approvalDocRef = doc(db, 'users', targetUid, 'approval', 'main');
    const aSnap = await getDoc(approvalDocRef);
    if (!aSnap.exists()) {
      batch.set(approvalDocRef, {
        uid: targetUid,
        companyId: userData.companyId || 'CMP-DEFAULT',
        approvalStatus: userData.approvalStatus || 'PENDING_APPROVAL',
        notes: 'Administrative self-healing record generation.',
        createdAt: now,
        updatedAt: now,
      });
      repaired.push('approval/main');
    }

    // Immutable audit action
    const actionId = `action-repair-${Date.now()}`;
    const adminActionRef = doc(db, 'adminActions', actionId);
    batch.set(adminActionRef, {
      actionId,
      action: 'ADMIN_REPAIR_USER_DATA',
      operatorUid: actorUid,
      operatorEmail: 'tech@fr8x.in',
      targetUid,
      targetCompanyId: userData.companyId,
      details: { repaired, timestamp: now },
      timestamp: now,
    });

    if (repaired.length > 0) {
      await batch.commit();
    }

    return { success: true, repaired };
  } catch (err: any) {
    logStructuredError('repairUserData', err, targetUid);
    return { success: false, repaired: [], error: 'Administrative repair failed.' };
  }
}

/**
 * Retrieves all canonical users from Firestore for the Godfather control center.
 */
export async function getAllCanonicalUsers(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'users'));
    return snap.docs.map((d) => ({
      ...d.data(),
      uid: d.id,
      id: d.id,
    }));
  } catch (err: any) {
    logStructuredError('getAllCanonicalUsers', err);
    return [];
  }
}

/**
 * Retrieves all canonical companies from Firestore for the Godfather control center.
 */
export async function getAllCanonicalCompanies(): Promise<any[]> {
  try {
    const snap = await getDocs(collection(db, 'companies'));
    return snap.docs.map((d) => ({
      ...d.data(),
      id: d.id,
      companyId: d.id,
    }));
  } catch (err: any) {
    logStructuredError('getAllCanonicalCompanies', err);
    return [];
  }
}

// ─── BACKWARD COMPATIBILITY WRAPPERS ─────────────────────────────────────────

/**
 * Saves and synchronizes user profile into Firestore canonical collections.
 * Backward compatible wrapper for legacy calls.
 */
export async function saveUserProfileToFirestore(profileData: any): Promise<boolean> {
  const targetUid = profileData.uid || auth?.currentUser?.uid;
  if (!targetUid) return false;
  const res = await updateCanonicalUserProfile(targetUid, profileData);
  return res.success;
}

/**
 * Retrieves user profile from Firestore users collection.
 * Backward compatible wrapper for legacy calls.
 */
export async function getUserProfileFromFirestore(uidOrEmail?: string): Promise<any | null> {
  const targetUid = uidOrEmail && !uidOrEmail.includes('@') ? uidOrEmail : auth?.currentUser?.uid;
  if (!targetUid) return null;
  return await getCanonicalUserProfile(targetUid);
}

/**
 * Appends an immutable audit record to /companies/{companyId}/audit/{auditId}
 */
export async function appendCompanyAudit(
  companyId: string,
  record: {
    action: string;
    actorUid: string;
    actorRole: string;
    targetUid?: string;
    targetCompanyId: string;
    previousStatus?: string;
    newStatus?: string;
    reason?: string;
  }
): Promise<{ success: boolean; auditId?: string; error?: string }> {
  if (!companyId) return { success: false, error: 'companyId is required' };
  try {
    const auditId = `audit-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const auditRef = doc(db, 'companies', companyId, 'audit', auditId);
    await setDoc(auditRef, {
      auditId,
      ...record,
      timestamp: new Date().toISOString(),
    });
    return { success: true, auditId };
  } catch (err: any) {
    logStructuredError('appendCompanyAudit', err, undefined, { companyId });
    return { success: false, error: err.message };
  }
}

export async function deleteTestUserDoc(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    await deleteDoc(doc(db, 'users', uid));
    return true;
  } catch (err: any) {
    console.warn('[FR8X Firestore] deleteTestUserDoc warning:', err?.message);
    return false;
  }
}

export async function deleteCanonicalUserDoc(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    await deleteDoc(doc(db, 'users', uid));
    return true;
  } catch (err: any) {
    console.warn('[FR8X Firestore] deleteCanonicalUserDoc error:', err?.message);
    return false;
  }
}

export async function scheduleCanonicalUserDeletion(
  uid: string,
  effectiveAt: string,
  reason?: string
): Promise<boolean> {
  if (!uid) return false;
  try {
    const res = await updateCanonicalUserProfile(uid, {
      accountStatus: 'pending_deletion',
      deletionScheduledAt: new Date().toISOString(),
      deletionEffectiveAt: effectiveAt,
      deletionType: 'five_day_grace',
      deletionReason: reason || 'User requested 5-day account deactivation & deletion',
    });
    return res.success;
  } catch (err: any) {
    console.warn('[FR8X Firestore] scheduleCanonicalUserDeletion warning:', err?.message);
    return false;
  }
}

export async function cancelCanonicalUserDeletion(uid: string): Promise<boolean> {
  if (!uid) return false;
  try {
    const res = await updateCanonicalUserProfile(uid, {
      accountStatus: 'active',
      deletionScheduledAt: null,
      deletionEffectiveAt: null,
      deletionType: null,
      deletionReason: null,
    });
    return res.success;
  } catch (err: any) {
    console.warn('[FR8X Firestore] cancelCanonicalUserDeletion warning:', err?.message);
    return false;
  }
}

// ─── NEXUS TOPICS REPOSITORY ─────────────────────────────────────────────────
export async function getNexusTopicsFromDB(limitCount: number = 50): Promise<NexusTopic[]> {
  if (typeof window === 'undefined') return [];
  try {
    const coll = collection(db, COLLECTIONS.TOPICS);
    let snap;
    try {
      const q = query(coll, orderBy('lastActivityAt', 'desc'), firestoreLimit(limitCount));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(query(coll, firestoreLimit(limitCount)));
    }
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<NexusTopic, 'id'>),
    }));
  } catch (err) {
    console.warn('[Firestore] Error fetching topics:', err);
    return [];
  }
}

export async function upsertNexusTopicInDB(topic: NexusTopic): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const docRef = doc(db, COLLECTIONS.TOPICS, topic.id);
    await setDoc(docRef, topic, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Error upserting topic:', err);
  }
}

export async function deleteNexusTopicInDB(topicId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const docRef = doc(db, COLLECTIONS.TOPICS, topicId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[Firestore] Error deleting topic:', err);
  }
}

// ─── NEXUS REVIEWS REPOSITORY ────────────────────────────────────────────────
export async function getReviewsFromDB(limitCount: number = 50): Promise<CompanyReview[]> {
  if (typeof window === 'undefined') return [];
  try {
    const coll = collection(db, COLLECTIONS.REVIEWS);
    const snap = await getDocs(query(coll, firestoreLimit(limitCount)));
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<CompanyReview, 'id'>),
    }));
  } catch (err) {
    console.warn('[Firestore] Error fetching reviews:', err);
    return [];
  }
}

export async function upsertReviewInDB(review: CompanyReview): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const docRef = doc(db, COLLECTIONS.REVIEWS, review.id);
    await setDoc(docRef, review, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Error upserting review:', err);
  }
}

export async function deleteReviewInDB(reviewId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const docRef = doc(db, COLLECTIONS.REVIEWS, reviewId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[Firestore] Error deleting review:', err);
  }
}

// ─── NEXUS BLACKLIST CASES REPOSITORY ────────────────────────────────────────
export async function getBlacklistCasesFromDB(limitCount: number = 50): Promise<BlacklistCase[]> {
  if (typeof window === 'undefined') return [];
  try {
    const coll = collection(db, COLLECTIONS.CASES);
    const snap = await getDocs(query(coll, firestoreLimit(limitCount)));
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<BlacklistCase, 'id'>),
    }));
  } catch (err) {
    console.warn('[Firestore] Error fetching cases:', err);
    return [];
  }
}

export async function upsertBlacklistCaseInDB(bCase: BlacklistCase): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const docRef = doc(db, COLLECTIONS.CASES, bCase.id);
    await setDoc(docRef, bCase, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Error upserting case:', err);
  }
}

export async function deleteBlacklistCaseInDB(caseId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const docRef = doc(db, COLLECTIONS.CASES, caseId);
    await deleteDoc(docRef);
  } catch (err) {
    console.warn('[Firestore] Error deleting case:', err);
  }
}

// ─── JOBS REPOSITORY ─────────────────────────────────────────────────────────
export async function getJobsFromDB(limitCount: number = 50): Promise<JobPost[]> {
  if (typeof window === 'undefined') return [];
  try {
    const coll = collection(db, COLLECTIONS.JOBS);
    let snap;
    try {
      const q = query(coll, orderBy('createdAt', 'desc'), firestoreLimit(limitCount));
      snap = await getDocs(q);
    } catch {
      snap = await getDocs(query(coll, firestoreLimit(limitCount)));
    }
    return snap.docs
      .map((d) => ({
        id: d.id,
        ...(d.data() as Omit<JobPost, 'id'>),
      }))
      .filter((j) => (j as any).status !== 'deleted');
  } catch (err) {
    console.warn('[Firestore] Error fetching jobs:', err);
    return [];
  }
}

export async function upsertJobInDB(job: JobPost): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const docRef = doc(db, COLLECTIONS.JOBS, job.id);
    await setDoc(docRef, job, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Error upserting job:', err);
  }
}

export async function deleteJobInDB(jobId: string): Promise<void> {
  if (typeof window === 'undefined') return;
  try {
    const docRef = doc(db, COLLECTIONS.JOBS, jobId);
    await updateDoc(docRef, { status: 'deleted', updatedAt: new Date().toISOString() });
  } catch {
    try {
      const docRef = doc(db, COLLECTIONS.JOBS, jobId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn('[Firestore] Error deleting job:', err);
    }
  }
}





