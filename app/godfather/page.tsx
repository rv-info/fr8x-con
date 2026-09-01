'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users, UserX, Building, FileCheck, ShieldAlert, KeyRound,
  Smartphone, Gavel, CheckCircle2, Clock, ShieldCheck,
  History, RefreshCw, Zap,
} from 'lucide-react';
import { useGodfatherData } from '@/lib/godfather/context/GodfatherDataContext';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';

export default function GodfatherDashboardPage() {
  const { companies, users, auctions, auditLogs } = useGodfatherData();
  const { operator, environment } = useGodfatherAuth();

  const [securityStats, setSecurityStats] = useState({
    blockedAccountsCount: 0, securityEventsCount: 0,
    passwordResetsCount: 0, criticalEventsCount: 0,
  });
  const [blockedAccounts, setBlockedAccounts] = useState<any[]>([]);
  const [securityEvents, setSecurityEvents] = useState<any[]>([]);
  const [passwordResets, setPasswordResets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSecurityOverview = async () => {
    try {
      const res = await fetch('/api/godfather/security');
      if (res.ok) {
        const json = await res.json();
        setSecurityStats(json.summary || securityStats);
        setBlockedAccounts(json.blockedAccounts || []);
        setSecurityEvents(json.recentEvents || []);
      }
      const resResets = await fetch('/api/godfather/security?type=resets');
      if (resResets.ok) {
        const jsonResets = await resResets.json();
        setPasswordResets(jsonResets.data || []);
      }
    } catch { /* Fallback */ } finally { setLoading(false); }
  };

  useEffect(() => { fetchSecurityOverview(); }, []);

  const activeUsersCount = users.length;
  const blockedAccountsCount = blockedAccounts.length;
  const pendingKYCCount = companies.filter((c) => c.status === 'pending' || c.status === 'additional_info_required').length;
  const openReportsCount = 1;
  const activeSecurityAlertsCount = securityEvents.filter((e) => e.severity === 'CRITICAL' || e.severity === 'HIGH').length;
  const pendingPasswordResetsCount = passwordResets.filter((p) => p.status === 'pending').length;
  const otpLimitEventsCount = securityEvents.filter((e) => e.type === 'OTP_LIMIT_REACHED').length;
  const activeAuctionsCount = auctions.filter((a) => a.status === 'Live').length;

  return (
    <div style={{display:'flex',flexDirection:'column',gap:6}}>
      {/* Header row */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:4}}>
        <div>
          <div style={{display:'flex',alignItems:'center',gap:4,marginBottom:2}}>
            <span className="gf-badge gf-badge-gold" style={{fontSize:8}}>SOVEREIGN ROOT</span>
            <span className="gf-badge gf-badge-green" style={{fontSize:8}}>NODE: {environment.toUpperCase()}</span>
          </div>
          <h1 style={{fontSize:13,fontWeight:800,color:'#111827',margin:0,display:'flex',alignItems:'center',gap:4}}>
            <ShieldCheck className="lucide" style={{width:13,height:13,color:'#2563eb'}} />
            Control Center & Governance
          </h1>
          <p style={{fontSize:9.5,color:'#6b7280',margin:'1px 0 0'}}>
            Security monitoring, KYC verification, anti-fraud enforcement, audit ledger
          </p>
        </div>
        <button type="button" onClick={fetchSecurityOverview} className="gf-btn gf-btn-secondary" style={{height:22,fontSize:9,padding:'0 7px'}}>
          <RefreshCw className={`lucide ${loading ? 'animate-spin' : ''}`} style={{width:10,height:10}} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Metric Tiles: 8-up grid */}
      <div>
        <div style={{fontSize:8.5,fontWeight:800,color:'#374151',textTransform:'uppercase',letterSpacing:'0.06em',marginBottom:3,display:'flex',alignItems:'center',gap:4}}>
          <Zap className="lucide" style={{width:10,height:10,color:'#2563eb'}} />
          Platform & Security Summary
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(100px, 1fr))',gap:4}}>
          {[
            { label: 'Users', value: activeUsersCount, color: '#111827', icon: Users, foot: 'Verified', href: '/godfather/operations/users' },
            { label: 'Blocked', value: blockedAccountsCount, color: blockedAccountsCount > 0 ? '#dc2626' : '#111827', icon: UserX, foot: blockedAccountsCount > 0 ? 'Action Needed' : '0 Locked', href: '/godfather/security/blocked-accounts' },
            { label: 'Pending KYC', value: pendingKYCCount, color: pendingKYCCount > 0 ? '#d97706' : '#111827', icon: Building, foot: pendingKYCCount > 0 ? 'Queue' : 'All Clear', href: '/godfather/operations/companies' },
            { label: 'Reports', value: openReportsCount, color: openReportsCount > 0 ? '#dc2626' : '#111827', icon: FileCheck, foot: openReportsCount > 0 ? 'Open' : 'Clear', href: '/godfather/trust-safety/reports' },
            { label: 'Alerts', value: activeSecurityAlertsCount, color: activeSecurityAlertsCount > 0 ? '#dc2626' : '#111827', icon: ShieldAlert, foot: '24h', href: '/godfather/security/events' },
            { label: 'Pwd Resets', value: pendingPasswordResetsCount, color: '#111827', icon: KeyRound, foot: 'Active', href: '/godfather/security/password-resets' },
            { label: 'OTP Limits', value: otpLimitEventsCount, color: otpLimitEventsCount > 0 ? '#d97706' : '#111827', icon: Smartphone, foot: '3/day', href: '/godfather/security/otp-activity' },
            { label: 'Auctions', value: activeAuctionsCount, color: '#1d4ed8', icon: Gavel, foot: 'Live', href: '/godfather/operations/auctions' },
          ].map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.label} href={m.href} className="gf-metric-card">
                <div className="gf-metric-title">{m.label}</div>
                <div className="gf-metric-value" style={{color: m.color}}>{m.value}</div>
                <div className="gf-metric-foot">
                  <Icon className="lucide" />
                  <span>{m.foot}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Two-column: Alerts + Actions */}
      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:6}}>
        {/* Security Alerts */}
        <div className="gf-card" style={{marginBottom:0}}>
          <div className="gf-card-header">
            <div className="gf-card-title" style={{color:'#b91c1c'}}>
              <ShieldAlert className="lucide" style={{width:12,height:12,color:'#dc2626'}} />
              <span>Security Alerts</span>
            </div>
            <Link href="/godfather/security/events" style={{fontSize:8,fontWeight:700,color:'#2563eb',textDecoration:'none'}}>
              View All →
            </Link>
          </div>
          <div style={{maxHeight:200,overflowY:'auto'}}>
            {securityEvents.length === 0 ? (
              <div style={{padding:'16px 10px',textAlign:'center',color:'#9ca3af',fontSize:10}}>
                <CheckCircle2 className="lucide" style={{width:18,height:18,margin:'0 auto 3px',color:'#059669',opacity:0.6}} />
                <div style={{fontWeight:700,color:'#374151'}}>No Active Alerts</div>
                <div style={{fontSize:8.5}}>Authentication systems operating normally.</div>
              </div>
            ) : (
              securityEvents.slice(0, 5).map((evt) => (
                <div key={evt.id} style={{padding:'4px 10px',borderBottom:'1px solid #f1f5f9',fontSize:9.5}}>
                  <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                    <span className={`gf-badge ${evt.severity === 'CRITICAL' ? 'gf-badge-red' : evt.severity === 'HIGH' ? 'gf-badge-amber' : 'gf-badge-blue'}`}>{evt.type}</span>
                    <span style={{fontFamily:'monospace',fontSize:8,color:'#9ca3af'}}>
                      {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{fontWeight:600,color:'#111827',marginTop:1}}>{evt.details}</div>
                  <div style={{fontFamily:'monospace',fontSize:8,color:'#6b7280'}}>Target: {evt.userEmail}</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Pending Actions */}
        <div className="gf-card" style={{marginBottom:0}}>
          <div className="gf-card-header">
            <div className="gf-card-title" style={{color:'#b45309'}}>
              <Clock className="lucide" style={{width:12,height:12,color:'#d97706'}} />
              <span>Pending Actions</span>
            </div>
            <span className="gf-badge gf-badge-amber" style={{fontSize:8,fontFamily:'monospace'}}>
              {pendingKYCCount + openReportsCount + blockedAccountsCount} ITEMS
            </span>
          </div>
          <div style={{maxHeight:200,overflowY:'auto'}}>
            {companies.filter((c) => c.status === 'pending').map((comp) => (
              <div key={comp.companyId} style={{padding:'4px 10px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:9.5}}>
                <div>
                  <div style={{fontWeight:700,color:'#111827',display:'flex',alignItems:'center',gap:3}}>
                    <Building className="lucide" style={{width:10,height:10,color:'#2563eb'}} />
                    KYC: {comp.legalName}
                  </div>
                  <div style={{fontSize:8,color:'#6b7280',fontFamily:'monospace'}}>GSTN: {comp.gstn || '—'} · {comp.documents.length} docs</div>
                </div>
                <Link href="/godfather/operations/companies" className="gf-btn gf-btn-success" style={{height:20,fontSize:8.5,padding:'0 6px'}}>Verify</Link>
              </div>
            ))}
            {blockedAccounts.map((blk) => (
              <div key={blk.uid} style={{padding:'4px 10px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:9.5}}>
                <div>
                  <div style={{fontWeight:700,color:'#b91c1c',display:'flex',alignItems:'center',gap:3}}>
                    <UserX className="lucide" style={{width:10,height:10,color:'#dc2626'}} />
                    Unlock: {blk.displayName || blk.email}
                  </div>
                  <div style={{fontSize:8,color:'#6b7280',fontFamily:'monospace'}}>3 failed attempts ({blk.company})</div>
                </div>
                <Link href="/godfather/security/blocked-accounts" className="gf-btn gf-btn-danger" style={{height:20,fontSize:8.5,padding:'0 6px'}}>Unlock</Link>
              </div>
            ))}
            <div style={{padding:'4px 10px',borderBottom:'1px solid #f1f5f9',display:'flex',alignItems:'center',justifyContent:'space-between',fontSize:9.5}}>
              <div>
                <div style={{fontWeight:700,color:'#111827',display:'flex',alignItems:'center',gap:3}}>
                  <FileCheck className="lucide" style={{width:10,height:10,color:'#dc2626'}} />
                  Dispute: REP-2026-001
                </div>
                <div style={{fontSize:8,color:'#6b7280',fontFamily:'monospace'}}>Demurrage deviation in spot quote</div>
              </div>
              <Link href="/godfather/trust-safety/reports" className="gf-btn gf-btn-secondary" style={{height:20,fontSize:8.5,padding:'0 6px'}}>Review</Link>
            </div>
          </div>
        </div>
      </div>

      {/* Audit Activity Table */}
      <div>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:3}}>
          <div style={{fontSize:8.5,fontWeight:800,color:'#374151',textTransform:'uppercase',letterSpacing:'0.06em',display:'flex',alignItems:'center',gap:4}}>
            <History className="lucide" style={{width:10,height:10,color:'#2563eb'}} />
            Recent Audit Activity (Append-Only)
          </div>
          <Link href="/godfather/security/audit" style={{fontSize:8,fontWeight:700,color:'#2563eb',textDecoration:'none'}}>
            Full Trail →
          </Link>
        </div>
        <div className="gf-card" style={{marginBottom:0}}>
          <div style={{overflowX:'auto'}}>
            <table className="gf-table">
              <thead>
                <tr>
                  <th>TIME</th>
                  <th>OPERATOR</th>
                  <th>MODULE</th>
                  <th>ACTION</th>
                  <th>RECORD</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.slice(0, 8).map((log) => (
                  <tr key={log.actionId}>
                    <td style={{fontFamily:'monospace',fontSize:8.5,color:'#6b7280',whiteSpace:'nowrap'}}>
                      {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td>
                      <div style={{fontWeight:700,color:'#111827',fontSize:10}}>{log.actorName}</div>
                      <div style={{fontFamily:'monospace',fontSize:7.5,color:'#6b7280'}}>{log.actorRole}</div>
                    </td>
                    <td>
                      <span style={{fontWeight:700,color:'#374151',textTransform:'uppercase',fontFamily:'monospace',fontSize:8.5}}>{log.targetType}</span>
                    </td>
                    <td>
                      <span style={{fontFamily:'monospace',fontSize:8.5,fontWeight:700,color:'#1d4ed8',background:'#dbeafe',padding:'1px 4px',borderRadius:2,border:'1px solid #93c5fd'}}>
                        {log.actionType}
                      </span>
                    </td>
                    <td>
                      <div style={{fontWeight:600,color:'#111827',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap',fontSize:10}}>
                        {log.targetLabel || log.targetId}
                      </div>
                      <div style={{fontSize:7.5,color:'#6b7280',maxWidth:180,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{log.reason}</div>
                    </td>
                    <td>
                      <span className="gf-badge gf-badge-green" style={{fontSize:8}}>
                        {log.stepUpVerified ? 'MFA' : 'OK'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
