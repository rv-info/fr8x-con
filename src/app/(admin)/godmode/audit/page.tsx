// FR8X-CON GodMode Audit Log

"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Download, Loader2 } from "lucide-react";
import { queryDocuments, orderBy, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

type AuditLogEntry = {
  id: string;
  event?: string;
  description?: string;
  userId?: string;
  ipAddress?: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

export default function GodModeAuditPage() {
  const [search, setSearch] = useState("");
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAuditLogs() {
      setIsLoading(true);
      try {
        const data = await queryDocuments<AuditLogEntry>(COLLECTIONS.AUDIT, [
          orderBy("createdAt", "desc"),
          limit(50),
        ]);
        setLogs(data);
      } catch (err) {
        console.error("Error fetching audit logs:", err);
        setLogs([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAuditLogs();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return logs;
    const q = search.toLowerCase();
    return logs.filter(
      (l) =>
        (l.event?.toLowerCase() || "").includes(q) ||
        (l.description?.toLowerCase() || "").includes(q) ||
        (l.userId?.toLowerCase() || "").includes(q)
    );
  }, [logs, search]);

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
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
            <span className="text-[11px] text-foreground-muted">Loading logs...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-body-sm text-foreground-secondary">
              {logs.length === 0 ? "No audit log entries recorded" : "No matching log entries found"}
            </p>
          </div>
        ) : (
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
                    <td className="text-foreground-muted">
                      {log.createdAt ? new Date(log.createdAt.seconds * 1000).toLocaleString() : "—"}
                    </td>
                    <td>
                      <span className="fr8x-badge-info font-mono">{log.event || "system.event"}</span>
                    </td>
                    <td className="font-medium text-[var(--fr8x-jet)]">{log.description || "—"}</td>
                    <td>{log.userId || "—"}</td>
                    <td className="font-mono text-[10px] text-foreground-muted">{log.ipAddress || "—"}</td>
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
