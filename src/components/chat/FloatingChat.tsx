// FR8X-CON Floating Real-time Enterprise Chat Launcher Widget
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
  type ChatConversation,
  type ChatMessage,
} from "@/lib/firebase/chat";
import {
  MessageSquare,
  X,
  Minus,
  Search,
  Send,
  Paperclip,
  CheckCheck,
  Building2,
  Users,
  Circle,
  Gavel,
  DollarSign,
  ChevronLeft,
} from "lucide-react";

export function FloatingChat() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const [connections, setConnections] = useState<ContactConnection[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [messageInput, setMessageInput] = useState("");
  const [showAttachments, setShowAttachments] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  // Subscribe to active conversation messages
  useEffect(() => {
    if (!activeConvId) return;
    const unsub = subscribeConversationMessages(activeConvId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 80);
    });
    return () => unsub();
  }, [activeConvId]);

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

  // Filter contacts by search query (Name, Company Name, Username)
  const filteredContacts = approvedContacts.filter((c) => {
    if (!searchQuery.trim()) return true;
    const term = searchQuery.toLowerCase();
    return (
      c.name.toLowerCase().includes(term) ||
      c.company.toLowerCase().includes(term) ||
      c.email.toLowerCase().includes(term) ||
      c.role.toLowerCase().includes(term)
    );
  });

  // Handle contact click -> open or create conversation immediately
  const handleSelectContact = async (contact: typeof approvedContacts[0]) => {
    try {
      const convId = await getOrCreateConversation(
        {
          id: user.uid,
          name: user.displayName || "Logistics Member",
          company: (user as any)?.companyName || "Verified Enterprise",
          role: user.role || "Executive",
        },
        contact
      );
      setActiveConvId(convId);
    } catch (err) {
      console.error("Error creating chat:", err);
    }
  };

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const activePartnerId = activeConv?.participants.find((id) => id !== user.uid);
  const activePartner = activePartnerId && activeConv?.participantDetails ? activeConv.participantDetails[activePartnerId] : null;

  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageInput.trim() || !activeConvId) return;

    const text = messageInput.trim();
    setMessageInput("");

    await sendMessage(activeConvId, {
      conversationId: activeConvId,
      senderId: user.uid,
      senderName: user.displayName || "Member",
      senderCompany: (user as any)?.companyName || "Enterprise",
      text,
    });
  };

  const handleSendAttachment = async (type: "auction" | "quotation" | "file") => {
    if (!activeConvId) return;
    setShowAttachments(false);

    let text = "";
    let data = {};

    if (type === "auction") {
      text = "Shared Reverse Auction: AUC-2026-089 (20' FCL - Nhava Sheva to Rotterdam)";
      data = { auctionId: "AUC-2026-089", lowestBid: "$1,450" };
    } else if (type === "quotation") {
      text = "Shared Ocean Rate Quote: QT-9902 ($1,250 / 40'HC - Mundra to Jebel Ali)";
      data = { quoteId: "QT-9902", rate: "$1,250" };
    } else {
      text = "Shared Document: FR8X_Logistics_Spec.pdf";
      data = { fileName: "FR8X_Logistics_Spec.pdf" };
    }

    await sendMessage(activeConvId, {
      conversationId: activeConvId,
      senderId: user.uid,
      senderName: user.displayName || "Member",
      senderCompany: (user as any)?.companyName || "Enterprise",
      text,
      attachmentType: type,
      attachmentData: data,
    });
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      {/* Expanded Floating Chat Panel */}
      {isOpen && (
        <div
          className={`bg-white border border-slate-300 rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200 mb-3 ${
            isMinimized ? "h-14 w-80" : "h-[480px] w-80 sm:w-96"
          }`}
        >
          {/* Header Bar — Light Theme & Crisp Outlines */}
          <div className="bg-white text-slate-900 border-b border-slate-200 px-3 py-2 flex items-center justify-between shrink-0 shadow-2xs">
            <div className="flex items-center gap-2 min-w-0">
              {activeConvId ? (
                <button
                  onClick={() => setActiveConvId(null)}
                  className="p-1 rounded hover:bg-slate-100 text-slate-700 transition-colors"
                  title="Back to Contact Search"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              ) : (
                <div className="w-5 h-5 rounded bg-[var(--fr8x-periwinkle)] flex items-center justify-center font-bold text-white text-[9px] shadow-2xs">
                  F
                </div>
              )}

              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-900 truncate leading-tight">
                  {activeConvId && activePartner ? activePartner.name : "FR8X Enterprise Chat"}
                </p>
                <p className="text-[8px] text-emerald-600 font-medium truncate flex items-center gap-1">
                  <Circle className="h-1.5 w-1.5 fill-emerald-500 text-emerald-500" />
                  {activeConvId && activePartner ? `${activePartner.company} • Online` : "Approved Contacts Only"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                title={isMinimized ? "Expand" : "Minimize"}
              >
                <Minus className="h-3.5 w-3.5" />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  setIsMinimized(false);
                }}
                className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors"
                title="Close Chat"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {!isMinimized && (
            <div className="flex-1 flex flex-col min-h-0 bg-slate-50">
              {/* If Active Conversation is Open */}
              {activeConvId ? (
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                  {/* Messages Feed */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-2.5 bg-[#F8FAFC]">
                    {messages.length === 0 ? (
                      <div className="py-10 text-center text-[10px] text-foreground-muted">
                        Start messaging with {activePartner?.name || "contact"}.
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isMe = msg.senderId === user.uid;
                        return (
                          <div key={msg.id || idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                            <div
                              className={`max-w-[82%] p-2.5 rounded-xl text-[11px] leading-relaxed shadow-2xs ${
                                isMe
                                  ? "bg-[var(--fr8x-periwinkle)] text-white rounded-br-none"
                                  : "bg-white text-[var(--fr8x-jet)] border border-slate-200 rounded-bl-none"
                              }`}
                            >
                              <p className="whitespace-pre-wrap">{msg.text}</p>

                              <div className={`mt-1 flex items-center justify-end gap-1 text-[8px] ${isMe ? "text-white/80" : "text-slate-400"}`}>
                                <span>
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
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

                  {/* Input Box */}
                  <div className="p-2 border-t border-slate-200 bg-white relative shrink-0">
                    {showAttachments && (
                      <div className="absolute bottom-12 left-2 bg-white border border-slate-200 rounded-lg shadow-lg p-1.5 flex flex-col gap-1 text-[10px] z-50">
                        <button
                          onClick={() => handleSendAttachment("auction")}
                          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 font-medium"
                        >
                          <Gavel className="h-3 w-3 text-[var(--fr8x-periwinkle)]" /> Share Reverse Auction
                        </button>
                        <button
                          onClick={() => handleSendAttachment("quotation")}
                          className="flex items-center gap-1.5 px-2 py-1 rounded hover:bg-slate-100 font-medium"
                        >
                          <DollarSign className="h-3 w-3 text-emerald-600" /> Share Rate Quote
                        </button>
                      </div>
                    )}

                    <form onSubmit={handleSendText} className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAttachments(!showAttachments)}
                        className="p-1.5 rounded text-slate-500 hover:bg-slate-100"
                        title="Attach"
                      >
                        <Paperclip className="h-3.5 w-3.5" />
                      </button>

                      <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        placeholder="Type message..."
                        className="fr8x-input flex-1 py-1 px-2 text-[10px] h-7"
                      />

                      <button
                        type="submit"
                        disabled={!messageInput.trim()}
                        className="bg-[var(--fr8x-periwinkle)] text-white p-1.5 rounded hover:bg-[#3ABFF0] disabled:opacity-50"
                      >
                        <Send className="h-3 w-3" />
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                /* Contact Search & Conversations List */
                <div className="flex-1 flex flex-col min-h-0 bg-white">
                  {/* Contact Search Input */}
                  <div className="p-2 border-b border-slate-200 bg-slate-50">
                    <div className="relative">
                      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search approved contact by name, company..."
                        className="fr8x-input pl-8 py-1 text-[10px] h-7 bg-white"
                      />
                    </div>
                  </div>

                  {/* List of Approved Contacts */}
                  <div className="flex-1 overflow-y-auto divide-y divide-slate-100">
                    {filteredContacts.length === 0 ? (
                      <div className="p-4 text-center text-[10px] text-foreground-muted">
                        No matching approved contacts.
                      </div>
                    ) : (
                      filteredContacts.map((contact) => (
                        <div
                          key={contact.id}
                          onClick={() => handleSelectContact(contact)}
                          className="p-2.5 hover:bg-slate-50 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="relative shrink-0">
                              <div className="w-8 h-8 rounded-full bg-[var(--fr8x-lavender)] border border-white flex items-center justify-center font-bold text-[10px] text-[var(--fr8x-jet)] shadow-xs">
                                {contact.name.charAt(0)}
                              </div>
                              <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-white" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-[10px] font-bold text-[var(--fr8x-jet)] truncate leading-tight">
                                {contact.name}
                              </p>
                              <p className="text-[9px] text-foreground-secondary truncate flex items-center gap-0.5">
                                <Building2 className="h-2.5 w-2.5 text-slate-400" />
                                {contact.company}
                              </p>
                            </div>
                          </div>

                          <span className="text-[9px] bg-[var(--fr8x-mist)] text-[var(--fr8x-periwinkle)] px-1.5 py-0.5 rounded font-semibold shrink-0">
                            Chat
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Launcher Circle Button */}
      {!isOpen && (
        <button
          onClick={() => {
            setIsOpen(true);
            setIsMinimized(false);
          }}
          className="relative group flex items-center justify-center w-12 h-12 rounded-full bg-[var(--fr8x-periwinkle)] text-white shadow-xl hover:bg-[#3ABFF0] active:scale-95 transition-all duration-150 border-2 border-white"
          title="Open FR8X Floating Chat"
        >
          <MessageSquare className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-[8px] font-bold text-white border border-white">
            {connections.length}
          </span>
        </button>
      )}
    </div>
  );
}
