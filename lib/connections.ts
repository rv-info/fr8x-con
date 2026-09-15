import {
  UserProfile,
  UserPrivacySettings,
  DEFAULT_PRIVACY_SETTINGS,
  ConnectionRequest,
  ConnectionRequestStatus,
  PrivacyLevel,
} from './types';

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
  const list = map[uid] || [];

  // Also inspect stored user profile if available
  if (typeof window !== 'undefined') {
    try {
      const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (usersRaw) {
        const users: UserProfile[] = JSON.parse(usersRaw);
        const user = users.find((u) => u.uid === uid);
        if (user && Array.isArray(user.contacts) && user.contacts.length > 0) {
          const combined = Array.from(new Set([...list, ...user.contacts]));
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
    return JSON.parse(raw);
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
} {
  if (!uid) return { incoming: [], outgoing: [] };
  const all = getAllConnectionRequests();
  const incoming = all.filter((r) => r.toUid === uid && r.status === 'pending');
  const outgoing = all.filter((r) => r.fromUid === uid && r.status === 'pending');
  return { incoming, outgoing };
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

export function sendConnectionRequest(
  fromUser: Partial<UserProfile>,
  toUser: Partial<UserProfile>,
  note?: string
): ConnectionRequest {
  if (!fromUser.uid || !toUser.uid) {
    throw new Error('Valid sender and recipient UIDs required');
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

  const senderName =
    fromUser.displayName ||
    `${fromUser.firstName || ''} ${fromUser.lastName || ''}`.trim() ||
    fromUser.email ||
    'Freight Colleague';

  const recipientName =
    toUser.displayName ||
    `${toUser.firstName || ''} ${toUser.lastName || ''}`.trim() ||
    toUser.email ||
    'Freight Colleague';

  const newRequest: ConnectionRequest = {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
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

  // Push an in-app notification if storage is present
  try {
    const NOTIF_KEY = 'fr8x_app_notifications_v1';
    const notifsRaw = localStorage.getItem(NOTIF_KEY);
    const notifs = notifsRaw ? JSON.parse(notifsRaw) : [];
    notifs.unshift({
      id: `notif-${Date.now()}`,
      title: 'New Connection Request',
      desc: `${senderName} (${fromUser.company || 'Enterprise Member'}) sent you a connection request.`,
      time: 'Just now',
      createdAt: new Date().toISOString(),
      read: false,
      type: 'network',
      category: 'platform',
      relatedId: newRequest.id,
      actionLabel: 'Review Request',
    });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs.slice(0, 50)));
  } catch {}

  return newRequest;
}

export function acceptConnectionRequest(
  requestId: string,
  currentUser?: Partial<UserProfile>
) {
  const all = getAllConnectionRequests();
  const req = all.find((r) => r.id === requestId);
  if (!req) return;

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

  // Sync to users storage if possible
  if (typeof window !== 'undefined') {
    try {
      const usersRaw = localStorage.getItem(USERS_STORAGE_KEY);
      if (usersRaw) {
        const users: UserProfile[] = JSON.parse(usersRaw);
        let changed = false;
        users.forEach((u) => {
          if (u.uid === req.fromUid) {
            const set = new Set(u.contacts || []);
            set.add(req.toUid);
            u.contacts = Array.from(set);
            changed = true;
          }
          if (u.uid === req.toUid) {
            const set = new Set(u.contacts || []);
            set.add(req.fromUid);
            u.contacts = Array.from(set);
            changed = true;
          }
        });
        if (changed) {
          localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
        }
      }
    } catch {}
  }

  // Also create acceptance notification for original requester
  try {
    const NOTIF_KEY = 'fr8x_app_notifications_v1';
    const notifsRaw = localStorage.getItem(NOTIF_KEY);
    const notifs = notifsRaw ? JSON.parse(notifsRaw) : [];
    const accepterName =
      currentUser?.displayName ||
      req.recipientName ||
      'Trade Partner';
    notifs.unshift({
      id: `notif-${Date.now()}`,
      title: 'Connection Accepted',
      desc: `${accepterName} accepted your connection request. Direct contact information is now unlocked.`,
      time: 'Just now',
      createdAt: new Date().toISOString(),
      read: false,
      type: 'network',
      category: 'platform',
      actionLabel: 'Start Chat',
    });
    localStorage.setItem(NOTIF_KEY, JSON.stringify(notifs.slice(0, 50)));
  } catch {}
}

export function declineConnectionRequest(requestId: string) {
  const all = getAllConnectionRequests();
  const req = all.find((r) => r.id === requestId);
  if (!req) return;

  req.status = 'declined';
  req.updatedAt = new Date().toISOString();
  saveConnectionRequests(all);
}

export function cancelConnectionRequest(requestId: string) {
  const all = getAllConnectionRequests();
  const filtered = all.filter((r) => r.id !== requestId);
  saveConnectionRequests(filtered);
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
