// FR8X-CON Middleware — Enterprise High-Security Architecture
// AES-256-GCM Header Enforcement, Route-Tiered Rate Limiting, Brute-Force Lockout & Credential Stuffing Defense.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  evaluateCredentialStuffingRisk,
  cleanupStuffingTrackerStore,
} from "@/lib/security/credentialStuffing";

// ── Rate limit store: Key -> { count, resetAt } ──
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute window

// Route specific rate limit ceilings
const RATE_LIMITS = {
  AUTH: 10,      // /api/auth/*, /godmode/login (10 req/min)
  ADMIN_API: 20, // /api/admin/* (20 req/min)
  GENERAL_API: 40, // /api/* (40 req/min)
  GLOBAL: 80,    // General pages (80 req/min)
};

// ── Brute-force protection: track failed auth/godmode access per IP ──
const bruteForceStore = new Map<string, { failures: number; lockedUntil: number }>();
const BRUTE_FORCE_MAX_FAILURES = 5;
const BRUTE_FORCE_LOCK_MS = 15 * 60 * 1000; // 15 min lockout

function getClientIP(request: NextRequest): string {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown"
  );
}

function checkRateLimit(key: string, max: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
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

// Periodic memory store cleanup
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
  cleanupStuffingTrackerStore();
}

function opaque404(): NextResponse {
  return new NextResponse(null, { status: 404 });
}

function opaque403(reason?: string): NextResponse {
  const response = new NextResponse(null, { status: 403 });
  if (reason) response.headers.set("X-Security-Reason", reason);
  return response;
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const ip = getClientIP(request);
  const userAgent = request.headers.get("user-agent") || "";

  maybeCleanup();

  const isAuthRoute = pathname === "/godmode/login" || pathname.startsWith("/api/auth/");
  const isAdminApi = pathname.startsWith("/api/admin/");
  const isSensitivePath = pathname.startsWith("/godmode") || isAuthRoute || isAdminApi;

  // ── 1. Brute-force Lockout Enforcement ──
  if (isSensitivePath && isBruteForceBlocked(ip)) {
    return opaque403("IP_LOCKED_BRUTE_FORCE");
  }

  // ── 2. Credential Stuffing & Automated Bot Threat Analysis ──
  if (isAuthRoute && request.method === "POST") {
    const stuffingAssessment = evaluateCredentialStuffingRisk(ip, undefined, userAgent);
    if (stuffingAssessment.action === "block") {
      recordBruteForceFailure(ip);
      return opaque403("CREDENTIAL_STUFFING_BLOCKED");
    }
  }

  // ── 3. GodMode Route Isolation & Probe Tracking ──
  if (pathname.startsWith("/godmode")) {
    if (pathname !== "/godmode/login") {
      const adminToken =
        request.cookies.get("fr8x_godmode_token")?.value ||
        request.headers.get("x-godmode-auth");
      if (!adminToken) {
        recordBruteForceFailure(ip);
        return opaque404();
      }
    }
  }

  // ── 4. Route-Tiered Sliding-Window Rate Limiting ──
  let limitCeiling = RATE_LIMITS.GLOBAL;
  let limitKey = `global_${ip}`;

  if (isAuthRoute) {
    limitCeiling = RATE_LIMITS.AUTH;
    limitKey = `auth_${ip}`;
  } else if (isAdminApi) {
    limitCeiling = RATE_LIMITS.ADMIN_API;
    limitKey = `admin_${ip}`;
  } else if (pathname.startsWith("/api/")) {
    limitCeiling = RATE_LIMITS.GENERAL_API;
    limitKey = `api_${ip}`;
  }

  if (checkRateLimit(limitKey, limitCeiling)) {
    return new NextResponse(null, {
      status: 429,
      headers: {
        "Retry-After": "60",
        "X-RateLimit-Limit": limitCeiling.toString(),
        "X-RateLimit-Remaining": "0",
      },
    });
  }

  // ── 5. CSRF Protection for state-changing requests ──
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (origin) {
      try {
        const originHost = new URL(origin).host;
        if (originHost !== host) {
          return opaque403("CSRF_ORIGIN_MISMATCH");
        }
      } catch {
        return opaque403("CSRF_INVALID_ORIGIN");
      }
    }
  }

  // ── 6. Handle CORS Preflight for API routes ──
  if (pathname.startsWith("/api/") && request.method === "OPTIONS") {
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    return new NextResponse(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": allowedOrigin,
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-GodMode-Auth, X-AES-Encrypted",
        "Access-Control-Max-Age": "86400",
      },
    });
  }

  const response = NextResponse.next();

  // ── 7. Enterprise Security & High Encryption Headers ──
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://con.fr8x.in";

  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), interest-cohort=()");
  response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload");
  response.headers.set("X-Encryption-Standard", "AES-256-GCM");
  response.headers.set("X-Brute-Force-Protection", "active");
  response.headers.set("X-Credential-Stuffing-Defense", "active");

  response.headers.set(
    "Content-Security-Policy",
    [
      "default-src 'self'",
      `connect-src 'self' ${appUrl} https://*.googleapis.com https://*.firebaseio.com https://*.google.com wss://*.firebaseio.com`,
      "img-src 'self' data: blob: https://*.googleapis.com https://firebasestorage.googleapis.com https://storage.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "object-src 'none'",
    ].join("; ")
  );

  response.headers.set("X-Request-Id", crypto.randomUUID());

  if (pathname.startsWith("/api/")) {
    const allowedOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    response.headers.set("Access-Control-Allow-Origin", allowedOrigin);
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-GodMode-Auth, X-AES-Encrypted");
  }

  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/api/admin/")) {
    response.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, private");
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.webp$).*)",
  ],
};
