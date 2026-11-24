'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { Building2 } from 'lucide-react';

export interface UserAvatarProps {
  /** Optional user or member object from which avatar, logo, and name can be extracted */
  user?: any;
  /** Personal profile photo URL (circular container) */
  avatarUrl?: string | null;
  /** Associated company/organization logo URL (overlapping bottom-right square) */
  companyLogoUrl?: string | null;
  /** Display name for initials fallback and image alt text */
  name?: string;
  /** Company name for title and accessibility */
  companyName?: string;
  /** Primary diameter of circular avatar in pixels (default: 32) */
  size?: number | string;
  /** Additional CSS class name */
  className?: string;
  /** Additional inline styles for the outer avatar container */
  style?: React.CSSProperties;
  /** Custom font size for initials */
  fontSize?: string;
  /** Whether to render overlapping company logo when available (default: true) */
  showCompanyLogo?: boolean;
  /** Whether user possesses FR8X Golden Tick verification */
  hasGoldenTick?: boolean;
  /** Whether user possesses verified business member badge */
  isVerified?: boolean;
  /** Online / presence status ('online' | 'active' | 'away' | 'idle' | 'offline') */
  status?: string;
  /** Click event handler */
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  /** Hover tooltip title */
  title?: string;
}

/**
 * Global Profile Picture & Company Logo Standard Component
 *
 * Implements the mandatory FR8X application-wide visual standard:
 * - LARGE CIRCULAR PERSONAL PROFILE PICTURE (100% of avatar diameter)
 * - SMALLER SQUARE COMPANY LOGO (32-38% of diameter) overlapping bottom-right corner
 * - Subtle white border, restrained shadow, transparent PNG preservation
 * - Graceful fallbacks: circular initials if no photo; logo omitted if no company logo
 */
