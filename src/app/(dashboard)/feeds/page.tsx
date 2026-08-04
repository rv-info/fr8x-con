// FR8X-CON Feeds — Production v2 (LinkedIn/X-grade)
// ✅ Rendered markdown content (bold, italic, hashtags, mentions, URLs)
// ✅ Image/media gallery in posts
// ✅ Toggle-like (unlike) support
// ✅ Delete own post (soft-delete)
// ✅ Share post (copy link / native share)
// ✅ Real-time comment thread via CommentThread component
// ✅ View tracking (increment on mount, once per session)
// ✅ Author photoURL from Firebase Auth
// ✅ Character limit (3000) instead of word limit
// ✅ PostComposer with real uploads, character ring, post type, audience

"use client";

import {
  useState,
  useEffect,
  useMemo,
  useCallback,
  memo,
  useRef,
} from "react";
import { useAuth } from "@/providers/AuthProvider";
import { ROUTES, FEED_CATEGORIES, COLLECTIONS } from "@/lib/utils/constants";
import {
  queryDocuments,
  setDocument,
  updateDocument,
  softDeleteDocument,
  getDocRef,
  getDocument,
  where,
  orderBy,
  limit,
  serverTimestamp,
  increment,
} from "@/lib/firebase/firestore";
import { formatRelativeTime } from "@/lib/utils/format";
import { sanitizePostContent } from "@/lib/utils/sanitize";
import { validateContentModeration } from "@/lib/security/contentModeration";
import type { FeedFilterCategory } from "@/lib/types/feed";
import { AdBanner } from "@/components/ads/AdBanner";
import { PostComposer, type PostType, type AudienceType } from "@/components/feeds/RichPostEditor";
import { CommentThread } from "@/components/feeds/CommentThread";
import { JobPostsSection } from "@/components/jobs/JobPostsSection";
import { ContactsPanel } from "@/components/contacts/ContactsPanel";
import { calculateTrendingScore } from "@/lib/utils/feedRanking";
import { subscribeToQuery } from "@/lib/firebase/firestore";
import {
  renderPostContent,
  extractHashtags,
  extractMentions,
} from "@/lib/utils/postUtils";
import {
  ThumbsUp,
  ThumbsDown,
  Repeat2,
  Bookmark,
  MessageSquare,
  Loader2,
  Building2,
  CheckCircle2,
  Tag as TagIcon,
  EyeOff,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  Clock,
  Eye,
  BarChart3,
  MoreHorizontal,
  Trash2,
  Share2,
  Link2,
  X,
} from "lucide-react";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type PostData = {
  id: string;
  authorId: string;
  authorName: string;
  authorCompany: string;
  authorLocation: string;
  authorPhotoURL?: string | null;
  content: string;
  category: string;
  postType?: string;
  mediaUrls?: string[];
  hashtags?: string[];
  mentions?: string[];
  likesCount: number;
  dislikesCount: number;
  repostsCount: number;
  bookmarksCount: number;
  commentsCount?: number;
  viewsCount?: number;
  createdAt: { seconds: number; nanoseconds: number } | null;
  isDeleted?: boolean;
};

type ProfileData = {
  id: string;
  fullName: string;
  companyName: string;
  location: string;
  country: string;
  designation: string;
  industryTags: string[];
};

type FeedInteraction = {
  userId: string;
  postId: string;
  liked: boolean;
  disliked: boolean;
  reposted: boolean;
  saved: boolean;
  updatedAt: { seconds: number; nanoseconds: number } | null;
};

type FeedSortMode =
  | "newest"
  | "trending"
  | "most_viewed"
  | "most_commented"
  | "most_reposted";

// ─── Session view tracker ─────────────────────────────────────────────────────

const viewedPostIds = new Set<string>();

// ─── Layered Avatar ───────────────────────────────────────────────────────────

