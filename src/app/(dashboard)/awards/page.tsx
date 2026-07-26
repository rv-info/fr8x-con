// FR8X-CON Interactive Awards Page
// Renders awards with reactions, up/down voting, collapsible comments, and multi-tier verification badges.

"use client";

import { useEffect, useState, useCallback, useMemo, memo } from "react";
import { Button } from "@/components/ui/Button";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  Zap,
  TrendingUp,
  CheckCircle,
  Shield,
  Loader2,
  ThumbsUp,
  Heart,
  Star,
  Award as AwardIcon,
  MessageSquare,
  ArrowBigUp,
  ArrowBigDown,
  Building,
  Users,
  CheckCircle2,
  Trash2,
  Edit2,
  CornerDownRight,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { AWARD_LABELS, type AwardCategory } from "@/lib/types/award";
import { queryDocuments, getDocument, setDocument, deleteDocument, orderBy, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { KPI_LABELS, type SupplierServiceKPIs, type SupplierGovernanceProfile } from "@/lib/types/supplierGovernance";
import { logAuditEvent } from "@/lib/utils/auditLogger";

interface AwardDoc {
  id: string;
  category: AwardCategory;
  recipientId: string;
  recipientName: string;
  recipientCompany: string;
  year: number;
  quarter: number;
  createdAt: { seconds: number; nanoseconds: number } | null;
  // Reactions map
  reactions?: {
    like?: string[]; // UIDs
    celebrate?: string[];
    recommend?: string[];
    support?: string[];
  };
  // Up/down votes arrays of UIDs
  votes?: {
    up?: string[];
    down?: string[];
  };
  // Verification arrays of UIDs
  verifications?: {
    company?: string[];
    community?: string[];
    admin?: string[];
  };
}

interface CommentDoc {
  id: string;
  authorId: string;
  authorName: string;
  authorCompany: string;
  content: string;
  parentCommentId: string | null;
  createdAt: any;
}

const AWARD_ICONS: Record<AwardCategory, typeof Award> = {
  top_forwarder: Award,
  fastest_response: Zap,
  best_rates: TrendingUp,
  highest_acceptance: CheckCircle,
  trusted_partner: Shield,
};

export default function AwardsPage() {
  const { user } = useAuth();
  const [awards, setAwards] = useState<AwardDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Popular awards based on recommendation score (votes.up.length)
  const popularAwards = useMemo(() => {
    return [...awards]
      .sort((a, b) => {
        const scoreA = (a.votes?.up || []).length - (a.votes?.down || []).length;
        const scoreB = (b.votes?.up || []).length - (b.votes?.down || []).length;
        return scoreB - scoreA;
      })
      .slice(0, 3);
  }, [awards]);

  const fetchAwards = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await queryDocuments<AwardDoc>(COLLECTIONS.AWARDS, [
        orderBy("createdAt", "desc"),
        limit(20),
      ]);
      setAwards(data);
    } catch (err) {
      console.error("Error fetching awards:", err);
      // Fallback without ordering
      const data = await queryDocuments<AwardDoc>(COLLECTIONS.AWARDS, [limit(20)]);
      setAwards(data);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAwards();
  }, [fetchAwards]);

  // Handle reactions toggle
  const handleReactionToggle = async (awardId: string, reactionType: "like" | "celebrate" | "recommend" | "support") => {
    if (!user) return;
    const target = awards.find((a) => a.id === awardId);
    if (!target) return;

    const currentReactions = target.reactions || {};
    const uids = currentReactions[reactionType] || [];
    const hasReacted = uids.includes(user.uid);

    const updatedUids = hasReacted ? uids.filter((id) => id !== user.uid) : [...uids, user.uid];

    const newReactions = {
      ...currentReactions,
      [reactionType]: updatedUids,
    };

    // Update local state
    setAwards(awards.map((a) => (a.id === awardId ? { ...a, reactions: newReactions } : a)));

    // Save to Firestore
    try {
      await setDocument(COLLECTIONS.AWARDS, awardId, { reactions: newReactions }, true);
    } catch (err) {
      console.error("Error updating reaction:", err);
    }
  };

  // Handle voting
  const handleVote = async (awardId: string, voteType: "up" | "down") => {
    if (!user) return;
    const target = awards.find((a) => a.id === awardId);
    if (!target) return;

    const currentVotes = target.votes || {};
    let upVotes = currentVotes.up || [];
    let downVotes = currentVotes.down || [];

    const hasUpVoted = upVotes.includes(user.uid);
    const hasDownVoted = downVotes.includes(user.uid);

    if (voteType === "up") {
      if (hasUpVoted) {
        // remove upvote
        upVotes = upVotes.filter((id) => id !== user.uid);
      } else {
        // add upvote, remove downvote if present
        upVotes = [...upVotes, user.uid];
        downVotes = downVotes.filter((id) => id !== user.uid);
      }
    } else {
      if (hasDownVoted) {
        // remove downvote
        downVotes = downVotes.filter((id) => id !== user.uid);
      } else {
        // add downvote, remove upvote if present
        downVotes = [...downVotes, user.uid];
        upVotes = upVotes.filter((id) => id !== user.uid);
      }
    }

    const newVotes = { up: upVotes, down: downVotes };

    // Update local state
    setAwards(awards.map((a) => (a.id === awardId ? { ...a, votes: newVotes } : a)));

    try {
      await setDocument(COLLECTIONS.AWARDS, awardId, { votes: newVotes }, true);
    } catch (err) {
      console.error("Error saving vote:", err);
    }
  };

  // Handle verifications
  const handleVerifyToggle = async (awardId: string, type: "company" | "community" | "admin") => {
    if (!user) return;
    const target = awards.find((a) => a.id === awardId);
    if (!target) return;

    const currentVerifications = target.verifications || {};
    const uids = currentVerifications[type] || [];
    const hasVerified = uids.includes(user.uid);

    // Permission checks
    if (type === "admin" && !user.isGodMode) {
      alert("Only platform administrators can perform Admin Verifications.");
      return;
    }
    
    // For company verifiers, let's verify if they match company (or let any user from same company do it)
    if (type === "company" && user.companyId === null) {
      alert("You must belong to a company to verify company achievements.");
      return;
    }

    const updatedUids = hasVerified ? uids.filter((id) => id !== user.uid) : [...uids, user.uid];
    const newVerifications = {
      ...currentVerifications,
      [type]: updatedUids,
    };

    setAwards(awards.map((a) => (a.id === awardId ? { ...a, verifications: newVerifications } : a)));

    try {
      await setDocument(COLLECTIONS.AWARDS, awardId, { verifications: newVerifications }, true);
    } catch (err) {
      console.error("Error saving verification:", err);
    }
  };

  // Supplier Governance KPI Rating Modal State
  const [showEvalModal, setShowEvalModal] = useState(false);
  const [evalSupplierId, setEvalSupplierId] = useState("comp_1");
  const [evalSupplierName, setEvalSupplierName] = useState("Maersk Line Supplier");
  const [evalSupplierCompany, setEvalSupplierCompany] = useState("Maersk Logistics");
  const [shipmentRef, setShipmentRef] = useState("SHP-2026-8891");
  const [feedback, setFeedback] = useState("");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  const [kpis, setKpis] = useState<SupplierServiceKPIs>({
    spaceAvailability: 5,
    bookingConfirmation: 5,
    onTimeEquipmentPlacement: 5,
    documentationAccuracy: 5,
    freightAccuracy: 5,
    cargoHandling: 5,
    communication: 5,
    responsiveness: 5,
    scheduleReliability: 5,
    operationalPerformance: 5,
    overallServiceQuality: 5,
  });

  const averageKpiScore = useMemo(() => {
    const vals = Object.values(kpis);
    const sum = vals.reduce((a, b) => a + b, 0);
    return Math.round((sum / vals.length) * 10) / 10;
  }, [kpis]);

  const isPoorPerformance = useMemo(() => {
    return averageKpiScore < 3.0 || Object.values(kpis).some((v) => v <= 2);
  }, [averageKpiScore, kpis]);

  // Submit Supplier KPI Performance Evaluation
  const handleSaveSupplierRating = async () => {
    if (!user) {
      alert("You must be logged in to evaluate supplier performance.");
      return;
    }

    if (isPoorPerformance && !feedback.trim()) {
      alert("Mandatory Feedback Required: Please provide explanatory feedback for poor performance scores (rating <= 2 stars or average < 3.0).");
      return;
    }

    setIsSubmittingRating(true);
    try {
      const ratingId = `rating_${Date.now()}`;
      const ratingPayload = {
        id: ratingId,
        supplierId: evalSupplierId,
        supplierName: evalSupplierName,
        supplierCompany: evalSupplierCompany,
        buyerId: user.uid,
        buyerName: user.displayName || "Procurement Officer",
        buyerCompany: user.companyId || "Buyer Enterprise",
        shipmentRef,
        kpis,
        averageScore: averageKpiScore,
        feedback,
        isPoorPerformanceRecord: isPoorPerformance,
        createdAt: new Date().toISOString(),
      };

      // 1. Save Rating Record
      await setDocument("supplier_ratings", ratingId, ratingPayload);

      // 2. Fetch existing Supplier Governance Profile
      const existingGov = await getDocument<SupplierGovernanceProfile>("supplier_governance", evalSupplierId);
      
      const prevPoorCount = existingGov?.poorPerformanceRecords || 0;
      const newPoorCount = isPoorPerformance ? prevPoorCount + 1 : prevPoorCount;
      const prevTotal = existingGov?.totalEvaluations || 0;

      let newStatus = existingGov?.status || "active";
      let statusChangedEvent: "SUPPLIER_WARNING_ISSUED" | "SUPPLIER_RESTRICTED" | "SUPPLIER_SUSPENDED" | null = null;

      if (isPoorPerformance) {
        if (newPoorCount === 1) {
          newStatus = "warning";
          statusChangedEvent = "SUPPLIER_WARNING_ISSUED";
        } else if (newPoorCount === 2) {
          newStatus = "restricted";
          statusChangedEvent = "SUPPLIER_RESTRICTED";
        } else if (newPoorCount >= 3) {
          newStatus = "suspended";
          statusChangedEvent = "SUPPLIER_SUSPENDED";
        }
      }

      // Compute new average overall rating
      const prevRating = existingGov?.overallRating || 4.5;
      const newOverallRating = Math.round(((prevRating * prevTotal + averageKpiScore) / (prevTotal + 1)) * 10) / 10;

      const govPayload = {
        supplierId: evalSupplierId,
        supplierName: evalSupplierName,
        supplierCompany: evalSupplierCompany,
        overallRating: newOverallRating,
        totalEvaluations: prevTotal + 1,
        warningsCount: (existingGov?.warningsCount || 0) + (newPoorCount === 1 && isPoorPerformance ? 1 : 0),
        poorPerformanceRecords: newPoorCount,
        status: newStatus,
        restrictionReason: isPoorPerformance ? feedback || "Accumulated poor performance records" : existingGov?.restrictionReason,
        lastEvaluatedAt: new Date().toISOString(),
        onTimeDeliveryPct: existingGov?.onTimeDeliveryPct || 94,
        spaceAvailabilityPct: existingGov?.spaceAvailabilityPct || 96,
        documentationAccuracyPct: existingGov?.documentationAccuracyPct || 98,
        cargoClaimRatioPct: existingGov?.cargoClaimRatioPct || 0.2,
        cancellationRatioPct: existingGov?.cancellationRatioPct || 1.1,
        averageResponseTimeHours: existingGov?.averageResponseTimeHours || 2.4,
      };

      await setDocument("supplier_governance", evalSupplierId, govPayload);

      // 3. Emit Audit Log
      await logAuditEvent(
        "SUPPLIER_RATED",
        `Evaluated Supplier ${evalSupplierCompany} (Score: ${averageKpiScore}/5.0)`,
        { uid: user.uid, name: user.displayName || "Evaluator", role: "buyer" },
        { kpis, isPoorPerformanceRecord: isPoorPerformance, newGovernanceStatus: newStatus },
        undefined,
        undefined,
        evalSupplierId
      );

      if (statusChangedEvent) {
        await logAuditEvent(
          statusChangedEvent,
          `Supplier ${evalSupplierCompany} status updated to ${newStatus.toUpperCase()} (${newPoorCount} Poor Records)`,
          { uid: user.uid, name: "Governance System", role: "system" },
          { newStatus, poorPerformanceRecords: newPoorCount },
          undefined,
          undefined,
          evalSupplierId
        );
      }

      alert(`Supplier Service Evaluation submitted! Average Score: ${averageKpiScore}/5.0.${
        isPoorPerformance ? ` Policy Status updated to: ${newStatus.toUpperCase()}` : ""
      }`);

      setShowEvalModal(false);
      setFeedback("");
    } catch (err) {
      console.error("Error saving supplier evaluation:", err);
      alert("Failed to submit supplier rating. Please try again.");
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm text-foreground">Carrier & Supplier Performance Evaluation</h1>
          <p className="mt-1 text-body-sm text-foreground-secondary">
            Measurable 11-KPI Service Quality Ratings, Supplier Governance & Peer Awards
          </p>
        </div>
        <button
          onClick={() => setShowEvalModal(true)}
          className="fr8x-btn-primary bg-[var(--fr8x-periwinkle)] px-4 py-2 flex items-center gap-1.5 text-body-sm font-semibold"
        >
          <Star className="h-4 w-4 fill-white" /> Evaluate Completed Shipment Supplier
        </button>
      </div>

      {/* Popular Awards Strip */}
      {popularAwards.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/5 via-yellow-500/5 to-amber-500/5 border border-amber-200/60 rounded-lg p-4">
          <h2 className="text-[10px] font-bold uppercase tracking-wider text-amber-800 flex items-center gap-1 mb-3">
            <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500 animate-pulse" />
            Popular Nominated Awards
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {popularAwards.map((pa: AwardDoc) => {
              const score = (pa.votes?.up || []).length - (pa.votes?.down || []).length;
              return (
                <div key={pa.id} className="bg-white p-3 rounded border border-amber-100 flex items-center gap-2.5 shadow-sm text-left">
                  <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
                    <Star className="h-4 w-4 text-amber-600 fill-amber-300" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] font-bold text-[var(--fr8x-jet)] truncate">{pa.recipientName}</p>
                    <p className="text-[8.5px] text-foreground-muted truncate">{AWARD_LABELS[pa.category as AwardCategory]}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-[9px] bg-amber-100 text-amber-800 font-bold px-1.5 py-0.5 rounded">
                      Score: {score}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Award categories grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
        {(Object.keys(AWARD_LABELS) as AwardCategory[]).map((category, i) => {
          const Icon = AWARD_ICONS[category];
          return (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="fr8x-card p-4 text-center bg-white border border-slate-200 shadow-sm"
            >
              <div className="mx-auto w-10 h-10 rounded-full bg-[var(--fr8x-mist)] flex items-center justify-center mb-2.5">
                <Icon className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
              </div>
              <h3 className="text-body-sm font-semibold text-[var(--fr8x-jet)]">{AWARD_LABELS[category]}</h3>
              <p className="mt-0.5 text-[10px] text-foreground-muted">Recognized Quarterly</p>
            </motion.div>
          );
        })}
      </div>

      {/* Interactive Awards List */}
      <div className="fr8x-card bg-white overflow-hidden text-left shadow-md">
        <div className="px-5 py-3 border-b border-border bg-slate-50 flex items-center justify-between">
          <h2 className="text-body-sm font-bold text-[var(--fr8x-jet)]">Active Honors Registry</h2>
          <span className="text-[10px] text-foreground-muted font-medium">Recent Achievements</span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-10">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--fr8x-periwinkle)]" />
            <span className="text-body-sm text-foreground-secondary">Loading honors log...</span>
          </div>
        ) : awards.length === 0 ? (
          <div className="py-10 text-center text-foreground-secondary text-body-sm">
            No honors logged in the network registry yet.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {awards.map((award) => (
              <AwardCard
                key={award.id}
                award={award}
                currentUser={user}
                onReactionToggle={handleReactionToggle}
                onVote={handleVote}
                onVerifyToggle={handleVerifyToggle}
              />
            ))}
          </div>
        )}
      </div>

      {/* ═══ 11-KPI SUPPLIER PERFORMANCE EVALUATION MODAL ═══ */}
      {showEvalModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full space-y-4 my-8 shadow-xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
                  <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
                  Post-Shipment Supplier Performance Evaluation
                </h2>
                <p className="text-caption text-foreground-secondary mt-0.5">
                  Evaluate supplier performance across 11 standardized logistics execution KPIs
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded text-xs font-black tabular-nums ${
                averageKpiScore >= 4.0 ? "bg-emerald-100 text-emerald-800" :
                averageKpiScore >= 3.0 ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"
              }`}>
                Avg: {averageKpiScore} / 5.0
              </span>
            </div>

            {/* Target Supplier & Shipment Details */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-gray-50 border border-border rounded text-[11px]">
              <div>
                <label className="fr8x-label block">Select Supplier</label>
                <select
                  value={evalSupplierId}
                  onChange={(e) => {
                    setEvalSupplierId(e.target.value);
                    if (e.target.value === "comp_1") { setEvalSupplierName("Maersk Line Supplier"); setEvalSupplierCompany("Maersk Logistics"); }
                    else if (e.target.value === "comp_2") { setEvalSupplierName("Hapag-Lloyd Agent"); setEvalSupplierCompany("Hapag-Lloyd Express"); }
                    else { setEvalSupplierName("Kuehne+Nagel Logistics"); setEvalSupplierCompany("Kuehne+Nagel Global"); }
                  }}
                  className="fr8x-input mt-1 font-semibold"
                >
                  <option value="comp_1">Maersk Logistics (comp_1)</option>
                  <option value="comp_2">Hapag-Lloyd Express (comp_2)</option>
                  <option value="comp_3">Kuehne+Nagel Global (comp_3)</option>
                </select>
              </div>
              <div>
                <label className="fr8x-label block">Shipment Reference</label>
                <input
                  type="text"
                  value={shipmentRef}
                  onChange={(e) => setShipmentRef(e.target.value)}
                  className="fr8x-input mt-1"
                />
              </div>
              <div>
                <label className="fr8x-label block">Evaluation Date</label>
                <input type="text" readOnly value={new Date().toISOString().split("T")[0]} className="fr8x-input mt-1 bg-gray-100 text-foreground-muted" />
              </div>
            </div>

            {/* 11 KPI Star Rating Inputs */}
            <div className="space-y-2 max-h-[320px] overflow-y-auto pr-1 no-scrollbar border-t border-b border-border py-2">
              {(Object.keys(KPI_LABELS) as (keyof SupplierServiceKPIs)[]).map((kpiKey) => (
                <div key={kpiKey} className="flex items-center justify-between p-2 rounded hover:bg-gray-50 text-[11px] border-b border-gray-100 last:border-0">
                  <span className="font-semibold text-[var(--fr8x-jet)]">{KPI_LABELS[kpiKey]}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setKpis((prev) => ({ ...prev, [kpiKey]: star }))}
                        className="p-1 hover:scale-110 transition-transform"
                      >
                        <Star className={`h-4 w-4 ${
                          star <= kpis[kpiKey] ? "fill-amber-400 text-amber-500" : "text-gray-300"
                        }`} />
                      </button>
                    ))}
                    <span className="w-6 text-right font-mono font-bold text-xs text-[var(--fr8x-jet)] ml-1">
                      {kpis[kpiKey]}★
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Mandatory Feedback block for poor performance */}
            {isPoorPerformance && (
              <div className="p-3 bg-red-50 border border-red-200 rounded text-[11px] space-y-1">
                <span className="font-bold text-red-900 block">⚠️ Poor Performance Triggered (Rating &lt;= 2 stars or Avg &lt; 3.0)</span>
                <p className="text-red-800">
                  Mandatory Feedback Required. Under FR8X-CON Supplier Governance Policy, poor performance records influence supplier eligibility (1 = Warning, 2 = Selective Only, 3 = Automatic Suspension).
                </p>
              </div>
            )}

            <div>
              <label className="fr8x-label block mb-1">
                Evaluator Feedback & Operational Remarks {isPoorPerformance && <span className="text-danger">*</span>}
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                rows={2}
                className="fr8x-input w-full text-[11px] resize-none"
                placeholder={isPoorPerformance ? "Mandatory explanatory feedback explaining poor service execution..." : "Add optional performance remarks..."}
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button
                type="button"
                onClick={() => setShowEvalModal(false)}
                className="fr8x-btn-secondary text-caption px-4 py-1.5"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveSupplierRating}
                disabled={isSubmittingRating}
                className="fr8x-btn-primary bg-[var(--fr8x-periwinkle)] text-caption px-5 py-1.5 flex items-center gap-1 font-semibold"
              >
                {isSubmittingRating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Submit Evaluation & Update Governance"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Individual Award Card Component with Comments subcollection ───
interface AwardCardProps {
  award: AwardDoc;
  currentUser: any;
  onReactionToggle: (id: string, type: "like" | "celebrate" | "recommend" | "support") => void;
  onVote: (id: string, type: "up" | "down") => void;
  onVerifyToggle: (id: string, type: "company" | "community" | "admin") => void;
}

const AwardCard = memo(function AwardCard({
  award,
  currentUser,
  onReactionToggle,
  onVote,
  onVerifyToggle,
}: AwardCardProps) {
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<CommentDoc[]>([]);
  const [commentInput, setCommentInput] = useState("");
  const [replyTarget, setReplyTarget] = useState<CommentDoc | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  const Icon = AWARD_ICONS[award.category] || AwardIcon;

  // Calculate scores
  const upCount = (award.votes?.up || []).length;
  const downCount = (award.votes?.down || []).length;
  const totalVotes = upCount + downCount;
  const recScore = totalVotes > 0 ? Math.round((upCount / totalVotes) * 100) : 0;

  const hasUpVoted = award.votes?.up?.includes(currentUser?.uid) || false;
  const hasDownVoted = award.votes?.down?.includes(currentUser?.uid) || false;

  // Verifications states
  const isCompanyVerified = (award.verifications?.company || []).length > 0;
  const isCommunityVerified = (award.verifications?.community || []).length >= 3;
  const isAdminVerified = (award.verifications?.admin || []).length > 0;

  const loadComments = useCallback(async () => {
    if (!showComments) return;
    try {
      const data = await queryDocuments<CommentDoc>(`awards/${award.id}/comments`, [
        orderBy("createdAt", "asc"),
      ]);
      setComments(data);
    } catch {
      // Fallback query if no index
      const data = await queryDocuments<CommentDoc>(`awards/${award.id}/comments`);
      setComments(data);
    }
  }, [award.id, showComments]);

  useEffect(() => {
    loadComments();
  }, [loadComments]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim() || !currentUser) return;
    setIsSubmittingComment(true);

    try {
      const commentId = `cmt_${Date.now()}`;
      const payload: CommentDoc = {
        id: commentId,
        authorId: currentUser.uid,
        authorName: currentUser.displayName || "Logistics Specialist",
        authorCompany: currentUser.companyId ? "RV-Info partner" : "Freight Professional",
        content: replyTarget ? `[Reply to ${replyTarget.authorName}]: ${commentInput.trim()}` : commentInput.trim(),
        parentCommentId: replyTarget ? replyTarget.id : null,
        createdAt: new Date().toISOString(),
      };

      await setDocument(`awards/${award.id}/comments`, commentId, payload);
      setCommentInput("");
      setReplyTarget(null);
      loadComments();
    } catch (err) {
      console.error("Error adding award comment:", err);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    try {
      await deleteDocument(`awards/${award.id}/comments`, commentId);
      loadComments();
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) return;
    try {
      await setDocument(`awards/${award.id}/comments`, commentId, {
        content: editContent.trim(),
        updatedAt: new Date().toISOString(),
      }, true);
      setEditingCommentId(null);
      setEditContent("");
      loadComments();
    } catch (err) {
      console.error("Error editing comment:", err);
    }
  };

  return (
    <div className="p-4 hover:bg-slate-50/50 transition-colors">
      <div className="flex flex-col md:flex-row items-start justify-between gap-4">
        {/* Left Side: Avatar & recipient details */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-brand-50 flex items-center justify-center shrink-0 border border-brand-100">
            <Icon className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-body-sm font-bold text-[var(--fr8x-jet)]">{award.recipientName}</span>
              <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium border border-slate-200">
                {award.recipientCompany}
              </span>
            </div>
            <p className="text-[10px] text-foreground-secondary mt-0.5 font-semibold text-[var(--fr8x-periwinkle)]">
              {AWARD_LABELS[award.category] || award.category}
            </p>
            <p className="text-[9.5px] text-foreground-muted mt-0.5">
              Awarded Q{award.quarter} {award.year}
            </p>
          </div>
        </div>

        {/* Center Side: Verifications badging */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Company Verification */}
          <button
            onClick={() => onVerifyToggle(award.id, "company")}
            className={`text-[9px] flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
              isCompanyVerified
                ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-semibold"
                : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
            }`}
            title="Verified by recipient company management"
          >
            <Building className="h-3 w-3" /> Company {isCompanyVerified ? "Verified" : "Verify"}
          </button>

          {/* Community Verification */}
          <button
            onClick={() => onVerifyToggle(award.id, "community")}
            className={`text-[9px] flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
              isCommunityVerified
                ? "bg-blue-50 text-blue-800 border-blue-300 font-semibold"
                : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
            }`}
            title="Verified by logistics network partners"
          >
            <Users className="h-3 w-3" /> Community ({(award.verifications?.community || []).length})
          </button>

          {/* Admin Verification */}
          <button
            onClick={() => onVerifyToggle(award.id, "admin")}
            className={`text-[9px] flex items-center gap-1 px-2 py-0.5 rounded border transition-colors ${
              isAdminVerified
                ? "bg-amber-50 text-amber-800 border-amber-300 font-semibold"
                : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
            }`}
            title="Verified by platform audit admin"
          >
            <Shield className="h-3 w-3" /> Admin {isAdminVerified ? "Verified" : "Verify"}
          </button>
        </div>

        {/* Right Side: Voting block */}
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200 shrink-0">
          <button
            onClick={() => onVote(award.id, "up")}
            className={`p-1 rounded transition-colors ${hasUpVoted ? "bg-emerald-500 text-white" : "hover:bg-slate-200 text-slate-600"}`}
            title="Upvote Achievement"
          >
            <ArrowBigUp className="h-4.5 w-4.5" />
          </button>
          <div className="text-center px-1 font-mono text-[10px] min-w-[32px]">
            <p className="font-bold leading-none">{upCount - downCount}</p>
            <p className="text-[7.5px] text-foreground-muted mt-0.5">Rec Score: {recScore}%</p>
          </div>
          <button
            onClick={() => onVote(award.id, "down")}
            className={`p-1 rounded transition-colors ${hasDownVoted ? "bg-red-500 text-white" : "hover:bg-slate-200 text-slate-600"}`}
            title="Downvote Achievement"
          >
            <ArrowBigDown className="h-4.5 w-4.5" />
          </button>
        </div>
      </div>

      {/* Interaction block (Reactions & Comments trigger) */}
      <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-2 text-[10px] text-foreground-secondary">
        {/* Reaction: Like */}
        <button
          onClick={() => onReactionToggle(award.id, "like")}
          className={`flex items-center gap-1 hover:text-[var(--fr8x-jet)] transition-colors ${
            award.reactions?.like?.includes(currentUser?.uid) ? "text-blue-600 font-bold" : ""
          }`}
        >
          <ThumbsUp className="h-3.5 w-3.5" /> Like ({(award.reactions?.like || []).length})
        </button>

        {/* Reaction: Celebrate */}
        <button
          onClick={() => onReactionToggle(award.id, "celebrate")}
          className={`flex items-center gap-1 hover:text-[var(--fr8x-jet)] transition-colors ${
            award.reactions?.celebrate?.includes(currentUser?.uid) ? "text-amber-600 font-bold" : ""
          }`}
        >
          🎉 Celebrate ({(award.reactions?.celebrate || []).length})
        </button>

        {/* Reaction: Recommend */}
        <button
          onClick={() => onReactionToggle(award.id, "recommend")}
          className={`flex items-center gap-1 hover:text-[var(--fr8x-jet)] transition-colors ${
            award.reactions?.recommend?.includes(currentUser?.uid) ? "text-yellow-600 font-bold" : ""
          }`}
        >
          <Star className="h-3.5 w-3.5" /> Recommend ({(award.reactions?.recommend || []).length})
        </button>

        {/* Reaction: Support */}
        <button
          onClick={() => onReactionToggle(award.id, "support")}
          className={`flex items-center gap-1 hover:text-[var(--fr8x-jet)] transition-colors ${
            award.reactions?.support?.includes(currentUser?.uid) ? "text-red-600 font-bold" : ""
          }`}
        >
          <Heart className="h-3.5 w-3.5" /> Support ({(award.reactions?.support || []).length})
        </button>

        {/* Comment Trigger */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1 hover:text-[var(--fr8x-jet)] font-semibold text-[var(--fr8x-periwinkle)] ml-auto"
        >
          <MessageSquare className="h-3.5 w-3.5" />
          <span>Comments ({comments.length})</span>
        </button>
      </div>

      {/* Collapsible Comments Section */}
      <AnimatePresence>
        {showComments && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mt-3 pl-4 border-l border-slate-200 space-y-3"
          >
            {/* Comment Composer */}
            <form onSubmit={handleAddComment} className="flex gap-2">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder={replyTarget ? `Reply to ${replyTarget.authorName}...` : "Write a comment on this achievement..."}
                className="fr8x-input flex-1 py-1 text-[10px] h-8"
              />
              {replyTarget && (
                <button
                  type="button"
                  onClick={() => setReplyTarget(null)}
                  className="text-[9px] text-red-500 shrink-0 hover:underline"
                >
                  Cancel Reply
                </button>
              )}
              <Button
                type="submit"
                isLoading={isSubmittingComment}
                className="fr8x-btn-primary py-1 px-3 text-[10px] h-8"
              >
                Post
              </Button>
            </form>

            {/* Comments List */}
            {comments.length === 0 ? (
              <p className="text-[9px] text-foreground-muted italic py-1">No comments posted yet. Start the conversation!</p>
            ) : (
              <div className="space-y-2">
                {comments.map((c) => (
                  <div key={c.id} className="text-left bg-slate-50 p-2 rounded border border-slate-100 flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center text-[9px] font-bold text-[var(--fr8x-jet)] shrink-0">
                      {c.authorName.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-semibold text-[var(--fr8x-jet)]">
                          {c.authorName}{" "}
                          <span className="text-[8px] font-normal text-foreground-muted">({c.authorCompany})</span>
                        </p>
                        <div className="flex items-center gap-1.5">
                          {c.authorId === currentUser?.uid && (
                            <>
                              <button
                                onClick={() => {
                                  setEditingCommentId(c.id);
                                  setEditContent(c.content);
                                }}
                                className="text-foreground-muted hover:text-[var(--fr8x-jet)] p-0.5"
                                title="Edit"
                              >
                                <Edit2 className="h-2.5 w-2.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteComment(c.id)}
                                className="text-foreground-muted hover:text-red-600 p-0.5"
                                title="Delete"
                              >
                                <Trash2 className="h-2.5 w-2.5" />
                              </button>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setReplyTarget(c);
                              setCommentInput("");
                            }}
                            className="text-[8.5px] text-[var(--fr8x-periwinkle)] hover:underline ml-1 font-bold"
                          >
                            Reply
                          </button>
                        </div>
                      </div>

                      {editingCommentId === c.id ? (
                        <div className="mt-1 flex gap-1.5">
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="fr8x-input py-0.5 text-[9px] flex-1"
                          />
                          <button
                            type="button"
                            onClick={() => handleEditComment(c.id)}
                            className="text-[8px] bg-[var(--fr8x-periwinkle)] text-white px-2 py-0.5 rounded font-bold"
                          >
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingCommentId(null)}
                            className="text-[8px] text-foreground-secondary hover:underline"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <p className="text-[10px] text-[var(--fr8x-jet)] mt-0.5 whitespace-pre-wrap">{c.content}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});
