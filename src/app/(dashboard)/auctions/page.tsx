// FR8X-CON Auctions Page — Compact table/list view with summary stats

"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Eye,
  ArrowUpDown,
  Loader2,
} from "lucide-react";

import { ROUTES, COLLECTIONS } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import { queryDocuments, orderBy, limit } from "@/lib/firebase/firestore";
import type { AuctionStatus } from "@/lib/types/auction";

type AuctionData = {
  id: string;
  referenceNumber: string;
  title: string;
  auctionType?: "general" | "premium";
  shipmentDetails: {
    mode: string;
    origin: string;
    destination: string;
  };
  containerDetails: Array<{
    containerSize: string;
    numberOfContainers: number;
  }>;
  commodityDetails: Array<{
    description: string;
  }>;
  status: AuctionStatus;
  bidsCount: number;
  totalRevisionsCount?: number;
  participantsCount: number;
  activeParticipantsCount?: number;
  lowestBidAmount?: number;
  evaluationCurrency?: string;
  endDate: string;
  creatorName: string;
  priority?: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

const AUCTION_TABS: { value: AuctionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Live Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "closing_soon", label: "Closing Soon" },
  { value: "draft", label: "Drafts" },
  { value: "closed", label: "Closed" },
  { value: "awarded", label: "Awarded" },
  { value: "cancelled", label: "Cancelled" },
  { value: "expired", label: "Expired" },
];

