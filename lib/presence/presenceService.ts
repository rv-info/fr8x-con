/**
 * lib/presence/presenceService.ts
 * Real-time 3-state presence service with tab visibility listener,
 * heartbeat throttling, and automatic 5-minute TTL expiration.
 */

import { PresenceStatus, UserPresenceState } from '@/lib/types';
import { updateUserPresenceInDB, getUserPresenceFromDB } from '@/lib/firebase/firestore';

const HEARTBEAT_INTERVAL_MS = 90_000; // 90 seconds throttled heartbeat
const PRESENCE_TTL_SECONDS = 300;     // 5 minutes TTL

class PresenceService {
  private currentUserId: string | null = null;
  private currentStatus: PresenceStatus = 'active';
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private lastHeartbeatTime = 0;

  public initialize(userId: string): void {
    if (typeof window === 'undefined' || !userId) return;
    if (this.currentUserId === userId) return;

    this.currentUserId = userId;
    this.currentStatus = document.visibilityState === 'visible' ? 'active' : 'idle';

    // Broadcast initial state
    this.sendHeartbeat();

    // Listen for tab focus / background visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange);
    window.addEventListener('focus', this.handleFocus);
    window.addEventListener('blur', this.handleBlur);
    window.addEventListener('beforeunload', this.handleUnload);

    // Throttled heartbeat loop
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    this.heartbeatTimer = setInterval(() => this.sendHeartbeat(), HEARTBEAT_INTERVAL_MS);
  }

  public cleanup(): void {
    if (typeof window === 'undefined') return;
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('focus', this.handleFocus);
    window.removeEventListener('blur', this.handleBlur);
    window.removeEventListener('beforeunload', this.handleUnload);

    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  private handleVisibilityChange = () => {
    const nextStatus: PresenceStatus = document.visibilityState === 'visible' ? 'active' : 'idle';
    if (nextStatus !== this.currentStatus) {
      this.currentStatus = nextStatus;
      this.sendHeartbeat();
    }
  };

  private handleFocus = () => {
    if (this.currentStatus !== 'active') {
      this.currentStatus = 'active';
      this.sendHeartbeat();
    }
  };

  private handleBlur = () => {
    if (this.currentStatus === 'active') {
      this.currentStatus = 'idle';
      this.sendHeartbeat();
    }
  };

  private handleUnload = () => {
    if (!this.currentUserId) return;
    // Mark as away on window close
    const payload: UserPresenceState = {
      userId: this.currentUserId,
      status: 'away',
      lastHeartbeat: new Date().toISOString(),
      ttlExpiry: Math.floor(Date.now() / 1000),
    };
    try {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon('/api/presence', blob);
    } catch {}
  };

  public sendHeartbeat(): void {
    if (!this.currentUserId) return;
    const now = Date.now();

    // Prevent burst writes (max 1 write per 5 seconds)
    if (now - this.lastHeartbeatTime < 5000) return;
    this.lastHeartbeatTime = now;

    const ttlExpiry = Math.floor(now / 1000) + PRESENCE_TTL_SECONDS;
    const presence: UserPresenceState = {
      userId: this.currentUserId,
      status: this.currentStatus,
      lastHeartbeat: new Date(now).toISOString(),
      ttlExpiry,
      deviceType: window.innerWidth < 768 ? 'mobile' : 'desktop',
    };

    updateUserPresenceInDB(presence).catch(() => {});
  }

  public async getContactPresence(userId: string): Promise<PresenceStatus> {
    const presence = await getUserPresenceFromDB(userId);
    if (!presence) return 'away';
    return presence.status;
  }
}

export const presenceService = new PresenceService();
