import { NextRequest, NextResponse } from 'next/server';
import { getCases, saveCase, deleteCase } from '@/lib/db/cases';
import { getReviews, saveReview } from '@/lib/db/reviews';
import { getPosts, savePost, deletePost } from '@/lib/db/posts';
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
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'topics' || type === 'topic') {
      const posts = await getPosts();
      const topics = posts.filter((p) => p.tags && p.tags.includes('topic'));
      return NextResponse.json({ success: true, topics }, { status: 200 });
    }

    if (type === 'reviews' || type === 'review') {
      const companyId = searchParams.get('companyId') || '';
      const reviews = await getReviews(companyId);
      return NextResponse.json({ success: true, reviews }, { status: 200 });
    }

    if (type === 'cases' || type === 'case') {
      const cases = await getCases();
      return NextResponse.json({ success: true, cases }, { status: 200 });
    }

    // Default: return all Nexus collections
    const [posts, cases] = await Promise.all([
      getPosts(),
      getCases(),
    ]);
    const topics = posts.filter((p) => p.tags && p.tags.includes('topic'));
    const reviews = await getReviews('');

    return NextResponse.json({ success: true, topics, reviews, cases }, { status: 200 });
  } catch (err: any) {
    console.error('[API/nexus] GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to fetch Nexus data' },
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
    if (!body) {
      return NextResponse.json(
        { success: false, error: 'Request body is required' },
        { status: 400 }
      );
    }

    const callerUid = userAuth.user?.uid || uidHeader;
    const type = body.type || (body.topic ? 'topic' : body.review ? 'review' : body.case ? 'case' : null);

    // 1. Topic
    if (type === 'topic' || body.topic || (body.title && body.content)) {
      const topicData = body.topic || body;
      if (!topicData.id) {
        return NextResponse.json(
          { success: false, error: 'Topic ID is required' },
          { status: 400 }
        );
      }
      if (callerUid && !topicData.authorUid) {
        topicData.authorUid = callerUid;
      }
      topicData.tags = Array.from(new Set([...(topicData.tags || []), 'topic']));
      const saved = await savePost(topicData);
      return NextResponse.json({ success: true, topic: saved }, { status: 200 });
    }

    // 2. Review
    if (type === 'review' || body.review || (body.targetCompanyId && body.rating)) {
      const reviewData = body.review || body;
      if (!reviewData.id) {
        return NextResponse.json(
          { success: false, error: 'Review ID is required' },
          { status: 400 }
        );
      }
      if (callerUid && !reviewData.reviewerUid) {
        reviewData.reviewerUid = callerUid;
      }
      const saved = await saveReview(reviewData);
      return NextResponse.json({ success: true, review: saved }, { status: 200 });
    }

    // 3. Blacklist Case
    if (type === 'case' || body.case || (body.counterpartyCompany && body.reason)) {
      const caseData = body.case || body;
      if (!caseData.id) {
        return NextResponse.json(
          { success: false, error: 'Case ID is required' },
          { status: 400 }
        );
      }
      if (callerUid && !caseData.reporterUid) {
        caseData.reporterUid = callerUid;
        caseData.user_id = callerUid;
      }
      const saved = await saveCase(caseData);
      return NextResponse.json({ success: true, case: saved }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: 'Unrecognized Nexus payload type. Specify topic, review, or case.' },
      { status: 400 }
    );
  } catch (err: any) {
    console.error('[API/nexus] POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save Nexus item' },
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
    const type = searchParams.get('type') || 'topic';

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'ID is required to delete item' },
        { status: 400 }
      );
    }

    let deleted = false;
    if (type === 'case') {
      deleted = await deleteCase(id);
    } else {
      deleted = await deletePost(id);
    }

    return NextResponse.json({ success: deleted }, { status: 200 });
  } catch (err: any) {
    console.error('[API/nexus] DELETE error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete Nexus item' },
      { status: 500 }
    );
  }
}
