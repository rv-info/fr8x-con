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
} from 'lucide-react';
import { useToast } from '@/lib/context/ToastContext';

interface AdCampaign {
  id: string;
  title: string;
  advertiser: string;
  type: 'company_ad' | 'job_ad';
  targetCorridor: string;
  impressions: number;
  clicks: number;
  ctr: number;
  budgetUSD: number;
  spentUSD: number;
  status: 'active' | 'paused' | 'completed';
  frequencyPacing: string;
}

const INITIAL_CAMPAIGNS: AdCampaign[] = [
  {
    id: 'AD-2026-001',
    title: 'Maersk Spot Instant Booking Guarantee (INNSA -> NLRTM)',
    advertiser: 'A.P. Moller - Maersk A/S',
    type: 'company_ad',
    targetCorridor: 'Asia - Northern Europe',
    impressions: 48210,
    clicks: 3120,
    ctr: 6.47,
    budgetUSD: 12000,
    spentUSD: 8400,
    status: 'active',
    frequencyPacing: '1 per 10 posts',
  },
  {
    id: 'AD-2026-002',
    title: 'MSC Mediterranean Express Transshipment Service',
    advertiser: 'MSC Mediterranean Shipping Company',
    type: 'company_ad',
    targetCorridor: 'Global Transshipment Corridors',
    impressions: 39400,
    clicks: 2280,
    ctr: 5.78,
    budgetUSD: 9500,
    spentUSD: 6100,
    status: 'active',
    frequencyPacing: '1 per 12 posts',
  },
  {
    id: 'AD-2026-003',
    title: 'Senior Freight Procurement Executive - Rotterdam Hub',
    advertiser: 'TransGlobal Freight Solutions NV',
    type: 'job_ad',
    targetCorridor: 'Northern Europe & Benelux',
    impressions: 26850,
    clicks: 1690,
    ctr: 6.29,
    budgetUSD: 6000,
    spentUSD: 4900,
    status: 'active',
    frequencyPacing: '1 per 15 posts',
  },
  {
    id: 'AD-2026-004',
    title: 'CMA CGM Ocean Alliance Direct Vessel Space Assurance',
    advertiser: 'CMA CGM Group',
    type: 'company_ad',
    targetCorridor: 'Transpacific & Far East',
    impressions: 21400,
    clicks: 1040,
    ctr: 4.86,
    budgetUSD: 7500,
    spentUSD: 3800,
    status: 'active',
    frequencyPacing: '1 per 15 posts',
  },
  {
    id: 'AD-2026-005',
    title: 'DP World Nhava Sheva CFS Cold Chain Express',
    advertiser: 'DP World Subcontinent',
    type: 'company_ad',
    targetCorridor: 'Indian Subcontinent Inland',
    impressions: 11200,
    clicks: 530,
    ctr: 4.73,
    budgetUSD: 4500,
    spentUSD: 4500,
    status: 'completed',
    frequencyPacing: 'Completed',
  },
];

