// FR8X-CON GodMode Auctions Management

"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Loader2 } from "lucide-react";
import { queryDocuments, orderBy, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

type AuctionAdmin = {
  id: string;
  referenceNumber?: string;
  title?: string;
  creatorName?: string;
  containerDetails?: Array<{ containerSize: string; numberOfContainers: number }>;
  bidsCount?: number;
  status: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

export default function GodModeAuctionsPage() {
  const [search, setSearch] = useState("");
  const [auctions, setAuctions] = useState<AuctionAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAuctions() {
      setIsLoading(true);
      try {
        const data = await queryDocuments<AuctionAdmin>(COLLECTIONS.AUCTIONS, [
          orderBy("createdAt", "desc"),
          limit(50),
        ]);
        setAuctions(data);
      } catch (err) {
        console.error("Error fetching admin auctions:", err);
        setAuctions([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAuctions();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return auctions;
    const q = search.toLowerCase();
    return auctions.filter(
      (a) =>
        (a.title || "").toLowerCase().includes(q) ||
        (a.creatorName || "").toLowerCase().includes(q) ||
        (a.referenceNumber || "").toLowerCase().includes(q)
    );
  }, [auctions, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Auction Management</h1>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Oversee live auctions, monitor bidding compliance, and resolve disputes
          </p>
        </div>
      </div>

      <div className="fr8x-card p-4 flex items-center gap-4 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search auctions by title, ref, or creator..."
            className="fr8x-input pl-9"
          />
        </div>
      </div>

      <div className="fr8x-card bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
            <span className="text-[11px] text-foreground-muted">Loading auctions...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-body-sm text-foreground-secondary">
              {auctions.length === 0 ? "No auctions registered in system" : "No matching auctions found"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="fr8x-table">
              <thead>
                <tr>
                  <th>Auction ID</th>
                  <th>Title</th>
                  <th>Creator</th>
                  <th>Containers</th>
                  <th>Bids</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((auc) => (
                  <tr key={auc.id} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                    <td className="font-semibold text-[var(--fr8x-jet)]">{auc.referenceNumber || auc.id}</td>
                    <td>{auc.title || "—"}</td>
                    <td>{auc.creatorName || "—"}</td>
                    <td>
                      {auc.containerDetails?.map(c => `${c.containerSize} × ${c.numberOfContainers}`).join(", ") || "—"}
                    </td>
                    <td>{auc.bidsCount || 0} bids</td>
                    <td>
                      <span className={auc.status === "active" ? "fr8x-badge-active" : "fr8x-badge-info"}>
                        {auc.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-caption">
                        <button className="text-[var(--fr8x-periwinkle)] hover:underline">View</button>
                        <button className="text-danger hover:underline">Cancel</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
