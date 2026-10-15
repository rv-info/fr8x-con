import { NextRequest, NextResponse } from 'next/server';
import { getJobs, saveJob, deleteJob } from '@/lib/db/jobs';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);

  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const jobs = await getJobs();
    const active = jobs.filter((j) => j.status !== 'deleted');
    return NextResponse.json({ success: true, jobs: active }, { status: 200 });
  } catch (err: any) {
    console.error('[API/jobs] GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch jobs' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);

  if (!userAuth.authenticated && !gfAuth.authenticated) {
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

    const callerUid = userAuth.user?.uid || gfAuth.operator?.uid;

    if (userAuth.authenticated && !gfAuth.authenticated) {
      const allJobs = await getJobs();
      const existing = allJobs.find((j) => j.id === body.id);
      if (existing) {
        const isOwner =
          (existing.company_id && existing.company_id === userAuth.user?.companyId) ||
          (existing as any).posted_by_uid === userAuth.user!.uid;
        if (!isOwner) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: You cannot modify another enterprise’s job posting.' },
            { status: 403 }
          );
        }
      }
      body.postedByUid = userAuth.user!.uid;
      if (userAuth.user?.companyId) {
        body.companyId = userAuth.user.companyId;
      }
    } else if (callerUid && !body.postedByUid) {
      body.postedByUid = callerUid;
    }

    const saved = await saveJob(body);
    return NextResponse.json({ success: true, job: saved }, { status: 200 });
  } catch (err: any) {
    console.error('[API/jobs] POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save job' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);

  if (!userAuth.authenticated && !gfAuth.authenticated) {
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

    if (userAuth.authenticated && !gfAuth.authenticated) {
      const allJobs = await getJobs();
      const existing = allJobs.find((j) => j.id === id);
      if (!existing) {
        return NextResponse.json(
          { success: false, error: 'Job not found' },
          { status: 404 }
        );
      }
      const isOwner =
        (existing.company_id && existing.company_id === userAuth.user?.companyId) ||
        (existing as any).posted_by_uid === userAuth.user!.uid;
      if (!isOwner) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to delete this job posting.' },
          { status: 403 }
        );
      }
    }

    const deleted = await deleteJob(id);
    return NextResponse.json({ success: deleted }, { status: 200 });
  } catch (err: any) {
    console.error('[API/jobs] DELETE error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete job' },
      { status: 500 }
    );
  }
}

