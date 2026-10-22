/**
 * app/api/contacts/route.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * RESTful API endpoints for Enterprise Contacts CRM:
 * - GET: List all contacts (custom + DBMS connections + live presence)
 * - POST: Create contact or link FR8X directory member
 * - PATCH: Update contact notes, deal stage, status, category, etc.
 * - DELETE: Delete contact (with optional DBMS connection removal)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveCallerIdentity } from '@/lib/connections-backend';
import { getUserContacts, createContact, updateContact, deleteContact } from '@/lib/db/contacts';

export const dynamic = 'force-dynamic';

const ContactCreateSchema = z.object({
  contact_profile_id: z.string().optional().nullable(),
  name: z.string().min(1, 'Name is required').max(100),
  email: z.string().email('Invalid email address').optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable().or(z.literal('')),
  company: z.string().max(100).optional().nullable().or(z.literal('')),
  designation: z.string().max(100).optional().nullable().or(z.literal('')),
  category: z.enum([
    'Freight Forwarder',
    'Shipping Line / Carrier',
    'Customs Broker',
    'Shipper (BCO)',
    'Transporter / Fleet',
    'Port / Terminal',
    'Other',
  ]).optional().default('Freight Forwarder'),
  status: z.enum(['live', 'online', 'away', 'busy', 'offline']).optional().default('offline'),
  stage: z.enum([
    'Prospect / Lead',
    'Rate Quoted',
    'Active Partner',
    'VIP / Key Account',
    'Carrier Partner',
    'On Hold',
  ]).optional().default('Active Partner'),
  notes: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string()).optional().default([]),
  is_favorite: z.boolean().optional().default(false),
  location: z.string().max(100).optional().nullable(),
});

const ContactUpdateSchema = z.object({
  id: z.string().min(1, 'Contact ID is required'),
  name: z.string().min(1).max(100).optional(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().max(30).optional().nullable().or(z.literal('')),
  company: z.string().max(100).optional().nullable().or(z.literal('')),
  designation: z.string().max(100).optional().nullable().or(z.literal('')),
  category: z.enum([
    'Freight Forwarder',
    'Shipping Line / Carrier',
    'Customs Broker',
    'Shipper (BCO)',
    'Transporter / Fleet',
    'Port / Terminal',
    'Other',
  ]).optional(),
  status: z.enum(['live', 'online', 'away', 'busy', 'offline']).optional(),
  stage: z.enum([
    'Prospect / Lead',
    'Rate Quoted',
    'Active Partner',
    'VIP / Key Account',
    'Carrier Partner',
    'On Hold',
  ]).optional(),
  notes: z.string().max(2000).optional().nullable(),
  tags: z.array(z.string()).optional(),
  is_favorite: z.boolean().optional(),
  last_contacted_at: z.string().optional().nullable(),
});

export async function GET(req: NextRequest) {
  const caller = await resolveCallerIdentity(req);
  const userId = caller.userId;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  try {
    const contacts = await getUserContacts(userId, caller.token);
    return NextResponse.json({
      success: true,
      data: contacts,
      count: contacts.length,
      liveCount: contacts.filter((c) => c.status === 'live' || c.status === 'online').length,
      awayCount: contacts.filter((c) => c.status === 'away').length,
    });
  } catch (err: any) {
    console.error('[API/contacts GET error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to retrieve contacts.', details: err.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const caller = await resolveCallerIdentity(req);
  const userId = caller.userId;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ContactCreateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createContact(userId, parsed.data as any, caller.token);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    console.error('[API/contacts POST error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to create contact.', details: err.message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const caller = await resolveCallerIdentity(req);
  const userId = caller.userId;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const parsed = ContactUpdateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Validation failed.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { id, ...updates } = parsed.data;
    const updated = await updateContact(userId, id, updates as any, caller.token);

    if (!updated) {
      return NextResponse.json(
        { success: false, error: 'Contact not found.', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    console.error('[API/contacts PATCH error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to update contact.', details: err.message },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const caller = await resolveCallerIdentity(req);
  const userId = caller.userId;

  if (!userId) {
    return NextResponse.json(
      { success: false, error: 'Authentication required.', code: 'UNAUTHENTICATED' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const contactId = searchParams.get('id');
    const deleteConnection = searchParams.get('deleteConnection') === 'true';

    if (!contactId) {
      return NextResponse.json(
        { success: false, error: 'Contact ID is required.' },
        { status: 400 }
      );
    }

    const res = await deleteContact(userId, contactId, deleteConnection, caller.token);
    return NextResponse.json({
      success: true,
      message: res.connectionRemoved
        ? 'Contact and DBMS connection deleted successfully.'
        : 'Contact deleted successfully.',
      connectionRemoved: res.connectionRemoved,
    });
  } catch (err: any) {
    console.error('[API/contacts DELETE error]:', err);
    return NextResponse.json(
      { success: false, error: 'Failed to delete contact.', details: err.message },
      { status: 500 }
    );
  }
}
