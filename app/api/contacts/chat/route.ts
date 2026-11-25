/**
 * app/api/contacts/chat/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Instant Direct Chat API for Contacts CRM:
 * - GET: Fetch message history between current user and contact
 * - POST: Send real-time freight chat message, update last_contacted_at
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { resolveCallerIdentity } from '@/lib/connections-backend';
import { getDbClient, createAdminClient } from '@/lib/supabase/server';
import { updateContact } from '@/lib/db/contacts';
import { serverSecurityStore } from '@/lib/server-auth-store';

export const dynamic = 'force-dynamic';

interface DirectMessage {
  id: string;
  sender_id: string;
  recipient_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const CHAT_STORE_PATH = path.join(DATA_DIR, 'contacts_chat_store.json');

function getUserAliases(rawId: string): Set<string> {
  const aliases = new Set<string>();
  if (!rawId) return aliases;
  const clean = rawId.trim().toLowerCase().replace(/^c-/, '');
  aliases.add(clean);
  aliases.add(`c-${clean}`);
  const user = serverSecurityStore.getUser(clean) || serverSecurityStore.getUserByEmailOrUid(clean);
  if (user) {
    if (user.uid) {
      aliases.add(user.uid.toLowerCase());
      aliases.add(`c-${user.uid.toLowerCase()}`);
    }
    if (user.email) {
      aliases.add(user.email.toLowerCase());
    }
  }
  return aliases;
}

function matchesParty(msgUserId: string, targetId: string): boolean {
  if (!msgUserId || !targetId) return false;
  const msgClean = msgUserId.trim().toLowerCase().replace(/^c-/, '');
  const targetAliases = getUserAliases(targetId);
  return targetAliases.has(msgClean) || targetAliases.has(msgUserId.trim().toLowerCase());
}

function loadChatStore(): DirectMessage[] {
  try {
    if (fs.existsSync(CHAT_STORE_PATH)) {
      const raw = fs.readFileSync(CHAT_STORE_PATH, 'utf8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

function saveChatStore(messages: DirectMessage[]) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(CHAT_STORE_PATH, JSON.stringify(messages, null, 2), 'utf8');
  } catch {}
}

export async function GET(req: NextRequest) {
  const caller = await resolveCallerIdentity(req);
  const userId = caller.userId;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetId = searchParams.get('targetId');

  const allMessages = loadChatStore();
  let conversation: DirectMessage[];

  if (targetId) {
    // Filter messages specifically between current user and targetId (with alias matching)
    conversation = allMessages.filter(
      (m) =>
        (matchesParty(m.sender_id, userId) && matchesParty(m.recipient_id, targetId)) ||
        (matchesParty(m.sender_id, targetId) && matchesParty(m.recipient_id, userId))
    );
  } else {
    // Return all direct messages involving current caller across all contacts
    conversation = allMessages.filter(
      (m) => matchesParty(m.sender_id, userId) || matchesParty(m.recipient_id, userId)
    );
  }

  conversation.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

  return NextResponse.json({ success: true, data: conversation });
}

export async function POST(req: NextRequest) {
  const caller = await resolveCallerIdentity(req);
  const userId = caller.userId;

  if (!userId) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { targetId, content } = body;

    if (!targetId || !content || !content.trim()) {
      return NextResponse.json({ success: false, error: 'targetId and content are required' }, { status: 400 });
    }

    const cleanTargetId = String(targetId).trim().replace(/^c-/, '');
    const now = new Date().toISOString();
    const newMsg: DirectMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender_id: userId,
      recipient_id: cleanTargetId,
      content: content.trim(),
      created_at: now,
      is_read: false,
    };

    // Save to resilient chat store
    const store = loadChatStore();
    store.push(newMsg);
    saveChatStore(store);

    // Update last_contacted_at on the contact record
    updateContact(userId, cleanTargetId, { last_contacted_at: now }, caller.token).catch(() => {});

    // Also attempt write to Supabase messages table if conversations table exists
    try {
      const admin = createAdminClient() || getDbClient();
      await admin.from('messages').insert({
        sender_id: userId,
        content: newMsg.content,
        created_at: now,
      });
    } catch {}

    return NextResponse.json({ success: true, data: newMsg }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
