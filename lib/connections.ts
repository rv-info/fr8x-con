import {
  UserProfile,
  UserPrivacySettings,
  DEFAULT_PRIVACY_SETTINGS,
  ConnectionRequest,
  ConnectionRequestStatus,
  PrivacyLevel,
} from './types';
import { isSelfProfile } from './connections-algorithm';
import { resolveDisplayName } from './utils';

// Storage keys
const CONNECTIONS_MAP_KEY = 'fr8x_connections_map_v1';
const CONNECTION_REQUESTS_KEY = 'fr8x_connection_requests_v1';
const PRIVACY_SETTINGS_KEY = 'fr8x_privacy_settings_v1';
const USERS_STORAGE_KEY = 'fr8x_all_users_v2';

export const CONNECTIONS_CHANGED_EVENT = 'fr8x_connections_changed';

function dispatchConnectionsChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(CONNECTIONS_CHANGED_EVENT));
  }
}

// ── Connections Map ─────────────────────────────────────────────────────────

function getConnectionsMap(): Record<string, string[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(CONNECTIONS_MAP_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function saveConnectionsMap(map: Record<string, string[]>) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONNECTIONS_MAP_KEY, JSON.stringify(map));
    dispatchConnectionsChanged();
  } catch {}
}

export function getConnectedUserIds(uid: string): string[] {
  if (!uid) return [];
  const map = getConnectionsMap();
  const list = (map[uid] || []).filter((id): id is string => typeof id === 'string' && Boolean(id.trim()));

  // Also inspect stored user profile if available
  if (typeof window !== 'undefined') {
    try {
      const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (usersRaw) {
        const users: UserProfile[] = JSON.parse(usersRaw);
        const user = users.find((u) => u && u.uid === uid);
        if (user && Array.isArray(user.contacts) && user.contacts.length > 0) {
          const validContacts = user.contacts.filter((c: any): c is string => typeof c === 'string' && Boolean(c.trim()));
          const combined = Array.from(new Set([...list, ...validContacts]));
          return combined;
        }
      }
    } catch {}
  }

  return list;
}

export function areUsersConnected(uidA: string, uidB: string): boolean {
  if (!uidA || !uidB) return false;
  if (uidA === uidB) return true;
  const list = getConnectedUserIds(uidA);
  return list.includes(uidB);
}

// ── Connection Requests ─────────────────────────────────────────────────────

export function getAllConnectionRequests(): ConnectionRequest[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CONNECTION_REQUESTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((r) => r && r.id && typeof r.fromUid === 'string' && Boolean(r.fromUid.trim()) && typeof r.toUid === 'string' && Boolean(r.toUid.trim()));
  } catch {
    return [];
  }
}

function saveConnectionRequests(requests: ConnectionRequest[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(CONNECTION_REQUESTS_KEY, JSON.stringify(requests));
    dispatchConnectionsChanged();
  } catch {}
}

export function getConnectionRequests(uid: string): {
  incoming: ConnectionRequest[];
  outgoing: ConnectionRequest[];
  withdrawn: ConnectionRequest[];
} {
  if (!uid) return { incoming: [], outgoing: [], withdrawn: [] };
  const all = getAllConnectionRequests();
  const incoming = all.filter((r) => r.toUid === uid && r.status === 'pending');
  const outgoing = all.filter((r) => r.fromUid === uid && r.status === 'pending');
  const withdrawn = all.filter(
    (r) => r.fromUid === uid && (r.status === 'cancelled' || (r as any).status === 'withdrawn')
  );
  return { incoming, outgoing, withdrawn };
}

export type ConnectionStatus =
  | 'self'
  | 'connected'
  | 'pending_sent'
  | 'pending_received'
  | 'none';

export function getConnectionStatus(
  viewerUid: string,
  targetUid: string
): ConnectionStatus {
  if (!viewerUid || !targetUid) return 'none';
  if (viewerUid === targetUid) return 'self';

  if (areUsersConnected(viewerUid, targetUid)) {
    return 'connected';
  }

  const all = getAllConnectionRequests();
  const pendingSent = all.find(
    (r) => r.fromUid === viewerUid && r.toUid === targetUid && r.status === 'pending'
  );
  if (pendingSent) return 'pending_sent';

  const pendingReceived = all.find(
    (r) => r.fromUid === targetUid && r.toUid === viewerUid && r.status === 'pending'
  );
  if (pendingReceived) return 'pending_received';

  return 'none';
}