const LayeredAvatar = memo(function LayeredAvatar({
  personName,
  companyName,
  photoURL,
  size = "md",
}: {
  personName: string;
  companyName?: string;
  photoURL?: string | null;
  size?: "sm" | "md" | "lg";
}) {
  const pInitial = (personName || "U").charAt(0).toUpperCase();
  const cInitial = (companyName || "C").charAt(0).toUpperCase();

  const outerSizeClass =
    size === "lg" ? "w-14 h-14" : size === "md" ? "w-12 h-12" : "w-9 h-9";
  const personAvatarSize =
    size === "lg"
      ? "w-9 h-9 text-[13px]"
      : size === "md"
      ? "w-8 h-8 text-[11px]"
      : "w-6 h-6 text-[10px]";
  const companyBadgeSize =
    size === "lg"
      ? "w-6 h-6 text-[10px]"
      : size === "md"
      ? "w-5 h-5 text-[9px]"
      : "w-4 h-4 text-[8px]";

  if (photoURL) {
    return (
      <div
        className={`relative flex items-center justify-center ${outerSizeClass} shrink-0`}
      >
        <img
          src={photoURL}
          alt={personName}
          className="w-full h-full rounded-full object-cover border-2 border-white shadow-sm"
        />
        <div
          className={`absolute -bottom-1 -right-1 ${companyBadgeSize} rounded bg-slate-800 border border-white flex items-center justify-center font-bold text-white shadow-sm`}
        >
          <span className="text-[7px] uppercase">{cInitial}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex items-center justify-center ${outerSizeClass} shrink-0`}
    >
      <div className="absolute top-0 left-0 w-full h-full rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden">
        <span className="opacity-70 text-[11px] uppercase font-semibold tracking-tighter">
          {cInitial}
        </span>
      </div>
      <div
        className={`absolute -bottom-1 -right-1 ${personAvatarSize} rounded-full bg-[var(--fr8x-lavender)] border-2 border-white flex items-center justify-center font-bold text-[var(--fr8x-jet)] shadow-md`}
        title={`${personName} (${companyName || "Verified Company"})`}
      >
        {pInitial}
      </div>
    </div>
  );
});

// ─── Media Gallery ────────────────────────────────────────────────────────────

function MediaGallery({ urls }: { urls: string[] }) {
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null);
  if (!urls.length) return null;

  const gridClass =
    urls.length === 1
      ? "grid-cols-1"
      : urls.length === 2
      ? "grid-cols-2"
      : urls.length === 3
      ? "grid-cols-2"
      : "grid-cols-2";

  return (
    <>
      <div className={`grid gap-1.5 ${gridClass} mt-2`}>
        {urls.slice(0, 4).map((url, idx) => {
          const isVideo =
            url.includes(".mp4") || url.includes(".webm") || url.includes(".mov");
          const isLast = idx === 3 && urls.length > 4;

          return (
            <div
              key={idx}
              className={`relative rounded-xl overflow-hidden bg-slate-100 cursor-pointer group ${
                urls.length === 3 && idx === 0 ? "row-span-2" : ""
              } ${urls.length === 1 ? "max-h-80" : "aspect-square"}`}
              onClick={() => setLightboxIdx(idx)}
            >
              {isVideo ? (
                <video
                  src={url}
                  className="w-full h-full object-cover"
                  muted
                  preload="metadata"
                />
              ) : (
                <img
                  src={url}
                  alt={`Post media ${idx + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              )}
              {isLast && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">
                    +{urls.length - 4}
                  </span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Lightbox */}
      {lightboxIdx !== null && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setLightboxIdx(null)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-slate-300 z-10"
            onClick={() => setLightboxIdx(null)}
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={urls[lightboxIdx]}
            alt="Full view"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
          {urls.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
              {urls.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setLightboxIdx(i);
                  }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    i === lightboxIdx ? "bg-white" : "bg-white/40"
                  }`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

// ─── Post Type Badge ──────────────────────────────────────────────────────────

const POST_TYPE_STYLES: Record<string, string> = {
  rate:    "bg-emerald-50 text-emerald-700 border-emerald-200",
  market:  "bg-purple-50 text-purple-700 border-purple-200",
  rfq:     "bg-amber-50 text-amber-700 border-amber-200",
  insight: "bg-slate-100 text-slate-600 border-slate-200",
  update:  "bg-blue-50 text-blue-700 border-blue-200",
};

const POST_TYPE_LABELS: Record<string, string> = {
  rate:    "Rate Alert",
  market:  "Market Intel",
  rfq:     "RFQ",
  insight: "Insight",
  update:  "Update",
};

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  currentUserId,
  currentUserName,
  currentUserCompany,
  currentUserPhotoURL,
  onHide,
  onDelete,
  onHashtagClick,
  initialInteraction,
}: {
  post: PostData;
  currentUserId: string;
  currentUserName: string;
  currentUserCompany?: string;
  currentUserPhotoURL?: string | null;
  onHide: (id: string) => void;
  onDelete: (id: string) => void;
  onHashtagClick: (tag: string) => void;
  initialInteraction?: FeedInteraction | null;
}) {
  const timeAgo = post.createdAt
    ? formatRelativeTime(post.createdAt.seconds * 1000)
    : "Just now";

  const [isExpanded, setIsExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // View tracking (once per session per post)
  useEffect(() => {
    if (viewedPostIds.has(post.id)) return;
    viewedPostIds.add(post.id);
    // Fire-and-forget: increment view count
    updateDocument(COLLECTIONS.POSTS, post.id, {
      viewsCount: increment(1),
    }).catch(() => undefined);
  }, [post.id]);

  // Collapse detection
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollHeight > el.offsetHeight + 4) {
      setNeedsCollapse(true);
    }
  }, [post.content]);

  // ── Interaction state ─────────────────────────────────────────────────────

  const [likes, setLikes] = useState(post.likesCount || 0);
  const [dislikes, setDislikes] = useState(post.dislikesCount || 0);
  const [reposts, setReposts] = useState(post.repostsCount || 0);
  const [saved, setSaved] = useState(initialInteraction?.saved ?? false);
  const [userLiked, setUserLiked] = useState(
    initialInteraction?.liked ?? false
  );
  const [userDisliked, setUserDisliked] = useState(
    initialInteraction?.disliked ?? false
  );
  const [userReposted, setUserReposted] = useState(
    initialInteraction?.reposted ?? false
  );
  const [showComments, setShowComments] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [shareMsg, setShareMsg] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const interactionDocId = `${currentUserId}_${post.id}`;
  const isAuthor = currentUserId === post.authorId;

  // ── Persist interaction ───────────────────────────────────────────────────

  const persistInteraction = useCallback(
    async (update: Partial<FeedInteraction>) => {
      if (!currentUserId) return;
      try {
        await setDocument(
          COLLECTIONS.FEED_INTERACTIONS,
          interactionDocId,
          {
            userId: currentUserId,
            postId: post.id,
            updatedAt: serverTimestamp(),
            ...update,
          },
          true
        );
      } catch {
        // non-critical
      }
    },
    [currentUserId, interactionDocId, post.id]
  );

  // ── Like / Unlike ─────────────────────────────────────────────────────────

  const handleLike = async () => {
    if (!currentUserId) return;
    const toggling = userLiked; // true = we're unliking
    const prevLikes = likes;
    const prevDislikes = dislikes;
    const prevUserLiked = userLiked;
    const prevUserDisliked = userDisliked;

    if (toggling) {
      // Unlike
      setLikes((v) => v - 1);
      setUserLiked(false);
    } else {
      // Like
      setLikes((v) => v + 1);
      setUserLiked(true);
      if (userDisliked) {
        setDislikes((v) => v - 1);
        setUserDisliked(false);
      }
    }

    try {
      await persistInteraction({
        liked: !toggling,
        disliked: !toggling ? false : userDisliked,
      });
      await updateDocument(COLLECTIONS.POSTS, post.id, {
        likesCount: increment(toggling ? -1 : 1),
        ...((!toggling && userDisliked) ? { dislikesCount: increment(-1) } : {}),
      });
    } catch {
      // Revert on failure
      setLikes(prevLikes);
      setDislikes(prevDislikes);
      setUserLiked(prevUserLiked);
      setUserDisliked(prevUserDisliked);
    }
  };

  // ── Dislike / Un-dislike ──────────────────────────────────────────────────

  const handleDislike = async () => {
    if (!currentUserId) return;
    const toggling = userDisliked;
    const prevLikes = likes;
    const prevDislikes = dislikes;
    const prevUserLiked = userLiked;
    const prevUserDisliked = userDisliked;

    if (toggling) {
      setDislikes((v) => v - 1);
      setUserDisliked(false);
    } else {
      setDislikes((v) => v + 1);
      setUserDisliked(true);
      if (userLiked) {
        setLikes((v) => v - 1);
        setUserLiked(false);
      }
    }

    try {
      await persistInteraction({
        disliked: !toggling,
        liked: !toggling ? false : userLiked,
      });
      await updateDocument(COLLECTIONS.POSTS, post.id, {
        dislikesCount: increment(toggling ? -1 : 1),
        ...((!toggling && userLiked) ? { likesCount: increment(-1) } : {}),
      });
    } catch {
      setLikes(prevLikes);
      setDislikes(prevDislikes);
      setUserLiked(prevUserLiked);
      setUserDisliked(prevUserDisliked);
    }
  };

  // ── Repost ────────────────────────────────────────────────────────────────

  const handleRepost = async () => {
    if (!currentUserId || userReposted) return;
    setReposts((v) => v + 1);
    setUserReposted(true);
    try {
      await persistInteraction({ reposted: true });
      await updateDocument(COLLECTIONS.POSTS, post.id, {
        repostsCount: increment(1),
      });
    } catch {
      setReposts((v) => v - 1);
      setUserReposted(false);
    }
  };

  // ── Save / Unsave ─────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!currentUserId) return;
    const next = !saved;
    setSaved(next);
    try {
      await persistInteraction({ saved: next });
      await updateDocument(COLLECTIONS.POSTS, post.id, {
        bookmarksCount: increment(next ? 1 : -1),
      });
    } catch {
      setSaved(!next);
    }
  };

  // ── Share ─────────────────────────────────────────────────────────────────

  const handleShare = async () => {
    const url = `${window.location.origin}${ROUTES.FEEDS}?post=${post.id}`;
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Post by ${post.authorName}`,
          text: post.content.slice(0, 100),
          url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        setShareMsg("Link copied!");
        setTimeout(() => setShareMsg(null), 2000);
      }
    } catch {
      // User cancelled or clipboard denied
    }
  };

  // ── Delete (soft) ─────────────────────────────────────────────────────────

  const handleDelete = async () => {
    if (!isAuthor || isDeleting) return;
    setShowMenu(false);
    setIsDeleting(true);
    try {
      await softDeleteDocument(COLLECTIONS.POSTS, post.id, currentUserId);
      onDelete(post.id);
    } catch {
      setIsDeleting(false);
    }
  };

  // ── Post type badge ───────────────────────────────────────────────────────

  const ptStyle =
    post.postType && POST_TYPE_STYLES[post.postType]
      ? POST_TYPE_STYLES[post.postType]
      : POST_TYPE_STYLES["update"];
  const ptLabel =
    post.postType && POST_TYPE_LABELS[post.postType]
      ? POST_TYPE_LABELS[post.postType]
      : null;

  return (
    <article
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden transition-opacity ${
        isDeleting ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <div className="p-4 space-y-3">
        {/* ── Author Header ──────────────────────────────────────────────── */}
        <div className="flex items-start gap-3">
          <LayeredAvatar
            personName={post.authorName}
            companyName={post.authorCompany}
            photoURL={post.authorPhotoURL}
            size="md"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[12px] font-bold text-[var(--fr8x-jet)]">
                {post.authorName}
              </span>
              {post.authorCompany && (
                <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold border border-slate-200 flex items-center gap-1">
                  <Building2 className="h-2.5 w-2.5" />
                  {post.authorCompany}
                </span>
              )}
              {ptLabel && (
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold border ${ptStyle}`}
                >
                  {ptLabel}
                </span>
              )}
              {post.category && (
                <span className="text-[9px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded font-medium border border-blue-100 flex items-center gap-1">
                  <TagIcon className="h-2.5 w-2.5" />
                  {post.category}
                </span>
              )}
            </div>
            <p className="text-[10px] text-foreground-muted mt-0.5">
              {timeAgo}
              {post.authorLocation ? ` · ${post.authorLocation}` : ""}
              {post.viewsCount ? ` · ${post.viewsCount.toLocaleString()} views` : ""}
            </p>
          </div>

          {/* ── 3-dot menu ────────────────────────────────────────────── */}
          <div className="relative shrink-0 flex items-center gap-1">
            {shareMsg && (
              <span className="text-[9px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-1 rounded-lg flex items-center gap-1">
                <Link2 className="h-3 w-3" />
                {shareMsg}
              </span>
            )}
            <button
              onClick={() => setShowMenu((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
              title="More options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
            {showMenu && (
              <div className="absolute top-full right-0 mt-1 z-30 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden w-40">
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    onHide(post.id);
                  }}
                  className="w-full text-left px-3 py-2 text-[10px] text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <EyeOff className="h-3.5 w-3.5" />
                  Hide post
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowMenu(false);
                    handleShare();
                  }}
                  className="w-full text-left px-3 py-2 text-[10px] text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-colors"
                >
                  <Link2 className="h-3.5 w-3.5" />
                  Copy link
                </button>
                {isAuthor && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full text-left px-3 py-2 text-[10px] text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors border-t border-slate-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete post
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── Post Content (rendered) ───────────────────────────────────── */}
        <div>
          <div
            ref={contentRef}
            className={`text-[12px] text-[var(--fr8x-jet)] leading-relaxed ${
              !isExpanded && needsCollapse ? "line-clamp-4" : ""
            }`}
          >
            {renderPostContent(post.content, onHashtagClick)}
          </div>
          {needsCollapse && (
            <button
              onClick={() => setIsExpanded((v) => !v)}
              className="flex items-center gap-0.5 text-[10px] text-[var(--fr8x-periwinkle)] font-semibold mt-1.5 hover:underline"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" /> Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" /> Read more
                </>
              )}
            </button>
          )}
        </div>

        {/* ── Media Gallery ─────────────────────────────────────────────── */}
        {post.mediaUrls && post.mediaUrls.length > 0 && (
          <MediaGallery urls={post.mediaUrls} />
        )}

        {/* ── Interaction Bar ───────────────────────────────────────────── */}
        <div className="flex items-center gap-1 pt-2 border-t border-slate-100">
          {/* Like */}
          <button
            onClick={handleLike}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-95 ${
              userLiked
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-emerald-600"
            }`}
            title={userLiked ? "Unlike" : "Like"}
          >
            <ThumbsUp className="h-3.5 w-3.5" />
            <span>{likes > 0 ? likes : ""}</span>
          </button>

          {/* Dislike */}
          <button
            onClick={handleDislike}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-95 ${
              userDisliked
                ? "bg-red-50 text-red-500 border border-red-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-red-500"
            }`}
            title={userDisliked ? "Remove dislike" : "Dislike"}
          >
            <ThumbsDown className="h-3.5 w-3.5" />
            <span>{dislikes > 0 ? dislikes : ""}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments((v) => !v)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-95 ${
              showComments
                ? "bg-[var(--fr8x-mist)] text-[var(--fr8x-periwinkle)] border border-blue-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-[var(--fr8x-periwinkle)]"
            }`}
            title="Comment"
          >
            <MessageSquare className="h-3.5 w-3.5" />
            <span>{post.commentsCount || 0}</span>
          </button>

          {/* Repost */}
          <button
            onClick={handleRepost}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-95 ${
              userReposted
                ? "bg-[var(--fr8x-mist)] text-[var(--fr8x-periwinkle)] border border-blue-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-[var(--fr8x-periwinkle)]"
            }`}
            title={userReposted ? "Reposted" : "Repost"}
          >
            <Repeat2 className="h-3.5 w-3.5" />
            <span>{reposts > 0 ? reposts : ""}</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold text-slate-500 hover:bg-slate-100 hover:text-slate-700 transition-all active:scale-95"
            title="Share"
          >
            <Share2 className="h-3.5 w-3.5" />
          </button>

          {/* Save */}
          <button
            onClick={handleSave}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all active:scale-95 ml-auto ${
              saved
                ? "text-amber-500"
                : "text-slate-400 hover:text-amber-500 hover:bg-slate-100"
            }`}
            title={saved ? "Saved" : "Save post"}
          >
            <Bookmark
              className={`h-3.5 w-3.5 ${saved ? "fill-amber-500" : ""}`}
            />
          </button>
        </div>

        {/* ── Comment Thread ─────────────────────────────────────────────── */}
        {showComments && (
          <CommentThread
            postId={post.id}
            currentUserId={currentUserId}
            currentUserName={currentUserName}
            currentUserCompany={currentUserCompany}
            currentUserPhotoURL={currentUserPhotoURL}
            totalCount={post.commentsCount || 0}
          />
        )}
      </div>
    </article>
  );
}

