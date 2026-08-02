"use client";

import { useState } from "react";
import { AlertTriangle, X, CheckCircle2, Loader2 } from "lucide-react";
import { setDocument, getDocRef, serverTimestamp } from "@/lib/firebase/firestore";
import { useAuth } from "@/providers/AuthProvider";

interface AuctionDisputeModalProps {
  isOpen: boolean;
  onClose: () => void;
  auctionId: string;
  auctionTitle?: string;
  userRoleType: "posting_party" | "bidding_party";
}

export const AUTHENTICITY_CONCERN_REASONS = [
  { id: "not_awarded", label: "Shipment was not actually awarded as declared" },
  { id: "failed_to_provide", label: "Forwarder / NVOCC failed to provide the agreed shipment" },
  { id: "booking_failed", label: "Carrier booking could not be arranged after award" },
];

export function AuctionDisputeModal({
  isOpen,
  onClose,
  auctionId,
  auctionTitle,
  userRoleType,
}: AuctionDisputeModalProps) {
  const { user } = useAuth();
  const [selectedReason, setSelectedReason] = useState(AUTHENTICITY_CONCERN_REASONS[0]?.id || "not_awarded");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const docRef = getDocRef("auction_disputes");
      await setDocument("auction_disputes", docRef.id, {
        id: docRef.id,
        auctionId,
        auctionTitle: auctionTitle || "Reverse Auction",
        raisedByUserId: user?.uid || "guest",
        raisedByEmail: user?.email || "",
        userRoleType,
        reasonId: selectedReason,
        reasonLabel: AUTHENTICITY_CONCERN_REASONS.find((r) => r.id === selectedReason)?.label,
        description: description.trim(),
        status: "under_review",
        createdAt: serverTimestamp(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit authenticity concern. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-body-md font-bold text-red-600 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            Raise Authenticity Concern / Dispute
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-body-md font-bold text-slate-900">Dispute Report Logged</h4>
            <p className="text-caption text-slate-600">
              GODMODE trust & safety team has received your report and will verify the shipment details.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-4 space-y-3">
            {errorMsg && (
              <div className="p-2 rounded bg-red-50 text-red-700 text-caption font-semibold border border-red-200">
                {errorMsg}
              </div>
            )}

            <div>
              <label className="fr8x-label text-[11px] font-semibold">Select Authenticity Concern *</label>
              <div className="mt-2 space-y-2">
                {AUTHENTICITY_CONCERN_REASONS.map((r) => (
                  <label
                    key={r.id}
                    className={`flex items-start gap-2.5 p-2 rounded-lg border text-[11px] cursor-pointer transition-colors ${
                      selectedReason === r.id
                        ? "bg-red-50/70 border-red-300 text-red-900 font-semibold"
                        : "bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100"
                    }`}
                  >
                    <input
                      type="radio"
                      name="dispute_reason"
                      checked={selectedReason === r.id}
                      onChange={() => setSelectedReason(r.id)}
                      className="mt-0.5"
                    />
                    <span>{r.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label className="fr8x-label text-[11px] font-semibold">Additional Details / Evidence Note</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide reference numbers, communication notes, or details..."
                rows={3}
                className="fr8x-input text-[11px] mt-1 resize-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="fr8x-btn-secondary text-[11px] px-3 py-1.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[11px] px-4 py-1.5 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>Submit Dispute Concern</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
