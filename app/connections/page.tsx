'use client';

/**
 * /connections — Connection Management Page.
 * Tabs: My Connections | Incoming Requests | Sent Requests | Blocked
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, UserPlus, Clock, UserX, Shield,
  CheckCircle2, XCircle, RotateCcw, Loader2,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ConnectionButton } from '@/components/people/ConnectionButton';

type Tab = 'connections' | 'incoming' | 'outgoing' | 'blocked';

interface ProfileSnippet {
  id: string;
  display_name: string | null;
  first_name: string | null;
  last_name: string | null;
  designation: string | null;
  company_name: string | null;
  city: string | null;
  country: string | null;
  avatar_url: string | null;
  is_verified: boolean | null;
  has_golden_tick: boolean | null;
}

interface ConnectionItem {
  id: string;
  connected_at?: string;
  connected_to?: string;
  profiles: ProfileSnippet;
}

interface RequestItem {
  id: string;
  message: string | null;
  created_at: string;
  status: string;
  profiles: ProfileSnippet;
}

interface BlockItem {
  id: string;
  created_at: string;
  profiles: ProfileSnippet;
}

function getDisplayName(p: ProfileSnippet) {
  if (p.display_name?.trim()) return p.display_name.trim();
  const full = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
  return full || 'FR8X Member';
}

function getSubline(p: ProfileSnippet) {
  return [p.designation, p.company_name].filter(Boolean).join(' · ');
}

function getLocation(p: ProfileSnippet) {
  return [p.city, p.country].filter(Boolean).join(', ');
}

async function callConnectionAction(body: Record<string, string | undefined>) {
  const res = await fetch('/api/people/connections', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });
  return res.json();
}

// ── Connection item row ────────────────────────────────────────────────────────
function ConnectionRow({ item, onRemove }: { item: ConnectionItem; onRemove: (id: string) => void }) {
  const p    = item.profiles;
  const name = getDisplayName(p);
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    if (!confirm(`Remove connection with ${name}?`)) return;
    setRemoving(true);
    await callConnectionAction({ action: 'remove', target_id: p.id });
    onRemove(item.id);
  };

  return (
    <div className="conn-row" role="listitem">
      <Link href={`/people/${p.id}`} className="conn-row-avatar-link" aria-label={`View ${name}'s profile`}>
        <UserAvatar name={name} avatarUrl={p.avatar_url ?? undefined} size={44} />
      </Link>
      <div className="conn-row-body">
        <Link href={`/people/${p.id}`} className="conn-row-name" aria-label={`${name}'s profile`}>
          {name}
          {p.has_golden_tick && <span className="golden-tick-badge" aria-label="Verified premium" title="Golden Tick">★</span>}
          {p.is_verified && !p.has_golden_tick && <span className="verified-badge" aria-label="Verified" title="Verified">✓</span>}
        </Link>
        <p className="conn-row-sub">{getSubline(p)}</p>
        {getLocation(p) && <p className="conn-row-location">{getLocation(p)}</p>}
        {item.connected_at && (
          <p className="conn-row-date">
            Connected {new Date(item.connected_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
          </p>
        )}
      </div>
      <div className="conn-row-actions">
        <button
          className="conn-action-btn danger"
          onClick={handleRemove}
          disabled={removing}
          aria-label={`Remove connection with ${name}`}
        >
          {removing ? <Loader2 size={13} className="spin" /> : <UserX size={13} />}
          Remove
        </button>
      </div>
    </div>
  );
}

// ── Incoming request row ───────────────────────────────────────────────────────
function IncomingRow({ item, onAction }: { item: RequestItem; onAction: (id: string) => void }) {
  const p     = item.profiles;
  const name  = getDisplayName(p);
  const [busy, setBusy] = useState<'accept' | 'decline' | null>(null);

  const handle = async (action: 'accept' | 'decline') => {
    setBusy(action);
    await callConnectionAction({ action, request_id: item.id });
    onAction(item.id);
  };

  return (
    <div className="conn-row" role="listitem">
      <Link href={`/people/${p.id}`} className="conn-row-avatar-link" aria-label={`View ${name}'s profile`}>
        <UserAvatar name={name} avatarUrl={p.avatar_url ?? undefined} size={44} />
      </Link>
      <div className="conn-row-body">
        <Link href={`/people/${p.id}`} className="conn-row-name">{name}</Link>
        <p className="conn-row-sub">{getSubline(p)}</p>
        {item.message && <p className="conn-row-message">"{item.message}"</p>}
        <p className="conn-row-date">
          {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="conn-row-actions">
        <button
          className="conn-action-btn accept"
          onClick={() => handle('accept')}
          disabled={busy !== null}
          aria-label={`Accept ${name}'s connection request`}
        >
          {busy === 'accept' ? <Loader2 size={13} className="spin" /> : <CheckCircle2 size={13} />}
          Accept
        </button>
        <button
          className="conn-action-btn decline"
          onClick={() => handle('decline')}
          disabled={busy !== null}
          aria-label={`Decline ${name}'s connection request`}
        >
          {busy === 'decline' ? <Loader2 size={13} className="spin" /> : <XCircle size={13} />}
          Decline
        </button>
      </div>
    </div>
  );
}

// ── Outgoing request row ───────────────────────────────────────────────────────
function OutgoingRow({ item, onAction }: { item: RequestItem; onAction: (id: string) => void }) {
  const p    = item.profiles;
  const name = getDisplayName(p);
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    await callConnectionAction({ action: 'cancel', request_id: item.id });
    onAction(item.id);
  };

  return (
    <div className="conn-row" role="listitem">
      <Link href={`/people/${p.id}`} className="conn-row-avatar-link" aria-label={`View ${name}'s profile`}>
        <UserAvatar name={name} avatarUrl={p.avatar_url ?? undefined} size={44} />
      </Link>
      <div className="conn-row-body">
        <Link href={`/people/${p.id}`} className="conn-row-name">{name}</Link>
        <p className="conn-row-sub">{getSubline(p)}</p>
        {item.message && <p className="conn-row-message">"{item.message}"</p>}
        <p className="conn-row-date">
          Sent {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="conn-row-actions">
        <span className="conn-status-badge pending">
          <Clock size={11} aria-hidden="true" /> Pending
        </span>
        <button
          className="conn-action-btn danger"
          onClick={handleCancel}
          disabled={cancelling}
          aria-label={`Cancel request to ${name}`}
        >
          {cancelling ? <Loader2 size={13} className="spin" /> : <RotateCcw size={13} />}
          Cancel
        </button>
      </div>
    </div>
  );
}

// ── Blocked row ────────────────────────────────────────────────────────────────
function BlockedRow({ item, onAction }: { item: BlockItem; onAction: (id: string) => void }) {
  const p    = item.profiles;
  const name = getDisplayName(p);
  const [unblocking, setUnblocking] = useState(false);

  const handleUnblock = async () => {
    setUnblocking(true);
    await callConnectionAction({ action: 'unblock', target_id: p.id });
    onAction(item.id);
  };

  return (
    <div className="conn-row" role="listitem">
      <UserAvatar name={name} avatarUrl={p.avatar_url ?? undefined} size={44} />
      <div className="conn-row-body">
        <span className="conn-row-name">{name}</span>
        <p className="conn-row-sub">{getSubline(p)}</p>
        <p className="conn-row-date">
          Blocked {new Date(item.created_at).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="conn-row-actions">
        <button
          className="conn-action-btn"
          onClick={handleUnblock}
          disabled={unblocking}
          aria-label={`Unblock ${name}`}
        >
          {unblocking ? <Loader2 size={13} className="spin" /> : <Shield size={13} />}
          Unblock
        </button>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
const TAB_CONFIG: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: 'connections', label: 'Connections',       icon: Users    },
  { id: 'incoming',   label: 'Incoming Requests',  icon: UserPlus },
  { id: 'outgoing',   label: 'Sent Requests',      icon: Clock    },
  { id: 'blocked',    label: 'Blocked',             icon: Shield   },
];

export default function ConnectionsPage() {
  const [activeTab, setActiveTab]   = useState<Tab>('connections');
  const [data, setData]             = useState<unknown[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const fetchTab = useCallback(async (tab: Tab) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/people/connections?tab=${tab}&limit=100`);
      const json = await res.json();
      if (!res.ok || !json.success) {
        setError(json.error ?? 'Failed to load data.');
      } else {
        setData(json.data ?? []);
      }
    } catch {
      setError('Failed to load data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  const handleRemoveItem = useCallback((removedId: string) => {
    setData((prev) => (prev as { id: string }[]).filter((item) => item.id !== removedId));
  }, []);

  const activeTabConfig = TAB_CONFIG.find((t) => t.id === activeTab)!;

  return (
    <div className="connections-page" role="main">
      <div className="connections-page-header">
        <h1 className="connections-page-title">
          <Users size={22} aria-hidden="true" className="connections-icon" />
          My Network
        </h1>
        <Link href="/people" className="btn-secondary" aria-label="Find new connections">
          <UserPlus size={14} aria-hidden="true" /> Find People
        </Link>
      </div>

      {/* Tabs */}
      <div className="connections-tabs" role="tablist" aria-label="Network sections">
        {TAB_CONFIG.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            role="tab"
            className={`connections-tab ${activeTab === id ? 'active' : ''}`}
            onClick={() => setActiveTab(id)}
            aria-selected={activeTab === id}
            aria-controls={`tab-panel-${id}`}
            id={`tab-${id}`}
          >
            <Icon size={14} aria-hidden="true" />
            <span>{label}</span>
            {!loading && activeTab === id && data.length > 0 && (
              <span className="connections-tab-count" aria-label={`${data.length} items`}>
                {data.length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab panel */}
      <div
        id={`tab-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`tab-${activeTab}`}
        className="connections-tab-panel"
      >
        {loading && (
          <div className="connections-loading" aria-busy="true" aria-label={`Loading ${activeTabConfig.label}`}>
            <Loader2 size={24} className="spin" aria-hidden="true" />
            <p>Loading…</p>
          </div>
        )}

        {error && (
          <div className="connections-error" role="alert">
            <p>{error}</p>
            <button onClick={() => fetchTab(activeTab)} className="btn-secondary">Retry</button>
          </div>
        )}

        {!loading && !error && data.length === 0 && (
          <div className="connections-empty" aria-label={`No ${activeTabConfig.label.toLowerCase()}`}>
            {activeTab === 'connections' && (
              <>
                <div className="connections-empty-icon" aria-hidden="true">🤝</div>
                <h2>No connections yet</h2>
                <p>Discover and connect with freight professionals in your industry.</p>
                <Link href="/people" className="btn-primary">Find People</Link>
              </>
            )}
            {activeTab === 'incoming' && (
              <>
                <div className="connections-empty-icon" aria-hidden="true">📬</div>
                <h2>No pending requests</h2>
                <p>You have no incoming connection requests at this time.</p>
              </>
            )}
            {activeTab === 'outgoing' && (
              <>
                <div className="connections-empty-icon" aria-hidden="true">📤</div>
                <h2>No sent requests</h2>
                <p>You haven't sent any connection requests yet.</p>
                <Link href="/people" className="btn-primary">Find People</Link>
              </>
            )}
            {activeTab === 'blocked' && (
              <>
                <div className="connections-empty-icon" aria-hidden="true">🚫</div>
                <h2>No blocked members</h2>
                <p>You haven't blocked anyone.</p>
              </>
            )}
          </div>
        )}

        {!loading && !error && data.length > 0 && (
          <div className="conn-list" role="list" aria-label={activeTabConfig.label}>
            {activeTab === 'connections' && (data as ConnectionItem[]).map((item) => (
              <ConnectionRow key={item.id} item={item} onRemove={handleRemoveItem} />
            ))}
            {activeTab === 'incoming' && (data as RequestItem[]).map((item) => (
              <IncomingRow key={item.id} item={item} onAction={handleRemoveItem} />
            ))}
            {activeTab === 'outgoing' && (data as RequestItem[]).map((item) => (
              <OutgoingRow key={item.id} item={item} onAction={handleRemoveItem} />
            ))}
            {activeTab === 'blocked' && (data as BlockItem[]).map((item) => (
              <BlockedRow key={item.id} item={item} onAction={handleRemoveItem} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
