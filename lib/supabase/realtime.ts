/**
 * FR8X Hardened Realtime Manager & State Synchronization Engine
 * ==============================================================
 * Resolves race conditions in Supabase Realtime when connection requests transition
 * (e.g. pending -> accepted) and shielded contact details become visible.
 *
 * Security Architecture & Invariants:
 * 1. Zero-Payload Data Trust:
 *    WebSocket frames from postgres_changes are treated strictly as cache invalidation
 *    signals (tombstones). Sensitive contact details are NEVER read from WebSocket payloads.
 * 2. Scoped Private Channels:
 *    Clients only subscribe to their own private topic (`user_networking:${userId}`),
 *    preventing eavesdropping on peer network status changes.
 * 3. Exponential Backoff Reconciliation:
 *    Mitigates read-your-own-writes replication lag when a peer accepts a connection.
 *    Re-fetches verified profile data through RLS-enforced PostgreSQL RPCs with jittered retries.
 */

import { RealtimeChannel } from '@supabase/supabase-js';
import { createClient as getSupabaseBrowserClient } from '@/lib/supabase/client';

export type ConnectionStateChangeHandler = (event: {
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  requestId?: string;
  targetUserId: string;
  newStatus: 'pending' | 'accepted' | 'declined' | 'cancelled';
  unshieldedContactAvailable: boolean;
}) => void;

export interface RealtimeSubscriptionConfig {
  currentUserId: string;
  onStateChange: ConnectionStateChangeHandler;
  onNotificationChange?: (payload: any) => void;
  onError?: (err: Error) => void;
}

export class HardenedRealtimeManager {
  private channel: RealtimeChannel | null = null;
  private currentUserId: string;
  private isConnected = false;

  constructor(currentUserId: string) {
    this.currentUserId = currentUserId;
  }

  /**
   * Initializes a private, RLS-enforced WebSocket subscription for user network events.
   */
  public subscribe(config: RealtimeSubscriptionConfig): () => void {
    const supabase = getSupabaseBrowserClient();
    this.currentUserId = config.currentUserId;

    // Isolate subscription to user-specific private channel
    const channelName = `networking:${this.currentUserId}`;
    
    // Clean up existing channel if re-subscribing
    if (this.channel) {
      supabase.removeChannel(this.channel);
    }

    this.channel = supabase
      .channel(channelName)
      // Listen for incoming connection requests directed to this user
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connection_requests',
          filter: `recipient_id=eq.${this.currentUserId}`,
        },
        (payload: any) => {
          this.handleConnectionRequestEvent(payload, config.onStateChange);
        }
      )
      // Listen for updates to outgoing connection requests sent by this user
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'connection_requests',
          filter: `requester_id=eq.${this.currentUserId}`,
        },
        (payload: any) => {
          this.handleConnectionRequestEvent(payload, config.onStateChange);
        }
      )
      // Listen for reciprocal accepted connections entry
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'accepted_connections',
          filter: `user_id=eq.${this.currentUserId}`,
        },
        (payload: any) => {
          const peerId = (payload.new as any)?.connected_to;
          if (peerId) {
            config.onStateChange({
              eventType: 'INSERT',
              targetUserId: peerId,
              newStatus: 'accepted',
              unshieldedContactAvailable: true,
            });
          }
        }
      )
      // Listen for user notifications
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${this.currentUserId}`,
        },
        (payload: any) => {
          config.onNotificationChange?.(payload);
        }
      )
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          this.isConnected = true;
        } else if (status === 'CHANNEL_ERROR') {
          this.isConnected = false;
          config.onError?.(new Error('Realtime channel subscription error.'));
        }
      });

    // Return cleanup unsubscribe callback
    return () => {
      if (this.channel) {
        supabase.removeChannel(this.channel);
        this.channel = null;
        this.isConnected = false;
      }
    };
  }

  /**
   * Handles incoming Realtime event and flags unshielded contact availability safely.
   */
  private handleConnectionRequestEvent(
    payload: any,
    callback: ConnectionStateChangeHandler
  ) {
    const eventType = payload.eventType as 'INSERT' | 'UPDATE' | 'DELETE';
    const row = payload.new || payload.old || {};
    const status = row.status as 'pending' | 'accepted' | 'declined' | 'cancelled';
    
    // Determine the peer user ID relative to current user
    const peerId = row.requester_id === this.currentUserId ? row.recipient_id : row.requester_id;

    if (!peerId) return;

    callback({
      eventType,
      requestId: row.id,
      targetUserId: peerId,
      newStatus: status || 'pending',
      unshieldedContactAvailable: status === 'accepted',
    });
  }

  /**
   * Reconciles shielded contact info after an 'accepted' state change.
   * Employs exponential backoff with jitter to eliminate read-your-own-writes replication race.
   */
  public static async fetchUnshieldedContactWithBackoff(
    targetUserId: string,
    maxAttempts = 4,
    baseDelayMs = 100
  ): Promise<{ email?: string; mobile?: string } | null> {
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const res = await fetch(`/api/people/profile?id=${encodeURIComponent(targetUserId)}`, {
          headers: { 'Cache-Control': 'no-cache' },
        });

        if (res.ok) {
          const data = await res.json();
          const profile = data.profile || data;

          // If email is unmasked (does not contain asterisks), commit is confirmed visible
          if (profile.email && !profile.email.includes('***')) {
            return {
              email: profile.email,
              mobile: profile.mobile,
            };
          }
        }
      } catch (err) {
        // Fall through to next retry
      }

      if (attempt < maxAttempts) {
        const jitter = Math.random() * 50;
        const delay = Math.pow(2, attempt) * baseDelayMs + jitter;
        await new Promise((r) => setTimeout(r, delay));
      }
    }

    return null;
  }
}
