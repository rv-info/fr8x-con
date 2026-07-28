// FR8X-CON Enterprise Contact Management Firebase Service
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  or,
  and,
  serverTimestamp,
} from "firebase/firestore";
import { firebaseDb } from "./config";
import { COLLECTIONS } from "@/lib/utils/constants";

export interface ContactConnection {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterEmail: string;
  requesterCompany: string;
  requesterRole: string;
  recipientId: string;
  recipientName: string;
  recipientEmail: string;
  recipientCompany: string;
  recipientRole: string;
  status: "pending" | "approved" | "rejected" | "blocked";
  blockedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserContactProfile {
  uid: string;
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  country?: string;
  photoURL?: string;
  verifiedBadge?: boolean;
  online?: boolean;
}

/**
 * Get connection relationship between two users
 */
export async function getContactStatus(currentUserId: string, targetUserId: string): Promise<ContactConnection | null> {
  if (!currentUserId || !targetUserId) return null;
  try {
    const q1 = query(
      collection(firebaseDb, COLLECTIONS.CONNECTIONS),
      where("requesterId", "==", currentUserId),
      where("recipientId", "==", targetUserId)
    );
    const q2 = query(
      collection(firebaseDb, COLLECTIONS.CONNECTIONS),
      where("requesterId", "==", targetUserId),
      where("recipientId", "==", currentUserId)
    );

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    if (!snap1.empty && snap1.docs[0]) return { id: snap1.docs[0].id, ...snap1.docs[0].data() } as ContactConnection;
    if (!snap2.empty && snap2.docs[0]) return { id: snap2.docs[0].id, ...snap2.docs[0].data() } as ContactConnection;

    return null;
  } catch (err) {
    console.error("Error fetching contact status:", err);
    return null;
  }
}

/**
 * Fetch all connections for a given user
 */
export async function getUserConnections(userId: string): Promise<ContactConnection[]> {
  if (!userId) return [];
  try {
    const q1 = query(collection(firebaseDb, COLLECTIONS.CONNECTIONS), where("requesterId", "==", userId));
    const q2 = query(collection(firebaseDb, COLLECTIONS.CONNECTIONS), where("recipientId", "==", userId));

    const [snap1, snap2] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const results: ContactConnection[] = [];

    snap1.docs.forEach((d) => results.push({ id: d.id, ...d.data() } as ContactConnection));
    snap2.docs.forEach((d) => results.push({ id: d.id, ...d.data() } as ContactConnection));

    return results;
  } catch (err) {
    console.error("Error fetching user connections:", err);
    return [];
  }
}

/**
 * Send a new contact request
 */
export async function sendContactRequest(
  requester: { id: string; name: string; email: string; company: string; role: string },
  recipient: { id: string; name: string; email: string; company: string; role: string }
): Promise<ContactConnection> {
  const connectionId = `conn_${requester.id}_${recipient.id}`;
  const docRef = doc(firebaseDb, COLLECTIONS.CONNECTIONS, connectionId);

  const payload: ContactConnection = {
    id: connectionId,
    requesterId: requester.id,
    requesterName: requester.name,
    requesterEmail: requester.email,
    requesterCompany: requester.company,
    requesterRole: requester.role,
    recipientId: recipient.id,
    recipientName: recipient.name,
    recipientEmail: recipient.email,
    recipientCompany: recipient.company,
    recipientRole: recipient.role,
    status: "pending",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  await setDoc(docRef, payload);
  return payload;
}

/**
 * Update contact request status (approved, rejected, blocked)
 */
export async function updateContactStatus(
  connectionId: string,
  status: "approved" | "rejected" | "blocked",
  actionUserId?: string
): Promise<void> {
  const docRef = doc(firebaseDb, COLLECTIONS.CONNECTIONS, connectionId);
  const updateData: Partial<ContactConnection> = {
    status,
    updatedAt: new Date().toISOString(),
  };
  if (status === "blocked" && actionUserId) {
    updateData.blockedBy = actionUserId;
  }
  await updateDoc(docRef, updateData);
}

/**
 * Remove a contact connection
 */
export async function removeContact(connectionId: string): Promise<void> {
  const docRef = doc(firebaseDb, COLLECTIONS.CONNECTIONS, connectionId);
  await deleteDoc(docRef);
}

/**
 * Search users and organizations for contact discovery
 */
export async function searchContactDirectory(searchQuery: string, currentUserId: string): Promise<UserContactProfile[]> {
  try {
    const usersSnap = await getDocs(collection(firebaseDb, COLLECTIONS.PROFILES));
    const term = searchQuery.trim().toLowerCase();

    const matches: UserContactProfile[] = [];

    usersSnap.docs.forEach((docSnap) => {
      const data = docSnap.data();
      const uid = data.userId || docSnap.id;
      if (uid === currentUserId) return;

      const name = (data.fullName || "").toLowerCase();
      const company = (data.companyName || "").toLowerCase();
      const designation = (data.designation || "").toLowerCase();
      const email = (data.email || "").toLowerCase();

      if (!term || name.includes(term) || company.includes(term) || designation.includes(term) || email.includes(term)) {
        matches.push({
          uid,
          fullName: data.fullName || "Logistics Member",
          email: data.email || `${uid}@fr8x.in`,
          companyName: data.companyName || "Verified Enterprise",
          role: data.designation || "Logistics Executive",
          country: data.country || "India",
          photoURL: data.photoURL || undefined,
          verifiedBadge: Boolean(data.verifiedBadge),
          online: Math.random() > 0.4, // Simulated active online state
        });
      }
    });

    return matches;
  } catch (err) {
    console.error("Error searching contact directory:", err);
    return [];
  }
}
