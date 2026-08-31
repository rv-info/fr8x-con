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
} from '@/lib/utils';
import Link from 'next/link';
import {
  MapPin,
  Bell,
  ChevronDown,
  Check,
  ArrowRightLeft,
  Calculator,
  X,
  Search,
  Menu,
  Gavel,
  MessageSquare,
  BarChart3,
  Users,
  Globe2,
  Briefcase,
  CheckCheck,
  Anchor,
  Ship,
} from 'lucide-react';

interface TopBarProps {
  activePageTitle: string;
  onMobileMenuClick?: () => void;
}

export function TopBar({ activePageTitle, onMobileMenuClick }: TopBarProps) {
  const { user, allUsers, switchUser } = useAuth();
  const { currentCurrency, setCurrency, availableCurrencies, isLiveRates, lastUpdatedTime, refreshLiveRates } = useCurrency();
  const { notifications, markNotificationRead, markAllNotificationsRead, auctions, rates, myRates, jobs, posts, topics, masterLocations, masterCarriers } = useData();

  const [showCurrencyModal, setShowCurrencyModal] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showGlobalSearch, setShowGlobalSearch] = useState(false);
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');

  const searchRef = useRef<HTMLInputElement>(null);

  // Currency Converter State
  const [calcSourceCurrency, setCalcSourceCurrency] = useState('INR');
  const [calcTargetCurrency, setCalcTargetCurrency] = useState('USD');
  const [calcSourceAmount, setCalcSourceAmount] = useState<number>(1500);

  const convertedResult = convertAmount(calcSourceAmount || 0, calcSourceCurrency, calcTargetCurrency);
  const directRate = convertAmount(1, calcSourceCurrency, calcTargetCurrency);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Live search calculations
  const query = globalSearchQuery.trim().toLowerCase();
  const matchedLocations = query.length >= 2 ? (masterLocations || []).filter((l) => l.unLocode.toLowerCase().includes(query) || l.name.toLowerCase().includes(query) || l.country.toLowerCase().includes(query)).slice(0, 3) : [];
  const matchedCarriers = query.length >= 2 ? (masterCarriers || []).filter((c) => c.name.toLowerCase().includes(query) || c.scacCode.toLowerCase().includes(query) || c.type.toLowerCase().includes(query)).slice(0, 3) : [];
  const matchedAuctions = query.length >= 2 ? auctions.filter((a) => a.title.toLowerCase().includes(query) || a.id.toLowerCase().includes(query) || a.shipment.pol.toLowerCase().includes(query) || a.shipment.pod.toLowerCase().includes(query) || a.shipment.commodity.toLowerCase().includes(query)).slice(0, 3) : [];
  const allRates = [...rates, ...(myRates || [])];
  const matchedRates = query.length >= 2 ? allRates.filter((r) => r.id.toLowerCase().includes(query) || r.carrier.toLowerCase().includes(query) || r.sp.toLowerCase().includes(query) || r.pol.toLowerCase().includes(query) || r.pod.toLowerCase().includes(query)).slice(0, 3) : [];
  const matchedJobs = query.length >= 2 ? jobs.filter((j) => j.title.toLowerCase().includes(query) || j.company.toLowerCase().includes(query) || j.location.toLowerCase().includes(query)).slice(0, 2) : [];
  const matchedPosts = query.length >= 2 ? posts.filter((p) => p.text.toLowerCase().includes(query) || p.author.toLowerCase().includes(query) || (p.authorCompany || '').toLowerCase().includes(query)).slice(0, 2) : [];
  const matchedTopics = query.length >= 2 ? topics.filter((t) => t.title.toLowerCase().includes(query) || t.author.toLowerCase().includes(query) || t.category.toLowerCase().includes(query)).slice(0, 2) : [];
  const matchedUsers = query.length >= 2 ? allUsers.filter((u) => u.displayName.toLowerCase().includes(query) || u.company.toLowerCase().includes(query) || u.email.toLowerCase().includes(query)).slice(0, 2) : [];

  const totalResultsCount = matchedLocations.length + matchedCarriers.length + matchedAuctions.length + matchedRates.length + matchedJobs.length + matchedPosts.length + matchedTopics.length + matchedUsers.length;

  // Keyboard shortcut: Cmd/Ctrl+K for global search
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowGlobalSearch(true);
        setTimeout(() => searchRef.current?.focus(), 50);
      }
      if (e.key === 'Escape') {
        setShowGlobalSearch(false);
        setGlobalSearchQuery('');
      }
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const categoryMap: Record<string, { icon: React.ReactNode; color: string }> = {
    auctions: { icon: <Gavel size={13} />, color: '#1168d7' },
    bids: { icon: <Gavel size={13} />, color: '#099889' },
    chat: { icon: <MessageSquare size={13} />, color: '#7c3aed' },
    feeds: { icon: <Globe2 size={13} />, color: '#059669' },
    jobs: { icon: <Briefcase size={13} />, color: '#d97706' },
    system: { icon: <Bell size={13} />, color: '#64748b' },
    subscription: { icon: <Users size={13} />, color: '#dc2626' },
  };

  // Group notifications by category
  const categories = ['auctions', 'bids', 'chat', 'feeds', 'jobs', 'system'] as const;

  // Quick search results
  const quickSearchLinks = [
    { label: 'Active Auctions', href: '/auctions', icon: <Gavel size={13} /> },
    { label: 'Rate Intelligence', href: '/rates', icon: <BarChart3 size={13} /> },
    { label: 'Nexus Community', href: '/nexus', icon: <Globe2 size={13} /> },
    { label: 'Jobs Board', href: '/jobs', icon: <Briefcase size={13} /> },
  ];

  return (
    <>
      {/* Global Search Modal */}
      {showGlobalSearch && (
        <div className="global-search-overlay" onClick={() => { setShowGlobalSearch(false); setGlobalSearchQuery(''); }}>
          <div className="global-search-modal" onClick={(e) => e.stopPropagation()}>
            <div className="global-search-input-row">
              <Search size={16} style={{ color: 'var(--mut)', flexShrink: 0 }} />
              <input
                ref={searchRef}
                type="text"
                placeholder="Search people, companies, auctions, rates, jobs, posts…"
                value={globalSearchQuery}
                onChange={(e) => setGlobalSearchQuery(e.target.value)}
                autoFocus
              />
              <button onClick={() => { setShowGlobalSearch(false); setGlobalSearchQuery(''); }}>
                <X size={15} />
              </button>
            </div>

            <div className="global-search-body">
              {globalSearchQuery.length < 2 ? (
                <div>
                  <div className="gs-section-label">Quick Navigate</div>
                  {quickSearchLinks.map((link) => (
                    <Link key={link.href} href={link.href} className="gs-result-item" onClick={() => setShowGlobalSearch(false)}>
                      <span className="gs-icon">{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                  <div style={{ padding: '10px 14px', fontSize: '11px', color: 'var(--faint)', textAlign: 'center' }}>
                    Type at least 2 characters to search live across all modules
                  </div>
                </div>
              ) : totalResultsCount === 0 ? (
                <div style={{ padding: '24px 14px', textAlign: 'center', color: 'var(--mut)', fontSize: '12px' }}>
                  <Search size={22} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.35 }} />
                  No records matching &ldquo;{globalSearchQuery}&rdquo;
                  <br />
                  <small style={{ fontSize: '11px', color: 'var(--faint)' }}>Try searching by UN/LOCODE (INNSA, NLRTM), commodity, carrier, or company</small>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {matchedLocations.length > 0 && (
                    <div>
                      <div className="gs-section-label">Ports & Terminals ({matchedLocations.length})</div>
                      {matchedLocations.map((l) => (
                        <Link key={l.id} href="/rates" className="gs-result-item" onClick={() => setShowGlobalSearch(false)}>
                          <span className="gs-icon" style={{ fontSize: '13px' }}>{getLocationTypeIcon(l.type)}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--ink)' }}>
                              {getLocationTypeIcon(l.type)} {l.unLocode} · {l.name}
                            </div>
                            <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>
                              {l.country} ({l.region}) · {l.type} · {Object.entries(l.capabilities).filter(([_, v]) => v).map(([k]) => k.replace('is', '')).join('/')}
                            </small>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {matchedCarriers.length > 0 && (
                    <div>
                      <div className="gs-section-label">Ocean Carriers ({matchedCarriers.length})</div>
                      {matchedCarriers.map((c) => (
                        <Link key={c.id} href="/rates" className="gs-result-item" onClick={() => setShowGlobalSearch(false)}>
                          <span className="gs-icon" style={{ fontSize: '13px' }}>{getCarrierTypeIcon(c.type)}</span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--ink)' }}>
                              {getCarrierTypeIcon(c.type)} {c.name} ({c.scacCode} · {c.type})
                            </div>
                            <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>
                              {c.alliance} · Fleet: {c.fleetTEU || 'N/A'} · {c.country}
                            </small>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {matchedAuctions.length > 0 && (
                    <div>
                      <div className="gs-section-label">Auctions ({matchedAuctions.length})</div>
                      {matchedAuctions.map((a) => (
                        <Link key={a.id} href={`/auctions/${a.id}`} className="gs-result-item" onClick={() => setShowGlobalSearch(false)}>
                          <span className="gs-icon" style={{ color: '#1168d7' }}><Gavel size={13} /></span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--ink)' }}>{a.id} · {a.title}</div>
                            <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>{a.shipment.pol} → {a.shipment.pod} · Status: {a.status}</small>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {matchedRates.length > 0 && (
                    <div>
                      <div className="gs-section-label">Rates ({matchedRates.length})</div>
                      {matchedRates.map((r) => (
                        <Link key={r.id} href="/rates" className="gs-result-item" onClick={() => setShowGlobalSearch(false)}>
                          <span className="gs-icon" style={{ color: '#099889' }}><BarChart3 size={13} /></span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--ink)' }}>{r.carrier} ({r.sp}) · 40HC: ${r.h40} USD</div>
                            <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>{r.pol} → {r.pod} · Valid till {r.valid}</small>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {matchedJobs.length > 0 && (
                    <div>
                      <div className="gs-section-label">Jobs ({matchedJobs.length})</div>
                      {matchedJobs.map((j) => (
                        <Link key={j.id} href="/jobs" className="gs-result-item" onClick={() => setShowGlobalSearch(false)}>
                          <span className="gs-icon" style={{ color: '#d97706' }}><Briefcase size={13} /></span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--ink)' }}>{j.title} · {j.company}</div>
                            <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>{j.location} · {j.packageDetails}</small>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {matchedTopics.length > 0 && (
                    <div>
                      <div className="gs-section-label">Nexus Topics ({matchedTopics.length})</div>
                      {matchedTopics.map((t) => (
                        <Link key={t.id} href="/nexus" className="gs-result-item" onClick={() => setShowGlobalSearch(false)}>
                          <span className="gs-icon" style={{ color: '#7c3aed' }}><Globe2 size={13} /></span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--ink)' }}>{t.title}</div>
                            <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>{t.category} · by {t.author}</small>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {matchedUsers.length > 0 && (
                    <div>
                      <div className="gs-section-label">Network & Organizations ({matchedUsers.length})</div>
                      {matchedUsers.map((u) => (
                        <Link key={u.uid} href="/profile" className="gs-result-item" onClick={() => setShowGlobalSearch(false)}>
                          <span className="gs-icon" style={{ color: '#059669' }}><Users size={13} /></span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--ink)' }}>{u.displayName} · {u.company}</div>
                            <small style={{ color: 'var(--mut)', fontSize: '10.5px' }}>{u.designation} · {u.city}, {u.country}</small>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {matchedPosts.length > 0 && (
                    <div>
                      <div className="gs-section-label">Feed Posts ({matchedPosts.length})</div>
                      {matchedPosts.map((p) => (
                        <Link key={p.id} href="/feeds" className="gs-result-item" onClick={() => setShowGlobalSearch(false)}>
                          <span className="gs-icon" style={{ color: '#64748b' }}><MessageSquare size={13} /></span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontWeight: 600, fontSize: '12px', color: 'var(--ink)' }}>{p.author} ({p.authorCompany})</div>
                            <small style={{ color: 'var(--mut)', fontSize: '10.5px', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.text}</small>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="global-search-footer">
              <span><kbd>↑↓</kbd> Navigate</span>
              <span><kbd>↵</kbd> Open</span>
              <span><kbd>Esc</kbd> Close</span>
            </div>
          </div>
        </div>
      )}

      <header className="top">
        {/* Mobile hamburger */}
        <button
          className="mobile-menu-btn"
          onClick={onMobileMenuClick}
          aria-label="Open navigation menu"
        >
          <Menu size={18} />
        </button>

        <div className="crumb">
          Workspace / <b>{activePageTitle}</b>
        </div>

        {/* Global Search Trigger */}
        <button
          className="global-search-trigger"
          onClick={() => { setShowGlobalSearch(true); setTimeout(() => searchRef.current?.focus(), 50); }}
          title="Global Search (Ctrl+K)"
        >
          <Search size={13} />
          <span>Search…</span>
          <kbd className="search-kbd">⌘K</kbd>
        </button>

        <div className="topright">
          {/* Location Badge */}
          <span className="country" title={`Location: ${user.city}, ${user.country}`}>
            <MapPin size={13} style={{ color: 'var(--brand)' }} />
            <b>{user.city}, {user.country}</b>
          </span>

          {/* Currency Converter */}
          <div style={{ position: 'relative' }}>
            <button
              className="currency-select"
              onClick={() => setShowCurrencyModal(!showCurrencyModal)}
              title="Currency Converter & Workspace Currency"
            >
              <Calculator size={13} />
              <span>CR · {currentCurrency}</span>
              <ChevronDown size={12} />
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
                    <span className="badge green" style={{ fontSize: '9px', fontWeight: 700 }}>
                      🟢 {isLiveRates ? 'LIVE INTERBANK FEED' : 'FOREX SYNCED'}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--mut)' }}>{lastUpdatedTime}</span>
                  </div>

                  <div style={{ marginBottom: '10px' }}>
                    <small style={{ color: 'var(--mut)', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }}>
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
                    <div className="calc-row">
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: 'var(--mut)' }}>Amount</label>
                        <input
                          type="number"
                          value={calcSourceAmount}
                          onChange={(e) => setCalcSourceAmount(parseFloat(e.target.value) || 0)}
                          style={{ width: '100%', padding: '4px 8px', fontSize: '12px', borderRadius: '4px', border: '1px solid var(--line)' }}
                        />
                      </div>
                      <div style={{ width: '80px' }}>
                        <label style={{ fontSize: '10px', color: 'var(--mut)' }}>From</label>
                        <select
                          value={calcSourceCurrency}
                          onChange={(e) => setCalcSourceCurrency(e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid var(--line)' }}
                        >
                          {Object.keys(availableCurrencies).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div style={{ textAlign: 'center', margin: '6px 0' }}>
                      <button
                        onClick={() => {
                          const temp = calcSourceCurrency;
                          setCalcSourceCurrency(calcTargetCurrency);
                          setCalcTargetCurrency(temp);
                        }}
                        className="btn secondary sm"
                        title="Swap currencies"
                        style={{ padding: '2px 8px', fontSize: '10.5px' }}
                      >
                        <ArrowRightLeft size={11} /> Swap
                      </button>
                    </div>

                    <div className="calc-row">
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: 'var(--mut)' }}>Converted Amount</label>
                        <div style={{ padding: '4px 8px', background: '#e8f8f5', borderRadius: '4px', fontWeight: 700, color: '#087b70', fontSize: '13px' }}>
                          {availableCurrencies[calcTargetCurrency]?.symbol || ''} {convertedResult.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                      </div>
                      <div style={{ width: '80px' }}>
                        <label style={{ fontSize: '10px', color: 'var(--mut)' }}>To</label>
                        <select
                          value={calcTargetCurrency}
                          onChange={(e) => setCalcTargetCurrency(e.target.value)}
                          style={{ width: '100%', padding: '4px', fontSize: '11.5px', borderRadius: '4px', border: '1px solid var(--line)' }}
                        >
                          {Object.keys(availableCurrencies).map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px' }}>
                      <small style={{ color: 'var(--mut)', fontSize: '10px' }}>
                        1 {calcSourceCurrency} = {directRate.toFixed(4)} {calcTargetCurrency}
                      </small>
                      <button
                        onClick={() => refreshLiveRates()}
                        style={{ fontSize: '9.5px', color: 'var(--brand)', textDecoration: 'underline', cursor: 'pointer' }}
                      >
                        Sync Now
                      </button>
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
              onClick={() => { setShowNotifications(!showNotifications); setShowUserDropdown(false); setShowCurrencyModal(false); }}
              aria-label="View notifications"
            >
              <Bell size={15} />
              {unreadCount > 0 && <span className="dot" />}
            </button>

            {showNotifications && (
              <div className="notifications-dropdown">
                <div className="notif-header">
                  <b style={{ fontSize: '12px' }}>Notifications</b>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    {unreadCount > 0 && (
                      <span className="badge blue" style={{ fontSize: '9px' }}>{unreadCount} Unread</span>
                    )}
                    {unreadCount > 0 && (
                      <button
                        onClick={() => markAllNotificationsRead()}
                        title="Mark all as read"
                        style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '10px', color: 'var(--brand)', fontWeight: 600 }}
                      >
                        <CheckCheck size={12} /> All Read
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
                    <div style={{ padding: '24px', textAlign: 'center', color: 'var(--mut)', fontSize: '12px' }}>
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
                            <p style={{ fontSize: '10.5px', color: 'var(--mut)', margin: '2px 0 0', lineHeight: '1.4' }}>{n.desc}</p>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                              <small style={{ fontSize: '9px', color: 'var(--faint)' }}>{n.time}</small>
                              {n.actionLabel && n.targetUrl && (
                                <Link href={n.targetUrl} className="badge blue" style={{ fontSize: '9px' }} onClick={() => setShowNotifications(false)}>
                                  {n.actionLabel}
                                </Link>
                              )}
                            </div>
                          </div>
                          {!n.read && <span className="notif-unread-dot" />}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Dropdown */}
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => { setShowUserDropdown(!showUserDropdown); setShowNotifications(false); setShowCurrencyModal(false); }}
              className="user-top-btn"
            >
              <span>{user.displayName}</span>
              {user.hasGoldenTick && <GoldenTick />}
              <ChevronDown size={13} style={{ color: 'var(--mut)' }} />
            </button>

            {showUserDropdown && (
              <div className="user-dropdown-menu">
                <div style={{ padding: '8px', borderBottom: '1px solid var(--line)' }}>
                  <b style={{ fontSize: '12px', display: 'block' }}>{user.displayName}</b>
                  <small style={{ fontSize: '10px', color: 'var(--mut)' }}>{user.company}</small>
                  <div style={{ marginTop: '4px' }}>
                    <span className={`badge ${user.plan === 'premium' ? 'amber' : 'blue'}`}>
                      {user.plan.toUpperCase()} PLAN
                    </span>
                  </div>
                </div>

                <div style={{ padding: '6px 8px', fontSize: '9.5px', fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase' }}>
                  Simulate Counterpart
                </div>

                {allUsers.map((u) => (
                  <button
                    key={u.uid}
                    onClick={() => {
                      switchUser(u.uid);
                      setShowUserDropdown(false);
                    }}
                    className={`user-switch-item ${user.uid === u.uid ? 'active' : ''}`}
                  >
                    <div style={{ textAlign: 'left' }}>
                      <div>
                        {u.displayName} {u.hasGoldenTick && '★'}
                      </div>
                      <small style={{ fontSize: '9.5px', color: 'var(--mut)' }}>
                        {u.designation} ({u.plan})
                      </small>
                    </div>
                    {user.uid === u.uid && <Check size={13} />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
