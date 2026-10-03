import { NextRequest, NextResponse } from 'next/server';
import { authenticateUserSession, authenticateGodfatherOperator } from '@/lib/auth-guard';

export const dynamic = 'force-dynamic';

interface IssueReportRecord {
  id: string;
  ticketNumber: string;
  uid: string;
  userEmail: string;
  userName: string;
  category: 'mobile_number' | 'designation' | 'location' | 'general_identity';
  currentValue?: string;
  requestedValue?: string;
  description: string;
  status: 'submitted_to_professionals' | 'in_review' | 'resolved';
  createdAt: string;
}

// In-memory persistent docket buffer for issues
const reportedIssues: IssueReportRecord[] = [];

/**
 * POST /api/user/issue-report
 * Handles reporting discrepancies or update requests for verified identity attributes:
 * - Mobile Number
 * - Designation / Role
 * - Geographic Location & Operating Hub
 * 
 * Directs the request to Compliance & Identity Professionals for verification.
 */
export async function POST(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);

  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { category, currentValue, requestedValue, description } = body;

    const callerUid = userAuth.user?.uid || gfAuth.operator?.uid || 'user';
    const callerEmail = userAuth.user?.email || gfAuth.operator?.email || '';

    if (!category || !description) {
      return NextResponse.json(
        { success: false, error: 'Category and issue description are required.' },
        { status: 400 }
      );
    }

    const ticketNumber = `ISS-PROF-${Math.floor(100000 + Math.random() * 900000)}`;
    const record: IssueReportRecord = {
      id: `issue_${Date.now()}`,
      ticketNumber,
      uid: callerUid,
      userEmail: callerEmail,
      userName: body.userName || 'Enterprise Member',
      category: category as any,
      currentValue: currentValue || '',
      requestedValue: requestedValue || '',
      description: String(description).trim(),
      status: 'submitted_to_professionals',
      createdAt: new Date().toISOString(),
    };

    reportedIssues.unshift(record);
    console.info(`[Compliance Issue] Ticket ${ticketNumber} logged for ${category} by ${callerEmail}`);

    return NextResponse.json({
      success: true,
      ticketNumber,
      message: `Your issue regarding ${category.replace('_', ' ')} has been submitted to FR8X Compliance Professionals. Ticket: ${ticketNumber}. Our team will review and resolve it within 24 hours.`,
      record,
    });
  } catch (err: any) {
    console.error('[API/User/IssueReport] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to submit issue to professionals.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  const userAuth = authenticateUserSession(req, { allowUnverified: true });
  const gfAuth = authenticateGodfatherOperator(req);

  if (!userAuth.authenticated && !gfAuth.authenticated) {
    return (userAuth.errorResponse || gfAuth.errorResponse)!;
  }

  const callerUid = userAuth.user?.uid;
  const isGodfather = gfAuth.authenticated;

  const userIssues = isGodfather
    ? reportedIssues
    : reportedIssues.filter((i) => i.uid === callerUid);

  return NextResponse.json({
    success: true,
    issues: userIssues,
  });
}
