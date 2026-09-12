'use client';

import React, { useState, useEffect } from 'react';
import {
  Send,
  Users,
  User,
  Sparkles,
  Megaphone,
  Bell,
  AlertTriangle,
  Mail,
  CheckCircle2,
  XCircle,
  Eye,
  Copy,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Monitor,
  Calendar,
  Layers,
  Search,
} from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export type BroadcastCategory = 'PROMO' | 'NEWSLETTER' | 'UPDATE' | 'MAINTENANCE';

interface RegisteredUser {
  uid: string;
  email: string;
  displayName: string;
  company: string;
  role: string;
  status: string;
  createdAt: string;
}

interface BroadcastRecord {
  id: string;
  category: BroadcastCategory;
  subject: string;
  title: string;
  badgeText: string;
  highlightNotice?: string;
  bodyContent: string;
  actionLabel?: string;
  actionUrl?: string;
  targetType: 'all' | 'specific' | 'test';
  totalRecipients: number;
  recipientsPreview: string[];
  successCount: number;
  failureCount: number;
  status: 'DELIVERED' | 'PARTIAL' | 'FAILED';
  sentAt: string;
  operatorEmail: string;
}

const PRESET_TEMPLATES: Record<
  BroadcastCategory,
  {
    subject: string;
    title: string;
    badgeText: string;
    highlightNotice: string;
    bodyContent: string;
    actionLabel: string;
    actionUrl: string;
  }
> = {
  PROMO: {
    subject: 'Exclusive Enterprise Offer — 40% Off Platform Bid Credits & Premium Access',
    title: 'Unlock Verified Enterprise Freight Rates With 40% Savings',
    badgeText: 'LIMITED-TIME COMMERCIAL PROMOTION',
    highlightNotice: 'Promo code FR8X-EXP40 is valid until the end of this month for all corporate members.',
    bodyContent: `We are pleased to offer your organization an exclusive commercial benefit to accelerate your freight procurement.

For the next 14 days, all registered corporate partners receive a 40% rebate on auction bid fees and premium freight corridor intelligence.

Key Highlights of this offer:
• Instant discounted bid fee: Only ₹180 per reverse auction bid (discounted from ₹300).
• Unrestricted access to real-time container rate intelligence on major high-volume routes.
• Dedicated account manager and prioritized customs desk assistance.

Activate your promotional credits directly in your enterprise billing portal.`,
    actionLabel: 'Claim Promotional Benefit Now',
    actionUrl: 'https://con.fr8x.in/rates',
  },
  NEWSLETTER: {
    subject: 'FR8X Freight Pulse — Monthly Global Trade & Corridor Rate Intelligence',
    title: 'Monthly Freight Market Digest & Corridor Rate Trends',
    badgeText: 'GLOBAL LOGISTICS & MARKET DIGEST',
    highlightNotice: 'Ocean freight indices on Asia-Europe & West Coast India routes showed a 6.8% rate stabilization this week.',
    bodyContent: `Welcome to this month's edition of the FR8X Freight Pulse, curated exclusively for licensed freight forwarders, cargo owners, and enterprise procurement leaders.

Market Overview & Rate Movements:
• Nhava Sheva & Mundra to Jebel Ali: Rate range stabilizing at $420–$510 per 20ft dry container.
• Mundra to Rotterdam / Antwerp: Carrier capacity returning with average transit of 26 days.
• Air Freight: Mumbai/Delhi to European hubs seeing steady demand for automotive components and pharmaceuticals.

Regulatory & Trade Updates:
• DGFT and Indian Customs have updated electronic manifest procedures under ICEGATE 2.0.
• Compliance reminder: Ensure all active export documentation contains valid IEC and GSTIN mapping.

Check our live corridor rate boards for real-time benchmark updates and active reverse auctions.`,
    actionLabel: 'Explore Live Corridor Rates',
    actionUrl: 'https://con.fr8x.in/rates',
  },
  UPDATE: {
    subject: 'Platform Release v3.2 — Live Vessel Tracking & Real-Time Corridor Feeds Now Active',
    title: 'Exciting New Features: Real-Time Corridor Tracking & Enhanced Auctions',
    badgeText: 'FR8X PLATFORM UPGRADE · VERSION 3.2',
    highlightNotice: 'All registered enterprise members now enjoy automatic real-time rate sync and instant auction notifications.',
    bodyContent: `We are thrilled to announce the deployment of FR8X Platform Update v3.2, bringing substantial performance improvements and new capabilities to your freight workspace.

What's New in this Release:
1. Live Device Time & Calendar: Synchronized live operations clock on both desktop and mobile views.
2. Direct Registration & Instant Verification: Frictionless corporate registration with instant email magic links.
3. Enhanced Rate Filter: Filter global shipping lanes and reverse auction bids by corridor with 0ms latency.
4. Knox Encrypted Security: Military-grade AES-256-GCM data encryption protecting your confidential commercial records.

Your feedback drives our continuous innovation. Sign in today to experience the updated capabilities.`,
    actionLabel: 'Open Updated Workspace',
    actionUrl: 'https://con.fr8x.in/feeds',
  },
  MAINTENANCE: {
    subject: 'Important Notice — Scheduled System Maintenance & Infrastructure Upgrade',
    title: 'Scheduled System Maintenance: Platform Infrastructure Upgrade',
    badgeText: 'TECHNICAL NOTICE · SCHEDULED DOWNTIME',
    highlightNotice: 'Maintenance Window: Sunday, September 13, 2026, from 02:00 AM to 04:30 AM IST (Total 2.5 Hours).',
    bodyContent: `Please be advised that the FR8X Technical Engineering Team will be carrying out scheduled database maintenance, encryption certificate renewal, and API infrastructure optimization.

Expected Impact:
• Reverse auction bidding and rate search will be temporarily suspended during the maintenance window.
• Active sessions and automated trade notifications will pause and resume immediately following maintenance completion.
• No customer data or auction bids will be affected. All rate submissions are safely persisted in our encrypted vault.

We schedule these maintenance operations during off-peak hours to minimize disruption to your commercial operations.

If you have urgent logistics requirements, please reach our 24/7 technical desk at support@fr8x.in.`,
    actionLabel: 'Check System Status',
    actionUrl: 'https://con.fr8x.in',
  },
};

