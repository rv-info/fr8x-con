'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/context/DataContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useChat } from '@/lib/context/ChatContext';
import { Modal } from '@/components/ui/Modal';
import { ProfileLink } from '@/components/ui/ProfileLink';
import { ProfilePreviewModal } from '@/components/ui/ProfilePreviewModal';
import { PostDetailModal } from '@/components/ui/PostDetailModal';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { parseRichText } from '@/lib/utils';
import Image from 'next/image';
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
  Briefcase,
  ExternalLink,
  ShieldAlert,
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
  Info,
  HelpCircle,
} from 'lucide-react';

const POST_TYPE_LABELS: Record<PostType, { label: string; color: string; bg: string }> = {
  general: { label: 'General', color: '#53647a', bg: '#f1f5f9' },
  job: { label: 'Job Opening', color: '#0891b2', bg: '#e0f2fe' },
  business_update: { label: 'Business Update', color: '#7c3aed', bg: '#f3e8ff' },
  rate_info: { label: 'Rate Intelligence', color: '#059669', bg: '#e6f4ea' },
  auction_ref: { label: 'Reverse Auction', color: '#1168d7', bg: '#e8f1fd' },
  logistics_discussion: { label: 'Discussion', color: '#d97706', bg: '#fef3c7' },
  announcement: { label: 'Official Announcement', color: '#dc2626', bg: '#fee2e2' },
};

