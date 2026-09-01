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
import { FeedPost, JobPost, PostType } from '@/lib/types';
import {
  Send,
  Search,
  MessageCircle,
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
  Image as ImageIcon,
  Check,
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

  // Navigation & Search State
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
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

  // Comment & Nested Reply State
  const [expandedPostComments, setExpandedPostComments] = useState<Record<string, boolean>>({
    'post-1': true,
  });
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const [activeReplyBoxKey, setActiveReplyBoxKey] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');

  // Modals
  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(null);
  const [selectedJobModal, setSelectedJobModal] = useState<JobPost | null>(null);
  const [selectedPostDetailId, setSelectedPostDetailId] = useState<string | number | null>(null);
  const [showJobCreateModal, setShowJobCreateModal] = useState(false);
  const [reportingPost, setReportingPost] = useState<FeedPost | null>(null);
  const [reportCategory, setReportCategory] = useState<'malicious' | 'spam' | 'fraud' | 'copyright' | 'harassment' | 'misleading' | 'prohibited' | 'other'>('spam');
  const [reportDesc, setReportDesc] = useState('');

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

  // Filter posts based on tab, post type, and universal feed search
  const basePosts = activeTab === 'saved' ? posts.filter((p) => p.isSaved) : posts;

  const filteredPosts = basePosts.filter((p) => {
    // Post type filter
    if (selectedPostType !== 'all' && (p.postType || 'general') !== selectedPostType) {
      return false;
    }

    if (!feedSearch.trim()) return true;
    const q = feedSearch.toLowerCase();
    return (
      p.author.toLowerCase().includes(q) ||
      (p.authorCompany || '').toLowerCase().includes(q) ||
      p.text.toLowerCase().includes(q) ||
      (p.auctionRefId || '').toLowerCase().includes(q)
    );
  });

  const displayedPosts = showAllSearchResults || !feedSearch.trim()
    ? filteredPosts
    : filteredPosts.slice(0, 7);

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
        <div className="card" style={{ marginBottom: '12px' }}>
          <div style={{ padding: '16px 14px', textAlign: 'center', borderBottom: '1px solid var(--line)' }}>
            <div className="avatar big" style={{ margin: '0 auto 10px', width: '56px', height: '56px', fontSize: '18px' }}>
              {user.displayName.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <b style={{ fontSize: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
              {user.displayName}
              {user.hasGoldenTick && <GoldenTick />}
            </b>
            <small style={{ color: 'var(--mut)', fontSize: '11px', display: 'block', marginTop: '2px' }}>
              {user.designation}
            </small>
            <small style={{ color: 'var(--brand)', fontSize: '11.5px', fontWeight: 700, display: 'block' }}>
              {user.company}
            </small>
            <div style={{ marginTop: '8px' }}>
              <LocalTimeBadge timezone={user.timezone} />
            </div>
          </div>

          <div style={{ padding: '10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontSize: '11.5px' }}>
              <span style={{ color: 'var(--mut)' }}>My Plan</span>
              <span className={`badge ${user.plan === 'premium' ? 'amber' : 'blue'}`}>
                {user.plan.toUpperCase()}
              </span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontSize: '11.5px' }}>
              <span style={{ color: 'var(--mut)' }}>Saved Posts</span>
              <b>{posts.filter((p) => p.isSaved).length}</b>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 4px', fontSize: '11.5px' }}>
              <span style={{ color: 'var(--mut)' }}>Verification</span>
              <span className="badge green">VERIFIED</span>
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
      </aside>

      {/* CENTER COLUMN: Main Feed */}
      <main className="feed-center-rail">
        {/* Post Type Filters & Tabs */}
        <div className="feed-header-bar">
          <div className="feed-tabs">
            <button
              className={`feed-tab-btn ${activeTab === 'all' ? 'active' : ''}`}
              onClick={() => setActiveTab('all')}
            >
              All Global Feeds ({posts.length})
            </button>
            <button
              className={`feed-tab-btn ${activeTab === 'saved' ? 'active' : ''}`}
              onClick={() => setActiveTab('saved')}
            >
              <Bookmark size={12} style={{ verticalAlign: '-1px' }} /> Saved Items ({posts.filter((p) => p.isSaved).length})
            </button>
          </div>

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

        {/* Category Pills Strip */}
        <div className="feed-type-pill-strip">
          <button
            className={`feed-type-pill ${selectedPostType === 'all' ? 'active' : ''}`}
            onClick={() => setSelectedPostType('all')}
          >
            All Categories
          </button>
          <button
            className={`feed-type-pill ${selectedPostType === 'rate_info' ? 'active' : ''}`}
            onClick={() => setSelectedPostType('rate_info')}
          >
            Rate Intelligence
          </button>
          <button
            className={`feed-type-pill ${selectedPostType === 'auction_ref' ? 'active' : ''}`}
            onClick={() => setSelectedPostType('auction_ref')}
          >
            Reverse Auctions
          </button>
          <button
            className={`feed-type-pill ${selectedPostType === 'job' ? 'active' : ''}`}
            onClick={() => setSelectedPostType('job')}
          >
            Job Openings
          </button>
          <button
            className={`feed-type-pill ${selectedPostType === 'business_update' ? 'active' : ''}`}
            onClick={() => setSelectedPostType('business_update')}
          >
            Business Updates
          </button>
          <button
            className={`feed-type-pill ${selectedPostType === 'logistics_discussion' ? 'active' : ''}`}
            onClick={() => setSelectedPostType('logistics_discussion')}
          >
            Roundtables
          </button>
        </div>

        {/* Post Composer */}
        <div className="card compose-card" style={{ marginBottom: '16px', padding: '16px 18px' }}>
          <div className="compose-top">
            <div className="avatar" style={{ width: '40px', height: '40px', fontSize: '13px' }}>
              {user.displayName.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--ink)' }}>
                  Publish B2B Trade Intelligence to Global Network
                </span>
                <select
                  className="input"
                  style={{ height: '30px', fontSize: '11px', width: 'auto', padding: '0 8px' }}
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
              rows={3}
              placeholder="Share market intelligence, blank sailings alert, port operational updates, or rate trends… (Markdown supported)"
              value={postText}
              onChange={(e) => setPostText(e.target.value)}
            />
            <div className="compose-footer">
              <small style={{ color: 'var(--mut)', fontSize: '11px' }}>
                Use <code>*bold*</code>, <code>&gt; quote</code>, or bullet lists
              </small>
              <button type="submit" className="btn primary" disabled={!postText.trim()} style={{ padding: '0 16px', height: '34px' }}>
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
          displayedPosts.map((post) => {
            const isOwner = post.authorUid === user.uid;
            const isEditing = editingPostId === post.id;
            const postTypeConfig = POST_TYPE_LABELS[post.postType || 'general'] || POST_TYPE_LABELS.general;

            return (
              <article key={post.id} className="card post-card" style={{ marginBottom: '16px', padding: '20px 22px' }}>
                {/* Header */}
                <div className="post-header" style={{ marginBottom: '12px' }}>
                  <div
                    className="post-author-box"
                    onClick={() => setSelectedProfileName(post.author)}
                    title="View verified member profile"
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="avatar" style={{ width: '42px', height: '42px', fontSize: '14px' }}>
                      {post.author.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="author-name-row">
                        <span className="author-name" style={{ fontSize: '14px', fontWeight: 700 }}>{post.author}</span>
                        {post.hasGoldenTick && <GoldenTick />}
                        <span style={{ color: 'var(--faint)', fontSize: '11px' }}>· {post.time}</span>
                        <span
                          className="badge"
                          style={{
                            backgroundColor: postTypeConfig.bg,
                            color: postTypeConfig.color,
                            fontSize: '9.5px',
                            marginLeft: '6px',
                            fontWeight: 700,
                          }}
                        >
                          {postTypeConfig.label}
                        </span>
                      </div>
                      <div className="author-subtext" style={{ fontSize: '12px' }}>
                        {post.authorRole} {post.authorCompany && `· ${post.authorCompany}`}
                      </div>
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

                {/* Clean Post Action Buttons (No Like/Dislike) */}
                <div className="post-actions-bar" style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--line-light)' }}>
                  <button
                    className="action-btn"
                    onClick={() =>
                      setExpandedPostComments((prev) => ({
                        ...prev,
                        [String(post.id)]: !prev[String(post.id)],
                      }))
                    }
                  >
                    <MessageCircle size={14} />
                    <span>
                      {post.comments.length > 0 ? `${post.comments.length} Comments` : 'Comment'}
                    </span>
                  </button>
                  <button
                    className="action-btn"
                    onClick={() => setSelectedPostDetailId(post.id)}
                    title="Open full widescreen discussion and trade intel"
                    style={{ color: 'var(--brand)', fontWeight: 600 }}
                  >
                    <ExternalLink size={14} />
                    <span>Expand Intel & Discussion</span>
                  </button>
                  <button
                    className={`action-btn ${post.isSaved ? 'active' : ''}`}
                    onClick={() => savePost(post.id)}
                    title={post.isSaved ? 'Saved' : 'Save post'}
                    style={{ marginLeft: 'auto' }}
                  >
                    <Bookmark size={14} /> <span>{post.isSaved ? 'Saved' : 'Save'}</span>
                  </button>
                </div>

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
                          <div className="comment-header">
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
                          <p className="comment-text">{comment.text}</p>
                          <div className="comment-actions">
                            <button
                              className="sub-action"
                              onClick={() =>
                                setActiveReplyBoxKey(
                                  activeReplyBoxKey === comment.id ? null : comment.id
                                )
                              }
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
                                <div className="comment-header">
                                  <span
                                    className="comment-author"
                                    onClick={() => setSelectedProfileName(reply.author)}
                                  >
                                    {reply.author}
                                  </span>
                                  {reply.hasGoldenTick && <GoldenTick />}
                                  <span className="comment-time">· {reply.time}</span>
                                </div>
                                <p className="comment-text">{reply.text}</p>
                                <div className="comment-actions">
                                  <button
                                    className="sub-action"
                                    onClick={() =>
                                      setActiveReplyBoxKey(
                                        activeReplyBoxKey === reply.id ? null : reply.id
                                      )
                                    }
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
                                      <div className="comment-header">
                                        <span
                                          className="comment-author"
                                          onClick={() => setSelectedProfileName(nested.author)}
                                        >
                                          {nested.author}
                                        </span>
                                        <span className="comment-time">· {nested.time}</span>
                                      </div>
                                      <p className="comment-text">{nested.text}</p>
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
            );
          })
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
      </main>

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
                + Post (₹300)
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
              <div style={{ display: 'inline-block', padding: '4px 10px', background: '#eef6ff', color: 'var(--brand)', borderRadius: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                1 YOUR AD HERE
              </div>
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
              <div style={{ display: 'inline-block', padding: '4px 10px', background: '#eef6ff', color: 'var(--brand)', borderRadius: '20px', fontSize: '10px', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                2 YOUR AD HERE
              </div>
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
    </div>
  );
}
