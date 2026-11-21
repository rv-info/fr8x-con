'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { useData } from '@/lib/context/DataContext';
import { GoldenTick } from '@/components/ui/GoldenTick';
import {
  convertAmount,
  CURRENCY_RATES,
  getLocationTypeIcon,
  getCarrierTypeIcon,
  resolveDisplayName,
} from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { NetworkStatusPill } from './NetworkStatusPill';
import SearchableDropdown, { DropdownOption } from '@/components/ui/SearchableDropdown';
import { ProfilePreviewModal } from '@/components/ui/ProfilePreviewModal';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { useChat } from '@/lib/context/ChatContext';
import { useToast } from '@/lib/context/ToastContext';
import {
  getConnectionStatus,
  sendConnectionRequest,
  acceptConnectionRequest,
  CONNECTIONS_CHANGED_EVENT,
} from '@/lib/connections';

import {
  BiGeoAlt as MapPin,
  BiBell as Bell,
  BiChevronDown as ChevronDown,
  BiArrowLeftRight as ArrowRightLeft,
  BiCalculator as Calculator,
  BiXLg as X,
  BiSearch as Search,
  BiHammer as Gavel,
  BiBarChartLine as BarChart3,
  BiPeople as Users,
  BiGlobe2 as Globe2,
  BiBriefcase as Briefcase,
  BiCheck2All as CheckCheck,
  BiPerson as UserIcon,
  BiShieldCheck as ShieldCheck,
  BiGear as Settings,
  BiBoxArrowRight as LogOut,
  BiTrash as Trash2,
  BiArrowRepeat as RefreshCw,
} from '@/components/ui/BootstrapIcons';
import {
  Check,
  MessageSquare,
  Anchor,
  Ship,
  Clock,
  Building2,
  UserPlus,
  UserCheck,
  MessageCircle,
  Sparkles,
  Loader2,
  Plus,
  ArrowRight,
  CornerDownLeft,
  Layers,
  ChevronRight,
} from 'lucide-react';

interface TopBarProps {
  activePageTitle: string;
  onMobileMenuClick?: () => void;
}

