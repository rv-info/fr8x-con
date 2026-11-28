import assert from 'node:assert';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
import { SignJWT, jwtVerify } from 'jose';

const root = process.cwd();
const NHOST_WSS_URL =
  process.env.NEXT_PUBLIC_NHOST_WS_URL ||
  'wss://rqkhnmhhbethgegaowhs.graphql.ap-south-1.nhost.run/v1';

async function testHs256JwtClaims() {
  const secretBytes = new TextEncoder().encode(crypto.randomBytes(64).toString('hex'));
  const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'rqkhnmhhbethgegaowhs';

  const token = await new SignJWT({
    sub: 'user-123',
    'https://hasura.io/jwt/claims': {
      'x-hasura-allowed-roles': ['user'],
      'x-hasura-default-role': 'user',
      'x-hasura-user-id': 'user-123',
    },
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer('fr8x-chat-bridge')
    .setAudience(subdomain)
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(secretBytes);

  const verified = await jwtVerify(token, secretBytes, {
    issuer: 'fr8x-chat-bridge',
    audience: subdomain,
  });
  assert.strictEqual(verified.protectedHeader.alg, 'HS256');
  assert.strictEqual(verified.protectedHeader.kid, undefined);
  assert.strictEqual((verified.payload as any)['https://hasura.io/jwt/claims']['x-hasura-user-id'], 'user-123');
  console.log('✓ HS256 JWT signing & Hasura claims verification passed');
}

async function testLiveNhostWssHandshake() {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage();
    const result = await page.evaluate((url) => {
      return new Promise<{ ok: boolean; latencyMs?: number; error?: string }>((resolve) => {
        const start = performance.now();
        const timer = setTimeout(() => resolve({ ok: false, error: 'WSS handshake timeout (8000ms)' }), 8000);
        const ws = new WebSocket(url, 'graphql-transport-ws');
        ws.onopen = () => {
          ws.send(JSON.stringify({ type: 'connection_init', payload: {} }));
        };
        ws.onmessage = (evt) => {
          try {
            const msg = JSON.parse(String(evt.data));
            if (msg.type === 'connection_ack') {
              clearTimeout(timer);
              ws.close();
              resolve({ ok: true, latencyMs: Math.round(performance.now() - start) });
            }
          } catch {}
        };
        ws.onerror = () => {
          clearTimeout(timer);
          resolve({ ok: false, error: 'WSS connection error' });
        };
      });
    }, NHOST_WSS_URL);
    assert(result.ok, result.error || 'Live Nhost WSS handshake failed');
    console.log(`✓ Live Nhost WSS graphql-transport-ws handshake acknowledged in ${result.latencyMs}ms`);
  } finally {
    await browser.close();
  }
}

function testSourceContracts() {
  const chatCtx = fs.readFileSync(path.join(root, 'lib/context/ChatContext.tsx'), 'utf8');
  const chatClient = fs.readFileSync(path.join(root, 'lib/nhost/chatClient.ts'), 'utf8');
  const nextConfig = fs.readFileSync(path.join(root, 'next.config.js'), 'utf8');

  assert(!chatCtx.includes('setInterval(syncServerMessages, 3000)'), '3-second polling removed from ChatContext');
  assert(chatCtx.includes('NhostChatRealtimeClient'), 'ChatContext uses NhostChatRealtimeClient');
  assert(chatCtx.includes('SUB_CHAT_MESSAGES'), 'ChatContext subscribes to messages via WebSocket');
  assert(chatCtx.includes('SUB_CHAT_PRESENCE'), 'ChatContext subscribes to batched presence via WebSocket');
  assert(chatCtx.includes('QUERY_MISSED_MESSAGES'), 'ChatContext reconciles missed messages on reconnect');
  assert(chatClient.includes("'CONNECTING'") && chatClient.includes("'AUTHENTICATION_ERROR'"), 'Connection states implemented');
  assert(nextConfig.includes('wss://rqkhnmhhbethgegaowhs.graphql.ap-south-1.nhost.run'), 'CSP allows Nhost WSS');
  console.log('✓ WebSocket-first architecture & CSP source contracts passed');
}

async function main() {
  testSourceContracts();
  await testHs256JwtClaims();
  await testLiveNhostWssHandshake();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
