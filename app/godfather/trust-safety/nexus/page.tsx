'use client';

import React, { useState } from 'react';
import { MessageSquare, Star, Search, CheckCircle2, AlertTriangle, EyeOff, Building, Shield } from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { ActionConfirmModal } from '@/components/godfather/ActionConfirmModal';

export default function NexusModerationPage() {
  const [activeTab, setActiveTab] = useState<'topics' | 'reviews'>('reviews');
  const [reviews, setReviews] = useState([
    {
      id: 'rev-01',
      companyName: 'Atlas Logistics Pvt. Ltd.',
      author: 'Sarah Lewis',
      rating: 5,
      text: 'Exceptional transparency and fast documentation on the Nhava Sheva to Rotterdam corridor. Highly reliable forwarder.',
      date: '2026-08-20',
      status: 'verified',
    },
    {
      id: 'rev-02',
      companyName: 'OceanStar Maritime Forwarding',
      author: 'Kiran Mehta',
      rating: 1,
      text: 'Released cargo without original BL at Jebel Ali. Left us with $42,500 unresolved demurrage charges.',
      date: '2026-08-10',
      status: 'flagged_dispute',
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

  const handleModerateReview = (rev: any, action: string) => {
    setModalConfig({
      isOpen: true,
      title: `Moderate Company Review (${action})`,
      actionType: `REVIEW_${action.toUpperCase()}`,
      targetLabel: `${rev.companyName} by ${rev.author}`,
      targetId: rev.id,
      isDestructive: action === 'hide',
      onConfirm: (reason) => {
        setReviews((prev) =>
          prev.map((r) => (r.id === rev.id ? { ...r, status: action === 'hide' ? 'hidden' : 'verified' } : r))
        );
        setModalConfig(null);
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="gf-page-header">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="gf-badge gf-badge-red text-[11px] font-bold">TRUST & SAFETY</span>
          </div>
          <h1 className="gf-page-title">Nexus Topics & Company Reviews Governance</h1>
          <p className="gf-page-subtitle">
            Inspect freight community discussions, company star ratings, and dispute reviews
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-slate-900 border border-slate-800 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
              activeTab === 'reviews' ? 'bg-sky-600 text-white' : 'text-slate-400'
            }`}
          >
            Company Reviews ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('topics')}
            className={`px-3 py-1.5 rounded text-xs font-bold transition-colors ${
              activeTab === 'topics' ? 'bg-sky-600 text-white' : 'text-slate-400'
            }`}
          >
            Community Topics (8)
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {reviews.map((rev) => (
          <div key={rev.id} className="gf-card p-4 space-y-3">
            <div className="flex items-start justify-between flex-wrap gap-2">
              <div>
                <div className="flex items-center gap-2">
                  <Building className="lucide w-4 h-4 text-sky-400" />
                  <span className="font-bold text-slate-100 text-sm">{rev.companyName}</span>
                  <div className="flex items-center text-amber-400 text-xs">
                    {'★'.repeat(rev.rating)}
                    {'☆'.repeat(5 - rev.rating)}
                  </div>
                  <span className={`gf-badge gf-badge-${rev.status === 'verified' ? 'green' : 'red'} text-[10px] uppercase font-bold`}>
                    {rev.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-mut mt-0.5">
                  Review by: <strong className="text-slate-300">{rev.author}</strong> · Date: {rev.date}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleModerateReview(rev, 'hide')}
                  className="gf-btn gf-btn-secondary text-[11px] py-1 px-2 text-red-400"
                >
                  <EyeOff className="lucide w-3 h-3 mr-1" />
                  Hide Review
                </button>
                <button
                  type="button"
                  onClick={() => handleModerateReview(rev, 'approve')}
                  className="gf-btn gf-btn-success text-[11px] py-1 px-2 font-bold"
                >
                  Approve / Verify
                </button>
              </div>
            </div>

            <div className="p-3 rounded bg-slate-900 border border-slate-800 text-xs text-slate-200">
              &ldquo;{rev.text}&rdquo;
            </div>
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
