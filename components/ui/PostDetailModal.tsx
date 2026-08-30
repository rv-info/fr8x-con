'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Modal } from './Modal';
import { GoldenTick } from './GoldenTick';
import { LocalTimeBadge } from './LocalTimeBadge';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { useChat } from '@/lib/context/ChatContext';
import { parseRichText } from '@/lib/utils';
import { FeedPost, PostType } from '@/lib/types';
import {
  MessageCircle,
  Bookmark,
  Share2,
  Flag,
  Sparkles,
  ExternalLink,
  Gavel,
  Clock,
  Send,
  Building2,
  Tag,
  TrendingUp,
  Check,
  ShieldCheck,
  MapPin,
} from 'lucide-react';

const POST_TYPE_CONFIG: Record<PostType, { label: string; color: string; bg: string; icon: any }> = {
  general: { label: 'General Trade Post', color: '#53647a', bg: '#f1f5f9', icon: Tag },
  job: { label: 'Trade Career Opening', color: '#0891b2', bg: '#e0f2fe', icon: Building2 },
  business_update: { label: 'Business Update', color: '#7c3aed', bg: '#f3e8ff', icon: TrendingUp },
  rate_info: { label: 'Rate Intelligence', color: '#059669', bg: '#e6f4ea', icon: TrendingUp },
  auction_ref: { label: 'Reverse Auction Inquiry', color: '#1168d7', bg: '#e8f1fd', icon: Gavel },
  logistics_discussion: { label: 'Logistics Roundtable', color: '#d97706', bg: '#fef3c7', icon: MessageCircle },
  announcement: { label: 'Official Network Bulletin', color: '#dc2626', bg: '#fee2e2', icon: Sparkles },
};

interface PostDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: FeedPost | null;
  onSavePost: (postId: string | number) => void;
  onReportPost: (post: FeedPost) => void;
  onAddComment: (postId: string | number, text: string) => void;
  onAddReply: (postId: string | number, commentId: string, text: string) => void;
  onAddNestedReply: (postId: string | number, commentId: string, parentReplyId: string, text: string) => void;
  onOpenProfile: (personName: string) => void;
}

