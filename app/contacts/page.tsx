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
} from 'lucide-react';
import { useAuth } from '@/lib/context/AuthContext';
import { useToast } from '@/lib/context/ToastContext';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { ContactRecord } from '@/lib/db/contacts';

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

export default function ContactsCrmPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [contacts, setContacts] = useState<ContactRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & View State
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

  // ── Load Contacts from API ──────────────────────────────────────────────────
  const fetchContacts = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch('/api/contacts', { credentials: 'include' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setContacts(json.data);
      }
    } catch (err: any) {
      console.error('Failed to fetch contacts:', err);
      toast('Failed to load contacts.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  // ── Handle Own Presence Status Toggle in DBMS ──────────────────────────────
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
        toast(`Status updated to ${status.toUpperCase()} in DBMS`);
      }
    } catch {
      toast('Presence update failed');
    } finally {
      setUpdatingPresence(false);
    }
  };

  // ── Directory Member Live Search (Add from FR8X) ───────────────────────────
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
      const res = await fetch('/api/contacts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        toast(`Contact "${payload.name}" saved to DBMS`);
        setShowAddModal(false);
        resetForm();
        fetchContacts(true);
      } else {
        toast(json.error || 'Failed to save contact');
      }
    } catch {
      toast('Network error saving contact');
    }
  };

  // ── Handle Edit Contact ────────────────────────────────────────────────────
  const handleSaveEditContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContact) return;

    const payload = {
      id: selectedContact.id,
      ...formData,
      tags: formData.tags ? formData.tags.split(',').map((t) => t.trim()).filter(Boolean) : [],
    };

    try {
      const res = await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload),
      });
      const json = await res.json();

      if (json.success) {
        toast(`Updated "${payload.name}" in DBMS`);
        setShowEditModal(false);
        fetchContacts(true);
      } else {
        toast(json.error || 'Failed to update contact');
      }
    } catch {
      toast('Network error updating contact');
    }
  };

  // ── Handle Delete Contact & DBMS Connection ────────────────────────────────
  const handleConfirmDelete = async () => {
    if (!selectedContact) return;

    try {
      const query = new URLSearchParams({
        id: selectedContact.id,
        deleteConnection: deleteWithConnection ? 'true' : 'false',
      });

      const res = await fetch(`/api/contacts?${query.toString()}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      const json = await res.json();

      if (json.success) {
        toast(json.message || 'Contact deleted');
        setShowDeleteModal(false);
        setSelectedContact(null);
        fetchContacts(true);
      } else {
        toast(json.error || 'Delete failed');
      }
    } catch {
      toast('Network error during deletion');
    }
  };

  // ── Quick Toggle Favorite Star ─────────────────────────────────────────────
  const handleToggleFavorite = async (c: ContactRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    const newFav = !c.is_favorite;

    // Optimistic update
    setContacts((prev) => prev.map((item) => (item.id === c.id ? { ...item, is_favorite: newFav } : item)));

    try {
      await fetch('/api/contacts', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ id: c.id, is_favorite: newFav }),
      });
    } catch {
      // Revert on error
      setContacts((prev) => prev.map((item) => (item.id === c.id ? { ...item, is_favorite: !newFav } : item)));
    }
  };

  // ── Direct Chat Drawer Logic ───────────────────────────────────────────────
  const handleOpenChat = async (c: ContactRecord) => {
    setActiveChatContact(c);
    setChatLoading(true);

    try {
      const targetId = c.contact_profile_id || c.id;
      const res = await fetch(`/api/contacts/chat?targetId=${targetId}`, { credentials: 'include' });
      const json = await res.json();
      if (json.success && Array.isArray(json.data)) {
        setChatMessages(json.data);
      }
    } catch {
      setChatMessages([]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleSendChatMessage = async (presetText?: string) => {
    const textToSend = presetText || chatInputText;
    if (!textToSend.trim() || !activeChatContact || chatSending) return;

    setChatSending(true);
    const targetId = activeChatContact.contact_profile_id || activeChatContact.id;

    try {
      const res = await fetch('/api/contacts/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ targetId, content: textToSend }),
      });
      const json = await res.json();

      if (json.success && json.data) {
        setChatMessages((prev) => [...prev, json.data]);
        if (!presetText) setChatInputText('');
        toast('Message sent to contact');
      }
    } catch {
      toast('Failed to send message');
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

  // ── Filter & Search Logic ──────────────────────────────────────────────────
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      // 1. Text Search
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

      // 2. Category Filter
      if (categoryFilter !== 'all' && c.category !== categoryFilter) {
        return false;
      }

      // 3. Presence Status Filter
      if (presenceFilter === 'live') {
        if (c.status !== 'live' && c.status !== 'online') return false;
      } else if (presenceFilter !== 'all' && c.status !== presenceFilter) {
        return false;
      }

      // 4. Deal Stage Filter
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
    <div style={{ maxWidth: '1440px', margin: '0 auto', padding: '24px 20px 80px', color: '#172B4D' }}>
      {/* ── CRM Top Header ──────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px', marginBottom: '22px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: 850, color: '#002b66', letterSpacing: '-0.02em', margin: 0 }}>
              Contacts &amp; Trade CRM
            </h1>
            <span style={{ fontSize: '11px', fontWeight: 700, background: '#E5F3FC', color: '#075985', padding: '2px 8px', borderRadius: '12px' }}>
              DBMS Connected
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#52657D', marginTop: '4px', margin: 0 }}>
            Unified B2B logistics address book, live partner presence, and real-time deal communication.
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
              title="Set to Live / Online in DBMS"
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
              title="Set to Away in DBMS"
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
              title="Set to Busy in DBMS"
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

      {/* ── KPI Metric Cards Row ────────────────────────────────────────────── */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '14px',
          marginBottom: '22px',
        }}
      >
        {/* Metric 1: Total Contacts */}
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
            Connected with Postgres DBMS
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
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#16A34A', animation: 'pulse 1.8s infinite' }} />
              Active
            </span>
          </div>
          <div style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
            Available for immediate dispatch
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
            Responding via mobile notification
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

      {/* ── Control Bar: Search, Category, Status, View Switcher ────────────── */}
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
          {/* Search Box */}
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
              title="Refresh from DBMS"
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

      {/* ── Main Contacts Content ───────────────────────────────────────────── */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px 20px', background: '#FFFFFF', borderRadius: '12px', border: '1px solid #DFE7F0' }}>
          <RefreshCw size={28} className="spin" style={{ margin: '0 auto', color: '#002b66' }} />
          <p style={{ marginTop: '12px', fontSize: '13.5px', color: '#64748B', fontWeight: 600 }}>Loading trade contacts from DBMS...</p>
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
        </div>
      ) : viewMode === 'grid' ? (
        /* ── Grid View ──────────────────────────────────────────────────────── */
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
                {/* Card Header: Avatar, Name, Favorite Star */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                      {/* Avatar with Status Indicator Ring */}
                      <div style={{ position: 'relative' }}>
                        <UserAvatar
                          avatarUrl={contact.avatar_url}
                          name={contact.name}
                          size={46}
                        />
                        {/* Status Dot */}
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

                      {/* Name & Designation */}
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

                    {/* Star / Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFavorite(contact, e)}
                      style={{
                        background: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        color: contact.is_favorite ? '#EAB308' : '#CBD5E1',
                        padding: '4px',
                      }}
                      title={contact.is_favorite ? 'Favorited' : 'Add to Favorites'}
                    >
                      <Star size={18} fill={contact.is_favorite ? '#EAB308' : 'none'} />
                    </button>
                  </div>

                  {/* Company & Category Pill */}
                  <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 700, color: '#002b66' }}>
                      <Building2 size={13} /> {contact.company || 'Enterprise Partner'}
                    </div>
                    <span style={{ fontSize: '10.5px', fontWeight: 700, background: '#F1F5F9', color: '#475569', padding: '2px 7px', borderRadius: '4px' }}>
                      {contact.category}
                    </span>
                  </div>

                  {/* Presence Status Banner */}
                  <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#F8FAFC', padding: '5px 10px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontWeight: 700 }}>
                      <span
                        style={{
                          width: '7px',
                          height: '7px',
                          borderRadius: '50%',
                          background: isLive ? '#16A34A' : isAway ? '#F59E0B' : isBusy ? '#EF4444' : '#94A3B8',
                        }}
                      />
                      <span style={{ color: isLive ? '#15803D' : isAway ? '#B45309' : isBusy ? '#B91C1C' : '#64748B' }}>
                        {isLive ? 'Live · Online Now' : isAway ? 'Away · In Transit' : isBusy ? 'Busy · In Auction' : 'Offline'}
                      </span>
                    </div>

                    <span style={{ fontSize: '10.5px', fontWeight: 700, color: '#0369A1' }}>
                      {contact.stage}
                    </span>
                  </div>

                  {/* Notes Preview (if any) */}
                  {contact.notes && (
                    <div style={{ marginTop: '10px', fontSize: '11.5px', color: '#475569', background: '#FFFBEB', border: '1px solid #FEF3C7', padding: '6px 8px', borderRadius: '6px' }}>
                      <strong>CRM Note:</strong> {contact.notes}
                    </div>
                  )}

                  {/* Contact Methods (Email / Phone / Location) */}
                  <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '4px', fontSize: '11.5px', color: '#64748B' }}>
                    {contact.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Mail size={12} /> <a href={`mailto:${contact.email}`} style={{ color: '#0284C7', textDecoration: 'none' }}>{contact.email}</a>
                      </div>
                    )}
                    {contact.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Phone size={12} /> <a href={`tel:${contact.phone}`} style={{ color: '#475569', textDecoration: 'none' }}>{contact.phone}</a>
                      </div>
                    )}
                    {contact.location && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <MapPin size={12} /> <span>{contact.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card Action Buttons (Chat, Edit, Delete) */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginTop: '16px',
                    paddingTop: '12px',
                    borderTop: '1px solid #F1F5F9',
                  }}
                >
                  <button
                    onClick={() => handleOpenChat(contact)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '5px',
                      fontSize: '12px',
                      fontWeight: 700,
                      background: '#E5F3FC',
                      color: '#075985',
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <MessageSquare size={13} /> Chat
                  </button>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      onClick={() => populateEditForm(contact)}
                      style={{
                        background: '#F8FAFC',
                        border: '1px solid #DFE7F0',
                        color: '#475569',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      title="Edit Contact Details & Notes"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={() => {
                        setSelectedContact(contact);
                        setShowDeleteModal(true);
                      }}
                      style={{
                        background: '#FEF2F2',
                        border: '1px solid #FEE2E2',
                        color: '#DC2626',
                        padding: '6px 8px',
                        borderRadius: '6px',
                        cursor: 'pointer',
                      }}
                      title="Delete Contact & Manage Connection"
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
        /* ── Table View ──────────────────────────────────────────────────────── */
        <div style={{ background: '#FFFFFF', border: '1px solid #DFE7F0', borderRadius: '12px', overflowX: 'auto', boxShadow: '0 1px 4px rgba(0,0,0,0.02)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #DFE7F0', color: '#52657D', fontWeight: 700, fontSize: '11.5px', textTransform: 'uppercase' }}>
                <th style={{ padding: '12px 16px' }}>Contact</th>
                <th style={{ padding: '12px 16px' }}>Company &amp; Role</th>
                <th style={{ padding: '12px 16px' }}>Presence</th>
                <th style={{ padding: '12px 16px' }}>Deal Stage</th>
                <th style={{ padding: '12px 16px' }}>Contact Info</th>
                <th style={{ padding: '12px 16px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredContacts.map((contact) => {
                const isLive = contact.status === 'live' || contact.status === 'online';
                const isAway = contact.status === 'away';
                const isBusy = contact.status === 'busy';

                return (
                  <tr key={contact.id} style={{ borderBottom: '1px solid #F1F5F9', transition: 'background 0.1s' }}>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={(e) => handleToggleFavorite(contact, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: contact.is_favorite ? '#EAB308' : '#CBD5E1', padding: 0 }}
                        >
                          <Star size={15} fill={contact.is_favorite ? '#EAB308' : 'none'} />
                        </button>
                        <UserAvatar avatarUrl={contact.avatar_url} name={contact.name} size={34} />
                        <div>
                          <div style={{ fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            {contact.name}
                            {contact.has_golden_tick && <GoldenTick size={13} />}
                          </div>
                          <span style={{ fontSize: '11px', color: '#64748B' }}>{contact.designation || 'Member'}</span>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 700, color: '#002b66' }}>{contact.company || 'Enterprise'}</div>
                      <span style={{ fontSize: '11px', color: '#64748B' }}>{contact.category}</span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '11.5px', fontWeight: 700 }}>
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: isLive ? '#16A34A' : isAway ? '#F59E0B' : isBusy ? '#EF4444' : '#94A3B8' }} />
                        <span style={{ color: isLive ? '#15803D' : isAway ? '#B45309' : isBusy ? '#B91C1C' : '#64748B' }}>
                          {isLive ? 'Live' : isAway ? 'Away' : isBusy ? 'Busy' : 'Offline'}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, background: '#E0F2FE', color: '#0369A1', padding: '3px 8px', borderRadius: '4px' }}>
                        {contact.stage}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: '12px', color: '#475569' }}>{contact.email || '-'}</div>
                      <div style={{ fontSize: '11px', color: '#64748B' }}>{contact.phone || '-'}</div>
                    </td>
                    <td style={{ padding: '12px 16px', textAlign: 'right' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <button
                          onClick={() => handleOpenChat(contact)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            background: '#E5F3FC',
                            color: '#075985',
                            border: 'none',
                            padding: '5px 10px',
                            borderRadius: '6px',
                            fontWeight: 700,
                            fontSize: '11.5px',
                            cursor: 'pointer',
                          }}
                        >
                          <MessageSquare size={13} /> Chat
                        </button>
                        <button
                          onClick={() => populateEditForm(contact)}
                          style={{ background: '#F8FAFC', border: '1px solid #DFE7F0', padding: '5px', borderRadius: '6px', cursor: 'pointer', color: '#475569' }}
                          title="Edit"
                        >
                          <Edit3 size={13} />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedContact(contact);
                            setShowDeleteModal(true);
                          }}
                          style={{ background: '#FEF2F2', border: '1px solid #FEE2E2', padding: '5px', borderRadius: '6px', cursor: 'pointer', color: '#DC2626' }}
                          title="Delete"
                        >
                          <Trash2 size={13} />
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

      {/* ── Slide-over Live Chat Drawer ─────────────────────────────────────── */}
      {activeChatContact && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.45)',
            backdropFilter: 'blur(3px)',
            zIndex: 100,
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
              boxShadow: '-8px 0 30px rgba(0,0,0,0.15)',
              display: 'flex',
              flexDirection: 'column',
              animation: 'slideInRight 0.2s ease-out',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Chat Drawer Header */}
            <div
              style={{
                padding: '16px 20px',
                borderBottom: '1px solid #DFE7F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F8FAFC',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <UserAvatar
                  avatarUrl={activeChatContact.avatar_url}
                  name={activeChatContact.name}
                  size={40}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontWeight: 800, fontSize: '14.5px', color: '#0F172A' }}>
                    {activeChatContact.name}
                    {activeChatContact.has_golden_tick && <GoldenTick size={14} />}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: '#64748B' }}>
                    <span>{activeChatContact.company}</span>
                    <span>•</span>
                    <span style={{ fontWeight: 700, color: activeChatContact.status === 'live' || activeChatContact.status === 'online' ? '#16A34A' : '#D97706' }}>
                      {activeChatContact.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveChatContact(null)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B', padding: '6px' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Freight Action Chips */}
            <div style={{ padding: '8px 16px', background: '#FFFFFF', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '6px', overflowX: 'auto' }}>
              {[
                'Spot rate for 40HC?',
                'Confirm vessel departure ETA',
                'BL draft uploaded to Nexus',
                'Customs clearance update',
              ].map((chip) => (
                <button
                  key={chip}
                  onClick={() => handleSendChatMessage(chip)}
                  disabled={chatSending}
                  style={{
                    whiteSpace: 'nowrap',
                    fontSize: '11px',
                    fontWeight: 600,
                    padding: '4px 8px',
                    borderRadius: '50px',
                    border: '1px solid #DFE7F0',
                    background: '#F8FAFC',
                    color: '#075985',
                    cursor: 'pointer',
                  }}
                >
                  {chip}
                </button>
              ))}
            </div>

            {/* Chat Messages Stream */}
            <div style={{ flex: 1, padding: '20px 16px', overflowY: 'auto', background: '#F8FAFC', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {chatLoading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#64748B', fontSize: '13px' }}>
                  <RefreshCw size={20} className="spin" style={{ margin: '0 auto 8px' }} />
                  Loading message history...
                </div>
              ) : chatMessages.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 16px', color: '#94A3B8' }}>
                  <MessageSquare size={32} style={{ margin: '0 auto 8px', color: '#CBD5E1' }} />
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#475569' }}>No messages yet</p>
                  <p style={{ fontSize: '11.5px', color: '#94A3B8', marginTop: '4px' }}>
                    Send a quick freight inquiry or rate proposal to start the conversation.
                  </p>
                </div>
              ) : (
                chatMessages.map((msg) => {
                  const isMine = msg.sender_id === user?.uid;
                  return (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: isMine ? 'flex-end' : 'flex-start',
                        maxWidth: '82%',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: isMine ? 'flex-end' : 'flex-start',
                      }}
                    >
                      <div
                        style={{
                          padding: '10px 14px',
                          borderRadius: isMine ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                          background: isMine ? '#002b66' : '#FFFFFF',
                          color: isMine ? '#FFFFFF' : '#0F172A',
                          border: isMine ? 'none' : '1px solid #E2E8F0',
                          fontSize: '13px',
                          lineHeight: 1.45,
                          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                        }}
                      >
                        {msg.content}
                      </div>
                      <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px', padding: '0 4px' }}>
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={chatMessagesEndRef} />
            </div>

            {/* Chat Input Bar */}
            <div style={{ padding: '14px 16px', borderTop: '1px solid #DFE7F0', background: '#FFFFFF' }}>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendChatMessage();
                }}
                style={{ display: 'flex', gap: '8px' }}
              >
                <input
                  type="text"
                  placeholder="Type a message or container RFQ inquiry..."
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
                    background: '#002b66',
                    color: '#FFFFFF',
                    border: 'none',
                    borderRadius: '8px',
                    padding: '0 16px',
                    cursor: chatSending || !chatInputText.trim() ? 'not-allowed' : 'pointer',
                    opacity: chatSending || !chatInputText.trim() ? 0.6 : 1,
                  }}
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Contact Modal ────────────────────────────────────────────────── */}
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
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#002b66', margin: 0 }}>Add Freight Trade Contact</h2>
                <p style={{ fontSize: '12px', color: '#64748B', marginTop: '2px', margin: 0 }}>Persist directly into PostgreSQL DBMS</p>
              </div>
              <button onClick={() => setShowAddModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}>
                <X size={20} />
              </button>
            </div>

            {/* Mode Toggle: From Directory vs Custom */}
            <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', marginBottom: '18px' }}>
              <button
                type="button"
                onClick={() => setAddMode('directory')}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  background: addMode === 'directory' ? '#FFFFFF' : 'transparent',
                  color: addMode === 'directory' ? '#002b66' : '#64748B',
                  cursor: 'pointer',
                  boxShadow: addMode === 'directory' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Link FR8X Verified Member
              </button>
              <button
                type="button"
                onClick={() => setAddMode('manual')}
                style={{
                  flex: 1,
                  padding: '7px 0',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: 'none',
                  background: addMode === 'manual' ? '#FFFFFF' : 'transparent',
                  color: addMode === 'manual' ? '#002b66' : '#64748B',
                  cursor: 'pointer',
                  boxShadow: addMode === 'manual' ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
                }}
              >
                Custom Corporate Entry
              </button>
            </div>

            {addMode === 'directory' ? (
              /* Mode 1: Search & Link FR8X Member */
              <div>
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <Search size={15} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <input
                    type="text"
                    placeholder="Search verified members by name, company, city..."
                    value={directorySearch}
                    onChange={(e) => setDirectorySearch(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '9px 12px 9px 36px',
                      fontSize: '13px',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      outline: 'none',
                    }}
                  />
                </div>

                {searchingDirectory && (
                  <div style={{ textAlign: 'center', padding: '16px', color: '#64748B', fontSize: '12px' }}>
                    <RefreshCw size={16} className="spin" style={{ margin: '0 auto 6px' }} />
                    Searching verified members...
                  </div>
                )}

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '280px', overflowY: 'auto' }}>
                  {directoryResults.map((p) => {
                    const fullName = p.display_name || p.full_name || `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Member';
                    return (
                      <div
                        key={p.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 12px',
                          border: '1px solid #E2E8F0',
                          borderRadius: '8px',
                          background: '#F8FAFC',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <UserAvatar avatarUrl={p.avatar_url} name={fullName} size={36} />
                          <div>
                            <div style={{ fontSize: '13px', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {fullName}
                              {p.has_golden_tick && <GoldenTick size={13} />}
                            </div>
                            <div style={{ fontSize: '11px', color: '#64748B' }}>
                              {p.company || p.company_name || 'Enterprise'} • {p.designation || 'Executive'}
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({
                              ...prev,
                              name: fullName,
                              company: p.company || p.company_name || '',
                              designation: p.designation || '',
                              email: p.email || '',
                              phone: p.phone || '',
                              location: [p.city, p.country].filter(Boolean).join(', '),
                              contact_profile_id: p.id,
                            }));
                            setAddMode('manual');
                            toast(`Linked profile for ${fullName}. Review details and save.`);
                          }}
                          style={{
                            padding: '6px 12px',
                            fontSize: '11.5px',
                            fontWeight: 700,
                            background: '#002b66',
                            color: '#FFFFFF',
                            borderRadius: '6px',
                            border: 'none',
                            cursor: 'pointer',
                          }}
                        >
                          Select
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}

            {/* Form Fields */}
            {(addMode === 'manual' || formData.contact_profile_id) && (
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
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Designation / Role</label>
                    <input
                      type="text"
                      value={formData.designation}
                      onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Category</label>
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
                      <option value="Port / Terminal">Port / Terminal</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Email</label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      style={{ width: '100%', padding: '8px 10px', fontSize: '13px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Phone / WhatsApp</label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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
                      <option value="Carrier Partner">Carrier Partner</option>
                      <option value="On Hold">On Hold</option>
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
                      <option value="busy">🔴 Busy / In Auction</option>
                      <option value="offline">⚪ Offline</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '11.5px', fontWeight: 700, color: '#475569', display: 'block', marginBottom: '4px' }}>Private CRM Trade Notes</label>
                  <textarea
                    rows={3}
                    placeholder="E.g., Preferred routes (Nhava Sheva -> Jebel Ali), credit terms, standard container volumes..."
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
                    Save Contact to DBMS
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ── Edit Contact Modal ────────────────────────────────────────────────── */}
      {showEditModal && selectedContact && (
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
                    <option value="Carrier Partner">Carrier Partner</option>
                    <option value="On Hold">On Hold</option>
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
                  Save Changes to DBMS
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Contact Modal with Connection Management ──────────────────── */}
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

            {/* Checkbox to also remove DBMS connection */}
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
                  <span>Also remove connection relationship in DBMS</span>
                </label>
                <p style={{ fontSize: '11px', color: '#64748B', marginTop: '4px', margin: '4px 0 0 24px' }}>
                  Unfriends/disconnects this user from your verified PostgreSQL connection network.
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
