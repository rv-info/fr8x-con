/**
 * app/api/health/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * System Health & Observability Metrics Endpoint
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { outboxService } from '@/lib/outbox/service';
import { safeCache } from '@/lib/cache/safe-cache';

export const dynamic = 'force-dynamic';

export async function GET() {
  const start = Date.now();
  let dbStatus = 'disconnected';
  let dbLatencyMs = -1;

  // 1. Check database connectivity & latency
  const admin = createAdminClient();
  if (admin) {
    try {
      const dbStart = Date.now();
      const { error } = await admin.from('profiles').select('id', { count: 'exact', head: true }).limit(1);
      dbLatencyMs = Date.now() - dbStart;
      dbStatus = error ? 'error' : 'connected';
    } catch {
      dbStatus = 'unreachable';
    }
  } else {
    dbStatus = 'local_fallback_active';
    dbLatencyMs = 0;
  }

  // 2. Fetch outbox queue metrics
  const outboxMetrics = await outboxService.getQueueMetrics();

  // 3. Cache metrics
  const cacheStats = safeCache.getStats();

  const totalLatencyMs = Date.now() - start;
  const isHealthy = dbStatus !== 'error' && dbStatus !== 'unreachable';

  return NextResponse.json(
    {
      status: isHealthy ? 'healthy' : 'degraded',
      service: 'fr8x-platform',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      latencyMs: totalLatencyMs,
      checks: {
        database: {
          status: dbStatus,
          latencyMs: dbLatencyMs,
        },
        outboxQueue: outboxMetrics,
        cache: cacheStats,
        runtime: {
          nodeVersion: process.version,
          uptimeSeconds: Math.round(process.uptime()),
          memory: process.memoryUsage(),
        },
      },
    },
    {
      status: isHealthy ? 200 : 503,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
      },
    }
  );
}
