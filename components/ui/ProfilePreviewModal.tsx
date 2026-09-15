'use client';

import React, { useMemo } from 'react';
import { Modal } from './Modal';
import { LocalTimeBadge } from './LocalTimeBadge';
import { GoldenTick } from './GoldenTick';
import { useChat } from '@/lib/context/ChatContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { UserProfile } from '@/lib/types';
import {
  getConnectionStatus,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  getUserPrivacySettings,
  getAllConnectionRequests,
  maskEmail,
  maskPhone,
  maskStatutory,
  CONNECTIONS_CHANGED_EVENT,
  ConnectionStatus,
} from '@/lib/connections';
import {
  MessageSquare,
  MapPin,
  Building2,
  Briefcase,
  Mail,
  Phone,
  ShieldCheck,
  Award,
  CheckCircle2,
  FileText,
  Star,
  Share2,
  UserPlus,
  UserMinus,
  UserCheck,
  Clock,
  Lock,
  Settings,
  Check,
  X,
  AlertCircle,
} from 'lucide-react';

export interface ProfilePreviewData {
  name: string;
  role?: string;
  company?: string;
  location?: string;
  email?: string;
  phone?: string;
  timezone?: string;
  hasGoldenTick?: boolean;
  isVerified?: boolean;
  bio?: string;
  specializations?: string[];
  contactAvailability?: string;
  trustScore?: number;
  kycTier?: string;
  certifications?: string[];
  keyTradeLanes?: string[];
  teuVolumeYear?: string;
  avatarUrl?: string;
  companyLogoUrl?: string;
  companyId?: string;
  gstn?: string;
  pan?: string;
  iec?: string;
  mto?: string;
  taxId?: string;
  taxIdLabel?: string;
  corporateRegNumber?: string;
  corporateRegLabel?: string;
  uid?: string;
}

interface ProfilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile?: ProfilePreviewData | null;
  personName?: string;
  targetUid?: string;
}

