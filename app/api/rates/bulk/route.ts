import { NextRequest, NextResponse } from 'next/server';
import { bulkSaveRates } from '@/lib/db/rates';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function POST(req: NextRequest) {
  // ── Operator authentication guard ────────────────────────────────────────
  const { authenticated, errorResponse } = authenticateGodfatherOperator(req);
  if (!authenticated) return errorResponse!;
  // ─────────────────────────────────────────────────────────────────────────

  try {
    const body = await req.json().catch(() => null);
    const rates = Array.isArray(body?.rates) ? body.rates : Array.isArray(body) ? body : null;
    if (!rates || rates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Array of rates is required' },
        { status: 400 }
      );
    }
    if (rates.length > 500) {
      return NextResponse.json(
        { success: false, error: 'Payload too large: Bulk rate imports are capped at 500 items per request.' },
        { status: 413 }
      );
    }
    const saved = await bulkSaveRates(rates);
    return NextResponse.json({ success: true, count: saved.length }, { status: 200 });
  } catch (err: any) {
    console.error('[API/rates/bulk] POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to bulk save rates' },
      { status: 500 }
    );
  }
}
