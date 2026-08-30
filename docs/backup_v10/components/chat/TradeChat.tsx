'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useChat } from '@/lib/context/ChatContext';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  MessagesSquare,
  X,
  SquarePen,
  ArrowLeft,
  Send,
  Search,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

export function TradeChat() {
  const {
    isOpen,
    toggleChat,
    activeContactId,
    activeContact,
    contacts,
    messages,
    totalUnreadCount,
    openChatWith,
    closeActiveChat,
    sendMessage,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeContactId) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, activeContactId]);

  const handleSend = () => {
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handleQuick = (txt: string) => {
    sendMessage(txt);
  };

  const filteredContacts = contacts.filter((c) =>
    (c.name + ' ' + c.role + ' ' + c.company).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Floating Action Button */}
      <button
        className="chatfab"
        onClick={toggleChat}
        title="Open Trade Chat"
        aria-label="Open Trade Chat"
      >
        <MessagesSquare size={22} />
        {totalUnreadCount > 0 && !isOpen && <span className="n">{totalUnreadCount}</span>}
      </button>

      {/* Floating Chat Panel */}
      {isOpen && (
        <section className="chatpanel" aria-label="Trade Chat Panel">
          {/* Header */}
          <div className="chathead">
            <MessagesSquare size={18} />
            <div>
              <b>Trade Chat</b>
              <small>Secure text-only record communication</small>
            </div>
            <div className="ha">
              {activeContactId ? (
                <button onClick={closeActiveChat} title="Back to contacts">
                  <ArrowLeft size={15} />
                </button>
              ) : (
                <button onClick={() => setSearchQuery('')} title="New conversation">
                  <SquarePen size={15} />
                </button>
              )}
              <button onClick={toggleChat} title="Close Trade Chat">
                <X size={15} />
              </button>
            </div>
          </div>

          {!activeContactId ? (
            /* Contacts List View */
            <>
              <div className="chatsearch">
                <div style={{ position: 'relative' }}>
                  <input
                    placeholder="Search verified contacts…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>
              <div className="chatbody">
                {filteredContacts.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--mut)', fontSize: '11.5px' }}>
                    No contacts found.
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
                        onClick={() => openChatWith(c.id)}
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
                            {c.online ? 'Online' : 'Away'} · {c.role}
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
            </>
          ) : (
            /* Active Conversation Thread View */
            <>
              <div className="threadtop">
                <button onClick={closeActiveChat} title="Back to contacts">
                  <ArrowLeft size={14} />
                </button>
                <div className="avatar" style={{ width: '26px', height: '26px', fontSize: '9.5px' }}>
                  {activeContact?.name
                    .split(' ')
                    .map((p) => p[0])
                    .join('')
                    .substring(0, 2)
                    .toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <b style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {activeContact?.name}
                    {activeContact?.hasGoldenTick && <GoldenTick />}
                  </b>
                  <small style={{ display: 'block', color: 'var(--mut)', fontSize: '10px' }}>
                    <span className={`presence ${activeContact?.online ? 'online' : ''}`} style={{ marginRight: '4px' }} />
                    {activeContact?.online ? 'Online' : 'Away'} · {activeContact?.company}
                  </small>
                </div>
              </div>

              {/* Context Record Bar if available */}
              {activeContact?.contextRecord && (
                <div
                  style={{
                    padding: '6px 10px',
                    background: '#eef6ff',
                    borderBottom: '1px solid #d0e4f7',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    fontSize: '10.5px',
                    color: 'var(--brand2)',
                  }}
                >
                  <span>
                    Linked {activeContact.contextRecord.type.toUpperCase()}: <b>{activeContact.contextRecord.id}</b>
                  </span>
                  <span style={{ fontSize: '9.5px', color: 'var(--mut)' }}>
                    {activeContact.contextRecord.title}
                  </span>
                </div>
              )}

              {/* Messages Body */}
              <div className="chatbody messages">
                {messages.map((m) => (
                  <div key={m.id} className={`msg ${m.me ? 'me' : ''}`}>
                    <div>{m.text}</div>
                    <small>
                      {m.time} {m.me ? ' ✓✓' : ''}
                    </small>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Freight Responses */}
              <div className="quick">
                <button onClick={() => handleQuick('Can you share your latest spot rate?')}>
                  Request spot rate
                </button>
                <button onClick={() => handleQuick('Please confirm container cargo-ready date.')}>
                  Cargo-ready date
                </button>
                <button onClick={() => handleQuick('Can you confirm combined detention free time?')}>
                  Free time
                </button>
                <button onClick={() => handleQuick('Please share vessel sailing schedule.')}>
                  Sailing schedule
                </button>
              </div>

              {/* Compose Box */}
              <div className="compose">
                <textarea
                  placeholder="Type freight business message…"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                />
                <button onClick={handleSend} title="Send message">
                  <Send size={15} />
                </button>
              </div>
            </>
          )}
        </section>
      )}
    </>
  );
}
