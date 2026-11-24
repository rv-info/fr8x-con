'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNetwork } from '@/lib/context/NetworkContext';
import { presenceService } from '@/lib/presence/presenceService';
import { ChevronDown, Check, WifiOff, RefreshCw, X } from 'lucide-react';

export interface NetworkStatusPillProps {
  isOpen?: boolean;
  onToggle?: () => void;
  onClose?: () => void;
}

export function NetworkStatusPill({ isOpen: controlledIsOpen, onToggle, onClose }: NetworkStatusPillProps = {}) {
  const { isOnline, tier, isSyncing, pendingCount, measuredLatency, isLowBandwidth } = useNetwork();
  const [presence, setPresence] = useState<'active' | 'away' | 'offline'>('active');
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = controlledIsOpen !== undefined ? controlledIsOpen : internalIsOpen;

  const toggleOpen = () => {
    if (onToggle) onToggle();
    else setInternalIsOpen(!internalIsOpen);
  };

  const closeOpen = () => {
    if (onClose) onClose();
    else setInternalIsOpen(false);
  };

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
      const popoverWidth = 250;
      // If anchoring to the left would push popover past the right edge, anchor to the right
      if (typeof window !== 'undefined' && rect.left + popoverWidth > window.innerWidth - 12) {
        setAlignRight(true);
      } else {
        setAlignRight(false);
      }
    }
  }, [isOpen]);

  // Close popover on outside click and Escape key
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        closeOpen();
      }
    }
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        closeOpen();
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleSelectStatus = (newStatus: 'active' | 'away' | 'offline') => {
    setPresence(newStatus);
    presenceService.setStatus(newStatus);
    closeOpen();
  };

  // Determine current display mode:
  // If the browser/device is disconnected, availability is always Offline
  const effectiveStatus: 'active' | 'away' | 'offline' = !isOnline ? 'offline' : presence;

  const statusLabel =
    effectiveStatus === 'active' ? 'Online' : effectiveStatus === 'away' ? 'Away' : 'Offline';

  const dotColor =
    !isOnline
      ? '#526174'
      : effectiveStatus === 'active'
      ? '#075B5B'
      : effectiveStatus === 'away'
      ? '#B7791F'
      : '#526174';

  const dotGlow =
    effectiveStatus === 'active' && isOnline
      ? '0 0 6px rgba(7, 91, 91, 0.45)'
      : 'none';

  const pillBg = '#FFFFFF';
  const pillBorder = '#D9E0E8';
  const pillText = '#172B45';

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', flexShrink: 0 }} ref={popoverRef}>
      <button
        type="button"
        className="net-pill-btn"
        onClick={toggleOpen}
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
          <WifiOff size={11} style={{ color: '#526174', flexShrink: 0 }} />
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
        <ChevronDown size={11} style={{ color: '#526174', flexShrink: 0 }} />
      </button>

      {/* Screen Backdrop for mobile modal containment (does not block header controls) */}
      {isOpen && (
        <div
          className="net-pill-backdrop mobile-only"
          onClick={closeOpen}
          style={{
            position: 'fixed',
            inset: 0,
            top: '50px',
            backgroundColor: 'rgba(23, 43, 43, 0.15)',
            backdropFilter: 'blur(1px)',
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
            width: '250px',
            minWidth: '240px',
            maxWidth: 'calc(100vw - 20px)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#FFFFFF',
            borderRadius: '8px',
            boxShadow: '0 12px 28px -5px rgba(23, 43, 43, 0.18), 0 8px 12px -6px rgba(23, 43, 43, 0.10)',
            border: '1px solid #D9E0E8',
            zIndex: 1100,
            padding: '8px',
            fontSize: '12px',
            fontFamily: "'Calibri Light', Calibri, Arial, sans-serif",
            boxSizing: 'border-box',
          }}
        >
          {/* Header: Clean title & spacious Red X close button (No unsupported speed claims) */}
          <div
            style={{
              padding: '6px 10px',
              borderBottom: '1px solid #D9E0E8',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#F4F6F8',
              borderRadius: '5px',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                fontSize: '11px',
                textTransform: 'uppercase',
                fontWeight: 700,
                color: '#172B45',
                letterSpacing: '0.04em',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <span>Availability Status</span>
              {isOnline && (
                <span style={{ fontSize: '10px', color: '#075B5B', fontWeight: 600, textTransform: 'none', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                  ⚡ High-Speed
                </span>
              )}
            </span>
            <button
              type="button"
              onClick={closeOpen}
              className="close-red-box sm"
              aria-label="Close status popover"
              title="Close"
            >
              <X size={10} />
            </button>
          </div>

          {/* Syncing or Offline notice if present */}
          {(!isOnline || isSyncing || pendingCount > 0) && (
            <div
              style={{
                padding: '6px 8px',
                background: '#F4F6F8',
                borderRadius: '6px',
                border: '1px solid #D9E0E8',
                fontSize: '11.5px',
                color: '#172B45',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                flexShrink: 0,
              }}
            >
              {isSyncing ? (
                <>
                  <RefreshCw size={12} className="spin-fast" style={{ color: '#075B5B' }} />
                  <span>Syncing pending edits...</span>
                </>
              ) : !isOnline ? (
                <>
                  <WifiOff size={12} style={{ color: '#526174' }} />
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

          {/* Options Container: Enforced Strict Vertical Layout */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              width: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* 1. Online Option */}
            <button
              type="button"
              className="net-status-option-btn"
              onClick={() => handleSelectStatus('active')}
              disabled={!isOnline}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '6px',
                border: effectiveStatus === 'active' ? '1px solid #075B5B' : '1px solid #F4F6F8',
                background: effectiveStatus === 'active' ? '#F4F6F8' : '#FFFFFF',
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
                  e.currentTarget.style.borderColor = '#F4F6F8';
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
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#172B45', lineHeight: 1.2 }}>Online</div>
                  <div style={{ fontSize: '11px', color: '#526174', lineHeight: 1.25, whiteSpace: 'normal', wordBreak: 'break-word', marginTop: '2px' }}>
                    Online & available for trade
                  </div>
                </div>
              </div>
              {effectiveStatus === 'active' && <Check size={14} style={{ color: '#075B5B', flexShrink: 0, marginLeft: '6px' }} />}
            </button>

            {/* 2. Away Option */}
            <button
              type="button"
              className="net-status-option-btn"
              onClick={() => handleSelectStatus('away')}
              disabled={!isOnline}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '6px',
                border: effectiveStatus === 'away' ? '1px solid #B7791F' : '1px solid #F4F6F8',
                background: effectiveStatus === 'away' ? '#FEF3C7' : '#FFFFFF',
                cursor: !isOnline ? 'not-allowed' : 'pointer',
                opacity: !isOnline ? 0.5 : 1,
                textAlign: 'left',
                transition: 'all 0.15s ease',
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
                  e.currentTarget.style.borderColor = '#F4F6F8';
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
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#172B45', lineHeight: 1.2 }}>Away</div>
                  <div style={{ fontSize: '11px', color: '#526174', lineHeight: 1.25, whiteSpace: 'normal', wordBreak: 'break-word', marginTop: '2px' }}>
                    Temporarily away
                  </div>
                </div>
              </div>
              {effectiveStatus === 'away' && <Check size={14} style={{ color: '#B7791F', flexShrink: 0, marginLeft: '6px' }} />}
            </button>

            {/* 3. Appear Offline Option */}
            <button
              type="button"
              className="net-status-option-btn"
              onClick={() => handleSelectStatus('offline')}
              style={{
                width: '100%',
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '8px 10px',
                borderRadius: '6px',
                border: effectiveStatus === 'offline' ? '1px solid #526174' : '1px solid #F4F6F8',
                background: effectiveStatus === 'offline' ? '#F4F6F8' : '#FFFFFF',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s ease',
                boxSizing: 'border-box',
                minHeight: '44px',
              }}
              onMouseEnter={(e) => {
                if (effectiveStatus !== 'offline') {
                  e.currentTarget.style.background = '#F4F8F6';
                  e.currentTarget.style.borderColor = '#526174';
                }
              }}
              onMouseLeave={(e) => {
                if (effectiveStatus !== 'offline') {
                  e.currentTarget.style.background = '#FFFFFF';
                  e.currentTarget.style.borderColor = '#F4F6F8';
                }
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '9px', minWidth: 0, flex: 1 }}>
                <span
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#526174',
                    boxShadow: 'none',
                    flexShrink: 0,
                  }}
                />
                <div style={{ minWidth: 0, flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '12px', color: '#172B45', lineHeight: 1.2 }}>Appear Offline</div>
                  <div style={{ fontSize: '11px', color: '#526174', lineHeight: 1.25, whiteSpace: 'normal', wordBreak: 'break-word', marginTop: '2px' }}>
                    Appear offline to network
                  </div>
                </div>
              </div>
              {effectiveStatus === 'offline' && <Check size={14} style={{ color: '#526174', flexShrink: 0, marginLeft: '6px' }} />}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
