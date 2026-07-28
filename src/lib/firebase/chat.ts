// FR8X-CON Real-time Enterprise Chat Firebase Service
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
} from "firebase/firestore";
import { firebaseDb } from "./config";
import { COLLECTIONS } from "@/lib/utils/constants";

export interface ChatMessage {
  id?: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderCompany: string;
  text: string;
  attachmentType?: "file" | "image" | "quotation" | "auction" | "shipment";
  attachmentData?: Record<string, any>;
  status: "sent" | "delivered" | "read";
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  type: "direct" | "company" | "group";
  title?: string;
  participants: string[];
  participantDetails: Record<string, { name: string; company: string; role: string; photoURL?: string; online: boolean }>;
  lastMessage: string;
  lastMessageTimestamp: string;
  unreadCounts: Record<string, number>;
  pinnedBy: string[];
  archivedBy: string[];
}

/**
 * Get or create a 1-on-1 direct conversation with an approved contact
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

  const payload: ChatConversation = {
    id: convId,
    type: "direct",
    participants: [currentUser.id, recipientUser.id],
    participantDetails: {
      [currentUser.id]: { name: currentUser.name, company: currentUser.company, role: currentUser.role, online: true },
      [recipientUser.id]: { name: recipientUser.name, company: recipientUser.company, role: recipientUser.role, online: true },
    },
    lastMessage: "Chat conversation started",
    lastMessageTimestamp: new Date().toISOString(),
    unreadCounts: { [currentUser.id]: 0, [recipientUser.id]: 0 },
    pinnedBy: [],
    archivedBy: [],
  };

  await setDoc(docRef, payload);
  return convId;
}

/**
 * Real-time listener for user's conversations list
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
    const list: ChatConversation[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as ChatConversation));
    callback(list);
  });
}

/**
 * Real-time listener for messages in an active conversation
 */
export function subscribeConversationMessages(
  conversationId: string,
  callback: (messages: ChatMessage[]) => void
) {
  const q = query(
    collection(firebaseDb, "conversations", conversationId, "messages"),
    orderBy("timestamp", "asc")
  );

  return onSnapshot(q, (snapshot) => {
    const msgs: ChatMessage[] = snapshot.docs.map((docSnap) => ({
      id: docSnap.id,
      ...docSnap.data(),
    } as ChatMessage));
    callback(msgs);
  });
}

/**
 * Send a chat message
 */
export async function sendMessage(
  conversationId: string,
  message: Omit<ChatMessage, "id" | "timestamp" | "status">
): Promise<void> {
  const messagesRef = collection(firebaseDb, "conversations", conversationId, "messages");
  const timestamp = new Date().toISOString();

  await addDoc(messagesRef, {
    ...message,
    status: "sent",
    timestamp,
  });

  const convRef = doc(firebaseDb, "conversations", conversationId);
  await updateDoc(convRef, {
    lastMessage: message.attachmentType ? `Shared a ${message.attachmentType}` : message.text,
    lastMessageTimestamp: timestamp,
  });
}

/**
 * Toggle Pin state on conversation
 */
export async function togglePinConversation(conversationId: string, userId: string, isPinned: boolean) {
  const convRef = doc(firebaseDb, "conversations", conversationId);
  await updateDoc(convRef, {
    pinnedBy: isPinned ? arrayRemove(userId) : arrayUnion(userId),
  });
}

/**
 * Toggle Archive state on conversation
 */
export async function toggleArchiveConversation(conversationId: string, userId: string, isArchived: boolean) {
  const convRef = doc(firebaseDb, "conversations", conversationId);
  await updateDoc(convRef, {
    archivedBy: isArchived ? arrayRemove(userId) : arrayUnion(userId),
  });
}
