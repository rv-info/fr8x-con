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
    reactReviewRemark,
    cases,
    addCase,
    agreeCase,
    disputeCase,
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
  const [reportModalTarget, setReportModalTarget] = useState<{ id: string; type: PostReport['targetType']; title: string } | null>(null);
  const [reportCategory, setReportCategory] = useState<PostReport['category']>('spam');
  const [reportDescription, setReportDescription] = useState('');

  // Blacklist Case Dossier Modal State (Requirement 9)
  const [selectedCaseDossier, setSelectedCaseDossier] = useState<BlacklistCase | null>(null);

  // Blacklist Dispute Modal State (Requirement 9)
  const [disputeModalTarget, setDisputeModalTarget] = useState<BlacklistCase | null>(null);
  const [disputeText, setDisputeText] = useState('');
  const [disputeEvidenceDoc, setDisputeEvidenceDoc] = useState('');

  // Review Form & Inline Review Modal (Requirement 10)
  const [selectedReview, setSelectedReview] = useState<CompanyReview | null>(null);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [reviewCompanyName, setReviewCompanyName] = useState('Rotterdam Freight NV');
  const [reviewLocation, setReviewLocation] = useState('Rotterdam, Netherlands');
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
  const [caseLocation, setCaseLocation] = useState('Mumbai, India');
  const [caseReason, setCaseReason] = useState('Payment default');
  const [caseSeverity, setCaseSeverity] = useState<'moderate' | 'high' | 'critical'>('high');
  const [caseDescription, setCaseDescription] = useState('');
  const [caseEvidence, setCaseEvidence] = useState('');

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

  const handleUpdateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTopic || !editTopicTitle.trim() || !editTopicBody.trim()) {
      toast('Title and content are required.');
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

  const handleConfirmReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportModalTarget) return;
    reportTarget(reportModalTarget.id, reportModalTarget.type, reportCategory, reportDescription || 'Violation of freight community policy');
    setReportModalTarget(null);
    setReportDescription('');
    toast('Report lodged with FR8X Moderation Board.');
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

      {/* Report Modal */}
      {reportModalTarget && (
        <Modal
          isOpen={Boolean(reportModalTarget)}
          onClose={() => setReportModalTarget(null)}
          title={`Report to Moderation Board: ${reportModalTarget.title}`}
          maxWidth="520px"
        >
          <form onSubmit={handleConfirmReport} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="field">
              <label>Reason for Flagging / Violation Category</label>
              <select
                className="input"
                value={reportCategory}
                onChange={(e) => setReportCategory(e.target.value as any)}
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
              <label>Provide Context & Audit Notes</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Explain the violation so FR8X moderators can take immediate action…"
                value={reportDescription}
                onChange={(e) => setReportDescription(e.target.value)}
                required
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <button type="button" className="btn secondary" onClick={() => setReportModalTarget(null)}>
                Cancel
              </button>
              <button type="submit" className="btn primary" style={{ background: 'var(--red)', borderColor: 'var(--red)' }}>
                <Flag size={13} /> Submit Report
              </button>
            </div>
          </form>
        </Modal>
      )}

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

              {(user.displayName === selectedTopic.author || user.role === 'super_admin' || user.role === 'company_admin' || (user as any).isSuperAdmin) && !isEditingTopic && (
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => {
                    setIsEditingTopic(true);
                    setEditTopicTitle(selectedTopic.title);
                    setEditTopicCategory(selectedTopic.category);
                    setEditTopicBody(selectedTopic.text);
                  }}
                  title="Edit Topic Content"
                  style={{ height: '28px', padding: '0 8px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Edit3 size={12} /> Edit
                </button>
              )}

              {(user.displayName === selectedTopic.author || user.role === 'super_admin' || user.role === 'company_admin' || (user as any).isSuperAdmin) && (
                <button
                  type="button"
                  className="btn secondary sm"
                  onClick={() => handleDeleteTopic(selectedTopic.id)}
                  title="Delete Topic"
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

          {/* Two-column layout in Full Screen */}
          <div style={{ display: 'grid', gridTemplateColumns: isTopicFullScreen ? '1.1fr 1fr' : '1fr 1fr', gap: '24px', flex: 1, minHeight: isTopicFullScreen ? 'calc(100vh - 180px)' : '480px' }}>
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
                      onClick={() => setReportModalTarget({ id: selectedTopic.id, type: 'post', title: selectedTopic.title })}
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
                          {(reply.author === user.displayName || user.role === 'super_admin' || user.role === 'company_admin' || (user as any).isSuperAdmin) && reply.id && (
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
              <div className="field">
                <label>Reported Company Name <span className="req">*</span></label>
                <input
                  className="input"
                  placeholder="e.g. Apex Global Logistics"
                  value={caseCompany}
                  onChange={(e) => setCaseCompany(e.target.value)}
                />
              </div>
              <div className="field">
                <label>Company Location</label>
                <input
                  className="input"
                  value={caseLocation}
                  onChange={(e) => setCaseLocation(e.target.value)}
                />
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

      {/* Top 3 KPI Cards */}
      <div className="grid g3">
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
                        setReportModalTarget({ id: topic.id, type: 'post', title: topic.title });
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
        </div>
      )}

      {/* TAB 2: COMPANY REVIEWS in Large Cards (Requirement 10) */}
      {activeTab === 'reviews' && (
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

                  {review.recentReviews.map((r) => (
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
                        </div>
                        <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>{r.date}</small>
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
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: MONITORED BLACKLIST in Large Cards (Requirement 9) */}
      {activeTab === 'blacklist' && (
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
  );
}
