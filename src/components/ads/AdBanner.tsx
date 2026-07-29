// FR8X-CON Reusable Enterprise Ad Banner Component with Device Responsive Layouts & Analytics
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink, Megaphone, Monitor, Smartphone, Tablet } from "lucide-react";

export interface TargetAudienceRules {
  country?: string;
  businessType?: string;
  subscriptionPlan?: string;
  device?: "all" | "desktop" | "mobile" | "tablet";
}

export interface AdvertisementDoc {
  id: string;
  adName: string;
  title: string;
  type: "image" | "carousel" | "html" | "rich_text" | "video";
  mediaUrl?: string;
  shortDescription?: string;
  destinationUrl?: string;
  targetType: "external" | "internal";
  openMode: "new_tab" | "inside_app";
  ctaText?: string;
  startDate?: string;
  endDate?: string;
  status: "active" | "disabled" | "scheduled" | "expired";
  audience?: TargetAudienceRules;
  impressions: number;
  uniqueViews: number;
  clicks: number;
  ctr: number;
}

interface AdBannerProps {
  ad?: AdvertisementDoc;
  deviceViewport?: "desktop" | "tablet" | "mobile";
  className?: string;
}

export const DEFAULT_ENTERPRISE_AD: AdvertisementDoc = {
  id: "ad_ent_001",
  adName: "FR8X Ocean Rate Intelligence 2026",
  title: "FR8X Verified Ocean Freight Intelligence 2026",
  type: "image",
  mediaUrl: "",
  shortDescription: "Unlock verified benchmark rates across 500+ global trade lanes.",
  destinationUrl: "/auctions",
  targetType: "internal",
  openMode: "inside_app",
  ctaText: "Explore Auctions Now",
  status: "active",
  audience: {
    country: "All",
    businessType: "All",
    subscriptionPlan: "All",
    device: "all",
  },
  impressions: 4820,
  uniqueViews: 3210,
  clicks: 642,
  ctr: 13.3,
};

export function AdBanner({ ad = DEFAULT_ENTERPRISE_AD, deviceViewport = "desktop", className = "" }: AdBannerProps) {
  const [tracked, setTracked] = useState(false);

  useEffect(() => {
    if (!tracked && ad.status === "active") {
      setTracked(true);
      // Increment impression analytics counter
    }
  }, [tracked, ad.status]);

  if (ad.status !== "active") return null;

  const isExternal = ad.targetType === "external";
  const openInNewTab = ad.openMode === "new_tab" || isExternal;

  return (
    <div
      className={`w-full rounded-xl p-4 sm:p-5 text-white shadow-sm overflow-hidden relative group transition-all ${
        deviceViewport === "mobile"
          ? "bg-gradient-to-r from-[#0b192c] to-[#1e7bb0] text-xs"
          : deviceViewport === "tablet"
          ? "bg-gradient-to-r from-[#0b192c] via-[#1e7bb0] to-[#56C5F0]"
          : "bg-gradient-to-r from-[#0b192c] via-[#1e7bb0] to-[#56C5F0]"
      } ${className}`}
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1">
              <Megaphone className="h-3 w-3 text-amber-300" /> Promoted
            </span>
            <h4 className="text-body-md font-bold text-white leading-tight">{ad.title}</h4>
          </div>

          {ad.shortDescription && (
            <p className="text-body-sm text-blue-100/90 leading-snug line-clamp-2">{ad.shortDescription}</p>
          )}
        </div>

        {ad.destinationUrl && (
          <div className="shrink-0 pt-1 sm:pt-0">
            {openInNewTab ? (
              <a
                href={ad.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 bg-white text-[#0b192c] font-bold text-body-sm px-3.5 py-1.5 rounded-lg hover:bg-blue-50 transition-all shadow-md active:scale-95"
              >
                {ad.ctaText || "Visit Link"} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <Link
                href={ad.destinationUrl}
                className="inline-flex items-center gap-1.5 bg-white text-[#0b192c] font-bold text-body-sm px-3.5 py-1.5 rounded-lg hover:bg-blue-50 transition-all shadow-md active:scale-95"
              >
                {ad.ctaText || "Learn More"}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Decorative Brand Accent */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
    </div>
  );
}
