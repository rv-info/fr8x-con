'use client';

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  UserPlus,
  Check,
  Clock,
  MessageCircle,
  Search,
  Building2,
  MapPin,
  GraduationCap,
  Award,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  X,
  Users,
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  calculateConnectionAffinity,
  getDailyConnectionRecommendations,
  RecommendedConnection,
  isSelfProfile,
  isTestOrDummyAccount,
} from '@/lib/connections-algorithm';
import {
  getConnectedUserIds,
  getAllConnectionRequests,
  sendConnectionRequest,
  acceptConnectionRequest,
  CONNECTIONS_CHANGED_EVENT,
  syncConnectionsFromServer,
} from '@/lib/connections';
import { useToast } from '@/lib/context/ToastContext';

interface DailyRecommendationsWidgetProps {
  currentUser: UserProfile;
  onOpenSearchModal: () => void;
  onViewProfile: (uid: string, name: string) => void;
  onOpenChat?: (uid: string, name: string) => void;
}

/**
 * Computes whether the current time falls inside one of the 10-15 random daily periods.
 * Uses a daily date seed so windows are distributed across the 24 hours of the day (13 windows, ~15 mins each).
 */
function isWithinRandomDailySchedule(): boolean {
  if (typeof window === 'undefined') return false;
  const now = new Date();
  const daySeed = now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const currentMinuteOfDay = now.getHours() * 60 + now.getMinutes();

  // 13 pseudo-random windows distributed throughout the 24 hours of the day (10-15 times a day)
  const TOTAL_PERIODS = 13;
  const SLOT_SIZE = Math.floor(1440 / TOTAL_PERIODS); // ~110 minutes per slot
  const WINDOW_DURATION = 15; // each period lasts 15 minutes

  for (let i = 0; i < TOTAL_PERIODS; i++) {
    // Deterministic seeded random offset within the slot
    const seed = (daySeed * 9301 + 49297 + i * 233280) % 233280;
    const randomFactor = seed / 233280;
    const slotStart = i * SLOT_SIZE;
    const windowStart = slotStart + Math.floor(randomFactor * (SLOT_SIZE - WINDOW_DURATION));
    const windowEnd = windowStart + WINDOW_DURATION;

    if (currentMinuteOfDay >= windowStart && currentMinuteOfDay <= windowEnd) {
      return true;
    }
  }
  return false;
}

/**
 * Checks whether the page was reloaded/refreshed, or if the widget was previously vanished in this session.
 */
function checkIsPageRefreshedOrVanished(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem('fr8x_daily_recs_vanished') === 'true') {
      return true;
    }
    // Check if the current page navigation is a reload / refresh
    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries && navEntries.length > 0) {
      const navTiming = navEntries[0] as PerformanceNavigationTiming;
      if (navTiming.type === 'reload') {
        sessionStorage.setItem('fr8x_daily_recs_vanished', 'true');
        return true;
      }
    } else if ((performance as any)?.navigation?.type === 1) {
      sessionStorage.setItem('fr8x_daily_recs_vanished', 'true');
      return true;
    }
  } catch {}
  return false;
}