interface BookedAd {
  id: string;
  businessName: string;
  contactEmail: string;
  headline: string;
  description: string;
  destUrl: string;
  creativeUrl?: string;
  duration: string;
  cost: number;
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

const WORKSPACE_CONTACTS: WorkspaceContact[] = [
  {
    id: 'c-1',
    uid: 'u-sarah',
    name: 'Sarah Jenkins',
    role: 'Ocean Freight Lead',
    company: 'Maersk Line',
    isOnline: true,
    hasGoldenTick: true,
    email: 'sarah.j@maersk.com',
  },
  {
    id: 'c-2',
    uid: 'u-kiran',
    name: 'Capt. Kiran Rao',
    role: 'VP Line Operations',
    company: 'Hapag-Lloyd AG',
    isOnline: true,
    hasGoldenTick: true,
    email: 'kiran.rao@hapag-lloyd.com',
  },
  {
    id: 'c-3',
    uid: 'u-priya',
    name: 'Priya Nair',
    role: 'Maritime Trade Specialist',
    company: 'Nair Cargo Solutions',
    isOnline: false,
    hasGoldenTick: true,
    email: 'priya@naircargo.com',
  },
  {
    id: 'c-4',
    uid: 'u-david',
    name: 'David Chen',
    role: 'Head of Global Liner Services',
    company: 'COSCO Shipping',
    isOnline: true,
    hasGoldenTick: false,
    email: 'd.chen@cosco.com',
  },
  {
    id: 'c-5',
    uid: 'u-rajiv',
    name: 'Rajiv Mehta',
    role: 'CFS Drayage & Terminal Lead',
    company: 'Nhava Sheva Terminal',
    isOnline: true,
    hasGoldenTick: true,
    email: 'rajiv.m@nhavasheva.in',
  },
  {
    id: 'c-6',
    uid: 'u-elena',
    name: 'Elena Rostova',
    role: 'Senior Freight Broker',
    company: 'Hamburg Süd Logistics',
    isOnline: false,
    hasGoldenTick: false,
    email: 'elena.r@hamburgsud.com',
  },
];

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

const IN_FEED_COMPANY_ADS: InFeedCompanyAd[] = [
  {
    id: 'ad-comp-1',
    type: 'company',
    sponsorName: 'Sarah Jenkins',
    sponsorRole: 'Key Accounts Director',
    companyName: 'Maersk Line Direct Services',
    headline: 'Guaranteed Equipment & Zero-Rollover Priority Slots · India-Europe Directs',
    body: 'Lock in priority spot allocations for 20DV & 40HC dry containers from Nhava Sheva (INNSA) & Mundra (INMUN) to Rotterdam and Hamburg. Enjoy 21 days free detention and instant digital gate-in approval.',
    tradeLanes: ['Nhava Sheva ➔ Rotterdam', 'Mundra ➔ Hamburg', 'Pipavav ➔ Felixstowe'],
    metrics: [
      { label: 'On-Time SLA', value: '98.6%' },
      { label: 'Available TEUs', value: '140+ TEU' },
      { label: 'Equipment Guarantee', value: 'Tier-1 Priority' },
    ],
    contactUid: 'u-sarah',
    verified: true,
  },
  {
    id: 'ad-comp-2',
    type: 'company',
    sponsorName: 'Capt. Kiran Rao',
    sponsorRole: 'VP Middle East & Indian Ocean',
    companyName: 'Hapag-Lloyd Ocean Express',
    headline: 'Express Gulf & Red Sea Shuttle · 4 Days Rapid Transit to Jebel Ali',
    body: 'Daily feeder frequency with guaranteed reefer plugs and pharmaceutical cold chain certification. Competitive spot freight matrices with zero destination congestion surcharges.',
    tradeLanes: ['Mundra ➔ Jebel Ali', 'Nhava Sheva ➔ Dammam', 'Cochin ➔ Salalah'],
    metrics: [
      { label: 'Transit Time', value: '4 Days' },
      { label: 'Detention Free', value: '24 Days' },
      { label: 'Reefer Monitoring', value: '24/7 IoT' },
    ],
    contactUid: 'u-kiran',
    verified: true,
  },
];

const IN_FEED_JOB_ADS: InFeedJobAd[] = [
  {
    id: 'ad-job-1',
    type: 'job',
    jobTitle: 'Senior Ocean Freight Pricing & Trade Lead',
    companyName: 'Atlas Global Logistics Pvt. Ltd.',
    location: 'Mumbai (BKC Hub) · Hybrid',
    salaryPackage: '₹18,00,000 – ₹24,00,000 LPA + Quarterly Incentives',
    employmentType: 'Full-time',
    experience: '5–8 Years Maritime Experience',
    headline: 'Urgently Hiring: Lead containerized freight procurement across Asia-Europe lanes',
    skills: ['FCL Spot Procurement', 'Carrier Space Contracts', 'P&L Management', 'UN/LOCODE'],
    posterEmail: 'careers@atlaslogistics.com',
    contactUid: 'u-arjun',
  },
  {
    id: 'ad-job-2',
    type: 'job',
    jobTitle: 'Regional Port Operations & Demurrage Manager',
    companyName: 'Pacific Star Liner Agency',
    location: 'Mundra / Ahmedabad · On-site',
    salaryPackage: '₹14,00,000 – ₹19,00,000 LPA',
    employmentType: 'Full-time',
    experience: '4–7 Years Port/Terminal Ops',
    headline: 'High-Impact Role: Oversee container turnaround, terminal dwell time and CHA SLA delivery',
    skills: ['Port Dwell Management', 'Demurrage Mitigation', 'ICEGATE Customs', 'Terminal Liaison'],
    posterEmail: 'talent@pacificstarshipping.com',
    contactUid: 'u-michael',
  },
];

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
    <div style={{ border: '1px solid #c8e0fe', borderRadius: '8px', background: '#f0f7ff', overflow: 'hidden' }}>
      {/* Tab bar */}
      <div style={{ display: 'flex', overflowX: 'auto', borderBottom: '1px solid #c8e0fe', background: '#e8f1fd' }}>
        {AI_SUGGESTION_CATEGORIES.map((cat, i) => (
          <button
            key={cat.label}
            type="button"
            onClick={() => setActiveTab(i)}
            style={{
              padding: '6px 12px',
              fontSize: '10.5px',
              fontWeight: activeTab === i ? 700 : 500,
              color: activeTab === i ? cat.color : '#53647a',
              background: activeTab === i ? '#fff' : 'transparent',
              border: 'none',
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
        <span style={{ fontSize: '10px', color: '#53647a', alignSelf: 'center', marginRight: '2px' }}>
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
              border: `1px solid ${AI_SUGGESTION_CATEGORIES[activeTab].color}30`,
              background: '#fff',
              color: AI_SUGGESTION_CATEGORIES[activeTab].color,
              cursor: 'pointer',
              fontWeight: 500,
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = `${AI_SUGGESTION_CATEGORIES[activeTab].color}12`)}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#fff')}
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
    savePost,
    reportTarget,
    addComment,
    addReply,
    addNestedReply,
    jobs,
    addJob,
  } = useData();

  const { user } = useAuth();
  const { toast } = useToast();
  const { openChatWith } = useChat();

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

  // Comment & Nested Reply State (Deferred until explicit user click)
  const [expandedPostComments, setExpandedPostComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeReplyBoxKey, setActiveReplyBoxKey] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');

  // Post Reactions: Support, Critique, Discuss, Amplify, Send, Red Flag
  const [postReactions, setPostReactions] = useState<Record<string, {
    support: number;
    critique: number;
    amplify: number;
    isSupported: boolean;
    isCritiqued: boolean;
    isAmplified: boolean;
  }>>({
    'post-1': { support: 18, critique: 2, amplify: 7, isSupported: false, isCritiqued: false, isAmplified: false },
    'post-2': { support: 24, critique: 1, amplify: 12, isSupported: false, isCritiqued: false, isAmplified: false },
    'post-3': { support: 9, critique: 3, amplify: 4, isSupported: false, isCritiqued: false, isAmplified: false },
    'post-4': { support: 31, critique: 0, amplify: 15, isSupported: false, isCritiqued: false, isAmplified: false },
  });

  const getReactions = (postId: string | number) => {
    const key = String(postId);
    return postReactions[key] || {
      support: 8,
      critique: 1,
      amplify: 3,
      isSupported: false,
      isCritiqued: false,
      isAmplified: false,
    };
  };

  const handleToggleSupport = (postId: string | number) => {
    const key = String(postId);
    setPostReactions((prev) => {
      const current = prev[key] || { support: 8, critique: 1, amplify: 3, isSupported: false, isCritiqued: false, isAmplified: false };
      const isSupported = !current.isSupported;
      return {
        ...prev,
        [key]: {
          ...current,
          isSupported,
          support: isSupported ? current.support + 1 : Math.max(0, current.support - 1),
        },
      };
    });
  };

  const handleToggleCritique = (postId: string | number) => {
    const key = String(postId);
    setPostReactions((prev) => {
      const current = prev[key] || { support: 8, critique: 1, amplify: 3, isSupported: false, isCritiqued: false, isAmplified: false };
      const isCritiqued = !current.isCritiqued;
      return {
        ...prev,
        [key]: {
          ...current,
          isCritiqued,
          critique: isCritiqued ? current.critique + 1 : Math.max(0, current.critique - 1),
        },
      };
    });
  };

  const handleAmplify = (postId: string | number) => {
    const key = String(postId);
    setPostReactions((prev) => {
      const current = prev[key] || { support: 8, critique: 1, amplify: 3, isSupported: false, isCritiqued: false, isAmplified: false };
      const isAmplified = !current.isAmplified;
      return {
        ...prev,
        [key]: {
          ...current,
          isAmplified,
          amplify: isAmplified ? current.amplify + 1 : Math.max(0, current.amplify - 1),
        },
      };
    });
    toast('Post amplified to your enterprise freight network.');
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
            color: '#1985a1',
            fontWeight: 700,
            background: '#e0f2fe',
            borderRadius: '3px',
            cursor: 'pointer',
            border: '1px solid #c5c3c6',
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

  // Post Composer formatting tooltip state (Requirement 3)
  const [showFormattingHelp, setShowFormattingHelp] = useState(false);

  // Send Post to Contact Selection Modal state (Requirement 4)
  const [sendPostTarget, setSendPostTarget] = useState<FeedPost | null>(null);
  const [sendContactSearch, setSendContactSearch] = useState('');
  const [selectedContactUids, setSelectedContactUids] = useState<string[]>([]);
  const [sendOptionalNote, setSendOptionalNote] = useState('');

  // Left Sidebar Contacts List state (Requirement 5)
  const [contactRailSearch, setContactRailSearch] = useState('');
  const [showManageContactsModal, setShowManageContactsModal] = useState(false);

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
  const [adBusinessName, setAdBusinessName] = useState(user.company || 'Atlas Logistics Pvt. Ltd.');
  const [adContactEmail, setAdContactEmail] = useState(user.email || 'arjun@atlaslogistics.com');
  const [adHeadline, setAdHeadline] = useState('');
  const [adDescription, setAdDescription] = useState('');
  const [adDestUrl, setAdDestUrl] = useState('https://');
  const [adCreativeName, setAdCreativeName] = useState<string | null>(null);
  const [adCreativePreview, setAdCreativePreview] = useState<string | null>(null);
  const [adCampaignDuration, setAdCampaignDuration] = useState<'2days' | '10days'>('2days');

  // Booked Ads Storage (Slot 1 and Slot 2)
  const [bookedSlot1, setBookedSlot1] = useState<BookedAd | null>(null);
  const [bookedSlot2, setBookedSlot2] = useState<BookedAd | null>(null);

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
    const newAd: BookedAd = {
      id: `ad-${Date.now()}`,
      businessName: adBusinessName.trim(),
      contactEmail: adContactEmail.trim(),
      headline: adHeadline.trim(),
      description: adDescription.trim(),
      destUrl: adDestUrl.trim() || 'https://fr8x.in',
      creativeUrl: adCreativePreview || undefined,
      duration: adCampaignDuration === '2days' ? '2 days' : '10 days',
      cost: adCost,
    };

    if (activeAdSlot === 1) {
      setBookedSlot1(newAd);
    } else {
      setBookedSlot2(newAd);
    }

    setShowBookAdModal(false);
    toast(`Ad campaign for ${adBusinessName} booked successfully! Payable ₹${adCost.toLocaleString('en-IN')}`);
    setAdHeadline('');
    setAdDescription('');
    setAdCreativeName(null);
    setAdCreativePreview(null);
  };

  // Filtered Contacts for the Send Modal (Requirement 4)
  const filteredSendContacts = React.useMemo(() => {
    if (!sendContactSearch.trim()) return WORKSPACE_CONTACTS;
    const q = sendContactSearch.toLowerCase();
    return WORKSPACE_CONTACTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
    );
  }, [sendContactSearch]);

  // Filtered Contacts for the Left Rail (Requirement 5)
  const displayedRailContacts = React.useMemo(() => {
    if (!contactRailSearch.trim()) return WORKSPACE_CONTACTS;
    const q = contactRailSearch.toLowerCase();
    return WORKSPACE_CONTACTS.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
    );
  }, [contactRailSearch]);

