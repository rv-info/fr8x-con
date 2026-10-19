'use client';

/**
 * /connections — Connection Management Page.
 * Tabs: My Connections | Incoming Requests | Sent Requests | Blocked
 */

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  Users, UserPlus, Clock, UserX, Shield,
  CheckCircle2, XCircle, RotateCcw, Loader2, Globe2,
} from 'lucide-react';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { ConnectionButton } from '@/components/people/ConnectionButton';
import { useAuth } from '@/lib/context/AuthContext';
import { SearchConnectionsModal } from '@/components/connections/SearchConnectionsModal';
import { getClientAuthHeaders, CONNECTIONS_CHANGED_EVENT } from '@/lib/connections';

type Tab = 'connections' | 'incoming' | 'outgoing' | 'withdrawn' | 'blocked';

interface ProfileSnippet {
  id: string;
  display_name: string | null;
  full_name?: string | null;
  first_name: string | null;
  last_name: string | null;
  headline?: string | null;
  designation: string | null;
  company?: string | null;
  company_name: string | null;
  location?: string | null;
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

function getDisplayName(p?: ProfileSnippet | null) {
  if (!p) return 'FR8X Member';
  if (p.full_name?.trim()) return p.full_name.trim();
  if (p.display_name?.trim()) return p.display_name.trim();
  const full = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
  return full || 'FR8X Member';
}

function getSubline(p?: ProfileSnippet | null) {
  if (!p) return '';
  if (p.headline?.trim()) return p.headline.trim();
  const parts: string[] = [];
  if (p.designation) parts.push(p.designation);
  const comp = p.company || p.company_name;
  if (comp) parts.push(comp);
  return parts.join(' · ');
}

function getLocation(p?: ProfileSnippet | null) {
  if (!p) return '';
  if (p.location?.trim()) return p.location.trim();
  return [p.city, p.country].filter(Boolean).join(', ');
}

async function callConnectionAction(body: Record<string, string | undefined>) {
  const authHeaders = getClientAuthHeaders();
  const res = await fetch('/api/people/connections', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    credentials: 'include',
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
        {item.message && <p className="conn-row-message">&ldquo;{item.message}&rdquo;</p>}
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
        {item.message && <p className="conn-row-message">&ldquo;{item.message}&rdquo;</p>}
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
          aria-label={`Withdraw request to ${name}`}
        >
          {cancelling ? <Loader2 size={13} className="spin" /> : <RotateCcw size={13} />}
          Withdraw
        </button>
      </div>
    </div>
  );
}

// ── Withdrawn request row ──────────────────────────────────────────────────────
function WithdrawnRow({ item }: { item: RequestItem }) {
  const p    = item.profiles;
  const name = getDisplayName(p);

  return (
    <div className="conn-row" role="listitem">
      <Link href={`/people/${p.id}`} className="conn-row-avatar-link" aria-label={`View ${name}'s profile`}>
        <UserAvatar name={name} avatarUrl={p.avatar_url ?? undefined} size={44} />
      </Link>
      <div className="conn-row-body">
        <Link href={`/people/${p.id}`} className="conn-row-name">{name}</Link>
        <p className="conn-row-sub">{getSubline(p)}</p>
        {item.message && <p className="conn-row-message">&ldquo;{item.message}&rdquo;</p>}
        <p className="conn-row-date">
          Withdrawn {new Date(item.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
        </p>
      </div>
      <div className="conn-row-actions">
        <span
          className="conn-status-badge withdrawn"
          style={{
            color: '#64748b',
            background: '#f1f5f9',
            border: '1px solid #cbd5e1',
            padding: '3px 8px',
            borderRadius: '4px',
            fontSize: '11px',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
          }}
        >
          <RotateCcw size={11} aria-hidden="true" /> Withdrawn
        </span>
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
const TAB_CONFIG: { id: Tab; label: string; sublabel?: string; icon: React.ElementType }[] = [
  { id: 'connections', label: 'Connected Contacts', sublabel: 'My Contacts', icon: Users },
  { id: 'incoming',   label: 'CONNECTION REQUEST RECEIVED', sublabel: 'Received Requests', icon: UserPlus },
  { id: 'outgoing',   label: 'Sent Requests',        icon: Clock    },
  { id: 'withdrawn',  label: 'Withdrawn Requests',   icon: RotateCcw },
  { id: 'blocked',    label: 'Blocked',              icon: Shield   },
];

export default function ConnectionsPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]   = useState<Tab>('connections');
  const [data, setData]             = useState<unknown[]>([]);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const fetchTab = useCallback(async (tab: Tab, isBackground = false) => {
    if (!isBackground) setLoading(true);
    setError(null);
    try {
      const authHeaders = getClientAuthHeaders();
      const res = await fetch(`/api/people/connections?tab=${tab}&limit=100`, {
        headers: authHeaders,
        credentials: 'include',
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        if (!isBackground) setError(json.error ?? 'Failed to load data.');
      } else {
        setData(json.data ?? []);
      }
    } catch {
      if (!isBackground) setError('Failed to load data. Please try again.');
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTab(activeTab);
  }, [activeTab, fetchTab]);

  // Polling fallback every 8 seconds for incoming requests tab to guarantee instantaneous sync even if websocket drops
  useEffect(() => {
    if (activeTab !== 'incoming') return;
    const interval = setInterval(() => {
      fetchTab('incoming', true);
    }, 8000);
    return () => clearInterval(interval);
  }, [activeTab, fetchTab]);

  useEffect(() => {
    const handleChanged = () => {
      fetchTab(activeTab, true);
    };
    window.addEventListener(CONNECTIONS_CHANGED_EVENT, handleChanged);
    return () => {
      window.removeEventListener(CONNECTIONS_CHANGED_EVENT, handleChanged);
    };
  }, [activeTab, fetchTab]);

  const handleRemoveItem = useCallback((removedId: string) => {
    setData((prev) => (prev as { id: string }[]).filter((item) => item.id !== removedId));
  }, []);

  const activeTabConfig = TAB_CONFIG.find((t) => t.id === activeTab)!;

  return (
    <div className="connections-page" role="main">
      <div className="connections-page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <h1 className="connections-page-title" style={{ margin: 0 }}>
          <Users size={22} aria-hidden="true" className="connections-icon" />
          Enterprise Network Contacts & Directory
        </h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsSearchModalOpen(true)}
            className="btn-primary"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              background: 'var(--brand, #0284c7)',
              color: '#ffffff',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '12.5px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.08)',
            }}
            aria-label="Search New Contacts & Global Freight Connections"
          >
            <Globe2 size={15} aria-hidden="true" />
            Search New Contacts & Global Freight Connections
          </button>
          <Link href="/people" className="btn-secondary" aria-label="Global Directory">
            <Globe2 size={14} aria-hidden="true" /> Global Directory
          </Link>
        </div>
      </div>

      {/* Tabs */}
      <div className="connections-tabs" role="tablist" aria-label="Network sections">
        {TAB_CONFIG.map(({ id, label, sublabel, icon: Icon }) => (
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
            {sublabel && (
              <span className="tab-subtext" style={{ fontSize: '10px', opacity: 0.75, marginLeft: '3px' }}>
                ({sublabel})
              </span>
            )}
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
                <p>You haven&apos;t sent any connection requests yet.</p>
                <Link href="/people" className="btn-primary">Find People</Link>
              </>
            )}
            {activeTab === 'withdrawn' && (
              <>
                <div className="connections-empty-icon" aria-hidden="true">↩️</div>
                <h2>No withdrawn requests</h2>
                <p>You have not withdrawn any connection requests.</p>
              </>
            )}
            {activeTab === 'blocked' && (
              <>
                <div className="connections-empty-icon" aria-hidden="true">🚫</div>
                <h2>No blocked members</h2>
                <p>You haven&apos;t blocked anyone.</p>
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
            {activeTab === 'withdrawn' && (data as RequestItem[]).map((item) => (
              <WithdrawnRow key={item.id} item={item} />
            ))}
            {activeTab === 'blocked' && (data as BlockItem[]).map((item) => (
              <BlockedRow key={item.id} item={item} onAction={handleRemoveItem} />
            ))}
          </div>
        )}
      </div>

      <SearchConnectionsModal
        isOpen={isSearchModalOpen}
        onClose={() => setIsSearchModalOpen(false)}
        currentUser={user}
      />
    </div>
  );
}
