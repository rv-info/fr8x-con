'use client';

/**
 * /network — The Unified FR8X Enterprise Freight & People Network
 *
 * Consolidates all network discovery, connections, requests, and CRM directory
 * into ONE authoritative, high-agency B2B workspace.
 *
 * Core Functional Areas:
 * 1. Overview — Executive Network KPIs, Quick Actions, Trade Affinity Recommendations, Activity Feed.
 * 2. Discover — Verified Logistics Members & Freight Company Search, Advanced Corridors & Role Filters, Dual Table/Card view.
 * 3. Connections — Authoritative Accepted Network Peers, Realtime Presence, Quick Messaging, Profile Navigation.
 * 4. Requests — Unified Connection Requests Queue (Incoming, Outgoing/Sent with Withdraw, Held queue).
 * 5. Contacts & CRM — Complete Logistics CRM Directory, Pipeline Stages, Contact Modals & Quick Chat Drawer.
 */

import React, { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Users,
  Search,
  UserPlus,
  UserCheck,
  Building2,
  MapPin,
  MessageSquare,
  ShieldCheck,
  ArrowRight,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  Clock,
  Check,
  X,
  RotateCcw,
  Sparkles,
  Phone,
  Mail,
  Plus,
  Edit3,
  Trash2,
  Star,
  ExternalLink,
  ChevronRight,
  SlidersHorizontal,
  RefreshCw,
  Send,
  AlertCircle,
  CheckCircle2,
  Briefcase,
  Globe2,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useData } from '@/lib/context/DataContext';
import { useToast } from '@/lib/context/ToastContext';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { SearchFilters, PeopleSearchFilters } from '@/components/people/SearchFilters';
import { PersonCard, PersonCardData } from '@/components/people/PersonCard';
import { ConnectionButton, ConnectionStatus } from '@/components/people/ConnectionButton';
import { RecommendedSection } from '@/components/people/RecommendedSection';
import { SkeletonScreen } from '@/components/ui/SkeletonScreen';
import { EmptyState } from '@/components/ui/EmptyState';
import { ContactRecord } from '@/lib/db/contacts';
import { getClientAuthHeaders, CONNECTIONS_CHANGED_EVENT, dispatchConnectionsChanged } from '@/lib/connections';
import { isSelfProfile, isTestOrDummyAccount } from '@/lib/connections-algorithm';

export interface NetworkSearchFilters extends PeopleSearchFilters {
  category?: string;
  tradeLane?: string;
  location?: string;
  verifiedOnly?: boolean;
  hasGoldenTick?: boolean;
}

const DEBOUNCE_MS = 300;
const PAGE_SIZE = 25;

export type NetworkTab = 'overview' | 'discover' | 'connections' | 'requests' | 'crm';
export type RequestFilter = 'incoming' | 'outgoing' | 'held';
export type ViewMode = 'table' | 'card';
export type PresenceFilter = 'all' | 'live' | 'away' | 'busy' | 'offline';
export type CategoryFilter = 'all' | 'Freight Forwarder' | 'Shipping Line / Carrier' | 'Customs Broker' | 'Shipper (BCO)' | 'Transporter / Fleet';
export type StageFilter = 'all' | 'Active Partner' | 'Rate Quoted' | 'VIP / Key Account' | 'Prospect / Lead';

interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
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
  updated_at?: string;
  status: string;
  requester_id?: string;
  recipient_id?: string;
  profiles: {
    id: string;
    email?: string | null;
    display_name?: string | null;
    full_name?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    headline?: string | null;
    designation?: string | null;
    position?: string | null;
    company?: string | null;
    company_name?: string | null;
    location?: string | null;
    city?: string | null;
    country?: string | null;
    avatar_url?: string | null;
    is_verified?: boolean | null;
    has_golden_tick?: boolean | null;
    key_trade_lanes?: string[] | null;
  };
}

function resolveMemberName(p?: { full_name?: string | null; display_name?: string | null; first_name?: string | null; last_name?: string | null } | null): string {
  if (!p) return 'FR8X Member';
  if (p.full_name?.trim()) return p.full_name.trim();
  if (p.display_name?.trim()) return p.display_name.trim();
  const combined = `${p.first_name || ''} ${p.last_name || ''}`.trim();
  return combined || 'FR8X Member';
}

function resolveMemberSubline(p?: { designation?: string | null; position?: string | null; company?: string | null; company_name?: string | null; headline?: string | null } | null): string {
  if (!p) return 'Logistics Member';
  if (p.headline?.trim()) return p.headline.trim();
  const parts: string[] = [];
  if (p.designation || p.position) parts.push((p.designation || p.position)!);
  const comp = p.company_name || p.company;
  if (comp) parts.push(comp);
  return parts.join(' · ') || 'Freight Procurement';
}

function buildSearchUrl(filters: NetworkSearchFilters, cursor?: string, limit = PAGE_SIZE): string {
  const p = new URLSearchParams();
  if (filters.q?.trim()) p.set('q', filters.q.trim());
  if (filters.category && filters.category !== 'all') p.set('category', filters.category);
  if (filters.tradeLane?.trim()) p.set('trade_lane', filters.tradeLane.trim());
  if (filters.location?.trim()) p.set('location', filters.location.trim());
  if (filters.country?.trim()) p.set('country', filters.country.trim());
  if (filters.verifiedOnly) p.set('verified', 'true');
  if (filters.hasGoldenTick) p.set('golden_tick', 'true');
  if (cursor) p.set('cursor', cursor);
  p.set('limit', String(limit));
  return `/api/people/search?${p.toString()}`;
}

function NetworkPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { notifications } = useData();

  // ── Tab Management ──────────────────────────────────────────────────────────
  const rawTab = searchParams.get('tab') as string | null;
  const initialTab: NetworkTab =
    rawTab === 'discover' || rawTab === 'all'
      ? 'discover'
      : rawTab === 'connections'
      ? 'connections'
      : rawTab === 'incoming' || rawTab === 'outgoing' || rawTab === 'held' || rawTab === 'requests'
      ? 'requests'
      : rawTab === 'crm' || rawTab === 'contacts'
      ? 'crm'
      : 'overview';

  const [activeTab, setActiveTab] = useState<NetworkTab>(initialTab);
  const [requestFilter, setRequestFilter] = useState<RequestFilter>(
    rawTab === 'outgoing' ? 'outgoing' : rawTab === 'held' ? 'held' : 'incoming'
  );
  const [viewMode, setViewMode] = useState<ViewMode>('table');

  const switchTab = (tab: NetworkTab) => {
    setActiveTab(tab);
    const newUrl = tab === 'overview' ? '/network' : `/network?tab=${tab}`;
    router.push(newUrl, { scroll: false });
  };

  // ── Discover Tab State ──────────────────────────────────────────────────────
  const [discoverFilters, setDiscoverFilters] = useState<NetworkSearchFilters>({
    q: searchParams.get('q') || '',
    category: searchParams.get('category') || 'all',
    tradeLane: searchParams.get('trade_lane') || '',
    location: searchParams.get('location') || '',
    country: searchParams.get('country') || '',
    verifiedOnly: searchParams.get('verified') === 'true',
    hasGoldenTick: searchParams.get('golden_tick') === 'true',
  });
  const [discoverResults, setDiscoverResults] = useState<PersonCardData[]>([]);
  const [discoverTotal, setDiscoverTotal] = useState<number | null>(null);
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [discoverCursor, setDiscoverCursor] = useState<string | null>(null);
  const [hasMoreDiscover, setHasMoreDiscover] = useState(false);

  // ── Connections State ───────────────────────────────────────────────────────
  const [connections, setConnections] = useState<ConnectionItem[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(false);
  const [connectionSearch, setConnectionSearch] = useState('');

  // ── Requests State ──────────────────────────────────────────────────────────
  const [incomingRequests, setIncomingRequests] = useState<RequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<RequestItem[]>([]);
  const [heldRequests, setHeldRequests] = useState<RequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestActionBusyId, setRequestActionBusyId] = useState<string | null>(null);

  // ── CRM Contacts State ──────────────────────────────────────────────────────
  const [crmContacts, setCrmContacts] = useState<ContactRecord[]>([]);
  const [loadingCrm, setLoadingCrm] = useState(false);
  const [crmSearch, setCrmSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [presenceFilter, setPresenceFilter] = useState<PresenceFilter>('all');
  const [myPresence, setMyPresence] = useState<'live' | 'away' | 'busy' | 'offline'>('live');

  // ── Modals & Drawer State ───────────────────────────────────────────────────
  const [sendConnectTarget, setSendConnectTarget] = useState<PersonCardData | null>(null);
  const [sendConnectNote, setSendConnectNote] = useState('');
  const [sendingConnect, setSendingConnect] = useState(false);

  const [showAddContactModal, setShowAddContactModal] = useState(false);
  const [showEditContactModal, setShowEditContactModal] = useState(false);
  const [showDeleteContactModal, setShowDeleteContactModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [deleteAlsoConnection, setDeleteAlsoConnection] = useState(true);

  const [addMode, setAddMode] = useState<'directory' | 'manual'>('directory');
  const [dirSearchQuery, setDirSearchQuery] = useState('');
  const [dirSearchResults, setDirSearchResults] = useState<PersonCardData[]>([]);
  const [searchingDir, setSearchingDir] = useState(false);

  const [crmFormData, setCrmFormData] = useState({
    name: '',
    company: '',
    designation: '',
    email: '',
    phone: '',
    category: 'Freight Forwarder' as ContactRecord['category'],
    stage: 'Active Partner' as ContactRecord['stage'],
    status: 'online' as ContactRecord['status'],
    location: '',
    tags: '',
    notes: '',
    is_favorite: false,
    contact_profile_id: '' as string | null,
  });

  // ── Quick Chat Drawer State ─────────────────────────────────────────────────
  const [activeChatContact, setActiveChatContact] = useState<ContactRecord | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // ── 1. Fetch Connections and Requests ───────────────────────────────────────
  const fetchNetworkQueues = useCallback(async () => {
    setLoadingConnections(true);
    setLoadingRequests(true);
    try {
      const headers = getClientAuthHeaders(user?.uid);
      const opts = { headers, credentials: 'include' as RequestCredentials };

      const [connRes, inRes, outRes] = await Promise.all([
        fetch('/api/people/connections?tab=connections', opts),
        fetch('/api/people/connections?tab=incoming', opts),
        fetch('/api/people/connections?tab=outgoing', opts),
      ]);

      const [connData, inData, outData] = await Promise.all([
        connRes.json().catch(() => ({ connections: [] })),
        inRes.json().catch(() => ({ requests: [] })),
        outRes.json().catch(() => ({ requests: [] })),
      ]);

      const rawConns: ConnectionItem[] = connData.connections || connData.data || [];
      const cleanConns = rawConns.filter(
        (c) => c && c.profiles && !isSelfProfile(user, c.profiles) && !isTestOrDummyAccount(c.profiles)
      );
      setConnections(cleanConns);

      const rawIn: RequestItem[] = inData.requests || inData.data || [];
      const cleanIn = rawIn.filter(
        (r) => r && r.profiles && !isSelfProfile(user, r.profiles) && !isTestOrDummyAccount(r.profiles)
      );
      setIncomingRequests(cleanIn);

      const rawOut: RequestItem[] = outData.requests || outData.data || [];
      const cleanOut = rawOut.filter(
        (r) => r && r.profiles && !isSelfProfile(user, r.profiles) && !isTestOrDummyAccount(r.profiles)
      );
      setOutgoingRequests(cleanOut);
    } catch (err: any) {
      console.warn('[Network] Failed to fetch queues:', err.message);
    } finally {
      setLoadingConnections(false);
      setLoadingRequests(false);
    }
  }, [user?.uid]);

  // ── 2. Fetch CRM Contacts ───────────────────────────────────────────────────
  const fetchCrmContacts = useCallback(async () => {
    setLoadingCrm(true);
    try {
      const headers = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/contacts', { headers, credentials: 'include' });
      const data = await res.json();
      if (data.success && Array.isArray(data.contacts)) {
        setCrmContacts(data.contacts);
      }
    } catch (err: any) {
      console.warn('[Network] Failed to fetch CRM contacts:', err.message);
    } finally {
      setLoadingCrm(false);
    }
  }, [user?.uid]);

  // ── 3. Fetch Discover Members ───────────────────────────────────────────────
  const fetchDiscover = useCallback(
    async (filters: NetworkSearchFilters, cursor?: string) => {
      setLoadingDiscover(true);
      try {
        const url = buildSearchUrl(filters, cursor);
        const headers = getClientAuthHeaders(user?.uid);
        const res = await fetch(url, { headers, credentials: 'include' });
        const json = await res.json();
        const results: PersonCardData[] = json.results || json.data || [];
        const cleanResults = results.filter(
          (p) => !isSelfProfile(user, p) && !isTestOrDummyAccount(p)
        );

        if (cursor) {
          setDiscoverResults((prev) => [...prev, ...cleanResults]);
        } else {
          setDiscoverResults(cleanResults);
          setDiscoverTotal(json.count ?? cleanResults.length);
        }
        setDiscoverCursor(json.nextCursor || json.pagination?.nextCursor || null);
        setHasMoreDiscover(Boolean(json.hasMore || json.pagination?.hasMore));
      } catch (err: any) {
        console.warn('[Network] Discover fetch failed:', err.message);
      } finally {
        setLoadingDiscover(false);
      }
    },
    [user?.uid]
  );

  // Initial Load & Event Listener
  useEffect(() => {
    fetchNetworkQueues();
    fetchCrmContacts();
    fetchDiscover(discoverFilters);

    const onConnChanged = () => {
      fetchNetworkQueues();
      fetchCrmContacts();
    };
    window.addEventListener(CONNECTIONS_CHANGED_EVENT, onConnChanged);
    return () => window.removeEventListener(CONNECTIONS_CHANGED_EVENT, onConnChanged);
  }, [fetchNetworkQueues, fetchCrmContacts, fetchDiscover]);

  // Debounced search on discoverFilters change
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchDiscover(discoverFilters);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [discoverFilters, fetchDiscover]);

  // ── Connection Action Handler ───────────────────────────────────────────────
  const handleConnectionAction = async (action: 'accept' | 'decline' | 'hold' | 'unhold' | 'withdraw' | 'remove', requestId?: string, targetId?: string) => {
    const id = requestId || targetId;
    if (!id) return;
    setRequestActionBusyId(id);
    try {
      const headers = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          action: action === 'withdraw' ? 'cancel' : action,
          request_id: requestId,
          target_id: targetId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Action ${action} successful.`);
        dispatchConnectionsChanged();
        fetchNetworkQueues();
      } else {
        toast(data.error || `Failed to ${action} request.`);
      }
    } catch (err: any) {
      toast(`Error processing ${action}: ${err.message}`);
    } finally {
      setRequestActionBusyId(null);
    }
  };

  // ── Send Connect with Note ──────────────────────────────────────────────────
  const handleSendConnect = async () => {
    if (!sendConnectTarget) return;
    setSendingConnect(true);
    try {
      const headers = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          action: 'send',
          target_id: sendConnectTarget.id,
          message: sendConnectNote.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Invitation sent to ${resolveMemberName(sendConnectTarget)}.`);
        setSendConnectTarget(null);
        setSendConnectNote('');
        dispatchConnectionsChanged();
        fetchNetworkQueues();
      } else {
        toast(data.error || 'Failed to send invitation.');
      }
    } catch (err: any) {
      toast(`Connection error: ${err.message}`);
    } finally {
      setSendingConnect(false);
    }
  };

  // ── Chat Drawer Handlers ────────────────────────────────────────────────────
  const openChatDrawer = async (contact: ContactRecord) => {
    setActiveChatContact(contact);
    setChatLoading(true);
    setChatMessages([]);
    try {
      const targetId = contact.contact_profile_id || contact.id;
      const res = await fetch(`/api/contacts/chat?recipient_id=${encodeURIComponent(targetId)}`, {
        headers: getClientAuthHeaders(user?.uid),
        credentials: 'include',
      });
      const data = await res.json();
      if (data.success && Array.isArray(data.messages)) {
        setChatMessages(data.messages);
      }
    } catch {}
    setChatLoading(false);
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim() || !activeChatContact) return;
    setChatSending(true);
    const content = chatInputText.trim();
    setChatInputText('');
    try {
      const targetId = activeChatContact.contact_profile_id || activeChatContact.id;
      const res = await fetch('/api/contacts/chat', {
        method: 'POST',
        headers: getClientAuthHeaders(user?.uid),
        credentials: 'include',
        body: JSON.stringify({ recipient_id: targetId, content }),
      });
      const data = await res.json();
      if (data.success && data.message) {
        setChatMessages((prev) => [...prev, data.message]);
        setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      }
    } catch {}
    setChatSending(false);
  };

  // ── Filtered CRM Contacts ───────────────────────────────────────────────────
  const filteredCrm = useMemo(() => {
    return crmContacts.filter((c) => {
      if (categoryFilter !== 'all' && c.category !== categoryFilter) return false;
      if (stageFilter !== 'all' && c.stage !== stageFilter) return false;
      if (presenceFilter !== 'all' && c.status !== (presenceFilter === 'live' ? 'online' : presenceFilter)) return false;
      if (crmSearch.trim()) {
        const q = crmSearch.toLowerCase();
        const match =
          c.name.toLowerCase().includes(q) ||
          (c.company && c.company.toLowerCase().includes(q)) ||
          (c.email && c.email.toLowerCase().includes(q)) ||
          (c.tags && c.tags.some((t) => t.toLowerCase().includes(q)));
        if (!match) return false;
      }
      return true;
    });
  }, [crmContacts, categoryFilter, stageFilter, presenceFilter, crmSearch]);

  // ── Filtered Connections ────────────────────────────────────────────────────
  const filteredConnections = useMemo(() => {
    if (!connectionSearch.trim()) return connections;
    const q = connectionSearch.toLowerCase();
    return connections.filter((c) => {
      const name = resolveMemberName(c.profiles).toLowerCase();
      const comp = (c.profiles.company_name || c.profiles.company || '').toLowerCase();
      const desig = (c.profiles.designation || '').toLowerCase();
      return name.includes(q) || comp.includes(q) || desig.includes(q);
    });
  }, [connections, connectionSearch]);

  const incomingCount = incomingRequests.length;
  const outgoingCount = outgoingRequests.length;
  const heldCount = heldRequests.length;

  return (
    <div className="network-workspace-container" style={{ maxWidth: '1440px', margin: '0 auto', padding: '16px 20px 80px' }}>
      {/* ── 1. Top Header & Workspace Title ────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
          marginBottom: '20px',
          paddingBottom: '16px',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: '#6B7280',
              }}
            >
              Enterprise Logistics Directory
            </span>
            <span
              style={{
                fontSize: '10px',
                fontWeight: 600,
                padding: '2px 8px',
                borderRadius: '4px',
                background: '#F3F4F6',
                color: '#111827',
                border: '1px solid #E5E7EB',
              }}
            >
              Verified Network
            </span>
          </div>
          <h1
            style={{
              fontSize: '24px',
              fontWeight: 800,
              color: '#000000',
              letterSpacing: '-0.02em',
              margin: 0,
            }}
          >
            Network
          </h1>
        </div>

        {/* Quick Workspace Stats */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              borderRadius: '6px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
              fontSize: '12px',
              fontWeight: 600,
              color: '#111827',
            }}
          >
            <UserCheck size={14} style={{ color: '#000000' }} />
            <span>{connections.length} Connections</span>
          </div>

          {incomingCount > 0 && (
            <button
              onClick={() => {
                switchTab('requests');
                setRequestFilter('incoming');
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#000000',
                color: '#FFFFFF',
                border: '1px solid #000000',
                fontSize: '12px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <span>{incomingCount} Pending Requests</span>
            </button>
          )}

          <button
            onClick={() => {
              setCrmFormData({
                name: '',
                company: '',
                designation: '',
                email: '',
                phone: '',
                category: 'Freight Forwarder',
                stage: 'Active Partner',
                status: 'online',
                location: '',
                tags: '',
                notes: '',
                is_favorite: false,
                contact_profile_id: null,
              });
              setShowAddContactModal(true);
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 14px',
              borderRadius: '6px',
              background: '#000000',
              color: '#FFFFFF',
              border: '1px solid #000000',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Plus size={14} />
            <span>Add Contact</span>
          </button>
        </div>
      </div>

      {/* ── 2. Unified Navigation Tabs ─────────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          borderBottom: '1px solid #E5E7EB',
          marginBottom: '20px',
          overflowX: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        <button
          onClick={() => switchTab('overview')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'overview' ? 700 : 500,
            color: activeTab === 'overview' ? '#000000' : '#6B7280',
            borderBottom: activeTab === 'overview' ? '2px solid #000000' : '2px solid transparent',
            background: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Overview
        </button>

        <button
          onClick={() => switchTab('discover')}
          style={{
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'discover' ? 700 : 500,
            color: activeTab === 'discover' ? '#000000' : '#6B7280',
            borderBottom: activeTab === 'discover' ? '2px solid #000000' : '2px solid transparent',
            background: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          Discover Directory
        </button>

        <button
          onClick={() => switchTab('connections')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'connections' ? 700 : 500,
            color: activeTab === 'connections' ? '#000000' : '#6B7280',
            borderBottom: activeTab === 'connections' ? '2px solid #000000' : '2px solid transparent',
            background: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <span>My Connections</span>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '10px',
              background: activeTab === 'connections' ? '#000000' : '#F3F4F6',
              color: activeTab === 'connections' ? '#FFFFFF' : '#4B5563',
            }}
          >
            {connections.length}
          </span>
        </button>

        <button
          onClick={() => switchTab('requests')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'requests' ? 700 : 500,
            color: activeTab === 'requests' ? '#000000' : '#6B7280',
            borderBottom: activeTab === 'requests' ? '2px solid #000000' : '2px solid transparent',
            background: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <span>Connection Requests</span>
          {incomingCount > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '1px 6px',
                borderRadius: '10px',
                background: '#000000',
                color: '#FFFFFF',
                fontWeight: 700,
              }}
            >
              {incomingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => switchTab('crm')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '10px 16px',
            fontSize: '13px',
            fontWeight: activeTab === 'crm' ? 700 : 500,
            color: activeTab === 'crm' ? '#000000' : '#6B7280',
            borderBottom: activeTab === 'crm' ? '2px solid #000000' : '2px solid transparent',
            background: 'none',
            borderLeft: 'none',
            borderRight: 'none',
            borderTop: 'none',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          <span>Contacts &amp; CRM</span>
          <span
            style={{
              fontSize: '11px',
              padding: '1px 6px',
              borderRadius: '10px',
              background: activeTab === 'crm' ? '#000000' : '#F3F4F6',
              color: activeTab === 'crm' ? '#FFFFFF' : '#4B5563',
            }}
          >
            {crmContacts.length}
          </span>
        </button>
      </div>

      {/* ── TAB 1: OVERVIEW ────────────────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Executive Metrics Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
            }}
          >
            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                Total Verified Connections
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#000000', margin: '4px 0' }}>
                {connections.length}
              </div>
              <div style={{ fontSize: '12px', color: '#4B5563' }}>Direct peer freight partners</div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                Pending Incoming Requests
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#000000', margin: '4px 0' }}>
                {incomingCount}
              </div>
              <div style={{ fontSize: '12px', color: '#4B5563' }}>Awaiting your confirmation</div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                Active CRM Records
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#000000', margin: '4px 0' }}>
                {crmContacts.length}
              </div>
              <div style={{ fontSize: '12px', color: '#4B5563' }}>Classified enterprise entities</div>
            </div>

            <div
              style={{
                padding: '16px',
                borderRadius: '8px',
                background: '#FFFFFF',
                border: '1px solid #E5E7EB',
              }}
            >
              <div style={{ fontSize: '11px', fontWeight: 600, color: '#6B7280', textTransform: 'uppercase' }}>
                Outgoing Pending Invitations
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#000000', margin: '4px 0' }}>
                {outgoingCount}
              </div>
              <div style={{ fontSize: '12px', color: '#4B5563' }}>Sent to industry partners</div>
            </div>
          </div>

          {/* Trade Affinity Recommended Section */}
          <div
            style={{
              padding: '20px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <div>
                <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: '#000000' }}>
                  Trade Affinity Recommendations
                </h3>
                <p style={{ margin: '3px 0 0', fontSize: '12px', color: '#6B7280' }}>
                  Logistics professionals operating on your primary trade corridors and port corridors.
                </p>
              </div>
              <button
                onClick={() => switchTab('discover')}
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#000000',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px',
                }}
              >
                <span>Browse All</span>
                <ArrowRight size={13} />
              </button>
            </div>
            <RecommendedSection />
          </div>

          {/* Recent Network Activity */}
          <div
            style={{
              padding: '20px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
            }}
          >
            <h3 style={{ fontSize: '15px', fontWeight: 700, margin: '0 0 14px', color: '#000000' }}>
              Recent Network Activity &amp; Notifications
            </h3>
            {notifications && notifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notifications
                  .filter((n) => n.category === 'nexus' || n.category === 'profile' || n.targetUrl?.includes('people') || n.targetUrl?.includes('network') || n.targetUrl?.includes('connections'))
                  .slice(0, 5)
                  .map((notif) => (
                    <div
                      key={notif.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: '6px',
                        background: '#F9FAFB',
                        border: '1px solid #E5E7EB',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Clock size={14} style={{ color: '#6B7280' }} />
                        <span style={{ fontSize: '12.5px', color: '#111827', fontWeight: 500 }}>
                          {notif.title || notif.desc}
                        </span>
                      </div>
                      <span style={{ fontSize: '11px', color: '#9CA3AF' }}>{notif.time || notif.createdAt}</span>
                    </div>
                  ))}
              </div>
            ) : (
              <div style={{ padding: '20px', textAlign: 'center', color: '#6B7280', fontSize: '12px' }}>
                No recent network notifications.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB 2: DISCOVER DIRECTORY ─────────────────────────────────────────── */}
      {activeTab === 'discover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Controls Bar: Filters & View Toggles */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '14px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '280px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
                />
                <input
                  type="text"
                  placeholder="Search freight professionals by name, company, skill…"
                  value={discoverFilters.q}
                  onChange={(e) => setDiscoverFilters((prev) => ({ ...prev, q: e.target.value }))}
                  style={{
                    width: '100%',
                    height: '36px',
                    paddingLeft: '32px',
                    paddingRight: '12px',
                    fontSize: '12.5px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    color: '#000000',
                    outline: 'none',
                  }}
                />
              </div>

              <select
                value={discoverFilters.category}
                onChange={(e) => setDiscoverFilters((prev) => ({ ...prev, category: e.target.value }))}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#111827',
                  outline: 'none',
                }}
              >
                <option value="all">All Industry Roles</option>
                <option value="Freight Forwarder">Freight Forwarder</option>
                <option value="Shipping Line">Shipping Line / Carrier</option>
                <option value="Customs Broker">Customs Broker</option>
                <option value="Shipper">Shipper (BCO)</option>
                <option value="Transporter">Transporter / Fleet</option>
              </select>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#4B5563', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={discoverFilters.hasGoldenTick}
                  onChange={(e) => setDiscoverFilters((prev) => ({ ...prev, hasGoldenTick: e.target.checked }))}
                />
                <span>Golden Tick Only</span>
              </label>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: '#6B7280' }}>
                {discoverTotal !== null ? `${discoverTotal} verified members` : 'Searching…'}
              </span>
              <div style={{ display: 'flex', border: '1px solid #E5E7EB', borderRadius: '6px', overflow: 'hidden' }}>
                <button
                  onClick={() => setViewMode('table')}
                  style={{
                    padding: '6px 10px',
                    background: viewMode === 'table' ? '#000000' : '#FFFFFF',
                    color: viewMode === 'table' ? '#FFFFFF' : '#4B5563',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Table View"
                >
                  <TableIcon size={14} />
                </button>
                <button
                  onClick={() => setViewMode('card')}
                  style={{
                    padding: '6px 10px',
                    background: viewMode === 'card' ? '#000000' : '#FFFFFF',
                    color: viewMode === 'card' ? '#FFFFFF' : '#4B5563',
                    border: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                  title="Card View"
                >
                  <LayoutGrid size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Results Area */}
          {loadingDiscover && discoverResults.length === 0 ? (
            <SkeletonScreen type="table" count={10} label="Searching logistics directory…" />
          ) : discoverResults.length === 0 ? (
            <EmptyState
              title="No Logistics Members Found"
              description="No members match your search criteria. Try adjusting trade lanes, company name, or role filters."
              actionLabel="Reset Search Filters"
              onAction={() =>
                setDiscoverFilters({
                  q: '',
                  category: 'all',
                  tradeLane: '',
                  location: '',
                  country: '',
                  verifiedOnly: false,
                  hasGoldenTick: false,
                })
              }
            />
          ) : viewMode === 'table' ? (
            /* High-Density Minimalist Table */
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', background: '#FFFFFF' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Member</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Company &amp; Role</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Location</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Corridors &amp; Specialization</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {discoverResults.map((person) => {
                    const name = resolveMemberName(person);
                    const subline = resolveMemberSubline(person);
                    return (
                      <tr key={person.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <UserAvatar name={name} avatarUrl={person.avatar_url || undefined} size={32} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Link
                                  href={`/network/${person.id}`}
                                  style={{ fontWeight: 700, color: '#000000', textDecoration: 'none' }}
                                >
                                  {name}
                                </Link>
                                {person.has_golden_tick && <GoldenTick />}
                              </div>
                              <div style={{ fontSize: '11px', color: '#6B7280' }}>
                                {person.is_verified ? 'Verified Entity' : 'Member'}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>
                            {person.company_name || person.company || 'Enterprise Logistics'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>
                            {person.designation || person.position || 'Logistics Specialist'}
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px', color: '#4B5563' }}>
                          {[person.city, person.country].filter(Boolean).join(', ') || 'Global'}
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {(person.key_trade_lanes || ['Ocean Freight', 'Air Cargo']).slice(0, 2).map((lane, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '10.5px',
                                  padding: '2px 6px',
                                  borderRadius: '4px',
                                  background: '#F3F4F6',
                                  color: '#374151',
                                  border: '1px solid #E5E7EB',
                                }}
                              >
                                {lane}
                              </span>
                            ))}
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => {
                                setSendConnectTarget(person);
                                setSendConnectNote('');
                              }}
                              style={{
                                padding: '5px 12px',
                                borderRadius: '4px',
                                background: '#000000',
                                color: '#FFFFFF',
                                border: '1px solid #000000',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                cursor: 'pointer',
                              }}
                            >
                              Connect
                            </button>
                            <Link
                              href={`/network/${person.id}`}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '4px',
                                background: '#FFFFFF',
                                color: '#111827',
                                border: '1px solid #E5E7EB',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                textDecoration: 'none',
                              }}
                            >
                              Profile
                            </Link>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            /* Card Grid View */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
                gap: '14px',
              }}
            >
              {discoverResults.map((person) => (
                <div
                  key={person.id}
                  style={{
                    padding: '16px',
                    borderRadius: '8px',
                    background: '#FFFFFF',
                    border: '1px solid #E5E7EB',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                      <UserAvatar name={resolveMemberName(person)} avatarUrl={person.avatar_url || undefined} size={40} />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Link href={`/network/${person.id}`} style={{ fontWeight: 700, color: '#000000', textDecoration: 'none' }}>
                            {resolveMemberName(person)}
                          </Link>
                          {person.has_golden_tick && <GoldenTick />}
                        </div>
                        <div style={{ fontSize: '11px', color: '#6B7280' }}>
                          {person.company_name || person.company || 'Enterprise Logistics'}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '12px', color: '#4B5563', marginBottom: '8px' }}>
                      {person.designation || 'Logistics Member'} · {[person.city, person.country].filter(Boolean).join(', ')}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '6px', marginTop: '12px', paddingTop: '10px', borderTop: '1px solid #E5E7EB' }}>
                    <button
                      onClick={() => {
                        setSendConnectTarget(person);
                        setSendConnectNote('');
                      }}
                      style={{
                        flex: 1,
                        padding: '6px',
                        borderRadius: '4px',
                        background: '#000000',
                        color: '#FFFFFF',
                        border: '1px solid #000000',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      Connect
                    </button>
                    <Link
                      href={`/network/${person.id}`}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        background: '#FFFFFF',
                        color: '#111827',
                        border: '1px solid #E5E7EB',
                        fontSize: '11.5px',
                        fontWeight: 600,
                        textDecoration: 'none',
                        textAlign: 'center',
                      }}
                    >
                      View
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Load More Button */}
          {hasMoreDiscover && (
            <div style={{ textAlign: 'center', marginTop: '12px' }}>
              <button
                onClick={() => fetchDiscover(discoverFilters, discoverCursor || undefined)}
                disabled={loadingDiscover}
                style={{
                  padding: '8px 20px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#000000',
                  border: '1px solid #E5E7EB',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {loadingDiscover ? 'Loading…' : 'Load More Members'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 3: MY CONNECTIONS ─────────────────────────────────────────────── */}
      {activeTab === 'connections' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '14px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
            }}
          >
            <div style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
              <Search
                size={15}
                style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
              />
              <input
                type="text"
                placeholder="Search connected partners…"
                value={connectionSearch}
                onChange={(e) => setConnectionSearch(e.target.value)}
                style={{
                  width: '100%',
                  height: '36px',
                  paddingLeft: '32px',
                  paddingRight: '12px',
                  fontSize: '12.5px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#000000',
                  outline: 'none',
                }}
              />
            </div>

            <div style={{ fontSize: '12px', color: '#6B7280' }}>
              {filteredConnections.length} accepted connections
            </div>
          </div>

          {loadingConnections && connections.length === 0 ? (
            <SkeletonScreen type="table" count={6} label="Loading connections…" />
          ) : filteredConnections.length === 0 ? (
            <EmptyState
              title="No Connections Found"
              description={connectionSearch ? "No connections match your filter." : "You haven't established connections yet. Discover peers in the directory to build your freight network."}
              actionLabel="Discover Logistics Members"
              onAction={() => switchTab('discover')}
            />
          ) : (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', background: '#FFFFFF' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Partner</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Company &amp; Designation</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Location</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredConnections.map((item) => {
                    const prof = item.profiles;
                    const name = resolveMemberName(prof);
                    return (
                      <tr key={item.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <UserAvatar name={name} avatarUrl={prof.avatar_url || undefined} size={32} />
                            <div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <Link href={`/network/${prof.id}`} style={{ fontWeight: 700, color: '#000000', textDecoration: 'none' }}>
                                  {name}
                                </Link>
                                {prof.has_golden_tick && <GoldenTick />}
                              </div>
                              <div style={{ fontSize: '11px', color: '#16A34A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }} />
                                Connected
                              </div>
                            </div>
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, color: '#111827' }}>
                            {prof.company_name || prof.company || 'Enterprise Logistics'}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6B7280' }}>
                            {prof.designation || 'Freight Procurement'}
                          </div>
                        </td>

                        <td style={{ padding: '10px 14px', color: '#4B5563' }}>
                          {[prof.city, prof.country].filter(Boolean).join(', ') || 'Global'}
                        </td>

                        <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '8px' }}>
                            <button
                              onClick={() => {
                                const syntheticContact: ContactRecord = {
                                  id: prof.id,
                                  owner_id: user?.uid || '',
                                  contact_profile_id: prof.id,
                                  name,
                                  company: prof.company_name || prof.company || '',
                                  category: 'Freight Forwarder',
                                  stage: 'Active Partner',
                                  status: 'online',
                                  is_favorite: false,
                                  tags: [],
                                  created_at: new Date().toISOString(),
                                  updated_at: new Date().toISOString(),
                                };
                                openChatDrawer(syntheticContact);
                              }}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '4px',
                                background: '#F3F4F6',
                                color: '#111827',
                                border: '1px solid #E5E7EB',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <MessageSquare size={13} />
                              <span>Message</span>
                            </button>

                            <Link
                              href={`/network/${prof.id}`}
                              style={{
                                padding: '5px 10px',
                                borderRadius: '4px',
                                background: '#FFFFFF',
                                color: '#111827',
                                border: '1px solid #E5E7EB',
                                fontSize: '11.5px',
                                fontWeight: 600,
                                textDecoration: 'none',
                              }}
                            >
                              Profile
                            </Link>

                            <button
                              onClick={() => {
                                if (confirm(`Remove connection with ${name}?`)) {
                                  handleConnectionAction('remove', undefined, prof.id);
                                }
                              }}
                              style={{
                                padding: '5px 8px',
                                borderRadius: '4px',
                                background: 'none',
                                color: '#DC2626',
                                border: '1px solid #FECACA',
                                fontSize: '11.5px',
                                cursor: 'pointer',
                              }}
                              title="Remove connection"
                            >
                              <X size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── TAB 4: CONNECTION REQUESTS ────────────────────────────────────────── */}
      {activeTab === 'requests' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sub-Filter Tabs */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              padding: '6px',
              borderRadius: '8px',
              background: '#F9FAFB',
              border: '1px solid #E5E7EB',
              width: 'fit-content',
            }}
          >
            <button
              onClick={() => setRequestFilter('incoming')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: requestFilter === 'incoming' ? 700 : 500,
                background: requestFilter === 'incoming' ? '#000000' : 'transparent',
                color: requestFilter === 'incoming' ? '#FFFFFF' : '#4B5563',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>Received Requests</span>
              <span
                style={{
                  fontSize: '10.5px',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  background: requestFilter === 'incoming' ? '#374151' : '#E5E7EB',
                  color: requestFilter === 'incoming' ? '#FFFFFF' : '#111827',
                }}
              >
                {incomingCount}
              </span>
            </button>

            <button
              onClick={() => setRequestFilter('outgoing')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: requestFilter === 'outgoing' ? 700 : 500,
                background: requestFilter === 'outgoing' ? '#000000' : 'transparent',
                color: requestFilter === 'outgoing' ? '#FFFFFF' : '#4B5563',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>Sent Invitations</span>
              <span
                style={{
                  fontSize: '10.5px',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  background: requestFilter === 'outgoing' ? '#374151' : '#E5E7EB',
                  color: requestFilter === 'outgoing' ? '#FFFFFF' : '#111827',
                }}
              >
                {outgoingCount}
              </span>
            </button>

            <button
              onClick={() => setRequestFilter('held')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: requestFilter === 'held' ? 700 : 500,
                background: requestFilter === 'held' ? '#000000' : 'transparent',
                color: requestFilter === 'held' ? '#FFFFFF' : '#4B5563',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <span>Held for Review</span>
              <span
                style={{
                  fontSize: '10.5px',
                  padding: '1px 5px',
                  borderRadius: '10px',
                  background: requestFilter === 'held' ? '#374151' : '#E5E7EB',
                  color: requestFilter === 'held' ? '#FFFFFF' : '#111827',
                }}
              >
                {heldCount}
              </span>
            </button>
          </div>

          {/* Sub-Filter Content */}
          {requestFilter === 'incoming' && (
            <div>
              {incomingRequests.length === 0 ? (
                <EmptyState
                  title="No Pending Received Requests"
                  description="Your incoming requests inbox is clear. Connect with peers from the directory."
                  actionLabel="Discover Logistics Partners"
                  onAction={() => switchTab('discover')}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {incomingRequests.map((req) => {
                    const prof = req.profiles;
                    const name = resolveMemberName(prof);
                    const isBusy = requestActionBusyId === req.id;
                    return (
                      <div
                        key={req.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '14px',
                          padding: '16px',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <UserAvatar name={name} avatarUrl={prof.avatar_url || undefined} size={42} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Link href={`/network/${prof.id}`} style={{ fontWeight: 700, color: '#000000', textDecoration: 'none' }}>
                                {name}
                              </Link>
                              {prof.has_golden_tick && <GoldenTick />}
                            </div>
                            <div style={{ fontSize: '12px', color: '#4B5563' }}>
                              {prof.company_name || prof.company} · {prof.designation || 'Logistics Member'}
                            </div>
                            {req.message && (
                              <div style={{ marginTop: '4px', fontSize: '11.5px', color: '#111827', background: '#F9FAFB', padding: '4px 8px', borderRadius: '4px', border: '1px solid #E5E7EB' }}>
                                &ldquo;{req.message}&rdquo;
                              </div>
                            )}
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleConnectionAction('accept', req.id)}
                            disabled={isBusy}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              background: '#000000',
                              color: '#FFFFFF',
                              border: '1px solid #000000',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleConnectionAction('hold', req.id)}
                            disabled={isBusy}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: '#FFFFFF',
                              color: '#4B5563',
                              border: '1px solid #E5E7EB',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Hold
                          </button>
                          <button
                            onClick={() => handleConnectionAction('decline', req.id)}
                            disabled={isBusy}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: '#FFFFFF',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {requestFilter === 'outgoing' && (
            <div>
              {outgoingRequests.length === 0 ? (
                <EmptyState
                  title="No Outgoing Invitations"
                  description="You have no pending outgoing connection requests. Expand your network by connecting with shippers and freight forwarders."
                  actionLabel="Search Directory"
                  onAction={() => switchTab('discover')}
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {outgoingRequests.map((req) => {
                    const prof = req.profiles;
                    const name = resolveMemberName(prof);
                    const isBusy = requestActionBusyId === req.id;
                    return (
                      <div
                        key={req.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '14px',
                          padding: '16px',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <UserAvatar name={name} avatarUrl={prof.avatar_url || undefined} size={42} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                              <Link href={`/network/${prof.id}`} style={{ fontWeight: 700, color: '#000000', textDecoration: 'none' }}>
                                {name}
                              </Link>
                              {prof.has_golden_tick && <GoldenTick />}
                            </div>
                            <div style={{ fontSize: '12px', color: '#4B5563' }}>
                              {prof.company_name || prof.company} · {prof.designation || 'Logistics Member'}
                            </div>
                            <div style={{ fontSize: '11px', color: '#9CA3AF', marginTop: '2px' }}>
                              Sent invitation · Awaiting response
                            </div>
                          </div>
                        </div>

                        <div>
                          <button
                            onClick={() => handleConnectionAction('withdraw', req.id)}
                            disabled={isBusy}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              background: '#FFFFFF',
                              color: '#4B5563',
                              border: '1px solid #E5E7EB',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Withdraw Request
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {requestFilter === 'held' && (
            <div>
              {heldRequests.length === 0 ? (
                <EmptyState
                  title="No Held Requests"
                  description="You have no requests currently placed on hold for review."
                />
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {heldRequests.map((req) => {
                    const prof = req.profiles;
                    const name = resolveMemberName(prof);
                    const isBusy = requestActionBusyId === req.id;
                    return (
                      <div
                        key={req.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '14px',
                          padding: '16px',
                          borderRadius: '8px',
                          background: '#FFFFFF',
                          border: '1px solid #E5E7EB',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <UserAvatar name={name} avatarUrl={prof.avatar_url || undefined} size={42} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#000000' }}>{name}</div>
                            <div style={{ fontSize: '12px', color: '#4B5563' }}>{prof.company_name || prof.company}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <button
                            onClick={() => handleConnectionAction('accept', req.id)}
                            disabled={isBusy}
                            style={{
                              padding: '6px 14px',
                              borderRadius: '6px',
                              background: '#000000',
                              color: '#FFFFFF',
                              border: '1px solid #000000',
                              fontSize: '12px',
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleConnectionAction('unhold', req.id)}
                            disabled={isBusy}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '6px',
                              background: '#FFFFFF',
                              color: '#4B5563',
                              border: '1px solid #E5E7EB',
                              fontSize: '12px',
                              fontWeight: 600,
                              cursor: 'pointer',
                            }}
                          >
                            Unhold
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 5: CONTACTS & CRM ──────────────────────────────────────────────── */}
      {activeTab === 'crm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* CRM Controls Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
              padding: '14px',
              borderRadius: '8px',
              background: '#FFFFFF',
              border: '1px solid #E5E7EB',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: 1, minWidth: '300px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '340px' }}>
                <Search
                  size={15}
                  style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#9CA3AF' }}
                />
                <input
                  type="text"
                  placeholder="Search CRM by partner, company, tag…"
                  value={crmSearch}
                  onChange={(e) => setCrmSearch(e.target.value)}
                  style={{
                    width: '100%',
                    height: '36px',
                    paddingLeft: '32px',
                    paddingRight: '12px',
                    fontSize: '12.5px',
                    border: '1px solid #E5E7EB',
                    borderRadius: '6px',
                    background: '#FFFFFF',
                    color: '#000000',
                    outline: 'none',
                  }}
                />
              </div>

              <select
                value={stageFilter}
                onChange={(e) => setStageFilter(e.target.value as StageFilter)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#111827',
                  outline: 'none',
                }}
              >
                <option value="all">All Stages</option>
                <option value="Active Partner">Active Partner</option>
                <option value="Rate Quoted">Rate Quoted</option>
                <option value="VIP / Key Account">VIP / Key Account</option>
                <option value="Prospect / Lead">Prospect / Lead</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value as CategoryFilter)}
                style={{
                  height: '36px',
                  padding: '0 10px',
                  fontSize: '12px',
                  border: '1px solid #E5E7EB',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#111827',
                  outline: 'none',
                }}
              >
                <option value="all">All Categories</option>
                <option value="Freight Forwarder">Freight Forwarder</option>
                <option value="Shipping Line / Carrier">Carrier</option>
                <option value="Customs Broker">Customs Broker</option>
                <option value="Shipper (BCO)">Shipper (BCO)</option>
                <option value="Transporter / Fleet">Transporter</option>
              </select>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <button
                onClick={() => {
                  setCrmFormData({
                    name: '',
                    company: '',
                    designation: '',
                    email: '',
                    phone: '',
                    category: 'Freight Forwarder',
                    stage: 'Active Partner',
                    status: 'online',
                    location: '',
                    tags: '',
                    notes: '',
                    is_favorite: false,
                    contact_profile_id: null,
                  });
                  setShowAddContactModal(true);
                }}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  background: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid #000000',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={14} />
                <span>Add Contact</span>
              </button>
            </div>
          </div>

          {/* CRM Table */}
          {loadingCrm && crmContacts.length === 0 ? (
            <SkeletonScreen type="table" count={8} label="Loading CRM database…" />
          ) : filteredCrm.length === 0 ? (
            <EmptyState
              title="No CRM Contacts Found"
              description="No contacts match your current filters. Add new partners or import from directory."
              actionLabel="Add New Contact"
              onAction={() => setShowAddContactModal(true)}
            />
          ) : (
            <div style={{ border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', background: '#FFFFFF' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12.5px', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F9FAFB', borderBottom: '1px solid #E5E7EB' }}>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Contact</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Category</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Pipeline Stage</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase' }}>Location &amp; Notes</th>
                    <th style={{ padding: '10px 14px', fontSize: '11px', fontWeight: 700, color: '#4B5563', textTransform: 'uppercase', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCrm.map((contact) => (
                    <tr key={contact.id} style={{ borderBottom: '1px solid #E5E7EB' }}>
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <UserAvatar name={contact.name} size={32} />
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                              <span style={{ fontWeight: 700, color: '#000000' }}>{contact.name}</span>
                              {contact.is_favorite && <Star size={12} style={{ fill: '#F59E0B', color: '#F59E0B' }} />}
                            </div>
                            <div style={{ fontSize: '11px', color: '#6B7280' }}>
                              {contact.company} · {contact.designation || 'Specialist'}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 600,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#F3F4F6',
                            color: '#111827',
                            border: '1px solid #E5E7EB',
                          }}
                        >
                          {contact.category}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px' }}>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background: '#000000',
                            color: '#FFFFFF',
                          }}
                        >
                          {contact.stage}
                        </span>
                      </td>

                      <td style={{ padding: '10px 14px', color: '#4B5563', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {contact.notes || contact.location || '—'}
                      </td>

                      <td style={{ padding: '10px 14px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
                          <button
                            onClick={() => openChatDrawer(contact)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              background: '#F3F4F6',
                              color: '#111827',
                              border: '1px solid #E5E7EB',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                            }}
                            title="Direct Message"
                          >
                            <MessageSquare size={13} />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedContact(contact);
                              setCrmFormData({
                                name: contact.name,
                                company: contact.company || '',
                                designation: contact.designation || '',
                                email: contact.email || '',
                                phone: contact.phone || '',
                                category: contact.category,
                                stage: contact.stage,
                                status: contact.status || 'online',
                                location: contact.location || '',
                                tags: (contact.tags || []).join(', '),
                                notes: contact.notes || '',
                                is_favorite: Boolean(contact.is_favorite),
                                contact_profile_id: contact.contact_profile_id || null,
                              });
                              setShowEditContactModal(true);
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              background: '#FFFFFF',
                              color: '#4B5563',
                              border: '1px solid #E5E7EB',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                            }}
                            title="Edit CRM Contact"
                          >
                            <Edit3 size={13} />
                          </button>

                          <button
                            onClick={() => {
                              setSelectedContact(contact);
                              setShowDeleteContactModal(true);
                            }}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '4px',
                              background: '#FFFFFF',
                              color: '#DC2626',
                              border: '1px solid #FECACA',
                              fontSize: '11.5px',
                              cursor: 'pointer',
                            }}
                            title="Delete Contact"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── MODAL: SEND CONNECT WITH NOTE ───────────────────────────────────────── */}
      {sendConnectTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#000000' }}>
                Connect with {resolveMemberName(sendConnectTarget)}
              </h3>
              <button onClick={() => setSendConnectTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>
            <p style={{ fontSize: '12px', color: '#6B7280', margin: '0 0 12px' }}>
              Add a personalized note to introduce your company or specify trade lane opportunities (optional).
            </p>
            <textarea
              rows={3}
              placeholder="e.g. Hi Deepak, looking to collaborate on Nhava Sheva to Jebel Ali FCL shipments."
              value={sendConnectNote}
              onChange={(e) => setSendConnectNote(e.target.value)}
              style={{
                width: '100%',
                padding: '10px',
                fontSize: '12.5px',
                borderRadius: '6px',
                border: '1px solid #E5E7EB',
                outline: 'none',
                marginBottom: '16px',
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setSendConnectTarget(null)}
                style={{
                  padding: '7px 14px',
                  borderRadius: '6px',
                  background: '#FFFFFF',
                  color: '#4B5563',
                  border: '1px solid #E5E7EB',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSendConnect}
                disabled={sendingConnect}
                style={{
                  padding: '7px 16px',
                  borderRadius: '6px',
                  background: '#000000',
                  color: '#FFFFFF',
                  border: '1px solid #000000',
                  fontSize: '12px',
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                {sendingConnect ? 'Sending…' : 'Send Invitation'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DRAWER: QUICK CHAT ─────────────────────────────────────────────────── */}
      {activeChatContact && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1100,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              height: '100%',
              background: '#FFFFFF',
              display: 'flex',
              flexDirection: 'column',
              boxShadow: '-4px 0 20px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Header */}
            <div
              style={{
                padding: '16px',
                borderBottom: '1px solid #E5E7EB',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserAvatar name={activeChatContact.name} size={36} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px', color: '#000000' }}>{activeChatContact.name}</div>
                  <div style={{ fontSize: '11px', color: '#6B7280' }}>{activeChatContact.company}</div>
                </div>
              </div>
              <button onClick={() => setActiveChatContact(null)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>

            {/* Messages Stream */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {chatLoading ? (
                <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '12px', margin: 'auto' }}>
                  Loading conversation history…
                </div>
              ) : chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#6B7280', fontSize: '12px', margin: 'auto' }}>
                  No previous messages. Start a conversation with {activeChatContact.name}.
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = msg.sender_id === user?.uid;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        padding: '9px 12px',
                        borderRadius: '8px',
                        background: isMine ? '#000000' : '#F3F4F6',
                        color: isMine ? '#FFFFFF' : '#111827',
                        fontSize: '12.5px',
                      }}
                    >
                      <div>{msg.content}</div>
                      <div style={{ fontSize: '9.5px', color: isMine ? '#9CA3AF' : '#6B7280', marginTop: '4px', textAlign: 'right' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatBottomRef} />
            </div>

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} style={{ padding: '12px', borderTop: '1px solid #E5E7EB', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Type a message…"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                style={{
                  flex: 1,
                  height: '36px',
                  padding: '0 12px',
                  fontSize: '12.5px',
                  borderRadius: '6px',
                  border: '1px solid #E5E7EB',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={chatSending || !chatInputText.trim()}
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '6px',
                  background: '#000000',
                  color: '#FFFFFF',
                  border: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: ADD CONTACT MODAL ───────────────────────────────────────────── */}
      {showAddContactModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#000000' }}>Add CRM Contact</h3>
              <button onClick={() => setShowAddContactModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Patel"
                  value={crmFormData.name}
                  onChange={(e) => setCrmFormData((prev) => ({ ...prev, name: e.target.value }))}
                  style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #E5E7EB', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Company *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Global Logistics"
                    value={crmFormData.company}
                    onChange={(e) => setCrmFormData((prev) => ({ ...prev, company: e.target.value }))}
                    style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #E5E7EB', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. Managing Director"
                    value={crmFormData.designation}
                    onChange={(e) => setCrmFormData((prev) => ({ ...prev, designation: e.target.value }))}
                    style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '12.5px', borderRadius: '6px', border: '1px solid #E5E7EB', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select
                    value={crmFormData.category}
                    onChange={(e) => setCrmFormData((prev) => ({ ...prev, category: e.target.value as any }))}
                    style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #E5E7EB', outline: 'none' }}
                  >
                    <option value="Freight Forwarder">Freight Forwarder</option>
                    <option value="Shipping Line / Carrier">Shipping Line / Carrier</option>
                    <option value="Customs Broker">Customs Broker</option>
                    <option value="Shipper (BCO)">Shipper (BCO)</option>
                    <option value="Transporter / Fleet">Transporter / Fleet</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Pipeline Stage</label>
                  <select
                    value={crmFormData.stage}
                    onChange={(e) => setCrmFormData((prev) => ({ ...prev, stage: e.target.value as any }))}
                    style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #E5E7EB', outline: 'none' }}
                  >
                    <option value="Active Partner">Active Partner</option>
                    <option value="Rate Quoted">Rate Quoted</option>
                    <option value="VIP / Key Account">VIP / Key Account</option>
                    <option value="Prospect / Lead">Prospect / Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Notes, key trade lanes, rates discussion…"
                  value={crmFormData.notes}
                  onChange={(e) => setCrmFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #E5E7EB', outline: 'none' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setShowAddContactModal(false)}
                style={{ padding: '7px 14px', borderRadius: '6px', background: '#FFFFFF', color: '#4B5563', border: '1px solid #E5E7EB', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (!crmFormData.name.trim() || !crmFormData.company.trim()) {
                    toast('Name and Company are required.');
                    return;
                  }
                  try {
                    const res = await fetch('/api/contacts', {
                      method: 'POST',
                      headers: getClientAuthHeaders(user?.uid),
                      credentials: 'include',
                      body: JSON.stringify(crmFormData),
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast('Contact successfully saved.');
                      setShowAddContactModal(false);
                      fetchCrmContacts();
                    } else {
                      toast(data.error || 'Failed to save contact.');
                    }
                  } catch (err: any) {
                    toast(err.message);
                  }
                }}
                style={{ padding: '7px 16px', borderRadius: '6px', background: '#000000', color: '#FFFFFF', border: '1px solid #000000', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: EDIT CONTACT MODAL ──────────────────────────────────────────── */}
      {showEditContactModal && selectedContact && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '520px',
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              padding: '20px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#000000' }}>Edit {selectedContact.name}</h3>
              <button onClick={() => setShowEditContactModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                <X size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Category</label>
                  <select
                    value={crmFormData.category}
                    onChange={(e) => setCrmFormData((prev) => ({ ...prev, category: e.target.value as any }))}
                    style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #E5E7EB', outline: 'none' }}
                  >
                    <option value="Freight Forwarder">Freight Forwarder</option>
                    <option value="Shipping Line / Carrier">Shipping Line / Carrier</option>
                    <option value="Customs Broker">Customs Broker</option>
                    <option value="Shipper (BCO)">Shipper (BCO)</option>
                    <option value="Transporter / Fleet">Transporter / Fleet</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Pipeline Stage</label>
                  <select
                    value={crmFormData.stage}
                    onChange={(e) => setCrmFormData((prev) => ({ ...prev, stage: e.target.value as any }))}
                    style={{ width: '100%', height: '36px', padding: '0 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #E5E7EB', outline: 'none' }}
                  >
                    <option value="Active Partner">Active Partner</option>
                    <option value="Rate Quoted">Rate Quoted</option>
                    <option value="VIP / Key Account">VIP / Key Account</option>
                    <option value="Prospect / Lead">Prospect / Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 600, color: '#4B5563', display: 'block', marginBottom: '4px' }}>Notes</label>
                <textarea
                  rows={3}
                  value={crmFormData.notes}
                  onChange={(e) => setCrmFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '12px', borderRadius: '6px', border: '1px solid #E5E7EB', outline: 'none' }}
                />
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={crmFormData.is_favorite}
                  onChange={(e) => setCrmFormData((prev) => ({ ...prev, is_favorite: e.target.checked }))}
                />
                <span>Star as Favorite Partner</span>
              </label>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '16px' }}>
              <button
                onClick={() => setShowEditContactModal(false)}
                style={{ padding: '7px 14px', borderRadius: '6px', background: '#FFFFFF', color: '#4B5563', border: '1px solid #E5E7EB', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/contacts?id=${encodeURIComponent(selectedContact.id)}`, {
                      method: 'PUT',
                      headers: getClientAuthHeaders(user?.uid),
                      credentials: 'include',
                      body: JSON.stringify(crmFormData),
                    });
                    const data = await res.json();
                    if (data.success) {
                      toast('Contact updated.');
                      setShowEditContactModal(false);
                      fetchCrmContacts();
                    } else {
                      toast(data.error || 'Failed to update contact.');
                    }
                  } catch (err: any) {
                    toast(err.message);
                  }
                }}
                style={{ padding: '7px 16px', borderRadius: '6px', background: '#000000', color: '#FFFFFF', border: '1px solid #000000', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Update Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: DELETE CONTACT MODAL ────────────────────────────────────────── */}
      {showDeleteContactModal && selectedContact && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.45)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '20px',
          }}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '420px',
              background: '#FFFFFF',
              borderRadius: '8px',
              border: '1px solid #E5E7EB',
              padding: '20px',
            }}
          >
            <h3 style={{ fontSize: '16px', fontWeight: 700, margin: '0 0 10px', color: '#000000' }}>Delete Contact</h3>
            <p style={{ fontSize: '12.5px', color: '#4B5563', margin: '0 0 14px' }}>
              Are you sure you want to remove <strong>{selectedContact.name}</strong> from your CRM?
            </p>

            {selectedContact.contact_profile_id && (
              <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#111827', marginBottom: '16px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={deleteAlsoConnection}
                  onChange={(e) => setDeleteAlsoConnection(e.target.checked)}
                />
                <span>Also remove peer connection from network</span>
              </label>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
              <button
                onClick={() => setShowDeleteContactModal(false)}
                style={{ padding: '7px 14px', borderRadius: '6px', background: '#FFFFFF', color: '#4B5563', border: '1px solid #E5E7EB', fontSize: '12px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/contacts?id=${encodeURIComponent(selectedContact.id)}`, {
                      method: 'DELETE',
                      headers: getClientAuthHeaders(user?.uid),
                      credentials: 'include',
                    });
                    const data = await res.json();
                    if (data.success) {
                      if (deleteAlsoConnection && selectedContact.contact_profile_id) {
                        handleConnectionAction('remove', undefined, selectedContact.contact_profile_id);
                      }
                      toast('Contact removed.');
                      setShowDeleteContactModal(false);
                      fetchCrmContacts();
                    } else {
                      toast(data.error || 'Failed to remove contact.');
                    }
                  } catch (err: any) {
                    toast(err.message);
                  }
                }}
                style={{ padding: '7px 16px', borderRadius: '6px', background: '#DC2626', color: '#FFFFFF', border: '1px solid #DC2626', fontSize: '12px', fontWeight: 700, cursor: 'pointer' }}
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function NetworkPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <SkeletonScreen type="table" count={8} label="Loading Network Workspace…" />
        </div>
      }
    >
      <NetworkPageContent />
    </Suspense>
  );
}
