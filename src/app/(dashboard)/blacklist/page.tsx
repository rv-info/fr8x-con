// FR8X-CON Blacklist Page

"use client";

import { Search, Filter, AlertTriangle, FileText } from "lucide-react";
import { cn } from "@/lib/utils/cn";

const MOCK_BLACKLIST = [
  { id: "1", userName: "Company Alpha", reason: "Non-compliance with bid terms", issuedBy: "Admin", date: "2024-06-15", appealStatus: "none" },
  { id: "2", userName: "Freight Beta Ltd", reason: "Repeated payment defaults", issuedBy: "Admin", date: "2024-05-20", appealStatus: "pending" },
  { id: "3", userName: "Cargo Services Co", reason: "Fraudulent documentation", issuedBy: "Admin", date: "2024-04-10", appealStatus: "denied" },
];

export default function BlacklistPage() {
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
          <input placeholder="Search blacklist entries..." className="fr8x-input pl-10" />
        </div>
        <button className="fr8x-btn-secondary flex items-center gap-2 px-4">
          <Filter className="h-4 w-4" />
          Filters
        </button>
      </div>

      <div className="fr8x-card overflow-hidden">
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
              {MOCK_BLACKLIST.map((entry) => (
                <tr key={entry.id}>
                  <td className="font-medium">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-danger" />
                      {entry.userName}
                    </div>
                  </td>
                  <td className="max-w-xs truncate">{entry.reason}</td>
                  <td>{entry.issuedBy}</td>
                  <td>{entry.date}</td>
                  <td>
                    <span className={cn(
                      "fr8x-badge",
                      entry.appealStatus === "none" ? "fr8x-badge-danger" :
                      entry.appealStatus === "pending" ? "fr8x-badge-pending" :
                      "fr8x-badge-danger"
                    )}>
                      {entry.appealStatus === "none" ? "No Appeal" : entry.appealStatus}
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
      </div>
    </div>
  );
}