export default function AuctionsPage() {
  const [activeTab, setActiveTab] = useState<AuctionStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [auctions, setAuctions] = useState<AuctionData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch auctions from Firestore
  useEffect(() => {
    async function fetchAuctions() {
      setIsLoading(true);
      try {
        const data = await queryDocuments<AuctionData>(COLLECTIONS.AUCTIONS, [
          orderBy("createdAt", "desc"),
          limit(50),
        ]);
        setAuctions(data);
      } catch (err) {
        console.error("Error fetching auctions:", err);
        setAuctions([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAuctions();
  }, []);

  // Compute stats dynamically
  const stats = useMemo(() => {
    const total = auctions.length;
    const active = auctions.filter(a => a.status === "active").length;
    const scheduled = auctions.filter(a => a.status === "scheduled").length;
    const closed = auctions.filter(a => a.status === "closed" || a.status === "closing_soon").length;
    const awarded = auctions.filter(a => a.status === "awarded").length;
    const cancelled = auctions.filter(a => a.status === "cancelled").length;
    return [
      { label: "Total", value: String(total), color: "text-[var(--fr8x-jet)]" },
      { label: "Live Active", value: String(active), color: "text-success" },
      { label: "Scheduled", value: String(scheduled), color: "text-blue-600" },
      { label: "Awarded", value: String(awarded), color: "text-[var(--fr8x-periwinkle)]" },
      { label: "Cancelled", value: String(cancelled), color: "text-danger" },
    ];
  }, [auctions]);

  const filtered = useMemo(() => {
    return auctions.filter((a) => {
      if (activeTab !== "all" && a.status !== activeTab) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchTitle = (a.title || "").toLowerCase().includes(q);
        const matchRef = (a.referenceNumber || "").toLowerCase().includes(q);
        const matchCreator = (a.creatorName || "").toLowerCase().includes(q);
        if (!matchTitle && !matchRef && !matchCreator) return false;
      }
      return true;
    });
  }, [auctions, activeTab, searchQuery]);

  // Helper to format container info
  const formatContainers = (details: AuctionData["containerDetails"]) => {
    if (!details || details.length === 0) return "—";
    return details.map(d => `${d.containerSize} × ${d.numberOfContainers}`).join(", ");
  };

  // Helper to format commodity
  const formatCommodity = (details: AuctionData["commodityDetails"]) => {
    if (!details || details.length === 0) return "—";
    return details.map(d => d.description).join(", ");
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[12px] font-semibold text-[var(--fr8x-jet)]">Reverse Auctions Governance & Bidding Portal</h1>
          <p className="text-[10px] text-foreground-secondary">Real-time enterprise freight quotation evaluation & procurement engine</p>
        </div>
        <Link
          href={ROUTES.AUCTION_CREATE}
          className="fr8x-btn-primary flex items-center gap-1.5"
        >
          <Plus className="h-3.5 w-3.5" /> Create Auction
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-5 gap-1.5">
        {stats.map((s) => (
          <div key={s.label} className="fr8x-card p-1.5 flex flex-col items-center text-center">
            <span className={cn("text-base font-bold tabular-nums", s.color)}>{s.value}</span>
            <span className="text-[9px] text-foreground-secondary uppercase tracking-wide">{s.label}</span>
          </div>
        ))}
      </div>

      {/* Search + Filters + Tabs */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-foreground-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by route, ref, carrier, commodity..."
            className="fr8x-input pl-6 h-6 py-0 text-[10px]"
          />
        </div>
        <button className="fr8x-btn-secondary flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" /> Strategy Filters
        </button>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
        {AUCTION_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            className={cn(
              activeTab === tab.value ? "fr8x-tab-active" : "fr8x-tab-inactive"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Auctions table */}
      <div className="fr8x-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
            <span className="text-[11px] text-foreground-muted">Loading auctions database...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-[11px] text-foreground-secondary">
              {auctions.length === 0 ? "No auctions registered in platform" : "No auctions match your filters"}
            </p>
            <p className="text-[10px] text-foreground-muted mt-1">
              {auctions.length === 0 ? "Create your first reverse auction to launch procurement bidding!" : "Try selecting a different lifecycle status tab"}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="fr8x-table">
                <thead>
                  <tr className="bg-[#FAFAF9]">
                    <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap"><button className="flex items-center gap-0.5">Ref <ArrowUpDown className="h-2 w-2" /></button></th>
                    <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap"><button className="flex items-center gap-0.5">Route <ArrowUpDown className="h-2 w-2" /></button></th>
                    <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Strategy</th>
                    <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Mode & Cargo</th>
                    <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Status</th>
                    <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Participants</th>
                    <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Bids / Revisions</th>
                    <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Lowest Quote</th>
                    <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Creator</th>
                    <th className="px-2 py-0.5 text-left text-[9px] border-b border-border w-6"></th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((a) => (
                    <tr key={a.id} className="hover:bg-[var(--fr8x-mist)] border-b border-border last:border-0">
                      <td className="px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">{a.referenceNumber || "—"}</td>
                      <td className="px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">{a.title || "—"}</td>
                      <td className="px-2 py-0.5 text-[10px] whitespace-nowrap">
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase",
                          a.auctionType === "premium" ? "bg-purple-50 text-purple-700 border border-purple-200" : "bg-gray-50 text-gray-700 border border-gray-200"
                        )}>
                          {a.auctionType === "premium" ? "Selective" : "General"}
                        </span>
                      </td>
                      <td className="px-2 py-0.5 text-[10px] whitespace-nowrap">
                        <span className="font-semibold">{a.shipmentDetails?.mode?.toUpperCase()}</span> • {formatContainers(a.containerDetails)}
                      </td>
                      <td className="px-2 py-0.5">
                        <span className={cn(
                          "fr8x-badge capitalize",
                          a.status === "active" ? "fr8x-badge-active" :
                          a.status === "scheduled" ? "bg-blue-50 text-blue-700 border-blue-200" :
                          a.status === "closing_soon" ? "bg-amber-50 text-amber-700 border-amber-200" :
                          a.status === "draft" ? "fr8x-badge-pending" :
                          a.status === "awarded" ? "fr8x-badge-info" :
                          a.status === "cancelled" ? "bg-red-50 text-red-700 border-red-200" :
                          "fr8x-badge-danger"
                        )}>
                          {a.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-2 py-0.5 text-[10px] tabular-nums whitespace-nowrap">
                        {a.activeParticipantsCount || 0} / {a.participantsCount || 0}
                      </td>
                      <td className="px-2 py-0.5 text-[10px] tabular-nums whitespace-nowrap">
                        {a.bidsCount || 0} quotes ({a.totalRevisionsCount || a.bidsCount || 0} revs)
                      </td>
                      <td className="px-2 py-0.5 text-[10px] font-bold text-[var(--fr8x-jet)] tabular-nums whitespace-nowrap">
                        {a.lowestBidAmount ? `${a.evaluationCurrency || "USD"} ${a.lowestBidAmount.toLocaleString()}` : "—"}
                      </td>
                      <td className="px-2 py-0.5 text-[10px] whitespace-nowrap">{a.creatorName || "—"}</td>
                      <td className="px-2 py-0.5">
                        <Link href={ROUTES.AUCTION_DETAIL(a.id)} className="text-foreground-muted hover:text-[var(--fr8x-periwinkle)] flex items-center gap-1" title="Inspect Evaluation Dashboard">
                          <Eye className="h-3 w-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex items-center justify-between px-3 py-2 border-t border-border">
              <p className="text-caption text-foreground-muted">Showing {filtered.length} of {auctions.length} reverse auctions</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
