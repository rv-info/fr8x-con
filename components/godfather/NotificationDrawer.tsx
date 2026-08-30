'use client';

import React from 'react';
import { X, AlertCircle, ShieldAlert, CreditCard, Building, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationDrawer({ isOpen, onClose }: NotificationDrawerProps) {
  if (!isOpen) return null;

  const ALERTS = [
    {
      id: 'alt-1',
      type: 'risk',
      title: 'Address Mismatch on KYC Submission',
      desc: 'Apex Global Forwarders LLP: GST registered address does not match DGFT IEC record.',
      time: '20m ago',
      link: '/godfather/operations/companies',
      icon: Building,
      badge: 'KYC Alert',
      color: 'amber',
    },
    {
      id: 'alt-2',
      type: 'moderation',
      title: 'New Commercial Dispute Filed',
      desc: 'OceanStar Maritime: Unresolved demurrage claim USD $42,500 pending compliance review.',
      time: '1h ago',
      link: '/godfather/trust-safety/blacklist',
      icon: ShieldAlert,
      badge: 'Blacklist Review',
      color: 'red',
    },
    {
      id: 'alt-3',
      type: 'rate_import',
      title: 'Rate Import Batch Validation Flagged',
      desc: 'Batch BATCH-AUG-EU-WEST has 4 invalid rows needing manual operator review.',
      time: '3h ago',
      link: '/godfather/operations/rates',
      icon: AlertCircle,
      badge: 'Rates Import',
      color: 'blue',
    },
    {
      id: 'alt-4',
      type: 'finance',
      title: 'Payment Gateway Webhook Status Healthy',
      desc: 'Razorpay and Stripe webhook endpoints validated at 15:00 UTC.',
      time: '4h ago',
      link: '/godfather/commerce/payments',
      icon: CreditCard,
      badge: 'Gateway Sync',
      color: 'green',
    },
  ];

  return (
    <div className="gf-drawer-overlay" onClick={onClose}>
      <div className="gf-drawer-panel gf-notif-panel" onClick={(e) => e.stopPropagation()}>
        <div className="gf-drawer-header">
          <div>
            <h2 className="gf-drawer-title">Platform Alerts & Risk Feeds</h2>
            <p className="gf-drawer-subtitle">Real-time governance, payment, and KYC notifications</p>
          </div>
          <button onClick={onClose} className="gf-modal-close-btn" aria-label="Close">
            <X className="lucide w-5 h-5" />
          </button>
        </div>

        <div className="gf-drawer-body divide-y divide-slate-200 dark:divide-slate-800 p-0">
          {ALERTS.map((a) => {
            const Icon = a.icon;
            return (
              <Link
                key={a.id}
                href={a.link}
                onClick={onClose}
                className="p-4 block hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded bg-${a.color}-50 text-${a.color}-600 dark:bg-${a.color}-950 flex-shrink-0`}>
                    <Icon className="lucide w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`gf-badge gf-badge-${a.color} text-[10px] uppercase font-bold`}>{a.badge}</span>
                      <span className="text-[10px] text-faint">{a.time}</span>
                    </div>
                    <h4 className="text-xs font-bold text-ink truncate">{a.title}</h4>
                    <p className="text-xs text-mut mt-0.5 leading-snug">{a.desc}</p>
                  </div>
                  <ArrowRight className="lucide w-4 h-4 text-slate-400 mt-2" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="p-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-center">
          <Link
            href="/godfather/platform/audit"
            onClick={onClose}
            className="text-xs font-bold text-brand hover:underline"
          >
            View Complete Immutable Audit Ledger →
          </Link>
        </div>
      </div>
    </div>
  );
}
