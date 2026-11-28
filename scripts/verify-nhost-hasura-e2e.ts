/**
 * Authenticated Nhost Hasura GraphQL + WebSocket E2E Verification Script (HS256)
 */
import assert from 'node:assert';
import fs from 'node:fs';
import { createRequire } from 'node:module';
import { SignJWT } from 'jose';
import { createClient } from 'graphql-ws';
import {
  MUTATION_INSERT_MESSAGE,
  MUTATION_MARK_MESSAGES_READ,
  MUTATION_UPSERT_CONVERSATION,
  MUTATION_UPSERT_PRESENCE,
  QUERY_CONVERSATION_MESSAGES,
  SUB_CHAT_MESSAGES,
} from '../lib/nhost/chatQueries';

const require = createRequire(import.meta.url);
let WebSocketImpl: any = (globalThis as any).WebSocket;
if (!WebSocketImpl) {
  try {
    WebSocketImpl = require('ws');
  } catch {}
}

function loadEnvLocal() {
  if (!fs.existsSync('.env.local')) return;
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#')) continue;
    const idx = line.indexOf('=');
    if (idx <= 0) continue;
    const k = line.slice(0, idx).trim();
    const v = line.slice(idx + 1).trim();
    if (k && v && !process.env[k]) process.env[k] = v;
  }
}

async function mintUserJwt(userId: string, expiresIn = '15m'): Promise<string> {
  const rawSecret = (process.env.NHOST_CHAT_JWT_SECRET || '').trim();
  const subdomain = process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'rqkhnmhhbethgegaowhs';
  assert(rawSecret, 'NHOST_CHAT_JWT_SECRET is required in .env.local');
  const key = new TextEncoder().encode(rawSecret);

  return new SignJWT({
    sub: userId,
    'https://hasura.io/jwt/claims': {
      'x-hasura-allowed-roles': ['user'],
      'x-hasura-default-role': 'user',
      'x-hasura-user-id': userId,
    },
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setSubject(userId)
    .setIssuer('fr8x-chat-bridge')
    .setAudience(subdomain)
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

async function gql(gqlUrl: string, token: string, query: string, variables?: Record<string, any>) {
  const res = await fetch(gqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ query, variables }),
  });
  return res.json();
}

