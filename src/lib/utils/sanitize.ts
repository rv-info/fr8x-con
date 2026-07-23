// FR8X-CON Utility: Input Sanitization
// Protects against XSS, injection, and malicious input

/**
 * Sanitize a string by escaping HTML entities.
 * Prevents XSS attacks in rendered output.
 */
export function escapeHtml(str: string): string {
  const map: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
    "/": "&#x2F;",
    "`": "&#x60;",
  };
  return str.replace(/[&<>"'`/]/g, (char) => map[char] || char);
}

/**
 * Strip HTML tags from a string.
 */
export function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, "");
}

/**
 * Sanitize user input: trim, strip HTML, limit length.
 */
export function sanitizeInput(input: string, maxLength: number = 10000): string {
  if (!input || typeof input !== "string") return "";
  return stripHtml(input.trim()).slice(0, maxLength);
}

/**
 * Sanitize a search query: remove special regex characters.
 */
export function sanitizeSearchQuery(query: string): string {
  return query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").trim();
}

/**
 * Validate and sanitize an email address.
 */
export function sanitizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Remove null bytes and control characters from input.
 */
export function removeControlChars(str: string): string {
  // eslint-disable-next-line no-control-regex
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

/**
 * Sanitize an object's string values recursively.
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  maxStringLength: number = 10000
): T {
  const sanitized = { ...obj };
  for (const key in sanitized) {
    const value = sanitized[key];
    if (typeof value === "string") {
      (sanitized as Record<string, unknown>)[key] = sanitizeInput(
        value,
        maxStringLength
      );
    } else if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      (sanitized as Record<string, unknown>)[key] = sanitizeObject(
        value as Record<string, unknown>,
        maxStringLength
      );
    }
  }
  return sanitized;
}
