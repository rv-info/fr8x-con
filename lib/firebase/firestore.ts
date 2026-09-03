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
import { db } from './client';
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
  POSTS: 'posts',
  COMMENTS: 'comments',
  AUCTIONS: 'auctions',
  BIDS: 'bids',
  RATES: 'rates',
  TOPICS: 'nexusTopics',
  REVIEWS: 'reviews',
  CASES: 'blacklistCases',
  NOTIFICATIONS: 'notifications',
  EVENTS: 'events',
  PRESENCE: 'presence',
  CONFIGS: 'rankingConfigs',
  INTENTS: 'intents',
  KYC: 'kyc_records',
  BIDDER_GROUPS: 'bidderGroups',
  ADS: 'ads',
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
  } catch (err) {
    console.warn('[Firestore] Error fetching posts:', err);
    return { posts: [], lastVisibleDoc: null };
  }
}

export async function upsertPostInDB(post: FeedPost): Promise<void> {
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
}

export async function deletePostInDB(postId: string): Promise<void> {
  const docRef = doc(db, COLLECTIONS.POSTS, postId);
  await updateDoc(docRef, { status: 'deleted', updatedAt: new Date().toISOString() });
}

// ─── AUCTIONS REPOSITORY ─────────────────────────────────────────────────────
export async function getAuctionsFromDB(): Promise<Auction[]> {
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
}

export async function submitBidInDB(auctionId: string, bid: SubmittedBid): Promise<void> {
  const bidRef = doc(db, COLLECTIONS.AUCTIONS, auctionId, COLLECTIONS.BIDS, bid.id);
  await setDoc(bidRef, {
    ...bid,
    submittedAt: new Date().toISOString(),
  });
}

// ─── RATES REPOSITORY ────────────────────────────────────────────────────────
export async function getRatesFromDB(ownerUid?: string): Promise<RateItem[]> {
  try {
    const coll = collection(db, COLLECTIONS.RATES);
    let q = query(coll, orderBy('valid', 'desc'), firestoreLimit(100));
    if (ownerUid) {
      q = query(coll, where('ownerUid', '==', ownerUid), orderBy('valid', 'desc'));
    }
    const snap = await getDocs(q);
    return snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<RateItem, 'id'>),
    }));
  } catch (err) {
    console.warn('[Firestore] Error fetching rates:', err);
    return [];
  }
}

export async function upsertRateInDB(rate: RateItem): Promise<void> {
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
}

export async function batchUpdateRatesInDB(
  ratesToUpdate: { id: string; updates: Partial<RateItem>; revision?: RateVersion }[]
): Promise<void> {
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
}

// ─── IDEMPOTENT TELEMETRY & EVENTS REPOSITORY ────────────────────────────────
export async function recordIdempotentEventsBatchInDB(events: IdempotentEvent[]): Promise<number> {
  let inserted = 0;
  try {
    const batch = writeBatch(db);
    for (const evt of events) {
      const docRef = doc(db, COLLECTIONS.EVENTS, evt.eventId);
      batch.set(docRef, evt, { merge: true });
      inserted++;
    }
    await batch.commit();
  } catch (err) {
    console.warn('[Firestore] Failed to commit events batch:', err);
  }
  return inserted;
}

// ─── PRESENCE REPOSITORY (3-STATE HEARTBEAT) ──────────────────────────────────
export async function updateUserPresenceInDB(state: UserPresenceState): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.PRESENCE, state.userId);
    await setDoc(docRef, state, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Failed to update presence:', err);
  }
}

export async function getUserPresenceFromDB(userId: string): Promise<UserPresenceState | null> {
  try {
    const docRef = doc(db, COLLECTIONS.PRESENCE, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as UserPresenceState;

    // Check TTL: If heartbeat > 5 minutes old, treat as away/offline
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
  try {
    const docRef = doc(db, COLLECTIONS.CONFIGS, 'default');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      return snap.data() as RankingConfig;
    }
    return null;
  } catch {
    return null;
  }
}

export async function saveRankingConfigInDB(config: RankingConfig): Promise<void> {
  const docRef = doc(db, COLLECTIONS.CONFIGS, 'default');
  await setDoc(docRef, { ...config, updatedAt: new Date().toISOString() }, { merge: true });
}

// ─── USER INTENT REPOSITORY ──────────────────────────────────────────────────
export async function getUserIntentFromDB(userId: string): Promise<LogisticsIntent | null> {
  try {
    const docRef = doc(db, COLLECTIONS.INTENTS, userId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    const data = snap.data() as LogisticsIntent;
    // Check if expired
    if (new Date(data.expiresAt).getTime() < Date.now()) {
      return null; // Expired intent
    }
    return data;
  } catch {
    return null;
  }
}

export async function saveUserIntentInDB(intent: LogisticsIntent): Promise<void> {
  try {
    const docRef = doc(db, COLLECTIONS.INTENTS, intent.userId);
    await setDoc(docRef, intent, { merge: true });
  } catch (err) {
    console.warn('[Firestore] Failed to save user intent:', err);
  }
}

// ─── KYC DOSSIER REPOSITORY ──────────────────────────────────────────────────
export async function getKYCDossierFromDB(userId: string): Promise<KYCDossier | null> {
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
  const docRef = doc(db, COLLECTIONS.KYC, dossier.userId);
  await setDoc(docRef, { ...dossier, updatedAt: new Date().toISOString() }, { merge: true });
}

// ─── BIDDER GROUPS REPOSITORY ────────────────────────────────────────────────
export async function getBidderGroupsFromDB(ownerUid: string): Promise<BidderGroup[]> {
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
  const docRef = doc(db, COLLECTIONS.BIDDER_GROUPS, group.id);
  await setDoc(docRef, { ...group, updatedAt: new Date().toISOString() }, { merge: true });
}
