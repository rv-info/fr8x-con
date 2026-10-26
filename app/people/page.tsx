'use client';

/**
 * /people — Professional Freight Network & People Hub
 *
 * Features:
 * - Unified navigation: All Directory | My Connections | Received Requests | Sent Requests
 * - High-density Tabular Order (Table View) & Grid Card View toggle
 * - Full-area responsive layout filling complete screen width
 * - Live DBMS synchronized requests and connection counts
 * - Debounced full-text + fuzzy search with category and trade lane filters
 * - Direct inline connection actions (Connect, Accept, Decline, Hold, Withdraw, Message)
 */

import React, { useState, useCallback, useEffect, useRef, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  Users,
  UserPlus,
  Clock,
  Table as TableIcon,
  LayoutGrid,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Loader2,
  Globe2,
  MapPin,
  Building2,
  ShieldCheck,
  MessageSquare,
  Search,
  Filter,
  ArrowRight,
  UserCheck,
  Check,
  X,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import { SearchFilters, PeopleSearchFilters } from '@/components/people/SearchFilters';
import { PersonCard, PersonCardSkeleton, PersonCardData } from '@/components/people/PersonCard';
import { ConnectionButton, ConnectionStatus } from '@/components/people/ConnectionButton';
import { RecommendedSection } from '@/components/people/RecommendedSection';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { useAuth } from '@/lib/context/AuthContext';
import { useData } from '@/lib/context/DataContext';
import { getClientAuthHeaders, CONNECTIONS_CHANGED_EVENT } from '@/lib/connections';
import { isSelfProfile, isTestOrDummyAccount } from '@/lib/connections-algorithm';

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 25;

type PeopleTab = 'all' | 'connections' | 'incoming' | 'outgoing';
type ViewMode = 'table' | 'card';

interface SearchResponse {
  success: boolean;
  data?: PersonCardData[];
  results?: PersonCardData[];
  count?: number;
  hasMore?: boolean;
  nextCursor?: string | null;
  pagination?: {
    nextCursor: string | null;
    hasMore: boolean;
  };
  error?: string | { code?: string; message?: string };
}

interface ConnectionItem {
  id: string;
  connected_at?: string;
  connected_to?: string;
  profiles: {
    id: string;
    display_name?: string | null;
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    headline?: string | null;
    designation?: string | null;
    company?: string | null;
    company_name?: string | null;
    location?: string | null;
    city?: string | null;
    country?: string | null;
    avatar_url?: string | null;
    is_verified?: boolean | null;
    has_golden_tick?: boolean | null;
  };
}

interface RequestItem {
  id: string;
  message?: string | null;
  created_at: string;
  status: string;
  profiles: {
    id: string;
    display_name?: string | null;
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    headline?: string | null;
    designation?: string | null;
    company?: string | null;
    company_name?: string | null;
    location?: string | null;
    city?: string | null;
    country?: string | null;
    avatar_url?: string | null;
    is_verified?: boolean | null;
    has_golden_tick?: boolean | null;
  };
}

function buildSearchUrl(filters: PeopleSearchFilters, cursor?: string, limit = PAGE_SIZE): string {
  const p = new URLSearchParams();
  if (filters.q.trim()) p.set('q', filters.q.trim());
  if (filters.country) p.set('country', filters.country);
  if (filters.city) p.set('city', filters.city);
  if (filters.industry) p.set('industry', filters.industry);
  if (filters.company) p.set('company', filters.company);
  if (filters.skills) p.set('skills', filters.skills);
  if (filters.verified) p.set('verified', 'true');
  p.set('limit', String(limit));
  if (cursor) p.set('cursor', cursor);
  return `/api/people/search?${p.toString()}`;
}

const QUICK_CATEGORIES = [
  'All Professionals',
  'Freight Forwarding',
  'Customs Brokerage',
  'NVOCC Operations',
  'Ocean Carriers',
  'Air Cargo',
  'Verified Only',
];

function PeopleContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const { refreshNotifications } = useData();

  // Active navigation tab
  const rawTab = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState<PeopleTab>(
    rawTab === 'incoming' || rawTab === 'outgoing' || rawTab === 'connections'
      ? rawTab
      : 'all'
  );

  // Sync tab with URL
  useEffect(() => {
    if (rawTab === 'incoming' || rawTab === 'outgoing' || rawTab === 'connections') {
      setActiveTab(rawTab);
    } else if (!rawTab) {
      setActiveTab('all');
    }
  }, [rawTab]);

  const switchTab = (tab: PeopleTab) => {
    setActiveTab(tab);
    if (typeof window !== 'undefined') {
      const newUrl = tab === 'all' ? '/people' : `/people?tab=${tab}`;
      window.history.replaceState(null, '', newUrl);
    }
  };

  // View mode: default to tabular order (table view) as requested
  const [view, setView] = useState<ViewMode>('table');

  // Directory search state
  const [filters, setFilters] = useState<PeopleSearchFilters>({ q: '' });
  const [selectedQuickCategory, setSelectedQuickCategory] = useState('All Professionals');
  const [results, setResults] = useState<PersonCardData[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [cursor, setCursor] = useState<string | null>(null);
  const [total, setTotal] = useState<number | null>(null);
  const [searched, setSearched] = useState(false);

  // Connected & Requests lists
  const [connectionsList, setConnectionsList] = useState<ConnectionItem[]>([]);
  const [incomingList, setIncomingList] = useState<RequestItem[]>([]);
  const [outgoingList, setOutgoingList] = useState<RequestItem[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const cursorRef = useRef<string | null>(null);

  // ── Core search function ──────────────────────────────────────────────────
  const doSearch = useCallback(
    async (searchFilters: PeopleSearchFilters, append = false) => {
      if (abortRef.current) {
        abortRef.current.abort();
      }
      abortRef.current = new AbortController();

      if (!append) {
        setLoading(true);
        cursorRef.current = null;
        setCursor(null);
      } else {
        setLoadMore(true);
      }
      setError(null);

      try {
        const url = buildSearchUrl(
          searchFilters,
          append ? cursorRef.current ?? undefined : undefined
        );

        const authHeaders = getClientAuthHeaders(user?.uid);
        const res = await fetch(url, {
          signal: abortRef.current.signal,
          headers: { Accept: 'application/json', ...authHeaders },
          credentials: 'include',
        });

        const data: SearchResponse = await res.json();

        if (!res.ok || !data.success) {
          const errMsg =
            typeof data.error === 'object' && data.error !== null
              ? data.error.message || 'Search failed. Please try again.'
              : typeof data.error === 'string'
              ? data.error
              : 'Search failed. Please try again.';
          setError(errMsg);
          return;
        }

        const rawRows = data.data ?? data.results ?? [];
        const rows: PersonCardData[] = rawRows.map((r) => ({
          ...r,
          connection_status: (r.connection_status ?? 'not_connected') as ConnectionStatus,
          skills: Array.isArray(r.skills)
            ? r.skills
            : r.skills && typeof r.skills === 'object'
            ? Object.values(r.skills as object)
            : [],
          specializations: Array.isArray(r.specializations)
            ? r.specializations
            : ['Logistics & Supply Chain', 'Freight Operations'],
          key_trade_lanes: Array.isArray(r.key_trade_lanes) && r.key_trade_lanes.length > 0
            ? r.key_trade_lanes
            : ['Global Corridors'],
        }));

        const hasMoreVal = data.pagination?.hasMore ?? data.hasMore ?? false;
        const nextCursorVal = data.pagination?.nextCursor ?? data.nextCursor ?? null;
        const countVal = data.count ?? rawRows.length;

        cursorRef.current = nextCursorVal;
        setHasMore(hasMoreVal);
        setCursor(nextCursorVal);

        if (append) {
          setResults((prev) => [...prev, ...rows]);
        } else {
          setResults(rows);
          setTotal(countVal);
          setSearched(true);
        }
      } catch (e: unknown) {
        const isAbort =
          (e instanceof DOMException && e.name === 'AbortError') ||
          (typeof e === 'object' &&
            e !== null &&
            ((e as { name?: string }).name === 'AbortError' ||
              String((e as { message?: string }).message).toLowerCase().includes('abort')));
        if (isAbort) return;
        setError('Search failed. Please try again.');
      } finally {
        setLoading(false);
        setLoadMore(false);
      }
    },
    [user?.uid]
  );

  // Load connection tabs data — AbortController + 15s timeout prevents infinite hangs
  const connAbortRef = useRef<AbortController | null>(null);
  const loadConnectionsData = useCallback(async () => {
    // Cancel any previous in-flight request
    if (connAbortRef.current) connAbortRef.current.abort();
    const controller = new AbortController();
    connAbortRef.current = controller;
    // 15-second hard timeout — loader ALWAYS closes
    const timer = setTimeout(() => controller.abort(), 15000);

    setLoadingConnections(true);
    const authHeaders = getClientAuthHeaders(user?.uid);
    const opts = { headers: authHeaders, credentials: 'include' as RequestCredentials, signal: controller.signal };
    try {
      const [connRes, incRes, outRes] = await Promise.all([
        fetch('/api/people/connections?tab=connections', opts),
        fetch('/api/people/connections?tab=incoming', opts),
        fetch('/api/people/connections?tab=outgoing', opts),
      ]);

      if (connRes.ok) {
        const j = await connRes.json();
        if (j.success && Array.isArray(j.data)) setConnectionsList(j.data);
      }
      if (incRes.ok) {
        const j = await incRes.json();
        if (j.success && Array.isArray(j.data)) setIncomingList(j.data);
      }
      if (outRes.ok) {
        const j = await outRes.json();
        if (j.success && Array.isArray(j.data)) setOutgoingList(j.data);
      }
    } catch (e: unknown) {
      // AbortError is expected on timeout/cancel — silently ignore
      const isAbort =
        e instanceof DOMException && e.name === 'AbortError';
      if (!isAbort) console.error('[loadConnectionsData]', e);
    } finally {
      clearTimeout(timer);
      // ✅ Loader ALWAYS closes — no compromise
      setLoadingConnections(false);
    }
  }, [user?.uid]);

  // Initial load
  useEffect(() => {
    doSearch({ q: '' }, false);
    loadConnectionsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync on auth resolution
  const prevAuthUidRef = useRef<string | undefined>(user?.uid);
  useEffect(() => {
    if (user?.uid && user.uid !== prevAuthUidRef.current) {
      prevAuthUidRef.current = user.uid;
      loadConnectionsData();
      doSearch(filters, false);
    }
  }, [user?.uid, loadConnectionsData, doSearch, filters]);

  const localActionIdRef = useRef<string>('');

  // Listen to connection changes across tabs or window (skip if self-triggered to avoid duplicate storms)
  useEffect(() => {
    const handleConnChange = (e: any) => {
      if (e?.detail?.originId && e.detail.originId === localActionIdRef.current) {
        return; // Already refreshed by the initiating action
      }
      loadConnectionsData();
      doSearch(filters, false);
      refreshNotifications();
    };
    window.addEventListener(CONNECTIONS_CHANGED_EVENT, handleConnChange);
    return () => window.removeEventListener(CONNECTIONS_CHANGED_EVENT, handleConnChange);
  }, [loadConnectionsData, doSearch, filters, refreshNotifications]);

  // Filter change handler
  const handleFiltersChange = useCallback(
    (newFilters: PeopleSearchFilters) => {
      setFilters(newFilters);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        doSearch(newFilters, false);
      }, DEBOUNCE_MS);
    },
    [doSearch]
  );

  // Quick category chips click
  const handleQuickCategory = (cat: string) => {
    setSelectedQuickCategory(cat);
    let patch: Partial<PeopleSearchFilters> = {};
    if (cat === 'All Professionals') {
      patch = { industry: undefined, verified: undefined };
    } else if (cat === 'Verified Only') {
      patch = { verified: true };
    } else {
      patch = { industry: cat };
    }
    const merged = { ...filters, ...patch };
    setFilters(merged);
    doSearch(merged, false);
  };

  // Connection action handler (accept, decline, hold, withdraw, remove)
  const handleConnectionAction = async (action: string, payload: Record<string, string | undefined>) => {
    setActionBusyId(payload.request_id || payload.target_id || 'busy');
    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({ action, ...payload }),
      });
      if (res.ok) {
        const originId = `act_${Date.now()}`;
        localActionIdRef.current = originId;
        await Promise.all([
          loadConnectionsData(),
          doSearch(filters, false),
          refreshNotifications(),
        ]);
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent(CONNECTIONS_CHANGED_EVENT, { detail: { originId } }));
          window.dispatchEvent(new CustomEvent('fr8x_refresh_notifications', { detail: { originId } }));
        }
      }
    } catch {
      // non-blocking
    } finally {
      setActionBusyId(null);
    }
  };

  // Reconciles search results with active connections & pending requests in real time
  const effectiveStatusMap = useMemo(() => {
    const map = new Map<string, { status: ConnectionStatus; requestId?: string }>();

    // 1. Accepted connections
    for (const c of connectionsList) {
      const prof = c.profiles;
      const ids = [c.connected_to, prof?.id, c.id].filter(Boolean) as string[];
      for (const id of ids) {
        map.set(id.toLowerCase(), { status: 'connected' });
      }
      const name = (prof?.display_name || prof?.full_name || '').toLowerCase().trim();
      if (name && name !== 'freight professional' && name !== 'fr8x member') {
        map.set(`name:${name}`, { status: 'connected' });
      }
    }

    // 2. Incoming requests (pending_received)
    for (const r of incomingList) {
      const prof = r.profiles;
      const ids = [prof?.id, (r as any).requester_id, r.id].filter(Boolean) as string[];
      for (const id of ids) {
        if (!map.has(id.toLowerCase())) {
          map.set(id.toLowerCase(), { status: 'pending_received', requestId: r.id });
        }
      }
      const name = (prof?.display_name || prof?.full_name || '').toLowerCase().trim();
      if (name && name !== 'freight professional' && name !== 'fr8x member' && !map.has(`name:${name}`)) {
        map.set(`name:${name}`, { status: 'pending_received', requestId: r.id });
      }
    }

    // 3. Outgoing requests (pending_sent)
    for (const r of outgoingList) {
      const prof = r.profiles;
      const ids = [prof?.id, (r as any).recipient_id, (r as any).receiver_id, r.id].filter(Boolean) as string[];
      for (const id of ids) {
        if (!map.has(id.toLowerCase())) {
          map.set(id.toLowerCase(), { status: 'pending_sent', requestId: r.id });
        }
      }
      const name = (prof?.display_name || prof?.full_name || '').toLowerCase().trim();
      if (name && name !== 'freight professional' && name !== 'fr8x member' && !map.has(`name:${name}`)) {
        map.set(`name:${name}`, { status: 'pending_sent', requestId: r.id });
      }
    }

    return map;
  }, [connectionsList, incomingList, outgoingList]);

  const getEffectiveStatus = useCallback((person: PersonCardData): { status: ConnectionStatus; requestId?: string } => {
    const pId = (person.id || (person as any).user_id || '').toLowerCase();
    const name = (person.display_name || person.full_name || '').toLowerCase().trim();

    if (pId && effectiveStatusMap.has(pId)) {
      return effectiveStatusMap.get(pId)!;
    }
    if (name && effectiveStatusMap.has(`name:${name}`)) {
      return effectiveStatusMap.get(`name:${name}`)!;
    }
    return {
      status: (person.connection_status as ConnectionStatus) || 'not_connected',
      requestId: person.request_id,
    };
  }, [effectiveStatusMap]);

  // Defensive client-side filtering: strictly exclude self and test/dummy records
  const visibleResults = useMemo(() => {
    return results.filter((person) => {
      if (isTestOrDummyAccount(person)) return false;
      if (user && isSelfProfile(user, person as any)) return false;
      if (user?.uid && person.id && user.uid.toLowerCase() === person.id.toLowerCase()) return false;
      return true;
    });
  }, [results, user]);

  const getPersonDisplayName = (p: PersonCardData | ConnectionItem['profiles'] | RequestItem['profiles']) => {
    if (p.full_name?.trim()) return p.full_name.trim();
    if (p.display_name?.trim()) return p.display_name.trim();
    const full = `${p.first_name ?? ''} ${p.last_name ?? ''}`.trim();
    return full || 'FR8X Member';
  };

  const getPersonHeadline = (p: PersonCardData | ConnectionItem['profiles'] | RequestItem['profiles']) => {
    if (p.headline?.trim()) return p.headline.trim();
    if (p.designation?.trim()) return p.designation.trim();
    return 'Freight Logistics Professional';
  };

  const getPersonCompany = (p: PersonCardData | ConnectionItem['profiles'] | RequestItem['profiles']) => {
    return p.company?.trim() || p.company_name?.trim() || 'Global Freight Logistics';
  };

  const getPersonLocation = (p: PersonCardData | ConnectionItem['profiles'] | RequestItem['profiles']) => {
    if (p.location?.trim()) return p.location.trim();
    return [p.city, p.country].filter(Boolean).join(', ') || 'Global';
  };

  return (
    <div className="people-page">
      {/* Page Header */}
      <div className="people-page-header">
        <div className="people-page-title-wrap">
          <div
            style={{
              width: '42px',
              height: '42px',
              borderRadius: '10px',
              background: '#002b66',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#ffffff',
              boxShadow: '0 2px 6px rgba(0, 43, 102, 0.2)',
            }}
          >
            <Users size={22} />
          </div>
          <div>
            <h1 className="people-page-title" style={{ fontSize: '1.45rem', fontWeight: 800, color: '#002b66' }}>
              People &amp; Freight Network
            </h1>
            <p className="people-page-subtitle" style={{ fontSize: '12px', color: '#64748b', marginTop: '2px' }}>
              Discover verified freight forwarders, carriers, customs brokers, and NVOCCs worldwide.
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        {activeTab === 'all' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div
              style={{
                display: 'inline-flex',
                background: '#f1f5f9',
                padding: '3px',
                borderRadius: '8px',
                border: '1px solid #e2e8f0',
              }}
            >
              <button
                type="button"
                onClick={() => setView('table')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: view === 'table' ? '#002b66' : 'transparent',
                  color: view === 'table' ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease',
                }}
                title="Tabular Order Table View"
              >
                <TableIcon size={14} /> Tabular View
              </button>
              <button
                type="button"
                onClick={() => setView('card')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  border: 'none',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  background: view === 'card' ? '#002b66' : 'transparent',
                  color: view === 'card' ? '#ffffff' : '#475569',
                  transition: 'all 0.15s ease',
                }}
                title="Grid Card View"
              >
                <LayoutGrid size={14} /> Grid Cards
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs (All Directory, My Connections, Received Requests, Sent Requests) */}
      <nav className="people-nav-tabs" aria-label="People navigation tabs">
        <button
          type="button"
          onClick={() => switchTab('all')}
          className={`people-nav-tab ${activeTab === 'all' ? 'active' : ''}`}
        >
          <Globe2 size={15} />
          <span>All Freight Directory</span>
          {visibleResults.length > 0 && (
            <span
              className="people-tab-badge"
              style={{
                background: activeTab === 'all' ? '#002b66' : '#e2e8f0',
                color: activeTab === 'all' ? '#ffffff' : '#475569',
              }}
            >
              {visibleResults.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => switchTab('connections')}
          className={`people-nav-tab ${activeTab === 'connections' ? 'active' : ''}`}
        >
          <Users size={15} />
          <span>Connected</span>
          <span
            className="people-tab-badge"
            style={{
              background: activeTab === 'connections' ? '#002b66' : '#e2e8f0',
              color: activeTab === 'connections' ? '#ffffff' : '#475569',
            }}
          >
            {connectionsList.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => switchTab('incoming')}
          className={`people-nav-tab ${activeTab === 'incoming' ? 'active' : ''}`}
        >
          <UserPlus size={15} />
          <span>Received Requests</span>
          {incomingList.length > 0 && (
            <span
              className="people-tab-badge"
              style={{
                background: '#ef4444',
                color: '#ffffff',
              }}
            >
              {incomingList.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => switchTab('outgoing')}
          className={`people-nav-tab ${activeTab === 'outgoing' ? 'active' : ''}`}
        >
          <Clock size={15} />
          <span>Sent Requests</span>
          {outgoingList.length > 0 && (
            <span
              className="people-tab-badge"
              style={{
                background: activeTab === 'outgoing' ? '#002b66' : '#e2e8f0',
                color: activeTab === 'outgoing' ? '#ffffff' : '#475569',
              }}
            >
              {outgoingList.length}
            </span>
          )}
        </button>
      </nav>

      {/* ── TAB 1: ALL FREIGHT DIRECTORY ─────────────────────────────────── */}
      {activeTab === 'all' && (
        <div>
          {/* Search + Filter Bar */}
          <SearchFilters
            filters={filters}
            onChange={handleFiltersChange}
            disabled={loading}
          />

          {/* Quick Category Chips */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              overflowX: 'auto',
              padding: '6px 0 14px',
              scrollbarWidth: 'none',
            }}
          >
            {QUICK_CATEGORIES.map((cat) => {
              const isSelected = selectedQuickCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleQuickCategory(cat)}
                  style={{
                    padding: '5px 12px',
                    borderRadius: '20px',
                    fontSize: '11.5px',
                    fontWeight: 650,
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                    border: isSelected ? '1px solid #002b66' : '1px solid #dfe7f0',
                    background: isSelected ? '#002b66' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#334155',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat}
                </button>
              );
            })}
          </div>

          {/* Error Banner */}
          {error && (
            <div className="people-error-banner" role="alert" style={{ margin: '12px 0' }}>
              <p>{error}</p>
              <button onClick={() => doSearch(filters, false)} className="people-retry-btn">
                Retry
              </button>
            </div>
          )}

          {/* FR8X loader while initial search runs */}
          {loading && results.length === 0 && (
            <div className="fr8x-loader-overlay">
              <div className="fr8x-loader" aria-label="Loading freight network members…" role="status" />
              <p>Loading verified freight network members…</p>
            </div>
          )}

          {/* Results: TABULAR ORDER TABLE VIEW */}
          {view === 'table' && visibleResults.length > 0 && (
            <div className="people-table-container">
              <table className="people-table" aria-label="Freight Professionals Directory Table">
                <thead>
                  <tr>
                    <th style={{ width: '28%' }}>Freight Professional</th>
                    <th style={{ width: '22%' }}>Company &amp; Hub</th>
                    <th style={{ width: '22%' }}>Specialization &amp; Corridors</th>
                    <th style={{ width: '13%' }}>Network Status</th>
                    <th style={{ width: '15%', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleResults.map((person) => {
                    const name = getPersonDisplayName(person);
                    const headline = getPersonHeadline(person);
                    const company = getPersonCompany(person);
                    const location = getPersonLocation(person);
                    const { status: effectiveStatus, requestId: effectiveReqId } = getEffectiveStatus(person);

                    return (
                      <tr key={person.id}>
                        {/* Column 1: Member profile */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ position: 'relative', flexShrink: 0 }}>
                              <UserAvatar
                                name={name}
                                avatarUrl={person.avatar_url ?? undefined}
                                size={40}
                              />
                              {person.is_verified && (
                                <span
                                  style={{
                                    position: 'absolute',
                                    bottom: '-2px',
                                    right: '-2px',
                                    width: '14px',
                                    height: '14px',
                                    borderRadius: '50%',
                                    background: person.has_golden_tick ? '#f59e0b' : '#10b981',
                                    color: '#ffffff',
                                    fontSize: '8px',
                                    fontWeight: 900,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    border: '1.5px solid #ffffff',
                                  }}
                                  title={person.has_golden_tick ? 'Golden Tick Verified Member' : 'Verified Member'}
                                >
                                  {person.has_golden_tick ? '★' : '✓'}
                                </span>
                              )}
                            </div>
                            <div style={{ minWidth: 0 }}>
                              <Link
                                href={`/people/${person.id}`}
                                style={{
                                  fontWeight: 750,
                                  fontSize: '13px',
                                  color: '#002b66',
                                  textDecoration: 'none',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '4px',
                                }}
                              >
                                {name}
                                {person.has_golden_tick && <GoldenTick size={13} />}
                              </Link>
                              <div
                                style={{
                                  fontSize: '11px',
                                  color: '#64748b',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  maxWidth: '240px',
                                  marginTop: '1px',
                                }}
                                title={headline}
                              >
                                {headline}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Column 2: Company & Location */}
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontWeight: 650,
                                fontSize: '12.5px',
                                color: '#1e293b',
                              }}
                            >
                              <Building2 size={13} style={{ color: '#0284c7', flexShrink: 0 }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '200px' }}>
                                {company}
                              </span>
                            </div>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                fontSize: '11px',
                                color: '#64748b',
                              }}
                            >
                              <MapPin size={11} style={{ color: '#94a3b8', flexShrink: 0 }} />
                              <span>{location}</span>
                            </div>
                          </div>
                        </td>

                        {/* Column 3: Specializations & Trade Corridors */}
                        <td>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', maxWidth: '280px' }}>
                            {(person.specializations || []).slice(0, 2).map((s, idx) => (
                              <span key={idx} className="people-specialization-pill">
                                {s}
                              </span>
                            ))}
                            {(person.key_trade_lanes || []).slice(0, 1).map((lane, idx) => (
                              <span key={idx} className="people-trade-pill">
                                🌐 {lane}
                              </span>
                            ))}
                          </div>
                        </td>

                        {/* Column 4: Network Status */}
                        <td>
                          {effectiveStatus === 'connected' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                background: '#dcfce7',
                                color: '#15803d',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              <CheckCircle2 size={12} /> Connected
                            </span>
                          )}
                          {effectiveStatus === 'pending_sent' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                background: '#fef3c7',
                                color: '#b45309',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              <Clock size={12} /> Pending
                            </span>
                          )}
                          {effectiveStatus === 'pending_received' && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                background: '#e0f2fe',
                                color: '#0369a1',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              <UserPlus size={12} /> Incoming
                            </span>
                          )}
                          {(effectiveStatus === 'not_connected' || effectiveStatus === 'none') && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '3px 8px',
                                borderRadius: '12px',
                                background: '#f1f5f9',
                                color: '#64748b',
                                fontSize: '11px',
                                fontWeight: 600,
                              }}
                            >
                              Not connected
                            </span>
                          )}
                        </td>

                        {/* Column 5: Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                            <Link
                              href={`/people/${person.id}`}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '5px 9px',
                                borderRadius: '6px',
                                fontSize: '11.5px',
                                fontWeight: 650,
                                color: '#002b66',
                                background: '#f8fafc',
                                border: '1px solid #dfe7f0',
                                textDecoration: 'none',
                              }}
                            >
                              View
                            </Link>

                            <ConnectionButton
                              targetId={person.id}
                              initialStatus={effectiveStatus}
                              requestId={effectiveReqId}
                              size="sm"
                              onStatusChange={() => {
                                loadConnectionsData();
                                refreshNotifications();
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Results: CARD GRID VIEW */}
          {view === 'card' && visibleResults.length > 0 && (
            <div className="people-grid">
              {visibleResults.map((person) => {
                const { status: effectiveStatus, requestId: effectiveReqId } = getEffectiveStatus(person);
                return (
                  <PersonCard
                    key={person.id}
                    person={{
                      ...person,
                      connection_status: effectiveStatus,
                      request_id: effectiveReqId,
                    }}
                    view="card"
                  />
                );
              })}
            </div>
          )}

          {/* Empty search results state */}
          {!loading && visibleResults.length === 0 && !error && (
            <div
              style={{
                background: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                marginTop: '16px',
              }}
            >
              <div style={{ fontSize: '2rem', marginBottom: '8px' }}>👤</div>
              <h3 style={{ fontSize: '15px', fontWeight: 750, color: '#0f172a', margin: 0 }}>
                No matching freight professionals found
              </h3>
              <p style={{ fontSize: '12px', color: '#64748b', maxWidth: '380px', margin: '6px auto 16px' }}>
                We couldn&apos;t find anyone matching your exact filter criteria. Try resetting filters or browsing all professionals.
              </p>
              <button
                type="button"
                onClick={() => {
                  setFilters({ q: '' });
                  setSelectedQuickCategory('All Professionals');
                  doSearch({ q: '' }, false);
                }}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  background: '#002b66',
                  color: '#ffffff',
                  fontSize: '12px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Reset Search Filters
              </button>
            </div>
          )}

          {/* Pagination: Load More */}
          {hasMore && (
            <div style={{ textAlign: 'center', margin: '20px 0' }}>
              <button
                type="button"
                onClick={() => doSearch(filters, true)}
                disabled={loadingMore}
                style={{
                  padding: '9px 24px',
                  borderRadius: '8px',
                  background: '#f8fafc',
                  border: '1.5px solid #cbd5e1',
                  color: '#002b66',
                  fontSize: '13px',
                  fontWeight: 700,
                  cursor: loadingMore ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'all 0.15s ease',
                }}
              >
                {loadingMore && <Loader2 size={14} className="spin" />}
                {loadingMore ? 'Loading more members…' : 'Load More Freight Professionals'}
              </button>
            </div>
          )}

          {/* People You May Know Recommendations Tray */}
          {!filters.q.trim() && <RecommendedSection />}
        </div>
      )}

      {/* ── TAB 2: MY CONNECTIONS ────────────────────────────────────────── */}
      {activeTab === 'connections' && (
        <div className="people-table-container">
          {loadingConnections ? (
            <div className="fr8x-loader-overlay">
              <div className="fr8x-loader" aria-label="Loading connections…" role="status" />
              <p>Loading your verified connections…</p>
            </div>
          ) : connectionsList.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🤝</div>
              <h3 style={{ fontSize: '16px', fontWeight: 750, color: '#0f172a', margin: 0 }}>
                No active connections yet
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', maxWidth: '420px', margin: '8px auto 20px' }}>
                Connect with verified freight forwarders, carriers, and customs agents to expand your global logistics network.
              </p>
              <button
                type="button"
                onClick={() => switchTab('all')}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 18px',
                  borderRadius: '6px',
                  background: '#002b66',
                  color: '#ffffff',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                <Search size={14} /> Browse Freight Directory
              </button>
            </div>
          ) : (
            <table className="people-table" aria-label="My Connections Table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Connected Professional</th>
                  <th style={{ width: '28%' }}>Company &amp; Location</th>
                  <th style={{ width: '20%' }}>Connected Since</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {connectionsList.map((conn) => {
                  const p = conn.profiles;
                  const name = getPersonDisplayName(p);
                  const headline = getPersonHeadline(p);
                  const company = getPersonCompany(p);
                  const location = getPersonLocation(p);

                  return (
                    <tr key={conn.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <UserAvatar name={name} avatarUrl={p.avatar_url ?? undefined} size={40} />
                          <div>
                            <Link
                              href={`/people/${p.id}`}
                              style={{
                                fontWeight: 750,
                                fontSize: '13px',
                                color: '#002b66',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {name}
                              {p.has_golden_tick && <GoldenTick size={13} />}
                            </Link>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                              {headline}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#1e293b' }}>{company}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{location}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '11.5px', color: '#475569' }}>
                          {conn.connected_at
                            ? new Date(conn.connected_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Verified'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Link
                            href={`/people/${p.id}`}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 650,
                              color: '#002b66',
                              background: '#f8fafc',
                              border: '1px solid #dfe7f0',
                              textDecoration: 'none',
                            }}
                          >
                            Profile
                          </Link>
                          <button
                            type="button"
                            onClick={() => handleConnectionAction('remove', { target_id: p.id })}
                            disabled={actionBusyId === p.id}
                            style={{
                              padding: '5px 10px',
                              borderRadius: '6px',
                              fontSize: '11.5px',
                              fontWeight: 650,
                              color: '#ef4444',
                              background: '#fff1f2',
                              border: '1px solid #fecdd3',
                              cursor: 'pointer',
                            }}
                          >
                            {actionBusyId === p.id ? 'Removing…' : 'Disconnect'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 3: RECEIVED REQUESTS ─────────────────────────────────────── */}
      {activeTab === 'incoming' && (
        <div className="people-table-container">
          {loadingConnections ? (
            <div className="fr8x-loader-overlay">
              <div className="fr8x-loader" aria-label="Checking incoming requests…" role="status" />
              <p>Checking incoming requests…</p>
            </div>
          ) : incomingList.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>📬</div>
              <h3 style={{ fontSize: '16px', fontWeight: 750, color: '#0f172a', margin: 0 }}>
                No pending received requests
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', maxWidth: '400px', margin: '8px auto 0' }}>
                When other freight professionals invite you to connect, their invitations will appear right here with instant accept and review controls.
              </p>
            </div>
          ) : (
            <table className="people-table" aria-label="Incoming Requests Table">
              <thead>
                <tr>
                  <th style={{ width: '30%' }}>Sender</th>
                  <th style={{ width: '25%' }}>Company &amp; Location</th>
                  <th style={{ width: '25%' }}>Intro Note</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {incomingList.map((req) => {
                  const p = req.profiles;
                  const name = getPersonDisplayName(p);
                  const headline = getPersonHeadline(p);
                  const company = getPersonCompany(p);
                  const location = getPersonLocation(p);
                  const isBusy = actionBusyId === req.id;

                  return (
                    <tr key={req.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <UserAvatar name={name} avatarUrl={p.avatar_url ?? undefined} size={40} />
                          <div>
                            <Link
                              href={`/people/${p.id}`}
                              style={{
                                fontWeight: 750,
                                fontSize: '13px',
                                color: '#002b66',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {name}
                              {p.has_golden_tick && <GoldenTick size={13} />}
                            </Link>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                              {headline}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#1e293b' }}>{company}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{location}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '11.5px', color: '#475569', fontStyle: req.message ? 'italic' : 'normal' }}>
                          {req.message ? `"${req.message}"` : 'Standard network request'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <button
                            type="button"
                            onClick={() => handleConnectionAction('accept', { request_id: req.id })}
                            disabled={isBusy}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 12px',
                              borderRadius: '6px',
                              background: '#16a34a',
                              color: '#ffffff',
                              fontSize: '11.5px',
                              fontWeight: 700,
                              border: 'none',
                              cursor: 'pointer',
                            }}
                          >
                            <Check size={13} /> Accept
                          </button>
                          <button
                            type="button"
                            onClick={() => handleConnectionAction('decline', { request_id: req.id })}
                            disabled={isBusy}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px',
                              padding: '5px 10px',
                              borderRadius: '6px',
                              background: '#f8fafc',
                              color: '#64748b',
                              fontSize: '11.5px',
                              fontWeight: 600,
                              border: '1px solid #e2e8f0',
                              cursor: 'pointer',
                            }}
                          >
                            <X size={13} /> Decline
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* ── TAB 4: SENT REQUESTS ─────────────────────────────────────────── */}
      {activeTab === 'outgoing' && (
        <div className="people-table-container">
          {loadingConnections ? (
            <div className="fr8x-loader-overlay">
              <div className="fr8x-loader" aria-label="Loading sent requests…" role="status" />
              <p>Loading sent requests…</p>
            </div>
          ) : outgoingList.length === 0 ? (
            <div style={{ padding: '48px 24px', textAlign: 'center' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>⏳</div>
              <h3 style={{ fontSize: '16px', fontWeight: 750, color: '#0f172a', margin: 0 }}>
                No active sent requests
              </h3>
              <p style={{ fontSize: '12.5px', color: '#64748b', maxWidth: '400px', margin: '8px auto 0' }}>
                You have not sent any pending connection invitations. Find professionals and click &quot;Connect&quot; to build your network.
              </p>
            </div>
          ) : (
            <table className="people-table" aria-label="Sent Requests Table">
              <thead>
                <tr>
                  <th style={{ width: '32%' }}>Recipient</th>
                  <th style={{ width: '28%' }}>Company &amp; Location</th>
                  <th style={{ width: '20%' }}>Sent Date</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {outgoingList.map((req) => {
                  const p = req.profiles;
                  const name = getPersonDisplayName(p);
                  const headline = getPersonHeadline(p);
                  const company = getPersonCompany(p);
                  const location = getPersonLocation(p);
                  const isBusy = actionBusyId === req.id;

                  return (
                    <tr key={req.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <UserAvatar name={name} avatarUrl={p.avatar_url ?? undefined} size={40} />
                          <div>
                            <Link
                              href={`/people/${p.id}`}
                              style={{
                                fontWeight: 750,
                                fontSize: '13px',
                                color: '#002b66',
                                textDecoration: 'none',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              {name}
                              {p.has_golden_tick && <GoldenTick size={13} />}
                            </Link>
                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>
                              {headline}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: '12.5px', color: '#1e293b' }}>{company}</div>
                        <div style={{ fontSize: '11px', color: '#64748b' }}>{location}</div>
                      </td>
                      <td>
                        <span style={{ fontSize: '11.5px', color: '#64748b' }}>
                          {req.created_at
                            ? new Date(req.created_at).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })
                            : 'Pending'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleConnectionAction('cancel', { request_id: req.id })}
                          disabled={isBusy}
                          style={{
                            padding: '5px 12px',
                            borderRadius: '6px',
                            background: '#f8fafc',
                            color: '#64748b',
                            fontSize: '11.5px',
                            fontWeight: 650,
                            border: '1px solid #dfe7f0',
                            cursor: 'pointer',
                          }}
                        >
                          {isBusy ? 'Withdrawing…' : 'Withdraw Request'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default function PeoplePage() {
  return (
    <Suspense
      fallback={
        <div className="fr8x-loader-overlay" style={{ minHeight: '100vh' }}>
          <div className="fr8x-loader" aria-label="Loading People Hub…" role="status" />
          <p>Loading People &amp; Freight Network…</p>
        </div>
      }
    >
      <PeopleContent />
    </Suspense>
  );
}