export function getClientAuthHeaders(preferredUid?: string): Record<string, string> {
  const headers: Record<string, string> = {};
  if (typeof window === 'undefined') return headers;

  try {
    const activeUid = preferredUid || localStorage.getItem('fr8x_active_user_uid');
    if (activeUid) {
      headers['x-fr8x-user-uid'] = activeUid;
      headers['x-fr8x-session'] = activeUid;
    }

    // Inspect localStorage for sb-*-auth-token or Bearer token
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('sb-') && key.endsWith('-auth-token')) {
        try {
          const val = JSON.parse(localStorage.getItem(key) || '{}');
          const token = val?.access_token || (Array.isArray(val) ? val[0] : null);
          if (token && typeof token === 'string') {
            headers['Authorization'] = `Bearer ${token}`;
            break;
          }
        } catch {}
      }
    }
  } catch {}

  return headers;
}

export async function syncConnectionsFromServer(uid: string): Promise<void> {
  if (typeof window === 'undefined' || !uid) return;
  try {
    const authHeaders = getClientAuthHeaders(uid);
    const [incomingRes, outgoingRes, withdrawnRes, connRes] = await Promise.all([
      fetch('/api/people/connections?tab=incoming', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()).catch(() => null),
      fetch('/api/people/connections?tab=outgoing', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()).catch(() => null),
      fetch('/api/people/connections?tab=withdrawn', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()).catch(() => null),
      fetch('/api/people/connections?tab=connections', { headers: authHeaders, credentials: 'include' }).then((r) => r.json()).catch(() => null),
    ]);

    const allRequests: ConnectionRequest[] = [];
    const seenReqIds = new Set<string>();

    if (incomingRes?.success && Array.isArray(incomingRes.data)) {
      incomingRes.data.forEach((item: any) => {
        if (!item || !item.id || seenReqIds.has(item.id)) return;
        const p = item.profiles || {};
        const fromUid = p.id || item.requester_id;
        if (!fromUid || !uid) return;
        seenReqIds.add(item.id);
        allRequests.push({
          id: item.id,
          fromUid: String(fromUid),
          toUid: String(uid),
          senderName: p.display_name || p.full_name || 'Freight Colleague',
          senderRole: p.designation || p.headline,
          senderCompany: p.company_name || p.company,
          senderAvatarUrl: p.avatar_url,
          recipientName: '',
          note: item.message,
          status: item.status || 'pending',
          createdAt: item.created_at || new Date().toISOString(),
        });
      });
    }

    if (outgoingRes?.success && Array.isArray(outgoingRes.data)) {
      outgoingRes.data.forEach((item: any) => {
        if (!item || !item.id || seenReqIds.has(item.id)) return;
        const p = item.profiles || {};
        const toUid = p.id || item.recipient_id;
        if (!toUid || !uid) return;
        seenReqIds.add(item.id);
        allRequests.push({
          id: item.id,
          fromUid: String(uid),
          toUid: String(toUid),
          senderName: '',
          recipientName: p.display_name || p.full_name || 'Freight Colleague',
          recipientCompany: p.company_name || p.company,
          recipientAvatarUrl: p.avatar_url,
          note: item.message,
          status: item.status || 'pending',
          createdAt: item.created_at || new Date().toISOString(),
        });
      });
    }

    if (withdrawnRes?.success && Array.isArray(withdrawnRes.data)) {
      withdrawnRes.data.forEach((item: any) => {
        if (!item || !item.id || seenReqIds.has(item.id)) return;
        const p = item.profiles || {};
        const toUid = p.id || item.recipient_id;
        if (!toUid || !uid) return;
        seenReqIds.add(item.id);
        allRequests.push({
          id: item.id,
          fromUid: String(uid),
          toUid: String(toUid),
          senderName: '',
          recipientName: p.display_name || p.full_name || 'Freight Colleague',
          recipientCompany: p.company_name || p.company,
          recipientAvatarUrl: p.avatar_url,
          note: item.message,
          status: 'cancelled',
          createdAt: item.created_at || new Date().toISOString(),
        });
      });
    }

    // Merge with any existing requests in local storage not yet overwritten
    const existing = getAllConnectionRequests();
    existing.forEach((r) => {
      if (!seenReqIds.has(r.id)) {
        allRequests.push(r);
      }
    });

    saveConnectionRequests(allRequests);

    // Sync connected map
    if (connRes?.success && Array.isArray(connRes.data)) {
      const map = getConnectionsMap();
      const connectedIds = connRes.data.map((c: any) => c.connected_to || c.profiles?.id).filter(Boolean);
      map[uid] = Array.from(new Set([...(map[uid] || []), ...connectedIds]));
      saveConnectionsMap(map);
    }
  } catch (err) {
    console.warn('[Connections] syncConnectionsFromServer error:', err);
  }
}

