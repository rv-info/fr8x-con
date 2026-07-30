// FR8X-CON Content Sanitization Utilities
// Server-safe: no DOM dependency. Used before any user-generated content
// is written to Firestore or rendered in the UI.

/**
 * Strips dangerous HTML, script injection vectors, javascript: hrefs,
 * data: URIs, and on* event handlers from user-supplied content strings.
 * Safe to call both client-side and in API routes (no DOM required).
 */
export function sanitizePostContent(input: string): string {
  if (!input || typeof input !== "string") return "";

  let s = input;

  // Remove script tags and content
  s = s.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "");

  // Remove iframe, object, embed, form, input elements
  s = s.replace(/<(iframe|object|embed|form|input|button|link|meta|base)[^>]*>/gi, "");

  // Strip on* event handler attributes (onclick, onload, onerror, etc.)
  s = s.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, "");
  s = s.replace(/\s+on\w+\s*=\s*[^\s>]*/gi, "");

  // Remove javascript: and vbscript: protocol hrefs
  s = s.replace(/href\s*=\s*["']?\s*javascript:[^"'\s>]*/gi, 'href="#"');
  s = s.replace(/href\s*=\s*["']?\s*vbscript:[^"'\s>]*/gi, 'href="#"');

  // Remove data: URIs (common XSS vector in src/href attributes)
  s = s.replace(/src\s*=\s*["']?\s*data:[^"'\s>]*/gi, 'src=""');
  s = s.replace(/href\s*=\s*["']?\s*data:[^"'\s>]*/gi, 'href="#"');

  // Remove HTML comments (can hide malicious payloads)
  s = s.replace(/<!--[\s\S]*?-->/g, "");

  return s.trim();
}

/**
 * Validates and sanitizes a URL for use in ad destination links.
 * Accepts: internal paths (starting with /) and safe external https:// URLs.
 * Rejects: javascript:, data:, http:// (non-TLS), and any other schemes.
 */
export function sanitizeUrl(url: string): string {
  if (!url || typeof url !== "string") return "/";
  const trimmed = url.trim();

  // Allow internal paths
  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed.replace(/[<>"'`]/g, "");
  }

  // Allow https:// external URLs only
  if (/^https:\/\//i.test(trimmed)) {
    try {
      const parsed = new URL(trimmed);
      // Block localhost/private IPs (SSRF prevention)
      const hostname = parsed.hostname.toLowerCase();
      const isPrivate =
        hostname === "localhost" ||
        hostname === "127.0.0.1" ||
        hostname.startsWith("192.168.") ||
        hostname.startsWith("10.") ||
        hostname.startsWith("172.16.") ||
        hostname.endsWith(".local") ||
        hostname === "metadata.google.internal";
      if (isPrivate) return "/";
      return parsed.toString();
    } catch {
      return "/";
    }
  }

  return "/";
}

/**
 * Sanitizes a plain-text field value: strips HTML tags and trims.
 * Use for name, designation, company, and other text-only fields.
 */
export function sanitizeTextField(input: string, maxLength = 500): string {
  if (!input || typeof input !== "string") return "";
  const stripped = input.replace(/<[^>]+>/g, "").trim();
  return stripped.slice(0, maxLength);
}
