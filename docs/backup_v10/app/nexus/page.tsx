'use client';

import React, { useState } from 'react';
import { useData } from '@/lib/context/DataContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { Modal } from '@/components/ui/Modal';
import { ProfileLink } from '@/components/ui/ProfileLink';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { NexusTopic, CompanyReview, BlacklistCase } from '@/lib/types';
import {
  MessagesSquare,
  Star,
  ShieldAlert,
  Plus,
  Search,
  Building2,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  ShieldCheck,
  AlertTriangle,
  FileText,
} from 'lucide-react';

export default function NexusPage() {
  const { topics, addTopic, addTopicReply, reviews, addReview, cases, addCase } = useData();
  const { user } = useAuth();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<'community' | 'reviews' | 'blacklist'>('community');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals
  const [selectedTopic, setSelectedTopic] = useState<NexusTopic | null>(null);
  const [topicReplyText, setTopicReplyText] = useState('');
  const [showNewTopicModal, setShowNewTopicModal] = useState(false);
  const [newTopicSubject, setNewTopicSubject] = useState('');
  const [newTopicCategory, setNewTopicCategory] = useState('Routing Strategy');
  const [newTopicBody, setNewTopicBody] = useState('');

  const [selectedReview, setSelectedReview] = useState<CompanyReview | null>(null);
  const [showAddReviewModal, setShowAddReviewModal] = useState(false);
  const [reviewTargetCompanyId, setReviewTargetCompanyId] = useState('');
  const [reviewRatingStars, setReviewRatingStars] = useState(5);
  const [reviewFeedback, setReviewFeedback] = useState('');

  const [selectedCase, setSelectedCase] = useState<BlacklistCase | null>(null);
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [caseCompany, setCaseCompany] = useState('');
  const [caseLocation, setCaseLocation] = useState('Mumbai, India');
  const [caseReason, setCaseReason] = useState('Payment default');
  const [caseDescription, setCaseDescription] = useState('');

  // Search Filters
  const filteredTopics = topics.filter((t) =>
    (t.title + ' ' + t.author + ' ' + t.category).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredReviews = reviews.filter((r) =>
    (r.companyName + ' ' + r.location).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredCases = cases.filter((c) =>
    (c.companyName + ' ' + c.location + ' ' + c.reason).toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTopic = () => {
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
    setTopicReplyText('');
    // Update local modal state
    setSelectedTopic((prev) =>
      prev
        ? {
            ...prev,
            commentsCount: prev.commentsCount + 1,
            replies: [
              ...prev.replies,
              {
                author: user.displayName,
                text: topicReplyText,
                time: 'Just now',
                hasGoldenTick: user.hasGoldenTick,
              },
            ],
          }
        : null
    );
  };

  const handleCreateReview = () => {
    if (!reviewTargetCompanyId || !reviewFeedback.trim()) {
      toast('Please select a company and provide review feedback.');
      return;
    }
    addReview(reviewTargetCompanyId, reviewRatingStars, reviewFeedback);
    setShowAddReviewModal(false);
    setReviewFeedback('');
  };

  const handleCreateCase = () => {
    if (!caseCompany.trim() || !caseDescription.trim()) {
      toast('Company name and facts description are required.');
      return;
    }
    addCase(caseCompany, caseLocation, caseReason, caseDescription);
    setShowNewCaseModal(false);
    setCaseCompany('');
    setCaseDescription('');
  };

  // Render 5-Star Distribution Bars
  const renderStarBars = (dist: [number, number, number, number, number]) => {
    const total = dist.reduce((sum, n) => sum + n, 0) || 1;
    return (
      <div className="starbars">
        {[5, 4, 3, 2, 1].map((stars, idx) => (
          <div key={stars} className="sr">
            <label>{stars}★</label>
            <span>
              <i style={{ width: `${(dist[idx] / total) * 100}%` }} />
            </span>
            <em>{dist[idx]}</em>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div className="head">
        <div>
          <h1>Nexus Intelligence</h1>
          <p>Community knowledge exchange, verified company ratings, and moderated risk/blacklist records.</p>
        </div>
        <div className="actions">
          {activeTab === 'community' && (
            <button className="btn primary" onClick={() => setShowNewTopicModal(true)}>
              <Plus size={15} /> Start a Topic
            </button>
          )}
          {activeTab === 'reviews' && (
            <button className="btn primary" onClick={() => setShowAddReviewModal(true)}>
              <Plus size={15} /> Add Company Rating
            </button>
          )}
          {activeTab === 'blacklist' && (
            <button className="btn primary" onClick={() => setShowNewCaseModal(true)}>
              <ShieldAlert size={15} /> Report Risk Case
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={activeTab === 'community' ? 'on' : ''}
          onClick={() => {
            setActiveTab('community');
            setSearchQuery('');
          }}
        >
          Community Discussions
        </button>
        <button
          className={activeTab === 'reviews' ? 'on' : ''}
          onClick={() => {
            setActiveTab('reviews');
            setSearchQuery('');
          }}
        >
          Company Ratings
        </button>
        <button
          className={activeTab === 'blacklist' ? 'on' : ''}
          onClick={() => {
            setActiveTab('blacklist');
            setSearchQuery('');
          }}
        >
          Blacklist / Risk Cases
        </button>
      </div>

      {/* Top 3 Metric Row Cards */}
      <div className="grid g3" style={{ marginBottom: '14px' }}>
        <div
          className="card cardbody"
          style={{
            cursor: 'pointer',
            borderLeft: activeTab === 'community' ? '3px solid var(--brand)' : undefined,
          }}
          onClick={() => setActiveTab('community')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--brand)', marginBottom: '4px' }}>
            <MessagesSquare size={16} />
            <small style={{ color: 'var(--mut)', fontWeight: 700 }}>COMMUNITY POSTS</small>
          </div>
          <b style={{ fontSize: '20px', color: 'var(--ink)' }}>{topics.length}</b>
          <span style={{ fontSize: '11px', color: 'var(--mut)', display: 'block' }}>
            Active trade lane & strategy threads
          </span>
        </div>

        <div
          className="card cardbody"
          style={{
            cursor: 'pointer',
            borderLeft: activeTab === 'reviews' ? '3px solid var(--gold)' : undefined,
          }}
          onClick={() => setActiveTab('reviews')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--gold)', marginBottom: '4px' }}>
            <Star size={16} />
            <small style={{ color: 'var(--mut)', fontWeight: 700 }}>COMPANY RATINGS</small>
          </div>
          <b style={{ fontSize: '20px', color: 'var(--ink)' }}>{reviews.length} Entities</b>
          <span style={{ fontSize: '11px', color: 'var(--mut)', display: 'block' }}>
            500+ verified counterparty evaluations
          </span>
        </div>

        <div
          className="card cardbody"
          style={{
            cursor: 'pointer',
            borderLeft: activeTab === 'blacklist' ? '3px solid var(--red)' : undefined,
          }}
          onClick={() => setActiveTab('blacklist')}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--red)', marginBottom: '4px' }}>
            <ShieldAlert size={16} />
            <small style={{ color: 'var(--mut)', fontWeight: 700 }}>REPORTED CASES</small>
          </div>
          <b style={{ fontSize: '20px', color: 'var(--ink)' }}>{cases.length} Registered</b>
          <span style={{ fontSize: '11px', color: 'var(--mut)', display: 'block' }}>
            Moderated commercial default records
          </span>
        </div>
      </div>

      {/* Main Content Area */}
      {activeTab === 'community' && (
        <div className="card">
          <div className="cardhead">
            <span>Community Knowledge Forum</span>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                style={{ height: '29px', width: '230px', fontSize: '11.5px' }}
                placeholder="Search community topics…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div>
            {filteredTopics.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--mut)' }}>
                No topics matching query.
              </div>
            ) : (
              filteredTopics.map((t) => (
                <div key={t.id} className="record">
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className="badge blue" style={{ fontSize: '9px' }}>
                        {t.category}
                      </span>
                      <b style={{ color: 'var(--ink)' }}>{t.title}</b>
                    </div>
                    <small>
                      Authored by <ProfileLink name={t.author} hasGoldenTick={t.hasGoldenTick} /> ·{' '}
                      {t.createdAt}
                    </small>
                  </div>
                  <div className="recordactions">
                    <span>👍 {t.likes}</span>
                    <span>👎 {t.dis}</span>
                    <span>💬 {t.commentsCount} comments</span>
                    <button
                      className="btn secondary sm"
                      onClick={() => setSelectedTopic(t)}
                    >
                      Read Post
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'reviews' && (
        <div className="card">
          <div className="cardhead">
            <span>Verified Freight Entity Ratings & 5-Star Buckets</span>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                style={{ height: '29px', width: '230px', fontSize: '11.5px' }}
                placeholder="Search rated companies…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div>
            {filteredReviews.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--mut)' }}>
                No company ratings found.
              </div>
            ) : (
              filteredReviews.map((rev) => (
                <div key={rev.id} className="record">
                  <div className="co">
                    <div className="cologo">
                      {rev.companyName
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .substring(0, 2)}
                    </div>
                    <div>
                      <b style={{ color: 'var(--ink)' }}>{rev.companyName}</b>
                      <small>{rev.location}</small>
                      <small style={{ color: 'var(--gold)', fontWeight: 700 }}>
                        ★ {rev.ratingAverage.toFixed(1)} / 5.0 ({rev.totalReviews} verified ratings)
                      </small>
                    </div>
                  </div>

                  {renderStarBars(rev.starDistribution)}

                  <button
                    className="btn secondary sm"
                    onClick={() => setSelectedReview(rev)}
                  >
                    View Breakdown
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'blacklist' && (
        <div className="card">
          <div className="cardhead">
            <span>Reported Cases & Compliance Risk Registry</span>
            <div style={{ position: 'relative' }}>
              <input
                className="input"
                style={{ height: '29px', width: '230px', fontSize: '11.5px' }}
                placeholder="Search reported cases…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div>
            {filteredCases.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--mut)' }}>
                No blacklist records found.
              </div>
            ) : (
              filteredCases.map((c) => (
                <div key={c.id} className="record">
                  <div className="co">
                    <div className="cologo risk">
                      {c.companyName
                        .split(' ')
                        .map((p) => p[0])
                        .join('')
                        .substring(0, 2)}
                    </div>
                    <div>
                      <b style={{ color: 'var(--ink)' }}>{c.companyName}</b>
                      <small>
                        {c.location} · <span style={{ color: 'var(--red)', fontWeight: 600 }}>{c.reason}</span>
                      </small>
                      <small style={{ color: 'var(--mut)' }}>
                        Status: <span className="badge amber" style={{ fontSize: '8.5px' }}>{c.status.toUpperCase()}</span>
                      </small>
                    </div>
                  </div>

                  <button
                    className="btn secondary sm"
                    onClick={() => setSelectedCase(c)}
                  >
                    View Details
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Read Topic Modal */}
      {selectedTopic && (
        <Modal
          isOpen={!!selectedTopic}
          onClose={() => setSelectedTopic(null)}
          title={selectedTopic.title}
          footer={
            <button className="btn secondary" onClick={() => setSelectedTopic(null)}>
              Close
            </button>
          }
        >
          <div style={{ marginBottom: '12px' }}>
            <span className="badge blue" style={{ marginBottom: '6px' }}>
              {selectedTopic.category}
            </span>
            <p style={{ color: 'var(--mut)', fontSize: '11.5px', margin: '4px 0 10px' }}>
              Started by <ProfileLink name={selectedTopic.author} hasGoldenTick={selectedTopic.hasGoldenTick} /> · {selectedTopic.createdAt}
            </p>
            <div className="card cardbody" style={{ background: '#f8fafc', fontSize: '13px', lineHeight: 1.6 }}>
              {selectedTopic.text}
            </div>
          </div>

          {/* Conversation Responses */}
          <div className="card" style={{ marginBottom: '12px' }}>
            <div className="cardhead">
              <span>Discussion Thread ({selectedTopic.replies.length})</span>
            </div>
            <div className="cardbody" style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {selectedTopic.replies.length === 0 ? (
                <p style={{ color: 'var(--mut)', fontSize: '11.5px' }}>No replies yet. Be the first to contribute.</p>
              ) : (
                selectedTopic.replies.map((r, i) => (
                  <div key={i} style={{ padding: '8px 0', borderBottom: '1px solid #edf2f7' }}>
                    <b style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <ProfileLink name={r.author} hasGoldenTick={r.hasGoldenTick} />
                      <small style={{ color: 'var(--mut)', fontWeight: 400 }}>· {r.time}</small>
                    </b>
                    <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', margin: '3px 0 0' }}>{r.text}</p>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Reply Form */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <input
              className="input"
              placeholder="Contribute to this discussion…"
              value={topicReplyText}
              onChange={(e) => setTopicReplyText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTopicReply();
              }}
            />
            <button className="btn primary" onClick={handleTopicReply}>
              Post Reply
            </button>
          </div>
        </Modal>
      )}

      {/* Start Topic Modal */}
      <Modal
        isOpen={showNewTopicModal}
        onClose={() => setShowNewTopicModal(false)}
        title="Start a Community Discussion Topic"
        footer={
          <>
            <button className="btn secondary" onClick={() => setShowNewTopicModal(false)}>
              Cancel
            </button>
            <button className="btn primary" onClick={handleCreateTopic}>
              Publish Topic
            </button>
          </>
        }
      >
        <div className="grid g2">
          <div className="field">
            <label>
              Topic Subject <span className="req">*</span>
            </label>
            <input
              className="input"
              placeholder="e.g. Blank sailing workarounds for North Europe"
              value={newTopicSubject}
              onChange={(e) => setNewTopicSubject(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Category</label>
            <select
              className="input"
              value={newTopicCategory}
              onChange={(e) => setNewTopicCategory(e.target.value)}
            >
              <option value="Routing Strategy">Routing Strategy</option>
              <option value="Commercial Terms">Commercial Terms</option>
              <option value="Regulatory & Compliance">Regulatory & Compliance</option>
              <option value="Port Congestion">Port Congestion</option>
              <option value="Equipment & Space">Equipment & Space</option>
            </select>
          </div>
        </div>
        <div className="field" style={{ marginTop: '10px' }}>
          <label>
            Topic Content <span className="req">*</span>
          </label>
          <textarea
            className="input"
            rows={4}
            placeholder="Share detailed context, trade corridor, carrier patterns, or practical questions…"
            value={newTopicBody}
            onChange={(e) => setNewTopicBody(e.target.value)}
          />
        </div>
      </Modal>

      {/* View Company Review Modal */}
      {selectedReview && (
        <Modal
          isOpen={!!selectedReview}
          onClose={() => setSelectedReview(null)}
          title={`${selectedReview.companyName} — Ratings & Star Counts`}
          footer={
            <button className="btn secondary" onClick={() => setSelectedReview(null)}>
              Close
            </button>
          }
        >
          <div className="card cardbody" style={{ background: '#f8fafc', marginBottom: '12px' }}>
            <div className="kv">
              <span>Company</span>
              <b>{selectedReview.companyName}</b>
            </div>
            <div className="kv">
              <span>Location</span>
              <b>{selectedReview.location}</b>
            </div>
            <div className="kv">
              <span>Average Rating</span>
              <b style={{ color: 'var(--gold)' }}>★ {selectedReview.ratingAverage.toFixed(1)} / 5.0</b>
            </div>
            <div className="kv">
              <span>Total Verified Evaluations</span>
              <b>{selectedReview.totalReviews} Transacting Counterparties</b>
            </div>
          </div>

          <div className="card cardbody" style={{ marginBottom: '12px' }}>
            <b style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>5-Star Bucket Distribution</b>
            {renderStarBars(selectedReview.starDistribution)}
          </div>

          <div className="card cardbody">
            <b style={{ fontSize: '12px', display: 'block', marginBottom: '8px' }}>Verified Counterparty Feedback</b>
            {selectedReview.recentReviews.map((r, i) => (
              <div key={i} style={{ padding: '7px 0', borderBottom: '1px solid #edf2f7' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <b style={{ fontSize: '12px' }}>{r.author}</b>
                  <span style={{ color: 'var(--gold)', fontWeight: 700, fontSize: '11px' }}>{'★'.repeat(r.rating)}</span>
                </div>
                <p style={{ fontSize: '11.5px', color: 'var(--ink-secondary)', margin: '2px 0 0' }}>{r.text}</p>
                <small style={{ color: 'var(--mut)', fontSize: '10px' }}>{r.date} · Verified Transacting Entity</small>
              </div>
            ))}
          </div>
        </Modal>
      )}

      {/* Add Company Review Modal */}
      <Modal
        isOpen={showAddReviewModal}
        onClose={() => setShowAddReviewModal(false)}
        title="Submit Verified Company Rating"
        footer={
          <>
            <button className="btn secondary" onClick={() => setShowAddReviewModal(false)}>
              Cancel
            </button>
            <button className="btn primary" onClick={handleCreateReview}>
              Submit Evaluation
            </button>
          </>
        }
      >
        <div className="field" style={{ marginBottom: '10px' }}>
          <label>Select Transacting Entity</label>
          <select
            className="input"
            value={reviewTargetCompanyId}
            onChange={(e) => setReviewTargetCompanyId(e.target.value)}
          >
            <option value="">Select Company…</option>
            {reviews.map((r) => (
              <option key={r.id} value={r.id}>
                {r.companyName} ({r.location})
              </option>
            ))}
          </select>
        </div>

        <div className="field" style={{ marginBottom: '10px' }}>
          <label>Overall Star Rating</label>
          <select
            className="input"
            value={reviewRatingStars}
            onChange={(e) => setReviewRatingStars(Number(e.target.value))}
          >
            <option value="5">5 Stars — Excellent Service & Space Reliability</option>
            <option value="4">4 Stars — Good Performance</option>
            <option value="3">3 Stars — Average / Minor Delays</option>
            <option value="2">2 Stars — Sub-par Performance</option>
            <option value="1">1 Star — Severe Dispute / Non-performance</option>
          </select>
        </div>

        <div className="field">
          <label>Commercial Experience Review</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Describe your freight transaction experience, documentation turnaround, and carrier communication…"
            value={reviewFeedback}
            onChange={(e) => setReviewFeedback(e.target.value)}
          />
        </div>
      </Modal>

      {/* View Risk Case Modal */}
      {selectedCase && (
        <Modal
          isOpen={!!selectedCase}
          onClose={() => setSelectedCase(null)}
          title={`${selectedCase.companyName} — Risk Case Snapshot`}
          footer={
            <button className="btn secondary" onClick={() => setSelectedCase(null)}>
              Close
            </button>
          }
        >
          <div className="card cardbody" style={{ background: '#fff0f1', border: '1px solid #f0c8ce', marginBottom: '12px' }}>
            <div className="kv">
              <span>Reported Reason</span>
              <b style={{ color: 'var(--red)' }}>{selectedCase.reason}</b>
            </div>
            <div className="kv">
              <span>Severity Level</span>
              <b style={{ textTransform: 'uppercase', color: 'var(--red)' }}>{selectedCase.severity}</b>
            </div>
            <div className="kv">
              <span>Audit Evidence Ref</span>
              <b style={{ fontFamily: 'var(--font-mono)', fontSize: '10.5px' }}>{selectedCase.evidenceRef}</b>
            </div>
            <div className="kv">
              <span>Moderation Status</span>
              <b style={{ textTransform: 'uppercase' }}>{selectedCase.status}</b>
            </div>
          </div>

          <div className="card cardbody">
            <b style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Case Facts & Verification Notes</b>
            <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
              {selectedCase.description}
            </p>
            <p style={{ fontSize: '11px', color: 'var(--mut)', marginTop: '8px' }}>
              Reported by: <b>{selectedCase.reporter}</b> · Registered on {selectedCase.reportedDate}.
            </p>
          </div>
        </Modal>
      )}

      {/* Report Risk Case Modal */}
      <Modal
        isOpen={showNewCaseModal}
        onClose={() => setShowNewCaseModal(false)}
        title="Report Risk Case to FR8X Compliance Registry"
        footer={
          <>
            <button className="btn secondary" onClick={() => setShowNewCaseModal(false)}>
              Cancel
            </button>
            <button className="btn primary" onClick={handleCreateCase}>
              Submit Case for Moderation
            </button>
          </>
        }
      >
        <div className="grid g2">
          <div className="field">
            <label>
              Defaulting / Disputed Company <span className="req">*</span>
            </label>
            <input
              className="input"
              placeholder="e.g. Acme Freight Forwarders"
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
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>Primary Violation / Reason</label>
            <select
              className="input"
              value={caseReason}
              onChange={(e) => setCaseReason(e.target.value)}
            >
              <option value="Payment default">Payment default (&gt;60 days unpaid ocean invoices)</option>
              <option value="Unilateral rate increase">Unilateral rate increase post-booking</option>
              <option value="BL withholding">Unauthorized Bill of Lading withholding</option>
              <option value="Fraudulent documentation">Fraudulent documentation or false weight declaration</option>
              <option value="Severe cargo delay">Severe unnotified cargo abandonment / delay</option>
            </select>
          </div>
        </div>
        <div className="field" style={{ marginTop: '10px' }}>
          <label>
            Case Facts & Summary <span className="req">*</span>
          </label>
          <textarea
            className="input"
            rows={4}
            placeholder="Provide factual details, invoice dates, booking reference numbers, and dispute communication timeline…"
            value={caseDescription}
            onChange={(e) => setCaseDescription(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
}