export async function sendConnectionRequest(
  fromUser: Partial<UserProfile>,
  toUser: Partial<UserProfile>,
  note?: string
): Promise<ConnectionRequest> {
  if (!fromUser.uid || !toUser.uid) {
    throw new Error('Valid sender and recipient UIDs required');
  }
  if (fromUser.uid === toUser.uid || isSelfProfile(fromUser, toUser)) {
    throw new Error('Cannot send a connection request to yourself');
  }

  const all = getAllConnectionRequests();
  // Filter out any existing pending request between these two
  const filtered = all.filter(
    (r) =>
      !(
        (r.fromUid === fromUser.uid && r.toUid === toUser.uid) ||
        (r.fromUid === toUser.uid && r.toUid === fromUser.uid)
      )
  );

  const senderName = resolveDisplayName(fromUser, 'Freight Colleague');
  const recipientName = resolveDisplayName(toUser, 'Freight Colleague');

  const newId = typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `00000000-0000-4000-8000-${Date.now().toString(16).padStart(12, '0')}`;

  const newRequest: ConnectionRequest = {
    id: newId,
    fromUid: fromUser.uid,
    toUid: toUser.uid,
    senderName,
    senderRole: fromUser.designation,
    senderCompany: fromUser.company,
    senderAvatarUrl: fromUser.avatarUrl,
    senderEmail: fromUser.email,
    recipientName,
    recipientCompany: toUser.company,
    recipientAvatarUrl: toUser.avatarUrl,
    note: note ? note.trim() : undefined,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  filtered.unshift(newRequest);
  saveConnectionRequests(filtered);
  dispatchConnectionsChanged();

  // Authoritatively persist outgoing request and recipient notification via API
  if (typeof window !== 'undefined' && toUser.uid) {
    const authHeaders = getClientAuthHeaders(fromUser.uid);
    try {
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({
          action: 'send',
          target_id: toUser.uid,
          message: note ? note.trim().slice(0, 300) : undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.success === false)) {
        // Rollback optimistic addition on server failure
        const rollbackList = getAllConnectionRequests().filter((r) => r.id !== newId);
        saveConnectionRequests(rollbackList);
        dispatchConnectionsChanged();
        throw new Error(data?.error || `Failed to send connection request (${res.status})`);
      }

      if (data?.request_id && data.request_id !== newId) {
        newRequest.id = data.request_id;
        const currentList = getAllConnectionRequests();
        saveConnectionRequests(
          currentList.map((r) => (r.id === newId ? { ...r, id: data.request_id } : r))
        );
      }
      dispatchConnectionsChanged();
    } catch (err: any) {
      // Re-throw so caller can display actionable error and handle UI rollback
      throw err;
    }
  }

  return newRequest;
}

export async function acceptConnectionRequest(
  requestId: string,
  currentUser?: Partial<UserProfile>
): Promise<boolean> {
  const all = getAllConnectionRequests();
  const req = all.find((r) => r.id === requestId);
  if (!req) return false;

  const previousStatus = req.status;
  req.status = 'accepted';
  req.updatedAt = new Date().toISOString();
  saveConnectionRequests(all);

  // Add mutual connection
  const map = getConnectionsMap();
  const listA = new Set(map[req.fromUid] || []);
  const listB = new Set(map[req.toUid] || []);

  listA.add(req.toUid);
  listB.add(req.fromUid);

  map[req.fromUid] = Array.from(listA);
  map[req.toUid] = Array.from(listB);
  saveConnectionsMap(map);
  dispatchConnectionsChanged();

  // Authoritatively accept via PostgreSQL API
  if (typeof window !== 'undefined' && requestId) {
    const authHeaders = getClientAuthHeaders(currentUser?.uid || req.toUid);
    try {
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({
          action: 'accept',
          request_id: requestId,
        }),
      });

      const data = await res.json().catch(() => null);
      if (!res.ok || (data && data.success === false)) {
        // Rollback
        req.status = previousStatus;
        saveConnectionRequests(all);
        dispatchConnectionsChanged();
        throw new Error(data?.error || 'Failed to accept connection request');
      }

      dispatchConnectionsChanged();
      return true;
    } catch (err) {
      throw err;
    }
  }

  return true;
}

