'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNetwork } from '@/lib/context/NetworkContext';
import { Wifi, WifiOff, Zap, RefreshCw, CheckCircle2, ChevronDown, Database } from 'lucide-react';

export function NetworkStatusPill() {
  const { isOnline, tier, connection, pendingCount, flushOutbox } = useNetwork();
  const [isOpen, setIsOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [justSynced, setJustSynced] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Close popover on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      await flushOutbox();
      setJustSynced(true);
      setTimeout(() => setJustSynced(false), 3000);
    } finally {
      setIsSyncing(false);
    }
  };

  // Badge appearance by tier
  let badgeLabel = 'Live Sync';
  let badgeColor = '#059669'; // Green
  let badgeBg = '#ecfdf5';
  let badgeBorder = '#a7f3d0';
  let BadgeIcon = Wifi;

  if (!isOnline) {
    badgeLabel = pendingCount > 0 ? `Offline (${pendingCount})` : 'Offline Mode';
    badgeColor = '#ea580c'; // Orange
    badgeBg = '#fff7ed';
    badgeBorder = '#fed7aa';
    BadgeIcon = WifiOff;
  } else if (tier === 'saver') {
    badgeLabel = 'HyperSpeed · 3G Saver';
    badgeColor = '#0284c7'; // Blue
    badgeBg = '#f0f9ff';
    badgeBorder = '#bae6fd';
    BadgeIcon = Zap;
  } else if (tier === 'adaptive') {
    badgeLabel = 'HyperSpeed · 3G/4G';
    badgeColor = '#0284c7';
    badgeBg = '#f0f9ff';
    badgeBorder = '#bae6fd';
    BadgeIcon = Zap;
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title="HyperSpeed Network Status & Offline Resilience"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '4px 9px',
          borderRadius: '999px',
          background: badgeBg,
          border: `1px solid ${badgeBorder}`,
          color: badgeColor,
          fontSize: '11px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          lineHeight: 1,
        }}
      >
        <BadgeIcon size={12} style={{ flexShrink: 0 }} />
        <span>{badgeLabel}</span>
        {pendingCount > 0 && isOnline && (
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#ea580c',
            }}
          />
        )}
        <ChevronDown size={10} style={{ opacity: 0.6 }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '280px',
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            zIndex: 1000,
            padding: '14px',
            fontSize: '12px',
            color: '#1e293b',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #f1f5f9', paddingBottom: '10px', marginBottom: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Zap size={14} style={{ color: '#0284c7' }} />
              <span style={{ fontWeight: 700, fontSize: '12.5px', color: '#0f172a' }}>
                HyperSpeed Engine
              </span>
            </div>
            <span
              style={{
                fontSize: '10px',
                padding: '2px 6px',
                borderRadius: '4px',
                background: isOnline ? '#ecfdf5' : '#fff7ed',
                color: isOnline ? '#059669' : '#ea580c',
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Effective Speed:</span>
              <span style={{ fontWeight: 600 }}>{connection.effectiveType.toUpperCase()} ({connection.rtt}ms RTT)</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Throughput:</span>
              <span style={{ fontWeight: 600 }}>{connection.downlink ? `${connection.downlink} Mbps` : 'Adaptive'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Caching Strategy:</span>
              <span style={{ fontWeight: 600, color: '#0284c7' }}>Stale-While-Revalidate</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: '#64748b' }}>Offline Outbox:</span>
              <span style={{ fontWeight: 600, color: pendingCount > 0 ? '#ea580c' : '#059669' }}>
                {pendingCount} action{pendingCount === 1 ? '' : 's'} queued
              </span>
            </div>
          </div>

          <div style={{ background: '#f8fafc', borderRadius: '6px', padding: '8px 10px', fontSize: '11px', color: '#475569', marginBottom: '10px', lineHeight: 1.4 }}>
            ⚡ <strong>Flaky 3G/Port Tolerance:</strong> Feed cards, rate cards, and auctions render in <strong>0ms</strong> from local cache. Likes and draft updates sync automatically when connection re-establishes.
          </div>

          {pendingCount > 0 && isOnline && (
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              style={{
                width: '100%',
                padding: '7px 12px',
                borderRadius: '6px',
                background: '#0284c7',
                color: '#ffffff',
                border: 'none',
                fontWeight: 600,
                fontSize: '11.5px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
              }}
            >
              <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
              <span>{isSyncing ? 'Flushing Outbox…' : `Sync ${pendingCount} Action(s) Now`}</span>
            </button>
          )}

          {justSynced && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: '#059669', fontSize: '11px', marginTop: '6px', justifyContent: 'center' }}>
              <CheckCircle2 size={12} />
              <span>All queued offline actions synchronized!</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