export function UserAvatar({
  user,
  avatarUrl: explicitAvatarUrl,
  companyLogoUrl: explicitCompanyLogoUrl,
  name: explicitName,
  companyName: explicitCompanyName,
  size = 32,
  className = '',
  style = {},
  fontSize,
  showCompanyLogo = true,
  hasGoldenTick: explicitGoldenTick,
  isVerified: explicitVerified,
  status,
  onClick,
  title,
}: UserAvatarProps) {
  // 1. Resolve numeric diameter in pixels
  const diameter = useMemo(() => {
    if (typeof size === 'number') return size;
    const parsed = parseInt(String(size), 10);
    return isNaN(parsed) || parsed <= 0 ? 32 : parsed;
  }, [size]);

  // 2. Resolve display name and initials
  const resolvedName = useMemo(() => {
    if (explicitName && explicitName.trim()) return explicitName.trim();
    if (user) {
      if (user.displayName && user.displayName.trim()) return user.displayName.trim();
      if (user.display_name && user.display_name.trim()) return user.display_name.trim();
      if (user.name && user.name.trim()) return user.name.trim();
      if (user.full_name && user.full_name.trim()) return user.full_name.trim();
      const first = (user.firstName || user.first_name || '').trim();
      const last = (user.lastName || user.last_name || '').trim();
      const combined = `${first} ${last}`.trim();
      if (combined) return combined;
      if (user.email) return user.email.split('@')[0];
    }
    return 'User';
  }, [explicitName, user]);

  const initials = useMemo(() => {
    const clean = resolvedName.replace(/^(Capt\.|Captain|Dr\.|Mr\.|Ms\.|Mrs\.)\s+/i, '').trim();
    const parts = clean.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    if (parts.length === 1 && parts[0].length >= 2) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0]?.[0] || 'U').toUpperCase();
  }, [resolvedName]);

  // 3. Resolve personal avatar URL
  const resolvedAvatarUrl = useMemo(() => {
    if (explicitAvatarUrl !== undefined) {
      return explicitAvatarUrl && explicitAvatarUrl.trim() ? explicitAvatarUrl.trim() : null;
    }
    if (user) {
      const candidate =
        user.avatarUrl ||
        user.avatar_url ||
        user.photoURL ||
        user.photoUrl ||
        null;
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();
    }
    return null;
  }, [explicitAvatarUrl, user]);

  // 4. Resolve company logo URL
  const resolvedCompanyLogoUrl = useMemo(() => {
    if (!showCompanyLogo) return null;
    if (explicitCompanyLogoUrl !== undefined) {
      return explicitCompanyLogoUrl && explicitCompanyLogoUrl.trim() ? explicitCompanyLogoUrl.trim() : null;
    }
    if (user) {
      const candidate =
        user.companyLogoUrl ||
        user.company_logo_url ||
        user.companyLogo ||
        user.logoUrl ||
        null;
      if (typeof candidate === 'string' && candidate.trim()) return candidate.trim();

      if (typeof window !== 'undefined') {
        try {
          if (user.uid) {
            const stored = localStorage.getItem(`fr8x_user_logo_${user.uid}`);
            if (stored && stored.trim()) return stored.trim();
          }
          const storedDefault =
            localStorage.getItem('fr8x_user_logo') ||
            localStorage.getItem('fr8x_company_logo');
          if (storedDefault && storedDefault.trim()) return storedDefault.trim();
        } catch {}
      }
    }
    return null;
  }, [explicitCompanyLogoUrl, user, showCompanyLogo]);

  // 5. Error states
  const [avatarError, setAvatarError] = useState(false);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    setAvatarError(false);
  }, [resolvedAvatarUrl]);

  useEffect(() => {
    setLogoError(false);
  }, [resolvedCompanyLogoUrl]);

  // 6. Proportions (32% to 38% diameter for logo, ~8% to 12% controlled overlap)
  const logoSize = Math.max(10, Math.round(diameter * 0.35));
  const overlapOffset = Math.max(1, Math.round(logoSize * 0.22));
  const logoBorderRadius = Math.max(2, Math.round(logoSize * 0.16));
  const logoBorderWidth = diameter >= 56 ? 2 : 1.5;

  const computedFontSize = useMemo(() => {
    if (fontSize) return fontSize;
    const fs = Math.max(9, Math.round(diameter * 0.36));
    return `${fs}px`;
  }, [fontSize, diameter]);

  const hasGolden = explicitGoldenTick ?? Boolean(user?.hasGoldenTick || user?.has_golden_tick);
  const companyName = explicitCompanyName || user?.company || user?.company_name || user?.companyName || '';

  const tooltipTitle = title || (companyName ? `${resolvedName} · ${companyName}` : resolvedName);

  return (
    <div
      className={`fr8x-user-avatar ${className}`}
      onClick={onClick}
      title={tooltipTitle}
      style={{
        position: 'relative',
        width: `${diameter}px`,
        height: `${diameter}px`,
        minWidth: `${diameter}px`,
        minHeight: `${diameter}px`,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        overflow: 'visible', // Ensures bottom-right overlapping company logo is never clipped
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none',
        verticalAlign: 'middle',
        ...style,
      }}
    >
      {/* ── 1. PRIMARY CIRCULAR PERSONAL PROFILE PICTURE ── */}
      <div
        className="fr8x-avatar-circle"
        style={{
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: resolvedAvatarUrl && !avatarError ? '#F8FAFC' : 'linear-gradient(135deg, #1B2B4B, #47799E)',
          border: '1px solid #CBD5E1',
          boxSizing: 'border-box',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {resolvedAvatarUrl && !avatarError ? (
          <img
            src={resolvedAvatarUrl}
            alt={resolvedName}
            onError={() => setAvatarError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'center',
              display: 'block',
            }}
          />
        ) : (
          <span
            style={{
              color: '#FFFFFF',
              fontWeight: 800,
              fontSize: computedFontSize,
              letterSpacing: '0.02em',
              lineHeight: 1,
              fontFamily: 'Calibri, Arial, sans-serif',
            }}
          >
            {initials}
          </span>
        )}
      </div>

      {/* ── 2. OVERLAPPING SQUARE COMPANY LOGO AT BOTTOM-RIGHT ── */}
      {/* Cleanly omitted when no company logo exists to prevent empty stray square boxes */}
      {showCompanyLogo && diameter >= 24 && resolvedCompanyLogoUrl && !logoError && (
        <div
          className="fr8x-avatar-company-logo"
          title={companyName ? `Organization: ${companyName}` : 'Associated Organization'}
          style={{
            position: 'absolute',
            bottom: `-${overlapOffset}px`,
            right: `-${overlapOffset}px`,
            width: `${logoSize}px`,
            height: `${logoSize}px`,
            borderRadius: `${logoBorderRadius}px`,
            background: 'transparent',
            border: `${logoBorderWidth}px solid #FFFFFF`,
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.22), 0 0 1px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
            boxSizing: 'border-box',
            zIndex: 2,
            padding: '1px',
          }}
        >
          <img
            src={resolvedCompanyLogoUrl}
            alt={companyName || 'Company Logo'}
            onError={() => setLogoError(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              display: 'block',
              background: 'transparent',
            }}
          />
        </div>
      )}

      {/* ── 3. GOLDEN TICK BADGE (TOP-RIGHT) ── */}
      {hasGolden && diameter >= 32 && (
        <div
          style={{
            position: 'absolute',
            top: '-3px',
            right: '-3px',
            zIndex: 3,
            lineHeight: 0,
          }}
        >
          <GoldenTick size={Math.max(12, Math.round(diameter * 0.32))} title="Verified Premium Member" />
        </div>
      )}

      {/* ── 4. PRESENCE STATUS DOT (BOTTOM-LEFT IF NEEDED) ── */}
      {status && status !== 'offline' && diameter >= 28 && (
        <span
          style={{
            position: 'absolute',
            bottom: '0px',
            left: '0px',
            width: `${Math.max(6, Math.round(diameter * 0.2))}px`,
            height: `${Math.max(6, Math.round(diameter * 0.2))}px`,
            borderRadius: '50%',
            backgroundColor: status === 'online' || status === 'active' ? '#10B981' : '#F59E0B',
            border: '1.5px solid #FFFFFF',
            boxShadow: '0 0 2px rgba(0,0,0,0.2)',
            zIndex: 2,
          }}
        />
      )}
    </div>
  );
}
