'use client';

import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Calendar,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  Layers,
  Percent,
  Edit2,
  X,
  Users,
  Check,
  Globe,
  Radio,
  Zap,
  Tag,
  Sparkles,
  Gift,
  Sliders,
  RefreshCw,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { PlanVersion } from '@/lib/godfather/types';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';
import { usePlatformConfig, getActiveMembershipPricing, MembershipCampaignMode } from '@/lib/platform-config';
import { useToast } from '@/lib/context/ToastContext';

export default function PlansConfigurationPage() {
  const { plans, createPlanVersion } = useGodfatherData();
  const { requestStepUpVerification, operator } = useGodfatherAuth();
  const { config, setAllFreeMode, setMembershipPromotion } = usePlatformConfig();
  const { toast } = useToast();

  const [selectedPlan, setSelectedPlan] = useState<PlanVersion>(plans[0] || {} as PlanVersion);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isNewPlanModalOpen, setIsNewPlanModalOpen] = useState(false);

  // Form State
  const [planForm, setPlanForm] = useState({
    planName: '',
    plan: 'professional',
    countryScope: 'India (Domestic & EXIM)',
    currency: 'INR',
    monthlyPrice: 1999,
    annualPrice: 19990,
    bidFee: 180,
    bidDiscountPercent: 40,
    monthlyAuctions: 50,
    teamSeats: 5,
    goldVerification: false,
    apiAccess: false,
    rateExportAllowed: true,
    effectiveDate: '2026-10-01',
    grandfatherPolicy: 'maintain_original_price',
    taxPolicy: 'GST_18_PERCENT',
    status: 'active',
  });

  // Confirmation modal state
  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    beforeSnapshot?: any;
    afterSnapshot?: any;
    onConfirm: (reason: string) => void;
  } | null>(null);

  // Promotional Decision Center State
  const [promoMode, setPromoMode] = useState<MembershipCampaignMode>(
    config.allFreeMode ? 'all_free' : (config.membershipPromotion?.mode || 'standard')
  );
  const [promoDiscount, setPromoDiscount] = useState<number>(
    config.membershipPromotion?.discountPercent || 50
  );
  const [promoBadge, setPromoBadge] = useState<string>(
    config.membershipPromotion?.promoBadgeText || 'GODFATHER PROMO: 50% OFF'
  );
  const [promoHeadline, setPromoHeadline] = useState<string>(
    config.membershipPromotion?.campaignHeadline || 'Special Promotional Access Active'
  );
  const [promoProPrice, setPromoProPrice] = useState<number>(
    config.membershipPromotion?.proMonthlyPrice || 1500
  );
  const [promoPremiumPrice, setPromoPremiumPrice] = useState<number>(
    config.membershipPromotion?.premiumMonthlyPrice || 3000
  );

  // Sync state if config updates from another tab
  React.useEffect(() => {
    if (config.membershipPromotion) {
      setPromoMode(config.allFreeMode ? 'all_free' : config.membershipPromotion.mode);
      setPromoDiscount(config.membershipPromotion.discountPercent || 50);
      setPromoBadge(config.membershipPromotion.promoBadgeText || 'GODFATHER PROMO: 50% OFF');
      setPromoHeadline(config.membershipPromotion.campaignHeadline || 'Special Promotional Access Active');
      setPromoProPrice(config.membershipPromotion.proMonthlyPrice || 1500);
      setPromoPremiumPrice(config.membershipPromotion.premiumMonthlyPrice || 3000);
    }
  }, [config]);

  const handleApplyPromoDecision = () => {
    setMembershipPromotion(
      {
        mode: promoMode,
        discountPercent: promoMode === 'discounted' ? Number(promoDiscount) : 0,
        promoBadgeText: promoBadge.trim() || 'LIMITED PROMO',
        campaignHeadline: promoHeadline.trim() || 'Special Promotional Access Active',
        campaignDescription: `Promotional pricing authorized by Godfather Sovereign Administration. ${promoMode === 'discounted' ? `${promoDiscount}% discount applied.` : promoMode === 'all_free' ? '100% complimentary access.' : 'Standard rates active.'}`,
        proMonthlyPrice: Number(promoProPrice),
        premiumMonthlyPrice: Number(promoPremiumPrice),
        trialDurationDays: 30,
        bidFeeAmount: 300,
        premiumBidFeeAmount: 180,
      },
      { id: operator?.email || 'admin@fr8x.in', name: operator?.displayName || 'Godfather Administrator' }
    );
    toast(`Godfather Decision Published! New users will now see: ${promoMode.toUpperCase()}${promoMode === 'discounted' ? ` (${promoDiscount}% OFF)` : ''}.`);
  };

  const handleOpenEdit = (p: PlanVersion) => {
    setSelectedPlan(p);
    setPlanForm({
      planName: p.planName,
      plan: p.plan,
      countryScope: p.countryScope,
      currency: p.currency,
      monthlyPrice: p.monthlyPrice,
      annualPrice: p.monthlyPrice * 10,
      bidFee: p.bidFee,
      bidDiscountPercent: p.bidDiscountPercent,
      monthlyAuctions: p.limits?.monthlyAuctions || 20,
      teamSeats: p.limits?.subAccounts || 5,
      goldVerification: p.featureFlags?.goldVerification || false,
      apiAccess: p.featureFlags?.apiAccess || false,
      rateExportAllowed: true,
      effectiveDate: new Date().toISOString().split('T')[0],
      grandfatherPolicy: p.legacyGrandfatheringPolicy || 'maintain_original_price',
      taxPolicy: p.taxPolicy || 'inclusive_gst',
      status: 'active',
    });
    setIsEditModalOpen(true);
  };

  const handleOpenNewPlan = () => {
    setPlanForm({
      planName: 'Enterprise Sovereign Tier',
      plan: 'enterprise',
      countryScope: 'India',
      currency: 'INR',
      monthlyPrice: 9999,
      annualPrice: 99990,
      bidFee: 0,
      bidDiscountPercent: 100,
      monthlyAuctions: 500,
      teamSeats: 25,
      goldVerification: true,
      apiAccess: true,
      rateExportAllowed: true,
      effectiveDate: new Date().toISOString().split('T')[0],
      grandfatherPolicy: 'maintain_original_price',
      taxPolicy: 'inclusive_gst',
      status: 'active',
    });
    setIsNewPlanModalOpen(true);
  };

  const handleSavePlan = async (e: React.FormEvent, isCreatingNew: boolean) => {
    e.preventDefault();

    const verified = await requestStepUpVerification(
      isCreatingNew
        ? `Create new subscription tier ${planForm.planName}`
        : `Update price & quota version for ${planForm.planName}`
    );
    if (!verified) return;

    const payload: Partial<PlanVersion> = {
      plan: planForm.plan as any,
      planName: planForm.planName,
      countryScope: planForm.countryScope as 'India' | 'International' | 'Global',
      currency: planForm.currency as 'INR' | 'USD',
      monthlyPrice: Number(planForm.monthlyPrice),
      bidFee: Number(planForm.bidFee),
      bidDiscountPercent: Number(planForm.bidDiscountPercent),
      effectiveFrom: new Date(planForm.effectiveDate).toISOString(),
      legacyGrandfatheringPolicy: planForm.grandfatherPolicy as any,
      taxPolicy: planForm.taxPolicy as any,
      limits: {
        monthlyAuctions: Number(planForm.monthlyAuctions),
        monthlyBids: 100,
        subAccounts: Number(planForm.teamSeats),
        rateInventoryMax: 5000,
      },
      featureFlags: {
        goldVerification: planForm.goldVerification,
        unlimitedSearches: true,
        unlimitedChat: true,
        directCarrierTenders: true,
        marketAnalytics: true,
        apiAccess: planForm.apiAccess,
      },
    };

    setModalConfig({
      isOpen: true,
      title: isCreatingNew ? 'Publish New Subscription Plan' : 'Authorize Forward Plan Version Update',
      actionType: isCreatingNew ? 'PLAN_TIER_CREATED' : 'PLAN_VERSION_PUBLISHED',
      targetLabel: planForm.planName,
      targetId: `PV-${planForm.plan.toUpperCase()}`,
      beforeSnapshot: isCreatingNew ? null : selectedPlan,
      afterSnapshot: payload,
      onConfirm: async (reason) => {
        await createPlanVersion(payload, reason);
        setIsEditModalOpen(false);
        setIsNewPlanModalOpen(false);
        setModalConfig(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-green text-[11px] font-bold">COMMERCE</span>
            <span className="gf-badge gf-badge-blue text-[11px] font-bold">Versioned Pricing Engine</span>
            <span className="gf-badge gf-badge-gray text-[11px]">{plans.length} Active Tiers</span>
          </div>
          <h1 className="gf-page-title">Plans, Subscriptions & Versioned Pricing</h1>
          <p className="gf-page-subtitle">
            Configure subscription tiers (Trial, Pro, Premium, Enterprise), bidding transaction fees, feature allowances, and legacy subscriber grandfathering policies.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNewPlan}
          className="gf-btn gf-btn-primary text-xs flex items-center gap-1.5 font-bold"
        >
          <Plus className="lucide w-4 h-4" />
          <span>Create New Plan Tier</span>
        </button>
      </div>

      {/* Godfather Membership Pricing & Promotional Decision Center */}
      <div className="gf-card p-6 border-2 border-sky-200 bg-gradient-to-br from-slate-50 via-white to-sky-50/30 rounded-2xl shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-200 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center text-sky-600">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-black text-slate-900 tracking-tight">
                  Godfather Membership &amp; Pricing Decision Center
                </h2>
                <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  promoMode === 'all_free'
                    ? 'bg-emerald-600 text-white'
                    : promoMode === 'discounted'
                    ? 'bg-amber-600 text-white'
                    : 'bg-sky-600 text-white'
                }`}>
                  {promoMode === 'all_free' ? '100% FREE WAIVED' : promoMode === 'discounted' ? `${promoDiscount}% PROMO ACTIVE` : 'STANDARD CHARGEABLE'}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Govern what new organizations see on the public registration page (Card 3: Membership &amp; Access Tier) in real time.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleApplyPromoDecision}
            className="gf-btn gf-btn-primary flex items-center gap-2 px-5 py-2 text-xs font-bold shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Publish &amp; Enforce Decision</span>
          </button>
        </div>

        {/* 3 Decision Mode Selector Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Option 1: 100% Free Sovereign Waiver */}
          <div
            onClick={() => setPromoMode('all_free')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              promoMode === 'all_free'
                ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Gift className="w-4 h-4 text-emerald-600" />
                  100% Free Sovereign Mode
                </span>
                <input
                  type="radio"
                  name="promoDecisionMode"
                  checked={promoMode === 'all_free'}
                  onChange={() => setPromoMode('all_free')}
                  className="accent-emerald-600"
                />
              </div>
              <p className="text-[11.5px] text-slate-600 leading-snug">
                Complete platform fee waiver. New users receive complimentary Premium Enterprise tier at <b>₹0</b> with zero tender bid fees.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-bold text-emerald-700">
              <span>Public Registration:</span>
              <span>100% Waived Banner</span>
            </div>
          </div>

          {/* Option 2: Promotional Discount Mode */}
          <div
            onClick={() => setPromoMode('discounted')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              promoMode === 'discounted'
                ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-400/40 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-600" />
                  Promotional Discount Campaign
                </span>
                <input
                  type="radio"
                  name="promoDecisionMode"
                  checked={promoMode === 'discounted'}
                  onChange={() => setPromoMode('discounted')}
                  className="accent-amber-600"
                />
              </div>
              <p className="text-[11.5px] text-slate-600 leading-snug">
                Apply a promotional discount percentage. Displays original rates struck-through with live promotional discounted cards and badges.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-amber-200/60 flex items-center justify-between text-[11px] font-bold text-amber-700">
              <span>Active Discount:</span>
              <span>{promoDiscount}% OFF</span>
            </div>
          </div>

          {/* Option 3: Standard Chargeable Mode */}
          <div
            onClick={() => setPromoMode('standard')}
            className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
              promoMode === 'standard'
                ? 'bg-sky-50 border-sky-400 ring-2 ring-sky-400/40 shadow-xs'
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4 text-sky-600" />
                  Standard Chargeable Mode
                </span>
                <input
                  type="radio"
                  name="promoDecisionMode"
                  checked={promoMode === 'standard'}
                  onChange={() => setPromoMode('standard')}
                  className="accent-sky-600"
                />
              </div>
              <p className="text-[11.5px] text-slate-600 leading-snug">
                Standard commercial pricing schedule. Displays normal rate cards (Trial Free, Professional, Premium Enterprise) with full tariffs.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-sky-200/60 flex items-center justify-between text-[11px] font-bold text-sky-700">
              <span>Standard Rates:</span>
              <span>Pro ₹{promoProPrice} / Prem ₹{promoPremiumPrice}</span>
            </div>
          </div>
        </div>

        {/* Dynamic Controls based on selected mode */}
        {promoMode === 'discounted' && (
          <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-xl space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-600" />
                Configure Promotional Campaign Parameters:
              </span>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-slate-500">Quick Presets:</span>
                {[20, 30, 40, 50, 75].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => {
                      setPromoDiscount(pct);
                      setPromoBadge(`GODFATHER PROMO: ${pct}% OFF`);
                    }}
                    className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                      promoDiscount === pct
                        ? 'bg-amber-600 text-white'
                        : 'bg-white border border-amber-300 text-amber-800 hover:bg-amber-100'
                    }`}
                  >
                    {pct}% Off
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Discount Percentage (%)</label>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={promoDiscount}
                  onChange={(e) => setPromoDiscount(Math.max(1, Math.min(99, Number(e.target.value))))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Promotional Badge Text</label>
                <input
                  type="text"
                  value={promoBadge}
                  onChange={(e) => setPromoBadge(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                  placeholder="e.g. GODFATHER PROMO: 50% OFF"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Baseline Pro Rate (₹)</label>
                <input
                  type="number"
                  value={promoProPrice}
                  onChange={(e) => setPromoProPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Baseline Premium Rate (₹)</label>
                <input
                  type="number"
                  value={promoPremiumPrice}
                  onChange={(e) => setPromoPremiumPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">Campaign Headline Banner</label>
              <input
                type="text"
                value={promoHeadline}
                onChange={(e) => setPromoHeadline(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg p-2 font-bold text-slate-800"
                placeholder="e.g. Godfather Sovereign Promotion: 50% Off Enterprise Tiers"
              />
            </div>
          </div>
        )}

        {promoMode === 'standard' && (
          <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-xl space-y-3">
            <span className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-sky-600" />
              Standard Baseline Plan Rates (Displayed to New Users):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Professional Tier Monthly Rate (₹)</label>
                <input
                  type="number"
                  value={promoProPrice}
                  onChange={(e) => setPromoProPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Premium Enterprise Tier Monthly Rate (₹)</label>
                <input
                  type="number"
                  value={promoPremiumPrice}
                  onChange={(e) => setPromoPremiumPrice(Number(e.target.value))}
                  className="w-full bg-white border border-slate-300 rounded-lg p-2 font-mono font-bold text-slate-800"
                />
              </div>
            </div>
          </div>
        )}

        {/* Live Public Simulator Preview */}
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Live Public Registration Preview (Card 3: Membership &amp; Access Tier):
            </div>
            <span className="text-[10px] text-slate-400 font-mono">SIMULATION PREVIEW</span>
          </div>

          {promoMode === 'all_free' ? (
            <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-xl">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                  100% Free Platform Access Active
                </span>
                <span className="text-sm font-black text-emerald-700">₹0 / Free Access</span>
              </div>
              <div className="text-xs font-bold text-slate-800">Complimentary Premium Enterprise Tier Included</div>
              <div className="text-[11px] text-slate-600 mt-1">All new users get full Premium access with zero subscription fees and ₹0 tender bid fees.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              {/* Trial Preview */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <div className="font-bold text-slate-900">Trial Tier</div>
                <div className="text-sm font-extrabold text-slate-900 mt-1">Free</div>
                <div className="text-[10px] text-slate-500">30-Day Guided Access</div>
                <div className="text-[10px] text-slate-600 mt-2">Standard bid posting: ₹300/bid</div>
              </div>

              {/* Pro Preview */}
              <div className="p-3 bg-sky-50/50 border border-sky-300 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900">Professional Tier</div>
                  {promoMode === 'discounted' && (
                    <span className="text-[9px] font-extrabold bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded border border-sky-200">
                      {promoDiscount}% OFF
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  {promoMode === 'discounted' && (
                    <span className="text-xs text-slate-400 line-through">₹{promoProPrice.toLocaleString()}</span>
                  )}
                  <span className="text-sm font-extrabold text-sky-700">
                    ₹{promoMode === 'discounted' ? Math.round(promoProPrice * (1 - promoDiscount / 100)).toLocaleString() : promoProPrice.toLocaleString()}/mo
                  </span>
                </div>
                <div className="text-[10px] text-slate-500">Inclusive of all taxes</div>
                <div className="text-[10px] text-slate-600 mt-2">Standard bid posting: ₹300/bid</div>
              </div>

              {/* Premium Preview */}
              <div className="p-3 bg-amber-50/50 border-2 border-amber-400 rounded-lg shadow-xs">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-slate-900">Premium Enterprise</div>
                  <span className="text-[9px] font-extrabold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded border border-amber-200">
                    {promoMode === 'discounted' ? `${promoDiscount}% OFF` : 'Recommended'}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 mt-1">
                  {promoMode === 'discounted' && (
                    <span className="text-xs text-slate-400 line-through">₹{promoPremiumPrice.toLocaleString()}</span>
                  )}
                  <span className="text-sm font-extrabold text-amber-700">
                    ₹{promoMode === 'discounted' ? Math.round(promoPremiumPrice * (1 - promoDiscount / 100)).toLocaleString() : promoPremiumPrice.toLocaleString()}/mo
                  </span>
                </div>
                <div className="text-[10px] text-amber-800 font-semibold">Golden Verified Badge Included</div>
                <div className="text-[10px] text-slate-600 mt-2">
                  Bid fee: ₹{promoMode === 'discounted' ? Math.round(180 * (1 - promoDiscount / 100)) : 180}/bid (vs ₹300)
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Plan Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((p) => {
          const isSelected = selectedPlan?.planVersionId === p.planVersionId;
          return (
            <div
              key={p.planVersionId}
              onClick={() => setSelectedPlan(p)}
              className={`gf-card p-5 transition-all flex flex-col justify-between ${
                isSelected
                  ? 'border-sky-500 bg-sky-50/40 shadow-sm ring-1 ring-sky-400'
                  : 'hover:border-slate-300 hover:bg-slate-50/50'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span
                    className={`gf-badge ${
                      p.plan === 'premium'
                        ? 'gf-badge-gold'
                        : p.plan === 'professional'
                        ? 'gf-badge-blue'
                        : 'gf-badge-gray'
                    } text-[10.5px] uppercase font-bold`}
                  >
                    {p.plan} · V{p.version || 1}.0
                  </span>
                  <span className="text-[10.5px] text-slate-500 font-mono font-semibold">{p.countryScope}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900">{p.planName}</h3>
                <div className="my-3 font-mono">
                  <span className="text-2xl font-black text-slate-900">
                    {p.currency === 'INR' ? '₹' : '$'}
                    {p.monthlyPrice.toLocaleString()}
                  </span>
                  <span className="text-xs text-slate-500 font-sans font-medium">
                    {' '}
                    / month ({p.taxPolicy ? p.taxPolicy.replace(/_/g, ' ') : 'Plus GST'})
                  </span>
                </div>

                {/* Quotas & Features */}
                <div className="space-y-2 text-xs text-slate-700 border-t border-slate-200/80 pt-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Bid Posting Fee:</span>
                    <span className="font-mono font-bold text-sky-800">
                      {p.currency === 'INR' ? '₹' : '$'}
                      {p.bidFee}{' '}
                      {p.bidDiscountPercent > 0 && (
                        <span className="text-emerald-700 font-normal">({p.bidDiscountPercent}% Off)</span>
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Monthly Auctions Limit:</span>
                    <span className="font-mono font-bold text-slate-900">
                      {p.limits?.monthlyAuctions || 20} tenders
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">Gold Tick Verification:</span>
                    <span className="font-bold text-slate-900">
                      {p.featureFlags?.goldVerification ? '✓ Included' : '✕ Excluded'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-medium">API Webhook Feeds:</span>
                    <span className="font-bold text-slate-900">
                      {p.featureFlags?.apiAccess ? '✓ Enabled' : '✕ Standard'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-between">
                <span className="text-[10.5px] text-slate-500 font-mono">
                  Effective: {p.effectiveFrom ? new Date(p.effectiveFrom).toLocaleDateString() : 'Active'}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleOpenEdit(p);
                  }}
                  className="gf-btn gf-btn-secondary text-xs py-1 px-2.5 font-bold flex items-center gap-1 text-sky-700 hover:bg-sky-50"
                >
                  <Edit2 className="lucide w-3 h-3 text-sky-600" />
                  <span>Edit Tier</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Pricing Integrity Callout */}
      <div className="gf-card p-4 bg-slate-50 border-slate-200 text-xs text-slate-700 flex items-start gap-3">
        <Shield className="lucide w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-slate-900 block mb-1">Commercial Billing Immutability Guarantee</strong>
          In accordance with Con.FR8X.IN commercial governance rules, updating a plan configuration creates an append-only version with a forward effective date. Existing paid subscribers and historical tax invoices remain completely immutable.
        </div>
      </div>

      {/* EDIT PLAN MODAL */}
      {(isEditModalOpen || isNewPlanModalOpen) && (
        <div
          className="gf-modal-overlay"
          onClick={() => {
            setIsEditModalOpen(false);
            setIsNewPlanModalOpen(false);
          }}
        >
          <div className="gf-modal-card max-w-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="gf-modal-header">
              <div className="flex items-center gap-2">
                <DollarSign className="lucide w-5 h-5 text-emerald-600" />
                <div>
                  <h3 className="gf-modal-title">
                    {isNewPlanModalOpen ? 'Create New Subscription Tier' : `Edit Plan: ${planForm.planName}`}
                  </h3>
                  <p className="gf-modal-subtitle font-mono">
                    Forward Effective-Dated Versioning · Append-Only Audit Ledger
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEditModalOpen(false);
                  setIsNewPlanModalOpen(false);
                }}
                className="gf-modal-close-btn"
              >
                <X className="lucide w-4 h-4" />
              </button>
            </div>

            <form onSubmit={(e) => handleSavePlan(e, isNewPlanModalOpen)}>
              <div className="gf-modal-body space-y-3.5 max-h-[72vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Plan Display Name *</label>
                    <input
                      type="text"
                      required
                      value={planForm.planName}
                      onChange={(e) => setPlanForm({ ...planForm, planName: e.target.value })}
                      className="gf-input font-bold"
                      placeholder="e.g. Professional Exporter Tier"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Plan Tier Code *</label>
                    <select
                      value={planForm.plan}
                      onChange={(e) => setPlanForm({ ...planForm, plan: e.target.value })}
                      className="gf-select"
                    >
                      <option value="trial">Trial (Free / Sandbox)</option>
                      <option value="professional">Professional</option>
                      <option value="premium">Premium Gold</option>
                      <option value="enterprise">Enterprise Sovereign</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="gf-form-label">Monthly Price ({planForm.currency}) *</label>
                    <input
                      type="number"
                      required
                      value={planForm.monthlyPrice}
                      onChange={(e) => setPlanForm({ ...planForm, monthlyPrice: Number(e.target.value) })}
                      className="gf-input font-mono font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Annual Price ({planForm.currency}) *</label>
                    <input
                      type="number"
                      required
                      value={planForm.annualPrice}
                      onChange={(e) => setPlanForm({ ...planForm, annualPrice: Number(e.target.value) })}
                      className="gf-input font-mono font-bold text-emerald-800"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Currency *</label>
                    <select
                      value={planForm.currency}
                      onChange={(e) => setPlanForm({ ...planForm, currency: e.target.value })}
                      className="gf-select"
                    >
                      <option value="INR">INR (₹)</option>
                      <option value="USD">USD ($)</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="AED">AED</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Per-Bid Posting Fee ({planForm.currency}) *</label>
                    <input
                      type="number"
                      required
                      value={planForm.bidFee}
                      onChange={(e) => setPlanForm({ ...planForm, bidFee: Number(e.target.value) })}
                      className="gf-input font-mono font-bold"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Bid Fee Discount %</label>
                    <input
                      type="number"
                      value={planForm.bidDiscountPercent}
                      onChange={(e) => setPlanForm({ ...planForm, bidDiscountPercent: Number(e.target.value) })}
                      className="gf-input font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Monthly Auction Tenders Limit</label>
                    <input
                      type="number"
                      value={planForm.monthlyAuctions}
                      onChange={(e) => setPlanForm({ ...planForm, monthlyAuctions: Number(e.target.value) })}
                      className="gf-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Team Member Seats Allowed</label>
                    <input
                      type="number"
                      value={planForm.teamSeats}
                      onChange={(e) => setPlanForm({ ...planForm, teamSeats: Number(e.target.value) })}
                      className="gf-input font-mono"
                    />
                  </div>
                </div>

                {/* Feature Checkboxes */}
                <div>
                  <label className="gf-form-label">Plan Included Feature Entitlements</label>
                  <div className="grid grid-cols-3 gap-2.5 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={planForm.goldVerification}
                        onChange={(e) => setPlanForm({ ...planForm, goldVerification: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Gold Tick Verified</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={planForm.apiAccess}
                        onChange={(e) => setPlanForm({ ...planForm, apiAccess: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>API & Webhook Feeds</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                      <input
                        type="checkbox"
                        checked={planForm.rateExportAllowed}
                        onChange={(e) => setPlanForm({ ...planForm, rateExportAllowed: e.target.checked })}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span>Excel Rate Export</span>
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gf-form-label">Effective From Date *</label>
                    <input
                      type="date"
                      required
                      value={planForm.effectiveDate}
                      onChange={(e) => setPlanForm({ ...planForm, effectiveDate: e.target.value })}
                      className="gf-input font-mono"
                    />
                  </div>
                  <div>
                    <label className="gf-form-label">Grandfathering Policy</label>
                    <select
                      value={planForm.grandfatherPolicy}
                      onChange={(e) => setPlanForm({ ...planForm, grandfatherPolicy: e.target.value })}
                      className="gf-select"
                    >
                      <option value="maintain_original_price">Maintain original signup price (Grandfathered)</option>
                      <option value="notify_and_upgrade_in_90_days">90-day grace period migration</option>
                      <option value="auto_migrate">Migrate on next annual renewal</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="gf-modal-footer">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setIsNewPlanModalOpen(false);
                  }}
                  className="gf-btn gf-btn-secondary"
                >
                  Cancel
                </button>
                <button type="submit" className="gf-btn gf-btn-primary">
                  {isNewPlanModalOpen ? 'Create & Authorize Plan' : 'Save & Publish New Version'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {modalConfig && (
        <ActionConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          actionType={modalConfig.actionType}
          targetLabel={modalConfig.targetLabel}
          targetId={modalConfig.targetId}
          beforeSnapshot={modalConfig.beforeSnapshot}
          afterSnapshot={modalConfig.afterSnapshot}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
