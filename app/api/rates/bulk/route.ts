import { NextRequest, NextResponse } from 'next/server';
import { bulkSavePersistedRates } from '@/lib/dbms/server-dbms';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const rates = Array.isArray(body?.rates) ? body.rates : Array.isArray(body) ? body : null;
    if (!rates || rates.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Array of rates is required' },
        { status: 400 }
      );
    }
    const saved = bulkSavePersistedRates(rates);
    return NextResponse.json({ success: true, count: saved.length }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to bulk save rates' },
      { status: 500 }
    );
  }
}
