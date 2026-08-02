"use client";

import { useState } from "react";
import { X, Megaphone, CheckCircle2, Loader2, Upload } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { setDocument, getDocRef, serverTimestamp } from "@/lib/firebase/firestore";
import { validateContentModeration } from "@/lib/security/contentModeration";

interface AdRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdRequestModal({ isOpen, onClose }: AdRequestModalProps) {
  const { user } = useAuth();
  const [adTitle, setAdTitle] = useState("");
  const [shortDescription, setShortDescription] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [contactEmail, setContactEmail] = useState(user?.email || "");
  const [mediaUrl, setMediaUrl] = useState("");
  const [ctaText, setCtaText] = useState("Learn More");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!adTitle.trim() || !destinationUrl.trim() || !contactEmail.trim()) {
      setErrorMsg("Please fill in all required fields (Ad Title, Destination URL, Contact Email).");
      return;
    }

    // Security & content moderation
    const modResult = validateContentModeration(`${adTitle} ${shortDescription}`);
    if (!modResult.isClean) {
      setErrorMsg(modResult.flaggedReason || "Submitted content contains forbidden language.");
      return;
    }

    setIsSubmitting(true);
    try {
      const docRef = getDocRef("ad_requests");
      await setDocument("ad_requests", docRef.id, {
        id: docRef.id,
        userId: user?.uid || "guest",
        adName: adTitle.trim(),
        title: adTitle.trim(),
        type: mediaUrl ? "image" : "html",
        mediaUrl: mediaUrl.trim() || null,
        shortDescription: shortDescription.trim(),
        destinationUrl: destinationUrl.trim(),
        targetType: destinationUrl.startsWith("http") ? "external" : "internal",
        openMode: "new_tab",
        ctaText: ctaText.trim() || "Learn More",
        companyName: companyName.trim() || "Verified Partner",
        contactEmail: contactEmail.trim(),
        status: "pending", // Strictly pending until GODMODE approval
        impressions: 0,
        uniqueViews: 0,
        clicks: 0,
        ctr: 0,
        createdAt: serverTimestamp(),
      });

      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 2500);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to submit ad request. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-5 shadow-2xl border border-border">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <h3 className="text-body-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-[var(--fr8x-periwinkle)]" />
            Submit Enterprise Ad Request
          </h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-2">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto animate-bounce" />
            <h4 className="text-body-md font-bold text-slate-900">Ad Request Submitted!</h4>
            <p className="text-caption text-slate-600 max-w-xs mx-auto">
              Your advertisement request is now queued for GODMODE admin review. Once approved, it will automatically go live.
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
              <label className="fr8x-label text-[11px] font-semibold">Ad Headline / Title *</label>
              <input
                type="text"
                value={adTitle}
                onChange={(e) => setAdTitle(e.target.value)}
                placeholder="e.g. Special Asia-Europe Container Rates"
                className="fr8x-input text-[11px] mt-1"
                required
              />
            </div>

            <div>
              <label className="fr8x-label text-[11px] font-semibold">Short Description</label>
              <textarea
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Describe your logistics offering or service highlights..."
                rows={2}
                className="fr8x-input text-[11px] mt-1 resize-none"
                maxLength={200}
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="fr8x-label text-[11px] font-semibold">Destination URL *</label>
                <input
                  type="text"
                  value={destinationUrl}
                  onChange={(e) => setDestinationUrl(e.target.value)}
                  placeholder="https://yourwebsite.com"
                  className="fr8x-input text-[11px] mt-1"
                  required
                />
              </div>

              <div>
                <label className="fr8x-label text-[11px] font-semibold">CTA Button Text</label>
                <input
                  type="text"
                  value={ctaText}
                  onChange={(e) => setCtaText(e.target.value)}
                  placeholder="Learn More"
                  className="fr8x-input text-[11px] mt-1"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="fr8x-label text-[11px] font-semibold">Company Name</label>
                <input
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  placeholder="e.g. Global Freight Ltd"
                  className="fr8x-input text-[11px] mt-1"
                />
              </div>

              <div>
                <label className="fr8x-label text-[11px] font-semibold">Contact Email *</label>
                <input
                  type="email"
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                  placeholder="billing@company.com"
                  className="fr8x-input text-[11px] mt-1"
                  required
                />
              </div>
            </div>

            <div>
              <label className="fr8x-label text-[11px] font-semibold">Banner Image URL (Optional)</label>
              <input
                type="text"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://domain.com/banner.png"
                className="fr8x-input text-[11px] mt-1"
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
                  <>Submit for Approval</>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
