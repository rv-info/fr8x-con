/**
 * FR8X Next.js Edge Middleware — High-Performance Route Gate & Rate Limiter
 * =========================================================================
 * Runs on the Vercel Edge Runtime with sub-millisecond execution overhead (<1MB).
 *
 * KEY AUDITS & CORRECTIONS:
 * 1. Closes API route exemption: Enforces sliding-window rate limiting on public
 *    discovery endpoints (/api/members, /api/people/search, /api/people/profile)
 *    and sensitive auth endpoints to prevent scraping and denial-of-service.
 * 2. Edge-Safe Session Optimization: Skips expensive external Supabase Auth network
 *    round-trips on public requests when no authentication cookies are present.
 * 3. Applies universal security headers (HSTS, CSP, nosniff, frame-ancestors, etc.)
 *    across all pages and API responses.
 * 4. Preserves backward-compatible session handling and Godfather operator gating.
 */

import { NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

/** Routes that require a valid user session */
const PROTECTED_USER_ROUTES = [
  '/dashboard',
  '/feeds',
  '/jobs',
  '/auctions',
  '/rates',
  '/people',
  '/contacts',
  '/connections',
  '/profile',
  '/nexus',
];

/** Routes that require the Godfather operator session */
const PROTECTED_GODFATHER_ROUTES = ['/godfather'];

/** Routes explicitly public */
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

// ── Sliding-Window In-Memory Rate Limiter for Edge Runtime ───────────────────
interface RateLimitRule {
  maxRequests: number;
  windowMs: number;
}

const RATE_LIMIT_RULES: Record<string, RateLimitRule> = {
  '/api/members':        { maxRequests: 60, windowMs: 60_000 },
  '/api/people/search':  { maxRequests: 60, windowMs: 60_000 },
  '/api/people/profile': { maxRequests: 90, windowMs: 60_000 },
  '/api/auth/login':     { maxRequests: 15, windowMs: 60_000 },
  '/api/auth/register':  { maxRequests: 10, windowMs: 60_000 },
};

const DEFAULT_API_RULE: RateLimitRule = { maxRequests: 120, windowMs: 60_000 };

interface ClientTimestamps {
  timestamps: number[];
}

const rateLimitStore = new Map<string, ClientTimestamps>();
let lastPruneTime = Date.now();

function checkEdgeRateLimit(
  ip: string,
  pathname: string
): { allowed: boolean; remaining: number; resetMs: number; limit: number } | null {
  // Determine matching rule
  let rule: RateLimitRule | null = null;
  for (const [routePrefix, routeRule] of Object.entries(RATE_LIMIT_RULES)) {
    if (pathname === routePrefix || pathname.startsWith(routePrefix + '/')) {
      rule = routeRule;
      break;
    }
  }

  if (!rule && pathname.startsWith('/api/')) {
    rule = DEFAULT_API_RULE;
  }

  if (!rule) return null; // No rate limiting for static or standard non-API pages

  const now = Date.now();
  const key = `${ip}:${pathname.split('?')[0]}`;

  // Periodic memory hygiene in long-lived Edge isolates
  if (now - lastPruneTime > 60_000) {
    lastPruneTime = now;
    for (const [storeKey, record] of rateLimitStore.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > now - 120_000);
      if (record.timestamps.length === 0) {
        rateLimitStore.delete(storeKey);
      }
    }
  }

  let record = rateLimitStore.get(key);
  if (!record) {
    record = { timestamps: [] };
    rateLimitStore.set(key, record);
  }

  const windowStart = now - rule.windowMs;
  record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

  if (record.timestamps.length >= rule.maxRequests) {
    const oldest = record.timestamps[0];
    const resetMs = Math.max(0, oldest + rule.windowMs - now);
    return { allowed: false, remaining: 0, resetMs, limit: rule.maxRequests };
  }

  record.timestamps.push(now);
  const remaining = rule.maxRequests - record.timestamps.length;
  return { allowed: true, remaining, resetMs: rule.windowMs, limit: rule.maxRequests };
}

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
  if (pathname.startsWith('/_next/')) return true;
  if (pathname === '/' || pathname === '') return true;
  return PUBLIC_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + '/')
  );
}

