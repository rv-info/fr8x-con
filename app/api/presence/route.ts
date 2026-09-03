import { NextRequest, NextResponse } from 'next/server';
import { updateUserPresenceInDB } from '@/lib/firebase/firestore';
import { UserPresenceState } from '@/lib/types';

export async function POST(req: NextRequest) {
  try {
    const data: UserPresenceState = await req.json();
    if (data && data.userId) {
      await updateUserPresenceInDB(data);
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ success: false, error: 'Invalid presence payload' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Error' }, { status: 500 });
  }
}
