// FR8X-CON Reusable Enterprise Ad Banner Component with Impression & Click Analytics
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, Sparkles, Megaphone } from "lucide-react";

export interface AdvertisementDoc {
  id: string;
  title: string;
  type: "banner" | "card" | "html" | "rich_text";
  mediaUrl?: string;
  htmlContent?: string;
  richText?: string;
  targetUrl?: string;
  targetType: "external" | "internal";
  ctaText?: string;
  startDate?: string;
  endDate?: string;
  status: "active" | "draft" | "scheduled" | "expired" | "inactive";
  impressions: number;
  clicks: number;
}

interface AdBannerProps {
  ad?: AdvertisementDoc;
  position?: "top" | "sidebar" | "feed";
}

const DEFAULT_SAMPLE_AD: AdvertisementDoc = {
  id: "ad_sample_001",
  title: "FR8X Verified Ocean Freight Intelligence 2026",
  type: "banner",
  mediaUrl: "",
  richText: "Unlock premium benchmark rates across 500+ global trade lanes.",
  targetUrl: "/auctions",
  targetType: "internal",
  ctaText: "Explore Auctions Now",
  status: "active",
  impressions: 1240,
  clicks: 184,
};

export function AdBanner({ ad = DEFAULT_SAMPLE_AD, position = "feed" }: AdBannerProps) {
  const [hasTrackedImpression, setHasTrackedImpression] = useState(false);

  useEffect(() => {
    if (!hasTrackedImpression) {
      setHasTrackedImpression(true);
      // Track impression increment
    }
  }, [hasTrackedImpression]);

  const handleAdClick = () => {
    // Track click analytics
  };

  if (ad.status !== "active") return null;

  return (
    <div className="w-full bg-gradient-to-r from-[#0b192c] via-[#1e7bb0] to-[#56C5F0] rounded-xl p-4 sm:p-5 text-white shadow-sm overflow-hidden relative group">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 relative z-10">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1">
              <Megaphone className="h-3 w-3 text-amber-300" /> Promoted
            </span>
            <h4 className="text-heading-sm font-bold text-white">{ad.title}</h4>
          </div>

          {ad.richText && <p className="text-body-sm text-blue-100/90 leading-normal">{ad.richText}</p>}
        </div>

        {ad.targetUrl && (
          <div className="shrink-0">
            {ad.targetType === "internal" ? (
              <Link
                href={ad.targetUrl}
                onClick={handleAdClick}
                className="inline-flex items-center gap-1.5 bg-white text-[#0b192c] font-bold text-body-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-all shadow-md active:scale-95"
              >
                {ad.ctaText || "Learn More"}
              </Link>
            ) : (
              <a
                href={ad.targetUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleAdClick}
                className="inline-flex items-center gap-1.5 bg-white text-[#0b192c] font-bold text-body-sm px-4 py-2 rounded-lg hover:bg-blue-50 transition-all shadow-md active:scale-95"
              >
                {ad.ctaText || "Visit Link"} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </div>
        )}
      </div>

      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
    </div>
  );
}
