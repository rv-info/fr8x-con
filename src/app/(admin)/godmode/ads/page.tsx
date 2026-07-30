// FR8X-CON GodMode Enterprise Advertisement Wizard & Targeting Control Panel
// Firestore-backed: campaigns persist across sessions, real-time sync.
"use client";

import { useState, useEffect } from "react";
import { AdBanner, DEFAULT_ENTERPRISE_AD, type AdvertisementDoc, type TargetAudienceRules } from "@/components/ads/AdBanner";
import { subscribeToQuery, setDocument, updateDocument, deleteDocument } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { Button } from "@/components/ui/Button";
import {
  Megaphone,
  Plus,
  Trash2,
  Eye,
  MousePointer,
  TrendingUp,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Info,
  Monitor,
  Smartphone,
  Tablet,
  CheckCircle,
  Globe,
  Sliders,
  Filter,
  Check,
  X,
} from "lucide-react";



const FIRESTORE_ADS_COLLECTION = COLLECTIONS.ADS || "ads";

export default function GodModeAdsPage() {
  const [ads, setAds] = useState<AdvertisementDoc[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // Subscribe to Firestore ads collection in real-time
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToQuery<AdvertisementDoc>(
      FIRESTORE_ADS_COLLECTION,
      [],
      (data: AdvertisementDoc[]) => {
        setAds(data);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // Device Preview Modal State
  const [previewAd, setPreviewAd] = useState<AdvertisementDoc | null>(null);
  const [previewDevice, setPreviewDevice] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Wizard Form Steps State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [adName, setAdName] = useState("");
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"image" | "carousel" | "html" | "rich_text" | "video">("image");
  const [shortDescription, setShortDescription] = useState("");
  const [destinationUrl, setDestinationUrl] = useState("/auctions");
  const [targetType, setTargetType] = useState<"internal" | "external">("internal");
  const [openMode, setOpenMode] = useState<"new_tab" | "inside_app">("inside_app");
  const [ctaText, setCtaText] = useState("Learn More");
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  // Media & Layout State
  const [mediaUrl, setMediaUrl] = useState("");
  const [clickBehavior, setClickBehavior] = useState<"entire_banner" | "cta_only">("cta_only");
  const [isPortrait, setIsPortrait] = useState(false);
  const [mediaFit, setMediaFit] = useState<"cover" | "contain" | "fill">("cover");
  // Audience Targeting State
  const [targetCountry, setTargetCountry] = useState("All");
  const [targetBusinessType, setTargetBusinessType] = useState("All");
  const [targetPlan, setTargetPlan] = useState("All");
  const [targetDevice, setTargetDevice] = useState<"all" | "desktop" | "mobile" | "tablet">("all");
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileUpload = async (file: File) => {
    setIsUploadingMedia(true);
    setUploadError(null);
    try {
      const { getIdToken } = await import("@/lib/firebase/auth");
      const token = await getIdToken();
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/admin/ads/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
      } else {
        setMediaUrl(data.url);
      }
    } catch {
      setUploadError("Network error during file upload");
    } finally {
      setIsUploadingMedia(false);
    }
  };

  const handleToggleStatus = async (id: string) => {
    const ad = ads.find((a) => a.id === id);
    if (!ad) return;
    const newStatus = ad.status === "active" ? "disabled" : "active";
    try {
      await updateDocument(FIRESTORE_ADS_COLLECTION, id, { status: newStatus });
    } catch (err) {
      console.error("Failed to toggle ad status:", err);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this ad campaign? This cannot be undone.")) return;
    try {
      await deleteDocument(FIRESTORE_ADS_COLLECTION, id);
    } catch (err) {
      console.error("Failed to delete ad:", err);
    }
  };

  const handlePublishAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !adName.trim()) return;
    setIsSaving(true);

    const newId = `ad_${Date.now()}`;
    const newAd: AdvertisementDoc = {
      id: newId,
      adName: adName.trim(),
      title: title.trim(),
      type,
      mediaUrl: mediaUrl.trim() || undefined,
      clickBehavior,
      isPortrait,
      mediaFit,
      shortDescription: shortDescription.trim(),
      destinationUrl: destinationUrl.trim(),
      targetType,
      openMode,
      ctaText: ctaText.trim() || "Learn More",
      startDate,
      endDate,
      status: "active",
      audience: {
        country: targetCountry,
        businessType: targetBusinessType,
        subscriptionPlan: targetPlan,
        device: targetDevice,
      },
      impressions: 0,
      uniqueViews: 0,
      clicks: 0,
      ctr: 0,
      createdAt: new Date().toISOString(),
    };

    try {
      await setDocument(FIRESTORE_ADS_COLLECTION, newId, newAd);
      setShowWizard(false);
      setWizardStep(1);
      // Reset Form
      setAdName("");
      setTitle("");
      setShortDescription("");
    } catch (err) {
      console.error("Failed to publish ad:", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-[#56C5F0]" />
            <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">
              Enterprise Advertisement Control Center & Wizard
            </h1>
          </div>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Configure multimedia ad campaigns, CTA redirects, audience targeting rules, and live device previews.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowGuide(!showGuide)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-body-sm font-bold rounded-lg flex items-center gap-1.5 border border-slate-300"
          >
            <HelpCircle className="h-4 w-4 text-blue-600" /> Upload Guidelines
          </button>

          <button
            onClick={() => {
              setShowWizard(true);
              setWizardStep(1);
            }}
            className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] text-white text-body-sm px-4 py-2 flex items-center gap-1.5 font-bold"
          >
            <Plus className="h-4 w-4" /> Create Ad Campaign Wizard
          </button>
        </div>
      </div>

      {/* UPLOAD SPECIFICATIONS GUIDELINES PANEL */}
      {showGuide && (
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-3 text-body-sm text-blue-950 animate-fadeIn">
          <div className="flex items-center justify-between border-b border-blue-200 pb-2">
            <h3 className="text-heading-sm font-bold flex items-center gap-2">
              <Info className="h-5 w-5 text-[#56C5F0]" /> Asset & Banner Upload Guidelines
            </h3>
            <button onClick={() => setShowGuide(false)} className="text-blue-700 font-bold text-caption hover:underline">
              Close
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 text-caption pt-1">
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <p className="font-bold text-blue-900">Recommended Banner Sizes</p>
              <p className="text-slate-600 mt-1">Leaderboard: 1600 × 400 px<br />Sidebar: 400 × 800 px<br />Square: 1080 × 1080 px<br />Mobile Banner: 1080 × 540 px</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <p className="font-bold text-blue-900">Supported Formats</p>
              <p className="text-slate-600 mt-1">JPG, PNG, WEBP, SVG, HTML5</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <p className="font-bold text-blue-900">Maximum File Size</p>
              <p className="text-slate-600 mt-1">5 MB limit per banner<br />Recommended &lt; 500 KB</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <p className="font-bold text-blue-900">Optimization & Delivery</p>
              <p className="text-slate-600 mt-1">Automatic Compression<br />Lazy Loading Enabled</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="fr8x-card p-4">
          <p className="text-caption text-foreground-secondary">Total Impressions</p>
          <p className="text-display-sm font-bold text-[var(--fr8x-jet)] mt-1">
            {ads.reduce((acc, a) => acc + a.impressions, 0).toLocaleString()}
          </p>
        </div>

        <div className="fr8x-card p-4">
          <p className="text-caption text-foreground-secondary">Unique Views</p>
          <p className="text-display-sm font-bold text-blue-600 mt-1">
            {ads.reduce((acc, a) => acc + a.uniqueViews, 0).toLocaleString()}
          </p>
        </div>

        <div className="fr8x-card p-4">
          <p className="text-caption text-foreground-secondary">Total Clicks</p>
          <p className="text-display-sm font-bold text-emerald-600 mt-1">
            {ads.reduce((acc, a) => acc + a.clicks, 0).toLocaleString()}
          </p>
        </div>

        <div className="fr8x-card p-4">
          <p className="text-caption text-foreground-secondary">Avg Click-Through Rate (CTR)</p>
          <p className="text-display-sm font-bold text-purple-600 mt-1">
            {((ads.reduce((acc, a) => acc + a.clicks, 0) / (ads.reduce((acc, a) => acc + a.impressions, 0) || 1)) * 100).toFixed(2)}%
          </p>
        </div>
      </div>

      {/* Campaigns Table */}
      <div className="fr8x-card overflow-hidden bg-white">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)]">Active & Scheduled Ad Campaigns</h2>
          <span className="text-caption text-foreground-muted">{ads.length} total campaigns</span>
        </div>

        <div className="overflow-x-auto">
          <table className="fr8x-table text-[11px]">
            <thead>
              <tr>
                <th>Ad Name & Title</th>
                <th>Format</th>
                <th>Audience Targeting</th>
                <th>Impressions</th>
                <th>Unique Views</th>
                <th>Clicks</th>
                <th>CTR %</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => (
                <tr key={ad.id}>
                  <td>
                    <p className="font-bold text-[var(--fr8x-jet)]">{ad.adName}</p>
                    <p className="text-caption text-foreground-muted truncate max-w-xs">{ad.title}</p>
                  </td>
                  <td className="capitalize font-mono">{ad.type}</td>
                  <td>
                    <div className="text-[10px] space-y-0.5 font-mono">
                      <p>Country: <span className="font-bold text-blue-900">{ad.audience?.country || "All"}</span></p>
                      <p>Type: <span className="font-bold text-emerald-900">{ad.audience?.businessType || "All"}</span></p>
                    </div>
                  </td>
                  <td className="font-bold">{ad.impressions.toLocaleString()}</td>
                  <td>{ad.uniqueViews.toLocaleString()}</td>
                  <td className="font-bold text-emerald-700">{ad.clicks.toLocaleString()}</td>
                  <td className="font-bold text-purple-700">{ad.ctr}%</td>
                  <td>
                    <span className={ad.status === "active" ? "fr8x-badge-active" : "fr8x-badge-pending"}>
                      {ad.status}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setPreviewAd(ad);
                          setPreviewDevice("desktop");
                        }}
                        className="px-2 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 text-caption font-semibold flex items-center gap-1"
                        title="Live Device Preview"
                      >
                        <Eye className="h-3 w-3" /> Preview
                      </button>

                      <button
                        onClick={() => handleToggleStatus(ad.id)}
                        className="px-2 py-1 rounded text-caption border border-border hover:bg-slate-100 font-semibold"
                      >
                        {ad.status === "active" ? "Disable" : "Enable"}
                      </button>

                      <button
                        onClick={() => handleDeleteAd(ad.id)}
                        className="p-1 rounded text-rose-600 hover:bg-rose-50"
                        title="Delete Campaign"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AD WIZARD MODAL */}
      {showWizard && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h2 className="text-heading-lg font-bold text-[var(--fr8x-jet)]">Create Campaign Wizard</h2>
                <p className="text-caption text-foreground-secondary">Step {wizardStep} of 3</p>
              </div>
              <button onClick={() => setShowWizard(false)} className="text-slate-500 hover:text-slate-800">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePublishAd} className="space-y-4 text-body-sm">
              {/* STEP 1: CAMPAIGN DETAILS */}
              {wizardStep === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1 text-xs">Ad Campaign Name *</label>
                      <input
                        type="text"
                        value={adName}
                        onChange={(e) => setAdName(e.target.value)}
                        className="fr8x-input font-bold"
                        placeholder="e.g. Q3 Ocean Freight Promo"
                        required
                      />
                    </div>
                    <div>
                      <label className="fr8x-label block mb-1 text-xs">Ad Format Type</label>
                      <select value={type} onChange={(e) => setType(e.target.value as "image" | "carousel" | "html" | "rich_text" | "video")} className="fr8x-input font-medium">
                        <option value="image">Banner Image</option>
                        <option value="rich_text">Rich Text & Title Card</option>
                        <option value="carousel">Carousel (Multi-Card)</option>
                        <option value="html">Custom HTML5 Code</option>
                        <option value="video">Video (Future Ready)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1 text-xs">Banner Display Title *</label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="fr8x-input font-bold"
                      placeholder="e.g. FR8X Verified Freight Rates 2026"
                      required
                    />
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1 text-xs">Short Subtitle / Description</label>
                    <textarea
                      rows={2}
                      value={shortDescription}
                      onChange={(e) => setShortDescription(e.target.value)}
                      className="fr8x-input"
                      placeholder="Promotional copy displayed on banner..."
                    />
                  </div>
                </div>
              )}

              {/* STEP 2: DESTINATION & REDIRECT */}
              {wizardStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="fr8x-label block mb-1 text-xs">CTA Button Text</label>
                      <input
                        type="text"
                        value={ctaText}
                        onChange={(e) => setCtaText(e.target.value)}
                        className="fr8x-input font-bold"
                        placeholder="Learn More"
                      />
                    </div>

                    <div>
                      <label className="fr8x-label block mb-1 text-xs">Redirect Target Type</label>
                      <select value={targetType} onChange={(e) => setTargetType(e.target.value as "internal" | "external")} className="fr8x-input">
                        <option value="internal">Internal Platform Route (e.g. /auctions)</option>
                        <option value="external">External Website Link (https://...)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1 text-xs">Destination URL / Link *</label>
                    <input
                      type="text"
                      value={destinationUrl}
                      onChange={(e) => setDestinationUrl(e.target.value)}
                      className="fr8x-input font-mono"
                      placeholder="/auctions or https://example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="fr8x-label block mb-1 text-xs">Open Action Mode</label>
                    <select value={openMode} onChange={(e) => setOpenMode(e.target.value as "new_tab" | "inside_app")} className="fr8x-input">
                      <option value="inside_app">Open Inside FR8X-CON Application</option>
                      <option value="new_tab">Open in New Browser Tab</option>
                    </select>
                  </div>
                </div>
              )}

              {/* STEP 3: AUDIENCE TARGETING */}
              {wizardStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-xl space-y-3">
                    <h4 className="font-bold text-purple-950 flex items-center gap-1.5 text-xs">
                      <Filter className="h-4 w-4 text-purple-600" /> Target Audience Rules
                    </h4>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <label className="fr8x-label block mb-1 text-[11px]">Target Country</label>
                        <select value={targetCountry} onChange={(e) => setTargetCountry(e.target.value)} className="fr8x-input bg-white">
                          <option value="All">All Countries</option>
                          <option value="India">India</option>
                          <option value="UAE">United Arab Emirates</option>
                          <option value="USA">United States</option>
                          <option value="UK">United Kingdom</option>
                          <option value="Singapore">Singapore</option>
                        </select>
                      </div>

                      <div>
                        <label className="fr8x-label block mb-1 text-[11px]">Target Business Type</label>
                        <select value={targetBusinessType} onChange={(e) => setTargetBusinessType(e.target.value)} className="fr8x-input bg-white">
                          <option value="All">All Business Categories</option>
                          <option value="Freight Forwarder">Freight Forwarder</option>
                          <option value="Shipping Line / MLO">Shipping Line / MLO</option>
                          <option value="Exporter">Exporter / Importer</option>
                          <option value="Customs Broker">Customs Broker</option>
                        </select>
                      </div>

                      <div>
                        <label className="fr8x-label block mb-1 text-[11px]">Target Subscription Plan</label>
                        <select value={targetPlan} onChange={(e) => setTargetPlan(e.target.value)} className="fr8x-input bg-white">
                          <option value="All">All Tiers</option>
                          <option value="Trial">Trial Tier</option>
                          <option value="Basic">Basic Tier</option>
                          <option value="Professional">Professional Tier</option>
                          <option value="Enterprise">Enterprise Tier</option>
                        </select>
                      </div>

                      <div>
                        <label className="fr8x-label block mb-1 text-[11px]">Target Device</label>
                        <select value={targetDevice} onChange={(e) => setTargetDevice(e.target.value as "all" | "desktop" | "mobile" | "tablet")} className="fr8x-input bg-white">
                          <option value="all">All Devices</option>
                          <option value="desktop">Desktop Only</option>
                          <option value="mobile">Mobile Only</option>
                          <option value="tablet">Tablet Only</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Wizard Navigation Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-border">
                {wizardStep > 1 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((prev) => Math.max(1, prev - 1) as 1 | 2 | 3)}
                    className="px-4 py-2 border rounded-lg text-body-sm font-semibold hover:bg-slate-100"
                  >
                    Back
                  </button>
                ) : <div />}

                {wizardStep < 3 ? (
                  <button
                    type="button"
                    onClick={() => setWizardStep((prev) => Math.min(3, prev + 1) as 1 | 2 | 3)}
                    className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] px-5 py-2 text-body-sm font-bold"
                  >
                    Next Step →
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="fr8x-btn-primary bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 text-body-sm font-bold flex items-center gap-1.5"
                  >
                    <Check className="h-4 w-4" /> Publish Campaign Live
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* LIVE DEVICE PREVIEW MODAL */}
      {previewAd && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-3xl space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <div>
                <h3 className="text-heading-md font-bold text-[var(--fr8x-jet)]">Device Preview: {previewAd.adName}</h3>
                <p className="text-caption text-foreground-secondary">Simulating responsive viewports in FR8X-CON UI</p>
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                <button
                  onClick={() => setPreviewDevice("desktop")}
                  className={`px-3 py-1 rounded text-caption font-bold flex items-center gap-1 ${
                    previewDevice === "desktop" ? "bg-white text-[var(--fr8x-jet)] shadow-2xs" : "text-slate-600"
                  }`}
                >
                  <Monitor className="h-3.5 w-3.5" /> Desktop
                </button>
                <button
                  onClick={() => setPreviewDevice("tablet")}
                  className={`px-3 py-1 rounded text-caption font-bold flex items-center gap-1 ${
                    previewDevice === "tablet" ? "bg-white text-[var(--fr8x-jet)] shadow-2xs" : "text-slate-600"
                  }`}
                >
                  <Tablet className="h-3.5 w-3.5" /> Tablet
                </button>
                <button
                  onClick={() => setPreviewDevice("mobile")}
                  className={`px-3 py-1 rounded text-caption font-bold flex items-center gap-1 ${
                    previewDevice === "mobile" ? "bg-white text-[var(--fr8x-jet)] shadow-2xs" : "text-slate-600"
                  }`}
                >
                  <Smartphone className="h-3.5 w-3.5" /> Mobile
                </button>
              </div>
            </div>

            {/* Viewport Frame */}
            <div className="flex justify-center p-4 bg-slate-100 rounded-xl border border-slate-200 overflow-x-auto">
              <div
                className={`transition-all duration-300 ${
                  previewDevice === "desktop"
                    ? "w-full max-w-2xl"
                    : previewDevice === "tablet"
                    ? "w-[480px]"
                    : "w-[320px]"
                }`}
              >
                <AdBanner ad={previewAd} deviceViewport={previewDevice} />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setPreviewAd(null)}
                className="fr8x-btn-secondary px-5 py-2 text-body-sm font-bold"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
