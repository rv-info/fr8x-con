import { NextResponse } from 'next/server';
import { checkSmtpHealth } from '@/lib/mailer';

export async function GET() {
  try {
    const health = await checkSmtpHealth();
    return NextResponse.json(health);
  } catch (err: any) {
    return NextResponse.json(
      {
        connected: false,
        error: err.message || 'Failed to inspect SMTP server health',
      },
      { status: 500 }
    );
  }
}