export async function declineConnectionRequest(
  requestId: string,
  currentUser?: Partial<UserProfile>
): Promise<boolean> {
  const all = getAllConnectionRequests();
  const req = all.find((r) => r.id === requestId);
  if (!req) return false;

  const prevStatus = req.status;
  req.status = 'declined';
  req.updatedAt = new Date().toISOString();
  saveConnectionRequests(all);
  dispatchConnectionsChanged();

  if (typeof window !== 'undefined' && requestId) {
    const authHeaders = getClientAuthHeaders(currentUser?.uid || req.toUid);
    try {
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({
          action: 'decline',
          request_id: requestId,
        }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || (data && data.success === false)) {
        req.status = prevStatus;
        saveConnectionRequests(all);
        dispatchConnectionsChanged();
        throw new Error(data?.error || 'Failed to decline request');
      }
      dispatchConnectionsChanged();
      return true;
    } catch (err) {
      throw err;
    }
  }

  return true;
}

export async function cancelConnectionRequest(
  requestId: string,
  currentUser?: Partial<UserProfile>,
  targetUid?: string
): Promise<boolean> {
  const all = getAllConnectionRequests();
  const req = all.find(
    (r) =>
      (requestId && r.id === requestId) ||
      (targetUid && r.toUid === targetUid)
  );
  const effectiveReqId = req?.id || requestId;
  const effectiveTargetId = targetUid || req?.toUid;

  // Immediately remove or mark cancelled locally
  const remaining = all.filter(
    (r) => !((requestId && r.id === requestId) || (targetUid && r.toUid === targetUid))
  );
  saveConnectionRequests(remaining);
  dispatchConnectionsChanged();

  if (typeof window !== 'undefined' && (effectiveReqId || effectiveTargetId)) {
    const authHeaders = getClientAuthHeaders(currentUser?.uid || req?.fromUid);
    try {
      const res = await fetch('/api/people/connections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        credentials: 'include',
        body: JSON.stringify({
          action: 'cancel',
          request_id: effectiveReqId || undefined,
          target_id: effectiveTargetId || undefined,
        }),
      });

      const data = await res.json().catch(() => null);

      if (!res.ok || (data && data.success === false)) {
        const errMessage = (data?.error || '').toLowerCase();
        // If not found or already inactive on server, it is ALREADY cancelled.
        // Treat as idempotent success and DO NOT roll back to pending!
        if (res.status === 404 || errMessage.includes('not found') || errMessage.includes('inactive')) {
          dispatchConnectionsChanged();
          return true;
        }

        // Only restore for genuine authorization or server faults
        if (req) {
          saveConnectionRequests([...remaining, req]);
        }
        dispatchConnectionsChanged();
        throw new Error(data?.error || 'Failed to withdraw connection request');
      }

      dispatchConnectionsChanged();
      return true;
    } catch (err: any) {
      const errMessage = (err?.message || '').toLowerCase();
      if (errMessage.includes('not found') || errMessage.includes('inactive')) {
        dispatchConnectionsChanged();
        return true;
      }
      throw err;
    }
  }

  return true;
}