export function GodfatherEmailBroadcastTab() {
  const { operator } = useGodfatherAuth();

  // State
  const [category, setCategory] = useState<BroadcastCategory>('PROMO');
  const [targetType, setTargetType] = useState<'all' | 'specific'>('all');
  const [specificEmailInput, setSpecificEmailInput] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);

  // Email form fields
  const [subject, setSubject] = useState(PRESET_TEMPLATES.PROMO.subject);
  const [title, setTitle] = useState(PRESET_TEMPLATES.PROMO.title);
  const [badgeText, setBadgeText] = useState(PRESET_TEMPLATES.PROMO.badgeText);
  const [highlightNotice, setHighlightNotice] = useState(PRESET_TEMPLATES.PROMO.highlightNotice);
  const [bodyContent, setBodyContent] = useState(PRESET_TEMPLATES.PROMO.bodyContent);
  const [actionLabel, setActionLabel] = useState(PRESET_TEMPLATES.PROMO.actionLabel);
  const [actionUrl, setActionUrl] = useState(PRESET_TEMPLATES.PROMO.actionUrl);

  // Preview device view: 'desktop' | 'mobile'
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'mobile'>('desktop');

  // Status & Feedback
  const [isSending, setIsSending] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Broadcast History
  const [broadcastHistory, setBroadcastHistory] = useState<BroadcastRecord[]>([]);
  const [historyFilter, setHistoryFilter] = useState<'ALL' | BroadcastCategory>('ALL');
  const [selectedViewRecord, setSelectedViewRecord] = useState<BroadcastRecord | null>(null);

  // Confirmation Modal
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Load Registered Users and History
  const fetchMetadata = async () => {
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/godfather/broadcast-email');
      const data = await res.json();
      if (data.success) {
        setRegisteredUsers(data.users || []);
        setBroadcastHistory(data.history || []);
      }
    } catch (err) {
      console.error('Error loading broadcast metadata:', err);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  useEffect(() => {
    fetchMetadata();
  }, []);

  // Preset Template Loader
  const handleLoadPreset = (cat: BroadcastCategory) => {
    setCategory(cat);
    const tmpl = PRESET_TEMPLATES[cat];
    setSubject(tmpl.subject);
    setTitle(tmpl.title);
    setBadgeText(tmpl.badgeText);
    setHighlightNotice(tmpl.highlightNotice);
    setBodyContent(tmpl.bodyContent);
    setActionLabel(tmpl.actionLabel);
    setActionUrl(tmpl.actionUrl);
    setFeedback({ type: 'success', message: `Loaded default template for ${cat}` });
    setTimeout(() => setFeedback(null), 3000);
  };

  // Add a user email to the specific recipients field
  const handleSelectUserEmail = (email: string) => {
    const list = specificEmailInput
      .split(/[,;\n]/)
      .map((s) => s.trim())
      .filter(Boolean);
    if (!list.includes(email.toLowerCase())) {
      list.push(email.toLowerCase());
      setSpecificEmailInput(list.join(', '));
    }
  };

  // Dispatch Action
  const handleExecuteBroadcast = async (isTest: boolean) => {
    if (isTest) {
      setIsSendingTest(true);
    } else {
      setIsSending(true);
      setIsConfirmModalOpen(false);
    }
    setFeedback(null);

    try {
      const res = await fetch('/api/godfather/broadcast-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category,
          subject,
          title,
          badgeText,
          highlightNotice,
          bodyContent,
          actionLabel,
          actionUrl,
          targetType,
          specificEmails: specificEmailInput,
          operatorEmail: operator?.email || 'support@fr8x.in',
          operatorName: operator?.displayName || 'Godfather Super Admin',
          isTest,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setFeedback({
          type: 'success',
          message: data.message || (isTest ? 'Test email dispatched.' : 'Broadcast sent successfully!'),
        });
        if (!isTest && data.broadcast) {
          setBroadcastHistory((prev) => [data.broadcast, ...prev]);
        }
      } else {
        setFeedback({
          type: 'error',
          message: data.error || 'Failed to dispatch broadcast email.',
        });
      }
    } catch (err: any) {
      setFeedback({
        type: 'error',
        message: err.message || 'Network error while contacting broadcast email service.',
      });
    } finally {
      setIsSending(false);
      setIsSendingTest(false);
    }
  };

  // Filtered Users for dropdown selection
  const filteredUsers = registeredUsers.filter(
    (u) =>
      u.email.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.displayName.toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.company.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  // Category Color Map
  const categoryBadgeColor: Record<BroadcastCategory, { bg: string; text: string; border: string }> = {
    PROMO: { bg: '#ecfdf5', text: '#047857', border: '#a7f3d0' },
    NEWSLETTER: { bg: '#f0f9ff', text: '#0369a1', border: '#bae6fd' },
    UPDATE: { bg: '#eef2ff', text: '#4338ca', border: '#c7d2fe' },
    MAINTENANCE: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* ── Top Header & Stats Strip ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '20px 24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '8px',
                  background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Send size={16} color="#ffffff" />
              </div>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Godfather Email Broadcast Desk
              </h2>
            </div>
            <p style={{ fontSize: '12.5px', color: '#64748b', margin: '4px 0 0' }}>
              Dispatch standardized, responsive branded HTML emails for Promotions, Newsletters, Platform Updates, and Maintenance notices to all registered members or selected clients.
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Registered Users</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a' }}>{registeredUsers.length}</div>
            </div>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '8px 14px', textAlign: 'center' }}>
              <div style={{ fontSize: '10px', color: '#64748b', fontWeight: 700, textTransform: 'uppercase' }}>Sent Broadcasts</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#0284c7' }}>{broadcastHistory.length}</div>
            </div>
            <button
              type="button"
              onClick={fetchMetadata}
              style={{
                background: '#f1f5f9',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '10px 12px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 600,
              }}
              title="Refresh registered users and history"
            >
              <RefreshCw size={14} className={isLoadingUsers ? 'animate-spin' : ''} /> Refresh
            </button>
          </div>
        </div>

        {/* Category Presets Quick Bar */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Load Quick Preset:
          </span>
          {[
            { cat: 'PROMO' as BroadcastCategory, label: 'Promotional Offer (40% Off)', icon: Sparkles, color: '#059669' },
            { cat: 'NEWSLETTER' as BroadcastCategory, label: 'Monthly Freight Newsletter', icon: Megaphone, color: '#0284c7' },
            { cat: 'UPDATE' as BroadcastCategory, label: 'Platform Update (v3.2)', icon: Bell, color: '#4f46e5' },
            { cat: 'MAINTENANCE' as BroadcastCategory, label: 'System Maintenance Notice', icon: AlertTriangle, color: '#d97706' },
          ].map((p) => {
            const Icon = p.icon;
            const isSelected = category === p.cat;
            return (
              <button
                key={p.cat}
                type="button"
                onClick={() => handleLoadPreset(p.cat)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: isSelected ? `1.5px solid ${p.color}` : '1px solid #e2e8f0',
                  background: isSelected ? '#ffffff' : '#f8fafc',
                  color: isSelected ? p.color : '#475569',
                  fontWeight: isSelected ? 700 : 500,
                  fontSize: '12px',
                  cursor: 'pointer',
                  boxShadow: isSelected ? '0 2px 4px rgba(0,0,0,0.06)' : 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={13} color={p.color} />
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Notification Feedback Banner ── */}
      {feedback && (
        <div
          style={{
            padding: '12px 18px',
            borderRadius: '8px',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            background: feedback.type === 'success' ? '#f0fdf4' : '#fef2f2',
            border: feedback.type === 'success' ? '1px solid #86efac' : '1px solid #fca5a5',
            color: feedback.type === 'success' ? '#166534' : '#991b1b',
          }}
        >
          {feedback.type === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* ── Two-Column Composer & Live Preview ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }}>
        {/* LEFT COLUMN: The Composer Form */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Layers size={16} color="#0284c7" /> Email Announcement Parameters
            </h3>
            <span style={{ fontSize: '11px', color: '#64748b' }}>
              Sender: <strong style={{ color: '#0f172a' }}>{category === 'MAINTENANCE' || category === 'UPDATE' ? 'tech@fr8x.in' : 'support@fr8x.in'}</strong>
            </span>
          </div>

          {/* Target Audience Selector */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '8px' }}>
              Recipient Audience:
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setTargetType('all')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: targetType === 'all' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: targetType === 'all' ? '#f0f9ff' : '#ffffff',
                  color: targetType === 'all' ? '#0369a1' : '#475569',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <Users size={20} color={targetType === 'all' ? '#0284c7' : '#94a3b8'} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>All Registered Users</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>
                    Broadcast to all {registeredUsers.length} verified accounts
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetType('specific')}
                style={{
                  padding: '12px 14px',
                  borderRadius: '8px',
                  border: targetType === 'specific' ? '2px solid #0284c7' : '1px solid #e2e8f0',
                  background: targetType === 'specific' ? '#f0f9ff' : '#ffffff',
                  color: targetType === 'specific' ? '#0369a1' : '#475569',
                  textAlign: 'left',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                }}
              >
                <User size={20} color={targetType === 'specific' ? '#0284c7' : '#94a3b8'} />
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700 }}>Particular Person(s)</div>
                  <div style={{ fontSize: '11px', color: '#64748b' }}>Target specific corporate email(s)</div>
                </div>
              </button>
            </div>

            {/* If Specific: show user selector and email input */}
            {targetType === 'specific' && (
              <div style={{ marginTop: '12px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#334155', display: 'block', marginBottom: '6px' }}>
                  Enter Recipient Email Address(es) (comma-separated):
                </label>
                <input
                  type="text"
                  placeholder="e.g. logistics@client.com, procurement@forwarder.in"
                  value={specificEmailInput}
                  onChange={(e) => setSpecificEmailInput(e.target.value)}
                  style={{
                    width: '100%',
                    height: '38px',
                    padding: '0 12px',
                    borderRadius: '6px',
                    border: '1px solid #cbd5e1',
                    fontSize: '13px',
                    color: '#0f172a',
                    background: '#ffffff',
                  }}
                />

                {/* Quick Add from Registered List */}
                <div style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b' }}>
                      Or Click to Pick from Registered Directory:
                    </span>
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={userSearchTerm}
                      onChange={(e) => setUserSearchTerm(e.target.value)}
                      style={{
                        padding: '2px 8px',
                        fontSize: '11px',
                        border: '1px solid #cbd5e1',
                        borderRadius: '4px',
                        width: '140px',
                        background: '#ffffff',
                      }}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', maxHeight: '100px', overflowY: 'auto' }}>
                    {filteredUsers.slice(0, 12).map((u) => (
                      <button
                        key={u.email}
                        type="button"
                        onClick={() => handleSelectUserEmail(u.email)}
                        style={{
                          fontSize: '11px',
                          background: '#ffffff',
                          border: '1px solid #cbd5e1',
                          borderRadius: '4px',
                          padding: '3px 8px',
                          cursor: 'pointer',
                          color: '#0369a1',
                          fontWeight: 600,
                        }}
                      >
                        + {u.displayName || u.email}
                      </button>
                    ))}
                    {filteredUsers.length === 0 && (
                      <span style={{ fontSize: '11px', color: '#94a3b8' }}>No matching registered users.</span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Subject Line */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
              Email Subject Line <span style={{ color: '#dc2626' }}>*</span>:
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g. Exclusive Offer: 40% Off Platform Bid Credits"
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                fontWeight: 600,
              }}
            />
          </div>

          {/* Heading & Badge */}
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                Main Email Heading <span style={{ color: '#dc2626' }}>*</span>:
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Headline inside email"
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                Badge Ribbon Tag:
              </label>
              <input
                type="text"
                value={badgeText}
                onChange={(e) => setBadgeText(e.target.value)}
                placeholder="e.g. SPECIAL PROMO"
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '12px',
                  color: '#0f172a',
                }}
              />
            </div>
          </div>

          {/* Highlight Notice Box */}
          <div>
            <label style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
              Highlight Notice Banner (Optional):
            </label>
            <input
              type="text"
              value={highlightNotice}
              onChange={(e) => setHighlightNotice(e.target.value)}
              placeholder="e.g. Maintenance Window: Sunday 02:00 AM - 04:30 AM IST"
              style={{
                width: '100%',
                height: '38px',
                padding: '0 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
              }}
            />
          </div>

          {/* Body Content */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                Email Message Content <span style={{ color: '#dc2626' }}>*</span>:
              </label>
              <span style={{ fontSize: '11px', color: '#64748b' }}>Paragraphs separated by blank lines</span>
            </div>
            <textarea
              rows={8}
              value={bodyContent}
              onChange={(e) => setBodyContent(e.target.value)}
              placeholder="Enter announcement text or HTML paragraphs..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                color: '#0f172a',
                lineHeight: 1.6,
                fontFamily: 'inherit',
                resize: 'vertical',
              }}
            />
          </div>

          {/* Action CTA Button */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                CTA Button Text:
              </label>
              <input
                type="text"
                value={actionLabel}
                onChange={(e) => setActionLabel(e.target.value)}
                placeholder="e.g. Claim Offer Now"
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#0f172a', display: 'block', marginBottom: '6px' }}>
                CTA Destination URL:
              </label>
              <input
                type="text"
                value={actionUrl}
                onChange={(e) => setActionUrl(e.target.value)}
                placeholder="https://con.fr8x.in/rates"
                style={{
                  width: '100%',
                  height: '38px',
                  padding: '0 12px',
                  borderRadius: '6px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13px',
                  color: '#0f172a',
                }}
              />
            </div>
          </div>

          {/* Dispatch Action Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '12px', borderTop: '1px solid #f1f5f9' }}>
            <button
              type="button"
              disabled={isSendingTest || isSending}
              onClick={() => handleExecuteBroadcast(true)}
              style={{
                background: '#f8fafc',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                padding: '10px 16px',
                cursor: 'pointer',
                fontSize: '12.5px',
                fontWeight: 700,
                color: '#334155',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <Mail size={15} /> {isSendingTest ? 'Sending Test...' : 'Send Test Copy to Operator'}
            </button>

            <button
              type="button"
              disabled={isSending || isSendingTest || !subject.trim() || !title.trim() || !bodyContent.trim()}
              onClick={() => setIsConfirmModalOpen(true)}
              style={{
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                padding: '10px 24px',
                cursor: isSending ? 'not-allowed' : 'pointer',
                fontSize: '13.5px',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                boxShadow: '0 4px 12px rgba(14,165,233,0.35)',
              }}
            >
              <Send size={15} />
              {isSending
                ? 'Dispatching Emails…'
                : targetType === 'all'
                ? `Dispatch to All (${registeredUsers.length} Users)`
                : 'Dispatch to Selected Recipient(s)'}
            </button>
          </div>
        </div>

        {/* RIGHT COLUMN: Live Responsive HTML Email Preview */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Eye size={16} color="#0284c7" />
              <h3 style={{ fontSize: '15px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
                Live HTML Email Preview
              </h3>
            </div>
            {/* Viewport switch: Desktop / Mobile */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#f1f5f9', padding: '3px', borderRadius: '6px' }}>
              <button
                type="button"
                onClick={() => setPreviewDevice('desktop')}
                style={{
                  border: 'none',
                  background: previewDevice === 'desktop' ? '#ffffff' : 'transparent',
                  color: previewDevice === 'desktop' ? '#0f172a' : '#64748b',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Monitor size={12} /> Desktop
              </button>
              <button
                type="button"
                onClick={() => setPreviewDevice('mobile')}
                style={{
                  border: 'none',
                  background: previewDevice === 'mobile' ? '#ffffff' : 'transparent',
                  color: previewDevice === 'mobile' ? '#0f172a' : '#64748b',
                  borderRadius: '4px',
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: '11px',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <Smartphone size={12} /> Mobile
              </button>
            </div>
          </div>

          {/* Email Subject Header Bar */}
          <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '8px 12px', fontSize: '12px', color: '#475569' }}>
            <span style={{ fontWeight: 700, color: '#0f172a' }}>Subject:</span> {subject || '(No subject provided)'}
          </div>

          {/* Rendered Email Frame */}
          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '20px',
              display: 'flex',
              justifyContent: 'center',
              overflowX: 'auto',
            }}
          >
            <div
              style={{
                width: '100%',
                maxWidth: previewDevice === 'mobile' ? '360px' : '540px',
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                overflow: 'hidden',
                transition: 'all 0.2s ease',
              }}
            >
              {/* Email Top Brand Header */}
              <div
                style={{
                  background: '#ffffff',
                  borderBottom: '1px solid #e2e8f0',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ fontSize: '20px', fontWeight: 900, color: '#0f172a', letterSpacing: '-0.03em' }}>
                  fr<span style={{ color: '#0ea5e9' }}>8</span>x
                </div>
                <div style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Official Platform Notice
                </div>
              </div>

              {/* Email Content Container */}
              <div style={{ padding: '24px 20px' }}>
                {/* Category Ribbon */}
                <div
                  style={{
                    display: 'inline-block',
                    background: categoryBadgeColor[category].bg,
                    border: `1px solid ${categoryBadgeColor[category].border}`,
                    color: categoryBadgeColor[category].text,
                    fontSize: '10px',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    marginBottom: '12px',
                  }}
                >
                  {badgeText || category}
                </div>

                {/* Email Title */}
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0f172a', margin: '0 0 14px 0', lineHeight: 1.35 }}>
                  {title || 'Announcement Title'}
                </h2>

                <p style={{ fontSize: '13px', color: '#64748b', margin: '0 0 16px 0' }}>
                  Dear <strong>Freight Partner</strong>,
                </p>

                {/* Highlight Notice Banner */}
                {highlightNotice && (
                  <div
                    style={{
                      background: categoryBadgeColor[category].bg,
                      border: `1px solid ${categoryBadgeColor[category].border}`,
                      borderLeft: `4px solid ${categoryBadgeColor[category].text}`,
                      borderRadius: '6px',
                      padding: '12px 14px',
                      margin: '16px 0',
                      fontSize: '12.5px',
                      color: categoryBadgeColor[category].text,
                      lineHeight: 1.6,
                    }}
                  >
                    <strong>NOTICE:</strong> {highlightNotice}
                  </div>
                )}

                {/* Email Body Content */}
                <div style={{ fontSize: '13px', color: '#334155', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
                  {bodyContent || 'Email announcement body content will display here.'}
                </div>

                {/* CTA Action Button */}
                {actionLabel && (
                  <div style={{ margin: '22px 0' }}>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      style={{
                        display: 'inline-block',
                        background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                        color: '#ffffff',
                        padding: '11px 26px',
                        borderRadius: '6px',
                        fontSize: '13px',
                        fontWeight: 700,
                        textDecoration: 'none',
                        letterSpacing: '0.02em',
                        boxShadow: '0 2px 8px rgba(14,165,233,0.3)',
                      }}
                    >
                      {actionLabel} &rarr;
                    </a>
                  </div>
                )}

                {/* In Touch Box */}
                <div
                  style={{
                    background: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    marginTop: '20px',
                    fontSize: '11.5px',
                    color: '#64748b',
                    lineHeight: 1.6,
                  }}
                >
                  <strong style={{ color: '#0f172a' }}>Stay in Touch with FR8X Operations:</strong>
                  <br />
                  Have questions regarding this announcement or need direct assistance? Reply directly to this email or reach our team at{' '}
                  <span style={{ color: '#0284c7', fontWeight: 700 }}>support@fr8x.in</span>.
                </div>

                {/* Signature */}
                <div style={{ marginTop: '20px', fontSize: '12px', color: '#475569', lineHeight: 1.5 }}>
                  Sincerely,
                  <br />
                  <strong style={{ color: '#0f172a', fontSize: '13px' }}>FR8X Global Freight Operations</strong>
                  <br />
                  <span style={{ color: '#94a3b8', fontSize: '11px' }}>FR8X Technology Private Limited</span>
                </div>
              </div>

              {/* Email Footer */}
              <div
                style={{
                  background: '#f8fafc',
                  borderTop: '1px solid #e2e8f0',
                  padding: '14px 20px',
                  fontSize: '10.5px',
                  color: '#94a3b8',
                  lineHeight: 1.5,
                  textAlign: 'center',
                }}
              >
                FR8X Technology Private Limited, Mumbai, Maharashtra, India.
                <br />
                Support & Grievance: support@fr8x.in &bull; con.fr8x.in
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Broadcasts Register / History Table ── */}
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0f172a', margin: 0 }}>
              Broadcast Dispatch Register & Audit History
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', margin: '3px 0 0' }}>
              Chronological log of all system emails, promotional blasts, and maintenance announcements dispatched from this desk.
            </p>
          </div>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: '6px' }}>
            {(['ALL', 'PROMO', 'NEWSLETTER', 'UPDATE', 'MAINTENANCE'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setHistoryFilter(cat)}
                style={{
                  fontSize: '11px',
                  fontWeight: historyFilter === cat ? 700 : 500,
                  padding: '4px 10px',
                  borderRadius: '6px',
                  border: historyFilter === cat ? '1px solid #0284c7' : '1px solid #e2e8f0',
                  background: historyFilter === cat ? '#f0f9ff' : '#ffffff',
                  color: historyFilter === cat ? '#0369a1' : '#64748b',
                  cursor: 'pointer',
                }}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* History Table */}
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px' }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: '1.5px solid #e2e8f0', textAlign: 'left' }}>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Type</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Subject & Headline</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Target Audience</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Recipients</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Status</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase' }}>Sent At</th>
                <th style={{ padding: '10px 14px', color: '#64748b', fontWeight: 700, fontSize: '11px', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {broadcastHistory
                .filter((r) => historyFilter === 'ALL' || r.category === historyFilter)
                .map((record) => {
                  const bColor = categoryBadgeColor[record.category] || categoryBadgeColor.UPDATE;
                  return (
                    <tr key={record.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            display: 'inline-block',
                            background: bColor.bg,
                            border: `1px solid ${bColor.border}`,
                            color: bColor.text,
                            fontSize: '10px',
                            fontWeight: 800,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            textTransform: 'uppercase',
                          }}
                        >
                          {record.category}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <div style={{ fontWeight: 700, color: '#0f172a' }}>{record.subject}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{record.title}</div>
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            color: record.targetType === 'all' ? '#0284c7' : '#475569',
                          }}
                        >
                          {record.targetType === 'all' ? 'All Registered Users' : 'Specific Recipient(s)'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontFamily: 'monospace', fontSize: '12px', fontWeight: 700, color: '#0f172a' }}>
                        {record.successCount} sent
                        {record.failureCount > 0 && (
                          <span style={{ color: '#dc2626', fontSize: '11px', marginLeft: '4px' }}>({record.failureCount} failed)</span>
                        )}
                      </td>
                      <td style={{ padding: '12px 14px' }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10.5px',
                            fontWeight: 700,
                            color: record.status === 'DELIVERED' ? '#16a34a' : record.status === 'PARTIAL' ? '#d97706' : '#dc2626',
                          }}
                        >
                          {record.status === 'DELIVERED' ? <CheckCircle2 size={12} /> : <AlertTriangle size={12} />}
                          {record.status}
                        </span>
                      </td>
                      <td style={{ padding: '12px 14px', fontSize: '11.5px', color: '#64748b' }}>
                        {new Date(record.sentAt).toLocaleString('en-IN', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td style={{ padding: '12px 14px', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => {
                            setCategory(record.category);
                            setSubject(record.subject);
                            setTitle(record.title);
                            setBadgeText(record.badgeText || '');
                            setHighlightNotice(record.highlightNotice || '');
                            setBodyContent(record.bodyContent);
                            setActionLabel(record.actionLabel || '');
                            setActionUrl(record.actionUrl || '');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          style={{
                            background: '#f1f5f9',
                            border: '1px solid #cbd5e1',
                            borderRadius: '4px',
                            padding: '3px 8px',
                            fontSize: '11px',
                            fontWeight: 600,
                            color: '#0369a1',
                            cursor: 'pointer',
                          }}
                        >
                          Reuse Draft
                        </button>
                      </td>
                    </tr>
                  );
                })}

              {broadcastHistory.length === 0 && (
                <tr>
                  <td colSpan={7} style={{ textAlign: 'center', padding: '36px', color: '#94a3b8' }}>
                    No email broadcasts dispatched yet. Use the composer above to send your first announcement.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Confirmation Modal ── */}
      {isConfirmModalOpen && (
        <ActionConfirmModal
          isOpen={isConfirmModalOpen}
          title={`Confirm Email Broadcast — ${category}`}
          actionType="BROADCAST_EMAIL_DISPATCH"
          targetLabel={targetType === 'all' ? `All Registered Users (${registeredUsers.length} accounts)` : specificEmailInput}
          targetId={`bcast_${Date.now()}`}
          beforeSnapshot={{ subject, title, category, targetType }}
          afterSnapshot={{ status: 'DISPATCHING' }}
          isDestructive={false}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={() => handleExecuteBroadcast(false)}
        />
      )}
    </div>
  );
}