// ─── Empty Feed ───────────────────────────────────────────────────────────────

const EmptyFeed = memo(function EmptyFeed() {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center shadow-sm">
      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
        <BarChart3 className="h-7 w-7 text-slate-300" />
      </div>
      <p className="text-[14px] font-bold text-[var(--fr8x-jet)] mb-1.5">
        No posts yet
      </p>
      <p className="text-[11px] text-foreground-muted max-w-xs mx-auto leading-relaxed">
        Be the first to share a rate update, market insight, or industry news
        with your freight network.
      </p>
    </div>
  );
});

// ─── Sort Tabs ────────────────────────────────────────────────────────────────

import type { ReactNode } from "react";

const SORT_TABS: { value: FeedSortMode; label: string; icon: ReactNode }[] = [
  { value: "newest",        label: "Latest",       icon: <Clock className="h-3 w-3" /> },
  { value: "trending",      label: "Trending",     icon: <TrendingUp className="h-3 w-3" /> },
  { value: "most_viewed",   label: "Most Viewed",  icon: <Eye className="h-3 w-3" /> },
  { value: "most_commented",label: "Discussed",    icon: <MessageSquare className="h-3 w-3" /> },
  { value: "most_reposted", label: "Most Shared",  icon: <Repeat2 className="h-3 w-3" /> },
];

