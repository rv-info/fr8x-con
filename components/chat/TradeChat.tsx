'use client';

import React, { useState, useRef, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useChat } from '@/lib/context/ChatContext';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { UserAvatar } from '@/components/ui/UserAvatar';
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

interface SingleChatBoxProps {
  contactId: string;
  isMinimized: boolean;
  onMinimize: () => void;
  onClose: () => void;
  onOpenProfile: (contactName: string) => void;
}

const PresenceDot = ({ status }: { status?: 'active' | 'idle' | 'away' | 'offline' | boolean }) => {
  let color = '#ef4444'; // away
  let title = 'Away / Offline';
  if (status === 'active' || status === true) {
    color = '#10b981'; // active
    title = 'Active Now';
  } else if (status === 'idle') {
    color = '#f59e0b'; // idle
    title = 'Idle (Tab Inactive)';
  } else if (status === 'offline') {
    color = '#94a3b8'; // offline
    title = 'Offline';
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
  const [isMaximized, setIsMaximized] = useState(false);
  const chatBodyRef = useRef<HTMLDivElement>(null);

  const contact = getContact(contactId);
  const messages = getMessagesFor(contactId);

  const cleanName =
    contact?.name && !isRawUUIDOrId(contact.name)
      ? contact.name
      : 'Verified Freight Partner';
  const cleanCompany =
    contact?.company && !isRawUUIDOrId(contact.company)
      ? contact.company
      : 'Verified Logistics Provider';

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

  const initials = cleanName
    .split(' ')
    .map((p) => p[0])
    .filter(Boolean)
    .join('')
    .substring(0, 2)
    .toUpperCase();

  if (isMinimized) {
    return (
      <div
        className="minichattab"
        onClick={onMinimize}
        title={`Restore chat with ${cleanName}`}
      >
        <div className="avatar" style={{ width: '22px', height: '22px', padding: 0, overflow: 'hidden' }}>
          {(contact as any)?.avatarUrl ? (
            <img src={(contact as any).avatarUrl} alt={cleanName} className="profile-img-avatar" style={{ width: '100%', height: '100%' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1168d7, #099889)', color: '#ffffff', fontSize: '9px', fontWeight: 800 }}>
              {initials}
            </div>
          )}
        </div>
        <span className="name" style={{ color: 'var(--fr8x-text, #1e293b)', fontWeight: 700 }}>{cleanName}</span>
        {contact?.hasGoldenTick && <GoldenTick />}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="closebtn close-red-box"
          title="Close chat"
        >
          <X size={13} />
        </button>
      </div>
    );
  }

  return (
    <div className={`singlechatwindow ${isMaximized ? 'maximized' : ''}`}>
      {/* Header */}
      <div className="chathead" style={{ padding: '10px 14px', minHeight: '48px' }}>
        <div
          className="userinfo"
          onClick={() => onOpenProfile(cleanName)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}
          title="View profile"
        >
          <UserAvatar
            name={cleanName}
            avatarUrl={(contact as any)?.avatarUrl}
            companyLogoUrl={(contact as any)?.companyLogoUrl}
            companyName={contact?.company}
            size={28}
          />
          <div style={{ overflow: 'hidden', minWidth: 0, flex: 1 }}>
            <b style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px', color: 'var(--fr8x-text, #1e293b)', fontWeight: 800, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span style={{ color: 'var(--fr8x-text, #1e293b)', fontWeight: 800 }}>{cleanName}</span>
              {contact?.hasGoldenTick && <GoldenTick />}
            </b>
            <small style={{ display: 'flex', alignItems: 'center', fontSize: '10px', color: 'var(--fr8x-muted, #475569)', fontWeight: 500, textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <PresenceDot status={contact?.presenceStatus ?? (contact?.online ? 'active' : 'away')} />
              <span>
                {contact?.presenceStatus
                  ? contact.presenceStatus === 'active'
                    ? 'Active'
                    : contact.presenceStatus === 'idle'
                    ? 'Idle'
                    : contact.presenceStatus === 'offline'
                    ? 'Offline'
                    : 'Away'
                  : contact?.online
                  ? 'Active'
                  : 'Away'}{' '}
                · {cleanCompany}
              </span>
            </small>
          </div>
        </div>

        <div className="ha" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <button
            onClick={onMinimize}
            title="Minimize chat"
            className="actionicon"
            style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Minus size={13} />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            title={isMaximized ? 'Restore normal window' : 'Maximize window'}
            className="actionicon"
            style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Maximize2 size={13} />
          </button>
          <button
            onClick={() => onOpenProfile(cleanName)}
            title="Open Profile"
            className="actionicon"
            style={{ width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <ExternalLink size={13} />
          </button>
          <button
            onClick={onClose}
            title="Close chat"
            className="close-red-box"
          >
            <X size={14} />
          </button>
        </div>
      </div>

      {/* Linked Freight Record Context Bar */}
      {contact?.contextRecord && (
        <div className="freightcontextbar">
          <span style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: 'var(--text-primary, #1F2937)' }}>
            <ShieldCheck size={12} color="var(--accent-primary, #006B68)" />
            <span>Trade Context</span>
          </span>
          <span className="conttitle" style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '240px', fontSize: '11px', color: 'var(--text-secondary, #64748B)' }}>
            {contact.contextRecord.title || 'Direct Freight Discussion'}
          </span>
        </div>
      )}

      {/* Messages Scroll Area */}
      <div className="chatbody messages" ref={chatBodyRef}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--text-secondary, #64748B)', fontSize: '11px' }}>
            No messages yet. Send a trade message to start negotiation.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`msg ${m.me ? 'me' : ''}`}>
              <div style={{ color: 'var(--text-primary, #1F2937)', fontWeight: 500 }}>{m.text}</div>
              <small style={{ color: 'var(--text-secondary, #64748B)' }}>
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
    setIsLauncherOpen,
    activeWindows,
    contacts,
    totalUnreadCount,
    openChatWith,
    closeChatWindow,
    toggleMinimizeWindow,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(null);

  const pathname = usePathname();
  const prevPathRef = useRef(pathname);

  // Route change listener: Auto-minimize open active windows and close launcher on navigation
  useEffect(() => {
    if (prevPathRef.current && prevPathRef.current !== pathname) {
      if (isLauncherOpen) {
        setIsLauncherOpen(false);
      }
      activeWindows.forEach((win) => {
        if (!win.isMinimized) {
          toggleMinimizeWindow(win.contactId);
        }
      });
    }
    prevPathRef.current = pathname;
  }, [pathname, isLauncherOpen, activeWindows, setIsLauncherOpen, toggleMinimizeWindow]);

  const filteredContacts = contacts.filter((c) => {
    const cleanName = c.name && !isRawUUIDOrId(c.name) ? c.name : 'Verified Freight Partner';
    const cleanRole = c.role && !isRawUUIDOrId(c.role) ? c.role : 'Forwarding Specialist';
    const cleanCompany = c.company && !isRawUUIDOrId(c.company) ? c.company : 'Verified Logistics Provider';
    return (cleanName + ' ' + cleanRole + ' ' + cleanCompany).toLowerCase().includes(searchQuery.toLowerCase());
  });

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
              style={{
                width: '28px',
                height: '28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--surface-secondary, #F8FAFC)',
                border: '1px solid var(--border-subtle, #E5E7EB)',
                color: 'var(--text-secondary, #64748B)',
                borderRadius: '6px',
              }}
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
                const displayName = c.name && !isRawUUIDOrId(c.name) ? c.name : 'Verified Freight Partner';
                const displayRole = c.role && !isRawUUIDOrId(c.role) ? c.role : 'Forwarding Specialist';
                const displayCompany = c.company && !isRawUUIDOrId(c.company) ? c.company : 'Verified Logistics Provider';
                const initials = displayName.split(' ').map((p) => p[0]).filter(Boolean).join('').substring(0, 2).toUpperCase();

                return (
                  <div
                    key={c.id}
                    className="chatcontact"
                    onClick={() => {
                      openChatWith(c.id);
                    }}
                  >
                    <UserAvatar
                      name={displayName}
                      avatarUrl={(c as any).avatarUrl}
                      companyLogoUrl={(c as any).companyLogoUrl}
                      companyName={c?.company}
                      size={28}
                    />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {displayName}
                        </span>
                        {c.hasGoldenTick && <GoldenTick />}
                      </b>
                      <small style={{ display: 'flex', alignItems: 'center' }}>
                        <PresenceDot status={c.presenceStatus ?? (c.online ? 'active' : 'away')} />
                        <span>
                          {c.presenceStatus
                            ? c.presenceStatus === 'active'
                              ? 'Active'
                              : c.presenceStatus === 'idle'
                              ? 'Idle'
                              : c.presenceStatus === 'offline'
                              ? 'Offline'
                              : 'Away'
                            : c.online
                            ? 'Active'
                            : 'Away'}{' '}
                          · {displayRole} ({displayCompany})
                        </span>
                      </small>
                      {c.contextRecord && (
                        <span
                          style={{
                            display: 'inline-block',
                            fontSize: '9.5px',
                            color: 'var(--accent-primary, #006B68)',
                            background: 'var(--surface-secondary, #F8FAFC)',
                            border: '1px solid var(--border-subtle, #E5E7EB)',
                            padding: '1px 5px',
                            borderRadius: '4px',
                            marginTop: '3px',
                          }}
                        >
                          {c.contextRecord.title ? c.contextRecord.title.substring(0, 32) : 'Active Freight Context'}
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
