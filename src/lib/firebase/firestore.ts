// FR8X-CON Firestore Helpers
// Generic CRUD operations and query builders with localStorage cache layer

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
  limit,
  startAfter,
  onSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
  type DocumentData,
  type QueryConstraint,
  type DocumentReference,
  type Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { firebaseDb } from "./config";

// ── localStorage Cache Helpers ──────────────────────────────────────────────
function cacheKey(collection: string, id?: string): string {
  return id ? `fr8x_cache_${collection}_${id}` : `fr8x_cache_${collection}`;
}

function writeCache(key: string, data: unknown): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify({ data, ts: Date.now() }));
  } catch { /* ignore quota errors */ }
}

function readCache<T>(key: string, maxAgeMs: number = 24 * 60 * 60 * 1000): T | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (Date.now() - parsed.ts > maxAgeMs) return null;
    return parsed.data as T;
  } catch { return null; }
}

/**
 * Get a document by collection and ID.
 * Uses Firestore first, then falls back to localStorage cache.
 */
export async function getDocument<T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const result = { id: docSnap.id, ...docSnap.data() } as T & { id: string };
      writeCache(cacheKey(collectionName, docId), result);
      return result;
    }
  } catch (error) {
    console.warn("Firestore getDocument cache fallback:", error);
    // Fall back to localStorage cache
    const cached = readCache<T & { id: string }>(cacheKey(collectionName, docId));
    if (cached) return cached;
  }
  return null;
}

/**
 * Query documents with constraints.
 * Uses Firestore first, then falls back to localStorage cache.
 */
export async function queryDocuments<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> {
  try {
    const collectionRef = collection(firebaseDb, collectionName);
    const q = query(collectionRef, ...constraints);
    const snapshot = await getDocs(q);
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (T & { id: string })[];
    // Cache results for offline resilience
    if (results.length > 0) {
      writeCache(cacheKey(collectionName), results);
    }
    return results;
  } catch (error) {
    console.warn("Firestore queryDocuments cache fallback:", error);
    // Fall back to localStorage cache
    const cached = readCache<(T & { id: string })[]>(cacheKey(collectionName));
    if (cached) return cached;
  }

  return [];
}

/**
 * Recursively remove undefined values from an object before passing to Firestore.
 */
function cleanUndefined<T>(obj: T): T {
  if (obj === null || typeof obj !== "object") return obj;
  if (Array.isArray(obj)) return obj.map(cleanUndefined) as unknown as T;
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (value !== undefined) {
      cleaned[key] = cleanUndefined(value);
    }
  }
  return cleaned as T;
}

/**
 * Create or set a document.
 */
export async function setDocument<T extends DocumentData>(
  collectionName: string,
  docId: string,
  data: T,
  merge: boolean = false
): Promise<void> {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    const payload = cleanUndefined({
      ...data,
      updatedAt: serverTimestamp(),
    });
    await setDoc(docRef, payload, { merge });
  } catch (error) {
    console.warn(`Firestore setDocument notice (${collectionName}/${docId}):`, error);
  }
}

/**
 * Update specific fields of a document.
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    const payload = cleanUndefined({
      ...data,
      updatedAt: serverTimestamp(),
    });
    await updateDoc(docRef, payload);
  } catch (error) {
    console.warn(`Firestore updateDocument notice (${collectionName}/${docId}):`, error);
  }
}

/**
 * Soft-delete a document (set isDeleted flag).
 */
export async function softDeleteDocument(
  collectionName: string,
  docId: string,
  deletedBy: string
): Promise<void> {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    await updateDoc(docRef, {
      isDeleted: true,
      deletedAt: serverTimestamp(),
      deletedBy,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.warn(`Firestore softDeleteDocument notice (${collectionName}/${docId}):`, error);
  }
}

/**
 * Permanently delete a document.
 */
export async function deleteDocument(
  collectionName: string,
  docId: string
): Promise<void> {
  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    await deleteDoc(docRef);
  } catch (error) {
    console.warn(`Firestore deleteDocument notice (${collectionName}/${docId}):`, error);
  }
}

/**
 * Subscribe to real-time document changes.
 */
export function subscribeToDocument<T extends DocumentData>(
  collectionName: string,
  docId: string,
  callback: (data: (T & { id: string }) | null) => void
): Unsubscribe {
  const docRef = doc(firebaseDb, collectionName, docId);
  return onSnapshot(
    docRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback({ id: snap.id, ...snap.data() } as T & { id: string });
    },
    (err) => {
      console.warn(`Firestore subscribeToDocument notice (${collectionName}/${docId}):`, err);
      callback(null);
    }
  );
}

/**
 * Subscribe to real-time collection query changes.
 */
export function subscribeToQuery<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[],
  callback: (data: (T & { id: string })[]) => void
): Unsubscribe {
  const collectionRef = collection(firebaseDb, collectionName);
  const q = query(collectionRef, ...constraints);
  return onSnapshot(
    q,
    (snapshot) => {
      const results = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as (T & { id: string })[];
      callback(results);
    },
    (err) => {
      console.warn(`Firestore subscribeToQuery notice (${collectionName}):`, err);
      callback([]);
    }
  );
}

/**
 * Get a document reference.
 */
export function getDocRef(
  collectionName: string,
  docId?: string
): DocumentReference {
  if (docId) {
    return doc(firebaseDb, collectionName, docId);
  }
  return doc(collection(firebaseDb, collectionName));
}

/**
 * Create a new Firestore timestamp.
 */
export function createTimestamp() {
  return serverTimestamp();
}

/**
 * Re-export commonly used Firestore utilities.
 */
export {
  where,
  orderBy,
  limit,
  startAfter,
  increment,
  arrayUnion,
  arrayRemove,
  Timestamp,
  serverTimestamp,
  collection,
  doc,
};
