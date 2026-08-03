// FR8X-CON GodMode Peer Ratings & Review Dispute Administration
"use client";

import { useState, useEffect } from "react";
import { Award, Star, Check, X, ShieldAlert, Trash2, RefreshCw, CheckCircle2 } from "lucide-react";
import { queryDocuments, deleteDocument, setDocument, limit } from "@/lib/firebase/firestore";

type PeerReview = {
  id: string;
  targetUserId: string;
  targetUserName: string;
  targetUserCompany?: string;
  reviewerId: string;
  reviewerName: string;
  reviewerCompany?: string;
  rating: number;
  performanceCategory: string;
  title: string;
  comment: string;
  createdAt: any;
  disputed?: boolean;
  disputeReason?: string;
};

export default function GodModeReputationPage() {
  const [reviews, setReviews] = useState<PeerReview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const data = await queryDocuments<PeerReview>("peer_reviews", [limit(100)]);
      setReviews(data);
    } catch (err) {
      console.error("Error fetching peer reviews:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleRemoveReview = async (reviewId: string) => {
    if (!confirm("Are you sure you want to permanently remove this fraudulent review?")) return;
    try {
      await deleteDocument("peer_reviews", reviewId);
      setActionMsg(`Review ${reviewId.slice(0, 8)} removed successfully.`);
      fetchReviews();
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      alert("Failed to delete review.");
    }
  };

  const handleApproveDispute = async (reviewId: string) => {
    try {
      // Approving dispute means removing the unfair/fraudulent review
      await deleteDocument("peer_reviews", reviewId);
      setActionMsg(`Rating dispute approved. Fraudulent review ${reviewId.slice(0, 8)} removed.`);
      fetchReviews();
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      alert("Failed to approve dispute.");
    }
  };

  const handleRejectDispute = async (reviewId: string) => {
    try {
      await setDocument("peer_reviews", reviewId, { disputed: false, disputeReason: null }, true);
      setActionMsg(`Dispute rejected. Review maintained.`);
      fetchReviews();
      setTimeout(() => setActionMsg(null), 3000);
    } catch {
      alert("Failed to reject dispute.");
    }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center justify-between border-b border-border pb-3">
        <div>
          <h1 className="text-[14px] font-bold text-slate-900 flex items-center gap-1.5">
            <Award className="h-4 w-4 text-amber-500" />
            GodMode Reputation & Rating Dispute Administration
          </h1>
          <p className="text-[10px] text-slate-500">
            Audit peer reviews, approve rating disputes, and eliminate fraudulent feedback
          </p>
        </div>
        <button
          onClick={fetchReviews}
          className="fr8x-btn-secondary text-[10px] py-1 flex items-center gap-1"
        >
          <RefreshCw className="h-3 w-3" /> Refresh Reviews
        </button>
      </div>

      {actionMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-[10px] rounded p-2 flex items-center gap-1.5 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
          <span>{actionMsg}</span>
        </div>
      )}

      {/* Reviews Table */}
      <div className="fr8x-card bg-white overflow-hidden border border-slate-200 rounded-lg">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500 text-[10px]">Loading peer reviews...</div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-[10px]">No peer reviews found in database.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="fr8x-table">
              <thead>
                <tr>
                  <th>Target Member</th>
                  <th>Reviewer</th>
                  <th>Rating & Category</th>
                  <th>Review Title & Content</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {reviews.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                    <td>
                      <p className="font-bold text-slate-800 text-[10px]">{r.targetUserName}</p>
                      <p className="text-[8px] text-slate-500">{r.targetUserCompany}</p>
                    </td>
                    <td>
                      <p className="font-semibold text-slate-700 text-[10px]">{r.reviewerName}</p>
                      <p className="text-[8px] text-slate-400">{r.reviewerCompany}</p>
                    </td>
                    <td>
                      <div className="flex items-center gap-0.5 text-amber-400 font-bold text-[10px]">
                        <Star className="h-3 w-3 fill-amber-400" />
                        <span>{r.rating}.0</span>
                      </div>
                      <p className="text-[8px] text-slate-500">{r.performanceCategory}</p>
                    </td>
                    <td className="max-w-[250px]">
                      <p className="font-bold text-slate-800 text-[10px] truncate">{r.title}</p>
                      <p className="text-[9px] text-slate-600 line-clamp-2">{r.comment}</p>
                    </td>
                    <td>
                      {r.disputed ? (
                        <span className="inline-flex items-center gap-0.5 bg-red-50 text-red-700 text-[8px] px-1.5 py-0.5 rounded font-bold border border-red-200">
                          <ShieldAlert className="h-2.5 w-2.5" /> Disputed
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-emerald-700 text-[8px] px-1.5 py-0.5 rounded font-bold border border-emerald-200">
                          Verified Active
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {r.disputed ? (
                          <>
                            <button
                              onClick={() => handleApproveDispute(r.id)}
                              className="text-[8px] bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                              title="Approve Dispute & Remove Review"
                            >
                              <Check className="h-2.5 w-2.5" /> Approve Dispute
                            </button>
                            <button
                              onClick={() => handleRejectDispute(r.id)}
                              className="text-[8px] bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                              title="Reject Dispute"
                            >
                              <X className="h-2.5 w-2.5" /> Reject Dispute
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRemoveReview(r.id)}
                            className="text-[8px] bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"
                            title="Delete Fraudulent Review"
                          >
                            <Trash2 className="h-2.5 w-2.5" /> Remove
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
