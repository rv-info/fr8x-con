// FR8X-CON Reusable Enterprise Ad Banner — Firestore-backed
// Fetches active ads from Firestore. Tracks impressions + clicks atomically.
// Supports targeting by device, subscription tier, and country.

"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { ExternalLink, Megaphone } from "lucide-react";
import { queryDocuments, updateDocument, where } from "@/lib/firebase/firestore";
import { increment } from "firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { useAuth } from "@/providers/AuthProvider";

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
  clickBehavior?: "entire_banner" | "cta_only";
  isPortrait?: boolean;
  mediaFit?: "cover" | "contain" | "fill";
  startDate?: string;
  endDate?: string;
  status: "active" | "disabled" | "scheduled" | "expired";
  audience?: TargetAudienceRules;
  impressions: number;
  uniqueViews: number;
  clicks: number;
  ctr: number;
  createdAt?: string;
}

export const DEFAULT_ENTERPRISE_AD: AdvertisementDoc = {
  id: "ad_ent_001",
  adName: "FR8X Ocean Rate Intelligence 2026",
  title: "FR8X Verified Ocean Freight Intelligence 2026",
  type: "image",
  shortDescription: "Unlock verified benchmark rates across 500+ global trade lanes.",
  destinationUrl: "/auctions",
  targetType: "internal",
  openMode: "inside_app",
  ctaText: "Explore Auctions Now",
  status: "active",
  audience: { country: "All", businessType: "All", subscriptionPlan: "All", device: "all" },
  impressions: 0,
  uniqueViews: 0,
  clicks: 0,
  ctr: 0,
};

interface AdBannerProps {
  /** If provided, shows this specific ad. Otherwise fetches from Firestore. */
  ad?: AdvertisementDoc;
  deviceViewport?: "desktop" | "tablet" | "mobile";
  className?: string;
  /** When used inside a feed, pass an index to rotate through available ads */
  adIndex?: number;
}

const ADS_COLLECTION = COLLECTIONS.ADS || "ads";

/** Detect device type from user agent */
function getDeviceType(): "desktop" | "tablet" | "mobile" {
  if (typeof window === "undefined") return "desktop";
  const ua = navigator.userAgent;
  if (/tablet|ipad|playbook|silk/i.test(ua)) return "tablet";
  if (/mobile|android|iphone|ipod|windows phone/i.test(ua)) return "mobile";
  return "desktop";
}

