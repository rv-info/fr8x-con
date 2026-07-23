// FR8X-CON GodMode Moderation Queue — Spec Page 11

"use client";

import { useState } from "react";
import { Flag, Check, X, AlertTriangle } from "lucide-react";

const mockFlagged = Array.from({ length: 5 }, (_, i) => ({
  id: `mod-${i + 1}`,
  authorName: `User ${i + 1}`,
  contentType: ["Post", "Comment", "Rate Entry", "Profile"][i % 4],
  reason: ["Spam", "Misleading Information", "Copyright Infringement", "Harassment", "Fake Pricing"][i % 5],
  flaggedBy: `User ${i + 10}`,
  contentSnippet: `Reported content snippet #${i + 1}...`,
  timestamp: `${i + 1}h ago`,
}));

export default function GodModeModerationPage() {
  const [items, setItems] = useState(mockFlagged);

  const handleAction = (id: string, action: "approve" | "remove") => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Moderation Queue</h1>
        <p className="text-body-sm text-foreground-secondary mt-1">
          Review reported posts, comments, rates, and platform content
        </p>
      </div>

      <div className="space-y-4">
        {items.length === 0 ? (
          <div className="fr8x-card p-12 text-center text-foreground-muted">
            No pending moderation reports.
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
                <span className="text-caption text-foreground-muted">{item.timestamp}</span>
              </div>

              <div className="p-3 bg-[var(--fr8x-mist)] rounded-md">
                <p className="text-caption text-foreground-secondary font-medium mb-1">
                  Reason: <span className="text-danger font-semibold">{item.reason}</span>
                </p>
                <p className="text-body-sm text-[var(--fr8x-jet)]">{item.contentSnippet}</p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  onClick={() => handleAction(item.id, "approve")}
                  className="fr8x-btn-secondary text-caption flex items-center gap-1 text-success-dark hover:bg-success-light"
                >
                  <Check className="h-3.5 w-3.5" /> Keep Content
                </button>
                <button
                  onClick={() => handleAction(item.id, "remove")}
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
