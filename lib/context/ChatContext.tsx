'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatContact, ChatMessage, ActiveChatWindow } from '@/lib/types';
import { useAuth } from './AuthContext';

const INITIAL_CONTACTS: ChatContact[] = [
  {
    id: 'sarah',
    name: 'Sarah Lewis',
    role: 'Ocean Freight Lead',
    company: 'Rotterdam Freight NV',
    location: 'Rotterdam, Netherlands',
    timezone: 'Europe/Amsterdam',
    online: true,
    unreadCount: 2,
    hasGoldenTick: false,
    contextRecord: {
      type: 'auction',
      id: 'RA-2026-0842',
      title: 'Mumbai → Rotterdam Auto Parts',
    },
  },
  {
    id: 'kiran',
    name: 'Kiran Mehta',
    role: 'Trade Lane Manager',
    company: 'Indo Ocean Lines',
    location: 'Mumbai, India',
    timezone: 'Asia/Kolkata',
    online: true,
    unreadCount: 0,
    hasGoldenTick: false,
  },
  {
    id: 'ravi',
    name: 'Ravi Thomas',
    role: 'Procurement Director',
    company: 'CargoLink Global',
    location: 'Singapore',
    timezone: 'Asia/Singapore',
    online: false,
    unreadCount: 0,
    hasGoldenTick: true,
  },
  {
    id: 'priya',
    name: 'Priya Nair',
    role: 'Trade Specialist',
    company: 'Nair Cargo Solutions',
    location: 'Mumbai, India',
    timezone: 'Asia/Kolkata',
    online: true,
    unreadCount: 1,
    hasGoldenTick: false,
  },
];

const INITIAL_MESSAGES: Record<string, ChatMessage[]> = {
  sarah: [
    {
      id: 'm1',
      senderUid: 'u-sarah',
      senderName: 'Sarah Lewis',
      me: false,
      text: 'Hi Arjun, can you share the updated 40HC rate for the Rotterdam auto parts shipment?',
      time: '09:12',
      status: 'read',
    },
    {
      id: 'm2',
      senderUid: 'u-arjun',
      senderName: 'Arjun Rao',
      me: true,
      text: 'Sure Sarah — all-in rate is USD 2,320 with 14 days combined demurrage/detention at ECT.',
      time: '09:15',
      status: 'read',
    },
    {
      id: 'm3',
      senderUid: 'u-sarah',
      senderName: 'Sarah Lewis',
      me: false,
      text: 'Noted. Reviewing container stuffing schedule now.',
      time: '09:18',
      status: 'read',
    },
  ],
  kiran: [
    {
      id: 'mk1',
      senderUid: 'u-kiran',
      senderName: 'Kiran Mehta',
      me: false,
      text: 'Please confirm cargo-ready date for the Antwerp consignment.',
      time: 'Yesterday',
      status: 'read',
    },
    {
      id: 'mk2',
      senderUid: 'u-arjun',
      senderName: 'Arjun Rao',
      me: true,
      text: 'Cargo will be ready by 02 Sep at Nhava Sheva CFS.',
      time: 'Yesterday',
      status: 'read',
    },
  ],
  ravi: [
    {
      id: 'mr1',
      senderUid: 'u-ravi',
      senderName: 'Ravi Thomas',
      me: false,
      text: 'Can you confirm direct feeder space for Singapore transshipments next week?',
      time: '24 Aug',
      status: 'read',
    },
  ],
  priya: [
    {
      id: 'mp1',
      senderUid: 'u-priya',
      senderName: 'Priya Nair',
      me: false,
      text: 'Sharing forwarder carrier allocation notes for Salalah routing.',
      time: '1h ago',
      status: 'delivered',
    },
  ],
};

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
  const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);

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
      // Maximum 3 windows open on desktop side-by-side to prevent screen overflow
      const currentList = prev.length >= 3 ? prev.slice(1) : prev;
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