export function TopBar({ activePageTitle, onMobileMenuClick }: TopBarProps) {
  const { user, allUsers, logout } = useAuth();
  const { currentCurrency, setCurrency, availableCurrencies, isLiveRates, lastUpdatedTime, refreshLiveRates, convertAmount: convertAmountLive } = useCurrency();
  const { notifications, refreshNotifications, markNotificationRead, markAllNotificationsRead, clearNotification, clearAllNotifications, auctions, rates, myRates, jobs, posts, topics, masterLocations, masterCarriers } = useData();

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [isSyncingNotifs, setIsSyncingNotifs] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [previewPassportUid, setPreviewPassportUid] = useState<string | null>(null);
  const [globalSearchHistory, setGlobalSearchHistory] = useState<{ id: string; query: string }[]>([]);

  const loadGlobalSearchHistory = async () => {
    try {
      const res = await fetch('/api/search/history?context=global&limit=6');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.history)) {
          setGlobalSearchHistory(json.history.map((h: any) => ({ id: h.id, query: h.query })));
        }
      }
    } catch {}
  };

  const recordGlobalSearch = async (query: string, count: number) => {
    if (!query || query.trim().length < 2) return;
    try {
      await fetch('/api/search/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim(), context: 'global', resultCount: count }),
      });
      loadGlobalSearchHistory();
    } catch {}
  };

  const removeGlobalHistoryItem = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setGlobalSearchHistory((prev) => prev.filter((item) => item.id !== id));
    try {
      await fetch(`/api/search/history?id=${encodeURIComponent(id)}&context=global`, {
        method: 'DELETE',
      });
    } catch {}
  };

  const clearAllGlobalHistory = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setGlobalSearchHistory([]);
    try {
      await fetch('/api/search/history?all=true&context=global', {
        method: 'DELETE',
      });
    } catch {}
  };

  const searchRef = useRef<HTMLInputElement>(null);

  // Currency Converter State
  const [calcSourceCurrency, setCalcSourceCurrency] = useState('INR');
  const [calcTargetCurrency, setCalcTargetCurrency] = useState('USD');
  const [calcSourceAmount, setCalcSourceAmount] = useState<number>(1500);

  const convertedResult = convertAmountLive ? convertAmountLive(calcSourceAmount || 0, calcSourceCurrency, calcTargetCurrency) : convertAmount(calcSourceAmount || 0, calcSourceCurrency, calcTargetCurrency);
  const directRate = convertAmountLive ? convertAmountLive(1, calcSourceCurrency, calcTargetCurrency) : convertAmount(1, calcSourceCurrency, calcTargetCurrency);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const router = useRouter();
  const { toast } = useToast();
  const { openChatWith } = useChat();

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [connectingUid, setConnectingUid] = useState<string | null>(null);
  const [acceptingUid, setAcceptingUid] = useState<string | null>(null);
  const [connRevision, setConnRevision] = useState(0);
  const [remotePeople, setRemotePeople] = useState<any[]>([]);
  const [remoteCompanies, setRemoteCompanies] = useState<any[]>([]);
  const [isSearchingRemote, setIsSearchingRemote] = useState(false);

  // Sync with connection changes across the app
  useEffect(() => {
    const handleConnChange = () => setConnRevision((v) => v + 1);
    window.addEventListener(CONNECTIONS_CHANGED_EVENT, handleConnChange);
    return () => window.removeEventListener(CONNECTIONS_CHANGED_EVENT, handleConnChange);
  }, []);

  // Debounced search for people & companies from server APIs
  useEffect(() => {
    const q = globalSearchQuery.trim();
    if (q.length < 2) {
      setRemotePeople([]);
      setRemoteCompanies([]);
      setIsSearchingRemote(false);
      return;
    }

    let isMounted = true;
    setIsSearchingRemote(true);
    const timer = setTimeout(async () => {
      try {
        const [peopleRes, compRes] = await Promise.allSettled([
          fetch(`/api/people/search?q=${encodeURIComponent(q)}&limit=10`),
          fetch(`/api/companies/search?q=${encodeURIComponent(q)}`),
        ]);

        if (isMounted) {
          if (peopleRes.status === 'fulfilled' && peopleRes.value.ok) {
            const pData = await peopleRes.value.json();
            if (pData.success && Array.isArray(pData.data)) {
              setRemotePeople(pData.data);
            }
          }
          if (compRes.status === 'fulfilled' && compRes.value.ok) {
            const cData = await compRes.value.json();
            if (cData.success && Array.isArray(cData.companies)) {
              setRemoteCompanies(cData.companies);
            }
          }
        }
      } catch {
      } finally {
        if (isMounted) setIsSearchingRemote(false);
      }
    }, 250);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [globalSearchQuery]);

  const handleSendConnect = async (e: React.MouseEvent, targetPerson: any) => {
    e.stopPropagation();
    const targetUid = targetPerson.uid;
    const targetName = resolveDisplayName(targetPerson);
    setConnectingUid(targetUid);
    try {
      await sendConnectionRequest(user, targetPerson, "Hello, let's connect on FR8X network.");
      toast(`Connection invitation sent to ${targetName}.`);
      setConnRevision((v) => v + 1);
    } catch (err: any) {
      toast(err.message || 'Failed to send connection request.');
    } finally {
      setConnectingUid(null);
    }
  };

  const handleAcceptRequest = async (e: React.MouseEvent, targetPerson: any) => {
    e.stopPropagation();
    const targetUid = targetPerson.uid;
    const targetName = resolveDisplayName(targetPerson);
    setAcceptingUid(targetUid);
    try {
      const ok = await acceptConnectionRequest('', user, targetUid);
      if (ok) {
        toast(`✓ Connected with ${targetName}!`);
        setConnRevision((v) => v + 1);
      } else {
        toast('Failed to accept request.');
      }
    } catch (err: any) {
      toast(err.message || 'Error accepting request.');
    } finally {
      setAcceptingUid(null);
    }
  };

  // Application Modules definition
  const CORE_MODULES = [
    { id: 'mod-feeds', name: 'Feeds & Discussions', desc: 'Trade updates, industry news & verified posts', href: '/feeds', icon: <Globe2 size={14} color="#1B2B4B" />, keywords: 'feeds posts discussions community updates' },
    { id: 'mod-rates', name: 'Freight Rates & Rate Intelligence', desc: 'Ocean container spot rates, carriers & routing', href: '/rates', icon: <BarChart3 size={14} color="#0D9488" />, keywords: 'rates freight spot rates ocean intelligence 40hc 20dv shipping carrier pricing' },
    { id: 'mod-auctions', name: 'Reverse Auctions', desc: 'Live container tender bidding & shipment RFQs', href: '/auctions', icon: <Gavel size={14} color="#1B2B4B" />, keywords: 'auctions reverse auction bidding rfq tender bid live room' },
    { id: 'mod-create-auction', name: 'Post Reverse Auction', desc: 'Create a new container reverse auction tender', href: '/auctions/create', icon: <Plus size={14} color="#1B2B4B" />, keywords: 'create auction post tender new bid publish' },
    { id: 'mod-network', name: 'Enterprise Logistics Directory & CRM', desc: 'Verified freight forwarders, carriers & partners', href: '/network', icon: <Users size={14} color="#2563EB" />, keywords: 'network directory crm contacts partners members people connections logistics directory' },
    { id: 'mod-jobs', name: 'Trade Careers & Jobs', desc: 'Maritime & logistics employment opportunities', href: '/jobs', icon: <Briefcase size={14} color="#0891B2" />, keywords: 'jobs careers hiring vacancies employment logistics recruitment' },
    { id: 'mod-nexus', name: 'Compliance & Blacklist', desc: 'Enterprise credibility, disputes & fraud prevention', href: '/nexus', icon: <ShieldCheck size={14} color="#D97706" />, keywords: 'nexus compliance blacklist credit risk dispute reputation' },
    { id: 'mod-profile', name: 'Profile & Freight Passport', desc: 'Statutory registrations, licenses & company KYC', href: '/profile', icon: <UserIcon size={14} color="#1B2B4B" />, keywords: 'profile passport company kyc gstn pan identity account credentials my profile' },
  ];

  const query = globalSearchQuery.trim().toLowerCase();

  // 1. APPLICATION MODULES
  const matchedModules = query.length >= 2
    ? CORE_MODULES.filter((m) =>
        m.name.toLowerCase().includes(query) ||
        m.desc.toLowerCase().includes(query) ||
        m.keywords.toLowerCase().includes(query)
      ).slice(0, 3)
    : [];

  // 2. PEOPLE & PROFESSIONALS (allUsers + remotePeople)
  const candidateUserMap = new Map<string, any>();
  allUsers.forEach((u) => {
    if (u && u.uid) candidateUserMap.set(u.uid, u);
  });
  remotePeople.forEach((p) => {
    if (p && p.id && !candidateUserMap.has(p.id)) {
      candidateUserMap.set(p.id, {
        uid: p.id,
        displayName: p.full_name || p.display_name,
        company: p.company || p.company_name,
        designation: p.headline || p.designation,
        city: p.city || (p.location ? p.location.split(',')[0]?.trim() : ''),
        country: p.country || (p.location ? p.location.split(',')[1]?.trim() : 'India'),
        avatarUrl: p.avatar_url,
        isVerified: p.is_verified,
        hasGoldenTick: p.has_golden_tick,
      });
    }
  });

  const matchedPeopleRaw = query.length >= 2
    ? Array.from(candidateUserMap.values()).filter((u) => {
        const uUid = String(u.uid || u.id || '').trim().toLowerCase();
        const myUid = String(user.uid || '').trim().toLowerCase();
        const myEmail = String(user.email || '').trim().toLowerCase();
        const uEmail = String(u.email || '').trim().toLowerCase();

        // Never recommend or display the logged-in user's own profile in people search results
        const isSelf = (uUid && uUid === myUid) || (uEmail && myEmail && uEmail === myEmail);
        if (isSelf) return false;

        const name = resolveDisplayName(u, '').toLowerCase();
        const comp = String(u.company || u.company_name || '').toLowerCase();
        const desig = String(u.designation || u.headline || '').toLowerCase();
        const loc = `${u.city || ''} ${u.country || ''}`.toLowerCase();
        const email = String(u.email || '').toLowerCase();

        return (
          name.includes(query) ||
          comp.includes(query) ||
          desig.includes(query) ||
          loc.includes(query) ||
          (email && email.includes(query))
        );
      })
    : [];

  const matchedConnections: any[] = [];
  const matchedIncomingRequests: any[] = [];
  const matchedPeople: any[] = [];

  matchedPeopleRaw.forEach((person) => {
    const status = getConnectionStatus(user.uid, person.uid);
    if (status === 'connected') {
      matchedConnections.push({ ...person, connectionStatus: status });
    } else if (status === 'pending_received') {
      matchedIncomingRequests.push({ ...person, connectionStatus: status });
    } else {
      matchedPeople.push({ ...person, connectionStatus: status });
    }
  });

  const displayConnections = matchedConnections.slice(0, 3);
  const displayIncoming = matchedIncomingRequests.slice(0, 3);
  const displayPeople = matchedPeople.slice(0, 4);

  // 3. COMPANIES & ORGANIZATIONS
  const distinctCompanyMap = new Map<string, any>();
  remoteCompanies.forEach((c) => {
    const key = (c.legalName || c.name || '').trim().toLowerCase();
    if (key && !distinctCompanyMap.has(key)) {
      distinctCompanyMap.set(key, {
        id: c.id,
        name: c.legalName || c.tradeName || c.name,
        location: c.locationLabel || [c.city, c.country || 'India'].filter(Boolean).join(', ') || 'India',
        verified: c.verified || c.status === 'verified',
        type: 'Freight Forwarding & Logistics Entity',
      });
    }
  });

  allUsers.forEach((u) => {
    const compName = (u.company || u.companyName || '').trim();
    const key = compName.toLowerCase();
    if (key && key.length > 2 && !distinctCompanyMap.has(key)) {
      distinctCompanyMap.set(key, {
        id: `comp-${key.replace(/\s+/g, '-')}`,
        name: compName,
        location: [u.city, u.country || 'India'].filter(Boolean).join(', ') || 'India',
        verified: Boolean(u.isVerified || (u as any).verified),
        type: 'Logistics Enterprise Member',
      });
    }
  });

  (masterCarriers || []).forEach((c) => {
    const key = c.name.trim().toLowerCase();
    if (key && !distinctCompanyMap.has(key)) {
      distinctCompanyMap.set(key, {
        id: `carrier-${c.scacCode}`,
        name: c.name,
        location: `${c.country || 'Global'} · SCAC: ${c.scacCode}`,
        verified: true,
        type: `${c.type || 'Ocean'} Carrier Line (${c.alliance || 'Independent'})`,
      });
    }
  });

  const matchedCompanies = query.length >= 2
    ? Array.from(distinctCompanyMap.values())
        .filter((c) => c.name.toLowerCase().includes(query) || (c.location && c.location.toLowerCase().includes(query)))
        .slice(0, 3)
    : [];

  // 4. FREIGHT RATES
  const allRates = [...rates, ...(myRates || [])];
  const matchedRates = query.length >= 2
    ? allRates
        .filter((r) =>
          (r.carrier && r.carrier.toLowerCase().includes(query)) ||
          (r.sp && r.sp.toLowerCase().includes(query)) ||
          (r.pol && r.pol.toLowerCase().includes(query)) ||
          (r.pod && r.pod.toLowerCase().includes(query)) ||
          (r.id && r.id.toLowerCase().includes(query))
        )
        .slice(0, 3)
    : [];

  // 5. REVERSE AUCTIONS
  const matchedAuctions = query.length >= 2
    ? auctions
        .filter((a) =>
          (a.title && a.title.toLowerCase().includes(query)) ||
          (a.id && a.id.toLowerCase().includes(query)) ||
          (a.shipment?.pol && a.shipment.pol.toLowerCase().includes(query)) ||
          (a.shipment?.pod && a.shipment.pod.toLowerCase().includes(query)) ||
          (a.shipment?.commodity && a.shipment.commodity.toLowerCase().includes(query))
        )
        .slice(0, 3)
    : [];

  // 6. JOBS
  const matchedJobs = query.length >= 2
    ? jobs
        .filter((j) =>
          (j.title && j.title.toLowerCase().includes(query)) ||
          (j.company && j.company.toLowerCase().includes(query)) ||
          (j.location && j.location.toLowerCase().includes(query))
        )
        .slice(0, 2)
    : [];

  // 7. FEEDS & TOPICS
  const matchedPosts = query.length >= 2
    ? posts
        .filter((p) =>
          (p.text && p.text.toLowerCase().includes(query)) ||
          (p.author && p.author.toLowerCase().includes(query)) ||
          (p.authorCompany && p.authorCompany.toLowerCase().includes(query))
        )
        .slice(0, 2)
    : [];

  // 8. PORTS & TERMINALS
  const matchedLocations = query.length >= 2
    ? (masterLocations || [])
        .filter((l) =>
          l.unLocode.toLowerCase().includes(query) ||
          l.name.toLowerCase().includes(query) ||
          l.country.toLowerCase().includes(query)
        )
        .slice(0, 3)
    : [];

  const totalResultsCount =
    matchedModules.length +
    displayIncoming.length +
    displayConnections.length +
    displayPeople.length +
    matchedCompanies.length +
    matchedRates.length +
    matchedAuctions.length +
    matchedJobs.length +
    matchedPosts.length +
    matchedLocations.length;

  // Build flat items array for keyboard navigation
  const flatResults: { id: string; select: () => void }[] = [];

  matchedModules.forEach((m) => {
    flatResults.push({
      id: m.id,
      select: () => {
        router.push(m.href);
        setShowGlobalSearch(false);
        setGlobalSearchQuery('');
      },
    });
  });

  displayIncoming.forEach((p) => {
    flatResults.push({
      id: p.uid,
      select: () => {
        setPreviewPassportUid(p.uid);
        setShowGlobalSearch(false);
      },
    });
  });

  displayConnections.forEach((p) => {
    flatResults.push({
      id: p.uid,
      select: () => {
        setPreviewPassportUid(p.uid);
        setShowGlobalSearch(false);
      },
    });
  });

  displayPeople.forEach((p) => {
    flatResults.push({
      id: p.uid,
      select: () => {
        setPreviewPassportUid(p.uid);
        setShowGlobalSearch(false);
      },
    });
  });

  matchedCompanies.forEach((c) => {
    flatResults.push({
      id: c.id,
      select: () => {
        router.push(`/network?company=${encodeURIComponent(c.name)}`);
        setShowGlobalSearch(false);
        setGlobalSearchQuery('');
      },
    });
  });

  matchedRates.forEach((r) => {
    flatResults.push({
      id: r.id,
      select: () => {
        router.push('/rates');
        setShowGlobalSearch(false);
        setGlobalSearchQuery('');
      },
    });
  });

  matchedAuctions.forEach((a) => {
    flatResults.push({
      id: a.id,
      select: () => {
        router.push(`/auctions/${a.id}`);
        setShowGlobalSearch(false);
        setGlobalSearchQuery('');
      },
    });
  });

  matchedJobs.forEach((j) => {
    flatResults.push({
      id: j.id,
      select: () => {
        router.push('/jobs');
        setShowGlobalSearch(false);
        setGlobalSearchQuery('');
      },
    });
  });

  matchedPosts.forEach((p) => {
    flatResults.push({
      id: p.id,
      select: () => {
        router.push('/feeds');
        setShowGlobalSearch(false);
        setGlobalSearchQuery('');
      },
    });
  });

  matchedLocations.forEach((l) => {
    flatResults.push({
      id: l.id,
      select: () => {
        router.push('/rates');
        setShowGlobalSearch(false);
        setGlobalSearchQuery('');
      },
    });
  });

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [globalSearchQuery]);

  // Keyboard shortcut & navigation handler
  useEffect(() => {
    if (showGlobalSearch) {
      loadGlobalSearchHistory();
    }
  }, [showGlobalSearch]);

  // Record search when typing finishes
  useEffect(() => {
    if (globalSearchQuery.trim().length >= 2) {
      const timer = setTimeout(() => {
        recordGlobalSearch(globalSearchQuery, totalResultsCount);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [globalSearchQuery, totalResultsCount]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
        setTimeout(() => searchRef.current?.focus(), 50);
        return;
      }

      if (!showGlobalSearch) return;

      if (e.key === 'Escape') {
        e.preventDefault();
        setShowGlobalSearch(false);
        setGlobalSearchQuery('');
        return;
      }

      if (flatResults.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev < flatResults.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : flatResults.length - 1));
        } else if (e.key === 'Enter') {
          e.preventDefault();
          if (flatResults[selectedIndex]) {
            flatResults[selectedIndex].select();
          }
        }
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [showGlobalSearch, flatResults, selectedIndex]);

  const categoryMap: Record<string, { icon: React.ReactNode; color: string }> = {
    network: { icon: <Users size={13} />, color: '#1B2B4B' },
    auctions: { icon: <Gavel size={13} />, color: '#1B2B4B' },
    bids: { icon: <Gavel size={13} />, color: '#1B2B4B' },
    chat: { icon: <MessageSquare size={13} />, color: '#1B2B4B' },
    feeds: { icon: <Globe2 size={13} />, color: '#1B2B4B' },
    jobs: { icon: <Briefcase size={13} />, color: '#1B2B4B' },
    system: { icon: <Bell size={13} />, color: '#1B2B4B' },
    subscription: { icon: <Users size={13} />, color: '#1B2B4B' },
  };

  const categories = ['network', 'auctions', 'bids', 'chat', 'feeds', 'jobs', 'system'] as const;

  let runningItemIndex = 0;

  return (
    <>
      {/* Global Search Command Palette Modal */}
      {showGlobalSearch && (
        <div
          className="global-search-overlay"
          onClick={() => {
            setShowGlobalSearch(false);
            setGlobalSearchQuery('');
          }}
        >
          <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
            {/* Search Input Header */}
            <div className="global-search-input-row">
              <Search size={18} style={{ color: '#47799E', flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search professionals, companies, rates, auctions, jobs, topics…"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                autoFocus
              />
              {globalSearchQuery && (
                <button
                  type="button"
                  onClick={() => {
                    setGlobalSearchQuery('');
                    searchRef.current?.focus();
                  }}
                  title="Clear search"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: '#64748B', display: 'flex', alignItems: 'center' }}
                >
                  <X size={15} />
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setShowGlobalSearch(false);
                  setGlobalSearchQuery('');
                }}
                title="Close search (Esc)"
                style={{
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  borderRadius: '4px',
                  padding: '2px 7px',
                  fontSize: '11px',
                  fontWeight: 700,
                  color: '#475569',
                  cursor: 'pointer',
                  fontFamily: 'monospace',
                }}
              >
                ESC
              </button>
            </div>

            {/* Search Results Body */}
            <div className="global-search-body">
              {globalSearchQuery.length < 2 ? (
                <div>
                  {/* Recent Searches */}
                  {globalSearchHistory.length > 0 && (
                    <div style={{ marginBottom: '14px', paddingBottom: '12px', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', padding: '0 4px' }}>
                        <span className="gs-section-label" style={{ margin: 0, border: 'none', padding: 0 }}>
                          <Clock size={11} /> Recent Searches
                        </span>
                        <button
                          type="button"
                          onClick={clearAllGlobalHistory}
                          style={{
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            fontSize: '11px',
                            color: '#1B2B4B',
                            fontWeight: 700,
                          }}
                        >
                          Clear all
                        </button>
                      </div>
                      <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', padding: '0 4px' }}>
                        {globalSearchHistory.map((item) => (
                          <span
                            key={item.id}
                            onClick={() => setGlobalSearchQuery(item.query)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '6px',
                              padding: '4px 9px',
                              borderRadius: '12px',
                              background: '#F8FAFC',
                              fontSize: '11px',
                              color: '#1B2B4B',
                              cursor: 'pointer',
                              border: '1px solid #CBD5E1',
                              fontWeight: 600,
                              userSelect: 'none',
                            }}
                          >
                            <span>{item.query}</span>
                            <button
                              type="button"
                              onClick={(e) => removeGlobalHistoryItem(e, item.id)}
                              title="Remove from history"
                              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#94A3B8', display: 'flex' }}
                            >
                              <X size={11} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Core Navigation Shortcuts */}
                  <div className="gs-section">
                    <div className="gs-section-label">
                      <Layers size={11} /> Application Modules & Workspaces
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '6px' }}>
                      {CORE_MODULES.slice(0, 6).map((mod) => (
                        <Link
                          key={mod.id}
                          href={mod.href}
                          className="gs-result-item"
                          onClick={() => {
                            setShowGlobalSearch(false);
                            setGlobalSearchQuery('');
                          }}
                        >
                          <span className="gs-icon">{mod.icon}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 700, fontSize: '12px', color: '#1B2B4B' }}>{mod.name}</div>
                            <small style={{ color: '#64748B', fontSize: '10.5px' }}>{mod.desc}</small>
                          </div>
                          <ChevronRight size={13} color="#94A3B8" />
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div style={{ padding: '16px 14px 6px', fontSize: '11.5px', color: '#64748B', textAlign: 'center' }}>
                    Type at least 2 characters to search across People, Companies, Rates, Auctions, Jobs & Discussions
                  </div>
                </div>
              ) : totalResultsCount === 0 ? (
                <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B', fontSize: '12px' }}>
                  <Search size={26} style={{ display: 'block', margin: '0 auto 10px', opacity: 0.35, color: '#47799E' }} />
                  <b style={{ color: '#1B2B4B', fontSize: '13px' }}>No records matching &ldquo;{globalSearchQuery}&rdquo;</b>
                  <br />
                  <small style={{ fontSize: '11.5px', color: '#64748B', display: 'block', marginTop: '4px' }}>
                    Try searching by Person Name, Company, Port UN/LOCODE (INNSA, NLRTM), Ocean Carrier, or Job Title.
                  </small>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  {/* CATEGORY 1: APPLICATION MODULES */}
                  {matchedModules.length > 0 && (
                    <div className="gs-section">
                      <div className="gs-section-label">
                        <Layers size={11} /> Application Modules ({matchedModules.length})
                      </div>
                      {matchedModules.map((m) => {
                        const itemIdx = runningItemIndex++;
                        const isSelected = selectedIndex === itemIdx;
                        return (
                          <div
                            key={m.id}
                            className={`gs-result-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              router.push(m.href);
                              setShowGlobalSearch(false);
                              setGlobalSearchQuery('');
                            }}
                          >
                            <span className="gs-icon">{m.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#1B2B4B' }}>{m.name}</div>
                              <small style={{ color: '#64748B', fontSize: '11px' }}>{m.desc}</small>
                            </div>
                            <span className="gs-action-btn view">
                              Open <ArrowRight size={10} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CATEGORY 2: CONNECTION REQUESTS */}
                  {displayIncoming.length > 0 && (
                    <div className="gs-section">
                      <div className="gs-section-label" style={{ color: '#15803D' }}>
                        <UserPlus size={11} color="#15803D" /> Connection Requests ({displayIncoming.length})
                      </div>
                      {displayIncoming.map((p) => {
                        const itemIdx = runningItemIndex++;
                        const isSelected = selectedIndex === itemIdx;
                        const pName = resolveDisplayName(p);
                        return (
                          <div
                            key={p.uid}
                            className={`gs-result-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              setPreviewPassportUid(p.uid);
                              setShowGlobalSearch(false);
                            }}
                          >
                            <span className="gs-icon" style={{ background: '#DCFCE7', color: '#15803D' }}>
                              <UserPlus size={14} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#1B2B4B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>{pName}</span>
                                {p.hasGoldenTick && <GoldenTick size={13} />}
                                <span style={{ color: '#64748B', fontWeight: 500 }}>· {p.company}</span>
                              </div>
                              <small style={{ color: '#64748B', fontSize: '11px' }}>
                                {p.designation} · {p.city}, {p.country}
                              </small>
                            </div>
                            <button
                              type="button"
                              className="gs-action-btn accept"
                              onClick={(e) => handleAcceptRequest(e, p)}
                              disabled={acceptingUid === p.uid}
                            >
                              {acceptingUid === p.uid ? <Loader2 size={11} className="animate-spin" /> : <Check size={11} />}
                              Accept Request
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CATEGORY 3: MY CONNECTIONS */}
                  {displayConnections.length > 0 && (
                    <div className="gs-section">
                      <div className="gs-section-label" style={{ color: '#0284C7' }}>
                        <UserCheck size={11} color="#0284C7" /> My Connections ({displayConnections.length})
                      </div>
                      {displayConnections.map((p) => {
                        const itemIdx = runningItemIndex++;
                        const isSelected = selectedIndex === itemIdx;
                        const pName = resolveDisplayName(p);
                        return (
                          <div
                            key={p.uid}
                            className={`gs-result-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              setPreviewPassportUid(p.uid);
                              setShowGlobalSearch(false);
                            }}
                          >
                            <span className="gs-icon" style={{ background: '#E0F2FE', color: '#0284C7' }}>
                              <UserCheck size={14} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#1B2B4B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>{pName}</span>
                                {p.hasGoldenTick && <GoldenTick size={13} />}
                                <span style={{ color: '#64748B', fontWeight: 500 }}>· {p.company}</span>
                              </div>
                              <small style={{ color: '#64748B', fontSize: '11px' }}>
                                {p.designation} · {p.city}, {p.country}
                              </small>
                            </div>
                            <button
                              type="button"
                              className="gs-action-btn connected"
                              onClick={(e) => {
                                e.stopPropagation();
                                openChatWith(p.uid, undefined, { name: pName, company: p.company });
                                setShowGlobalSearch(false);
                              }}
                              title="Open direct trade conversation"
                            >
                              <MessageCircle size={11} /> Message
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CATEGORY 4: PEOPLE & PROFESSIONALS */}
                  {displayPeople.length > 0 && (
                    <div className="gs-section">
                      <div className="gs-section-label">
                        <Users size={11} /> People & Professionals ({displayPeople.length})
                      </div>
                      {displayPeople.map((p) => {
                        const itemIdx = runningItemIndex++;
                        const isSelected = selectedIndex === itemIdx;
                        const pName = resolveDisplayName(p);
                        return (
                          <div
                            key={p.uid}
                            className={`gs-result-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              setPreviewPassportUid(p.uid);
                              setShowGlobalSearch(false);
                            }}
                          >
                            <UserAvatar
                              name={pName}
                              avatarUrl={p.avatarUrl}
                              companyLogoUrl={p.companyLogoUrl}
                              companyName={p.company}
                              size={28}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#1B2B4B', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span>{pName}</span>
                                {p.hasGoldenTick && <GoldenTick size={13} />}
                                <span style={{ color: '#64748B', fontWeight: 500 }}>· {p.company}</span>
                              </div>
                              <small style={{ color: '#64748B', fontSize: '11px' }}>
                                {p.designation} · {p.city}, {p.country}
                              </small>
                            </div>
                            {p.connectionStatus === 'pending_sent' ? (
                              <span className="gs-action-btn pending">
                                <Clock size={11} /> Pending
                              </span>
                            ) : (
                              <button
                                type="button"
                                className="gs-action-btn connect"
                                onClick={(e) => handleSendConnect(e, p)}
                                disabled={connectingUid === p.uid}
                              >
                                {connectingUid === p.uid ? <Loader2 size={11} className="animate-spin" /> : <UserPlus size={11} />}
                                Connect
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CATEGORY 5: COMPANIES & ORGANIZATIONS */}
                  {matchedCompanies.length > 0 && (
                    <div className="gs-section">
                      <div className="gs-section-label">
                        <Building2 size={11} /> Companies & Organizations ({matchedCompanies.length})
                      </div>
                      {matchedCompanies.map((c) => {
                        const itemIdx = runningItemIndex++;
                        const isSelected = selectedIndex === itemIdx;
                        return (
                          <div
                            key={c.id}
                            className={`gs-result-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              router.push(`/network?company=${encodeURIComponent(c.name)}`);
                              setShowGlobalSearch(false);
                              setGlobalSearchQuery('');
                            }}
                          >
                            <span className="gs-icon" style={{ background: '#F8FAFC', color: '#1B2B4B' }}>
                              <Building2 size={14} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#1B2B4B' }}>{c.name}</div>
                              <small style={{ color: '#64748B', fontSize: '11px' }}>
                                {c.type} · 📍 {c.location}
                              </small>
                            </div>
                            <span className="gs-action-btn view">
                              View Directory <ArrowRight size={10} />
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CATEGORY 6: FREIGHT RATES */}
                  {matchedRates.length > 0 && (
                    <div className="gs-section">
                      <div className="gs-section-label">
                        <BarChart3 size={11} /> Freight Rates ({matchedRates.length})
                      </div>
                      {matchedRates.map((r) => {
                        const itemIdx = runningItemIndex++;
                        const isSelected = selectedIndex === itemIdx;
                        return (
                          <div
                            key={r.id}
                            className={`gs-result-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              router.push('/rates');
                              setShowGlobalSearch(false);
                              setGlobalSearchQuery('');
                            }}
                          >
                            <span className="gs-icon" style={{ color: '#0D9488' }}>
                              <BarChart3 size={14} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#1B2B4B' }}>
                                {r.carrier} ({r.sp}) · 40HC: ${r.h40 || (r as any).rate40 || '—'} USD
                              </div>
                              <small style={{ color: '#64748B', fontSize: '11px' }}>
                                POL: {r.pol} → POD: {r.pod} · Valid till: {r.valid || 'Spot Validity'}
                              </small>
                            </div>
                            <span className="gs-action-btn view">Rate Matrix</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CATEGORY 7: REVERSE AUCTIONS */}
                  {matchedAuctions.length > 0 && (
                    <div className="gs-section">
                      <div className="gs-section-label">
                        <Gavel size={11} /> Reverse Auctions ({matchedAuctions.length})
                      </div>
                      {matchedAuctions.map((a) => {
                        const itemIdx = runningItemIndex++;
                        const isSelected = selectedIndex === itemIdx;
                        return (
                          <div
                            key={a.id}
                            className={`gs-result-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              router.push(`/auctions/${a.id}`);
                              setShowGlobalSearch(false);
                              setGlobalSearchQuery('');
                            }}
                          >
                            <span className="gs-icon" style={{ color: '#1B2B4B' }}>
                              <Gavel size={14} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#1B2B4B' }}>
                                {a.id} · {a.title}
                              </div>
                              <small style={{ color: '#64748B', fontSize: '11px' }}>
                                {a.shipment?.pol} → {a.shipment?.pod} · Commodity: {a.shipment?.commodity || 'General Cargo'} · Status: {a.status}
                              </small>
                            </div>
                            <span className="gs-action-btn view">Live Room</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CATEGORY 8: JOBS & CAREERS */}
                  {matchedJobs.length > 0 && (
                    <div className="gs-section">
                      <div className="gs-section-label">
                        <Briefcase size={11} /> Trade Careers & Jobs ({matchedJobs.length})
                      </div>
                      {matchedJobs.map((j) => {
                        const itemIdx = runningItemIndex++;
                        const isSelected = selectedIndex === itemIdx;
                        return (
                          <div
                            key={j.id}
                            className={`gs-result-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              router.push('/jobs');
                              setShowGlobalSearch(false);
                              setGlobalSearchQuery('');
                            }}
                          >
                            <span className="gs-icon" style={{ color: '#0891B2' }}>
                              <Briefcase size={14} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#1B2B4B' }}>
                                {j.title} · {j.company}
                              </div>
                              <small style={{ color: '#64748B', fontSize: '11px' }}>
                                📍 {j.location} · {j.packageDetails}
                              </small>
                            </div>
                            <span className="gs-action-btn view">View Job</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CATEGORY 9: FEEDS & DISCUSSIONS */}
                  {matchedPosts.length > 0 && (
                    <div className="gs-section">
                      <div className="gs-section-label">
                        <MessageSquare size={11} /> Feeds & Discussions ({matchedPosts.length})
                      </div>
                      {matchedPosts.map((p) => {
                        const itemIdx = runningItemIndex++;
                        const isSelected = selectedIndex === itemIdx;
                        return (
                          <div
                            key={p.id}
                            className={`gs-result-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              router.push('/feeds');
                              setShowGlobalSearch(false);
                              setGlobalSearchQuery('');
                            }}
                          >
                            <span className="gs-icon" style={{ color: '#1B2B4B' }}>
                              <MessageSquare size={14} />
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#1B2B4B' }}>
                                {p.author} ({p.authorCompany || 'Trade Member'})
                              </div>
                              <small style={{ color: '#64748B', fontSize: '11px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                {p.text}
                              </small>
                            </div>
                            <span className="gs-action-btn view">Open Feed</span>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* CATEGORY 10: PORTS & TERMINALS */}
                  {matchedLocations.length > 0 && (
                    <div className="gs-section">
                      <div className="gs-section-label">
                        <MapPin size={11} /> Ports & Maritime Terminals ({matchedLocations.length})
                      </div>
                      {matchedLocations.map((l) => {
                        const itemIdx = runningItemIndex++;
                        const isSelected = selectedIndex === itemIdx;
                        return (
                          <div
                            key={l.id}
                            className={`gs-result-item ${isSelected ? 'active' : ''}`}
                            onClick={() => {
                              router.push('/rates');
                              setShowGlobalSearch(false);
                              setGlobalSearchQuery('');
                            }}
                          >
                            <span className="gs-icon" style={{ fontSize: '11px' }}>
                              {getLocationTypeIcon(l.type)}
                            </span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontWeight: 700, fontSize: '12px', color: '#1B2B4B' }}>
                                {l.unLocode} · {l.name}
                              </div>
                              <small style={{ color: '#64748B', fontSize: '11px' }}>
                                {l.country} ({l.region}) · {l.type}
                              </small>
                            </div>
                            <span className="gs-action-btn view">Port Rates</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Keyboard Navigation Footer */}
            <div className="global-search-footer">
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <span><kbd>↑</kbd><kbd>↓</kbd> Navigate</span>
                <span><kbd>↵</kbd> Select</span>
                <span><kbd>Esc</kbd> Close</span>
              </div>
              <div>
                {isSearchingRemote ? (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#47799E' }}>
                    <Loader2 size={11} className="animate-spin" /> Searching network…
                  </span>
                ) : (
                  <span>
                    {totalResultsCount > 0 ? `${totalResultsCount} result${totalResultsCount === 1 ? '' : 's'}` : ''}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <header className="top" style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid #E2E8F0', fontFamily: 'Calibri, Arial, sans-serif', fontSize: '12px' }}>
        {/* Mobile FR8X brand icon linked to homepage */}
        <Link
          href="/"
          className="mobile-brand-icon-link"
          aria-label="FR8X Home"
          title="FR8X Home"
        >
          <img
            src="/FR8X ICON.png"
            alt="FR8X"
            className="mobile-brand-icon-img"
          />
        </Link>

        <div className="crumb">
          <span className="crumb-prefix">Workspace / </span><b>{activePageTitle}</b>
        </div>

        {/* Global Search Trigger */}
        <button
          className="global-search-trigger"
          onClick={() => { setShowGlobalSearch(true); setTimeout(() => searchRef.current?.focus(), 50); }}
          title="Global Search (Ctrl+K)"
        >
          <Search size={13} />
          <span className="search-text">Search…</span>
          <kbd className="search-kbd">⌘K</kbd>
        </button>

        <div className="topright">
          {/* User Availability Status (Live / Away / 2G) */}
          <NetworkStatusPill />

          {/* Location Badge */}
          <span className="country" title={`Location: ${user.city}, ${user.country}`}>
            <MapPin size={13} style={{ color: 'var(--brand)' }} />
            <b className="country-name">{user.city}, {user.country}</b>
          </span>

          {/* Currency Converter */}
          <div style={{ position: 'relative' }}>
            <button
              className="currency-select"
              onClick={() => setShowCurrencyModal(!showCurrencyModal)}
              title="Currency Converter & Workspace Currency"
            >
              <Calculator size={13} />
              <span className="currency-label">CR · {currentCurrency}</span>
              <ChevronDown size={11} className="currency-chevron" />
            </button>

            {showCurrencyModal && (
              <div className="currency-converter-modal">
                <div className="conv-head">
                  <b>Currency Converter</b>
                  <button onClick={() => setShowCurrencyModal(false)} className="close-btn">
                    <X size={13} />
                  </button>
                </div>

                <div className="conv-body">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span className="badge green" style={{ fontSize: '11px', fontWeight: 700 }}>
                      🟢 {isLiveRates ? 'LIVE INTERBANK FEED' : 'FOREX SYNCED'}
                    </span>
                    <span style={{ fontSize: '11px', color: 'var(--mut)' }}>{lastUpdatedTime}</span>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <small style={{ color: 'var(--mut)', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700 }}>
                      Workspace Active Currency
                    </small>
                    <div style={{ display: 'flex', gap: '4px', marginTop: '4px', flexWrap: 'wrap' }}>
                      {Object.keys(availableCurrencies).map((code) => (
                        <button
                          key={code}
                          className={`badge ${currentCurrency === code ? 'blue' : 'grey'}`}
                          onClick={() => setCurrency(code)}
                          style={{ cursor: 'pointer', border: 'none' }}
                        >
                          {code}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="calc-tool-box">
                    {/* Quick Amount Chips */}
                    <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', overflowX: 'auto', paddingBottom: '2px' }}>
                      {[100, 500, 1000, 2500, 5000, 10000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setCalcSourceAmount(amt)}
                          style={{
                            padding: '2px 7px',
                            fontSize: '11px',
                            fontWeight: calcSourceAmount === amt ? 700 : 500,
                            borderRadius: '4px',
                            border: calcSourceAmount === amt ? '1px solid #B7DCC7' : '1px solid #D6E2DA',
                            background: calcSourceAmount === amt ? '#E8F7EF' : '#ffffff',
                            color: calcSourceAmount === amt ? '#12372A' : '#66736D',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {amt >= 1000 ? `${amt / 1000}k` : amt}
                        </button>
                      ))}
                    </div>

                    <div className="calc-row">
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#12372A', display: 'block', marginBottom: '3px' }}>Amount</label>
                        <input
                          type="number"
                          value={calcSourceAmount}
                          onChange={(e) => setCalcSourceAmount(parseFloat(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '6px 10px',
                            height: '34px',
                            fontSize: '11px',
                            fontWeight: 600,
                            borderRadius: '6px',
                            border: '1px solid #D6E2DA',
                            background: '#ffffff',
                            color: '#12372A',
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#12372A', display: 'block', marginBottom: '3px' }}>From</label>
                        <SearchableDropdown
                          options={Object.entries(availableCurrencies).map(([c, info]) => ({
                            value: c,
                            label: `${c} (${info.symbol})`,
                            subLabel: info.name,
                          }))}
                          value={calcSourceCurrency}
                          onChange={setCalcSourceCurrency}
                          searchPlaceholder="Search currency…"
                          maxHeight={160}
                        />
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', margin: '8px 0' }}>
                      <button
                        type="button"
                        onClick={() => {
                          const temp = calcSourceCurrency;
                          setCalcSourceCurrency(calcTargetCurrency);
                          setCalcTargetCurrency(temp);
                        }}
                        className="btn secondary sm"
                        title="Swap currencies"
                        style={{ padding: '3px 12px', fontSize: '11px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                      >
                        <ArrowRightLeft size={11} /> Swap
                      </button>
                    </div>

                    <div className="calc-row">
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#12372A', display: 'block', marginBottom: '3px' }}>Converted Amount</label>
                        <div
                          style={{
                            width: '100%',
                            boxSizing: 'border-box',
                            padding: '0 10px',
                            height: '38px',
                            display: 'flex',
                            alignItems: 'center',
                            background: '#ffffff',
                            border: '1px solid #D6E2DA',
                            borderRadius: '6px',
                            fontWeight: 800,
                            color: '#12372A',
                            fontSize: '11px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {availableCurrencies[calcTargetCurrency]?.symbol || ''} {convertedResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div>
                        <label style={{ fontSize: '11px', fontWeight: 600, color: '#12372A', display: 'block', marginBottom: '3px' }}>To</label>
                        <SearchableDropdown
                          options={Object.entries(availableCurrencies).map(([c, info]) => ({
                            value: c,
                            label: `${c} (${info.symbol})`,
                            subLabel: info.name,
                          }))}
                          value={calcTargetCurrency}
                          onChange={setCalcTargetCurrency}
                          searchPlaceholder="Search currency…"
                          maxHeight={160}
                        />
                      </div>
                    </div>

                    {/* Live Reciprocal & Calculation Options */}
                    <div style={{ background: '#ffffff', border: '1px solid #D6E2DA', borderRadius: '6px', padding: '6px 8px', marginTop: '8px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--fr8x-text)' }}>
                        <span>Direct: <b>1 {calcSourceCurrency} = {directRate.toFixed(4)} {calcTargetCurrency}</b></span>
                        <span>Inverse: <b>1 {calcTargetCurrency} = {(1 / (directRate || 1)).toFixed(4)} {calcSourceCurrency}</b></span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px', paddingTop: '4px', borderTop: '1px solid #E3ECE7' }}>
                        <span style={{ fontSize: '11px', color: 'var(--mut)' }}>
                          Live Forex Rate · Real-time Interbank Feed
                        </span>
                        <button
                          type="button"
                          onClick={() => refreshLiveRates()}
                          style={{ fontSize: '11px', color: 'var(--brand)', textDecoration: 'underline', cursor: 'pointer', background: 'none', border: 'none', padding: 0 }}
                        >
                          Sync Now
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Notifications Hub */}
          <div style={{ position: 'relative' }}>
            <button
              className="topicon"
              onClick={async () => {
                const nextState = !showNotifications;
                setShowNotifications(nextState);
                setShowUserDropdown(false);
                setShowCurrencyModal(false);
                if (nextState) {
                  setIsSyncingNotifs(true);
                  try {
                    await refreshNotifications();
                  } finally {
                    setIsSyncingNotifs(false);
                  }
                }
              }}
              aria-label="View notifications"
              title="Notifications"
            >
              <Bell size={15} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-3px',
                    minWidth: '16px',
                    height: '16px',
                    padding: '0 4px',
                    borderRadius: '8px',
                    background: '#E53E3E', color: '#ffffff',
                    fontSize: '11px',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                    border: '1.5px solid #ffffff',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                  }}
                >
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notif-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <b style={{ fontSize: '11px' }}>Notifications</b>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '11px',
                        color: '#12372A', background: '#E8F7EF',
                        border: '1px solid #B7DCC7',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontWeight: 700,
                      }}
                      title="Direct PostgreSQL Realtime & Database Connection Active"
                    >
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: '#1B2B4B',
                          display: 'inline-block',
                          animation: 'pulse 1.8s infinite',
                        }}
                      />
                      Live
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={async () => {
                        setIsSyncingNotifs(true);
                        try {
                          await refreshNotifications();
                        } finally {
                          setIsSyncingNotifs(false);
                        }
                      }}
                      title="Sync notifications"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        fontSize: '11px',
                        color: 'var(--brand)',
                        fontWeight: 600,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: '4px',
                      }}
                    >
                      <RefreshCw size={11} className={isSyncingNotifs ? 'spin' : ''} />
                      {isSyncingNotifs ? 'Syncing…' : 'Sync'}
                    </button>
                    {unreadCount > 0 && (
                      <span className="badge blue" style={{ fontSize: '11px' }}>{unreadCount} Unread</span>
                    )}
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsRead()}
                        title="Mark all as read"
                        style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: 'var(--brand)', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <CheckCheck size={12} /> All Read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={() => clearAllNotifications()}
                        title="Clear all notifications"
                        style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#12372A', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} /> Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Category tabs */}
                <div className="notif-cats">
                  {categories.map((cat) => {
                    const count = notifications.filter((n) => n.category === cat && !n.read).length;
                    return (
                      <div key={cat} className="notif-cat-pill" title={cat.charAt(0).toUpperCase() + cat.slice(1)}>
                        <span style={{ color: categoryMap[cat]?.color }}>{categoryMap[cat]?.icon}</span>
                        {count > 0 && <span className="notif-cat-count">{count}</span>}
                      </div>
                    );
                  })}
                </div>

                <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--mut)', fontSize: '11px' }}>
                      No notifications yet
                    </div>
                  ) : (
                    notifications.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item ${!n.read ? 'unread' : ''}`}
                        onClick={() => markNotificationRead(n.id)}
                        style={{ cursor: 'pointer' }}
                      >
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <span style={{ color: categoryMap[n.category]?.color, flexShrink: 0, marginTop: '2px' }}>
                            {categoryMap[n.category]?.icon}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <b style={{ fontSize: '11.5px', display: 'block', color: 'var(--ink)' }}>{n.title}</b>
                            <p style={{ fontSize: '11px', color: 'var(--mut)', margin: '2px 0 0', lineHeight: '1.4' }}>{n.desc}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <small style={{ fontSize: '11px', color: 'var(--faint)' }}>{n.time}</small>
                              {n.actionLabel && n.targetUrl && (
                                <Link
                                  href={n.targetUrl.startsWith('/connections') ? n.targetUrl.replace('/connections', '/network') : n.targetUrl.startsWith('/people') ? n.targetUrl.replace('/people', '/network') : n.targetUrl}
                                  className="badge blue"
                                  style={{ fontSize: '11px' }}
                                  onClick={() => setShowNotifications(false)}
                                >
                                  {n.actionLabel}
                                </Link>
                              )}
                            </div>
                          </div>
                          {!n.read && <span className="notif-unread-dot" />}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(n.id);
                            }}
                            title="Dismiss notification"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: 'var(--mut)', flexShrink: 0, opacity: 0.6 }}
                            className="hover:opacity-100 hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid var(--border)', background: 'var(--bg-faint)' }}>
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifications(false)}
                    style={{ fontSize: '11px', color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}
                  >
                    Open Notification Center →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowUserDropdown(!showUserDropdown); setShowNotifications(false); setShowCurrencyModal(false); }}
              className="user-top-btn"
              style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <UserAvatar user={user} size={22} />
              <span className="user-name-text">{user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User'}</span>
              {user?.hasGoldenTick && <GoldenTick />}
              <ChevronDown size={13} style={{ color: 'var(--mut)' }} className="user-chevron" />
            </button>

            {showUserDropdown && (
              <div className="user-dropdown-menu" style={{ width: '250px', padding: '0', background: '#ffffff', border: '1px solid #E2E8F0' }}>
                <div style={{ padding: '12px 14px', borderBottom: '1px solid #E2E8F0', background: '#F8FAFD', display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <UserAvatar user={user} size={40} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: '11px', display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--fr8x-text)' }}>
                      {user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User'}
                      {user?.hasGoldenTick && <GoldenTick size={13} />}
                    </b>
                    <small style={{ fontSize: '11px', color: 'var(--fr8x-text)', display: 'block', fontWeight: 600, marginTop: '2px' }}>
                      {user.designation}
                    </small>
                    <small style={{ fontSize: '11px', color: 'var(--fr8x-muted)', display: 'block' }}>
                      {user.company}
                    </small>
                    <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                      <span className="badge" style={{ fontSize: '11px', fontWeight: 700 }}>
                        {user.plan.toUpperCase()} PLAN
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: '6px' }}>
                  <Link
                    href="/profile"
                    onClick={() => setShowUserDropdown(false)}
                    className="user-switch-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', fontSize: '11px' }}
                  >
                    <UserIcon size={14} />
                    <span>Freight Passport & Profile</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setShowUserDropdown(false)}
                    className="user-switch-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', fontSize: '11px' }}
                  >
                    <ShieldCheck size={14} />
                    <span>KYC & Accreditations</span>
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setShowUserDropdown(false)}
                    className="user-switch-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', fontSize: '11px' }}
                  >
                    <Settings size={14} />
                    <span>Workspace Preferences</span>
                  </Link>

                  <div style={{ borderTop: '1px solid var(--line-light)', margin: '4px 0' }} />

                  <Link
                    href="/login"
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="user-switch-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', fontSize: '12px', color: '#1B2B4B', fontFamily: 'Calibri, Arial, sans-serif' }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Profile Passport Preview */}
      {previewPassportUid && (
        <ProfilePreviewModal
          isOpen={Boolean(previewPassportUid)}
          onClose={() => setPreviewPassportUid(null)}
          targetUid={previewPassportUid}
        />
      )}
    </>
  );
}
