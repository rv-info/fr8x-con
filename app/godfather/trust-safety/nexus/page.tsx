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

        <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'reviews' ? 'bg-white text-sky-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Company Reviews ({reviews.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('topics')}
            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${
              activeTab === 'topics' ? 'bg-white text-sky-900 shadow-xs border border-slate-200' : 'text-slate-600 hover:text-slate-900'
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
                  <Building className="lucide w-4 h-4 text-sky-600" />
                  <span className="font-bold text-slate-900 text-sm">{rev.companyName}</span>
                  <div className="flex items-center text-amber-500 text-xs font-bold">
                    {'★'.repeat(rev.rating)}
                    {'☆'.repeat(5 - rev.rating)}
                  </div>
                  <span className={`gf-badge gf-badge-${rev.status === 'verified' ? 'green' : 'red'} text-[10px] uppercase font-bold`}>
                    {rev.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Review by: <strong className="text-slate-900">{rev.author}</strong> · Date: {rev.date}
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleModerateReview(rev, 'hide')}
                  className="gf-btn gf-btn-secondary text-[11px] py-1 px-2.5 text-rose-700 hover:bg-rose-50 border-slate-200 hover:border-rose-300 font-semibold"
                >
                  <EyeOff className="lucide w-3 h-3 mr-1" />
                  Hide Review
                </button>
                <button
                  type="button"
                  onClick={() => handleModerateReview(rev, 'approve')}
                  className="gf-btn gf-btn-success text-[11px] py-1 px-2.5 font-bold"
                >
                  Approve / Verify
                </button>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-800 leading-relaxed italic">
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
