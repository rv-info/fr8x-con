'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/lib/context/ChatContext';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { ProfilePreviewModal } from '@/components/ui/ProfilePreviewModal';
import {
  MessagesSquare,
  X,
  Minus,
  Maximize2,
  Send,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface SingleChatBoxProps {
  contactId: string;
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onOpenProfile: (contactName: string) => void;
}

const PresenceDot = ({ status }: { status?: 'active' | 'idle' | 'away' | boolean }) => {
  let color = '#ef4444'; // away
  let title = 'Away / Offline';
  if (status === 'active' || status === true) {
    color = '#10b981'; // active
    title = 'Active Now';
  } else if (status === 'idle') {
    color = '#f59e0b'; // idle
    title = 'Idle (Tab Inactive)';
  }
  return (
    <span
      title={title}
      style={{
        display: 'inline-block',
        width: '7px',
        height: '7px',
        borderRadius: '50%',
        backgroundColor: color,
        marginRight: '4px',
        verticalAlign: 'middle',
      }}
    />
  );
};

function SingleChatBox({
  contactId,
  isMinimized,
  onMinimize,
  onClose,
  onOpenProfile,
}: SingleChatBoxProps) {
  const { getContact, getMessagesFor, sendMessageTo } = useChat();
  const [inputText, setInputText] = useState('');
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const contact = getContact(contactId);
  const messages = getMessagesFor(contactId);

  useEffect(() => {
    if (!isMinimized && chatBodyRef.current) {
      chatBodyRef.current.scrollTop = chatBodyRef.current.scrollHeight;
    }
  }, [messages, isMinimized]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessageTo(contactId, inputText);
    setInputText('');
  };

  const handleQuick = (txt: string) => {
    sendMessageTo(contactId, txt);
  };

  const initials = (contact?.name || 'Contact')
    .split(' ')
    .map((p) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (isMinimized) {
    return (
      <div
        className="minichattab"
        onClick={onMinimize}
        title={`Restore chat with ${contact?.name || 'Contact'}`}
      >
        <div className="avatar" style={{ width: '22px', height: '22px', padding: 0, overflow: 'hidden' }}>
          <img src="/profile-avatar.png" alt={contact?.name || 'Contact'} className="profile-img-avatar" style={{ width: '100%', height: '100%' }} />
        </div>
        <span className="name" style={{ color: 'var(--fr8x-text, #1e293b)', fontWeight: 700 }}>{contact?.name || 'Chat'}</span>
        {contact?.hasGoldenTick && <GoldenTick />}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="closebtn"
          title="Close chat"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className="singlechatwindow">
      {/* Header */}
      <div className="chathead" style={{ padding: '10px 14px', minHeight: '48px' }}>
        <div
          className="userinfo"
          onClick={() => contact && onOpenProfile(contact.name)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}
          title="View profile"
        >
          <div className="avatar" style={{ width: '28px', height: '28px', padding: 0, overflow: 'hidden', flexShrink: 0 }}>
            <img src="/profile-avatar.png" alt={contact?.name || 'Contact'} className="profile-img-avatar" style={{ width: '100%', height: '100%' }} />
          </div>
          <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
            <b style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--fr8x-text, #1e293b)', fontWeight: 800, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--fr8x-text, #1e293b)', fontWeight: 800 }}>{contact?.name || 'Contact'}</span>
              {contact?.hasGoldenTick && <GoldenTick />}
            </b>
            <small style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: 'var(--fr8x-muted, #475569)', fontWeight: 500, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <PresenceDot status={contact?.presenceStatus || (contact?.online ? 'active' : 'away')} />
              <span>{contact?.presenceStatus === 'active' || contact?.online ? 'Active' : contact?.presenceStatus === 'idle' ? 'Idle' : 'Away'} · {contact?.company}</span>
            </small>
          </div>
        </div>

        <div className="ha" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => contact && onOpenProfile(contact.name)}
            title="Open Profile"
            className="actionicon"
            style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ExternalLink size={14} />
          </button>
          <button
            onClick={onClose}
            title="Close chat"
            className="actionicon"
            style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '4px', color: '#0f172a' }}
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Linked Freight Record Context Bar */}
      {contact?.contextRecord && (
        <div className="freightcontextbar">
          <span>
            Ref: <b>{contact.contextRecord.id}</b>
          </span>
          <span className="conttitle">{contact.contextRecord.title}</span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="chatbody messages" ref={chatBodyRef}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--mut)', fontSize: '11px' }}>
            No messages yet. Send a trade message to start negotiation.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`msg ${m.me ? 'me' : ''}`}>
              <div style={{ color: m.me ? '#0f172a' : 'var(--fr8x-text, #1e293b)', fontWeight: 500 }}>{m.text}</div>
              <small style={{ color: 'var(--fr8x-muted, #64748b)' }}>
                {m.time} {m.me ? (m.status === 'read' ? ' ✓✓' : ' ✓') : ''}
              </small>
            </div>
          ))
        )}
      </div>

      {/* Quick Freight Responses */}
      <div className="quick">
        <button onClick={() => handleQuick('Can you share your latest spot rate?')}>
          Spot rate?
        </button>
        <button onClick={() => handleQuick('Please confirm container cargo-ready date.')}>
          Cargo ready
        </button>
        <button onClick={() => handleQuick('Can you confirm free time days?')}>
          Free time
        </button>
        <button onClick={() => handleQuick('Please share vessel sailing schedule.')}>
          Sailing date
        </button>
      </div>

      {/* Text Compose Area - NO ATTACHMENTS ALLOWED */}
      <div className="compose">
        <textarea
          placeholder="Type trade message (Enter to send)…"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button onClick={handleSend} title="Send message" className="sendbtn">
          <Send size={14} />
        </button>
      </div>
    </div>
  );
}

