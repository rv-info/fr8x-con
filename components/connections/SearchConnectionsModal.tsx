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
} from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { UserProfile } from '@/lib/types';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  calculateConnectionAffinity,
  MatchReason,
} from '@/lib/connections-algorithm';
import {
  getConnectedUserIds,
  getAllConnectionRequests,
  getConnectionStatus,
  sendConnectionRequest,
  acceptConnectionRequest,
  cancelConnectionRequest,
  CONNECTIONS_CHANGED_EVENT,
} from '@/lib/connections';
import { useToast } from '@/lib/context/ToastContext';

interface SearchConnectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onViewProfile: (uid: string, name: string) => void;
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
  const [connectingUid, setConnectingUid] = useState<string | null>(null);
  const [notePromptUid, setNotePromptUid] = useState<string | null>(null);
  const [customNote, setCustomNote] = useState('');

  // Fetch all members from DBMS endpoint
  const fetchMembers = async (query = '') => {
    try {
      setIsLoading(true);
      const url = query
        ? `/api/members?q=${encodeURIComponent(query)}&limit=100`
        : `/api/members?limit=100`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && Array.isArray(data.members)) {
        setAllMembers(data.members);
      }
    } catch (err) {
      console.error('[SearchConnectionsModal] Error querying members:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchMembers(searchTerm);
    }
  }, [isOpen]);

  // Debounced search on typing
  useEffect(() => {
    if (!isOpen) return;
    const timer = setTimeout(() => {
      fetchMembers(searchTerm);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchTerm, isOpen]);

  // Compute affinity and filter candidates
  const scoredCandidates = useMemo(() => {
    if (!currentUser?.uid) return [];

    const connectedUids = new Set(getConnectedUserIds(currentUser.uid).map((id) => id.toLowerCase()));
    const allRequests = getAllConnectionRequests();

    return allMembers
      .filter((m) => m.uid && m.uid.toLowerCase() !== currentUser.uid.toLowerCase())
      .map((candidate) => {
        const { score, percentage, reasons, topBadges } = calculateConnectionAffinity(currentUser, candidate);
        const status = getConnectionStatus(currentUser.uid, candidate.uid);

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
  }, [allMembers, currentUser, activeFilter]);

  const handleSendRequest = (targetUser: UserProfile, noteText?: string) => {
    if (!currentUser.uid || !targetUser.uid) return;
    try {
      setConnectingUid(targetUser.uid);
      sendConnectionRequest(
        currentUser,
        targetUser,
        noteText || `Hi ${targetUser.firstName || targetUser.displayName}, let's connect on FR8X!`
      );
      toast(`Connection invitation sent to ${targetUser.displayName || targetUser.firstName}!`);
      setNotePromptUid(null);
      setCustomNote('');
    } catch (err: any) {
      toast(err.message || 'Failed to send connection request');
    } finally {
      setConnectingUid(null);
    }
  };

  const handleAcceptRequest = (targetUid: string, targetName: string) => {
    const all = getAllConnectionRequests();
    const req = all.find((r) => r.fromUid === targetUid && r.toUid === currentUser.uid && r.status === 'pending');
    if (req) {
      acceptConnectionRequest(req.id, currentUser);
      toast(`Connected with ${targetName}!`);
    }
  };

  const handleWithdrawRequest = (targetUid: string) => {
    const all = getAllConnectionRequests();
    const req = all.find((r) => r.fromUid === currentUser.uid && r.toUid === targetUid && r.status === 'pending');
    if (req) {
      cancelConnectionRequest(req.id);
      toast('Connection request withdrawn.');
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
          {isLoading && scoredCandidates.length === 0 ? (
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
                No connection candidates found
              </b>
              <p style={{ fontSize: '12px', color: '#64748b', margin: 0 }}>
                Try searching with other terms like specific liner companies, universities, or port hubs.
              </p>
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
                          onViewProfile(candidate.uid, cName);
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
                              onViewProfile(candidate.uid, cName);
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
                          {candidate.operatingCorridors && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                              🚢 {candidate.operatingCorridors}
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
                          onViewProfile(candidate.uid, cName);
                        }}
                        style={{ fontSize: '11px', padding: '5px 10px' }}
                      >
                        Passport
                      </button>

                      {status === 'connected' ? (
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
                            <Clock size={11} /> Request Sent
                          </span>
                          <button
                            type="button"
                            className="btn secondary sm"
                            onClick={() => handleWithdrawRequest(candidate.uid)}
                            style={{ fontSize: '10px', color: '#dc2626', padding: '4px 6px' }}
                            title="Withdraw request"
                          >
                            Withdraw
                          </button>
                        </div>
                      ) : status === 'pending_received' ? (
                        <button
                          type="button"
                          className="btn primary sm"
                          onClick={() => handleAcceptRequest(candidate.uid, cName)}
                          style={{ fontSize: '11px', padding: '5px 12px' }}
                        >
                          <Check size={12} /> Accept Request
                        </button>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <button
                            type="button"
                            className="btn primary sm"
                            disabled={connectingUid === candidate.uid}
                            onClick={() => handleSendRequest(candidate)}
                            style={{ fontSize: '11px', padding: '5px 12px' }}
                          >
                            <UserPlus size={12} /> Connect
                          </button>
                          <button
                            type="button"
                            className="btn secondary sm"
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
                          {candidate.experiences.map((exp: any) => `${exp.designation} at ${exp.company}`).join(' · ')}
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
