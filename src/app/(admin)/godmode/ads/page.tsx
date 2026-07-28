// FR8X-CON GodMode Enterprise Advertisement Management System

"use client";

import { useState } from "react";
import { AdBanner, type AdvertisementDoc } from "@/components/ads/AdBanner";
import { Button } from "@/components/ui/Button";
import {
  Megaphone,
  Plus,
  Edit,
  Trash2,
  Eye,
  MousePointer,
  TrendingUp,
  Calendar,
  FileImage,
  Link2,
  CheckCircle,
  XCircle,
  HelpCircle,
  Sparkles,
  ExternalLink,
  Code,
  Info,
} from "lucide-react";

const SAMPLE_ADS: AdvertisementDoc[] = [
  {
    id: "ad_101",
    title: "FR8X Verified Ocean Freight Intelligence 2026",
    type: "banner",
    richText: "Unlock premium benchmark rates across 500+ global trade lanes with verified shipping lines.",
    targetUrl: "/auctions",
    targetType: "internal",
    ctaText: "Explore Auctions Now",
    startDate: "2026-07-01",
    endDate: "2026-12-31",
    status: "active",
    impressions: 4820,
    clicks: 642,
  },
  {
    id: "ad_102",
    title: "Global Supply Chain Summit — Dubai 2026",
    type: "card",
    richText: "Join top NVOCCs, MLOs, and freight forwarders for exclusive networking.",
    targetUrl: "https://example.com/summit",
    targetType: "external",
    ctaText: "Register Interest",
    startDate: "2026-08-01",
    endDate: "2026-09-15",
    status: "active",
    impressions: 2150,
    clicks: 310,
  },
  {
    id: "ad_103",
    title: "Special Reefer Container Promotion",
    type: "banner",
    richText: "Discounted cold chain transport for perishable cargo.",
    targetUrl: "/rates",
    targetType: "internal",
    ctaText: "View Reefer Rates",
    startDate: "2026-06-01",
    endDate: "2026-07-15",
    status: "expired",
    impressions: 9100,
    clicks: 1120,
  },
];

