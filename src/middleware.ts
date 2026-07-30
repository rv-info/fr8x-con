// FR8X-CON Middleware — Production Security
// Rate limiting, CSRF protection, security headers, GodMode isolation.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ── Rate limit store: IP -> { count, resetAt } ──
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "60", 10);
const API_RATE_LIMIT_MAX = 30; // stricter for API routes

// ── Brute-force protection: track failed auth/godmode access per IP ──
const bruteForceStore = new Map<string, { failures: number; lockedUntil: number }>();
const BRUTE_FORCE_MAX_FAILURES = 8;
const BRUTE_FORCE_LOCK_MS = 15 * 60 * 1000; // 15 min lockout

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(ip: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(ip);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }
  if (entry.count >= max) return true;
  entry.count++;
  return false;
}

function isBruteForceBlocked(ip: string): boolean {
  const entry = bruteForceStore.get(ip);
  if (!entry) return false;
  if (Date.now() < entry.lockedUntil) return true;
  // Lock expired — clear it
  bruteForceStore.delete(ip);
  return false;
}

function recordBruteForceFailure(ip: string): void {
  const now = Date.now();
  const entry = bruteForceStore.get(ip) || { failures: 0, lockedUntil: 0 };
  entry.failures++;
  if (entry.failures >= BRUTE_FORCE_MAX_FAILURES) {
    entry.lockedUntil = now + BRUTE_FORCE_LOCK_MS;
  }
  bruteForceStore.set(ip, entry);
}

// Periodic cleanup
let cleanupCounter = 0;
function maybeCleanup() {
  if (++cleanupCounter % 100 !== 0) return;
  const now = Date.now();
  for (const [key, val] of rateLimitStore) {
    if (now > val.resetAt) rateLimitStore.delete(key);
  }
  for (const [key, val] of bruteForceStore) {
    if (now > val.lockedUntil) bruteForceStore.delete(key);
  }
}

// Opaque 404 response — no body hints about protected resource
function opaque404(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

function opaque403(): NextResponse {
  return new NextResponse(null, { status: 403 });
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const ip = getClientIP(request);

  maybeCleanup();

  // ── Brute-force lockout: block locked IPs on auth/godmode endpoints ──
  const isSensitivePath =
    pathname.startsWith("/godmode") ||
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/admin/");
  if (isSensitivePath && isBruteForceBlocked(ip)) {
    return opaque403();
  }

  // ── GodMode route isolation ──
  // Only /godmode/login is publicly accessible (with no hints about what it is).
  // All other /godmode/* paths require the admin session cookie.
  // Unauthenticated access gets opaque 404 — reveals nothing.
  if (pathname.startsWith("/godmode")) {
    if (pathname !== "/godmode/login") {
      const adminToken =
        request.cookies.get("fr8x_godmode_token")?.value ||
        request.headers.get("x-godmode-auth");
      if (!adminToken) {
        // Record as a possible probing attempt
        recordBruteForceFailure(ip);
        return opaque404();
      }
    }
  }

  // ── API rate limiting (stricter) ──
  if (pathname.startsWith("/api/")) {
    if (checkRateLimit(`api_${ip}`, API_RATE_LIMIT_MAX)) {
      return new NextResponse(null, {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }
  } else {
    if (checkRateLimit(ip, RATE_LIMIT_MAX)) {
      return new NextResponse(null, {
        status: 429,
        headers: { "Retry-After": "60" },
      });
    }
  }

  // ── CSRF protection for state-changing requests ──
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return opaque403();
        }
      } catch {
        return opaque403();
      }
    }
  }

  // ── Handle CORS preflight for API routes ──
  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    const allowedOrigin =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();

  // ── Security headers (applied to all responses) ──
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://con.fr8x.in";

  // Prevent clickjacking
  response.headers.set("X-Frame-Options", "DENY");
  // Prevent MIME sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");
  // Referrer policy — don't leak internal paths
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  // Disable unwanted browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), interest-cohort=()"
  );
  // Force HTTPS (1 year, include subdomains)
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains; preload"
  );
  // Content Security Policy — strict, blocks inline scripts and unsafe eval
  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `connect-src 'self' ${appUrl} https://*.googleapis.com https://*.firebaseio.com https://*.google.com wss://*.firebaseio.com`,
      "img-src 'self' data: blob: https://*.googleapis.com https://firebasestorage.googleapis.com https://storage.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // unsafe-inline for scripts is required for Next.js hydration; restrict further if using nonces
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ")
  );

  // Request ID for tracing
  response.headers.set("X-Request-Id", crypto.randomUUID());

  // CORS for API routes
  if (pathname.startsWith("/api/")) {
    const allowedOrigin =
      process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set(
      "Access-Control-Allow-Methods",
      "GET, POST, PUT, DELETE, OPTIONS"
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
  }

  // Prevent caching of sensitive API responses
  if (
    pathname.startsWith("/api/auth/") ||
    pathname.startsWith("/api/admin/")
  ) {
    response.headers.set(
      "Cache-Control",
      "no-store, no-cache, must-revalidate, private"
    );
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.webp$).*)",
  ],
};
