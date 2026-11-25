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
import { useRouter, usePathname } from 'next/navigation';
import { NavigationIcon } from '@/components/ui/NavigationIcon';
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
  const pathname = usePathname() || '/';
  const { user, allUsers, logout } = useAuth();
  const { currentCurrency, setCurrency, availableCurrencies, isLiveRates, lastUpdatedTime, refreshLiveRates, convertAmount: convertAmountLive } = useCurrency();
  const { notifications, refreshNotifications, markNotificationRead, markAllNotificationsRead, clearNotification, clearAllNotifications, auctions, rates, myRates, jobs, posts, topics, masterLocations, masterCarriers } = useData();

  const [showNetworkModal, setShowNetworkModal] = useState(false);
  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedHub, setSelectedHub] = useState<string>('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotifCategory, setSelectedNotifCategory] = useState<string | null>(null);
  const [isSyncingNotifs, setIsSyncingNotifs] = useState(false);

  const networkRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);
  const currencyRef = useRef<HTMLDivElement>(null);
  const locationRef = useRef<HTMLDivElement>(null);

  const closeAllHeaderMenus = () => {
    setShowNetworkModal(false);
    setShowLocationModal(false);
    setShowCurrencyModal(false);
    setShowNotifications(false);
    setShowUserDropdown(false);
  };

  // Auto-close open dropdown menus on route change
  useEffect(() => {
    closeAllHeaderMenus();
  }, [pathname]);

  // Handle click outside and Escape key to close notifications and menus with strict mutual exclusion
  useEffect(() => {
    const handlePointerDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Node;
      if (networkRef.current && !networkRef.current.contains(target)) {
        setShowNetworkModal(false);
      }
      if (notifRef.current && !notifRef.current.contains(target)) {
        setShowNotifications(false);
      }
      if (userDropdownRef.current && !userDropdownRef.current.contains(target)) {
        setShowUserDropdown(false);
      }
      if (currencyRef.current && !currencyRef.current.contains(target)) {
        setShowCurrencyModal(false);
      }
      if (locationRef.current && !locationRef.current.contains(target)) {
        setShowLocationModal(false);
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeAllHeaderMenus();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('touchstart', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('touchstart', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);
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
                className="close-red-box"
                title="Close search (Esc)"
                aria-label="Close search"
              >
                <X size={14} />
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

      <header className="top" style={{ backgroundColor: 'var(--surface-primary, #FFFFFF)', borderBottom: '1px solid var(--border-subtle, #E5E7EB)', fontFamily: "'Calibri Light', Calibri, Arial, sans-serif", fontSize: '12px', height: '48px', boxSizing: 'border-box' }}>
        {/* Left Section: Logo, Breadcrumbs, Global Search */}
        <div className="top-left-section" style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flexShrink: 1 }}>
          {/* FR8X Application Logo - Visible on Desktop and Mobile */}
          <Link
            href="/"
            className="brand-logo-link mobile-brand-icon-link"
            aria-label="FR8X Home"
            title="FR8X Enterprise Network"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              textDecoration: 'none',
              flexShrink: 0,
            }}
          >
            <img
              src="/ART/LOGOS/logo_primary.svg"
              alt="FR8X"
              style={{ width: '24px', height: '24px', objectFit: 'contain' }}
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = '/ART/LOGOS/logo_primary.png';
                // Fallback alias: /FR8X ICON.png
              }}
            />
            <b className="desktop-only" style={{ fontSize: '13px', fontWeight: 900, color: 'var(--text-primary, #1F2937)', letterSpacing: '0.04em' }}>
              FR8X
            </b>
          </Link>

          {/* Vertical Separator - Desktop */}
          <div className="desktop-only" style={{ width: '1px', height: '18px', background: 'var(--border-subtle, #E5E7EB)', flexShrink: 0 }} />

          {/* Desktop Breadcrumbs */}
          <div className="crumb desktop-only" style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-secondary, #64748B)', whiteSpace: 'nowrap', minWidth: 0 }}>
            <span className="crumb-prefix" style={{ color: 'var(--text-secondary, #64748B)' }}>Workspace / </span>
            <b style={{ color: 'var(--text-primary, #1F2937)', fontWeight: 700 }}>{activePageTitle}</b>
          </div>

          {/* Global Search Trigger */}
          <button
            className="global-search-trigger"
            onClick={() => { setShowGlobalSearch(true); setTimeout(() => searchRef.current?.focus(), 50); }}
            title="Global Search (Ctrl+K)"
            style={{
              height: '32px',
              minWidth: '180px',
              padding: '0 10px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              background: 'var(--surface-primary, #FFFFFF)',
              border: '1px solid var(--border-default, #D9DEE5)',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              color: 'var(--text-secondary, #64748B)',
              boxSizing: 'border-box',
              whiteSpace: 'nowrap',
              transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
            }}
          >
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              <NavigationIcon name="search" size={13} style={{ color: 'var(--text-secondary, #64748B)', flexShrink: 0 }} />
              <span className="search-text" style={{ color: 'var(--text-secondary, #64748B)' }}>Search…</span>
            </div>
            <kbd className="search-kbd desktop-only" style={{ fontSize: '10px', fontWeight: 600, background: 'var(--surface-elevated, #F8FAFC)', border: '1px solid var(--border-default, #D9DEE5)', borderRadius: '4px', padding: '2px 5px', color: 'var(--text-secondary, #64748B)', lineHeight: 1 }}>Ctrl+K</kbd>
          </button>
        </div>

        {/* Mobile Contextual POST/SUBMIT Action */}
        <div className="mobile-only" style={{ marginLeft: 'auto', marginRight: '6px' }}>
          {(() => {
            if (pathname === '/auctions' || pathname.startsWith('/auctions/')) {
              return (
                <Link
                  href="/auctions/create"
                  className="mobile-action-pill"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: '#075B5B',
                    color: '#FFFFFF',
                    padding: '4px 9px',
                    borderRadius: '14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + Tender
                </Link>
              );
            }
            if (pathname === '/rates' || pathname.startsWith('/rates/')) {
              return (
                <button
                  type="button"
                  onClick={() => {
                    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
                      b.textContent?.includes('Show Rates Editor') || b.textContent?.includes('Add New Rate')
                    );
                    if (btn) {
                      btn.click();
                      btn.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                  }}
                  className="mobile-action-pill"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: '#075B5B',
                    color: '#FFFFFF',
                    padding: '4px 9px',
                    borderRadius: '14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + Rate
                </button>
              );
            }
            if (pathname.startsWith('/network') || pathname.startsWith('/people') || pathname.startsWith('/contacts')) {
              return (
                <button
                  type="button"
                  onClick={() => {
                    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
                      b.textContent?.includes('Add Contact') || b.textContent?.includes('Add New Contact')
                    );
                    if (btn) {
                      btn.click();
                    }
                  }}
                  className="mobile-action-pill"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: '#075B5B',
                    color: '#FFFFFF',
                    padding: '4px 9px',
                    borderRadius: '14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + Contact
                </button>
              );
            }
            if (pathname.startsWith('/jobs')) {
              return (
                <button
                  type="button"
                  onClick={() => {
                    const btn = Array.from(document.querySelectorAll('button')).find((b) =>
                      b.textContent?.includes('Post Job') || b.textContent?.includes('Post a Job')
                    );
                    if (btn) {
                      btn.click();
                    }
                  }}
                  className="mobile-action-pill"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    backgroundColor: '#075B5B',
                    color: '#FFFFFF',
                    padding: '4px 9px',
                    borderRadius: '14px',
                    fontSize: '11px',
                    fontWeight: 700,
                    border: 'none',
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                >
                  + Job
                </button>
              );
            }
            // Default feeds / general
            return (
              <button
                type="button"
                onClick={() => {
                  const el = document.querySelector('textarea, [contenteditable="true"]') as HTMLElement | null;
                  if (el) {
                    el.focus();
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  } else {
                    router.push('/feeds');
                  }
                }}
                className="mobile-action-pill"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#075B5B',
                  color: '#FFFFFF',
                  padding: '4px 9px',
                  borderRadius: '14px',
                  fontSize: '11px',
                  fontWeight: 700,
                  border: 'none',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                }}
              >
                + Post
              </button>
            );
          })()}
        </div>

        <div className="topright" style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0, marginLeft: 'auto' }}>
          {/* User Availability Status - Responsive Shared Component with Mutual Exclusion */}
          <div ref={networkRef} className="top-availability-wrapper" style={{ position: 'relative', flexShrink: 0 }}>
            <NetworkStatusPill
              isOpen={showNetworkModal}
              onToggle={() => {
                const next = !showNetworkModal;
                closeAllHeaderMenus();
                setShowNetworkModal(next);
              }}
              onClose={() => setShowNetworkModal(false)}
            />
          </div>

          {/* Interactive Location Selector - Desktop */}
          <div ref={locationRef} className="desktop-only" style={{ position: 'relative' }}>
            <button
              type="button"
              className="top-location-btn"
              onClick={() => {
                const next = !showLocationModal;
                closeAllHeaderMenus();
                setShowLocationModal(next);
              }}
              title={`Operating Location: ${selectedHub || `${user.city}, ${user.country}`}. Click to switch trade hub`}
              style={{
                height: '30px',
                padding: '0 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--surface-primary, #FFFFFF)',
                border: '1px solid var(--border-default, #D9DEE5)',
                borderRadius: '6px',
                color: 'var(--text-primary, #1F2937)',
                fontSize: '12px',
                fontFamily: "'Calibri Light', Calibri, Arial, sans-serif",
                fontWeight: 600,
                cursor: 'pointer',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <MapPin size={13} style={{ color: 'var(--accent-primary, #006B68)', flexShrink: 0 }} />
              <span className="country-name" style={{ maxWidth: '170px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {selectedHub || `${user.city}, ${user.country}`}
              </span>
              <ChevronDown size={11} style={{ color: 'var(--text-secondary, #64748B)', flexShrink: 0 }} />
            </button>

            {showLocationModal && (
              <>
                <div
                  className="dropdown-backdrop mobile-only"
                  onClick={() => setShowLocationModal(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    top: '50px',
                    backgroundColor: 'rgba(23, 43, 43, 0.15)',
                    backdropFilter: 'blur(1px)',
                    zIndex: 1099,
                  }}
                />
                <div
                  className="location-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '280px',
                    maxWidth: 'calc(100vw - 20px)',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D9E0E8',
                    borderRadius: '8px',
                    boxShadow: '0 12px 28px -5px rgba(23, 43, 43, 0.18), 0 8px 12px -6px rgba(23, 43, 43, 0.10)',
                    zIndex: 1100,
                    overflow: 'hidden',
                    color: '#172B45',
                    fontFamily: "'Calibri Light', Calibri, Arial, sans-serif",
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                >
                <div style={{ padding: '10px 12px', borderBottom: '1px solid #D9E0E8', background: '#F4F6F8', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MapPin size={13} style={{ color: '#075B5B' }} />
                    <b style={{ fontSize: '12px', color: '#172B45' }}>Trade Gateways & Operating Hubs</b>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLocationModal(false)}
                    className="close-red-box"
                    aria-label="Close location selector"
                  >
                    <X size={12} />
                  </button>
                </div>
                <div style={{ padding: '8px 12px', background: '#F4F6F8', borderBottom: '1px solid #D9E0E8', fontSize: '11px', color: '#075B5B' }}>
                  Active Hub: <b>{selectedHub || `${user.city}, ${user.country}`}</b>
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px 0' }}>
                  {[
                    { city: 'Gurugram', region: 'NCR Hub', country: 'India', code: 'DEL-ICD' },
                    { city: 'Mumbai', region: 'Nhava Sheva (JNPT)', country: 'India', code: 'INNSA' },
                    { city: 'Mundra', region: 'Kutch Gateway', country: 'India', code: 'INMUN' },
                    { city: 'Chennai', region: 'Coromandel Hub', country: 'India', code: 'INMAA' },
                    { city: 'Kolkata', region: 'Eastern Gateway', country: 'India', code: 'INCCU' },
                    { city: 'Pipavav', region: 'Gujarat Maritime', country: 'India', code: 'INPAV' },
                    { city: 'Tuticorin', region: 'V.O.C. Port', country: 'India', code: 'INTUT' },
                    { city: 'Dubai', region: 'Jebel Ali Port', country: 'UAE', code: 'AEJEA' },
                    { city: 'Singapore', region: 'Jurong Gateway', country: 'Singapore', code: 'SGSIN' },
                  ].map((hub) => {
                    const label = `${hub.city} (${hub.region}), ${hub.country}`;
                    const isCurrent = (selectedHub || `${user.city}, ${user.country}`) === label || (!selectedHub && hub.city === user.city);
                    return (
                      <button
                        key={hub.code}
                        type="button"
                        onClick={() => {
                          setSelectedHub(label);
                          setShowLocationModal(false);
                          toast(`Operating gateway switched to ${hub.city} [${hub.code}].`);
                        }}
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '7px 12px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          background: isCurrent ? '#F4F6F8' : '#FFFFFF',
                          border: 'none',
                          cursor: 'pointer',
                          fontSize: '11.5px',
                          color: '#172B45',
                          transition: 'background-color 0.1s ease',
                        }}
                      >
                        <div>
                          <b style={{ color: '#172B45', display: 'block' }}>{hub.city} · {hub.region}</b>
                          <span style={{ fontSize: '10.5px', color: '#526174' }}>{hub.country} · Gateway {hub.code}</span>
                        </div>
                        {isCurrent && <Check size={13} style={{ color: '#16834A', flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
                <div style={{ padding: '6px 12px', borderTop: '1px solid #D9E0E8', background: '#F4F6F8', textAlign: 'center' }}>
                  <span style={{ fontSize: '10.5px', color: '#526174' }}>Auto-synced with user freight passport</span>
                </div>
              </div>
              </>
            )}
          </div>

          {/* Currency Converter - Desktop */}
          <div ref={currencyRef} className="desktop-only" style={{ position: 'relative' }}>
            <button
              className="currency-select"
              onClick={() => {
                const next = !showCurrencyModal;
                closeAllHeaderMenus();
                setShowCurrencyModal(next);
              }}
              title="Currency Converter & Workspace Currency"
              style={{
                height: '30px',
                padding: '0 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                background: 'var(--surface-primary, #FFFFFF)',
                border: '1px solid var(--border-default, #D9DEE5)',
                borderRadius: '6px',
                color: 'var(--text-primary, #1F2937)',
                fontSize: '12px',
                fontFamily: "'Calibri Light', Calibri, Arial, sans-serif",
                fontWeight: 600,
                cursor: 'pointer',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <Calculator size={13} style={{ color: 'var(--accent-primary, #006B68)', flexShrink: 0 }} />
              <span className="currency-label">CR · {currentCurrency}</span>
              <ChevronDown size={11} className="currency-chevron" style={{ color: 'var(--text-secondary, #64748B)', flexShrink: 0 }} />
            </button>

            {showCurrencyModal && (
              <>
                <div
                  className="dropdown-backdrop mobile-only"
                  onClick={() => setShowCurrencyModal(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    top: '50px',
                    backgroundColor: 'rgba(23, 43, 43, 0.15)',
                    backdropFilter: 'blur(1px)',
                    zIndex: 1099,
                  }}
                />
                <div
                  className="currency-converter-modal"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '340px',
                    maxWidth: 'calc(100vw - 20px)',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D9E0E8',
                    borderRadius: '8px',
                    boxShadow: '0 12px 28px -5px rgba(23, 43, 43, 0.18), 0 8px 12px -6px rgba(23, 43, 43, 0.10)',
                    zIndex: 1100,
                    overflow: 'hidden',
                    color: '#172B45',
                    fontFamily: "'Calibri Light', Calibri, Arial, sans-serif",
                    fontSize: '12px',
                    boxSizing: 'border-box',
                  }}
                >
                  <div className="conv-head">
                    <b>Currency Converter</b>
                    <button onClick={() => setShowCurrencyModal(false)} className="close-btn close-red-box sm" aria-label="Close currency converter" title="Close">
                      <X size={10} />
                    </button>
                  </div>

                <div className="conv-body" style={{ padding: '12px' }}>
                  {/* Live Feed Status Bar & Sync Control */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', background: '#F8FAF9', padding: '6px 8px', borderRadius: '5px', border: '1px solid #F4F6F8' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <span className="badge green" style={{ fontSize: '10.5px', fontWeight: 700, padding: '2px 6px' }}>
                        🟢 {isLiveRates ? 'LIVE INTERBANK FEED' : 'FOREX SYNCED'}
                      </span>
                      <span style={{ fontSize: '10.5px', color: '#526174' }}>{lastUpdatedTime}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => refreshLiveRates()}
                      style={{
                        fontSize: '10.5px',
                        color: '#075B5B',
                        fontWeight: 700,
                        cursor: 'pointer',
                        background: 'none',
                        border: 'none',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px',
                        padding: 0,
                      }}
                      title="Refresh interbank exchange rates"
                    >
                      <RefreshCw size={10} /> Sync
                    </button>
                  </div>

                  {/* Curated Quick Workspace Currency Shortcuts */}
                  <div style={{ marginBottom: '10px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                      <small style={{ color: '#526174', fontSize: '11px', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.03em' }}>
                        Workspace Currency
                      </small>
                      <span style={{ fontSize: '10.5px', color: '#075B5B', fontWeight: 700 }}>
                        Active: {currentCurrency}
                      </span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '5px' }}>
                      {['INR', 'USD', 'EUR', 'GBP', 'AED'].map((code) => {
                        const isCur = currentCurrency === code;
                        return (
                          <button
                            key={code}
                            type="button"
                            onClick={() => setCurrency(code)}
                            title={`Set workspace active currency to ${code}`}
                            style={{
                              padding: '5px 0',
                              fontSize: '11px',
                              fontWeight: isCur ? 800 : 600,
                              borderRadius: '5px',
                              border: isCur ? '1.5px solid #075B5B' : '1px solid #D9E0E8',
                              background: isCur ? '#075B5B' : '#FFFFFF',
                              color: isCur ? '#FFFFFF' : '#172B45',
                              cursor: 'pointer',
                              transition: 'all 0.15s ease',
                              textAlign: 'center',
                            }}
                          >
                            {code}
                          </button>
                        );
                      })}
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
              </>
            )}
          </div>

          {/* Notifications Hub */}
          <div ref={notifRef} style={{ position: 'relative' }}>
            <button
              className="topicon"
              onClick={async () => {
                const nextState = !showNotifications;
                closeAllHeaderMenus();
                setShowNotifications(nextState);
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
              style={{
                height: '30px',
                width: '32px',
                padding: 0,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: showNotifications ? 'var(--surface-elevated, #F8FAFC)' : 'var(--surface-primary, #FFFFFF)',
                border: showNotifications ? '1.5px solid var(--accent-primary, #006B68)' : '1px solid var(--border-default, #D9DEE5)',
                borderRadius: '6px',
                cursor: 'pointer',
                position: 'relative',
                boxSizing: 'border-box',
                transition: 'all 0.15s ease',
              }}
            >
              <NavigationIcon name="notifications" filled={unreadCount > 0} size={15} style={{ color: unreadCount > 0 ? 'var(--accent-primary, #006B68)' : 'var(--text-secondary, #64748B)' }} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-3px',
                    right: '-3px',
                    minWidth: '15px',
                    height: '15px',
                    padding: '0 3px',
                    borderRadius: '8px',
                    background: '#C0392B',
                    color: '#ffffff',
                    fontSize: '10px',
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

            {/* Mobile Backdrop to prevent background clicks and close on outside tap */}
            {showNotifications && (
              <div
                className="dropdown-backdrop mobile-only"
                onClick={() => setShowNotifications(false)}
                style={{
                  position: 'fixed',
                  inset: 0,
                  top: '50px',
                  backgroundColor: 'rgba(23, 43, 43, 0.15)',
                  backdropFilter: 'blur(1px)',
                  zIndex: 1099,
                }}
              />
            )}

            {showNotifications && (
              <div
                className="notifications-dropdown"
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 6px)',
                  right: 0,
                  width: '380px',
                  maxWidth: 'calc(100vw - 20px)',
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #D9E0E8',
                  borderRadius: '8px',
                  boxShadow: '0 12px 28px -5px rgba(23, 43, 43, 0.18), 0 8px 12px -6px rgba(23, 43, 43, 0.10)',
                  zIndex: 1100,
                  overflow: 'hidden',
                  color: '#172B45',
                  fontFamily: "'Calibri Light', Calibri, Arial, sans-serif",
                  fontSize: '12px',
                  boxSizing: 'border-box',
                }}
              >
                <div
                  className="notif-header"
                  style={{
                    padding: '10px 14px',
                    borderBottom: '1px solid #D9E0E8',
                    background: '#F4F6F8',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <b style={{ fontSize: '13px', color: '#172B45' }}>Notifications</b>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '4px',
                        fontSize: '10px',
                        color: '#16834A',
                        background: '#FFFFFF',
                        border: '1px solid #D9E0E8',
                        padding: '1px 6px',
                        borderRadius: '10px',
                        fontWeight: 700,
                      }}
                      title="Direct PostgreSQL Realtime Connection Active"
                    >
                      <span
                        style={{
                          width: '5px',
                          height: '5px',
                          borderRadius: '50%',
                          background: '#16834A',
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
                        color: '#075B5B',
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
                      <span className="badge blue" style={{ fontSize: '11px', background: '#075B5B', color: '#FFFFFF' }}>{unreadCount} Unread</span>
                    )}
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsRead()}
                        title="Mark all as read"
                        style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#075B5B', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <CheckCheck size={12} /> All Read
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button
                        onClick={() => clearAllNotifications()}
                        title="Clear all notifications"
                        style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px', color: '#526174', fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} /> Clear All
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="close-red-box sm"
                      aria-label="Close notifications"
                      title="Close notifications"
                      style={{ marginLeft: '4px' }}
                    >
                      <X size={10} />
                    </button>
                  </div>
                </div>

                {/* Category navigation: Responsive compact 4-column grid (zero horizontal overflow, no clipping) */}
                <div
                  className="notif-cats"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '4px',
                    padding: '8px 10px',
                    borderBottom: '1px solid #D9E0E8',
                    background: '#FFFFFF',
                    boxSizing: 'border-box',
                    width: '100%',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedNotifCategory(null)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px',
                      padding: '4px 6px',
                      borderRadius: '5px',
                      background: selectedNotifCategory === null ? '#075B5B' : '#F4F6F8',
                      color: selectedNotifCategory === null ? '#FFFFFF' : '#172B45',
                      border: selectedNotifCategory === null ? '1px solid #075B5B' : '1px solid #D9E0E8',
                      fontSize: '11px',
                      fontWeight: selectedNotifCategory === null ? 700 : 600,
                      cursor: 'pointer',
                      lineHeight: 1,
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                      boxSizing: 'border-box',
                      minHeight: '26px',
                    }}
                  >
                    <span>All ({notifications.length})</span>
                  </button>
                  {categories.map((cat) => {
                    const count = notifications.filter((n) => n.category === cat && !n.read).length;
                    const isSelected = selectedNotifCategory === cat;
                    return (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setSelectedNotifCategory(isSelected ? null : cat)}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '3px',
                          padding: '4px 6px',
                          borderRadius: '5px',
                          background: isSelected ? '#075B5B' : '#F4F6F8',
                          color: isSelected ? '#FFFFFF' : '#172B45',
                          border: isSelected ? '1px solid #075B5B' : '1px solid #D9E0E8',
                          fontSize: '11px',
                          fontWeight: isSelected ? 700 : 600,
                          cursor: 'pointer',
                          lineHeight: 1,
                          textTransform: 'capitalize',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                          overflow: 'hidden',
                          boxSizing: 'border-box',
                          minHeight: '26px',
                        }}
                        title={cat.charAt(0).toUpperCase() + cat.slice(1)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', color: isSelected ? '#FFFFFF' : '#075B5B', flexShrink: 0 }}>
                          {categoryMap[cat]?.icon}
                        </span>
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{cat}</span>
                        {count > 0 && (
                          <span
                            style={{
                              fontSize: '9.5px',
                              fontWeight: 800,
                              background: isSelected ? '#FFFFFF' : '#075B5B',
                              color: isSelected ? '#075B5B' : '#FFFFFF',
                              borderRadius: '8px',
                              padding: '0 4px',
                              minWidth: '13px',
                              textAlign: 'center',
                              lineHeight: '13px',
                              flexShrink: 0,
                            }}
                          >
                            {count}
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>

                <div style={{ maxHeight: '320px', overflowY: 'auto', background: '#FFFFFF' }}>
                  {(() => {
                    const displayed = selectedNotifCategory
                      ? notifications.filter((n) => n.category === selectedNotifCategory)
                      : notifications;

                    if (displayed.length === 0) {
                      return (
                        <div style={{ padding: '36px 16px', textAlign: 'center', color: '#526174', background: '#FFFFFF' }}>
                          <Bell size={24} color="#526174" style={{ margin: '0 auto 8px', display: 'block' }} />
                          <b style={{ color: '#172B45', fontSize: '13px', display: 'block', marginBottom: '2px' }}>
                            {selectedNotifCategory ? `No ${selectedNotifCategory} notifications` : 'No notifications yet'}
                          </b>
                          <span style={{ fontSize: '11.5px', color: '#526174' }}>
                            You&apos;re completely up to date with tenders, rates, and messages.
                          </span>
                        </div>
                      );
                    }

                    return displayed.slice(0, 10).map((n) => (
                      <div
                        key={n.id}
                        className={`notif-item ${!n.read ? 'unread' : ''}`}
                        onClick={() => markNotificationRead(n.id)}
                        style={{ cursor: 'pointer', padding: '10px 14px', borderBottom: '1px solid #D9E0E8', background: !n.read ? '#F4F6F8' : '#FFFFFF', transition: 'background-color 0.15s ease' }}
                      >
                        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                          <span style={{ color: categoryMap[n.category]?.color, flexShrink: 0, marginTop: '2px' }}>
                            {categoryMap[n.category]?.icon}
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <b style={{ fontSize: '11.5px', display: 'block', color: '#172B45' }}>{n.title}</b>
                            <p style={{ fontSize: '11px', color: '#526174', margin: '2px 0 0', lineHeight: '1.4' }}>{n.desc}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <small style={{ fontSize: '11px', color: '#526174' }}>{n.time}</small>
                              {n.actionLabel && n.targetUrl && (
                                <Link
                                  href={n.targetUrl.startsWith('/connections') ? n.targetUrl.replace('/connections', '/network') : n.targetUrl.startsWith('/people') ? n.targetUrl.replace('/people', '/network') : n.targetUrl}
                                  className="badge blue"
                                  style={{ fontSize: '11px', background: '#075B5B', color: '#FFFFFF' }}
                                  onClick={() => setShowNotifications(false)}
                                >
                                  {n.actionLabel}
                                </Link>
                              )}
                            </div>
                          </div>
                          {!n.read && <span className="notif-unread-dot" style={{ backgroundColor: '#075B5B' }} />}
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              clearNotification(n.id);
                            }}
                            title="Dismiss notification"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px', color: '#526174', flexShrink: 0, opacity: 0.6 }}
                            className="hover:opacity-100 hover:text-red-500"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                <div style={{ padding: '8px', textAlign: 'center', borderTop: '1px solid #D9E0E8', background: '#F4F6F8' }}>
                  <Link
                    href="/notifications"
                    onClick={() => setShowNotifications(false)}
                    style={{ fontSize: '11.5px', color: '#075B5B', fontWeight: 700, textDecoration: 'none' }}
                  >
                    Open Notification Center →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div ref={userDropdownRef} style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => {
                const nextState = !showUserDropdown;
                closeAllHeaderMenus();
                setShowUserDropdown(nextState);
              }}
              className="user-top-btn"
              title={`Account: ${user?.displayName || 'User'}`}
              style={{
                height: '30px',
                padding: '0 8px',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                background: showUserDropdown ? 'var(--surface-elevated, #F8FAFC)' : 'var(--surface-primary, #FFFFFF)',
                border: showUserDropdown ? '1.5px solid var(--accent-primary, #006B68)' : '1px solid var(--border-default, #D9DEE5)',
                borderRadius: '6px',
                cursor: 'pointer',
                boxSizing: 'border-box',
                whiteSpace: 'nowrap',
                transition: 'all 0.15s ease',
              }}
            >
              <UserAvatar user={user} size={20} />
              <span className="user-name-text desktop-only" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary, #1F2937)' }}>
                {user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User'}
              </span>
              {user?.hasGoldenTick && <GoldenTick className="desktop-only" size={12} />}
              <ChevronDown size={11} style={{ color: 'var(--text-secondary, #64748B)' }} className="user-chevron desktop-only" />
            </button>

            {showUserDropdown && (
              <>
                <div
                  className="dropdown-backdrop mobile-only"
                  onClick={() => setShowUserDropdown(false)}
                  style={{
                    position: 'fixed',
                    inset: 0,
                    top: '50px',
                    backgroundColor: 'rgba(23, 43, 43, 0.15)',
                    backdropFilter: 'blur(1px)',
                    zIndex: 1099,
                  }}
                />
                <div
                  className="user-dropdown-menu"
                  style={{
                    position: 'absolute',
                    top: 'calc(100% + 6px)',
                    right: 0,
                    width: '260px',
                    maxWidth: 'calc(100vw - 20px)',
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #D9E0E8',
                    borderRadius: '8px',
                    boxShadow: '0 12px 28px -5px rgba(23, 43, 43, 0.18), 0 8px 12px -6px rgba(23, 43, 43, 0.10)',
                    zIndex: 1100,
                    overflow: 'hidden',
                    color: '#172B45',
                    fontFamily: "'Calibri Light', Calibri, Arial, sans-serif",
                    fontSize: '12px',
                    padding: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #D9E0E8', background: '#F4F6F8', display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', minWidth: 0, flex: 1 }}>
                      <UserAvatar user={user} size={36} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: '12px', display: 'flex', alignItems: 'center', gap: '5px', color: '#172B45' }}>
                          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.displayName || `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || user?.email || 'User'}
                          </span>
                          {user?.hasGoldenTick && <GoldenTick size={12} />}
                        </b>
                        <small style={{ fontSize: '11px', color: '#526174', display: 'block', fontWeight: 600, marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user.designation}
                        </small>
                        <small style={{ fontSize: '11px', color: '#526174', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {user?.companyLogoUrl ? (
                            <img
                              src={user.companyLogoUrl}
                              alt={user.company || 'Company Logo'}
                              style={{ width: '13px', height: '13px', objectFit: 'contain', background: 'transparent', flexShrink: 0 }}
                            />
                          ) : (
                            <Building2 size={12} style={{ color: '#075B5B', flexShrink: 0 }} />
                          )}
                          <span>{user.company || 'Enterprise Logistics'}</span>
                        </small>
                        <div style={{ marginTop: '6px', display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <span
                            className="user-plan-badge"
                            style={{
                              fontSize: '10px',
                              fontWeight: 800,
                              background: '#F4F6F8',
                              color: '#075B5B',
                              border: '1px solid #B8D5C8',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              letterSpacing: '0.04em',
                              textTransform: 'uppercase',
                              display: 'inline-flex',
                              alignItems: 'center',
                            }}
                          >
                            {(user?.plan || 'ENTERPRISE').toUpperCase()} PLAN
                          </span>
                          <span
                            style={{
                              fontSize: '10px',
                              fontWeight: 700,
                              background: '#E8F5E9',
                              color: '#15803D',
                              border: '1px solid #C8E6C9',
                              padding: '2px 6px',
                              borderRadius: '4px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '3px',
                            }}
                          >
                            <ShieldCheck size={10} /> VERIFIED
                          </span>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowUserDropdown(false)}
                      className="close-red-box sm"
                      aria-label="Close user profile menu"
                      title="Close"
                      style={{ alignSelf: 'flex-start' }}
                    >
                      <X size={10} />
                    </button>
                  </div>

                <div style={{ padding: '6px' }}>
                  <Link
                    href="/profile"
                    onClick={() => setShowUserDropdown(false)}
                    className="user-switch-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', fontSize: '12px', color: '#172B45', textDecoration: 'none', borderRadius: '4px' }}
                  >
                    <UserIcon size={14} style={{ color: '#075B5B' }} />
                    <span>Freight Passport & Profile</span>
                  </Link>

                  <Link
                    href="/profile"
                    onClick={() => setShowUserDropdown(false)}
                    className="user-switch-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', fontSize: '12px', color: '#172B45', textDecoration: 'none', borderRadius: '4px' }}
                  >
                    <ShieldCheck size={14} style={{ color: '#16834A' }} />
                    <span>KYC & Accreditations</span>
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setShowUserDropdown(false)}
                    className="user-switch-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', fontSize: '12px', color: '#172B45', textDecoration: 'none', borderRadius: '4px' }}
                  >
                    <Settings size={14} style={{ color: '#526174' }} />
                    <span>Workspace Preferences</span>
                  </Link>

                  <div style={{ borderTop: '1px solid #D9E0E8', margin: '4px 0' }} />

                  <Link
                    href="/login"
                    onClick={() => {
                      setShowUserDropdown(false);
                      logout();
                    }}
                    className="user-switch-item"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', fontSize: '12px', color: '#C0392B', textDecoration: 'none', borderRadius: '4px', fontWeight: 600 }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out</span>
                  </Link>
                </div>
              </div>
              </>
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
