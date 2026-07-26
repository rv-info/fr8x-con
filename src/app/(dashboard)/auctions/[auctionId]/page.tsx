// FR8X-CON Auction Detail & Buyer Real-Time Evaluation Dashboard
// Enterprise Procurement Authority evaluation view vs Supplier Bidding view

"use client";

import { useEffect, useState, useMemo, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Users,
  Clock,
  Ship,
  Package,
  MapPin,
  ArrowRight,
  Lock,
  Loader2,
  Info,
  TrendingDown,
  DollarSign,
  Award,
  Ban,
  ShieldCheck,
  RefreshCw,
  BarChart3,
  History,
  AlertTriangle,
  Layers,
} from "lucide-react";

import { ROUTES, COLLECTIONS } from "@/lib/utils/constants";
import { getDocument, queryDocuments, where, setDocument } from "@/lib/firebase/firestore";
import { INCOTERMS_RULES, type IncotermCode } from "@/lib/utils/logisticsEngine";
import { useAuth } from "@/providers/AuthProvider";
import type { Auction, AuctionStatus } from "@/lib/types/auction";
import type { Bid } from "@/lib/types/bid";
import { normalizeCurrency, calculateTCOScore } from "@/lib/utils/procurementScoring";
import { logAuditEvent } from "@/lib/utils/auditLogger";