// ─── Main Feeds Page ──────────────────────────────────────────────────────────

export default function FeedsPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] =
    useState<FeedFilterCategory>("all");
  const [sortMode, setSortMode] = useState<FeedSortMode>("newest");
  const [postContent, setPostContent] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [trendingTags, setTrendingTags] = useState<
    { name: string; related: string }[]
  >([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [followedTags, setFollowedTags] = useState<string[]>([]);
  const [postError, setPostError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(15);
  const [interactions, setInteractions] = useState<
    Record<string, FeedInteraction>
  >({});

  const displayName = user?.displayName || "User";

  function showToast(msg: string, isError = false) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), isError ? 4000 : 3000);
  }

  // ── Load hidden posts ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.uid) return;
    queryDocuments<{ postId: string }>(COLLECTIONS.FEED_HIDDEN, [
      where("userId", "==", user.uid),
      limit(500),
    ])
      .then((data) => setHiddenPostIds(new Set(data.map((d) => d.postId))))
      .catch(() => undefined);
  }, [user?.uid]);

  // ── Load interactions ──────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.uid) return;
    queryDocuments<FeedInteraction>(COLLECTIONS.FEED_INTERACTIONS, [
      where("userId", "==", user.uid),
      limit(500),
    ])
      .then((data) => {
        const map: Record<string, FeedInteraction> = {};
        data.forEach((i) => {
          map[i.postId] = i;
        });
        setInteractions(map);
      })
      .catch(() => undefined);
  }, [user?.uid]);

  // ── Trending tags ──────────────────────────────────────────────────────────

  useEffect(() => {
    queryDocuments<{ name: string; related: string }>("tags", [
      orderBy("name"),
      limit(10),
    ])
      .then((data) => {
        if (data.length > 0) setTrendingTags(data);
      })
      .catch(() => undefined);
  }, []);

  // ── Followed tags ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.uid) return;
    getDocument<{ followedTags?: string[] }>(
      COLLECTIONS.PROFILES,
      user.uid
    ).then((data) => {
      if (data?.followedTags) setFollowedTags(data.followedTags);
    });
  }, [user?.uid]);

  // ── Blocked users ──────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.uid) return;
    queryDocuments<{
      requesterId: string;
      recipientId: string;
      status: string;
    }>("contacts", [where("status", "==", "blocked"), limit(200)])
      .then((data) => {
        const blocked = new Set<string>();
        data.forEach((c) => {
          if (c.requesterId === user.uid) blocked.add(c.recipientId);
          if (c.recipientId === user.uid) blocked.add(c.requesterId);
        });
        setBlockedUserIds(blocked);
      })
      .catch(() => undefined);
  }, [user?.uid]);

  // ── Profile ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!user?.uid) return;
    getDocument<ProfileData>(COLLECTIONS.PROFILES, user.uid).then((data) => {
      if (data) setProfile(data);
    });
  }, [user?.uid]);

  // ── Real-time posts subscription ───────────────────────────────────────────

  useEffect(() => {
    setIsLoadingPosts(true);
    const unsubscribe = subscribeToQuery<PostData>(
      COLLECTIONS.POSTS,
      [where("isDeleted", "!=", true), limit(100)],
      (remotePosts) => {
        const valid = remotePosts.filter((p) => !p.isDeleted);
        setPosts(valid);
        setIsLoadingPosts(false);
      }
    );
    return () => unsubscribe();
  }, []);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleToggleFollowTag = async (tag: string) => {
    if (!user?.uid) return;
    try {
      const updated = followedTags.includes(tag)
        ? followedTags.filter((t) => t !== tag)
        : [...followedTags, tag];
      await setDocument(COLLECTIONS.PROFILES, user.uid, { followedTags: updated }, true);
      setFollowedTags(updated);
    } catch {
      /* non-critical */
    }
  };

  const handleHidePost = useCallback(
    async (postId: string) => {
      if (!user?.uid) return;
      setHiddenPostIds((prev) => new Set([...prev, postId]));
      try {
        const docId = `${user.uid}_${postId}`;
        await setDocument(COLLECTIONS.FEED_HIDDEN, docId, {
          userId: user.uid,
          postId,
          hiddenAt: serverTimestamp(),
        });
      } catch {
        /* non-critical */
      }
    },
    [user?.uid]
  );

  const handleDeletePost = useCallback((postId: string) => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    showToast("Post deleted.");
  }, []);

  const handleHashtagClick = useCallback((tag: string) => {
    // Filter the feed to this tag
    setActiveCategory("all");
    // Find matching category or just show all posts containing the hashtag
    // For now, set a search via filter on the posts memo
    setSelectedTag(tag);
  }, []);

  // ── Sorted & filtered posts ────────────────────────────────────────────────

  const filteredPosts = useMemo(() => {
    const filtered = posts.filter((p) => {
      if (hiddenPostIds.has(p.id)) return false;
      if (blockedUserIds.has(p.authorId)) return false;
      if (
        activeCategory !== "all" &&
        !(p.category || "").toLowerCase().includes(activeCategory.replace("_", " "))
      )
        return false;
      // Hashtag filter from clicking a hashtag chip
      if (
        selectedTag !== "all" &&
        !p.hashtags?.includes(`#${selectedTag.toLowerCase()}`) &&
        !p.content.toLowerCase().includes(`#${selectedTag.toLowerCase()}`)
      )
        return false;
      return true;
    });

    return [...filtered].sort((a, b) => {
      switch (sortMode) {
        case "newest": {
          const tA = a.createdAt?.seconds ?? 0;
          const tB = b.createdAt?.seconds ?? 0;
          return tB - tA;
        }
        case "trending":
          return calculateTrendingScore(b) - calculateTrendingScore(a);
        case "most_viewed":
          return (b.viewsCount || 0) - (a.viewsCount || 0);
        case "most_commented":
          return (b.commentsCount || 0) - (a.commentsCount || 0);
        case "most_reposted":
          return (b.repostsCount || 0) - (a.repostsCount || 0);
        default:
          return 0;
      }
    });
  }, [posts, hiddenPostIds, blockedUserIds, activeCategory, sortMode, selectedTag]);

  // ── Post handler ───────────────────────────────────────────────────────────

  const handlePost = useCallback(
    async (opts: {
      mediaUrls: string[];
      postType: PostType;
      audience: AudienceType;
    }) => {
      if (!postContent.trim()) {
        setPostError("Post content cannot be empty.");
        return;
      }
      if (!user) {
        setPostError("You must be logged in to create a post.");
        return;
      }
      if (postContent.length > 3000) {
        setPostError("Post exceeds the 3,000 character limit.");
        return;
      }

      const modResult = validateContentModeration(postContent);
      if (!modResult.isClean) {
        setPostError(
          modResult.flaggedReason || "Post blocked due to prohibited content."
        );
        return;
      }

      setIsPosting(true);
      setPostError(null);

      try {
        const sanitized = sanitizePostContent(postContent.trim());
        if (!sanitized) {
          setPostError("Post content contained invalid or unsafe markup.");
          setIsPosting(false);
          return;
        }

        const docRef = getDocRef(COLLECTIONS.POSTS);
        const activeAuthorName =
          profile?.fullName || user.displayName || "Logistics Professional";
        const activeCompany = profile?.companyName || "";
        const activeLocation = profile?.location
          ? `${profile.location}${profile.country ? `, ${profile.country}` : ""}`
          : "";

        const hashtags = extractHashtags(sanitized);
        const mentions = extractMentions(sanitized);

        await setDocument(COLLECTIONS.POSTS, docRef.id, {
          authorId: user.uid,
          authorName: activeAuthorName,
          authorCompany: activeCompany,
          authorLocation: activeLocation,
          authorPhotoURL: user.photoURL || null,
          content: sanitized,
          category:
            selectedTag !== "all" ? selectedTag : "General Logistics",
          postType: opts.postType,
          audience: opts.audience,
          mediaUrls: opts.mediaUrls,
          hashtags,
          mentions,
          characterCount: sanitized.length,
          likesCount: 0,
          dislikesCount: 0,
          repostsCount: 0,
          bookmarksCount: 0,
          commentsCount: 0,
          viewsCount: 0,
          isDeleted: false,
          createdAt: serverTimestamp(),
          createdBy: user.uid,
          updatedAt: serverTimestamp(),
        });

        setPostContent("");
        showToast("✅ Post published to your network.");
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "Failed to publish post.";
        console.error("Error creating post:", err);
        setPostError(msg + " Please try again.");
      } finally {
        setIsPosting(false);
      }
    },
    [postContent, user, profile, selectedTag]
  );

  // ─────────────────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-0">
      {/* ── Header & Toast ───────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[14px] font-bold text-[var(--fr8x-jet)] tracking-tight">
          Network Feed
        </h1>
        {toastMsg && (
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-200 flex items-center gap-1.5 shadow-sm">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {toastMsg}
          </span>
        )}
      </div>

      {/* ── 3-column layout ──────────────────────────────────────────────── */}
      <div className="flex gap-4 items-start">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside className="hidden lg:block w-[210px] shrink-0 space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm space-y-3">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <LayeredAvatar
                personName={displayName}
                companyName={profile?.companyName}
                photoURL={user?.photoURL}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-[var(--fr8x-jet)] truncate">
                  {displayName}
                </p>
                <p className="text-[10px] text-emerald-600 font-medium truncate flex items-center gap-0.5">
                  <Building2 className="h-2.5 w-2.5" />
                  {profile?.companyName || "Freight Network"}
                </p>
              </div>
            </div>
            {profile?.location && (
              <p className="text-[10px] text-foreground-secondary">
                {profile.location}
                {profile.country ? `, ${profile.country}` : ""}
              </p>
            )}
            {profile?.industryTags && profile.industryTags.length > 0 && (
              <p className="text-[9px] text-foreground-muted">
                {profile.industryTags.slice(0, 3).join(" · ")}
              </p>
            )}
          </div>

          <ContactsPanel compact maxDisplay={6} />


          {/* Trending Tags — with rich post context */}
          {trendingTags.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-sm">
              <h3 className="text-[11px] font-bold text-[var(--fr8x-jet)] mb-2 flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5 text-[var(--fr8x-periwinkle)]" />
                Industry Trending Topics
              </h3>
              <div className="space-y-2">
                {trendingTags.slice(0, 5).map((tag, idx) => (
                  <button
                    key={tag.name}
                    onClick={() => handleToggleFollowTag(tag.name)}
                    className={`block w-full text-left p-2 rounded-lg border transition-colors ${
                      followedTags.includes(tag.name)
                        ? "bg-[var(--fr8x-mist)] border-[var(--fr8x-periwinkle)]/30 text-[var(--fr8x-periwinkle)]"
                        : "hover:bg-slate-50 border-slate-100 text-foreground-secondary"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[11px] flex items-center gap-1">
                        <span className="text-[10px] text-slate-400 font-normal">#{idx + 1}</span>
                        {tag.name}
                      </span>
                      {followedTags.includes(tag.name) && (
                        <CheckCircle2 className="h-3 w-3 text-[var(--fr8x-periwinkle)]" />
                      )}
                    </div>
                    <p className="text-[10px] text-foreground-muted mt-0.5 line-clamp-2">
                      {tag.related}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ═══ CENTER FEED ═══ */}
        <main className="flex-1 min-w-0 space-y-3">
          {/* Post Composer */}
          <PostComposer
            content={postContent}
            onChange={(val) => {
              setPostContent(val);
              if (postError) setPostError(null);
            }}
            onSubmit={handlePost}
            isPosting={isPosting}
            errorMessage={postError}
            selectedCategory={selectedTag}
            onCategoryChange={setSelectedTag}
            categories={FEED_CATEGORIES}
            userId={user?.uid || "anonymous"}
          />

          {/* Sort Tabs */}
          <div className="flex items-center gap-1 bg-white border border-slate-200/80 p-1 rounded-xl shadow-sm overflow-x-auto no-scrollbar">
            {SORT_TABS.map((tab) => (
              <button
                key={tab.value}
                onClick={() => setSortMode(tab.value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  sortMode === tab.value
                    ? "bg-[var(--fr8x-periwinkle)] text-white shadow-sm"
                    : "text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 overflow-x-auto no-scrollbar">
            {FEED_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() =>
                  setActiveCategory(cat.value as FeedFilterCategory)
                }
                className={
                  activeCategory === cat.value
                    ? "fr8x-tab-active"
                    : "fr8x-tab-inactive"
                }
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Hashtag filter indicator */}
          {selectedTag !== "all" && (
            <div className="flex items-center gap-2 bg-[var(--fr8x-mist)] border border-blue-200 rounded-xl px-3 py-2">
              <span className="text-[10px] text-[var(--fr8x-periwinkle)] font-semibold">
                Filtered by #{selectedTag}
              </span>
              <button
                onClick={() => setSelectedTag("all")}
                className="ml-auto text-[var(--fr8x-periwinkle)] hover:text-blue-700"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Feed Posts */}
          {isLoadingPosts ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 flex items-center justify-center gap-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
              <span className="text-[11px] text-foreground-muted">
                Loading network feed…
              </span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyFeed />
          ) : (
            <div className="space-y-3">
              {filteredPosts.slice(0, visibleCount).map((post, idx) => (
                <div key={post.id} className="space-y-3">
                  <PostCard
                    post={post}
                    currentUserId={user?.uid || ""}
                    currentUserName={displayName}
                    currentUserCompany={profile?.companyName}
                    currentUserPhotoURL={user?.photoURL}
                    onHide={handleHidePost}
                    onDelete={handleDeletePost}
                    onHashtagClick={handleHashtagClick}
                    initialInteraction={interactions[post.id] ?? null}
                  />
                  {(idx + 1) % 4 === 0 && (
                    <AdBanner adIndex={Math.floor(idx / 4)} />
                  )}
                </div>
              ))}

              {filteredPosts.length > visibleCount && (
                <div className="text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 15)}
                    className="w-full py-3 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[11px] rounded-xl shadow-sm transition-colors"
                  >
                    Load More Updates ({filteredPosts.length - visibleCount}{" "}
                    remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <aside className="hidden xl:block w-[220px] shrink-0 space-y-3">
          <JobPostsSection />
        </aside>
      </div>
    </div>
  );
}