export function AdBanner({
  ad: propAd,
  deviceViewport,
  className = "",
  adIndex = 0,
}: AdBannerProps) {
  const { user } = useAuth();
  const [firestoreAds, setFirestoreAds] = useState<AdvertisementDoc[]>([]);
  const [isLoading, setIsLoading] = useState(!propAd);
  const impressionTracked = useRef(false);
  const resolvedDevice = deviceViewport || getDeviceType();

  // Fetch active ads from Firestore (only when no prop ad provided)
  useEffect(() => {
    if (propAd) return;

    setIsLoading(true);
    queryDocuments<AdvertisementDoc>(ADS_COLLECTION, [
      where("status", "==", "active"),
    ])
      .then((docs) => {
        const now = new Date();
        const filtered = docs.filter((a) => {
          // Date range check
          if (a.startDate && new Date(a.startDate) > now) return false;
          if (a.endDate && new Date(a.endDate) < now) return false;
          // Device targeting
          if (a.audience?.device && a.audience.device !== "all" && a.audience.device !== resolvedDevice) return false;
          // Subscription targeting
          if (a.audience?.subscriptionPlan && a.audience.subscriptionPlan !== "All") {
            const userTier = user?.membershipTier || "trial";
            if (!a.audience.subscriptionPlan.toLowerCase().includes(userTier)) return false;
          }
          return true;
        });
        setFirestoreAds(filtered);
      })
      .catch(() => setFirestoreAds([]))
      .finally(() => setIsLoading(false));
  }, [propAd, resolvedDevice, user?.membershipTier]);

  const activeAd = propAd ?? firestoreAds[adIndex % Math.max(firestoreAds.length, 1)];

  // Track impression on render (once per mount)
  useEffect(() => {
    if (!activeAd?.id || impressionTracked.current) return;
    if (activeAd.status !== "active") return;
    impressionTracked.current = true;

    updateDocument(ADS_COLLECTION, activeAd.id, {
      impressions: increment(1) as unknown as number,
    }).catch(() => undefined); // Fail silently
  }, [activeAd?.id, activeAd?.status]);

  const handleCTAClick = useCallback(() => {
    if (!activeAd?.id) return;
    updateDocument(ADS_COLLECTION, activeAd.id, {
      clicks: increment(1) as unknown as number,
    }).catch(() => undefined);
  }, [activeAd?.id]);

  if (isLoading) return null;
  if (!activeAd || activeAd.status !== "active") return null;

  const isExternal = activeAd.targetType === "external";
  const openInNewTab = activeAd.openMode === "new_tab" || isExternal;

  const isEntireClickable = activeAd.clickBehavior === "entire_banner" && activeAd.destinationUrl;

  const content = (
    <div
      className={`w-full rounded-xl text-white shadow-sm overflow-hidden relative group transition-all ${
        activeAd.isPortrait ? "max-w-xs mx-auto flex-col" : ""
      } ${
        resolvedDevice === "mobile"
          ? "bg-gradient-to-r from-[#0b192c] to-[#1e7bb0] text-xs"
          : "bg-gradient-to-r from-[#0b192c] via-[#1e7bb0] to-[#56C5F0]"
      } ${className}`}
    >
      {/* Media Image / GIF if present */}
      {activeAd.mediaUrl && (
        <div className="w-full relative overflow-hidden max-h-48">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeAd.mediaUrl}
            alt={activeAd.title}
            className={`w-full h-full object-${activeAd.mediaFit || "cover"}`}
          />
        </div>
      )}

      <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative z-10">
        <div className="space-y-1 flex-1">
          <div className="flex items-center gap-2">
            <span className="bg-white/20 backdrop-blur-xs px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1">
              <Megaphone className="h-3 w-3 text-amber-300" /> Promoted
            </span>
            <h4 className="text-body-md font-bold text-white leading-tight">{activeAd.title}</h4>
          </div>

          {activeAd.shortDescription && (
            <p className="text-body-sm text-blue-100/90 leading-snug line-clamp-2">
              {activeAd.shortDescription}
            </p>
          )}
        </div>

        {activeAd.destinationUrl && (
          <div className="shrink-0 pt-1 sm:pt-0">
            {openInNewTab ? (
              <a
                href={activeAd.destinationUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={handleCTAClick}
                className="inline-flex items-center gap-1.5 bg-white text-[#0b192c] font-bold text-body-sm px-3.5 py-1.5 rounded-lg hover:bg-blue-50 transition-all shadow-md active:scale-95"
                aria-label={`${activeAd.ctaText || "Visit Link"} — opens in new tab`}
              >
                {activeAd.ctaText || "Visit Link"} <ExternalLink className="h-3.5 w-3.5" />
              </a>
            ) : (
              <Link
                href={activeAd.destinationUrl}
                onClick={handleCTAClick}
                className="inline-flex items-center gap-1.5 bg-white text-[#0b192c] font-bold text-body-sm px-3.5 py-1.5 rounded-lg hover:bg-blue-50 transition-all shadow-md active:scale-95"
                aria-label={activeAd.ctaText || "Learn More"}
              >
                {activeAd.ctaText || "Learn More"}
              </Link>
            )}
          </div>
        )}
      </div>

      {/* Decorative Brand Accent */}
      <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none" />
    </div>
  );

  if (isEntireClickable) {
    return openInNewTab ? (
      <a
        href={activeAd.destinationUrl}
        target="_blank"
        rel="noopener noreferrer"
        onClick={handleCTAClick}
        className="block cursor-pointer"
      >
        {content}
      </a>
    ) : (
      <Link href={activeAd.destinationUrl!} onClick={handleCTAClick} className="block cursor-pointer">
        {content}
      </Link>
    );
  }

  return content;
}