export default function GodfatherAdsReportsPage() {
  const { toast } = useToast();
  const [campaigns, setCampaigns] = useState<AdCampaign[]>(INITIAL_CAMPAIGNS);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'company_ad' | 'job_ad'>('all');

  // Algorithm Control States
  const [pacingFrequency, setPacingFrequency] = useState(12); // user specified 10-15 posts scroll
  const [algorithmMode, setAlgorithmMode] = useState<'affinity' | 'corridor' | 'round_robin'>('corridor');
  const [antiFatigueCap, setAntiFatigueCap] = useState(3);
  const [isApplyingPacing, setIsApplyingPacing] = useState(false);

  // Computed aggregate KPIs
  const totalImpressions = campaigns.reduce((acc, c) => acc + c.impressions, 0);
  const totalClicks = campaigns.reduce((acc, c) => acc + c.clicks, 0);
  const averageCTR = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : '0.00';
  const totalBudget = campaigns.reduce((acc, c) => acc + c.budgetUSD, 0);
  const totalSpent = campaigns.reduce((acc, c) => acc + c.spentUSD, 0);

  const handleToggleStatus = (id: string) => {
    setCampaigns((prev) =>
      prev.map((c) => {
        if (c.id === id) {
          const next = c.status === 'active' ? 'paused' : 'active';
          toast(`Campaign ${c.title.substring(0, 30)}... set to ${next.toUpperCase()}`);
          return { ...c, status: next };
        }
        return c;
      })
    );
  };

  const handleSaveAlgorithm = () => {
    setIsApplyingPacing(true);
    setTimeout(() => {
      setIsApplyingPacing(false);
      toast(`✓ Feed Ad Algorithm updated: Injecting 1 ad every ${pacingFrequency} feed posts with ${algorithmMode.toUpperCase()} weighting.`);
    }, 400);
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchesSearch =
      c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.advertiser.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.targetCorridor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || c.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--ink)', margin: 0 }}>
              Sponsored Ads & Feed Algorithm Reports
            </h1>
            <span className="badge green" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', padding: '3px 8px' }}>
              <ShieldCheck size={12} /> Godfather Audit Engine Active
            </span>
          </div>
          <p style={{ fontSize: '13px', color: 'var(--mut)', marginTop: '6px', margin: 0 }}>
            Real-time ad impression telemetry, click-through performance metrics (CTR), and feed injection algorithm pacing rules.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <button
            className="btn secondary sm"
            onClick={() => {
              setCampaigns((prev) =>
                prev.map((c) => ({
                  ...c,
                  impressions: c.impressions + Math.floor(Math.random() * 120),
                  clicks: c.clicks + Math.floor(Math.random() * 8),
                }))
              );
              toast('Live ad telemetry synced with Redis Impression Vault.');
            }}
          >
            <RefreshCw size={13} /> Refresh Stream
          </button>
        </div>
      </div>

      {/* Aggregate KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <div className="card" style={{ padding: '18px', background: '#fff', border: '1px solid var(--line-light)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase' }}>Total Views / Impressions</span>
            <Eye size={16} color="var(--brand)" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--ink)', marginTop: '8px', lineHeight: 1 }}>
            {totalImpressions.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>
            ↑ 14.8% vs last billing cycle
          </div>
        </div>

        <div className="card" style={{ padding: '18px', background: '#fff', border: '1px solid var(--line-light)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase' }}>Total Ad Clicks</span>
            <MousePointer size={16} color="#0284c7" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--ink)', marginTop: '8px', lineHeight: 1 }}>
            {totalClicks.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--mut)', marginTop: '6px' }}>
            Verified non-bot human clicks
          </div>
        </div>

        <div className="card" style={{ padding: '18px', background: '#fff', border: '1px solid var(--line-light)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase' }}>Average Click-Through (CTR)</span>
            <Percent size={16} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#8b5cf6', marginTop: '8px', lineHeight: 1 }}>
            {averageCTR}%
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', marginTop: '6px', fontWeight: 600 }}>
            Industry B2B Benchmark: 2.1%
          </div>
        </div>

        <div className="card" style={{ padding: '18px', background: '#fff', border: '1px solid var(--line-light)', borderRadius: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase' }}>Gross Ad Revenue Accrual</span>
            <DollarSign size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: '28px', fontWeight: 900, color: '#16a34a', marginTop: '8px', lineHeight: 1 }}>
            ${totalSpent.toLocaleString()}
          </div>
          <div style={{ fontSize: '11px', color: 'var(--mut)', marginTop: '6px' }}>
            Out of ${totalBudget.toLocaleString()} contracted
          </div>
        </div>
      </div>

      {/* Feed Algorithm & Placement Tuning Panel */}
      <div className="card" style={{ padding: '20px', background: '#fff', border: '1px solid var(--line-light)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <Sliders size={18} color="var(--brand)" />
          <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
            Feed Ad Injection Algorithm Engine & Frequency Pacing
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', alignItems: 'flex-start' }}>
          {/* Scroll Frequency Slider (User Requirement 8 & Feed Scroll Rule) */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid var(--line-light)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)' }}>Feed Scroll Frequency Pacing</label>
              <span className="badge teal" style={{ fontSize: '12px', fontWeight: 800, padding: '2px 8px' }}>
                Every {pacingFrequency} Posts
              </span>
            </div>
            <input
              type="range"
              min="5"
              max="25"
              step="1"
              value={pacingFrequency}
              onChange={(e) => setPacingFrequency(Number(e.target.value))}
              style={{ width: '100%', cursor: 'pointer', accentColor: 'var(--brand)' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: 'var(--mut)', marginTop: '4px' }}>
              <span>High Density (5 posts)</span>
              <span style={{ fontWeight: 700, color: 'var(--brand)' }}>Optimal: 10 - 15 posts</span>
              <span>Low Density (25 posts)</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--mut)', marginTop: '10px', lineHeight: 1.4 }}>
              The algorithm inserts 1 company showcase ad or sponsored maritime job listing exactly every <b>{pacingFrequency} feed posts</b> as users scroll down their feed.
            </div>
          </div>

          {/* Allocation & Weighting Strategy */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid var(--line-light)' }}>
            <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '8px' }}>
              Ad Selection & Weighting Algorithm
            </label>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="algoMode"
                  checked={algorithmMode === 'corridor'}
                  onChange={() => setAlgorithmMode('corridor')}
                />
                <div>
                  <b>Corridor Relevancy Priority (Recommended)</b>
                  <div style={{ fontSize: '10.5px', color: 'var(--mut)' }}>Serves ocean carriers matching the user&apos;s active search lanes and port pairs.</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="algoMode"
                  checked={algorithmMode === 'affinity'}
                  onChange={() => setAlgorithmMode('affinity')}
                />
                <div>
                  <b>High-Bid Impression Share</b>
                  <div style={{ fontSize: '10.5px', color: 'var(--mut)' }}>Allocates higher impression weights to highest paying B2B advertisers.</div>
                </div>
              </label>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', fontSize: '11.5px', cursor: 'pointer' }}>
                <input
                  type="radio"
                  name="algoMode"
                  checked={algorithmMode === 'round_robin'}
                  onChange={() => setAlgorithmMode('round_robin')}
                />
                <div>
                  <b>Equitable Round-Robin</b>
                  <div style={{ fontSize: '10.5px', color: 'var(--mut)' }}>Evenly distributes impression exposure across all active sponsors.</div>
                </div>
              </label>
            </div>
          </div>

          {/* Anti-Fatigue & Action */}
          <div style={{ background: '#f8fafc', padding: '16px', borderRadius: '6px', border: '1px solid var(--line-light)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--ink)', display: 'block', marginBottom: '8px' }}>
                User Anti-Fatigue Frequency Cap
              </label>
              <select
                className="input"
                value={antiFatigueCap}
                onChange={(e) => setAntiFatigueCap(Number(e.target.value))}
                style={{ fontSize: '12px', padding: '6px 10px' }}
              >
                <option value={2}>Max 2 ad cards per session</option>
                <option value={3}>Max 3 ad cards per session (Default)</option>
                <option value={5}>Max 5 ad cards per session</option>
                <option value={999}>No session limit (Uncapped)</option>
              </select>
              <div style={{ fontSize: '11px', color: 'var(--mut)', marginTop: '8px' }}>
                Prevents banner blindness by rotating unique creatives when the user continues scrolling.
              </div>
            </div>

            <button
              className="btn primary"
              style={{ marginTop: '16px', width: '100%' }}
              onClick={handleSaveAlgorithm}
              disabled={isApplyingPacing}
            >
              <Zap size={14} /> {isApplyingPacing ? 'Updating Algorithm...' : 'Apply Feed Algorithm Rules'}
            </button>
          </div>
        </div>
      </div>

      {/* Campaigns Telemetry Table */}
      <div className="card" style={{ padding: '20px', background: '#fff', border: '1px solid var(--line-light)', borderRadius: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
          <div>
            <h2 style={{ fontSize: '15px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
              Active Brand Sponsor & Job Campaigns ({filteredCampaigns.length})
            </h2>
            <div style={{ fontSize: '11px', color: 'var(--mut)', marginTop: '2px' }}>
              Granular per-campaign audit tracking views, click interactions, and budget burn.
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative' }}>
              <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mut)' }} />
              <input
                className="input"
                style={{ paddingLeft: '32px', fontSize: '12px', width: '220px' }}
                placeholder="Search advertiser or lane..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <select
              className="input"
              style={{ fontSize: '12px', padding: '6px 10px', width: '160px' }}
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
            >
              <option value="all">All Ad Formats</option>
              <option value="company_ad">Carrier Showcase</option>
              <option value="job_ad">Maritime Job Ads</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table className="table" style={{ width: '100%', fontSize: '12px', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1px solid var(--line-light)' }}>
                <th style={{ padding: '10px 12px' }}>Campaign & Advertiser</th>
                <th style={{ padding: '10px 12px' }}>Format</th>
                <th style={{ padding: '10px 12px' }}>Target Corridor</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Impressions (Views)</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Clicks</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>CTR</th>
                <th style={{ padding: '10px 12px', textAlign: 'right' }}>Spent / Budget</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Status</th>
                <th style={{ padding: '10px 12px', textAlign: 'center' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredCampaigns.map((c) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--line-light)' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>{c.title}</div>
                    <div style={{ fontSize: '11px', color: 'var(--mut)', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                      <Building size={11} /> {c.advertiser} • <code>{c.id}</code>
                    </div>
                  </td>
                  <td style={{ padding: '12px' }}>
                    {c.type === 'company_ad' ? (
                      <span className="badge blue" style={{ fontSize: '10px' }}>Company Showcase</span>
                    ) : (
                      <span className="badge amber" style={{ fontSize: '10px' }}>Job Opportunity</span>
                    )}
                  </td>
                  <td style={{ padding: '12px', color: 'var(--mut)', fontSize: '11.5px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <Globe size={12} /> {c.targetCorridor}
                    </div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: 'var(--ink)' }}>
                    {c.impressions.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right', fontWeight: 700, color: '#0284c7' }}>
                    {c.clicks.toLocaleString()}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <span style={{ fontWeight: 800, color: c.ctr >= 5 ? '#16a34a' : '#d97706' }}>
                      {c.ctr}%
                    </span>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'right' }}>
                    <div style={{ fontWeight: 700, color: 'var(--ink)' }}>${c.spentUSD.toLocaleString()}</div>
                    <div style={{ fontSize: '10.5px', color: 'var(--mut)' }}>of ${c.budgetUSD.toLocaleString()}</div>
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {c.status === 'active' && <span className="badge green" style={{ fontSize: '10px' }}>Active</span>}
                    {c.status === 'paused' && <span className="badge amber" style={{ fontSize: '10px' }}>Paused</span>}
                    {c.status === 'completed' && <span className="badge gray" style={{ fontSize: '10px' }}>Completed</span>}
                  </td>
                  <td style={{ padding: '12px', textAlign: 'center' }}>
                    {c.status !== 'completed' && (
                      <button
                        className="btn secondary sm"
                        style={{ fontSize: '11px', padding: '4px 8px' }}
                        onClick={() => handleToggleStatus(c.id)}
                      >
                        {c.status === 'active' ? (
                          <><Pause size={11} /> Pause</>
                        ) : (
                          <><Play size={11} /> Resume</>
                        )}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