export function PostDetailModal({
  isOpen,
  onClose,
  post,
  onSavePost,
  onReportPost,
  onAddComment,
  onAddReply,
  onAddNestedReply,
  onOpenProfile,
}: PostDetailModalProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { openChatWith } = useChat();

  const [commentText, setCommentText] = useState('');
  const [activeReplyKey, setActiveReplyKey] = useState<string | null>(null);
  const [replyInputText, setReplyInputText] = useState('');
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen || !post) return null;

  const typeConfig = POST_TYPE_CONFIG[post.postType || 'general'] || POST_TYPE_CONFIG.general;
  const TypeIcon = typeConfig.icon;

  const handleCopyLink = () => {
    navigator.clipboard?.writeText?.(`${window.location.origin}/feeds?post=${post.id}`);
    setCopiedLink(true);
    toast('Post link copied to clipboard.');
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText);
    setCommentText('');
    toast('Comment published to verified discussion.');
  };

  const handleReplySubmit = (commentId: string, parentReplyId?: string) => {
    if (!replyInputText.trim()) return;
    if (parentReplyId) {
      onAddNestedReply(post.id, commentId, parentReplyId, replyInputText);
    } else {
      onAddReply(post.id, commentId, replyInputText);
    }
    setReplyInputText('');
    setActiveReplyKey(null);
    toast('Reply posted successfully.');
  };

  const handleStartChat = () => {
    onClose();
    const contactId = post.author.toLowerCase().replace(/\s+/g, '-');
    openChatWith(contactId, {
      type: 'company',
      id: post.authorCompany || 'Network Member',
      title: `${post.author} · ${post.authorCompany || 'Freight Forwarder'}`,
    });
  };

  const initials = post.author
    .split(' ')
    .map((p) => p[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  const totalComments = post.comments.reduce((acc, c) => {
    let count = 1;
    if (c.replies) {
      count += c.replies.length;
      c.replies.forEach((r) => {
        if (r.replies) count += r.replies.length;
      });
    }
    return acc + count;
  }, 0);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Verified Community Trade Intelligence & Discussion"
      maxWidth="1100px"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Top Header Card */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '16px',
            background: '#fafcff',
            padding: '18px 20px',
            borderRadius: '12px',
            border: '1px solid var(--line)',
            flexWrap: 'wrap',
          }}
        >
          {/* Author info */}
          <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
            <div
              className="avatar big"
              style={{ width: '52px', height: '52px', fontSize: '18px', cursor: 'pointer' }}
              onClick={() => onOpenProfile(post.author)}
            >
              {initials}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <b
                  style={{ fontSize: '16px', color: 'var(--ink)', cursor: 'pointer' }}
                  onClick={() => onOpenProfile(post.author)}
                >
                  {post.author}
                </b>
                {post.hasGoldenTick && <GoldenTick />}
                <span
                  style={{
                    background: typeConfig.bg,
                    color: typeConfig.color,
                    padding: '3px 10px',
                    borderRadius: '5px',
                    fontSize: '10.5px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                  }}
                >
                  <TypeIcon size={12} /> {typeConfig.label}
                </span>
              </div>
              <div style={{ fontSize: '12.5px', color: 'var(--ink-secondary)', marginTop: '3px' }}>
                <b>{post.authorRole}</b> at <span style={{ color: 'var(--brand)', fontWeight: 700 }}>{post.authorCompany || 'Freight Logistics Inc.'}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                <span style={{ fontSize: '11.5px', color: 'var(--mut)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={12} /> {post.time}
                </span>
                {post.authorTimezone && <LocalTimeBadge timezone={post.authorTimezone} />}
                <span className="badge green" style={{ fontSize: '9px' }}>
                  <ShieldCheck size={10} /> Verified Member
                </span>
              </div>
            </div>
          </div>

          {/* Header Quick CTAs */}
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            <button
              className="btn secondary"
              onClick={handleStartChat}
              title="Start direct trade chat"
            >
              <MessageCircle size={14} /> Trade Chat
            </button>
            <button
              className={`btn ${post.isSaved ? 'primary' : 'secondary'}`}
              onClick={() => onSavePost(post.id)}
            >
              <Bookmark size={14} /> {post.isSaved ? 'Saved' : 'Save Post'}
            </button>
            <button
              className="btn secondary"
              onClick={handleCopyLink}
              title="Copy shareable link"
            >
              {copiedLink ? <Check size={14} color="var(--green)" /> : <Share2 size={14} />} Share
            </button>
            <button
              className="btn secondary"
              onClick={() => onReportPost(post)}
              title="Report content to B2B moderators"
            >
              <Flag size={14} />
            </button>
          </div>
        </div>

        {/* Post Full Content */}
        <div
          style={{
            padding: '22px 24px',
            background: 'var(--card)',
            borderRadius: '12px',
            border: '1px solid var(--line)',
            fontSize: '14.5px',
            lineHeight: 1.7,
            color: 'var(--ink)',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.02)',
          }}
        >
          <div
            className="post-body-text"
            dangerouslySetInnerHTML={{ __html: parseRichText(post.text) }}
          />

          {/* Linked Reverse Auction Box if present */}
          {post.auctionRefId && (
            <div
              style={{
                marginTop: '18px',
                padding: '16px 20px',
                background: '#f0f7ff',
                border: '1px solid #c7dffd',
                borderRadius: '10px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div>
                <span style={{ fontSize: '10.5px', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: '5px' }}>
                  <Gavel size={14} /> Linked Reverse Auction Event
                </span>
                <b style={{ fontSize: '14px', display: 'block', margin: '4px 0 2px', color: 'var(--ink)' }}>
                  Reverse Auction Reference: {post.auctionRefId}
                </b>
                <span style={{ fontSize: '11.5px', color: 'var(--mut)' }}>
                  Verified enterprise bidding event open for certified ocean carriers and NVOCCs.
                </span>
              </div>
              <Link
                href={`/auctions/${post.auctionRefId}`}
                className="btn primary"
                onClick={onClose}
              >
                Enter Reverse Auction <ExternalLink size={13} />
              </Link>
            </div>
          )}

          {/* Post Metrics Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid var(--line-light)',
              marginTop: '20px',
              paddingTop: '14px',
              flexWrap: 'wrap',
              gap: '10px',
            }}
          >
            <div style={{ display: 'flex', gap: '14px', fontSize: '12px', color: 'var(--mut)' }}>
              <span><b>{totalComments}</b> Responses Logged</span>
              <span>•</span>
              <span><b>Enterprise B2B</b> Trade Discussion</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--faint)', fontFamily: 'var(--font-mono)' }}>
              POST-REF-{post.id}
            </div>
          </div>
        </div>

        {/* Discussion Section */}
        <div
          style={{
            background: '#fafcff',
            border: '1px solid var(--line)',
            borderRadius: '12px',
            padding: '20px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <b style={{ fontSize: '14px', color: 'var(--ink)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <MessageCircle size={16} color="var(--brand)" />
              Verified Trade Discussion & Counter-Quotes ({post.comments.length})
            </b>
            <span style={{ fontSize: '11px', color: 'var(--mut)' }}>
              Governed by B2B Code of Conduct
            </span>
          </div>

          {/* Comment Input */}
          <form onSubmit={handleCommentSubmit} style={{ display: 'flex', gap: '10px', marginBottom: '18px' }}>
            <input
              type="text"
              className="input"
              style={{ flex: 1, height: '40px', fontSize: '13px' }}
              placeholder="Contribute constructive rate intel, trade feedback, or clarification…"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
            />
            <button type="submit" className="btn primary" disabled={!commentText.trim()} style={{ height: '40px', padding: '0 18px' }}>
              <Send size={14} /> Post Comment
            </button>
          </form>

          {/* Comments List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {post.comments.length === 0 ? (
              <div style={{ padding: '32px', textAlign: 'center', color: 'var(--mut)', fontSize: '13px', background: '#fff', borderRadius: '8px', border: '1px solid var(--line)' }}>
                No replies posted yet. Be the first verified member to contribute!
              </div>
            ) : (
              post.comments.map((comment) => (
                <div
                  key={comment.id}
                  style={{
                    background: 'var(--card)',
                    border: '1px solid var(--line)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                  }}
                >
                  {/* Tier 1 Comment Header */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                      <b
                        style={{ fontSize: '13px', color: 'var(--ink)', cursor: 'pointer' }}
                        onClick={() => onOpenProfile(comment.author)}
                      >
                        {comment.author}
                      </b>
                      {comment.hasGoldenTick && <GoldenTick />}
                      <span style={{ fontSize: '11px', color: 'var(--mut)' }}>· {comment.time}</span>
                      {comment.authorTimezone && <LocalTimeBadge timezone={comment.authorTimezone} />}
                    </div>
                  </div>

                  <p style={{ margin: '8px 0 10px', fontSize: '13px', color: 'var(--ink-secondary)', lineHeight: 1.55 }}>
                    {comment.text}
                  </p>

                  {/* Comment Actions */}
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      className="btn secondary sm"
                      style={{ padding: '3px 10px', fontSize: '11px' }}
                      onClick={() => setActiveReplyKey(activeReplyKey === comment.id ? null : comment.id)}
                    >
                      Reply
                    </button>
                  </div>

                  {/* Active Reply Input for Tier 1 */}
                  {activeReplyKey === comment.id && (
                    <div style={{ marginTop: '10px', display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        className="input"
                        style={{ height: '32px', fontSize: '12px', flex: 1 }}
                        placeholder={`Reply directly to ${comment.author}…`}
                        value={replyInputText}
                        onChange={(e) => setReplyInputText(e.target.value)}
                        autoFocus
                      />
                      <button
                        className="btn secondary sm"
                        onClick={() => setActiveReplyKey(null)}
                      >
                        Cancel
                      </button>
                      <button
                        className="btn primary sm"
                        onClick={() => handleReplySubmit(comment.id)}
                        disabled={!replyInputText.trim()}
                      >
                        Reply
                      </button>
                    </div>
                  )}

                  {/* Tier 2 Nested Replies */}
                  {comment.replies && comment.replies.length > 0 && (
                    <div style={{ marginTop: '12px', marginLeft: '18px', paddingLeft: '14px', borderLeft: '2px solid var(--line)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                      {comment.replies.map((reply) => (
                        <div
                          key={reply.id}
                          style={{
                            background: '#f8fafc',
                            padding: '10px 12px',
                            borderRadius: '8px',
                            border: '1px solid var(--line-light)',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <b
                              style={{ fontSize: '12px', color: 'var(--ink)', cursor: 'pointer' }}
                              onClick={() => onOpenProfile(reply.author)}
                            >
                              {reply.author}
                            </b>
                            {reply.hasGoldenTick && <GoldenTick />}
                            <span style={{ fontSize: '10.5px', color: 'var(--mut)' }}>· {reply.time}</span>
                          </div>
                          <p style={{ margin: '5px 0 8px', fontSize: '12px', color: 'var(--ink-secondary)' }}>
                            {reply.text}
                          </p>
                          <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                            <button
                              className="btn secondary sm"
                              style={{ padding: '2px 8px', fontSize: '10.5px' }}
                              onClick={() => setActiveReplyKey(activeReplyKey === reply.id ? null : reply.id)}
                            >
                              Reply
                            </button>
                          </div>

                          {/* Reply box for Tier 2 */}
                          {activeReplyKey === reply.id && (
                            <div style={{ marginTop: '8px', display: 'flex', gap: '6px' }}>
                              <input
                                type="text"
                                className="input"
                                style={{ height: '30px', fontSize: '11.5px', flex: 1 }}
                                placeholder={`Reply to ${reply.author}…`}
                                value={replyInputText}
                                onChange={(e) => setReplyInputText(e.target.value)}
                                autoFocus
                              />
                              <button
                                className="btn secondary sm"
                                onClick={() => setActiveReplyKey(null)}
                              >
                                Cancel
                              </button>
                              <button
                                className="btn primary sm"
                                onClick={() => handleReplySubmit(comment.id, reply.id)}
                                disabled={!replyInputText.trim()}
                              >
                                Reply
                              </button>
                            </div>
                          )}

                          {/* Tier 3 Nested Replies */}
                          {reply.replies && reply.replies.length > 0 && (
                            <div style={{ marginTop: '8px', marginLeft: '14px', paddingLeft: '10px', borderLeft: '2px solid #cbd5e1', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              {reply.replies.map((nested) => (
                                <div key={nested.id} style={{ background: '#ffffff', padding: '8px 10px', borderRadius: '6px', border: '1px solid var(--line-light)' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <b
                                      style={{ fontSize: '11.5px', color: 'var(--ink)', cursor: 'pointer' }}
                                      onClick={() => onOpenProfile(nested.author)}
                                    >
                                      {nested.author}
                                    </b>
                                    <span style={{ fontSize: '10px', color: 'var(--mut)' }}>· {nested.time}</span>
                                  </div>
                                  <p style={{ margin: '3px 0 0', fontSize: '11.5px', color: 'var(--ink-secondary)' }}>
                                    {nested.text}
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
