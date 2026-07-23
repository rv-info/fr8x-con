// FR8X-CON GodMode Blacklist Management

"use client";

import { useState, useEffect } from "react";
import { ShieldAlert, Plus, Loader2 } from "lucide-react";
import { queryDocuments, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

type BlacklistAdmin = {
  id: string;
  entityName?: string;
  userName?: string;
  entityType?: string;
  reason?: string;
  issuedBy?: string;
  date?: string;
  status?: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

export default function GodModeBlacklistPage() {
  const [entries, setEntries] = useState<BlacklistAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchBlacklist() {
      setIsLoading(true);
      try {
        const data = await queryDocuments<BlacklistAdmin>(COLLECTIONS.BLACKLISTS, [limit(50)]);
        setEntries(data);
      } catch (err) {
        console.error("Error fetching admin blacklist:", err);
        setEntries([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchBlacklist();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Blacklist Registry</h1>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Manage blacklisted companies, review appeals, and enforce platform security
          </p>
        </div>
        <button className="fr8x-btn-primary bg-danger hover:bg-danger-dark flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Add to Blacklist
        </button>
      </div>

      <div className="fr8x-card bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
            <span className="text-[11px] text-foreground-muted">Loading records...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-body-sm text-foreground-secondary">No blacklisted entities</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="fr8x-table">
              <thead>
                <tr>
                  <th>Entity Name</th>
                  <th>Type</th>
                  <th>Reason</th>
                  <th>Blacklisted By</th>
                  <th>Date Added</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {entries.map((e) => (
                  <tr key={e.id} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                    <td className="font-semibold text-[var(--fr8x-jet)] flex items-center gap-2">
                      <ShieldAlert className="h-4 w-4 text-danger" />
                      {e.entityName || e.userName || "Entity"}
                    </td>
                    <td>{e.entityType || "Company"}</td>
                    <td className="text-danger font-medium">{e.reason || "—"}</td>
                    <td>{e.issuedBy || "Admin"}</td>
                    <td>{e.date || "—"}</td>
                    <td>
                      <span className="fr8x-badge-danger">{e.status || "Blacklisted"}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-caption">
                        <button className="text-[var(--fr8x-periwinkle)] hover:underline">View Appeals</button>
                        <button className="text-success hover:underline">Remove</button>
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
