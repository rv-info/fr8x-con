/**
 * lib/intelligence/events.ts
 * Idempotent logistics event tracking and telemetry bus.
 */

import { IdempotentEvent, LogisticsEventType, FeedSurface } from '@/lib/types';

// Simple deterministic hash generator for browser & node environments
export function generateEventId(
  actorId: string,
  eventType: LogisticsEventType,
  targetId: string,
  timeBucketMinutes: number = 5
): string {
  const bucket = Math.floor(Date.now() / (timeBucketMinutes * 60 * 1000));
  const raw = `${actorId}:${eventType}:${targetId}:${bucket}`;
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const char = raw.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0; // Convert to 32bit integer
  }
  return `evt_${Math.abs(hash).toString(36)}_${bucket.toString(36)}`;
}

class EventBus {
  private queue: IdempotentEvent[] = [];
  private isFlushing = false;
  private flushIntervalMs = 8000; // Batch low-value telemetry to reduce network traffic
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== 'undefined') {
      this.intervalId = setInterval(() => this.flush(), this.flushIntervalMs);
      window.addEventListener('beforeunload', () => this.flushSync());
    }
  }

  public recordEvent(params: {
    eventType: LogisticsEventType;
    actorId: string;
    actorCompany?: string;
    targetId: string;
    targetType?: string;
    sourceSurface?: FeedSurface | 'rates' | 'auctions' | 'profile' | 'nexus' | 'godfather';
    correlationId?: string;
    rankingVersion?: string;
    metadata?: Record<string, any>;
    immediate?: boolean;
  }): IdempotentEvent {
    const eventId = generateEventId(params.actorId, params.eventType, params.targetId);
    const event: IdempotentEvent = {
      eventId,
      eventType: params.eventType,
      actorId: params.actorId,
      actorCompany: params.actorCompany,
      targetId: params.targetId,
      targetType: params.targetType || 'post',
      timestamp: new Date().toISOString(),
      sourceSurface: params.sourceSurface || 'home',
      correlationId: params.correlationId || `corr_${Date.now()}`,
      rankingVersion: params.rankingVersion || 'v2.1',
      metadata: params.metadata || {},
    };

    if (params.immediate) {
      this.sendBatch([event]);
    } else {
      this.queue.push(event);
      if (this.queue.length >= 10) {
        this.flush();
      }
    }

    return event;
  }

  public async flush(): Promise<void> {
    if (this.isFlushing || this.queue.length === 0) return;
    this.isFlushing = true;

    const batch = [...this.queue];
    this.queue = [];

    try {
      await this.sendBatch(batch);
    } catch (err) {
      // Re-queue on failure if within reason
      if (this.queue.length < 50) {
        this.queue.unshift(...batch.slice(0, 20));
      }
    } finally {
      this.isFlushing = false;
    }
  }

  private async sendBatch(events: IdempotentEvent[]): Promise<void> {
    if (events.length === 0 || typeof window === 'undefined') return;

    await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events }),
      keepalive: true,
    });
  }

  private flushSync(): void {
    if (this.queue.length === 0 || typeof window === 'undefined') return;
    try {
      const blob = new Blob([JSON.stringify({ events: this.queue })], { type: 'application/json' });
      navigator.sendBeacon('/api/events', blob);
      this.queue = [];
    } catch {}
  }
}

export const eventBus = new EventBus();
