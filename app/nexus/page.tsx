'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ProfileLink } from '@/components/ui/ProfileLink';
import { ProfilePreviewModal } from '@/components/ui/ProfilePreviewModal';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { NexusTopic, CompanyReview, BlacklistCase, PostReport } from '@/lib/types';
import {
  MessagesSquare,
  Star,
  ShieldAlert,
  Plus,
  Search,
  Building2,
  MessageCircle,
  ShieldCheck,
  AlertTriangle,
  FileText,
  Clock,
  Sparkles,
  Send,
  CheckCircle2,
  HelpCircle,
  Layers,
  MapPin,
  Tag,
  ThumbsUp,
  ThumbsDown,
  Flag,
  DollarSign,
  Scale,
  FileCheck,
  AlertCircle,
  ExternalLink,
  Maximize2,
  Minimize2,
  Edit3,
  Trash2,
  Check,
  XCircle,
  Loader2,
} from 'lucide-react';

export default function NexusPage() {
  const {
    topics,
    addTopic,
    updateTopic,
    deleteTopic,
    addTopicReply,
    deleteTopicReply,
    reactTopic,
    reactTopicReply,
    reportTarget,
    reviews,
    addReview,
    updateReviewRemark,
    reactReviewRemark,
    cases,
    addCase,
    agreeCase,
    disputeCase,
    masterCarriers,
  } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  // 3 Clean Tabs as specified in V11+ Architecture
  const [activeTab, setActiveTab] = useState<'community' | 'reviews' | 'blacklist'>('community');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals & Discussion Form (Full-Screen CRUD)
  const [selectedTopic, setSelectedTopic] = useState<NexusTopic | null>(null);
  const [isTopicFullScreen, setIsTopicFullScreen] = useState(true);
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [editTopicTitle, setEditTopicTitle] = useState('');
  const [editTopicCategory, setEditTopicCategory] = useState('');
  const [editTopicBody, setEditTopicBody] = useState('');

  const [topicReplyText, setTopicReplyText] = useState('');
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [isNewTopicFullScreen, setIsNewTopicFullScreen] = useState(true);
  const [newTopicSubject, setNewTopicSubject] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('Routing Strategy');
  const [newTopicBody, setNewTopicBody] = useState('');

  // Report Modal State (Requirement 11: Render in clear foreground)
  const [reportModalTarget, setReportModalTarget] = useState<{
    id: string;
    type: PostReport['targetType'];
    title: string;
    topic?: NexusTopic;
  } | null>(null);
  const [reportCategory, setReportCategory] = useState<PostReport['category']>('spam');
  const [reportDescription, setReportDescription] = useState('');
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);

  // Blacklist Case Dossier Modal State (Requirement 9)
  const [selectedCaseDossier, setSelectedCaseDossier] = useState<BlacklistCase | null>(null);

  // Blacklist Dispute Modal State (Requirement 9)
  const [disputeModalTarget, setDisputeModalTarget] = useState<BlacklistCase | null>(null);
  const [disputeText, setDisputeText] = useState('');
  const [disputeEvidenceDoc, setDisputeEvidenceDoc] = useState('');

  // Review Form & Inline Review Modal (Requirement 10)
  const [selectedReview, setSelectedReview] = useState<CompanyReview | null>(null);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [reviewCompanyName, setReviewCompanyName] = useState('');
  const [reviewLocation, setReviewLocation] = useState('');
  const [reviewRatingStars, setReviewRatingStars] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');

  // Quick Inline Add Remark to Company Card
  const [quickReviewTargetId, setQuickReviewTargetId] = useState<string | null>(null);
  const [quickRemarkText, setQuickRemarkText] = useState('');
  const [quickRemarkRating, setQuickRemarkRating] = useState(5);

  // Blacklist Case Modal & Form
  const [selectedCase, setSelectedCase] = useState<BlacklistCase | null>(null);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [caseCompany, setCaseCompany] = useState('');
  const [caseLocation, setCaseLocation] = useState('');
  const [caseReason, setCaseReason] = useState('Payment default');
  const [caseSeverity, setCaseSeverity] = useState<'moderate' | 'high' | 'critical'>('high');
  const [caseDescription, setCaseDescription] = useState('');
  const [caseEvidence, setCaseEvidence] = useState('');
  const [companySearchOpen, setCompanySearchOpen] = useState(false);

  // Peer Remarks Editing State
  const [editingRemark, setEditingRemark] = useState<{
    companyId: string;
    remarkId: string;
    rating: number;
    text: string;
  } | null>(null);

  // Aggregated known companies from Disputed Blacklist Cases, Company Reviews, and Master Carriers
  const knownCompanies = React.useMemo(() => {
    const map = new Map<string, { name: string; location: string; source: string }>();

    // 1. Existing Disputed Blacklist Cases
    cases.forEach((c) => {
      if (c.companyName?.trim()) {
        const key = c.companyName.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            name: c.companyName.trim(),
            location: c.location || 'Global Logistics Hub',
            source: 'Disputed Record',
          });
        }
      }
    });

    // 2. Company Reviews Directory
    reviews.forEach((r) => {
      if (r.companyName?.trim()) {
        const key = r.companyName.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            name: r.companyName.trim(),
            location: r.location || 'Global Trade Center',
            source: 'Directory Profile',
          });
        }
      }
    });

    // 3. Master Carriers
    (masterCarriers || []).forEach((mc) => {
      if (mc.name?.trim()) {
        const key = mc.name.trim().toLowerCase();
        if (!map.has(key)) {
          map.set(key, {
            name: mc.name.trim(),
            location: mc.country ? `${mc.country} (Carrier Line)` : 'Global Maritime Hub',
            source: 'Verified Carrier',
          });
        }
      }
    });

    return Array.from(map.values());
  }, [cases, reviews, masterCarriers]);

  const filteredKnownCompanies = knownCompanies.filter((c) =>
    c.name.toLowerCase().includes(caseCompany.trim().toLowerCase()) ||
    c.location.toLowerCase().includes(caseCompany.trim().toLowerCase())
  );

  const [selectedProfileName, setSelectedProfileName] = useState<string | null>(null);

  // Search Filters
  const filteredTopics = topics.filter((t) =>
    (t.title + ' ' + t.author + ' ' + t.category + ' ' + t.text)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const filteredReviews = reviews.filter((r) =>
    (r.companyName + ' ' + r.location).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCases = cases.filter((c) =>
    (c.companyName + ' ' + c.location + ' ' + c.reason + ' ' + c.description)
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicSubject.trim() || !newTopicBody.trim()) {
      toast('Subject and content are required.');
      return;
    }
    addTopic(newTopicSubject, newTopicCategory, newTopicBody);
    setShowNewTopicModal(false);
    setNewTopicSubject('');
    setNewTopicBody('');
  };

  const handleTopicReply = () => {
    if (!topicReplyText.trim() || !selectedTopic) return;
    addTopicReply(selectedTopic.id, topicReplyText);
    const newReply = {
      id: `tr-${Date.now()}`,
      author: user.displayName,
      authorUid: user.uid,
      text: topicReplyText,
      time: 'Just now',
      hasGoldenTick: user.hasGoldenTick,
      likes: 0,
      dis: 0,
    };
    setSelectedTopic((prev) =>
      prev
        ? {
            ...prev,
            commentsCount: prev.commentsCount + 1,
            replies: [...prev.replies, newReply],
          }
        : null
    );
    setTopicReplyText('');
  };

  // Owner permission check: Strictly only the creator can edit or delete their community topic
  const isTopicOwner = (topic?: NexusTopic | null) => {
    if (!topic || !user) return false;
    if (topic.authorUid && user.uid) {
      return topic.authorUid === user.uid;
    }
    return Boolean(
      (topic.author && user.displayName && topic.author.trim().toLowerCase() === user.displayName.trim().toLowerCase()) ||
      (topic.author && (user as any).name && topic.author.trim().toLowerCase() === (user as any).name.trim().toLowerCase())
    );
  };

  const handleUpdateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !editTopicTitle.trim() || !editTopicBody.trim()) {
      toast('Title and content are required.');
      return;
    }
    if (!isTopicOwner(selectedTopic)) {
      toast('Permission denied: Only the topic owner can edit this community post.');
      return;
    }
    updateTopic(selectedTopic.id, editTopicTitle, editTopicCategory, editTopicBody);
    setSelectedTopic((prev) =>
      prev
        ? {
            ...prev,
            title: editTopicTitle.trim(),
            category: editTopicCategory,
            text: editTopicBody.trim(),
            isEdited: true,
          }
        : null
    );
    setIsEditingTopic(false);
  };

  const handleDeleteTopic = (topicId: string) => {
    const targetTopic = topics.find((t) => t.id === topicId) || selectedTopic;
    if (!isTopicOwner(targetTopic)) {
      toast('Permission denied: Only the topic owner can delete this community post.');
      return;
    }
    if (window.confirm('Are you sure you want to permanently delete this community topic?')) {
      deleteTopic(topicId);
      setSelectedTopic(null);
      setIsEditingTopic(false);
    }
  };

  const handleDeleteTopicReply = (topicId: string, replyId: string) => {
    if (window.confirm('Delete this reply from the thread?')) {
      deleteTopicReply(topicId, replyId);
      setSelectedTopic((prev) =>
        prev
          ? {
              ...prev,
              commentsCount: Math.max(0, prev.commentsCount - 1),
              replies: prev.replies.filter((r) => r.id !== replyId),
            }
          : null
      );
    }
  };

  const handleConfirmReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalTarget || isSubmittingReport) return;

    setIsSubmittingReport(true);
    const targetId = reportModalTarget.id;
    const targetType = reportModalTarget.type;
    const targetTitle = reportModalTarget.title;
    const targetTopic =
      reportModalTarget.topic ||
      topics.find((t) => t.id === targetId) ||
      (selectedTopic?.id === targetId ? selectedTopic : undefined);

    const categoryLabels: Record<string, string> = {
      spam: 'Commercial Spam / Solicitation',
      misleading: 'Misleading Freight Quote / Rates',
      fraud: 'Suspected Fraud / False Entity',
      harassment: 'Unprofessional Conduct / Defamation',
      prohibited: 'Prohibited Cargo / Regulatory Breach',
      other: 'Other Community Guideline Violation',
    };

    const categoryLabel = categoryLabels[reportCategory] || reportCategory;
    const reportTimestamp = new Date().toISOString();
    const localTimestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) + ' IST';

    // 1. Record report in DataContext & local moderation queue
    const recordedReport = reportTarget(
      targetId,
      targetType,
      reportCategory,
      reportDescription || 'Violation of freight community policy'
    );
    const reportRefId = recordedReport?.id || `rep-${Date.now()}`;

    // 2. Format detailed plain text message
    const plainTextMessage = `
=====================================================
FR8X NEXUS TOPIC MODERATION REPORT
=====================================================

A community discussion topic has been reported by a verified FR8X member and submitted to support@fr8x.in for moderation review.

REPORT REFERENCE ID: ${reportRefId}
REPORT TIMESTAMP    : ${localTimestamp} (${reportTimestamp})
VIOLATION CATEGORY  : ${categoryLabel} (Code: ${reportCategory})

-----------------------------------------------------
REPORTED TOPIC SUMMARY:
-----------------------------------------------------
Topic ID       : ${targetId}
Topic Title    : ${targetTitle}
Topic Category : ${targetTopic?.category || 'General'}
Author Name    : ${targetTopic?.author || 'Unknown Author'}
Author Company : ${targetTopic?.authorCompany || 'Not specified'}
Author Timezone: ${targetTopic?.authorTimezone || 'N/A'}
Posted At      : ${targetTopic?.createdAt || 'N/A'}
Replies Count  : ${targetTopic?.replies?.length ?? 0}

ORIGINAL TOPIC CONTENT:
-----------------------------------------------------
${targetTopic?.text || '(No topic body content)'}

-----------------------------------------------------
REPORTER DETAILS (AUDIT TRAIL):
-----------------------------------------------------
Member Name    : ${user?.displayName || 'Anonymous Member'}
Email Address  : ${user?.email || 'Not available'}
User UID       : ${user?.uid || 'N/A'}
Company        : ${user?.company || 'N/A'}
Designation    : ${user?.designation || 'N/A'}
Verified Golden: ${user?.hasGoldenTick ? 'Yes' : 'No'}

-----------------------------------------------------
REPORTER'S EXPLANATION & AUDIT NOTES:
-----------------------------------------------------
${reportDescription.trim() || 'No additional commentary provided.'}

-----------------------------------------------------
RECOMMENDED ACTION:
Review this topic in FR8X Nexus Moderation Board. If it violates FR8X Terms of Service or Freight Community Standards, take appropriate disciplinary action (warn, edit, or purge topic).
`.trim();

    // 3. Format detailed HTML email message
    const htmlBody = `
<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #1e293b; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.05);">
  <div style="background: #991b1b; padding: 20px 24px; color: #ffffff;">
    <span style="font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 4px; display: inline-block; margin-bottom: 8px;">
      Moderation Alert
    </span>
    <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; line-height: 1.3;">
      Nexus Community Discussion Flagged
    </h2>
    <p style="margin: 6px 0 0; font-size: 12.5px; color: #fecaca;">
      Report ID: <b style="font-family: monospace;">${reportRefId}</b> · Recipient: <b style="color: #ffffff;">support@fr8x.in</b>
    </p>
  </div>

  <div style="padding: 24px; display: flex; flex-direction: column; gap: 20px;">
    <!-- Alert banner -->
    <div style="background: #fef2f2; border: 1px solid #fee2e2; border-left: 4px solid #dc2626; border-radius: 6px; padding: 14px 16px;">
      <div style="font-size: 11px; text-transform: uppercase; color: #991b1b; font-weight: 800; letter-spacing: 0.5px;">
        Reason for Report
      </div>
      <div style="font-size: 15px; font-weight: 700; color: #991b1b; margin-top: 2px;">
        ${categoryLabel}
      </div>
      <div style="font-size: 13px; color: #475569; margin-top: 6px; white-space: pre-wrap; line-height: 1.5;">
        <b>Audit Notes:</b> ${reportDescription.trim() || 'No additional commentary provided.'}
      </div>
    </div>

    <!-- Reported Topic Summary -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px;">
      <h3 style="margin: 0 0 10px; font-size: 13.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
        Reported Topic Information
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #64748b; width: 130px;"><b>Topic ID:</b></td>
          <td style="padding: 4px 0; font-family: monospace; color: #0f172a;">${targetId}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;"><b>Topic Title:</b></td>
          <td style="padding: 4px 0; font-weight: 700; color: #0f172a;">${targetTitle}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;"><b>Category:</b></td>
          <td style="padding: 4px 0; color: #0284c7;">${targetTopic?.category || 'General'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;"><b>Author:</b></td>
          <td style="padding: 4px 0; color: #0f172a;">${targetTopic?.author || 'Unknown'} ${targetTopic?.authorCompany ? `(${targetTopic.authorCompany})` : ''}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;"><b>Published:</b></td>
          <td style="padding: 4px 0; color: #0f172a;">${targetTopic?.createdAt || 'N/A'}</td>
        </tr>
      </table>

      <div style="margin-top: 12px; padding: 12px; background: #ffffff; border: 1px solid #cbd5e1; border-radius: 6px;">
        <b style="display: block; font-size: 11px; text-transform: uppercase; color: #64748b; margin-bottom: 4px;">Topic Body Content:</b>
        <div style="font-size: 13px; color: #1e293b; line-height: 1.5; white-space: pre-wrap;">
          ${targetTopic?.text || '(No text body content)'}
        </div>
      </div>
    </div>

    <!-- Reporter Profile -->
    <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 16px;">
      <h3 style="margin: 0 0 10px; font-size: 13.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">
        Reporter Audit Profile
      </h3>
      <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
        <tr>
          <td style="padding: 4px 0; color: #64748b; width: 130px;"><b>Reporter Name:</b></td>
          <td style="padding: 4px 0; font-weight: 700; color: #0f172a;">${user?.displayName || 'Anonymous Member'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;"><b>Reporter Email:</b></td>
          <td style="padding: 4px 0; color: #0f172a;">${user?.email || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;"><b>Company:</b></td>
          <td style="padding: 4px 0; color: #0f172a;">${user?.company || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;"><b>User UID:</b></td>
          <td style="padding: 4px 0; font-family: monospace; color: #0f172a;">${user?.uid || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding: 4px 0; color: #64748b;"><b>Reported At:</b></td>
          <td style="padding: 4px 0; color: #0f172a;">${localTimestamp}</td>
        </tr>
      </table>
    </div>

    <!-- Footer Notice -->
    <div style="text-align: center; padding-top: 8px; border-top: 1px solid #e2e8f0; font-size: 11.5px; color: #94a3b8;">
      FR8X Freight Exchange Moderation Engine · Dispatched directly to support@fr8x.in
    </div>
  </div>
</div>
`.trim();

    // 4. Dispatch to support@fr8x.in via server-side email endpoint
    try {
      const emailRes = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'support',
          to: 'support@fr8x.in',
          subject: `[Nexus Report] Topic Flagged: "${targetTitle}" (${categoryLabel})`,
          message: plainTextMessage,
          htmlMessage: htmlBody,
          event: 'SUPPORT_NEXUS_TOPIC_REPORT',
        }),
      });

      const resJson = await emailRes.json().catch(() => ({}));

      if (emailRes.ok && resJson.success) {
        toast(`Report dispatched directly to support@fr8x.in & FR8X Moderation Board.`);
      } else {
        toast(`Report filed in Moderation Board. Notification queued for support@fr8x.in.`);
      }
    } catch (err: any) {
      console.warn('Email dispatch warning for report:', err);
      toast(`Report filed in Moderation Board. Notification queued for support@fr8x.in.`);
    } finally {
      setIsSubmittingReport(false);
      setReportModalTarget(null);
      setReportDescription('');
    }
  };

  const handleCreateReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewCompanyName.trim() || !reviewFeedback.trim()) {
      toast('Please provide company name and review feedback.');
      return;
    }
    addReview(reviewCompanyName, reviewLocation, reviewRatingStars, reviewFeedback);
    setShowAddReviewModal(false);
    setReviewFeedback('');
  };

  const handleQuickSubmitRemark = (companyId: string, companyName: string, location: string) => {
    if (!quickRemarkText.trim()) {
      toast('Please enter a remark before submitting.');
      return;
    }
    addReview(companyName, location, quickRemarkRating, quickRemarkText);
    setQuickReviewTargetId(null);
    setQuickRemarkText('');
    toast(`Remark and ${quickRemarkRating}★ rating added to ${companyName}!`);
  };

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    if (!caseCompany.trim() || !caseDescription.trim()) {
      toast('Company name and facts description are required.');
      return;
    }
    addCase({
      companyName: caseCompany.trim(),
      location: caseLocation.trim(),
      reason: caseReason.trim(),
      severity: caseSeverity,
      description: caseDescription.trim(),
      evidenceRef: caseEvidence.trim() || 'Verified Invoice Documentation',
    });
    setShowNewCaseModal(false);
    setCaseCompany('');
    setCaseDescription('');
    setCaseEvidence('');
  };

  const handleConfirmDispute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disputeModalTarget || !disputeText.trim()) {
      toast('Please enter your dispute statement.');
      return;
    }
    disputeCase(disputeModalTarget.id, disputeText.trim(), disputeEvidenceDoc.trim() || 'Counter Bank Statement & Clean Delivery Order Proof');
    setDisputeModalTarget(null);
    setDisputeText('');
    setDisputeEvidenceDoc('');
    toast(`Dispute for ${disputeModalTarget.companyName} submitted for arbitration review.`);
  };

  return (
    <div className="nexus-container" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Profile Preview Modal */}
      <ProfilePreviewModal
        isOpen={Boolean(selectedProfileName)}
        onClose={() => setSelectedProfileName(null)}
        personName={selectedProfileName || ''}
      />



      {/* Monitored Blacklist Verification Dossier Panel */}
      {selectedCaseDossier && (
        <Modal
          isOpen={Boolean(selectedCaseDossier)}
          onClose={() => setSelectedCaseDossier(null)}
          title={`Blacklist Verification Dossier: ${selectedCaseDossier.companyName}`}
          maxWidth="820px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Header Alert */}
            <div style={{ padding: '14px 16px', background: '#fef2f2', border: '1.5px solid #fecaca', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="badge red" style={{ fontSize: '10.5px', fontWeight: 800 }}>
                  <ShieldAlert size={12} style={{ verticalAlign: '-2px', marginRight: '4px' }} />
                  {selectedCaseDossier.severity.toUpperCase()} RISK REGISTRATION
                </span>
                <b style={{ display: 'block', fontSize: '16px', color: '#991b1b', marginTop: '4px' }}>
                  {selectedCaseDossier.companyName}
                </b>
                <small style={{ color: 'var(--mut)', fontSize: '12px' }}>
                  Operating Hub: <b>{selectedCaseDossier.location}</b> · Reported: {selectedCaseDossier.reportedDate}
                </small>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '11px', color: 'var(--mut)', display: 'block' }}>Case Docket ID</span>
                <b style={{ fontFamily: 'var(--font-mono)', fontSize: '14px', color: '#991b1b' }}>{selectedCaseDossier.id}</b>
              </div>
            </div>

            {/* Infraction & Exposure Details */}
            <div className="grid g2" style={{ gap: '12px' }}>
              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <small style={{ color: 'var(--mut)', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                  Infraction Category
                </small>
                <b style={{ display: 'block', fontSize: '14px', color: 'var(--ink)', marginTop: '2px' }}>
                  {selectedCaseDossier.reason}
                </b>
                <p style={{ margin: '6px 0 0', fontSize: '12px', color: 'var(--ink-secondary)', lineHeight: 1.5 }}>
                  {selectedCaseDossier.description}
                </p>
              </div>

              <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line)' }}>
                <small style={{ color: 'var(--mut)', fontSize: '10.5px', textTransform: 'uppercase', fontWeight: 700 }}>
                  Due Process & Compliance Status
                </small>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                  <CheckCircle2 size={15} color="var(--green)" />
                  <b style={{ fontSize: '13px', color: 'var(--green)' }}>Moderator Verified & Validated</b>
                </div>
                <small style={{ display: 'block', color: 'var(--mut)', fontSize: '11px', marginTop: '4px' }}>
                  14-day formal cure notice expired without bank settlement or container return proof.
                </small>
              </div>
            </div>

            {/* Evidentiary Audit Trail */}
            <div style={{ background: '#ffffff', border: '1px solid var(--line)', borderRadius: '8px', padding: '14px' }}>
              <b style={{ fontSize: '13px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <FileCheck size={15} color="var(--brand)" /> Auditable Evidentiary Dossier
              </b>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12px' }}>
                  <span>📄 Primary Verified Reference: <b>{selectedCaseDossier.evidenceRef}</b></span>
                  <span className="badge green" style={{ fontSize: '9px' }}>AUTHENTICATED</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12px' }}>
                  <span>📜 Bill of Lading & Commercial Shipping Invoices (OBL-9024)</span>
                  <span className="badge green" style={{ fontSize: '9px' }}>FILED</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 10px', background: '#f1f5f9', borderRadius: '6px', fontSize: '12px' }}>
                  <span>⚖️ Advocate Demand Notice & Postal Speedpost AD Proof</span>
                  <span className="badge green" style={{ fontSize: '9px' }}>SERVED</span>
                </div>
              </div>
            </div>

            {/* Global Consensus in Dossier (Requirement 9) */}
            <div style={{ padding: '12px 14px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <b style={{ fontSize: '12px', color: 'var(--ink)' }}>Global Consensus Status</b>
                <small style={{ display: 'block', color: 'var(--mut)', fontSize: '11px' }}>
                  {selectedCaseDossier.agreedCount || 0} Confirmed Defaults · {selectedCaseDossier.disputeCount || 0} Disputed Claims
                </small>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  className={`btn sm ${selectedCaseDossier.userAgreed ? 'primary' : 'secondary'}`}
                  onClick={() => {
                    agreeCase(selectedCaseDossier.id);
                    setSelectedCaseDossier((prev) =>
                      prev
                        ? {
                            ...prev,
                            userAgreed: !prev.userAgreed,
                            agreedCount: prev.userAgreed ? (prev.agreedCount || 1) - 1 : (prev.agreedCount || 0) + 1,
                          }
                        : null
                    );
                  }}
                >
                  <ThumbsUp size={11} /> {selectedCaseDossier.userAgreed ? 'Agreed' : 'Agree with Default'} ({selectedCaseDossier.agreedCount || 0})
                </button>
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => {
                    setDisputeModalTarget(selectedCaseDossier);
                    setSelectedCaseDossier(null);
                  }}
                >
                  <Scale size={11} /> File Dispute
                </button>
              </div>
            </div>

            {/* Closing Actions */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line)', paddingTop: '12px' }}>
              <button
                type="button"
                className="btn secondary sm"
                onClick={() => {
                  setDisputeModalTarget(selectedCaseDossier);
                  setSelectedCaseDossier(null);
                }}
              >
                <Scale size={12} /> Submit Counter-Evidence / Dispute
              </button>
              <button type="button" className="btn primary" onClick={() => setSelectedCaseDossier(null)}>
                Close Dossier
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* Blacklist Counter-Evidence & Dispute Modal (Requirement 9) */}
      {disputeModalTarget && (
        <Modal
          isOpen={Boolean(disputeModalTarget)}
          onClose={() => setDisputeModalTarget(null)}
          title={`File Dispute & Counter-Evidence: ${disputeModalTarget.companyName}`}
          maxWidth="640px"
        >
          <form onSubmit={handleConfirmDispute} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ padding: '10px 12px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', fontSize: '11.5px', color: '#991b1b' }}>
              <b>Case Reference: {disputeModalTarget.id} · {disputeModalTarget.reason}</b>
              <p style={{ margin: '4px 0 0', color: 'var(--ink)' }}>
                You are submitting formal counter-evidence to dispute this trade default entry on behalf of <b>{user.company}</b>.
              </p>
            </div>

            <div className="field">
              <label>Counter Statement & Disputation Grounds <span className="req">*</span></label>
              <textarea
                className="input"
                rows={4}
                placeholder="Detail why this blacklist report is erroneous, including payment dates, UTR transaction refs, or settlement release documents..."
                value={disputeText}
                onChange={(e) => setDisputeText(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label>Evidence Reference / Docket Attachment Ref</label>
              <input
                className="input"
                placeholder="Bank Swift MT103 Ref / Clean Delivery Order # / Settlement Release Deed"
                value={disputeEvidenceDoc}
                onChange={(e) => setDisputeEvidenceDoc(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--line)', paddingTop: '10px' }}>
              <button type="button" className="btn secondary" onClick={() => setDisputeModalTarget(null)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" style={{ background: '#0284c7' }}>
                <Scale size={13} /> Submit Formal Dispute
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Topic Detail Modal — Full-Screen Widescreen Layout for CRUD Operations */}
      {selectedTopic && (
        <Modal
          isOpen={Boolean(selectedTopic)}
          onClose={() => {
            setSelectedTopic(null);
            setIsEditingTopic(false);
          }}
          title={isEditingTopic ? `Edit Topic: ${selectedTopic.title}` : `Nexus Community Discussion: ${selectedTopic.title}`}
          maxWidth="1200px"
          isFullScreen={isTopicFullScreen}
          headerActions={
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                className="btn secondary sm"
                onClick={() => setIsTopicFullScreen(!isTopicFullScreen)}
                title={isTopicFullScreen ? 'Exit Full Screen' : 'Expand to Full Screen'}
                style={{ height: '28px', padding: '0 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
              >
                {isTopicFullScreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                {isTopicFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              </button>

              {isTopicOwner(selectedTopic) && !isEditingTopic && (
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => {
                    setIsEditingTopic(true);
                    setEditTopicTitle(selectedTopic.title);
                    setEditTopicCategory(selectedTopic.category);
                    setEditTopicBody(selectedTopic.text);
                  }}
                  title="Edit Topic Content (Owner Only)"
                  style={{ height: '28px', padding: '0 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit3 size={12} /> Edit
                </button>
              )}

              {isTopicOwner(selectedTopic) && (
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => handleDeleteTopic(selectedTopic.id)}
                  title="Delete Topic (Owner Only)"
                  style={{ height: '28px', padding: '0 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px', color: '#dc2626' }}
                >
                  <Trash2 size={12} /> Delete
                </button>
              )}
            </div>
          }
        >
          {/* Meta row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid var(--line)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="badge blue" style={{ fontSize: '11px', fontWeight: 700 }}>{selectedTopic.category}</span>
              <span style={{ fontSize: '12px', color: 'var(--mut)' }}>{selectedTopic.createdAt}</span>
              {selectedTopic.isEdited && (
                <span className="badge grey" style={{ fontSize: '10.5px' }}>
                  Edited {selectedTopic.updatedAt || ''}
                </span>
              )}
              <span className="badge grey" style={{ fontSize: '10.5px' }}>
                <MessageCircle size={11} style={{ verticalAlign: '-1px', marginRight: '3px' }} />
                {selectedTopic.replies.length} Replies
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px' }}>
              <span style={{ color: 'var(--mut)' }}>Topic Creator:</span>
              <b
                style={{ color: 'var(--brand)', cursor: 'pointer' }}
                onClick={() => setSelectedProfileName(selectedTopic.author)}
              >
                {selectedTopic.author}
              </b>
              {selectedTopic.hasGoldenTick && <GoldenTick />}
              {selectedTopic.authorCompany && (
                <span style={{ color: 'var(--mut)', fontSize: '11.5px' }}>({selectedTopic.authorCompany})</span>
              )}
            </div>
          </div>

          {/* Stacked layout: Topic Post on Top, Responses & Reply Box Below */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', flex: 1, minHeight: '400px' }}>
            {/* Left: Original Post Content or Live Edit Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', height: '100%' }}>
              {isEditingTopic ? (
                /* Edit Form (Update Operation) */
                <form
                  onSubmit={handleUpdateTopic}
                  style={{
                    background: '#ffffff',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '14px',
                    flex: 1,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Edit3 size={15} color="var(--brand)" />
                    <b style={{ fontSize: '12.5px', textTransform: 'uppercase', letterSpacing: '0.5px', color: 'var(--brand)' }}>
                      Edit Topic Content (Update CRUD)
                    </b>
                  </div>

                  <div className="field">
                    <label style={{ fontSize: '11.5px', fontWeight: 700 }}>Topic Subject / Title</label>
                    <input
                      className="input"
                      value={editTopicTitle}
                      onChange={(e) => setEditTopicTitle(e.target.value)}
                      required
                      style={{ fontSize: '13px' }}
                    />
                  </div>

                  <div className="field">
                    <label style={{ fontSize: '11.5px', fontWeight: 700 }}>Category</label>
                    <select
                      className="input"
                      value={editTopicCategory}
                      onChange={(e) => setEditTopicCategory(e.target.value)}
                      style={{ fontSize: '13px' }}
                    >
                      <option value="Routing Strategy">Routing Strategy &amp; Transshipment</option>
                      <option value="Commercial Terms">Commercial Terms &amp; INCOTERMS</option>
                      <option value="Customs Clearance">Customs &amp; Compliance</option>
                      <option value="Carrier Relations">Carrier Relations &amp; Space Allocation</option>
                      <option value="Market Trends">Market Trends &amp; GRI Benchmarking</option>
                      <option value="General Trade">General Trade Discussions</option>
                    </select>
                  </div>

                  <div className="field" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <label style={{ fontSize: '11.5px', fontWeight: 700 }}>Discussion Body &amp; Trade Details</label>
                    <textarea
                      className="input"
                      value={editTopicBody}
                      onChange={(e) => setEditTopicBody(e.target.value)}
                      rows={12}
                      required
                      style={{ flex: 1, minHeight: '220px', resize: 'vertical', fontSize: '13.5px', lineHeight: 1.6 }}
                    />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
                    <button
                      type="button"
                      className="btn secondary"
                      onClick={() => setIsEditingTopic(false)}
                    >
                      Cancel
                    </button>
                    <button type="submit" className="btn primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Check size={14} /> Save Changes
                    </button>
                  </div>
                </form>
              ) : (
                /* Read View (Read Operation) */
                <div
                  style={{
                    background: '#f8fafc',
                    borderRadius: '8px',
                    border: '1px solid var(--line)',
                    padding: '24px',
                    fontSize: '14.5px',
                    lineHeight: 1.75,
                    color: 'var(--ink)',
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    overflowY: 'auto',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MessagesSquare size={16} color="var(--brand)" />
                      <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--brand)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Topic Docket #{selectedTopic.id}
                      </span>
                    </div>
                    {selectedTopic.authorTimezone && (
                      <LocalTimeBadge timezone={selectedTopic.authorTimezone} />
                    )}
                  </div>

                  <h3 style={{ margin: '0 0 14px', fontSize: '18px', fontWeight: 800, color: 'var(--ink)', lineHeight: 1.4 }}>
                    {selectedTopic.title}
                  </h3>

                  <div style={{ flex: 1, whiteSpace: 'pre-wrap', color: 'var(--ink-secondary)', fontSize: '14px' }}>
                    {selectedTopic.text}
                  </div>

                  {/* Reactions & Report row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '16px', marginTop: '16px', borderTop: '1px solid var(--line)' }}>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={`btn secondary sm ${selectedTopic.liked ? 'on' : ''}`}
                        onClick={() => {
                          reactTopic(selectedTopic.id, 'like');
                          setSelectedTopic((prev) => prev ? { ...prev, liked: !prev.liked, likes: prev.likes + (prev.liked ? -1 : 1) } : null);
                        }}
                        style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', color: selectedTopic.liked ? 'var(--brand)' : 'inherit' }}
                      >
                        <ThumbsUp size={13} /> {selectedTopic.likes || 0}
                      </button>
                      <button
                        className={`btn secondary sm ${selectedTopic.disliked ? 'on' : ''}`}
                        onClick={() => {
                          reactTopic(selectedTopic.id, 'dis');
                          setSelectedTopic((prev) => prev ? { ...prev, disliked: !prev.disliked, dis: prev.dis + (prev.disliked ? -1 : 1) } : null);
                        }}
                        style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', color: selectedTopic.disliked ? 'var(--red)' : 'inherit' }}
                      >
                        <ThumbsDown size={13} /> {selectedTopic.dis || 0}
                      </button>
                    </div>
                    <button
                      className="btn secondary sm"
                      onClick={() => setReportModalTarget({ id: selectedTopic.id, type: 'post', title: selectedTopic.title, topic: selectedTopic })}
                      style={{ color: 'var(--mut)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                    >
                      <Flag size={12} /> Report Topic
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right: Replies Thread + Reply Box */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                height: '100%',
                background: '#ffffff',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '16px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--line)', paddingBottom: '10px' }}>
                <b style={{ fontSize: '13.5px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={14} color="var(--teal)" />
                  Community Responses ({selectedTopic.replies.length})
                </b>
                <span style={{ fontSize: '11.5px', color: 'var(--mut)' }}>
                  Verified Members Only
                </span>
              </div>

              {/* Scrollable list of replies */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', paddingRight: '4px', minHeight: '260px' }}>
                {selectedTopic.replies.length === 0 ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--mut)', background: '#f8fafc', borderRadius: '8px', border: '1px dashed var(--line)', fontSize: '13px', margin: 'auto 0' }}>
                    <MessagesSquare size={32} style={{ margin: '0 auto 10px', display: 'block', opacity: 0.35 }} />
                    No responses yet. Post your professional insight below to participate.
                  </div>
                ) : (
                  selectedTopic.replies.map((reply, i) => (
                    <div key={reply.id || i} style={{ padding: '12px 14px', background: '#fafbfc', borderRadius: '6px', border: '1px solid var(--line)', position: 'relative' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                        <span style={{ fontWeight: 700, fontSize: '12px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          {reply.author}
                          {reply.hasGoldenTick && <GoldenTick />}
                        </span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <small style={{ color: 'var(--faint)', fontSize: '10.5px' }}>{reply.time}</small>
                          {(reply.author === user.displayName || reply.authorUid === user.uid) && reply.id && (
                            <button
                              type="button"
                              onClick={() => handleDeleteTopicReply(selectedTopic.id, reply.id!)}
                              title="Delete response"
                              style={{ background: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', padding: '2px' }}
                            >
                              <Trash2 size={11} />
                            </button>
                          )}
                        </div>
                      </div>
                      <p style={{ fontSize: '13px', margin: '0 0 8px', color: 'var(--ink-secondary)', lineHeight: 1.55, whiteSpace: 'pre-wrap' }}>
                        {reply.text}
                      </p>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line-light)', paddingTop: '6px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              if (reply.id) reactTopicReply(selectedTopic.id, reply.id, 'like');
                              toast('Reply marked helpful.');
                            }}
                            style={{ fontSize: '11px', color: 'var(--mut)', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', background: 'transparent', border: 'none' }}
                          >
                            <ThumbsUp size={11} /> {reply.likes || 0}
                          </button>
                          <button
                            onClick={() => {
                              if (reply.id) reactTopicReply(selectedTopic.id, reply.id, 'dis');
                            }}
                            style={{ fontSize: '11px', color: 'var(--mut)', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer', background: 'transparent', border: 'none' }}
                          >
                            <ThumbsDown size={11} /> {reply.dis || 0}
                          </button>
                        </div>
                        <button
                          onClick={() => setReportModalTarget({ id: reply.id || `r-${i}`, type: 'comment', title: `Reply by ${reply.author}` })}
                          style={{ fontSize: '10.5px', color: 'var(--mut)', cursor: 'pointer', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', gap: '3px' }}
                        >
                          <Flag size={10} /> Report
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Reply Input */}
              <div style={{ borderTop: '1px solid var(--line)', paddingTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <textarea
                  className="input"
                  placeholder="Share your freight operational advice or market experience…"
                  value={topicReplyText}
                  onChange={(e) => setTopicReplyText(e.target.value)}
                  rows={3}
                  style={{ resize: 'vertical', fontSize: '12.5px', lineHeight: 1.5 }}
                />
                <button
                  className="btn primary"
                  onClick={handleTopicReply}
                  style={{ alignSelf: 'flex-end', padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Send size={13} /> Post Response
                </button>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* New Topic Modal — Full-Screen Support for Create CRUD */}
      {showNewTopicModal && (
        <Modal
          isOpen={showNewTopicModal}
          onClose={() => setShowNewTopicModal(false)}
          title="Create Nexus Community Topic (Create CRUD)"
          maxWidth="980px"
          isFullScreen={isNewTopicFullScreen}
          headerActions={
            <button
              type="button"
              className="btn secondary sm"
              onClick={() => setIsNewTopicFullScreen(!isNewTopicFullScreen)}
              title={isNewTopicFullScreen ? 'Exit Full Screen' : 'Full Screen'}
              style={{ height: '28px', padding: '0 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {isNewTopicFullScreen ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
              {isNewTopicFullScreen ? 'Exit Full Screen' : 'Full Screen'}
            </button>
          }
        >
          <form
            onSubmit={handleCreateTopic}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
              flex: 1,
              height: isNewTopicFullScreen ? 'calc(100vh - 160px)' : 'auto',
            }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '16px' }}>
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: '12px' }}>Topic Title / Subject <span className="req">*</span></label>
                <input
                  className="input"
                  placeholder="e.g. Best demurrage negotiation strategies for Rotterdam ECT..."
                  value={newTopicSubject}
                  onChange={(e) => setNewTopicSubject(e.target.value)}
                  required
                  style={{ fontSize: '13.5px' }}
                />
              </div>
              <div className="field">
                <label style={{ fontWeight: 700, fontSize: '12px' }}>Category</label>
                <select
                  className="input"
                  value={newTopicCategory}
                  onChange={(e) => setNewTopicCategory(e.target.value)}
                  style={{ fontSize: '13.5px' }}
                >
                  <option value="Routing Strategy">Routing Strategy &amp; Transshipment</option>
                  <option value="Commercial Terms">Commercial Terms &amp; INCOTERMS</option>
                  <option value="Customs Clearance">Customs &amp; Compliance</option>
                  <option value="Carrier Relations">Carrier Relations &amp; Space Allocation</option>
                  <option value="Market Trends">Market Trends &amp; GRI Benchmarking</option>
                  <option value="General Trade">General Trade Discussions</option>
                </select>
              </div>
            </div>

            <div className="field" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <label style={{ fontWeight: 700, fontSize: '12px' }}>
                Discussion Context, Port Logistics &amp; Inquiries <span className="req">*</span>
              </label>
              <textarea
                className="input"
                rows={isNewTopicFullScreen ? 15 : 6}
                placeholder="Provide trade context, port specifics, regulatory issues or rate data points to initiate professional dialogue..."
                value={newTopicBody}
                onChange={(e) => setNewTopicBody(e.target.value)}
                required
                style={{ flex: 1, resize: 'vertical', fontSize: '13.5px', lineHeight: 1.6 }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--line)' }}>
              <span style={{ fontSize: '11.5px', color: 'var(--mut)' }}>
                Posting as <b>{user.displayName}</b> ({user.company})
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button type="button" className="btn secondary" onClick={() => setShowNewTopicModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn primary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Send size={13} /> Publish Topic
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Company Review Modal */}
      {showAddReviewModal && (
        <Modal
          isOpen={showAddReviewModal}
          onClose={() => setShowAddReviewModal(false)}
          title="Submit Verified Company Review"
          maxWidth="640px"
        >
          <form onSubmit={handleCreateReview} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="grid g2">
              <div className="field">
                <label>Company Name <span className="req">*</span></label>
                <input
                  className="input"
                  value={reviewCompanyName}
                  onChange={(e) => setReviewCompanyName(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Location / Port</label>
                <input
                  className="input"
                  value={reviewLocation}
                  onChange={(e) => setReviewLocation(e.target.value)}
                />
              </div>
            </div>
            <div className="field">
              <label>Rating (1 to 5 Stars)</label>
              <select
                className="input"
                value={reviewRatingStars}
                onChange={(e) => setReviewRatingStars(Number(e.target.value))}
              >
                <option value={5}>★★★★★ 5 - Exceptional Reliability</option>
                <option value={4}>★★★★☆ 4 - Highly Dependable</option>
                <option value={3}>★★★☆☆ 3 - Satisfactory Performance</option>
                <option value={2}>★★☆☆☆ 2 - Operational Delays / Issues</option>
                <option value={1}>★☆☆☆☆ 1 - Severe Non-Compliance</option>
              </select>
            </div>
            <div className="field">
              <label>Review Commentary <span className="req">*</span></label>
              <textarea
                className="input"
                rows={3}
                placeholder="Detail payment promptness, container turnaround, documentation accuracy, and communication SLA..."
                value={reviewFeedback}
                onChange={(e) => setReviewFeedback(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn secondary" onClick={() => setShowAddReviewModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn primary">
                Submit Verified Review
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Report Blacklist Case Modal */}
      {showNewCaseModal && (
        <Modal
          isOpen={showNewCaseModal}
          onClose={() => setShowNewCaseModal(false)}
          title="Submit Trade Non-Compliance Report"
          maxWidth="640px"
        >
          <form onSubmit={handleCreateCase} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="grid g2">
              <div className="field" style={{ position: 'relative' }}>
                <label>Reported Company Name <span className="req">*</span></label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    placeholder="Search or enter company name..."
                    value={caseCompany}
                    onChange={(e) => {
                      setCaseCompany(e.target.value);
                      setCompanySearchOpen(true);
                    }}
                    onFocus={() => setCompanySearchOpen(true)}
                    required
                  />
                  {caseCompany && (
                    <button
                      type="button"
                      onClick={() => {
                        setCaseCompany('');
                        setCaseLocation('');
                      }}
                      style={{
                        position: 'absolute',
                        right: '8px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--mut)',
                      }}
                    >
                      <XCircle size={13} />
                    </button>
                  )}
                </div>

                {/* Searchable Combobox Dropdown */}
                {companySearchOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: 0,
                      right: 0,
                      zIndex: 100,
                      background: '#ffffff',
                      border: '1.5px solid var(--brand)',
                      borderRadius: '6px',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
                      maxHeight: '220px',
                      overflowY: 'auto',
                      marginTop: '4px',
                    }}
                  >
                    <div style={{ padding: '6px 10px', background: '#f8fafc', borderBottom: '1px solid var(--line)', fontSize: '10.5px', fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase' }}>
                      Disputed &amp; Verified Company Records
                    </div>
                    {filteredKnownCompanies.length === 0 ? (
                      <div
                        style={{ padding: '10px 12px', fontSize: '12px', color: 'var(--brand)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
                        onClick={() => setCompanySearchOpen(false)}
                      >
                        <Plus size={12} /> Add <b>&quot;{caseCompany}&quot;</b> as New Entity
                      </div>
                    ) : (
                      <>
                        {filteredKnownCompanies.map((comp) => (
                          <div
                            key={comp.name}
                            onClick={() => {
                              setCaseCompany(comp.name);
                              setCaseLocation(comp.location);
                              setCompanySearchOpen(false);
                            }}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              borderBottom: '1px solid #f1f5f9',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              fontSize: '12.5px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = '#eff6ff')}
                            onMouseLeave={(e) => (e.currentTarget.style.background = '#ffffff')}
                          >
                            <div>
                              <b style={{ color: 'var(--ink)', display: 'block' }}>{comp.name}</b>
                              <small style={{ color: 'var(--mut)', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                                <MapPin size={10} /> {comp.location}
                              </small>
                            </div>
                            <span
                              className={`badge ${comp.source === 'Disputed Record' ? 'red' : 'blue'}`}
                              style={{ fontSize: '9px', padding: '1px 5px' }}
                            >
                              {comp.source}
                            </span>
                          </div>
                        ))}
                        {caseCompany.trim() && !filteredKnownCompanies.some((c) => c.name.toLowerCase() === caseCompany.trim().toLowerCase()) && (
                          <div
                            onClick={() => setCompanySearchOpen(false)}
                            style={{
                              padding: '8px 12px',
                              cursor: 'pointer',
                              background: '#faf5ff',
                              color: 'var(--brand)',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              display: 'flex',
                              alignItems: 'center',
                              gap: '6px',
                            }}
                          >
                            <Plus size={12} /> Add <b>&quot;{caseCompany}&quot;</b> as New Entity
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>

              <div className="field">
                <label>Company Location <small style={{ color: 'var(--brand)', fontWeight: 'normal' }}>(Auto-filled)</small></label>
                <div style={{ position: 'relative' }}>
                  <input
                    className="input"
                    placeholder="e.g. Singapore / Mumbai, India"
                    value={caseLocation}
                    onChange={(e) => setCaseLocation(e.target.value)}
                    required
                  />
                  <MapPin size={13} style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--mut)', pointerEvents: 'none' }} />
                </div>
              </div>
            </div>
            <div className="grid g2">
              <div className="field">
                <label>Infraction Reason <span className="req">*</span></label>
                <select
                  className="input"
                  value={caseReason}
                  onChange={(e) => setCaseReason(e.target.value)}
                >
                  <option value="Payment default">Payment Default / Unpaid Invoices</option>
                  <option value="Fictitious BL">Unauthorized House Bill of Lading</option>
                  <option value="Container Detention Abandonment">Container Detention Abandonment</option>
                  <option value="Misdeclared Cargo">Misdeclared Hazardous Cargo</option>
                  <option value="Customs Fraud">Customs Misdeclaration / Fraud</option>
                </select>
              </div>
              <div className="field">
                <label>Risk Severity Level</label>
                <select
                  className="input"
                  value={caseSeverity}
                  onChange={(e) => setCaseSeverity(e.target.value as any)}
                >
                  <option value="critical">Critical Severity</option>
                  <option value="high">High Risk</option>
                  <option value="moderate">Moderate Risk</option>
                </select>
              </div>
            </div>
            <div className="field">
              <label>Factual Summary & Evidence <span className="req">*</span></label>
              <textarea
                className="input"
                rows={3}
                placeholder="Include invoice numbers, Bill of Lading references, and timeline of dispute..."
                value={caseDescription}
                onChange={(e) => setCaseDescription(e.target.value)}
              />
            </div>
            <div className="field">
              <label>Evidence Reference IDs</label>
              <input
                className="input"
                placeholder="BL# / Port Gate In Reference / Legal Notice Ref"
                value={caseEvidence}
                onChange={(e) => setCaseEvidence(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button type="button" className="btn secondary" onClick={() => setShowNewCaseModal(false)}>
                Cancel
              </button>
              <button type="submit" className="btn danger">
                Submit for Compliance Audit
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Header */}
      <div className="head" style={{ marginBottom: 0 }}>
        <div>
          <h1 style={{ margin: 0 }}>Nexus Trade Intelligence & Compliance Hub</h1>
          <p style={{ marginTop: '4px' }}>Verified B2B trade discussions, peer performance reviews, and global logistics non-compliance monitoring.</p>
        </div>
        <div className="actions">
          {activeTab === 'community' && (
            <button className="btn primary" onClick={() => setShowNewTopicModal(true)}>
              <Plus size={14} /> New Discussion
            </button>
          )}
          {activeTab === 'reviews' && (
            <button className="btn primary" onClick={() => setShowAddReviewModal(true)}>
              <Star size={14} /> Write Company Review
            </button>
          )}
          {activeTab === 'blacklist' && (
            <button className="btn danger" onClick={() => setShowNewCaseModal(true)}>
              <ShieldAlert size={14} /> Report Violation
            </button>
          )}
        </div>
      </div>

      {/* Top 3 KPI Cards - Visible on desktop, streamlined to tabs on mobile */}
      <div className="grid g3 nexus-desktop-kpis">
        <div className="metric">
          <small>Community Discussions</small>
          <b>{topics.length}</b>
          <span>{topics.reduce((acc, t) => acc + t.replies.length, 0)} peer responses</span>
        </div>
        <div className="metric">
          <small>Verified Company Reviews</small>
          <b>{reviews.length}</b>
          <span>{(reviews.reduce((acc, r) => acc + r.ratingAverage, 0) / (reviews.length || 1)).toFixed(1)} ★ Platform Avg</span>
        </div>
        <div className="metric">
          <small>Monitored Compliance Cases</small>
          <b>{cases.length}</b>
          <span style={{ color: 'var(--red)' }}>Active fraud & default tracking</span>
        </div>
      </div>

      {/* 3 Clean Tabs & Universal Search */}
      <div className="nexus-search-bar">
        <div className="feed-tabs">
          <button
            className={`feed-tab-btn ${activeTab === 'community' ? 'active' : ''}`}
            onClick={() => setActiveTab('community')}
          >
            <MessagesSquare size={13} style={{ verticalAlign: '-1px' }} /> Community Topics ({topics.length})
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'reviews' ? 'active' : ''}`}
            onClick={() => setActiveTab('reviews')}
          >
            <Star size={13} style={{ verticalAlign: '-1px' }} /> Company Reviews ({reviews.length})
          </button>
          <button
            className={`feed-tab-btn ${activeTab === 'blacklist' ? 'active' : ''}`}
            onClick={() => setActiveTab('blacklist')}
          >
            <ShieldAlert size={13} style={{ verticalAlign: '-1px' }} /> Monitored Blacklist ({cases.length})
          </button>
        </div>

        <div className="feed-search-box" style={{ width: '340px' }}>
          <Search size={14} className="search-icon" />
          <input
            type="text"
            placeholder="Search Nexus by keyword, company, port…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="clear-search-btn">
              ✕
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: COMMUNITY TOPICS in Large Cards */}
      {activeTab === 'community' && (
        <div>
          {filteredTopics.length === 0 ? (
            <div className="card" style={{ padding: '56px 24px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px dashed var(--line)' }}>
              <MessagesSquare size={40} style={{ color: 'var(--mut)', margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: 'var(--ink)' }}>No discussions yet</h3>
              <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'var(--mut)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                Start the first community conversation on trade lanes, routing strategies, demurrage negotiations, or customs compliance.
              </p>
              <button className="btn primary" onClick={() => setShowNewTopicModal(true)}>
                <Plus size={14} /> Start First Discussion
              </button>
            </div>
          ) : (
            <div className="nexus-grid-cards">
              {filteredTopics.map((topic) => (
                <div
                  key={topic.id}
                  className="card"
                  style={{
                    padding: '20px 22px',
                    borderRadius: '12px',
                    border: '1px solid var(--line)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    transition: 'all 0.15s ease',
                    background: '#ffffff',
                  }}
                  onClick={() => setSelectedTopic(topic)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span className="badge blue" style={{ fontSize: '10.5px', fontWeight: 700 }}>{topic.category}</span>
                    <small style={{ color: 'var(--mut)', fontSize: '11px' }}>{topic.createdAt}</small>
                  </div>

                  <b style={{ fontSize: '15px', color: 'var(--ink)', lineHeight: 1.4 }}>{topic.title}</b>
                  <p style={{ fontSize: '13px', color: 'var(--ink-secondary)', margin: '2px 0 6px', lineHeight: 1.6 }}>
                    {topic.text}
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--line-light)', paddingTop: '12px', marginTop: 'auto' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: 'var(--mut)' }}>
                      <span>By <b>{topic.author}</b></span>
                      {topic.hasGoldenTick && <GoldenTick />}
                      {topic.authorTimezone && <LocalTimeBadge timezone={topic.authorTimezone} />}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Reactions */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reactTopic(topic.id, 'like');
                        }}
                        style={{ fontSize: '11.5px', color: topic.liked ? 'var(--brand)' : 'var(--mut)', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                        title="Like topic"
                      >
                        <ThumbsUp size={12} /> {topic.likes || 0}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          reactTopic(topic.id, 'dis');
                        }}
                        style={{ fontSize: '11.5px', color: topic.disliked ? 'var(--red)' : 'var(--mut)', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                        title="Dislike topic"
                      >
                        <ThumbsDown size={12} /> {topic.dis || 0}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setReportModalTarget({ id: topic.id, type: 'post', title: topic.title, topic });
                        }}
                        style={{ fontSize: '11.5px', color: 'var(--mut)', display: 'flex', alignItems: 'center', gap: '3px', cursor: 'pointer' }}
                        title="Report topic"
                      >
                        <Flag size={11} />
                      </button>
                      <span className="badge grey" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: 600 }}>
                        <MessageCircle size={12} /> {topic.replies.length}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: COMPANY REVIEWS in Large Cards (Requirement 10) */}
      {activeTab === 'reviews' && (
        <div>
          {filteredReviews.length === 0 ? (
            <div className="card" style={{ padding: '56px 24px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px dashed var(--line)' }}>
              <Star size={40} style={{ color: 'var(--mut)', margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: 'var(--ink)' }}>No company reviews yet</h3>
              <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'var(--mut)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                Be the first verified logistics professional to submit an authentic performance evaluation for a freight forwarder or carrier.
              </p>
              <button className="btn primary" onClick={() => setShowAddReviewModal(true)}>
                <Star size={14} /> Write First Review
              </button>
            </div>
          ) : (
            <div className="nexus-grid-cards">
              {filteredReviews.map((review) => {
                const isAddingQuickRemark = quickReviewTargetId === review.id;
                return (
                  <div
                    key={review.id}
                    className="card"
                    style={{
                      padding: '20px 22px',
                      borderRadius: '12px',
                      border: '1px solid var(--line)',
                      background: '#ffffff',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <b style={{ fontSize: '15px', color: 'var(--ink)', display: 'block' }}>
                          {review.companyName}
                        </b>
                        <small style={{ color: 'var(--mut)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                          <MapPin size={11} /> {review.location}
                        </small>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '18px', fontWeight: 800, color: '#e8a020' }}>
                          ★ {review.ratingAverage.toFixed(1)}
                        </span>
                        <small style={{ display: 'block', fontSize: '10.5px', color: 'var(--mut)' }}>
                          {review.totalReviews} verified reviews
                        </small>
                      </div>
                    </div>

                    {/* Star Distribution */}
                    <div className="starbars" style={{ margin: '2px 0', padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line-light)' }}>
                      {[5, 4, 3, 2, 1].map((stars, idx) => (
                        <div key={stars} className="sr">
                          <label style={{ fontSize: '11px' }}>{stars}★</label>
                          <span>
                            <i style={{ width: `${(review.starDistribution[idx] / (review.totalReviews || 1)) * 100}%` }} />
                          </span>
                          <em style={{ fontSize: '11px' }}>{review.starDistribution[idx]}</em>
                        </div>
                      ))}
                    </div>

                    {/* Review Remarks List with Like / Helpful Reactions (Requirement 10) */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '4px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <small style={{ fontSize: '11px', fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase' }}>
                          Verified Peer Remarks &amp; Feedback
                        </small>
                        <button
                          className="btn secondary sm"
                          style={{ fontSize: '11px', padding: '2px 8px' }}
                          onClick={() => setQuickReviewTargetId(isAddingQuickRemark ? null : review.id)}
                        >
                          <Plus size={11} /> {isAddingQuickRemark ? 'Cancel' : 'Add Remark & Rating'}
                        </button>
                      </div>

                      {/* Inline Quick Add Remark Drawer */}
                      {isAddingQuickRemark && (
                        <div style={{ padding: '10px 12px', background: '#f0f9ff', border: '1.5px solid #bae6fd', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, color: '#0369a1' }}>
                              Rate {review.companyName}:
                            </span>
                            <div style={{ display: 'flex', gap: '4px' }}>
                              {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                  key={star}
                                  type="button"
                                  onClick={() => setQuickRemarkRating(star)}
                                  style={{
                                    background: 'transparent',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: '14px',
                                    color: star <= quickRemarkRating ? '#e8a020' : '#cbd5e1',
                                  }}
                                >
                                  ★
                                </button>
                              ))}
                            </div>
                          </div>
                          <textarea
                            className="input"
                            rows={2}
                            placeholder="Write your experience regarding documentation, payment, or container release..."
                            value={quickRemarkText}
                            onChange={(e) => setQuickRemarkText(e.target.value)}
                            style={{ fontSize: '11.5px', background: '#ffffff' }}
                          />
                          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                            <button className="btn secondary sm" onClick={() => setQuickReviewTargetId(null)}>
                              Cancel
                            </button>
                            <button
                              className="btn primary sm"
                              onClick={() => handleQuickSubmitRemark(review.id, review.companyName, review.location)}
                            >
                              <CheckCircle2 size={11} /> Post Remark
                            </button>
                          </div>
                        </div>
                      )}

                      {review.recentReviews.map((r) => {
                        const isRemarkAuthor = Boolean(
                          (r.authorUid && user?.uid && r.authorUid === user.uid) ||
                          (r.author && user?.displayName && r.author.trim().toLowerCase() === user.displayName.trim().toLowerCase()) ||
                          (r.author && (user as any)?.name && r.author.trim().toLowerCase() === (user as any).name.trim().toLowerCase())
                        );
                        const isEditingThisRemark = editingRemark?.companyId === review.id && editingRemark?.remarkId === r.id;

                        if (isEditingThisRemark) {
                          return (
                            <div
                              key={r.id}
                              style={{
                                padding: '12px 14px',
                                border: '1.5px solid var(--brand)',
                                background: '#f0f9ff',
                                borderRadius: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: '8px',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: '11.5px', fontWeight: 700, color: 'var(--brand)' }}>
                                  Edit Your Verified Remark
                                </span>
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() => setEditingRemark((prev) => (prev ? { ...prev, rating: star } : null))}
                                      style={{
                                        background: 'transparent',
                                        border: 'none',
                                        cursor: 'pointer',
                                        fontSize: '15px',
                                        color: star <= (editingRemark?.rating || 5) ? '#e8a020' : '#cbd5e1',
                                        padding: '0 1px',
                                      }}
                                    >
                                      ★
                                    </button>
                                  ))}
                                </div>
                              </div>
                              <textarea
                                className="input"
                                rows={3}
                                value={editingRemark.text}
                                onChange={(e) => setEditingRemark((prev) => (prev ? { ...prev, text: e.target.value } : null))}
                                style={{ fontSize: '12px', background: '#ffffff', lineHeight: 1.5 }}
                                placeholder="Update your authentic trade experience..."
                              />
                              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px' }}>
                                <button
                                  type="button"
                                  className="btn secondary sm"
                                  onClick={() => setEditingRemark(null)}
                                >
                                  Cancel
                                </button>
                                <button
                                  type="button"
                                  className="btn primary sm"
                                  onClick={() => {
                                    if (!editingRemark.text.trim()) {
                                      toast('Remark text cannot be empty.');
                                      return;
                                    }
                                    updateReviewRemark(review.id, r.id, editingRemark.rating, editingRemark.text.trim());
                                    setEditingRemark(null);
                                  }}
                                >
                                  <Check size={11} /> Save Changes
                                </button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <div
                            key={r.id}
                            style={{
                              padding: '10px 12px',
                              borderLeft: '3px solid var(--brand)',
                              background: '#f8fafc',
                              borderRadius: '4px',
                              fontSize: '12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '4px',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <b>{r.author}</b>
                                {r.verified && (
                                  <span className="badge green" style={{ fontSize: '8.5px', padding: '1px 4px' }}>
                                    VERIFIED
                                  </span>
                                )}
                                <span style={{ color: '#e8a020', fontWeight: 700 }}>
                                  {'★'.repeat(r.rating || 5)}
                                </span>
                                {r.isEdited && (
                                  <small style={{ color: 'var(--mut)', fontSize: '9.5px', fontStyle: 'italic' }}>
                                    (Edited)
                                  </small>
                                )}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>{r.date}</small>
                                {isRemarkAuthor && (
                                  <button
                                    type="button"
                                    className="btn secondary sm"
                                    style={{ fontSize: '10.5px', padding: '1px 6px', display: 'flex', alignItems: 'center', gap: '3px' }}
                                    onClick={() => setEditingRemark({ companyId: review.id, remarkId: r.id, rating: r.rating || 5, text: r.text })}
                                    title="Edit your remark"
                                  >
                                    <Edit3 size={10} /> Edit
                                  </button>
                                )}
                              </div>
                            </div>

                            <p style={{ margin: '2px 0 4px', color: 'var(--ink)', lineHeight: 1.45 }}>
                              &quot;{r.text}&quot;
                            </p>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2px' }}>
                              {r.tags && r.tags.length > 0 ? (
                                <div style={{ display: 'flex', gap: '4px' }}>
                                  {r.tags.map((tag) => (
                                    <span key={tag} className="badge blue" style={{ fontSize: '9px', padding: '1px 5px' }}>
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <div />
                              )}

                              {/* Like / Helpful Reaction Buttons (Requirement 10) */}
                              <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                                <button
                                  type="button"
                                  className="btn secondary sm"
                                  style={{
                                    fontSize: '10.5px',
                                    padding: '2px 6px',
                                    background: r.liked ? '#eff6ff' : '#ffffff',
                                    color: r.liked ? 'var(--brand)' : 'var(--ink-secondary)',
                                  }}
                                  onClick={() => reactReviewRemark(review.id, r.id, 'like')}
                                  title="Mark as helpful remark"
                                >
                                  <ThumbsUp size={11} /> Helpful ({r.likes || 0})
                                </button>
                                <button
                                  type="button"
                                  className="btn secondary sm"
                                  style={{
                                    fontSize: '10.5px',
                                    padding: '2px 6px',
                                    background: r.disliked ? '#fef2f2' : '#ffffff',
                                    color: r.disliked ? 'var(--red)' : 'var(--mut)',
                                  }}
                                  onClick={() => reactReviewRemark(review.id, r.id, 'dis')}
                                  title="Mark as unhelpful"
                                >
                                  <ThumbsDown size={11} /> ({r.dis || 0})
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: MONITORED BLACKLIST in Large Cards (Requirement 9) */}
      {activeTab === 'blacklist' && (
        <div>
          {filteredCases.length === 0 ? (
            <div className="card" style={{ padding: '56px 24px', textAlign: 'center', background: '#ffffff', borderRadius: '12px', border: '1px dashed var(--line)' }}>
              <ShieldCheck size={40} style={{ color: '#16a34a', margin: '0 auto 12px' }} />
              <h3 style={{ margin: '0 0 6px', fontSize: '16px', color: 'var(--ink)' }}>No active blacklist cases</h3>
              <p style={{ margin: '0 0 18px', fontSize: '13px', color: 'var(--mut)', maxWidth: '420px', marginLeft: 'auto', marginRight: 'auto' }}>
                All enterprise logistics partners in your monitored network are currently verified and in good standing.
              </p>
              <button className="btn danger" onClick={() => setShowNewCaseModal(true)}>
                <ShieldAlert size={14} /> Report Violation
              </button>
            </div>
          ) : (
            <div className="nexus-grid-cards">
              {filteredCases.map((c) => (
                <div
                  key={c.id}
                  className="card"
                  style={{
                    padding: '20px 22px',
                    borderRadius: '12px',
                    border: '1.5px solid #fecaca',
                    background: '#ffffff',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <b style={{ fontSize: '15px', color: '#991b1b', display: 'block' }}>
                        {c.companyName}
                      </b>
                      <small style={{ color: 'var(--mut)', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '3px', marginTop: '2px' }}>
                        <MapPin size={11} /> {c.location} · Case ID: <b>{c.id}</b>
                      </small>
                    </div>
                    <span
                      className={`badge ${c.severity === 'critical' ? 'red' : 'amber'}`}
                      style={{ fontSize: '10px', fontWeight: 800, padding: '3px 8px' }}
                    >
                      {c.severity.toUpperCase()} RISK
                    </span>
                  </div>

                  <div style={{ padding: '10px 12px', background: '#fff0f0', borderRadius: '8px', border: '1px solid #fee2e2' }}>
                    <b style={{ fontSize: '12px', color: '#991b1b', display: 'block' }}>Infraction: {c.reason}</b>
                    <p style={{ margin: '6px 0 0', fontSize: '12.5px', color: 'var(--ink)', lineHeight: 1.5 }}>
                      {c.description}
                    </p>
                  </div>

                  {/* Global Consensus Panel (Requirement 9) */}
                  <div style={{ padding: '10px 12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px' }}>
                      <span style={{ fontWeight: 700, color: 'var(--ink)' }}>Global Trade Consensus:</span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <span style={{ color: '#15803d', fontWeight: 700 }}>
                          ✓ {c.agreedCount || 0} Agreed Defaults
                        </span>
                        <span style={{ color: '#0369a1', fontWeight: 700 }}>
                          ⚖️ {c.disputeCount || 0} Disputes
                        </span>
                      </div>
                    </div>

                    {/* Consensus Balance Meter */}
                    <div style={{ width: '100%', height: '6px', background: '#e2e8f0', borderRadius: '3px', overflow: 'hidden', display: 'flex' }}>
                      <div
                        style={{
                          height: '100%',
                          background: '#15803d',
                          width: `${Math.max(15, ((c.agreedCount || 1) / ((c.agreedCount || 1) + (c.disputeCount || 0))) * 100)}%`,
                        }}
                      />
                      <div
                        style={{
                          height: '100%',
                          background: '#0284c7',
                          width: `${((c.disputeCount || 0) / ((c.agreedCount || 1) + (c.disputeCount || 0))) * 100}%`,
                        }}
                      />
                    </div>

                    {/* Active Dispute Counter-Claims */}
                    {c.disputes && c.disputes.length > 0 && (
                      <div style={{ marginTop: '4px', padding: '6px 8px', background: '#f0f9ff', borderRadius: '4px', border: '1px solid #bae6fd', fontSize: '11px', color: '#0369a1' }}>
                        <b>Counter-Claim under review:</b> &quot;{c.disputes[0].text}&quot; — <i>{c.disputes[0].authorCompany || c.disputes[0].author}</i>
                      </div>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #fee2e2', paddingTop: '10px', marginTop: 'auto', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        type="button"
                        className={`btn sm ${c.userAgreed ? 'primary' : 'secondary'}`}
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => agreeCase(c.id)}
                        title="Confirm you agree this company defaulted"
                      >
                        <ThumbsUp size={11} /> {c.userAgreed ? 'Agreed' : 'Agree'} ({c.agreedCount || 0})
                      </button>
                      <button
                        type="button"
                        className="btn secondary sm"
                        style={{ fontSize: '11px', padding: '3px 8px' }}
                        onClick={() => setDisputeModalTarget(c)}
                        title="File dispute counter-evidence"
                      >
                        <Scale size={11} /> Dispute ({c.disputeCount || 0})
                      </button>
                    </div>

                    <button
                      className="btn secondary sm"
                      style={{ borderColor: '#fca5a5', color: '#991b1b', background: '#fff5f5', fontWeight: 700, fontSize: '11px' }}
                      onClick={() => setSelectedCaseDossier(c)}
                    >
                      <ShieldAlert size={12} /> Inspect Dossier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      {/* Report Modal - Foreground zIndex 1200 ensuring visibility over full screen topic view */}
      {reportModalTarget && (
        <Modal
          isOpen={Boolean(reportModalTarget)}
          onClose={() => {
            if (!isSubmittingReport) {
              setReportModalTarget(null);
              setReportDescription('');
            }
          }}
          title="Report Discussion to FR8X Moderation"
          maxWidth="560px"
          zIndex={1200}
        >
          <form onSubmit={handleConfirmReport} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {/* Target Summary Banner */}
            <div style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#991b1b', fontSize: '11.5px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <Flag size={12} /> Flagging Topic For Review
              </div>
              <b style={{ display: 'block', fontSize: '14px', color: '#7f1d1d', marginTop: '4px', lineHeight: 1.4 }}>
                &quot;{reportModalTarget.title}&quot;
              </b>
              <small style={{ display: 'block', color: 'var(--mut)', fontSize: '11px', marginTop: '2px' }}>
                Topic ID: <code style={{ fontFamily: 'var(--font-mono)' }}>{reportModalTarget.id}</code> · Report will be dispatched directly to <strong style={{ color: '#0369a1' }}>support@fr8x.in</strong>
              </small>
            </div>

            <div className="field">
              <label style={{ fontSize: '12px', fontWeight: 700 }}>Reason for Flagging / Violation Category</label>
              <select
                className="input"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value as any)}
                disabled={isSubmittingReport}
                style={{ fontSize: '13px' }}
              >
                <option value="spam">Commercial Spam / Solicitation</option>
                <option value="misleading">Misleading Freight Quote / Rates</option>
                <option value="fraud">Suspected Fraud / False Entity</option>
                <option value="harassment">Unprofessional Conduct / Defamation</option>
                <option value="prohibited">Prohibited Cargo / Regulatory Breach</option>
                <option value="other">Other Community Guideline Violation</option>
              </select>
            </div>

            <div className="field">
              <label style={{ fontSize: '12px', fontWeight: 700 }}>
                Provide Context &amp; Audit Notes <span style={{ color: 'var(--red)' }}>*</span>
              </label>
              <textarea
                className="input"
                rows={4}
                placeholder="Explain the specific violation so the FR8X Support &amp; Moderation team can take immediate action..."
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                disabled={isSubmittingReport}
                required
                style={{ fontSize: '13px', lineHeight: 1.5, resize: 'vertical' }}
              />
              <small style={{ color: 'var(--mut)', fontSize: '11px', marginTop: '4px', display: 'block' }}>
                Your report audit log includes your verified member identity ({user?.displayName || user?.email || 'Member'}) and will be dispatched directly to support@fr8x.in.
              </small>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px', paddingTop: '10px', borderTop: '1px solid var(--line)' }}>
              <button
                type="button"
                className="btn secondary"
                onClick={() => {
                  setReportModalTarget(null);
                  setReportDescription('');
                }}
                disabled={isSubmittingReport}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn primary"
                disabled={isSubmittingReport}
                style={{ background: 'var(--red)', borderColor: 'var(--red)', display: 'flex', alignItems: 'center', gap: '6px' }}
              >
                {isSubmittingReport ? (
                  <>
                    <Loader2 size={13} className="spin" /> Sending to support@fr8x.in...
                  </>
                ) : (
                  <>
                    <Flag size={13} /> Submit Report
                  </>
                )}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