/**
 * Universal security headers & correlation ID
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
  const csp = [
    "default-src 'self'",
    `script-src 'self' 'unsafe-inline' ${process.env.NODE_ENV === 'production' ? '' : "'unsafe-eval'"} https://va.vercel-scripts.com https://checkout.razorpay.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob: https://*.supabase.co https://haarbaqeuuirwkhmefev.supabase.co https://images.unsplash.com",
    "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://haarbaqeuuirwkhmefev.supabase.co wss://haarbaqeuuirwkhmefev.supabase.co https://api.razorpay.com https://lumberjack.razorpay.com https://api.zeptomail.in",
    "frame-src 'self' https://api.razorpay.com https://checkout.razorpay.com",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ');
  res.headers.set('Content-Security-Policy', csp);
  return res;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Correlation ID for distributed end-to-end tracing
  const requestId =
    request.headers.get('x-request-id') ||
    `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 7)}`;

  // Extract client IP address accurately behind CDN/Vercel proxies
  const forwardedFor = request.headers.get('x-forwarded-for');
  const clientIp = forwardedFor ? forwardedFor.split(',')[0].trim() : '127.0.0.1';

  // ── 1. Edge Rate Limiter (Evaluated before any expensive network operations) ─
  const rateLimitStatus = checkEdgeRateLimit(clientIp, pathname);
  if (rateLimitStatus && !rateLimitStatus.allowed) {
    const errorResponse = NextResponse.json(
      {
        success: false,
        error: 'Too many requests. Please slow down your requests to FR8X services.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      { status: 429 }
    );
    errorResponse.headers.set('Retry-After', String(Math.ceil(rateLimitStatus.resetMs / 1000)));
    errorResponse.headers.set('X-RateLimit-Limit', String(rateLimitStatus.limit));
    errorResponse.headers.set('X-RateLimit-Remaining', '0');
    errorResponse.headers.set('X-RateLimit-Reset', String(Math.ceil((Date.now() + rateLimitStatus.resetMs) / 1000)));
    return applySecurityHeaders(errorResponse, requestId);
  }

  // ── 2. Edge-Safe Session Check ───────────────────────────────────────────────
  // Inspect cookies to see if an active session could exist
  const allCookies = request.cookies.getAll();
  const hasAuthCookies = allCookies.some(
    (c) =>
      c.name.startsWith('sb-') ||
      c.name === 'fr8x_session' ||
      c.name === 'fr8x_godfather_session' ||
      c.name === '__Secure-FR8X-Godfather-Session'
  );

  // If public route and no cookies present, skip expensive Supabase Auth round-trip
  if (isPublicRoute(pathname) && !hasAuthCookies) {
    const res = NextResponse.next();
    if (rateLimitStatus) {
      res.headers.set('X-RateLimit-Limit', String(rateLimitStatus.limit));
      res.headers.set('X-RateLimit-Remaining', String(rateLimitStatus.remaining));
    }
    return applySecurityHeaders(res, requestId);
  }

  // Refresh Supabase auth session if cookies are present
  const { supabaseResponse, user } = await updateSession(request);

  const forward = () => {
    if (rateLimitStatus) {
      supabaseResponse.headers.set('X-RateLimit-Limit', String(rateLimitStatus.limit));
      supabaseResponse.headers.set('X-RateLimit-Remaining', String(rateLimitStatus.remaining));
    }
    applySecurityHeaders(supabaseResponse, requestId);
    return supabaseResponse;
  };

  // Allow public routes through
  if (isPublicRoute(pathname)) {
    return forward();
  }

  // Pass API routes through to their specific route handlers
  if (pathname.startsWith('/api/')) {
    return forward();
  }

  // ── 3. Godfather Operator Route Guard ────────────────────────────────────────
  if (isGodfatherRoute(pathname)) {
    const godfatherCookie =
      request.cookies.get('fr8x_godfather_session') ||
      request.cookies.get('__Secure-FR8X-Godfather-Session');

    if (!godfatherCookie?.value) {
      const gfLoginUrl = new URL('/godfatheron', request.url);
      gfLoginUrl.searchParams.set('reason', 'auth_required');
      gfLoginUrl.searchParams.set('next', encodeURIComponent(pathname));
      const res = NextResponse.redirect(gfLoginUrl);
      return applySecurityHeaders(res, requestId);
    }

    return forward();
  }

  // ── 4. Protected User Routes Guard ───────────────────────────────────────────
  if (isProtectedUserRoute(pathname)) {
    const sessionCookie = request.cookies.get('fr8x_session');

    if (!sessionCookie && !user) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('reason', 'auth_required');
      loginUrl.searchParams.set('next', encodeURIComponent(pathname));
      const res = NextResponse.redirect(loginUrl);
      return applySecurityHeaders(res, requestId);
    }

    // Check session expiration if cookie is present
    if (sessionCookie?.value && sessionCookie.value.includes('.')) {
      try {
        const payloadB64 = sessionCookie.value.split('.')[0];
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
          if (!user) {
            const loginUrl = new URL('/login', request.url);
            loginUrl.searchParams.set('reason', 'session_expired');
            const res = NextResponse.redirect(loginUrl);
            res.cookies.delete('fr8x_session');
            return applySecurityHeaders(res, requestId);
          }
        }
      } catch {}
    }

    return forward();
  }

  // Default passthrough
  return forward();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|icons/|images/).*)',
  ],
};
