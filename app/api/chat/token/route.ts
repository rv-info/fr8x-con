/**
 * POST /api/chat/token
 * ─────────────────────────────────────────────────────────────────────────────
 * Authenticates the caller via FR8X's existing Supabase/session guard and mints
 * a short-lived RS256 Hasura-compatible JWT for Nhost GraphQL + WSS Realtime.
 *
 * - Runs on Node.js & Cloudflare Workers (uses Web Crypto via `jose`).
 * - Never exposes NHOST_CHAT_JWT_PRIVATE_KEY or NHOST_ADMIN_SECRET to clients.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { importPKCS8, SignJWT } from 'jose';
import { resolveCallerIdentity } from '@/lib/connections-backend';

export const dynamic = 'force-dynamic';

const TOKEN_TTL_SECONDS = 15 * 60; // 15 minutes

function normalizePem(raw: string): string {
  return raw.replace(/\\n/g, '\n').trim();
}

export async function POST(req: NextRequest) {
  const caller = await resolveCallerIdentity(req);
  if (!caller.userId) {
    return NextResponse.json(
      { success: false, error: 'Unauthorized: active FR8X session required.' },
      { status: 401 }
    );
  }

  const rawPrivateKey = process.env.NHOST_CHAT_JWT_PRIVATE_KEY || '';
  if (!rawPrivateKey.trim()) {
    return NextResponse.json(
      {
        success: false,
        configured: false,
        error: 'NHOST_CHAT_JWT_PRIVATE_KEY is not configured in server secrets.',
      },
      { status: 503 }
    );
  }

  try {
    const pem = normalizePem(rawPrivateKey);
    const privateKey = await importPKCS8(pem, 'RS256');
    const kid = (process.env.NHOST_CHAT_JWT_KID || '').trim() || undefined;
    const subdomain =
      process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'utweonkbxcuhvsetvxjo';

    const nowSec = Math.floor(Date.now() / 1000);
    const expiresAtSec = nowSec + TOKEN_TTL_SECONDS;

    const builder = new SignJWT({
      sub: caller.userId,
      email: caller.userEmail || undefined,
      'https://hasura.io/jwt/claims': {
        'x-hasura-allowed-roles': ['user'],
        'x-hasura-default-role': 'user',
        'x-hasura-user-id': caller.userId,
      },
    })
      .setProtectedHeader(kid ? { alg: 'RS256', typ: 'JWT', kid } : { alg: 'RS256', typ: 'JWT' })
      .setSubject(caller.userId)
      .setIssuer('fr8x-chat-bridge')
      .setAudience(subdomain)
      .setIssuedAt(nowSec)
      .setExpirationTime(expiresAtSec);

    const token = await builder.sign(privateKey);

    return NextResponse.json({
      success: true,
      configured: true,
      token,
      expiresAt: expiresAtSec * 1000,
      kid: kid || null,
    });
  } catch (err: any) {
    console.error('[API/chat/token] Failed to sign RS256 chat JWT:', err?.message || err);
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
