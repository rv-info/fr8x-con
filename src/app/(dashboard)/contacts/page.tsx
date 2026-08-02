// FR8X-CON Enterprise Contact Management Dashboard

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/providers/AuthProvider";
import {
  getUserConnections,
  sendContactRequest,
  updateContactStatus,
  removeContact,
  searchContactDirectory,
  type ContactConnection,
  type UserContactProfile,
} from "@/lib/firebase/contacts";
import { ROUTES } from "@/lib/utils/constants";
import { Button } from "@/components/ui/Button";
import {
  Users,
  UserPlus,
  UserCheck,
  UserX,
  ShieldBan,
  Search,
  MessageSquare,
  Building2,
  ExternalLink,
  CheckCircle2,
  Clock,
  XCircle,
  Filter,
  Check,
  X,
  Trash2,
  Star,
  Award,
} from "lucide-react";
import { PeerReviewModal } from "@/components/contacts/PeerReviewModal";
import { queryDocuments, limit } from "@/lib/firebase/firestore";

type ContactTab = "approved" | "received" | "sent" | "rejected" | "blocked" | "search" | "reviews";

export default function ContactsPage() {
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<ContactTab>("approved");
  const [connections, setConnections] = useState<ContactConnection[]>([]);
  const [directoryResults, setDirectoryResults] = useState<UserContactProfile[]>([]);
  const [peerReviews, setPeerReviews] = useState<any[]>([]);
  const [reviewsSearchQuery, setReviewsSearchQuery] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  // Peer Review Modal state
  const [selectedReviewTarget, setSelectedReviewTarget] = useState<{ id: string; name: string; company?: string } | null>(null);

  const fetchConnections = async () => {
    if (!user) return;
    setIsLoading(true);
    const data = await getUserConnections(user.uid);
    setConnections(data);
    setIsLoading(false);
  };

  const handleSearchDirectory = async () => {
    if (!user) return;
    setIsLoading(true);
    const results = await searchContactDirectory(searchQuery, user.uid);
    setDirectoryResults(results);
    setIsLoading(false);
  };

  const fetchPeerReviews = async () => {
    try {
      const docs = await queryDocuments<any>("peer_reviews", [limit(50)]);
      setPeerReviews(docs);
    } catch {
      setPeerReviews([]);
    }
  };

  useEffect(() => {
    fetchConnections();
    fetchPeerReviews();
  }, [user]);

  useEffect(() => {
    if (activeTab === "search") {
      handleSearchDirectory();
    }
    if (activeTab === "reviews") {
      fetchPeerReviews();
    }
  }, [activeTab, searchQuery]);

  const showNotification = (msg: string) => {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  };

  // Connection Action Handlers
  const handleSendRequest = async (target: UserContactProfile) => {
    if (!user) return;
    try {
      await sendContactRequest(
        {
          id: user.uid,
          name: user.displayName || "Logistics Partner",
          email: user.email || "",
          company: (user as any)?.companyName || "Verified Enterprise",
          role: user.role || "Executive",
        },
        {
          id: target.uid,
          name: target.fullName,
          email: target.email,
          company: target.companyName,
          role: target.role,
        }
      );
      showNotification(`Contact request sent to ${target.fullName}`);
      await fetchConnections();
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateStatus = async (connId: string, status: "approved" | "rejected" | "blocked") => {
    if (!user) return;
    try {
      await updateContactStatus(connId, status, user.uid);
      showNotification(`Contact request ${status}.`);
      await fetchConnections();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveContact = async (connId: string) => {
    try {
      await removeContact(connId);
      showNotification("Contact removed.");
      await fetchConnections();
    } catch (err) {
      console.error(err);
    }
  };

  // Filter connection views
  const approvedList = connections.filter((c) => c.status === "approved");
  const receivedList = connections.filter((c) => c.status === "pending" && c.recipientId === user?.uid);
  const sentList = connections.filter((c) => c.status === "pending" && c.requesterId === user?.uid);
  const rejectedList = connections.filter((c) => c.status === "rejected");
  const blockedList = connections.filter((c) => c.status === "blocked");

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-4 sm:p-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-[var(--fr8x-periwinkle)]" />
            <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)] dark:text-white">
              Enterprise Contacts & Directory
            </h1>
          </div>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Manage verified B2B relationships, pending connection requests, and partner communication.
          </p>
        </div>

        <Button
          onClick={() => setActiveTab("search")}
          className="bg-[var(--fr8x-periwinkle)] text-white text-body-sm px-4 py-2 flex items-center gap-2"
        >
          <UserPlus className="h-4 w-4" />
          Find New Partners
        </Button>
      </div>

      {/* Action Banner Notification */}
      {actionMessage && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-body-sm rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          <span>{actionMessage}</span>
        </div>
      )}

      {/* Tabs Navigation Bar */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("approved")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "approved"
              ? "bg-[var(--fr8x-periwinkle)] text-white"
              : "bg-white text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
          }`}
        >
          <UserCheck className="h-4 w-4" />
          Approved Contacts ({approvedList.length})
        </button>

        <button
          onClick={() => setActiveTab("received")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "received"
              ? "bg-[var(--fr8x-periwinkle)] text-white"
              : "bg-white text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
          }`}
        >
          <Clock className="h-4 w-4" />
          Received Requests ({receivedList.length})
        </button>

        <button
          onClick={() => setActiveTab("sent")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "sent"
              ? "bg-[var(--fr8x-periwinkle)] text-white"
              : "bg-white text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
          }`}
        >
          <UserPlus className="h-4 w-4" />
          Sent Requests ({sentList.length})
        </button>

        <button
          onClick={() => setActiveTab("rejected")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "rejected"
              ? "bg-[var(--fr8x-periwinkle)] text-white"
              : "bg-white text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
          }`}
        >
          <UserX className="h-4 w-4" />
          Rejected ({rejectedList.length})
        </button>

        <button
          onClick={() => setActiveTab("blocked")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "blocked"
              ? "bg-[var(--fr8x-periwinkle)] text-white"
              : "bg-white text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
          }`}
        >
          <ShieldBan className="h-4 w-4" />
          Blocked ({blockedList.length})
        </button>

        <button
          onClick={() => setActiveTab("search")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "search"
              ? "bg-[var(--fr8x-periwinkle)] text-white"
              : "bg-white text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
          }`}
        >
          <Search className="h-4 w-4" />
          Directory Search
        </button>

        <button
          onClick={() => setActiveTab("reviews")}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-body-sm font-medium transition-colors whitespace-nowrap ${
            activeTab === "reviews"
              ? "bg-[var(--fr8x-periwinkle)] text-white"
              : "bg-white text-foreground-secondary hover:bg-[var(--fr8x-mist)]"
          }`}
        >
          <Award className="h-4 w-4" />
          Peer Reviews ({peerReviews.length})
        </button>
      </div>

      {/* ═══ TAB 1: APPROVED CONTACTS ═══ */}
      {activeTab === "approved" && (
        <div className="space-y-4">
          {approvedList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-border">
              <Users className="mx-auto h-10 w-10 text-foreground-muted mb-2" />
              <p className="text-body-md font-semibold text-[var(--fr8x-jet)]">No Approved Contacts Yet</p>
              <p className="text-body-sm text-foreground-secondary mt-1">
                Search the directory or send connection requests to start collaborating.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {approvedList.map((conn) => {
                const isRequester = conn.requesterId === user?.uid;
                const contactId = isRequester ? conn.recipientId : conn.requesterId;
                const contactName = isRequester ? conn.recipientName : conn.requesterName;
                const contactCompany = isRequester ? conn.recipientCompany : conn.requesterCompany;
                const contactRole = isRequester ? conn.recipientRole : conn.requesterRole;

                return (
                  <div key={conn.id} className="bg-white p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative">
                            <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-body-md">
                              {contactName[0]}
                            </div>
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" title="Online Activity Status" />
                          </div>
                          <div>
                            <h3 className="text-heading-sm font-bold text-[var(--fr8x-jet)]">{contactName}</h3>
                            <p className="text-caption text-foreground-secondary">{contactRole}</p>
                          </div>
                        </div>
                        <span className="fr8x-badge-active">Approved</span>
                      </div>

                      <div className="mt-4 pt-3 border-t border-border space-y-1 text-body-sm">
                        <div className="flex items-center gap-2 text-foreground-secondary">
                          <Building2 className="h-4 w-4 text-[var(--fr8x-periwinkle)]" />
                          <span className="font-semibold text-[var(--fr8x-jet)]">{contactCompany}</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-3 border-t border-border flex items-center justify-between gap-2">
                      <Link
                        href={`/messages?userId=${contactId}`}
                        className="flex-1 py-1.5 rounded-lg bg-[var(--fr8x-periwinkle)] text-white text-caption font-semibold flex items-center justify-center gap-1.5 hover:opacity-90 transition-opacity"
                      >
                        <MessageSquare className="h-3.5 w-3.5" />
                        Chat
                      </Link>

                      <button
                        onClick={() => setSelectedReviewTarget({ id: contactId, name: contactName, company: contactCompany })}
                        className="px-2 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 text-[11px] font-semibold flex items-center gap-1 hover:bg-amber-100"
                        title="Submit Peer Review"
                      >
                        <Award className="h-3.5 w-3.5 text-amber-600" />
                        Review
                      </button>

                      <Link
                        href={ROUTES.PROFILE_VIEW(contactId)}
                        className="p-1.5 rounded-lg border border-border text-foreground-secondary hover:bg-[var(--fr8x-mist)] hover:text-[var(--fr8x-jet)]"
                        title="View Profile"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </Link>

                      <button
                        onClick={() => handleRemoveContact(conn.id)}
                        className="p-1.5 rounded-lg border border-border text-danger hover:bg-danger-light"
                        title="Remove Contact"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 2: RECEIVED REQUESTS ═══ */}
      {activeTab === "received" && (
        <div className="space-y-4">
          {receivedList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-border">
              <Clock className="mx-auto h-10 w-10 text-foreground-muted mb-2" />
              <p className="text-body-md font-semibold text-[var(--fr8x-jet)]">No Pending Received Requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {receivedList.map((conn) => (
                <div key={conn.id} className="bg-white p-5 rounded-xl border border-border shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-heading-sm font-bold text-[var(--fr8x-jet)]">{conn.requesterName}</h3>
                    <p className="text-caption text-foreground-secondary">{conn.requesterRole} • {conn.requesterCompany}</p>
                    <p className="text-[11px] text-foreground-muted mt-1">Requested on {new Date(conn.createdAt).toLocaleDateString()}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateStatus(conn.id, "approved")}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-body-sm font-semibold flex items-center gap-1 hover:bg-emerald-700"
                    >
                      <Check className="h-4 w-4" /> Accept
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(conn.id, "rejected")}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 text-body-sm font-semibold flex items-center gap-1 hover:bg-slate-200"
                    >
                      <X className="h-4 w-4" /> Reject
                    </button>

                    <button
                      onClick={() => handleUpdateStatus(conn.id, "blocked")}
                      className="p-1.5 rounded-lg text-danger hover:bg-danger-light"
                      title="Block User"
                    >
                      <ShieldBan className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 3: SENT REQUESTS ═══ */}
      {activeTab === "sent" && (
        <div className="space-y-4">
          {sentList.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-dashed border-border">
              <UserPlus className="mx-auto h-10 w-10 text-foreground-muted mb-2" />
              <p className="text-body-md font-semibold text-[var(--fr8x-jet)]">No Pending Sent Requests</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sentList.map((conn) => (
                <div key={conn.id} className="bg-white p-5 rounded-xl border border-border shadow-sm flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-heading-sm font-bold text-[var(--fr8x-jet)]">{conn.recipientName}</h3>
                    <p className="text-caption text-foreground-secondary">{conn.recipientRole} • {conn.recipientCompany}</p>
                    <span className="fr8x-badge-pending mt-2">Awaiting Approval</span>
                  </div>

                  <button
                    onClick={() => handleRemoveContact(conn.id)}
                    className="px-3 py-1.5 rounded-lg border border-border text-body-sm text-foreground-secondary hover:bg-danger-light hover:text-danger"
                  >
                    Cancel Request
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══ TAB 4: DIRECTORY SEARCH ═══ */}
      {activeTab === "search" && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users or companies by name, role, email..."
                className="fr8x-input pl-9 py-2.5 text-body-md"
              />
            </div>
            <Button onClick={handleSearchDirectory} className="bg-[var(--fr8x-periwinkle)] text-white px-5 py-2.5">
              Search Directory
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {directoryResults.map((profile) => {
              const existingConn = connections.find(
                (c) =>
                  (c.requesterId === profile.uid && c.recipientId === user?.uid) ||
                  (c.recipientId === profile.uid && c.requesterId === user?.uid)
              );

              return (
                <div key={profile.uid} className="bg-white p-5 rounded-xl border border-border shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="h-10 w-10 rounded-full bg-brand-100 text-brand-700 font-bold flex items-center justify-center text-body-md">
                            {profile.fullName[0]}
                          </div>
                          {profile.online && (
                            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-emerald-500 border-2 border-white" />
                          )}
                        </div>
                        <div>
                          <h3 className="text-heading-sm font-bold text-[var(--fr8x-jet)]">{profile.fullName}</h3>
                          <p className="text-caption text-foreground-secondary">{profile.role}</p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-border text-body-sm space-y-1">
                      <p className="font-semibold text-[var(--fr8x-jet)] flex items-center gap-1.5">
                        <Building2 className="h-4 w-4 text-[var(--fr8x-periwinkle)]" />
                        {profile.companyName}
                      </p>
                      <p className="text-caption text-foreground-muted">{profile.country}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-3 border-t border-border">
                    {existingConn?.status === "approved" ? (
                      <span className="w-full py-2 rounded-lg bg-emerald-100 text-emerald-800 text-caption font-semibold flex items-center justify-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Connected
                      </span>
                    ) : existingConn?.status === "pending" ? (
                      <span className="w-full py-2 rounded-lg bg-amber-100 text-amber-800 text-caption font-semibold flex items-center justify-center gap-1">
                        <Clock className="h-4 w-4" /> Request Pending
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(profile)}
                        className="w-full py-2 rounded-lg bg-[var(--fr8x-periwinkle)] text-white text-caption font-semibold flex items-center justify-center gap-1 hover:opacity-90"
                      >
                        <UserPlus className="h-4 w-4" /> Send Contact Request
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═══ TAB 5: PEER REVIEWS & RATINGS ═══ */}
      {activeTab === "reviews" && (
        <div className="space-y-6">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
              <input
                type="text"
                value={reviewsSearchQuery}
                onChange={(e) => setReviewsSearchQuery(e.target.value)}
                placeholder="Search peer reviews by partner name, company, or performance category..."
                className="fr8x-input pl-9 py-2.5 text-body-md"
              />
            </div>
          </div>

          <div className="space-y-3">
            {peerReviews
              .filter((rev) => {
                if (!reviewsSearchQuery.trim()) return true;
                const q = reviewsSearchQuery.toLowerCase();
                return (
                  rev.targetUserName?.toLowerCase().includes(q) ||
                  rev.targetUserCompany?.toLowerCase().includes(q) ||
                  rev.title?.toLowerCase().includes(q) ||
                  rev.performanceCategory?.toLowerCase().includes(q)
                );
              })
              .map((rev) => (
                <div key={rev.id} className="bg-white p-5 rounded-xl border border-border shadow-sm space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-body font-bold text-[var(--fr8x-jet)]">{rev.title}</h3>
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          {rev.performanceCategory || "Operations"}
                        </span>
                      </div>
                      <p className="text-caption text-foreground-secondary mt-0.5">
                        Reviewed Partner: <strong>{rev.targetUserName}</strong> ({rev.targetUserCompany})
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-amber-500 font-bold text-body-md">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <span>{rev.rating}.0 / 5.0</span>
                    </div>
                  </div>
                  <p className="text-body-sm text-foreground-secondary leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                    &ldquo;{rev.comment}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[11px] text-foreground-muted pt-1">
                    <span>Evaluated by: {rev.reviewerName} ({rev.reviewerCompany})</span>
                    <span>{(rev as any).createdAt?.seconds ? new Date(rev.createdAt.seconds * 1000).toLocaleDateString() : "Recent"}</span>
                  </div>
                </div>
              ))}

            {peerReviews.length === 0 && (
              <div className="p-8 text-center bg-white rounded-xl border border-dashed border-border">
                <Award className="mx-auto h-10 w-10 text-foreground-muted mb-2" />
                <p className="text-body-md font-semibold text-[var(--fr8x-jet)]">No Peer Reviews Submitted Yet</p>
                <p className="text-caption text-foreground-secondary mt-1">
                  Go to Approved Contacts and click &quot;Review&quot; to submit a performance evaluation for a logistics partner.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Peer Review Submission Modal */}
      {selectedReviewTarget && (
        <PeerReviewModal
          isOpen={!!selectedReviewTarget}
          onClose={() => setSelectedReviewTarget(null)}
          targetUserId={selectedReviewTarget.id}
          targetUserName={selectedReviewTarget.name}
          targetUserCompany={selectedReviewTarget.company}
          onSuccess={() => fetchPeerReviews()}
        />
      )}
    </div>
  );
}
