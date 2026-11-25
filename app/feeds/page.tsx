'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/context/DataContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useChat } from '@/lib/context/ChatContext';
import { Modal } from '@/components/ui/Modal';
import { ProfileLink } from '@/components/ui/ProfileLink';
import { ProfilePreviewModal } from '@/components/ui/ProfilePreviewModal';
import { PostDetailModal } from '@/components/ui/PostDetailModal';
import { SkeletonScreen } from '@/components/ui/SkeletonScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { parseRichText } from '@/lib/utils';
import { RichPostEditor } from '@/components/posts/RichPostEditor';
import { sanitizeRichTextPost } from '@/lib/security/input-validation';
import Image from 'next/image';
import { JobCreateModal } from '@/components/jobs/JobCreateModal';
import { JobDetailsModal } from '@/components/jobs/JobDetailsModal';
import { AdBookingModal } from '@/components/ads/AdBookingModal';
import { FeedPost, JobPost, PostType, FeedSurface } from '@/lib/types';
import { feedRankingEngine } from '@/lib/ranking/engine';
import {
  Send,
  Search,
  MessageCircle,
  MessageSquare,
  ThumbsUp,
  Scale,
  Repeat,
  Bookmark,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Flag,
  Eye,
  EyeOff,
  Briefcase,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  Phone,
  Clock,
  Sparkles,
  Gavel,
  Tag,
  TrendingUp,
  Share2,
  Building2,
  MapPin,
  CheckCircle2,
  DollarSign,
  Layers,
  Award,
  Upload,
  Check,
  Mail,
  PhoneCall,
  UserCheck,
  UserPlus,
  UserMinus,
  Users,
  Bell,
  X,
  Info,
  HelpCircle,
  Globe2,
  Loader2,
  Maximize2,
} from 'lucide-react';
import {
  getConnectedUserIds,
  getAllConnectionRequests,
  getConnectionRequests,
  getConnectionStatus,
  sendConnectionRequest,
  acceptConnectionRequest,
  declineConnectionRequest,
  cancelConnectionRequest,
  removeConnection,
  CONNECTIONS_CHANGED_EVENT,
  syncConnectionsFromServer,
} from '@/lib/connections';
import { DailyRecommendationsWidget } from '@/components/connections/DailyRecommendationsWidget';
import { SearchConnectionsModal } from '@/components/connections/SearchConnectionsModal';
import { PaymentCheckoutModal } from '@/components/ui/PaymentCheckoutModal';
import { getStoredPlatformConfig, isFeatureFreeForUser } from '@/lib/platform-config';

const POST_TYPE_LABELS: Record<PostType, { label: string; color: string; bg: string }> = {
  general: { label: 'General', color: 'var(--text-secondary, #64748B)', bg: 'var(--surface-secondary, #F8FAFC)' },
  job: { label: 'Job Opening', color: '#0891b2', bg: 'rgba(8, 145, 178, 0.12)' },
  business_update: { label: 'Business Update', color: '#7c3aed', bg: 'rgba(124, 58, 237, 0.12)' },
  rate_info: { label: 'Rate Intelligence', color: '#059669', bg: 'rgba(5, 150, 105, 0.12)' },
  auction_ref: { label: 'Reverse Auction', color: '#1168d7', bg: 'rgba(17, 104, 215, 0.12)' },
  logistics_discussion: { label: 'Discussion', color: '#d97706', bg: 'rgba(217, 119, 6, 0.12)' },
  announcement: { label: 'Official Announcement', color: '#dc2626', bg: 'rgba(220, 38, 38, 0.12)' },
};

interface BookedAd {
  id: string;
  businessName: string;
  contactEmail: string;
  contactPhone?: string;
  isWhatsApp?: boolean;
  headline: string;
  description: string;
  destUrl: string;
  creativeUrl?: string;
  duration: string;
  cost: number;
  buttonLayout?: 'horizontal' | 'vertical' | 'overlay';
  paymentStatus?: 'paid' | 'pending_verification' | 'waived_promotional' | 'unpaid';
  paymentReference?: string;
}

interface WorkspaceContact {
  id: string;
  uid: string;
  name: string;
  role: string;
  company: string;
  isOnline: boolean;
  hasGoldenTick: boolean;
  email: string;
}

const WORKSPACE_CONTACTS: WorkspaceContact[] = [];

// ── In-Feed Sponsored Ads Models & Datasets ─────────────────────────────────
interface InFeedCompanyAd {
  id: string;
  type: 'company';
  sponsorName: string;
  sponsorRole: string;
  companyName: string;
  headline: string;
  body: string;
  tradeLanes: string[];
  metrics: { label: string; value: string }[];
  contactUid: string;
  verified: boolean;
}

interface InFeedJobAd {
  id: string;
  type: 'job';
  jobTitle: string;
  companyName: string;
  location: string;
  salaryPackage: string;
  employmentType: string;
  experience: string;
  headline: string;
  skills: string[];
  posterEmail: string;
  contactUid: string;
}

const IN_FEED_COMPANY_ADS: InFeedCompanyAd[] = [];

const IN_FEED_JOB_ADS: InFeedJobAd[] = [];

// ── AI Job Requirements Suggestion Component ─────────────────────────────────
const AI_SUGGESTION_CATEGORIES: { label: string; color: string; chips: string[] }[] = [
  {
    label: 'Ocean Freight',
    color: '#0891b2',
    chips: [
      'FCL/LCL ocean freight procurement',
      'Carrier contract negotiation (Maersk, MSC, CMA CGM)',
      'INCOTERMS 2020 expertise',
      'Port-pair rate benchmarking',
      'Bill of Lading & shipping documentation',
      'Detention & demurrage dispute management',
      'Blank sailing risk mitigation',
      'Freight reverse auction execution',
    ],
  },
  {
    label: 'Customs & Compliance',
    color: '#7c3aed',
    chips: [
      'HS code classification (ITC-HS/HTS)',
      'Bill of Entry (BE) filing — import/export',
      'AEO certification compliance (CBIC)',
      'DGFT / IEC compliance',
      'Advance Authorization & EPCG handling',
      'MSDS / DG cargo documentation',
      'Customs audit & SVB order management',
      'FTA preferential tariff utilization',
    ],
  },
  {
    label: 'Freight Coordinator',
    color: '#059669',
    chips: [
      'Multi-modal coordination (sea + air + road)',
      'Container booking & space allocation',
      'VGM (Verified Gross Mass) compliance',
      'Pre-shipment inspection coordination',
      'Port health & phytosanitary clearance',
      'Shipment tracking & event management',
      'MBL/HBL documentation management',
      'Carrier VGM & SI cutoff adherence',
    ],
  },
  {
    label: 'Logistics Analyst',
    color: '#d97706',
    chips: [
      'Freight rate benchmarking & market intelligence',
      'TMS / ERP system proficiency (SAP, Oracle)',
      'KPI dashboard & SLA reporting',
      'Carrier performance scorecard analysis',
      'Cost-to-serve modelling (C2S)',
      'Port congestion & dwell time analytics',
      'Demurrage & detention cost reduction',
      'Excel / Power BI logistics reporting',
    ],
  },
  {
    label: 'Trade Finance',
    color: '#dc2626',
    chips: [
      'Letter of Credit (LC) issuance & negotiation',
      'Bank Guarantee & BG issuance',
      'Trade receivables financing (invoice discounting)',
      'Documentary Collection (CAD/DP/DA)',
      'ECGC / credit insurance management',
      'Export incentive computation (RoDTEP, RoSCTL)',
      'GST refund on exports (IGST refund)',
      'Forex hedging (forward contracts, options)',
    ],
  },
];

