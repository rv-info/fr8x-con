import { NextRequest, NextResponse } from 'next/server';
import {
  getPersistedPosts,
  savePersistedPost,
  deletePersistedPost,
} from '@/lib/dbms/server-dbms';

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
  try {
    const body = await req.json().catch(() => null);
    if (!body || !body.id) {
      return NextResponse.json(
        { success: false, error: 'Valid post payload with id is required' },
        { status: 400 }
      );
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
