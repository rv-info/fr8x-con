// FR8X-CON Auctions Page — Compact table/list view with summary stats

"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  Filter,
  Eye,
  ArrowUpDown,
} from "lucide-react";

import { ROUTES } from "@/lib/utils/constants";
import { cn } from "@/lib/utils/cn";
import type { AuctionStatus } from "@/lib/types/auction";

const AUCTION_TABS: { value: AuctionStatus | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Drafts" },
  { value: "closed", label: "Closed" },
  { value: "awarded", label: "Awarded" },
];

const MOCK_AUCTIONS = Array.from({ length: 12 }).map((_, i) => ({
  id: `auction-${i + 1}`,
  ref: `AUC-${2024000 + i + 1}`,
  title: [
    "Nhava Sheva → Rotterdam",
    "Mundra → Hamburg",
    "Chennai → Singapore",
    "Kolkata → Colombo",
    "Cochin → Felixstowe",
    "Vizag → Antwerp",
  ][i % 6],
  shipmentType: ["FCL", "LCL", "FCL", "FCL", "LCL", "FCL"][i % 6],
  containers: `${[20, 40, 20, 40, 20, 40][i % 6]}ft × ${(i % 5) + 2}`,
  commodity: ["Non-Haz", "DG Class 3", "Non-Haz", "Reefer", "Non-Haz", "OOG"][i % 6],
  status: (["active", "draft", "closed", "active", "awarded", "active"] as AuctionStatus[])[i % 6],
  bids: 3 + (i % 5),
  maxBids: 5,
  timeLeft: `${(i % 4) + 1}d ${(i % 12) + 2}h`,
  creator: ["Cogoport", "Global Lines", "FastShip", "OceanLink", "ClearFreight", "IndiaPort"][i % 6],
  createdAt: "Jul " + (10 + i),
}));

const STATS = [
  { label: "Total", value: "12", color: "text-[var(--fr8x-jet)]" },
  { label: "Active", value: "4", color: "text-success" },
  { label: "Drafts", value: "2", color: "text-warning" },
  { label: "Closed", value: "3", color: "text-foreground-muted" },
  { label: "Awarded", value: "3", color: "text-[var(--fr8x-periwinkle)]" },
];

export default function AuctionsPage() {
  const [activeTab, setActiveTab] = useState<AuctionStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = MOCK_AUCTIONS.filter((a) => {
    if (activeTab !== "all" && a.status !== activeTab) return false;
    if (searchQuery && !(a.title ?? "").toLowerCase().includes(searchQuery.toLowerCase()) && !a.ref.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[12px] font-semibold text-[var(--fr8x-jet)]">Reverse Auctions</h1>
          <p className="text-[10px] text-foreground-secondary">Manage & participate in freight reverse auctions</p>
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
        {STATS.map((s) => (
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
            placeholder="Search by route, ref, commodity..."
            className="fr8x-input pl-6 h-6 py-0 text-[10px]"
          />
        </div>
        <button className="fr8x-btn-secondary flex items-center gap-1.5">
          <Filter className="h-3.5 w-3.5" /> Filters
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

      {/* Auctions table — compact */}
      <div className="fr8x-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="fr8x-table">
            <thead>
              <tr className="bg-[#FAFAF9]">
                <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap"><button className="flex items-center gap-0.5">Ref <ArrowUpDown className="h-2 w-2" /></button></th>
                <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap"><button className="flex items-center gap-0.5">Route <ArrowUpDown className="h-2 w-2" /></button></th>
                <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Type</th>
                <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Containers</th>
                <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Commodity</th>
                <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Status</th>
                <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Bids</th>
                <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Time Left</th>
                <th className="px-2 py-0.5 text-left text-[9px] font-semibold text-foreground-secondary uppercase border-b border-border whitespace-nowrap">Creator</th>
                <th className="px-2 py-0.5 text-left text-[9px] border-b border-border w-6"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-[var(--fr8x-mist)] border-b border-border last:border-0">
                  <td className="px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">{a.ref}</td>
                  <td className="px-2 py-0.5 text-[10px] font-medium whitespace-nowrap">{a.title}</td>
                  <td className="px-2 py-0.5 text-[10px] whitespace-nowrap">{a.shipmentType}</td>
                  <td className="px-2 py-0.5 text-[10px] whitespace-nowrap">{a.containers}</td>
                  <td className="px-2 py-0.5 text-[10px] whitespace-nowrap">{a.commodity}</td>
                  <td className="px-2 py-0.5">
                    <span className={cn(
                      "fr8x-badge",
                      a.status === "active" ? "fr8x-badge-active" :
                      a.status === "draft" ? "fr8x-badge-pending" :
                      a.status === "awarded" ? "fr8x-badge-info" :
                      "fr8x-badge-danger"
                    )}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-2 py-0.5 text-[10px] tabular-nums whitespace-nowrap">{a.bids}/{a.maxBids}</td>
                  <td className="px-2 py-0.5 text-[10px] whitespace-nowrap">{a.status === "active" ? a.timeLeft : "—"}</td>
                  <td className="px-2 py-0.5 text-[10px] whitespace-nowrap">{a.creator}</td>
                  <td className="px-2 py-0.5">
                    <Link href={ROUTES.AUCTION_DETAIL(a.id)} className="text-foreground-muted hover:text-[var(--fr8x-periwinkle)]">
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
          <p className="text-caption text-foreground-muted">Showing {filtered.length} of {MOCK_AUCTIONS.length}</p>
          <div className="flex items-center gap-0.5">
            <button className="fr8x-btn-ghost px-2 py-1 text-caption">Prev</button>
            <button className="px-2 py-1 text-caption bg-[var(--fr8x-periwinkle)] text-white rounded">1</button>
            <button className="fr8x-btn-ghost px-2 py-1 text-caption">2</button>
            <button className="fr8x-btn-ghost px-2 py-1 text-caption">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
