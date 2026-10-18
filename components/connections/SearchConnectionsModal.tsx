'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  UserPlus,
  UserCheck,
  Clock,
  Check,
  MessageCircle,
  Building2,
  MapPin,
  GraduationCap,
  Award,
  Sparkles,
  Filter,
  X,
  Send,
  ExternalLink,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { UserProfile } from '@/lib/types';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  calculateConnectionAffinity,
  MatchReason,
  isSelfProfile,
  isTestOrDummyAccount,
} from '@/lib/connections-algorithm';
import {
  getConnectedUserIds,
  getAllConnectionRequests,
  getConnectionStatus,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  CONNECTIONS_CHANGED_EVENT,
  syncConnectionsFromServer,
  getClientAuthHeaders,
} from '@/lib/connections';
import { useToast } from '@/lib/context/ToastContext';

interface SearchConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onViewProfile?: (uid: string, name: string) => void;
  onOpenChat?: (uid: string, name: string) => void;
}

type FilterChip = 'all' | 'ex_company' | 'location' | 'alumni' | 'certified' | 'designation';

export function SearchConnectionsModal({
  isOpen,
  onClose,
  currentUser,
  onViewProfile,
  onOpenChat,
}: SearchConnectionsModalProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterChip>('all');
  const [allMembers, setAllMembers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [connectingUid, setConnectingUid] = useState<string | null>(null);
  const [withdrawingUid, setWithdrawingUid] = useState<string | null>(null);
  const [acceptingUid, setAcceptingUid] = useState<string | null>(null);
  const [rejectingUid, setRejectingUid] = useState<string | null>(null);
  const [connectionsVersion, setConnectionsVersion] = useState(0);
  const [localStatusMap, setLocalStatusMap] = useState<Record<string, string>>({});
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [notePromptUid, setNotePromptUid] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState('');
  const [recentSearches, setRecentSearches] = useState<{ id: string; query: string }[]>([]);

  const loadSearchHistory = async () => {
    try {
      const res = await fetch('/api/search/history?context=connections&limit=8');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.history)) {
          setRecentSearches(json.history.map((h: any) => ({ id: h.id, query: h.query })));
        }
      }
    } catch {}
  };

  const recordSearchHistory = async (query: string, count: number) => {
    if (!query || query.trim().length < 2) return;
    try {
      await fetch('/api/search/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), context: 'connections', resultCount: count }),
      });
      loadSearchHistory();
    } catch {}
  };

  const removeHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setRecentSearches((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`/api/search/history?id=${encodeURIComponent(id)}&context=connections`, {
        method: 'DELETE',
      });
    } catch {}
  };

  const clearAllHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches([]);
    try {
      await fetch('/api/search/history?all=true&context=connections', {
        method: 'DELETE',
      });
    } catch {}
  };

  // Fetch all members from DBMS endpoint
  const fetchMembers = async (query = '') => {
    try {
      setIsLoading(true);
      setFetchError(null);
      const url = query
        ? `/api/members?q=${encodeURIComponent(query)}&limit=100`
        : `/api/members?limit=100`;

      const authHeaders = getClientAuthHeaders(currentUser?.uid);
      const headers: Record<string, string> = { ...authHeaders };
      try {
        const { createClient } = await import('@/lib/supabase/client');
        const supabase = createClient();
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          headers['Authorization'] = `Bearer ${sessionData.session.access_token}`;
        }
      } catch {}

      const res = await fetch(url, {
        headers,
        credentials: 'include',
      });

      if (!res.ok) {
        if (res.status === 401) {
          setFetchError('Session expired or unauthenticated. Please refresh or sign in again.');
        } else {
          setFetchError(`Network search request failed (${res.status}).`);
        }
        return;
      }
      const data = await res.json();
      if (data && Array.isArray(data.members)) {
        setAllMembers(data.members);
        if (query.trim().length >= 2) {
          recordSearchHistory(query, data.members.length);
        }
      }
    } catch (err: any) {
      console.error('[SearchConnectionsModal] Error querying members:', err);
      setFetchError(err?.message || 'Could not reach search service');
    } finally {
      setIsLoading(false);
    }
  };


  // Debounced search on typing or modal opening
  useEffect(() => {
    if (!isOpen) return;
    loadSearchHistory();
    const timer = setTimeout(() => {
      fetchMembers(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  // Reactive listener for connection events to immediately update open modal cards
  useEffect(() => {
    if (!isOpen) return;
    const handleConnChanged = () => {
      setConnectionsVersion((v) => v + 1);
    };
    window.addEventListener(CONNECTIONS_CHANGED_EVENT, handleConnChanged);
    return () => {
      window.removeEventListener(CONNECTIONS_CHANGED_EVENT, handleConnChanged);
    };
  }, [isOpen]);

  // Compute affinity and filter candidates
  const scoredCandidates = useMemo(() => {
    if (!currentUser?.uid) return [];

    const connectedUids = new Set(
      (getConnectedUserIds(currentUser.uid) || [])
        .filter(Boolean)
        .map((id) => String(id).toLowerCase())
    );
    const allRequests = getAllConnectionRequests();

    const seenUids = new Set<string>();
    const seenEmails = new Set<string>();
    const deduplicatedMembers = allMembers.filter((m) => {
      if (!m) return false;
      const uidKey = (m.uid || m.id || '').toString().toLowerCase();
      const emailKey = (m.email || '').toString().trim().toLowerCase();
      if (!uidKey) return false;
      if (isSelfProfile(currentUser, m) || isTestOrDummyAccount(m)) return false; // Self & Dummy exclusion
      if (seenUids.has(uidKey)) return false;
      if (emailKey && seenEmails.has(emailKey)) return false;
      seenUids.add(uidKey);
      if (emailKey) seenEmails.add(emailKey);
      return true;
    });

    return deduplicatedMembers
      .map((candidate) => {
        const { score, percentage, reasons, topBadges } = calculateConnectionAffinity(currentUser, candidate);
        const baseStatus = getConnectionStatus(currentUser.uid, candidate.uid);
        const status = (localStatusMap[candidate.uid] as any) || baseStatus;

        return {
          user: candidate,
          score,
          percentage,
          reasons,
          topBadges,
          status,
        };
      })
      .filter((item) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'ex_company') {
          return item.reasons.some((r) => r.category === 'ex_company' || r.category === 'work');
        }
        if (activeFilter === 'location') {
          return item.reasons.some((r) => r.category === 'location');
        }
        if (activeFilter === 'alumni') {
          return item.reasons.some((r) => r.category === 'college' || r.category === 'qualification');
        }
        if (activeFilter === 'certified') {
          return item.reasons.some((r) => r.category === 'certification');
        }
        if (activeFilter === 'designation') {
          return item.reasons.some((r) => r.category === 'designation');
        }
        return true;
      })
      .sort((a, b) => {
        // Prioritize not connected, then by highest affinity percentage
        if (a.status === 'connected' && b.status !== 'connected') return 1;
        if (a.status !== 'connected' && b.status === 'connected') return -1;
        return b.percentage - a.percentage;
      });
  }, [allMembers, currentUser, activeFilter, connectionsVersion, localStatusMap]);

  const handleSendRequest = async (targetUser: UserProfile, noteText?: string) => {
    if (!currentUser.uid || !targetUser.uid) return;
    if (isSelfProfile(currentUser, targetUser)) {
      setActionNotice({ message: 'You cannot send a connection request to yourself.', type: 'error' });
      toast('You cannot send a connection request to yourself.');
      return;
    }
    if (isTestOrDummyAccount(targetUser)) {
      setActionNotice({ message: 'This user is not available for connections.', type: 'error' });
      toast('This user is not available for connections.');
      return;
    }
    try {
      setConnectingUid(targetUser.uid);
      setLocalStatusMap((prev) => ({ ...prev, [targetUser.uid]: 'pending_sent' }));
      await sendConnectionRequest(
        currentUser,
        targetUser,
        noteText || `Hi ${targetUser.firstName || targetUser.displayName}, let's connect on FR8X!`
      );
      const targetName = targetUser.displayName || targetUser.firstName || 'Member';
      setActionNotice({ message: `Connection invitation sent to ${targetName}!`, type: 'success' });
      toast(`Connection invitation sent to ${targetName}!`);
      setNotePromptUid(null);
      setCustomNote('');
      if (currentUser.uid) {
        await syncConnectionsFromServer(currentUser.uid);
      }
    } catch (err: any) {
      setLocalStatusMap((prev) => {
        const copy = { ...prev };
        delete copy[targetUser.uid];
        return copy;
      });
      const errMsg = err?.message || 'Failed to send connection request';
      setActionNotice({ message: errMsg, type: 'error' });
      toast(errMsg);
    } finally {
      setConnectingUid(null);
    }
  };

  const handleAcceptRequest = async (targetUid: string, targetName: string) => {
    const all = getAllConnectionRequests();
    const req = all.find((r) => r.fromUid === targetUid && r.toUid === currentUser.uid && r.status === 'pending');
    if (req) {
      try {
        setAcceptingUid(targetUid);
        setLocalStatusMap((prev) => ({ ...prev, [targetUid]: 'connected' }));
        await acceptConnectionRequest(req.id, currentUser);
        setActionNotice({ message: `Connected with ${targetName}!`, type: 'success' });
        toast(`Connected with ${targetName}!`);
        if (currentUser.uid) {
          await syncConnectionsFromServer(currentUser.uid);
        }
      } catch (err: any) {
        setLocalStatusMap((prev) => ({ ...prev, [targetUid]: 'pending_received' }));
        const errMsg = err?.message || 'Failed to accept connection request';
        setActionNotice({ message: errMsg, type: 'error' });
        toast(errMsg);
      } finally {
        setAcceptingUid(null);
      }
    }
  };

  const handleWithdrawRequest = async (targetUid: string) => {
    try {
      setWithdrawingUid(targetUid);
      setLocalStatusMap((prev) => ({ ...prev, [targetUid]: 'none' }));
      const all = getAllConnectionRequests();
      const req = all.find((r) => r.fromUid === currentUser.uid && r.toUid === targetUid && r.status === 'pending');
      await cancelConnectionRequest(req?.id || '', currentUser, targetUid);
      setActionNotice({ message: 'Connection request withdrawn.', type: 'success' });
      toast('Connection request withdrawn.');
      if (currentUser.uid) {
        await syncConnectionsFromServer(currentUser.uid);
      }
    } catch (err: any) {
      setLocalStatusMap((prev) => ({ ...prev, [targetUid]: 'pending_sent' }));
      const errMsg = err?.message || 'Failed to withdraw connection request';
      setActionNotice({ message: errMsg, type: 'error' });
      toast(errMsg);
    } finally {
      setWithdrawingUid(null);
    }
  };

  const handleDeclineRequest = async (targetUid: string) => {
    try {
      setRejectingUid(targetUid);
      setLocalStatusMap((prev) => ({ ...prev, [targetUid]: 'none' }));
      const all = getAllConnectionRequests();
      const req = all.find((r) => r.fromUid === targetUid && r.toUid === currentUser.uid && r.status === 'pending');
      if (req) {
        await declineConnectionRequest(req.id, currentUser);
      }
      setActionNotice({ message: 'Connection request rejected.', type: 'success' });
      toast('Connection request rejected.');
      if (currentUser.uid) {
        await syncConnectionsFromServer(currentUser.uid);
      }
    } catch (err: any) {
      setLocalStatusMap((prev) => ({ ...prev, [targetUid]: 'pending_received' }));
      const errMsg = err?.message || 'Failed to reject request';
      setActionNotice({ message: errMsg, type: 'error' });
      toast(errMsg);
    } finally {
      setRejectingUid(null);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Search New Contacts & Global Freight Connections"
      maxWidth="860px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {/* Search Bar & Stats */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={15}
              style={{
                position: 'absolute',
                left: '12px',
                top: '12px',
                color: '#64748b',
              }}
            />
            <input
              type="text"
              placeholder="Search by name, company, ex-company, city, college, degree, or certification (e.g., Maersk, IIFT, FIATA, Mumbai)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '10px 36px 10px 36px',
                fontSize: '13px',
                borderRadius: '8px',
                border: '1.5px solid #cbd5e1',
                background: '#ffffff',
                outline: 'none',
              }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '12px',
                  top: '10px',
                  background: 'none',
                  border: 'none',
                  color: '#94a3b8',
                  cursor: 'pointer',
                  padding: '2px',
                }}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Recent Searches Chips */}
          {!searchTerm && recentSearches.length > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', padding: '2px 0' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} /> Recent:
              </span>
              {recentSearches.map((item) => (
                <span
                  key={item.id}
                  onClick={() => setSearchTerm(item.query)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '3px 8px',
                    borderRadius: '12px',
                    background: '#f1f5f9',
                    fontSize: '11px',
                    color: '#334155',
                    cursor: 'pointer',
                    userSelect: 'none',
                  }}
                  className="hover:bg-slate-200"
                >
                  <span>{item.query}</span>
                  <button
                    type="button"
                    onClick={(e) => removeHistoryItem(e, item.id)}
                    title="Remove from history"
                    style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94a3b8', display: 'flex' }}
                    className="hover:text-red-500"
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
              <button
                type="button"
                onClick={clearAllHistory}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '10.5px',
                  color: '#94a3b8',
                  padding: '2px 4px',
                  textDecoration: 'underline',
                }}
              >
                Clear all
              </button>
            </div>
          )}

          {/* Filter Chips / Facets */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              paddingBottom: '2px',
            }}
          >
            {[
              { id: 'all', label: 'All Candidates' },
              { id: 'ex_company', label: '🏢 Ex-Colleagues & Work' },
              { id: 'location', label: '📍 Maritime Hub & City' },
              { id: 'alumni', label: '🎓 Alumni & Colleges' },
              { id: 'certified', label: '🏆 FIATA & Certified' },
              { id: 'designation', label: '💼 Same Designation' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setActiveFilter(chip.id as FilterChip)}
                style={{
                  padding: '5px 12px',
                  fontSize: '11px',
                  fontWeight: activeFilter === chip.id ? 700 : 500,
                  borderRadius: '20px',
                  border: activeFilter === chip.id ? '1px solid var(--brand)' : '1px solid #e2e8f0',
                  background: activeFilter === chip.id ? '#eef6ff' : '#ffffff',
                  color: activeFilter === chip.id ? 'var(--brand)' : '#475569',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* In-Modal Realtime Action Feedback Banner */}
        {actionNotice && (
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '6px',
              fontSize: '11.5px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '10px',
              background: actionNotice.type === 'success' ? '#f0fdf4' : actionNotice.type === 'error' ? '#fef2f2' : '#eff6ff',
              border: `1px solid ${actionNotice.type === 'success' ? '#bbf7d0' : actionNotice.type === 'error' ? '#fecaca' : '#bfdbfe'}`,
              color: actionNotice.type === 'success' ? '#166534' : actionNotice.type === 'error' ? '#991b1b' : '#1e40af',
              animation: 'fadeIn 0.2s ease',
            }}
          >
            <span>{actionNotice.message}</span>
            <button
              type="button"
              onClick={() => setActionNotice(null)}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'inherit',
                cursor: 'pointer',
                fontWeight: 700,
                fontSize: '13px',
                padding: '0 4px',
              }}
            >
              ×
            </button>
          </div>
        )}

        {/* Results List */}
        <div
          style={{
            maxHeight: '480px',
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px',
            paddingRight: '4px',
          }}
        >
          {fetchError ? (
            <div
              style={{
                padding: '30px 20px',
                textAlign: 'center',
                background: '#fef2f2',
                borderRadius: '8px',
                border: '1px solid #fecaca',
              }}
            >
              <b style={{ fontSize: '13.5px', color: '#991b1b', display: 'block', marginBottom: '6px' }}>
                Search Service Notice
              </b>
              <p style={{ fontSize: '12px', color: '#b91c1c', margin: '0 0 14px 0' }}>
                {fetchError}
              </p>
              <button
                type="button"
                className="btn secondary sm"
                onClick={() => fetchMembers(searchTerm)}
                style={{ margin: '0 auto', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                Retry Search
              </button>
            </div>
          ) : isLoading && scoredCandidates.length === 0 ? (
            <div style={{ padding: '36px', textAlign: 'center', color: '#64748b', fontSize: '13px' }}>
              Searching maritime enterprise network...
            </div>
          ) : scoredCandidates.length === 0 ? (
            <div
              style={{
                padding: '40px 20px',
                textAlign: 'center',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px dashed #cbd5e1',
              }}
            >
              <Search size={32} color="#94a3b8" style={{ margin: '0 auto 10px', display: 'block' }} />
              <b style={{ fontSize: '14px', color: '#1e293b', display: 'block', marginBottom: '4px' }}>
                No matching members found. Try another name or company.
              </b>
              {searchTerm && (
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => setSearchTerm('')}
                  style={{ margin: '12px auto 0', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  Clear Search Filter
                </button>
              )}
            </div>
          ) : (
            scoredCandidates.map(({ user: candidate, score, percentage, reasons, topBadges, status }) => {
              const cName = candidate.displayName || `${candidate.firstName || ''} ${candidate.lastName || ''}`.trim() || candidate.email;
              const isNoteOpen = notePromptUid === candidate.uid;

              return (
                <div
                  key={candidate.uid}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
                    {/* Candidate Identity */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1, minWidth: 0 }}>
                      <div
                        className="avatar"
                        onClick={() => {
                          onClose();
                          if (onViewProfile) onViewProfile(candidate.uid, cName);
                          else if (typeof window !== 'undefined') window.location.href = `/people/${candidate.uid}`;
                        }}
                        style={{
                          width: '46px',
                          height: '46px',
                          padding: 0,
                          overflow: 'hidden',
                          borderRadius: '50%',
                          cursor: 'pointer',
                          flexShrink: 0,
                          border: '1.5px solid #cbd5e1',
                        }}
                      >
                        {candidate.avatarUrl ? (
                          <img src={candidate.avatarUrl} alt={cName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
                              fontSize: '15px',
                              fontWeight: 800,
                            }}
                          >
                            {cName.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <b
                            onClick={() => {
                              onClose();
                              if (onViewProfile) onViewProfile(candidate.uid, cName);
                              else if (typeof window !== 'undefined') window.location.href = `/people/${candidate.uid}`;
                            }}
                            style={{
                              fontSize: '13.5px',
                              color: 'var(--fr8x-text)',
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            {cName}
                            {candidate.hasGoldenTick && <GoldenTick size={13} />}
                          </b>

                          {/* Match Affinity Badge */}
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '1px 7px',
                              borderRadius: '10px',
                              background: percentage >= 85 ? '#ecfdf5' : '#eff6ff',
                              color: percentage >= 85 ? '#065f46' : '#1e40af',
                              border: `1px solid ${percentage >= 85 ? '#a7f3d0' : '#bfdbfe'}`,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <Sparkles size={9} /> {percentage}% Match
                          </span>
                        </div>

                        <div style={{ fontSize: '11.5px', color: '#475569', marginTop: '2px' }}>
                          <span style={{ fontWeight: 600 }}>{candidate.designation || 'Trade Specialist'}</span> ·{' '}
                          <span style={{ fontWeight: 700, color: 'var(--brand)' }}>{candidate.company || 'Enterprise'}</span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: '#64748b', marginTop: '3px', flexWrap: 'wrap' }}>
                          {candidate.city && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              <MapPin size={11} /> {candidate.city}, {candidate.country || 'India'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                      <button
                        type="button"
                        className="btn secondary sm"
                        onClick={() => {
                          onClose();
                          if (onViewProfile) onViewProfile(candidate.uid, cName);
                          else if (typeof window !== 'undefined') window.location.href = `/people/${candidate.uid}`;
                        }}
                        style={{ fontSize: '11px', padding: '5px 10px' }}
                      >
                        Passport
                      </button>

                      {status === 'connected' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            className="badge green"
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              padding: '4px 8px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                            }}
                          >
                            <CheckCircle2 size={11} /> CONNECTED
                          </span>
                          <button
                            type="button"
                            className="btn primary sm"
                            onClick={() => {
                              onClose();
                              onOpenChat && onOpenChat(candidate.uid, cName);
                            }}
                            style={{
                              fontSize: '11px',
                              padding: '5px 12px',
                              background: '#099889',
                            }}
                          >
                            <MessageCircle size={12} /> Chat
                          </button>
                        </div>
                      ) : status === 'pending_sent' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: '#f1f5f9',
                              color: '#475569',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              border: '1px solid #cbd5e1',
                            }}
                          >
                            <Clock size={11} /> REQUEST SENT
                          </span>
                          <button
                            type="button"
                            className="btn secondary sm"
                            disabled={withdrawingUid === candidate.uid}
                            onClick={() => handleWithdrawRequest(candidate.uid)}
                            style={{ fontSize: '10px', color: '#dc2626', padding: '4px 6px', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                            title="Withdraw request"
                          >
                            {withdrawingUid === candidate.uid ? (
                              <>
                                <Loader2 size={10} className="spin" /> WITHDRAWING...
                              </>
                            ) : (
                              'Withdraw'
                            )}
                          </button>
                        </div>
                      ) : status === 'pending_received' ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              padding: '4px 8px',
                              borderRadius: '4px',
                              background: '#ecfdf5',
                              color: '#065f46',
                              border: '1px solid #a7f3d0',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              letterSpacing: '0.02em',
                            }}
                          >
                            <UserCheck size={11} /> CONNECTION REQUEST RECEIVED
                          </span>
                          <button
                            type="button"
                            className="btn primary sm"
                            disabled={acceptingUid === candidate.uid || rejectingUid === candidate.uid}
                            onClick={() => handleAcceptRequest(candidate.uid, cName)}
                            style={{ fontSize: '11px', padding: '5px 12px', background: '#099889', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            {acceptingUid === candidate.uid ? (
                              <>
                                <Loader2 size={12} className="spin" /> ACCEPTING...
                              </>
                            ) : (
                              <>
                                <Check size={12} /> Accept
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn secondary sm"
                            disabled={rejectingUid === candidate.uid || acceptingUid === candidate.uid}
                            onClick={() => handleDeclineRequest(candidate.uid)}
                            style={{ fontSize: '11px', padding: '5px 8px', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            {rejectingUid === candidate.uid ? (
                              <>
                                <Loader2 size={12} className="spin" /> REJECTING...
                              </>
                            ) : (
                              <>
                                <X size={12} /> Reject
                              </>
                            )}
                          </button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            className="btn primary sm"
                            disabled={connectingUid === candidate.uid}
                            onClick={() => handleSendRequest(candidate)}
                            style={{ fontSize: '11px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            {connectingUid === candidate.uid ? (
                              <>
                                <Loader2 size={12} className="spin" /> SENDING...
                              </>
                            ) : (
                              <>
                                <UserPlus size={12} /> Connect
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            className="btn secondary sm"
                            disabled={connectingUid === candidate.uid}
                            onClick={() => {
                              setNotePromptUid(isNoteOpen ? null : candidate.uid);
                              setCustomNote('');
                            }}
                            title="Add personalized note"
                            style={{ fontSize: '11px', padding: '5px 8px' }}
                          >
                            ✍️
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Personal note entry toggle */}
                  {isNoteOpen && (
                    <div
                      style={{
                        padding: '8px 10px',
                        background: '#f8fafc',
                        borderRadius: '6px',
                        border: '1px solid #cbd5e1',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                      }}
                    >
                      <span style={{ fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                        Include personalized connection message:
                      </span>
                      <textarea
                        rows={2}
                        value={customNote}
                        onChange={(e) => setCustomNote(e.target.value)}
                        placeholder={`Hi ${cName.split(' ')[0]}, let's connect on FR8X regarding trade logistics and freight bookings...`}
                        style={{
                          width: '100%',
                          boxSizing: 'border-box',
                          fontSize: '11.5px',
                          padding: '6px 8px',
                          borderRadius: '4px',
                          border: '1px solid #cbd5e1',
                          background: '#ffffff',
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn secondary sm"
                          onClick={() => setNotePromptUid(null)}
                          style={{ fontSize: '10.5px' }}
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          className="btn primary sm"
                          onClick={() => handleSendRequest(candidate, customNote)}
                          style={{ fontSize: '10.5px' }}
                        >
                          <Send size={11} /> Send Invite with Note
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Match Reason Badges & Background Details */}
                  {reasons.length > 0 && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        flexWrap: 'wrap',
                        background: '#f8fafc',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        border: '1px solid #f1f5f9',
                      }}
                    >
                      <span style={{ fontSize: '10px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>
                        Why Matched:
                      </span>
                      {reasons.map((r, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: '10px',
                            fontWeight: 600,
                            padding: '2px 6px',
                            borderRadius: '4px',
                            background: '#ffffff',
                            color: '#1e293b',
                            border: '1px solid #e2e8f0',
                          }}
                          title={r.detail}
                        >
                          {r.badge}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Work History, Education & Certifications Snippets */}
                  {(candidate.experiences?.length || candidate.educations?.length || candidate.certifications?.length) ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', fontSize: '10.5px', color: '#64748b' }}>
                      {candidate.experiences && candidate.experiences.length > 0 && (
                        <div>
                          <strong style={{ color: '#334155' }}>Work History:</strong>{' '}
                          {candidate.experiences.map((exp: any) => `${exp.designation || exp.title || 'Professional'} at ${exp.company}`).join(' · ')}
                        </div>
                      )}
                      {candidate.educations && candidate.educations.length > 0 && (
                        <div>
                          <strong style={{ color: '#334155' }}>Education:</strong>{' '}
                          {candidate.educations.map((edu: any) => `${edu.qualification} (${edu.institution})`).join(' · ')}
                        </div>
                      )}
                      {candidate.certifications && candidate.certifications.length > 0 && (
                        <div>
                          <strong style={{ color: '#334155' }}>Certifications:</strong>{' '}
                          {candidate.certifications.map((cert: any) => cert.title).join(' · ')}
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderTop: '1px solid #e2e8f0',
            paddingTop: '10px',
            fontSize: '11px',
            color: '#64748b',
          }}
        >
          <span>
            Showing {scoredCandidates.length} potential connections across the B2B Freight Network
          </span>
          <button type="button" className="btn secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </Modal>
  );
}
