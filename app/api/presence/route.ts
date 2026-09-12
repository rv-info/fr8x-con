import { NextRequest, NextResponse } from 'next/server';
import { updateUserPresenceInDB, getUserPresenceFromDB } from '@/lib/firebase/firestore';
import { UserPresenceState } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const data: UserPresenceState = await req.json().catch(() => ({}) as any);
    if (data && data.userId) {
      await updateUserPresenceInDB(data);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'Invalid presence payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get('userId');
    if (!userId) {
      return NextResponse.json({ success: false, error: 'userId is required' }, { status: 400 });
    }
    const presence = await getUserPresenceFromDB(userId);
    return NextResponse.json({
      success: true,
      presence: presence || { userId, status: 'offline' },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error' }, { status: 500 });
  }
}

