import { NextRequest, NextResponse } from 'next/server';
import {
  getPersistedTopics,
  savePersistedTopic,
  deletePersistedTopic,
  getPersistedReviews,
  savePersistedReview,
  deletePersistedReview,
  getPersistedCases,
  savePersistedCase,
  deletePersistedCase,
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
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');

    if (type === 'topics' || type === 'topic') {
      const topics = getPersistedTopics();
      return NextResponse.json({ success: true, topics }, { status: 200 });
    }

    if (type === 'reviews' || type === 'review') {
      const reviews = getPersistedReviews();
      return NextResponse.json({ success: true, reviews }, { status: 200 });
    }

    if (type === 'cases' || type === 'case') {
      const cases = getPersistedCases();
      return NextResponse.json({ success: true, cases }, { status: 200 });
    }

    // Default: return all Nexus collections
    const topics = getPersistedTopics();
    const reviews = getPersistedReviews();
    const cases = getPersistedCases();

    return NextResponse.json({ success: true, topics, reviews, cases }, { status: 200 });
  } catch (err: any) {
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
      const saved = savePersistedTopic(topicData);



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
      const saved = savePersistedReview(reviewData);



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
      }
      const saved = savePersistedCase(caseData);



      return NextResponse.json({ success: true, case: saved }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: 'Unrecognized Nexus payload type. Specify topic, review, or case.' },
      { status: 400 }
    );
  } catch (err: any) {
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
        { success: false, error: 'Item ID is required' },
        { status: 400 }
      );
    }

    if (type === 'topic') {
      if (userAuth.authenticated && !gfAuth.authenticated) {
        const existing = getPersistedTopics().find((t) => t.id === id);
        if (existing && existing.authorUid && existing.authorUid !== userAuth.user!.uid) {
          return NextResponse.json(
            { success: false, error: 'Forbidden: You do not own this topic.' },
            { status: 403 }
          );
        }
      }
      const deleted = deletePersistedTopic(id);



      return NextResponse.json({ success: deleted }, { status: 200 });
    }

    if (type === 'review') {
      const deleted = deletePersistedReview(id);



      return NextResponse.json({ success: deleted }, { status: 200 });
    }

    if (type === 'case') {
      const deleted = deletePersistedCase(id);



      return NextResponse.json({ success: deleted }, { status: 200 });
    }

    return NextResponse.json(
      { success: false, error: 'Unrecognized type for deletion' },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to delete Nexus item' },
      { status: 500 }
    );
  }
}
