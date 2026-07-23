// FR8X-CON GodMode Auctions Management — Spec Page 11

"use client";

import { useState } from "react";
import { Gavel, Search, ShieldAlert, CheckCircle, Plus } from "lucide-react";

const mockAuctions = Array.from({ length: 6 }, (_, i) => ({
  id: `auc-${100 + i}`,
  title: `FCL: Port ${i + 1} to Destination ${i + 1}`,
  creator: `User ${i + 1}`,
  containers: `${2 + i} x 20' Standard`,
  bidsCount: 4 + i * 2,
  status: i % 2 === 0 ? "live" : "completed",
  lowestBid: `$${1100 - i * 50}`,
}));

export default function GodModeAuctionsPage() {
  const [search, setSearch] = useState("");

  const filtered = mockAuctions.filter((a) =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.creator.toLowerCase().includes(search.toLowerCase())
  );

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
            placeholder="Search auctions by title or creator..."
            className="fr8x-input pl-9"
          />
        </div>
      </div>

      <div className="fr8x-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="fr8x-table">
            <thead>
              <tr>
                <th>Auction ID</th>
                <th>Title</th>
                <th>Creator</th>
                <th>Containers</th>
                <th>Bids</th>
                <th>Lowest Bid</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((auc) => (
                <tr key={auc.id} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                  <td className="font-semibold text-[var(--fr8x-jet)]">{auc.id}</td>
                  <td>{auc.title}</td>
                  <td>{auc.creator}</td>
                  <td>{auc.containers}</td>
                  <td>{auc.bidsCount} bids</td>
                  <td className="font-bold text-[var(--fr8x-jet)]">{auc.lowestBid}</td>
                  <td>
                    <span className={auc.status === "live" ? "fr8x-badge-active" : "fr8x-badge-info"}>
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
      </div>
    </div>
  );
}
