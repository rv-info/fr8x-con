// FR8X-CON Dynamic Feature Toggles Engine (No Redeploy Required)
"use client";

export interface SystemFeatureToggles {
  feedModule: boolean;
  reverseAuctionsModule: boolean;
  messagingModule: boolean;
  contactsModule: boolean;
  jobsModule: boolean;
  aiAnalyticsModule: boolean;
  advertisementsModule: boolean;
  userRegistration: boolean;
  maintenanceMode: boolean;
  maintenanceNotice: string;
}

export const DEFAULT_FEATURE_TOGGLES: SystemFeatureToggles = {
  feedModule: true,
  reverseAuctionsModule: true,
  messagingModule: true,
  contactsModule: true,
  jobsModule: true,
  aiAnalyticsModule: true,
  advertisementsModule: true,
  userRegistration: true,
  maintenanceMode: false,
  maintenanceNotice: "System upgrade in progress. Live auctions remain active.",
};

export function getFeatureToggles(): SystemFeatureToggles {
  if (typeof window === "undefined") return DEFAULT_FEATURE_TOGGLES;
  try {
    const raw = localStorage.getItem("fr8x_feature_toggles");
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading feature toggles:", err);
  }
  return DEFAULT_FEATURE_TOGGLES;
}

export function saveFeatureToggles(toggles: SystemFeatureToggles): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("fr8x_feature_toggles", JSON.stringify(toggles));
    window.dispatchEvent(new Event("fr8x_feature_toggles_updated"));
  } catch (err) {
    console.error("Error saving feature toggles:", err);
  }
}
