'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback, ReactNode } from 'react';
import { ChatContact, ChatMessage, ActiveChatWindow } from '@/lib/types';
import { useAuth } from './AuthContext';
import { ChatConnectionState, NhostChatRealtimeClient } from '@/lib/nhost/chatClient';
import {
  MUTATION_INSERT_MESSAGE,
  MUTATION_MARK_MESSAGES_READ,
  MUTATION_UPSERT_CONVERSATION,
  MUTATION_UPSERT_PRESENCE,
  QUERY_CONVERSATION_BY_DIRECT_KEY,
  QUERY_CONVERSATION_MESSAGES,
  QUERY_MISSED_MESSAGES,
  SUB_CHAT_CONVERSATIONS,
  SUB_CHAT_MESSAGES,
  SUB_CHAT_PRESENCE,
} from '@/lib/nhost/chatQueries';

const INITIAL_CONTACTS: ChatContact[] = [];
const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {};
const CHAT_CONTACTS_KEY = 'fr8x_chat_contacts';
const CHAT_MESSAGES_KEY = 'fr8x_chat_messages';

interface ChatContextType {
  isLauncherOpen: boolean;
  setIsLauncherOpen: (open: boolean) => void;
  toggleLauncher: () => void;
  activeWindows: ActiveChatWindow[];
  contacts: ChatContact[];
  allMessages: Record<string, ChatMessage[]>;
  totalUnreadCount: number;
  connectionState: ChatConnectionState;
  loadingHistoryByContact: Record<string, boolean>;
  typingByContact: Record<string, boolean>;
  openChatWith: (contactId: string, context?: ChatContact['contextRecord'], contactDetails?: Partial<ChatContact>) => void;
  closeChatWindow: (contactId: string) => void;
  toggleMinimizeWindow: (contactId: string) => void;
  sendMessageTo: (contactId: string, text: string) => void;
  retryMessage: (contactId: string, messageId: string) => void;
  setTyping: (contactId: string, isTyping: boolean) => void;
  getContact: (contactId: string) => ChatContact | undefined;
  getMessagesFor: (contactId: string) => ChatMessage[];
}

function isRawUUIDOrId(val?: string): boolean {
  if (!val) return false;
  const s = val.trim().toLowerCase();
  return (
    s.startsWith('usr_') ||
    s.startsWith('u-') ||
    s.startsWith('comp_') ||
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s) ||
    /^[0-9a-f]{20,}$/i.test(s) ||
    (s.length > 20 && /^[a-z0-9_-]+$/i.test(s))
  );
}

function resolveCleanIdentity(
  _contactId: string,
  context?: ChatContact['contextRecord'],
  providedDetails?: Partial<ChatContact>
): { name: string; company: string; role: string; avatarUrl?: string } {
  let name = providedDetails?.name && !isRawUUIDOrId(providedDetails.name) ? providedDetails.name : '';
  const company = providedDetails?.company && !isRawUUIDOrId(providedDetails.company) ? providedDetails.company : 'Verified Logistics Provider';
  const role = providedDetails?.role && !isRawUUIDOrId(providedDetails.role) ? providedDetails.role : 'Forwarding Specialist';

  if (!name && context?.title) {
    const match = context.title.match(/Chat with\s+([^·|\n]+)/i);
    if (match && match[1] && !isRawUUIDOrId(match[1])) {
      name = match[1].trim();
    } else if (!isRawUUIDOrId(context.title)) {
      name = context.title.split('·')[0].trim();
    }
  }

  if (!name || isRawUUIDOrId(name)) {
    name = 'Verified Freight Partner';
  }

  return { name, company, role, avatarUrl: providedDetails?.avatarUrl };
}

function buildDirectKey(uidA: string, uidB: string): string {
  const a = uidA.trim().toLowerCase().replace(/^c-/, '');
  const b = uidB.trim().toLowerCase().replace(/^c-/, '');
  return a <= b ? `${a}:${b}` : `${b}:${a}`;
}

