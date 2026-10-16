/**
 * app/api/outbox/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Outbox Event Queue & Worker Trigger Endpoint
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { outboxWorker } from '@/lib/outbox/worker';
import { outboxService } from '@/lib/outbox/service';
import { authenticateGodfatherOperator, authenticateUserSession } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  const gf = authenticateGodfatherOperator(req);
  const user = authenticateUserSession(req, { allowUnverified: true });

  if (!gf.authenticated && !user.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const metrics = await outboxService.getQueueMetrics();
  return NextResponse.json({
    success: true,
    metrics,
    timestamp: new Date().toISOString(),
  });
}

export async function POST(req: NextRequest) {
  const gf = authenticateGodfatherOperator(req);
  const user = authenticateUserSession(req, { allowUnverified: true });

  if (!gf.authenticated && !user.authenticated) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const batchSize = Math.min(Number(body.batchSize || 25), 100);

  const result = await outboxWorker.processBatch(batchSize);
  const metrics = await outboxService.getQueueMetrics();

  return NextResponse.json({
    success: true,
    batchResult: result,
    metrics,
  });
}
