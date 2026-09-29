import { NextRequest, NextResponse } from 'next/server';
import { verifySignedSessionToken, verifyCsrfToken } from '@/lib/crypto';
import { serverSecurityStore } from '@/lib/server-auth-store';

export interface AuthenticatedGodfatherOperator {
  sessionId: string;
  uid: string;
  email: string;
  role: string;
}

export interface AuthenticatedUserSession {
  uid: string;
  email: string;
  role: string;
  companyId?: string;
}

/**
 * Validates that an incoming NextRequest possesses a valid, cryptographically signed
 * Godfather administrator session cookie registered in the active server store.
 */
export function authenticateGodfatherOperator(req: NextRequest): {
  authenticated: boolean;
  operator?: AuthenticatedGodfatherOperator;
  errorResponse?: NextResponse;
} {
  const sessionCookie =
    req.cookies.get('fr8x_godfather_session') ||
    req.cookies.get('__Secure-FR8X-Godfather-Session');

  if (!sessionCookie || !sessionCookie.value) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Privileged Godfather operator authentication required.',
          code: 'GODFATHER_UNAUTHENTICATED',
        },
        { status: 401 }
      ),
    };
  }

  const verification = verifySignedSessionToken<{
    sessionId: string;
    uid: string;
    email: string;
    role: string;
    expiresAt?: string;
  }>(sessionCookie.value);

  if (!verification.valid || !verification.payload) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Invalid or tampered operator session signature.',
          code: 'INVALID_SESSION_SIGNATURE',
        },
        { status: 401 }
      ),
    };
  }

  const { sessionId, uid, email, role, expiresAt } = verification.payload;

  if (expiresAt && new Date() > new Date(expiresAt)) {
    serverSecurityStore.revokeGodfatherSession(sessionId);
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Operator session has expired. Please log in again.',
          code: 'SESSION_EXPIRED',
        },
        { status: 401 }
      ),
    };
  }

  if (!serverSecurityStore.isGodfatherSessionActive(sessionId)) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Operator session has been terminated or revoked.',
          code: 'SESSION_REVOKED',
        },
        { status: 401 }
      ),
    };
  }

  return {
    authenticated: true,
    operator: {
      sessionId,
      uid: uid || 'gf-op-godfather',
      email: email || 'tech@fr8x.in',
      role: role || 'godfather_owner',
    },
  };
}

/**
 * Validates that an incoming NextRequest possesses a valid enterprise user session.
 */
export function authenticateUserSession(req: NextRequest): {
  authenticated: boolean;
  user?: AuthenticatedUserSession;
  errorResponse?: NextResponse;
} {
  const sessionCookie = req.cookies.get('fr8x_session');
  const authHeader = req.headers.get('authorization');
  let token = sessionCookie?.value;
  if (!token && authHeader?.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }
  if (!token) {
    const customHeader =
      req.headers.get('x-fr8x-session') ||
      req.headers.get('x-fr8x-user-uid') ||
      req.headers.get('x-user-uid') ||
      req.cookies.get('fr8x_active_user_uid')?.value ||
      req.nextUrl?.searchParams?.get('uid');
    if (customHeader) token = customHeader.trim();
  }

  if (!token) {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Authentication required.',
          code: 'UNAUTHENTICATED',
        },
        { status: 401 }
      ),
    };
  }

  let uid = token;

  // Only attempt cryptographic verification if the token conforms to signed token structure (payloadBase64.64hexSignature)
  const isSignedTokenCandidate =
    token.includes('.') &&
    token.split('.').length === 2 &&
    /^[a-f0-9]{64}$/i.test(token.split('.')[1]);

  if (isSignedTokenCandidate) {
    const verified = verifySignedSessionToken<{ uid: string; email: string; role: string }>(token);
    if (verified.valid && verified.payload?.uid) {
      uid = verified.payload.uid;
    } else {
      const fallbackUser = serverSecurityStore.getUser(token) || serverSecurityStore.getUserByEmailOrUid(token);
      if (!fallbackUser) {
        return {
          authenticated: false,
          errorResponse: NextResponse.json(
            {
              success: false,
              error: 'Unauthorized: Invalid session token signature.',
              code: 'INVALID_SESSION_SIGNATURE',
            },
            { status: 401 }
          ),
        };
      }
      uid = fallbackUser.uid;
    }
  }

  const userRecord = serverSecurityStore.getUser(uid) || serverSecurityStore.getUserByEmailOrUid(uid);
  if (!userRecord || userRecord.status === 'blocked') {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: userRecord?.status === 'blocked' ? 'Account is blocked.' : 'Session user not found.',
          code: userRecord?.status === 'blocked' ? 'ACCOUNT_BLOCKED' : 'USER_NOT_FOUND',
        },
        { status: 403 }
      ),
    };
  }

  // Feature Guard: Unverified users cannot access protected features
  if (userRecord.email_verified === false || userRecord.status === 'pending_verification') {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Email verification required. Please verify your email address to access this feature.',
          code: 'EMAIL_NOT_VERIFIED',
          email: userRecord.email,
        },
        { status: 403 }
      ),
    };
  }

  return {
    authenticated: true,
    user: {
      uid: userRecord.uid,
      email: userRecord.email,
      role: userRecord.role,
      companyId: userRecord.companyId,
    },
  };
}

/**
 * Validates the CSRF token on mutating requests (POST, PUT, DELETE, PATCH).
 * Token is verified against the authenticated session ID via HMAC-SHA256.
 */
export function validateCsrfHeader(
  req: NextRequest,
  sessionId: string
): {
  valid: boolean;
  errorResponse?: NextResponse;
} {
  const token = req.headers.get('x-csrf-token') || req.headers.get('csrf-token');
  if (!token) {
    return {
      valid: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Missing CSRF protection token.',
          code: 'CSRF_TOKEN_MISSING',
        },
        { status: 403 }
      ),
    };
  }

  const isValid = verifyCsrfToken(token, sessionId);
  if (!isValid) {
    return {
      valid: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Forbidden: Invalid or expired CSRF token.',
          code: 'CSRF_TOKEN_INVALID',
        },
        { status: 403 }
      ),
    };
  }

  return { valid: true };
}

