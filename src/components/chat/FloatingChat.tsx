// NEXUS — FR8X-CON Enterprise Messaging Launcher
// Professional thread-based messaging. No file attachments per platform policy.
// Real unread counts, real presence indicators, NEXUS-YYYY-NNNNN reference IDs.

"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/providers/AuthProvider";
import {
  getUserConnections,
  type ContactConnection,
} from "@/lib/firebase/contacts";
import {
  subscribeUserConversations,
  subscribeConversationMessages,
  sendMessage,
  getOrCreateConversation,
  markConversationRead,
  type ChatConversation,
  type ChatMessage,
} from "@/lib/firebase/chat";
import {
  subscribeToMultiPresence,
  getDotColor,
  getStatusLabel,
  type PresenceData,
} from "@/lib/firebase/presence";
import {
  MessageSquare,
  X,
  Minus,
  Search,
  Send,
  CheckCheck,
  Building2,
  ChevronLeft,
  Hash,
} from "lucide-react";

// ─── Dot indicator component ─────────────────────────────────────────────────

function PresenceDot({
  presence,
  className = "",
}: {
  presence?: PresenceData | null;
  className?: string;
}) {
  const color = getDotColor(presence);
  const colorClass =
    color === "green"
      ? "bg-emerald-500"
      : color === "orange"
      ? "bg-amber-400"
      : "bg-slate-400";
  return (
    <span
      className={`inline-block h-2 w-2 rounded-full border border-white ${colorClass} ${className}`}
      title={getStatusLabel(color)}
    />
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function FloatingChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const [connections, setConnections] = useState<ContactConnection[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [presenceMap, setPresenceMap] = useState<Record<string, PresenceData>>({});

  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Total unread count for badge
  const totalUnread = conversations.reduce((sum, c) => {
    return sum + (c.unreadCounts?.[user?.uid ?? ""] ?? 0);
  }, 0);

  // Load approved contacts
  useEffect(() => {
    if (!user?.uid) return;
    getUserConnections(user.uid).then((data) => {
      setConnections(data.filter((c) => c.status === "approved"));
    });
  }, [user?.uid, isOpen]);

  // Subscribe to user conversations
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = subscribeUserConversations(user.uid, (list) => {
      setConversations(list);
    });
    return () => unsub();
  }, [user?.uid]);

  // Subscribe to active conversation messages + mark read
  useEffect(() => {
    if (!activeConvId || !user?.uid) return;
    const unsub = subscribeConversationMessages(activeConvId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    });
    // Mark conversation as read
    markConversationRead(activeConvId, user.uid);
    return () => unsub();
  }, [activeConvId, user?.uid]);

  // Subscribe to presence for all contacts
  useEffect(() => {
    if (!user?.uid || connections.length === 0) return;
    const contactIds = connections.map((c) =>
      c.requesterId === user.uid ? c.recipientId : c.requesterId
    );
    const cleanup = subscribeToMultiPresence(contactIds, (map) => {
      setPresenceMap(map);
    });
    return () => cleanup();
  }, [user?.uid, connections]);

  if (!user) return null;

  const approvedContacts = connections.map((conn) => {
    const isReq = conn.requesterId === user.uid;
    return {
      id: isReq ? conn.recipientId : conn.requesterId,
      name: isReq ? conn.recipientName : conn.requesterName,
      company: isReq ? conn.recipientCompany : conn.requesterCompany,
      role: isReq ? conn.recipientRole : conn.requesterRole,
      email: isReq ? conn.recipientEmail : conn.requesterEmail,
    };
  });

  const filteredContacts = approvedContacts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.company.toLowerCase().includes(term) ||
      (c.email ?? "").toLowerCase().includes(term)
    );
  });

  const handleSelectContact = async (contact: (typeof approvedContacts)[0]) => {
    try {
      const convId = await getOrCreateConversation(
        {
          id: user.uid,
          name: user.displayName || "Logistics Member",
          company: (user as any)?.companyName || "Verified Enterprise",
          role: (user as any)?.role || "Executive",
        },
        contact
      );
      setActiveConvId(convId);
    } catch (err) {
      console.error("Error opening conversation:", err);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activePartnerId = activeConv?.participants.find((id) => id !== user.uid);
  const activePartner =
    activePartnerId && activeConv?.participantDetails
      ? activeConv.participantDetails[activePartnerId]
      : null;
  const activePartnerPresence = activePartnerId ? presenceMap[activePartnerId] : null;

  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const text = messageInput.trim();
    if (!text || !activeConvId || isSending) return;

    setMessageInput("");
    setIsSending(true);
    try {
      await sendMessage(activeConvId, {
        conversationId: activeConvId,
        senderId: user.uid,
        senderName: user.displayName || "Member",
        senderCompany: (user as any)?.companyName || "Enterprise",
        text,
      });
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Expanded Panel */}
      {isOpen && (
        <div
          className={`bg-[#252B33] border border-[#333B44] rounded-[3px] shadow-2xl overflow-hidden flex flex-col transition-all duration-200 mb-3 ${
            isMinimized ? "h-14 w-80" : "h-[500px] w-80 sm:w-96"
          }`}
        >
          {/* Header Bar */}
          <div className="bg-[#20252B] text-[#E2E8F0] border-b border-[#333B44] px-3 py-2 flex items-center justify-between shrink-0 shadow-sm">
            <div className="flex items-center gap-2 min-w-0">
              {activeConvId ? (
                <button
                  onClick={() => setActiveConvId(null)}
                  className="p-1 rounded-[3px] hover:bg-[#2A3038] text-[#94A3B8] transition-colors"
                  title="Back to contacts"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : (
                <div className="w-6 h-6 rounded-[3px] bg-[#0EA5E9] flex items-center justify-center font-bold text-white text-[10px] shrink-0">
                  N
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[11px] font-bold text-[#E2E8F0] truncate leading-tight">
                  {activeConvId && activePartner ? activePartner.name : "NEXUS"}
                </p>
                <div className="flex items-center gap-1 text-[9px] truncate">
                  {activeConvId && activePartner ? (
                    <>
                      <PresenceDot presence={activePartnerPresence} />
                      <span className="text-foreground-muted">
                        {activePartner.company} &middot;{" "}
                        {getStatusLabel(getDotColor(activePartnerPresence))}
                      </span>
                    </>
                  ) : (
                    <span className="text-foreground-muted">
                      Enterprise Messaging &middot; Approved Contacts Only
                    </span>
                  )}
                </div>
              </div>

              {/* NEXUS Ref ID */}
              {activeConvId && activeConv?.refId && (
                <span className="ml-auto shrink-0 text-[8px] font-mono text-slate-400 flex items-center gap-0.5">
                  <Hash className="h-2.5 w-2.5" />
                  {activeConv.refId}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0 ml-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
                title="Close"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex-1 flex flex-col min-h-0 bg-[#252B33]">
              {/* Active Conversation */}
              {activeConvId ? (
                <div className="flex-1 flex flex-col min-h-0 bg-[#252B33]">
                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#1E2329]">
                    {messages.length === 0 ? (
                      <div className="py-10 text-center text-[10px] text-foreground-muted">
                        <p className="font-medium text-slate-600 mb-1">
                          Start your conversation
                        </p>
                        <p className="text-slate-400">
                          Messages are end-to-end traceable via {activeConv?.refId}
                        </p>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = msg.senderId === user.uid;
                        return (
                          <div
                            key={msg.id || idx}
                            className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}
                          >
                            <div
                              className={`max-w-[82%] px-3 py-2 rounded-[3px] text-[11px] leading-relaxed shadow-sm ${
                                isMe
                                  ? "bg-[#0EA5E9] text-white"
                                  : "bg-[#2A3038] text-[#E2E8F0] border border-[#333B44]"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>
                              <div
                                className={`mt-1 flex items-center justify-end gap-1 text-[8px] ${
                                  isMe ? "text-white/70" : "text-slate-400"
                                }`}
                              >
                                <span>
                                  {new Date(msg.timestamp).toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                  })}
                                </span>
                                {isMe && <CheckCheck className="h-2.5 w-2.5" />}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Input */}
                  <div className="p-2 border-t border-[#333B44] bg-[#20252B] shrink-0">
                    <form onSubmit={handleSendText} className="flex items-center gap-1.5">
                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Write a message..."
                        className="fr8x-input flex-1 py-1 px-2.5 text-[11px] h-8 bg-[#2A3038] text-[#E2E8F0] border border-[#333B44]"
                        maxLength={2000}
                        autoFocus
                      />
                      <button
                        type="submit"
                        disabled={!messageInput.trim() || isSending}
                        className="bg-[#0EA5E9] text-white p-2 rounded-[3px] hover:bg-[#0284C7] disabled:opacity-40 transition-colors shrink-0"
                      >
                        <Send className="h-3.5 w-3.5" />
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                /* Contact Search / Conversation List */
                <div className="flex-1 flex flex-col min-h-0 bg-[#252B33]">
                  {/* Search */}
                  <div className="p-2 border-b border-[#333B44] bg-[#20252B] shrink-0">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search contacts..."
                        className="fr8x-input pl-8 py-1 text-[10px] h-7 bg-white"
                      />
                    </div>
                  </div>

                  {/* Recent conversations pinned at top */}
                  {conversations.length > 0 && !searchQuery && (
                    <div className="border-b border-slate-100 shrink-0">
                      <p className="px-3 pt-2 pb-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        Recent
                      </p>
                      {conversations.slice(0, 3).map((conv) => {
                        const partnerId = conv.participants.find((p) => p !== user.uid);
                        const partner = partnerId ? conv.participantDetails?.[partnerId] : null;
                        const unread = conv.unreadCounts?.[user.uid] ?? 0;
                        const partnerPresence = partnerId ? presenceMap[partnerId] : null;

                        return (
                          <div
                            key={conv.id}
                            onClick={() => setActiveConvId(conv.id)}
                            className="px-3 py-2 hover:bg-slate-50 cursor-pointer flex items-center gap-2.5 transition-colors"
                          >
                            <div className="relative shrink-0">
                              <div className="w-8 h-8 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center font-bold text-[10px] text-[var(--fr8x-jet)]">
                                {(partner?.name ?? "?").charAt(0)}
                              </div>
                              <PresenceDot
                                presence={partnerPresence}
                                className="absolute -bottom-0.5 -right-0.5 border-2"
                              />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center justify-between">
                                <p className="text-[10px] font-bold text-[var(--fr8x-jet)] truncate leading-tight">
                                  {partner?.name ?? "Contact"}
                                </p>
                                {unread > 0 && (
                                  <span className="ml-1 shrink-0 h-4 min-w-[16px] px-1 rounded-full bg-[var(--fr8x-periwinkle)] text-white text-[8px] font-bold flex items-center justify-center">
                                    {unread > 99 ? "99+" : unread}
                                  </span>
                                )}
                              </div>
                              <p className="text-[9px] text-slate-400 truncate">
                                {conv.lastMessage || "No messages yet"}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* All contacts */}
                  <div className="flex-1 overflow-y-auto">
                    {filteredContacts.length === 0 ? (
                      <div className="p-4 text-center text-[10px] text-foreground-muted">
                        {searchQuery
                          ? "No contacts matching your search."
                          : "No approved contacts yet."}
                      </div>
                    ) : (
                      <>
                        {!searchQuery && (
                          <p className="px-3 pt-2 pb-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                            All Contacts
                          </p>
                        )}
                        {filteredContacts.map((contact) => {
                          const presence = presenceMap[contact.id];
                          return (
                            <div
                              key={contact.id}
                              onClick={() => handleSelectContact(contact)}
                              className="px-3 py-2.5 hover:bg-slate-50 cursor-pointer flex items-center gap-2.5 transition-colors"
                            >
                              <div className="relative shrink-0">
                                <div className="w-8 h-8 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center font-bold text-[10px] text-[var(--fr8x-jet)]">
                                  {contact.name.charAt(0)}
                                </div>
                                <PresenceDot
                                  presence={presence}
                                  className="absolute -bottom-0.5 -right-0.5 border-2"
                                />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[10px] font-bold text-[var(--fr8x-jet)] truncate leading-tight">
                                  {contact.name}
                                </p>
                                <p className="text-[9px] text-slate-400 truncate flex items-center gap-0.5">
                                  <Building2 className="h-2.5 w-2.5 shrink-0" />
                                  {contact.company}
                                </p>
                              </div>
                              <span className="text-[9px] text-[var(--fr8x-periwinkle)] font-semibold shrink-0">
                                Message
                              </span>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Launcher Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="relative group flex items-center justify-center w-11 h-11 rounded-[3px] bg-[#0EA5E9] text-white shadow-xl hover:bg-[#0284C7] active:scale-95 transition-all duration-150 border border-[#333B44]"
          title="Open NEXUS Messaging"
        >
          <MessageSquare className="h-5 w-5" />
          {totalUnread > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[8px] font-bold text-white border border-[#333B44]">
              {totalUnread > 9 ? "9+" : totalUnread}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
