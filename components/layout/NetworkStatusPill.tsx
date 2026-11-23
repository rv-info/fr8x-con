'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNetwork } from '@/lib/context/NetworkContext';
import { presenceService } from '@/lib/presence/presenceService';
import { ChevronDown, Check, WifiOff, RefreshCw, X } from 'lucide-react';

export function NetworkStatusPill() {
  const { isOnline, tier, isSyncing, pendingCount, measuredLatency, isLowBandwidth } = useNetwork();
  const [presence, setPresence] = useState<'active' | 'away' | 'offline'>('active');
  const [isOpen, setIsOpen] = useState(false);
  const [alignRight, setAlignRight] = useState(false);
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

  // Viewport collision awareness: determine if popover should anchor left or right
  useEffect(() => {
    if (isOpen && popoverRef.current) {
      const rect = popoverRef.current.getBoundingClientRect();
      // If button is located close to the right edge (< 250px space), align popover to right
      if (typeof window !== 'undefined' && window.innerWidth - rect.left < 250) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  }, [isOpen]);

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

  const dotColor =
    !isOnline
      ? '#66736F'
      : effectiveStatus === 'active'
      ? '#075B5B'
      : effectiveStatus === 'away'
      ? '#B7791F'
      : '#66736F';

  const dotGlow =
    effectiveStatus === 'active' && isOnline
      ? '0 0 6px rgba(7, 91, 91, 0.45)'
      : 'none';

  const pillBg = '#FFFFFF';

  const pillBorder = '#D5DEDA';

  const pillText = '#172B2B';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }} ref={popoverRef}>
      <button
        type="button"
        className="net-pill-btn"
        onClick={() => setIsOpen(!isOpen)}
        title={`Status: ${statusLabel}${isLowBandwidth ? ' · Data Saver Active' : ''} · Click to switch`}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '0 8px',
          height: '30px',
          minWidth: '76px',
          flexShrink: 0,
          boxSizing: 'border-box',
          borderRadius: '6px',
          background: pillBg,
          border: `1px solid ${pillBorder}`,
          color: pillText,
          fontSize: '12px',
          fontFamily: "'Calibri Light', Calibri, Arial, sans-serif",
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          lineHeight: 1,
          whiteSpace: 'nowrap',
        }}
      >
        {isSyncing ? (
          <RefreshCw size={11} className="spin-fast" style={{ color: pillText, flexShrink: 0 }} />
        ) : !isOnline ? (
          <WifiOff size={11} style={{ color: '#66736F', flexShrink: 0 }} />
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
        <span className="net-pill-text" style={{ flexShrink: 0, lineHeight: 1 }}>{statusLabel}</span>
        <ChevronDown size={11} style={{ color: '#66736F', flexShrink: 0 }} />
      </button>

      {/* Mobile / Screen Backdrop to prevent touch bleed-through */}
      {isOpen && (
        <div
          className="net-pill-backdrop mobile-only"
          onClick={() => setIsOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(23, 43, 43, 0.25)',
            backdropFilter: 'blur(2px)',
            zIndex: 1099,
          }}
        />
      )}

      {isOpen && (
        <div
          className="net-pill-popover"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: alignRight ? 'auto' : 0,
            right: alignRight ? 0 : 'auto',
            width: '240px',
            maxWidth: 'calc(100vw - 20px)',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 12px 28px -5px rgba(23, 43, 43, 0.18), 0 8px 12px -6px rgba(23, 43, 43, 0.10)',
            border: '1px solid #D5DEDA',
            zIndex: 1100,
            padding: '8px',
            fontSize: '12px',
            fontFamily: "'Calibri Light', Calibri, Arial, sans-serif",
            boxSizing: 'border-box',
          }}
        >
          {/* Header with Connection Intelligence */}
          <div
            style={{
              padding: '6px 8px',
              borderBottom: '1px solid #D5DEDA',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#E8F0ED',
              borderRadius: '5px',
            }}
          >
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: '#172B2B',
                letterSpacing: '0.04em',
              }}
            >
              Availability Status
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontSize: '10.5px',
                  color: !isOnline ? '#66736F' : isLowBandwidth ? '#B7791F' : '#075B5B',
                  fontWeight: 600,
                }}
              >
                {!isOnline
                  ? 'Offline'
                  : isLowBandwidth
                  ? '⚡ 2G Saver'
                  : tier === 'hyper'
                  ? '⚡ High-Speed'
                  : 'Adaptive'}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="close-red-box sm"
                aria-label="Close status popover"
              >
                <X size={10} />
              </button>
            </div>
          </div>

          {/* Syncing or Offline notice if present */}
          {(!isOnline || isSyncing || pendingCount > 0) && (
            <div
              style={{
                padding: '6px 8px',
                background: '#E8F0ED',
                borderRadius: '6px',
                border: '1px solid #D5DEDA',
                fontSize: '11.5px',
                color: '#172B2B',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={12} className="spin-fast" style={{ color: '#075B5B' }} />
                  <span>Syncing pending edits...</span>
                </>
              ) : !isOnline ? (
                <>
                  <WifiOff size={12} style={{ color: '#66736F' }} />
                  <span>Offline mode · Edits queued</span>
                </>
              ) : pendingCount > 0 ? (
                <>
                  <RefreshCw size={12} style={{ color: '#075B5B' }} />
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
              border: effectiveStatus === 'active' ? '1px solid #075B5B' : '1px solid #E8F0ED',
              background: effectiveStatus === 'active' ? '#E8F0ED' : '#FFFFFF',
              cursor: !isOnline ? 'not-allowed' : 'pointer',
              opacity: !isOnline ? 0.5 : 1,
              textAlign: 'left',
              transition: 'all 0.15s ease',
              boxSizing: 'border-box',
              minHeight: '44px',
            }}
            onMouseEnter={(e) => {
              if (effectiveStatus !== 'active' && isOnline) {
                e.currentTarget.style.background = '#F4F8F6';
                e.currentTarget.style.borderColor = '#075B5B';
              }
            }}
            onMouseLeave={(e) => {
              if (effectiveStatus !== 'active') {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = '#E8F0ED';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#075B5B',
                  boxShadow: '0 0 5px rgba(7, 91, 91, 0.4)',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#172B2B', lineHeight: 1.2 }}>Online</div>
                <div style={{ fontSize: '11px', color: '#66736F', lineHeight: 1.25, whiteSpace: 'normal', wordBreak: 'break-word', marginTop: '2px' }}>
                  Available for trade & direct RFQs
                </div>
              </div>
            </div>
            {effectiveStatus === 'active' && <Check size={14} style={{ color: '#075B5B', flexShrink: 0, marginLeft: '6px' }} />}
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
              border: effectiveStatus === 'away' ? '1px solid #B7791F' : '1px solid #E8F0ED',
              background: effectiveStatus === 'away' ? '#FEF3C7' : '#FFFFFF',
              cursor: !isOnline ? 'not-allowed' : 'pointer',
              opacity: !isOnline ? 0.5 : 1,
              textAlign: 'left',
              transition: 'all 0.15s ease',
              marginTop: '4px',
              boxSizing: 'border-box',
              minHeight: '44px',
            }}
            onMouseEnter={(e) => {
              if (effectiveStatus !== 'away' && isOnline) {
                e.currentTarget.style.background = '#F4F8F6';
                e.currentTarget.style.borderColor = '#B7791F';
              }
            }}
            onMouseLeave={(e) => {
              if (effectiveStatus !== 'away') {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = '#E8F0ED';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#B7791F',
                  boxShadow: 'none',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#172B2B', lineHeight: 1.2 }}>Away</div>
                <div style={{ fontSize: '11px', color: '#66736F', lineHeight: 1.25, whiteSpace: 'normal', wordBreak: 'break-word', marginTop: '2px' }}>
                  Stepped away · Offline to contacts
                </div>
              </div>
            </div>
            {effectiveStatus === 'away' && <Check size={14} style={{ color: '#B7791F', flexShrink: 0, marginLeft: '6px' }} />}
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
              border: effectiveStatus === 'offline' ? '1px solid #66736F' : '1px solid #E8F0ED',
              background: effectiveStatus === 'offline' ? '#E8F0ED' : '#FFFFFF',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.15s ease',
              marginTop: '4px',
              boxSizing: 'border-box',
              minHeight: '44px',
            }}
            onMouseEnter={(e) => {
              if (effectiveStatus !== 'offline') {
                e.currentTarget.style.background = '#F4F8F6';
                e.currentTarget.style.borderColor = '#66736F';
              }
            }}
            onMouseLeave={(e) => {
              if (effectiveStatus !== 'offline') {
                e.currentTarget.style.background = '#FFFFFF';
                e.currentTarget.style.borderColor = '#E8F0ED';
              }
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
              <span
                style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: '#66736F',
                  boxShadow: 'none',
                  flexShrink: 0,
                }}
              />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: '12px', color: '#172B2B', lineHeight: 1.2 }}>Offline</div>
                <div style={{ fontSize: '11px', color: '#66736F', lineHeight: 1.25, whiteSpace: 'normal', wordBreak: 'break-word', marginTop: '2px' }}>
                  Appear offline to network
                </div>
              </div>
            </div>
            {effectiveStatus === 'offline' && <Check size={14} style={{ color: '#66736F', flexShrink: 0, marginLeft: '6px' }} />}
          </button>
        </div>
      )}
    </div>
  );
}
