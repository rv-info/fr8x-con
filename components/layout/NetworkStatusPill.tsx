'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNetwork } from '@/lib/context/NetworkContext';
import { presenceService } from '@/lib/presence/presenceService';
import { ChevronDown, Check, WifiOff, RefreshCw, Zap, Gauge } from 'lucide-react';

export function NetworkStatusPill() {
  const { isOnline, tier, isSyncing, pendingCount, measuredLatency, isLowBandwidth } = useNetwork();
  const [presence, setPresence] = useState<'active' | 'away'>('active');
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time presence service
  useEffect(() => {
    const unsubscribe = presenceService.subscribe((status) => {
      if (status === 'away') {
        setPresence('away');
      } else {
        setPresence('active');
      }
    });
    return unsubscribe;
  }, []);

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

  const handleSelectStatus = (newStatus: 'active' | 'away') => {
    setPresence(newStatus);
    presenceService.setStatus(newStatus);
    setIsOpen(false);
  };

  // 1. Syncing state
  if (isSyncing) {
    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <div
          title="Syncing pending edits to cloud server..."
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '999px',
            background: '#e0f2fe',
            border: '1px solid #bae6fd',
            color: '#0369a1',
            fontSize: '11px',
            fontWeight: 700,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          <RefreshCw size={11} className="spin-fast" style={{ color: '#0284c7' }} />
          <span className="net-pill-text">Syncing</span>
        </div>
      </div>
    );
  }

  // 2. Completely Offline state
  if (!isOnline) {
    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        <div
          title={`Offline mode. ${pendingCount > 0 ? `${pendingCount} changes saved in local cache.` : 'Using cached data.'}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '999px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '11px',
            fontWeight: 700,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          <WifiOff size={11} style={{ color: '#dc2626' }} />
          <span className="net-pill-text">Offline{pendingCount > 0 ? ` (${pendingCount})` : ''}</span>
        </div>
      </div>
    );
  }

  // 3. Low internet speed / 2G data saver mode active
  if (isLowBandwidth) {
    return (
      <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} ref={popoverRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          title={`Low Bandwidth Active · ${measuredLatency}ms ping · Click for details`}
          aria-expanded={isOpen}
          aria-haspopup="true"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 8px',
            borderRadius: '999px',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            color: '#92400e',
            fontSize: '11px',
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.15s ease',
            lineHeight: 1,
          }}
        >
          <Zap size={11} style={{ color: '#d97706' }} />
          <span className="net-pill-text">2G Saver</span>
          <ChevronDown size={10} style={{ opacity: 0.65 }} />
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: 0,
              width: '230px',
              background: '#ffffff',
              borderRadius: '8px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
              border: '1px solid #e2e8f0',
              zIndex: 1000,
              padding: '8px',
              fontSize: '12px',
            }}
          >
            <div style={{ padding: '4px 6px 8px', borderBottom: '1px solid #f1f5f9', marginBottom: '6px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#b45309', fontWeight: 700, fontSize: '12px' }}>
                <Gauge size={14} /> Low Internet Speed Mode Active
              </div>
              <p style={{ margin: '4px 0 0', fontSize: '11px', color: '#64748b', lineHeight: 1.35 }}>
                Latency: <b>{measuredLatency}ms</b>. Data saver enabled with instant offline cache and deferred queries for maximum speed.
              </p>
            </div>

            <div style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, color: '#64748b', padding: '4px 6px' }}>
              Availability Status
            </div>

            <button
              type="button"
              onClick={() => handleSelectStatus('active')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                background: presence === 'active' ? '#ecfdf5' : 'transparent',
                cursor: 'pointer',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981' }} />
                <span style={{ fontSize: '11.5px', fontWeight: 600 }}>Live (Online)</span>
              </div>
              {presence === 'active' && <Check size={13} style={{ color: '#059669' }} />}
            </button>

            <button
              type="button"
              onClick={() => handleSelectStatus('away')}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '6px 8px',
                borderRadius: '6px',
                border: 'none',
                background: presence === 'away' ? '#fffbeb' : 'transparent',
                cursor: 'pointer',
                marginTop: '2px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#f59e0b' }} />
                <span style={{ fontSize: '11.5px', fontWeight: 600 }}>Away</span>
              </div>
              {presence === 'away' && <Check size={13} style={{ color: '#d97706' }} />}
            </button>
          </div>
        )}
      </div>
    );
  }

  // 4. Fast connection (Live / Away presence)
  const isLive = presence === 'active';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={isLive ? 'Availability: Live (Online) · Click to switch' : 'Availability: Away · Click to switch'}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '999px',
          background: isLive ? '#ecfdf5' : '#fffbeb',
          border: `1px solid ${isLive ? '#a7f3d0' : '#fde68a'}`,
          color: isLive ? '#065f46' : '#92400e',
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            background: isLive ? '#10b981' : '#f59e0b',
            boxShadow: isLive ? '0 0 0 2px rgba(16, 185, 129, 0.25)' : '0 0 0 2px rgba(245, 158, 11, 0.2)',
            flexShrink: 0,
          }}
        />
        <span className="net-pill-text">{isLive ? 'Live' : 'Away'}</span>
        <ChevronDown size={10} style={{ opacity: 0.65 }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            right: 0,
            width: '220px',
            background: '#ffffff',
            borderRadius: '8px',
            boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            border: '1px solid #e2e8f0',
            zIndex: 1000,
            padding: '6px',
            fontSize: '12px',
          }}
        >
          <div
            style={{
              padding: '6px 8px 6px',
              borderBottom: '1px solid #f1f5f9',
              marginBottom: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span
              style={{
                fontSize: '10px',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: '#64748b',
                letterSpacing: '0.04em',
              }}
            >
              Availability Status
            </span>
            <span style={{ fontSize: '9.5px', color: '#10b981', fontWeight: 600 }}>
              {tier === 'hyper' ? '⚡ 4G / High-Speed' : '3G / Adaptive'}
            </span>
          </div>

          {/* Live Option */}
          <button
            type="button"
            onClick={() => handleSelectStatus('active')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: isLive ? '#ecfdf5' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (!isLive) (e.currentTarget.style.background = '#f8fafc');
            }}
            onMouseLeave={(e) => {
              if (!isLive) (e.currentTarget.style.background = 'transparent');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#10b981',
                  boxShadow: '0 0 0 2px rgba(16, 185, 129, 0.25)',
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}>Live</div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Online & available for trade</div>
              </div>
            </div>
            {isLive && <Check size={14} style={{ color: '#059669', flexShrink: 0 }} />}
          </button>

          {/* Away Option */}
          <button
            type="button"
            onClick={() => handleSelectStatus('away')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: !isLive ? '#fffbeb' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
              marginTop: '2px',
            }}
            onMouseEnter={(e) => {
              if (isLive) (e.currentTarget.style.background = '#f8fafc');
            }}
            onMouseLeave={(e) => {
              if (isLive) (e.currentTarget.style.background = 'transparent');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#f59e0b',
                  boxShadow: '0 0 0 2px rgba(245, 158, 11, 0.2)',
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px', color: '#0f172a' }}>Away</div>
                <div style={{ fontSize: '10.5px', color: '#64748b' }}>Stepped away · Offline to contacts</div>
              </div>
            </div>
            {!isLive && <Check size={14} style={{ color: '#d97706', flexShrink: 0 }} />}
          </button>
        </div>
      )}
    </div>
  );
}
