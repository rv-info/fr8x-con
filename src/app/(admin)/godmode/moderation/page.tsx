// FR8X-CON GodMode Moderation Queue — Live Firestore Queue
"use client";

import { useState, useEffect } from "react";
import { Flag, Check, X, Loader2, ShieldCheck } from "lucide-react";
import { queryDocuments, updateDocument, deleteDocument, limit, orderBy } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { logAuditAction } from "@/lib/utils/auditLogger";

type ModItem = {
  id: string;
  authorName: string;
  contentType: string;
  reason: string;
  flaggedBy: string;
  contentSnippet: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
  targetCollection?: string;
  targetDocId?: string;
};

export default function GodModeModerationPage() {
  const [items, setItems] = useState<ModItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      const data = await queryDocuments<ModItem>(COLLECTIONS.MODERATION, [
        orderBy("createdAt", "desc"),
        limit(100),
      ]);
      setItems(data);
    } catch {
      setItems([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleAction = async (item: ModItem, action: "approve" | "remove") => {
    try {
      if (action === "remove" && item.targetCollection && item.targetDocId) {
        await deleteDocument(item.targetCollection, item.targetDocId);
      }
      await updateDocument(COLLECTIONS.MODERATION, item.id, {
        status: action === "approve" ? "dismissed" : "actioned",
        resolvedBy: "GODMODE_ADMIN",
        resolvedAt: new Date().toISOString(),
      });
      await logAuditAction({
        action: action === "approve" ? "MODERATION_DISMISSED" : "MODERATION_CONTENT_REMOVED",
        module: "Moderation Queue",
        details: `Moderation report ${item.id} actioned: ${action}`,
      });
      setItems((prev) => prev.filter((i) => i.id !== item.id));
      setStatusMsg(`Report ${item.id} ${action === "approve" ? "dismissed" : "actioned & content removed"}.`);
      setTimeout(() => setStatusMsg(null), 3000);
    } catch (err) {
      console.error("Moderation action failed:", err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Moderation Queue</h1>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Review reported posts, comments, rates, and platform content
          </p>
        </div>
        <button
          onClick={fetchReports}
          className="fr8x-btn-secondary text-[10px] py-1 flex items-center gap-1"
        >
          Refresh Queue
        </button>
      </div>

      {statusMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] rounded p-2 flex items-center gap-1.5 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="fr8x-card p-12 text-center flex items-center justify-center gap-2 text-foreground-muted">
            <Loader2 className="h-4 w-4 animate-spin text-[var(--fr8x-periwinkle)]" />
            <span>Loading moderation items...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="fr8x-card p-12 text-center text-foreground-muted">
            No pending moderation reports. Platform content is clean.
          </div>
        ) : (
          items.map((item) => (
            <div key={item.id} className="fr8x-card p-5 bg-white space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="fr8x-badge-danger flex items-center gap-1">
                    <Flag className="h-3 w-3" /> {item.contentType}
                  </span>
                  <span className="text-body-sm font-semibold text-[var(--fr8x-jet)]">
                    Reported by {item.flaggedBy}
                  </span>
                </div>
                <span className="text-caption text-foreground-muted">
                  {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleString() : "Just now"}
                </span>
              </div>

              <div className="p-3 bg-[var(--fr8x-mist)] rounded-md">
                <p className="text-caption text-foreground-secondary font-medium mb-1">
                  Reason: <span className="text-danger font-semibold">{item.reason}</span>
                </p>
                <p className="text-body-sm text-[var(--fr8x-jet)]">{item.contentSnippet}</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleAction(item, "approve")}
                  className="fr8x-btn-secondary text-caption flex items-center gap-1 text-success-dark hover:bg-success-light"
                >
                  <Check className="h-3.5 w-3.5" /> Dismiss &amp; Keep
                </button>
                <button
                  onClick={() => handleAction(item, "remove")}
                  className="fr8x-btn-primary bg-danger hover:bg-danger-dark text-caption flex items-center gap-1"
                >
                  <X className="h-3.5 w-3.5" /> Remove Content
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
