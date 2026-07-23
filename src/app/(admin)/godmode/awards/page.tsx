// FR8X-CON GodMode Awards Management

"use client";

import { useState, useEffect } from "react";
import { Award, Plus, Loader2 } from "lucide-react";
import { queryDocuments, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

type AwardAdmin = {
  id: string;
  title?: string;
  category?: string;
  recipientName?: string;
  year?: number;
  quarter?: number;
  status?: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

export default function GodModeAwardsPage() {
  const [awards, setAwards] = useState<AwardAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchAwards() {
      setIsLoading(true);
      try {
        const data = await queryDocuments<AwardAdmin>(COLLECTIONS.AWARDS, [limit(50)]);
        setAwards(data);
      } catch (err) {
        console.error("Error fetching admin awards:", err);
        setAwards([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchAwards();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Awards Management</h1>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Create, issue, and manage platform recognition awards and badges
          </p>
        </div>
        <button className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Issue Award
        </button>
      </div>

      <div className="fr8x-card bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
            <span className="text-[11px] text-foreground-muted">Loading awards...</span>
          </div>
        ) : awards.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-body-sm text-foreground-secondary">No awards created yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="fr8x-table">
              <thead>
                <tr>
                  <th>Award Title</th>
                  <th>Recipient</th>
                  <th>Category</th>
                  <th>Period</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {awards.map((a) => (
                  <tr key={a.id} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                    <td className="font-semibold text-[var(--fr8x-jet)] flex items-center gap-2">
                      <Award className="h-4 w-4 text-warning" />
                      {a.title || a.category || "Award"}
                    </td>
                    <td>{a.recipientName || "—"}</td>
                    <td>{a.category || "—"}</td>
                    <td>{a.quarter ? `Q${a.quarter} ` : ""}{a.year || "—"}</td>
                    <td>
                      <span className="fr8x-badge-active">{a.status || "Active"}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-caption">
                        <button className="text-[var(--fr8x-periwinkle)] hover:underline">Edit</button>
                        <button className="text-danger hover:underline">Revoke</button>
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
