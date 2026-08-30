'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, ShieldCheck, ShieldAlert, KeyRound, Command, Menu } from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { CommandPalette } from './CommandPalette';
import { NotificationDrawer } from './NotificationDrawer';

interface GodfatherTopBarProps {
  activeTitle?: string;
  onMobileMenuClick?: () => void;
}

export function GodfatherTopBar({ activeTitle = 'Overview', onMobileMenuClick }: GodfatherTopBarProps) {
  const { operator, isStepUpValid, requestStepUpVerification } = useGodfatherAuth();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  // Global keyboard shortcut for Cmd/Ctrl + K
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
      {/* Italian Flag Luxury Top Ribbon */}
      <div className="gf-tricolore-ribbon" />

      <header className="gf-topbar">
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-3">
          {onMobileMenuClick && (
            <button
              onClick={onMobileMenuClick}
              className="gf-btn-icon lg:hidden text-slate-400 hover:text-white"
              aria-label="Toggle Navigation"
            >
              <Menu className="lucide w-5 h-5" />
            </button>
          )}
          <div className="gf-topbar-breadcrumb flex items-center gap-2">
            <span className="text-emerald-800 font-mono font-bold text-xs hidden sm:inline flex items-center gap-1">
              <span>🇮🇹</span>
              <span>IL PADRINO /</span>
            </span>
            <h1 className="text-sm font-black text-emerald-950 tracking-wide">{activeTitle}</h1>
          </div>
        </div>

        {/* Center: Universal Command Search Bar */}
        <div className="flex-1 max-w-xl mx-4">
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="gf-search-trigger w-full flex items-center justify-between px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-emerald-50/70 border border-slate-200 text-xs text-slate-600 transition-all shadow-sm"
          >
            <div className="flex items-center gap-2">
              <Search className="lucide w-3.5 h-3.5 text-emerald-700" />
              <span className="font-medium">Search users, companies, auctions, rates, tax IDs, invoices...</span>
            </div>
            <div className="flex items-center gap-1 font-mono text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-bold shadow-xs">
              <Command className="lucide w-3 h-3" />
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right: Security Pill, Alert Centre & Operator Avatar */}
        <div className="flex items-center gap-3">
          {/* Step-Up Status Indicator */}
          <button
            type="button"
            onClick={() => requestStepUpVerification('Manual Operator Privilege Refresh')}
            className={`gf-stepup-badge text-xs px-2.5 py-1 rounded-lg border flex items-center gap-1.5 transition-colors font-bold ${
              isStepUpValid
                ? 'bg-emerald-100/80 border-emerald-300 text-emerald-900'
                : 'bg-amber-100/80 border-amber-300 text-amber-900 hover:bg-amber-200'
            }`}
            title={isStepUpValid ? 'Privileged authorization active' : 'Click to perform Step-Up re-authentication'}
          >
            {isStepUpValid ? (
              <>
                <ShieldCheck className="lucide w-3.5 h-3.5 text-emerald-700" />
                <span className="hidden md:inline font-mono font-bold text-[11px]">ELEVATED (15M)</span>
              </>
            ) : (
              <>
                <ShieldAlert className="lucide w-3.5 h-3.5 text-amber-700" />
                <span className="hidden md:inline font-mono font-bold text-[11px]">STEP-UP REQUIRED</span>
              </>
            )}
          </button>

          {/* Notifications Alert Center */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            className="gf-btn-icon relative text-emerald-900 hover:text-emerald-700 p-1.5 rounded-lg hover:bg-emerald-50 transition-colors"
            aria-label="Platform Alerts"
          >
            <Bell className="lucide w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>

          {/* Operator Profile Tag */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-6 h-6 rounded bg-emerald-800 text-white font-black flex items-center justify-center text-[10px]">
              {operator.displayName.charAt(0)}
            </div>
            <span className="text-xs font-bold text-emerald-950 font-mono hidden xl:inline">
              {operator.email}
            </span>
          </div>
        </div>
      </header>

      {/* Global Command Palette Modal */}
      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}