function formatMessageTime(iso?: string): string {
  if (!iso) return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

function safeSaveLocalStorage(key: string, data: any) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err: any) {
    if (err.name === 'QuotaExceededError') {
      console.warn(`[ChatContext] LocalStorage quota exceeded writing ${key}. Pruning old records.`);
    }
  }
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [activeWindows, setActiveWindows] = useState<ActiveChatWindow[]>([]);
  const activeWindowsRef = useRef<ActiveChatWindow[]>([]);
  useEffect(() => {
    activeWindowsRef.current = activeWindows;
  }, [activeWindows]);

  // SSR Hydration Safe: Initialize to empty on both server & client initial render
  const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);
  const [connectionState, setConnectionState] = useState<ChatConnectionState>('DISCONNECTED');
  const [loadingHistoryByContact, setLoadingHistoryByContact] = useState<Record<string, boolean>>({});
  const [typingByContact, setTypingByContact] = useState<Record<string, boolean>>({});

  const clientRef = useRef<NhostChatRealtimeClient | null>(null);
  const conversationIdByPeerRef = useRef<Map<string, string>>(new Map());
  const lastSyncedAtRef = useRef<string>(new Date(Date.now() - 5 * 60_000).toISOString());
  const sessionIdRef = useRef<string>(
    typeof window !== 'undefined' ? `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}` : 'sess_ssr'
  );

  // Helper to merge authoritative server rows with deduplication by `id` and `clientMessageId`
  const mergeServerMessages = useCallback(
    (rows: any[], currentUid: string, currentEmail: string, myDisplayName: string) => {
      if (!Array.isArray(rows) || rows.length === 0) return;

      const newUnreadByPeer = new Map<string, number>();

      setAllMessages((prev) => {
        let changed = false;
        const nextMap = { ...prev };

        for (const row of rows) {
          if (!row || row.deleted_at) continue;
          const senderClean = String(row.sender_id || '').toLowerCase().replace(/^c-/, '');
          const recipientClean = String(row.recipient_id || '').toLowerCase().replace(/^c-/, '');
          const isMe =
            senderClean === currentUid.toLowerCase() ||
            (Boolean(currentEmail) && senderClean === currentEmail.toLowerCase());
          const peerKey = isMe ? recipientClean : senderClean;
          if (!peerKey) continue;

          if (row.conversation_id) {
            conversationIdByPeerRef.current.set(peerKey, row.conversation_id);
          }
          if (row.created_at && row.created_at > lastSyncedAtRef.current) {
            lastSyncedAtRef.current = row.created_at;
          }

          const formatted: ChatMessage = {
            id: row.id,
            clientMessageId: row.client_message_id || undefined,
            conversationId: row.conversation_id,
            senderUid: row.sender_id,
            senderName: isMe ? myDisplayName : 'Verified Partner',
            me: isMe,
            text: row.content,
            time: formatMessageTime(row.created_at),
            createdAt: row.created_at,
            status: row.read_at ? 'read' : 'sent',
          };

          const existingList = nextMap[peerKey] || [];
          const matchIdx = existingList.findIndex(
            (m) =>
              m.id === row.id ||
              (row.client_message_id && m.clientMessageId === row.client_message_id)
          );

          if (matchIdx >= 0) {
            const cur = existingList[matchIdx];
            if (cur.id !== formatted.id || cur.status !== formatted.status || cur.text !== formatted.text) {
              const updatedList = [...existingList];
              updatedList[matchIdx] = { ...cur, ...formatted };
              nextMap[peerKey] = updatedList;
              changed = true;
            }
          } else {
            const updatedList = [...existingList, formatted].sort((a, b) =>
              (a.createdAt || '').localeCompare(b.createdAt || '')
            );
            nextMap[peerKey] = updatedList;
            changed = true;

            if (!isMe && !row.read_at) {
              const isOpenAndVisible = activeWindowsRef.current.some(
                (w) => w.contactId.replace(/^c-/, '').toLowerCase() === peerKey && !w.isMinimized
              );
              if (!isOpenAndVisible) {
                newUnreadByPeer.set(peerKey, (newUnreadByPeer.get(peerKey) || 0) + 1);
              }
            }
          }
        }

        if (changed) {
          safeSaveLocalStorage(CHAT_MESSAGES_KEY, nextMap);
          return nextMap;
        }
        return prev;
      });

      if (newUnreadByPeer.size > 0) {
        setContacts((prev) => {
          const updated = prev.map((c) => {
            const cleanCid = c.id.replace(/^c-/, '').toLowerCase();
            const inc = newUnreadByPeer.get(cleanCid) || 0;
            return inc > 0 ? { ...c, unreadCount: (c.unreadCount || 0) + inc } : c;
          });
          safeSaveLocalStorage(CHAT_CONTACTS_KEY, updated);
          return updated;
        });
      }
    },
    []
  );

  // Client hydration from localStorage after mount & remote directory integration
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedContacts = localStorage.getItem(CHAT_CONTACTS_KEY);
      if (savedContacts) {
        const parsed = JSON.parse(savedContacts);
        if (Array.isArray(parsed)) {
          const dummyIds = new Set(['sarah', 'kiran', 'ravi', 'priya']);
          const sanitized = parsed
            .filter((c: any) => !dummyIds.has(c.id))
            .map((c: any) => {
              if (isRawUUIDOrId(c.name) || !c.name) {
                const clean = resolveCleanIdentity(c.id, c.contextRecord, c);
                return { ...c, name: clean.name, company: clean.company, role: clean.role };
              }
              return c;
            });
          setContacts(sanitized);
        }
      }

      const savedMessages = localStorage.getItem(CHAT_MESSAGES_KEY);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (parsed && typeof parsed === 'object') {
          const dummyIds = new Set(['sarah', 'kiran', 'ravi', 'priya']);
          const clean: Record<string, ChatMessage[]> = {};
          Object.keys(parsed).forEach((k) => {
            if (!dummyIds.has(k)) clean[k] = parsed[k];
          });
          setAllMessages(clean);
        }
      }
    } catch {}

    const loadRemoteContactsAndMembers = async () => {
      try {
        const [contactsRes, membersRes] = await Promise.allSettled([
          fetch('/api/contacts').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/members').then((r) => (r.ok ? r.json() : null)),
        ]);

        const remoteContacts: any[] =
          contactsRes.status === 'fulfilled' && contactsRes.value?.data ? contactsRes.value.data : [];
        const remoteMembers: any[] =
          membersRes.status === 'fulfilled' && membersRes.value?.members ? membersRes.value.members : [];

        setContacts((prev) => {
          const map = new Map<string, ChatContact>();
          for (const c of prev) {
            if (c.id) map.set(c.id.toLowerCase().replace(/^c-/, ''), c);
          }

          for (const m of remoteMembers) {
            if (!m.uid || (user?.uid && m.uid === user.uid)) continue;
            const key = m.uid.toLowerCase().replace(/^c-/, '');
            const existing = map.get(key);
            const isOnline = Boolean(m.isOnline || m.status === 'active' || m.status === 'online');
            const cleanName =
              m.displayName || `${m.firstName || ''} ${m.lastName || ''}`.trim() || 'Verified Partner';
            map.set(key, {
              id: m.uid,
              name: cleanName,
              company: m.company || 'Verified Logistics Provider',
              role: m.designation || 'Freight Specialist',
              avatarUrl: m.avatarUrl || existing?.avatarUrl,
              location: m.location || m.city || 'Global',
              timezone: m.timezone || 'Asia/Kolkata',
              online: existing?.online ?? isOnline,
              presenceStatus: existing?.presenceStatus ?? (isOnline ? 'active' : 'away'),
              unreadCount: existing?.unreadCount || 0,
              hasGoldenTick: Boolean(m.hasGoldenTick),
              contextRecord: existing?.contextRecord,
            });
          }

          for (const c of remoteContacts) {
            const rawId = c.contact_profile_id || c.uid || c.id;
            if (!rawId || (user?.uid && rawId === user.uid)) continue;
            const key = String(rawId).toLowerCase().replace(/^c-/, '');
            const existing = map.get(key);
            const isOnline = c.status === 'live' || c.status === 'online' || existing?.online;
            map.set(key, {
              id: rawId,
              name: c.name || existing?.name || 'Verified Partner',
              company: c.company || existing?.company || 'Verified Logistics Provider',
              role: c.designation || existing?.role || 'Freight Specialist',
              avatarUrl: c.avatar_url || existing?.avatarUrl,
              location: c.location || existing?.location || 'Global',
              timezone: c.timezone || existing?.timezone || 'Asia/Kolkata',
              online: Boolean(isOnline),
              presenceStatus: isOnline ? 'active' : existing?.presenceStatus || 'away',
              unreadCount: existing?.unreadCount || 0,
              hasGoldenTick: Boolean(c.is_favorite || existing?.hasGoldenTick),
              contextRecord: existing?.contextRecord,
            });
          }

          const merged = Array.from(map.values());
          safeSaveLocalStorage(CHAT_CONTACTS_KEY, merged);
          return merged;
        });
      } catch (err) {
        console.warn('[ChatContext] loadRemoteContactsAndMembers error:', err);
      }
    };

    if (!user?.uid || user.uid === 'guest') return;
    loadRemoteContactsAndMembers();
  }, [user?.uid]);

  // WebSocket-first Nhost GraphQL Realtime lifecycle (replaces 3s polling & N-contact presence polling)
  useEffect(() => {
    if (typeof window === 'undefined' || !user?.uid || user.uid === 'guest') return;

    let cancelled = false;
    const unsubs: Array<() => void> = [];

    const client = new NhostChatRealtimeClient({
      onStateChange: (nextState) => {
        if (!cancelled) setConnectionState(nextState);
      },
      onReconnected: async () => {
        if (cancelled) return;
        const missed = await client.executeGraphQL<{ chat_messages: any[] }>(QUERY_MISSED_MESSAGES, {
          since: lastSyncedAtRef.current,
          limit: 50,
        });
        if (missed.data?.chat_messages) {
          mergeServerMessages(missed.data.chat_messages, user.uid, user.email || '', user.displayName || 'Me');
        }
      },
    });
    clientRef.current = client;

    (async () => {
      const token = await client.getValidToken();
      if (!token || cancelled) return;

      // 1. Live messages subscription (incoming, outgoing confirmation, edits, read_at)
      unsubs.push(
        client.subscribe<{ chat_messages: any[] }>(
          SUB_CHAT_MESSAGES,
          { limit: 50 },
          {
            next: (data) => {
              if (data.chat_messages) {
                mergeServerMessages(data.chat_messages, user.uid, user.email || '', user.displayName || 'Me');
              }
            },
          }
        )
      );

      // 2. Live conversations subscription (direct_key <-> conversation_id mapping & context)
      unsubs.push(
        client.subscribe<{ chat_conversations: any[] }>(
          SUB_CHAT_CONVERSATIONS,
          { limit: 50 },
          {
            next: (data) => {
              if (!data.chat_conversations) return;
              for (const conv of data.chat_conversations) {
                if (conv.direct_key && conv.id) {
                  const parts = String(conv.direct_key).split(':');
                  const myClean = user.uid.toLowerCase().replace(/^c-/, '');
                  const peer = parts.find((p) => p !== myClean);
                  if (peer) conversationIdByPeerRef.current.set(peer, conv.id);
                }
              }
            },
          }
        )
      );

      // 3. Single batched presence & typing subscription (replaces N per-contact requests)
      const cutoff = new Date(Date.now() - 5 * 60_000).toISOString();
      unsubs.push(
        client.subscribe<{ chat_presence_sessions: any[] }>(
          SUB_CHAT_PRESENCE,
          { cutoff, limit: 100 },
          {
            next: (data) => {
              if (!data.chat_presence_sessions) return;
              const nowMs = Date.now();
              const statusByUser = new Map<string, 'active' | 'idle' | 'away' | 'offline'>();
              const typingMap: Record<string, boolean> = {};

              for (const p of data.chat_presence_sessions) {
                const uidKey = String(p.user_id || '').toLowerCase().replace(/^c-/, '');
                if (!uidKey) continue;
                if (!statusByUser.has(uidKey)) {
                  const st = p.status === 'active' || p.status === 'idle' || p.status === 'away' ? p.status : 'offline';
                  statusByUser.set(uidKey, st);
                }
                if (p.typing_conversation_id && p.typing_expires_at && new Date(p.typing_expires_at).getTime() > nowMs) {
                  typingMap[uidKey] = true;
                }
              }

              setTypingByContact(typingMap);
              setContacts((prev) =>
                prev.map((c) => {
                  const key = c.id.toLowerCase().replace(/^c-/, '');
                  const st = statusByUser.get(key) || 'offline';
                  const online = st === 'active' || st === 'idle';
                  if (c.presenceStatus === st && c.online === online) return c;
                  return { ...c, presenceStatus: st, online };
                })
              );
            },
          }
        )
      );

      // Publish own initial presence session
      await client.executeGraphQL(MUTATION_UPSERT_PRESENCE, {
        sessionId: sessionIdRef.current,
        userId: user.uid,
        status: 'active',
        lastSeenAt: new Date().toISOString(),
        typingConversationId: null,
        typingExpiresAt: null,
      });
    })();

    return () => {
      cancelled = true;
      unsubs.forEach((u) => {
        try {
          u();
        } catch {}
      });
      client.dispose();
      clientRef.current = null;
    };
  }, [user?.uid, user?.email, user?.displayName, mergeServerMessages]);

  const totalUnreadCount = contacts.reduce((sum, c) => sum + c.unreadCount, 0);

  const toggleLauncher = () => {
    setIsLauncherOpen((prev) => !prev);
  };

  const getContact = (contactId: string) => {
    const clean = contactId.replace(/^c-/, '');
    return contacts.find(
      (c) =>
        c.id === contactId ||
        c.id === clean ||
        c.id === `c-${clean}` ||
        c.id.toLowerCase() === clean.toLowerCase()
    );
  };

  const getMessagesFor = (contactId: string) => {
    const clean = contactId.replace(/^c-/, '').toLowerCase();
    return allMessages[contactId] || allMessages[clean] || [];
  };

  const openChatWith = async (
    contactId: string,
    context?: ChatContact['contextRecord'],
    contactDetails?: Partial<ChatContact>
  ) => {
    const cleanId = contactId.replace(/^c-/, '').toLowerCase();
    const target = contacts.find(
      (c) => c.id === contactId || c.id.toLowerCase().replace(/^c-/, '') === cleanId
    );
    let nextContacts: ChatContact[];

    const sanitizedContext = context
      ? {
          ...context,
          id: isRawUUIDOrId(context.id)
            ? context.type
              ? `${context.type.toUpperCase()}`
              : 'TRADE-REF'
            : context.id,
        }
      : undefined;

    if (!target) {
      const clean = resolveCleanIdentity(contactId, sanitizedContext, contactDetails);
      const newContact: ChatContact = {
        id: contactId,
        name: clean.name,
        role: clean.role,
        company: clean.company,
        avatarUrl: clean.avatarUrl,
        location: 'Global',
        timezone: 'Asia/Kolkata',
        online: true,
        unreadCount: 0,
        contextRecord: sanitizedContext,
      };
      nextContacts = [newContact, ...contacts];
    } else {
      nextContacts = contacts.map((c) => {
        if (c.id !== contactId && c.id.toLowerCase().replace(/^c-/, '') !== cleanId) return c;
        const clean = resolveCleanIdentity(contactId, sanitizedContext || c.contextRecord, {
          name: c.name,
          company: c.company,
          role: c.role,
          avatarUrl: c.avatarUrl,
          ...contactDetails,
        });
        return {
          ...c,
          name: clean.name,
          company: clean.company,
          role: clean.role,
          avatarUrl: clean.avatarUrl || c.avatarUrl,
          unreadCount: 0,
          contextRecord: sanitizedContext || c.contextRecord,
        };
      });
    }

    setContacts(nextContacts);
    safeSaveLocalStorage(CHAT_CONTACTS_KEY, nextContacts);

    // Open or restore window immediately
    setActiveWindows((prev) => {
      const existing = prev.find((w) => w.contactId === contactId || w.contactId.toLowerCase().replace(/^c-/, '') === cleanId);
      if (existing) {
        return prev.map((w) =>
          w.contactId === contactId || w.contactId.toLowerCase().replace(/^c-/, '') === cleanId
            ? { ...w, isMinimized: false }
            : w
        );
      }
      const currentList = prev.length >= 4 ? prev.slice(1) : prev;
      return [...currentList, { contactId, isMinimized: false }];
    });

    // Fetch bounded initial conversation history via HTTPS GraphQL & mark unread messages read
    const client = clientRef.current;
    if (client && user?.uid) {
      setLoadingHistoryByContact((prev) => ({ ...prev, [cleanId]: true }));
      try {
        let convId = conversationIdByPeerRef.current.get(cleanId);
        if (!convId) {
          const directKey = buildDirectKey(user.uid, cleanId);
          const convRes = await client.executeGraphQL<{ chat_conversations: any[] }>(
            QUERY_CONVERSATION_BY_DIRECT_KEY,
            { directKey }
          );
          convId = convRes.data?.chat_conversations?.[0]?.id;
          if (convId) conversationIdByPeerRef.current.set(cleanId, convId);
        }

        if (convId) {
          const msgRes = await client.executeGraphQL<{ chat_messages: any[] }>(
            QUERY_CONVERSATION_MESSAGES,
            { conversationId: convId, limit: 50 }
          );
          if (msgRes.data?.chat_messages) {
            mergeServerMessages(msgRes.data.chat_messages, user.uid, user.email || '', user.displayName || 'Me');
          }
          await client.executeGraphQL(MUTATION_MARK_MESSAGES_READ, {
            conversationId: convId,
            recipientId: user.uid,
            readAt: new Date().toISOString(),
          });
        }
      } catch {
        // Handled cleanly; UI exits loading state
      } finally {
        setLoadingHistoryByContact((prev) => ({ ...prev, [cleanId]: false }));
      }
    }
  };

  const closeChatWindow = (contactId: string) => {
    const cleanId = contactId.replace(/^c-/, '').toLowerCase();
    setActiveWindows((prev) =>
      prev.filter((w) => w.contactId !== contactId && w.contactId.toLowerCase().replace(/^c-/, '') !== cleanId)
    );
  };

  const toggleMinimizeWindow = (contactId: string) => {
    const cleanId = contactId.replace(/^c-/, '').toLowerCase();
    setActiveWindows((prev) =>
      prev.map((w) =>
        w.contactId === contactId || w.contactId.toLowerCase().replace(/^c-/, '') === cleanId
          ? { ...w, isMinimized: !w.isMinimized }
          : w
      )
    );
  };

  const persistMessageToNhost = useCallback(
    async (cleanPeerId: string, tempId: string, clientMessageId: string, text: string) => {
      const client = clientRef.current;
      if (!client || !user?.uid) {
        setAllMessages((prev) => {
          const list = prev[cleanPeerId] || [];
          const updated = list.map((m) => (m.id === tempId ? { ...m, status: 'failed' as const } : m));
          safeSaveLocalStorage(CHAT_MESSAGES_KEY, { ...prev, [cleanPeerId]: updated });
          return { ...prev, [cleanPeerId]: updated };
        });
        return;
      }

      try {
        let convId = conversationIdByPeerRef.current.get(cleanPeerId);
        if (!convId) {
          const directKey = buildDirectKey(user.uid, cleanPeerId);
          const contact = getContact(cleanPeerId);
          const convRes = await client.executeGraphQL<{ insert_chat_conversations_one: { id: string } }>(
            MUTATION_UPSERT_CONVERSATION,
            {
              directKey,
              contextType: contact?.contextRecord?.type || null,
              contextId: contact?.contextRecord?.id || null,
              contextTitle: contact?.contextRecord?.title || null,
              members: [{ user_id: user.uid }, { user_id: cleanPeerId }],
            }
          );
          convId = convRes.data?.insert_chat_conversations_one?.id;
          if (convId) conversationIdByPeerRef.current.set(cleanPeerId, convId);
        }

        if (!convId) throw new Error('Unable to resolve conversation');

        const insertRes = await client.executeGraphQL<{ insert_chat_messages_one: any }>(
          MUTATION_INSERT_MESSAGE,
          {
            conversationId: convId,
            recipientId: cleanPeerId,
            clientMessageId,
            content: text,
            messageType: 'text',
          }
        );

        const saved = insertRes.data?.insert_chat_messages_one;
        if (!saved?.id) throw new Error(insertRes.errors?.[0]?.message || 'Message insert failed');

        mergeServerMessages([saved], user.uid, user.email || '', user.displayName || 'Me');
      } catch {
        setAllMessages((prev) => {
          const list = prev[cleanPeerId] || [];
          const updated = list.map((m) => (m.id === tempId ? { ...m, status: 'failed' as const } : m));
          safeSaveLocalStorage(CHAT_MESSAGES_KEY, { ...prev, [cleanPeerId]: updated });
          return { ...prev, [cleanPeerId]: updated };
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [user?.uid, user?.email, user?.displayName, mergeServerMessages]
  );

  const sendMessageTo = async (contactId: string, text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !contactId || !user?.uid) return;

    const cleanPeerId = contactId.replace(/^c-/, '').toLowerCase();
    const tempId = `msg-${Date.now()}`;
    const clientMessageId = `cmsg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const nowIso = new Date().toISOString();

    const optimistic: ChatMessage = {
      id: tempId,
      clientMessageId,
      senderUid: user.uid,
      senderName: user.displayName,
      me: true,
      text: trimmed,
      time: formatMessageTime(nowIso),
      createdAt: nowIso,
      status: 'sending',
    };

    setAllMessages((prev) => {
      const existing = prev[cleanPeerId] || [];
      const updatedList = [...existing, optimistic];
      const nextMap = { ...prev, [cleanPeerId]: updatedList };
      safeSaveLocalStorage(CHAT_MESSAGES_KEY, nextMap);
      return nextMap;
    });

    await persistMessageToNhost(cleanPeerId, tempId, clientMessageId, trimmed);
  };

  const retryMessage = async (contactId: string, messageId: string) => {
    const cleanPeerId = contactId.replace(/^c-/, '').toLowerCase();
    const list = allMessages[cleanPeerId] || [];
    const target = list.find((m) => m.id === messageId && m.status === 'failed');
    if (!target) return;

    const clientMessageId = target.clientMessageId || `cmsg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    setAllMessages((prev) => {
      const updated = (prev[cleanPeerId] || []).map((m) =>
        m.id === messageId ? { ...m, status: 'sending' as const, clientMessageId } : m
      );
      return { ...prev, [cleanPeerId]: updated };
    });

    await persistMessageToNhost(cleanPeerId, messageId, clientMessageId, target.text);
  };

  const setTyping = (contactId: string, isTyping: boolean) => {
    const client = clientRef.current;
    if (!client || !user?.uid) return;
    const cleanPeerId = contactId.replace(/^c-/, '').toLowerCase();
    const convId = conversationIdByPeerRef.current.get(cleanPeerId) || null;
    if (!convId && isTyping) return;

    client
      .executeGraphQL(MUTATION_UPSERT_PRESENCE, {
        sessionId: sessionIdRef.current,
        userId: user.uid,
        status: 'active',
        lastSeenAt: new Date().toISOString(),
        typingConversationId: isTyping ? convId : null,
        typingExpiresAt: isTyping ? new Date(Date.now() + 6000).toISOString() : null,
      })
      .catch(() => {});
  };

  const contextValue = useMemo<ChatContextType>(
    () => ({
      isLauncherOpen,
      setIsLauncherOpen,
      toggleLauncher,
      activeWindows,
      contacts,
      allMessages,
      totalUnreadCount,
      connectionState,
      loadingHistoryByContact,
      typingByContact,
      openChatWith,
      closeChatWindow,
      toggleMinimizeWindow,
      sendMessageTo,
      retryMessage,
      setTyping,
      getContact,
      getMessagesFor,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isLauncherOpen,
      activeWindows,
      contacts,
      allMessages,
      totalUnreadCount,
      connectionState,
      loadingHistoryByContact,
      typingByContact,
    ]
  );

  return <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
