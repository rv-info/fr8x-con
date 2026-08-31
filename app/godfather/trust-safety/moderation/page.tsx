'use client';

import React, { useState } from 'react';
import {
  AlertOctagon,
  Search,
  CheckCircle2,
  XCircle,
  EyeOff,
  Eye,
  ShieldAlert,
  MessageSquare,
  Shield,
  Clock,
  UserX,
  FileText,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function ContentModerationPage() {
  const { resolveReport } = useGodfatherData();
  const { requestStepUpVerification } = useGodfatherAuth();

  const [posts, setPosts] = useState([
    {
      id: 'post-109',
      author: 'Priya Nair',
      authorCompany: 'Nair Cargo Solutions',
      text: '*Blank sailings* have tightened capacity on Asia-Europe lanes through mid-September. Booking 10-14 days ahead is strongly advised.',
      status: 'active',
      reportsCount: 0,
      likes: 24,
      commentsCount: 3,
      createdAt: '2026-08-29 14:00',
    },
    {
      id: 'post-088',
      author: 'Ramesh Cargo Agent',
      authorCompany: 'Fake Cargo Services Ltd',
      text: 'Direct carrier contract slots available at $400/40HC. WhatsApp urgently on +91 99999 00000 for immediate booking.',
      status: 'hidden',
      reportsCount: 4,
      reportCategory: 'Commercial Solicitation / Off-Platform Fraud',
      likes: 0,
      commentsCount: 1,
      createdAt: '2026-08-27 10:30',
    },
  ]);

  const [modalConfig, setModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionType: string;
    targetLabel: string;
    targetId: string;
    isDestructive?: boolean;
    onConfirm: (reason: string) => void;
  } | null>(null);

  const handleAction = (post: any, action: 'hide_content' | 'restore' | 'warn_author' | 'escalate') => {
    setModalConfig({
      isOpen: true,
      title: `Moderation Action: ${action.replace('_', ' ').toUpperCase()}`,
      actionType: `MODERATION_${action.toUpperCase()}`,
      targetLabel: `${post.id} (${post.author})`,
      targetId: post.id,
      isDestructive: action === 'hide_content' || action === 'escalate',
      onConfirm: async (reason) => {
        await resolveReport(post.id, action as any, reason);
        setPosts((prev) =>
          prev.map((p) => (p.id === post.id ? { ...p, status: action === 'hide_content' ? 'hidden' : 'active' } : p))
        );
        setModalConfig(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-red text-[11px] font-bold">TRUST & SAFETY</span>
            <span className="gf-badge gf-badge-amber text-[11px]">
              {posts.filter((p) => p.status === 'hidden').length} Hidden Items
            </span>
          </div>
          <h1 className="gf-page-title">Content Moderation & Thread Governance</h1>
          <p className="gf-page-subtitle">
            Moderate feed posts, threaded comments, spam solicitations, and preserve compliance evidence
          </p>
        </div>
      </div>

      {/* Posts Moderation Workspace */}
      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="gf-card p-4 space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-300 text-slate-700 font-bold flex items-center justify-center text-xs">
                  {post.author.charAt(0)}
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                    {post.author}
                    <span className="text-[11px] text-slate-500 font-normal">({post.authorCompany})</span>
                    <span className={`gf-badge gf-badge-${post.status === 'active' ? 'green' : 'red'} text-[10px] uppercase font-bold`}>
                      {post.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono mt-0.5">Post ID: {post.id} · {post.createdAt}</div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                {post.status === 'active' ? (
                  <button
                    type="button"
                    onClick={() => handleAction(post, 'hide_content')}
                    className="gf-btn gf-btn-danger text-[11px] py-1 px-2.5 flex items-center gap-1 font-bold"
                  >
                    <EyeOff className="lucide w-3 h-3" />
                    Hide Content
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleAction(post, 'restore')}
                    className="gf-btn gf-btn-success text-[11px] py-1 px-2.5 flex items-center gap-1 font-bold"
                  >
                    <Eye className="lucide w-3 h-3" />
                    Restore Content
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => handleAction(post, 'warn_author')}
                  className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5 flex items-center gap-1 font-semibold"
                >
                  <ShieldAlert className="lucide w-3 h-3 text-amber-600" />
                  Issue Warning
                </button>
              </div>
            </div>

            {/* Content Text Box */}
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans font-normal">
              {post.text}
            </div>

            {/* Reports Notice if Flagged */}
            {post.reportsCount > 0 && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="lucide w-4 h-4 text-rose-600" />
                  <span>Flagged by {post.reportsCount} users: <strong>{post.reportCategory}</strong></span>
                </div>
                <span className="text-[10px] font-mono uppercase bg-rose-200/80 text-rose-900 border border-rose-300 px-2 py-0.5 rounded-full font-bold">
                  HIGH SEVERITY
                </span>
              </div>
            )}
          </div>
        ))}
      </div>

      {modalConfig && (
        <ActionConfirmModal
          isOpen={modalConfig.isOpen}
          title={modalConfig.title}
          actionType={modalConfig.actionType}
          targetLabel={modalConfig.targetLabel}
          targetId={modalConfig.targetId}
          isDestructive={modalConfig.isDestructive}
          onConfirm={modalConfig.onConfirm}
          onCancel={() => setModalConfig(null)}
        />
      )}
    </div>
  );
}
