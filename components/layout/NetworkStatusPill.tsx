'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNetwork } from '@/lib/context/NetworkContext';
import { presenceService } from '@/lib/presence/presenceService';
import { ChevronDown, Check, WifiOff, RefreshCw } from 'lucide-react';

export function NetworkStatusPill() {
  const { isOnline, tier, isSyncing, pendingCount, measuredLatency, isLowBandwidth } = useNetwork();
  const [presence, setPresence] = useState<'active' | 'away' | 'offline'>('active');
  const [isOpen, setIsOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Subscribe to real-time presence service
  useEffect(() => {
    const unsubscribe = presenceService.subscribe((status) => {
      if (status === 'away') {
        setPresence('away');
      } else if (status === 'offline') {
        setPresence('offline');
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

  const handleSelectStatus = (newStatus: 'active' | 'away' | 'offline') => {
    setPresence(newStatus);
    presenceService.setStatus(newStatus);
    setIsOpen(false);
  };

  // Determine current display mode:
  // If the browser/device is disconnected, availability is always Offline
  const effectiveStatus: 'active' | 'away' | 'offline' = !isOnline ? 'offline' : presence;

  const statusLabel =
    effectiveStatus === 'active' ? 'Online' : effectiveStatus === 'away' ? 'Away' : 'Offline';

  const dotColor = '#000000';

  const dotGlow = 'none';

  const pillBg = '#FFFFFF';

  const pillBorder = '#E6E6E6';

  const pillText = '#000000';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={`Status: ${statusLabel}${isLowBandwidth ? ' · Data Saver Active' : ''} · Click to switch`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '5px',
          padding: '3px 8px',
          borderRadius: '999px',
          background: pillBg,
          border: `1px solid ${pillBorder}`,
          color: pillText,
          fontSize: '11px',
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          lineHeight: 1,
        }}
      >
        {isSyncing ? (
          <RefreshCw size={11} className="spin-fast" style={{ color: pillText, flexShrink: 0 }} />
        ) : !isOnline ? (
          <WifiOff size={11} style={{ color: '#000000', flexShrink: 0 }} />
        ) : (
          <span
            style={{
              display: 'inline-block',
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: dotColor,
              boxShadow: dotGlow,
              flexShrink: 0,
            }}
          />
        )}
        <span className="net-pill-text">{statusLabel}</span>
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
            border: '1px solid #E6E6E6',
            zIndex: 1000,
            padding: '6px',
            fontSize: '12px',
          }}
        >
          {/* Header with Connection Intelligence */}
          <div
            style={{
              padding: '6px 8px 6px',
              borderBottom: '1px solid #E6E6E6',
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
                color: '#000000',
                letterSpacing: '0.04em',
              }}
            >
              Availability Status
            </span>
            <span
              style={{
                fontSize: '9.5px',
                color: '#000000',
                fontWeight: 600,
              }}
            >
              {!isOnline
                ? '⚠️ Offline'
                : isLowBandwidth
                ? '⚡ 2G / Data Saver'
                : tier === 'hyper'
                ? '⚡ 4G / High-Speed'
                : '3G / Adaptive'}
            </span>
          </div>

          {/* Syncing or Offline notice if present */}
          {(!isOnline || isSyncing || pendingCount > 0) && (
            <div
              style={{
                padding: '6px 8px',
                background: '#FFFFFF',
                borderRadius: '6px',
                border: '1px solid #E6E6E6',
                fontSize: '11px',
                color: '#000000',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={12} className="spin-fast" />
                  <span>Syncing pending edits to server...</span>
                </>
              ) : !isOnline ? (
                <>
                  <WifiOff size={12} />
                  <span>Working offline · Changes queued</span>
                </>
              ) : pendingCount > 0 ? (
                <>
                  <RefreshCw size={12} />
                  <span>{pendingCount} offline changes saved</span>
                </>
              ) : null}
            </div>
          )}

          {/* Online Option */}
          <button
            type="button"
            onClick={() => handleSelectStatus('active')}
            disabled={!isOnline}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: effectiveStatus === 'active' ? '#E6E6E6' : 'transparent',
              cursor: !isOnline ? 'not-allowed' : 'pointer',
              opacity: !isOnline ? 0.5 : 1,
              textAlign: 'left',
              transition: 'background 0.15s ease',
            }}
            onMouseEnter={(e) => {
              if (effectiveStatus !== 'active' && isOnline) (e.currentTarget.style.background = '#E6E6E6');
            }}
            onMouseLeave={(e) => {
              if (effectiveStatus !== 'active') (e.currentTarget.style.background = 'transparent');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#000000',
                  boxShadow: 'none',
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px', color: '#000000' }}>Online</div>
                <div style={{ fontSize: '10.5px', color: '#000000' }}>Online & available for trade</div>
              </div>
            </div>
            {effectiveStatus === 'active' && <Check size={14} style={{ color: '#000000', flexShrink: 0 }} />}
          </button>

          {/* Away Option */}
          <button
            type="button"
            onClick={() => handleSelectStatus('away')}
            disabled={!isOnline}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: effectiveStatus === 'away' ? '#E6E6E6' : 'transparent',
              cursor: !isOnline ? 'not-allowed' : 'pointer',
              opacity: !isOnline ? 0.5 : 1,
              textAlign: 'left',
              transition: 'background 0.15s ease',
              marginTop: '2px',
            }}
            onMouseEnter={(e) => {
              if (effectiveStatus !== 'away' && isOnline) (e.currentTarget.style.background = '#E6E6E6');
            }}
            onMouseLeave={(e) => {
              if (effectiveStatus !== 'away') (e.currentTarget.style.background = 'transparent');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#000000',
                  boxShadow: 'none',
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px', color: '#000000' }}>Away</div>
                <div style={{ fontSize: '10.5px', color: '#000000' }}>Stepped away · Offline to contacts</div>
              </div>
            </div>
            {effectiveStatus === 'away' && <Check size={14} style={{ color: '#000000', flexShrink: 0 }} />}
          </button>

          {/* Offline Option */}
          <button
            type="button"
            onClick={() => handleSelectStatus('offline')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              borderRadius: '6px',
              border: 'none',
              background: effectiveStatus === 'offline' ? '#E6E6E6' : 'transparent',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'background 0.15s ease',
              marginTop: '2px',
            }}
            onMouseEnter={(e) => {
              if (effectiveStatus !== 'offline') (e.currentTarget.style.background = '#E6E6E6');
            }}
            onMouseLeave={(e) => {
              if (effectiveStatus !== 'offline') (e.currentTarget.style.background = 'transparent');
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#000000',
                  boxShadow: 'none',
                  flexShrink: 0,
                }}
              />
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px', color: '#000000' }}>Offline</div>
                <div style={{ fontSize: '10.5px', color: '#000000' }}>Appear offline to network</div>
              </div>
            </div>
            {effectiveStatus === 'offline' && <Check size={14} style={{ color: '#000000', flexShrink: 0 }} />}
          </button>
        </div>
      )}
    </div>
  );
}
