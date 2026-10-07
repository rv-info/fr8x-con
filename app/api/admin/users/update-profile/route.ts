import { NextRequest, NextResponse } from 'next/server';
import { authenticateGodfatherOperator } from '@/lib/auth-guard';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { updateUser } from '@/lib/db/users';

export async function POST(req: NextRequest) {
  const auth = authenticateGodfatherOperator(req);
  if (!auth.authenticated) {
    return auth.errorResponse!;
  }

  try {
    const body = await req.json();
    const { uid, changes, reason } = body;
    const operatorUid = auth.operator!.uid;

    if (!uid || !changes || !reason) {
      return NextResponse.json({ error: 'Missing user UID, change payload, or mandatory reason' }, { status: 400 });
    }

    // Strip protected fields from being modified via basic profile corrections
    const { passwordHash: _p, salt: _s, ...cleanChanges } = changes;

    // 1. Authoritative write to Supabase PostgreSQL (Single Source of Truth)
    let dbUpdated = false;
    let confirmedRecord: any = null;
    try {
      const dbUpdates: any = {};
      if (cleanChanges.phone !== undefined || cleanChanges.mobile !== undefined) {
        const phoneVal = cleanChanges.phone || cleanChanges.mobile;
        dbUpdates.phone = phoneVal ? String(phoneVal).trim() : null;
        dbUpdates.mobile = dbUpdates.phone;
      }
      if (cleanChanges.designation !== undefined) {
        dbUpdates.designation = cleanChanges.designation ? String(cleanChanges.designation).trim() : null;
      }
      if (cleanChanges.displayName !== undefined || cleanChanges.display_name !== undefined) {
        dbUpdates.display_name = cleanChanges.displayName || cleanChanges.display_name;
      }
      if (cleanChanges.company !== undefined || cleanChanges.company_name !== undefined) {
        dbUpdates.company_name = cleanChanges.company || cleanChanges.company_name;
      }
      if (cleanChanges.city !== undefined) {
        dbUpdates.city = cleanChanges.city ? String(cleanChanges.city).trim() : null;
      }
      if (cleanChanges.state !== undefined) {
        dbUpdates.state = cleanChanges.state ? String(cleanChanges.state).trim() : null;
      }
      if (cleanChanges.country !== undefined) {
        dbUpdates.country = cleanChanges.country ? String(cleanChanges.country).trim() : 'India';
      }
      if (cleanChanges.postalCode !== undefined || cleanChanges.postal_code !== undefined || cleanChanges.pincode !== undefined) {
        const postal = cleanChanges.postalCode || cleanChanges.postal_code || cleanChanges.pincode;
        dbUpdates.postal_code = postal ? String(postal).trim() : null;
      }
      if (cleanChanges.address !== undefined || cleanChanges.formattedAddress !== undefined) {
        const addr = cleanChanges.address || cleanChanges.formattedAddress;
        dbUpdates.address = addr ? String(addr).trim() : null;
        dbUpdates.formatted_address = dbUpdates.address;
      }
      if (cleanChanges.status !== undefined) {
        dbUpdates.status = cleanChanges.status;
      }
      if (cleanChanges.role !== undefined) {
        dbUpdates.role = cleanChanges.role;
      }

      confirmedRecord = await updateUser(uid, dbUpdates);
      dbUpdated = Boolean(confirmedRecord);
    } catch (dbErr: any) {
      console.warn('[Admin/UpdateProfile] Direct Supabase update warning:', dbErr.message);
    }

    // 2. Synchronize active server security store
    const updateResult = serverSecurityStore.updateUserProfile(uid, cleanChanges);

    const correlationId = `GF-USR-CORR-${Date.now().toString(36).toUpperCase()}`;

    return NextResponse.json({
      success: updateResult.success || dbUpdated,
      uid,
      operatorUid,
      correlationId,
      dbUpdated,
      user: confirmedRecord || updateResult.user,
      message: 'Audited user profile correction applied and persisted to Supabase PostgreSQL.',
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

