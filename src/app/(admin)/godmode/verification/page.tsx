// FR8X-CON GodMode Enterprise Text KYC Approval Dashboard
// Review 15-field text onboarding applications. GodMode is the ONLY approval authority.
"use client";

import { useState, useEffect } from "react";
import { ShieldCheck, Check, X, Building2, RefreshCw, FileText } from "lucide-react";
import { queryDocuments, setDocument, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

type KYCRequest = {
  id: string;
  userId: string;
  companyName: string;
  registrationNumber: string;
  gstNumber: string;
  panNumber: string;
  address: string;
  country: string;
  city: string;
  contactPerson: string;
  phone: string;
  email: string;
  website: string;
  businessType: string;
  yearsInBusiness: string;
  employees: string;
  annualTurnover: string;
  status: "pending" | "approved" | "rejected";
  submittedAt: string;
};

export default function GodModeVerificationPage() {
  const [requests, setRequests] = useState<KYCRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<KYCRequest | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchKycRequests = async () => {
    setIsLoading(true);
    try {
      const data = await queryDocuments<KYCRequest>("kyc_requests", [limit(100)]);
      setRequests(data);
    } catch (err) {
      console.error("Error fetching KYC requests:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchKycRequests();
  }, []);

  const handleApproveKyc = async (req: KYCRequest) => {
    try {
      const approvedAt = new Date().toISOString();

      // 1. Update kyc_requests collection
      await setDocument("kyc_requests", req.id, {
        status: "approved",
        approvedBy: "GODMODE_ADMIN",
        approvedAt,
      }, true);

      // 2. Update company document
      await setDocument(COLLECTIONS.COMPANIES, req.id, {
        kycStatus: "approved",
        kycApprovedBy: "GODMODE_ADMIN",
        kycApprovedAt: approvedAt,
      }, true);

      // 3. Update user and profile document
      await setDocument(COLLECTIONS.USERS, req.userId, {
        kycStatus: "verified",
        kycApprovedBy: "GODMODE_ADMIN",
        kycApprovedAt: approvedAt,
        verifiedBadge: true,
      }, true);

      await setDocument(COLLECTIONS.PROFILES, req.userId, {
        kycStatus: "verified",
        verifiedBadge: true,
      }, true);

      setActionMsg(`KYC Approved for ${req.companyName}! User ${req.userId.slice(0, 8)} verified.`);
      setSelectedReq(null);
      fetchKycRequests();
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      alert("Failed to approve KYC.");
    }
  };

  const handleRejectKyc = async (req: KYCRequest) => {
    const reason = prompt("Enter rejection reason for client:") || "Document verification details invalid.";
    try {
      const rejectedAt = new Date().toISOString();

      await setDocument("kyc_requests", req.id, {
        status: "rejected",
        rejectedBy: "GODMODE_ADMIN",
        rejectionReason: reason,
        rejectedAt,
      }, true);

      await setDocument(COLLECTIONS.COMPANIES, req.id, {
        kycStatus: "rejected",
        rejectionReason: reason,
      }, true);

      await setDocument(COLLECTIONS.USERS, req.userId, {
        kycStatus: "rejected",
      }, true);

      setActionMsg(`KYC Application Rejected for ${req.companyName}.`);
      setSelectedReq(null);
      fetchKycRequests();
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      alert("Failed to reject KYC.");
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-[14px] font-bold text-slate-900 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            GodMode Enterprise KYC Approval Dashboard
          </h1>
          <p className="text-[10px] text-slate-500">
            Manual review authority for 15-field text business onboarding applications (Zero auto-approvals)
          </p>
        </div>
        <button
          onClick={fetchKycRequests}
          className="fr8x-btn-secondary text-[10px] py-1 flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" /> Refresh Applications
        </button>
      </div>

      {actionMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] rounded p-2 flex items-center gap-1.5 font-medium">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Applications List */}
        <div className="lg:col-span-1 fr8x-card bg-white p-3 border border-slate-200 rounded-lg space-y-2 max-h-[75vh] overflow-y-auto">
          <p className="text-[11px] font-bold text-slate-800 border-b border-border pb-1">
            Applications ({requests.length})
          </p>

          {isLoading ? (
            <div className="p-6 text-center text-slate-400 text-[10px]">Loading KYC queue...</div>
          ) : requests.length === 0 ? (
            <div className="p-6 text-center text-slate-400 text-[10px]">No pending KYC applications.</div>
          ) : (
            requests.map((r) => (
              <div
                key={r.id}
                onClick={() => setSelectedReq(r)}
                className={`p-2.5 rounded-lg border text-left cursor-pointer transition-all ${
                  selectedReq?.id === r.id
                    ? "border-[var(--fr8x-periwinkle)] bg-[var(--fr8x-mist)]"
                    : "border-slate-200 bg-white hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-900 text-[10px] truncate">{r.companyName}</p>
                  <span className={`text-[8px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    r.status === "approved"
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : r.status === "rejected"
                      ? "bg-red-50 text-red-700 border border-red-200"
                      : "bg-amber-50 text-amber-700 border border-amber-200"
                  }`}>
                    {r.status}
                  </span>
                </div>
                <p className="text-[8px] text-slate-500 mt-0.5">{r.contactPerson} • {r.city}, {r.country}</p>
                <p className="text-[8px] text-slate-400 font-mono mt-0.5">GST: {r.gstNumber}</p>
              </div>
            ))
          )}
        </div>

        {/* Inspection Pane */}
        <div className="lg:col-span-2 fr8x-card bg-white p-4 border border-slate-200 rounded-lg">
          {!selectedReq ? (
            <div className="p-12 text-center text-slate-400 text-[10px] space-y-2">
              <Building2 className="h-10 w-10 text-slate-300 mx-auto" />
              <p className="font-semibold">Select an onboarding application from the left pane to inspect all 15 fields.</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div>
                  <h2 className="text-[12px] font-bold text-slate-900">{selectedReq.companyName}</h2>
                  <p className="text-[9px] text-slate-500">Submitted: {new Date(selectedReq.submittedAt).toLocaleString()}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleApproveKyc(selectedReq)}
                    className="fr8x-btn-primary bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] px-3 py-1 flex items-center gap-1 font-bold"
                  >
                    <Check className="h-3 w-3" /> Approve KYC
                  </button>
                  <button
                    onClick={() => handleRejectKyc(selectedReq)}
                    className="fr8x-btn-secondary text-red-600 border-red-200 hover:bg-red-50 text-[10px] px-3 py-1 flex items-center gap-1 font-bold"
                  >
                    <X className="h-3 w-3" /> Reject
                  </button>
                </div>
              </div>

              {/* 15 Text Fields Full Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-[10px] bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div><span className="font-bold text-slate-500">1. Company Name:</span> {selectedReq.companyName}</div>
                <div><span className="font-bold text-slate-500">2. Reg Number:</span> <span className="font-mono">{selectedReq.registrationNumber}</span></div>
                <div><span className="font-bold text-slate-500">3. GST Number:</span> <span className="font-mono">{selectedReq.gstNumber}</span></div>
                <div><span className="font-bold text-slate-500">4. PAN Number:</span> <span className="font-mono">{selectedReq.panNumber}</span></div>
                <div className="sm:col-span-2"><span className="font-bold text-slate-500">5. Registered Address:</span> {selectedReq.address}</div>
                <div><span className="font-bold text-slate-500">6. Country:</span> {selectedReq.country}</div>
                <div><span className="font-bold text-slate-500">7. City:</span> {selectedReq.city}</div>
                <div><span className="font-bold text-slate-500">8. Contact Person:</span> {selectedReq.contactPerson}</div>
                <div><span className="font-bold text-slate-500">9. Phone:</span> {selectedReq.phone}</div>
                <div><span className="font-bold text-slate-500">10. Email:</span> {selectedReq.email}</div>
                <div><span className="font-bold text-slate-500">11. Website:</span> {selectedReq.website || "N/A"}</div>
                <div><span className="font-bold text-slate-500">12. Business Type:</span> {selectedReq.businessType}</div>
                <div><span className="font-bold text-slate-500">13. Years in Business:</span> {selectedReq.yearsInBusiness} Years</div>
                <div><span className="font-bold text-slate-500">14. Employees:</span> {selectedReq.employees}</div>
                <div><span className="font-bold text-slate-500">15. Annual Turnover:</span> {selectedReq.annualTurnover}</div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
