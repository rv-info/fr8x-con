import { NextResponse } from 'next/server';
import { getEmailHealth } from '@/lib/mailer';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const health = await getEmailHealth();
    return NextResponse.json(health);
  } catch (err: any) {
    return NextResponse.json(
      {
        provider: 'zeptomail',
        transport: 'REST_API',
        connected: false,
        configured: false,
        flowConfigured: false,
        error: err.message || 'Failed to inspect email transport health',
      },
      { status: 500 }
    );
  }
}