export function TradeChat() {
  const {
    isLauncherOpen,
    toggleLauncher,
    activeWindows,
    contacts,
    totalUnreadCount,
    openChatWith,
    closeChatWindow,
    toggleMinimizeWindow,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(null);

  const filteredContacts = contacts.filter((c) =>
    (c.name + ' ' + c.role + ' ' + c.company).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Profile Modal when profile icon is clicked */}
      <ProfilePreviewModal
        isOpen={Boolean(selectedProfileName)}
        onClose={() => setSelectedProfileName(null)}
        personName={selectedProfileName || ''}
      />

      {/* Multi-Window Chat Tray (Docked Bottom Right on desktop; single full-screen window on mobile) */}
      <div
        className="multichattray"
        style={{
          right: isLauncherOpen ? '348px' : '76px',
        }}
      >
        {activeWindows.slice(-1).map((win) => (
          <SingleChatBox
            key={win.contactId}
            contactId={win.contactId}
            isMinimized={win.isMinimized}
            onMinimize={() => toggleMinimizeWindow(win.contactId)}
            onClose={() => closeChatWindow(win.contactId)}
            onOpenProfile={(name) => setSelectedProfileName(name)}
          />
        ))}
      </div>

      {/* Contacts List Launcher Popup (Hidden when a chat window is active on mobile) */}
      {isLauncherOpen && activeWindows.length === 0 && (
        <section className="chatlauncherpanel" aria-label="Nexus Communication">
          <div className="chathead" style={{ padding: '12px 14px' }}>
            <MessagesSquare size={18} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <b style={{ color: 'var(--fr8x-text, #1e293b)', fontSize: '13px', fontWeight: 800 }}>Nexus Direct Chat</b>
              <small style={{ display: 'block', fontSize: '10px', color: 'var(--fr8x-muted, #475569)', fontWeight: 500 }}>
                Direct verified participant communication
              </small>
            </div>
            <button
              onClick={toggleLauncher}
              title="Close directory"
              className="actionicon"
              style={{ width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f1f5f9', borderRadius: '4px' }}
            >
              <X size={16} />
            </button>
          </div>

          <div className="chatsearch">
            <div style={{ position: 'relative' }}>
              <input
                placeholder="Search contacts, company, role…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          <div className="chatbody" style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {filteredContacts.length === 0 ? (
              <div style={{ padding: '24px 12px', textAlign: 'center', color: 'var(--mut)', fontSize: '11.5px' }}>
                No matching verified contacts.
              </div>
            ) : (
              filteredContacts.map((c) => {
                return (
                  <div
                    key={c.id}
                    className="chatcontact"
                    onClick={() => {
                      openChatWith(c.id);
                    }}
                  >
                    <div className="avatar" style={{ width: '28px', height: '28px', padding: 0, overflow: 'hidden' }}>
                      <img src="/profile-avatar.png" alt={c.name} className="profile-img-avatar" style={{ width: '100%', height: '100%' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </span>
                        {c.hasGoldenTick && <GoldenTick />}
                      </b>
                      <small style={{ display: 'flex', alignItems: 'center' }}>
                        <PresenceDot status={c.presenceStatus || (c.online ? 'active' : 'away')} />
                        <span>{c.presenceStatus === 'active' || c.online ? 'Active' : c.presenceStatus === 'idle' ? 'Idle' : 'Away'} · {c.role} ({c.company})</span>
                      </small>
                      {c.contextRecord && (
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '9.5px',
                            color: 'var(--brand)',
                            background: '#e8f1fd',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            marginTop: '3px',
                          }}
                        >
                          Ref: {c.contextRecord.id}
                        </span>
                      )}
                    </div>
                    {c.unreadCount > 0 && <span className="badge blue">{c.unreadCount}</span>}
                  </div>
                );
              })
            )}
          </div>
        </section>
      )}

      {/* Floating Bottom-Right Launcher Action Button */}
      <button
        className="chatfab"
        onClick={toggleLauncher}
        title="Open Nexus"
        aria-label="Open Nexus"
      >
        <MessagesSquare size={20} />
        {totalUnreadCount > 0 && <span className="n">{totalUnreadCount}</span>}
      </button>
    </>
  );
}
