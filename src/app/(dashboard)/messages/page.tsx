// FR8X-CON Real-time Enterprise Messaging & Contact Search System
"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import {
  subscribeUserConversations,
  subscribeConversationMessages,
  sendMessage,
  getOrCreateConversation,
  togglePinConversation,
  toggleArchiveConversation,
  type ChatConversation,
  type ChatMessage,
} from "@/lib/firebase/chat";
import { getUserConnections, type ContactConnection } from "@/lib/firebase/contacts";
import { Button } from "@/components/ui/Button";
import {
  MessageSquare,
  Search,
  Pin,
  Archive,
  Paperclip,
  Image as ImageIcon,
  FileText,
  Gavel,
  Truck,
  DollarSign,
  Send,
  CheckCheck,
  Building2,
  Users,
  Circle,
  Plus,
  UserCheck,
} from "lucide-react";

function ChatComponent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const targetUserIdParam = searchParams.get("userId");

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [approvedContacts, setApprovedContacts] = useState<ContactConnection[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [textInput, setTextInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | "contacts" | "pinned" | "archived">("all");
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch approved contacts list
  useEffect(() => {
    if (!user?.uid) return;
    getUserConnections(user.uid).then((conns) => {
      setApprovedContacts(conns.filter((c) => c.status === "approved"));
    });
  }, [user?.uid]);

  // Subscribe to user conversations
  useEffect(() => {
    if (!user?.uid) return;
    const unsubscribe = subscribeUserConversations(user.uid, (data) => {
      setConversations(data);
      if (!activeConvId && data.length > 0 && data[0]?.id) {
        setActiveConvId(data[0].id);
      }
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // Check URL query param for starting chat with contact
  useEffect(() => {
    if (!user || !targetUserIdParam) return;

    const targetConn = approvedContacts.find(
      (c) => c.requesterId === targetUserIdParam || c.recipientId === targetUserIdParam
    );

    if (targetConn) {
      const isRequester = targetConn.requesterId === user.uid;
      const recipient = {
        id: isRequester ? targetConn.recipientId : targetConn.requesterId,
        name: isRequester ? targetConn.recipientName : targetConn.requesterName,
        company: isRequester ? targetConn.recipientCompany : targetConn.requesterCompany,
        role: isRequester ? targetConn.recipientRole : targetConn.requesterRole,
      };

      getOrCreateConversation(
        {
          id: user.uid,
          name: user.displayName || "Logistics Member",
          company: (user as any)?.companyName || "Verified Enterprise",
          role: user.role || "Executive",
        },
        recipient
      ).then((newId) => setActiveConvId(newId));
    }
  }, [user, targetUserIdParam, approvedContacts]);

  // Subscribe to active conversation messages
  useEffect(() => {
    if (!activeConvId) return;
    const unsubscribe = subscribeConversationMessages(activeConvId, (msgs) => {
      setMessages(msgs);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    });
    return () => unsubscribe();
  }, [activeConvId]);

  const activeConv = conversations.find((c) => c.id === activeConvId);
  const partnerId = activeConv?.participants.find((id) => id !== user?.uid);
  const partnerInfo = partnerId && activeConv?.participantDetails ? activeConv.participantDetails[partnerId] : null;

  // Handle contact selection from top contact search (Section 5 Spec)
  const handleSelectContactToChat = async (conn: ContactConnection) => {
    if (!user) return;
    const isRequester = conn.requesterId === user.uid;
    const recipient = {
      id: isRequester ? conn.recipientId : conn.requesterId,
      name: isRequester ? conn.recipientName : conn.requesterName,
      company: isRequester ? conn.recipientCompany : conn.requesterCompany,
      role: isRequester ? conn.recipientRole : conn.requesterRole,
    };

    const convId = await getOrCreateConversation(
      {
        id: user.uid,
        name: user.displayName || "Member",
        company: (user as any)?.companyName || "Enterprise",
        role: user.role || "Executive",
      },
      recipient
    );
    setActiveConvId(convId);
    setSearchQuery("");
  };

  const handleSendText = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!textInput.trim() || !activeConvId || !user) return;

    const textToSend = textInput.trim();
    setTextInput("");

    await sendMessage(activeConvId, {
      conversationId: activeConvId,
      senderId: user.uid,
      senderName: user.displayName || "Member",
      senderCompany: (user as any)?.companyName || "Enterprise",
      text: textToSend,
    });
  };

  const handleSendAttachment = async (
    type: "file" | "image" | "quotation" | "auction" | "shipment"
  ) => {
    if (!activeConvId || !user) return;
    setShowAttachmentMenu(false);

    let text = "";
    let data: Record<string, any> = {};

    if (type === "auction") {
      text = "Shared Reverse Auction: AUC-2026-089 (20' FCL - Nhava Sheva to Rotterdam)";
      data = { auctionId: "AUC-2026-089", lowestBid: "$1,450" };
    } else if (type === "quotation") {
      text = "Shared Rate Quote: QT-9902 ($1,250 / 40'HC - Mundra to Jebel Ali)";
      data = { quoteId: "QT-9902", rate: "$1,250" };
    } else if (type === "shipment") {
      text = "Shared Shipment Tracking: SHP-INNSA-SGSIN-401";
      data = { shipmentId: "SHP-INNSA-SGSIN-401", status: "In-Transit" };
    } else if (type === "image") {
      text = "Shared Image Asset: Container_Inspection.png";
      data = { fileName: "Inspection.png" };
    } else {
      text = "Shared Bill of Lading Document: BL_Document.pdf";
      data = { fileName: "BL_Document.pdf" };
    }

    await sendMessage(activeConvId, {
      conversationId: activeConvId,
      senderId: user.uid,
      senderName: user.displayName || "Member",
      senderCompany: (user as any)?.companyName || "Enterprise",
      text,
    });
  };

  // Instant Contact Search Filter (Approved Contacts only)
  const filteredApprovedContacts = approvedContacts.filter((c) => {
    if (!searchQuery.trim()) return false;
    const term = searchQuery.toLowerCase();
    const isReq = c.requesterId === user?.uid;
    const name = (isReq ? c.recipientName : c.requesterName).toLowerCase();
    const company = (isReq ? c.recipientCompany : c.requesterCompany).toLowerCase();
    const email = (isReq ? c.recipientEmail : c.requesterEmail).toLowerCase();
    return name.includes(term) || company.includes(term) || email.includes(term);
  });

  const filteredConversations = conversations.filter((c) => {
    const isPinned = c.pinnedBy?.includes(user?.uid || "");
    const isArchived = c.archivedBy?.includes(user?.uid || "");

    if (activeFilter === "pinned" && !isPinned) return false;
    if (activeFilter === "archived" && !isArchived) return false;
    if (activeFilter !== "archived" && isArchived) return false;

    if (searchQuery.trim()) {
      const term = searchQuery.toLowerCase();
      const partnerMatch = Object.values(c.participantDetails || {}).some(
        (p) => p.name.toLowerCase().includes(term) || p.company.toLowerCase().includes(term)
      );
      return partnerMatch;
    }
    return true;
  });

  return (
    <div className="h-[calc(100vh-80px)] max-w-7xl mx-auto flex flex-col md:flex-row bg-white border border-border rounded-xl shadow-sm overflow-hidden">
      {/* ═══ LEFT SIDEBAR: CONVERSATIONS & CONTACT SEARCH ═══ */}
      <div className="w-full md:w-80 lg:w-96 border-r border-border flex flex-col bg-slate-50">
        {/* Header */}
        <div className="p-4 border-b border-border bg-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
            <h1 className="text-heading-md font-bold text-[var(--fr8x-jet)]">Messages</h1>
          </div>
          <span className="fr8x-badge-info font-semibold">Approved Contacts Only</span>
        </div>

        {/* Section 5 Spec: Contact Search Bar at Top of Chat Panel */}
        <div className="p-3 bg-white border-b border-border space-y-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground-muted" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search approved contact by name, company, handle..."
              className="fr8x-input pl-8 py-1.5 text-xs"
            />
          </div>

          {/* Instant Search Results Dropdown overlay when typing */}
          {searchQuery.trim() && (
            <div className="bg-white border border-slate-200 rounded-lg shadow-md max-h-48 overflow-y-auto divide-y divide-slate-100 text-left">
              <p className="text-[9px] font-bold text-slate-500 uppercase px-2.5 py-1 bg-slate-50">
                Approved Contacts ({filteredApprovedContacts.length})
              </p>
              {filteredApprovedContacts.length === 0 ? (
                <div className="p-3 text-[10px] text-foreground-muted text-center">
                  No approved contacts found.
                </div>
              ) : (
                filteredApprovedContacts.map((conn) => {
                  const isReq = conn.requesterId === user?.uid;
                  const name = isReq ? conn.recipientName : conn.requesterName;
                  const company = isReq ? conn.recipientCompany : conn.requesterCompany;

                  return (
                    <div
                      key={conn.id}
                      onClick={() => handleSelectContactToChat(conn)}
                      className="p-2 hover:bg-slate-50 cursor-pointer flex items-center justify-between text-[11px]"
                    >
                      <div>
                        <p className="font-bold text-[var(--fr8x-jet)]">{name}</p>
                        <p className="text-[9.5px] text-foreground-secondary">{company}</p>
                      </div>
                      <span className="text-[9px] bg-[var(--fr8x-mist)] text-[var(--fr8x-periwinkle)] font-bold px-1.5 py-0.5 rounded">
                        Chat Now
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1 p-2 bg-slate-100 border-b border-border text-[11px] overflow-x-auto">
          {(["all", "contacts", "pinned", "archived"] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-2.5 py-1 rounded-md capitalize font-medium transition-colors ${
                activeFilter === filter
                  ? "bg-white text-[var(--fr8x-jet)] font-semibold shadow-xs"
                  : "text-foreground-secondary hover:text-[var(--fr8x-jet)]"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>

        {/* Conversation Items List */}
        <div className="flex-1 overflow-y-auto divide-y divide-border">
          {activeFilter === "contacts" ? (
            /* Show Approved Contacts List */
            approvedContacts.length === 0 ? (
              <div className="p-6 text-center text-body-sm text-foreground-muted">No approved contacts yet.</div>
            ) : (
              approvedContacts.map((conn) => {
                const isReq = conn.requesterId === user?.uid;
                const name = isReq ? conn.recipientName : conn.requesterName;
                const company = isReq ? conn.recipientCompany : conn.requesterCompany;

                return (
                  <div
                    key={conn.id}
                    onClick={() => handleSelectContactToChat(conn)}
                    className="p-3 hover:bg-white cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h4 className="text-body-sm font-bold text-[var(--fr8x-jet)]">{name}</h4>
                      <p className="text-caption text-foreground-secondary">{company}</p>
                    </div>
                    <UserCheck className="h-4 w-4 text-emerald-600" />
                  </div>
                );
              })
            )
          ) : filteredConversations.length === 0 ? (
            <div className="p-6 text-center text-body-sm text-foreground-muted">
              No active conversations.
            </div>
          ) : (
            filteredConversations.map((conv) => {
              const partner = Object.entries(conv.participantDetails || {}).find(
                ([id]) => id !== user?.uid
              )?.[1];
              const isPinned = conv.pinnedBy?.includes(user?.uid || "");
              const isSelected = conv.id === activeConvId;

              return (
                <div
                  key={conv.id}
                  onClick={() => setActiveConvId(conv.id)}
                  className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 relative text-left ${
                    isSelected ? "bg-blue-50/70 border-l-4 border-[var(--fr8x-periwinkle)]" : "hover:bg-white"
                  }`}
                >
                  <div className="relative shrink-0">
                    <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-body-md">
                      {partner?.name?.[0] || "C"}
                    </div>
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="text-body-sm font-bold text-[var(--fr8x-jet)] truncate">
                        {partner?.name || "Enterprise Partner"}
                      </h4>
                      <span className="text-[10px] text-foreground-muted">
                        {conv.lastMessageAt
                          ? new Date((conv.lastMessageAt as any).seconds * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : ""}
                      </span>
                    </div>

                    <p className="text-caption text-foreground-secondary truncate mt-0.5">
                      {partner?.company || "Logistics Partner"}
                    </p>

                    <p className="text-[11px] text-foreground-muted truncate mt-1">
                      {conv.lastMessage}
                    </p>
                  </div>

                  {isPinned && <Pin className="h-3 w-3 text-[var(--fr8x-periwinkle)] shrink-0 mt-1" />}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ═══ RIGHT WINDOW: ACTIVE CHAT PANEL ═══ */}
      {activeConvId && activeConv ? (
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Window Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-white shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="h-9 w-9 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-body-sm">
                  {partnerInfo?.name?.[0] || "P"}
                </div>
                <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-emerald-500 border-2 border-white" />
              </div>
              <div className="text-left">
                <h3 className="text-heading-sm font-bold text-[var(--fr8x-jet)]">
                  {partnerInfo?.name || "Enterprise Contact"}
                </h3>
                <p className="text-caption text-emerald-600 font-medium flex items-center gap-1">
                  <Circle className="h-2 w-2 fill-emerald-500 text-emerald-500" />
                  {partnerInfo?.company} • Online
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => user && togglePinConversation(activeConvId, user.uid, activeConv.pinnedBy?.includes(user.uid))}
                className="p-2 rounded-lg text-foreground-secondary hover:bg-slate-100"
                title="Pin Conversation"
              >
                <Pin className={`h-4 w-4 ${activeConv.pinnedBy?.includes(user?.uid || "") ? "text-[var(--fr8x-periwinkle)] fill-[var(--fr8x-periwinkle)]" : ""}`} />
              </button>

              <button
                onClick={() => user && toggleArchiveConversation(activeConvId, user.uid, activeConv.archivedBy?.includes(user.uid))}
                className="p-2 rounded-lg text-foreground-secondary hover:bg-slate-100"
                title="Archive Conversation"
              >
                <Archive className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#F8FAFC]">
            {messages.length === 0 ? (
              <div className="py-12 text-center text-caption text-foreground-muted">
                Start a conversation with {partnerInfo?.name}.
              </div>
            ) : (
              messages.map((msg, idx) => {
                const isMe = msg.senderId === user?.uid;
                return (
                  <div key={msg.id || idx} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                    <div
                      className={`max-w-md p-3 rounded-2xl text-body-sm shadow-xs ${
                        isMe
                          ? "bg-[var(--fr8x-periwinkle)] text-white rounded-br-none text-right"
                          : "bg-white text-[var(--fr8x-jet)] border border-border rounded-bl-none text-left"
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                      {/* No file/attachment rendering — production spec: text-only messaging */}

                      <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? "text-white/80" : "text-foreground-muted"}`}>
                        <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                        {isMe && <CheckCheck className="h-3 w-3" />}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 border-t border-border bg-white relative shrink-0">
            {showAttachmentMenu && (
              <div className="absolute bottom-16 left-4 bg-white border border-border rounded-xl shadow-lg p-2 flex flex-col gap-1 text-body-sm z-50 text-left">
                <button
                  onClick={() => handleSendAttachment("auction")}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 font-medium"
                >
                  <Gavel className="h-4 w-4 text-[var(--fr8x-periwinkle)]" /> Share Reverse Auction
                </button>
                <button
                  onClick={() => handleSendAttachment("quotation")}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 font-medium"
                >
                  <DollarSign className="h-4 w-4 text-emerald-600" /> Share Rate Quotation
                </button>
                <button
                  onClick={() => handleSendAttachment("shipment")}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 font-medium"
                >
                  <Truck className="h-4 w-4 text-indigo-600" /> Share Shipment Track
                </button>
              </div>
            )}

            <form onSubmit={handleSendText} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAttachmentMenu(!showAttachmentMenu)}
                className="p-2 rounded-lg text-foreground-secondary hover:bg-slate-100"
                title="Attach Document or Card"
              >
                <Paperclip className="h-4 w-4" />
              </button>

              <input
                type="text"
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                placeholder="Type your message..."
                className="fr8x-input flex-1 py-2 text-body-sm"
              />

              <Button type="submit" className="bg-[var(--fr8x-periwinkle)] text-white p-2 px-3 rounded-lg">
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center p-8 bg-slate-50 text-center">
          <div>
            <MessageSquare className="mx-auto h-12 w-12 text-foreground-muted mb-2" />
            <h3 className="text-heading-md font-bold text-[var(--fr8x-jet)]">Select a Conversation</h3>
            <p className="text-body-sm text-foreground-secondary mt-1">
              Use top contact search or pick an approved contact to start chatting.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function MessagesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center">Loading Messages...</div>}>
      <ChatComponent />
    </Suspense>
  );
}
