'use client';

import React from 'react';
import { GodfatherThemeConsole } from '@/components/godfather/GodfatherThemeConsole';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { Palette, Sparkles, Sliders } from 'lucide-react';

export default function GodfatherThemePage() {
  const { environment } = useGodfatherAuth();

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-blue text-[10px] font-bold">PLATFORM GOVERNANCE</span>
            <span className="gf-badge gf-badge-green text-[10px] font-mono">NODE: {environment.toUpperCase()}</span>
          </div>
          <h1 className="gf-page-title text-[16px] font-bold text-slate-900 flex items-center gap-2">
            <Palette className="w-4 h-4 text-emerald-700" />
            Theme, Lines & Festival Design Studio
          </h1>
          <p className="gf-page-subtitle text-[10px] text-slate-500">
            Godfather centralized design control: Manage global palettes, structural borderlines, typography, and automated festival/occasion themes across the full FR8X application.
          </p>
        </div>
      </div>

      {/* Main Console */}
      <GodfatherThemeConsole />
    </div>
  );
}
