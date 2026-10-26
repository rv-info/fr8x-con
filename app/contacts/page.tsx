'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import {
  Users,
  Search,
  Plus,
  Phone,
  Mail,
  MessageSquare,
  MoreVertical,
  CheckCircle2,
  Clock,
  Building2,
  MapPin,
  Tag,
  Star,
  Trash2,
  Edit3,
  Send,
  X,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  LayoutGrid,
  Table as TableIcon,
  RefreshCw,
  Sparkles,
  Zap,
  Globe2,
  Smartphone,
  Check,
  UserCheck,
  ArrowUpRight,
  UserPlus,
  Inbox,
  PauseCircle,
  RotateCcw,
  XCircle,
  SlidersHorizontal,
  ChevronRight,
  Filter,
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { ContactRecord } from '@/lib/db/contacts';
import { getClientAuthHeaders, CONNECTIONS_CHANGED_EVENT, dispatchConnectionsChanged } from '@/lib/connections';
import { SkeletonScreen } from '@/components/ui/SkeletonScreen';
import { EmptyState } from '@/components/ui/EmptyState';

type MainContactTab = 'all' | 'discover' | 'incoming' | 'outgoing' | 'held';
type ViewMode = 'grid' | 'table';
type PresenceFilter = 'all' | 'live' | 'away' | 'busy' | 'offline';
type CategoryFilter = 'all' | 'Freight Forwarder' | 'Shipping Line / Carrier' | 'Customs Broker' | 'Shipper (BCO)' | 'Transporter / Fleet';
type StageFilter = 'all' | 'Active Partner' | 'Rate Quoted' | 'VIP / Key Account' | 'Prospect / Lead';

interface ChatMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

interface ProfileSnippet {
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
  state?: string | null;
  country?: string | null;
  avatar_url?: string | null;
  is_verified?: boolean | null;
  has_golden_tick?: boolean | null;
  skills?: string[];
  specializations?: string[];
  key_trade_lanes?: string[];
  connection_status?: string;
  request_id?: string;
}

interface RequestItem {
  id: string;
  message: string | null;
  created_at: string;
  updated_at?: string;
  status: string;
  requester_id?: string;
  recipient_id?: string;
  profiles: ProfileSnippet;
}

function resolveMemberName(p?: ProfileSnippet | null): string {
  if (!p) return 'FR8X Member';
  if (p.full_name?.trim()) return p.full_name.trim();
  if (p.display_name?.trim()) return p.display_name.trim();
  const combined = `${p.first_name || ''} ${p.last_name || ''}`.trim();
  return combined || 'FR8X Member';
}

function resolveMemberSubline(p?: ProfileSnippet | null): string {
  if (!p) return '';
  if (p.headline?.trim()) return p.headline.trim();
  const parts: string[] = [];
  if (p.designation || p.position) parts.push((p.designation || p.position)!);
  const comp = p.company_name || p.company;
  if (comp) parts.push(comp);
  return parts.join(' · ');
}

function resolveMemberLocation(p?: ProfileSnippet | null): string {
  if (!p) return '';
  if (p.location?.trim()) return p.location.trim();
  return [p.city, p.state, p.country].filter(Boolean).join(', ');
}

