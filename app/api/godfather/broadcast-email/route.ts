import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { serverSecurityStore } from '@/lib/server-auth-store';
import { EmailService } from '@/lib/email-service';
import { BroadcastEmailTemplateParams } from '@/lib/email-templates';

function getHistoryFilePath(): string {
  const dir = path.join(process.cwd(), '.knox');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return path.join(dir, 'broadcast-history.json');
}

function loadBroadcastHistory(): any[] {
  try {
    const file = getHistoryFilePath();
    if (fs.existsSync(file)) {
      const raw = fs.readFileSync(file, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('[BroadcastEmailAPI] Error loading history:', err);
  }
  return [];
}

function saveBroadcastHistory(history: any[]) {
  try {
    const file = getHistoryFilePath();
    fs.writeFileSync(file, JSON.stringify(history, null, 2), 'utf8');
  } catch (err) {
    console.error('[BroadcastEmailAPI] Error saving history:', err);
  }
}

export async function GET(req: NextRequest) {
  try {
    // 1. Get all registered users from persistent server security store
    const rawUsers = serverSecurityStore.getAllRegisteredUsers();
    const users = rawUsers.map((u) => ({
      uid: u.uid,
      email: u.email,
      displayName: u.displayName || u.email.split('@')[0],
      company: u.company || 'Enterprise Partner',
      role: u.role,
      status: u.status,
      email_verified: u.email_verified,
      createdAt: u.createdAt,
    }));

    // 2. Load past broadcast campaigns
    const history = loadBroadcastHistory();

    return NextResponse.json({
      success: true,
      users,
      totalRegisteredUsers: users.length,
      history,
    });
  } catch (error: any) {
    console.error('[BroadcastEmailAPI] GET error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to retrieve broadcast metadata' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      category = 'UPDATE',
      subject,
      title,
      badgeText,
      highlightNotice,
      bodyContent,
      actionLabel,
      actionUrl,
      targetType = 'all',
      specificEmails,
      operatorEmail = 'support@fr8x.in',
      operatorName = 'Godfather Operator',
      isTest = false,
    } = body;

    if (!subject || !title || !bodyContent) {
      return NextResponse.json(
        { success: false, error: 'Subject, Title, and Body content are mandatory.' },
        { status: 400 }
      );
    }

    // Determine target recipients
    interface TargetRecipient {
      email: string;
      name: string;
    }

    let recipients: TargetRecipient[] = [];

    if (isTest) {
      const testEmail = typeof specificEmails === 'string' && specificEmails.includes('@')
        ? specificEmails.split(',')[0].trim()
        : operatorEmail || 'support@fr8x.in';
      recipients = [{ email: testEmail, name: `${operatorName} (Test Copy)` }];
    } else if (targetType === 'all') {
      const rawUsers = serverSecurityStore.getAllRegisteredUsers();
      recipients = rawUsers
        .filter((u) => u.email && u.email.includes('@'))
        .map((u) => ({
          email: u.email.trim().toLowerCase(),
          name: u.displayName || u.company || 'FR8X Valued Member',
        }));

      // If store is empty, fallback to support
      if (recipients.length === 0) {
        recipients = [{ email: 'support@fr8x.in', name: 'FR8X Operations Desk' }];
      }
    } else {
      // Specific target
      let rawList: string[] = [];
      if (Array.isArray(specificEmails)) {
        rawList = specificEmails;
      } else if (typeof specificEmails === 'string') {
        rawList = specificEmails.split(/[,;\n]/).map((e) => e.trim());
      }

      const cleanList = Array.from(new Set(rawList.filter((e) => e && e.includes('@'))));
      if (cleanList.length === 0) {
        return NextResponse.json(
          { success: false, error: 'Please provide at least one valid recipient email address.' },
          { status: 400 }
        );
      }

      recipients = cleanList.map((em) => ({
        email: em.toLowerCase(),
        name: em.split('@')[0],
      }));
    }

    console.log(
      `[BroadcastEmailAPI] Starting broadcast '${title}' [${category}] to ${recipients.length} recipients...`
    );

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    // Send emails in batches of 5
    for (let i = 0; i < recipients.length; i += 5) {
      const chunk = recipients.slice(i, i + 5);
      await Promise.all(
        chunk.map(async (r) => {
          try {
            const params: BroadcastEmailTemplateParams = {
              recipient: r.email,
              recipientName: r.name,
              category,
              subject,
              title,
              badgeText,
              highlightNotice,
              bodyContent,
              actionLabel,
              actionUrl,
              operatorName,
              contactEmail: 'support@fr8x.in',
            };

            const res = await EmailService.sendBroadcastEmail(params);
            if (res.success) {
              successCount++;
            } else {
              failureCount++;
              errors.push(`${r.email}: ${res.error || 'delivery failed'}`);
            }
          } catch (sendErr: any) {
            failureCount++;
            errors.push(`${r.email}: ${sendErr.message}`);
          }
        })
      );
    }

    // Record this broadcast in persistent history
    const broadcastRecord = {
      id: `bcast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      category,
      subject,
      title,
      badgeText: badgeText || '',
      highlightNotice: highlightNotice || '',
      bodyContent,
      actionLabel: actionLabel || '',
      actionUrl: actionUrl || '',
      targetType: isTest ? 'test' : targetType,
      totalRecipients: recipients.length,
      recipientsPreview: recipients.slice(0, 10).map((r) => r.email),
      successCount,
      failureCount,
      status: failureCount === 0 ? 'DELIVERED' : successCount > 0 ? 'PARTIAL' : 'FAILED',
      sentAt: new Date().toISOString(),
      operatorEmail,
      operatorName,
      isTest,
    };

    if (!isTest) {
      const history = loadBroadcastHistory();
      history.unshift(broadcastRecord);
      saveBroadcastHistory(history);
    }

    return NextResponse.json({
      success: true,
      message: isTest
        ? `Test copy sent successfully to ${recipients[0].email}`
        : `Broadcast successfully dispatched to ${successCount} recipient(s)${failureCount > 0 ? ` (${failureCount} failed)` : ''}.`,
      broadcast: broadcastRecord,
      errors: errors.slice(0, 5),
    });
  } catch (error: any) {
    console.error('[BroadcastEmailAPI] POST error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error while dispatching broadcast' },
      { status: 500 }
    );
  }
}
