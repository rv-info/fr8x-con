"use client";

import { useState } from "react";
import { Star, X, CheckCircle2, Loader2, Award } from "lucide-react";
import { setDocument, getDocRef, serverTimestamp } from "@/lib/firebase/firestore";
import { useAuth } from "@/providers/AuthProvider";

interface PeerReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
  targetUserCompany?: string;
  onSuccess?: () => void;
}

export function PeerReviewModal({
  isOpen,
  onClose,
  targetUserId,
  targetUserName,
  targetUserCompany,
  onSuccess,
}: PeerReviewModalProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(5);
  const [performanceCategory, setPerformanceCategory] = useState("Ocean Freight Operations");
  const [reviewTitle, setReviewTitle] = useState("");
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!reviewTitle.trim() || !commentText.trim()) {
      setErrorMsg("Please fill in Review Title and Detailed Comments.");
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = getDocRef("peer_reviews");
      await setDocument("peer_reviews", docRef.id, {
        id: docRef.id,
        targetUserId,
        targetUserName,
        targetUserCompany: targetUserCompany || "Verified Logistics Partner",
        reviewerId: user?.uid || "guest",
        reviewerName: user?.displayName || "Logistics Evaluator",
        reviewerCompany: (user as any)?.companyName || "Enterprise Buyer",
        rating,
        performanceCategory,
        title: reviewTitle.trim(),
        comment: commentText.trim(),
        createdAt: serverTimestamp(),
      });

      setIsSuccess(true);
      if (onSuccess) onSuccess();
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2000);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit peer review. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm p-4 text-left">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-xl border border-slate-300">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-body-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
            <Award className="h-5 w-5 text-amber-500" />
            Submit Peer Review for {targetUserName}
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-body-md font-bold text-slate-900">Peer Review Submitted!</h4>
            <p className="text-caption text-slate-600">
              Your feedback is now recorded and added to partner profile performance metrics.
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
              <label className="fr8x-label text-[11px] font-semibold">Overall Performance Rating *</label>
              <div className="flex items-center gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 text-amber-400 hover:scale-110 transition-transform"
                  >
                    <Star className={`h-6 w-6 ${star <= rating ? "fill-amber-400" : "text-slate-300"}`} />
                  </button>
                ))}
                <span className="text-[12px] font-bold text-slate-700 ml-2">{rating}.0 / 5.0 Stars</span>
              </div>
            </div>

            <div>
              <label className="fr8x-label text-[11px] font-semibold">Performance Category</label>
              <select
                value={performanceCategory}
                onChange={(e) => setPerformanceCategory(e.target.value)}
                className="fr8x-input text-[11px] mt-1"
              >
                <option value="Ocean Freight Operations">Ocean Freight Operations</option>
                <option value="Customs Clearance & Documentation">Customs Clearance & Documentation</option>
                <option value="Air Cargo Expediting">Air Cargo Expediting</option>
                <option value="Rate Competitiveness">Rate Competitiveness</option>
                <option value="On-Time Delivery Reliability">On-Time Delivery Reliability</option>
              </select>
            </div>

            <div>
              <label className="fr8x-label text-[11px] font-semibold">Review Headline / Summary *</label>
              <input
                type="text"
                value={reviewTitle}
                onChange={(e) => setReviewTitle(e.target.value)}
                placeholder="e.g. Excellent ocean freight execution and prompt documentation"
                className="fr8x-input text-[11px] mt-1"
                required
              />
            </div>

            <div>
              <label className="fr8x-label text-[11px] font-semibold">Detailed Comments & Feedback *</label>
              <textarea
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Describe your working experience with this partner..."
                rows={3}
                className="fr8x-input text-[11px] mt-1 resize-none"
                required
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
                className="fr8x-btn-primary text-[11px] px-4 py-1.5 flex items-center gap-1.5"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" /> Submitting...
                  </>
                ) : (
                  <>Submit Peer Review</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
