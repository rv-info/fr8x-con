'use client';

import React from 'react';
import Link from 'next/link';
import { useData } from '@/lib/context/DataContext';
import { useAuth } from '@/lib/context/AuthContext';
import {
  Gavel,
  BarChart3,
  MessageSquare,
  Bookmark,
  TrendingUp,
  Clock,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  FileText,
  Plus,
  Bell,
  Users,
  Globe2,
  Briefcase,
  Star,
  Award,
  Activity,
  Zap,
} from 'lucide-react';
import { GoldenTick } from '@/components/ui/GoldenTick';
import { LocalTimeBadge } from '@/components/ui/LocalTimeBadge';

export default function DashboardPage() {
  const { auctions, mySubmittedBids, rates, notifications, jobs, posts } = useData();
  const { user } = useAuth();

  // KPI calculations
  const activeAuctions = auctions.filter((a) => a.status === 'Live').length;
  const myPostedAuctions = auctions.filter((a) => a.creatorUid === user.uid);
  const myPostedActive = myPostedAuctions.filter((a) => a.status === 'Live').length;
  const myPostedDrafts = myPostedAuctions.filter((a) => a.status === 'Draft').length;
  const bidsParticipated = mySubmittedBids.length;
  const bidsWon = mySubmittedBids.filter((b) => b.status === 'winning').length;
  const unreadNotifs = notifications.filter((n) => !n.read).length;
  const savedPosts = posts.filter((p) => p.isSaved).length;

  // Upcoming deadlines (auctions closing)
  const upcomingDeadlines = [
    ...auctions
      .filter((a) => a.status === 'Live' && a.creatorUid === user.uid)
      .map((a) => ({
        id: a.id,
        type: 'auction_closing' as const,
        title: `Auction Closing: ${a.title}`,
        detail: a.timeLeft ? `Closes in ${a.timeLeft}` : a.endDateTime,
        href: '/auctions',
        icon: <Gavel size={13} />,
        urgency: 'high' as const,
      })),
    ...myPostedAuctions
      .filter((a) => a.status === 'Draft')
      .map((a) => ({
        id: a.id,
        type: 'draft' as const,
        title: `Draft Auction: ${a.title}`,
        detail: 'Incomplete — requires posting fee payment to publish',
        href: '/auctions',
        icon: <FileText size={13} />,
        urgency: 'medium' as const,
      })),
    ...rates
      .filter((r) => {
        const valid = new Date(r.valid);
        const daysLeft = Math.ceil((valid.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return daysLeft <= 30 && daysLeft >= 0;
      })
      .map((r) => {
        const valid = new Date(r.valid);
        const daysLeft = Math.ceil((valid.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        return {
          id: r.id,
          type: 'rate_expiry' as const,
          title: `Rate Expiring: ${r.pol} → ${r.pod}`,
          detail: `${r.carrier} — Valid until ${r.valid} (${daysLeft}d)`,
          href: '/rates',
          icon: <BarChart3 size={13} />,
          urgency: daysLeft <= 7 ? 'high' as const : 'medium' as const,
        };
      }),
  ].slice(0, 5);

  // Recent activity from notifications
  const recentActivity = notifications.slice(0, 6);

  const kpis = [
    { label: 'Active Auctions', value: activeAuctions, icon: <Gavel size={16} />, color: '#1168d7', href: '/auctions' },
    { label: 'My Posted', value: myPostedActive, icon: <Activity size={16} />, color: '#099889', href: '/auctions' },
    { label: 'Bids Submitted', value: bidsParticipated, icon: <TrendingUp size={16} />, color: '#7c3aed', href: '/auctions' },
    { label: 'Bids Won', value: bidsWon, icon: <Award size={16} />, color: '#d97706', href: '/auctions' },
    { label: 'Drafts', value: myPostedDrafts, icon: <FileText size={16} />, color: '#64748b', href: '/auctions' },
    { label: 'Unread Alerts', value: unreadNotifs, icon: <Bell size={16} />, color: '#dc2626', href: '/feeds' },
    { label: 'Saved Posts', value: savedPosts, icon: <Bookmark size={16} />, color: '#059669', href: '/feeds' },
    { label: 'Active Jobs', value: jobs.filter((j) => j.status === 'active').length, icon: <Briefcase size={16} />, color: '#0891b2', href: '/jobs' },
  ];

  const quickActions = [
    { label: 'Create Auction', href: '/auctions/create', icon: <Gavel size={15} />, primary: true },
    { label: 'Browse Rates', href: '/rates', icon: <BarChart3 size={15} />, primary: false },
    { label: 'View Nexus', href: '/nexus', icon: <Globe2 size={15} />, primary: false },
    { label: 'Browse Jobs', href: '/jobs', icon: <Briefcase size={15} />, primary: false },
  ];

  return (
    <div>
      {/* Welcome Header */}
      <div className="dashboard-welcome">
        <div className="dashboard-welcome-left">
          <div className="avatar big" style={{ flexShrink: 0 }}>
            {user.displayName.split(' ').map((p) => p[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 17 ? 'afternoon' : 'evening'},{' '}
              {user.firstName}
              {user.hasGoldenTick && <GoldenTick />}
            </h1>
            <p style={{ margin: '3px 0 0', color: 'var(--mut)', fontSize: '12px' }}>
              {user.designation} · {user.company}
            </p>
            <div style={{ marginTop: '6px', display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
              <LocalTimeBadge timezone={user.timezone} />
              <span className={`badge ${user.plan === 'premium' ? 'amber' : 'blue'}`}>
                {user.plan.toUpperCase()} PLAN
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {quickActions.map((qa) => (
            <Link key={qa.href} href={qa.href} className={`btn ${qa.primary ? 'primary' : 'secondary'}`}>
              {qa.icon} {qa.label}
            </Link>
          ))}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="dashboard-kpi-grid">
        {kpis.map((kpi) => (
          <Link key={kpi.label} href={kpi.href} className="dashboard-kpi-card">
            <div className="dashboard-kpi-icon" style={{ background: kpi.color + '18', color: kpi.color }}>
              {kpi.icon}
            </div>
            <div>
              <div className="dashboard-kpi-value">{kpi.value}</div>
              <div className="dashboard-kpi-label">{kpi.label}</div>
            </div>
          </Link>
        ))}
      </div>

      {/* Main Content */}
      <div className="dashboard-main-grid">
        {/* Left: Activity + Deadlines */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* Upcoming Deadlines */}
          <div className="card">
            <div className="cardhead">
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Clock size={14} style={{ color: 'var(--red)' }} />
                <b>Upcoming Deadlines</b>
              </div>
              <span className="sub">{upcomingDeadlines.length} item{upcomingDeadlines.length !== 1 ? 's' : ''}</span>
            </div>
            {upcomingDeadlines.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--mut)', fontSize: '12px' }}>
                <CheckCircle2 size={22} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.4 }} />
                No upcoming deadlines
              </div>
            ) : (
              <div>
                {upcomingDeadlines.map((dl) => (
                  <Link key={dl.id} href={dl.href} className="deadline-item">
                    <div className={`deadline-dot ${dl.urgency === 'high' ? 'red' : 'amber'}`} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: dl.urgency === 'high' ? 'var(--red)' : 'var(--amber)' }}>
                          {dl.icon}
                        </span>
                        <b style={{ fontSize: '12px', color: 'var(--ink)' }}>{dl.title}</b>
                      </div>
                      <small style={{ fontSize: '10.5px', color: 'var(--mut)', display: 'block', marginTop: '2px' }}>
                        {dl.detail}
                      </small>
                    </div>
                    <ArrowRight size={13} style={{ color: 'var(--faint)', flexShrink: 0 }} />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Recent Activity */}
          <div className="card">
            <div className="cardhead">
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Activity size={14} style={{ color: 'var(--brand)' }} />
                <b>Recent Activity</b>
              </div>
              <Link href="/feeds" style={{ fontSize: '11px', color: 'var(--brand)' }}>View all</Link>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--mut)', fontSize: '12px' }}>
                No recent activity
              </div>
            ) : (
              <div>
                {recentActivity.map((n) => (
                  <div key={n.id} className="activity-item">
                    <div className={`activity-dot ${n.read ? 'grey' : 'blue'}`} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <b style={{ fontSize: '11.5px', color: 'var(--ink)' }}>{n.title}</b>
                      <small style={{ display: 'block', fontSize: '10.5px', color: 'var(--mut)', marginTop: '1px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {n.desc}
                      </small>
                    </div>
                    <small style={{ fontSize: '9.5px', color: 'var(--faint)', flexShrink: 0 }}>{n.time}</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: My Auctions + My Bids + Jobs sidebar */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

          {/* My Active Auctions */}
          <div className="card">
            <div className="cardhead">
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Gavel size={14} style={{ color: 'var(--brand)' }} />
                <b>My Auctions</b>
              </div>
              <Link href="/auctions" className="btn secondary sm">
                <Plus size={12} /> New
              </Link>
            </div>
            {myPostedAuctions.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--mut)', fontSize: '12px' }}>
                <Gavel size={22} style={{ display: 'block', margin: '0 auto 8px', opacity: 0.3 }} />
                No auctions yet
                <br />
                <Link href="/auctions/create" className="btn primary sm" style={{ marginTop: '8px', display: 'inline-flex' }}>
                  Create Auction
                </Link>
              </div>
            ) : (
              <div>
                {myPostedAuctions.slice(0, 4).map((a) => (
                  <div key={a.id} className="dashboard-auction-row">
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <b style={{ fontSize: '11.5px', color: 'var(--ink)' }}>{a.title}</b>
                        <span className={`badge ${a.status === 'Live' ? 'green' : a.status === 'Draft' ? 'grey' : a.status === 'Awarded' ? 'blue' : a.status === 'Expired' ? 'amber' : 'red'}`} style={{ fontSize: '9px' }}>
                          {a.status}
                        </span>
                      </div>
                      <small style={{ display: 'block', fontSize: '10px', color: 'var(--mut)', marginTop: '2px' }}>
                        {a.shipment.pol} → {a.shipment.pod} · {a.bidsSubmittedCount} bid{a.bidsSubmittedCount !== 1 ? 's' : ''}
                      </small>
                    </div>
                    <Link href="/auctions" style={{ fontSize: '10px', color: 'var(--brand)', flexShrink: 0 }}>View</Link>
                  </div>
                ))}
                {myPostedAuctions.length > 4 && (
                  <div style={{ padding: '8px 14px', textAlign: 'center' }}>
                    <Link href="/auctions" style={{ fontSize: '11px', color: 'var(--brand)' }}>
                      View all {myPostedAuctions.length} auctions →
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* My Participated Bids */}
          <div className="card">
            <div className="cardhead">
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <TrendingUp size={14} style={{ color: 'var(--teal)' }} />
                <b>My Bids</b>
              </div>
              <span className="badge green" style={{ fontSize: '9px' }}>{bidsWon} Won</span>
            </div>
            {mySubmittedBids.length === 0 ? (
              <div style={{ padding: '24px', textAlign: 'center', color: 'var(--mut)', fontSize: '12px' }}>
                No bids submitted yet
              </div>
            ) : (
              <div>
                {mySubmittedBids.slice(0, 3).map((b) => {
                  const auction = auctions.find((a) => a.id === b.auctionId);
                  return (
                    <div key={b.id} className="dashboard-auction-row">
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <b style={{ fontSize: '11.5px', color: 'var(--ink)' }}>
                          {auction?.title || b.auctionId}
                        </b>
                        <small style={{ display: 'block', fontSize: '10px', color: 'var(--mut)', marginTop: '2px' }}>
                          USD ${b.grandTotalUSD.toFixed(0)} · Rank #{b.rank}
                        </small>
                      </div>
                      <span className={`badge ${b.status === 'winning' ? 'green' : b.status === 'outbid' ? 'amber' : 'grey'}`} style={{ fontSize: '9px' }}>
                        {b.status === 'winning' ? 'WON' : b.status.toUpperCase()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Latest Jobs */}
          <div className="card">
            <div className="cardhead">
              <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                <Briefcase size={14} style={{ color: '#0891b2' }} />
                <b>Latest Jobs</b>
              </div>
              <Link href="/jobs" style={{ fontSize: '11px', color: 'var(--brand)' }}>View all</Link>
            </div>
            <div>
              {jobs.slice(0, 3).map((job) => (
                <div key={job.id} className="dashboard-auction-row">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <b style={{ fontSize: '11.5px', color: 'var(--ink)', display: 'block' }}>{job.title}</b>
                    <small style={{ fontSize: '10px', color: 'var(--mut)' }}>
                      {job.company} · {job.location}
                    </small>
                  </div>
                  <span style={{ fontSize: '9.5px', color: 'var(--faint)', flexShrink: 0 }}>{job.postedDate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
