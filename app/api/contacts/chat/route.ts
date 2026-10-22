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

  if (!targetId) {
    return NextResponse.json({ success: false, error: 'targetId is required' }, { status: 400 });
  }

  // Filter messages between these two parties
  const allMessages = loadChatStore();
  const conversation = allMessages.filter(
    (m) =>
      (m.sender_id === userId && m.recipient_id === targetId) ||
      (m.sender_id === targetId && m.recipient_id === userId)
  );

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

    const now = new Date().toISOString();
    const newMsg: DirectMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      sender_id: userId,
      recipient_id: targetId,
      content: content.trim(),
      created_at: now,
      is_read: true,
    };

    // Save to resilient chat store
    const store = loadChatStore();
    store.push(newMsg);
    saveChatStore(store);

    // Update last_contacted_at on the contact record
    updateContact(userId, targetId, { last_contacted_at: now }, caller.token).catch(() => {});

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
