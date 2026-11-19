'use client';

/**
 * app/notifications/page.tsx
 * FR8X Notification Center
 * Provides user-scoped notification inbox with full controls:
 * - Mark as Read / Mark All as Read
 * - Clear One / Clear All
 * - Clear distinction that dismissing notifications does not alter underlying entity records
 */

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Trash2,
  X,
  Users,
  MessageSquare,
  Gavel,
  ShieldAlert,
  Info,
  ExternalLink,
  Filter,
} from 'lucide-react';
import { SkeletonScreen } from '@/components/ui/SkeletonScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { useData } from '@/lib/context/DataContext';
import { useAuth } from '@/lib/context/AuthContext';
import { NotificationCategory, AppNotification } from '@/lib/types';

const CATEGORY_MAP: Record<
  string,
  { label: string; icon: React.ReactNode; color: string }
> = {
  all: { label: 'All', icon: <Bell size={14} />, color: '#1168d7' },
  connections: { label: 'Connections', icon: <Users size={14} />, color: '#10b981' },
  feeds: { label: 'Feeds & Posts', icon: <MessageSquare size={14} />, color: '#8b5cf6' },
  auctions: { label: 'Auctions & Bids', icon: <Gavel size={14} />, color: '#f59e0b' },
  bids: { label: 'Bids', icon: <Gavel size={14} />, color: '#f59e0b' },
  security: { label: 'Security & Safety', icon: <ShieldAlert size={14} />, color: '#ef4444' },
  system: { label: 'System', icon: <Info size={14} />, color: '#64748b' },
};

