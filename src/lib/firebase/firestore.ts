// FR8X-CON Firestore Helpers
// Generic CRUD operations and query builders

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
  type DocumentSnapshot,
  type QuerySnapshot,
  type Unsubscribe,
  Timestamp,
} from "firebase/firestore";
import { firebaseDb } from "./config";

/**
 * Get a document by collection and ID.
 */
export async function getDocument<T extends DocumentData>(
  collectionName: string,
  docId: string
): Promise<(T & { id: string }) | null> {
  // Mock login user and profile data fallback
  if (docId === "mock-uid-godmode") {
    if (collectionName === "users") {
      return {
        id: "mock-uid-godmode",
        role: "godmode",
        isGodMode: true,
        companyId: null,
        membershipTier: "premium",
      } as unknown as (T & { id: string });
    } else if (collectionName === "profiles") {
      return {
        id: "mock-uid-godmode",
        userId: "mock-uid-godmode",
        fullName: "Godmode Admin",
        designation: "Platform Administrator",
        location: "Global",
        country: "India",
        about: "System Admin account",
        companyName: "FR8X-CON",
        photoURL: null,
        verifiedBadge: true,
        followers: [],
        following: [],
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        awardsCount: 0,
        currentAuctions: [],
        completedAuctions: [],
        blacklistStatus: "clean",
        industryTags: [],
        serviceTags: [],
        workExperience: [],
      } as unknown as (T & { id: string });
    }
  }

  if (docId === "mock-uid-mgt") {
    if (collectionName === "users") {
      return {
        id: "mock-uid-mgt",
        role: "freight_forwarder",
        isGodMode: false,
        companyId: "mock-company-1",
        membershipTier: "premium",
      } as unknown as (T & { id: string });
    } else if (collectionName === "profiles") {
      return {
        id: "mock-uid-mgt",
        userId: "mock-uid-mgt",
        fullName: "Management User",
        designation: "Operations Manager",
        location: "Mumbai",
        country: "India",
        about: "RaiVega Management account",
        companyName: "RaiVega",
        photoURL: null,
        verifiedBadge: true,
        followers: [],
        following: [],
        followersCount: 0,
        followingCount: 0,
        postsCount: 0,
        awardsCount: 0,
        currentAuctions: [],
        completedAuctions: [],
        blacklistStatus: "clean",
        industryTags: ["Freight Forwarding", "FCL", "LCL"],
        serviceTags: [],
        workExperience: [],
      } as unknown as (T & { id: string });
    }
  }

  try {
    const docRef = doc(firebaseDb, collectionName, docId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) return null;
    return { id: docSnap.id, ...docSnap.data() } as T & { id: string };
  } catch (error) {
    console.error("Firestore getDocument error:", error);
    return null;
  }
}

/**
 * Query documents with constraints.
 */
export async function queryDocuments<T extends DocumentData>(
  collectionName: string,
  constraints: QueryConstraint[] = []
): Promise<(T & { id: string })[]> {
  const collectionRef = collection(firebaseDb, collectionName);
  const q = query(collectionRef, ...constraints);
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as (T & { id: string })[];
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
  const docRef = doc(firebaseDb, collectionName, docId);
  await setDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  }, { merge });
}

/**
 * Update specific fields of a document.
 */
export async function updateDocument(
  collectionName: string,
  docId: string,
  data: Partial<DocumentData>
): Promise<void> {
  const docRef = doc(firebaseDb, collectionName, docId);
  await updateDoc(docRef, {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft-delete a document (set isDeleted flag).
 */
export async function softDeleteDocument(
  collectionName: string,
  docId: string,
  deletedBy: string
): Promise<void> {
  const docRef = doc(firebaseDb, collectionName, docId);
  await updateDoc(docRef, {
    isDeleted: true,
    deletedAt: serverTimestamp(),
    deletedBy,
    updatedAt: serverTimestamp(),
  });
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
  return onSnapshot(docRef, (snap) => {
    if (!snap.exists()) {
      callback(null);
      return;
    }
    callback({ id: snap.id, ...snap.data() } as T & { id: string });
  });
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
  return onSnapshot(q, (snapshot) => {
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as (T & { id: string })[];
    callback(results);
  });
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