export function DailyRecommendationsWidget({
  currentUser,
  onOpenSearchModal,
  onViewProfile,
  onOpenChat,
}: DailyRecommendationsWidgetProps) {
  const { toast } = useToast();
  const [candidates, setCandidates] = useState<UserProfile[]>([]);
  const [hydratedSelf, setHydratedSelf] = useState<UserProfile | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedConnection[]>([]);
  const [dismissedUids, setDismissedUids] = useState<Set<string>>(new Set());
  const [scrollIndex, setScrollIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [connectingUid, setConnectingUid] = useState<string | null>(null);
  const [isVanished, setIsVanished] = useState<boolean>(() => checkIsPageRefreshedOrVanished());

  const handleCloseWidget = () => {
    setIsVanished(true);
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.setItem('fr8x_daily_recs_vanished', 'true');
      } catch {}
    }
    toast('Recommendations section hidden for this session.');
  };

  // Load all remote registered members from DBMS endpoint
  const loadMembers = async () => {
    try {
      setLoading(true);
      const myUid = currentUser.uid || (typeof window !== 'undefined' ? localStorage.getItem('fr8x_active_user_uid') : null);
      if (!myUid) {
        setLoading(false);
        return;
      }
      const [membersRes, profileRes] = await Promise.all([
        fetch('/api/members?limit=100&excludeSelf=true', {
          headers: {
            'x-fr8x-user-uid': myUid,
            'x-fr8x-session': myUid,
          },
          credentials: 'include',
        }).then((r) => r.json()).catch(() => null),
        fetch(`/api/user/profile?uid=${encodeURIComponent(myUid)}`).then((r) => r.json()).catch(() => null),
        syncConnectionsFromServer(myUid),
      ]);

      const activeProfile = profileRes?.success && profileRes?.user ? profileRes.user : currentUser;
      if (profileRes?.success && profileRes?.user) {
        setHydratedSelf(profileRes.user);
      }

      if (membersRes && Array.isArray(membersRes.members)) {
        const safeCandidates = membersRes.members.filter(
          (m: any) =>
            !isSelfProfile(currentUser, m) && !isTestOrDummyAccount(m) &&
            !isSelfProfile(activeProfile, m) &&
            m.uid !== myUid &&
            m.uid !== currentUser.uid
        );
        setCandidates(safeCandidates);
      } else if (membersRes && Array.isArray(membersRes.members)) {
        const selfFromDbms = membersRes.members.find((m: any) => isSelfProfile(currentUser, m) || m.uid === myUid || m.uid === currentUser.uid);
        if (selfFromDbms) {
          setHydratedSelf(selfFromDbms);
        }
      }
    } catch (err) {
      console.error('[DailyRecommendationsWidget] Failed to load candidate members:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMembers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser.uid]);

  // Compute recommendations whenever candidates or connection storage changes
  const refreshRecommendations = () => {
    const myUid = currentUser.uid || (typeof window !== 'undefined' ? localStorage.getItem('fr8x_active_user_uid') : null);
    if (!myUid) return;
    const activeSelf = hydratedSelf ? { ...currentUser, ...hydratedSelf, uid: myUid } : { ...currentUser, uid: myUid };
    if (!activeSelf?.uid || candidates.length === 0) return;

    // Filter candidate pool to guarantee zero self-cards and zero test/dummy fixtures
    const validCandidates = candidates.filter(
      (c) => !isSelfProfile(activeSelf, c) && !isTestOrDummyAccount(c)
    );
    if (validCandidates.length === 0) {
      setRecommendations([]);
      return;
    }

    const connectedUids = (getConnectedUserIds(activeSelf.uid) || []).filter(Boolean);
    const requests = (getAllConnectionRequests() || []).filter(Boolean);
    const pendingSentUids = requests
      .filter((r) => r && r.fromUid === activeSelf.uid && r.status === 'pending')
      .map((r) => r.toUid)
      .filter(Boolean);
    const pendingReceivedUids = requests
      .filter((r) => r && r.toUid === activeSelf.uid && r.status === 'pending')
      .map((r) => r.fromUid)
      .filter(Boolean);

    const recs = getDailyConnectionRecommendations(
      activeSelf,
      validCandidates,
      connectedUids,
      pendingSentUids,
      pendingReceivedUids,
      12
    );

    setRecommendations(recs);
  };

  useEffect(() => {
    refreshRecommendations();

    const handleConnChange = () => {
      refreshRecommendations();
    };

    window.addEventListener(CONNECTIONS_CHANGED_EVENT, handleConnChange);
    return () => window.removeEventListener(CONNECTIONS_CHANGED_EVENT, handleConnChange);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [candidates, currentUser, hydratedSelf]);

  const handleConnect = async (rec: RecommendedConnection) => {
    if (!currentUser.uid || !rec.user.uid) return;
    if (isSelfProfile(currentUser, rec.user)) {
      toast('You cannot send a connection request to yourself.');
      return;
    }
    if (isTestOrDummyAccount(rec.user)) {
      toast('This candidate profile is not available for connection.');
      return;
    }
    try {
      setConnectingUid(rec.user.uid);
      const senderName = currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}`.trim();
      sendConnectionRequest(currentUser, rec.user, `Hi ${rec.user.firstName || rec.user.displayName}, I noticed our common background in the freight network and would like to connect!`);
      toast(`Connection invitation dispatched to ${rec.user.displayName || rec.user.firstName}!`);
      if (currentUser.uid) {
        await syncConnectionsFromServer(currentUser.uid);
      }
      refreshRecommendations();
    } catch (err: any) {
      toast(err.message || 'Could not send connection invitation');
    } finally {
      setConnectingUid(null);
    }
  };

  const handleDismiss = (uid: string) => {
    setDismissedUids((prev) => new Set([...prev, uid]));
    toast('Suggestion dismissed for today.');
  };

  // Filter out dismissed cards, self cards, test/dummy fixtures, and duplicate identities
  const seenVisibleIdentities = new Set<string>();
  const visibleRecs = recommendations.filter((r) => {
    if (!r || !r.user) return false;
    const targetUid = r.user.uid || (r.user as any).id;
    if (!targetUid || dismissedUids.has(targetUid)) return false;
    if (isSelfProfile(currentUser, r.user)) return false;
    if (isTestOrDummyAccount(r.user)) return false;

    // Strict identity deduplication: never render two cards for the same person
    const name = (r.user.displayName || `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim() || r.user.email || '').toString().toLowerCase().trim();
    const company = (r.user.company || (r.user as any).company_name || '').toString().toLowerCase().trim();
    const identityKey = name && company ? `${name}:::${company}` : (r.user.email || targetUid);
    if (seenVisibleIdentities.has(identityKey)) return false;
    seenVisibleIdentities.add(identityKey);
    return true;
  });

  // Today's formatted date string
  const todayStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

  const isForceShown = typeof window !== 'undefined' && (
    new URLSearchParams(window.location.search).get('recs') === '1' ||
    localStorage.getItem('fr8x_force_recs') === 'true'
  );

  // If user refreshed the page, or dismissed it, or if current time is outside the 10-15 random daily periods, vanish!
  if (!isForceShown && (isVanished || !isWithinRandomDailySchedule())) {
    return null;
  }

  if (loading && candidates.length === 0) {
    return null;
  }

  // Truthful empty state: Render clean, informative card when no qualifying recommendations exist
  if (visibleRecs.length === 0) {
    return (
      <div
        className="card"
        style={{
          marginBottom: '16px',
          padding: '16px',
          background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
          border: '1px solid #bfdbfe',
          borderRadius: '10px',
          boxShadow: '0 2px 10px rgba(17, 104, 215, 0.04)',
          position: 'relative',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '8px',
            marginBottom: '14px',
            paddingBottom: '10px',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '8px',
                background: 'linear-gradient(135deg, #1168d7 0%, #099889 100%)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 6px rgba(17, 104, 215, 0.25)',
              }}
            >
              <Sparkles size={16} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <b style={{ fontSize: '13.5px', color: 'var(--fr8x-text)', letterSpacing: '-0.01em' }}>
                  Daily Recommended Connections
                </b>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '12px',
                    background: '#dbeafe',
                    color: '#1d4ed8',
                    border: '1px solid #bfdbfe',
                  }}
                >
                  {todayStr}
                </span>
              </div>
              <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)', display: 'block', marginTop: '1px' }}>
                Smart affinity matches across Work, Ex-Companies, Port Hubs, Colleges &amp; Certifications
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <button
              type="button"
              className="btn secondary sm"
              onClick={onOpenSearchModal}
              style={{
                fontSize: '11px',
                fontWeight: 600,
                padding: '5px 12px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
              }}
            >
              <Search size={12} />
              Search All Connections
            </button>
            <button
              type="button"
              className="btn secondary sm"
              onClick={handleCloseWidget}
              title="Dismiss section"
              style={{
                padding: '5px 8px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#64748b',
                border: '1px solid #cbd5e1',
                background: '#ffffff',
                borderRadius: '6px',
                cursor: 'pointer',
              }}
              aria-label="Close recommendations"
            >
              <X size={13} />
            </button>
          </div>
        </div>

        <div
          style={{
            padding: '24px 16px',
            textAlign: 'center',
            background: '#ffffff',
            border: '1px dashed #cbd5e1',
            borderRadius: '8px',
          }}
        >
          <Users size={32} style={{ color: '#94a3b8', margin: '0 auto 8px', display: 'block' }} />
          <div style={{ fontSize: '13px', fontWeight: 700, color: '#1e293b', marginBottom: '4px' }}>
            No new connection recommendations available today
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', maxWidth: '440px', margin: '0 auto 14px', lineHeight: 1.5 }}>
            Smart recommendations appear here based on verified freight peers matching your trade lanes, active corridors, and company profiles.
          </p>
          <button
            type="button"
            className="btn primary sm"
            onClick={onOpenSearchModal}
            style={{ fontSize: '11.5px', fontWeight: 600, padding: '6px 14px' }}
          >
            <Search size={13} style={{ marginRight: '6px' }} /> Discover Platform Members
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="card"
      style={{
        marginBottom: '16px',
        padding: '16px',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fbff 100%)',
        border: '1px solid #bfdbfe',
        borderRadius: '10px',
        boxShadow: '0 2px 10px rgba(17, 104, 215, 0.04)',
        position: 'relative',
      }}
    >
      {/* Header bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '8px',
          marginBottom: '14px',
          paddingBottom: '10px',
          borderBottom: '1px solid #e2e8f0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #1168d7 0%, #099889 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 2px 6px rgba(17, 104, 215, 0.25)',
            }}
          >
            <Sparkles size={16} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <b style={{ fontSize: '13.5px', color: 'var(--fr8x-text)', letterSpacing: '-0.01em' }}>
                Daily Recommended Connections
              </b>
              <span
                style={{
                  fontSize: '10px',
                  fontWeight: 700,
                  padding: '2px 7px',
                  borderRadius: '12px',
                  background: '#dbeafe',
                  color: '#1d4ed8',
                  border: '1px solid #bfdbfe',
                }}
              >
                {todayStr}
              </span>
            </div>
            <span style={{ fontSize: '11px', color: 'var(--fr8x-muted)', display: 'block', marginTop: '1px' }}>
              Smart affinity matches across Work, Ex-Companies, Port Hubs, Colleges &amp; Certifications
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="btn secondary sm"
            onClick={onOpenSearchModal}
            style={{
              fontSize: '11px',
              fontWeight: 600,
              padding: '5px 12px',
              background: '#ffffff',
              border: '1px solid #cbd5e1',
              color: 'var(--brand)',
              display: 'flex',
              alignItems: 'center',
              gap: '5px',
            }}
          >
            <Search size={12} /> Search All Connections
          </button>
          <button
            type="button"
            className="btn secondary sm"
            onClick={handleCloseWidget}
            title="Dismiss recommendations"
            style={{
              padding: '5px 8px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#64748b',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              borderRadius: '6px',
              cursor: 'pointer',
            }}
            aria-label="Close recommendations"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Cards Deck Carousel / Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
          gap: '12px',
        }}
      >
        {visibleRecs.slice(0, 4).map((rec) => {
          const u = rec.user;
          const uName = u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email;

          return (
            <div
              key={u.uid}
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                padding: '12px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                gap: '10px',
                position: 'relative',
                transition: 'all 0.15s ease',
                boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)',
              }}
            >
              {/* Dismiss button */}
              <button
                type="button"
                onClick={() => handleDismiss(u.uid)}
                title="Dismiss suggestion for today"
                style={{
                  position: 'absolute',
                  top: '8px',
                  right: '8px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                  borderRadius: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <X size={13} />
              </button>

              {/* Match Score Badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    background: rec.matchPercentage >= 85 ? '#ecfdf5' : '#eff6ff',
                    color: rec.matchPercentage >= 85 ? '#065f46' : '#1e40af',
                    border: `1px solid ${rec.matchPercentage >= 85 ? '#a7f3d0' : '#bfdbfe'}`,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <Sparkles size={10} color={rec.matchPercentage >= 85 ? '#059669' : '#2563eb'} />
                  {rec.matchPercentage}% Affinity
                </span>
              </div>

              {/* User Bio Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div
                  className="avatar"
                  onClick={() => onViewProfile(u.uid, uName)}
                  style={{
                    width: '42px',
                    height: '42px',
                    padding: 0,
                    overflow: 'hidden',
                    borderRadius: '50%',
                    cursor: 'pointer',
                    flexShrink: 0,
                    border: '1.5px solid #cbd5e1',
                  }}
                >
                  {u.avatarUrl ? (
                    <img src={u.avatarUrl} alt={uName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: 'linear-gradient(135deg, #1168d7, #099889)',
                        color: '#ffffff',
                        fontSize: '14px',
                        fontWeight: 800,
                      }}
                    >
                      {(() => {
                        const parts = uName.trim().split(/\s+/).filter(Boolean);
                        if (parts.length >= 2) {
                          return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
                        }
                        return (parts[0] ? parts[0].slice(0, 2) : 'U').toUpperCase();
                      })()}
                    </div>
                  )}
                </div>

                <div style={{ minWidth: 0, flex: 1 }}>
                  <div
                    onClick={() => onViewProfile(u.uid, uName)}
                    style={{
                      fontSize: '12.5px',
                      fontWeight: 700,
                      color: 'var(--fr8x-text)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      cursor: 'pointer',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {uName}
                    {u.hasGoldenTick && <GoldenTick size={12} />}
                  </div>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '11px',
                      color: 'var(--fr8x-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {u.designation || 'Trade Specialist'}
                  </span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: '10.5px',
                      fontWeight: 600,
                      color: '#334155',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {u.company || 'Enterprise'}
                  </span>
                  {(u.location || u.city) && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        color: '#64748b',
                        marginTop: '2px',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <MapPin size={10} style={{ flexShrink: 0 }} />{' '}
                      {u.location || [u.city, u.state, u.country || 'India'].filter(Boolean).join(', ')}
                    </span>
                  )}
                </div>
              </div>

              {/* Match Reason Tags */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', minHeight: '44px' }}>
                {rec.reasons.slice(0, 2).map((reason, idx) => (
                  <div
                    key={idx}
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      background: '#f1f5f9',
                      color: '#1e293b',
                      border: '1px solid #e2e8f0',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                    title={reason.detail}
                  >
                    {reason.badge}
                  </div>
                ))}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  marginTop: 'auto',
                  borderTop: '1px solid #f1f5f9',
                  paddingTop: '8px',
                }}
              >
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => onViewProfile(u.uid, uName)}
                  style={{
                    flex: 1,
                    fontSize: '11px',
                    padding: '4px 6px',
                    justifyContent: 'center',
                  }}
                >
                  Passport
                </button>

                {rec.requestStatus === 'connected' ? (
                  <button
                    type="button"
                    className="btn primary sm"
                    onClick={() => onOpenChat && onOpenChat(u.uid, uName)}
                    style={{
                      flex: 1.3,
                      fontSize: '11px',
                      padding: '4px 8px',
                      justifyContent: 'center',
                      background: '#099889',
                    }}
                  >
                    <MessageCircle size={11} /> Chat
                  </button>
                ) : rec.requestStatus === 'pending_sent' ? (
                  <span
                    style={{
                      flex: 1.3,
                      fontSize: '10px',
                      fontWeight: 700,
                      padding: '4px 8px',
                      borderRadius: '4px',
                      background: '#f1f5f9',
                      color: '#475569',
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      border: '1px solid #cbd5e1',
                    }}
                  >
                    <Clock size={11} /> Sent
                  </span>
                ) : rec.requestStatus === 'pending_received' ? (
                  <button
                    type="button"
                    className="btn primary sm"
                    onClick={() => {
                      const all = getAllConnectionRequests();
                      const req = all.find((r) => r.fromUid === u.uid && r.toUid === currentUser.uid && r.status === 'pending');
                      if (req) {
                        acceptConnectionRequest(req.id, currentUser);
                        toast(`Connected with ${uName}!`);
                        refreshRecommendations();
                      }
                    }}
                    style={{
                      flex: 1.3,
                      fontSize: '11px',
                      padding: '4px 8px',
                      justifyContent: 'center',
                    }}
                  >
                    <Check size={11} /> Accept
                  </button>
                ) : (
                  <button
                    type="button"
                    className="btn primary sm"
                    disabled={connectingUid === u.uid}
                    onClick={() => handleConnect(rec)}
                    style={{
                      flex: 1.3,
                      fontSize: '11px',
                      padding: '4px 8px',
                      justifyContent: 'center',
                    }}
                  >
                    <UserPlus size={11} /> Connect
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
