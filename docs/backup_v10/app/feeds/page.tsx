'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useData } from '@/lib/context/DataContext';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useChat } from '@/lib/context/ChatContext';
import { Modal } from '@/components/ui/Modal';
import { ProfileLink } from '@/components/ui/ProfileLink';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { parseRichText, formatNumber } from '@/lib/utils';
import { FeedPost, JobPost } from '@/lib/types';
import {
  Send,
  Search,
  ThumbsUp,
  ThumbsDown,
  MessageCircle,
  Bookmark,
  Repeat2,
  MoreVertical,
  Plus,
  Trash2,
  Edit2,
  Flag,
  Copy,
  Briefcase,
  ImageUp,
  Clock,
  Sparkles,
  ExternalLink,
} from 'lucide-react';

export default function FeedsPage() {
  const {
    posts,
    addPost,
    deletePost,
    reactPost,
    savePost,
    addComment,
    addReply,
    reactComment,
    reactReply,
    jobs,
    addJob,
    deleteJob,
    bookAd,
  } = useData();

  const { user } = useAuth();
  const { toast } = useToast();
  const { openChatWith } = useChat();

  // State
  const [feedSearch, setFeedSearch] = useState('');
  const [postText, setPostText] = useState('');
  const [showAllPosts, setShowAllPosts] = useState(false);

  // Active expanded comment boxes & reply boxes
  const [expandedComments, setExpandedComments] = useState<Record<string | number, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string | number, string>>({});
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [activeReplyBoxId, setActiveReplyBoxId] = useState<string | null>(null);

  // Modals
  const [selectedJobModal, setSelectedJobModal] = useState<JobPost | null>(null);
  const [showJobFormModal, setShowJobFormModal] = useState(false);
  const [showAdModal, setShowAdModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState<FeedPost | null>(null);
  const [reportReason, setReportReason] = useState('Irrelevant or spam content');

  // Job Form State
  const [jobTitle, setJobTitle] = useState('');
  const [jobEmpType, setJobEmpType] = useState('Full-time');
  const [jobLocation, setJobLocation] = useState('Mumbai, India · On-site');
  const [jobExp, setJobExp] = useState('3–5 yrs experience');
  const [jobPkg, setJobPkg] = useState('₹8–12 LPA');
  const [jobReq, setJobReq] = useState('');

  // Ad Form State
  const [adBusiness, setAdBusiness] = useState(user.company);
  const [adEmail, setAdEmail] = useState(user.email);
  const [adHeadline, setAdHeadline] = useState('');
  const [adDurationDays, setAdDurationDays] = useState(2);
  const [adAmount, setAdAmount] = useState(1000);
  const [adImageStatus, setAdImageStatus] = useState<'idle' | 'ok' | 'bad'>('idle');
  const [adImageMsg, setAdImageMsg] = useState('');
  const [adImagePreview, setAdImagePreview] = useState<string | null>(null);

  // Filtered Posts
  const filteredPosts = posts.filter((p) =>
    (p.author + ' ' + (p.authorCompany || '') + ' ' + p.text)
      .toLowerCase()
      .includes(feedSearch.toLowerCase())
  );

  const displayedPosts = showAllPosts ? filteredPosts : filteredPosts.slice(0, 7);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!postText.trim()) {
      toast('Write an update before posting.');
      return;
    }
    addPost(postText);
    setPostText('');
  };

  const handleCommentSubmit = (postId: string | number) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    addComment(postId, text);
    setCommentInputs((prev) => ({ ...prev, [postId]: '' }));
  };

  const handleReplySubmit = (postId: string | number, commentId: string) => {
    const key = `${postId}-${commentId}`;
    const text = replyInputs[key];
    if (!text || !text.trim()) return;
    addReply(postId, commentId, text);
    setReplyInputs((prev) => ({ ...prev, [key]: '' }));
    setActiveReplyBoxId(null);
  };

  // Ad Image Validation (PNG/GIF only, 237x299 px)
  const handleAdImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!/(png|gif)$/i.test(file.name)) {
      setAdImageStatus('bad');
      setAdImageMsg('Only PNG or GIF format allowed.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        if (img.width === 237 && img.height === 299) {
          setAdImageStatus('ok');
          setAdImageMsg('✓ Valid dimensions (237 × 299 px).');
          setAdImagePreview(event.target?.result as string);
        } else {
          setAdImageStatus('bad');
          setAdImageMsg(`Requires 237 × 299 px; uploaded ${img.width} × ${img.height} px.`);
          setAdImagePreview(null);
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleAdSubmit = () => {
    if (!adBusiness.trim() || !adEmail.trim() || !adHeadline.trim()) {
      toast('Please complete all required fields.');
      return;
    }
    if (adImageStatus !== 'ok' || !adImagePreview) {
      toast('Please upload a valid creative conforming to 237 × 299 px.');
      return;
    }
    bookAd({
      businessName: adBusiness,
      email: adEmail,
      headline: adHeadline,
      imageUrl: adImagePreview,
      durationDays: adDurationDays,
      amount: adAmount,
    });
    setShowAdModal(false);
  };

  const handleJobSubmit = () => {
    if (!jobTitle.trim() || !jobLocation.trim()) {
      toast('Job title and location are required.');
      return;
    }
    addJob({
      title: jobTitle,
      company: user.company,
      location: jobLocation,
      experience: jobExp,
      packageDetails: jobPkg,
      employmentType: jobEmpType,
      requirements: jobReq || 'Freight procurement, carrier negotiations, and CRM proficiency.',
    });
    setShowJobFormModal(false);
    setJobTitle('');
    setJobReq('');
  };

  const submitReport = () => {
    toast(`Post reported for: ${reportReason}. Dispatched to moderation registry.`);
    setShowReportModal(null);
  };

  return (
    <div>
      {/* Header */}
      <div className="head">
        <div>
          <h1>Freight Feeds</h1>
          <p>Real-time updates, market intelligence, jobs, and networking across global logistics.</p>
        </div>
      </div>

      <div className="feedgrid">
        {/* Left Column: Self Profile & Contacts */}
        <aside>
          {/* User Self-Profile Card */}
          <div className="card self" style={{ marginBottom: '12px' }}>
            <div className="avatar big">
              {user.displayName
                .split(' ')
                .map((p) => p[0])
                .join('')
                .substring(0, 2)
                .toUpperCase()}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <b>
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.displayName}
                </span>
                {user.hasGoldenTick && <GoldenTick />}
              </b>
              <small>{user.designation}</small>
              <small>{user.company} · {user.city}</small>
              <div style={{ marginTop: '4px' }}>
                <LocalTimeBadge timezone={user.timezone} />
              </div>
              <Link href="/profile" className="btn secondary sm" style={{ marginTop: '8px', width: '100%' }}>
                View My Profile
              </Link>
            </div>
          </div>

          {/* Contacts Card */}
          <div className="card">
            <div className="cardhead">
              <span>Verified Contacts</span>
              <span className="sub">248 in Network</span>
            </div>
            <div>
              {[
                { name: 'Sarah Lewis', role: 'Ocean Freight Lead · Rotterdam', timezone: 'Europe/Amsterdam' },
                { name: 'Kiran Mehta', role: 'Trade Lane Manager · Mumbai', timezone: 'Asia/Kolkata' },
                { name: 'Ravi Thomas', role: 'Procurement Director · Singapore', timezone: 'Asia/Singapore', hasGoldenTick: true },
                { name: 'Priya Nair', role: 'Trade Specialist · Mumbai', timezone: 'Asia/Kolkata' },
              ].map((contact, idx) => (
                <div key={idx} className="job" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <ProfileLink name={contact.name} hasGoldenTick={contact.hasGoldenTick} timezone={contact.timezone} />
                    <small>{contact.role}</small>
                  </div>
                  <button
                    className="btn secondary sm icon"
                    onClick={() => openChatWith(contact.name.toLowerCase().replace(/\s+/g, '-'))}
                    title={`Chat with ${contact.name}`}
                  >
                    <MessageCircle size={13} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* Center Column: Feed Search, Post Creator, Posts */}
        <section>
          {/* Universal Feed Search */}
          <div className="feedsearch">
            <div style={{ position: 'relative', width: '100%', maxWidth: '320px' }}>
              <input
                className="input"
                placeholder="Search feed posts, authors, topics…"
                value={feedSearch}
                onChange={(e) => setFeedSearch(e.target.value)}
              />
            </div>
            {feedSearch && (
              <button className="btn secondary sm" onClick={() => setFeedSearch('')}>
                Clear
              </button>
            )}
          </div>

          {/* Post Creator Box */}
          <div className="card cardbody" style={{ marginBottom: '14px' }}>
            <form onSubmit={handlePostSubmit}>
              <textarea
                className="input"
                rows={3}
                placeholder="Share a market update, spot rate inquiry, or carrier intelligence with your freight network…"
                value={postText}
                onChange={(e) => setPostText(e.target.value)}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px' }}>
                <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>
                  Supports *bold*, _italic_, ~strike~, `code`, and &gt; blockquotes
                </small>
                <button type="submit" className="btn primary">
                  <Send size={14} /> Post Update
                </button>
              </div>
            </form>
          </div>

          {/* Posts List */}
          <div id="postList">
            {displayedPosts.length === 0 ? (
              <div className="card cardbody" style={{ color: 'var(--mut)', textAlign: 'center', padding: '30px' }}>
                No matching feed posts found.
              </div>
            ) : (
              displayedPosts.map((p) => {
                const initials = p.author
                  .split(' ')
                  .map((x) => x[0])
                  .join('')
                  .substring(0, 2)
                  .toUpperCase();

                const isCommentsOpen = expandedComments[p.id] ?? true;

                return (
                  <article key={p.id} className="card post">
                    {/* Post Header */}
                    <div className="posthead">
                      <div className="avatar">{initials}</div>
                      <div>
                        <ProfileLink
                          name={p.author}
                          hasGoldenTick={p.hasGoldenTick}
                          timezone={p.authorTimezone}
                          role={p.authorRole}
                          company={p.authorCompany}
                        />
                        <small>
                          {p.authorRole} · {p.time}
                        </small>
                      </div>

                      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="badge grey">Network</span>
                        {/* Action Menu Trigger */}
                        {p.isOwner || p.authorUid === user.uid ? (
                          <button
                            className="btn secondary sm icon"
                            onClick={() => deletePost(p.id)}
                            title="Delete your post"
                          >
                            <Trash2 size={12} style={{ color: 'var(--red)' }} />
                          </button>
                        ) : (
                          <button
                            className="btn secondary sm icon"
                            onClick={() => setShowReportModal(p)}
                            title="Report post"
                          >
                            <Flag size={12} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Post Body */}
                    <div
                      className="postbody"
                      dangerouslySetInnerHTML={{ __html: parseRichText(p.text) }}
                    />

                    {/* Post Actions */}
                    <div className="acts">
                      <button
                        onClick={() => reactPost(p.id, 'likes')}
                        style={{ color: p.liked ? 'var(--brand)' : undefined, fontWeight: p.liked ? 700 : 500 }}
                      >
                        <ThumbsUp size={13} /> {p.likes}
                      </button>
                      <button
                        onClick={() => reactPost(p.id, 'dis')}
                        style={{ color: p.disliked ? 'var(--red)' : undefined }}
                      >
                        <ThumbsDown size={13} /> {p.dis}
                      </button>
                      <button
                        onClick={() =>
                          setExpandedComments((prev) => ({
                            ...prev,
                            [p.id]: !isCommentsOpen,
                          }))
                        }
                      >
                        <MessageCircle size={13} /> {p.comments.length} Comments
                      </button>
                      <button
                        onClick={() => {
                          navigator.clipboard?.writeText(window.location.href);
                          toast('Direct post link copied to clipboard.');
                        }}
                      >
                        <Repeat2 size={13} /> Repost
                      </button>
                      <button
                        onClick={() => savePost(p.id)}
                        style={{ color: p.isSaved ? 'var(--brand)' : undefined, fontWeight: p.isSaved ? 700 : 500 }}
                      >
                        <Bookmark size={13} /> {p.isSaved ? 'Saved' : 'Save'}
                      </button>
                    </div>

                    {/* Comments Section */}
                    {isCommentsOpen && (
                      <div className="comments">
                        {p.comments.map((c) => (
                          <div key={c.id} className="comment">
                            <div className="chead">
                              <div className="avatar" style={{ width: '24px', height: '24px', fontSize: '9px' }}>
                                {c.author
                                  .split(' ')
                                  .map((x) => x[0])
                                  .join('')
                                  .substring(0, 2)}
                              </div>
                              <ProfileLink
                                name={c.author}
                                hasGoldenTick={c.hasGoldenTick}
                                timezone={c.authorTimezone}
                              />
                              <small>{c.time}</small>
                            </div>
                            <p>{c.text}</p>
                            <div className="cacts">
                              <button onClick={() => reactComment(p.id, c.id, 'likes')}>
                                👍 {c.likes}
                              </button>
                              <button onClick={() => reactComment(p.id, c.id, 'dis')}>
                                👎 {c.dis}
                              </button>
                              <button
                                onClick={() =>
                                  setActiveReplyBoxId(
                                    activeReplyBoxId === `${p.id}-${c.id}` ? null : `${p.id}-${c.id}`
                                  )
                                }
                              >
                                💬 {c.replies.length} Reply
                              </button>
                            </div>

                            {/* Replies */}
                            {c.replies.length > 0 && (
                              <div className="replies">
                                {c.replies.map((r) => (
                                  <div key={r.id} className="comment">
                                    <div className="chead">
                                      <div
                                        className="avatar"
                                        style={{ width: '22px', height: '22px', fontSize: '8.5px' }}
                                      >
                                        {r.author
                                          .split(' ')
                                          .map((x) => x[0])
                                          .join('')
                                          .substring(0, 2)}
                                      </div>
                                      <ProfileLink
                                        name={r.author}
                                        hasGoldenTick={r.hasGoldenTick}
                                        timezone={r.authorTimezone}
                                      />
                                      <small>{r.time}</small>
                                    </div>
                                    <p>{r.text}</p>
                                    <div className="cacts">
                                      <button onClick={() => reactReply(p.id, c.id, r.id, 'likes')}>
                                        👍 {r.likes}
                                      </button>
                                      <button onClick={() => reactReply(p.id, c.id, r.id, 'dis')}>
                                        👎 {r.dis}
                                      </button>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Reply Input Box */}
                            {activeReplyBoxId === `${p.id}-${c.id}` && (
                              <div className="replybox">
                                <input
                                  className="input"
                                  placeholder="Write a reply…"
                                  value={replyInputs[`${p.id}-${c.id}`] || ''}
                                  onChange={(e) =>
                                    setReplyInputs((prev) => ({
                                      ...prev,
                                      [`${p.id}-${c.id}`]: e.target.value,
                                    }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleReplySubmit(p.id, c.id);
                                  }}
                                />
                                <button
                                  className="btn primary sm"
                                  onClick={() => handleReplySubmit(p.id, c.id)}
                                >
                                  Reply
                                </button>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Top-Level Add Comment Box */}
                        <div className="replybox" style={{ marginLeft: 0, marginTop: '10px' }}>
                          <input
                            className="input"
                            placeholder="Write a comment…"
                            value={commentInputs[p.id] || ''}
                            onChange={(e) =>
                              setCommentInputs((prev) => ({
                                ...prev,
                                [p.id]: e.target.value,
                              }))
                            }
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleCommentSubmit(p.id);
                            }}
                          />
                          <button
                            className="btn primary sm"
                            onClick={() => handleCommentSubmit(p.id)}
                          >
                            Comment
                          </button>
                        </div>
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>

          {/* MORE Cursor Pagination Action */}
          {filteredPosts.length > 7 && !showAllPosts && (
            <div style={{ textAlign: 'center', marginTop: '14px' }}>
              <button className="btn secondary" onClick={() => setShowAllPosts(true)}>
                MORE ({filteredPosts.length - 7} posts)
              </button>
            </div>
          )}
        </section>

        {/* Right Column: Jobs & Advertisements */}
        <aside>
          {/* Jobs Card */}
          <div className="card" style={{ marginBottom: '14px' }}>
            <div className="cardhead">
              <span>
                Job Posts <span className="sub">{jobs.length} Active</span>
              </span>
              <button
                className="btn secondary sm icon"
                onClick={() => setShowJobFormModal(true)}
                title="Create a Job Post"
              >
                <Plus size={14} />
              </button>
            </div>
            <div>
              {jobs.map((j) => (
                <div key={j.id} className="job">
                  <b>{j.title}</b>
                  <small>
                    {j.company}
                    <br />
                    {j.location} · {j.packageDetails}
                  </small>
                  <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                    <button
                      className="btn secondary sm"
                      onClick={() => setSelectedJobModal(j)}
                    >
                      View Details
                    </button>
                    {j.isOwner && (
                      <button
                        className="btn danger sm icon"
                        onClick={() => deleteJob(j.id)}
                        title="Close job post"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Advertisements Banner */}
          <div className="ad">
            <b>YOUR AD HERE</b>
            <p>
              Promote your logistics services
              <br />
              Reach 10,000+ verified freight professionals.
            </p>
            <button
              className="btn sm"
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                color: '#fff',
                borderColor: 'rgba(255, 255, 255, 0.4)',
              }}
              onClick={() => setShowAdModal(true)}
            >
              Book Ad Space
            </button>
          </div>
        </aside>
      </div>

      {/* Job Details Modal */}
      {selectedJobModal && (
        <Modal
          isOpen={!!selectedJobModal}
          onClose={() => setSelectedJobModal(null)}
          title={`${selectedJobModal.title} — Job Details`}
          footer={
            <>
              <button className="btn secondary" onClick={() => setSelectedJobModal(null)}>
                Close
              </button>
              <button
                className="btn primary"
                onClick={() => {
                  setSelectedJobModal(null);
                  openChatWith(selectedJobModal.postedBy.toLowerCase().replace(/\s+/g, '-'), {
                    type: 'job',
                    id: selectedJobModal.id,
                    title: selectedJobModal.title,
                  });
                }}
              >
                <MessageCircle size={14} /> Contact Recruiter
              </button>
            </>
          }
        >
          <div className="card cardbody" style={{ background: '#f8fafc', marginBottom: '12px' }}>
            <div className="kv">
              <span>Hiring Company</span>
              <b>{selectedJobModal.company}</b>
            </div>
            <div className="kv">
              <span>Location & Type</span>
              <b>{selectedJobModal.location} ({selectedJobModal.employmentType})</b>
            </div>
            <div className="kv">
              <span>Experience & Package</span>
              <b>{selectedJobModal.experience} · {selectedJobModal.packageDetails}</b>
            </div>
            <div className="kv">
              <span>Posted By</span>
              <b>
                <ProfileLink name={selectedJobModal.postedBy} /> (
                {selectedJobModal.posterEmail})
              </b>
            </div>
            <div className="kv">
              <span>Posting Date</span>
              <b>{selectedJobModal.postedDate}</b>
            </div>
          </div>

          <div className="card cardbody">
            <b style={{ fontSize: '12px', display: 'block', marginBottom: '6px' }}>Requirements & Key Responsibilities</b>
            <p style={{ fontSize: '12px', color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
              {selectedJobModal.requirements}
            </p>
          </div>
        </Modal>
      )}

      {/* Create Job Modal */}
      <Modal
        isOpen={showJobFormModal}
        onClose={() => setShowJobFormModal(false)}
        title="Create Job Post"
        footer={
          <>
            <button className="btn secondary" onClick={() => setShowJobFormModal(false)}>
              Cancel
            </button>
            <button className="btn primary" onClick={handleJobSubmit}>
              Publish Job Post
            </button>
          </>
        }
      >
        <div className="grid g2">
          <div className="field">
            <label>
              Job Title <span className="req">*</span>
            </label>
            <input
              className="input"
              placeholder="e.g. Trade Lane Manager"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Employment Type</label>
            <select
              className="input"
              value={jobEmpType}
              onChange={(e) => setJobEmpType(e.target.value)}
            >
              <option value="Full-time">Full-time</option>
              <option value="Contract">Contract</option>
              <option value="Remote">Remote</option>
            </select>
          </div>
          <div className="field">
            <label>
              Location <span className="req">*</span>
            </label>
            <input
              className="input"
              placeholder="e.g. Mumbai, India · Hybrid"
              value={jobLocation}
              onChange={(e) => setJobLocation(e.target.value)}
            />
          </div>
          <div className="field">
            <label>Experience Required</label>
            <input
              className="input"
              placeholder="e.g. 4–6 yrs experience"
              value={jobExp}
              onChange={(e) => setJobExp(e.target.value)}
            />
          </div>
          <div className="field" style={{ gridColumn: 'span 2' }}>
            <label>Package / Salary Details</label>
            <input
              className="input"
              placeholder="e.g. ₹10–14 LPA + incentives"
              value={jobPkg}
              onChange={(e) => setJobPkg(e.target.value)}
            />
          </div>
        </div>
        <div className="field" style={{ marginTop: '10px' }}>
          <label>Job Requirements & Description</label>
          <textarea
            className="input"
            rows={3}
            placeholder="Key responsibilities, required lane expertise, certifications, and application procedure…"
            value={jobReq}
            onChange={(e) => setJobReq(e.target.value)}
          />
        </div>
      </Modal>

      {/* Book Ad Modal */}
      <Modal
        isOpen={showAdModal}
        onClose={() => setShowAdModal(false)}
        title="Book Advertisement Space"
        footer={
          <>
            <button className="btn secondary" onClick={() => setShowAdModal(false)}>
              Cancel
            </button>
            <button className="btn primary" onClick={handleAdSubmit}>
              Pay ₹{formatNumber(adAmount)} & Submit
            </button>
          </>
        }
      >
        <div className="grid g2">
          <div>
            <div className="field">
              <label>
                Business Name <span className="req">*</span>
              </label>
              <input
                className="input"
                value={adBusiness}
                onChange={(e) => setAdBusiness(e.target.value)}
              />
            </div>
            <div className="field" style={{ marginTop: '10px' }}>
              <label>
                Professional Email <span className="req">*</span>
              </label>
              <input
                className="input"
                type="email"
                value={adEmail}
                onChange={(e) => setAdEmail(e.target.value)}
              />
            </div>
            <div className="field" style={{ marginTop: '10px' }}>
              <label>
                Ad Headline <span className="req">*</span>
              </label>
              <input
                className="input"
                placeholder="e.g. Instant Ocean FCL Rates to Rotterdam"
                value={adHeadline}
                onChange={(e) => setAdHeadline(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className={`adform ${adImageStatus === 'ok' ? 'ok' : adImageStatus === 'bad' ? 'bad' : ''}`}>
              {adImagePreview ? (
                <img src={adImagePreview} alt="Ad Creative Preview" />
              ) : (
                <>
                  <ImageUp size={24} />
                  <b style={{ fontSize: '11px' }}>Upload Creative</b>
                  <small>PNG/GIF · 237 × 299 px</small>
                </>
              )}
            </div>

            <input
              type="file"
              accept="image/png,image/gif"
              style={{ marginTop: '8px', fontSize: '11.5px' }}
              onChange={handleAdImageUpload}
            />
            {adImageMsg && (
              <div
                style={{
                  fontSize: '10px',
                  color: adImageStatus === 'ok' ? 'var(--teal)' : 'var(--red)',
                  marginTop: '4px',
                }}
              >
                {adImageMsg}
              </div>
            )}

            {/* Pricing Selection */}
            <div className="prices" style={{ marginTop: '10px' }}>
              <label>
                <input
                  type="radio"
                  name="adPlan"
                  checked={adDurationDays === 2}
                  onChange={() => {
                    setAdDurationDays(2);
                    setAdAmount(1000);
                  }}
                />
                <b>₹1,000</b>
                <span>2 Days Run</span>
              </label>
              <label>
                <input
                  type="radio"
                  name="adPlan"
                  checked={adDurationDays === 10}
                  onChange={() => {
                    setAdDurationDays(10);
                    setAdAmount(5000);
                  }}
                />
                <b>₹5,000</b>
                <span>10 Days Run</span>
              </label>
            </div>
          </div>
        </div>
      </Modal>

      {/* Report Post Modal */}
      {showReportModal && (
        <Modal
          isOpen={!!showReportModal}
          onClose={() => setShowReportModal(null)}
          title="Report Post to Moderation Registry"
          footer={
            <>
              <button className="btn secondary" onClick={() => setShowReportModal(null)}>
                Cancel
              </button>
              <button className="btn primary" onClick={submitReport}>
                Submit Report
              </button>
            </>
          }
        >
          <p style={{ fontSize: '12.5px', marginBottom: '10px' }}>
            Please select the reason for reporting this post by <b>{showReportModal.author}</b>:
          </p>
          <div className="grid">
            {[
              'Malicious or unsafe content',
              'Fraud or impersonation',
              'Copyright or intellectual property issue',
              'Harassment or abusive content',
              'Irrelevant or spam content',
              'Incorrect commercial information',
              'Other',
            ].map((reason) => (
              <label key={reason} className="check">
                <input
                  type="radio"
                  name="reportReason"
                  checked={reportReason === reason}
                  onChange={() => setReportReason(reason)}
                />
                {reason}
              </label>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
}
