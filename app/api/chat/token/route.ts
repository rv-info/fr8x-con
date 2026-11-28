/**
 * POST /api/chat/token
 * ─────────────────────────────────────────────────────────────────────────────
 * Authenticates the caller via FR8X's existing Supabase/fr8x_session guard and
 * mints a short-lived HS256 Hasura-compatible JWT for Nhost GraphQL + WSS.
 *
 * - Runs on Node.js & Cloudflare Workers (uses Web Crypto via `jose`).
 * - Never exposes NHOST_CHAT_JWT_SECRET or NHOST_ADMIN_SECRET to clients.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { resolveCallerIdentity } from '@/lib/connections-backend';

export const dynamic = 'force-dynamic';

const TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

export async function POST(req: NextRequest) {
  const caller = await resolveCallerIdentity(req);
  if (!caller.userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: active FR8X session required.' },
      { status: 401 }
    );
  }

  const rawSecret = (process.env.NHOST_CHAT_JWT_SECRET || '').trim();
  if (!rawSecret) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error: 'NHOST_CHAT_JWT_SECRET is not configured in server secrets.',
      },
      { status: 503 }
    );
  }

  try {
    const secretKey = new TextEncoder().encode(rawSecret);
    const subdomain =
      process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'rqkhnmhhbethgegaowhs';

    const nowSec = Math.floor(Date.now() / 1000);
    const expiresAtSec = nowSec + TOKEN_TTL_SECONDS;

    const token = await new SignJWT({
      sub: caller.userId,
      email: caller.userEmail || undefined,
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': ['user'],
        'x-hasura-default-role': 'user',
        'x-hasura-user-id': caller.userId,
      },
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setSubject(caller.userId)
      .setIssuer('fr8x-chat-bridge')
      .setAudience(subdomain)
      .setIssuedAt(nowSec)
      .setExpirationTime(expiresAtSec)
      .sign(secretKey);

    return NextResponse.json({
      success: true,
      configured: true,
      token,
      expiresAt: expiresAtSec * 1000,
    });
  } catch (err: any) {
    console.error('[API/chat/token] Failed to sign HS256 chat JWT:', err?.message || err);
    return NextResponse.json(
      {
        success: false,
        configured: true,
        error: 'Failed to mint chat authentication token.',
      },
      { status: 500 }
    );
  }
}
