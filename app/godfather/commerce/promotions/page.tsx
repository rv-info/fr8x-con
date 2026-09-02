'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Plus,
  Trash2,
  History,
  Calendar,
  DollarSign,
  Users,
  Search,
  Check,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import {
  usePlatformConfig,
  PromotionalFeatureKey,
  PromotionalFeatureConfig,
  UserOverride,
} from '@/lib/platform-config';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';

export default function GodfatherPromotionsPage() {
  const { operator } = useGodfatherAuth();
  const {
    config,
    updatePromotionalFeature,
    addUserOverride,
    removeUserOverride,
  } = usePlatformConfig();

  // Safety Confirmation Modal State
  const [pendingGlobalChange, setPendingGlobalChange] = useState<{
    key: PromotionalFeatureKey;
    nextStatus: 'free' | 'chargeable';
    featureLabel: string;
  } | null>(null);

  // User Override Modal State
  const [overrideTargetFeature, setOverrideTargetFeature] = useState<PromotionalFeatureKey | null>(null);
  const [overrideUserId, setOverrideUserId] = useState('');
  const [overrideUserName, setOverrideUserName] = useState('');
  const [overrideUserEmail, setOverrideUserEmail] = useState('');
  const [overrideStatus, setOverrideStatus] = useState<'free' | 'chargeable'>('free');
  const [overrideReason, setOverrideReason] = useState('');
  const [overrideEndDate, setOverrideEndDate] = useState('');

  // Search & Filter for Audit Logs
  const [auditFilter, setAuditFilter] = useState('');
  const [selectedFeatureTab, setSelectedFeatureTab] = useState<PromotionalFeatureKey | 'ALL'>('ALL');

  // Handle Global Switch click (triggers safety modal)
  const handleToggleClick = (feature: PromotionalFeatureConfig) => {
    const nextStatus = feature.globalStatus === 'free' ? 'chargeable' : 'free';
    setPendingGlobalChange({
      key: feature.key,
      nextStatus,
      featureLabel: feature.label,
    });
  };

  // Confirm Global Status Change
  const confirmGlobalChange = () => {
    if (!pendingGlobalChange) return;
    const { key, nextStatus } = pendingGlobalChange;
    updatePromotionalFeature(
      key,
      {
        globalStatus: nextStatus,
        pricingMode: nextStatus === 'free' ? 'free' : 'fixed',
      },
      { id: operator.email, name: operator.displayName }
    );
    setPendingGlobalChange(null);
  };

  // Save User Override
  const handleSaveOverride = (e: React.FormEvent) => {
    e.preventDefault();
    if (!overrideTargetFeature || !overrideUserId.trim() || !overrideUserName.trim()) return;

    const override: UserOverride = {
      userId: overrideUserId.trim(),
      userName: overrideUserName.trim(),
      userEmail: overrideUserEmail.trim(),
      status: overrideStatus,
      endDate: overrideEndDate || undefined,
      reason: overrideReason.trim() || 'Godfather Administrative Override',
    };

    addUserOverride(overrideTargetFeature, override, {
      id: operator.email,
      name: operator.displayName,
    });

    // Reset Form
    setOverrideTargetFeature(null);
    setOverrideUserId('');
    setOverrideUserName('');
    setOverrideUserEmail('');
    setOverrideReason('');
    setOverrideEndDate('');
  };

  // Filtered Audit Logs
  const auditLogs = (config.promotionalAuditLogs || []).filter((log) => {
    const matchesFeature = selectedFeatureTab === 'ALL' || log.featureKey === selectedFeatureTab;
    const matchesSearch =
      auditFilter === '' ||
      log.featureLabel.toLowerCase().includes(auditFilter.toLowerCase()) ||
      log.operatorName.toLowerCase().includes(auditFilter.toLowerCase()) ||
      (log.targetUser && log.targetUser.toLowerCase().includes(auditFilter.toLowerCase())) ||
      log.newState.toLowerCase().includes(auditFilter.toLowerCase());
    return matchesFeature && matchesSearch;
  });

  return (
    <div style={{ padding: '20px 24px 40px', background: 'var(--fr8x-background)', minHeight: '100%' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span
              style={{
                background: 'var(--fr8x-outline)',
                color: '#fff',
                padding: '3px 8px',
                borderRadius: '4px',
                fontSize: '11px',
                fontWeight: 800,
                letterSpacing: '0.04em',
                fontFamily: 'var(--font-mono)',
              }}
            >
              SOVEREIGN COMMERCE
            </span>
            <span style={{ fontSize: '12px', color: 'var(--fr8x-muted)', fontWeight: 600 }}>
              Live Platform Commercial Governance
            </span>
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: 800, margin: '6px 0 2px', color: 'var(--fr8x-text)' }}>
            Promotional &amp; Commercial Settings
          </h1>
          <p style={{ fontSize: '11.5px', color: 'var(--fr8x-muted)', margin: 0 }}>
            Configure real-time commercial states (FREE / CHARGEABLE), rule precedence, selected-user overrides, and promotional periods.
          </p>
        </div>

        {/* Sovereign Indicator Card */}
        <div
          style={{
            background: '#ffffff',
            border: '1px solid var(--fr8x-outline)',
            borderRadius: '6px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'var(--fr8x-input)',
              border: '1px solid var(--fr8x-outline)',
              display: 'grid',
              placeItems: 'center',
              color: 'var(--fr8x-text)',
            }}
          >
            <ShieldCheck size={18} />
          </div>
          <div>
            <div style={{ fontSize: '10px', color: 'var(--fr8x-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
              Operating Persona
            </div>
            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--fr8x-text)' }}>
              {operator.displayName}
            </div>
          </div>
        </div>
      </div>

      {/* Rule Precedence Banner */}
      <div
        style={{
          background: 'var(--fr8x-input)',
          border: '1px solid var(--fr8x-outline)',
          borderRadius: '6px',
          padding: '10px 14px',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Lock size={15} style={{ color: 'var(--fr8x-outline)' }} />
          <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--fr8x-text)' }}>
            Deterministic Evaluation Order:
          </span>
          <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)' }}>
            1. User-Level Campaign Override &rarr; 2. Global Sovereign Rule &rarr; 3. System Defaults
          </span>
        </div>
        <div style={{ fontSize: '10.5px', color: 'var(--fr8x-text)', fontWeight: 700 }}>
          All modifications write to immutable cryptographic audit log
        </div>
      </div>

      {/* 4 CORE CONFIGURABLE FEATURES GRID */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '14px', marginBottom: '24px' }}>
        {config.promotionalFeatures.map((feature) => {
          const isFree = feature.globalStatus === 'free';
          const activeOverrides = feature.userOverrides || [];

          return (
            <div
              key={feature.key}
              style={{
                background: '#ffffff',
                border: '1px solid var(--fr8x-outline)',
                borderRadius: '6px',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: 'var(--sh)',
              }}
            >
              {/* Feature Header */}
              <div
                style={{
                  padding: '12px 14px',
                  background: 'var(--fr8x-background)',
                  borderBottom: '1px solid var(--fr8x-outline)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sparkles size={14} style={{ color: 'var(--fr8x-outline)' }} />
                  <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--fr8x-text)' }}>
                    {feature.label}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: isFree ? 'var(--fr8x-container)' : 'var(--fr8x-outline)',
                    color: isFree ? 'var(--fr8x-text)' : '#ffffff',
                    border: '1px solid var(--fr8x-outline)',
                  }}
                >
                  {isFree ? 'FREE PROMO' : 'CHARGEABLE'}
                </span>
              </div>

              {/* Feature Body */}
              <div style={{ padding: '14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <p style={{ fontSize: '11px', color: 'var(--fr8x-muted)', margin: 0, minHeight: '32px' }}>
                  {feature.description}
                </p>

                {/* Global Status Control */}
                <div
                  style={{
                    background: 'var(--fr8x-input)',
                    border: '1px solid var(--fr8x-outline)',
                    borderRadius: '5px',
                    padding: '10px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fr8x-text)' }}>
                      Global Platform State
                    </div>
                    <div style={{ fontSize: '10px', color: 'var(--fr8x-muted)' }}>
                      {isFree ? '100% Platform Fee Waiver Active' : `Standard Mode (₹${feature.priceAmount})`}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggleClick(feature)}
                    className="btn"
                    style={{
                      background: isFree ? 'var(--fr8x-outline)' : 'var(--fr8x-background)',
                      color: isFree ? '#ffffff' : 'var(--fr8x-text)',
                      border: '1px solid var(--fr8x-outline)',
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '4px 10px',
                      height: '28px',
                    }}
                  >
                    Switch to {isFree ? 'CHARGEABLE' : 'FREE'}
                  </button>
                </div>

                {/* Pricing Details Form */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <div className="field">
                    <label style={{ fontSize: '10px' }}>Pricing Mode</label>
                    <select
                      className="input"
                      value={feature.pricingMode}
                      onChange={(e) =>
                        updatePromotionalFeature(
                          feature.key,
                          { pricingMode: e.target.value as any },
                          { id: operator.email, name: operator.displayName }
                        )
                      }
                      style={{ fontSize: '11px', height: '28px' }}
                    >
                      <option value="free">Free Promotional (₹0)</option>
                      <option value="fixed">Fixed Price Amount</option>
                      <option value="unconfigured">Unconfigured</option>
                    </select>
                  </div>

                  <div className="field">
                    <label style={{ fontSize: '10px' }}>Base Price (₹)</label>
                    <input
                      type="number"
                      className="input"
                      value={feature.priceAmount}
                      disabled={feature.pricingMode === 'free'}
                      onChange={(e) =>
                        updatePromotionalFeature(
                          feature.key,
                          { priceAmount: Number(e.target.value) || 0 },
                          { id: operator.email, name: operator.displayName }
                        )
                      }
                      style={{ fontSize: '11px', height: '28px' }}
                    />
                  </div>
                </div>

                {/* User Overrides Section */}
                <div style={{ marginTop: '4px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--fr8x-text)' }}>
                      Individual User Overrides ({activeOverrides.length})
                    </span>
                    <button
                      type="button"
                      onClick={() => setOverrideTargetFeature(feature.key)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        color: 'var(--fr8x-outline)',
                        fontSize: '10.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                      }}
                    >
                      <Plus size={12} /> Add Override
                    </button>
                  </div>

                  {activeOverrides.length === 0 ? (
                    <div
                      style={{
                        background: 'var(--fr8x-background)',
                        border: '1px dashed var(--fr8x-outline)',
                        borderRadius: '4px',
                        padding: '8px',
                        textAlign: 'center',
                        fontSize: '10px',
                        color: 'var(--fr8x-muted)',
                      }}
                    >
                      No user-level campaign overrides configured.
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {activeOverrides.map((override) => (
                        <div
                          key={override.userId}
                          style={{
                            background: 'var(--fr8x-input)',
                            border: '1px solid var(--fr8x-outline)',
                            borderRadius: '4px',
                            padding: '6px 8px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            fontSize: '10.5px',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 700, color: 'var(--fr8x-text)' }}>
                              {override.userName}
                            </span>{' '}
                            <span style={{ color: 'var(--fr8x-muted)', fontSize: '9.5px' }}>
                              ({override.userId})
                            </span>
                            <div style={{ fontSize: '9px', color: 'var(--fr8x-muted)' }}>
                              Status: <b>{override.status.toUpperCase()}</b> · {override.reason || 'Override'}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              removeUserOverride(feature.key, override.userId, {
                                id: operator.email,
                                name: operator.displayName,
                              })
                            }
                            style={{
                              background: 'transparent',
                              border: 'none',
                              color: 'var(--fr8x-text)',
                              cursor: 'pointer',
                              padding: '2px',
                            }}
                            title="Remove Override"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* IMMUTABLE AUDIT LOGS SECTION */}
      <div className="card" style={{ padding: '16px 18px', borderRadius: '6px', border: '1px solid var(--fr8x-outline)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <History size={16} style={{ color: 'var(--fr8x-outline)' }} />
            <h2 style={{ fontSize: '13px', fontWeight: 800, margin: 0, color: 'var(--fr8x-text)' }}>
              Promotional Audit Trail &amp; Sovereign Modifications
            </h2>
          </div>

          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {/* Feature Filter Tabs */}
            <div className="tabs" style={{ margin: 0 }}>
              <button
                type="button"
                className={selectedFeatureTab === 'ALL' ? 'on' : ''}
                onClick={() => setSelectedFeatureTab('ALL')}
                style={{ padding: '3px 8px', fontSize: '10.5px' }}
              >
                All
              </button>
              <button
                type="button"
                className={selectedFeatureTab === 'LOGIN' ? 'on' : ''}
                onClick={() => setSelectedFeatureTab('LOGIN')}
                style={{ padding: '3px 8px', fontSize: '10.5px' }}
              >
                Login
              </button>
              <button
                type="button"
                className={selectedFeatureTab === 'JOB_POSTING' ? 'on' : ''}
                onClick={() => setSelectedFeatureTab('JOB_POSTING')}
                style={{ padding: '3px 8px', fontSize: '10.5px' }}
              >
                Jobs
              </button>
              <button
                type="button"
                className={selectedFeatureTab === 'AD_POSTING' ? 'on' : ''}
                onClick={() => setSelectedFeatureTab('AD_POSTING')}
                style={{ padding: '3px 8px', fontSize: '10.5px' }}
              >
                Ads
              </button>
              <button
                type="button"
                className={selectedFeatureTab === 'REVERSE_AUCTION' ? 'on' : ''}
                onClick={() => setSelectedFeatureTab('REVERSE_AUCTION')}
                style={{ padding: '3px 8px', fontSize: '10.5px' }}
              >
                Auctions
              </button>
            </div>

            {/* Search Input */}
            <div style={{ position: 'relative', width: '200px' }}>
              <Search size={12} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--fr8x-muted)' }} />
              <input
                type="text"
                placeholder="Search audit trail..."
                value={auditFilter}
                onChange={(e) => setAuditFilter(e.target.value)}
                className="input"
                style={{ height: '28px', paddingLeft: '26px', fontSize: '11px' }}
              />
            </div>
          </div>
        </div>

        {/* Audit Table */}
        <div className="tablewrap">
          <table className="table">
            <thead>
              <tr>
                <th>Audit ID</th>
                <th>Timestamp</th>
                <th>Operator</th>
                <th>Feature Target</th>
                <th>Scope</th>
                <th>Previous State</th>
                <th>New State</th>
                <th>Pricing Details</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '16px', color: 'var(--fr8x-muted)' }}>
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                auditLogs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '10.5px' }}>
                      {log.id}
                    </td>
                    <td style={{ fontSize: '10.5px', color: 'var(--fr8x-muted)' }}>
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      {log.operatorName}
                      <small style={{ display: 'block', color: 'var(--fr8x-muted)', fontSize: '9px' }}>
                        {log.operatorId}
                      </small>
                    </td>
                    <td style={{ fontWeight: 700 }}>
                      {log.featureLabel}
                    </td>
                    <td>
                      <span
                        style={{
                          fontSize: '9.5px',
                          fontWeight: 700,
                          padding: '1px 6px',
                          borderRadius: '3px',
                          background: log.scope === 'GLOBAL' ? 'var(--fr8x-container)' : 'var(--fr8x-input)',
                          border: '1px solid var(--fr8x-outline)',
                          color: 'var(--fr8x-text)',
                        }}
                      >
                        {log.scope}
                      </span>
                    </td>
                    <td style={{ color: 'var(--fr8x-muted)', fontSize: '10.5px' }}>
                      {log.previousState}
                    </td>
                    <td style={{ fontWeight: 700, color: 'var(--fr8x-text)', fontSize: '10.5px' }}>
                      {log.newState}
                    </td>
                    <td style={{ fontSize: '10.5px', color: 'var(--fr8x-text)' }}>
                      {log.pricingInfo}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SAFETY CONFIRMATION MODAL */}
      {pendingGlobalChange && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(46, 64, 83, 0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--fr8x-outline)',
              background: '#ffffff',
              boxShadow: 'var(--sh-md)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <AlertTriangle size={20} style={{ color: 'var(--fr8x-outline)' }} />
              <h3 style={{ margin: 0, fontSize: '15px', fontWeight: 800, color: 'var(--fr8x-text)' }}>
                Confirm Global Commercial State Flip
              </h3>
            </div>

            <p style={{ fontSize: '12px', color: 'var(--fr8x-text)', lineHeight: 1.5, margin: '0 0 14px' }}>
              You are about to switch <b>{pendingGlobalChange.featureLabel}</b> from its current state to{' '}
              <b style={{ textTransform: 'uppercase' }}>{pendingGlobalChange.nextStatus}</b> across the entire global platform.
            </p>

            <div
              style={{
                background: 'var(--fr8x-input)',
                border: '1px solid var(--fr8x-outline)',
                borderRadius: '6px',
                padding: '10px 12px',
                fontSize: '11px',
                color: 'var(--fr8x-text)',
                marginBottom: '16px',
              }}
            >
              <b>Impact:</b> This change takes effect immediately for all unoverridden enterprise accounts and writes an immutable entry to the cryptographic audit trail with operator signature: <i>{operator.email}</i>.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setPendingGlobalChange(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn primary"
                onClick={confirmGlobalChange}
              >
                Confirm Sovereign Flip
              </button>
            </div>
          </div>
        </div>
      )}

      {/* USER OVERRIDE MODAL */}
      {overrideTargetFeature && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(46, 64, 83, 0.65)',
            backdropFilter: 'blur(2px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '20px',
              borderRadius: '8px',
              border: '1px solid var(--fr8x-outline)',
              background: '#ffffff',
              boxShadow: 'var(--sh-md)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} style={{ color: 'var(--fr8x-outline)' }} />
                <h3 style={{ margin: 0, fontSize: '14px', fontWeight: 800, color: 'var(--fr8x-text)' }}>
                  Add Dedicated User Override
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setOverrideTargetFeature(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fr8x-muted)' }}
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSaveOverride} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div className="field">
                <label>User Identifier / Account UID <span className="req">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. u-arjun or user UID"
                  value={overrideUserId}
                  onChange={(e) => setOverrideUserId(e.target.value)}
                  className="input"
                />
              </div>

              <div className="field">
                <label>User / Enterprise Name <span className="req">*</span></label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Arjun Rao (Atlas Logistics)"
                  value={overrideUserName}
                  onChange={(e) => setOverrideUserName(e.target.value)}
                  className="input"
                />
              </div>

              <div className="field">
                <label>Account Email</label>
                <input
                  type="email"
                  placeholder="e.g. arjun@atlaslogistics.com"
                  value={overrideUserEmail}
                  onChange={(e) => setOverrideUserEmail(e.target.value)}
                  className="input"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div className="field">
                  <label>Override Status</label>
                  <select
                    value={overrideStatus}
                    onChange={(e) => setOverrideStatus(e.target.value as any)}
                    className="input"
                  >
                    <option value="free">FREE Override</option>
                    <option value="chargeable">CHARGEABLE Override</option>
                  </select>
                </div>

                <div className="field">
                  <label>Expiry Date (Optional)</label>
                  <input
                    type="date"
                    value={overrideEndDate}
                    onChange={(e) => setOverrideEndDate(e.target.value)}
                    className="input"
                  />
                </div>
              </div>

              <div className="field">
                <label>Commercial Rationale / Campaign Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Founding Tier-1 Partner Campaign"
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="input"
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn secondary"
                  onClick={() => setOverrideTargetFeature(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn primary"
                >
                  Save User Override
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