export default function NotificationCenterPage() {
  const { user } = useAuth();
  const {
    notifications,
    markNotificationRead,
    markAllNotificationsRead,
    clearNotification,
    clearAllNotifications,
    isHydrated,
  } = useData();

  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [unreadOnly, setUnreadOnly] = useState<boolean>(false);
  const [confirmClearAll, setConfirmClearAll] = useState<boolean>(false);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredNotifications = notifications.filter((n) => {
    if (unreadOnly && n.read) return false;
    if (activeCategory === 'all') return true;
    if (activeCategory === 'connections') return n.category === 'profile' || n.category === 'nexus';
    if (activeCategory === 'auctions') return n.category === 'auctions' || n.category === 'bids';
    return n.category === activeCategory;
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '24px 16px' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'rgba(17,104,215,0.1)', color: '#1168d7', display: 'grid', placeItems: 'center' }}>
              <Bell size={20} />
            </div>
            <div>
              <h1 style={{ fontSize: '20px', fontWeight: 800, margin: 0, color: 'var(--ink)' }}>
                Notification Center
              </h1>
              <p style={{ fontSize: '13px', color: 'var(--mut)', margin: '2px 0 0' }}>
                Manage your real-time alerts, connection requests, and system updates
              </p>
            </div>
          </div>
        </div>

        {/* Global Controls */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {unreadCount > 0 && (
            <button
              onClick={() => markAllNotificationsRead()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                color: 'var(--brand)',
                cursor: 'pointer',
              }}
            >
              <CheckCheck size={14} /> Mark All as Read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              onClick={() => setConfirmClearAll(true)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 600,
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                color: '#ef4444',
                cursor: 'pointer',
              }}
            >
              <Trash2 size={14} /> Clear All
            </button>
          )}
        </div>
      </div>

      {/* Preservation & Integrity Notice */}
      <div
        style={{
          background: 'rgba(17, 104, 215, 0.04)',
          border: '1px solid rgba(17, 104, 215, 0.15)',
          borderRadius: '10px',
          padding: '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          marginBottom: '20px',
          fontSize: '12px',
          color: 'var(--mut)',
        }}
      >
        <Info size={18} style={{ color: '#1168d7', flexShrink: 0 }} />
        <div>
          <b style={{ color: 'var(--ink)' }}>Data Preservation Notice:</b> Clearing a notification only dismisses the alert from your notification center. It does <span style={{ textDecoration: 'underline' }}>not</span> delete or cancel the underlying connection, tender bid, feed post, or account security event.
        </div>
      </div>

      {/* Clear All Confirmation Modal */}
      {confirmClearAll && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'grid',
            placeItems: 'center',
            zIndex: 9999,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '12px',
              padding: '24px',
              maxWidth: '420px',
              width: '100%',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              border: '1px solid var(--border)',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 8px', color: 'var(--ink)' }}>
              Clear All Notifications?
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--mut)', margin: '0 0 20px', lineHeight: 1.5 }}>
              This will remove all alerts from your notification center. All underlying connection requests, bids, and security history will remain completely safe in the database.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setConfirmClearAll(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: 'var(--bg-faint)',
                  border: '1px solid var(--border)',
                  color: 'var(--ink)',
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  clearAllNotifications();
                  setConfirmClearAll(false);
                }}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: 600,
                  background: '#ef4444',
                  color: '#ffffff',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Confirm Clear All
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filter Tabs & Toggle */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          borderBottom: '1px solid var(--border)',
          paddingBottom: '12px',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {Object.entries(CATEGORY_MAP).map(([key, cat]) => {
            const isActive = activeCategory === key;
            const count = key === 'all'
              ? notifications.length
              : notifications.filter((n) => (key === 'connections' ? (n.category === 'profile' || n.category === 'nexus') : (key === 'auctions' ? (n.category === 'auctions' || n.category === 'bids') : n.category === key))).length;

            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: isActive ? 700 : 500,
                  background: isActive ? 'var(--brand)' : 'var(--bg-faint)',
                  color: isActive ? '#ffffff' : 'var(--ink)',
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                }}
              >
                {cat.icon}
                <span>{cat.label}</span>
                {count > 0 && (
                  <span
                    style={{
                      fontSize: '10px',
                      padding: '1px 6px',
                      borderRadius: '10px',
                      background: isActive ? 'rgba(255,255,255,0.25)' : 'var(--border)',
                      color: isActive ? '#ffffff' : 'var(--mut)',
                    }}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Unread Only Toggle */}
        <label
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            color: 'var(--ink)',
            cursor: 'pointer',
            userSelect: 'none',
          }}
        >
          <input
            type="checkbox"
            checked={unreadOnly}
            onChange={(e) => setUnreadOnly(e.target.checked)}
            style={{ cursor: 'pointer' }}
          />
          <span>Unread Only ({unreadCount})</span>
        </label>
      </div>

      {/* Notifications List with Progressive Skeleton Loading (Principle 1 & 2) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {!isHydrated ? (
          <div style={{ padding: '8px 0' }}>
            <SkeletonScreen type="row" count={4} label="Loading notifications…" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={32} />}
            title="No notifications found"
            description={unreadOnly ? 'You have caught up with all unread alerts.' : 'When members connect with you, submit bids on your reverse auctions, or publish trade updates, alerts will appear here.'}
          />
        ) : (
          filteredNotifications.map((n) => {
            const cat = CATEGORY_MAP[n.category] || CATEGORY_MAP.system;
            return (
              <div
                key={n.id}
                style={{
                  background: n.read ? 'var(--bg-card)' : 'rgba(17, 104, 215, 0.04)',
                  border: n.read ? '1px solid var(--border)' : '1px solid rgba(17, 104, 215, 0.3)',
                  borderRadius: '10px',
                  padding: '16px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '14px',
                  position: 'relative',
                  transition: 'all 0.15s ease',
                }}
              >
                {/* Category Icon */}
                <div
                  style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '8px',
                    background: `${cat.color}15`,
                    color: cat.color,
                    display: 'grid',
                    placeItems: 'center',
                    flexShrink: 0,
                    marginTop: '2px',
                  }}
                >
                  {cat.icon}
                </div>

                {/* Content */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <b style={{ fontSize: '13px', color: 'var(--ink)' }}>{n.title}</b>
                    {!n.read && (
                      <span
                        style={{
                          fontSize: '9px',
                          fontWeight: 700,
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#1168d7',
                          color: '#ffffff',
                          textTransform: 'uppercase',
                        }}
                      >
                        New
                      </span>
                    )}
                  </div>
                  <p style={{ fontSize: '12px', color: 'var(--mut)', margin: '4px 0 8px', lineHeight: 1.5 }}>
                    {n.desc}
                  </p>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
                    <small style={{ fontSize: '10px', color: 'var(--faint)' }}>{n.time}</small>
                    {n.targetUrl && (
                      <Link
                        href={n.targetUrl}
                        style={{
                          fontSize: '11px',
                          fontWeight: 600,
                          color: 'var(--brand)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                          textDecoration: 'none',
                        }}
                      >
                        {n.actionLabel || 'View Details'} <ExternalLink size={10} />
                      </Link>
                    )}
                  </div>
                </div>

                {/* Actions: Mark read & Clear */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {!n.read && (
                    <button
                      type="button"
                      onClick={() => markNotificationRead(n.id)}
                      title="Mark as read"
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '6px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        color: 'var(--mut)',
                      }}
                      className="hover:text-brand"
                    >
                      <CheckCheck size={16} />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => clearNotification(n.id)}
                    title="Dismiss notification"
                    style={{
                      background: 'none',
                      border: 'none',
                      padding: '6px',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      color: 'var(--mut)',
                    }}
                    className="hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
