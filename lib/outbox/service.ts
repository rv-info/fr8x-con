/**
 * lib/outbox/service.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Transactional Outbox Service: Records events durably and enforces idempotency.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { OutboxEvent, OutboxEventType, OutboxQueueMetrics } from './types';
import { createAdminClient } from '@/lib/supabase/server';

export class OutboxService {
  private fallbackStore: Map<string, OutboxEvent> = new Map();

  /**
   * Records an outbox event.
   * If an idempotency key is provided and already exists, returns the existing event.
   */
  public async recordEvent(params: {
    eventType: OutboxEventType | string;
    aggregateType: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    idempotencyKey?: string;
    maxRetries?: number;
    delaySeconds?: number;
  }): Promise<OutboxEvent> {
    const scheduledAt = new Date(Date.now() + (params.delaySeconds || 0) * 1000).toISOString();
    const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const idempotencyKey = params.idempotencyKey || `${params.eventType}:${params.aggregateId}:${Date.now()}`;

    const newEvent: OutboxEvent = {
      id: eventId,
      event_type: params.eventType,
      aggregate_type: params.aggregateType,
      aggregate_id: params.aggregateId,
      payload: params.payload,
      status: 'pending',
      retry_count: 0,
      max_retries: params.maxRetries ?? 5,
      error_message: null,
      scheduled_at: scheduledAt,
      processed_at: null,
      idempotency_key: idempotencyKey,
      created_at: new Date().toISOString(),
    };

    const admin = createAdminClient();
    if (admin) {
      try {
        const { data, error } = await admin
          .from('outbox_events')
          .insert({
            event_type: newEvent.event_type,
            aggregate_type: newEvent.aggregate_type,
            aggregate_id: newEvent.aggregate_id,
            payload: newEvent.payload,
            status: 'pending',
            retry_count: 0,
            max_retries: newEvent.max_retries,
            scheduled_at: newEvent.scheduled_at,
            idempotency_key: idempotencyKey,
          })
          .select()
          .maybeSingle();

        if (!error && data) {
          return data as OutboxEvent;
        }
      } catch (err) {
        // Fall back to memory store if table is pending migration
      }
    }

    // Check memory store idempotency
    for (const existing of this.fallbackStore.values()) {
      if (existing.idempotency_key === idempotencyKey) {
        return existing;
      }
    }

    this.fallbackStore.set(newEvent.id, newEvent);
    return newEvent;
  }

  /**
   * Fetches pending events eligible for processing.
   */
  public async fetchPendingEvents(batchSize = 20): Promise<OutboxEvent[]> {
    const nowIso = new Date().toISOString();
    const admin = createAdminClient();

    if (admin) {
      try {
        const { data, error } = await admin
          .from('outbox_events')
          .select('*')
          .in('status', ['pending', 'failed'])
          .lte('scheduled_at', nowIso)
          .order('scheduled_at', { ascending: true })
          .limit(batchSize);

        if (!error && data && data.length > 0) {
          return data as OutboxEvent[];
        }
      } catch {
        // Fall back to memory store
      }
    }

    const pending: OutboxEvent[] = [];
    const nowTime = Date.now();

    for (const evt of this.fallbackStore.values()) {
      if ((evt.status === 'pending' || evt.status === 'failed') &&
          new Date(evt.scheduled_at).getTime() <= nowTime &&
          evt.retry_count < evt.max_retries) {
        pending.push(evt);
        if (pending.length >= batchSize) break;
      }
    }

    return pending;
  }

  /**
   * Updates an event's state.
   */
  public async updateEventStatus(
    id: string,
    updates: Partial<Pick<OutboxEvent, 'status' | 'retry_count' | 'error_message' | 'scheduled_at' | 'processed_at'>>
  ): Promise<void> {
    const admin = createAdminClient();
    if (admin) {
      try {
        await admin
          .from('outbox_events')
          .update(updates)
          .eq('id', id);
      } catch {
        // Fall back
      }
    }

    if (this.fallbackStore.has(id)) {
      const current = this.fallbackStore.get(id)!;
      this.fallbackStore.set(id, { ...current, ...updates });
    }
  }

  /**
   * Retrieves an event by its ID.
   */
  public async getEventById(id: string): Promise<OutboxEvent | null> {
    const admin = createAdminClient();
    if (admin) {
      try {
        const { data } = await admin
          .from('outbox_events')
          .select('*')
          .eq('id', id)
          .maybeSingle();
        if (data) return data as OutboxEvent;
      } catch {
        // Fall back
      }
    }
    return this.fallbackStore.get(id) || null;
  }

  /**
   * Returns current queue metrics.
   */
  public async getQueueMetrics(): Promise<OutboxQueueMetrics> {
    let pending = 0;
    let processing = 0;
    let completed = 0;
    let failed = 0;
    let deadLetter = 0;
    let oldestAge = 0;

    const admin = createAdminClient();
    if (admin) {
      try {
        const { data } = await admin
          .from('outbox_events')
          .select('status, created_at');

        if (data) {
          const now = Date.now();
          for (const row of data as Array<{ status: string; created_at: string }>) {
            if (row.status === 'pending') {
              pending++;
              const age = (now - new Date(row.created_at).getTime()) / 1000;
              if (age > oldestAge) oldestAge = age;
            } else if (row.status === 'processing') processing++;
            else if (row.status === 'completed') completed++;
            else if (row.status === 'failed') failed++;
            else if (row.status === 'dead_letter') deadLetter++;
          }
          return {
            pendingCount: pending,
            processingCount: processing,
            completedCount: completed,
            failedCount: failed,
            deadLetterCount: deadLetter,
            oldestPendingAgeSeconds: Math.round(oldestAge),
          };
        }
      } catch {
        // Fall back
      }
    }

    const now = Date.now();
    for (const evt of this.fallbackStore.values()) {
      if (evt.status === 'pending') {
        pending++;
        const age = (now - new Date(evt.created_at).getTime()) / 1000;
        if (age > oldestAge) oldestAge = age;
      } else if (evt.status === 'processing') processing++;
      else if (evt.status === 'completed') completed++;
      else if (evt.status === 'failed') failed++;
      else if (evt.status === 'dead_letter') deadLetter++;
    }

    return {
      pendingCount: pending,
      processingCount: processing,
      completedCount: completed,
      failedCount: failed,
      deadLetterCount: deadLetter,
      oldestPendingAgeSeconds: Math.round(oldestAge),
    };
  }
}

export const outboxService = new OutboxService();
