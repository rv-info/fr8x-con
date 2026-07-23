// FR8X-CON GodMode Audit Log — Spec Page 11

"use client";

import { useState } from "react";
import { FileText, Search, Download } from "lucide-react";

const mockLogs = Array.from({ length: 15 }, (_, i) => ({
  id: `log-${i + 1}`,
  timestamp: new Date(Date.now() - i * 1800000).toLocaleString(),
  event: ["user.login", "user.register", "post.create", "rate.insert", "auction.create", "bid.submit", "blacklist.add"][i % 7],
  description: [
    "User logged in successfully",
    "New corporate user registered",
    "Feed post published",
    "New ocean rate added",
    "Reverse auction posted",
    "Bid submitted for auction",
    "Entity added to blacklist",
  ][i % 7],
  userId: `user-${100 + i}`,
  ipAddress: `192.168.1.${10 + i}`,
}));

export default function GodModeAuditPage() {
  const [search, setSearch] = useState("");

  const filtered = mockLogs.filter(
    (l) =>
      (l.event?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (l.description?.toLowerCase() || "").includes(search.toLowerCase()) ||
      (l.userId?.toLowerCase() || "").includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Audit Log</h1>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Complete platform activity audit trail and security logs
          </p>
        </div>
        <button className="fr8x-btn-secondary flex items-center gap-1.5 text-caption">
          <Download className="h-3.5 w-3.5" /> Export Logs (CSV)
        </button>
      </div>

      <div className="fr8x-card p-4 flex items-center gap-4 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search logs by event, description, or user ID..."
            className="fr8x-input pl-9"
          />
        </div>
      </div>

      <div className="fr8x-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="fr8x-table fr8x-table-compact">
            <thead>
              <tr>
                <th>Timestamp</th>
                <th>Event Type</th>
                <th>Description</th>
                <th>User ID</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((log) => (
                <tr key={log.id} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                  <td className="text-foreground-muted">{log.timestamp}</td>
                  <td>
                    <span className="fr8x-badge-info font-mono">{log.event}</span>
                  </td>
                  <td className="font-medium text-[var(--fr8x-jet)]">{log.description}</td>
                  <td>{log.userId}</td>
                  <td className="font-mono text-[10px] text-foreground-muted">{log.ipAddress}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
