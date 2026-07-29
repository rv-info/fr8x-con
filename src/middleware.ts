// FR8X-CON Middleware — Production Security
// Rate limiting, CSRF protection, security headers, GodMode domain routing.

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// In-memory rate limiting: IP -> { count, resetAt }
const rateLimitStore = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX || "60", 10);
const API_RATE_LIMIT_MAX = 30; // stricter for API routes

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
    return false; // not limited
  }
  if (entry.count >= max) return true; // limited
  entry.count++;
  return false;
}

// Clean up stale rate limit entries periodically (every 100 requests)
let cleanupCounter = 0;
function maybeCleanup() {
  if (++cleanupCounter % 100 !== 0) return;
  const now = Date.now();
  for (const [key, val] of rateLimitStore) {
    if (now > val.resetAt) rateLimitStore.delete(key);
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const host = request.headers.get("host") || "";
  const ip = getClientIP(request);

  maybeCleanup();

  // ── Handle GodMode domain routing ──
  if (host === "god.fr8x.in" && pathname === "/") {
    return NextResponse.rewrite(new URL("/godmode", request.url));
  }

  // ── API rate limiting (stricter) ──
  if (pathname.startsWith("/api/")) {
    if (checkRateLimit(`api_${ip}`, API_RATE_LIMIT_MAX)) {
      return new NextResponse(
        JSON.stringify({ error: "Rate limit exceeded. Please slow down." }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }
  } else {
    // ── General page rate limiting ──
    if (checkRateLimit(ip, RATE_LIMIT_MAX)) {
      return new NextResponse("Too Many Requests", {
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
          return new NextResponse("Forbidden: Cross-origin request blocked.", {
            status: 403,
          });
        }
      } catch {
        return new NextResponse("Forbidden: Invalid origin.", { status: 403 });
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

  // ── Security headers ──
  response.headers.set("X-Request-Id", crypto.randomUUID());
  response.headers.set("X-RateLimit-Limit", String(RATE_LIMIT_MAX));

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
      "no-store, no-cache, must-revalidate"
    );
    response.headers.set("Pragma", "no-cache");
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico
     * - public assets (logo, images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.svg|.*\\.png$|.*\\.jpg$|.*\\.svg$|.*\\.webp$).*)",
  ],
};
