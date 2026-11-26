/**
 * Safely validates and normalizes an application `next` redirect parameter.
 * Prevents open-redirect vulnerabilities by allowing only internal relative paths.
 */
export function sanitizeNextRedirect(rawNext: string | null | undefined, fallback = '/feeds'): string {
  if (!rawNext || typeof rawNext !== 'string') return fallback;

  let candidate = rawNext.trim();
  if (!candidate) return fallback;

  // Decode up to 2 times to safely handle encoded query parameters like %2Freports%3Fperiod%3Dmonthly
  for (let i = 0; i < 2; i++) {
    try {
      const decoded = decodeURIComponent(candidate);
      if (decoded === candidate) break;
      candidate = decoded.trim();
    } catch {
      return fallback;
    }
  }

  // Must start with a single forward slash and NOT protocol-relative (//) or backslash (/\)
  if (!candidate.startsWith('/') || candidate.startsWith('//') || candidate.startsWith('/\\')) {
    return fallback;
  }

  // Reject control characters, whitespace/newlines, backslashes, or scheme-like prefixes
  if (/[\x00-\x1F\x7F\\]/.test(candidate)) {
    return fallback;
  }

  // Verify via URL parser against a dummy origin to guarantee same-origin relative path
  try {
    const parsed = new URL(candidate, 'https://fr8x.local');
    if (parsed.origin !== 'https://fr8x.local') {
      return fallback;
    }
    const normalized = `${parsed.pathname}${parsed.search}${parsed.hash}`;
    if (normalized === '/login' || normalized.startsWith('/login?')) {
      return fallback;
    }
    return normalized || fallback;
  } catch {
    return fallback;
  }
}
