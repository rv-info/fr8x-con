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

function SingleChatBox({
  contactId,
  isMinimized,
  onMinimize,
  onClose,
  onOpenProfile,
}: SingleChatBoxProps) {
  const { getContact, getMessagesFor, sendMessageTo } = useChat();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const contact = getContact(contactId);
  const messages = getMessagesFor(contactId);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
        <div className="avatar" style={{ width: '22px', height: '22px', fontSize: '9px' }}>
          {initials}
        </div>
        <span className="name">{contact?.name || 'Chat'}</span>
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
      <div className="chathead">
        <div
          className="userinfo"
          onClick={() => contact && onOpenProfile(contact.name)}
          style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px', flex: 1, minWidth: 0 }}
          title="View profile"
        >
          <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '9.5px' }}>
            {initials}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <b style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11.5px', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span>{contact?.name || 'Contact'}</span>
              {contact?.hasGoldenTick && <GoldenTick />}
            </b>
            <small style={{ display: 'block', fontSize: '9.5px', color: 'var(--mut)', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span className={`presence ${contact?.online ? 'online' : ''}`} style={{ marginRight: '3px' }} />
              {contact?.online ? 'Online' : 'Away'} · {contact?.company}
            </small>
          </div>
        </div>

        <div className="ha">
          <button
            onClick={() => contact && onOpenProfile(contact.name)}
            title="Open Profile"
            className="actionicon"
          >
            <ExternalLink size={13} />
          </button>
          <button onClick={onMinimize} title="Minimize" className="actionicon">
            <Minus size={13} />
          </button>
          <button onClick={onClose} title="Close" className="actionicon">
            <X size={13} />
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
      <div className="chatbody messages">
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '20px 10px', color: 'var(--mut)', fontSize: '11px' }}>
            No messages yet. Send a trade message to start negotiation.
          </div>
        ) : (
          messages.map((m) => (
            <div key={m.id} className={`msg ${m.me ? 'me' : ''}`}>
              <div>{m.text}</div>
              <small>
                {m.time} {m.me ? (m.status === 'read' ? ' ✓✓' : ' ✓') : ''}
              </small>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
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

      {/* Multi-Window Chat Tray (Docked Bottom Right) */}
      <div className="multichattray">
        {activeWindows.map((win) => (
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

      {/* Contacts List Launcher Popup */}
      {isLauncherOpen && (
        <section className="chatlauncherpanel" aria-label="Trade Contacts Directory">
          <div className="chathead">
            <MessagesSquare size={17} />
            <div style={{ flex: 1 }}>
              <b>Trade Chat Hub</b>
              <small style={{ display: 'block', fontSize: '9.5px', color: 'var(--mut)' }}>
                Direct verified participant communication
              </small>
            </div>
            <button onClick={toggleLauncher} title="Close directory" className="actionicon">
              <X size={15} />
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
                const initials = c.name
                  .split(' ')
                  .map((p) => p[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={c.id}
                    className="chatcontact"
                    onClick={() => {
                      openChatWith(c.id);
                    }}
                  >
                    <div className="avatar" style={{ width: '28px', height: '28px', fontSize: '10px' }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {c.name}
                        </span>
                        {c.hasGoldenTick && <GoldenTick />}
                      </b>
                      <small>
                        <span className={`presence ${c.online ? 'online' : ''}`} />
                        {c.online ? 'Online' : 'Away'} · {c.role} ({c.company})
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
        title="Open Trade Chat Hub"
        aria-label="Open Trade Chat Hub"
      >
        <MessagesSquare size={20} />
        {totalUnreadCount > 0 && <span className="n">{totalUnreadCount}</span>}
      </button>
    </>
  );
}