export default function GodModeAdsPage() {
  const [ads, setAds] = useState<AdvertisementDoc[]>(SAMPLE_ADS);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  // New Ad Form State
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"banner" | "card" | "html">("banner");
  const [richText, setRichText] = useState("");
  const [targetUrl, setTargetUrl] = useState("");
  const [targetType, setTargetType] = useState<"internal" | "external">("internal");
  const [ctaText, setCtaText] = useState("Learn More");
  const [startDate, setStartDate] = useState("2026-08-01");
  const [endDate, setEndDate] = useState("2026-12-31");

  const handleToggleStatus = (id: string) => {
    setAds((prev) =>
      prev.map((ad) =>
        ad.id === id ? { ...ad, status: ad.status === "active" ? "inactive" : "active" } : ad
      )
    );
  };

  const handleDeleteAd = (id: string) => {
    setAds((prev) => prev.filter((ad) => ad.id !== id));
  };

  const handleCreateAd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const newAd: AdvertisementDoc = {
      id: `ad_${Date.now()}`,
      title: title.trim(),
      type,
      richText: richText.trim(),
      targetUrl: targetUrl.trim(),
      targetType,
      ctaText: ctaText.trim() || "Learn More",
      startDate,
      endDate,
      status: "active",
      impressions: 0,
      clicks: 0,
    };

    setAds([newAd, ...ads]);
    setShowCreateModal(false);

    // Reset Form
    setTitle("");
    setRichText("");
    setTargetUrl("");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <Megaphone className="h-6 w-6 text-[#56C5F0]" />
            <h1 className="text-display-sm font-bold text-foreground">Enterprise Advertisement Management</h1>
          </div>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Configure rich multimedia campaigns, promotional banners, CTA buttons, and performance analytics.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowGuide(!showGuide)}
            className="bg-slate-100 text-slate-800 text-body-sm px-3.5 py-2 flex items-center gap-1.5 hover:bg-slate-200"
          >
            <HelpCircle className="h-4 w-4" /> Upload Guidelines
          </Button>

          <Button
            onClick={() => setShowCreateModal(true)}
            className="bg-[#56C5F0] text-white text-body-sm px-4 py-2 flex items-center gap-1.5 hover:bg-[#3ABFF0]"
          >
            <Plus className="h-4 w-4" /> Create Advertisement
          </Button>
        </div>
      </div>

      {/* ═══ UPLOAD GUIDELINES PANEL ═══ */}
      {showGuide && (
        <div className="p-5 bg-blue-50 border border-blue-200 rounded-xl space-y-3 text-body-sm text-blue-950">
          <div className="flex items-center justify-between">
            <h3 className="text-heading-sm font-bold flex items-center gap-2">
              <Info className="h-5 w-5 text-[#56C5F0]" /> Ad Asset & Upload Specifications
            </h3>
            <button onClick={() => setShowGuide(false)} className="text-blue-700 font-bold text-caption">Close</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <p className="font-bold text-caption text-blue-900">Recommended Banner Sizes</p>
              <p className="text-caption text-blue-950 mt-1">Leaderboard: 1200 × 300 px<br />Rectangle: 300 × 250 px</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <p className="font-bold text-caption text-blue-900">Supported Formats</p>
              <p className="text-caption text-blue-950 mt-1">JPG, PNG, WEBP, SVG, HTML5</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <p className="font-bold text-caption text-blue-900">Maximum File Size</p>
              <p className="text-caption text-blue-950 mt-1">2 MB per image asset</p>
            </div>
            <div className="bg-white p-3 rounded-lg border border-blue-100">
              <p className="font-bold text-caption text-blue-900">Resolution & Quality</p>
              <p className="text-caption text-blue-950 mt-1">72 DPI minimum / 1080p crisp rendering</p>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="fr8x-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm text-foreground-secondary">Total Impressions</p>
              <p className="text-display-sm font-bold text-foreground mt-1">
                {ads.reduce((acc, a) => acc + a.impressions, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#56C5F0] flex items-center justify-center">
              <Eye className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="fr8x-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm text-foreground-secondary">Total Clicks</p>
              <p className="text-display-sm font-bold text-foreground mt-1">
                {ads.reduce((acc, a) => acc + a.clicks, 0).toLocaleString()}
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MousePointer className="h-5 w-5" />
            </div>
          </div>
        </div>

        <div className="fr8x-card p-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-body-sm text-foreground-secondary">Avg Click-Through Rate (CTR)</p>
              <p className="text-display-sm font-bold text-foreground mt-1">
                {((ads.reduce((acc, a) => acc + a.clicks, 0) / (ads.reduce((acc, a) => acc + a.impressions, 0) || 1)) * 100).toFixed(2)}%
              </p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Panel */}
      <div className="space-y-2">
        <h2 className="text-heading-md font-bold text-foreground flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-amber-500" /> Live Platform Preview
        </h2>
        <AdBanner />
      </div>

      {/* Campaign List Table */}
      <div className="fr8x-card overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-heading-md font-bold text-foreground">Active & Scheduled Campaigns</h2>
          <span className="text-caption text-foreground-muted">{ads.length} campaigns total</span>
        </div>

        <div className="overflow-x-auto">
          <table className="fr8x-table">
            <thead>
              <tr>
                <th>Campaign Title</th>
                <th>Type</th>
                <th>Redirect Link</th>
                <th>Schedule</th>
                <th>Impressions</th>
                <th>Clicks</th>
                <th>CTR %</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {ads.map((ad) => {
                const ctr = ((ad.clicks / (ad.impressions || 1)) * 100).toFixed(1);
                return (
                  <tr key={ad.id}>
                    <td className="font-semibold text-foreground">{ad.title}</td>
                    <td className="capitalize">{ad.type}</td>
                    <td>
                      <span className="font-mono text-caption">{ad.targetUrl || "N/A"}</span>
                    </td>
                    <td>{ad.startDate || "Immediate"} to {ad.endDate || "Indefinite"}</td>
                    <td className="font-semibold">{ad.impressions.toLocaleString()}</td>
                    <td className="font-semibold text-emerald-600">{ad.clicks.toLocaleString()}</td>
                    <td className="font-bold">{ctr}%</td>
                    <td>
                      <span className={ad.status === "active" ? "fr8x-badge-active" : "fr8x-badge-pending"}>
                        {ad.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleToggleStatus(ad.id)}
                          className="px-2 py-1 rounded text-caption border border-border hover:bg-slate-100"
                        >
                          {ad.status === "active" ? "Deactivate" : "Activate"}
                        </button>
                        <button
                          onClick={() => handleDeleteAd(ad.id)}
                          className="p-1 rounded text-danger hover:bg-danger-light"
                          title="Delete Campaign"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create Ad Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-xl shadow-xl space-y-4">
            <h2 className="text-heading-lg font-bold text-foreground">Create New Campaign</h2>

            <form onSubmit={handleCreateAd} className="space-y-4">
              <div>
                <label className="fr8x-label block mb-1">Campaign Title *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="fr8x-input py-2 text-body-sm"
                  placeholder="e.g. Q3 Ocean Freight Special"
                  required
                />
              </div>

              <div>
                <label className="fr8x-label block mb-1">Ad Content / Subtitle</label>
                <textarea
                  value={richText}
                  onChange={(e) => setRichText(e.target.value)}
                  className="fr8x-input py-2 text-body-sm h-20"
                  placeholder="Descriptive text for the banner or card..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="fr8x-label block mb-1">Target URL / Link</label>
                  <input
                    type="text"
                    value={targetUrl}
                    onChange={(e) => setTargetUrl(e.target.value)}
                    className="fr8x-input py-2 text-body-sm font-mono"
                    placeholder="/auctions or https://..."
                  />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={ctaText}
                    onChange={(e) => setCtaText(e.target.value)}
                    className="fr8x-input py-2 text-body-sm"
                    placeholder="Learn More"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="fr8x-label block mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="fr8x-input py-2 text-body-sm"
                  />
                </div>
                <div>
                  <label className="fr8x-label block mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="fr8x-input py-2 text-body-sm"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-border flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-lg border border-border text-body-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
                <Button type="submit" className="bg-[#56C5F0] text-white px-5 py-2">
                  Publish Campaign
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
