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
} from 'lucide-react';
import { UserProfile } from '@/lib/types';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  calculateConnectionAffinity,
  getDailyConnectionRecommendations,
  RecommendedConnection,
} from '@/lib/connections-algorithm';
import {
  getConnectedUserIds,
  getAllConnectionRequests,
  sendConnectionRequest,
  acceptConnectionRequest,
  CONNECTIONS_CHANGED_EVENT,
} from '@/lib/connections';
import { useToast } from '@/lib/context/ToastContext';

interface DailyRecommendationsWidgetProps {
  currentUser: UserProfile;
  onOpenSearchModal: () => void;
  onViewProfile: (uid: string, name: string) => void;
  onOpenChat?: (uid: string, name: string) => void;
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

  // Load all remote registered members from DBMS endpoint
  const loadMembers = async () => {
    try {
      setLoading(true);
      const myUid = currentUser.uid || (typeof window !== 'undefined' ? localStorage.getItem('fr8x_active_user_uid') : null) || 'u-rajat';
      const [membersRes, profileRes] = await Promise.all([
        fetch('/api/members?limit=100').then((r) => r.json()).catch(() => null),
        fetch(`/api/user/profile?uid=${encodeURIComponent(myUid)}`).then((r) => r.json()).catch(() => null),
      ]);

      if (membersRes && Array.isArray(membersRes.members)) {
        setCandidates(membersRes.members);
      }

      if (profileRes?.success && profileRes?.user) {
        setHydratedSelf(profileRes.user);
      } else if (membersRes && Array.isArray(membersRes.members)) {
        const selfFromDbms = membersRes.members.find((m: any) => m.uid === myUid || m.uid === currentUser.uid);
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
  }, [currentUser.uid]);

  // Compute recommendations whenever candidates or connection storage changes
  const refreshRecommendations = () => {
    const myUid = currentUser.uid || (typeof window !== 'undefined' ? localStorage.getItem('fr8x_active_user_uid') : null) || 'u-rajat';
    const activeSelf = hydratedSelf ? { ...currentUser, ...hydratedSelf, uid: myUid } : { ...currentUser, uid: myUid };
    if (!activeSelf?.uid || candidates.length === 0) return;

    const connectedUids = getConnectedUserIds(activeSelf.uid);
    const requests = getAllConnectionRequests();
    const pendingSentUids = requests
      .filter((r) => r.fromUid === activeSelf.uid && r.status === 'pending')
      .map((r) => r.toUid);
    const pendingReceivedUids = requests
      .filter((r) => r.toUid === activeSelf.uid && r.status === 'pending')
      .map((r) => r.fromUid);

    const recs = getDailyConnectionRecommendations(
      activeSelf,
      candidates,
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
  }, [candidates, currentUser, hydratedSelf]);

  const handleConnect = async (rec: RecommendedConnection) => {
    if (!currentUser.uid || !rec.user.uid) return;
    try {
      setConnectingUid(rec.user.uid);
      const senderName = currentUser.displayName || `${currentUser.firstName} ${currentUser.lastName}`.trim();
      sendConnectionRequest(currentUser, rec.user, `Hi ${rec.user.firstName || rec.user.displayName}, I noticed our common background in the freight network and would like to connect!`);
      toast(`Connection invitation dispatched to ${rec.user.displayName || rec.user.firstName}!`);
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

  // Filter out dismissed cards
  const visibleRecs = recommendations.filter((r) => !dismissedUids.has(r.user.uid));

  if (loading && candidates.length === 0) {
    return null;
  }

  if (visibleRecs.length === 0) {
    return null;
  }

  // Today's formatted date string
  const todayStr = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date());

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
                      {uName.slice(0, 2).toUpperCase()}
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
                  {u.city && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '10px',
                        color: '#64748b',
                        marginTop: '2px',
                      }}
                    >
                      <MapPin size={10} /> {u.city}, {u.country || 'India'}
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