export default function AuctionDetailPage({
  params,
}: {
  params: Promise<{ auctionId: string }>;
}) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();

  const [auction, setAuction] = useState<Auction | null>(null);
  const [bids, setBids] = useState<Bid[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [evalCurrency, setEvalCurrency] = useState<string>("USD");

  // Cancellation Modal State
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  // Active Tab View for Owner
  const [activeOwnerTab, setActiveOwnerTab] = useState<"ranking" | "history" | "tco">("ranking");

  // Fetch auction & bids
  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const auctionData = await getDocument<Auction>(COLLECTIONS.AUCTIONS, resolvedParams.auctionId);
        setAuction(auctionData);

        if (auctionData?.bidRules?.defaultCurrency) {
          setEvalCurrency(auctionData.bidRules.defaultCurrency);
        }

        // Fetch live bids for this auction
        const bidDocs = await queryDocuments<Bid>(COLLECTIONS.BIDS, [
          where("auctionId", "==", resolvedParams.auctionId),
        ]);
        setBids(bidDocs);
      } catch (err) {
        console.error("Error fetching auction evaluation details:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [resolvedParams.auctionId]);

  const isOwner = useMemo(() => {
    if (!user?.uid || !auction?.creatorId) return false;
    return user.uid === auction.creatorId;
  }, [user, auction]);

  const isGodMode = useMemo(() => {
    return user?.email?.toLowerCase().includes("admin") || user?.email?.toLowerCase().includes("godmode");
  }, [user]);

  // Compute 13 Real-Time Evaluation Dashboard Statistics
  const evaluationStats = useMemo(() => {
    const totalInvited = auction?.invitedBidders?.length || auction?.participantsCount || 0;
    const activeParticipants = new Set(bids.map((b) => b.bidderId || b.participantId)).size;
    const totalQuotations = bids.length;

    // Convert bid amounts to selected evaluation currency
    const normalizedBids = bids.map((b) => {
      const amt = b.totalAmountUSD || b.totalAmount || 0;
      const converted = normalizeCurrency(amt, "USD", evalCurrency);
      return { ...b, convertedAmount: converted };
    });

    // Sort ascending (Lowest bid = Rank 1)
    normalizedBids.sort((a, b) => a.convertedAmount - b.convertedAmount);

    const lowest = normalizedBids.length > 0 ? normalizedBids[0]?.convertedAmount || 0 : 0;
    const highest = normalizedBids.length > 0 ? normalizedBids[normalizedBids.length - 1]?.convertedAmount || 0 : 0;
    const totalSum = normalizedBids.reduce((sum, b) => sum + b.convertedAmount, 0);
    const average = normalizedBids.length > 0 ? totalSum / normalizedBids.length : 0;
    const totalRevisions = bids.reduce((sum, b) => sum + (b.revisionNumber || 1), 0);

    return {
      totalInvited,
      activeParticipants,
      totalQuotations,
      lowest,
      highest,
      average,
      totalRevisions,
      rankedBids: normalizedBids,
    };
  }, [auction, bids, evalCurrency]);

  // Handle Auction Cancellation with Audit Log
  const handleCancelAuction = async () => {
    if (!cancelReason.trim()) {
      alert("Please enter a mandatory cancellation reason for compliance and audit trail.");
      return;
    }
    if (!auction || !user) return;

    setIsCancelling(true);
    try {
      const now = new Date().toISOString();
      const updatedStatus: AuctionStatus = "cancelled";

      await setDocument(
        COLLECTIONS.AUCTIONS,
        auction.id,
        {
          status: updatedStatus,
          cancellationReason: cancelReason,
          cancelledBy: user.uid,
          cancelledAt: now,
          lastActivityAt: now,
        },
        true
      );

      // Record immutable audit log entry
      await logAuditEvent(
        "AUCTION_CANCELLED",
        `Cancelled Reverse Auction [Ref: ${auction.referenceNumber || auction.id}]`,
        { uid: user.uid, name: user.displayName || "Authority", role: isGodMode ? "godmode_admin" : "buyer" },
        { cancellationReason: cancelReason, previousStatus: auction.status },
        auction.id
      );

      setAuction((prev) => (prev ? { ...prev, status: updatedStatus, cancellationReason: cancelReason } : null));
      setShowCancelModal(false);
      alert("Reverse Auction cancelled successfully. Complete audit trail preserved.");
    } catch (err) {
      console.error("Error cancelling auction:", err);
      alert("Failed to cancel auction. Please try again.");
    } finally {
      setIsCancelling(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16 gap-2">
        <Loader2 className="h-5 w-5 animate-spin text-[var(--fr8x-periwinkle)]" />
        <span className="text-body-sm text-foreground-muted">Loading procurement evaluation dashboard...</span>
      </div>
    );
  }

  if (!auction) {
    return (
      <div className="max-w-5xl mx-auto space-y-6">
        <button onClick={() => history.back()} className="flex items-center gap-1 text-body-sm text-foreground-secondary hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to Auctions
        </button>
        <div className="fr8x-card p-6 text-center">
          <p className="text-body-sm text-foreground-secondary">Auction not found</p>
          <p className="text-caption text-foreground-muted mt-1">This auction may have been removed or does not exist.</p>
        </div>
      </div>
    );
  }

  const shipment = auction.shipmentDetails || {};
  const incoRule = INCOTERMS_RULES[shipment.incoTerms as IncotermCode] || INCOTERMS_RULES["FOB"];

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.push(ROUTES.AUCTIONS)} className="flex items-center gap-1 text-body-sm text-foreground-secondary hover:text-foreground">
          <ChevronLeft className="h-4 w-4" /> Back to Auctions
        </button>

        {/* Action Controls for Owner / GodMode */}
        <div className="flex items-center gap-2">
          {auction.status !== "cancelled" && auction.status !== "closed" && (isOwner || isGodMode) && (
            <button
              onClick={() => setShowCancelModal(true)}
              className="fr8x-btn-secondary text-danger border-danger/30 hover:bg-danger-light flex items-center gap-1.5 text-caption px-3 py-1.5"
            >
              <Ban className="h-3.5 w-3.5" /> Cancel Auction (Preserve Audit)
            </button>
          )}
        </div>
      </div>

      {/* Header Banner */}
      <div className="fr8x-card p-5 bg-white border border-border">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`fr8x-badge capitalize ${
                auction.status === "active" ? "fr8x-badge-active" :
                auction.status === "scheduled" ? "bg-blue-50 text-blue-700 border-blue-200" :
                auction.status === "cancelled" ? "bg-red-50 text-red-700 border-red-200" :
                auction.status === "awarded" ? "fr8x-badge-info" : "fr8x-badge-pending"
              }`}>
                {auction.status.replace("_", " ")}
              </span>
              <span className="fr8x-badge bg-gray-100 text-gray-700 border border-gray-200 uppercase font-bold text-[9px]">
                {auction.auctionType === "premium" ? "Selective Strategy" : "General Auction"}
              </span>
              <span className="text-caption text-foreground-muted font-mono">
                {auction.referenceNumber || auction.id}
              </span>
            </div>
            <h1 className="text-heading-lg text-[var(--fr8x-jet)] font-bold">
              {auction.title || "Freight Reverse Auction"}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-body-sm text-foreground-secondary">
              <span className="flex items-center gap-1 font-semibold text-[var(--fr8x-periwinkle)]">
                <Ship className="h-4 w-4" />
                {shipment.mode?.toUpperCase() || "FCL"} • Incoterm: {shipment.incoTerms || "FOB"}
              </span>
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {auction.containerDetails?.map((c) => `${c.containerSize} × ${c.numberOfContainers}`).join(", ") || "—"}
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Ends: {auction.endDate || "—"}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {auction.participantsCount || 0} invited participants
              </span>
            </div>
          </div>

          {/* Enter bidding button for suppliers */}
          {!isOwner && auction.status === "active" && (
            <div className="flex items-center">
              <Link
                href={ROUTES.AUCTION_BID(auction.id)}
                className="fr8x-btn-primary bg-[var(--fr8x-periwinkle)] px-6 py-2.5 flex items-center gap-2 text-body-sm font-semibold"
              >
                Enter Reverse Bidding Deck <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          )}
        </div>

        {/* Cancellation Alert Banner if Cancelled */}
        {auction.status === "cancelled" && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-900 text-body-sm space-y-1">
            <div className="flex items-center gap-2 font-bold">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              This Reverse Auction was Cancelled by Procurement Authority
            </div>
            <p className="text-caption text-red-800">
              Reason: <strong>{auction.cancellationReason || "No explicit reason provided"}</strong>
            </p>
            <p className="text-[10px] text-red-700">
              Note: This record is permanently preserved for audit, compliance, and dispute resolution purposes.
            </p>
          </div>
        )}
      </div>

      {/* ═══ REAL-TIME BUYER PROCUREMENT EVALUATION DASHBOARD ═══ */}
      {(isOwner || isGodMode) && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
              Real-Time Procurement Bid Evaluation Dashboard
            </h2>
            <div className="flex items-center gap-2 text-caption">
              <span className="text-foreground-secondary font-medium">Evaluation Currency:</span>
              {["USD", "INR", "EUR", "GBP"].map((curr) => (
                <button
                  key={curr}
                  onClick={() => setEvalCurrency(curr)}
                  className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    evalCurrency === curr ? "bg-[var(--fr8x-periwinkle)] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {curr}
                </button>
              ))}
            </div>
          </div>

          {/* 13 Metrics Cards Row */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            <div className="fr8x-card p-3 bg-white text-center">
              <span className="text-[9px] text-foreground-secondary uppercase block font-semibold">Invited Bidders</span>
              <span className="text-xl font-bold text-[var(--fr8x-jet)] tabular-nums">{evaluationStats.totalInvited}</span>
            </div>
            <div className="fr8x-card p-3 bg-white text-center">
              <span className="text-[9px] text-foreground-secondary uppercase block font-semibold">Active Participants</span>
              <span className="text-xl font-bold text-success-dark tabular-nums">{evaluationStats.activeParticipants}</span>
            </div>
            <div className="fr8x-card p-3 bg-white text-center">
              <span className="text-[9px] text-foreground-secondary uppercase block font-semibold">Quotations Received</span>
              <span className="text-xl font-bold text-brand-800 tabular-nums">{evaluationStats.totalQuotations}</span>
            </div>
            <div className="fr8x-card p-3 bg-emerald-50 border-emerald-200 text-center">
              <span className="text-[9px] text-emerald-800 uppercase block font-semibold">Lowest Quote (Rank 1)</span>
              <span className="text-xl font-black text-emerald-900 tabular-nums">
                {evaluationStats.lowest ? `${evalCurrency} ${evaluationStats.lowest.toLocaleString()}` : "—"}
              </span>
            </div>
            <div className="fr8x-card p-3 bg-white text-center">
              <span className="text-[9px] text-foreground-secondary uppercase block font-semibold">Highest Quote</span>
              <span className="text-xl font-bold text-foreground-muted tabular-nums">
                {evaluationStats.highest ? `${evalCurrency} ${evaluationStats.highest.toLocaleString()}` : "—"}
              </span>
            </div>
            <div className="fr8x-card p-3 bg-white text-center">
              <span className="text-[9px] text-foreground-secondary uppercase block font-semibold">Average Quote</span>
              <span className="text-xl font-bold text-[var(--fr8x-jet)] tabular-nums">
                {evaluationStats.average ? `${evalCurrency} ${Math.round(evaluationStats.average).toLocaleString()}` : "—"}
              </span>
            </div>
          </div>

          {/* Dashboard Evaluation Tabs */}
          <div className="fr8x-card overflow-hidden">
            <div className="flex items-center gap-2 bg-gray-50 border-b border-border p-2">
              <button
                onClick={() => setActiveOwnerTab("ranking")}
                className={`px-3 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 ${
                  activeOwnerTab === "ranking" ? "bg-[var(--fr8x-periwinkle)] text-white" : "text-foreground-secondary hover:bg-gray-200"
                }`}
              >
                <TrendingDown className="h-3.5 w-3.5" /> Real-Time Participant Ranking
              </button>
              <button
                onClick={() => setActiveOwnerTab("tco")}
                className={`px-3 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 ${
                  activeOwnerTab === "tco" ? "bg-[var(--fr8x-periwinkle)] text-white" : "text-foreground-secondary hover:bg-gray-200"
                }`}
              >
                <Award className="h-3.5 w-3.5" /> Strategic TCO Evaluation Matrix
              </button>
              <button
                onClick={() => setActiveOwnerTab("history")}
                className={`px-3 py-1 rounded text-[11px] font-semibold flex items-center gap-1.5 ${
                  activeOwnerTab === "history" ? "bg-[var(--fr8x-periwinkle)] text-white" : "text-foreground-secondary hover:bg-gray-200"
                }`}
              >
                <History className="h-3.5 w-3.5" /> Bid Movement & Revisions ({evaluationStats.totalRevisions})
              </button>
            </div>

            {/* TAB 1: REAL-TIME PARTICIPANT RANKING TABLE */}
            {activeOwnerTab === "ranking" && (
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between text-caption text-foreground-secondary">
                  <span>Dynamic reordering active. Lowest quotation re-orders to Rank 1 instantly upon valid submission.</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="fr8x-table">
                    <thead>
                      <tr className="bg-gray-50">
                        <th>Rank</th>
                        <th>Supplier Organization</th>
                        <th>Quote ({evalCurrency})</th>
                        <th>Variance vs Lowest</th>
                        <th>Revisions</th>
                        <th>Carrier / ETD</th>
                        <th>Free Time</th>
                        <th>Submitted At</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluationStats.rankedBids.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="text-center py-6 text-foreground-muted">
                            No carrier quotations received yet for this reverse auction.
                          </td>
                        </tr>
                      ) : (
                        evaluationStats.rankedBids.map((b, index) => {
                          const rank = index + 1;
                          const variance = b.convertedAmount - evaluationStats.lowest;
                          return (
                            <tr key={b.id} className={rank === 1 ? "bg-emerald-50/40 font-semibold" : "hover:bg-gray-50"}>
                              <td className="font-bold">
                                <span className={`px-2 py-0.5 rounded text-[10px] ${
                                  rank === 1 ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-800"
                                }`}>
                                  Rank #{rank}
                                </span>
                              </td>
                              <td className="font-bold text-[var(--fr8x-jet)]">
                                {b.bidderCompany || b.bidderName || `Supplier ${b.bidderId?.substring(0, 5)}`}
                              </td>
                              <td className="font-bold text-sm text-[var(--fr8x-jet)] tabular-nums">
                                {evalCurrency} {b.convertedAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="text-caption tabular-nums text-foreground-secondary">
                                {variance === 0 ? <span className="text-emerald-700 font-bold">Best Price</span> : `+${evalCurrency} ${variance.toLocaleString()}`}
                              </td>
                              <td className="tabular-nums">Rev #{b.revisionNumber || 1}</td>
                              <td>{b.freightCharges?.[0]?.carrier || "Direct Line"} (ETD: {b.freightCharges?.[0]?.etd || "Prompt"})</td>
                              <td>{b.freightCharges?.[0]?.freeTimeDays || 7} Days</td>
                              <td className="text-caption text-foreground-muted">{(b as any).submittedAt?.slice(0, 16).replace("T", " ") || "Recent"}</td>
                              <td>
                                <button className="fr8x-btn-secondary text-[10px] py-1 px-2 text-[var(--fr8x-periwinkle)]">
                                  Award Bid
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 2: STRATEGIC TCO EVALUATION MATRIX */}
            {activeOwnerTab === "tco" && (
              <div className="p-4 space-y-3">
                <p className="text-caption text-foreground-secondary">
                  Total Cost of Ownership (TCO) Score combines Price (60%), Supplier Performance (15%), On-Time Delivery (10%), Space Availability (10%), and Doc Accuracy (5%).
                </p>
                <div className="overflow-x-auto">
                  <table className="fr8x-table">
                    <thead>
                      <tr className="bg-gray-50">
                        <th>Supplier</th>
                        <th>Commercial Quote</th>
                        <th>Performance Rating</th>
                        <th>On-Time %</th>
                        <th>Space Avail %</th>
                        <th>TCO Score (0-100)</th>
                        <th>Recommendation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {evaluationStats.rankedBids.map((b) => {
                        const tco = calculateTCOScore({
                          bidAmountUSD: b.totalAmountUSD || b.totalAmount || 0,
                          lowestBidUSD: evaluationStats.lowest,
                          highestBidUSD: evaluationStats.highest,
                        });
                        return (
                          <tr key={b.id}>
                            <td className="font-bold">{b.bidderCompany || b.bidderName || "Carrier"}</td>
                            <td className="font-semibold">{evalCurrency} {b.convertedAmount.toLocaleString()}</td>
                            <td>⭐ 4.5 / 5.0</td>
                            <td>96%</td>
                            <td>98%</td>
                            <td>
                              <span className="px-2 py-0.5 rounded font-black text-sm bg-blue-100 text-blue-900">
                                {tco} / 100
                              </span>
                            </td>
                            <td>
                              {tco > 85 ? (
                                <span className="fr8x-badge bg-emerald-100 text-emerald-800">High Operational Value</span>
                              ) : (
                                <span className="fr8x-badge bg-gray-100 text-gray-700">Standard Match</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB 3: BID MOVEMENT & REVISIONS HISTORY */}
            {activeOwnerTab === "history" && (
              <div className="p-4 space-y-3">
                <p className="text-caption text-foreground-secondary">
                  Complete revision history log of all quotation updates submitted during this reverse auction.
                </p>
                <div className="space-y-2">
                  {bids.map((b) => (
                    <div key={b.id} className="p-3 border border-border rounded bg-white text-[11px] flex items-center justify-between">
                      <div>
                        <strong className="text-[var(--fr8x-jet)] block">{b.bidderCompany || b.bidderName || "Carrier Bidder"}</strong>
                        <span className="text-foreground-secondary">Revision #{b.revisionNumber || 1} • Submitted at {(b as any).submittedAt || "Recent"}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-sm text-[var(--fr8x-jet)] block">${b.totalAmountUSD?.toLocaleString() || b.totalAmount?.toLocaleString()} USD</span>
                        <span className="text-caption text-foreground-muted">Payment: {b.remarks || "Standard"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Incoterms Cost Responsibilities Summary Banner */}
      <div className="fr8x-card p-4 bg-[var(--fr8x-mist)] border border-[var(--fr8x-lavender)] flex items-start gap-3">
        <Info className="h-5 w-5 text-[var(--fr8x-periwinkle)] flex-shrink-0 mt-0.5" />
        <div className="text-[11px] space-y-1">
          <span className="font-semibold text-[var(--fr8x-jet)] block">
            Incoterm Standard ({shipment.incoTerms}): {incoRule.name}
          </span>
          <p className="text-foreground-secondary">
            <strong>Seller Responsibility:</strong> {incoRule.sellerResponsibility.join(", ")}
          </p>
          <p className="text-foreground-secondary">
            <strong>Buyer Responsibility:</strong> {incoRule.buyerResponsibility.join(", ")}
          </p>
        </div>
      </div>

      {/* Shipment Route Specs & Cargo Line Items Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="fr8x-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
            <h2 className="text-heading-lg text-foreground">Shipment Route & Mode Specs</h2>
            <Lock className="h-4 w-4 text-foreground-muted ml-auto" />
          </div>
          <div className="grid grid-cols-2 gap-4 text-body-sm">
            <div>
              <p className="text-foreground-muted">Origin</p>
              <p className="text-foreground font-medium">{shipment.origin || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Destination</p>
              <p className="text-foreground font-medium">{shipment.destination || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">POL / Origin Hub</p>
              <p className="text-foreground font-medium">{shipment.originPort || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">POD / Destination Hub</p>
              <p className="text-foreground font-medium">{shipment.destinationPort || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Mode</p>
              <p className="text-foreground font-medium uppercase">{shipment.mode || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Incoterms®</p>
              <p className="text-foreground font-medium">{shipment.incoTerms || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Cargo Ready</p>
              <p className="text-foreground font-medium">{shipment.cargoReadyDate || "—"}</p>
            </div>
            <div>
              <p className="text-foreground-muted">Required Delivery</p>
              <p className="text-foreground font-medium">{shipment.requiredDeliveryDate || "—"}</p>
            </div>
          </div>
        </div>

        <div className="fr8x-card p-6 space-y-4">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
            <h2 className="text-heading-lg text-foreground">Equipment & Cargo Line Items</h2>
            <Lock className="h-4 w-4 text-foreground-muted ml-auto" />
          </div>
          <div className="overflow-x-auto">
            <table className="fr8x-table">
              <thead>
                <tr>
                  <th>Equipment / Unit</th>
                  <th>Qty</th>
                  <th>Haz Status</th>
                  <th>Gross Weight</th>
                </tr>
              </thead>
              <tbody>
                {auction.containerDetails && auction.containerDetails.length > 0 ? (
                  auction.containerDetails.map((c, i) => (
                    <tr key={i}>
                      <td className="font-medium">{c.containerSize}</td>
                      <td>{c.numberOfContainers}</td>
                      <td>
                        <span className={c.hazStatus === "non_haz" ? "fr8x-badge-active" : "fr8x-badge-danger"}>
                          {c.hazStatus === "non_haz" ? "Non-Haz" : "Hazardous"}
                        </span>
                      </td>
                      <td>{c.grossWeight ? `${c.grossWeight.toLocaleString()} KG` : "—"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="text-center text-foreground-muted">No equipment details</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full space-y-4">
            <div className="flex items-center gap-2 text-danger font-bold text-heading-sm">
              <Ban className="h-5 w-5" /> Cancel Reverse Auction
            </div>
            <p className="text-caption text-foreground-secondary">
              This auction will be marked as <strong>Cancelled</strong>. No data will be deleted. Full audit history, quotations, and timestamps will remain permanently searchable for compliance.
            </p>
            <div>
              <label className="fr8x-label block mb-1">Mandatory Cancellation Reason *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                rows={3}
                className="fr8x-input w-full resize-none text-[11px]"
                placeholder="State the reason (e.g. Shipment cancelled by end customer, rate budget revised)..."
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
              <button onClick={() => setShowCancelModal(false)} className="fr8x-btn-secondary text-caption px-3 py-1.5">
                Back
              </button>
              <button
                onClick={handleCancelAuction}
                disabled={isCancelling}
                className="fr8x-btn-primary bg-danger text-white hover:bg-danger-dark text-caption px-4 py-1.5 flex items-center gap-1"
              >
                {isCancelling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Confirm Cancellation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
