// FR8X-CON Approved Contacts Panel Component (Reference Layout Specs)
"use client";

import { useState, useEffect, memo } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { getUserConnections, type ContactConnection } from "@/lib/firebase/contacts";
import { MessageSquare, Users, Building2, Loader2 } from "lucide-react";
import Link from "next/link";
import { ROUTES } from "@/lib/utils/constants";

interface ContactsPanelProps {
  onSelectChat?: (contact: { id: string; name: string; company: string; role: string }) => void;
  compact?: boolean;
  maxDisplay?: number;
}

const ContactAvatar = memo(function ContactAvatar({
  name,
  company,
  photoURL,
  isOnline = true,
}: {
  name: string;
  company?: string;
  photoURL?: string;
  isOnline?: boolean;
}) {
  const pInitial = (name || "U").charAt(0).toUpperCase();
  const cInitial = (company || "C").charAt(0).toUpperCase();

  return (
    <div className="relative shrink-0">
      {photoURL ? (
        <img src={photoURL} alt={name} className="w-8 h-8 rounded-full object-cover border border-slate-200" />
      ) : (
        <div className="relative w-8 h-8 rounded-full bg-slate-900 border border-slate-700 flex items-center justify-center text-white font-bold text-[10px] overflow-hidden">
          <span className="opacity-40 text-[9px] uppercase absolute">{cInitial}</span>
          <span className="relative z-10 w-6 h-6 rounded-full bg-[var(--fr8x-lavender)] border border-white text-[9px] font-bold text-[var(--fr8x-jet)] flex items-center justify-center shadow-xs">
            {pInitial}
          </span>
        </div>
      )}
      {/* Online / Offline Indicator (Future Ready) */}
      <span
        className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-white ${
          isOnline ? "bg-emerald-500" : "bg-slate-300"
        }`}
        title={isOnline ? "Online Now" : "Offline"}
      />
    </div>
  );
});

export function ContactsPanel({ onSelectChat, compact = false, maxDisplay }: ContactsPanelProps) {
  const { user } = useAuth();
  const [connections, setConnections] = useState<ContactConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user?.uid) return;
    let isSubscribed = true;

    async function loadContacts() {
      setIsLoading(true);
      try {
        const data = await getUserConnections(user!.uid);
        if (isSubscribed) {
          const approved = data.filter((c) => c.status === "approved");
          setConnections(approved);
        }
      } catch (err) {
        console.error("Error loading contacts:", err);
      } finally {
        if (isSubscribed) setIsLoading(false);
      }
    }

    loadContacts();
    return () => {
      isSubscribed = false;
    };
  }, [user?.uid]);

  const filteredConnections = connections.filter((conn) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (conn.recipientName || "").toLowerCase().includes(q) ||
      (conn.requesterName || "").toLowerCase().includes(q) ||
      (conn.recipientCompany || "").toLowerCase().includes(q) ||
      (conn.requesterCompany || "").toLowerCase().includes(q)
    );
  });

  const displayList = maxDisplay ? filteredConnections.slice(0, maxDisplay) : filteredConnections;

  return (
    <div className="fr8x-card p-2.5 bg-white space-y-2 text-left animate-fadeIn border border-slate-200/80">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
        <div className="flex items-center gap-1.5">
          <Users className="h-3.5 w-3.5 text-[var(--fr8x-periwinkle)]" />
          <h3 className="text-[11px] font-bold text-[var(--fr8x-jet)]">Contact List</h3>
        </div>
        <span className="text-[9px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded-full">
          {filteredConnections.length}
        </span>
      </div>

      {/* Search Bar directly below Contact List header */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search contacts..."
          className="fr8x-input text-[10px] py-1 px-2 h-6"
        />
      </div>

      {/* Contacts List Body */}
      {isLoading ? (
        <div className="py-4 text-center flex items-center justify-center gap-1.5">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-foreground-muted" />
          <span className="text-[10px] text-foreground-muted">Loading contacts...</span>
        </div>
      ) : displayList.length === 0 ? (
        <div className="py-3 text-center space-y-1">
          <p className="text-[10px] text-foreground-muted">No approved contacts yet</p>
          <Link
            href={ROUTES.PROFILE}
            className="text-[9.5px] text-[var(--fr8x-periwinkle)] font-medium hover:underline block"
          >
            Find & add partners in Profile
          </Link>
        </div>
      ) : (
        <div className="max-h-[320px] overflow-y-auto space-y-1.5 pr-0.5 custom-scrollbar">
          {displayList.map((conn) => {
            const isRequester = conn.requesterId === user?.uid;
            const contactId = isRequester ? conn.recipientId : conn.requesterId;
            const contactName = isRequester ? conn.recipientName : conn.requesterName;
            const contactCompany = isRequester ? conn.recipientCompany : conn.requesterCompany;
            const contactRole = isRequester ? conn.recipientRole : conn.requesterRole;

            return (
              <div
                key={conn.id}
                className="p-1.5 rounded-lg bg-slate-50/70 hover:bg-slate-100/90 border border-slate-200/50 flex items-center justify-between gap-2 transition-all"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <ContactAvatar name={contactName} company={contactCompany} isOnline={true} />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-[var(--fr8x-jet)] truncate leading-tight">
                      {contactName}
                    </p>
                    <p className="text-[9px] text-foreground-secondary truncate flex items-center gap-0.5">
                      <Building2 className="h-2.5 w-2.5 text-slate-400 shrink-0" />
                      {contactCompany}
                    </p>
                    <p className="text-[8px] text-emerald-600 font-medium truncate">Active now</p>
                  </div>
                </div>

                {/* Quick Chat Button */}
                <div className="flex items-center gap-1 shrink-0">
                  {onSelectChat ? (
                    <button
                      onClick={() =>
                        onSelectChat({
                          id: contactId,
                          name: contactName,
                          company: contactCompany,
                          role: contactRole,
                        })
                      }
                      className="p-1.5 rounded-md bg-[var(--fr8x-mist)] text-[var(--fr8x-jet)] hover:bg-[var(--fr8x-periwinkle)] hover:text-white transition-colors"
                      title={`Quick Chat with ${contactName}`}
                    >
                      <MessageSquare className="h-3 w-3" />
                    </button>
                  ) : (
                    <Link
                      href={`/profile?tab=messages&userId=${contactId}`}
                      className="p-1.5 rounded-md bg-[var(--fr8x-mist)] text-[var(--fr8x-jet)] hover:bg-[var(--fr8x-periwinkle)] hover:text-white transition-colors"
                      title={`Chat with ${contactName}`}
                    >
                      <MessageSquare className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
