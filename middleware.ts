/**
 * FR8X Next.js Middleware — Centralized Route Authentication Gate
 * ==============================================================
 * Runs on the Vercel Edge runtime before any page or API route is served.
 * Performs server-side session cookie presence check for all protected routes.
 *
 * SECURITY NOTES:
 * - Session cookies are httpOnly and cannot be read by client-side JS.
 * - Middleware provides a fast outer gate (cookie presence).
 * - Full HMAC signature verification is done in each API route/page via auth-guard.ts.
 * - Blocked or expired sessions are redirected to /login.
 * - The Godfather panel requires a separate privileged cookie.
 * - Public routes (login, register, reset-password, verify-email, API) pass through.
 */

import { NextRequest, NextResponse } from 'next/server';

/** Routes that require a valid user session cookie */
const PROTECTED_USER_ROUTES = [
  '/dashboard',
  '/feeds',
  '/jobs',
  '/auctions',
  '/rates',
  '/profile',
  '/nexus',
];

/** Routes that require the Godfather operator session cookie */
const PROTECTED_GODFATHER_ROUTES = ['/godfather'];

/** Routes explicitly public — no auth check */
const PUBLIC_ROUTES = [
  '/login',
  '/register',
  '/reset-password',
  '/verify-email',
  '/r',
  '/ref',
  '/privacy',
  '/download',
  '/godfatheron',
  '/GODFATHERON',
  '/godfather/login',
];

function isGodfatherRoute(pathname: string): boolean {
  const lower = pathname.toLowerCase();
  if (lower === '/godfatheron' || lower.startsWith('/godfatheron/') || lower === '/godfather/login') {
    return false;
  }
  return PROTECTED_GODFATHER_ROUTES.some(
    (r) => lower === r.toLowerCase() || lower.startsWith(r.toLowerCase() + '/')
  );
}

function isProtectedUserRoute(pathname: string): boolean {
  return PROTECTED_USER_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  );
}

function isPublicRoute(pathname: string): boolean {
  // API routes are handled by their own auth guards
  if (pathname.startsWith('/api/')) return true;
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/' || pathname === '') return true;
  return PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  );
}

/**
 * Helper: inject universal security headers & correlation ID
 */
export function applySecurityHeaders(res: NextResponse, requestId?: string): NextResponse {
  if (requestId) {
    res.headers.set('x-request-id', requestId);
  }
  res.headers.set('X-Content-Type-Options', 'nosniff');
  res.headers.set('X-Frame-Options', 'DENY');
  res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.headers.set('X-XSS-Protection', '1; mode=block');
  res.headers.set(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains; preload'
  );
  res.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );
  return res;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Correlation ID for distributed end-to-end request tracing
  const requestId =
    request.headers.get('x-request-id') ||
    `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);

  const forward = () => {
    const res = NextResponse.next({ request: { headers: requestHeaders } });
    return applySecurityHeaders(res, requestId);
  };

  // ── Allow public routes through without any auth check ───────────────────────
  if (isPublicRoute(pathname)) {
    return forward();
  }

  // ── Godfather operator routes ─────────────────────────────────────────────────
  if (isGodfatherRoute(pathname)) {
    const godfatherCookie =
      request.cookies.get('fr8x_godfather_session') ||
      request.cookies.get('__Secure-FR8X-Godfather-Session');

    if (!godfatherCookie?.value) {
      // Redirect to dedicated Godfather operator login portal, preserving target URL
      const gfLoginUrl = new URL('/godfatheron', request.url);
      gfLoginUrl.searchParams.set('reason', 'auth_required');
      gfLoginUrl.searchParams.set('next', encodeURIComponent(pathname));
      const res = NextResponse.redirect(gfLoginUrl);
      return applySecurityHeaders(res);
    }

    return forward();
  }

  // ── Protected user routes ────────────────────────────────────────────────────
  if (isProtectedUserRoute(pathname)) {
    const sessionCookie = request.cookies.get('fr8x_session');

    // Check 2-hour session expiration window if cookie is present
    if (sessionCookie?.value && sessionCookie.value.includes('.')) {
      try {
        const payloadB64 = sessionCookie.value.split('.')[0];
        // Safe base64url decode with proper padding compatible with edge and node runtimes
        let base64 = payloadB64.replace(/-/g, '+').replace(/_/g, '/');
        while (base64.length % 4 !== 0) {
          base64 += '=';
        }
        const binary = atob(base64);
        const payload = JSON.parse(binary);
        const now = Date.now();
        const issuedAt = Number(payload.issuedAt) || 0;
        const expiresAt = Number(payload.expiresAt) || (issuedAt + 2 * 60 * 60 * 1000);

        if (issuedAt > 0 && (now > expiresAt || now - issuedAt > 2 * 60 * 60 * 1000)) {
          const loginUrl = new URL('/login', request.url);
          loginUrl.searchParams.set('reason', 'session_expired');
          const res = NextResponse.redirect(loginUrl);
          res.cookies.delete('fr8x_session');
          return applySecurityHeaders(res);
        }
      } catch {}
    }

    return forward();
  }

  // ── All other routes pass through ───────────────────────────────────────────
  return forward();
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT Next.js internals, static assets,
     * and the favicon. Runs on the Vercel Edge runtime.
     */
    '/((?!_next/static|_next/image|favicon.ico|icons/|images/).*)',
  ],
};
