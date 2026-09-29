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
  openChatWith: (contactId: string, context?: ChatContact['contextRecord']) => void;
  closeChatWindow: (contactId: string) => void;
  toggleMinimizeWindow: (contactId: string) => void;
  sendMessageTo: (contactId: string, text: string) => void;
  getContact: (contactId: string) => ChatContact | undefined;
  getMessagesFor: (contactId: string) => ChatMessage[];
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

  // Client hydration from localStorage after mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const savedContacts = localStorage.getItem(CHAT_CONTACTS_KEY);
      if (savedContacts) {
        const parsed = JSON.parse(savedContacts);
        if (Array.isArray(parsed)) {
          const dummyIds = new Set(['sarah', 'kiran', 'ravi', 'priya']);
          setContacts(parsed.filter((c: any) => !dummyIds.has(c.id)));
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
  }, []);

  // Periodic background presence synchronizer for chat contacts
  useEffect(() => {
    if (typeof window === 'undefined' || contacts.length === 0) return;

    let isMounted = true;
    const syncPresence = async () => {
      let changed = false;
      const updated = await Promise.all(
        contacts.map(async (c) => {
          try {
            const status = await presenceService.getContactPresence(c.id);
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
    const interval = setInterval(syncPresence, 45_000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [contacts.length]);

  const totalUnreadCount = contacts.reduce((sum, c) => sum + c.unreadCount, 0);

  const toggleLauncher = () => {
    setIsLauncherOpen((prev) => !prev);
  };

  const getContact = (contactId: string) => {
    return contacts.find((c) => c.id === contactId);
  };

  const getMessagesFor = (contactId: string) => {
    return allMessages[contactId] || [];
  };

  const openChatWith = (contactId: string, context?: ChatContact['contextRecord']) => {
    let target = contacts.find((c) => c.id === contactId);
    let nextContacts: ChatContact[];

    if (!target) {
      target = {
        id: contactId,
        name: contactId.charAt(0).toUpperCase() + contactId.slice(1),
        role: 'Freight Professional',
        company: 'Partner Logistics',
        location: 'Global',
        timezone: 'Asia/Kolkata',
        online: true,
        unreadCount: 0,
        contextRecord: context,
      };
      nextContacts = [target, ...contacts];
    } else {
      nextContacts = contacts.map((c) => {
        if (c.id !== contactId) return c;
        return {
          ...c,
          unreadCount: 0,
          contextRecord: context || c.contextRecord,
        };
      });
    }

    setContacts(nextContacts);
    safeSaveLocalStorage(CHAT_CONTACTS_KEY, nextContacts);

    // Open or restore window (Max 4 windows open on desktop side-by-side)
    setActiveWindows((prev) => {
      const existing = prev.find((w) => w.contactId === contactId);
      if (existing) {
        return prev.map((w) => (w.contactId === contactId ? { ...w, isMinimized: false } : w));
      }
      const currentList = prev.length >= 4 ? prev.slice(1) : prev;
      return [...currentList, { contactId, isMinimized: false }];
    });
  };

  const closeChatWindow = (contactId: string) => {
    setActiveWindows((prev) => prev.filter((w) => w.contactId !== contactId));
  };

  const toggleMinimizeWindow = (contactId: string) => {
    setActiveWindows((prev) =>
      prev.map((w) => (w.contactId === contactId ? { ...w, isMinimized: !w.isMinimized } : w))
    );
  };

  const sendMessageTo = (contactId: string, text: string) => {
    if (!text.trim() || !contactId) return;

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      senderUid: user.uid,
      senderName: user.displayName,
      me: true,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      status: 'sent',
    };

    setAllMessages((prev) => {
      const updatedList = [...(prev[contactId] || []), newMsg];
      const nextMap = { ...prev, [contactId]: updatedList };
      safeSaveLocalStorage(CHAT_MESSAGES_KEY, nextMap);
      return nextMap;
    });

    // Counterpart automated acknowledgement simulation
    const targetContact = contacts.find((c) => c.id === contactId);
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        senderUid: contactId,
        senderName: targetContact?.name || 'Contact',
        me: false,
        text: 'Received and noted in freight records. Reverting shortly.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
      };
      setAllMessages((prev) => {
        const updatedList = [...(prev[contactId] || []), replyMsg];
        const nextMap = { ...prev, [contactId]: updatedList };
        safeSaveLocalStorage(CHAT_MESSAGES_KEY, nextMap);
        return nextMap;
      });
    }, 1500);
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