  // 1. Two-Stage Candidate Retrieval & Personalized Hybrid Ranking
  const rankedFeedPosts = React.useMemo(() => {
    return feedRankingEngine.rankFeed(posts, {
      viewer: user,
      surface: activeSurface,
    });
  }, [posts, user, activeSurface]);

  // 2. Filter posts based on post type and universal search
  const filteredPosts = rankedFeedPosts.filter((p) => {
    if (selectedPostType !== 'all' && (p.postType || 'general') !== selectedPostType) {
      return false;
    }

    if (!feedSearch.trim()) return true;
    const q = feedSearch.toLowerCase();
    return (
      p.author.toLowerCase().includes(q) ||
      (p.authorCompany || '').toLowerCase().includes(q) ||
      p.text.toLowerCase().includes(q) ||
      (p.auctionRefId || '').toLowerCase().includes(q) ||
      (p.tradeLane || '').toLowerCase().includes(q)
    );
  });

  const displayedPosts = filteredPosts.slice(0, visiblePostCount);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) return;
    addPost(postText, composerPostType);
    setPostText('');
  };

  const handleEditSave = (postId: string | number) => {
    if (!editingPostText.trim()) return;
    editPost(postId, editingPostText);
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
    addJob({
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
    });
    setShowJobCreateModal(false);
    toast(`Job opportunity posted successfully! Paid ₹${currentJobCost.toLocaleString('en-IN')} for ${jobDurationDays} days.`);
    setNewJobTitle('');
    setNewJobReq('');
    setNewJobResp('');
    setNewJobQual('');
  };

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportingPost) return;
    reportTarget(String(reportingPost.id), 'post', reportCategory, reportDesc);
    setReportingPost(null);
    setReportDesc('');
  };

  return (
    <div className="feeds-three-col-layout">
      {/* Profile Preview Modal */}
      <ProfilePreviewModal
        isOpen={Boolean(selectedProfileName)}
        onClose={() => setSelectedProfileName(null)}
        personName={selectedProfileName || ''}
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

      {/* Book Advertisement Space Modal */}
      {showBookAdModal && (
        <Modal
          isOpen={showBookAdModal}
          onClose={() => setShowBookAdModal(false)}
          title="Book advertisement space"
          maxWidth="640px"
        >
          <form onSubmit={handleBookAdSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div className="field">
              <label>Business name <span className="req">*</span></label>
              <input
                className="input"
                placeholder="Atlas Logistics Pvt. Ltd."
                value={adBusinessName}
                onChange={(e) => setAdBusinessName(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Contact email <span className="req">*</span></label>
              <input
                className="input"
                type="email"
                placeholder="arjun@atlaslogistics.com"
                value={adContactEmail}
                onChange={(e) => setAdContactEmail(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Ad headline <span className="req">*</span></label>
              <input
                className="input"
                placeholder="e.g. Reliable FCL rates, Asia–Europe"
                value={adHeadline}
                onChange={(e) => setAdHeadline(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Ad description</label>
              <textarea
                className="input"
                rows={2}
                placeholder="Short promotional message shown with your creative…"
                value={adDescription}
                onChange={(e) => setAdDescription(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Destination URL</label>
              <input
                className="input"
                placeholder="https://yourcompany.com"
                value={adDestUrl}
                onChange={(e) => setAdDestUrl(e.target.value)}
              />
            </div>

            {/* Creative Upload Dropzone */}
            <div className="field">
              <label>Ad creative — PNG or GIF · exactly 237 × 299 px <span className="req">*</span></label>
              <div
                style={{
                  border: '2px dashed #cbd5e1',
                  borderRadius: '10px',
                  padding: '16px',
                  textAlign: 'center',
                  background: '#f8fafc',
                  position: 'relative',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="file"
                  accept="image/png, image/gif, image/jpeg"
                  onChange={handleCreativeUpload}
                  style={{
                    opacity: 0,
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    cursor: 'pointer',
                  }}
                />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <Upload size={22} color="var(--brand)" />
                  <b style={{ fontSize: '12.5px', color: 'var(--ink)' }}>Upload creative</b>
                  <small style={{ color: 'var(--mut)', fontSize: '11px' }}>237 × 299 px · PNG / GIF</small>
                  <span style={{ fontSize: '11px', color: adCreativeName ? 'var(--green)' : 'var(--faint)', fontWeight: 600 }}>
                    {adCreativeName ? `✓ ${adCreativeName}` : 'No file chosen'}
                  </span>
                </div>
              </div>
            </div>

            {/* Campaign Duration Selection */}
            <div className="field">
              <label>Campaign duration <span className="req">*</span></label>
              <div className="grid g2" style={{ gap: '10px' }}>
                <div
                  onClick={() => setAdCampaignDuration('2days')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: adCampaignDuration === '2days' ? '2px solid var(--brand)' : '1px solid var(--line)',
                    background: adCampaignDuration === '2days' ? '#f0f7ff' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <b style={{ fontSize: '15px', color: 'var(--brand)', display: 'block' }}>₹1,000</b>
                  <span style={{ fontSize: '12px', color: 'var(--ink)', fontWeight: 600 }}>2 days</span>
                </div>

                <div
                  onClick={() => setAdCampaignDuration('10days')}
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: adCampaignDuration === '10days' ? '2px solid var(--brand)' : '1px solid var(--line)',
                    background: adCampaignDuration === '10days' ? '#f0f7ff' : '#ffffff',
                    cursor: 'pointer',
                    textAlign: 'center',
                  }}
                >
                  <b style={{ fontSize: '15px', color: 'var(--brand)', display: 'block' }}>₹5,000</b>
                  <span style={{ fontSize: '12px', color: 'var(--ink)', fontWeight: 600 }}>10 days</span>
                </div>
              </div>
            </div>

            {/* Total Payable Summary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line)' }}>
              <span style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--ink)' }}>Total payable (INR)</span>
              <b style={{ fontSize: '18px', color: 'var(--brand)' }}>₹{adCost.toLocaleString('en-IN')}</b>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setShowBookAdModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Pay & publish ad
              </button>
            </div>
          </form>
        </Modal>
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

      {/* Job Details Modal */}
      {selectedJobModal && (
        <Modal
          isOpen={Boolean(selectedJobModal)}
          onClose={() => setSelectedJobModal(null)}
          title={selectedJobModal.title}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <b style={{ fontSize: '14px', color: 'var(--ink)' }}>{selectedJobModal.company}</b>
                <span style={{ display: 'block', fontSize: '11px', color: 'var(--mut)' }}>
                  {selectedJobModal.location} · {selectedJobModal.employmentType}
                </span>
              </div>
              <span className="badge blue">{selectedJobModal.packageDetails}</span>
            </div>

            <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '7px', fontSize: '12px' }}>
              <b>Requirements:</b>
              <p style={{ margin: '4px 0 0', color: 'var(--ink-secondary)', whiteSpace: 'pre-line' }}>
                {selectedJobModal.requirements}
              </p>
            </div>

            {selectedJobModal.responsibilities && (
              <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '7px', fontSize: '12px' }}>
                <b>Responsibilities:</b>
                <p style={{ margin: '4px 0 0', color: 'var(--ink-secondary)', whiteSpace: 'pre-line' }}>
                  {selectedJobModal.responsibilities}
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
              <div style={{ fontSize: '11px', color: 'var(--mut)' }}>
                Posted by <b>{selectedJobModal.postedBy}</b> on {selectedJobModal.postedDate}
              </div>
              <div style={{ display: 'flex', gap: '6px' }}>
                <button
                  className="btn primary sm"
                  onClick={() => {
                    openChatWith(selectedJobModal.posterUid || 'u-sarah', {
                      type: 'job',
                      id: selectedJobModal.id,
                      title: selectedJobModal.title,
                    });
                    setSelectedJobModal(null);
                  }}
                >
                  <MessageCircle size={12} /> Contact Poster
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Post a Job Opportunity Modal with Transparent Payment Pricing */}
      {showJobCreateModal && (
        <Modal
          isOpen={showJobCreateModal}
          onClose={() => setShowJobCreateModal(false)}
          title="Post a Trade Career Opportunity"
          maxWidth="680px"
        >
          <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="grid g2">
              <div className="field">
                <label>Job Title <span className="req">*</span></label>
                <input
                  className="input"
                  placeholder="e.g. Ocean Freight Procurement Manager"
                  value={newJobTitle}
                  onChange={(e) => setNewJobTitle(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label>Hiring Company</label>
                <input
                  className="input"
                  value={newJobCompany}
                  onChange={(e) => setNewJobCompany(e.target.value)}
                />
              </div>
            </div>

            <div className="grid g3">
              <div className="field">
                <label>Location</label>
                <input
                  className="input"
                  value={newJobLocation}
                  onChange={(e) => setNewJobLocation(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Employment Type</label>
                <select
                  className="input"
                  value={newJobType}
                  onChange={(e) => setNewJobType(e.target.value)}
                >
                  <option>Full-time</option>
                  <option>Part-time</option>
                  <option>Contract</option>
                  <option>Freelance</option>
                </select>
              </div>
              <div className="field">
                <label>Experience Level</label>
                <input
                  className="input"
                  placeholder="e.g. 3–5 yrs"
                  value={newJobExp}
                  onChange={(e) => setNewJobExp(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label>Compensation / Package</label>
              <input
                className="input"
                placeholder="e.g. ₹12–18 LPA or Negotiable"
                value={newJobPkg}
                onChange={(e) => setNewJobPkg(e.target.value)}
              />
            </div>

            <div className="field">
              <label>Core Requirements <span className="req">*</span></label>
              <textarea
                className="input"
                rows={3}
                placeholder="List container shipping experience, lane knowledge, ERP tools…"
                value={newJobReq}
                onChange={(e) => setNewJobReq(e.target.value)}
                required
              />
              {/* AI Suggestion Chips — All Categories as tabs */}
              <div style={{ marginTop: '8px' }}>
                <AiJobSuggestions onAppend={(text) => setNewJobReq((prev) => (prev ? prev + '\n' + text : text))} />
              </div>
            </div>

            {/* Transparent Job Posting Fee & Duration Matrix */}
            <div style={{ background: '#f8fafc', border: '1px solid #c8e0fe', borderRadius: '8px', padding: '12px 14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <b style={{ fontSize: '12px', color: 'var(--brand)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <DollarSign size={13} /> Job Listing Tariff & Duration
                </b>
                <span style={{ fontSize: '11px', color: 'var(--mut)' }}>
                  ₹300 for 2 days · ₹180/day thereafter
                </span>
              </div>

              <div className="grid g4" style={{ gap: '8px' }}>
                {[
                  { days: 2, label: '2 Days (Min)', cost: 300 },
                  { days: 7, label: '7 Days', cost: 1200 },
                  { days: 15, label: '15 Days', cost: 2640 },
                  { days: 30, label: '30 Days', cost: 5340 },
                ].map((tier) => (
                  <div
                    key={tier.days}
                    onClick={() => setJobDurationDays(tier.days)}
                    style={{
                      padding: '8px 10px',
                      borderRadius: '6px',
                      border: jobDurationDays === tier.days ? '2px solid var(--brand)' : '1px solid var(--line)',
                      background: jobDurationDays === tier.days ? '#eef6ff' : '#ffffff',
                      cursor: 'pointer',
                      textAlign: 'center',
                    }}
                  >
                    <b style={{ fontSize: '13px', color: 'var(--ink)', display: 'block' }}>₹{tier.cost.toLocaleString('en-IN')}</b>
                    <small style={{ fontSize: '10px', color: 'var(--mut)' }}>{tier.label}</small>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line-light)', paddingTop: '8px' }}>
                <label style={{ fontSize: '11.5px', color: 'var(--ink-secondary)', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={autoRenewJob}
                    onChange={(e) => setAutoRenewJob(e.target.checked)}
                  />
                  Auto-renew listing at ₹180/day thereafter till revoked
                </label>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '10px', color: 'var(--mut)', display: 'block' }}>TOTAL PAYABLE</span>
                  <b style={{ fontSize: '16px', color: 'var(--brand)' }}>₹{currentJobCost.toLocaleString('en-IN')}</b>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setShowJobCreateModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Post
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* LEFT COLUMN: Identity & Quick Shortcuts */}
      <aside className="feed-left-rail">
        <div className="card" style={{ marginBottom: '12px', border: '1px solid var(--fr8x-outline)' }}>
          <div style={{ padding: '16px 14px', textAlign: 'center', borderBottom: '1px solid var(--fr8x-outline)', background: 'var(--fr8x-background)' }}>
            <div className="avatar big borderless" style={{ margin: '0 auto 10px', width: '74px', height: '74px', padding: 0, overflow: 'hidden', background: '#f1f5f9', border: '2px solid var(--fr8x-outline, #cbd5e1)', borderRadius: '50%', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <img src="/profile-avatar.png" alt={user.displayName} className="profile-img-avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
            <b style={{ fontSize: '13.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px', color: 'var(--fr8x-text)' }}>
              {user.displayName}
              {user.hasGoldenTick && <GoldenTick size={14} />}
            </b>
            <small style={{ color: 'var(--fr8x-muted)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
              {user.designation}
            </small>
            <small style={{ color: 'var(--fr8x-text)', fontSize: '11.5px', fontWeight: 700, display: 'block' }}>
              {user.company}
            </small>
            <div style={{ marginTop: '8px' }}>
              <LocalTimeBadge timezone={user.timezone} />
            </div>
          </div>

          <div style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontSize: '11.5px', color: 'var(--fr8x-text)' }}>
              <span style={{ color: 'var(--fr8x-muted)' }}>My Plan</span>
              <span className="badge">
                {user.plan.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontSize: '11.5px', color: 'var(--fr8x-text)' }}>
              <span style={{ color: 'var(--fr8x-muted)' }}>Saved Posts</span>
              <b>{posts.filter((p) => p.isSaved).length}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontSize: '11.5px', color: 'var(--fr8x-text)' }}>
              <span style={{ color: 'var(--fr8x-muted)' }}>Verification</span>
              <span className="badge">VERIFIED</span>
            </div>
          </div>

          {/* Contact Details & Direct Contact Action below profile */}
          <div style={{ padding: '10px 12px 14px', borderTop: '1px solid var(--fr8x-outline)', display: 'flex', flexDirection: 'column', gap: '8px', background: '#fafbfc' }}>
            <div style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--fr8x-muted)', textTransform: 'uppercase', letterSpacing: '0.4px' }}>
              Contact &amp; Trade Connect
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--fr8x-text)' }}>
              <Mail size={12} style={{ flexShrink: 0, color: 'var(--fr8x-text)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={user.email}>
                {user.email}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '11px', color: 'var(--fr8x-text)' }}>
              <PhoneCall size={12} style={{ flexShrink: 0, color: '#16a34a' }} />
              <span>{user.mobile || '+91 98111 22334'}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '10.5px', color: 'var(--fr8x-muted)' }}>
              <MapPin size={12} style={{ flexShrink: 0, color: 'var(--fr8x-muted)' }} />
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.formattedAddress || (user.city && user.country ? `${user.city}, ${user.country}` : 'JNPT Nhava Sheva Terminal')}
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', marginTop: '4px' }}>
              <button
                className="btn primary sm"
                style={{ flex: 1, justifyContent: 'center', fontSize: '11px', height: '28px', background: 'var(--fr8x-outline)', borderRadius: '0px' }}
                onClick={() => setSelectedProfileName(user.displayName)}
              >
                <UserCheck size={12} /> Contact Profile
              </button>
              <a
                href={`mailto:${user.email}`}
                className="btn secondary sm"
                style={{ padding: '0 8px', height: '28px', borderRadius: '0px' }}
                title="Send Email"
              >
                <Mail size={12} />
              </a>
            </div>
          </div>
        </div>

        {/* Quick Navigation Shortcuts */}
        <div className="card">
          <div className="cardhead" style={{ fontSize: '12px' }}>
            <b>Quick Shortcuts</b>
          </div>
          <div style={{ padding: '6px' }}>
            <Link href="/auctions/create" className="feed-shortcut-link">
              <Gavel size={15} color="var(--brand)" />
              <span>Create Reverse Auction</span>
            </Link>
            <Link href="/rates" className="feed-shortcut-link">
              <TrendingUp size={15} color="var(--teal)" />
              <span>Rate Intelligence</span>
            </Link>
            <Link href="/jobs" className="feed-shortcut-link">
              <Briefcase size={15} color="#0891b2" />
              <span>Trade Careers</span>
            </Link>
            <button
              onClick={() => setShowJobCreateModal(true)}
              className="feed-shortcut-link"
              style={{ width: '100%', background: 'none', border: 'none', textAlign: 'left', cursor: 'pointer' }}
            >
              <Plus size={15} color="var(--brand)" />
              <span>Post a Job</span>
            </button>
            <Link href="/nexus" className="feed-shortcut-link">
              <ShieldAlert size={15} color="#d97706" />
              <span>Compliance & Blacklist</span>
            </Link>
          </div>
        </div>

        {/* Added Contacts List (Requirement 5) */}
        <div className="card" style={{ marginTop: '12px', border: '1px solid var(--fr8x-outline)' }}>
          <div className="cardhead" style={{ fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <b style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--fr8x-text)' }}>
              <UserCheck size={13} color="var(--brand)" /> Added Contacts
            </b>
            <span className="badge" style={{ fontSize: '9.5px', fontWeight: 700 }}>
              {WORKSPACE_CONTACTS.length} Added
            </span>
          </div>
          <div style={{ padding: '8px' }}>
            {/* Filter contacts input */}
            <div style={{ position: 'relative', marginBottom: '8px' }}>
              <Search size={11} style={{ position: 'absolute', left: '8px', top: '8px', color: 'var(--fr8x-muted)' }} />
              <input
                type="text"
                placeholder="Filter contacts..."
                value={contactRailSearch}
                onChange={(e) => setContactRailSearch(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '5px 6px 5px 24px',
                  fontSize: '11px',
                  borderRadius: '5px',
                  border: '1px solid var(--fr8x-outline, #cbd5e1)',
                  background: '#f8fafc',
                  color: 'var(--fr8x-text)',
                }}
              />
            </div>

            {/* Scrollable list of verified trade contacts */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', maxHeight: '260px', overflowY: 'auto' }}>
              {displayedRailContacts.map((contact) => (
                <div
                  key={contact.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    borderRadius: '5px',
                    border: '1px solid var(--fr8x-outline, #e2e8f0)',
                    background: '#ffffff',
                  }}
                >
                  <div style={{ position: 'relative', flexShrink: 0 }}>
                    <div className="avatar" style={{ width: '28px', height: '28px', padding: 0, overflow: 'hidden' }}>
                      <img src="/profile-avatar.png" alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
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
                          border: '1.5px solid #ffffff',
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
                          color: 'var(--fr8x-text)',
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
                        color: 'var(--fr8x-muted)',
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
                      background: '#f1f5f9',
                      border: '1px solid var(--fr8x-outline, #cbd5e1)',
                      borderRadius: '4px',
                      padding: '3px 5px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      color: 'var(--brand)',
                    }}
                  >
                    <MessageCircle size={11} />
                  </button>
                </div>
              ))}
            </div>

            {/* View All & Manage Contacts trigger */}
            <div style={{ marginTop: '8px', borderTop: '1px solid var(--fr8x-outline, #e2e8f0)', paddingTop: '6px' }}>
              <button
                type="button"
                onClick={() => setShowManageContactsModal(true)}
                className="btn secondary sm"
                style={{ width: '100%', justifyContent: 'center', fontSize: '10.5px' }}
              >
                View All &amp; Manage Contacts
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
              className={`feed-tab-btn ${activeSurface === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveSurface('saved')}
            >
              <Bookmark size={12} style={{ verticalAlign: '-1px' }} /> Saved ({posts.filter((p) => p.isSaved).length})
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
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
                border: '1px solid var(--fr8x-outline, #cbd5e1)',
                background: '#ffffff',
                color: 'var(--fr8x-text)',
                cursor: 'pointer',
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
            <div className="avatar" style={{ width: '36px', height: '36px', padding: 0, overflow: 'hidden' }}>
              <img src="/profile-avatar.png" alt={user.displayName} className="profile-img-avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
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
            <textarea
              className="compose-textarea"
              rows={2}
              placeholder="Share market intelligence, blank sailings alert, port operational updates, or rate trends… (Markdown supported)"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
              style={{ minHeight: '60px', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid var(--fr8x-outline)' }}
            />
            <div className="compose-footer" style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              {/* Information / Supported Markdown Formatting Guide Tooltip (Requirement 3) */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => setShowFormattingHelp(!showFormattingHelp)}
                  onMouseEnter={() => setShowFormattingHelp(true)}
                  className="btn secondary sm"
                  style={{ width: '28px', height: '28px', padding: 0, justifyContent: 'center', borderRadius: '6px', color: 'var(--fr8x-muted)' }}
                  title="Markdown Formatting Guide"
                >
                  <Info size={14} />
                </button>

                {showFormattingHelp && (
                  <div
                    onMouseLeave={() => setShowFormattingHelp(false)}
                    style={{
                      position: 'absolute',
                      bottom: '100%',
                      right: 0,
                      marginBottom: '8px',
                      width: '280px',
                      background: '#ffffff',
                      border: '1px solid var(--fr8x-outline, #cbd5e1)',
                      borderRadius: '8px',
                      padding: '12px 14px',
                      boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.15)',
                      zIndex: 50,
                      fontSize: '11.5px',
                      color: 'var(--fr8x-text)',
                      textAlign: 'left',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', borderBottom: '1px solid var(--fr8x-outline, #e2e8f0)', paddingBottom: '5px' }}>
                      <b style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <Sparkles size={12} color="var(--brand)" /> Formatting Guide
                      </b>
                      <button
                        type="button"
                        onClick={() => setShowFormattingHelp(false)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--fr8x-muted)', fontSize: '12px' }}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <code style={{ color: '#0369a1', background: '#f0f9ff', padding: '1px 5px', borderRadius: '3px' }}>**bold**</code>
                        <span><b>Bold text</b></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <code style={{ color: '#0369a1', background: '#f0f9ff', padding: '1px 5px', borderRadius: '3px' }}>*italic*</code>
                        <span><i>Italic text</i></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <code style={{ color: '#0369a1', background: '#f0f9ff', padding: '1px 5px', borderRadius: '3px' }}>[title](url)</code>
                        <span style={{ color: '#0284c7', textDecoration: 'underline' }}>Clickable link</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <code style={{ color: '#0369a1', background: '#f0f9ff', padding: '1px 5px', borderRadius: '3px' }}>- item</code>
                        <span>• Bulleted list</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <code style={{ color: '#0369a1', background: '#f0f9ff', padding: '1px 5px', borderRadius: '3px' }}>&gt; quote</code>
                        <span style={{ color: '#64748b', fontStyle: 'italic' }}>Blockquote</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <code style={{ color: '#0369a1', background: '#f0f9ff', padding: '1px 5px', borderRadius: '3px' }}>(#Name)</code>
                        <span style={{ color: '#0891b2', fontWeight: 600 }}>@Mention contact</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button type="submit" className="btn primary" disabled={!postText.trim()} style={{ padding: '0 16px', height: '32px' }}>
                <Send size={13} /> Post Update
              </button>
            </div>
          </form>
        </div>

        {/* Post Items in Large Spacious Cards (No Like/Dislike) */}
        {displayedPosts.length === 0 ? (
          <div className="card" style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--mut)' }}>
            <MessageCircle size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <b style={{ fontSize: '15px' }}>No posts found matching criteria</b>
            <p style={{ fontSize: '12px', marginTop: '4px' }}>
              Try adjusting your search query or category filters.
            </p>
          </div>
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
                    <div className="avatar" style={{ width: '38px', height: '38px', padding: 0, overflow: 'hidden', position: 'relative' }}>
                      <Image src={post.authorPhotoUrl || "/profile-avatar.png"} alt={post.author} width={38} height={38} className="profile-img-avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
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
                        {(isOwner || user.role === 'super_admin') && (
                          <button
                            className="danger"
                            onClick={() => {
                              deletePost(post.id);
                              setOpenMenuPostId(null);
                            }}
                          >
                            <Trash2 size={13} /> Delete Post
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
                    <textarea
                      className="input"
                      rows={4}
                      value={editingPostText}
                      onChange={(e) => setEditingPostText(e.target.value)}
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
                  const reactions = getReactions(post.id);
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
                          <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <div className="avatar" style={{ width: '22px', height: '22px', padding: 0, overflow: 'hidden' }}>
                              <img src="/profile-avatar.png" alt={comment.author} className="profile-img-avatar" style={{ width: '100%', height: '100%' }} />
                            </div>
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
                                <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                  <div className="avatar" style={{ width: '20px', height: '20px', padding: 0, overflow: 'hidden' }}>
                                    <img src="/profile-avatar.png" alt={reply.author} className="profile-img-avatar" style={{ width: '100%', height: '100%' }} />
                                  </div>
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
                                      <div className="comment-header" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <div className="avatar" style={{ width: '18px', height: '18px', padding: 0, overflow: 'hidden' }}>
                                          <img src="/profile-avatar.png" alt={nested.author} className="profile-img-avatar" style={{ width: '100%', height: '100%' }} />
                                        </div>
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
                  const companyAd = IN_FEED_COMPANY_ADS[adIndex % IN_FEED_COMPANY_ADS.length];
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
                        background: 'linear-gradient(135deg, #f0f9ff 0%, #ffffff 60%, #e0f2fe 100%)',
                        border: '1.5px solid #0284c7',
                        borderRadius: '10px',
                        boxShadow: '0 4px 14px rgba(2, 132, 199, 0.12)',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              background: '#0284c7',
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
                          <span style={{ fontSize: '10.5px', color: '#0369a1', fontWeight: 600 }}>
                            ✦ Verified Freight Enterprise
                          </span>
                        </div>
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          Ad · Direct Liner Placement
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '8px',
                            background: 'linear-gradient(135deg, #0369a1 0%, #0284c7 100%)',
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
                            <b style={{ fontSize: '13.5px', color: '#0f172a' }}>{adCompany}</b>
                            <GoldenTick size={14} />
                          </div>
                          <div style={{ fontSize: '11px', color: '#64748b' }}>
                            {companyAd.sponsorName} · {companyAd.sponsorRole}
                          </div>
                        </div>
                      </div>

                      <b style={{ display: 'block', fontSize: '13px', color: '#0f172a', marginBottom: '5px', lineHeight: 1.35 }}>
                        {adTitle}
                      </b>
                      <p style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.45, marginBottom: '10px' }}>
                        {adBody}
                      </p>

                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' }}>
                        {companyAd.tradeLanes.map((lane) => (
                          <span
                            key={lane}
                            style={{
                              background: '#e0f2fe',
                              color: '#0369a1',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid #bae6fd',
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
                          background: 'rgba(255, 255, 255, 0.9)',
                          border: '1px solid #bae6fd',
                          borderRadius: '6px',
                          padding: '8px 10px',
                          marginBottom: '12px',
                          textAlign: 'center',
                        }}
                      >
                        {companyAd.metrics.map((m) => (
                          <div key={m.label}>
                            <div style={{ fontSize: '12px', fontWeight: 800, color: '#0284c7' }}>{m.value}</div>
                            <div style={{ fontSize: '9px', color: '#64748b', marginTop: '1px' }}>{m.label}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn primary sm"
                          style={{
                            background: '#0284c7',
                            borderColor: '#0284c7',
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
                  const jobAd = IN_FEED_JOB_ADS[adIndex % IN_FEED_JOB_ADS.length];
                  return (
                    <div
                      key={`ad-job-${postIndex}`}
                      className="card in-feed-ad-card"
                      style={{
                        marginBottom: '16px',
                        padding: '16px 18px',
                        background: 'linear-gradient(135deg, #fff7ed 0%, #ffffff 60%, #ffedd5 100%)',
                        border: '1.5px solid #f97316',
                        borderRadius: '10px',
                        boxShadow: '0 4px 14px rgba(249, 115, 22, 0.12)',
                        position: 'relative',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              background: '#f97316',
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
                        <span style={{ fontSize: '10px', color: '#64748b' }}>
                          Ad · Verified Employer
                        </span>
                      </div>

                      <div style={{ marginBottom: '6px' }}>
                        <b style={{ fontSize: '13.5px', color: '#0f172a', display: 'block' }}>{jobAd.jobTitle}</b>
                        <div style={{ fontSize: '11px', color: '#475569', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                          <b>{jobAd.companyName}</b>
                          <span>·</span>
                          <span>{jobAd.location}</span>
                          <span>·</span>
                          <span className="badge green" style={{ fontSize: '9px', padding: '1px 5px' }}>{jobAd.employmentType}</span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', margin: '8px 0', flexWrap: 'wrap' }}>
                        <span style={{ background: '#ecfdf5', border: '1px solid #a7f3d0', color: '#059669', fontSize: '11px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px' }}>
                          💰 {jobAd.salaryPackage}
                        </span>
                        <span style={{ background: '#f1f5f9', color: '#475569', fontSize: '10.5px', fontWeight: 600, padding: '3px 8px', borderRadius: '4px' }}>
                          ⏳ {jobAd.experience}
                        </span>
                      </div>

                      <p style={{ fontSize: '11.5px', color: '#334155', lineHeight: 1.45, marginBottom: '8px' }}>
                        {jobAd.headline}
                      </p>

                      <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '12px' }}>
                        {jobAd.skills.map((skill) => (
                          <span
                            key={skill}
                            style={{
                              background: '#ffedd5',
                              color: '#c2410c',
                              fontSize: '10px',
                              fontWeight: 600,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              border: '1px solid #fed7aa',
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
                            background: '#f97316',
                            borderColor: '#f97316',
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
        <div className="card side-card">
          <div className="side-card-header">
            <b>Trade Careers & Jobs</b>
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                className="btn primary sm"
                style={{ padding: '2px 8px', fontSize: '10px' }}
                onClick={() => setShowJobCreateModal(true)}
              >
                + Post
              </button>
              <Link href="/jobs" className="btn secondary sm">
                View All
              </Link>
            </div>
          </div>
          <div className="job-list">
            {jobs.slice(0, 3).map((job) => (
              <div
                key={job.id}
                className="job-item"
                onClick={() => setSelectedJobModal(job)}
                style={{ cursor: 'pointer' }}
              >
                <div className="job-top">
                  <b className="job-title">{job.title}</b>
                </div>
                <span className="job-company">{job.company}</span>
                <div className="job-meta">
                  <span>{job.location}</span> · <span>{job.employmentType}</span>
                </div>
                <div className="job-footer">
                  <span className="job-pkg">{job.packageDetails}</span>
                  <button className="btn secondary sm" style={{ padding: '2px 8px', fontSize: '10px' }}>
                    Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Slot 1: YOUR AD HERE */}
        <div className="card side-card" style={{ background: '#ffffff', border: '1px solid var(--line)' }}>
          {bookedSlot1 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '12px', color: 'var(--brand)' }}>{bookedSlot1.businessName}</b>
                <span className="badge amber" style={{ fontSize: '8px' }}>SPONSORED</span>
              </div>
              <b style={{ fontSize: '12.5px', color: 'var(--ink)' }}>{bookedSlot1.headline}</b>
              {bookedSlot1.description && (
                <p style={{ fontSize: '11px', color: 'var(--ink-secondary)', margin: 0 }}>
                  {bookedSlot1.description}
                </p>
              )}
              {bookedSlot1.creativeUrl && (
                <img
                  src={bookedSlot1.creativeUrl}
                  alt="Ad Creative"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '6px' }}
                />
              )}
              <a
                href={bookedSlot1.destUrl}
                target="_blank"
                rel="noreferrer"
                className="btn primary sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
              >
                Visit Sponsor <ExternalLink size={11} />
              </a>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 6px', color: 'var(--ink)' }}>
                Promote your business with us
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--ink-secondary)', margin: '0 0 12px', lineHeight: 1.45 }}>
                Advertise your company · Reach more customers · Grow your business
              </p>
              <button
                className="btn primary sm"
                style={{ width: '100%', justifyContent: 'center', height: '32px' }}
                onClick={() => {
                  setActiveAdSlot(1);
                  setShowBookAdModal(true);
                }}
              >
                Book ad space
              </button>
            </div>
          )}
        </div>

        {/* Slot 2: YOUR AD HERE */}
        <div className="card side-card" style={{ background: '#ffffff', border: '1px solid var(--line)' }}>
          {bookedSlot2 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <b style={{ fontSize: '12px', color: 'var(--brand)' }}>{bookedSlot2.businessName}</b>
                <span className="badge amber" style={{ fontSize: '8px' }}>SPONSORED</span>
              </div>
              <b style={{ fontSize: '12.5px', color: 'var(--ink)' }}>{bookedSlot2.headline}</b>
              {bookedSlot2.description && (
                <p style={{ fontSize: '11px', color: 'var(--ink-secondary)', margin: 0 }}>
                  {bookedSlot2.description}
                </p>
              )}
              {bookedSlot2.creativeUrl && (
                <img
                  src={bookedSlot2.creativeUrl}
                  alt="Ad Creative"
                  style={{ width: '100%', maxHeight: '200px', objectFit: 'cover', borderRadius: '6px' }}
                />
              )}
              <a
                href={bookedSlot2.destUrl}
                target="_blank"
                rel="noreferrer"
                className="btn primary sm"
                style={{ width: '100%', justifyContent: 'center', marginTop: '4px' }}
              >
                Visit Sponsor <ExternalLink size={11} />
              </a>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '16px 12px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 800, margin: '0 0 6px', color: 'var(--ink)' }}>
                Promote your business with us
              </h3>
              <p style={{ fontSize: '11.5px', color: 'var(--ink-secondary)', margin: '0 0 12px', lineHeight: 1.45 }}>
                Advertise your company · Reach more customers · Grow your business
              </p>
              <button
                className="btn primary sm"
                style={{ width: '100%', justifyContent: 'center', height: '32px' }}
                onClick={() => {
                  setActiveAdSlot(2);
                  setShowBookAdModal(true);
                }}
              >
                Book ad space
              </button>
            </div>
          )}
        </div>
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
                background: '#f8fafc',
                border: '1px solid var(--fr8x-outline, #cbd5e1)',
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
              <div style={{ position: 'relative' }}>
                <Search size={13} style={{ position: 'absolute', left: '10px', top: '10px', color: 'var(--fr8x-muted)' }} />
                <input
                  type="text"
                  placeholder="🔍 Search contacts..."
                  value={sendContactSearch}
                  onChange={(e) => setSendContactSearch(e.target.value)}
                  style={{
                    width: '100%',
                    boxSizing: 'border-box',
                    padding: '6px 10px 6px 30px',
                    fontSize: '12px',
                    borderRadius: '6px',
                    border: '1px solid var(--fr8x-outline, #cbd5e1)',
                    background: '#ffffff',
                    color: 'var(--fr8x-text)',
                  }}
                />
              </div>
            </div>

            {/* Checkable contact list */}
            <div
              style={{
                border: '1px solid var(--fr8x-outline, #cbd5e1)',
                borderRadius: '6px',
                maxHeight: '200px',
                overflowY: 'auto',
                padding: '4px',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
                background: '#ffffff',
              }}
            >
              {filteredSendContacts.length === 0 ? (
                <div style={{ padding: '14px', textAlign: 'center', color: 'var(--fr8x-muted)', fontSize: '11.5px' }}>
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
                        background: isSelected ? '#f0f9ff' : 'transparent',
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
                      <div className="avatar" style={{ width: '26px', height: '26px', padding: 0, overflow: 'hidden', flexShrink: 0 }}>
                        <img src="/profile-avatar.png" alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
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
          title="Enterprise Network Contacts"
          maxWidth="560px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <p style={{ fontSize: '12px', color: 'var(--fr8x-muted)', margin: 0 }}>
              Manage your verified enterprise freight partners and direct contacts across shipping lines, forwarders, and logistics operators.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '340px', overflowY: 'auto' }}>
              {WORKSPACE_CONTACTS.map((contact) => (
                <div
                  key={contact.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 10px',
                    borderRadius: '6px',
                    border: '1px solid var(--fr8x-outline, #e2e8f0)',
                    background: '#ffffff',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{ position: 'relative' }}>
                      <div className="avatar" style={{ width: '34px', height: '34px', padding: 0, overflow: 'hidden' }}>
                        <img src="/profile-avatar.png" alt={contact.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                      {contact.isOnline && (
                        <span
                          style={{
                            position: 'absolute',
                            bottom: 0,
                            right: 0,
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            background: '#16a34a',
                            border: '1.5px solid #ffffff',
                          }}
                          title="Online"
                        />
                      )}
                    </div>
                    <div>
                      <b
                        onClick={() => {
                          setShowManageContactsModal(false);
                          setSelectedProfileName(contact.name);
                        }}
                        style={{ fontSize: '12.5px', color: 'var(--fr8x-text)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                      >
                        {contact.name}
                        {contact.hasGoldenTick && <GoldenTick size={12} />}
                      </b>
                      <small style={{ color: 'var(--fr8x-muted)', fontSize: '11px', display: 'block' }}>
                        {contact.role} · <span style={{ fontWeight: 600, color: 'var(--fr8x-text)' }}>{contact.company}</span>
                      </small>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button
                      type="button"
                      className="btn secondary sm"
                      onClick={() => {
                        setShowManageContactsModal(false);
                        setSelectedProfileName(contact.name);
                      }}
                      style={{ fontSize: '10.5px' }}
                    >
                      Profile
                    </button>
                    <button
                      type="button"
                      className="btn primary sm"
                      onClick={() => {
                        setShowManageContactsModal(false);
                        openChatWith(contact.uid, { type: 'company', id: contact.id, title: `Chat with ${contact.name}` });
                      }}
                      style={{ fontSize: '10.5px' }}
                    >
                      <MessageCircle size={11} /> Chat
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '6px' }}>
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
    </div>
  );
}
