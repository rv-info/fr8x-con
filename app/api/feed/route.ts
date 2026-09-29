import { NextRequest, NextResponse } from 'next/server';
import {
  getPersistedPosts,
  savePersistedPost,
  deletePersistedPost,
} from '@/lib/dbms/server-dbms';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';

export async function GET(req: NextRequest) {
  try {
    const posts = getPersistedPosts();
    return NextResponse.json({ success: true, posts }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch posts' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const userAuth = authenticateUserSession(req);
  const gfAuth = authenticateGodfatherOperator(req);
  if (!userAuth.authenticated && !gfAuth.authenticated) {
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
    if (userAuth.authenticated && userAuth.user?.uid) {
      body.authorId = body.authorId || userAuth.user.uid;
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
  const userAuth = authenticateUserSession(req);
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
    const deleted = deletePersistedPost(id);
    return NextResponse.json({ success: deleted }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete post' },
      { status: 500 }
    );
  }
}
