// FR8X-CON Enterprise Subscription Plans Configuration Engine
"use client";

export interface SubscriptionPlan {
  id: "trial" | "basic" | "professional" | "enterprise" | "custom";
  name: string;
  monthlyPriceINR: number;
  monthlyPriceUSD: number;
  annualPriceINR: number;
  annualPriceUSD: number;
  currency: string;
  trialDurationDays: number;
  maxUsers: number;
  maxBranches: number;
  storageLimitMB: number;
  reverseAuctionsLimit: number; // -1 for unlimited
  ratePostingLimit: number;     // -1 for unlimited
  messagingAccess: boolean;
  jobsLimit: number;
  adAccess: boolean;
  apiAccess: boolean;
  aiFeatures: boolean;
  prioritySupport: boolean;
  isActive: boolean;
}

export const DEFAULT_SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "trial",
    name: "Trail Tier",
    monthlyPriceINR: 0,
    monthlyPriceUSD: 0,
    annualPriceINR: 0,
    annualPriceUSD: 0,
    currency: "INR",
    trialDurationDays: 2,
    maxUsers: 1,
    maxBranches: 1,
    storageLimitMB: 500,
    reverseAuctionsLimit: 3,
    ratePostingLimit: 5,
    messagingAccess: true,
    jobsLimit: 1,
    adAccess: false,
    apiAccess: false,
    aiFeatures: false,
    prioritySupport: false,
    isActive: true,
  },
  {
    id: "basic",
    name: "Basic Tier",
    monthlyPriceINR: 1499,
    monthlyPriceUSD: 25,
    annualPriceINR: 14990,
    annualPriceUSD: 250,
    currency: "INR",
    trialDurationDays: 0,
    maxUsers: 5,
    maxBranches: 2,
    storageLimitMB: 5000,
    reverseAuctionsLimit: 50,
    ratePostingLimit: 100,
    messagingAccess: true,
    jobsLimit: 5,
    adAccess: false,
    apiAccess: false,
    aiFeatures: true,
    prioritySupport: false,
    isActive: true,
  },
  {
    id: "professional",
    name: "Professional Tier",
    monthlyPriceINR: 4999,
    monthlyPriceUSD: 75,
    annualPriceINR: 49990,
    annualPriceUSD: 750,
    currency: "INR",
    trialDurationDays: 0,
    maxUsers: 20,
    maxBranches: 5,
    storageLimitMB: 25000,
    reverseAuctionsLimit: -1,
    ratePostingLimit: -1,
    messagingAccess: true,
    jobsLimit: 25,
    adAccess: true,
    apiAccess: true,
    aiFeatures: true,
    prioritySupport: true,
    isActive: true,
  },
  {
    id: "enterprise",
    name: "Enterprise Tier",
    monthlyPriceINR: 14999,
    monthlyPriceUSD: 200,
    annualPriceINR: 149990,
    annualPriceUSD: 2000,
    currency: "INR",
    trialDurationDays: 0,
    maxUsers: 100,
    maxBranches: 20,
    storageLimitMB: 100000,
    reverseAuctionsLimit: -1,
    ratePostingLimit: -1,
    messagingAccess: true,
    jobsLimit: -1,
    adAccess: true,
    apiAccess: true,
    aiFeatures: true,
    prioritySupport: true,
    isActive: true,
  },
  {
    id: "custom",
    name: "Custom Enterprise",
    monthlyPriceINR: 0,
    monthlyPriceUSD: 0,
    annualPriceINR: 0,
    annualPriceUSD: 0,
    currency: "Custom",
    trialDurationDays: 0,
    maxUsers: -1,
    maxBranches: -1,
    storageLimitMB: -1,
    reverseAuctionsLimit: -1,
    ratePostingLimit: -1,
    messagingAccess: true,
    jobsLimit: -1,
    adAccess: true,
    apiAccess: true,
    aiFeatures: true,
    prioritySupport: true,
    isActive: true,
  },
];

export function getStoredSubscriptionPlans(): SubscriptionPlan[] {
  if (typeof window === "undefined") return DEFAULT_SUBSCRIPTION_PLANS;
  try {
    const raw = localStorage.getItem("fr8x_subscription_plans");
    if (raw) return JSON.parse(raw);
  } catch (err) {
    console.error("Error reading subscription plans:", err);
  }
  return DEFAULT_SUBSCRIPTION_PLANS;
}

export function saveSubscriptionPlans(plans: SubscriptionPlan[]): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem("fr8x_subscription_plans", JSON.stringify(plans));
    window.dispatchEvent(new Event("fr8x_subscription_plans_updated"));
  } catch (err) {
    console.error("Error saving subscription plans:", err);
  }
}
