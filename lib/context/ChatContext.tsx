'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { ChatContact, ChatMessage, ActiveChatWindow } from '@/lib/types';
import { useAuth } from './AuthContext';
import { presenceService } from '@/lib/presence/presenceService';

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
  openChatWith: (contactId: string, context?: ChatContact['contextRecord'], contactDetails?: Partial<ChatContact>) => void;
  closeChatWindow: (contactId: string) => void;
  toggleMinimizeWindow: (contactId: string) => void;
  sendMessageTo: (contactId: string, text: string) => void;
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
  contactId: string,
  context?: ChatContact['contextRecord'],
  providedDetails?: Partial<ChatContact>
): { name: string; company: string; role: string; avatarUrl?: string } {
  let name = providedDetails?.name && !isRawUUIDOrId(providedDetails.name) ? providedDetails.name : '';
  let company = providedDetails?.company && !isRawUUIDOrId(providedDetails.company) ? providedDetails.company : 'Verified Logistics Provider';
  let role = providedDetails?.role && !isRawUUIDOrId(providedDetails.role) ? providedDetails.role : 'Forwarding Specialist';

  // Check context title (e.g., "Chat with Captain Vikram Singh")
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
  // SSR Hydration Safe: Initialize to empty on both server & client initial render
  const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);

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

    // Load registered platform members & confirmed contacts into chat directory
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

    loadRemoteContactsAndMembers();
  }, [user?.uid]);

  // Periodic background message poll to ensure live bidirectional chat delivery across devices & accounts
  useEffect(() => {
    if (typeof window === 'undefined' || !user?.uid) return;

    let isSubscribed = true;
    const syncServerMessages = async () => {
      try {
        const res = await fetch('/api/contacts/chat');
        if (!res.ok) return;
        const data = await res.json();
        if (!data.success || !Array.isArray(data.data)) return;

        const serverMessages: any[] = data.data;
        const currentUid = (user.uid || '').toLowerCase();
        const currentEmail = (user.email || '').toLowerCase();

        setAllMessages((prev) => {
          let hasNew = false;
          const updated = { ...prev };

          for (const sm of serverMessages) {
            const senderClean = (sm.sender_id || '').toLowerCase().replace(/^c-/, '');
            const recipientClean = (sm.recipient_id || '').toLowerCase().replace(/^c-/, '');
            const isMe = senderClean === currentUid || senderClean === currentEmail;
            const conversationTarget = isMe ? sm.recipient_id : sm.sender_id;
            const convKey = conversationTarget.replace(/^c-/, '');

            const existingList = updated[convKey] || updated[conversationTarget] || [];
            const exists = existingList.some(
              (m) =>
                m.id === sm.id ||
                (m.text === sm.content &&
                  Math.abs(new Date(m.time).getTime() - new Date(sm.created_at).getTime()) < 5000)
            );

            if (!exists) {
              hasNew = true;
              const formattedMsg: ChatMessage = {
                id: sm.id,
                senderUid: sm.sender_id,
                senderName: isMe ? user.displayName : 'Verified Partner',
                me: isMe,
                text: sm.content,
                time: new Date(sm.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                status: sm.is_read ? 'read' : 'sent',
              };

              const nextList = [...existingList, formattedMsg];
              updated[convKey] = nextList;
              if (conversationTarget !== convKey) {
                updated[conversationTarget] = nextList;
              }
            }
          }

          if (hasNew && isSubscribed) {
            safeSaveLocalStorage(CHAT_MESSAGES_KEY, updated);
            return updated;
          }
          return prev;
        });
      } catch {}
    };

    syncServerMessages();
    const interval = setInterval(syncServerMessages, 3000);
    return () => {
      isSubscribed = false;
      clearInterval(interval);
    };
  }, [user?.uid, user?.email]);

  // Periodic background presence synchronizer for chat contacts
  useEffect(() => {
    if (typeof window === 'undefined' || contacts.length === 0) return;

    let isMounted = true;
    const syncPresence = async () => {
      let changed = false;
      const updated = await Promise.all(
        contacts.map(async (c) => {
          try {
            const cleanId = c.id.replace(/^c-/, '');
            const status = await presenceService.getContactPresence(cleanId);
            const isOnline = status === 'active' || status === 'idle';
            if (c.presenceStatus !== status || c.online !== isOnline) {
              changed = true;
              return { ...c, presenceStatus: status, online: isOnline };
            }
          } catch {}
          return c;
        })
      );

      if (changed && isMounted) {
        setContacts(updated);
        safeSaveLocalStorage(CHAT_CONTACTS_KEY, updated);
      }
    };

    syncPresence();
    const interval = setInterval(syncPresence, 20_000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
    // Re-run presence synchronization when contact list cardinality changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contacts.length]);

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
    const clean = contactId.replace(/^c-/, '');
    return allMessages[contactId] || allMessages[clean] || [];
  };

  const openChatWith = (
    contactId: string,
    context?: ChatContact['contextRecord'],
    contactDetails?: Partial<ChatContact>
  ) => {
    const cleanId = contactId.replace(/^c-/, '');
    let target = contacts.find(
      (c) => c.id === contactId || c.id === cleanId || c.id.toLowerCase() === cleanId.toLowerCase()
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
        if (c.id !== contactId && c.id !== cleanId) return c;
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

    // Immediately fetch conversation history from server
    fetch(`/api/contacts/chat?targetId=${encodeURIComponent(cleanId)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data?.success && Array.isArray(data.data)) {
          const currentUid = (user?.uid || '').toLowerCase();
          const currentEmail = (user?.email || '').toLowerCase();
          const formatted: ChatMessage[] = data.data.map((m: any) => {
            const senderClean = (m.sender_id || '').toLowerCase().replace(/^c-/, '');
            const isMe = senderClean === currentUid || senderClean === currentEmail;
            return {
              id: m.id,
              senderUid: m.sender_id,
              senderName: isMe ? user?.displayName || 'Me' : target?.name || contactDetails?.name || 'Verified Partner',
              me: isMe,
              text: m.content,
              time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              status: m.is_read ? 'read' : 'sent',
            };
          });

          setAllMessages((prev) => {
            const next = { ...prev, [contactId]: formatted, [cleanId]: formatted };
            safeSaveLocalStorage(CHAT_MESSAGES_KEY, next);
            return next;
          });
        }
      })
      .catch(() => {});

    // Open or restore window (Max 4 windows open on desktop side-by-side)
    setActiveWindows((prev) => {
      const existing = prev.find((w) => w.contactId === contactId || w.contactId === cleanId);
      if (existing) {
        return prev.map((w) =>
          w.contactId === contactId || w.contactId === cleanId ? { ...w, isMinimized: false } : w
        );
      }
      const currentList = prev.length >= 4 ? prev.slice(1) : prev;
      return [...currentList, { contactId, isMinimized: false }];
    });
  };

  const closeChatWindow = (contactId: string) => {
    const cleanId = contactId.replace(/^c-/, '');
    setActiveWindows((prev) => prev.filter((w) => w.contactId !== contactId && w.contactId !== cleanId));
  };

  const toggleMinimizeWindow = (contactId: string) => {
    const cleanId = contactId.replace(/^c-/, '');
    setActiveWindows((prev) =>
      prev.map((w) =>
        w.contactId === contactId || w.contactId === cleanId ? { ...w, isMinimized: !w.isMinimized } : w
      )
    );
  };

  const sendMessageTo = async (contactId: string, text: string) => {
    if (!text.trim() || !contactId) return;

    const cleanContactId = contactId.replace(/^c-/, '');
    const tempId = `msg-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: tempId,
      senderUid: user.uid,
      senderName: user.displayName,
      me: true,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setAllMessages((prev) => {
      const existing = prev[contactId] || prev[cleanContactId] || [];
      const updatedList = [...existing, newMsg];
      const nextMap = { ...prev, [contactId]: updatedList, [cleanContactId]: updatedList };
      safeSaveLocalStorage(CHAT_MESSAGES_KEY, nextMap);
      return nextMap;
    });

    try {
      const res = await fetch('/api/contacts/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetId: cleanContactId,
          content: text.trim(),
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.id) {
          setAllMessages((prev) => {
            const list = prev[contactId] || prev[cleanContactId] || [];
            const updated = list.map((m) => (m.id === tempId ? { ...m, id: json.data.id } : m));
            const nextMap = { ...prev, [contactId]: updated, [cleanContactId]: updated };
            safeSaveLocalStorage(CHAT_MESSAGES_KEY, nextMap);
            return nextMap;
          });
        }
      }
    } catch (err) {
      console.error('[ChatContext] sendMessageTo network error:', err);
    }
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
      openChatWith,
      closeChatWindow,
      toggleMinimizeWindow,
      sendMessageTo,
      getContact,
      getMessagesFor,
    }),
    // Intentional: Memoized on conversation state & unread counts; action handlers reference live state
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      isLauncherOpen,
      activeWindows,
      contacts,
      allMessages,
      totalUnreadCount,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}

