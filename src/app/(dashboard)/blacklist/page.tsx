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

  // Per-column search box states
  const [colFilters, setColFilters] = useState({
    entity: "",
    reason: "",
    issuedBy: "",
    date: "",
    appealStatus: "",
  });

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

  const handleColFilterChange = (key: string, val: string) => {
    setColFilters((prev) => ({ ...prev, [key]: val }));
  };

  const filteredEntries = useMemo(() => {
    return entries.filter((e) => {
      // Global search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchName = (e.userName || "").toLowerCase().includes(q);
        const matchReason = (e.reason || "").toLowerCase().includes(q);
        if (!matchName && !matchReason) return false;
      }

      // Per-column search filters
      if (colFilters.entity && !(e.userName || "").toLowerCase().includes(colFilters.entity.toLowerCase())) return false;
      if (colFilters.reason && !(e.reason || "").toLowerCase().includes(colFilters.reason.toLowerCase())) return false;
      if (colFilters.issuedBy && !(e.issuedBy || "").toLowerCase().includes(colFilters.issuedBy.toLowerCase())) return false;
      if (colFilters.date && !(e.date || "").toLowerCase().includes(colFilters.date.toLowerCase())) return false;
      if (colFilters.appealStatus && !(e.appealStatus || "").toLowerCase().includes(colFilters.appealStatus.toLowerCase())) return false;

      return true;
    });
  }, [entries, searchQuery, colFilters]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm text-foreground font-bold">Blacklist & Enforcement Records</h1>
        <p className="mt-1 text-body-md text-foreground-secondary">
          Enforcement records, verification status, and appeal management
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
        <button
          onClick={() => setColFilters({ entity: "", reason: "", issuedBy: "", date: "", appealStatus: "" })}
          className="fr8x-btn-secondary flex items-center gap-2 px-4 text-caption"
        >
          <Filter className="h-4 w-4" />
          Reset Search Filters
        </button>
      </div>

      <div className="fr8x-card overflow-hidden bg-white">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
            <span className="text-[11px] text-foreground-muted">Loading records...</span>
          </div>
        ) : filteredEntries.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-body-sm text-foreground-secondary">
              {entries.length === 0 ? "No active blacklist records" : "No entries match your search filters"}
            </p>
            <p className="text-caption text-foreground-muted mt-1">
              {entries.length === 0 ? "All network participants are currently in good standing." : "Try clearing or adjusting column search boxes."}
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
                  <th className="w-10">Action</th>
                </tr>
                {/* Search box below every heading */}
                <tr className="bg-gray-50 border-b border-border">
                  <td className="p-1">
                    <input
                      type="text"
                      value={colFilters.entity}
                      onChange={(e) => handleColFilterChange("entity", e.target.value)}
                      placeholder="Filter Entity"
                      className="fr8x-input text-[10px] py-0.5 px-1.5 h-6 w-full"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={colFilters.reason}
                      onChange={(e) => handleColFilterChange("reason", e.target.value)}
                      placeholder="Filter Reason"
                      className="fr8x-input text-[10px] py-0.5 px-1.5 h-6 w-full"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={colFilters.issuedBy}
                      onChange={(e) => handleColFilterChange("issuedBy", e.target.value)}
                      placeholder="Filter Issuer"
                      className="fr8x-input text-[10px] py-0.5 px-1.5 h-6 w-full"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={colFilters.date}
                      onChange={(e) => handleColFilterChange("date", e.target.value)}
                      placeholder="Filter Date"
                      className="fr8x-input text-[10px] py-0.5 px-1.5 h-6 w-full"
                    />
                  </td>
                  <td className="p-1">
                    <input
                      type="text"
                      value={colFilters.appealStatus}
                      onChange={(e) => handleColFilterChange("appealStatus", e.target.value)}
                      placeholder="Filter Appeal"
                      className="fr8x-input text-[10px] py-0.5 px-1.5 h-6 w-full"
                    />
                  </td>
                  <td className="p-1"></td>
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