export default function ContactsCrmPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // Active Main Navigation Tab
  const [activeMainTab, setActiveMainTab] = useState<MainContactTab>('all');

  // Contact CRM State
  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Network Requests State
  const [incomingRequests, setIncomingRequests] = useState<RequestItem[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<RequestItem[]>([]);
  const [heldRequests, setHeldRequests] = useState<RequestItem[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  const [requestBusyId, setRequestBusyId] = useState<string | null>(null);

  // Active filtered requests (excludes accepted, cancelled, withdrawn, or already in CRM)
  const activeIncomingRequests = useMemo(() => {
    return incomingRequests.filter((req) => {
      if (!req || req.status === 'accepted' || req.status === 'cancelled' || req.status === 'withdrawn' || req.status === 'declined') return false;
      const fromId = (req.profiles?.id || req.requester_id || '').toLowerCase();
      if (fromId && contacts.some((c) => (c.id || '').toLowerCase() === fromId || (c.email && req.profiles?.email && c.email.toLowerCase() === req.profiles.email.toLowerCase()))) {
        return false;
      }
      return true;
    });
  }, [incomingRequests, contacts]);

  const activeOutgoingRequests = useMemo(() => {
    return outgoingRequests.filter((req) => {
      if (!req || req.status === 'accepted' || req.status === 'cancelled' || req.status === 'withdrawn') return false;
      const recId = (req.profiles?.id || req.recipient_id || '').toLowerCase();
      if (recId && contacts.some((c) => (c.id || '').toLowerCase() === recId || (c.email && req.profiles?.email && c.email.toLowerCase() === req.profiles.email.toLowerCase()))) {
        return false;
      }
      return true;
    });
  }, [outgoingRequests, contacts]);

  // Network Discovery State
  const [directoryMembers, setDirectoryMembers] = useState<ProfileSnippet[]>([]);
  const [discoverSearch, setDiscoverSearch] = useState('');
  const [discoverRole, setDiscoverRole] = useState('all');
  const [loadingDiscover, setLoadingDiscover] = useState(false);

  // Send Connection Modal State
  const [sendConnectTarget, setSendConnectTarget] = useState<ProfileSnippet | null>(null);
  const [sendConnectNote, setSendConnectNote] = useState('');
  const [sendingConnect, setSendingConnect] = useState(false);

  // Filters & View State for CRM Contacts
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>('all');
  const [presenceFilter, setPresenceFilter] = useState<PresenceFilter>('all');
  const [stageFilter, setStageFilter] = useState<StageFilter>('all');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // User's Own Presence State
  const [myPresence, setMyPresence] = useState<'live' | 'away' | 'busy' | 'offline'>('live');
  const [updatingPresence, setUpdatingPresence] = useState(false);

  // Modals & Drawer State
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactRecord | null>(null);
  const [deleteWithConnection, setDeleteWithConnection] = useState(true);

  // Chat Drawer State
  const [activeChatContact, setActiveChatContact] = useState<ContactRecord | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const chatMessagesEndRef = useRef<HTMLDivElement | null>(null);

  // Add / Edit Form State
  const [addMode, setAddMode] = useState<'directory' | 'manual'>('directory');
  const [directorySearch, setDirectorySearch] = useState('');
  const [directoryResults, setDirectoryResults] = useState<any[]>([]);
  const [searchingDirectory, setSearchingDirectory] = useState(false);

  const [formData, setFormData] = useState({
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

  // Check URL query parameters for initial tab
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as MainContactTab | null;
      if (tabParam && ['all', 'discover', 'incoming', 'outgoing', 'held'].includes(tabParam)) {
        setActiveMainTab(tabParam);
      }
    }
  }, []);

  // ── Fetch Unified Contacts ──────────────────────────────────────────────────
  const fetchContacts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoadingContacts(true);

    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/contacts', { headers: authHeaders, credentials: 'include' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setContacts(json.data);
      }
    } catch {
      toast('Failed to load contacts.');
    } finally {
      setLoadingContacts(false);
      setRefreshing(false);
    }
  }, [toast, user?.uid]);

  // ── Fetch Network Requests (Incoming, Outgoing, Held) ──────────────────────
  const fetchNetworkRequests = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const [inRes, outRes, heldRes] = await Promise.all([
        fetch('/api/people/connections?tab=incoming', { headers: authHeaders, credentials: 'include' }),
        fetch('/api/people/connections?tab=outgoing', { headers: authHeaders, credentials: 'include' }),
        fetch('/api/people/connections?tab=held', { headers: authHeaders, credentials: 'include' }),
      ]);

      const [inJson, outJson, heldJson] = await Promise.all([
        inRes.json(),
        outRes.json(),
        heldRes.json(),
      ]);

      if (inJson.success && Array.isArray(inJson.data)) {
        const pendingIncoming = inJson.data.filter((r: any) => {
          if (!r || r.status === 'accepted' || r.status === 'cancelled' || r.status === 'withdrawn') return false;
          return true;
        });
        setIncomingRequests(pendingIncoming);
      }
      if (outJson.success && Array.isArray(outJson.data)) {
        const pendingOutgoing = outJson.data.filter((r: any) => {
          if (!r || r.status === 'accepted' || r.status === 'cancelled' || r.status === 'withdrawn') return false;
          return true;
        });
        setOutgoingRequests(pendingOutgoing);
      }
      if (heldJson.success && Array.isArray(heldJson.data)) {
        setHeldRequests(heldJson.data);
      }
    } catch {
      // silently ignore
    } finally {
      setLoadingRequests(false);
    }
  }, [user?.uid]);

  // ── Fetch Discovery Members ────────────────────────────────────────────────
  const fetchDiscoveryMembers = useCallback(async (query = '', role = 'all') => {
    setLoadingDiscover(true);
    try {
      let url = `/api/people/search?limit=30`;
      if (query.trim()) url += `&q=${encodeURIComponent(query.trim())}`;
      if (role !== 'all') url += `&skills=${encodeURIComponent(role)}`;

      const res = await fetch(url, { credentials: 'include' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setDirectoryMembers(json.data);
      }
    } catch {
      // error handling
    } finally {
      setLoadingDiscover(false);
    }
  }, []);

  // Initial Data Loads
  useEffect(() => {
    fetchContacts();
    fetchNetworkRequests();
  }, [fetchContacts, fetchNetworkRequests]);

  // Real-time synchronization: listen for connection events across tabs & components
  useEffect(() => {
    const handleSync = () => {
      fetchNetworkRequests();
      fetchContacts(true);
    };

    window.addEventListener(CONNECTIONS_CHANGED_EVENT, handleSync);
    window.addEventListener('fr8x_refresh_notifications', handleSync);
    window.addEventListener('focus', handleSync);

    return () => {
      window.removeEventListener(CONNECTIONS_CHANGED_EVENT, handleSync);
      window.removeEventListener('fr8x_refresh_notifications', handleSync);
      window.removeEventListener('focus', handleSync);
    };
  }, [fetchNetworkRequests, fetchContacts]);

  // Load discovery members when tab changes or search filters change
  useEffect(() => {
    if (activeMainTab === 'discover') {
      const timer = setTimeout(() => {
        fetchDiscoveryMembers(discoverSearch, discoverRole);
      }, 250);
      return () => clearTimeout(timer);
    }
  }, [activeMainTab, discoverSearch, discoverRole, fetchDiscoveryMembers]);

  // ── Handle Own Presence Status Toggle ──────────────────────────────────────
  const handleUpdateMyPresence = async (status: 'live' | 'away' | 'busy' | 'offline') => {
    if (!user?.uid || updatingPresence) return;
    setUpdatingPresence(true);
    setMyPresence(status);

    try {
      const res = await fetch('/api/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId: user.uid,
          online: status !== 'offline',
          status,
          lastSeen: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast(`Status updated to ${status.toUpperCase()}`);
      }
    } catch {
      toast('Presence update failed');
    } finally {
      setUpdatingPresence(false);
    }
  };

  // ── Connection Actions: Accept, Hold, Decline, Withdraw ────────────────────
  const handleAcceptRequest = async (requestId: string, requesterName: string) => {
    setRequestBusyId(requestId);
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({ action: 'accept', request_id: requestId }),
      });
      const json = await res.json();
      if (json.success) {
        toast(`Connected with ${requesterName}! Added to Contacts CRM.`);
        dispatchConnectionsChanged();
        await Promise.all([fetchNetworkRequests(), fetchContacts(true)]);
      } else {
        toast(json.error || 'Failed to accept connection request.');
        await fetchNetworkRequests();
      }
    } catch {
      toast('Network error accepting request.');
      await fetchNetworkRequests();
    } finally {
      setRequestBusyId(null);
    }
  };

  const handleHoldRequest = async (requestId: string, requesterName: string) => {
    setRequestBusyId(requestId);
    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({ action: 'hold', request_id: requestId }),
      });
      const json = await res.json();
      if (json.success) {
        toast(`Request from ${requesterName} kept on hold for review.`);
        dispatchConnectionsChanged();
        await fetchNetworkRequests();
      } else {
        toast(json.error || 'Failed to hold connection request.');
      }
    } catch {
      toast('Network error holding request.');
    } finally {
      setRequestBusyId(null);
    }
  };

  const handleDeclineRequest = async (requestId: string, requesterName: string) => {
    setRequestBusyId(requestId);
    setIncomingRequests((prev) => prev.filter((r) => r.id !== requestId));
    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({ action: 'decline', request_id: requestId }),
      });
      const json = await res.json();
      if (json.success) {
        toast(`Connection request from ${requesterName} declined.`);
        dispatchConnectionsChanged();
        await fetchNetworkRequests();
      } else {
        toast(json.error || 'Failed to decline request.');
        await fetchNetworkRequests();
      }
    } catch {
      toast('Network error declining request.');
      await fetchNetworkRequests();
    } finally {
      setRequestBusyId(null);
    }
  };

  const handleWithdrawRequest = async (requestId: string, targetName: string) => {
    setRequestBusyId(requestId);
    // Optimistic removal so user never experiences UI lag or ghost items
    setOutgoingRequests((prev) => prev.filter((r) => r.id !== requestId));
    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({ action: 'cancel', request_id: requestId }),
      });
      const json = await res.json();
      if (json.success) {
        toast(`Connection request to ${targetName} withdrawn.`);
        dispatchConnectionsChanged();
        await fetchNetworkRequests();
        if (activeMainTab === 'discover') {
          fetchDiscoveryMembers(discoverSearch, discoverRole);
        }
      } else {
        toast(json.error || 'Failed to withdraw request.');
        await fetchNetworkRequests();
      }
    } catch {
      toast('Network error withdrawing request.');
      await fetchNetworkRequests();
    } finally {
      setRequestBusyId(null);
    }
  };

  const handleSendConnectRequest = async () => {
    if (!sendConnectTarget) return;
    setSendingConnect(true);
    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({
          action: 'send',
          target_id: sendConnectTarget.id,
          message: sendConnectNote.trim() || undefined,
        }),
      });
      const json = await res.json();
      if (json.success) {
        toast(`Connection invitation sent to ${resolveMemberName(sendConnectTarget)}!`);
        setSendConnectTarget(null);
        setSendConnectNote('');
        dispatchConnectionsChanged();
        await fetchNetworkRequests();
        fetchDiscoveryMembers(discoverSearch, discoverRole);
      } else {
        toast(json.error || 'Failed to send connection request.');
      }
    } catch {
      toast('Network error sending request.');
    } finally {
      setSendingConnect(false);
    }
  };

  // ── Directory Member Live Search (Add Modal) ──────────────────────────────
  useEffect(() => {
    if (addMode !== 'directory' || !directorySearch.trim()) {
      setDirectoryResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchingDirectory(true);
      try {
        const res = await fetch(`/api/people/search?q=${encodeURIComponent(directorySearch.trim())}`, { credentials: 'include' });
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setDirectoryResults(json.data.slice(0, 6));
        }
      } catch {
        setDirectoryResults([]);
      } finally {
        setSearchingDirectory(false);
      }
    }, 280);

    return () => clearTimeout(timer);
  }, [directorySearch, addMode]);

  // ── Handle Add Contact ─────────────────────────────────────────────────────
  const handleSaveNewContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast('Contact name is required');
      return;
    }

    const payload = {
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };

    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        toast(`Contact "${payload.name}" saved successfully`);
        setShowAddModal(false);
        resetForm();
        fetchContacts(true);
      } else {
        toast(json.error || 'Failed to save contact');
      }
    } catch {
      toast('Network error while saving contact');
    }
  };

  // ── Handle Edit Contact ────────────────────────────────────────────────────
  const handleSaveEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;

    const payload = {
      id: selectedContact.id,
      name: formData.name,
      company: formData.company,
      designation: formData.designation,
      email: formData.email,
      phone: formData.phone,
      category: formData.category,
      stage: formData.stage,
      status: formData.status,
      location: formData.location,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
      notes: formData.notes,
      is_favorite: formData.is_favorite,
    };

    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        toast(`Contact "${payload.name}" updated successfully`);
        setShowEditModal(false);
        fetchContacts(true);
      } else {
        toast(json.error || 'Failed to update contact');
      }
    } catch {
      toast('Network error while updating contact');
    }
  };

  // ── Handle Delete Contact ──────────────────────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!selectedContact) return;

    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const url = `/api/contacts?id=${selectedContact.id}&deleteConnection=${deleteWithConnection ? 'true' : 'false'}`;
      const res = await fetch(url, {
        method: 'DELETE',
        headers: authHeaders,
        credentials: 'include',
      });
      const json = await res.json();

      if (json.success) {
        toast(json.message || 'Contact deleted successfully.');
        setShowDeleteModal(false);
        setSelectedContact(null);
        fetchContacts(true);
        fetchNetworkRequests();
      } else {
        toast(json.error || 'Failed to delete contact');
      }
    } catch {
      toast('Network error deleting contact');
    }
  };

  // ── Handle Toggle Favorite ─────────────────────────────────────────────────
  const handleToggleFavorite = async (contact: ContactRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedFav = !contact.is_favorite;

    // Optimistic UI update
    setContacts((prev) =>
      prev.map((c) => (c.id === contact.id ? { ...c, is_favorite: updatedFav } : c))
    );

    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({ id: contact.id, is_favorite: updatedFav }),
      });
      toast(updatedFav ? `Marked ${contact.name} as favorite` : `Unmarked ${contact.name}`);
    } catch {
      fetchContacts();
    }
  };

  // ── Open Chat Drawer ───────────────────────────────────────────────────────
  const handleOpenChat = async (contact: ContactRecord) => {
    setActiveChatContact(contact);
    setChatLoading(true);
    setChatMessages([]);

    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const res = await fetch(`/api/contacts/chat?contactId=${contact.id}`, { headers: authHeaders, credentials: 'include' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setChatMessages(json.data);
      }
    } catch {
      toast('Failed to load chat history');
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChatContact || !chatInputText.trim() || chatSending) return;

    const text = chatInputText.trim();
    setChatInputText('');
    setChatSending(true);

    // Optimistic message
    const tempId = `temp_${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: tempId,
      sender_id: user?.uid || 'me',
      recipient_id: activeChatContact.contact_profile_id || activeChatContact.id,
      content: text,
      created_at: new Date().toISOString(),
      is_read: false,
    };
    setChatMessages((prev) => [...prev, optimisticMsg]);

    try {
      const authHeaders = getClientAuthHeaders(user?.uid);
      const res = await fetch('/api/contacts/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({
          contactId: activeChatContact.id,
          message: text,
        }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setChatMessages((prev) => prev.map((m) => (m.id === tempId ? json.data : m)));
      }
    } catch {
      toast('Failed to dispatch message');
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const resetForm = () => {
    setFormData({
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
    setDirectorySearch('');
    setDirectoryResults([]);
  };

  const populateEditForm = (c: ContactRecord) => {
    setSelectedContact(c);
    setFormData({
      name: c.name,
      company: c.company || '',
      designation: c.designation || '',
      email: c.email || '',
      phone: c.phone || '',
      category: c.category,
      stage: c.stage,
      status: c.status,
      location: c.location || '',
      tags: (c.tags || []).join(', '),
      notes: c.notes || '',
      is_favorite: c.is_favorite,
      contact_profile_id: c.contact_profile_id || null,
    });
    setShowEditModal(true);
  };

  // ── Filter & Search Logic for Contacts CRM ─────────────────────────────────
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = c.name?.toLowerCase().includes(q);
        const matchesComp = c.company?.toLowerCase().includes(q);
        const matchesDesig = c.designation?.toLowerCase().includes(q);
        const matchesEmail = c.email?.toLowerCase().includes(q);
        const matchesPhone = c.phone?.toLowerCase().includes(q);
        const matchesLoc = c.location?.toLowerCase().includes(q);
        const matchesTag = c.tags?.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesComp && !matchesDesig && !matchesEmail && !matchesPhone && !matchesLoc && !matchesTag) {
          return false;
        }
      }

      if (categoryFilter !== 'all' && c.category !== categoryFilter) {
        return false;
      }

      if (presenceFilter === 'live') {
        if (c.status !== 'live' && c.status !== 'online') return false;
      } else if (presenceFilter !== 'all' && c.status !== presenceFilter) {
        return false;
      }

      if (stageFilter !== 'all' && c.stage !== stageFilter) {
        return false;
      }

      return true;
    });
  }, [contacts, searchQuery, categoryFilter, presenceFilter, stageFilter]);

  // Metric Counters
  const liveCount = useMemo(() => contacts.filter((c) => c.status === 'live' || c.status === 'online').length, [contacts]);
  const awayCount = useMemo(() => contacts.filter((c) => c.status === 'away').length, [contacts]);
  const activePartnerCount = useMemo(() => contacts.filter((c) => c.stage === 'Active Partner' || c.stage === 'VIP / Key Account').length, [contacts]);

  return (
    <div style={{ width: '100%', maxWidth: '100%', margin: '0', padding: '16px 20px 80px', color: '#172B4D', boxSizing: 'border-box' }}>
      {/* ── CRM Top Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '18px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 850, color: '#002b66', letterSpacing: '-0.02em', margin: 0 }}>
              Contacts &amp; Network CRM
            </h1>
            <span style={{ fontSize: '11px', fontWeight: 700, background: '#E5F3FC', color: '#075985', padding: '2px 8px', borderRadius: '12px' }}>
              Network Connected
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#52657D', marginTop: '4px', margin: 0 }}>
            Unified freight directory, live presence telemetry, connection requests &amp; instant trade chat.
          </p>
        </div>

        {/* Top Right Action & User Presence Selector */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* My Live Presence Selector */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: '#FFFFFF',
              border: '1px solid #DFE7F0',
              padding: '4px 10px',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
            }}
          >
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#52657D' }}>My Status:</span>
            <button
              onClick={() => handleUpdateMyPresence('live')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: myPresence === 'live' ? '#DCFCE7' : 'transparent',
                color: myPresence === 'live' ? '#15803D' : '#64748B',
              }}
              title="Set to Live / Online"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#16A34A' }} />
              Live
            </button>
            <button
              onClick={() => handleUpdateMyPresence('away')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: myPresence === 'away' ? '#FEF3C7' : 'transparent',
                color: myPresence === 'away' ? '#B45309' : '#64748B',
              }}
              title="Set to Away"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#F59E0B' }} />
              Away
            </button>
            <button
              onClick={() => handleUpdateMyPresence('busy')}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                background: myPresence === 'busy' ? '#FEE2E2' : 'transparent',
                color: myPresence === 'busy' ? '#B91C1C' : '#64748B',
              }}
              title="Set to Busy"
            >
              <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#EF4444' }} />
              Busy
            </button>
          </div>

          {/* Add Contact Button */}
          <button
            onClick={() => {
              resetForm();
              setShowAddModal(true);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              background: '#002b66',
              color: '#FFFFFF',
              fontSize: '13px',
              fontWeight: 700,
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0, 43, 102, 0.2)',
              transition: 'all 0.15s ease',
            }}
          >
            <Plus size={16} /> Add Contact
          </button>
        </div>
      </div>

      {/* ── Main Navigation Mode Tabs (CRM vs Discover vs Requests) ─────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          borderBottom: '2px solid #DFE7F0',
          marginBottom: '20px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {/* Tab 1: All Contacts & Connections */}
        <button
          onClick={() => setActiveMainTab('all')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '13.5px',
            fontWeight: 750,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderBottom: activeMainTab === 'all' ? '3px solid #002b66' : '3px solid transparent',
            color: activeMainTab === 'all' ? '#002b66' : '#52657D',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          <Users size={16} />
          <span>All Contacts &amp; Connections</span>
          <span
            style={{
              fontSize: '11px',
              padding: '2px 7px',
              borderRadius: '10px',
              background: activeMainTab === 'all' ? '#002b66' : '#E2E8F0',
              color: activeMainTab === 'all' ? '#FFFFFF' : '#475569',
              fontWeight: 800,
            }}
          >
            {contacts.length}
          </span>
        </button>

        {/* Tab 2: Find New Connections */}
        <button
          onClick={() => setActiveMainTab('discover')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '13.5px',
            fontWeight: 750,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderBottom: activeMainTab === 'discover' ? '3px solid #002b66' : '3px solid transparent',
            color: activeMainTab === 'discover' ? '#002b66' : '#52657D',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          <Globe2 size={16} />
          <span>Find Connections</span>
          <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '10px', background: '#DCFCE7', color: '#166534', fontWeight: 800 }}>
            Discover
          </span>
        </button>

        {/* Tab 3: Requests Received */}
        <button
          onClick={() => setActiveMainTab('incoming')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '13.5px',
            fontWeight: 750,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderBottom: activeMainTab === 'incoming' ? '3px solid #002b66' : '3px solid transparent',
            color: activeMainTab === 'incoming' ? '#002b66' : '#52657D',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          <Inbox size={16} />
          <span>Requests Recd</span>
          {activeIncomingRequests.length > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                background: '#EF4444',
                color: '#FFFFFF',
                fontWeight: 800,
                animation: 'pulse 1.8s infinite',
              }}
            >
              {activeIncomingRequests.length}
            </span>
          )}
        </button>

        {/* Tab 4: Requests Sent */}
        <button
          onClick={() => setActiveMainTab('outgoing')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '13.5px',
            fontWeight: 750,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderBottom: activeMainTab === 'outgoing' ? '3px solid #002b66' : '3px solid transparent',
            color: activeMainTab === 'outgoing' ? '#002b66' : '#52657D',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          <Send size={15} />
          <span>Requests Sent</span>
          {activeOutgoingRequests.length > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                background: '#E2E8F0',
                color: '#475569',
                fontWeight: 800,
              }}
            >
              {activeOutgoingRequests.length}
            </span>
          )}
        </button>

        {/* Tab 5: Kept on Hold */}
        <button
          onClick={() => setActiveMainTab('held')}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '10px 16px',
            fontSize: '13.5px',
            fontWeight: 750,
            cursor: 'pointer',
            background: 'none',
            border: 'none',
            borderBottom: activeMainTab === 'held' ? '3px solid #002b66' : '3px solid transparent',
            color: activeMainTab === 'held' ? '#002b66' : '#52657D',
            marginBottom: '-2px',
            whiteSpace: 'nowrap',
          }}
        >
          <PauseCircle size={16} />
          <span>Kept on Hold</span>
          {heldRequests.length > 0 && (
            <span
              style={{
                fontSize: '11px',
                padding: '2px 7px',
                borderRadius: '10px',
                background: '#FEF3C7',
                color: '#B45309',
                fontWeight: 800,
              }}
            >
              {heldRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 1: ALL CONTACTS & CRM DIRECTORY
      ──────────────────────────────────────────────────────────────────────── */}
      {activeMainTab === 'all' && (
        <>
          {/* KPI Metric Cards Row */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '14px',
              marginBottom: '22px',
            }}
          >
            {/* Metric 1: Total Directory */}
            <div style={{ background: '#FFFFFF', border: '1px solid #DFE7F0', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#52657D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Total Directory</span>
                <div style={{ background: '#F1F5F9', color: '#475569', padding: '6px', borderRadius: '8px' }}>
                  <Users size={16} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#0f172a', marginTop: '8px' }}>
                {contacts.length}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                Verified network connections
              </div>
            </div>

            {/* Metric 2: Live Now */}
            <div style={{ background: '#FFFFFF', border: '1px solid #DFE7F0', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#15803D', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Live / Online Now</span>
                <div style={{ background: '#DCFCE7', color: '#16A34A', padding: '6px', borderRadius: '8px' }}>
                  <Zap size={16} />
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px', marginTop: '8px' }}>
                <span style={{ fontSize: '26px', fontWeight: 900, color: '#15803D' }}>{liveCount}</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#16A34A', fontWeight: 700 }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A' }} />
                  Active
                </span>
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                Available for instant freight chat
              </div>
            </div>

            {/* Metric 3: Away / Transit */}
            <div style={{ background: '#FFFFFF', border: '1px solid #DFE7F0', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#B45309', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Away / In Transit</span>
                <div style={{ background: '#FEF3C7', color: '#D97706', padding: '6px', borderRadius: '8px' }}>
                  <Clock size={16} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#B45309', marginTop: '8px' }}>
                {awayCount}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                Active within the last 2 hours
              </div>
            </div>

            {/* Metric 4: Active Partners */}
            <div style={{ background: '#FFFFFF', border: '1px solid #DFE7F0', borderRadius: '12px', padding: '16px 18px', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#0369A1', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Active Trade Deals</span>
                <div style={{ background: '#E0F2FE', color: '#0284C7', padding: '6px', borderRadius: '8px' }}>
                  <Building2 size={16} />
                </div>
              </div>
              <div style={{ fontSize: '26px', fontWeight: 900, color: '#0369A1', marginTop: '8px' }}>
                {activePartnerCount}
              </div>
              <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
                Contracted freight partners
              </div>
            </div>
          </div>

          {/* Control Bar: Search, Category, Status, View Switcher */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #DFE7F0',
              borderRadius: '12px',
              padding: '12px 16px',
              marginBottom: '20px',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
            }}
          >
            {/* Upper Row: Search Input + Presence Filter + View Mode */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '420px' }}>
                <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search by name, company, email, phone, city..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px 12px 8px 34px',
                    fontSize: '13px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#F8FAFC',
                    color: '#0F172A',
                  }}
                />
              </div>

              {/* Presence Filter & View Toggles */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                  {(['all', 'live', 'away', 'offline'] as PresenceFilter[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => setPresenceFilter(st)}
                      style={{
                        padding: '4px 10px',
                        fontSize: '11.5px',
                        fontWeight: 700,
                        borderRadius: '6px',
                        border: 'none',
                        cursor: 'pointer',
                        background: presenceFilter === st ? '#FFFFFF' : 'transparent',
                        color: presenceFilter === st ? '#002b66' : '#64748B',
                        boxShadow: presenceFilter === st ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                        textTransform: 'capitalize',
                      }}
                    >
                      {st === 'live' ? '🟢 Live' : st === 'away' ? '🟡 Away' : st === 'offline' ? '⚪ Offline' : 'All'}
                    </button>
                  ))}
                </div>

                {/* View Switcher */}
                <div style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', padding: '3px', borderRadius: '8px' }}>
                  <button
                    onClick={() => setViewMode('grid')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                      color: viewMode === 'grid' ? '#002b66' : '#64748B',
                      cursor: 'pointer',
                    }}
                    title="Cards Grid View"
                  >
                    <LayoutGrid size={15} />
                  </button>
                  <button
                    onClick={() => setViewMode('table')}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: 'none',
                      background: viewMode === 'table' ? '#FFFFFF' : 'transparent',
                      color: viewMode === 'table' ? '#002b66' : '#64748B',
                      cursor: 'pointer',
                    }}
                    title="CRM Table View"
                  >
                    <TableIcon size={15} />
                  </button>
                </div>

                {/* Refresh Button */}
                <button
                  onClick={() => fetchContacts(true)}
                  disabled={refreshing}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '6px 10px',
                    fontSize: '12px',
                    fontWeight: 600,
                    borderRadius: '8px',
                    border: '1px solid #DFE7F0',
                    background: '#FFFFFF',
                    color: '#475569',
                    cursor: 'pointer',
                  }}
                  title="Refresh contacts"
                >
                  <RefreshCw size={14} className={refreshing ? 'spin' : ''} />
                </button>
              </div>
            </div>

            {/* Lower Row: Category Pills */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
              {(['all', 'Freight Forwarder', 'Shipping Line / Carrier', 'Customs Broker', 'Shipper (BCO)', 'Transporter / Fleet'] as CategoryFilter[]).map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    whiteSpace: 'nowrap',
                    padding: '4px 12px',
                    fontSize: '12px',
                    fontWeight: 700,
                    borderRadius: '50px',
                    border: categoryFilter === cat ? '1px solid #002b66' : '1px solid #E2E8F0',
                    background: categoryFilter === cat ? '#002b66' : '#FFFFFF',
                    color: categoryFilter === cat ? '#FFFFFF' : '#475569',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {cat === 'all' ? 'All Roles' : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Contacts List / Grid View with Skeleton Screen (Principle 1) */}
          {loadingContacts ? (
            <div style={{ padding: '8px 0' }}>
              <SkeletonScreen type="card" count={4} label="Loading trade contacts…" />
            </div>
          ) : filteredContacts.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #DFE7F0' }}>
              <Users size={36} style={{ margin: '0 auto', color: '#94A3B8' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '12px' }}>No contacts found</h3>
              <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '400px', margin: '6px auto 16px' }}>
                {searchQuery || categoryFilter !== 'all' || presenceFilter !== 'all'
                  ? 'Try resetting your search query or filters to view all entries.'
                  : 'Add your first freight contact or link a connection from the FR8X verified directory.'}
              </p>
              <div style={{ display: 'flex', justifyContent: 'center', gap: '10px' }}>
                <button
                  onClick={() => {
                    resetForm();
                    setShowAddModal(true);
                  }}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: '#002b66',
                    color: '#FFFFFF',
                    borderRadius: '8px',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  + Add Contact Now
                </button>
                <button
                  onClick={() => setActiveMainTab('discover')}
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px',
                    fontWeight: 700,
                    background: '#F1F5F9',
                    color: '#002b66',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    cursor: 'pointer',
                  }}
                >
                  Find New Connections
                </button>
              </div>
            </div>
          ) : viewMode === 'grid' ? (
            /* Cards Grid View */
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {filteredContacts.map((contact) => {
                const isLive = contact.status === 'live' || contact.status === 'online';
                const isAway = contact.status === 'away';
                const isBusy = contact.status === 'busy';

                return (
                  <div
                    key={contact.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #DFE7F0',
                      borderRadius: '12px',
                      padding: '18px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                  >
                    <div>
                      {/* Card Header: Avatar, Name, Favorite Star */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                          <div style={{ position: 'relative' }}>
                            <UserAvatar
                              avatarUrl={contact.avatar_url}
                              name={contact.name}
                              size={46}
                            />
                            <span
                              style={{
                                position: 'absolute',
                                bottom: '0',
                                right: '0',
                                width: '12px',
                                height: '12px',
                                borderRadius: '50%',
                                border: '2px solid #FFFFFF',
                                background: isLive ? '#16A34A' : isAway ? '#F59E0B' : isBusy ? '#EF4444' : '#94A3B8',
                              }}
                              title={`Status: ${contact.status}`}
                            />
                          </div>

                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                              <span style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A' }}>
                                {contact.name}
                              </span>
                              {contact.has_golden_tick && <GoldenTick size={15} />}
                            </div>
                            <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px' }}>
                              {contact.designation || 'Logistics Executive'}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => handleToggleFavorite(contact, e)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            cursor: 'pointer',
                            color: contact.is_favorite ? '#EAB308' : '#CBD5E1',
                            padding: '4px',
                          }}
                          title={contact.is_favorite ? 'Remove Favorite' : 'Mark as Favorite'}
                        >
                          <Star size={18} fill={contact.is_favorite ? '#EAB308' : 'none'} />
                        </button>
                      </div>

                      {/* Company & Location */}
                      <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12.5px', color: '#334155', fontWeight: 600 }}>
                          <Building2 size={13} style={{ color: '#64748B' }} />
                          <span>{contact.company || 'Private Carrier'}</span>
                        </div>
                        {contact.location && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', color: '#64748B' }}>
                            <MapPin size={13} style={{ color: '#94A3B8' }} />
                            <span>{contact.location}</span>
                          </div>
                        )}
                      </div>

                      {/* Category & Stage Chips */}
                      <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#475569' }}>
                          {contact.category}
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            padding: '2px 8px',
                            borderRadius: '4px',
                            background:
                              contact.stage === 'VIP / Key Account'
                                ? '#FEF3C7'
                                : contact.stage === 'Active Partner'
                                ? '#DCFCE7'
                                : '#E0F2FE',
                            color:
                              contact.stage === 'VIP / Key Account'
                                ? '#B45309'
                                : contact.stage === 'Active Partner'
                                ? '#166534'
                                : '#0369A1',
                          }}
                        >
                          {contact.stage}
                        </span>
                        {contact.is_connection && (
                          <span style={{ fontSize: '11px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#EEF2FF', color: '#4338CA' }}>
                            Verified Contact
                          </span>
                        )}
                      </div>

                      {/* Trade Notes Snippet */}
                      {contact.notes && (
                        <div
                          style={{
                            marginTop: '10px',
                            fontSize: '11.5px',
                            color: '#64748B',
                            background: '#F8FAFC',
                            padding: '6px 10px',
                            borderRadius: '6px',
                            borderLeft: '3px solid #CBD5E1',
                            fontStyle: 'italic',
                          }}
                        >
                          &ldquo;{contact.notes.slice(0, 75)}{contact.notes.length > 75 ? '...' : ''}&rdquo;
                        </div>
                      )}
                    </div>

                    {/* Bottom Action Footer */}
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        {contact.phone && (
                          <a
                            href={`tel:${contact.phone}`}
                            style={{
                              padding: '6px',
                              background: '#F8FAFC',
                              borderRadius: '6px',
                              color: '#475569',
                              display: 'inline-flex',
                            }}
                            title={`Call ${contact.phone}`}
                          >
                            <Phone size={14} />
                          </a>
                        )}
                        {contact.email && (
                          <a
                            href={`mailto:${contact.email}`}
                            style={{
                              padding: '6px',
                              background: '#F8FAFC',
                              borderRadius: '6px',
                              color: '#475569',
                              display: 'inline-flex',
                            }}
                            title={`Email ${contact.email}`}
                          >
                            <Mail size={14} />
                          </a>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenChat(contact)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '6px 12px',
                            fontSize: '12px',
                            fontWeight: 700,
                            background: '#002b66',
                            color: '#FFFFFF',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          <MessageSquare size={13} /> Chat
                        </button>
                        <button
                          onClick={() => populateEditForm(contact)}
                          style={{
                            padding: '6px 8px',
                            background: '#F8FAFC',
                            border: '1px solid #DFE7F0',
                            borderRadius: '6px',
                            color: '#64748B',
                            cursor: 'pointer',
                          }}
                          title="Edit Contact"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContact(contact);
                            setDeleteWithConnection(true);
                            setShowDeleteModal(true);
                          }}
                          style={{
                            padding: '6px 8px',
                            background: '#FEF2F2',
                            border: '1px solid #FEE2E2',
                            borderRadius: '6px',
                            color: '#DC2626',
                            cursor: 'pointer',
                          }}
                          title="Delete Contact"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* CRM Table View */
            <div style={{ background: '#FFFFFF', border: '1px solid #DFE7F0', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #DFE7F0', color: '#475569' }}>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Contact / Member</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Company &amp; Role</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Deal Stage</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700 }}>Location</th>
                      <th style={{ padding: '12px 16px', fontWeight: 700, textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredContacts.map((c) => {
                      const isLive = c.status === 'live' || c.status === 'online';
                      const isAway = c.status === 'away';
                      const isBusy = c.status === 'busy';

                      return (
                        <tr key={c.id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                              <UserAvatar avatarUrl={c.avatar_url} name={c.name} size={36} />
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 750, color: '#0F172A' }}>
                                  <span>{c.name}</span>
                                  {c.has_golden_tick && <GoldenTick size={14} />}
                                </div>
                                <div style={{ fontSize: '11.5px', color: '#64748B' }}>{c.email || c.phone || 'No direct info'}</div>
                              </div>
                            </div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <div style={{ fontWeight: 600, color: '#1E293B' }}>{c.company || '—'}</div>
                            <div style={{ fontSize: '11.5px', color: '#64748B' }}>{c.category}</div>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '5px',
                                fontSize: '11.5px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '12px',
                                background: isLive ? '#DCFCE7' : isAway ? '#FEF3C7' : isBusy ? '#FEE2E2' : '#F1F5F9',
                                color: isLive ? '#166534' : isAway ? '#B45309' : isBusy ? '#991B1B' : '#64748B',
                              }}
                            >
                              <span
                                style={{
                                  width: '6px',
                                  height: '6px',
                                  borderRadius: '50%',
                                  background: isLive ? '#16A34A' : isAway ? '#F59E0B' : isBusy ? '#EF4444' : '#94A3B8',
                                }}
                              />
                              {isLive ? 'Live' : isAway ? 'Away' : isBusy ? 'Busy' : 'Offline'}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px' }}>
                            <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px', background: '#F1F5F9', color: '#334155' }}>
                              {c.stage}
                            </span>
                          </td>
                          <td style={{ padding: '12px 16px', color: '#64748B', fontSize: '12px' }}>
                            {c.location || '—'}
                          </td>
                          <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                            <div style={{ display: 'inline-flex', gap: '6px' }}>
                              <button
                                onClick={() => handleOpenChat(c)}
                                style={{
                                  padding: '5px 10px',
                                  fontSize: '11.5px',
                                  fontWeight: 700,
                                  background: '#002b66',
                                  color: '#FFFFFF',
                                  border: 'none',
                                  borderRadius: '6px',
                                  cursor: 'pointer',
                                }}
                              >
                                Chat
                              </button>
                              <button
                                onClick={() => populateEditForm(c)}
                                style={{
                                  padding: '5px 8px',
                                  background: '#F8FAFC',
                                  border: '1px solid #DFE7F0',
                                  borderRadius: '6px',
                                  color: '#64748B',
                                  cursor: 'pointer',
                                }}
                              >
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 2: FIND NEW CONNECTIONS (DISCOVERY)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeMainTab === 'discover' && (
        <div>
          {/* Discovery Control & Search Bar */}
          <div
            style={{
              background: '#FFFFFF',
              border: '1px solid #DFE7F0',
              borderRadius: '12px',
              padding: '16px 20px',
              marginBottom: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.02)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <div>
              <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#002b66', margin: 0 }}>
                Discover Freight Forwarders, Shippers &amp; Fleet Owners
              </h2>
              <p style={{ fontSize: '12.5px', color: '#64748B', marginTop: '2px', margin: 0 }}>
                Expand your logistics footprint. Connect with verified freight professionals across global ports and inland corridors.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ position: 'relative', flex: '1', minWidth: '260px' }}>
                <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                <input
                  type="text"
                  placeholder="Search by name, company, trade lane (e.g. IN-UAE), city (e.g. Mumbai, Dubai)..."
                  value={discoverSearch}
                  onChange={(e) => setDiscoverSearch(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '9px 12px 9px 36px',
                    fontSize: '13px',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    outline: 'none',
                    background: '#F8FAFC',
                  }}
                />
              </div>

              {/* Role filter buttons */}
              <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
                {[
                  { id: 'all', label: 'All Roles' },
                  { id: 'Ocean Freight', label: 'Ocean Freight' },
                  { id: 'Air Freight', label: 'Air Freight' },
                  { id: 'Transporter', label: 'Transporters / Fleet' },
                  { id: 'Customs Clearance', label: 'Customs Broker' },
                  { id: 'Cold Chain', label: 'Cold Chain' },
                ].map((rf) => (
                  <button
                    key={rf.id}
                    onClick={() => setDiscoverRole(rf.id)}
                    style={{
                      padding: '6px 12px',
                      fontSize: '12px',
                      fontWeight: 700,
                      borderRadius: '50px',
                      border: discoverRole === rf.id ? '1px solid #002b66' : '1px solid #E2E8F0',
                      background: discoverRole === rf.id ? '#002b66' : '#FFFFFF',
                      color: discoverRole === rf.id ? '#FFFFFF' : '#475569',
                      cursor: 'pointer',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {rf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Members Discovery Grid with Skeleton Screen (Principle 1) */}
          {loadingDiscover ? (
            <div style={{ padding: '8px 0' }}>
              <SkeletonScreen type="card" count={4} label="Searching verified freight directory…" />
            </div>
          ) : directoryMembers.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #DFE7F0' }}>
              <Globe2 size={36} style={{ margin: '0 auto', color: '#94A3B8' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '12px' }}>No members match your criteria</h3>
              <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '400px', margin: '6px auto 16px' }}>
                Try modifying your search keywords or switching role specializations.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '16px',
              }}
            >
              {directoryMembers.map((member) => {
                const name = resolveMemberName(member);
                const subline = resolveMemberSubline(member);
                const location = resolveMemberLocation(member);
                const status = member.connection_status || 'not_connected';
                const isConnected = status === 'connected';
                const isPendingSent = status === 'pending_sent';

                return (
                  <div
                    key={member.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #DFE7F0',
                      borderRadius: '12px',
                      padding: '18px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                    }}
                  >
                    <div>
                      {/* Member Info Header */}
                      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                        <Link href={`/people/${member.id}`} style={{ textDecoration: 'none' }}>
                          <UserAvatar avatarUrl={member.avatar_url || undefined} name={name} size={46} />
                        </Link>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <Link
                              href={`/people/${member.id}`}
                              style={{
                                fontSize: '15px',
                                fontWeight: 800,
                                color: '#002b66',
                                textDecoration: 'none',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {name}
                            </Link>
                            {member.has_golden_tick && <GoldenTick size={15} />}
                          </div>
                          <div style={{ fontSize: '12px', color: '#64748B', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {subline || 'Freight Professional'}
                          </div>
                        </div>
                      </div>

                      {location && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '12px', color: '#64748B', marginTop: '10px' }}>
                          <MapPin size={13} style={{ color: '#94A3B8' }} />
                          <span>{location}</span>
                        </div>
                      )}

                      {/* Trade Lanes & Specializations */}
                      <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap', marginTop: '10px' }}>
                        {(member.skills || member.specializations || []).slice(0, 3).map((sk, idx) => (
                          <span
                            key={idx}
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: '#F1F5F9',
                              color: '#475569',
                            }}
                          >
                            {sk}
                          </span>
                        ))}
                        {(member.key_trade_lanes || []).slice(0, 2).map((tl, idx) => (
                          <span
                            key={`tl_${idx}`}
                            style={{
                              fontSize: '10.5px',
                              fontWeight: 700,
                              padding: '2px 7px',
                              borderRadius: '4px',
                              background: '#E0F2FE',
                              color: '#0369A1',
                            }}
                          >
                            🛣️ {tl}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Action Button */}
                    <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Link
                        href={`/people/${member.id}`}
                        style={{
                          fontSize: '12px',
                          fontWeight: 700,
                          color: '#002b66',
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '3px',
                        }}
                      >
                        Profile <ArrowUpRight size={13} />
                      </Link>

                      {isConnected ? (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '5px 10px',
                            borderRadius: '6px',
                            background: '#DCFCE7',
                            color: '#166534',
                          }}
                        >
                          <CheckCircle2 size={13} /> Connected
                        </span>
                      ) : isPendingSent ? (
                        <button
                          onClick={() => member.request_id && handleWithdrawRequest(member.request_id, name)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '5px 10px',
                            borderRadius: '6px',
                            border: '1px solid #CBD5E1',
                            background: '#F8FAFC',
                            color: '#64748B',
                            cursor: 'pointer',
                          }}
                        >
                          <Clock size={12} /> Pending · Withdraw
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setSendConnectTarget(member);
                            setSendConnectNote('');
                          }}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            fontSize: '12px',
                            fontWeight: 700,
                            padding: '6px 14px',
                            borderRadius: '6px',
                            border: 'none',
                            background: '#002b66',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                          }}
                        >
                          <UserPlus size={13} /> Connect
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 3: REQUESTS RECEIVED (ACCEPT, KEEP ON HOLD, DECLINE)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeMainTab === 'incoming' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#002b66', margin: 0 }}>
                Incoming Connection Requests
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', margin: 0 }}>
                Review incoming requests. You can accept to connect, keep on hold for due diligence, or decline.
              </p>
            </div>
            <button
              onClick={() => fetchNetworkRequests()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #DFE7F0',
                background: '#FFFFFF',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} className={loadingRequests ? 'spin' : ''} /> Refresh
            </button>
          </div>

          {loadingRequests ? (
            <div style={{ padding: '8px 0' }}>
              <SkeletonScreen type="row" count={3} label="Loading incoming requests…" />
            </div>
          ) : activeIncomingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #DFE7F0' }}>
              <Inbox size={36} style={{ margin: '0 auto', color: '#94A3B8' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '12px' }}>No pending requests</h3>
              <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '400px', margin: '6px auto 16px' }}>
                You have addressed all connection requests. Find new partners in the network discovery tab.
              </p>
              <button
                onClick={() => setActiveMainTab('discover')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: '#002b66',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Find New Connections
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeIncomingRequests.map((req) => {
                const p = req.profiles;
                const name = resolveMemberName(p);
                const subline = resolveMemberSubline(p);
                const location = resolveMemberLocation(p);
                const isBusy = requestBusyId === req.id;

                return (
                  <div
                    key={req.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #DFE7F0',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px',
                    }}
                  >
                    {/* Left: Avatar & Info */}
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center', minWidth: '260px' }}>
                      <Link href={`/people/${p.id}`} style={{ textDecoration: 'none' }}>
                        <UserAvatar avatarUrl={p.avatar_url || undefined} name={name} size={48} />
                      </Link>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Link href={`/people/${p.id}`} style={{ fontSize: '15px', fontWeight: 800, color: '#002b66', textDecoration: 'none' }}>
                            {name}
                          </Link>
                          {p.has_golden_tick && <GoldenTick size={15} />}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#475569', marginTop: '1px' }}>
                          {subline || 'Freight Forwarder'}
                        </div>
                        {location && (
                          <div style={{ fontSize: '11.5px', color: '#64748B', display: 'flex', alignItems: 'center', gap: '4px', marginTop: '3px' }}>
                            <MapPin size={12} /> {location}
                          </div>
                        )}
                        {req.message && (
                          <div
                            style={{
                              marginTop: '8px',
                              fontSize: '12px',
                              color: '#334155',
                              background: '#F8FAFC',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              borderLeft: '3px solid #002b66',
                              fontStyle: 'italic',
                              maxWidth: '520px',
                            }}
                          >
                            &ldquo;{req.message}&rdquo;
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                          Received on {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    {/* Right: The 3 Requested Buttons (Accept, Keep on Hold, Decline) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      {/* 1. Accept Button */}
                      <button
                        onClick={() => handleAcceptRequest(req.id, name)}
                        disabled={isBusy}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          fontSize: '12.5px',
                          fontWeight: 750,
                          borderRadius: '8px',
                          border: 'none',
                          background: '#16A34A',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          boxShadow: '0 1px 3px rgba(22, 163, 74, 0.3)',
                          opacity: isBusy ? 0.6 : 1,
                        }}
                      >
                        <CheckCircle2 size={15} /> Accept
                      </button>

                      {/* 2. Keep on Hold Button */}
                      <button
                        onClick={() => handleHoldRequest(req.id, name)}
                        disabled={isBusy}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          borderRadius: '8px',
                          border: '1px solid #F59E0B',
                          background: '#FEF3C7',
                          color: '#B45309',
                          cursor: 'pointer',
                          opacity: isBusy ? 0.6 : 1,
                        }}
                        title="Keep this request on hold for deeper due diligence without declining"
                      >
                        <PauseCircle size={15} /> Keep on Hold
                      </button>

                      {/* 3. Decline Button */}
                      <button
                        onClick={() => handleDeclineRequest(req.id, name)}
                        disabled={isBusy}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          fontSize: '12.5px',
                          fontWeight: 650,
                          borderRadius: '8px',
                          border: '1px solid #DFE7F0',
                          background: '#FFFFFF',
                          color: '#64748B',
                          cursor: 'pointer',
                          opacity: isBusy ? 0.6 : 1,
                        }}
                      >
                        <XCircle size={15} /> Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 4: REQUESTS SENT (OUTGOING & WITHDRAW)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeMainTab === 'outgoing' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#002b66', margin: 0 }}>
                Sent Connection Requests
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', margin: 0 }}>
                Invitations you have dispatched. You can withdraw any pending request at any time.
              </p>
            </div>
            <button
              onClick={() => fetchNetworkRequests()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #DFE7F0',
                background: '#FFFFFF',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} className={loadingRequests ? 'spin' : ''} /> Refresh
            </button>
          </div>

          {loadingRequests ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #DFE7F0' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto', color: '#002b66' }} />
              <p style={{ marginTop: '12px', fontSize: '13.5px', color: '#64748B', fontWeight: 600 }}>Loading sent requests...</p>
            </div>
          ) : activeOutgoingRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #DFE7F0' }}>
              <Send size={36} style={{ margin: '0 auto', color: '#94A3B8' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '12px' }}>No outgoing requests pending</h3>
              <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '400px', margin: '6px auto 16px' }}>
                All your outgoing connection requests have either been accepted or responded to.
              </p>
              <button
                onClick={() => setActiveMainTab('discover')}
                style={{
                  padding: '8px 16px',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: '#002b66',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                }}
              >
                Find New Partners
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeOutgoingRequests.map((req) => {
                const p = req.profiles;
                const name = resolveMemberName(p);
                const subline = resolveMemberSubline(p);
                const isBusy = requestBusyId === req.id;
                const isHeldByRecipient = req.status === 'hold';

                return (
                  <div
                    key={req.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #DFE7F0',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <Link href={`/people/${p.id}`} style={{ textDecoration: 'none' }}>
                        <UserAvatar avatarUrl={p.avatar_url || undefined} name={name} size={46} />
                      </Link>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Link href={`/people/${p.id}`} style={{ fontSize: '15px', fontWeight: 800, color: '#002b66', textDecoration: 'none' }}>
                            {name}
                          </Link>
                          {p.has_golden_tick && <GoldenTick size={15} />}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{subline}</div>
                        {req.message && (
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>
                            Note: &ldquo;{req.message}&rdquo;
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                          Sent on {new Date(req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      {isHeldByRecipient ? (
                        <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#FEF3C7', color: '#B45309' }}>
                          Kept on Hold by Member
                        </span>
                      ) : (
                        <span style={{ fontSize: '11.5px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px', background: '#F1F5F9', color: '#64748B' }}>
                          Pending Response
                        </span>
                      )}

                      {/* Withdraw Button */}
                      <button
                        onClick={() => handleWithdrawRequest(req.id, name)}
                        disabled={isBusy}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '7px 14px',
                          fontSize: '12.5px',
                          fontWeight: 700,
                          borderRadius: '6px',
                          border: '1px solid #FCA5A5',
                          background: '#FEF2F2',
                          color: '#DC2626',
                          cursor: 'pointer',
                          opacity: isBusy ? 0.6 : 1,
                        }}
                      >
                        <RotateCcw size={13} /> Withdraw
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          TAB 5: KEPT ON HOLD (HELD REQUESTS)
      ──────────────────────────────────────────────────────────────────────── */}
      {activeMainTab === 'held' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#002b66', margin: 0 }}>
                Connection Requests Kept on Hold
              </h2>
              <p style={{ fontSize: '13px', color: '#64748B', marginTop: '2px', margin: 0 }}>
                Requests you have placed on hold for rate review, port authorization check, or partner verification.
              </p>
            </div>
            <button
              onClick={() => fetchNetworkRequests()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                fontSize: '12px',
                fontWeight: 600,
                borderRadius: '6px',
                border: '1px solid #DFE7F0',
                background: '#FFFFFF',
                color: '#475569',
                cursor: 'pointer',
              }}
            >
              <RefreshCw size={13} className={loadingRequests ? 'spin' : ''} /> Refresh
            </button>
          </div>

          {/* Info Banner */}
          <div
            style={{
              background: '#FEF3C7',
              border: '1px solid #FDE68A',
              borderRadius: '8px',
              padding: '12px 16px',
              marginBottom: '16px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              color: '#92400E',
              fontSize: '12.5px',
            }}
          >
            <PauseCircle size={18} />
            <span>
              These requests are temporarily deferred. Senders see that their request is under review. You can accept or decline whenever you are ready.
            </span>
          </div>

          {loadingRequests ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #DFE7F0' }}>
              <RefreshCw size={28} className="spin" style={{ margin: '0 auto', color: '#002b66' }} />
              <p style={{ marginTop: '12px', fontSize: '13.5px', color: '#64748B', fontWeight: 600 }}>Loading held requests...</p>
            </div>
          ) : heldRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #DFE7F0' }}>
              <PauseCircle size={36} style={{ margin: '0 auto', color: '#94A3B8' }} />
              <h3 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', marginTop: '12px' }}>No requests on hold</h3>
              <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '400px', margin: '6px auto 16px' }}>
                You do not have any requests on hold right now.
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {heldRequests.map((req) => {
                const p = req.profiles;
                const name = resolveMemberName(p);
                const subline = resolveMemberSubline(p);
                const isBusy = requestBusyId === req.id;

                return (
                  <div
                    key={req.id}
                    style={{
                      background: '#FFFFFF',
                      border: '1px solid #DFE7F0',
                      borderRadius: '12px',
                      padding: '16px 20px',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '14px',
                    }}
                  >
                    <div style={{ display: 'flex', gap: '14px', alignItems: 'center' }}>
                      <Link href={`/people/${p.id}`} style={{ textDecoration: 'none' }}>
                        <UserAvatar avatarUrl={p.avatar_url || undefined} name={name} size={46} />
                      </Link>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Link href={`/people/${p.id}`} style={{ fontSize: '15px', fontWeight: 800, color: '#002b66', textDecoration: 'none' }}>
                            {name}
                          </Link>
                          {p.has_golden_tick && <GoldenTick size={15} />}
                        </div>
                        <div style={{ fontSize: '12px', color: '#64748B' }}>{subline}</div>
                        {req.message && (
                          <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px', fontStyle: 'italic' }}>
                            Note: &ldquo;{req.message}&rdquo;
                          </div>
                        )}
                        <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px' }}>
                          Deferred on {new Date(req.updated_at || req.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {/* Accept Now */}
                      <button
                        onClick={() => handleAcceptRequest(req.id, name)}
                        disabled={isBusy}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 16px',
                          fontSize: '12.5px',
                          fontWeight: 750,
                          borderRadius: '8px',
                          border: 'none',
                          background: '#16A34A',
                          color: '#FFFFFF',
                          cursor: 'pointer',
                          opacity: isBusy ? 0.6 : 1,
                        }}
                      >
                        <CheckCircle2 size={15} /> Accept Now
                      </button>

                      {/* Decline */}
                      <button
                        onClick={() => handleDeclineRequest(req.id, name)}
                        disabled={isBusy}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          padding: '8px 14px',
                          fontSize: '12.5px',
                          fontWeight: 650,
                          borderRadius: '8px',
                          border: '1px solid #DFE7F0',
                          background: '#FFFFFF',
                          color: '#64748B',
                          cursor: 'pointer',
                          opacity: isBusy ? 0.6 : 1,
                        }}
                      >
                        <XCircle size={15} /> Decline
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          SEND CONNECTION INVITATION MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      {sendConnectTarget && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setSendConnectTarget(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '480px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h2 style={{ fontSize: '17px', fontWeight: 800, color: '#002b66', margin: 0 }}>
                Connect with {resolveMemberName(sendConnectTarget)}
              </h2>
              <button onClick={() => setSendConnectTarget(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', background: '#F8FAFC', padding: '12px', borderRadius: '10px', marginBottom: '16px' }}>
              <UserAvatar avatarUrl={sendConnectTarget.avatar_url || undefined} name={resolveMemberName(sendConnectTarget)} size={42} />
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 800, fontSize: '14px', color: '#0F172A' }}>
                  <span>{resolveMemberName(sendConnectTarget)}</span>
                  {sendConnectTarget.has_golden_tick && <GoldenTick size={14} />}
                </div>
                <div style={{ fontSize: '12px', color: '#64748B' }}>{resolveMemberSubline(sendConnectTarget)}</div>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                Introductory Freight Message (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Hello, we manage dry van and reefer loads on Mumbai-Delhi. Would like to connect and share active trade rates."
                value={sendConnectNote}
                onChange={(e) => setSendConnectNote(e.target.value)}
                maxLength={300}
                style={{
                  width: '100%',
                  padding: '10px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  outline: 'none',
                  resize: 'vertical',
                }}
              />
              <div style={{ fontSize: '11px', color: '#94A3B8', marginTop: '4px', textAlign: 'right' }}>
                {sendConnectNote.length}/300 characters
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setSendConnectTarget(null)}
                style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, background: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSendConnectRequest}
                disabled={sendingConnect}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 20px',
                  fontSize: '13px',
                  fontWeight: 700,
                  background: '#002b66',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  opacity: sendingConnect ? 0.7 : 1,
                }}
              >
                {sendingConnect ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
                Send Connection Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          SLIDE-OVER LIVE FREIGHT CHAT DRAWER
      ──────────────────────────────────────────────────────────────────────── */}
      {activeChatContact && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(2px)',
            zIndex: 120,
            display: 'flex',
            justifyContent: 'flex-end',
          }}
          onClick={() => setActiveChatContact(null)}
        >
          <div
            style={{
              width: '100%',
              maxWidth: '440px',
              height: '100%',
              background: '#FFFFFF',
              boxShadow: '-4px 0 25px rgba(0,0,0,0.12)',
              display: 'flex',
              flexDirection: 'column',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Drawer Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #DFE7F0',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserAvatar avatarUrl={activeChatContact.avatar_url} name={activeChatContact.name} size={40} />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A' }}>{activeChatContact.name}</span>
                    {activeChatContact.has_golden_tick && <GoldenTick size={14} />}
                  </div>
                  <div style={{ fontSize: '11px', color: '#16A34A', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#16A34A' }} />
                    {activeChatContact.company || 'Carrier Member'}
                  </div>
                </div>
              </div>
              <button
                onClick={() => setActiveChatContact(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Messages Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {chatLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B' }}>
                  <RefreshCw size={24} className="spin" style={{ margin: '0 auto' }} />
                  <p style={{ fontSize: '12px', marginTop: '8px' }}>Loading conversation history...</p>
                </div>
              ) : chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: '#94A3B8' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto', opacity: 0.5 }} />
                  <p style={{ fontSize: '13px', marginTop: '8px', color: '#64748B', fontWeight: 600 }}>Start your freight conversation</p>
                  <p style={{ fontSize: '11.5px', color: '#94A3B8' }}>Inquire about spot rates, container availability, or dispatch schedules.</p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.sender_id === user?.uid || msg.sender_id === 'me';
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isMe ? 'flex-end' : 'flex-start',
                        maxWidth: '80%',
                        background: isMe ? '#002b66' : '#F1F5F9',
                        color: isMe ? '#FFFFFF' : '#0F172A',
                        padding: '10px 14px',
                        borderRadius: isMe ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                        fontSize: '13px',
                        lineHeight: 1.4,
                      }}
                    >
                      <div>{msg.content}</div>
                      <div
                        style={{
                          fontSize: '10px',
                          color: isMe ? 'rgba(255,255,255,0.7)' : '#94A3B8',
                          marginTop: '4px',
                          textAlign: 'right',
                        }}
                      >
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Quick Freight Message Chips */}
            <div style={{ padding: '8px 16px', background: '#F8FAFC', borderTop: '1px solid #DFE7F0', display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {[
                'Sharing spot rates',
                'Looking for 40ft container',
                'Transit time inquiry',
              ].map((chip, idx) => (
                <button
                  key={idx}
                  onClick={() => setChatInputText(chip)}
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '3px 8px',
                    borderRadius: '12px',
                    border: '1px solid #CBD5E1',
                    background: '#FFFFFF',
                    color: '#475569',
                    whiteSpace: 'nowrap',
                    cursor: 'pointer',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Input Footer */}
            <form onSubmit={handleSendChatMessage} style={{ padding: '12px 16px', borderTop: '1px solid #DFE7F0', display: 'flex', gap: '8px' }}>
              <input
                type="text"
                placeholder="Type your message..."
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  fontSize: '13px',
                  borderRadius: '8px',
                  border: '1px solid #CBD5E1',
                  outline: 'none',
                }}
              />
              <button
                type="submit"
                disabled={chatSending || !chatInputText.trim()}
                style={{
                  padding: '10px 16px',
                  background: '#002b66',
                  color: '#FFFFFF',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  opacity: chatSending || !chatInputText.trim() ? 0.6 : 1,
                }}
              >
                <Send size={15} />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          ADD CONTACT MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowAddModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#002b66', margin: 0 }}>Add New Freight Contact</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {/* Mode Toggle: Link from FR8X Directory vs Manual Entry */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => setAddMode('directory')}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  background: addMode === 'directory' ? '#FFFFFF' : 'transparent',
                  color: addMode === 'directory' ? '#002b66' : '#64748B',
                  cursor: 'pointer',
                }}
              >
                Link FR8X Member
              </button>
              <button
                type="button"
                onClick={() => setAddMode('manual')}
                style={{
                  flex: 1,
                  padding: '8px',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  background: addMode === 'manual' ? '#FFFFFF' : 'transparent',
                  color: addMode === 'manual' ? '#002b66' : '#64748B',
                  cursor: 'pointer',
                }}
              >
                Manual Corporate Entry
              </button>
            </div>

            {/* Directory Search Section */}
            {addMode === 'directory' && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Search FR8X Verified Member Directory
                </label>
                <div style={{ position: 'relative' }}>
                  <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Search member name or company..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    style={{ width: '100%', padding: '8px 10px 8px 32px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>

                {/* Directory Results List */}
                {directoryResults.length > 0 && (
                  <div style={{ marginTop: '8px', border: '1px solid #DFE7F0', borderRadius: '8px', overflow: 'hidden' }}>
                    {directoryResults.map((m) => (
                      <div
                        key={m.id}
                        onClick={() => {
                          setFormData({
                            ...formData,
                            name: m.full_name || m.display_name || 'Member',
                            company: m.company || m.company_name || '',
                            designation: m.designation || m.position || '',
                            location: m.location || m.city || '',
                            contact_profile_id: m.id,
                          });
                          setDirectorySearch('');
                          setDirectoryResults([]);
                          toast(`Selected ${m.full_name || m.display_name}`);
                        }}
                        style={{
                          padding: '10px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #F1F5F9',
                          cursor: 'pointer',
                          background: formData.contact_profile_id === m.id ? '#F0F9FF' : '#FFFFFF',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <UserAvatar avatarUrl={m.avatar_url} name={m.full_name || m.display_name} size={32} />
                          <div>
                            <div style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>{m.full_name || m.display_name}</div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>{m.company || m.company_name} · {m.city}</div>
                          </div>
                        </div>
                        <span style={{ fontSize: '11px', fontWeight: 700, color: '#0284C7' }}>Select</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSaveNewContact} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Designation</label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Location / City</label>
                  <input
                    type="text"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Role Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF' }}
                  >
                    <option value="Freight Forwarder">Freight Forwarder</option>
                    <option value="Shipping Line / Carrier">Shipping Line / Carrier</option>
                    <option value="Customs Broker">Customs Broker</option>
                    <option value="Shipper (BCO)">Shipper (BCO)</option>
                    <option value="Transporter / Fleet">Transporter / Fleet</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Deal Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF' }}
                  >
                    <option value="Active Partner">Active Partner</option>
                    <option value="Rate Quoted">Rate Quoted</option>
                    <option value="VIP / Key Account">VIP / Key Account</option>
                    <option value="Prospect / Lead">Prospect / Lead</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Private CRM Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, background: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 700, background: '#002b66', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          EDIT CONTACT MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      {showEditModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowEditModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '560px',
              width: '100%',
              padding: '24px 28px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#002b66', margin: 0 }}>Edit Contact &amp; CRM Notes</h2>
              <button onClick={() => setShowEditModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEditContact} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Deal Stage</label>
                  <select
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF' }}
                  >
                    <option value="Active Partner">Active Partner</option>
                    <option value="Rate Quoted">Rate Quoted</option>
                    <option value="VIP / Key Account">VIP / Key Account</option>
                    <option value="Prospect / Lead">Prospect / Lead</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Presence Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1', background: '#FFFFFF' }}
                  >
                    <option value="live">🟢 Live / Online</option>
                    <option value="away">🟡 Away</option>
                    <option value="busy">🔴 Busy</option>
                    <option value="offline">⚪ Offline</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Private CRM Trade Notes</label>
                <textarea
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1', resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, background: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 700, background: '#002b66', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────
          DELETE CONTACT MODAL
      ──────────────────────────────────────────────────────────────────────── */}
      {showDeleteModal && selectedContact && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}
          onClick={() => setShowDeleteModal(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '440px',
              width: '100%',
              padding: '24px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#DC2626' }}>
              <div style={{ background: '#FEE2E2', padding: '8px', borderRadius: '8px' }}>
                <Trash2 size={20} />
              </div>
              <h3 style={{ fontSize: '16px', fontWeight: 800, margin: 0 }}>Delete Contact</h3>
            </div>

            <p style={{ fontSize: '13px', color: '#475569', marginTop: '12px', lineHeight: 1.5 }}>
              Are you sure you want to remove <strong>{selectedContact.name}</strong> ({selectedContact.company}) from your contacts directory?
            </p>

            {selectedContact.contact_profile_id && (
              <div
                style={{
                  marginTop: '14px',
                  background: '#F8FAFC',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '10px 12px',
                }}
              >
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12.5px', fontWeight: 700, color: '#0F172A', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={deleteWithConnection}
                    onChange={(e) => setDeleteWithConnection(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: '#002b66' }}
                  />
                  <span>Also remove connection relationship</span>
                </label>
                <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', margin: '4px 0 0 24px' }}>
                  Unfriends/disconnects this user from your verified connection network.
                </p>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600, background: '#F1F5F9', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                style={{ padding: '8px 18px', fontSize: '13px', fontWeight: 700, background: '#DC2626', color: '#FFFFFF', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
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
