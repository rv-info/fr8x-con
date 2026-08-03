// FR8X-CON NEXUS Messaging — Enterprise Chat Firebase Service
// Thread-based professional messaging. No file attachments.
// Each thread has a unique refId (NEXUS-YYYY-NNNNN) for formal business traceability.

import {
  collection,
  doc,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  arrayRemove,
  increment,
  getDocs,
  limit,
  runTransaction,
} from "firebase/firestore";
import { firebaseDb } from "./config";

export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderCompany: string;
  text: string;
  status: "sent" | "delivered" | "read";
  /** ISO string for client-side display; Firestore also stores serverTimestamp */
  timestamp: string;
  /** True if soft-deleted */
  isDeleted?: boolean;
}

export interface ChatParticipantDetail {
  name: string;
  company: string;
  role: string;
  photoURL?: string;
}

export interface ChatConversation {
  id: string;
  /** Unique business reference: NEXUS-2026-00001 */
  refId: string;
  type: "direct";
  participants: string[];
  participantDetails: Record<string, ChatParticipantDetail>;
  lastMessage: string;
  lastMessageAt: string;
  lastMessageBy: string;
  /** Per-participant unread counts */
  unreadCounts: Record<string, number>;
  pinnedBy: string[];
  archivedBy: string[];
  status: "active" | "closed";
  createdAt: string;
  createdBy: string;
}

// ─── Sequence Counter ───────────────────────────────────────────────────────

/**
 * Generate the next NEXUS reference ID in format NEXUS-YYYY-NNNNN.
 * Uses a Firestore transaction on a shared counter document.
 */
async function generateNexusRefId(): Promise<string> {
  const year = new Date().getFullYear();
  const counterRef = doc(firebaseDb, "settings", `nexus_counter_${year}`);

  const newCount = await runTransaction(firebaseDb, async (tx) => {
    const snap = await tx.get(counterRef);
    const current = snap.exists() ? (snap.data()?.count ?? 0) : 0;
    const next = current + 1;
    tx.set(counterRef, { count: next, year }, { merge: true });
    return next;
  });

  return `NEXUS-${year}-${String(newCount).padStart(5, "0")}`;
}

// ─── Conversation Management ─────────────────────────────────────────────────

/**
 * Get or create a 1-on-1 direct conversation between two approved contacts.
 * Generates a NEXUS reference ID on creation.
 */
export async function getOrCreateConversation(
  currentUser: { id: string; name: string; company: string; role: string },
  recipientUser: { id: string; name: string; company: string; role: string }
): Promise<string> {
  const convId = [currentUser.id, recipientUser.id].sort().join("_conv_");
  const docRef = doc(firebaseDb, "conversations", convId);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    return convId;
  }

  const refId = await generateNexusRefId();
  const now = new Date().toISOString();

  const payload: Omit<ChatConversation, "id"> = {
    refId,
    type: "direct",
    participants: [currentUser.id, recipientUser.id],
    participantDetails: {
      [currentUser.id]: {
        name: currentUser.name,
        company: currentUser.company,
        role: currentUser.role,
      },
      [recipientUser.id]: {
        name: recipientUser.name,
        company: recipientUser.company,
        role: recipientUser.role,
      },
    },
    lastMessage: "",
    lastMessageAt: now,
    lastMessageBy: currentUser.id,
    unreadCounts: {
      [currentUser.id]: 0,
      [recipientUser.id]: 0,
    },
    pinnedBy: [],
    archivedBy: [],
    status: "active",
    createdAt: now,
    createdBy: currentUser.id,
  };

  await setDoc(docRef, { ...payload, createdAtServer: serverTimestamp() });
  return convId;
}

// ─── Real-time Subscriptions ─────────────────────────────────────────────────

/**
 * Subscribe to all conversations for a user, ordered by last activity.
 */
export function subscribeUserConversations(
  userId: string,
  callback: (conversations: ChatConversation[]) => void
) {
  const q = query(
    collection(firebaseDb, "conversations"),
    where("participants", "array-contains", userId)
  );

  return onSnapshot(q, (snapshot) => {
    const list: ChatConversation[] = snapshot.docs
      .map((docSnap) => ({ id: docSnap.id, ...docSnap.data() } as ChatConversation))
      .sort((a, b) => {
        // Sort by lastMessageAt descending
        const tA = a.lastMessageAt ?? a.createdAt ?? "";
        const tB = b.lastMessageAt ?? b.createdAt ?? "";
        return tB.localeCompare(tA);
      });
    callback(list);
  });
}

/**
 * Subscribe to messages in a conversation in chronological order.
 */
export function subscribeConversationMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(firebaseDb, "conversations", conversationId, "messages"),
    where("isDeleted", "!=", true),
    orderBy("isDeleted"),
    orderBy("timestamp", "asc"),
    limit(200)
  );

  return onSnapshot(q, (snapshot) => {
    const msgs: ChatMessage[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as ChatMessage));
    callback(msgs);
  });
}

// ─── Message Actions ─────────────────────────────────────────────────────────

/**
 * Send a text-only message in a conversation.
 * No attachments permitted per platform policy.
 */
export async function sendMessage(
  conversationId: string,
  message: {
    conversationId: string;
    senderId: string;
    senderName: string;
    senderCompany: string;
    text: string;
  }
): Promise<void> {
  const messagesRef = collection(
    firebaseDb,
    "conversations",
    conversationId,
    "messages"
  );
  const timestamp = new Date().toISOString();

  await addDoc(messagesRef, {
    conversationId,
    senderId: message.senderId,
    senderName: message.senderName,
    senderCompany: message.senderCompany,
    text: message.text.trim(),
    status: "sent",
    timestamp,
    serverTimestamp: serverTimestamp(),
    isDeleted: false,
  });

  // Update conversation metadata — increment unread for all other participants
  const convRef = doc(firebaseDb, "conversations", conversationId);
  const convSnap = await getDoc(convRef);
  if (convSnap.exists()) {
    const convData = convSnap.data() as ChatConversation;
    const unreadUpdates: Record<string, unknown> = {
      lastMessage: message.text.trim().slice(0, 120),
      lastMessageAt: timestamp,
      lastMessageBy: message.senderId,
      lastMessageAtServer: serverTimestamp(),
    };

    // Increment unread count for all participants except sender
    convData.participants.forEach((pid) => {
      if (pid !== message.senderId) {
        unreadUpdates[`unreadCounts.${pid}`] = increment(1);
      }
    });

    await updateDoc(convRef, unreadUpdates);
  }
}

/**
 * Mark all messages in a conversation as read for a specific user.
 */
export async function markConversationRead(
  conversationId: string,
  userId: string
): Promise<void> {
  try {
    const convRef = doc(firebaseDb, "conversations", conversationId);
    await updateDoc(convRef, {
      [`unreadCounts.${userId}`]: 0,
    });
  } catch {
    // Non-critical
  }
}

// ─── Pin / Archive ────────────────────────────────────────────────────────────

export async function togglePinConversation(
  conversationId: string,
  userId: string,
  isPinned: boolean
): Promise<void> {
  const convRef = doc(firebaseDb, "conversations", conversationId);
  await updateDoc(convRef, {
    pinnedBy: isPinned ? arrayRemove(userId) : arrayUnion(userId),
  });
}

export async function toggleArchiveConversation(
  conversationId: string,
  userId: string,
  isArchived: boolean
): Promise<void> {
  const convRef = doc(firebaseDb, "conversations", conversationId);
  await updateDoc(convRef, {
    archivedBy: isArchived ? arrayRemove(userId) : arrayUnion(userId),
  });
}
