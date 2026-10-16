/**
 * lib/outbox/types.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Transactional Outbox Event Types & Worker Contracts
 * ─────────────────────────────────────────────────────────────────────────────
 */

export type OutboxEventStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'dead_letter';

export type OutboxEventType =
  | 'connection.requested'
  | 'connection.accepted'
  | 'connection.declined'
  | 'connection.removed'
  | 'user.blocked'
  | 'user.unblocked'
  | 'profile.updated'
  | 'post.created'
  | 'post.deleted'
  | 'message.sent';

export interface OutboxEvent {
  id: string;
  event_type: OutboxEventType | string;
  aggregate_type: 'connection' | 'profile' | 'post' | 'message' | 'user' | string;
  aggregate_id: string;
  payload: Record<string, unknown>;
  status: OutboxEventStatus;
  retry_count: number;
  max_retries: number;
  error_message?: string | null;
  scheduled_at: string;
  processed_at?: string | null;
  idempotency_key?: string;
  created_at: string;
}

export type OutboxEventHandler = (event: OutboxEvent) => Promise<boolean | void>;

export interface OutboxQueueMetrics {
  pendingCount: number;
  processingCount: number;
  completedCount: number;
  failedCount: number;
  deadLetterCount: number;
  oldestPendingAgeSeconds: number;
}