export function removeConnection(uidA: string, uidB: string) {
  if (!uidA || !uidB) return;
  const map = getConnectionsMap();

  if (map[uidA]) {
    map[uidA] = map[uidA].filter((id) => id !== uidB);
  }
  if (map[uidB]) {
    map[uidB] = map[uidB].filter((id) => id !== uidA);
  }
  saveConnectionsMap(map);

  if (typeof window !== 'undefined') {
    const authHeaders = getClientAuthHeaders(uidA);
    fetch('/api/people/connections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      credentials: 'include',
      body: JSON.stringify({
        action: 'remove',
        target_id: uidB,
      }),
    })
      .then((res) => {
        if (res.ok) dispatchConnectionsChanged();
      })
      .catch(() => {});
  }

  // Sync to users storage
  if (typeof window !== 'undefined') {
    try {
      const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (usersRaw) {
        const users: UserProfile[] = JSON.parse(usersRaw);
        let changed = false;
        users.forEach((u) => {
          if (u.uid === uidA && u.contacts) {
            u.contacts = u.contacts.filter((id) => id !== uidB);
            changed = true;
          }
          if (u.uid === uidB && u.contacts) {
            u.contacts = u.contacts.filter((id) => id !== uidA);
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
      }
    } catch {}
  }
}

// ── Privacy Settings ────────────────────────────────────────────────────────

export function getUserPrivacySettings(
  userOrUid?: Partial<UserProfile> | string | null,
  currentProfileSettings?: UserPrivacySettings
): UserPrivacySettings {
  if (!userOrUid) return DEFAULT_PRIVACY_SETTINGS;

  const uid = typeof userOrUid === 'string' ? userOrUid : userOrUid.uid;
  const settings =
    typeof userOrUid === 'object' && userOrUid.privacySettings
      ? userOrUid.privacySettings
      : currentProfileSettings;

  if (settings) {
    return { ...DEFAULT_PRIVACY_SETTINGS, ...settings };
  }

  if (typeof window !== 'undefined' && uid) {
    try {
      const raw = localStorage.getItem(PRIVACY_SETTINGS_KEY);
      if (raw) {
        const map = JSON.parse(raw);
        if (map && map[uid]) {
          return { ...DEFAULT_PRIVACY_SETTINGS, ...map[uid] };
        }
      }
    } catch {}
  }

  return DEFAULT_PRIVACY_SETTINGS;
}

export function saveUserPrivacySettings(
  uid: string,
  settings: UserPrivacySettings
) {
  if (!uid || typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PRIVACY_SETTINGS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[uid] = settings;
    localStorage.setItem(PRIVACY_SETTINGS_KEY, JSON.stringify(map));

    // Also update users storage
    const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
    if (usersRaw) {
      const users: UserProfile[] = JSON.parse(usersRaw);
      const user = users.find((u) => u.uid === uid);
      if (user) {
        user.privacySettings = settings;
        localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
      }
    }

    // Persist to authoritative Supabase PostgreSQL via API
    fetch('/api/user/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, privacySettings: settings }),
    }).catch(() => {});

    dispatchConnectionsChanged();
  } catch {}
}


// ── Privacy Masking Utilities ───────────────────────────────────────────────

export function maskEmail(email?: string): string {
  if (!email || !email.includes('@')) return '••••••••@domain.com';
  const [local, domain] = email.split('@');
  if (local.length <= 2) {
    return `${local[0] || '•'}•••@${domain}`;
  }
  const visibleStart = local.slice(0, 1);
  const visibleEnd = local.slice(-1);
  const maskedLocal = `${visibleStart}${'•'.repeat(Math.max(4, local.length - 2))}${visibleEnd}`;
  return `${maskedLocal}@${domain}`;
}

export function maskPhone(phone?: string): string {
  if (!phone) return '+•• ••••• ••••';
  const clean = phone.trim();
  if (clean.length <= 5) return '•••••••';
  const prefix = clean.slice(0, 3); // e.g. +91
  const suffix = clean.slice(-2); // e.g. 01
  return `${prefix} ••••• •••${suffix}`;
}

export function maskStatutory(val?: string): string {
  if (!val) return '••••••••••';
  if (val.length <= 4) return '••••';
  return `${val.slice(0, 2)}${'•'.repeat(val.length - 4)}${val.slice(-2)}`;
}
