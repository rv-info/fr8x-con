'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatContact, ChatMessage, ActiveChatWindow } from '@/lib/types';
import { useAuth } from './AuthContext';

const INITIAL_CONTACTS: ChatContact[] = [];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {};

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

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isLauncherOpen, setIsLauncherOpen] = useState(false);
  const [activeWindows, setActiveWindows] = useState<ActiveChatWindow[]>([]);
  const [contacts, setContacts] = useState<ChatContact[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('fr8x_chat_contacts');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const dummyIds = new Set(['sarah', 'kiran', 'ravi', 'priya']);
            return parsed.filter((c: any) => !dummyIds.has(c.id));
          }
        }
      } catch {}
    }
    return [];
  });
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(() => {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('fr8x_chat_messages');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            const dummyIds = new Set(['sarah', 'kiran', 'ravi', 'priya']);
            const clean: Record<string, ChatMessage[]> = {};
            Object.keys(parsed).forEach((k) => {
              if (!dummyIds.has(k)) clean[k] = parsed[k];
            });
            return clean;
          }
        }
      } catch {}
    }
    return {};
  });

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
    // Ensure contact exists in state
    let target = contacts.find((c) => c.id === contactId);
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
      setContacts((prev) => [target!, ...prev]);
    } else if (context) {
      setContacts((prev) =>
        prev.map((c) => (c.id === contactId ? { ...c, contextRecord: context } : c))
      );
    }

    // Reset unread count for this contact
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, unreadCount: 0 } : c))
    );

    // Open or restore window
    setActiveWindows((prev) => {
      const existing = prev.find((w) => w.contactId === contactId);
      if (existing) {
        return prev.map((w) => (w.contactId === contactId ? { ...w, isMinimized: false } : w));
      }
      // Maximum 4 windows open on desktop side-by-side in parallel
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

    setAllMessages((prev) => ({
      ...prev,
      [contactId]: [...(prev[contactId] || []), newMsg],
    }));

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
      setAllMessages((prev) => ({
        ...prev,
        [contactId]: [...(prev[contactId] || []), replyMsg],
      }));
    }, 1500);
  };

  return (
    <ChatContext.Provider
      value={{
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
      }}
    >
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
