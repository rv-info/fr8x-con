// FR8X-CON Middleware
// Route protection, role-based redirects, security headers

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// Public routes that don't require authentication
const publicRoutes = ["/login", "/register", "/forgot-password"];

// Admin-only routes
const adminRoutes = ["/godmode"];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Add security headers
  const response = NextResponse.next();

  // CSRF protection: Verify origin for state-changing requests
  if (["POST", "PUT", "DELETE", "PATCH"].includes(request.method)) {
    const origin = request.headers.get("origin");
    const host = request.headers.get("host");
    if (origin && host && !origin.includes(host)) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  // Rate limiting header (for upstream rate limiter like Vercel Edge)
  response.headers.set("X-RateLimit-Policy", "fr8x-con-default");

  // Additional security headers
  response.headers.set("X-Request-Id", crypto.randomUUID());

  // Note: Firebase Auth token verification happens client-side via AuthProvider
  // Server-side route protection is handled by the (auth) and (dashboard) layouts
  // which check auth state and redirect accordingly.

  // For API routes, add CORS headers
  if (pathname.startsWith("/api/")) {
    response.headers.set("Access-Control-Allow-Origin", process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000");
    response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
    response.headers.set("Access-Control-Max-Age", "86400");

    if (request.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: response.headers });
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (logo, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.svg).*)",
  ],
};
