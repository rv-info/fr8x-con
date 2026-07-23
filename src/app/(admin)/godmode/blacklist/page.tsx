// FR8X-CON GodMode Blacklist Management — Spec Page 11

"use client";

import { useState } from "react";
import { ShieldAlert, Plus, Search } from "lucide-react";

const mockBlacklist = Array.from({ length: 4 }, (_, i) => ({
  id: `bl-${i + 1}`,
  entityName: `Blacklisted Entity ${i + 1}`,
  entityType: i % 2 === 0 ? "Company" : "User",
  reason: ["Payment Default", "Fraudulent Listing", "Fake Documentation", "Terms Violation"][i],
  blacklistedBy: "GodMode Admin",
  dateAdded: `1${0 + i}/07/2026`,
  status: "Blacklisted",
}));

export default function GodModeBlacklistPage() {
  const [entries, setEntries] = useState(mockBlacklist);

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
                    {e.entityName}
                  </td>
                  <td>{e.entityType}</td>
                  <td className="text-danger font-medium">{e.reason}</td>
                  <td>{e.blacklistedBy}</td>
                  <td>{e.dateAdded}</td>
                  <td>
                    <span className="fr8x-badge-danger">{e.status}</span>
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
      </div>
    </div>
  );
}
