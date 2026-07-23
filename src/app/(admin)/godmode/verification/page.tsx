// FR8X-CON GodMode Verification Requests — Spec Page 11

"use client";

import { useState } from "react";
import { CheckSquare, Check, X, FileText } from "lucide-react";

const mockRequests = Array.from({ length: 4 }, (_, i) => ({
  id: `ver-${i + 1}`,
  companyName: `Applicant Company ${i + 1}`,
  taxId: `GSTIN29ABCDE1234F${i}`,
  contactPerson: `Manager ${i + 1}`,
  email: `admin@company${i + 1}.com`,
  submittedOn: `2${0 + i}/07/2026`,
}));

export default function GodModeVerificationPage() {
  const [requests, setRequests] = useState(mockRequests);

  const handleVerify = (id: string, approve: boolean) => {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Verification Requests</h1>
        <p className="text-body-sm text-foreground-secondary mt-1">
          Review business registration documents and issue verified badges
        </p>
      </div>

      <div className="fr8x-card bg-white overflow-hidden">
        <div className="overflow-x-auto">
          <table className="fr8x-table">
            <thead>
              <tr>
                <th>Company Name</th>
                <th>GST / Tax ID</th>
                <th>Contact Person</th>
                <th>Email</th>
                <th>Submitted On</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {requests.map((r) => (
                <tr key={r.id} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                  <td className="font-semibold text-[var(--fr8x-jet)]">{r.companyName}</td>
                  <td>{r.taxId}</td>
                  <td>{r.contactPerson}</td>
                  <td>{r.email}</td>
                  <td>{r.submittedOn}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleVerify(r.id, true)}
                        className="fr8x-btn-primary bg-success hover:bg-success-dark text-caption px-2.5 py-1 flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" /> Approve
                      </button>
                      <button
                        onClick={() => handleVerify(r.id, false)}
                        className="fr8x-btn-ghost text-danger text-caption px-2.5 py-1 flex items-center gap-1"
                      >
                        <X className="h-3 w-3" /> Reject
                      </button>
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
