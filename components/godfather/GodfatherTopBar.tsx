'use client';

import React, { useState, useEffect } from 'react';
import { Search, Bell, ShieldCheck, ShieldAlert, Command, Menu, LogOut } from 'lucide-react';
import { useGodfatherAuth } from '@/lib/godfather/context/GodfatherAuthContext';
import { CommandPalette } from './CommandPalette';
import { NotificationDrawer } from './NotificationDrawer';

interface GodfatherTopBarProps {
  activeTitle?: string;
  onMobileMenuClick?: () => void;
}

export function GodfatherTopBar({ activeTitle = 'Overview', onMobileMenuClick }: GodfatherTopBarProps) {
  const { operator, isStepUpValid, requestStepUpVerification, logoutOperator } = useGodfatherAuth();
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <>
      <div className="gf-tricolore-ribbon" />

      <header className="gf-topbar">
        {/* Left: Mobile Toggle + Breadcrumb */}
        <div style={{display:'flex',alignItems:'center',gap:6,minWidth:0}}>
          {onMobileMenuClick && (
            <button onClick={onMobileMenuClick} className="lg:hidden" style={{padding:3,borderRadius:3,color:'#6b7280',background:'none',border:'none',cursor:'pointer'}} aria-label="Toggle Navigation">
              <Menu className="lucide" style={{width:16,height:16}} />
            </button>
          )}
          <div style={{display:'flex',alignItems:'center',gap:4,minWidth:0}}>
            <span style={{color:'#9ca3af',fontFamily:'monospace',fontWeight:700,fontSize:9}}>GF /</span>
            <h1 style={{fontSize:11.5,fontWeight:750,color:'#111827',margin:0,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>{activeTitle}</h1>
          </div>
        </div>

        {/* Center: Command Search */}
        <div style={{flex:1,maxWidth:420,margin:'0 8px',display:'flex'}}>
          <button
            type="button"
            onClick={() => setIsCommandOpen(true)}
            style={{
              width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'0 8px',height:26,borderRadius:4,background:'#f4f6f8',
              border:'1px solid #e0e4ea',fontSize:10,color:'#6b7280',cursor:'pointer',
              transition:'border-color 0.1s',
            }}
          >
            <div style={{display:'flex',alignItems:'center',gap:5,overflow:'hidden'}}>
              <Search className="lucide" style={{width:12,height:12,color:'#9ca3af',flexShrink:0}} />
              <span style={{fontWeight:500,whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>Search users, companies, audit events...</span>
            </div>
            <div style={{display:'flex',alignItems:'center',gap:2,fontFamily:'monospace',fontSize:9,background:'#fff',border:'1px solid #e0e4ea',padding:'1px 4px',borderRadius:3,color:'#6b7280',fontWeight:700,flexShrink:0}}>
              <Command className="lucide" style={{width:9,height:9}} />
              <span>K</span>
            </div>
          </button>
        </div>

        {/* Right: Actions */}
        <div style={{display:'flex',alignItems:'center',gap:4}}>
          {/* Step-Up */}
          <button
            type="button"
            onClick={() => requestStepUpVerification('Manual Privilege Refresh')}
            style={{
              display:'inline-flex',alignItems:'center',gap:3,
              fontSize:9,padding:'0 6px',height:22,borderRadius:3,
              border: `1px solid ${isStepUpValid ? '#86efac' : '#fcd34d'}`,
              background: isStepUpValid ? '#dcfce7' : '#fef3c7',
              color: isStepUpValid ? '#15803d' : '#b45309',
              fontWeight:700,cursor:'pointer',fontFamily:'monospace',
              transition:'all 0.1s',
            }}
            title={isStepUpValid ? 'Elevated active' : 'Click to re-authenticate'}
          >
            {isStepUpValid
              ? <><ShieldCheck className="lucide" style={{width:11,height:11}} /><span>ELEVATED</span></>
              : <><ShieldAlert className="lucide" style={{width:11,height:11}} /><span>STEP-UP</span></>
            }
          </button>

          {/* Notifications */}
          <button
            type="button"
            onClick={() => setIsNotifOpen(true)}
            style={{
              position:'relative',color:'#6b7280',padding:3,borderRadius:3,
              background:'none',border:'none',cursor:'pointer',
              transition:'color 0.1s',
            }}
            aria-label="Alerts"
          >
            <Bell className="lucide" style={{width:14,height:14}} />
            <span style={{position:'absolute',top:2,right:2,width:5,height:5,borderRadius:'50%',background:'#d97706',border:'1.5px solid #fff'}} />
          </button>

          {/* Operator */}
          <div style={{display:'flex',alignItems:'center',gap:4,paddingLeft:4,borderLeft:'1px solid #e0e4ea'}}>
            <div style={{width:22,height:22,borderRadius:4,background:'#111827',color:'#fff',fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',fontSize:9}}>
              {operator.displayName.charAt(0)}
            </div>
            <span style={{fontSize:9,fontWeight:600,color:'#374151',fontFamily:'monospace',maxWidth:100,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              {operator.email}
            </span>
            <button
              type="button"
              onClick={logoutOperator}
              style={{padding:3,borderRadius:3,color:'#9ca3af',background:'none',border:'none',cursor:'pointer',transition:'color 0.1s'}}
              title="Logout"
            >
              <LogOut className="lucide" style={{width:13,height:13}} />
            </button>
          </div>
        </div>
      </header>

      <CommandPalette isOpen={isCommandOpen} onClose={() => setIsCommandOpen(false)} />
      <NotificationDrawer isOpen={isNotifOpen} onClose={() => setIsNotifOpen(false)} />
    </>
  );
}
