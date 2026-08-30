'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/context/AuthContext';
import { useCurrency } from '@/lib/context/CurrencyContext';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { MapPin, Bell, ChevronDown, Check } from 'lucide-react';

interface TopBarProps {
  activePageTitle: string;
}

export function TopBar({ activePageTitle }: TopBarProps) {
  const { user, allUsers, switchUser } = useAuth();
  const { currentCurrency, setCurrency, availableCurrencies } = useCurrency();

  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  const notifications = [
    {
      id: 'n1',
      title: 'New Bid Received · RA-2026-0842',
      desc: 'Rotterdam Freight NV submitted an offer of $2,320 USD.',
      time: '10m ago',
    },
    {
      id: 'n2',
      title: 'Reverse Auction Published',
      desc: 'General bidding GB-2026-0311 (Nhava Sheva → Antwerp) is now Live.',
      time: '1h ago',
    },
    {
      id: 'n3',
      title: 'Premium Golden Verified Status',
      desc: 'Your account receives 40% bidding posting discount (₹180/bid).',
      time: '1d ago',
    },
  ];

  return (
    <header className="top">
      <div className="crumb">
        Workspace / <b>{activePageTitle}</b>
      </div>

      <div className="topright">
        {/* Dynamic Location Badge */}
        <span className="country" title={`Logged in from: ${user.city}, ${user.country}`}>
          <MapPin size={13} style={{ color: 'var(--brand)' }} />
          Location: <b>{user.city}, {user.country}</b>
        </span>

        {/* Currency Conversion Utility */}
        <div style={{ position: 'relative' }}>
          <button
            className="currency-select"
            onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
            title="Switch commercial valuation currency"
          >
            <span>CR · {currentCurrency} ({availableCurrencies[currentCurrency]?.symbol || '$'})</span>
            <ChevronDown size={12} />
          </button>

          {showCurrencyDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                boxShadow: 'var(--sh-md)',
                zIndex: 60,
                width: '180px',
                padding: '4px',
              }}
            >
              <div style={{ padding: '6px 8px', fontSize: '10px', fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase' }}>
                Select Currency
              </div>
              {Object.entries(availableCurrencies).map(([code, info]) => (
                <button
                  key={code}
                  onClick={() => {
                    setCurrency(code);
                    setShowCurrencyDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '11.5px',
                    borderRadius: '5px',
                    background: currentCurrency === code ? '#e8f8f5' : 'transparent',
                    color: currentCurrency === code ? '#087b70' : 'var(--ink)',
                    fontWeight: currentCurrency === code ? 700 : 500,
                  }}
                >
                  <span>{code} ({info.symbol.trim()})</span>
                  <span style={{ fontSize: '10px', color: 'var(--mut)' }}>{info.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Notifications Hub */}
        <div style={{ position: 'relative' }}>
          <button
            className="topicon"
            onClick={() => setShowNotifications(!showNotifications)}
            aria-label="View notifications"
          >
            <Bell size={15} />
            <span className="dot" />
          </button>

          {showNotifications && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: '10px',
                boxShadow: 'var(--sh-lg)',
                zIndex: 60,
                width: '320px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '10px 12px',
                  background: '#f8fafc',
                  borderBottom: '1px solid var(--line)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <b style={{ fontSize: '12px' }}>Notifications</b>
                <span className="badge blue" style={{ fontSize: '9px' }}>3 Unread</span>
              </div>
              <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: '9px 12px',
                      borderBottom: '1px solid #edf2f7',
                      cursor: 'pointer',
                    }}
                  >
                    <b style={{ fontSize: '11.5px', display: 'block', color: 'var(--ink)' }}>{n.title}</b>
                    <p style={{ fontSize: '10.5px', color: 'var(--mut)', margin: '2px 0 0' }}>{n.desc}</p>
                    <small style={{ fontSize: '9px', color: 'var(--faint)', display: 'block', marginTop: '2px' }}>
                      {n.time}
                    </small>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Current User Quick Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowUserDropdown(!showUserDropdown)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 8px',
              borderRadius: '7px',
              border: '1px solid var(--line)',
              background: '#fff',
              fontWeight: 700,
              fontSize: '12px',
              color: 'var(--ink)',
            }}
          >
            <span>{user.displayName}</span>
            {user.hasGoldenTick && <GoldenTick />}
            <ChevronDown size={13} style={{ color: 'var(--mut)' }} />
          </button>

          {showUserDropdown && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '6px',
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: '10px',
                boxShadow: 'var(--sh-lg)',
                zIndex: 60,
                width: '240px',
                padding: '6px',
              }}
            >
              <div style={{ padding: '6px 8px', borderBottom: '1px solid var(--line-light)' }}>
                <b style={{ fontSize: '12px', display: 'block' }}>{user.displayName}</b>
                <small style={{ fontSize: '10px', color: 'var(--mut)' }}>{user.company}</small>
                <div style={{ marginTop: '4px' }}>
                  <span className={`badge ${user.plan === 'premium' ? 'amber' : 'blue'}`}>
                    {user.plan.toUpperCase()} PLAN
                  </span>
                </div>
              </div>

              <div style={{ padding: '6px 8px', fontSize: '9.5px', fontWeight: 700, color: 'var(--mut)', textTransform: 'uppercase' }}>
                Switch User (Demo Role Simulation)
              </div>

              {allUsers.map((u) => (
                <button
                  key={u.uid}
                  onClick={() => {
                    switchUser(u.uid);
                    setShowUserDropdown(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '6px 8px',
                    fontSize: '11px',
                    borderRadius: '5px',
                    background: user.uid === u.uid ? '#e8f1fd' : 'transparent',
                    color: user.uid === u.uid ? 'var(--brand)' : 'var(--ink)',
                    fontWeight: user.uid === u.uid ? 700 : 500,
                  }}
                >
                  <div style={{ textAlign: 'left' }}>
                    <div>
                      {u.displayName} {u.hasGoldenTick && '★'}
                    </div>
                    <small style={{ fontSize: '9.5px', color: 'var(--mut)' }}>{u.designation} ({u.plan})</small>
                  </div>
                  {user.uid === u.uid && <Check size={13} />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
