// FR8X-CON Real Presence System
// 3-state presence: online+active (green), online+inactive tab (orange), away (red)
// Uses Firestore with a 5-minute staleness threshold.
// Minimal bandwidth: writes only on state change + heartbeat every 60s.

import {
  doc,
  setDoc,
  onSnapshot,
  serverTimestamp,
  type Unsubscribe,
} from "firebase/firestore";
import { firebaseDb } from "./config";
import { COLLECTIONS } from "@/lib/utils/constants";

export type PresenceStatus = "online" | "away";

export interface PresenceData {
  userId: string;
  status: PresenceStatus;
  tabActive: boolean;
  lastSeen: { seconds: number; nanoseconds: number } | null;
  updatedAt: { seconds: number; nanoseconds: number } | null;
}

export type DotColor = "green" | "orange" | "red";

/**
 * Derive dot color from a presence record.
 * - Green:  online + tab is active
 * - Orange: online + tab is inactive (another tab / minimized)
 * - Red:    away OR lastSeen > 5 minutes ago OR no record
 */
export function getDotColor(presence: PresenceData | null | undefined): DotColor {
  if (!presence) return "red";
  const now = Date.now() / 1000;
  const lastSeen = presence.lastSeen?.seconds ?? 0;
  const stale = now - lastSeen > 300; // 5 minutes

  if (stale) return "red";
  if (presence.status === "away") return "red";
  if (presence.tabActive) return "green";
  return "orange";
}

/**
 * Get status label for UI display.
 */
export function getStatusLabel(color: DotColor): string {
  switch (color) {
    case "green":
      return "Active now";
    case "orange":
      return "Online";
    case "red":
      return "Away";
  }
}

let heartbeatInterval: ReturnType<typeof setInterval> | null = null;
let currentUserId: string | null = null;

/**
 * Initialize presence tracking for the logged-in user.
 * Call once on auth. Cleans up on logout.
 */
export function initPresence(userId: string): () => void {
  currentUserId = userId;

  const presenceRef = doc(firebaseDb, COLLECTIONS.PRESENCE, userId);

  const writePresence = async (tabActive: boolean, status: PresenceStatus) => {
    try {
      await setDoc(
        presenceRef,
        {
          userId,
          status,
          tabActive,
          lastSeen: serverTimestamp(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {
      // Presence is non-critical — suppress errors silently
    }
  };

  // Initial online + active
  writePresence(true, "online");

  // Heartbeat every 60s to keep lastSeen fresh
  heartbeatInterval = setInterval(() => {
    const isActive = !document.hidden;
    writePresence(isActive, "online");
  }, 60_000);

  // Tab visibility change
  const handleVisibilityChange = () => {
    if (document.hidden) {
      writePresence(false, "online");
    } else {
      writePresence(true, "online");
    }
  };

  // Before unload / close tab
  const handleBeforeUnload = () => {
    // Use sendBeacon for reliability on close
    try {
      const payload = JSON.stringify({
        userId,
        status: "away",
        tabActive: false,
      });
      navigator.sendBeacon("/api/presence/away", payload);
    } catch {
      writePresence(false, "away");
    }
  };

  document.addEventListener("visibilitychange", handleVisibilityChange);
  window.addEventListener("beforeunload", handleBeforeUnload);

  return () => {
    // Cleanup
    if (heartbeatInterval) {
      clearInterval(heartbeatInterval);
      heartbeatInterval = null;
    }
    document.removeEventListener("visibilitychange", handleVisibilityChange);
    window.removeEventListener("beforeunload", handleBeforeUnload);
    writePresence(false, "away");
    currentUserId = null;
  };
}

/**
 * Subscribe to a single user's presence in real time.
 */
export function subscribeToPresence(
  userId: string,
  callback: (data: PresenceData | null) => void
): Unsubscribe {
  const presenceRef = doc(firebaseDb, COLLECTIONS.PRESENCE, userId);
  return onSnapshot(
    presenceRef,
    (snap) => {
      if (!snap.exists()) {
        callback(null);
        return;
      }
      callback(snap.data() as PresenceData);
    },
    () => callback(null)
  );
}

/**
 * Subscribe to presence for multiple users at once.
 * Returns a cleanup function.
 */
export function subscribeToMultiPresence(
  userIds: string[],
  callback: (presenceMap: Record<string, PresenceData>) => void
): () => void {
  if (userIds.length === 0) {
    callback({});
    return () => {};
  }

  const presenceMap: Record<string, PresenceData> = {};
  const unsubscribers: Unsubscribe[] = [];

  userIds.forEach((uid) => {
    const unsub = subscribeToPresence(uid, (data) => {
      if (data) {
        presenceMap[uid] = data;
      } else {
        delete presenceMap[uid];
      }
      callback({ ...presenceMap });
    });
    unsubscribers.push(unsub);
  });

  return () => unsubscribers.forEach((u) => u());
}