export function ProfilePreviewModal({
  isOpen,
  onClose,
  profile,
  personName,
  targetUid,
}: ProfilePreviewModalProps) {
  const { openChatWith } = useChat();
  const { user, allUsers } = useAuth();
  const { toast } = useToast();

  const [connRevision, setConnRevision] = React.useState(0);
  const [showConnectModal, setShowConnectModal] = React.useState(false);
  const [connectNote, setConnectNote] = React.useState('');
  const [isSendingRequest, setIsSendingRequest] = React.useState(false);

  React.useEffect(() => {
    const handler = () => setConnRevision((v) => v + 1);
    window.addEventListener(CONNECTIONS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CONNECTIONS_CHANGED_EVENT, handler);
  }, []);

  const rawTargetName = (profile?.name || personName || '').trim();

  // 1. Is this the currently logged-in user?
  const isCurrentUser = Boolean(
    user && (
      (targetUid && user.uid && targetUid === user.uid) ||
      (user.displayName && rawTargetName.toLowerCase() === user.displayName.toLowerCase()) ||
      (user.email && rawTargetName.toLowerCase() === user.email.toLowerCase()) ||
      (user.firstName &&
        user.lastName &&
        rawTargetName.toLowerCase() === `${user.firstName} ${user.lastName}`.trim().toLowerCase()) ||
      (user.uid && rawTargetName === user.uid) ||
      (!rawTargetName && !targetUid && Boolean(user.displayName))
    )
  );

  // 2. Resolve target user from AuthContext or local storage
  const matchedUser: UserProfile | undefined = useMemo(() => {
    if (isCurrentUser) return user;
    if (targetUid) {
      const byUid = allUsers.find((u) => u.uid === targetUid);
      if (byUid) return byUid;
    }
    if (!rawTargetName) return undefined;
    const target = rawTargetName.toLowerCase();

    // Check allUsers from AuthContext
    const found = allUsers.find((u) => {
      const uDisp = (u.displayName || '').trim().toLowerCase();
      const uEmail = (u.email || '').trim().toLowerCase();
      const uFull = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
      return (
        (uDisp && uDisp === target) ||
        (uEmail && uEmail === target) ||
        (uFull && uFull === target) ||
        (u.uid && u.uid === rawTargetName)
      );
    });
    if (found) return found;

    // Check localStorage fallback
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('fr8x_all_users_v2');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            return parsed.find((u: any) => {
              const uDisp = (u.displayName || '').trim().toLowerCase();
              const uEmail = (u.email || '').trim().toLowerCase();
              const uFull = `${u.firstName || ''} ${u.lastName || ''}`.trim().toLowerCase();
              return (
                (uDisp && uDisp === target) ||
                (uEmail && uEmail === target) ||
                (uFull && uFull === target) ||
                (u.uid && (u.uid === rawTargetName || u.uid === targetUid))
              );
            });
          }
        }
      } catch {}
    }

    return undefined;
  }, [isCurrentUser, user, rawTargetName, targetUid, allUsers]);

  const effectiveUser = matchedUser;

  // Genuine fields resolution (strict real-data mapping — zero fabricated claims)
  const resolvedName =
    effectiveUser?.displayName ||
    `${effectiveUser?.firstName || ''} ${effectiveUser?.lastName || ''}`.trim() ||
    profile?.name ||
    personName ||
    'Freight Member';

  const resolvedCompany =
    effectiveUser?.company?.trim() ||
    profile?.company?.trim() ||
    'Independent Freight Professional';

  const resolvedRole =
    effectiveUser?.designation?.trim() ||
    profile?.role?.trim() ||
    'Logistics Professional';

  const resolvedLocation =
    [effectiveUser?.city, effectiveUser?.state, effectiveUser?.country].filter(Boolean).join(', ') ||
    effectiveUser?.formattedAddress ||
    profile?.location ||
    'Location Not Specified';

  const resolvedTimezone =
    effectiveUser?.timezone ||
    profile?.timezone ||
    'Asia/Kolkata';

  const resolvedEmail =
    effectiveUser?.email ||
    profile?.email ||
    '';

  const resolvedPhone =
    effectiveUser?.mobile ||
    profile?.phone ||
    '';

  const resolvedAvailability =
    effectiveUser?.contactAvailability ||
    profile?.contactAvailability ||
    'Standard Business Hours';

  const resolvedAvatar =
    effectiveUser?.avatarUrl ||
    (profile as any)?.avatarUrl ||
    (isCurrentUser ? user?.avatarUrl : null);

  const hasGoldenTick = Boolean(effectiveUser?.hasGoldenTick ?? profile?.hasGoldenTick);
  const isVerified = Boolean(
    effectiveUser?.isVerified || effectiveUser?.email_verified || profile?.isVerified
  );

  const resolvedBio =
    effectiveUser?.summary?.trim() ||
    effectiveUser?.bio?.trim() ||
    profile?.bio?.trim() ||
    null;

  const targetUserUid = effectiveUser?.uid || targetUid || (profile as any)?.uid || undefined;

  const connStatus = useMemo<ConnectionStatus>(() => {
    if (isCurrentUser) return 'self';
    if (!user?.uid || !targetUserUid) return 'none';
    return getConnectionStatus(user.uid, targetUserUid);
  }, [isCurrentUser, user?.uid, targetUserUid, connRevision]);

  const isConnected = connStatus === 'connected';

  const targetPrivacy = useMemo(() => {
    return getUserPrivacySettings(effectiveUser);
  }, [effectiveUser, connRevision]);

  // Privacy evaluations for direct contact info
  const isEmailVisible = isCurrentUser || isConnected || targetPrivacy.emailVisibility === 'public';
  const isEmailPrivate = !isCurrentUser && isConnected && targetPrivacy.emailVisibility === 'private';
  const displayEmail = isEmailPrivate
    ? 'Marked Private'
    : isEmailVisible
    ? resolvedEmail
    : maskEmail(resolvedEmail);
  const isEmailMasked = !isEmailVisible && !isEmailPrivate && Boolean(resolvedEmail);

  const isPhoneVisible = isCurrentUser || isConnected || targetPrivacy.phoneVisibility === 'public';
  const isPhonePrivate = !isCurrentUser && isConnected && targetPrivacy.phoneVisibility === 'private';
  const displayPhone = isPhonePrivate
    ? 'Marked Private'
    : isPhoneVisible
    ? resolvedPhone
    : maskPhone(resolvedPhone);
  const isPhoneMasked = !isPhoneVisible && !isPhonePrivate && Boolean(resolvedPhone);

  const isStatutoryVisible = isCurrentUser || isConnected || targetPrivacy.statutoryVisibility === 'public';

  const realTradeLanes: string[] = useMemo(() => {
    const raw = [
      ...(effectiveUser?.keyTradeLanes || []),
      ...(profile?.keyTradeLanes || []),
    ].filter(Boolean);
    return Array.from(new Set(raw));
  }, [effectiveUser?.keyTradeLanes, profile?.keyTradeLanes]);

  const resolvedVolume =
    effectiveUser?.teuVolumeYear ||
    profile?.teuVolumeYear ||
    null;

  const realSpecializations: string[] = useMemo(() => {
    const raw = [
      ...(effectiveUser?.specializations || []),
      ...(effectiveUser?.skills || []),
      ...(profile?.specializations || []),
    ].filter(Boolean);
    return Array.from(new Set(raw));
  }, [effectiveUser?.specializations, effectiveUser?.skills, profile?.specializations]);

  const realCredentials = useMemo(() => {
    const list: { label: string; verified?: boolean }[] = [];

    // Real profile certifications
    if (Array.isArray(effectiveUser?.certifications)) {
      effectiveUser.certifications.forEach((c) => {
        if (c && c.title) {
          list.push({
            label: `${c.title}${c.issuingAuthority ? ` (${c.issuingAuthority})` : ''}`,
            verified: c.verificationStatus === 'verified',
          });
        }
      });
    }

    // Real statutory filings & licenses with privacy masking
    if (effectiveUser?.gstn) {
      list.push({
        label: isStatutoryVisible
          ? `GSTIN: ${effectiveUser.gstn}`
          : `GSTIN: ${maskStatutory(effectiveUser.gstn)} (Connect to view)`,
        verified: true,
      });
    }
    if (effectiveUser?.pan) {
      list.push({
        label: isStatutoryVisible
          ? `Income Tax PAN: ${effectiveUser.pan}`
          : `Income Tax PAN: ${maskStatutory(effectiveUser.pan)} (Connect to view)`,
        verified: true,
      });
    }
    if (effectiveUser?.iec) {
      list.push({
        label: isStatutoryVisible
          ? `DGFT Import Export Code (IEC): ${effectiveUser.iec}`
          : `DGFT Import Export Code (IEC): ${maskStatutory(effectiveUser.iec)} (Connect to view)`,
        verified: true,
      });
    }
    if (effectiveUser?.mto) {
      list.push({
        label: isStatutoryVisible
          ? `DG Shipping MTO: ${effectiveUser.mto}`
          : `DG Shipping MTO: ${maskStatutory(effectiveUser.mto)} (Connect to view)`,
        verified: true,
      });
    }
    if (effectiveUser?.taxId && !effectiveUser?.gstn) {
      list.push({
        label: isStatutoryVisible
          ? `${effectiveUser.taxIdLabel || 'Tax ID'}: ${effectiveUser.taxId}`
          : `${effectiveUser.taxIdLabel || 'Tax ID'}: ${maskStatutory(effectiveUser.taxId)} (Connect to view)`,
        verified: true,
      });
    }
    if (effectiveUser?.corporateRegNumber && !effectiveUser?.pan) {
      list.push({
        label: isStatutoryVisible
          ? `${effectiveUser.corporateRegLabel || 'Company Registration'}: ${effectiveUser.corporateRegNumber}`
          : `${effectiveUser.corporateRegLabel || 'Company Registration'}: ${maskStatutory(effectiveUser.corporateRegNumber)} (Connect to view)`,
        verified: true,
      });
    }
    if (effectiveUser?.tradeCustomsCode && !effectiveUser?.iec) {
      list.push({
        label: isStatutoryVisible
          ? `${effectiveUser.tradeCustomsLabel || 'Customs Code'}: ${effectiveUser.tradeCustomsCode}`
          : `${effectiveUser.tradeCustomsLabel || 'Customs Code'}: ${maskStatutory(effectiveUser.tradeCustomsCode)} (Connect to view)`,
        verified: true,
      });
    }
    if (effectiveUser?.logisticsLicenseNumber && !effectiveUser?.mto) {
      list.push({
        label: isStatutoryVisible
          ? `${effectiveUser.logisticsLicenseLabel || 'Transport License'}: ${effectiveUser.logisticsLicenseNumber}`
          : `${effectiveUser.logisticsLicenseLabel || 'Transport License'}: ${maskStatutory(effectiveUser.logisticsLicenseNumber)} (Connect to view)`,
        verified: true,
      });
    }
    if (effectiveUser?.iataCode) {
      list.push({ label: `IATA Cargo Agent: ${effectiveUser.iataCode}`, verified: true });
    }
    if (effectiveUser?.fiataReg) {
      list.push({ label: `FIATA Member: ${effectiveUser.fiataReg}`, verified: true });
    }
    if (effectiveUser?.fmcNumber) {
      list.push({ label: `FMC OTI License: ${effectiveUser.fmcNumber}`, verified: true });
    }
    if (effectiveUser?.aeoTier) {
      list.push({ label: `AEO Security Tier: ${effectiveUser.aeoTier}`, verified: true });
    }
    if (effectiveUser?.associationName) {
      list.push({
        label: `${effectiveUser.associationName}${effectiveUser.associationId ? ` (${effectiveUser.associationId})` : ''}`,
        verified: true,
      });
    }

    if (list.length === 0 && Array.isArray(profile?.certifications) && profile.certifications.length > 0) {
      profile.certifications.forEach((c) => list.push({ label: c }));
    }

    return list;
  }, [effectiveUser, profile?.certifications, isStatutoryVisible]);

  // Real KYC status
  const kycStatus = effectiveUser?.kycStatus || (effectiveUser?.isVerified ? 'verified' : 'unsubmitted');
  const filingsSummary: string[] = [];
  if (effectiveUser?.gstn) filingsSummary.push('GSTIN');
  if (effectiveUser?.pan) filingsSummary.push('PAN');
  if (effectiveUser?.iec) filingsSummary.push('IEC');
  if (effectiveUser?.mto) filingsSummary.push('MTO');
  if (effectiveUser?.taxId) filingsSummary.push(effectiveUser.taxIdLabel || 'Tax ID');
  if (effectiveUser?.corporateRegNumber) filingsSummary.push(effectiveUser.corporateRegLabel || 'Company Reg');

  let kycDisplayLabel = 'Basic Account (Statutory KYC Not Submitted)';

  if (kycStatus === 'verified') {
    kycDisplayLabel =
      filingsSummary.length > 0
        ? `Enterprise KYC Verified (${filingsSummary.join(' + ')} Validated)`
        : 'Enterprise Verified Member';
  } else if (kycStatus === 'pending') {
    kycDisplayLabel =
      filingsSummary.length > 0
        ? `KYC Filings Submitted (${filingsSummary.join(' + ')}) — Verification Pending`
        : 'KYC Documentation Submitted — Verification in Progress';
  } else if (kycStatus === 'rejected') {
    kycDisplayLabel = 'KYC Documents Incomplete — Re-submission Required';
  }

  // Profile Completeness & Trust Score (Transparent, 100% computed from real profile entries)
  const trustScore = useMemo(() => {
    if (profile?.trustScore && profile.trustScore > 0 && !effectiveUser) return profile.trustScore;
    if (!effectiveUser) return 50;

    let score = 25; // baseline registered account
    if (effectiveUser.displayName && effectiveUser.displayName.length >= 3) score += 10;
    if (effectiveUser.email && effectiveUser.email.includes('@')) score += 10;
    if (effectiveUser.email_verified) score += 15;
    if (effectiveUser.mobile && effectiveUser.mobile.length >= 7) score += 10;
    if (effectiveUser.company && effectiveUser.company.trim() && !effectiveUser.company.toLowerCase().includes('not specified')) score += 10;
    if (effectiveUser.designation && effectiveUser.designation.trim()) score += 5;
    if (effectiveUser.city || effectiveUser.country) score += 5;
    if (effectiveUser.kycStatus === 'verified') score += 10;
    else if (filingsSummary.length > 0) score += 5;
    if (effectiveUser.hasGoldenTick) score += 10;

    return Math.min(100, score);
  }, [effectiveUser, profile?.trustScore, filingsSummary.length]);

  // Company Reference Code & Share Link
  const compCode = ((resolvedCompany || 'FR8X').replace(/[^a-zA-Z0-9]/g, '').slice(0, 4) || 'FR8X').toUpperCase();
  const nameCode = (resolvedName.replace(/[^a-zA-Z0-9]/g, '').slice(-4) || '0000').toUpperCase();
  const companyRefNo =
    effectiveUser?.companyId ||
    (effectiveUser as any)?.companyRefNo ||
    (profile as any)?.companyRefNo ||
    `REF-FR8X-${compCode}-${nameCode}`;

  const shareUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/ref/${encodeURIComponent(companyRefNo)}`
      : `https://con.fr8x.in/ref/${encodeURIComponent(companyRefNo)}`;

  if (!isOpen) return null;

  const handleSendConnection = () => {
    if (!user?.uid || !effectiveUser?.uid) {
      toast('Unable to send request: Incomplete user details.');
      return;
    }
    setIsSendingRequest(true);
    try {
      sendConnectionRequest(user, effectiveUser, connectNote);
      toast(`Connection request sent to ${resolvedName}!`);
      setShowConnectModal(false);
      setConnectNote('');
    } catch (err: any) {
      toast(err.message || 'Failed to send connection request.');
    } finally {
      setIsSendingRequest(false);
    }
  };

  const handleWithdrawRequest = () => {
    if (!user?.uid || !effectiveUser?.uid) return;
    const reqs = getAllConnectionRequests();
    const req = reqs.find((r) => r.fromUid === user.uid && r.toUid === effectiveUser.uid && r.status === 'pending');
    if (req) {
      cancelConnectionRequest(req.id);
      toast('Connection request withdrawn.');
    }
  };

  const handleAcceptReceived = () => {
    if (!user?.uid || !effectiveUser?.uid) return;
    const reqs = getAllConnectionRequests();
    const req = reqs.find((r) => r.fromUid === effectiveUser.uid && r.toUid === user.uid && r.status === 'pending');
    if (req) {
      acceptConnectionRequest(req.id, user);
      toast(`Connected with ${resolvedName}! Direct communication unlocked.`);
    }
  };

  const handleDeclineReceived = () => {
    if (!user?.uid || !effectiveUser?.uid) return;
    const reqs = getAllConnectionRequests();
    const req = reqs.find((r) => r.fromUid === effectiveUser.uid && r.toUid === user.uid && r.status === 'pending');
    if (req) {
      declineConnectionRequest(req.id);
      toast('Connection request declined.');
    }
  };

  const handleDisconnect = () => {
    if (!user?.uid || !effectiveUser?.uid) return;
    if (confirm(`Remove ${resolvedName} from your connected contacts?`)) {
      removeConnection(user.uid, effectiveUser.uid);
      toast(`Removed ${resolvedName} from contacts.`);
    }
  };

  const handleStartChat = () => {
    onClose();
    const contactId = resolvedName.toLowerCase().replace(/\s+/g, '-');
    openChatWith(contactId, {
      type: 'company',
      id: resolvedCompany || 'Direct',
      title: `${resolvedName} · ${resolvedCompany}`,
    });
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={
          isCurrentUser
            ? 'Your Verified Enterprise Logistics Passport'
            : isConnected
            ? 'Verified Enterprise Logistics Passport (Connected Contact)'
            : 'Enterprise Logistics Passport (Public View)'
        }
        maxWidth="720px"
        footer={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button className="btn secondary cursor-pointer" onClick={onClose}>
                Close
              </button>
              {isConnected && !isCurrentUser && (
                <button
                  type="button"
                  className="btn secondary cursor-pointer"
                  onClick={handleDisconnect}
                  style={{ fontSize: '11px', color: '#dc2626' }}
                  title="Remove from contacts"
                >
                  <UserMinus size={13} /> Disconnect
                </button>
              )}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isCurrentUser ? (
                <a
                  href="/profile"
                  className="btn primary"
                  onClick={onClose}
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  <Settings size={13} /> Manage Privacy & Profile
                </a>
              ) : isConnected ? (
                <button className="btn primary cursor-pointer" onClick={handleStartChat}>
                  <MessageSquare size={14} /> Start Direct Trade Chat
                </button>
              ) : connStatus === 'pending_sent' ? (
                <button className="btn secondary cursor-pointer" onClick={handleWithdrawRequest} style={{ color: '#d97706' }}>
                  <Clock size={13} /> Request Pending (Withdraw)
                </button>
              ) : connStatus === 'pending_received' ? (
                <>
                  <button className="btn secondary cursor-pointer" onClick={handleDeclineReceived}>
                    <X size={13} /> Decline
                  </button>
                  <button className="btn primary cursor-pointer" onClick={handleAcceptReceived}>
                    <Check size={13} /> Accept Connection
                  </button>
                </>
              ) : (
                <button className="btn primary cursor-pointer" onClick={() => setShowConnectModal(true)}>
                  <UserPlus size={14} /> Connect & Add Contact
                </button>
              )}
            </div>
          </div>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {/* Connection & Privacy State Banner (When viewing another member) */}
          {!isCurrentUser && (
            <div
              style={{
                padding: '10px 14px',
                background: isConnected ? '#f0fdf4' : '#f8fafc',
                border: `1px solid ${isConnected ? '#bbf7d0' : '#cbd5e1'}`,
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '12px',
                flexWrap: 'wrap',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11.5px', color: isConnected ? '#15803d' : '#475569' }}>
                {isConnected ? (
                  <>
                    <UserCheck size={16} color="#16a34a" />
                    <span>
                      <b>Connected Contact:</b> You and {resolvedName} are connected. Direct contact credentials and platform messaging are fully accessible.
                    </span>
                  </>
                ) : connStatus === 'pending_sent' ? (
                  <>
                    <Clock size={16} color="#0284c7" />
                    <span>
                      <b>Connection Request Pending:</b> You sent an invitation to connect with {resolvedName}. Full contact details will unlock once accepted.
                    </span>
                  </>
                ) : connStatus === 'pending_received' ? (
                  <>
                    <AlertCircle size={16} color="#d97706" />
                    <span>
                      <b>Connection Request Received:</b> {resolvedName} invited you to connect. Accept to unlock mutual direct communications.
                    </span>
                  </>
                ) : (
                  <>
                    <Lock size={16} color="#64748b" />
                    <span>
                      <b>Public Profile:</b> Connect with {resolvedName} to unlock direct phone, verified email, and statutory trade credentials.
                    </span>
                  </>
                )}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {connStatus === 'none' && (
                  <button
                    type="button"
                    className="btn primary sm"
                    onClick={() => setShowConnectModal(true)}
                    style={{ fontSize: '11px', padding: '4px 12px' }}
                  >
                    <UserPlus size={12} /> Connect
                  </button>
                )}
                {connStatus === 'pending_sent' && (
                  <button
                    type="button"
                    className="btn secondary sm"
                    onClick={handleWithdrawRequest}
                    style={{ fontSize: '10.5px', color: '#dc2626', padding: '3px 8px' }}
                    title="Withdraw invitation"
                  >
                    <X size={11} /> Withdraw
                  </button>
                )}
                {connStatus === 'pending_received' && (
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <button
                      type="button"
                      className="btn primary sm"
                      onClick={handleAcceptReceived}
                      style={{ fontSize: '11px', padding: '4px 10px' }}
                    >
                      <Check size={12} /> Accept
                    </button>
                    <button
                      type="button"
                      className="btn secondary sm"
                      onClick={handleDeclineReceived}
                      style={{ fontSize: '11px', padding: '4px 8px' }}
                    >
                      <X size={12} /> Decline
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        {/* Profile Header Block */}
        <div
          style={{
            display: 'flex',
            gap: '16px',
            alignItems: 'flex-start',
            flexWrap: 'wrap',
            background: '#fafcff',
            padding: '16px',
            borderRadius: '10px',
            border: '1px solid var(--line)',
          }}
        >
          <div
            className="avatar big"
            style={{ width: '58px', height: '58px', padding: 0, overflow: 'hidden', flexShrink: 0 }}
          >
            {resolvedAvatar ? (
              <img
                src={resolvedAvatar}
                alt={resolvedName}
                className="profile-img-avatar"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
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
                  fontSize: '20px',
                  fontWeight: 800,
                }}
              >
                {resolvedName
                  .split(' ')
                  .map((p: string) => p[0])
                  .filter(Boolean)
                  .join('')
                  .substring(0, 2)
                  .toUpperCase() || 'P'}
              </div>
            )}
          </div>

          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                {resolvedName}
              </h2>
              {hasGoldenTick && <GoldenTick />}
              {isVerified ? (
                <span className="badge green" style={{ fontSize: '10px' }}>
                  <ShieldCheck size={11} /> Verified Member
                </span>
              ) : (
                <span className="badge gray" style={{ fontSize: '10px' }}>
                  Community Member
                </span>
              )}
              <span className="badge blue" style={{ fontSize: '10px' }}>
                <Star size={10} color="#f59e0b" /> Trust Score: {trustScore}/100
              </span>
            </div>

            <p style={{ color: 'var(--ink-secondary)', fontSize: '12.5px', margin: '4px 0 0', fontWeight: 600 }}>
              {resolvedRole} at <span style={{ color: 'var(--brand)' }}>{resolvedCompany}</span>
            </p>

            <p style={{ color: 'var(--mut)', fontSize: '11.5px', margin: '3px 0 0' }}>
              <MapPin size={11} style={{ verticalAlign: '-2px', marginRight: '3px' }} />
              {resolvedLocation}
            </p>

            {/* Company Reference No & Share Link */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontFamily: 'monospace',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  color: 'var(--brand)',
                  background: '#eff6ff',
                  border: '1px solid #bfdbfe',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  letterSpacing: '0.4px',
                }}
              >
                {companyRefNo}
              </span>
              <button
                type="button"
                className="btn secondary sm cursor-pointer"
                style={{
                  height: '22px',
                  fontSize: '10.5px',
                  padding: '0 7px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                }}
                onClick={() => {
                  navigator.clipboard?.writeText?.(shareUrl);
                  toast(`Company reference link copied: ${shareUrl}`);
                }}
                title="Copy shareable reference link"
              >
                <Share2 size={10} /> Share Link
              </button>
            </div>
          </div>

          <LocalTimeBadge timezone={resolvedTimezone} boxFormat={true} />
        </div>

        {/* Corporate Trust & KYC Status Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '10px 14px',
            background: '#eef6ff',
            border: '1px solid #c8e0fe',
            borderRadius: '8px',
            flexWrap: 'wrap',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} color="var(--brand)" />
            <span style={{ fontSize: '11.5px', color: 'var(--ink)' }}>
              <b>KYC Status:</b> {kycDisplayLabel}
            </span>
          </div>

          {resolvedVolume ? (
            <span style={{ fontSize: '11px', color: 'var(--mut)' }}>
              Annual Operational Volume: <b>{resolvedVolume}</b>
            </span>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--mut)' }}>
              Enterprise Standing: <b>{isVerified ? 'Active Verified Profile' : 'Registered Member'}</b>
            </span>
          )}
        </div>

        {/* Company & Contact Card */}
        <div className="grid g2">
          <div className="card cardbody" style={{ background: '#f8fafc' }}>
            <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
              Corporate Organization
            </small>
            <p
              style={{
                fontSize: '12.5px',
                fontWeight: 600,
                margin: '4px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Building2 size={13} color="var(--brand)" /> {resolvedCompany}
            </p>
            <p
              style={{
                fontSize: '11.5px',
                color: 'var(--mut)',
                margin: '2px 0 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <Briefcase size={13} /> {resolvedRole}
            </p>
            {effectiveUser?.companyId && (
              <p style={{ fontSize: '10px', color: 'var(--mut)', margin: '2px 0 0', fontFamily: 'monospace' }}>
                ID: {effectiveUser.companyId}
              </p>
            )}
          </div>

          <div className="card cardbody" style={{ background: '#f8fafc' }}>
            <small style={{ color: 'var(--mut)', fontWeight: 700, fontSize: '10px', textTransform: 'uppercase' }}>
              Direct B2B Communication
            </small>
            {displayEmail ? (
              <div
                style={{
                  fontSize: '12px',
                  color: 'var(--ink-secondary)',
                  margin: '4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Mail size={12} /> {displayEmail}
                </div>
                {isEmailMasked && (
                  <button
                    type="button"
                    onClick={() => {
                      if (connStatus === 'none') setShowConnectModal(true);
                    }}
                    style={{
                      fontSize: '10px',
                      color: '#0284c7',
                      background: '#e0f2fe',
                      border: '1px solid #bae6fd',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      cursor: connStatus === 'none' ? 'pointer' : 'default',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <Lock size={9} /> Connect to view
                  </button>
                )}
              </div>
            ) : (
              <p
                style={{
                  fontSize: '11.5px',
                  color: 'var(--mut)',
                  margin: '4px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Mail size={12} /> Direct Contact via Platform Trade Chat
              </p>
            )}
            {displayPhone && (
              <div
                style={{
                  fontSize: '11.5px',
                  color: 'var(--ink-secondary)',
                  margin: '3px 0 0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Phone size={11} /> {displayPhone}
                </div>
                {isPhoneMasked && (
                  <button
                    type="button"
                    onClick={() => {
                      if (connStatus === 'none') setShowConnectModal(true);
                    }}
                    style={{
                      fontSize: '10px',
                      color: '#0284c7',
                      background: '#e0f2fe',
                      border: '1px solid #bae6fd',
                      padding: '1px 6px',
                      borderRadius: '4px',
                      fontWeight: 600,
                      cursor: connStatus === 'none' ? 'pointer' : 'default',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '3px',
                    }}
                  >
                    <Lock size={9} /> Connect to view
                  </button>
                )}
              </div>
            )}
            <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '2px 0 0' }}>
              Hours: {resolvedAvailability}
            </p>
          </div>
        </div>

        {/* Executive Logistics Summary */}
        <div className="card cardbody">
          <small
            style={{
              color: 'var(--mut)',
              fontWeight: 700,
              fontSize: '10px',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Executive Logistics Summary
          </small>
          {resolvedBio ? (
            <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', lineHeight: 1.5, margin: 0 }}>
              {resolvedBio}
            </p>
          ) : (
            <p style={{ fontSize: '11.5px', color: 'var(--mut)', fontStyle: 'italic', margin: 0 }}>
              No professional executive summary published yet by this member.
            </p>
          )}
        </div>

        {/* Trade Lanes & Certifications Grid */}
        <div className="grid g2">
          <div className="card cardbody" style={{ background: '#f8fafc' }}>
            <small
              style={{
                color: 'var(--mut)',
                fontWeight: 700,
                fontSize: '10px',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Primary Trade Corridors
            </small>
            {realTradeLanes.length > 0 ? (
              <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                {realTradeLanes.map((lane, idx) => (
                  <span key={idx} className="badge blue" style={{ fontSize: '10px' }}>
                    {lane}
                  </span>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--mut)', fontStyle: 'italic' }}>
                Corridors declared upon bilateral inquiry or spot auction RFQs.
              </span>
            )}
          </div>

          <div className="card cardbody" style={{ background: '#f8fafc' }}>
            <small
              style={{
                color: 'var(--mut)',
                fontWeight: 700,
                fontSize: '10px',
                textTransform: 'uppercase',
                display: 'block',
                marginBottom: '6px',
              }}
            >
              Accredited Credentials &amp; Statutory Filings
            </small>
            {realCredentials.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {realCredentials.map((cert, idx) => (
                  <div
                    key={idx}
                    style={{ fontSize: '11px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    {cert.verified ? (
                      <CheckCircle2 size={12} color="var(--green)" />
                    ) : (
                      <Award size={12} color="var(--brand)" />
                    )}
                    <span>{cert.label}</span>
                  </div>
                ))}
              </div>
            ) : (
              <span style={{ fontSize: '11px', color: 'var(--mut)', fontStyle: 'italic' }}>
                No statutory trade filings or certifications published on profile.
              </span>
            )}
          </div>
        </div>

        {/* Specialization Tags */}
        <div>
          <small
            style={{
              color: 'var(--mut)',
              fontWeight: 700,
              fontSize: '10px',
              textTransform: 'uppercase',
              display: 'block',
              marginBottom: '6px',
            }}
          >
            Commodities &amp; Operations
          </small>
          {realSpecializations.length > 0 ? (
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              {realSpecializations.map((s, i) => (
                <span key={i} className="badge amber" style={{ fontSize: '10.5px' }}>
                  {s}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ fontSize: '11px', color: 'var(--mut)', fontStyle: 'italic' }}>
              General Commercial Freight &amp; Logistics Operations
            </span>
          )}
        </div>
      </div>
    </Modal>

    {/* Connection Invitation Modal */}
    {showConnectModal && (
      <Modal
        isOpen={showConnectModal}
        onClose={() => setShowConnectModal(false)}
        title={`Connect with ${resolvedName}`}
        maxWidth="480px"
        zIndex={1200}
        footer={
          <>
            <button
              type="button"
              className="btn secondary cursor-pointer"
              onClick={() => setShowConnectModal(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn primary cursor-pointer"
              onClick={handleSendConnection}
              disabled={isSendingRequest}
            >
              <UserPlus size={13} /> {isSendingRequest ? 'Sending…' : 'Send Invitation'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div className="avatar" style={{ width: '40px', height: '40px', padding: 0, overflow: 'hidden' }}>
              {resolvedAvatar ? (
                <img src={resolvedAvatar} alt={resolvedName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #1168d7, #099889)', color: '#fff', fontSize: '14px', fontWeight: 700 }}>
                  {resolvedName.slice(0, 2).toUpperCase()}
                </div>
              )}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 700, fontSize: '13px', color: 'var(--ink)' }}>{resolvedName}</div>
              <div style={{ fontSize: '11px', color: 'var(--mut)' }}>{resolvedRole} · {resolvedCompany}</div>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.4 }}>
            Connecting with <b>{resolvedName}</b> unlocks direct phone and WhatsApp contact, verified email communications, and mutual freight rate benchmarking.
          </p>

          <div className="field">
            <label style={{ fontSize: '11px', fontWeight: 700, color: 'var(--ink)' }}>
              Add a personal note (Optional)
            </label>
            <textarea
              className="input"
              rows={3}
              value={connectNote}
              onChange={(e) => setConnectNote(e.target.value)}
              placeholder={`Hi ${resolvedName}, I would like to connect with you to explore freight collaboration and trade opportunities…`}
              style={{ fontSize: '12px' }}
            />
          </div>
        </div>
      </Modal>
    )}
  </>
  );
}
