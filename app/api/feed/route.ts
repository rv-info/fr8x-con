import { NextRequest, NextResponse } from 'next/server';
import { getPosts, getPostById, savePost, deletePost } from '@/lib/db/posts';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';
import { redis } from '@/lib/redis';

export async function GET(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);

  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const rawPosts = await getPosts();
    // Deduplicate posts with same author and text posted within 5 minutes
    const seenSignatures = new Set<string>();
    const deduplicated = [];
    for (const p of rawPosts) {
      const sig = `${p.author_id}::${(p.content || '').trim().toLowerCase()}::${(p.created_at || '').slice(0, 16)}`;
      if (seenSignatures.has(sig)) continue;
      seenSignatures.add(sig);
      deduplicated.push(p);
    }

    return NextResponse.json({ success: true, posts: deduplicated }, { status: 200 });
  } catch (err: any) {
    console.error('[API/feed] GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch posts' },
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
    const callerUid = userAuth.user?.uid || gfAuth.operator?.uid || 'anonymous';
    const rateLimit = await redis.checkRateLimit({
      action: 'feed_post_mutation',
      identifier: callerUid,
      limit: 30,
      windowSeconds: 60,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { success: false, error: 'Rate limit exceeded: Too many feed posts submitted. Please wait a moment.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: 'Valid post payload with id is required' },
        { status: 400 }
      );
    }

    if (body.id && userAuth.authenticated && !gfAuth.authenticated) {
      const existing = await getPostById(body.id);
      if (
        existing &&
        existing.author_id !== userAuth.user!.uid &&
        existing.author_uid !== userAuth.user!.uid
      ) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to modify this post.' },
          { status: 403 }
        );
      }
    }

    if (userAuth.authenticated && !gfAuth.authenticated) {
      body.authorUid = userAuth.user!.uid;
      body.authorId = userAuth.user!.uid;
    } else if (callerUid) {
      body.authorUid = callerUid;
      body.authorId = callerUid;
    }

    const saved = await savePost(body);
    return NextResponse.json({ success: true, post: saved }, { status: 200 });
  } catch (err: any) {
    console.error('[API/feed] POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save post' },
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
        { success: false, error: 'Post ID parameter is required' },
        { status: 400 }
      );
    }

    const existing = await getPostById(id);
    if (!existing) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Ownership check for non-operator callers
    if (userAuth.authenticated && !gfAuth.authenticated) {
      if (
        existing.author_id !== userAuth.user!.uid &&
        existing.author_uid !== userAuth.user!.uid
      ) {
        return NextResponse.json(
          { success: false, error: 'Forbidden: You do not have permission to delete this post.' },
          { status: 403 }
        );
      }
    }

    const deleted = await deletePost(id);
    return NextResponse.json({ success: deleted }, { status: 200 });
  } catch (err: any) {
    console.error('[API/feed] DELETE error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}

