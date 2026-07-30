// FR8X-CON Post Creation API — Server-Side Only
// Handles post creation with server-side content sanitization,
// rate limiting (max 10 posts/hour per user), and Firestore persistence.

import { NextResponse, type NextRequest } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { FieldValue } from "firebase-admin/firestore";

// Rate limiting: in-memory map per user ID
const postRateLimitStore = new Map<string, { count: number; resetAt: number }>();
const POST_RATE_LIMIT_MAX = 10;
const POST_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Dangerous patterns to block
const BLOCKED_PATTERNS = [
  /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
  /<iframe[\s\S]*?>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,               // inline event handlers e.g. onclick=
  /data:text\/html/gi,
  /vbscript:/gi,
  /expression\s*\(/gi,         // CSS expression injection
  /&#x?[0-9a-f]+;/gi,          // HTML entities that could encode dangerous chars
];

// Allowed HTML tags for rich text content
const ALLOWED_TAGS = new Set([
  "b", "i", "em", "strong", "u", "s", "strike",
  "p", "br", "ul", "ol", "li", "blockquote",
  "h1", "h2", "h3", "h4",
  "a", // only href, target allowed
  "pre", "code",
]);

/**
 * Server-side HTML sanitizer.
 * Strips all disallowed tags and dangerous attributes.
 * Does NOT rely on DOMPurify (which is browser-only).
 */
function sanitizeHtml(raw: string): string {
  // First: block dangerous patterns outright
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(raw)) {
      throw new Error("Content contains disallowed patterns");
    }
  }

  // Strip HTML tags not in the allowed list, and strip dangerous attributes
  // Using regex-based approach for server-side (no DOM available)
  return raw
    // Remove all tags not in allowlist
    .replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, (match, tag: string) => {
      const lowerTag = tag.toLowerCase();
      if (!ALLOWED_TAGS.has(lowerTag)) return "";
      // For <a> tags, only allow href and target attributes
      if (lowerTag === "a") {
        const hrefMatch = match.match(/href=["']([^"'<>]+)["']/i);
        const targetMatch = match.match(/target=["']([^"'<>]+)["']/i);
        const href = hrefMatch ? ` href="${hrefMatch[1]}"` : "";
        // Force all links to open in new tab with noopener for safety
        return `<a${href} target="_blank" rel="noopener noreferrer">`;
      }
      // For other allowed tags, strip all attributes
      return `<${tag.toLowerCase()}>`;
    })
    // Trim excessive whitespace
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Check per-user post rate limit.
 * Returns true if the user is within limits, false if rate-limited.
 */
function checkPostRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = postRateLimitStore.get(userId);

  if (!entry || now > entry.resetAt) {
    postRateLimitStore.set(userId, { count: 1, resetAt: now + POST_RATE_LIMIT_WINDOW_MS });
    return true;
  }
  if (entry.count >= POST_RATE_LIMIT_MAX) {
    return false;
  }
  entry.count += 1;
  postRateLimitStore.set(userId, entry);
  return true;
}

export async function POST(request: NextRequest) {
  // 1. Verify Firebase ID token
  const authHeader = request.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = authHeader.slice(7);

  let uid: string;
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    uid = decoded.uid;
  } catch {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  // 2. Rate limit check
  if (!checkPostRateLimit(uid)) {
    return NextResponse.json(
      { error: "Rate limit exceeded. Maximum 10 posts per hour." },
      { status: 429 }
    );
  }

  // 3. Parse request body
  let body: {
    content?: string;
    category?: string;
    tags?: string[];
    attachmentURL?: string;
    attachmentType?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { content, category, tags = [], attachmentURL, attachmentType } = body;

  if (!content || typeof content !== "string") {
    return NextResponse.json({ error: "Post content is required" }, { status: 400 });
  }

  if (content.length > 5000) {
    return NextResponse.json(
      { error: "Post content exceeds maximum length of 5000 characters" },
      { status: 400 }
    );
  }

  // 4. Sanitize content server-side
  let sanitizedContent: string;
  try {
    sanitizedContent = sanitizeHtml(content);
  } catch {
    return NextResponse.json(
      { error: "Content contains disallowed patterns or HTML." },
      { status: 400 }
    );
  }

  if (sanitizedContent.trim().length === 0) {
    return NextResponse.json({ error: "Post content cannot be empty" }, { status: 400 });
  }

  // 5. Validate tags
  const sanitizedTags = (Array.isArray(tags) ? tags : [])
    .map((t: unknown) => String(t).slice(0, 50))
    .filter((t) => /^[a-zA-Z0-9\s\-_]+$/.test(t))
    .slice(0, 10); // max 10 tags

  // 6. Validate category
  const VALID_CATEGORIES = [
    "all", "nvocc", "freight_forwarding", "project_cargo", "fcl", "lcl",
    "air", "ocean", "road", "customs", "warehousing", "cold_chain",
    "multimodal", "rig_to_destination",
  ];
  const safeCategory = VALID_CATEGORIES.includes(category ?? "") ? category : "all";

  // 7. Validate attachment URL (must be Firebase Storage URL or empty)
  const safeAttachmentURL =
    attachmentURL &&
    typeof attachmentURL === "string" &&
    (attachmentURL.startsWith("https://firebasestorage.googleapis.com/") ||
      attachmentURL.startsWith("https://storage.googleapis.com/"))
      ? attachmentURL
      : undefined;

  // 8. Fetch user profile for author data
  let authorProfile: {
    fullName?: string;
    companyName?: string;
    designation?: string;
    photoURL?: string | null;
    publicId?: string;
  } = {};
  try {
    const profileSnap = await adminDb.collection("profiles").doc(uid).get();
    if (profileSnap.exists) {
      authorProfile = profileSnap.data() as typeof authorProfile;
    }
  } catch {
    // Non-fatal: proceed with empty profile
  }

  // 9. Create post document in Firestore
  const postId = `post_${uid}_${Date.now()}`;
  const post = {
    id: postId,
    content: sanitizedContent,
    rawContentLength: content.length,
    category: safeCategory,
    tags: sanitizedTags,
    authorId: uid,
    authorName: authorProfile.fullName ?? "Logistics Network Member",
    authorCompany: authorProfile.companyName ?? "",
    authorDesignation: authorProfile.designation ?? "",
    authorPhotoURL: authorProfile.photoURL ?? null,
    authorPublicId: authorProfile.publicId ?? null,
    attachmentURL: safeAttachmentURL ?? null,
    attachmentType: safeAttachmentURL ? (attachmentType ?? "file") : null,
    likesCount: 0,
    commentsCount: 0,
    repostsCount: 0,
    bookmarksCount: 0,
    status: "active",
    isReported: false,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  try {
    await adminDb.collection("posts").doc(postId).set(post);
  } catch {
    return NextResponse.json(
      { error: "Failed to create post. Please try again." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: true, postId, sanitizedContent },
    { status: 201 }
  );
}
