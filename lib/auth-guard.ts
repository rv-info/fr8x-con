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
  // 1. Check signed Godfather session cookies or Bearer authorization header
  const sessionCookie =
    req.cookies.get('fr8x_godfather_session') ||
    req.cookies.get('__Secure-FR8X-Godfather-Session');
  const authHeader = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '').trim();

  const token = sessionCookie?.value || authHeader;

  if (!token) {
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

  // Cryptographic HMAC-SHA256 signature verification
  const verification = verifySignedSessionToken<{
    sessionId: string;
    uid: string;
    email: string;
    role: string;
    expiresAt?: string;
  }>(token);

  if (!verification.valid || !verification.payload) {
    // If token is an opaque session ID, check server security store directly
    if (serverSecurityStore.isGodfatherSessionActive(token)) {
      return {
        authenticated: true,
        operator: {
          sessionId: token,
          uid: 'gf-op-godfather',
          email: 'tech@fr8x.in',
          role: 'godfather_owner',
        },
      };
    }
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

  // If server restarted, re-register verified HMAC session
  if (!serverSecurityStore.isGodfatherSessionActive(sessionId)) {
    serverSecurityStore.registerGodfatherSession(sessionId);
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
 * Requires cryptographic HMAC-SHA256 signature verification.
 */
export function authenticateUserSession(
  req: NextRequest,
  options?: { allowUnverified?: boolean }
): {
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
    const customSession = req.headers.get('x-fr8x-session');
    if (customSession) token = customSession.trim();
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

  // Only validate tokens with valid cryptographic signature (payloadBase64.64hexSignature)
  const isSignedTokenCandidate =
    token.includes('.') &&
    token.split('.').length === 2 &&
    /^[a-f0-9]{64}$/i.test(token.split('.')[1]);

  let uid: string | null = null;
  let tokenEmail: string | undefined;
  let tokenRole: string | undefined;
  let tokenCompanyId: string | undefined;

  if (isSignedTokenCandidate) {
    const verified = verifySignedSessionToken<{
      uid: string;
      email: string;
      role: string;
      companyId?: string;
      displayName?: string;
      expiresAt?: string;
    }>(token);

    if (verified.valid && verified.payload?.uid) {
      if (verified.payload.expiresAt && new Date() > new Date(verified.payload.expiresAt)) {
        return {
          authenticated: false,
          errorResponse: NextResponse.json(
            {
              success: false,
              error: 'Unauthorized: Session token has expired.',
              code: 'SESSION_EXPIRED',
            },
            { status: 401 }
          ),
        };
      }
      uid = verified.payload.uid;
      tokenEmail = verified.payload.email;
      tokenRole = verified.payload.role;
      tokenCompanyId = verified.payload.companyId;
    } else {
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
  } else {
    return {
      authenticated: false,
      errorResponse: NextResponse.json(
        {
          success: false,
          error: 'Unauthorized: Valid signed session token required.',
          code: 'INVALID_SESSION_TOKEN',
        },
        { status: 401 }
      ),
    };
  }

  let userRecord = uid ? (serverSecurityStore.getUser(uid) || serverSecurityStore.getUserByEmailOrUid(uid)) : null;
  if (!userRecord && uid) {
    serverSecurityStore.loadPersistedState();
    userRecord = serverSecurityStore.getUser(uid) || serverSecurityStore.getUserByEmailOrUid(uid);
  }
  if (!userRecord && uid && tokenEmail) {
    const updateRes = serverSecurityStore.updateUserProfile(uid, {
      uid,
      email: tokenEmail,
      displayName: tokenEmail.split('@')[0] || 'Enterprise Member',
      company: tokenCompanyId || 'Enterprise Legal Entity',
      companyId: tokenCompanyId,
      role: (tokenRole as any) || 'user',
      status: 'active',
    });
    userRecord = updateRes.user;
  }

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

  // Feature Guard: Unverified users cannot access protected features (unless allowUnverified is specified)
  if (!options?.allowUnverified && (userRecord.email_verified === false || userRecord.status === 'pending_verification')) {
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

/**
 * Asserts that the authenticated actor possesses one of the permitted roles,
 * or is a Godfather platform operator.
 */
export function hasAllowedRole(
  actorRole: string | undefined,
  allowedRoles: string[],
  isOperator = false
): boolean {
  if (isOperator) return true;
  if (!actorRole) return false;
  return allowedRoles.includes(actorRole);
}

/**
 * Asserts that the caller is the owner of the resource or has administrative authority.
 */
export function isOwnerOrAdmin(
  callerUid: string | undefined,
  resourceOwnerUid: string | undefined,
  isOperator = false
): boolean {
  if (isOperator) return true;
  if (!callerUid || !resourceOwnerUid) return false;
  return callerUid === resourceOwnerUid;
}

/**
 * Asserts that the caller belongs to the target company entity or is a platform operator.
 */
export function isCompanyMemberOrAdmin(
  callerCompanyId: string | undefined,
  targetCompanyId: string | undefined,
  isOperator = false
): boolean {
  if (isOperator) return true;
  if (!callerCompanyId || !targetCompanyId) return false;
  return callerCompanyId.toLowerCase() === targetCompanyId.toLowerCase();
}