function AiJobSuggestions({ onAppend }: { onAppend: (text: string) => void }) {
  const [activeTab, setActiveTab] = React.useState(0);
  return (
    <div style={{ border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '8px', background: 'var(--surface-elevated, #F8FAFC)', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid var(--border-subtle, #E5E7EB)', background: 'var(--surface-primary, #FFFFFF)' }}>
        {AI_SUGGESTION_CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => setActiveTab(i)}
            style={{
              padding: '6px 12px',
              fontSize: '10.5px',
              fontWeight: activeTab === i ? 700 : 500,
              color: activeTab === i ? cat.color : 'var(--text-secondary, #64748B)',
              background: activeTab === i ? 'var(--surface-elevated, #F8FAFC)' : 'transparent',
              border: 'none',
              borderRight: '1px solid var(--border-subtle, #E5E7EB)',
              borderBottom: activeTab === i ? `2px solid ${cat.color}` : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            {cat.label}
          </button>
        ))}
      </div>
      {/* Chips */}
      <div style={{ padding: '8px 10px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
        <span style={{ fontSize: '10px', color: 'var(--text-secondary, #64748B)', alignSelf: 'center', marginRight: '2px' }}>
          ✦ Click to add:
        </span>
        {AI_SUGGESTION_CATEGORIES[activeTab].chips.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => onAppend(chip)}
            style={{
              fontSize: '10.5px',
              padding: '3px 9px',
              borderRadius: '20px',
              border: `1px solid ${AI_SUGGESTION_CATEGORIES[activeTab].color}40`,
              background: 'var(--surface-primary, #FFFFFF)',
              color: AI_SUGGESTION_CATEGORIES[activeTab].color,
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${AI_SUGGESTION_CATEGORIES[activeTab].color}16`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'var(--surface-primary, #FFFFFF)')}
          >
            + {chip}
          </button>
        ))}
      </div>
    </div>
  );
}


export default function FeedsPage() {
  const {
    posts,
    addPost,
    editPost,
    deletePost,
    toggleHidePost,
    togglePostSupport,
    togglePostCritique,
    togglePostAmplify,
    savePost,
    reportTarget,
    addComment,
    addReply,
    addNestedReply,
    jobs,
    addJob,
    isHydrated,
  } = useData();

  const { user, allUsers, updateUser } = useAuth();
  const { toast } = useToast();
  const { openChatWith } = useChat();

  // Hydrate user profile from server on feeds mount
  React.useEffect(() => {
    const activeUid = user.uid || (typeof window !== 'undefined' ? localStorage.getItem('fr8x_active_user_uid') : null);
    if (!activeUid) return;

    fetch(`/api/user/profile?uid=${encodeURIComponent(activeUid)}`, {
      headers: {
        'x-fr8x-user-uid': activeUid,
        'x-fr8x-session': activeUid,
      },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data?.success && data?.user) {
          updateUser(data.user);
        }
      })
      .catch((err) => console.warn('[Feeds] Profile sync warning:', err));
  }, [user.uid]);

  // Quick Edit Contact & Terminal Modal State
  const [showQuickContactModal, setShowQuickContactModal] = useState(false);
  const [quickMobile, setQuickMobile] = useState('');
  const [quickEmail, setQuickEmail] = useState('');
  const [quickAddress, setQuickAddress] = useState('');
  const [quickCity, setQuickCity] = useState('');
  const [quickCountry, setQuickCountry] = useState('');
  const [quickDesignation, setQuickDesignation] = useState('');
  const [quickCompany, setQuickCompany] = useState('');
  const [isSavingQuickContact, setIsSavingQuickContact] = useState(false);
  const [isPostingFeed, setIsPostingFeed] = useState(false);

  const handleOpenQuickContactModal = () => {
    setQuickMobile(user.mobile || '');
    setQuickEmail(user.email || '');
    setQuickAddress(user.formattedAddress || '');
    setQuickCity(user.city || '');
    setQuickCountry(user.country || '');
    setQuickDesignation(user.designation || '');
    setQuickCompany(user.company || '');
    setShowQuickContactModal(true);
  };

  const handleSaveQuickContact = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingQuickContact(true);
    const activeUid = user.uid || (typeof window !== 'undefined' ? localStorage.getItem('fr8x_active_user_uid') : null);
    if (!activeUid) {
      setIsSavingQuickContact(false);
      return;
    }
    const payload = {
      mobile: quickMobile.trim(),
      email: quickEmail.trim(),
      formattedAddress: quickAddress.trim(),
      city: quickCity.trim(),
      country: quickCountry.trim(),
      designation: quickDesignation.trim(),
      company: quickCompany.trim(),
    };

    updateUser(payload);

    try {
      const res = await fetch('/api/user/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-fr8x-user-uid': activeUid,
          'x-fr8x-session': activeUid,
        },
        body: JSON.stringify({
          uid: activeUid,
          email: quickEmail.trim() || user.email,
          updates: payload,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast('✓ Contact credentials & terminal location updated successfully.');
        setShowQuickContactModal(false);
      } else {
        toast(data.error || 'Failed to update contact details.');
      }
    } catch (err: any) {
      toast('Network error saving contact details.');
    } finally {
      setIsSavingQuickContact(false);
    }
  };

  // Navigation & Surface State
  const [activeSurface, setActiveSurface] = useState<FeedSurface>('home');
  const [visiblePostCount, setVisiblePostCount] = useState(25);
  const [selectedPostType, setSelectedPostType] = useState<string>('all');
  const [feedSearch, setFeedSearch] = useState('');
  const [showAllSearchResults, setShowAllSearchResults] = useState(false);

  // Post Composer
  const [postText, setPostText] = useState('');
  const [composerPostType, setComposerPostType] = useState<PostType>('general');

  // Post Menu & Edit State
  const [openMenuPostId, setOpenMenuPostId] = useState<string | number | null>(null);
  const [editingPostId, setEditingPostId] = useState<string | number | null>(null);
  const [editingPostText, setEditingPostText] = useState('');
  const [postToDelete, setPostToDelete] = useState<string | number | null>(null);
  const [clientHiddenPostIds, setClientHiddenPostIds] = useState<Set<string>>(() => new Set());

  const handleHideFromMyFeed = (postId: string | number) => {
    setClientHiddenPostIds((prev) => new Set([...prev, String(postId)]));
    toast('Post hidden from your personal feed.');
  };

  // Comment & Nested Reply State (Deferred until explicit user click)
  const [expandedPostComments, setExpandedPostComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeReplyBoxKey, setActiveReplyBoxKey] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');

  // Real-time connections revision sync & authoritative server hydration
  const [connRevision, setConnRevision] = useState(0);

  React.useEffect(() => {
    const handler = () => setConnRevision((v) => v + 1);
    window.addEventListener(CONNECTIONS_CHANGED_EVENT, handler);
    return () => window.removeEventListener(CONNECTIONS_CHANGED_EVENT, handler);
  }, []);

  // Hydrate connections and incoming/outgoing requests from server
  React.useEffect(() => {
    if (user?.uid) {
      syncConnectionsFromServer(user.uid).then(() => setConnRevision((v) => v + 1));
    }
  }, [user?.uid]);

  // Connection requests for active user
  const connRequests = React.useMemo(() => {
    if (!user?.uid && !(user as any)?.id && !user?.email) return { incoming: [], outgoing: [], withdrawn: [] };
    return getConnectionRequests(user?.uid || '', (user as any)?.id, user?.email);
  }, [user?.uid, (user as any)?.id, user?.email, connRevision]);

  // Dynamic Workspace Contacts: ONLY users who are confirmed mutual connections!
  const workspaceContacts: WorkspaceContact[] = React.useMemo(() => {
    if (!user?.uid) return [];
    const connectedUids = new Set(getConnectedUserIds(user.uid).filter(Boolean));
    return (allUsers || [])
      .filter((u) => u && u.uid && u.uid !== user.uid && connectedUids.has(u.uid))
      .map((u) => ({
        id: `c-${u.uid}`,
        uid: u.uid,
        name: u.displayName || `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || 'Member',
        role: u.designation || 'Freight Professional',
        company: u.company || 'Enterprise Member',
        isOnline: Boolean(
          (u as any).isOnline ||
            u.status === 'active' ||
            u.status === 'online' ||
            (u as any).presenceStatus === 'active' ||
            (u as any).presenceStatus === 'idle' ||
            (u as any).userStatus === 'available'
        ),
        hasGoldenTick: Boolean(u.hasGoldenTick),
        email: u.email || '',
      }));
  }, [allUsers, user?.uid, connRevision]);

  // Post Reactions: Real dynamic Support, Critique, Amplify logic
  const getReactions = (postOrId: FeedPost | string | number) => {
    let post: FeedPost | undefined;
    if (typeof postOrId === 'object' && postOrId !== null) {
      post = postOrId as FeedPost;
    } else {
      post = posts.find((p) => String(p.id) === String(postOrId));
    }
    return {
      support: post && typeof post.supportCount === 'number' ? post.supportCount : 0,
      critique: post && typeof post.critiqueCount === 'number' ? post.critiqueCount : 0,
      amplify: post && typeof post.amplifyCount === 'number' ? post.amplifyCount : 0,
      isSupported: Boolean(post?.isSupported),
      isCritiqued: Boolean(post?.isCritiqued),
      isAmplified: Boolean(post?.isAmplified),
    };
  };

  const handleToggleSupport = (postId: string | number) => {
    togglePostSupport(postId);
  };

  const handleToggleCritique = (postId: string | number) => {
    togglePostCritique(postId);
  };

  const handleAmplify = (postId: string | number) => {
    togglePostAmplify(postId);
  };

  const handleSendPost = (post: FeedPost) => {
    setSendPostTarget(post);
    setSelectedContactUids([]);
    setSendOptionalNote('');
    setSendContactSearch('');
  };

  const handleConfirmSendToContacts = () => {
    if (!sendPostTarget || selectedContactUids.length === 0) {
      toast('Please select at least one contact to send this post.');
      return;
    }

    selectedContactUids.forEach((contactUid) => {
      openChatWith(contactUid, {
        type: 'company',
        id: String(sendPostTarget.id),
        title: `Shared Post: ${sendPostTarget.author}`,
      });
    });

    toast(`Post shared with ${selectedContactUids.length} contact(s) via Trade Chat!`);
    setSendPostTarget(null);
    setSelectedContactUids([]);
    setSendOptionalNote('');
    setSendContactSearch('');
  };

  const renderCommentWithMentions = (text: string) => {
    const mentionRegex = /\(#\{([^}]+)\}\)/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match;

    while ((match = mentionRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      const personName = match[1];
      parts.push(
        <button
          key={match.index}
          type="button"
          className="mention-btn"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedProfileName(personName);
          }}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '2px',
            padding: '1px 5px',
            color: 'var(--accent-primary, #006B68)',
            fontWeight: 700,
            background: 'var(--surface-elevated, #F8FAFC)',
            borderRadius: '4px',
            cursor: 'pointer',
            border: '1px solid var(--border-default, #D9DEE5)',
            fontSize: '11px',
            marginRight: '3px',
          }}
          title={`View ${personName}'s Freight Profile`}
        >
          (#{personName})
        </button>
      );
      lastIndex = match.index + match[0].length;
    }
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }
    return parts.length > 0 ? parts : text;
  };

  // Modals
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(null);
  const [selectedJobModal, setSelectedJobModal] = useState<JobPost | null>(null);
  const [selectedPostDetailId, setSelectedPostDetailId] = useState<string | number | null>(null);
  const [showJobCreateModal, setShowJobCreateModal] = useState(false);
  const [reportingPost, setReportingPost] = useState<FeedPost | null>(null);
  const [reportCategory, setReportCategory] = useState<'malicious' | 'spam' | 'fraud' | 'copyright' | 'harassment' | 'misleading' | 'prohibited' | 'other'>('spam');
  const [reportDesc, setReportDesc] = useState('');

  // Send Post to Contact Selection Modal state (Requirement 4)
  const [sendPostTarget, setSendPostTarget] = useState<FeedPost | null>(null);
  const [sendContactSearch, setSendContactSearch] = useState('');
  const [selectedContactUids, setSelectedContactUids] = useState<string[]>([]);
  const [sendOptionalNote, setSendOptionalNote] = useState('');

  // Left Sidebar Contacts List state (Requirement 5)
  const [contactRailSearch, setContactRailSearch] = useState('');
  const [showManageContactsModal, setShowManageContactsModal] = useState(false);
  const [showSearchConnectionsModal, setShowSearchConnectionsModal] = useState(false);
  const [manageContactsTab, setManageContactsTab] = useState<'received' | 'sent' | 'contacts' | 'discover'>('received');
  const [isSyncingContacts, setIsSyncingContacts] = useState(false);
  const [syncContactsError, setSyncContactsError] = useState<string | null>(null);
  const [actioningReqId, setActioningReqId] = useState<string | null>(null);
  const [actioningType, setActioningType] = useState<'accept' | 'reject' | 'withdraw' | null>(null);
  const [discoverMemberSearch, setDiscoverMemberSearch] = useState('');
  const [selectedProfileUid, setSelectedProfileUid] = useState<string | null>(null);
  const [remoteMembers, setRemoteMembers] = useState<any[]>([]);
  const [isSearchingMembers, setIsSearchingMembers] = useState(false);

  const refreshContactsState = React.useCallback(async () => {
    if (!user?.uid) return;
    setIsSyncingContacts(true);
    setSyncContactsError(null);
    try {
      await syncConnectionsFromServer(user.uid);
      setConnRevision((v) => v + 1);
    } catch (err: any) {
      setSyncContactsError(err?.message || 'Failed to sync latest connection requests.');
    } finally {
      setIsSyncingContacts(false);
    }
  }, [user?.uid]);

  // Sync fresh connection requests whenever Manage Contacts modal opens
  React.useEffect(() => {
    if (showManageContactsModal && user?.uid) {
      refreshContactsState();
    }
  }, [showManageContactsModal, user?.uid, refreshContactsState]);

  React.useEffect(() => {
    if (showManageContactsModal && manageContactsTab === 'discover') {
      setIsSearchingMembers(true);
      fetch(`/api/members?q=${encodeURIComponent(discoverMemberSearch.trim())}`)
        .then((r) => r.json())
        .then((data) => {
          if (data && Array.isArray(data.members)) {
            setRemoteMembers(data.members);
          }
        })
        .catch(() => {})
        .finally(() => setIsSearchingMembers(false));
    }
  }, [showManageContactsModal, manageContactsTab, discoverMemberSearch]);

  // New Job Form State + Payment calculation (₹300 for 2 days + ₹180/day thereafter)
  const [newJobTitle, setNewJobTitle] = useState('');
  const [newJobCompany, setNewJobCompany] = useState(user.company);
  const [newJobLocation, setNewJobLocation] = useState(`${user.city}, ${user.country} · On-site`);
  const [newJobType, setNewJobType] = useState('Full-time');
  const [newJobExp, setNewJobExp] = useState('3–5 yrs experience');
  const [newJobPkg, setNewJobPkg] = useState('₹10–15 LPA');
  const [newJobReq, setNewJobReq] = useState('');
  const [newJobResp, setNewJobResp] = useState('');
  const [newJobQual, setNewJobQual] = useState('');
  const [newJobEmail, setNewJobEmail] = useState(user.email);
  const [showEmailPublicly, setShowEmailPublicly] = useState(true);
  const [jobDurationDays, setJobDurationDays] = useState<number>(2);
  const [autoRenewJob, setAutoRenewJob] = useState<boolean>(true);

  // Job pricing calculation: 2 days = ₹300, each additional day = ₹180
  const calculateJobPostingCost = (days: number) => {
    if (days <= 2) return 300;
    return 300 + (days - 2) * 180;
  };
  const currentJobCost = calculateJobPostingCost(jobDurationDays);

  // Book Advertisement Space State
  const [showBookAdModal, setShowBookAdModal] = useState(false);
  const [activeAdSlot, setActiveAdSlot] = useState<number>(1);
  const [adBusinessName, setAdBusinessName] = useState(user.company || '');
  const [adContactEmail, setAdContactEmail] = useState(user.email || '');
  const [adContactPhone, setAdContactPhone] = useState(user.mobile || '');
  const [adIsWhatsApp, setAdIsWhatsApp] = useState(true);
  const [adButtonLayout, setAdButtonLayout] = useState<'horizontal' | 'vertical' | 'overlay'>('horizontal');
  const [fullAdPreviewModal, setFullAdPreviewModal] = useState<BookedAd | null>(null);
  const [adHeadline, setAdHeadline] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adDestUrl, setAdDestUrl] = useState('https://');
  const [adCreativeName, setAdCreativeName] = useState<string | null>(null);
  const [adCreativePreview, setAdCreativePreview] = useState<string | null>(null);
  const [adCampaignDuration, setAdCampaignDuration] = useState<'2days' | '10days'>('2days');

  // Feed Payment Modals State
  const [showFeedJobCheckout, setShowFeedJobCheckout] = useState(false);
  const [pendingFeedJobData, setPendingFeedJobData] = useState<any>(null);
  const [showFeedAdCheckout, setShowFeedAdCheckout] = useState(false);
  const [pendingFeedAdData, setPendingFeedAdData] = useState<BookedAd | null>(null);

  // Booked Ads Storage (Slot 1 and Slot 2)
  const [bookedSlot1, setBookedSlot1] = useState<BookedAd | null>(null);
  const [bookedSlot2, setBookedSlot2] = useState<BookedAd | null>(null);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && lightboxImage) {
        setLightboxImage(null);
      }
    };
    if (lightboxImage) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [lightboxImage]);

  const adCost = adCampaignDuration === '2days' ? 1000 : 5000;

  const handleCreativeUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAdCreativeName(file.name);
      const reader = new FileReader();
      reader.onload = (loadEvt) => {
        setAdCreativePreview(loadEvt.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleBookAdSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adBusinessName.trim() || !adContactEmail.trim() || !adHeadline.trim()) {
      toast('Please enter business name, contact email, and ad headline.');
      return;
    }

    const config = getStoredPlatformConfig();
    const isFree = isFeatureFreeForUser(config, 'AD_POSTING', user.uid);

    const newAd: BookedAd = {
      id: `ad-${Date.now()}`,
      businessName: adBusinessName.trim(),
      contactEmail: adContactEmail.trim(),
      contactPhone: adContactPhone.trim(),
      isWhatsApp: adIsWhatsApp,
      headline: adHeadline.trim(),
      description: adDescription.trim(),
      destUrl: adDestUrl.trim(),
      creativeUrl: adCreativePreview || undefined,
      duration: adCampaignDuration,
      cost: isFree ? 0 : adCost,
      buttonLayout: adButtonLayout,
      paymentStatus: isFree ? 'waived_promotional' : 'paid',
    };

    if (isFree) {
      if (activeAdSlot === 1) {
        setBookedSlot1(newAd);
      } else {
        setBookedSlot2(newAd);
      }
      setShowBookAdModal(false);
      toast(`🎉 Promotional free waiver applied! Ad campaign booked successfully.`);
      setAdHeadline('');
      setAdDescription('');
      setAdCreativeName(null);
      setAdCreativePreview(null);
      return;
    }

    setPendingFeedAdData(newAd);
    setShowFeedAdCheckout(true);
  };

  // Filtered Contacts for the Send Modal (Requirement 4)
  const filteredSendContacts = React.useMemo(() => {
    if (!sendContactSearch.trim()) return workspaceContacts;
    const q = sendContactSearch.toLowerCase();
    return workspaceContacts.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.role || '').toLowerCase().includes(q)
    );
  }, [sendContactSearch, workspaceContacts]);

  // Filtered Contacts for the Left Rail (Requirement 5)
  const displayedRailContacts = React.useMemo(() => {
    if (!contactRailSearch.trim()) return workspaceContacts;
    const q = contactRailSearch.toLowerCase();
    return workspaceContacts.filter(
      (c) =>
        (c.name || '').toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q) ||
        (c.role || '').toLowerCase().includes(q)
    );
  }, [contactRailSearch, workspaceContacts]);

  // 1. Two-Stage Candidate Retrieval & Personalized Hybrid Ranking with strict deduplication
  const rankedFeedPosts = React.useMemo(() => {
    const ranked = feedRankingEngine.rankFeed(posts, {
      viewer: user,
      surface: activeSurface,
    });

    // Deduplicate posts: strictly filter out identical posts by the same author/text
    const seenSignatures = new Set<string>();
    const deduplicated: FeedPost[] = [];
    for (const p of ranked) {
      const sig = `${p.authorUid || p.author}::${(p.text || '').trim().toLowerCase()}`;
      if (seenSignatures.has(sig)) continue;
      seenSignatures.add(sig);
      deduplicated.push(p);
    }
    return deduplicated;
  }, [posts, user, activeSurface]);

  // 2. Filter posts based on post type and universal search
  const filteredPosts = useMemo<FeedPost[]>(() => {
    const q = feedSearch.toLowerCase().trim();
    return rankedFeedPosts.filter((p) => {
      if (clientHiddenPostIds.has(String(p.id))) {
        return false;
      }

      if (selectedPostType !== 'all' && (p.postType || 'general') !== selectedPostType) {
        return false;
      }

      if (!q) return true;
      return (
        (p.author || '').toLowerCase().includes(q) ||
        (p.authorCompany || '').toLowerCase().includes(q) ||
        (p.text || '').toLowerCase().includes(q) ||
        (p.auctionRefId || '').toLowerCase().includes(q) ||
        (p.tradeLane || '').toLowerCase().includes(q)
      );
    });
  }, [rankedFeedPosts, clientHiddenPostIds, selectedPostType, feedSearch]);

  const displayedPosts = useMemo<FeedPost[]>(() => {
    return filteredPosts.slice(0, visiblePostCount);
  }, [filteredPosts, visiblePostCount]);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isPostingFeed || !postText.trim()) return;
    setIsPostingFeed(true);
    try {
      const sanitized = sanitizeRichTextPost(postText.trim());
      addPost(sanitized, composerPostType);
      setPostText('');
    } finally {
      setTimeout(() => setIsPostingFeed(false), 800);
    }
  };

  const handleEditSave = (postId: string | number) => {
    if (!editingPostText.trim()) return;
    const sanitized = sanitizeRichTextPost(editingPostText.trim());
    editPost(postId, sanitized);
    setEditingPostId(null);
    setEditingPostText('');
  };

  const handleCommentSubmit = (postId: string | number) => {
    const text = commentInputs[String(postId)];
    if (!text || !text.trim()) return;
    addComment(postId, text);
    setCommentInputs((prev) => ({ ...prev, [String(postId)]: '' }));
    setExpandedPostComments((prev) => ({ ...prev, [String(postId)]: true }));
  };

  const handleReplySubmit = (
    postId: string | number,
    commentId: string,
    parentReplyId?: string
  ) => {
    if (!replyInputText.trim()) return;
    if (parentReplyId) {
      addNestedReply(postId, commentId, parentReplyId, replyInputText);
    } else {
      addReply(postId, commentId, replyInputText);
    }
    setReplyInputText('');
    setActiveReplyBoxKey(null);
  };

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newJobTitle.trim() || !newJobReq.trim()) {
      toast('Please enter job title and core requirements.');
      return;
    }

    const payload = {
      title: newJobTitle.trim(),
      company: newJobCompany.trim() || user.company,
      location: newJobLocation.trim(),
      experience: newJobExp.trim(),
      packageDetails: newJobPkg.trim(),
      employmentType: newJobType,
      requirements: newJobReq.trim(),
      responsibilities: newJobResp.trim(),
      qualifications: newJobQual.trim(),
      posterEmail: newJobEmail.trim(),
      showEmailPublicly,
      posterUid: user.uid,
      posterTimezone: user.timezone,
    };

    const config = getStoredPlatformConfig();
    const isFree = isFeatureFreeForUser(config, 'JOB_POSTING', user.uid);

    if (isFree) {
      addJob({
        ...payload,
        paymentStatus: 'waived_promotional',
        paidAmount: 0,
        status: 'active',
      });
      setShowJobCreateModal(false);
      toast(`🎉 Promotional free waiver applied! Job opportunity posted successfully.`);
      setNewJobTitle('');
      setNewJobReq('');
      setNewJobResp('');
      setNewJobQual('');
      return;
    }

    setPendingFeedJobData(payload);
    setShowFeedJobCheckout(true);
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost) return;
    reportTarget(String(reportingPost.id), 'post', reportCategory, reportDesc);
    setReportingPost(null);
    setReportDesc('');
  };

  const renderBookedAdCard = (ad: BookedAd, slotNum: number) => {
    const contactHref = ad.contactPhone
      ? (ad.isWhatsApp
        ? `https://wa.me/${ad.contactPhone.replace(/[^0-9]/g, '')}`
        : `tel:${ad.contactPhone}`)
      : (ad.contactEmail ? `mailto:${ad.contactEmail}?subject=${encodeURIComponent(`Inquiry: ${ad.headline}`)}` : '#');

    const websiteHref = ad.destUrl
      ? (ad.destUrl.startsWith('http') ? ad.destUrl : `https://${ad.destUrl}`)
      : '#';

    const layout = ad.buttonLayout || 'horizontal';

    return (
      <div
        key={ad.id || `slot-${slotNum}`}
        className="card side-card"
        style={{
          background: 'var(--surface-primary, #ffffff)',
          border: '1px solid var(--border-subtle, #E5E7EB)',
          borderRadius: '8px',
          padding: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
            <UserAvatar name={ad.businessName} companyName={ad.businessName} size={30} showCompanyLogo={true} />
            <b style={{ fontSize: '12px', color: 'var(--brand)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {ad.businessName}
            </b>
          </div>
          <span className="badge amber" style={{ fontSize: '8.5px', letterSpacing: '0.04em' }}>SPONSORED</span>
        </div>

        <b style={{ fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.3 }}>{ad.headline}</b>
        {ad.description && (
          <p style={{ fontSize: '11px', color: 'var(--ink-secondary)', margin: 0, lineHeight: 1.45 }}>
            {ad.description}
          </p>
        )}

        {ad.creativeUrl && (
          <div
            style={{
              position: 'relative',
              width: '100%',
              maxHeight: '240px',
              background: 'var(--surface-elevated, #F8FAFC)',
              border: '1px solid var(--border-subtle, #E5E7EB)',
              borderRadius: '6px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <img
              src={ad.creativeUrl}
              alt={ad.headline}
              style={{
                width: '100%',
                maxHeight: '240px',
                objectFit: 'contain',
                display: 'block',
              }}
            />
            {layout === 'overlay' && (
              <div
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  padding: '6px 8px',
                  background: 'rgba(23, 43, 43, 0.85)',
                  backdropFilter: 'blur(8px)',
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr 1.2fr',
                  gap: '4px',
                  alignItems: 'center',
                }}
              >
                <a
                  href={contactHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn secondary sm"
                  style={{ fontSize: '9.5px', padding: '3px 4px', justifyContent: 'center', background: 'rgba(255,255,255,0.92)' }}
                >
                  <MessageSquare size={10} /> CONTACT
                </a>
                <a
                  href={websiteHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn secondary sm"
                  style={{ fontSize: '9.5px', padding: '3px 4px', justifyContent: 'center', background: 'rgba(255,255,255,0.92)' }}
                >
                  <ExternalLink size={10} /> WEBSITE
                </a>
                <button
                  type="button"
                  className="btn primary sm"
                  style={{ fontSize: '9.5px', padding: '3px 4px', justifyContent: 'center', fontWeight: 700 }}
                  onClick={() => setFullAdPreviewModal(ad)}
                >
                  <Eye size={10} /> FULL AD
                </button>
              </div>
            )}
          </div>
        )}

        {/* 3 Configurable Action Buttons (When layout is horizontal or vertical) */}
        {layout !== 'overlay' && (
          <div
            style={
              layout === 'horizontal'
                ? { display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '4px', marginTop: '2px' }
                : { display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '2px' }
            }
          >
            {/* BUTTON 1: CONTACT */}
            <a
              href={contactHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn secondary sm"
              style={{
                width: '100%',
                justifyContent: 'center',
                gap: '4px',
                fontSize: layout === 'horizontal' ? '10px' : '11px',
                fontWeight: 600,
                padding: '5px 4px',
                textDecoration: 'none',
              }}
            >
              <MessageSquare size={11} /> CONTACT
            </a>

            {/* BUTTON 2: VISIT WEBSITE */}
            <a
              href={websiteHref}
              target="_blank"
              rel="noopener noreferrer"
              className="btn secondary sm"
              style={{
                width: '100%',
                justifyContent: 'center',
                gap: '4px',
                fontSize: layout === 'horizontal' ? '10px' : '11.5px',
                fontWeight: 600,
                padding: '5px 4px',
                textDecoration: 'none',
              }}
            >
              <ExternalLink size={11} /> VISIT WEBSITE
            </a>

            {/* BUTTON 3: VIEW FULL ADVERTISEMENT */}
            <button
              type="button"
              className="btn primary sm"
              style={{
                width: '100%',
                justifyContent: 'center',
                gap: '4px',
                fontSize: layout === 'horizontal' ? '10px' : '11px',
                fontWeight: 700,
                padding: '5px 4px',
              }}
              onClick={() => setFullAdPreviewModal(ad)}
            >
              <Eye size={11} /> FULL AD
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="feeds-three-col-layout">
      {/* Profile Preview Modal */}
      <ProfilePreviewModal
        isOpen={Boolean(selectedProfileName || selectedProfileUid)}
        onClose={() => {
          setSelectedProfileName(null);
          setSelectedProfileUid(null);
        }}
        personName={selectedProfileName || ''}
        targetUid={selectedProfileUid || undefined}
      />

      {/* Full Widescreen Community Post & Intel Detail Modal */}
      <PostDetailModal
        isOpen={Boolean(selectedPostDetailId)}
        onClose={() => setSelectedPostDetailId(null)}
        post={posts.find((p) => String(p.id) === String(selectedPostDetailId)) || null}
        onSavePost={savePost}
        onReportPost={(p) => setReportingPost(p)}
        onAddComment={addComment}
        onAddReply={addReply}
        onAddNestedReply={addNestedReply}
        onOpenProfile={(name) => setSelectedProfileName(name)}
      />

      {/* Book Advertisement Space & Creative Editor Modal (Phase 4 & Phase 5) */}
      {showBookAdModal && (
        <AdBookingModal
          isOpen={showBookAdModal}
          onClose={() => setShowBookAdModal(false)}
          onSuccess={(ad) => {
            const mappedBookedAd: BookedAd = {
              id: ad.id,
              businessName: ad.businessName,
              contactEmail: ad.contactEmail,
              contactPhone: ad.contactPhone,
              isWhatsApp: Boolean(ad.whatsappNumber),
              headline: ad.headline,
              description: ad.description,
              destUrl: ad.destUrl,
              creativeUrl: ad.creativeUrl,
              duration: ad.duration,
              cost: ad.costINR,
              buttonLayout: ad.buttonLayout,
              paymentStatus: ad.paymentStatus,
              paymentReference: ad.paymentReference,
            };
            if (activeAdSlot === 1) {
              setBookedSlot1(mappedBookedAd);
            } else {
              setBookedSlot2(mappedBookedAd);
            }
          }}
        />
      )}

      {/* Report Modal */}
      {reportingPost && (
        <Modal
          isOpen={Boolean(reportingPost)}
          onClose={() => setReportingPost(null)}
          title="Report Feed Item to Moderation"
        >
          <form onSubmit={handleReportSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="field">
              <label>Reason Category <span className="req">*</span></label>
              <select
                className="input"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value as any)}
              >
                <option value="spam">Spam / Unsolicited Promotion</option>
                <option value="fraud">Fraud / Fictitious Rates</option>
                <option value="malicious">Malicious / Harassment</option>
                <option value="misleading">Misleading Shipping Terms</option>
                <option value="prohibited">Prohibited Cargo / Content</option>
                <option value="other">Other Violation</option>
              </select>
            </div>
            <div className="field">
              <label>Facts & Evidence</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Describe why this post violates verified B2B trade conduct..."
                value={reportDesc}
                onChange={(e) => setReportDesc(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn secondary" onClick={() => setReportingPost(null)}>
                Cancel
              </button>
              <button type="submit" className="btn danger">
                <Flag size={13} /> Submit Report
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Job Details Modal with Phase 2.4 Contact Channels */}
      {selectedJobModal && (
        <JobDetailsModal
          isOpen={Boolean(selectedJobModal)}
          onClose={() => setSelectedJobModal(null)}
          job={selectedJobModal}
          onApply={(job) => {
            const email = job.posterEmail || 'recruiter@company.com';
            const mailto = `mailto:${email}?subject=${encodeURIComponent(
              `Application for ${job.title} - ${user.displayName || 'Candidate'}`
            )}&body=${encodeURIComponent(
              `Dear Hiring Team at ${job.company},\n\nI am applying for the ${job.title} position on FR8X.\n\nApplicant: ${user.displayName}\nEmail: ${user.email}\nPhone: ${user.mobile || ''}\nCompany: ${user.company || ''}\n\nBest regards,\n${user.displayName}`
            )}`;
            window.location.href = mailto;
            toast(`Opening direct recruiter email application to ${email}`);
          }}
        />
      )}

      {/* Full Advertisement Preview Modal */}
      {fullAdPreviewModal && (
        <Modal
          isOpen={Boolean(fullAdPreviewModal)}
          onClose={() => setFullAdPreviewModal(null)}
          title={`Sponsored Showcase · ${fullAdPreviewModal.businessName}`}
          maxWidth="680px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserAvatar name={fullAdPreviewModal.businessName} companyName={fullAdPreviewModal.businessName} size={44} showCompanyLogo={true} />
                <div>
                  <b style={{ fontSize: '14px', color: 'var(--brand)', display: 'block' }}>{fullAdPreviewModal.businessName}</b>
                  <span className="badge green" style={{ fontSize: '9px', padding: '1px 5px' }}>VERIFIED B2B SPONSOR</span>
                </div>
              </div>
              <span className="badge amber" style={{ fontSize: '9px', letterSpacing: '0.04em' }}>SPONSORED SHOWCASE</span>
            </div>

            {fullAdPreviewModal.creativeUrl && (
              <div style={{ width: '100%', maxHeight: '420px', background: 'var(--surface-elevated, #F8FAFC)', borderRadius: '8px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-subtle, #E5E7EB)' }}>
                <img
                  src={fullAdPreviewModal.creativeUrl}
                  alt={fullAdPreviewModal.headline}
                  style={{ width: '100%', maxHeight: '420px', objectFit: 'contain', display: 'block' }}
                />
              </div>
            )}

            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--ink)', margin: '0 0 6px' }}>{fullAdPreviewModal.headline}</h2>
              {fullAdPreviewModal.description && (
                <p style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', lineHeight: 1.6, whiteSpace: 'pre-line', margin: 0 }}>
                  {fullAdPreviewModal.description}
                </p>
              )}
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
              <button type="button" className="btn secondary" onClick={() => setFullAdPreviewModal(null)}>
                Close
              </button>
              {fullAdPreviewModal.destUrl && (
                <a
                  href={fullAdPreviewModal.destUrl.startsWith('http') ? fullAdPreviewModal.destUrl : `https://${fullAdPreviewModal.destUrl}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn secondary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px' }}
                >
                  <ExternalLink size={13} /> Visit Website
                </a>
              )}
              {(fullAdPreviewModal.contactPhone || fullAdPreviewModal.contactEmail) && (
                <a
                  href={
                    fullAdPreviewModal.contactPhone
                      ? (fullAdPreviewModal.isWhatsApp
                        ? `https://wa.me/${fullAdPreviewModal.contactPhone.replace(/[^0-9]/g, '')}`
                        : `tel:${fullAdPreviewModal.contactPhone}`)
                      : `mailto:${fullAdPreviewModal.contactEmail}?subject=${encodeURIComponent(`Inquiry: ${fullAdPreviewModal.headline}`)}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn primary"
                  style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '5px', fontWeight: 700 }}
                >
                  <MessageSquare size={13} /> Contact Advertiser
                </a>
              )}
            </div>
          </div>
        </Modal>
      )}

      {/* Post a Job Opportunity Modal with Comprehensive Contact & Application Workflow */}
      <JobCreateModal
        isOpen={showJobCreateModal}
        onClose={() => setShowJobCreateModal(false)}
      />

      {/* Feed Job Payment Checkout Modal */}
      {showFeedJobCheckout && pendingFeedJobData && (
        <PaymentCheckoutModal
          isOpen={showFeedJobCheckout}
          onClose={() => setShowFeedJobCheckout(false)}
          itemType="job"
          itemTitle={pendingFeedJobData.title}
          amount={currentJobCost}
          onPaymentSuccess={(details) => {
            const isLive = details.paymentStatus === 'paid' || details.paymentStatus === 'waived_promotional';
            addJob({
              ...pendingFeedJobData,
              paymentStatus: details.paymentStatus,
              paidAmount: details.paidAmount,
              paymentMethod: details.paymentMethod,
              paymentReference: details.paymentReference,
              status: isLive ? 'active' : 'pending',
            });
            setShowFeedJobCheckout(false);
            setShowJobCreateModal(false);
            setNewJobTitle('');
            setNewJobReq('');
            setNewJobResp('');
            setNewJobQual('');
          }}
        />
      )}

      {/* Feed Ad Space Payment Checkout Modal */}
      {showFeedAdCheckout && pendingFeedAdData && (
        <PaymentCheckoutModal
          isOpen={showFeedAdCheckout}
          onClose={() => setShowFeedAdCheckout(false)}
          itemType="ad"
          itemTitle={pendingFeedAdData.headline}
          amount={pendingFeedAdData.cost}
          onPaymentSuccess={(details) => {
            const bookedWithPayment: BookedAd = {
              ...pendingFeedAdData,
              paymentStatus: details.paymentStatus,
              paymentReference: details.paymentReference,
            };
            if (activeAdSlot === 1) {
              setBookedSlot1(bookedWithPayment);
            } else {
              setBookedSlot2(bookedWithPayment);
            }
            setShowFeedAdCheckout(false);
            setShowBookAdModal(false);
            setAdHeadline('');
            setAdDescription('');
            setAdCreativeName(null);
            setAdCreativePreview(null);
            toast(`Ad campaign booked successfully! Status: ${details.paymentStatus === 'paid' ? 'Confirmed & Active' : 'Pending Godfather Verification'}`);
          }}
        />
      )}

      {/* LEFT COLUMN: Identity & Quick Shortcuts (Desktop-only to prevent cluttering mobile feed sequence) */}
      <aside className="feed-left-rail desktop-only">
        <div className="card" style={{ marginBottom: '12px', border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px', background: 'var(--surface-primary, #FFFFFF)', overflow: 'hidden' }}>
          <div style={{ padding: '12px 14px', textAlign: 'center', borderBottom: '1px solid var(--border-subtle, #E5E7EB)', background: 'var(--surface-primary, #FFFFFF)' }}>
            <div style={{ margin: '0 auto 6px', display: 'flex', justifyContent: 'center' }}>
              <UserAvatar user={user} size={56} />
            </div>
            <b style={{ fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--text-primary, #1F2937)' }}>
              {user.displayName}
              {user.hasGoldenTick && <GoldenTick size={14} />}
            </b>
            <small style={{ color: 'var(--text-secondary, #64748B)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
              {user.designation}
            </small>
            <small style={{ color: 'var(--text-primary, #1F2937)', fontSize: '11px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px', marginTop: '2px' }}>
              {user.companyLogoUrl && (
                <img
                  src={user.companyLogoUrl}
                  alt={user.company || 'Company'}
                  style={{ width: '14px', height: '14px', objectFit: 'contain', background: 'transparent', flexShrink: 0 }}
                />
              )}
              <span>{user.company}</span>
            </small>
            <div style={{ marginTop: '6px' }}>
              <LocalTimeBadge timezone={user.timezone} />
            </div>
          </div>

          <div style={{ padding: '6px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 4px', fontSize: '11.5px', color: 'var(--text-primary, #1F2937)' }}>
              <span style={{ color: 'var(--text-secondary, #64748B)' }}>My Plan</span>
              <span className="badge">
                {user.plan.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 4px', fontSize: '11.5px', color: 'var(--text-primary, #1F2937)' }}>
              <span style={{ color: 'var(--text-secondary, #64748B)' }}>Saved Posts</span>
              <b>{posts.filter((p) => p.isSaved).length}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 4px', fontSize: '11.5px', color: 'var(--text-primary, #1F2937)' }}>
              <span style={{ color: 'var(--text-secondary, #64748B)' }}>Verification</span>
              <span className="badge">VERIFIED</span>
            </div>
          </div>

          {/* Contact Details & Direct Contact Action below profile */}
          <div style={{ padding: '10px 12px 12px', borderTop: '1px solid var(--border-subtle, #E5E7EB)', display: 'flex', flexDirection: 'column', gap: '6px', background: 'var(--surface-elevated, #F8FAFC)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                Contact &amp; Trade Connect
              </div>
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-primary, #1F2937)' }}
              title={user.email}
            >
              <Mail size={12} style={{ flexShrink: 0, color: 'var(--text-secondary, #64748B)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.email}
              </span>
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--text-primary, #1F2937)' }}
              title={user.mobile || (user as any).phone || 'Not configured'}
            >
              <PhoneCall size={12} style={{ flexShrink: 0, color: '#16a34a' }} />
              <span>{user.mobile || (user as any).phone || <span style={{ color: 'var(--text-secondary, #64748B)' }}>Not configured</span>}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', fontSize: '10.5px', color: 'var(--text-secondary, #64748B)' }}>
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flex: 1 }}
                title={user.formattedAddress || (user.city && user.country ? `${user.city}, ${user.country}` : (user.city || user.country || 'Location not set'))}
              >
                <MapPin size={12} style={{ flexShrink: 0, color: 'var(--text-secondary, #64748B)' }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.formattedAddress || (user.city && user.country ? `${user.city}, ${user.country}` : (user.city || user.country || 'Location not set'))}
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <button
                className="btn primary sm"
                style={{ flex: 1, justifyContent: 'center', fontSize: '11px', height: '32px', borderRadius: '6px' }}
                onClick={() => setSelectedProfileName(user.displayName)}
              >
                <UserCheck size={12} /> Contact Profile
              </button>
              <a
                href={`mailto:${user.email}`}
                className="btn secondary sm"
                style={{ padding: '0 10px', height: '32px', borderRadius: '6px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--border-default, #D9DEE5)' }}
                title="Send Email"
              >
                <Mail size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Navigation Shortcuts */}
        <div className="card" style={{ border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px', background: 'var(--surface-primary, #FFFFFF)' }}>
          <div className="cardhead" style={{ fontSize: '12px', borderBottom: '1px solid var(--border-subtle, #E5E7EB)', padding: '10px 12px' }}>
            <b style={{ color: 'var(--text-primary, #1F2937)' }}>Quick Shortcuts</b>
          </div>
          <div style={{ padding: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <Link href="/auctions/create" className="feed-shortcut-link">
              <Gavel size={14} style={{ color: 'var(--accent-primary, #006B68)', flexShrink: 0 }} />
              <span>Create Reverse Auction</span>
            </Link>
            <Link href="/rates" className="feed-shortcut-link">
              <TrendingUp size={14} style={{ color: 'var(--accent-primary, #006B68)', flexShrink: 0 }} />
              <span>Rate Intelligence</span>
            </Link>
            <Link href="/jobs" className="feed-shortcut-link">
              <Briefcase size={14} style={{ color: 'var(--accent-primary, #006B68)', flexShrink: 0 }} />
              <span>Trade Careers</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowJobCreateModal(true)}
              className="feed-shortcut-link"
              style={{ width: '100%', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', fontSize: 'inherit' }}
            >
              <Plus size={14} style={{ color: 'var(--accent-primary, #006B68)', flexShrink: 0 }} />
              <span>Post a Job</span>
            </button>
            <Link href="/nexus" className="feed-shortcut-link">
              <ShieldAlert size={14} style={{ color: 'var(--accent-primary, #006B68)', flexShrink: 0 }} />
              <span>Compliance & Blacklist</span>
            </Link>
          </div>
        </div>

        {/* Added Contacts List (Requirement 5) */}
        <div className="card" style={{ marginTop: '12px', border: '1px solid var(--border-subtle, #E5E7EB)' }}>
          <div className="cardhead" style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--fr8x-text)' }}>
              <UserCheck size={13} color="var(--brand)" /> Added Contacts
            </b>
            <span className="badge" style={{ fontSize: '9.5px', fontWeight: 700 }}>
              {workspaceContacts.length} Added
            </span>
          </div>
          <div style={{ padding: '8px' }}>
            {/* Incoming Connection Requests Notice Pill */}
            {connRequests.incoming.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  setManageContactsTab('received');
                  setShowManageContactsModal(true);
                }}
                style={{
                  width: '100%',
                  marginBottom: '8px',
                  padding: '6px 8px',
                  background: 'var(--surface-elevated, #F8FAFC)',
                  border: '1px solid var(--accent-primary, #006B68)',
                  borderRadius: '6px',
                  color: 'var(--accent-primary, #006B68)',
                  fontSize: '11px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <UserPlus size={12} color="var(--accent-primary, #006B68)" /> CONNECTION REQUEST RECEIVED
                </span>
                <span className="badge blue" style={{ fontSize: '9px', fontWeight: 800 }}>
                  {connRequests.incoming.length} New
                </span>
              </button>
            )}

            {/* Filter contacts input */}
            <div className="search-icon-wrap" style={{ position: 'relative', marginBottom: '8px', display: 'flex', alignItems: 'center' }}>
              <Search size={12} style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #64748B)', pointerEvents: 'none', zIndex: 2 }} />
              <input
                type="text"
                className="search-input-field has-leading-icon"
                placeholder="Filter contacts..."
                value={contactRailSearch}
                onChange={(e) => setContactRailSearch(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '5px 6px 5px 28px',
                  fontSize: '11px',
                  borderRadius: '6px',
                  border: '1px solid var(--border-default, #D9DEE5)',
                  background: 'var(--surface-primary, #FFFFFF)',
                  color: 'var(--text-primary, #1F2937)',
                }}
              />
            </div>

            {/* Scrollable list of verified trade contacts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '260px', overflowY: 'auto' }}>
              {displayedRailContacts.length === 0 ? (
                <div style={{ padding: '16px 8px', textAlign: 'center', fontSize: '11px', color: 'var(--text-secondary, #64748B)' }}>
                  No contacts added yet
                </div>
              ) : (
                displayedRailContacts.map((contact) => (
                <div
                  key={contact.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-subtle, #E5E7EB)',
                    background: 'var(--surface-primary, #FFFFFF)',
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <UserAvatar
                      name={contact.name}
                      avatarUrl={(contact as any).avatarUrl}
                      companyLogoUrl={(contact as any).companyLogoUrl}
                      companyName={contact.company}
                      size={28}
                    />
                    {contact.isOnline && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: '-1px',
                          right: '-1px',
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: '#16a34a',
                          border: '1.5px solid var(--surface-primary, #FFFFFF)',
                        }}
                        title="Online"
                      />
                    )}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                      <span
                        onClick={() => setSelectedProfileName(contact.name)}
                        style={{
                          fontSize: '11px',
                          fontWeight: 700,
                          color: 'var(--text-primary, #1F2937)',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          cursor: 'pointer',
                        }}
                        title={`View ${contact.name}'s profile`}
                      >
                        {contact.name}
                      </span>
                      {contact.hasGoldenTick && <GoldenTick size={11} />}
                    </div>
                    <small
                      style={{
                        display: 'block',
                        fontSize: '9.5px',
                        color: 'var(--text-secondary, #64748B)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {contact.company}
                    </small>
                  </div>

                  <button
                    type="button"
                    onClick={() => openChatWith(contact.uid, { type: 'company', id: contact.id, title: `Chat with ${contact.name}` })}
                    title={`Send Trade Message to ${contact.name}`}
                    style={{
                      background: 'var(--surface-elevated, #F8FAFC)',
                      border: '1px solid var(--border-default, #D9DEE5)',
                      borderRadius: '5px',
                      padding: '4px 6px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--accent-primary, #006B68)',
                    }}
                  >
                    <MessageCircle size={11} />
                  </button>
                </div>
              ))
              )}
            </div>

            {/* View All & Discover Contacts triggers */}
            <div style={{ marginTop: '8px', borderTop: '1px solid var(--border-subtle, #E5E7EB)', paddingTop: '6px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
              <button
                type="button"
                onClick={() => {
                  setManageContactsTab('contacts');
                  setShowManageContactsModal(true);
                }}
                className="btn secondary sm"
                style={{ width: '100%', justifyContent: 'center', fontSize: '10.5px', borderRadius: '6px' }}
              >
                View All &amp; Manage Contacts
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowSearchConnectionsModal(true);
                }}
                className="btn secondary sm"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  fontSize: '10.5px',
                  color: 'var(--accent-primary, #006B68)',
                  borderColor: 'var(--border-interactive, #D1D5DB)',
                  borderRadius: '6px',
                  fontWeight: 600,
                }}
              >
                <UserPlus size={11} /> Find &amp; Connect Members
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* CENTER COLUMN: Main Feed */}
      <section className="feed-center-rail" style={{ margin: 0, minWidth: 0 }}>
        {/* Post Type Filters & Navigation Tabs in One Consistent Horizontal Row */}
        <div className="feed-header-bar">
          <div className="feed-tabs">
            <button
              type="button"
              className={`feed-tab-btn ${activeSurface === 'home' ? 'active' : ''}`}
              onClick={() => setActiveSurface('home')}
            >
              Home Feed
            </button>
            <button
              type="button"
              className={`feed-tab-btn ${activeSurface === 'trending' ? 'active' : ''}`}
              onClick={() => setActiveSurface('trending')}
            >
              Trending
            </button>
            <button
              type="button"
              className={`feed-tab-btn ${activeSurface === 'discover' ? 'active' : ''}`}
              onClick={() => setActiveSurface('discover')}
            >
              Discover
            </button>
            <button
              type="button"
              className={`feed-tab-btn ${activeSurface === 'following' ? 'active' : ''}`}
              onClick={() => setActiveSurface('following')}
            >
              Following
            </button>
            <button
              type="button"
              className={`feed-tab-btn ${activeSurface === 'latest' ? 'active' : ''}`}
              onClick={() => setActiveSurface('latest')}
            >
              Latest
            </button>
            <button
              type="button"
              className={`feed-tab-btn ${activeSurface === 'my_posts' ? 'active' : ''}`}
              onClick={() => setActiveSurface('my_posts')}
            >
              My Posts ({posts.filter((p) => p.authorUid === user.uid).length})
            </button>
            <button
              type="button"
              className={`feed-tab-btn ${activeSurface === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveSurface('saved')}
            >
              <Bookmark size={12} style={{ verticalAlign: '-1px' }} /> Saved ({posts.filter((p) => p.isSaved).length})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', flexWrap: 'wrap' }}>
            {/* Quick Discover & Search Connections Button */}
            <button
              type="button"
              onClick={() => setShowSearchConnectionsModal(true)}
              className="btn secondary sm"
              style={{
                height: '32px',
                padding: '0 12px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: 'var(--accent-primary, #006B68)',
                borderColor: 'var(--border-default, #D9DEE5)',
                background: 'var(--surface-primary, #FFFFFF)',
                borderRadius: '6px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                whiteSpace: 'nowrap',
                flexShrink: 0,
              }}
            >
              <UserPlus size={13} /> Find Connections
            </button>

            {/* Integrated Category Filter Dropdown */}
            <select
              value={selectedPostType}
              onChange={(e) => setSelectedPostType(e.target.value as any)}
              style={{
                height: '32px',
                padding: '0 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid var(--border-default, #D9DEE5)',
                background: 'var(--surface-primary, #FFFFFF)',
                color: 'var(--text-primary, #1F2937)',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <option value="all">All Categories</option>
              <option value="rate_info">Rate Intelligence</option>
              <option value="auction_ref">Reverse Auctions</option>
              <option value="job">Job Openings</option>
              <option value="business_update">Business Updates</option>
              <option value="logistics_discussion">Roundtables</option>
            </select>

            {/* Feed Search Input */}
            <div className="feed-search-box">
              <Search size={14} className="search-icon" />
              <input
                type="text"
                placeholder="Search feed posts, authors, commodities…"
                value={feedSearch}
                onChange={(e) => {
                  setFeedSearch(e.target.value);
                  setShowAllSearchResults(false);
                }}
              />
              {feedSearch && (
                <button onClick={() => setFeedSearch('')} className="clear-search-btn">
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Compact Post Composer immediately below navigation (eliminates large blank space) */}
        <div className="card compose-card" style={{ marginBottom: '12px', padding: '12px 14px' }}>
          <div className="compose-top">
            <UserAvatar user={user} size={36} />
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--fr8x-text)' }}>
                  Publish B2B Trade Intelligence to Global Network
                </span>
                <select
                  className="input"
                  style={{ height: '28px', fontSize: '11px', width: 'auto', padding: '0 8px', borderRadius: '4px' }}
                  value={composerPostType}
                  onChange={(e) => setComposerPostType(e.target.value as PostType)}
                >
                  <option value="general">General Post</option>
                  <option value="rate_info">Rate Intelligence</option>
                  <option value="auction_ref">Reverse Auction Ref</option>
                  <option value="business_update">Business Update</option>
                  <option value="logistics_discussion">Logistics Discussion</option>
                  <option value="job">Career / Job</option>
                </select>
              </div>
            </div>
          </div>

          <form onSubmit={handlePostSubmit}>
            <div style={{ marginBottom: '8px' }}>
              <RichPostEditor
                value={postText}
                onChange={setPostText}
                disabled={isPostingFeed}
                placeholder="Share market intelligence, blank sailings alert, port operational updates, or rate trends…"
                minHeight="70px"
              />
            </div>
            <div className="compose-footer" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '6px' }}>

              <button type="submit" className="btn primary" disabled={isPostingFeed || !postText.trim()} style={{ padding: '0 16px', height: '32px' }}>
                {isPostingFeed ? 'Posting...' : <><Send size={13} /> Post Update</>}
              </button>
            </div>
          </form>
        </div>

        {/* Daily Recommended Connections based on Work, Ex-Company, Locations, Designation, Qualifications, Colleges & Certifications */}
        <DailyRecommendationsWidget
          currentUser={user}
          onOpenSearchModal={() => setShowSearchConnectionsModal(true)}
          onViewProfile={(uid, name) => {
            setSelectedProfileUid(uid);
            setSelectedProfileName(name);
          }}
          onOpenChat={(uid, name) =>
            openChatWith(uid, { type: 'company', id: uid, title: `Chat with ${name}` })
          }
        />

        {/* Post Items in Large Spacious Cards with Progressive Skeleton Loading (Principle 1 & 2) */}
        {!isHydrated ? (
          <div style={{ marginBottom: '16px' }}>
            <SkeletonScreen type="feed" count={3} label="Loading logistics community feed…" />
          </div>
        ) : displayedPosts.length === 0 ? (
          <EmptyState
            icon={<MessageCircle size={36} />}
            title="No posts found matching criteria"
            description="Try adjusting your search query or category filters, or publish your first logistics industry update."
          />
        ) : (
          displayedPosts.map((post, postIndex) => {
            const isOwner = post.authorUid === user.uid;
            const isEditing = editingPostId === post.id;
            const postTypeConfig = POST_TYPE_LABELS[post.postType || 'general'] || POST_TYPE_LABELS.general;

            return (
              <React.Fragment key={post.id}>
                <article className="card post-card" style={{ marginBottom: '16px', padding: '20px 22px' }}>
                {/* Header */}
                <div className="post-header" style={{ marginBottom: '12px' }}>
                  <div
                    className="post-author-box"
                    onClick={() => setSelectedProfileName(post.author)}
                    title="View verified member profile"
                    style={{ cursor: 'pointer' }}
                  >
                    <UserAvatar
                      name={post.author}
                      avatarUrl={post.author === user.displayName ? user.avatarUrl : post.authorPhotoUrl}
                      companyLogoUrl={post.author === user.displayName ? user.companyLogoUrl : (post as any).companyLogoUrl || (post as any).authorCompanyLogoUrl}
                      companyName={(post as any).companyName || (post as any).company || post.authorCompany}
                      size={38}
                    />
                    <div>
                      <div className="author-name-row">
                        <span className="author-name" style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--fr8x-text)' }}>{post.author}</span>
                        {post.hasGoldenTick && <GoldenTick size={14} />}
                        <span style={{ color: 'var(--fr8x-muted)', fontSize: '11px' }}>· {post.time}</span>
                        <span
                          className="badge"
                          style={{
                            fontSize: '9.5px',
                            marginLeft: '6px',
                            fontWeight: 700,
                          }}
                        >
                          {postTypeConfig.label}
                        </span>
                      </div>
                      <div className="author-subtext" style={{ fontSize: '11.5px', color: 'var(--fr8x-muted)' }}>
                        {post.authorRole} {post.authorCompany && `· ${post.authorCompany}`}
                      </div>
                      {post.rankingExplanation && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '10.5px',
                            color: '#1985a1',
                            background: 'rgba(25, 133, 161, 0.08)',
                            padding: '2px 7px',
                            borderRadius: '4px',
                            marginTop: '3px',
                            fontWeight: 600,
                          }}
                        >
                          <Sparkles size={10} /> {post.rankingExplanation}
                        </div>
                      )}
                      {post.authorTimezone && (
                        <div style={{ marginTop: '2px' }}>
                          <LocalTimeBadge timezone={post.authorTimezone} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Menu / Actions */}
                  <div className="post-menu-container">
                    <button
                      className="post-menu-btn"
                      onClick={() => setOpenMenuPostId(openMenuPostId === post.id ? null : post.id)}
                    >
                      <MoreVertical size={16} />
                    </button>

                    {openMenuPostId === post.id && (
                      <div className="dropdown-menu">
                        <button
                          onClick={() => {
                            savePost(post.id);
                            setOpenMenuPostId(null);
                          }}
                        >
                          <Bookmark size={13} /> {post.isSaved ? 'Remove Bookmark' : 'Save Post'}
                        </button>
                        {isOwner && !post.isAuctionAnnouncement && (
                          <button
                            onClick={() => {
                              setEditingPostId(post.id);
                              setEditingPostText(post.text);
                              setOpenMenuPostId(null);
                            }}
                          >
                            <Edit2 size={13} /> Edit Post
                          </button>
                        )}
                        {isOwner && (
                          <button
                            onClick={() => {
                              toggleHidePost(post.id);
                              setOpenMenuPostId(null);
                            }}
                          >
                            {post.status === 'hidden' || post.isHidden ? (
                              <>
                                <Eye size={13} /> Unhide Post
                              </>
                            ) : (
                              <>
                                <EyeOff size={13} /> Hide Post for Rectification
                              </>
                            )}
                          </button>
                        )}
                        {(isOwner || user.role === 'super_admin') && (
                          <button
                            className="danger"
                            onClick={() => {
                              setPostToDelete(post.id);
                              setOpenMenuPostId(null);
                            }}
                          >
                            <Trash2 size={13} /> Delete Post
                          </button>
                        )}
                        {!isOwner && (
                          <button
                            onClick={() => {
                              handleHideFromMyFeed(post.id);
                              setOpenMenuPostId(null);
                            }}
                          >
                            <EyeOff size={13} /> Hide from My Feed
                          </button>
                        )}
                        {!isOwner && (
                          <button
                            className="danger"
                            onClick={() => {
                              setReportingPost(post);
                              setOpenMenuPostId(null);
                            }}
                          >
                            <Flag size={13} /> Report Post
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Rectification / Hidden Notice for Post Owner */}
                {(post.status === 'hidden' || post.isHidden) && isOwner && (
                  <div
                    style={{
                      marginBottom: '12px',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      background: 'rgba(245, 158, 11, 0.08)',
                      border: '1px solid rgba(245, 158, 11, 0.3)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      flexWrap: 'wrap',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <EyeOff size={16} color="#d97706" style={{ flexShrink: 0 }} />
                      <div>
                        <span style={{ fontSize: '12px', fontWeight: 700, color: '#b45309' }}>
                          Hidden from Public Feed · Under Rectification
                        </span>
                        <span style={{ display: 'block', fontSize: '11px', color: '#78350f', marginTop: '1px' }}>
                          Only you can view this post. Rectify content, details, or rates and click Unhide when ready.
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {!post.isAuctionAnnouncement && (
                        <button
                          type="button"
                          className="btn secondary sm"
                          onClick={() => {
                            setEditingPostId(post.id);
                            setEditingPostText(post.text);
                          }}
                          style={{ padding: '3px 8px', fontSize: '11px', height: '26px' }}
                        >
                          <Edit2 size={11} /> Rectify
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn primary sm"
                        onClick={() => toggleHidePost(post.id)}
                        style={{ padding: '3px 10px', fontSize: '11px', height: '26px' }}
                      >
                        <Eye size={11} /> Unhide Post
                      </button>
                    </div>
                  </div>
                )}

                {/* Linked Reverse Auction Banner */}
                {post.isAuctionAnnouncement && post.auctionRefId && (
                  <div className="auction-ref-banner" style={{ marginBottom: '14px', padding: '12px 14px' }}>
                    <Gavel size={20} color="var(--brand)" style={{ flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: '13px', color: 'var(--brand)' }}>
                        Linked Reverse Auction: {post.auctionRefId}
                      </b>
                      <small style={{ display: 'block', color: 'var(--mut)', fontSize: '11px', marginTop: '2px' }}>
                        Enterprise bidding room active · Verified forwarders can submit competitive bids.
                      </small>
                    </div>
                    <Link href={`/auctions/${post.auctionRefId}`} className="btn primary sm">
                      View Auction <ExternalLink size={12} />
                    </Link>
                  </div>
                )}

                {/* Post Body */}
                {isEditing ? (
                  <div style={{ margin: '12px 0' }}>
                    <RichPostEditor
                      value={editingPostText}
                      onChange={setEditingPostText}
                      minHeight="90px"
                    />
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '8px' }}>
                      <button className="btn secondary sm" onClick={() => setEditingPostId(null)}>
                        Cancel
                      </button>
                      <button className="btn primary sm" onClick={() => handleEditSave(post.id)}>
                        Save Changes
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    className="post-body-text"
                    style={{ fontSize: '14px', lineHeight: 1.65, color: 'var(--ink)' }}
                    dangerouslySetInnerHTML={{ __html: parseRichText(post.text) }}
                  />
                )}

                {/* Post Action Buttons: Support, Critique, Discuss, Amplify, Send, Red Flag, Save */}
                {(() => {
                  const reactions = getReactions(post);
                  return (
                    <div className="post-actions-bar" style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--fr8x-outline)', flexWrap: 'wrap' }}>
                      {/* 1. Support */}
                      <button
                        className={`action-btn ${reactions.isSupported ? 'active' : ''}`}
                        onClick={() => handleToggleSupport(post.id)}
                        title="Support this trade intelligence"
                        style={{ color: reactions.isSupported ? '#1985a1' : 'var(--fr8x-muted)' }}
                      >
                        <ThumbsUp size={14} />
                        <span>Support ({reactions.support})</span>
                      </button>

                      {/* 2. Critique */}
                      <button
                        className={`action-btn ${reactions.isCritiqued ? 'active' : ''}`}
                        onClick={() => handleToggleCritique(post.id)}
                        title="Constructive B2B Critique"
                        style={{ color: reactions.isCritiqued ? '#d97706' : 'var(--fr8x-muted)' }}
                      >
                        <Scale size={14} />
                        <span>Critique ({reactions.critique})</span>
                      </button>

                      {/* 3. Discuss */}
                      <button
                        className="action-btn"
                        onClick={() =>
                          setExpandedPostComments((prev) => ({
                            ...prev,
                            [String(post.id)]: !prev[String(post.id)],
                          }))
                        }
                        title="Discuss in comments"
                      >
                        <MessageSquare size={14} />
                        <span>Discuss ({post.comments.length})</span>
                      </button>

                      {/* 4. Amplify */}
                      <button
                        className={`action-btn ${reactions.isAmplified ? 'active' : ''}`}
                        onClick={() => handleAmplify(post.id)}
                        title="Amplify to your enterprise network"
                        style={{ color: reactions.isAmplified ? '#059669' : 'var(--fr8x-muted)' }}
                      >
                        <Repeat size={14} />
                        <span>Amplify ({reactions.amplify})</span>
                      </button>

                      {/* 5. Send */}
                      <button
                        className="action-btn"
                        onClick={() => handleSendPost(post)}
                        title="Send post link"
                      >
                        <Send size={14} />
                        <span>Send</span>
                      </button>

                      {/* 6. Red Flag */}
                      <button
                        className="action-btn"
                        onClick={() => setReportingPost(post)}
                        title="Report this post"
                        style={{ color: '#dc2626' }}
                      >
                        <Flag size={14} />
                        <span>Red Flag</span>
                      </button>

                      {/* Expand Intel Details */}
                      <button
                        className="action-btn"
                        onClick={() => setSelectedPostDetailId(post.id)}
                        title="Open full widescreen discussion and trade intel"
                        style={{ color: '#1985a1', fontWeight: 600 }}
                      >
                        <ExternalLink size={13} />
                        <span>Expand Intel</span>
                      </button>

                      {/* Save Bookmark */}
                      <button
                        className={`action-btn ${post.isSaved ? 'active' : ''}`}
                        onClick={() => savePost(post.id)}
                        title={post.isSaved ? 'Saved' : 'Save post'}
                        style={{ marginLeft: 'auto' }}
                      >
                        <Bookmark size={14} />
                        <span>{post.isSaved ? 'Saved' : 'Save'}</span>
                      </button>
                    </div>
                  );
                })()}

                {/* Comments Section */}
                {expandedPostComments[String(post.id)] && (
                  <div className="comments-section" style={{ marginTop: '14px' }}>
                    <div className="comment-input-row">
                      <input
                        type="text"
                        placeholder="Write a constructive B2B comment…"
                        value={commentInputs[String(post.id)] || ''}
                        onChange={(e) =>
                          setCommentInputs((prev) => ({ ...prev, [String(post.id)]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleCommentSubmit(post.id);
                        }}
                      />
                      <button
                        className="btn primary sm"
                        onClick={() => handleCommentSubmit(post.id)}
                        disabled={!commentInputs[String(post.id)]?.trim()}
                      >
                        Reply
                      </button>
                    </div>

                    {/* Comments Tree */}
                    <div className="comments-tree">
                      {post.comments.map((comment) => (
                        <div key={comment.id} className="comment-item tier-1">
                          <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <UserAvatar
                              name={comment.author}
                              avatarUrl={comment.author === user.displayName ? user.avatarUrl : (comment as any).avatarUrl}
                              companyLogoUrl={comment.author === user.displayName ? user.companyLogoUrl : (comment as any).companyLogoUrl}
                              size={22}
                            />
                            <span
                              className="comment-author"
                              onClick={() => setSelectedProfileName(comment.author)}
                            >
                              {comment.author}
                            </span>
                            {comment.hasGoldenTick && <GoldenTick />}
                            <span className="comment-time">· {comment.time}</span>
                            {comment.authorTimezone && (
                              <LocalTimeBadge timezone={comment.authorTimezone} />
                            )}
                          </div>
                          <p className="comment-text">{renderCommentWithMentions(comment.text)}</p>
                          <div className="comment-actions">
                            <button
                              className="sub-action"
                              onClick={() => {
                                setActiveReplyBoxKey(
                                  activeReplyBoxKey === comment.id ? null : comment.id
                                );
                                setReplyInputText(`(#{${comment.author}}) `);
                              }}
                            >
                              Reply
                            </button>
                          </div>

                          {/* Reply Box Tier 1 */}
                          {activeReplyBoxKey === comment.id && (
                            <div className="reply-input-box">
                              <input
                                type="text"
                                placeholder={`Reply to ${comment.author}…`}
                                value={replyInputText}
                                onChange={(e) => setReplyInputText(e.target.value)}
                                autoFocus
                              />
                              <div className="reply-btn-row">
                                <button
                                  className="btn secondary sm"
                                  onClick={() => setActiveReplyBoxKey(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  className="btn primary sm"
                                  onClick={() => handleReplySubmit(post.id, comment.id)}
                                >
                                  Reply
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Nested Replies Tier 2 */}
                          {comment.replies &&
                            comment.replies.map((reply) => (
                              <div key={reply.id} className="comment-item tier-2">
                                <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                  <UserAvatar
                                    name={reply.author}
                                    avatarUrl={reply.author === user.displayName ? user.avatarUrl : (reply as any).avatarUrl}
                                    companyLogoUrl={reply.author === user.displayName ? user.companyLogoUrl : (reply as any).companyLogoUrl}
                                    size={20}
                                  />
                                  <span
                                    className="comment-author"
                                    onClick={() => setSelectedProfileName(reply.author)}
                                  >
                                    {reply.author}
                                  </span>
                                  {reply.hasGoldenTick && <GoldenTick />}
                                  <span className="comment-time">· {reply.time}</span>
                                </div>
                                <p className="comment-text">{renderCommentWithMentions(reply.text)}</p>
                                <div className="comment-actions">
                                  <button
                                    className="sub-action"
                                    onClick={() => {
                                      setActiveReplyBoxKey(
                                        activeReplyBoxKey === reply.id ? null : reply.id
                                      );
                                      setReplyInputText(`(#{${reply.author}}) `);
                                    }}
                                  >
                                    Reply
                                  </button>
                                </div>

                                {/* Reply Box Tier 2 */}
                                {activeReplyBoxKey === reply.id && (
                                  <div className="reply-input-box">
                                    <input
                                      type="text"
                                      placeholder={`Reply to ${reply.author}…`}
                                      value={replyInputText}
                                      onChange={(e) => setReplyInputText(e.target.value)}
                                      autoFocus
                                    />
                                    <div className="reply-btn-row">
                                      <button
                                        className="btn secondary sm"
                                        onClick={() => setActiveReplyBoxKey(null)}
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        className="btn primary sm"
                                        onClick={() =>
                                          handleReplySubmit(post.id, comment.id, reply.id)
                                        }
                                      >
                                        Reply
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {/* Nested Replies Tier 3 */}
                                {reply.replies &&
                                  reply.replies.map((nested) => (
                                    <div key={nested.id} className="comment-item tier-3">
                                      <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                        <UserAvatar
                                          name={nested.author}
                                          avatarUrl={nested.author === user.displayName ? user.avatarUrl : (nested as any).avatarUrl}
                                          companyLogoUrl={nested.author === user.displayName ? user.companyLogoUrl : (nested as any).companyLogoUrl}
                                          size={18}
                                        />
                                        <span
                                          className="comment-author"
                                          onClick={() => setSelectedProfileName(nested.author)}
                                        >
                                          {nested.author}
                                        </span>
                                        <span className="comment-time">· {nested.time}</span>
                                      </div>
                                      <p className="comment-text">{renderCommentWithMentions(nested.text)}</p>
                                    </div>
                                  ))}
                              </div>
                            ))}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </article>

              {/* In-Feed Ads Injection Algorithm: Shows Company or Job Ad after every 10 posts */}
              {((postIndex + 1) % 10 === 0) && (() => {
                const adIndex = Math.floor((postIndex + 1) / 10) - 1;
                const isCompany = adIndex % 2 === 0;

                if (isCompany) {
                  if (IN_FEED_COMPANY_ADS.length === 0) return null;
                  const companyAd = IN_FEED_COMPANY_ADS[adIndex % IN_FEED_COMPANY_ADS.length];
                  if (!companyAd) return null;
                  const adTitle = (adIndex === 0 && bookedSlot1) ? bookedSlot1.headline : companyAd.headline;
                  const adCompany = (adIndex === 0 && bookedSlot1) ? bookedSlot1.businessName : companyAd.companyName;
                  const adBody = (adIndex === 0 && bookedSlot1) ? (bookedSlot1.description || companyAd.body) : companyAd.body;

                  return (
                    <div
                      key={`ad-comp-${postIndex}`}
                      className="card in-feed-ad-card"
                      style={{
                        marginBottom: '16px',
                        padding: '16px 18px',
                        background: 'var(--surface-primary, #FFFFFF)',
                        border: '1px solid var(--border-default, #D9DEE5)',
                        borderRadius: '10px',
                        boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0, 0, 0, 0.05))',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              background: 'var(--accent-primary, #006B68)',
                              color: '#ffffff',
                              fontSize: '9px',
                              fontWeight: 800,
                              letterSpacing: '0.06em',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Sponsored Partner Showcase
                          </span>
                          <span style={{ fontSize: '10.5px', color: 'var(--accent-primary, #006B68)', fontWeight: 600 }}>
                            ✦ Verified Freight Enterprise
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary, #64748B)' }}>
                          Ad · Direct Liner Placement
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'var(--glass-primary, var(--accent-primary, #006B68))',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '13px',
                            flexShrink: 0,
                          }}
                        >
                          {adCompany.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <b style={{ fontSize: '13.5px', color: 'var(--text-primary, #1F2937)' }}>{adCompany}</b>
                            <GoldenTick size={14} />
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)' }}>
                            {companyAd.sponsorName} · {companyAd.sponsorRole}
                          </div>
                        </div>
                      </div>

                      <b style={{ display: 'block', fontSize: '13px', color: 'var(--text-primary, #1F2937)', marginBottom: '5px', lineHeight: 1.35 }}>
                        {adTitle}
                      </b>
                      <p style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.45, marginBottom: '10px' }}>
                        {adBody}
                      </p>

                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {companyAd.tradeLanes.map((lane) => (
                          <span
                            key={lane}
                            style={{
                              background: 'var(--surface-elevated, #F8FAFC)',
                              color: 'var(--text-primary, #1F2937)',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-subtle, #E5E7EB)',
                            }}
                          >
                            {lane}
                          </span>
                        ))}
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(3, 1fr)',
                          gap: '8px',
                          background: 'var(--surface-elevated, #F8FAFC)',
                          border: '1px solid var(--border-subtle, #E5E7EB)',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          marginBottom: '12px',
                          textAlign: 'center',
                        }}
                      >
                        {companyAd.metrics.map((m) => (
                          <div key={m.label}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: 'var(--accent-primary, #006B68)' }}>{m.value}</div>
                            <div style={{ fontSize: '9px', color: 'var(--text-secondary, #64748B)', marginTop: '1px' }}>{m.label}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn primary sm"
                          style={{
                            fontSize: '11px',
                            padding: '5px 12px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                          onClick={() => {
                            openChatWith(companyAd.contactUid, {
                              type: 'company',
                              id: companyAd.id,
                              title: `Inquiry: ${adCompany}`,
                            });
                          }}
                        >
                          <MessageCircle size={12} /> Connect on Trade Chat
                        </button>
                        <button
                          type="button"
                          className="btn secondary sm"
                          style={{ fontSize: '11px', padding: '5px 12px' }}
                          onClick={() => {
                            toast(`Rate allocation inquiry sent to ${adCompany}. Priority spot response enabled.`);
                          }}
                        >
                          Request Route Allocation
                        </button>
                      </div>
                    </div>
                  );
                } else {
                  if (IN_FEED_JOB_ADS.length === 0) return null;
                  const jobAd = IN_FEED_JOB_ADS[adIndex % IN_FEED_JOB_ADS.length];
                  if (!jobAd) return null;
                  return (
                    <div
                      key={`ad-job-${postIndex}`}
                      className="card in-feed-ad-card"
                      style={{
                        marginBottom: '16px',
                        padding: '16px 18px',
                        background: 'var(--surface-primary, #FFFFFF)',
                        border: '1px solid var(--border-default, #D9DEE5)',
                        borderRadius: '10px',
                        boxShadow: 'var(--shadow-card, 0 1px 3px rgba(0, 0, 0, 0.05))',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              background: '#ea580c',
                              color: '#ffffff',
                              fontSize: '9px',
                              fontWeight: 800,
                              letterSpacing: '0.06em',
                              padding: '2px 7px',
                              borderRadius: '4px',
                              textTransform: 'uppercase',
                            }}
                          >
                            Sponsored Maritime Career
                          </span>
                          <span style={{ fontSize: '10.5px', color: '#ea580c', fontWeight: 600 }}>
                            ⚡ Hot Hiring Opening
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: 'var(--text-secondary, #64748B)' }}>
                          Ad · Verified Employer
                        </span>
                      </div>

                      <div style={{ marginBottom: '6px' }}>
                        <b style={{ fontSize: '13.5px', color: 'var(--text-primary, #1F2937)', display: 'block' }}>{jobAd.jobTitle}</b>
                        <div style={{ fontSize: '11px', color: 'var(--text-secondary, #64748B)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <b>{jobAd.companyName}</b>
                          <span>·</span>
                          <span>{jobAd.location}</span>
                          <span>·</span>
                          <span className="badge green" style={{ fontSize: '9px', padding: '1px 5px' }}>{jobAd.employmentType}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', flexWrap: 'wrap' }}>
                        <span style={{ background: 'rgba(5, 150, 105, 0.1)', border: '1px solid rgba(5, 150, 105, 0.3)', color: '#059669', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                          💰 {jobAd.salaryPackage}
                        </span>
                        <span style={{ background: 'var(--surface-elevated, #F8FAFC)', border: '1px solid var(--border-subtle, #E5E7EB)', color: 'var(--text-secondary, #64748B)', fontSize: '10.5px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px' }}>
                          ⏳ {jobAd.experience}
                        </span>
                      </div>

                      <p style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', lineHeight: 1.45, marginBottom: '8px' }}>
                        {jobAd.headline}
                      </p>

                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {(Array.isArray(jobAd.skills)
                          ? jobAd.skills
                          : typeof jobAd.skills === 'string'
                            ? (jobAd.skills as string).split(',').map((s) => s.trim()).filter(Boolean)
                            : []
                        ).map((skill) => (
                          <span
                            key={skill}
                            style={{
                              background: 'var(--surface-elevated, #F8FAFC)',
                              color: 'var(--text-primary, #1F2937)',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-subtle, #E5E7EB)',
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn primary sm"
                          style={{
                            fontSize: '11px',
                            padding: '5px 14px',
                          }}
                          onClick={() => {
                            toast(`Application submitted successfully for ${jobAd.jobTitle} at ${jobAd.companyName}!`);
                          }}
                        >
                          Quick Apply via FR8X
                        </button>
                        <button
                          type="button"
                          className="btn secondary sm"
                          style={{ fontSize: '11px', padding: '5px 12px', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          onClick={() => {
                            openChatWith(jobAd.contactUid, {
                              type: 'job',
                              id: jobAd.id,
                              title: `Job Inquiry: ${jobAd.jobTitle}`,
                            });
                          }}
                        >
                          <MessageCircle size={12} /> Chat with Recruiter
                        </button>
                      </div>
                    </div>
                  );
                }
              })()}
            </React.Fragment>
          );
        })
        )}

        {/* Pagination & Infinite Scroll Trigger */}
        {filteredPosts.length > visiblePostCount && (
          <div style={{ textAlign: 'center', margin: '18px 0 24px' }}>
            <button
              className="btn secondary"
              onClick={() => setVisiblePostCount((prev) => prev + 10)}
              style={{ padding: '8px 24px', fontSize: '12.5px', borderRadius: '20px', fontWeight: 600 }}
            >
              Load more freight intelligence ({filteredPosts.length - visiblePostCount} remaining)
            </button>
          </div>
        )}

        {/* Expand search button */}
        {feedSearch && !showAllSearchResults && filteredPosts.length > 7 && (
          <div style={{ textAlign: 'center', margin: '14px 0' }}>
            <button
              className="btn secondary"
              onClick={() => setShowAllSearchResults(true)}
            >
              Show all {filteredPosts.length} search results
            </button>
          </div>
        )}
      </section>

      {/* RIGHT COLUMN: Jobs & Interactive "YOUR AD HERE" Booking Space */}
      <aside className="feed-right-rail">
        {/* Active Jobs Card */}
        <div className="card side-card" style={{ background: 'var(--surface-primary, #ffffff)', border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px' }}>
          <div className="side-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '6px', padding: '10px 10px', borderBottom: '1px solid var(--border-subtle, #E5E7EB)', background: 'var(--surface-primary, #FFFFFF)' }}>
            <b style={{ fontSize: '12px', color: 'var(--text-primary, #1F2937)', fontWeight: 700, whiteSpace: 'nowrap' }}>Trade Careers &amp; Jobs</b>
            <div style={{ display: 'flex', gap: '5px', alignItems: 'center', flexShrink: 0 }}>
              <button
                type="button"
                style={{
                  height: '26px',
                  padding: '0 8px',
                  fontSize: '11px',
                  fontWeight: 700,
                  backgroundColor: 'var(--accent-primary, #006B68)',
                  color: '#FFFFFF',
                  border: '1px solid var(--accent-primary, #006B68)',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '3px',
                  whiteSpace: 'nowrap',
                  boxShadow: '0 1px 2px rgba(0, 107, 104, 0.2)',
                }}
                onClick={() => setShowJobCreateModal(true)}
              >
                + Post
              </button>
              <Link
                href="/jobs"
                style={{
                  height: '26px',
                  padding: '0 8px',
                  fontSize: '11px',
                  fontWeight: 600,
                  backgroundColor: 'var(--surface-primary, #FFFFFF)',
                  color: 'var(--text-primary, #1F2937)',
                  border: '1px solid var(--border-default, #D9DEE5)',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  whiteSpace: 'nowrap',
                  transition: 'background-color 0.15s ease',
                }}
              >
                View All
              </Link>
            </div>
          </div>

          {jobs.length === 0 ? (
            <div style={{ padding: '16px 12px', textAlign: 'center', background: 'var(--surface-primary, #FFFFFF)', borderRadius: '0 0 8px 8px' }}>
              <Briefcase size={22} style={{ color: 'var(--brand)', margin: '0 auto 6px', opacity: 0.8 }} />
              <p style={{ fontSize: '11.5px', color: 'var(--ink-secondary)', margin: '0 0 10px', lineHeight: 1.4 }}>
                Looking for logistics talent? Post your open roles across the FR8X network.
              </p>
              <button
                type="button"
                className="btn primary sm"
                style={{ fontSize: '11px', padding: '4px 12px', fontWeight: 700 }}
                onClick={() => setShowJobCreateModal(true)}
              >
                + Post a Job
              </button>
            </div>
          ) : (
            <div className="job-list" style={{ display: 'flex', flexDirection: 'column' }}>
              {jobs.slice(0, 3).map((job) => (
                <div
                  key={job.id}
                  className="job-item"
                  onClick={() => setSelectedJobModal(job)}
                  style={{ cursor: 'pointer', padding: '10px 12px', borderBottom: '1px solid var(--line-light)' }}
                >
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <UserAvatar name={job.postedBy} companyName={job.company} size={30} showCompanyLogo={true} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b className="job-title" style={{ fontSize: '12px', color: 'var(--ink)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>{job.title}</b>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '1px' }}>
                        <span className="job-company" style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 600 }}>{job.company}</span>
                        <span className="badge green" style={{ fontSize: '7.5px', padding: '0 4px', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                          <ShieldCheck size={8} /> Verified
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="job-meta" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '10px', color: 'var(--mut)', marginTop: '5px', flexWrap: 'wrap' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><MapPin size={9} /> {job.location}</span>
                    <span>·</span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Briefcase size={9} /> {job.employmentType}</span>
                    {job.experience && (
                      <>
                        <span>·</span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}><Users size={9} /> {job.experience}</span>
                      </>
                    )}
                  </div>
                  <div className="job-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span className="job-pkg" style={{ fontSize: '11px', color: 'var(--green)', fontWeight: 700 }}>{job.packageDetails || 'Competitive'}</span>
                      <small style={{ fontSize: '9px', color: 'var(--mut)' }}>
                        {job.closingDate ? `Closes ${job.closingDate}` : `Posted ${job.postedDate || 'recently'}`}
                      </small>
                    </div>
                    <button
                      type="button"
                      className="btn primary sm"
                      style={{ padding: '3px 9px', fontSize: '10.5px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedJobModal(job);
                      }}
                    >
                      <Eye size={11} /> SHOW JOB
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Slot 1: Booked Sponsor Ad */}
        {bookedSlot1 && renderBookedAdCard(bookedSlot1, 1)}

        {/* Slot 2: Booked Sponsor Ad */}
        {bookedSlot2 && renderBookedAdCard(bookedSlot2, 2)}

        {/* Unified Single Sponsor Ad Booking Card (Never duplicate identical placeholder cards) */}
        {!bookedSlot1 && !bookedSlot2 && (
          <div className="card side-card" style={{ background: 'var(--surface-primary, #ffffff)', border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '8px', textAlign: 'center', padding: '16px 14px' }}>
            <h3 style={{ fontSize: '13.5px', fontWeight: 800, margin: '0 0 6px', color: 'var(--text-primary, #1F2937)' }}>
              Promote your business with us
            </h3>
            <p style={{ fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', margin: '0 0 12px', lineHeight: 1.45 }}>
              Advertise your company · Reach verified logistics leaders · Grow your trade network
            </p>
            <button
              className="btn primary sm"
              style={{ width: '100%', justifyContent: 'center', height: '34px', fontWeight: 700, borderRadius: '6px' }}
              onClick={() => {
                setActiveAdSlot(1);
                setShowBookAdModal(true);
              }}
            >
              Book ad space (from ₹1,000)
            </button>
          </div>
        )}
      </aside>

      {/* 4. Send Post to Contact Selection Modal (Requirement 4) */}
      {sendPostTarget && (
        <Modal
          isOpen={Boolean(sendPostTarget)}
          onClose={() => {
            setSendPostTarget(null);
            setSelectedContactUids([]);
            setSendOptionalNote('');
            setSendContactSearch('');
          }}
          title="Send to contact"
          maxWidth="460px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {/* Post Preview Snippet */}
            <div
              style={{
                background: 'var(--surface-secondary, #F8FAFC)',
                border: '1px solid var(--border-default, #D9DEE5)',
                borderRadius: '6px',
                padding: '8px 10px',
                fontSize: '11.5px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                <b style={{ color: 'var(--fr8x-text)' }}>{sendPostTarget.author}</b>
                {sendPostTarget.authorCompany && (
                  <span style={{ color: 'var(--fr8x-muted)', fontSize: '10.5px' }}>({sendPostTarget.authorCompany})</span>
                )}
              </div>
              <p
                style={{
                  margin: 0,
                  color: 'var(--fr8x-text)',
                  fontSize: '11px',
                  lineHeight: 1.4,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {sendPostTarget.text}
              </p>
            </div>

            {/* Search contacts input */}
            <div className="field" style={{ margin: 0 }}>
              <div className="search-icon-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--fr8x-muted)', pointerEvents: 'none', zIndex: 2 }} />
                <input
                  type="text"
                  className="search-input-field has-leading-icon"
                  placeholder="🔍 Search contacts..."
                  value={sendContactSearch}
                  onChange={(e) => setSendContactSearch(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '6px 10px 6px 32px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--border-default, #D9DEE5)',
                    background: 'var(--surface-primary, #FFFFFF)',
                    color: 'var(--text-primary, #1F2937)',
                  }}
                />
              </div>
            </div>

            {/* Checkable contact list */}
            <div
              style={{
                border: '1px solid var(--border-default, #D9DEE5)',
                borderRadius: '6px',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                background: 'var(--surface-primary, #FFFFFF)',
              }}
            >
              {filteredSendContacts.length === 0 ? (
                <div style={{ padding: '14px', textAlign: 'center', color: 'var(--text-secondary, #64748B)', fontSize: '11.5px' }}>
                  No contacts found matching &ldquo;{sendContactSearch}&rdquo;
                </div>
              ) : (
                filteredSendContacts.map((contact) => {
                  const isSelected = selectedContactUids.includes(contact.uid);
                  return (
                    <label
                      key={contact.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        background: isSelected ? 'var(--surface-secondary, #F8FAFC)' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.1s ease',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => {
                          setSelectedContactUids((prev) =>
                            prev.includes(contact.uid)
                              ? prev.filter((id) => id !== contact.uid)
                              : [...prev, contact.uid]
                          );
                        }}
                        style={{ cursor: 'pointer', accentColor: 'var(--brand, #1985a1)', width: '15px', height: '15px' }}
                      />
                      <UserAvatar
                        name={contact.name}
                        avatarUrl={(contact as any).avatarUrl}
                        companyLogoUrl={(contact as any).companyLogoUrl}
                        companyName={contact.company}
                        size={26}
                      />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <b style={{ fontSize: '11.5px', color: 'var(--fr8x-text)' }}>{contact.name}</b>
                          {contact.hasGoldenTick && <GoldenTick size={11} />}
                          {contact.isOnline && (
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16a34a' }} title="Online" />
                          )}
                        </div>
                        <small style={{ color: 'var(--fr8x-muted)', fontSize: '10px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {contact.role} · {contact.company}
                        </small>
                      </div>
                    </label>
                  );
                })
              )}
            </div>

            {/* Optional note field */}
            <div className="field" style={{ margin: 0 }}>
              <label style={{ fontSize: '10.5px', fontWeight: 600, color: 'var(--fr8x-muted)', marginBottom: '3px', display: 'block' }}>
                Optional message note
              </label>
              <textarea
                rows={2}
                placeholder="Include an optional message (e.g. Please review this market intelligence)..."
                value={sendOptionalNote}
                onChange={(e) => setSendOptionalNote(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  fontSize: '11.5px',
                  padding: '6px 8px',
                  borderRadius: '6px',
                  border: '1px solid var(--fr8x-outline, #cbd5e1)',
                }}
              />
            </div>

            {/* Cancel & Send Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--fr8x-outline, #e2e8f0)', paddingTop: '10px' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setSendPostTarget(null);
                  setSelectedContactUids([]);
                  setSendOptionalNote('');
                  setSendContactSearch('');
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn primary"
                disabled={selectedContactUids.length === 0}
                onClick={handleConfirmSendToContacts}
                style={{ minWidth: '85px' }}
              >
                <Send size={12} /> Send ({selectedContactUids.length})
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* 5. View All & Manage Contacts Modal (Requirement 5) */}
      {showManageContactsModal && (
        <Modal
          isOpen={showManageContactsModal}
          onClose={() => setShowManageContactsModal(false)}
          title="Enterprise Network Contacts & Directory"
          maxWidth="723px"
          style={{
            width: '723px',
            maxWidth: 'min(723px, 96vw)',
            height: '932px',
            maxHeight: 'min(932px, 94vh)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, gap: '12px', minHeight: 0 }}>
            {/* Tab Navigation */}
            <div style={{ display: 'flex', borderBottom: '1px solid var(--fr8x-outline, #e2e8f0)', gap: '4px', overflowX: 'auto' }}>
              <button
                type="button"
                onClick={() => setManageContactsTab('received')}
                style={{
                  padding: '8px 12px',
                  fontSize: '11.5px',
                  fontWeight: manageContactsTab === 'received' ? 700 : 500,
                  color: manageContactsTab === 'received' ? '#0369a1' : 'var(--fr8x-muted)',
                  border: 'none',
                  borderBottom: manageContactsTab === 'received' ? '2px solid #0284c7' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
              >
                <UserCheck size={13} /> CONNECTION REQUEST RECEIVED
                {connRequests.incoming.length > 0 && (
                  <span style={{ fontSize: '9px', background: '#dc2626', color: '#fff', borderRadius: '10px', padding: '1px 5px', fontWeight: 800 }}>
                    {connRequests.incoming.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setManageContactsTab('sent')}
                style={{
                  padding: '8px 12px',
                  fontSize: '11.5px',
                  fontWeight: manageContactsTab === 'sent' ? 700 : 500,
                  color: manageContactsTab === 'sent' ? 'var(--brand)' : 'var(--fr8x-muted)',
                  border: 'none',
                  borderBottom: manageContactsTab === 'sent' ? '2px solid var(--brand)' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Clock size={13} /> Sent Requests
                {connRequests.outgoing.length > 0 && (
                  <span style={{ fontSize: '9px', background: 'var(--surface-secondary, #F8FAFC)', color: 'var(--text-secondary, #64748B)', border: '1px solid var(--border-subtle, #E5E7EB)', borderRadius: '10px', padding: '1px 5px', fontWeight: 700 }}>
                    {connRequests.outgoing.length}
                  </span>
                )}
              </button>

              <button
                type="button"
                onClick={() => setManageContactsTab('contacts')}
                style={{
                  padding: '8px 12px',
                  fontSize: '11.5px',
                  fontWeight: manageContactsTab === 'contacts' ? 700 : 500,
                  color: manageContactsTab === 'contacts' ? 'var(--brand)' : 'var(--fr8x-muted)',
                  border: 'none',
                  borderBottom: manageContactsTab === 'contacts' ? '2px solid var(--brand)' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Users size={13} /> Connected Contacts ({workspaceContacts.length})
              </button>

              <button
                type="button"
                onClick={() => setManageContactsTab('discover')}
                style={{
                  padding: '8px 12px',
                  fontSize: '11.5px',
                  fontWeight: manageContactsTab === 'discover' ? 700 : 500,
                  color: manageContactsTab === 'discover' ? 'var(--brand)' : 'var(--fr8x-muted)',
                  border: 'none',
                  borderBottom: manageContactsTab === 'discover' ? '2px solid var(--brand)' : '2px solid transparent',
                  background: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '5px',
                  whiteSpace: 'nowrap',
                }}
              >
                <Globe2 size={13} /> Global Directory
              </button>
            </div>

            {/* TAB 1: CONNECTION REQUEST RECEIVED */}
            {manageContactsTab === 'received' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-primary, #006B68)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <UserCheck size={13} /> CONNECTION REQUEST RECEIVED ({connRequests.incoming.length})
                  </div>
                  {isSyncingContacts && (
                    <span style={{ fontSize: '10.5px', color: 'var(--fr8x-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Loader2 size={11} className="spin" /> Updating...
                    </span>
                  )}
                </div>

                {syncContactsError && (
                  <div style={{ padding: '8px 12px', background: 'rgba(220, 38, 38, 0.1)', border: '1px solid rgba(220, 38, 38, 0.3)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                    <span style={{ fontSize: '11px', color: '#dc2626' }}>{syncContactsError}</span>
                    <button type="button" className="btn secondary sm" onClick={refreshContactsState} style={{ fontSize: '10px', padding: '2px 8px' }}>
                      Retry Query
                    </button>
                  </div>
                )}

                {isSyncingContacts && connRequests.incoming.length === 0 ? (
                  <div style={{ padding: '36px', textAlign: 'center', fontSize: '12px', color: 'var(--fr8x-muted)' }}>
                    <Loader2 size={20} className="spin" style={{ display: 'block', margin: '0 auto 8px', color: 'var(--brand)' }} />
                    Loading incoming connection requests...
                  </div>
                ) : connRequests.incoming.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', background: 'var(--surface-secondary, #F8FAFC)', borderRadius: '6px', border: '1px dashed var(--border-default, #D9DEE5)' }}>
                    <UserPlus size={26} style={{ color: 'var(--text-secondary, #64748B)', display: 'block', margin: '0 auto 8px' }} />
                    <b style={{ fontSize: '12.5px', color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '4px' }}>No incoming connection requests received.</b>
                    <span>When other freight companies and logistics partners invite you to connect, they will appear here.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {connRequests.incoming.map((req) => {
                      const isAccepting = actioningReqId === req.id && actioningType === 'accept';
                      const isRejecting = actioningReqId === req.id && actioningType === 'reject';
                      const isActionDisabled = actioningReqId !== null;

                      return (
                        <div
                          key={req.id}
                          style={{
                            padding: '10px 12px',
                            background: 'var(--surface-primary, #FFFFFF)',
                            border: '1px solid var(--border-default, #D9DEE5)',
                            borderRadius: '6px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px',
                            boxShadow: 'var(--shadow-card)',
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <UserAvatar
                                name={req.senderName}
                                avatarUrl={req.senderAvatarUrl}
                                companyLogoUrl={req.senderCompanyLogoUrl}
                                companyName={req.senderCompany}
                                size={36}
                              />
                              <div>
                                <b
                                  onClick={() => {
                                    setShowManageContactsModal(false);
                                    setSelectedProfileUid(req.fromUid);
                                    setSelectedProfileName(req.senderName);
                                  }}
                                  style={{ fontSize: '12.5px', color: 'var(--text-primary, #1F2937)', cursor: 'pointer' }}
                                >
                                  {req.senderName}
                                </b>
                                <small style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-secondary, #64748B)' }}>
                                  {req.senderRole || 'Freight Member'} · <span style={{ fontWeight: 600, color: 'var(--text-primary, #1F2937)' }}>{req.senderCompany || 'Enterprise Partner'}</span>
                                </small>
                              </div>
                            </div>
                            <span style={{ fontSize: '10px', color: 'var(--text-secondary, #64748B)' }}>
                              Sent {new Date(req.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          {req.note && (
                            <div style={{ padding: '6px 8px', background: 'var(--surface-secondary, #F8FAFC)', borderLeft: '3px solid var(--accent-primary, #006B68)', fontSize: '11px', color: 'var(--text-primary, #1F2937)', fontStyle: 'italic', borderRadius: '0 4px 4px 0' }}>
                              &ldquo;{req.note}&rdquo;
                            </div>
                          )}

                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn secondary sm"
                              disabled={isActionDisabled}
                              onClick={async () => {
                                setActioningReqId(req.id);
                                setActioningType('reject');
                                try {
                                  await declineConnectionRequest(req.id, user);
                                  toast('Connection request rejected.');
                                  await refreshContactsState();
                                } catch (err: any) {
                                  toast(err?.message || 'Failed to reject request');
                                } finally {
                                  setActioningReqId(null);
                                  setActioningType(null);
                                }
                              }}
                              style={{ fontSize: '11px', padding: '4px 10px', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {isRejecting ? (
                                <>
                                  <Loader2 size={11} className="spin" /> REJECTING...
                                </>
                              ) : (
                                <>
                                  <X size={11} /> Reject
                                </>
                              )}
                            </button>
                            <button
                              type="button"
                              className="btn primary sm"
                              disabled={isActionDisabled}
                              onClick={async () => {
                                setActioningReqId(req.id);
                                setActioningType('accept');
                                try {
                                  await acceptConnectionRequest(req.id, user);
                                  toast(`Connected with ${req.senderName}!`);
                                  await refreshContactsState();
                                } catch (err: any) {
                                  toast(err?.message || 'Failed to accept connection');
                                } finally {
                                  setActioningReqId(null);
                                  setActioningType(null);
                                }
                              }}
                              style={{ fontSize: '11px', padding: '4px 12px', background: 'var(--accent-primary, #006B68)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              {isAccepting ? (
                                <>
                                  <Loader2 size={11} className="spin" /> ACCEPTING...
                                </>
                              ) : (
                                <>
                                  <Check size={11} /> Accept
                                </>
                              )}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: SENT REQUESTS */}
            {manageContactsTab === 'sent' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--text-secondary, #64748B)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Clock size={12} /> Sent Invitations Pending ({connRequests.outgoing.length})
                </div>

                {connRequests.outgoing.length === 0 ? (
                  <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', background: 'var(--surface-secondary, #F8FAFC)', borderRadius: '6px', border: '1px dashed var(--border-default, #D9DEE5)' }}>
                    <Clock size={26} style={{ color: 'var(--text-secondary, #64748B)', display: 'block', margin: '0 auto 8px' }} />
                    <b style={{ fontSize: '12.5px', color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '4px' }}>No outgoing pending requests.</b>
                    <span>When you invite colleagues or partners, your pending requests will be listed here.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {connRequests.outgoing.map((req) => {
                      const isWithdrawing = actioningReqId === req.id && actioningType === 'withdraw';
                      const isActionDisabled = actioningReqId !== null;

                      return (
                        <div
                          key={req.id}
                          style={{
                            padding: '8px 10px',
                            background: 'var(--surface-primary, #FFFFFF)',
                            border: '1px solid var(--border-subtle, #E5E7EB)',
                            borderRadius: '6px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <b style={{ fontSize: '12px', color: 'var(--text-primary, #1F2937)' }}>
                              {req.recipientName || 'Trade Partner'}
                            </b>
                            <small style={{ display: 'block', fontSize: '10.5px', color: 'var(--text-secondary, #64748B)' }}>
                              {req.recipientCompany || 'Enterprise Member'} · <Clock size={10} style={{ verticalAlign: '-1px' }} /> REQUEST SENT · Waiting for response
                            </small>
                          </div>
                          <button
                            type="button"
                            className="btn secondary sm"
                            disabled={isActionDisabled}
                            onClick={async () => {
                              setActioningReqId(req.id);
                              setActioningType('withdraw');
                              try {
                                await cancelConnectionRequest(req.id, user, req.toUid);
                                toast('Invitation withdrawn.');
                                await refreshContactsState();
                              } catch (err: any) {
                                toast(err?.message || 'Failed to withdraw invitation.');
                              } finally {
                                setActioningReqId(null);
                                setActioningType(null);
                              }
                            }}
                            style={{ fontSize: '10.5px', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            {isWithdrawing ? (
                              <>
                                <Loader2 size={10} className="spin" /> WITHDRAWING...
                              </>
                            ) : (
                              'Withdraw'
                            )}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 3: CONNECTED CONTACTS */}
            {manageContactsTab === 'contacts' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
                <div style={{ fontSize: '11px', fontWeight: 800, color: 'var(--accent-primary, #006B68)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={12} /> Connected Members ({workspaceContacts.length})
                </div>

                {workspaceContacts.length === 0 ? (
                  <div style={{ padding: '36px 16px', textAlign: 'center', fontSize: '11.5px', color: 'var(--text-secondary, #64748B)', background: 'var(--surface-secondary, #F8FAFC)', borderRadius: '6px', border: '1px dashed var(--border-default, #D9DEE5)' }}>
                    <Users size={28} style={{ color: 'var(--text-secondary, #64748B)', display: 'block', margin: '0 auto 8px' }} />
                    <b style={{ fontSize: '13px', color: 'var(--text-primary, #1F2937)', display: 'block', marginBottom: '4px' }}>No direct contacts connected yet.</b>
                    <span>Accept incoming requests or explore the Global Directory to establish verified freight partnerships.</span>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {workspaceContacts.map((c) => (
                      <div
                        key={c.id || c.uid}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          border: '1px solid var(--border-subtle, #E5E7EB)',
                          background: 'var(--surface-primary, #FFFFFF)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--accent-primary, #006B68), var(--accent-hover, #005653))', color: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: 800 }}>
                            {c.name.slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <b
                              onClick={() => {
                                setShowManageContactsModal(false);
                                setSelectedProfileUid(c.uid);
                                setSelectedProfileName(c.name);
                              }}
                              style={{ fontSize: '12.5px', color: 'var(--text-primary, #1F2937)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                            >
                              {c.name}
                              {c.hasGoldenTick && <GoldenTick size={12} />}
                            </b>
                            <small style={{ color: 'var(--text-secondary, #64748B)', fontSize: '11px', display: 'block' }}>
                              {c.role || 'Enterprise Member'} · <span style={{ fontWeight: 600, color: 'var(--text-primary, #1F2937)' }}>{c.company || 'Enterprise Partner'}</span>
                            </small>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            className="btn secondary sm"
                            onClick={() => {
                              setShowManageContactsModal(false);
                              setSelectedProfileUid(c.uid);
                              setSelectedProfileName(c.name);
                            }}
                            style={{ fontSize: '10.5px' }}
                          >
                            Passport
                          </button>
                          <button
                            type="button"
                            className="btn primary sm"
                            onClick={() => {
                              setShowManageContactsModal(false);
                              openChatWith(c.uid, { type: 'company', id: c.uid, title: `Chat with ${c.name}` });
                            }}
                            style={{ fontSize: '10.5px', background: 'var(--accent-primary, #006B68)' }}
                          >
                            <MessageCircle size={11} /> Chat
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB 4: DISCOVER MEMBERS */}
            {manageContactsTab === 'discover' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, minHeight: 0 }}>
                {/* Search Bar */}
                <div className="search-icon-wrap" style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Search size={13} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary, #64748B)', pointerEvents: 'none', zIndex: 2 }} />
                  <input
                    type="text"
                    className="search-input-field has-leading-icon"
                    placeholder="Search by name, company, role, city, or country…"
                    value={discoverMemberSearch}
                    onChange={(e) => setDiscoverMemberSearch(e.target.value)}
                    style={{
                      width: '100%',
                      boxSizing: 'border-box',
                      padding: '7px 8px 7px 32px',
                      fontSize: '12px',
                      borderRadius: '6px',
                      border: '1px solid var(--border-default, #D9DEE5)',
                      background: 'var(--surface-primary, #FFFFFF)',
                      color: 'var(--text-primary, #1F2937)',
                    }}
                  />
                </div>

                {/* Directory List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
                  {(() => {
                    const q = discoverMemberSearch.trim().toLowerCase();
                    const pool = [...remoteMembers];
                    const seenUids = new Set(pool.map((p) => p.uid));
                    for (const u of (allUsers || [])) {
                      if (u.uid && !seenUids.has(u.uid)) {
                        seenUids.add(u.uid);
                        pool.push(u);
                      }
                    }
                    const candidates = pool.filter((u) => {
                      if (!u.uid || u.uid === user.uid) return false;
                      if (!q) return true;
                      const name = (u.displayName || `${u.firstName} ${u.lastName}` || '').toLowerCase();
                      const comp = (u.company || '').toLowerCase();
                      const desig = (u.designation || '').toLowerCase();
                      const city = (u.city || '').toLowerCase();
                      const country = (u.country || '').toLowerCase();
                      const email = (u.email || '').toLowerCase();
                      return (
                        name.includes(q) ||
                        comp.includes(q) ||
                        desig.includes(q) ||
                        city.includes(q) ||
                        country.includes(q) ||
                        email.includes(q)
                      );
                    });

                    if (candidates.length === 0) {
                      return (
                        <div style={{ padding: '24px 12px', textAlign: 'center', fontSize: '12px', color: 'var(--text-secondary, #64748B)' }}>
                          No members matching &ldquo;{discoverMemberSearch}&rdquo;
                        </div>
                      );
                    }

                    return candidates.map((m) => {
                      const mName = m.displayName || `${m.firstName} ${m.lastName}`.trim() || m.email;
                      const st = getConnectionStatus(user.uid, m.uid);

                      return (
                        <div
                          key={m.uid}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 10px',
                            borderRadius: '6px',
                            border: '1px solid var(--border-subtle, #E5E7EB)',
                            background: 'var(--surface-primary, #FFFFFF)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <UserAvatar
                              name={mName}
                              avatarUrl={m.avatarUrl}
                              companyLogoUrl={m.companyLogoUrl}
                              companyName={m.company}
                              size={34}
                            />

                            <div>
                              <b
                                onClick={() => {
                                  setShowManageContactsModal(false);
                                  setSelectedProfileUid(m.uid);
                                  setSelectedProfileName(mName);
                                }}
                                style={{ fontSize: '12.5px', color: 'var(--fr8x-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                              >
                                {mName}
                                {m.hasGoldenTick && <GoldenTick size={12} />}
                              </b>
                              <small style={{ color: 'var(--fr8x-muted)', fontSize: '11px', display: 'block' }}>
                                {m.designation || 'Freight Professional'} · <span style={{ fontWeight: 600, color: 'var(--fr8x-text)' }}>{m.company || 'Enterprise'}</span>
                                {m.city ? ` · ${m.city}, ${m.country}` : ''}
                              </small>
                            </div>
                          </div>

                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <button
                              type="button"
                              className="btn secondary sm"
                              onClick={() => {
                                setShowManageContactsModal(false);
                                setSelectedProfileUid(m.uid);
                                setSelectedProfileName(mName);
                              }}
                              style={{ fontSize: '10.5px' }}
                            >
                              Passport
                            </button>

                            {st === 'connected' ? (
                              <button
                                type="button"
                                className="btn primary sm"
                                onClick={() => {
                                  setShowManageContactsModal(false);
                                  openChatWith(m.uid, { type: 'company', id: m.uid, title: `Chat with ${mName}` });
                                }}
                                style={{ fontSize: '10.5px' }}
                              >
                                <MessageCircle size={11} /> Chat
                              </button>
                            ) : st === 'pending_sent' ? (
                              <span className="badge blue" style={{ fontSize: '10px' }}>
                                <Clock size={10} /> Request Sent
                              </span>
                            ) : st === 'pending_received' ? (
                              <button
                                type="button"
                                className="btn primary sm"
                                onClick={() => {
                                  const reqs = getAllConnectionRequests();
                                  const req = reqs.find((r: any) => r.fromUid === m.uid && r.toUid === user.uid && r.status === 'pending');
                                  if (req) {
                                    acceptConnectionRequest(req.id, user);
                                    toast(`Connected with ${mName}!`);
                                  }
                                }}
                                style={{ fontSize: '10.5px' }}
                              >
                                Accept
                              </button>
                            ) : (
                              <button
                                type="button"
                                className="btn primary sm"
                                onClick={() => {
                                  setShowManageContactsModal(false);
                                  setSelectedProfileUid(m.uid);
                                  setSelectedProfileName(mName);
                                }}
                                style={{ fontSize: '10.5px' }}
                              >
                                <UserPlus size={11} /> Connect
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px', borderTop: '1px solid var(--fr8x-outline, #e2e8f0)', paddingTop: '8px' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowManageContactsModal(false)}
              >
                Close
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Global Search Connections & Networking Modal */}
      {showSearchConnectionsModal && (
        <SearchConnectionsModal
          isOpen={showSearchConnectionsModal}
          onClose={() => setShowSearchConnectionsModal(false)}
          currentUser={user}
          onViewProfile={(uid, name) => {
            setSelectedProfileUid(uid);
            setSelectedProfileName(name);
          }}
          onOpenChat={(uid, name) =>
            openChatWith(uid, { type: 'company', id: uid, title: `Chat with ${name}` })
          }
        />
      )}

      {/* Quick Edit Contact & Terminal Modal */}
      {showQuickContactModal && (
        <Modal
          isOpen={showQuickContactModal}
          onClose={() => setShowQuickContactModal(false)}
          title="Edit Contact & Terminal Location"
          maxWidth="540px"
        >
          <form onSubmit={handleSaveQuickContact} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ background: 'var(--surface-secondary, #F8FAFC)', padding: '10px 12px', borderRadius: '6px', border: '1px solid var(--border-subtle, #E5E7EB)', fontSize: '11.5px', color: 'var(--text-secondary, #64748B)' }}>
              Changes made here are saved to your verified profile and synchronize instantly across Feeds, Profile, and B2B Networking across all your devices.
            </div>

            <div className="grid g2">
              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700 }}>Mobile Number / Phone <span className="req">*</span></label>
                <input
                  className="input"
                  value={quickMobile}
                  onChange={(e) => setQuickMobile(e.target.value)}
                  placeholder="+91 98200 12345"
                  required
                />
              </div>
              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700 }}>Contact Email ID <span className="req">*</span></label>
                <input
                  className="input"
                  type="email"
                  value={quickEmail}
                  onChange={(e) => setQuickEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>
            </div>

            <div className="field">
              <label style={{ fontSize: '11px', fontWeight: 700 }}>Freight Terminal / Corporate Address</label>
              <input
                className="input"
                value={quickAddress}
                onChange={(e) => setQuickAddress(e.target.value)}
                placeholder="e.g. Apex Cargo Complex, Andheri East, Mumbai, Maharashtra 400069"
              />
            </div>

            <div className="grid g2">
              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700 }}>City / Port Hub</label>
                <input
                  className="input"
                  value={quickCity}
                  onChange={(e) => setQuickCity(e.target.value)}
                  placeholder="Mumbai"
                />
              </div>
              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700 }}>Country</label>
                <input
                  className="input"
                  value={quickCountry}
                  onChange={(e) => setQuickCountry(e.target.value)}
                  placeholder="India"
                />
              </div>
            </div>

            <div className="grid g2">
              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700 }}>Designation</label>
                <input
                  className="input"
                  value={quickDesignation}
                  onChange={(e) => setQuickDesignation(e.target.value)}
                  placeholder="Trade Specialist"
                />
              </div>
              <div className="field">
                <label style={{ fontSize: '11px', fontWeight: 700 }}>Company Name</label>
                <input
                  className="input"
                  value={quickCompany}
                  onChange={(e) => setQuickCompany(e.target.value)}
                  placeholder="Apex Global Logistics"
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => setShowQuickContactModal(false)}
                disabled={isSavingQuickContact}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn primary"
                disabled={isSavingQuickContact}
              >
                {isSavingQuickContact ? 'Saving Changes...' : '✓ Save Changes'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Post Confirmation Modal */}
      {postToDelete && (
        <Modal
          isOpen={Boolean(postToDelete)}
          onClose={() => setPostToDelete(null)}
          title="Delete Post from Feed"
          maxWidth="440px"
        >
          <div style={{ padding: '4px 0' }}>
            <p style={{ fontSize: '13px', color: 'var(--fg, #0f172a)', lineHeight: 1.5, margin: '0 0 16px' }}>
              Are you sure you want to permanently delete this post? This action will remove it from the trade network and cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                type="button"
                className="btn secondary sm"
                onClick={() => setPostToDelete(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn sm"
                style={{ background: '#dc2626', color: '#fff', border: '1px solid #dc2626' }}
                onClick={() => {
                  deletePost(postToDelete);
                  setPostToDelete(null);
                }}
              >
                <Trash2 size={12} /> Delete Permanently
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Ad Creative Lightbox Modal */}
      {lightboxImage && (
        <div
          className="lightbox-overlay"
          onClick={() => setLightboxImage(null)}
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.85)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: 'relative',
              maxWidth: '90vw',
              maxHeight: '90vh',
              background: 'var(--surface-primary, #FFFFFF)',
              border: '1px solid var(--border-subtle, #E5E7EB)',
              borderRadius: '10px',
              padding: '12px',
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="close-red-box sm"
              style={{ position: 'absolute', top: '10px', right: '10px', zIndex: 10 }}
              title="Close full creative preview (Esc)"
            >
              <X size={12} />
            </button>
            <img
              src={lightboxImage}
              alt="Full resolution promotional creative"
              style={{
                maxWidth: '85vw',
                maxHeight: '80vh',
                objectFit: 'contain',
                borderRadius: '6px',
                display: 'block',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
