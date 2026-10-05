import { NextRequest, NextResponse } from 'next/server';
import {
  getPersistedJobs,
  savePersistedJob,
  deletePersistedJob,
} from '@/lib/dbms/server-dbms';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);
  const uidHeader = req.headers.get('x-fr8x-user-uid') || req.nextUrl?.searchParams?.get('uid');

  if (!userAuth.authenticated && !gfAuth.authenticated && !uidHeader) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const jobs = getPersistedJobs();
    // Only return active (non-deleted) jobs
    const active = jobs.filter((j) => j.status !== 'deleted');
    return NextResponse.json({ success: true, jobs: active }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);
  const uidHeader = req.headers.get('x-fr8x-user-uid');

  if (!userAuth.authenticated && !gfAuth.authenticated && !uidHeader) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: 'Valid job payload with id is required' },
        { status: 400 }
      );
    }

    const callerUid = userAuth.user?.uid || uidHeader || body.postedByUid;
    if (callerUid && !body.postedByUid) {
      body.postedByUid = callerUid;
    }

    const saved = savePersistedJob(body);



    return NextResponse.json({ success: true, job: saved }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save job' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);
  const uidHeader = req.headers.get('x-fr8x-user-uid');

  if (!userAuth.authenticated && !gfAuth.authenticated && !uidHeader) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Job ID parameter is required' },
        { status: 400 }
      );
    }

    // Ownership check
    if (userAuth.authenticated && !gfAuth.authenticated) {
      const existing = getPersistedJobs().find((j) => j.id === id);
      if (existing && existing.postedByUid !== userAuth.user!.uid) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to delete this job.' },
          { status: 403 }
        );
      }
    }

    const deleted = deletePersistedJob(id);



    return NextResponse.json({ success: deleted }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete job' },
      { status: 500 }
    );
  }
}
