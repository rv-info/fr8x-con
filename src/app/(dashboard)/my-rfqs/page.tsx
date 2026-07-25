// FR8X-CON My RFQs Page
// Displays all logistics RFQs/Auctions created by the current user.

"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { FileText, Loader2, Plus, Gavel, MapPin, Calendar } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { COLLECTIONS, ROUTES } from "@/lib/utils/constants";
import { queryDocuments, where, orderBy, limit } from "@/lib/firebase/firestore";

interface RFQData {
  id: string;
  title: string;
  status: string;
  pol: string;
  pod: string;
  shipmentType: string;
  serviceType: string;
  creatorId: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
}

export default function MyRFQsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [rfqs, setRfqs] = useState<RFQData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRFQs = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const data = await queryDocuments<RFQData>(COLLECTIONS.AUCTIONS, [
        where("creatorId", "==", user.uid),
      ]);
      // Sort client-side by createdAt descending
      data.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });
      setRfqs(data);
    } catch (err) {
      console.error("Error loading My RFQs:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchRFQs();
  }, [fetchRFQs]);

  return (
    <div className="space-y-4 py-3 min-h-screen bg-[var(--fr8x-bg)]">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-heading-md font-semibold text-[var(--fr8x-jet)]">My RFQs</h1>
          <p className="text-caption text-foreground-secondary">Manage your cargo requirements and active reverse auctions</p>
        </div>
        <button
          onClick={() => router.push(ROUTES.AUCTION_CREATE)}
          className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] text-[11px] py-1 flex items-center gap-1.5 shadow-sm"
        >
          <Plus className="h-4 w-4" /> Create RFQ
        </button>
      </div>

      {isLoading ? (
        <div className="fr8x-card bg-white p-12 text-center flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--fr8x-periwinkle)]" />
          <span className="text-body-sm text-foreground-secondary">Loading your RFQs...</span>
        </div>
      ) : rfqs.length === 0 ? (
        <div className="fr8x-card bg-white p-10 text-center space-y-3">
          <FileText className="h-10 w-10 text-slate-300 mx-auto" />
          <div>
            <p className="text-body-sm font-bold text-[var(--fr8x-jet)]">No RFQs found</p>
            <p className="text-caption text-foreground-muted mt-0.5">
              You haven&apos;t created any freight reverse auctions or RFQs yet.
            </p>
          </div>
          <button
            onClick={() => router.push(ROUTES.AUCTION_CREATE)}
            className="fr8x-btn-secondary text-[11px] py-1 mx-auto"
          >
            Place your first RFQ
          </button>
        </div>
      ) : (
        <div className="bg-white fr8x-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="fr8x-table-compact w-full text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-border text-[9px] font-bold uppercase text-foreground-muted">
                  <th className="p-3">RFQ ID</th>
                  <th className="p-3">Title / Requirement</th>
                  <th className="p-3">Route (POL → POD)</th>
                  <th className="p-3">Mode</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-[10px] text-[var(--fr8x-jet)]">
                {rfqs.map((rfq) => (
                  <tr key={rfq.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-mono font-bold text-[var(--fr8x-periwinkle)]">
                      #{rfq.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td className="p-3 font-semibold">{rfq.title}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-slate-400" />
                        <span>{rfq.pol || "Origin"} → {rfq.pod || "Destination"}</span>
                      </div>
                    </td>
                    <td className="p-3">{rfq.shipmentType} ({rfq.serviceType})</td>
                    <td className="p-3">
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${
                        rfq.status === "active"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          : rfq.status === "draft"
                          ? "bg-slate-100 text-slate-600 border border-slate-200"
                          : "bg-red-50 text-red-700 border border-red-100"
                      }`}>
                        {rfq.status}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => router.push(ROUTES.AUCTION_DETAIL(rfq.id))}
                        className="text-[10px] text-[var(--fr8x-periwinkle)] hover:underline font-bold"
                      >
                        Monitor Live Bids
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
