'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, ShieldCheck, ShieldAlert, Command, Menu, LogOut, Radio, BookOpen, Clock } from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { CommandPalette } from './CommandPalette';
import { NotificationDrawer } from './NotificationDrawer';
import { ZohoEmailGuidebookModal } from './ZohoEmailGuidebookModal';

interface GodfatherTopBarProps {
  activeTitle?: string;
  onMobileMenuClick?: () => void;
}

function LiveClock() {
  const [time, setTime] = useState('');
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      setTime(
        now.toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
          timeZone: 'Asia/Kolkata',
        }) + ' IST'
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        fontSize: '11px',
        fontFamily: 'Consolas, Monaco, monospace',
        color: '#475569',
        background: '#f1f5f9',
        border: '1px solid #e2e8f0',
        padding: '3px 8px',
        borderRadius: '5px',
        whiteSpace: 'nowrap',
      }}
    >
      <Clock style={{ width: '13px', height: '13px', color: '#64748b' }} />
      <span style={{ fontWeight: 700 }}>{time}</span>
    </div>
  );
}

export function GodfatherTopBar({ activeTitle = 'Overview Dashboard', onMobileMenuClick }: GodfatherTopBarProps) {
  const { operator, isStepUpValid, requestStepUpVerification, logoutOperator } = useGodfatherAuth();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const [isGuidebookOpen, setIsGuidebookOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="gf-tricolore-ribbon" />

      <header
        className="gf-topbar"
        style={{
          height: '48px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          position: 'sticky',
          top: '3px',
          zIndex: 30,
          gap: '12px',
        }}
      >
        {/* Left: Mobile Toggle + Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
          {onMobileMenuClick && (
            <button
              onClick={onMobileMenuClick}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '4px',
                borderRadius: '5px',
                color: '#64748b',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              aria-label="Toggle Navigation"
            >
              <Menu style={{ width: '18px', height: '18px' }} />
            </button>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span style={{ color: '#94a3b8', fontFamily: 'Consolas, Monaco, monospace', fontWeight: 800, fontSize: '11px' }}>
              GODFATHER /
            </span>
            <h1 style={{ fontSize: '14px', fontWeight: 800, color: '#0f172a', margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {activeTitle}
            </h1>
          </div>
        </div>

        {/* Center: Command Search */}
        <div style={{ flex: 1, maxWidth: '460px', margin: '0 12px' }}>
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '5px 10px',
              borderRadius: '6px',
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              fontSize: '11.5px',
              color: '#64748b',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              <Search style={{ width: '14px', height: '14px', color: '#94a3b8', flexShrink: 0 }} />
              <span style={{ color: '#64748b', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                Search users, companies, auctions, rates, audit records...
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '2px',
                fontFamily: 'Consolas, monospace',
                fontSize: '10px',
                background: '#ffffff',
                border: '1px solid #cbd5e1',
                padding: '1px 5px',
                borderRadius: '4px',
                color: '#475569',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              <Command style={{ width: '10px', height: '10px' }} />
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right: Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          {/* Live Clock */}
          <LiveClock />

          {/* Zoho Guidebook Quick Launcher */}
          <button
            type="button"
            onClick={() => setIsGuidebookOpen(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11.5px',
              fontWeight: 700,
              color: '#0369a1',
              background: '#f0f9ff',
              border: '1px solid #bae6fd',
              padding: '4px 9px',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            title="Open Interactive Zoho Free Mail Setup Guidebook"
          >
            <BookOpen style={{ width: '13px', height: '13px', color: '#0284c7' }} />
            <span>Zoho Guide</span>
          </button>

          {/* Secured Node Status */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontSize: '11px',
              fontFamily: 'Consolas, monospace',
              color: '#047857',
              background: '#ecfdf5',
              border: '1px solid #a7f3d0',
              padding: '3px 8px',
              borderRadius: '5px',
              fontWeight: 800,
            }}
          >
            <Radio style={{ width: '13px', height: '13px', color: '#059669' }} />
            <span>SECURED</span>
          </div>

          {/* Step-Up Status */}
          <button
            type="button"
            onClick={() => requestStepUpVerification('Manual Privilege Refresh')}
            style={{
              fontSize: '11px',
              padding: '3px 8px',
              borderRadius: '5px',
              border: `1px solid ${isStepUpValid ? '#86efac' : '#fde047'}`,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              fontWeight: 800,
              background: isStepUpValid ? '#f0fdf4' : '#fefce8',
              color: isStepUpValid ? '#15803d' : '#854d0e',
              cursor: 'pointer',
            }}
            title={isStepUpValid ? 'Privileged authorization active' : 'Click to perform Step-Up elevation'}
          >
            {isStepUpValid ? (
              <>
                <ShieldCheck style={{ width: '13px', height: '13px', color: '#16a34a' }} />
                <span style={{ fontFamily: 'Consolas, monospace', fontSize: '10px' }}>ELEVATED</span>
              </>
            ) : (
              <>
                <ShieldAlert style={{ width: '13px', height: '13px', color: '#ca8a04' }} />
                <span style={{ fontFamily: 'Consolas, monospace', fontSize: '10px' }}>STEP-UP</span>
              </>
            )}
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            style={{
              position: 'relative',
              color: '#475569',
              padding: '5px',
              borderRadius: '5px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            aria-label="Platform Alerts"
          >
            <Bell style={{ width: '16px', height: '16px' }} />
            <span
              style={{
                position: 'absolute',
                top: '3px',
                right: '3px',
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                background: '#d97706',
                border: '1.5px solid #ffffff',
              }}
            />
          </button>

          {/* Operator Identity & Logout */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '7px',
              paddingLeft: '8px',
              borderLeft: '1px solid #e2e8f0',
            }}
          >
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '6px',
                background: '#0f172a',
                color: '#ffffff',
                fontWeight: 800,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                flexShrink: 0,
              }}
            >
              {operator.displayName.charAt(0)}
            </div>
            <span
              style={{
                fontSize: '11.5px',
                fontWeight: 700,
                color: '#334155',
                fontFamily: 'Consolas, monospace',
                maxWidth: '120px',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {operator.email}
            </span>
            <button
              type="button"
              onClick={async () => {
                await fetch('/api/godfather/session', { method: 'DELETE' }).catch(() => {});
                logoutOperator();
                window.location.href = '/godfather/login';
              }}
              style={{
                padding: '4px 6px',
                borderRadius: '5px',
                color: '#94a3b8',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'color 0.15s',
              }}
              title="Terminate Sovereign Session (Logout)"
            >
              <LogOut style={{ width: '15px', height: '15px' }} />
            </button>
          </div>
        </div>
      </header>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
      <ZohoEmailGuidebookModal isOpen={isGuidebookOpen} onClose={() => setIsGuidebookOpen(false)} />
    </>
  );
}
