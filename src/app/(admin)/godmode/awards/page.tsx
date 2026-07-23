// FR8X-CON GodMode Awards Management — Spec Page 11

"use client";

import { useState } from "react";
import { Award, Plus, CheckCircle, Search } from "lucide-react";

const mockAwards = Array.from({ length: 5 }, (_, i) => ({
  id: `award-${i + 1}`,
  title: ["Top Forwarder 2026", "Fastest Response Award", "Best Ocean Rates", "Highest Acceptance Rate", "Trusted Partner"][i],
  recipient: `Company ${String.fromCharCode(65 + i)}`,
  category: ["Freight Forwarder", "NVOCC", "Carrier", "CHA", "Transporter"][i],
  issuedDate: `1${5 + i}/07/2026`,
  status: "Active",
}));

export default function GodModeAwardsPage() {
  const [awards, setAwards] = useState(mockAwards);

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
        <div className="overflow-x-auto">
          <table className="fr8x-table">
            <thead>
              <tr>
                <th>Award Title</th>
                <th>Recipient</th>
                <th>Category</th>
                <th>Issued Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {awards.map((a) => (
                <tr key={a.id} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                  <td className="font-semibold text-[var(--fr8x-jet)] flex items-center gap-2">
                    <Award className="h-4 w-4 text-warning" />
                    {a.title}
                  </td>
                  <td>{a.recipient}</td>
                  <td>{a.category}</td>
                  <td>{a.issuedDate}</td>
                  <td>
                    <span className="fr8x-badge-active">{a.status}</span>
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
      </div>
    </div>
  );
}
