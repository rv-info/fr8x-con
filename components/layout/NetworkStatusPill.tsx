'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useNetwork } from '@/lib/context/NetworkContext';
import { presenceService } from '@/lib/presence/presenceService';
import { ChevronDown, Check, WifiOff } from 'lucide-react';

export function NetworkStatusPill() {
  const { isOnline } = useNetwork();
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

  // When device is completely disconnected from internet
  if (!isOnline) {
    return (
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <div
          title="Network connection offline. Local edits will sync once reconnected."
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '4px 9px',
            borderRadius: '999px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            color: '#b91c1c',
            fontSize: '11.5px',
            fontWeight: 600,
            lineHeight: 1,
            userSelect: 'none',
          }}
        >
          <WifiOff size={11} style={{ color: '#dc2626' }} />
          <span>Offline</span>
        </div>
      </div>
    );
  }

  const isLive = presence === 'active';

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={popoverRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={isLive ? 'Availability: Live (Online) · Click to switch' : 'Availability: Away · Click to switch'}
        aria-expanded={isOpen}
        aria-haspopup="true"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 10px',
          borderRadius: '999px',
          background: isLive ? '#ecfdf5' : '#fffbeb',
          border: `1px solid ${isLive ? '#a7f3d0' : '#fde68a'}`,
          color: isLive ? '#065f46' : '#92400e',
          fontSize: '11.5px',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all 0.15s ease',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            display: 'inline-block',
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            background: isLive ? '#10b981' : '#f59e0b',
            boxShadow: isLive ? '0 0 0 2px rgba(16, 185, 129, 0.25)' : '0 0 0 2px rgba(245, 158, 11, 0.2)',
            flexShrink: 0,
          }}
        />
        <span>{isLive ? 'Live' : 'Away'}</span>
        <ChevronDown size={11} style={{ opacity: 0.65, marginLeft: '1px' }} />
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
