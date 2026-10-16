/**
 * lib/outbox/worker.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Outbox Background Worker: Processes pending events with exponential backoff,
 * jitter, dead-letter tracking, and idempotent handlers.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { OutboxEvent, OutboxEventHandler } from './types';
import { outboxService } from './service';
import { safeCache } from '@/lib/cache/safe-cache';

export class OutboxWorker {
  private handlers: Map<string, OutboxEventHandler[]> = new Map();
  private isProcessing = false;

  constructor() {
    this.registerDefaultHandlers();
  }

  /**
   * Registers a callback for a specific event type.
   */
  public registerHandler(eventType: string, handler: OutboxEventHandler): void {
    const list = this.handlers.get(eventType) || [];
    list.push(handler);
    this.handlers.set(eventType, list);
  }

  /**
   * Default built-in handlers for social networking lifecycle events.
   */
  private registerDefaultHandlers(): void {
    // 1. Connection Requested: Invalidate viewer/recipient cache
    this.registerHandler('connection.requested', async (evt) => {
      const recipientId = evt.payload?.recipient_id as string;
      const senderId = evt.payload?.sender_id as string;
      if (recipientId) safeCache.invalidateUser(recipientId);
      if (senderId) safeCache.invalidateUser(senderId);
    });

    // 2. Connection Accepted: Invalidate both users' connection caches
    this.registerHandler('connection.accepted', async (evt) => {
      const userA = evt.payload?.user_a as string;
      const userB = evt.payload?.user_b as string;
      if (userA) safeCache.invalidateUser(userA);
      if (userB) safeCache.invalidateUser(userB);
    });

    // 3. Profile Updated: Invalidate profile cache
    this.registerHandler('profile.updated', async (evt) => {
      const userId = (evt.payload?.user_id as string) || evt.aggregate_id;
      if (userId) safeCache.invalidateUser(userId);
    });

    // 4. Post Created: Invalidate timeline feed caches
    this.registerHandler('post.created', async () => {
      safeCache.invalidateFeed();
    });
  }

  /**
   * Calculates exponential backoff with randomized jitter in milliseconds.
   */
  public calculateBackoffMs(retryCount: number): number {
    const baseMs = 1000;
    const maxMs = 3600000; // 1 hour max
    const exponential = Math.min(maxMs, baseMs * Math.pow(2, retryCount));
    const jitter = Math.random() * 500;
    return Math.round(exponential + jitter);
  }

  /**
   * Executes a single outbox event through registered handlers.
   */
  public async processEvent(evt: OutboxEvent): Promise<boolean> {
    await outboxService.updateEventStatus(evt.id, { status: 'processing' });

    const handlers = this.handlers.get(evt.event_type) || [];

    try {
      for (const handler of handlers) {
        await handler(evt);
      }

      await outboxService.updateEventStatus(evt.id, {
        status: 'completed',
        processed_at: new Date().toISOString(),
        error_message: null,
      });

      return true;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const nextRetryCount = evt.retry_count + 1;

      if (nextRetryCount >= evt.max_retries) {
        // Transition to Dead-Letter Queue
        await outboxService.updateEventStatus(evt.id, {
          status: 'dead_letter',
          retry_count: nextRetryCount,
          error_message: `Dead Letter: Exceeded max retries (${evt.max_retries}). Last error: ${errorMsg}`,
          processed_at: new Date().toISOString(),
        });
      } else {
        // Schedule next retry with exponential backoff
        const backoffMs = this.calculateBackoffMs(nextRetryCount);
        const nextScheduled = new Date(Date.now() + backoffMs).toISOString();

        await outboxService.updateEventStatus(evt.id, {
          status: 'failed',
          retry_count: nextRetryCount,
          error_message: errorMsg,
          scheduled_at: nextScheduled,
        });
      }

      return false;
    }
  }

  /**
   * Flushes a batch of pending events.
   */
  public async processBatch(batchSize = 25): Promise<{
    processed: number;
    succeeded: number;
    failed: number;
  }> {
    if (this.isProcessing) {
      return { processed: 0, succeeded: 0, failed: 0 };
    }

    this.isProcessing = true;
    let succeeded = 0;
    let failed = 0;

    try {
      const events = await outboxService.fetchPendingEvents(batchSize);

      for (const evt of events) {
        const ok = await this.processEvent(evt);
        if (ok) succeeded++;
        else failed++;
      }

      return {
        processed: events.length,
        succeeded,
        failed,
      };
    } finally {
      this.isProcessing = false;
    }
  }
}

export const outboxWorker = new OutboxWorker();
