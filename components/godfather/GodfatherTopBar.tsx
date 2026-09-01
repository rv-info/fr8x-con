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
      {/* Top Ribbon */}
      <div className="gf-tricolore-ribbon" />

      <header className="gf-topbar" style={{ fontFamily: "Calibri, 'Segoe UI', Candara, Arial, sans-serif" }}>
        {/* Left: Mobile Toggle & Breadcrumbs */}
        <div className="flex items-center gap-2 min-w-0">
          {onMobileMenuClick && (
            <button
              onClick={onMobileMenuClick}
              className="lg:hidden p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Toggle Navigation"
            >
              <Menu className="lucide w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="text-slate-400 font-mono font-bold text-[9px] hidden sm:inline">
              GODFATHER /
            </span>
            <h1 className="text-xs font-bold text-slate-900 tracking-tight truncate">{activeTitle}</h1>
          </div>
        </div>

        {/* Center: Universal Command Search Bar */}
        <div className="flex-1 max-w-md mx-2">
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            className="w-full flex items-center justify-between px-2.5 py-1 rounded bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[10px] text-slate-600 transition-all shadow-xs"
          >
            <div className="flex items-center gap-1.5 truncate">
              <Search className="lucide w-3 h-3 text-slate-400 flex-shrink-0" />
              <span className="font-medium text-slate-500 truncate">Quick search records, companies, tax IDs, auctions...</span>
            </div>
            <div className="flex items-center gap-0.5 font-mono text-[9px] bg-white border border-slate-200 px-1 py-0.5 rounded text-slate-600 font-bold shadow-2xs flex-shrink-0">
              <Command className="lucide w-2.5 h-2.5" />
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right: Security Pill, Alert Centre & Operator Avatar */}
        <div className="flex items-center gap-2">
          {/* Step-Up Status Indicator */}
          <button
            type="button"
            onClick={() => requestStepUpVerification('Manual Operator Privilege Refresh')}
            className={`text-[9.5px] px-2 py-0.5 rounded border flex items-center gap-1 transition-colors font-bold ${
              isStepUpValid
                ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                : 'bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100'
            }`}
            title={isStepUpValid ? 'Privileged authorization active' : 'Click to perform Step-Up re-authentication'}
          >
            {isStepUpValid ? (
              <>
                <ShieldCheck className="lucide w-3 h-3 text-emerald-600" />
                <span className="hidden md:inline font-mono font-bold text-[9px]">ELEVATED</span>
              </>
            ) : (
              <>
                <ShieldAlert className="lucide w-3 h-3 text-amber-600" />
                <span className="hidden md:inline font-mono font-bold text-[9px]">STEP-UP</span>
              </>
            )}
          </button>

          {/* Notifications Alert Center */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            className="relative text-slate-600 hover:text-slate-900 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="Platform Alerts"
          >
            <Bell className="lucide w-4 h-4" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
          </button>

          {/* Operator Profile Tag */}
          <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200">
            <div className="w-6 h-6 rounded-md bg-slate-900 text-white font-bold flex items-center justify-center text-[11px]">
              {operator.displayName.charAt(0)}
            </div>
            <span className="text-xs font-semibold text-slate-700 font-mono hidden xl:inline">
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