async function main() {
  loadEnvLocal();
  const gqlUrl =
    process.env.NEXT_PUBLIC_NHOST_GRAPHQL_URL ||
    'https://rqkhnmhhbethgegaowhs.graphql.ap-south-1.nhost.run/v1';
  const wssUrl =
    process.env.NEXT_PUBLIC_NHOST_WS_URL ||
    'wss://rqkhnmhhbethgegaowhs.graphql.ap-south-1.nhost.run/v1';

  const userA = 'e2e-user-a';
  const userB = 'e2e-user-b';
  const userC = 'e2e-user-c';
  const [tokA, tokB, tokC] = await Promise.all([
    mintUserJwt(userA),
    mintUserJwt(userB),
    mintUserJwt(userC),
  ]);

  // 0. Security negative tests: unauthenticated, invalid signature, expired JWT
  const unauthRes = await fetch(gqlUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: QUERY_CONVERSATION_MESSAGES, variables: { conversationId: '00000000-0000-0000-0000-000000000000', limit: 1 } }),
  }).then((r) => r.json());
  assert(Array.isArray(unauthRes.errors) && unauthRes.errors.length > 0, `Unauthenticated request must be rejected, got: ${JSON.stringify(unauthRes)}`);

  const badSigTok = await new SignJWT({
    sub: userA,
    'https://hasura.io/jwt/claims': {
      'x-hasura-allowed-roles': ['user'],
      'x-hasura-default-role': 'user',
      'x-hasura-user-id': userA,
    },
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuer('fr8x-chat-bridge')
    .setAudience(process.env.NEXT_PUBLIC_NHOST_SUBDOMAIN || 'rqkhnmhhbethgegaowhs')
    .setIssuedAt()
    .setExpirationTime('15m')
    .sign(new TextEncoder().encode('wrong-secret-0000000000000000000000000000000000000000000000000000'));
  const badSigRes = await gql(gqlUrl, badSigTok, QUERY_CONVERSATION_MESSAGES, {
    conversationId: '00000000-0000-0000-0000-000000000000',
    limit: 1,
  });
  assert(Array.isArray(badSigRes.errors) && badSigRes.errors.length > 0, `Invalid signature JWT must be rejected, got: ${JSON.stringify(badSigRes)}`);

  const expiredTok = await mintUserJwt(userA, '-10s');
  const expiredRes = await gql(gqlUrl, expiredTok, QUERY_CONVERSATION_MESSAGES, {
    conversationId: '00000000-0000-0000-0000-000000000000',
    limit: 1,
  });
  assert(Array.isArray(expiredRes.errors) && expiredRes.errors.length > 0, `Expired JWT must be rejected, got: ${JSON.stringify(expiredRes)}`);
  console.log('✓ Unauthenticated, invalid-signature, and expired-JWT rejection checks passed');

  // 1. Verify User A creates conversation with User B
  const convRes = await gql(gqlUrl, tokA, MUTATION_UPSERT_CONVERSATION, {
    directKey: `${userA}:${userB}`,
    contextType: 'e2e',
    contextId: 'test-1',
    contextTitle: 'E2E Test Thread',
    members: [{ user_id: userA }, { user_id: userB }],
  });
  const convId = convRes.data?.insert_chat_conversations_one?.id;
  assert(convId, `Expected conversation id, got: ${JSON.stringify(convRes)}`);

  // 2. Subscribe as User B over WSS and send message as User A
  const wsClientB = createClient({
    url: wssUrl,
    webSocketImpl: WebSocketImpl,
    connectionParams: { headers: { Authorization: `Bearer ${tokB}` } },
  });

  const received = new Promise<any>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error('Timeout waiting for WSS INSERT event')), 10000);
    const unsub = wsClientB.subscribe(
      { query: SUB_CHAT_MESSAGES, variables: { limit: 10 } },
      {
        next: (res) => {
          const hit = (res.data as any)?.chat_messages?.find((m: any) => m.conversation_id === convId);
          if (hit) {
            clearTimeout(t);
            unsub();
            resolve(hit);
          }
        },
        error: reject,
        complete: () => {},
      }
    );
  });

  const clientMsgId = `e2e_${Date.now()}`;
  const insRes = await gql(gqlUrl, tokA, MUTATION_INSERT_MESSAGE, {
    conversationId: convId,
    recipientId: userB,
    clientMessageId: clientMsgId,
    content: 'Hello from HS256 E2E WebSocket test',
  });
  assert(insRes.data?.insert_chat_messages_one?.sender_id === userA, 'sender_id derived from X-Hasura-User-Id');

  const wsMsg = await received;
  assert.strictEqual(wsMsg.client_message_id, clientMsgId);

  // 3. Verify User C isolation
  const isoRes = await gql(gqlUrl, tokC, QUERY_CONVERSATION_MESSAGES, { conversationId: convId, limit: 10 });
  assert.strictEqual(isoRes.data?.chat_messages?.length ?? 0, 0, 'User C must not read A-B conversation');

  // 4. Verify read receipt + presence upsert
  const readRes = await gql(gqlUrl, tokB, MUTATION_MARK_MESSAGES_READ, {
    conversationId: convId,
    recipientId: userB,
    readAt: new Date().toISOString(),
  });
  assert((readRes.data?.update_chat_messages?.affected_rows ?? 0) >= 1, 'read_at updated');
  assert((readRes.data?.update_chat_conversation_members?.affected_rows ?? 0) >= 1, 'last_read_at synced');

  const presRes = await gql(gqlUrl, tokA, MUTATION_UPSERT_PRESENCE, {
    sessionId: `e2e_sess_${Date.now()}`,
    userId: userA,
    status: 'active',
    lastSeenAt: new Date().toISOString(),
  });
  assert(presRes.data?.insert_chat_presence_sessions_one?.session_id, 'Presence upsert succeeded');

  await wsClientB.dispose();
  console.log('✓ Full Nhost Hasura HS256 GraphQL + WSS E2E suite passed!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
