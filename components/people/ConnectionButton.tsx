'use client';

/**
 * ConnectionButton — context-sensitive connection action button.
 * Reads current connection state and renders the correct action.
 * All mutations go to POST /api/people/connections.
 */

import React, { useState, useCallback } from 'react';
import {
  UserPlus, UserCheck, Clock, UserX, MessageSquare, Shield,
  Loader2, ChevronDown,
} from 'lucide-react';
import { getClientAuthHeaders } from '@/lib/connections';

export type ConnectionStatus =
  | 'none'
  | 'not_connected'
  | 'pending_sent'
  | 'pending_received'
  | 'connected'
  | 'blocked'
  | 'self';

export interface ConnectionButtonProps {
  targetId:         string;
  initialStatus:    ConnectionStatus;
  requestId?:       string;   // required when status is pending_*
  size?:            'sm' | 'md' | 'lg';
  onStatusChange?:  (newStatus: ConnectionStatus) => void;
  className?:       string;
}

async function callConnectionsAPI(body: Record<string, string | undefined>) {
  const authHeaders = getClientAuthHeaders();
  const res = await fetch('/api/people/connections', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders },
    credentials: 'include',
    body:    JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok || !data.success) {
    throw new Error(data.error ?? 'Connection operation failed.');
  }
  return data;
}

export function ConnectionButton({
  targetId,
  initialStatus,
  requestId,
  size = 'md',
  onStatusChange,
  className = '',
}: ConnectionButtonProps) {
  const [status, setStatus]     = useState<ConnectionStatus>(initialStatus);
  const [reqId,  setReqId]      = useState<string | undefined>(requestId);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const handleAction = useCallback(async (
    action: string,
    body: Record<string, string | undefined>
  ) => {
    setLoading(true);
    setError(null);
    try {
      const data = await callConnectionsAPI(body);
      // Map returned status to local state
      const newStatus =
        data.status === 'pending'    ? 'pending_sent' :
        data.status === 'accepted'   ? 'connected'    :
        data.status === 'declined'   ? 'none'         :
        data.status === 'cancelled'  ? 'none'         :
        action === 'remove'          ? 'none'         :
        action === 'block'           ? 'blocked'      :
        action === 'unblock'         ? 'none'         :
        status;
      if (data.request_id) setReqId(data.request_id);
      setStatus(newStatus as ConnectionStatus);
      onStatusChange?.(newStatus as ConnectionStatus);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
      setShowMenu(false);
    }
  }, [status, onStatusChange]);

  const sizeClass =
    size === 'sm' ? 'connection-btn-sm' :
    size === 'lg' ? 'connection-btn-lg' :
    'connection-btn-md';

  if (status === 'self') return null;

  return (
    <div className={`connection-btn-wrapper ${className}`} style={{ position: 'relative', display: 'inline-flex', gap: 4 }}>
      {/* Primary action button */}
      {(status === 'none' || status === 'not_connected') && (
        <button
          className={`connection-btn connect ${sizeClass}`}
          disabled={loading}
          onClick={() => handleAction('send', { action: 'send', target_id: targetId })}
          aria-label="Send connection request"
        >
          {loading ? <Loader2 size={14} className="spin" /> : <UserPlus size={14} />}
          <span>Connect</span>
        </button>
      )}

      {status === 'pending_sent' && (
        <button
          className={`connection-btn pending ${sizeClass}`}
          disabled={loading}
          onClick={() => setShowMenu((v) => !v)}
          aria-label="Pending — request sent"
          aria-expanded={showMenu}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <Clock size={14} />}
          <span>Pending</span>
          <ChevronDown size={12} />
        </button>
      )}

      {status === 'pending_received' && (
        <div style={{ display: 'flex', gap: 4 }}>
          <button
            className={`connection-btn connect ${sizeClass}`}
            disabled={loading}
            onClick={() => handleAction('accept', { action: 'accept', request_id: reqId })}
            aria-label="Accept connection request"
          >
            {loading ? <Loader2 size={14} className="spin" /> : <UserCheck size={14} />}
            <span>Accept</span>
          </button>
          <button
            className={`connection-btn outline ${sizeClass}`}
            disabled={loading}
            onClick={() => handleAction('decline', { action: 'decline', request_id: reqId })}
            aria-label="Decline connection request"
          >
            <span>Decline</span>
          </button>
        </div>
      )}

      {status === 'connected' && (
        <button
          className={`connection-btn connected ${sizeClass}`}
          disabled={loading}
          onClick={() => setShowMenu((v) => !v)}
          aria-label="Connected — click for options"
          aria-expanded={showMenu}
        >
          {loading ? <Loader2 size={14} className="spin" /> : <UserCheck size={14} />}
          <span>Connected</span>
          <ChevronDown size={12} />
        </button>
      )}

      {status === 'blocked' && (
        <button
          className={`connection-btn blocked ${sizeClass}`}
          disabled={loading}
          onClick={() => handleAction('unblock', { action: 'unblock', target_id: targetId })}
          aria-label="Unblock this member"
        >
          {loading ? <Loader2 size={14} className="spin" /> : <Shield size={14} />}
          <span>Unblock</span>
        </button>
      )}

      {/* Dropdown menu for pending_sent / connected */}
      {showMenu && (
        <>
          <div
            style={{
              position: 'fixed', inset: 0, zIndex: 99,
            }}
            onClick={() => setShowMenu(false)}
            aria-hidden="true"
          />
          <div className="connection-btn-menu" role="menu" aria-label="Connection options">
            {status === 'pending_sent' && (
              <button
                role="menuitem"
                className="connection-btn-menu-item danger"
                onClick={() => handleAction('cancel', { action: 'cancel', request_id: reqId })}
              >
                <UserX size={13} /> Cancel Request
              </button>
            )}
            {status === 'connected' && (
              <>
                <button
                  role="menuitem"
                  className="connection-btn-menu-item"
                  onClick={() => { setShowMenu(false); }}
                >
                  <MessageSquare size={13} /> Message
                </button>
                <button
                  role="menuitem"
                  className="connection-btn-menu-item danger"
                  onClick={() => handleAction('remove', { action: 'remove', target_id: targetId })}
                >
                  <UserX size={13} /> Remove Connection
                </button>
                <div className="connection-btn-menu-divider" />
                <button
                  role="menuitem"
                  className="connection-btn-menu-item danger"
                  onClick={() => handleAction('block', { action: 'block', target_id: targetId })}
                >
                  <Shield size={13} /> Block Member
                </button>
              </>
            )}
          </div>
        </>
      )}

      {/* Error toast */}
      {error && (
        <div className="connection-btn-error" role="alert" aria-live="polite">
          {error}
        </div>
      )}
    </div>
  );
}
