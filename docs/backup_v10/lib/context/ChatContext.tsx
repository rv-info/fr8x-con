'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatContact, ChatMessage } from '@/lib/types';
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
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  toggleChat: () => void;
  activeContactId: string | null;
  activeContact: ChatContact | undefined;
  contacts: ChatContact[];
  messages: ChatMessage[];
  totalUnreadCount: number;
  openChatWith: (contactId: string, context?: ChatContact['contextRecord']) => void;
  closeActiveChat: () => void;
  sendMessage: (text: string) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeContactId, setActiveContactId] = useState<string | null>(null);
  const [contacts, setContacts] = useState<ChatContact[]>(INITIAL_CONTACTS);
  const [allMessages, setAllMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES);

  const totalUnreadCount = contacts.reduce((sum, c) => sum + c.unreadCount, 0);

  const toggleChat = () => {
    setIsOpen((prev) => !prev);
  };

  const openChatWith = (contactId: string, context?: ChatContact['contextRecord']) => {
    setIsOpen(true);
    let target = contacts.find((c) => c.id === contactId);

    // If contact is not yet in contacts, add them dynamically
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

    // Reset unread count for active contact
    setContacts((prev) =>
      prev.map((c) => (c.id === contactId ? { ...c, unreadCount: 0 } : c))
    );

    setActiveContactId(contactId);
  };

  const closeActiveChat = () => {
    setActiveContactId(null);
  };

  const sendMessage = (text: string) => {
    if (!text.trim() || !activeContactId) return;

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
      [activeContactId]: [...(prev[activeContactId] || []), newMsg],
    }));

    // Simulate smart counterpart automated acknowledgment
    const targetId = activeContactId;
    setTimeout(() => {
      const replyMsg: ChatMessage = {
        id: `msg-${Date.now() + 1}`,
        senderUid: targetId,
        senderName: contacts.find((c) => c.id === targetId)?.name || 'Contact',
        me: false,
        text: 'Received and noted in freight records. I will review and revert shortly.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        status: 'delivered',
      };
      setAllMessages((prev) => ({
        ...prev,
        [targetId]: [...(prev[targetId] || []), replyMsg],
      }));
    }, 1200);
  };

  const activeContact = contacts.find((c) => c.id === activeContactId);
  const activeMessages = activeContactId ? allMessages[activeContactId] || [] : [];

  return (
    <ChatContext.Provider
      value={{
        isOpen,
        setIsOpen,
        toggleChat,
        activeContactId,
        activeContact,
        contacts,
        messages: activeMessages,
        totalUnreadCount,
        openChatWith,
        closeActiveChat,
        sendMessage,
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
