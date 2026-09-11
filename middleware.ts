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
  '/godfather',
];

/** Routes that require the Godfather operator session cookie */
const PROTECTED_GODFATHER_ROUTES = ['/godfatheron', '/GODFATHERON'];

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
];

function isGodfatherRoute(pathname: string): boolean {
  return PROTECTED_GODFATHER_ROUTES.some(
    (r) => pathname.toLowerCase() === r.toLowerCase() || pathname.toLowerCase().startsWith(r.toLowerCase() + '/')
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

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── Allow public routes through without any auth check ───────────────────────
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }

  // ── Godfather operator routes ─────────────────────────────────────────────────
  if (isGodfatherRoute(pathname)) {
    const godfatherCookie =
      request.cookies.get('fr8x_godfather_session') ||
      request.cookies.get('__Secure-FR8X-Godfather-Session');

    if (!godfatherCookie?.value) {
      // Do NOT reveal the Godfather panel URL — redirect to plain login
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('reason', 'auth_required');
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ── Protected user routes ────────────────────────────────────────────────────
  if (isProtectedUserRoute(pathname)) {
    const sessionCookie = request.cookies.get('fr8x_session');

    if (!sessionCookie?.value) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('reason', 'auth_required');
      loginUrl.searchParams.set('next', encodeURIComponent(pathname));
      return NextResponse.redirect(loginUrl);
    }

    return NextResponse.next();
  }

  // ── All other routes pass through ───────────────────────────────────────────
  return NextResponse.next();
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
