// FR8X-CON Blacklist Page

"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Filter, AlertTriangle, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { queryDocuments, orderBy, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

type BlacklistEntry = {
  id: string;
  userName: string;
  reason: string;
  issuedBy: string;
  date: string;
  appealStatus: "none" | "pending" | "approved" | "denied";
  createdAt: { seconds: number; nanoseconds: number } | null;
};

export default function BlacklistPage() {
  const [entries, setEntries] = useState<BlacklistEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBlacklist() {
      setIsLoading(true);
      try {
        const data = await queryDocuments<BlacklistEntry>(COLLECTIONS.BLACKLISTS, [
          orderBy("createdAt", "desc"),
          limit(50),
        ]);
        setEntries(data);
      } catch (err) {
        console.error("Error fetching blacklist entries:", err);
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBlacklist();
  }, []);

  const filteredEntries = useMemo(() => {
    if (!searchQuery) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        (e.userName || "").toLowerCase().includes(q) ||
        (e.reason || "").toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-foreground">Blacklist</h1>
        <p className="mt-1 text-body-md text-foreground-secondary">
          Enforcement records and appeal management
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search blacklist entries..."
            className="fr8x-input pl-10"
          />
        </div>
        <button className="fr8x-btn-secondary flex items-center gap-2 px-4">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="fr8x-card overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
            <span className="text-[11px] text-foreground-muted">Loading records...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-body-sm text-foreground-secondary">
              {entries.length === 0 ? "No active blacklist records" : "No entries match your search"}
            </p>
            <p className="text-caption text-foreground-muted mt-1">
              {entries.length === 0 ? "All network participants are currently in good standing." : "Try adjusting your search query."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="fr8x-table">
              <thead>
                <tr>
                  <th>Entity</th>
                  <th>Reason</th>
                  <th>Issued By</th>
                  <th>Date</th>
                  <th>Appeal Status</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {filteredEntries.map((entry) => (
                  <tr key={entry.id}>
                    <td className="font-medium">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4 text-danger" />
                        {entry.userName || "Unknown Entity"}
                      </div>
                    </td>
                    <td className="max-w-xs truncate">{entry.reason || "—"}</td>
                    <td>{entry.issuedBy || "System"}</td>
                    <td>{entry.date || "—"}</td>
                    <td>
                      <span className={cn(
                        "fr8x-badge",
                        entry.appealStatus === "pending" ? "fr8x-badge-pending" :
                        entry.appealStatus === "approved" ? "fr8x-badge-active" :
                        "fr8x-badge-danger"
                      )}>
                        {entry.appealStatus === "none" || !entry.appealStatus ? "No Appeal" : entry.appealStatus}
                      </span>
                    </td>
                    <td>
                      <button className="p-1 text-foreground-muted hover:text-foreground">
                        <FileText className="h-4 w-4" />
                      </button>
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
