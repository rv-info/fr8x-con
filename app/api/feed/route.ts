import { NextRequest, NextResponse } from 'next/server';
import {
  getPersistedPosts,
  savePersistedPost,
  deletePersistedPost,
} from '@/lib/dbms/server-dbms';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);
  const uidHeader = req.headers.get('x-fr8x-user-uid') || req.nextUrl?.searchParams?.get('uid');

  if (!userAuth.authenticated && !gfAuth.authenticated && !uidHeader) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const rawPosts = getPersistedPosts();
    // Deduplicate posts with same author and text posted within 5 minutes
    const seenSignatures = new Set<string>();
    const deduplicated = [];
    for (const p of rawPosts) {
      const sig = `${p.authorUid || p.author}::${(p.text || '').trim().toLowerCase()}::${(p.createdAt || '').slice(0, 16)}`;
      if (seenSignatures.has(sig)) continue;
      seenSignatures.add(sig);
      deduplicated.push(p);
    }

    return NextResponse.json({ success: true, posts: deduplicated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch posts' },
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
        { success: false, error: 'Valid post payload with id is required' },
        { status: 400 }
      );
    }

    const callerUid = userAuth.user?.uid || uidHeader || body.authorUid;
    if (callerUid && !body.authorUid) {
      body.authorUid = callerUid;
      body.authorId = callerUid;
    }

    // Anti-duplication check: if identical post text was created by same author recently
    const existingPosts = getPersistedPosts();
    const isDuplicate = existingPosts.some((p) => {
      const isSameAuthor = p.authorUid === body.authorUid || (p as any).authorId === body.authorUid;
      const isSameText = (p.text || '').trim() === (body.text || '').trim();
      const timeDiff = Math.abs(new Date(p.createdAt || 0).getTime() - new Date(body.createdAt || Date.now()).getTime());
      return isSameAuthor && isSameText && timeDiff < 120000;
    });

    if (isDuplicate) {
      return NextResponse.json({ success: true, message: 'Duplicate post filtered' }, { status: 200 });
    }

    const saved = savePersistedPost(body);
    return NextResponse.json({ success: true, post: saved }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save post' },
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
        { success: false, error: 'Post ID parameter is required' },
        { status: 400 }
      );
    }

    // Ownership check for non-operator callers
    if (userAuth.authenticated && !gfAuth.authenticated) {
      const existing = getPersistedPosts().find((p) => p.id === id);
      if (existing && existing.authorUid !== userAuth.user!.uid && (existing as any).authorId !== userAuth.user!.uid) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to delete this post.' },
          { status: 403 }
        );
      }
    }

    const deleted = deletePersistedPost(id);
    return NextResponse.json({ success: deleted }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}
