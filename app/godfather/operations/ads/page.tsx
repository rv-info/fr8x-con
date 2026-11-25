'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Eye,
  MousePointer,
  Percent,
  DollarSign,
  Sliders,
  CheckCircle2,
  AlertCircle,
  Play,
  Pause,
  RefreshCw,
  Search,
  Filter,
  ShieldCheck,
  Building,
  Briefcase,
  Zap,
  Globe,
  BarChart3,
  Calendar,
  AlertTriangle,
  ExternalLink,
  Mail,
  Phone,
  MessageCircle,
  Clock,
  FileText,
  XCircle,
  History,
  Check,
  X,
} from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';
import {
  AdCampaignRecord,
  AdStatus,
  AdAuditLog,
  getStoredAds,
  saveAd,
  getAuditLogs,
  recordAdAuditLog,
} from '@/lib/db/ads';
import { Modal } from '@/components/ui/Modal';

export default function GodfatherAdsManagerPage() {
  const { toast } = useToast();
  const [ads, setAds] = useState<AdCampaignRecord[]>(() => getStoredAds());
  const [auditLogs, setAuditLogs] = useState<AdAuditLog[]>(() => getAuditLogs());

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'worldwide_pending' | 'active' | 'paused' | 'rejected' | 'expired'>('all');

  // Inspection & Action Modals
  const [selectedAdForInspect, setSelectedAdForInspect] = useState<AdCampaignRecord | null>(null);
  const [rejectingAd, setRejectingAd] = useState<AdCampaignRecord | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [extendingAd, setExtendingAd] = useState<AdCampaignRecord | null>(null);
  const [extraDays, setExtraDays] = useState(7);
  const [showAuditModal, setShowAuditModal] = useState(false);

  // 10 Key KPI Calculations (Phase 6.1)
  const totalAds = ads.length;
  const pendingApproval = ads.filter((a) => a.status === 'submitted' || a.status === 'pending_godfather_approval').length;
  const approvedAds = ads.filter((a) => a.status === 'approved' || a.status === 'active').length;
  const activeCampaigns = ads.filter((a) => a.status === 'active').length;
  const scheduledCampaigns = ads.filter((a) => a.status === 'scheduled').length;
  const rejectedAds = ads.filter((a) => a.status === 'rejected').length;
  const expiredCampaigns = ads.filter((a) => a.status === 'expired').length;
  const pausedCampaigns = ads.filter((a) => a.status === 'paused').length;
  const pendingWorldwide = ads.filter((a) => a.isWorldwideRequested && a.worldwideApprovalStatus === 'pending').length;
  const totalRevenueINR = ads.reduce((acc, a) => acc + (a.paymentStatus === 'paid' ? a.costINR : 0), 0);

  // Administrative Actions (Phase 6.2)
  const handleApprove = (ad: AdCampaignRecord) => {
    const prevStatus = ad.status;
    const updated: AdCampaignRecord = {
      ...ad,
      status: 'active',
      worldwideApprovalStatus: ad.isWorldwideRequested ? 'approved' : ad.worldwideApprovalStatus,
    };
    saveAd(updated);
    setAds(getStoredAds());

    recordAdAuditLog({
      campaignId: ad.id,
      adminId: 'godfather_admin',
      adminEmail: 'godfather@fr8x.in',
      action: 'approved',
      previousStatus: prevStatus,
      newStatus: 'active',
      reason: 'Administrative verification passed. Ad creative & destination link compliant.',
    });
    setAuditLogs(getAuditLogs());
    toast(`✓ Campaign ${ad.id} APPROVED and set to ACTIVE!`);
    setSelectedAdForInspect(null);
  };

  const handleApproveWorldwide = (ad: AdCampaignRecord) => {
    const prevStatus = ad.status;
    const updated: AdCampaignRecord = {
      ...ad,
      status: 'active',
      isWorldwideRequested: true,
      worldwideApprovalStatus: 'approved',
      geoScope: 'worldwide',
    };
    saveAd(updated);
    setAds(getStoredAds());

    recordAdAuditLog({
      campaignId: ad.id,
      adminId: 'godfather_admin',
      adminEmail: 'godfather@fr8x.in',
      action: 'worldwide_approved',
      previousStatus: prevStatus,
      newStatus: 'active',
      reason: 'Explicit Worldwide distribution scope granted by Godfather Administration.',
    });
    setAuditLogs(getAuditLogs());
    toast(`🛡️ WORLDWIDE Targeting APPROVED for ${ad.id}!`);
    setSelectedAdForInspect(null);
  };

  const handleRejectConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectingAd) return;
    if (!rejectReason.trim()) {
      toast('Please enter a rejection reason');
      return;
    }

    const prevStatus = rejectingAd.status;
    const updated: AdCampaignRecord = {
      ...rejectingAd,
      status: 'rejected',
      worldwideApprovalStatus: rejectingAd.isWorldwideRequested ? 'rejected' : undefined,
    };
    saveAd(updated);
    setAds(getStoredAds());

    recordAdAuditLog({
      campaignId: rejectingAd.id,
      adminId: 'godfather_admin',
      adminEmail: 'godfather@fr8x.in',
      action: 'rejected',
      previousStatus: prevStatus,
      newStatus: 'rejected',
      reason: rejectReason.trim(),
    });
    setAuditLogs(getAuditLogs());
    toast(`✕ Campaign ${rejectingAd.id} REJECTED.`);
    setRejectingAd(null);
    setRejectReason('');
    setSelectedAdForInspect(null);
  };

  const handleTogglePause = (ad: AdCampaignRecord) => {
    const prevStatus = ad.status;
    const nextStatus: AdStatus = ad.status === 'active' ? 'paused' : 'active';
    const updated: AdCampaignRecord = { ...ad, status: nextStatus };
    saveAd(updated);
    setAds(getStoredAds());

    recordAdAuditLog({
      campaignId: ad.id,
      adminId: 'godfather_admin',
      adminEmail: 'godfather@fr8x.in',
      action: nextStatus === 'paused' ? 'paused' : 'resumed',
      previousStatus: prevStatus,
      newStatus: nextStatus,
      reason: `Ad campaign status toggled to ${nextStatus.toUpperCase()} by Godfather operator.`,
    });
    setAuditLogs(getAuditLogs());
    toast(`Campaign ${ad.id} is now ${nextStatus.toUpperCase()}`);
    if (selectedAdForInspect?.id === ad.id) {
      setSelectedAdForInspect(updated);
    }
  };

  const handleExtendDuration = (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingAd) return;

    const updated: AdCampaignRecord = {
      ...extendingAd,
      durationDays: extendingAd.durationDays + extraDays,
      status: 'active',
    };
    saveAd(updated);
    setAds(getStoredAds());

    recordAdAuditLog({
      campaignId: extendingAd.id,
      adminId: 'godfather_admin',
      adminEmail: 'godfather@fr8x.in',
      action: 'extended',
      previousStatus: extendingAd.status,
      newStatus: 'active',
      reason: `Authorized extension of ${extraDays} additional days added to campaign runtime.`,
    });
    setAuditLogs(getAuditLogs());
    toast(`✓ Campaign ${extendingAd.id} extended by ${extraDays} days.`);
    setExtendingAd(null);
    setSelectedAdForInspect(null);
  };

  // Filtered dataset
  const filteredAds = ads.filter((ad) => {
    const query = searchQuery.toLowerCase();
    const matchQuery =
      ad.id.toLowerCase().includes(query) ||
      ad.headline.toLowerCase().includes(query) ||
      ad.businessName.toLowerCase().includes(query) ||
      ad.contactEmail.toLowerCase().includes(query);

    if (!matchQuery) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending') return ad.status === 'submitted' || ad.status === 'pending_godfather_approval';
    if (statusFilter === 'worldwide_pending') return ad.isWorldwideRequested && ad.worldwideApprovalStatus === 'pending';
    if (statusFilter === 'active') return ad.status === 'active';
    if (statusFilter === 'paused') return ad.status === 'paused';
    if (statusFilter === 'rejected') return ad.status === 'rejected';
    if (statusFilter === 'expired') return ad.status === 'expired';
    return true;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px', maxWidth: '1440px', margin: '0 auto', background: 'var(--surface-primary, #FFFFFF)' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary, #1F2937)', margin: 0 }}>
              Advertisement Central Governance &amp; Moderation
            </h1>
            <span className="badge green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px', background: 'rgba(16, 185, 129, 0.12)', color: '#137333', border: '1px solid #CEEAD6', borderRadius: '4px' }}>
              <ShieldCheck size={12} /> Godfather Clearance Tier 1
            </span>
          </div>
          <p style={{ fontSize: '12.5px', color: 'var(--text-secondary, #64748B)', marginTop: '4px', margin: 0 }}>
            Authoritative lifecycle control: inspect creatives, verify actionable CTA buttons, enforce geographic boundaries, and adjudicate Worldwide distribution requests.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            type="button"
            className="btn secondary sm"
            onClick={() => setShowAuditModal(true)}
            style={{ height: '32px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '6px' }}
          >
            <History size={13} color="#075B5B" /> Audit Trail ({auditLogs.length})
          </button>
          <button
            type="button"
            className="btn secondary sm"
            onClick={() => {
              setAds(getStoredAds());
              setAuditLogs(getAuditLogs());
              toast('Live advertising catalog synced with Supabase storage.');
            }}
            style={{ height: '32px', fontSize: '11.5px', display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '6px' }}
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
      </div>

      {/* PHASE 6.1: 10 KEY PERFORMANCE INDICATORS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '10px' }}>
        <div style={{ padding: '12px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase' }}>Total Ads</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary, #1F2937)', marginTop: '4px' }}>{totalAds}</div>
        </div>
        <div style={{ padding: '12px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase' }}>Pending Review</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#B45309', marginTop: '4px' }}>{pendingApproval}</div>
        </div>
        <div style={{ padding: '12px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Worldwide Req</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>{pendingWorldwide}</div>
        </div>
        <div style={{ padding: '12px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#137333', textTransform: 'uppercase' }}>Active</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#137333', marginTop: '4px' }}>{activeCampaigns}</div>
        </div>
        <div style={{ padding: '12px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--accent-primary, #006B68)', textTransform: 'uppercase' }}>Approved</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--accent-primary, #006B68)', marginTop: '4px' }}>{approvedAds}</div>
        </div>
        <div style={{ padding: '12px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase' }}>Scheduled</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary, #1F2937)', marginTop: '4px' }}>{scheduledCampaigns}</div>
        </div>
        <div style={{ padding: '12px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase' }}>Paused</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-secondary, #64748B)', marginTop: '4px' }}>{pausedCampaigns}</div>
        </div>
        <div style={{ padding: '12px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#DC2626', textTransform: 'uppercase' }}>Rejected</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: '#DC2626', marginTop: '4px' }}>{rejectedAds}</div>
        </div>
        <div style={{ padding: '12px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase' }}>Expired</span>
          <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-secondary, #64748B)', marginTop: '4px' }}>{expiredCampaigns}</div>
        </div>
        <div style={{ padding: '12px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', boxShadow: '2px 2px 6px rgba(0,0,0,0.03)' }}>
          <span style={{ fontSize: '10.5px', fontWeight: 700, color: 'var(--accent-primary, #006B68)', textTransform: 'uppercase' }}>Settled Revenue</span>
          <div style={{ fontSize: '18px', fontWeight: 800, color: 'var(--accent-primary, #006B68)', marginTop: '4px' }}>₹{totalRevenueINR.toLocaleString('en-IN')}</div>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', padding: '8px 12px' }}>
        <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: `All (${totalAds})` },
            { id: 'pending', label: `Pending Review (${pendingApproval})` },
            { id: 'worldwide_pending', label: `Worldwide Pending (${pendingWorldwide})` },
            { id: 'active', label: `Active (${activeCampaigns})` },
            { id: 'paused', label: `Paused (${pausedCampaigns})` },
            { id: 'rejected', label: `Rejected (${rejectedAds})` },
          ].map((tab) => {
            const active = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setStatusFilter(tab.id as any)}
                style={{
                  height: '28px',
                  padding: '0 10px',
                  fontSize: '11.5px',
                  fontWeight: active ? 700 : 500,
                  background: active ? '#075B5B' : '#FFFFFF',
                  color: active ? '#FFFFFF' : '#526174',
                  border: active ? '1px solid #075B5B' : '1px solid var(--border-default, #D9DEE5)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: '240px' }}>
          <Search size={14} color="#526174" />
          <input
            type="text"
            placeholder="Search by ID, title, advertiser..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', height: '28px', fontSize: '11.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 8px' }}
          />
        </div>
      </div>

      {/* PHASE 6.2: CAMPAIGNS MANAGEMENT TABLE */}
      <div style={{ background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', overflow: 'hidden', boxShadow: '2px 2px 8px rgba(0,0,0,0.03)' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '12px' }}>
          <thead>
            <tr style={{ background: 'var(--surface-secondary, #F9FAFB)', borderBottom: '1px solid var(--border-default, #D9DEE5)', color: 'var(--text-primary, #1F2937)', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>
              <th style={{ padding: '10px 12px' }}>Campaign &amp; Creative</th>
              <th style={{ padding: '10px 12px' }}>Advertiser / Contact</th>
              <th style={{ padding: '10px 12px' }}>Geographic Scope</th>
              <th style={{ padding: '10px 12px' }}>Duration &amp; Tariff</th>
              <th style={{ padding: '10px 12px' }}>CTAs</th>
              <th style={{ padding: '10px 12px' }}>Status</th>
              <th style={{ padding: '10px 12px', textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAds.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '30px', textAlign: 'center', color: 'var(--text-secondary, #64748B)' }}>
                  No advertisement campaigns found matching the selected filter.
                </td>
              </tr>
            ) : (
              filteredAds.map((ad) => (
                <tr key={ad.id} style={{ borderBottom: '1px solid var(--border-subtle, #E5E7EB)' }}>
                  {/* Campaign & Creative */}
                  <td style={{ padding: '10px 12px', verticalAlign: 'top', maxWidth: '240px' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                      <div
                        style={{
                          width: '44px',
                          height: '44px',
                          borderRadius: '4px',
                          background: 'var(--surface-secondary, #F9FAFB)',
                          border: '1px solid var(--border-default, #D9DEE5)',
                          overflow: 'hidden',
                          flexShrink: 0,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {ad.creativeUrl ? (
                          <img src={ad.creativeUrl} alt="Ad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        ) : (
                          <Globe size={18} color="#075B5B" />
                        )}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <strong style={{ fontSize: '12px', color: 'var(--text-primary, #1F2937)', display: 'block', lineHeight: 1.3 }}>
                          {ad.headline}
                        </strong>
                        <span style={{ fontSize: '10.5px', color: 'var(--text-secondary, #64748B)', fontFamily: 'monospace' }}>
                          {ad.id} · {ad.category}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* Advertiser */}
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <strong style={{ fontSize: '11.5px', color: 'var(--text-primary, #1F2937)', display: 'block' }}>
                      {ad.businessName}
                    </strong>
                    <span style={{ fontSize: '10.5px', color: 'var(--text-secondary, #64748B)', display: 'block' }}>
                      {ad.contactPerson}
                    </span>
                    <a href={`mailto:${ad.contactEmail}`} style={{ fontSize: '10.5px', color: 'var(--accent-primary, #006B68)', textDecoration: 'none' }}>
                      {ad.contactEmail}
                    </a>
                  </td>

                  {/* Geographic Scope */}
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    {ad.isWorldwideRequested ? (
                      <div>
                        <span className="badge amber" style={{ fontSize: '9px', fontWeight: 700, padding: '1px 5px', background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', border: '1px solid #F59E0B', borderRadius: '3px' }}>
                          WORLDWIDE REQUESTED
                        </span>
                        <small style={{ display: 'block', fontSize: '9.5px', color: ad.worldwideApprovalStatus === 'approved' ? '#137333' : '#B45309', marginTop: '2px', fontWeight: 600 }}>
                          Status: {ad.worldwideApprovalStatus ? ad.worldwideApprovalStatus.toUpperCase() : 'PENDING'}
                        </small>
                      </div>
                    ) : (
                      <div>
                        <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary, #1F2937)' }}>
                          {ad.targetContinents.join(', ')}
                        </span>
                        <small style={{ display: 'block', fontSize: '10px', color: 'var(--text-secondary, #64748B)' }}>
                          {ad.targetCountries.slice(0, 2).join(', ')}{ad.targetCountries.length > 2 ? ` +${ad.targetCountries.length - 2}` : ''}
                        </small>
                      </div>
                    )}
                  </td>

                  {/* Duration & Tariff */}
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <strong style={{ fontSize: '11.5px', color: 'var(--accent-primary, #006B68)' }}>
                      ₹{ad.costINR.toLocaleString('en-IN')}
                    </strong>
                    <span style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-secondary, #64748B)' }}>
                      {ad.durationDays} Days ({ad.duration})
                    </span>
                    <span style={{ fontSize: '9px', color: ad.paymentStatus === 'paid' ? '#137333' : '#B45309', fontWeight: 600 }}>
                      Payment: {ad.paymentStatus.toUpperCase()}
                    </span>
                  </td>

                  {/* CTAs */}
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                      {ad.ctaButtons.map((btn) => (
                        <span key={btn.id} style={{ fontSize: '10px', background: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border-default, #D9DEE5)', padding: '1px 5px', borderRadius: '3px', color: 'var(--text-primary, #1F2937)' }}>
                          {btn.label} ({btn.type})
                        </span>
                      ))}
                    </div>
                  </td>

                  {/* Status */}
                  <td style={{ padding: '10px 12px', verticalAlign: 'top' }}>
                    <span
                      style={{
                        fontSize: '10px',
                        fontWeight: 700,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        ...(ad.status === 'active'
                          ? { background: 'rgba(16, 185, 129, 0.12)', color: '#137333', border: '1px solid #CEEAD6' }
                          : ad.status === 'pending_godfather_approval' || ad.status === 'submitted'
                          ? { background: 'rgba(217, 119, 6, 0.1)', color: '#d97706', border: '1px solid #F59E0B' }
                          : ad.status === 'rejected'
                          ? { background: 'rgba(239, 68, 68, 0.1)', color: '#dc2626', border: '1px solid #F87171' }
                          : { background: 'var(--surface-secondary, #F9FAFB)', color: 'var(--text-secondary, #64748B)', border: '1px solid var(--border-default, #D9DEE5)' }),
                      }}
                    >
                      {ad.status.toUpperCase()}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ padding: '10px 12px', verticalAlign: 'top', textAlign: 'right' }}>
                    <div style={{ display: 'flex', gap: '4px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => setSelectedAdForInspect(ad)}
                        style={{ height: '26px', padding: '0 8px', fontSize: '10.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', color: 'var(--accent-primary, #006B68)', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                      >
                        Inspect &amp; Preview
                      </button>

                      {ad.status === 'submitted' || ad.status === 'pending_godfather_approval' ? (
                        <>
                          {ad.isWorldwideRequested ? (
                            <button
                              type="button"
                              onClick={() => handleApproveWorldwide(ad)}
                              style={{ height: '26px', padding: '0 8px', fontSize: '10.5px', background: '#075B5B', border: '1px solid var(--accent-primary, #006B68)', color: '#FFFFFF', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                              title="Approve Worldwide Targeting"
                            >
                              Approve Worldwide
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleApprove(ad)}
                              style={{ height: '26px', padding: '0 8px', fontSize: '10.5px', background: '#137333', border: '1px solid #137333', color: '#FFFFFF', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                            >
                              Approve
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setRejectingAd(ad)}
                            style={{ height: '26px', padding: '0 8px', fontSize: '10.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid #DC2626', color: '#DC2626', borderRadius: '4px', cursor: 'pointer', fontWeight: 600 }}
                          >
                            Reject
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleTogglePause(ad)}
                          style={{ height: '26px', padding: '0 8px', fontSize: '10.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', color: 'var(--text-primary, #1F2937)', borderRadius: '4px', cursor: 'pointer' }}
                        >
                          {ad.status === 'active' ? 'Pause' : 'Resume'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* INSPECTOR & LIVE PREVIEW MODAL */}
      {selectedAdForInspect && (
        <Modal
          isOpen={Boolean(selectedAdForInspect)}
          onClose={() => setSelectedAdForInspect(null)}
          title={`Ad Inspection & Governance: ${selectedAdForInspect.id}`}
          maxWidth="780px"
        >
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '16px', background: 'var(--surface-primary, #FFFFFF)' }}>
            {/* Left: Administrative Metadata & Controls */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ background: 'var(--surface-secondary, #F9FAFB)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '6px', padding: '10px', fontSize: '11.5px' }}>
                <b style={{ color: 'var(--accent-primary, #006B68)', display: 'block', marginBottom: '4px' }}>Advertiser Dossier</b>
                <div><strong>Business:</strong> {selectedAdForInspect.businessName}</div>
                <div><strong>Lead Contact:</strong> {selectedAdForInspect.contactPerson} ({selectedAdForInspect.contactEmail})</div>
                <div><strong>Phone / WhatsApp:</strong> {selectedAdForInspect.contactPhone}</div>
                <div><strong>Destination URL:</strong> <a href={selectedAdForInspect.destUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--accent-primary, #006B68)' }}>{selectedAdForInspect.destUrl}</a></div>
                <div><strong>Target Corridor:</strong> {selectedAdForInspect.isWorldwideRequested ? 'Worldwide (Global)' : selectedAdForInspect.targetContinents.join(', ')}</div>
                <div><strong>Duration / Tariff:</strong> {selectedAdForInspect.durationDays} Days (₹{selectedAdForInspect.costINR.toLocaleString('en-IN')})</div>
                <div><strong>Payment Status:</strong> {selectedAdForInspect.paymentStatus.toUpperCase()}</div>
              </div>

              {/* Worldwide Clearance Decision */}
              {selectedAdForInspect.isWorldwideRequested && (
                <div style={{ background: 'rgba(217, 119, 6, 0.1)', border: '1px solid #F59E0B', borderRadius: '6px', padding: '10px', fontSize: '11.5px', color: '#d97706' }}>
                  <b style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                    <AlertTriangle size={13} /> Worldwide Clearance Pending
                  </b>
                  Advertiser requested privileged global network distribution. Only Godfather Tier 1 can authorize this scope.
                </div>
              )}

              {/* Action Buttons */}
              <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' }}>
                {selectedAdForInspect.isWorldwideRequested && selectedAdForInspect.worldwideApprovalStatus !== 'approved' && (
                  <button
                    type="button"
                    onClick={() => handleApproveWorldwide(selectedAdForInspect)}
                    style={{ height: '30px', padding: '0 12px', background: '#075B5B', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Grant Worldwide Scope &amp; Activate
                  </button>
                )}
                {selectedAdForInspect.status !== 'active' && (
                  <button
                    type="button"
                    onClick={() => handleApprove(selectedAdForInspect)}
                    style={{ height: '30px', padding: '0 12px', background: '#137333', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '11px', fontWeight: 700, cursor: 'pointer' }}
                  >
                    Approve Campaign
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setRejectingAd(selectedAdForInspect)}
                  style={{ height: '30px', padding: '0 12px', background: 'var(--surface-primary, #FFFFFF)', color: '#DC2626', border: '1px solid #DC2626', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Reject with Reason
                </button>
                <button
                  type="button"
                  onClick={() => setExtendingAd(selectedAdForInspect)}
                  style={{ height: '30px', padding: '0 12px', background: 'var(--surface-primary, #FFFFFF)', color: 'var(--text-primary, #1F2937)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                >
                  Extend Duration
                </button>
              </div>
            </div>

            {/* Right: Live Card Preview */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', borderLeft: '1px solid var(--border-default, #D9DEE5)', paddingLeft: '14px' }}>
              <span style={{ fontSize: '10.5px', color: 'var(--text-secondary, #64748B)', fontWeight: 600, marginBottom: '6px' }}>
                Live Feed Banner Preview (237 × 299 px)
              </span>
              <div
                style={{
                  width: '237px',
                  minHeight: '299px',
                  background: 'var(--surface-primary, #FFFFFF)',
                  border: '1px solid var(--border-default, #D9DEE5)',
                  borderRadius: '8px',
                  padding: '10px',
                  boxShadow: '4px 4px 10px rgba(0,0,0,0.06), -4px -4px 10px rgba(255,255,255,0.95)',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '9px', fontWeight: 700, color: 'var(--text-secondary, #64748B)' }}>SPONSORED</span>
                    <span style={{ fontSize: '9px', color: 'var(--accent-primary, #006B68)', fontWeight: 600 }}>
                      {selectedAdForInspect.isWorldwideRequested ? 'WORLDWIDE' : 'REGIONAL'}
                    </span>
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '130px',
                      borderRadius: '6px',
                      background: 'var(--surface-secondary, #F9FAFB)',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid var(--border-default, #D9DEE5)',
                    }}
                  >
                    {selectedAdForInspect.creativeUrl ? (
                      <img src={selectedAdForInspect.creativeUrl} alt="Ad" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    ) : (
                      <Globe size={24} color="#075B5B" />
                    )}
                  </div>
                  <h4 style={{ margin: '8px 0 4px', fontSize: '12px', fontWeight: 700, color: 'var(--text-primary, #1F2937)', lineHeight: 1.3 }}>
                    {selectedAdForInspect.headline}
                  </h4>
                  <p style={{ margin: 0, fontSize: '10.5px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.4 }}>
                    {selectedAdForInspect.description}
                  </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '8px', borderTop: '1px solid var(--border-default, #D9DEE5)', paddingTop: '6px' }}>
                  {selectedAdForInspect.ctaButtons.map((btn) => (
                    <div
                      key={btn.id}
                      style={{
                        width: '100%',
                        height: '24px',
                        borderRadius: '4px',
                        fontSize: '10px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '4px',
                        background: btn.style === 'primary' ? '#075B5B' : '#FFFFFF',
                        color: btn.style === 'primary' ? '#FFFFFF' : '#172B45',
                        border: '1px solid var(--border-default, #D9DEE5)',
                      }}
                    >
                      <ExternalLink size={10} /> {btn.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* REJECT WITH REASON MODAL */}
      {rejectingAd && (
        <Modal
          isOpen={Boolean(rejectingAd)}
          onClose={() => setRejectingAd(null)}
          title={`Reject Campaign: ${rejectingAd.id}`}
          maxWidth="480px"
        >
          <form onSubmit={handleRejectConfirm} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', margin: 0 }}>
              Specify the compliance or editorial violation reason. This will be transmitted to the advertiser and recorded in the immutable Godfather audit log.
            </p>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '3px' }}>
                Rejection Reason <span style={{ color: '#DC2626' }}>*</span>
              </label>
              <textarea
                className="input"
                rows={3}
                placeholder="e.g. Unverified shipping rates or misleading demurrage guarantee; please update destination URL to certified tariff schedule..."
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                style={{ width: '100%', fontSize: '11.5px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '6px 8px' }}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn secondary sm"
                onClick={() => setRejectingAd(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ height: '30px', padding: '0 14px', background: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                Confirm Rejection
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* EXTEND DURATION MODAL */}
      {extendingAd && (
        <Modal
          isOpen={Boolean(extendingAd)}
          onClose={() => setExtendingAd(null)}
          title={`Extend Campaign: ${extendingAd.id}`}
          maxWidth="440px"
        >
          <form onSubmit={handleExtendDuration} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', margin: 0 }}>
              Add additional active days to <strong>{extendingAd.headline}</strong> ({extendingAd.businessName}).
            </p>
            <div>
              <label style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '3px' }}>
                Extra Runtime (Days)
              </label>
              <select
                value={extraDays}
                onChange={(e) => setExtraDays(parseInt(e.target.value, 10))}
                style={{ width: '100%', height: '32px', fontSize: '12px', background: 'var(--surface-primary, #FFFFFF)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '0 8px' }}
              >
                <option value={3}>+3 Days</option>
                <option value={7}>+7 Days (1 Week)</option>
                <option value={14}>+14 Days (2 Weeks)</option>
                <option value={30}>+30 Days (1 Month)</option>
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn secondary sm"
                onClick={() => setExtendingAd(null)}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{ height: '30px', padding: '0 14px', background: '#075B5B', color: '#FFFFFF', border: 'none', borderRadius: '4px', fontSize: '11.5px', fontWeight: 600, cursor: 'pointer' }}
              >
                Grant Extension
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* PHASE 6.4: AUDIT TRAIL MODAL */}
      {showAuditModal && (
        <Modal
          isOpen={showAuditModal}
          onClose={() => setShowAuditModal(false)}
          title="Godfather Advertising Administrative Audit Trail"
          maxWidth="700px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '60vh', overflowY: 'auto' }}>
            {auditLogs.length === 0 ? (
              <p style={{ fontSize: '12px', color: 'var(--text-secondary, #64748B)', textAlign: 'center', padding: '20px' }}>
                No audit entries recorded yet.
              </p>
            ) : (
              auditLogs.map((log) => (
                <div
                  key={log.id}
                  style={{
                    background: 'var(--surface-secondary, #F9FAFB)',
                    border: '1px solid var(--border-default, #D9DEE5)',
                    borderRadius: '6px',
                    padding: '10px 12px',
                    fontSize: '11.5px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <strong style={{ color: 'var(--accent-primary, #006B68)' }}>
                      {log.action.toUpperCase()} · Campaign {log.campaignId}
                    </strong>
                    <span style={{ fontSize: '10px', color: 'var(--text-secondary, #64748B)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <div style={{ fontSize: '11px', color: 'var(--text-primary, #1F2937)', marginTop: '3px' }}>
                    <strong>Admin:</strong> {log.adminEmail} ({log.adminId})
                  </div>
                  {log.previousStatus && (
                    <div style={{ fontSize: '10.5px', color: 'var(--text-secondary, #64748B)' }}>
                      Status transition: <code>{log.previousStatus}</code> → <code>{log.newStatus}</code>
                    </div>
                  )}
                  {log.reason && (
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', marginTop: '4px', background: 'var(--surface-primary, #FFFFFF)', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--border-default, #D9DEE5)' }}>
                      <strong>Note:</strong> {log.reason}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
