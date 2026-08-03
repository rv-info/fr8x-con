// FR8X-CON Feeds Page — Production
// Feed-only. No job posting. 3-line collapse. Like/Dislike/Comment/Repost/Hide.
// Content sanitized before write. Blocked contacts filtered. Posts ranked by engagement.

"use client";

import { useState, useEffect, useMemo, useCallback, memo, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { ROUTES, FEED_CATEGORIES, COLLECTIONS } from "@/lib/utils/constants";
import {
  queryDocuments,
  setDocument,
  updateDocument,
  getDocRef,
  getDocument,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { formatRelativeTime } from "@/lib/utils/format";
import { sanitizePostContent } from "@/lib/utils/sanitize";
import type { FeedFilterCategory } from "@/lib/types/feed";
import { AdBanner } from "@/components/ads/AdBanner";
import { RichPostEditor } from "@/components/feeds/RichPostEditor";
import {
  ThumbsUp,
  ThumbsDown,
  Repeat2,
  Bookmark,
  MessageSquare,
  Loader2,
  Plus,
  Building2,
  CheckCircle2,
  Tag as TagIcon,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Send,
} from "lucide-react";
import { validateContentModeration } from "@/lib/security/contentModeration";
import { JobPostsSection } from "@/components/jobs/JobPostsSection";
import { ContactsPanel } from "@/components/contacts/ContactsPanel";

// ─── Types ───
type PostData = {
  id: string;
  authorId: string;
  authorName: string;
  authorCompany: string;
  authorLocation: string;
  content: string;
  category: string;
  likesCount: number;
  dislikesCount: number;
  repostsCount: number;
  bookmarksCount: number;
  commentsCount?: number;
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

// ─── Layered Avatar ───
const LayeredAvatar = memo(function LayeredAvatar({
  personName,
  companyName,
  size = "md",
}: {
  personName: string;
  companyName?: string;
  size?: "sm" | "md" | "lg";
}) {
  const pInitial = (personName || "U").charAt(0).toUpperCase();
  const cInitial = (companyName || "C").charAt(0).toUpperCase();
  const outerSizeClass = size === "lg" ? "w-12 h-12" : size === "md" ? "w-10 h-10" : "w-8 h-8";
  const personAvatarSize = size === "lg" ? "w-8 h-8 text-[12px]" : size === "md" ? "w-7 h-7 text-[10px]" : "w-5 h-5 text-[9px]";
  const companyBadgeSize = size === "lg" ? "w-5 h-5 text-[9px]" : size === "md" ? "w-4 h-4 text-[8px]" : "w-3.5 h-3.5 text-[7px]";
  void companyBadgeSize;

  return (
    <div className={`relative flex items-center justify-center ${outerSizeClass} shrink-0`}>
      <div className="absolute top-0 left-0 w-full h-full rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden">
        <span className="opacity-80 text-[10px] uppercase font-semibold tracking-tighter">{cInitial}</span>
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

// ─── Post Card ───
function PostCard({
  post,
  currentUserId,
  onHide,
}: {
  post: PostData;
  currentUserId: string;
  onHide: (id: string) => void;
}) {
  const timeAgo = post.createdAt
    ? formatRelativeTime(post.createdAt.seconds * 1000)
    : "Just now";

  // 3-line collapse state
  const [isExpanded, setIsExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    // Check if content exceeds 3 lines (line-height ~20px, 3 lines ~60px)
    if (el.scrollHeight > el.offsetHeight + 2) {
      setNeedsCollapse(true);
    }
  }, [post.content]);

  // Interaction state
  const [likes, setLikes] = useState(post.likesCount || 0);
  const [dislikes, setDislikes] = useState(post.dislikesCount || 0);
  const [reposts, setReposts] = useState(post.repostsCount || 0);
  const [userLiked, setUserLiked] = useState(false);
  const [userDisliked, setUserDisliked] = useState(false);
  const [userReposted, setUserReposted] = useState(false);
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  const interactionKey = `fr8x_interact_${post.id}_${currentUserId}`;
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem(interactionKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setUserLiked(!!parsed.liked);
        setUserDisliked(!!parsed.disliked);
        setUserReposted(!!parsed.reposted);
      }
    } catch { /* ignore */ }
  }, [interactionKey]);

  function saveInteraction(liked: boolean, disliked: boolean, reposted: boolean) {
    try {
      sessionStorage.setItem(interactionKey, JSON.stringify({ liked, disliked, reposted }));
    } catch { /* ignore */ }
  }

  const handleLike = async () => {
    if (userLiked) return;
    const newLikes = likes + 1;
    const newDislikes = userDisliked ? dislikes - 1 : dislikes;
    setLikes(newLikes);
    if (userDisliked) setDislikes(newDislikes);
    setUserLiked(true);
    setUserDisliked(false);
    saveInteraction(true, false, userReposted);
    try {
      await updateDocument(COLLECTIONS.POSTS, post.id, {
        likesCount: newLikes,
        ...(userDisliked ? { dislikesCount: newDislikes } : {}),
      });
    } catch { /* non-critical */ }
  };

  const handleDislike = async () => {
    if (userDisliked) return;
    const newDislikes = dislikes + 1;
    const newLikes = userLiked ? likes - 1 : likes;
    setDislikes(newDislikes);
    if (userLiked) setLikes(newLikes);
    setUserDisliked(true);
    setUserLiked(false);
    saveInteraction(false, true, userReposted);
    try {
      await updateDocument(COLLECTIONS.POSTS, post.id, {
        dislikesCount: newDislikes,
        ...(userLiked ? { likesCount: newLikes } : {}),
      });
    } catch { /* non-critical */ }
  };

  const handleRepost = async () => {
    if (userReposted) return;
    const newReposts = reposts + 1;
    setReposts(newReposts);
    setUserReposted(true);
    saveInteraction(userLiked, userDisliked, true);
    try {
      await updateDocument(COLLECTIONS.POSTS, post.id, { repostsCount: newReposts });
    } catch { /* non-critical */ }
  };

  const handlePostComment = async () => {
    if (!commentText.trim() || isPostingComment) return;
    setIsPostingComment(true);
    const sanitized = sanitizePostContent(commentText.trim());
    if (!sanitized) { setIsPostingComment(false); return; }
    try {
      const ref = getDocRef(COLLECTIONS.COMMENTS);
      await setDocument(COLLECTIONS.COMMENTS, ref.id, {
        postId: post.id,
        authorId: currentUserId,
        content: sanitized,
        createdAt: serverTimestamp(),
        isDeleted: false,
      });
      await updateDocument(COLLECTIONS.POSTS, post.id, {
        commentsCount: (post.commentsCount || 0) + 1,
      });
      setCommentText("");
      setShowComment(false);
    } catch { /* non-critical */ } finally {
      setIsPostingComment(false);
    }
  };

  return (
    <article className="fr8x-card p-3 bg-white">
      {/* Author header */}
      <div className="flex items-start gap-2.5 mb-2">
        <LayeredAvatar personName={post.authorName} companyName={post.authorCompany} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-[var(--fr8x-jet)]">{post.authorName}</span>
            <span className="text-[9px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium border border-slate-200 flex items-center gap-0.5">
              <Building2 className="h-2.5 w-2.5 text-slate-500" />
              {post.authorCompany || "Freight Network Member"}
            </span>
          </div>
          <p className="text-[10px] text-foreground-muted">
            {timeAgo}
            {post.category ? ` • ${post.category}` : ""}
            {post.authorLocation ? ` • ${post.authorLocation}` : ""}
          </p>
        </div>
        {/* Hide button */}
        <button
          onClick={() => onHide(post.id)}
          title="Hide this post"
          className="text-foreground-muted hover:text-foreground transition-colors p-0.5 shrink-0"
        >
          <EyeOff className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content — 3-line collapse */}
      <div className="mb-2">
        <p
          ref={contentRef}
          className={`text-[11px] text-[var(--fr8x-jet)] leading-relaxed whitespace-pre-line ${
            !isExpanded && needsCollapse ? "line-clamp-3" : ""
          }`}
        >
          {post.content}
        </p>
        {needsCollapse && (
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="flex items-center gap-0.5 text-[10px] text-[var(--fr8x-periwinkle)] font-semibold mt-0.5 hover:underline"
          >
            {isExpanded ? (
              <><ChevronUp className="h-3 w-3" /> Show less</>
            ) : (
              <><ChevronDown className="h-3 w-3" /> Read more</>
            )}
          </button>
        )}
      </div>

      {/* Interaction bar */}
      <div className="flex items-center gap-3 text-[10px] text-foreground-secondary pt-1.5 border-t border-border">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1 transition-colors ${userLiked ? "text-emerald-600 font-bold" : "hover:text-emerald-600"}`}
          title="Like"
        >
          <ThumbsUp className="h-3 w-3" /> {likes}
        </button>
        <button
          onClick={handleDislike}
          className={`flex items-center gap-1 transition-colors ${userDisliked ? "text-red-500 font-bold" : "hover:text-red-500"}`}
          title="Dislike"
        >
          <ThumbsDown className="h-3 w-3" /> {dislikes}
        </button>
        <button
          onClick={() => setShowComment((v) => !v)}
          className="flex items-center gap-1 hover:text-[var(--fr8x-jet)] transition-colors"
          title="Comment"
        >
          <MessageSquare className="h-3 w-3" /> Comment
        </button>
        <button
          onClick={handleRepost}
          className={`flex items-center gap-1 transition-colors ${userReposted ? "text-[var(--fr8x-periwinkle)] font-bold" : "hover:text-[var(--fr8x-jet)]"}`}
          title="Repost"
        >
          <Repeat2 className="h-3 w-3" /> {reposts}
        </button>
        <button
          className="flex items-center gap-1 hover:text-amber-500 transition-colors ml-auto"
          title="Save post"
        >
          <Bookmark className="h-3 w-3" />
        </button>
      </div>

      {/* Inline comment input */}
      {showComment && (
        <div className="mt-2 flex items-start gap-1.5">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            rows={2}
            className="fr8x-input flex-1 text-[10px] resize-none"
            maxLength={500}
          />
          <button
            onClick={handlePostComment}
            disabled={isPostingComment || !commentText.trim()}
            className="px-2 py-1 bg-[var(--fr8x-periwinkle)] text-white rounded text-[10px] font-bold hover:bg-[#3ABFF0] disabled:opacity-40 flex items-center gap-1 mt-0.5"
          >
            {isPostingComment ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
          </button>
        </div>
      )}
    </article>
  );
}

const EmptyFeed = memo(function EmptyFeed() {
  return (
    <div className="fr8x-card p-6 text-center bg-white">
      <p className="text-[11px] text-foreground-secondary mb-1">No posts yet</p>
      <p className="text-[10px] text-foreground-muted">Be the first to share an update with your network.</p>
    </div>
  );
});

// Trending tag defaults (fallback if Firestore tags collection is empty)
const DEFAULT_TRENDING_TAGS = [
  { name: "Ocean Freight", related: "Global Trade Lanes" },
  { name: "Air Freight", related: "Express Logistics" },
  { name: "FCL", related: "Container Shipping" },
  { name: "LCL", related: "Consolidation" },
  { name: "NVOCC", related: "Freight Forwarding" },
];

import { calculateTrendingScore } from "@/lib/utils/feedRanking";
import { subscribeToQuery } from "@/lib/firebase/firestore";

type FeedSortMode = "newest" | "trending" | "most_viewed" | "most_commented" | "most_reposted";

// ─── Main Feeds Component ───
export default function FeedsPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<FeedFilterCategory>("all");
  const [sortMode, setSortMode] = useState<FeedSortMode>("newest");
  const [postContent, setPostContent] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [hiddenPostIds, setHiddenPostIds] = useState<Set<string>>(new Set());
  const [blockedUserIds, setBlockedUserIds] = useState<Set<string>>(new Set());
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [trendingTags, setTrendingTags] = useState(DEFAULT_TRENDING_TAGS);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [followedTags, setFollowedTags] = useState<string[]>([]);
  const [postError, setPostError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(15);

  const displayName = user?.displayName || "User";

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  // Restore hidden posts from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("fr8x_hidden_posts");
      if (saved) setHiddenPostIds(new Set(JSON.parse(saved)));
    } catch { /* ignore */ }
  }, []);

  // Fetch trending tags from Firestore
  useEffect(() => {
    queryDocuments<{ name: string; related: string }>("tags", [orderBy("name"), limit(10)])
      .then((data) => { if (data.length > 0) setTrendingTags(data); })
      .catch(() => undefined);
  }, []);

  // Fetch followed tags from profile
  useEffect(() => {
    if (!user?.uid) return;
    getDocument<{ followedTags?: string[] }>(COLLECTIONS.PROFILES, user.uid).then((data) => {
      if (data?.followedTags) setFollowedTags(data.followedTags);
    });
  }, [user?.uid]);

  // Fetch blocked user IDs from contacts
  useEffect(() => {
    if (!user?.uid) return;
    queryDocuments<{ requesterId: string; recipientId: string; status: string }>(
      "contacts",
      [where("status", "==", "blocked"), limit(200)]
    ).then((data) => {
      const blocked = new Set<string>();
      data.forEach((c) => {
        if (c.requesterId === user.uid) blocked.add(c.recipientId);
        if (c.recipientId === user.uid) blocked.add(c.requesterId);
      });
      setBlockedUserIds(blocked);
    }).catch(() => undefined);
  }, [user?.uid]);

  // Fetch user profile
  useEffect(() => {
    if (!user?.uid) return;
    getDocument<ProfileData>(COLLECTIONS.PROFILES, user.uid).then((data) => {
      if (data) setProfile(data);
    });
  }, [user?.uid]);

  // Initial seed fallback posts
  const INITIAL_SEED_POSTS: PostData[] = useMemo(() => [
    {
      id: "seed_post_101",
      authorId: "user_mgt_raivega_2026",
      authorName: "Management (Rai Vega)",
      authorCompany: "Rai Vega Logistics Pvt Ltd",
      authorLocation: "JNPT / Nhava Sheva, India",
      content: "Spot Rate Special: 20x40FT High Cube containers available for immediate loading JNPT to Hamburg & Rotterdam. Guaranteed space and equipment release.",
      category: "Spot Rates",
      likesCount: 14,
      dislikesCount: 0,
      repostsCount: 5,
      bookmarksCount: 8,
      commentsCount: 3,
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 3600, nanoseconds: 0 },
      isDeleted: false,
    },
    {
      id: "seed_post_102",
      authorId: "godmode_admin_dev_uid",
      authorName: "GodMode Administrator",
      authorCompany: "FR8X System Operations",
      authorLocation: "Mumbai, Maharashtra",
      content: "Welcome to the FR8X-CON Enterprise Logistics Exchange Network. Connect with verified freight forwarders, shippers, and transporters across Indian port hubs.",
      category: "Market Updates",
      likesCount: 28,
      dislikesCount: 0,
      repostsCount: 12,
      bookmarksCount: 15,
      commentsCount: 6,
      createdAt: { seconds: Math.floor(Date.now() / 1000) - 7200, nanoseconds: 0 },
      isDeleted: false,
    },
  ], []);

  // Real-time Firestore subscription to posts collection
  useEffect(() => {
    setIsLoadingPosts(true);
    const unsubscribe = subscribeToQuery<PostData>(
      COLLECTIONS.POSTS,
      [limit(100)],
      (remotePosts) => {
        const valid = remotePosts.filter((p) => !p.isDeleted);
        if (valid.length > 0) {
          setPosts(valid);
        } else {
          setPosts(INITIAL_SEED_POSTS);
        }
        setIsLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, [INITIAL_SEED_POSTS]);

  const handleToggleFollowTag = async (tag: string) => {
    if (!user?.uid) return;
    try {
      const updated = followedTags.includes(tag)
        ? followedTags.filter((t) => t !== tag)
        : [...followedTags, tag];
      await setDocument(COLLECTIONS.PROFILES, user.uid, { followedTags: updated }, true);
      setFollowedTags(updated);
    } catch { /* non-critical */ }
  };

  const handleHidePost = useCallback((postId: string) => {
    setHiddenPostIds((prev) => {
      const next = new Set(prev);
      next.add(postId);
      try { sessionStorage.setItem("fr8x_hidden_posts", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  }, []);

  // Ranked & sorted posts according to sortMode
  const filteredPosts = useMemo(() => {
    const filtered = posts.filter(
      (p) =>
        !hiddenPostIds.has(p.id) &&
        !blockedUserIds.has(p.authorId) &&
        (activeCategory === "all" ||
          (p.category || "").toLowerCase().includes(activeCategory.replace("_", " ")))
    );

    return [...filtered].sort((a, b) => {
      if (sortMode === "newest") {
        const tA = a.createdAt ? (typeof a.createdAt === "object" ? a.createdAt.seconds : new Date(a.createdAt).getTime() / 1000) : 0;
        const tB = b.createdAt ? (typeof b.createdAt === "object" ? b.createdAt.seconds : new Date(b.createdAt).getTime() / 1000) : 0;
        return tB - tA;
      }
      if (sortMode === "trending") {
        return calculateTrendingScore(b) - calculateTrendingScore(a);
      }
      if (sortMode === "most_viewed") {
        return ((b as any).viewsCount || 0) - ((a as any).viewsCount || 0);
      }
      if (sortMode === "most_commented") {
        return (b.commentsCount || 0) - (a.commentsCount || 0);
      }
      if (sortMode === "most_reposted") {
        return (b.repostsCount || 0) - (a.repostsCount || 0);
      }
      return 0;
    });
  }, [posts, hiddenPostIds, blockedUserIds, activeCategory, sortMode]);

  const wordCount = useMemo(
    () => postContent.trim().split(/\s+/).filter(Boolean).length,
    [postContent]
  );

  const handlePost = useCallback(async () => {
    if (!postContent.trim()) {
      setPostError("Post content cannot be empty.");
      return;
    }
    if (!user) {
      setPostError("You must be logged in to create a post.");
      return;
    }
    if (wordCount > 1000) {
      setPostError("Post content exceeds 1000 words limit.");
      return;
    }

    // Content moderation safety check
    const modResult = validateContentModeration(postContent);
    if (!modResult.isClean) {
      setPostError(modResult.flaggedReason || "Post blocked due to prohibited or unsafe content.");
      return;
    }

    setIsPosting(true);
    setPostError(null);
    try {
      const sanitized = sanitizePostContent(postContent.trim());
      if (!sanitized) {
        setPostError("Post content contained invalid HTML or scripts.");
        setIsPosting(false);
        return;
      }
      const docRef = getDocRef(COLLECTIONS.POSTS);
      const activeAuthorName = profile?.fullName || user.displayName || "User";
      const activeCompany = profile?.companyName || "Rai Vega Logistics";
      const activeLocation = profile?.location ? `${profile.location}, ${profile.country || ""}` : "Mumbai, India";

      const newPostPayload = {
        authorId: user.uid,
        authorName: activeAuthorName,
        authorCompany: activeCompany,
        authorLocation: activeLocation,
        content: sanitized,
        category: selectedTag === "all" ? "General Logistics" : selectedTag,
        likesCount: 0,
        dislikesCount: 0,
        repostsCount: 0,
        bookmarksCount: 0,
        commentsCount: 0,
        isDeleted: false,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      };

      // 1. Write to Firestore
      await setDocument(COLLECTIONS.POSTS, docRef.id, newPostPayload);

      // 2. Immediate, non-blocking optimistic local update
      const localPost: PostData = {
        id: docRef.id,
        authorId: user.uid,
        authorName: activeAuthorName,
        authorCompany: activeCompany,
        authorLocation: activeLocation,
        content: sanitized,
        category: selectedTag === "all" ? "General Logistics" : selectedTag,
        likesCount: 0,
        dislikesCount: 0,
        repostsCount: 0,
        bookmarksCount: 0,
        commentsCount: 0,
        createdAt: { seconds: Math.floor(Date.now() / 1000), nanoseconds: 0 },
        isDeleted: false,
      };

      setPosts((prev) => {
        const updated = [localPost, ...prev];
        try { sessionStorage.setItem("fr8x_cached_feed_posts", JSON.stringify(updated)); } catch { /* ignore */ }
        return updated;
      });

      setPostContent("");
      showToast("Post published to network feed.");
    } catch (err: any) {
      console.error("Error creating post:", err);
      setPostError(err?.message || "Failed to publish post. Please check connection and try again.");
    } finally {
      setIsPosting(false);
    }
  }, [postContent, user, profile, selectedTag, wordCount]);

  return (
    <div className="min-h-0">
      {/* Header & Toast */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[11px] font-semibold text-[var(--fr8x-jet)]">Feeds</h1>
        {toastMsg && (
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {toastMsg}
          </span>
        )}
      </div>

      {/* 3-column layout */}
      <div className="flex gap-3 items-start">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside className="hidden lg:block w-[200px] shrink-0 space-y-2">
          <div className="fr8x-card p-3 bg-white space-y-2">
            <div className="flex items-center gap-2.5 border-b border-border pb-2">
              <LayeredAvatar personName={displayName} companyName={profile?.companyName} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[var(--fr8x-jet)] truncate">{displayName}</p>
                <p className="text-[10px] text-emerald-600 font-medium truncate flex items-center gap-0.5">
                  <Building2 className="h-2.5 w-2.5" />
                  {profile?.companyName || "Logistics Network"}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-foreground-secondary">
              {profile?.location ? `${profile.location}, ${profile.country || ""}` : "Verified Member"}
            </p>
            {profile?.industryTags && profile.industryTags.length > 0 && (
              <p className="text-[9px] text-foreground-muted">
                {profile.industryTags.slice(0, 3).join(", ")}
              </p>
            )}
          </div>

          <ContactsPanel compact maxDisplay={6} />
        </aside>

        {/* ═══ CENTER FEED ═══ */}
        <main className="flex-1 min-w-0 space-y-2">
          {/* Enhanced Professional Rich Text Post Composer */}
          <RichPostEditor
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
          />

          {/* 5 Primary Feed Sorting Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 overflow-x-auto no-scrollbar">
            <button
              onClick={() => setSortMode("newest")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors whitespace-nowrap ${
                sortMode === "newest" ? "bg-white text-slate-900 shadow-2xs border border-slate-300" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🔥 Newest Feed
            </button>
            <button
              onClick={() => setSortMode("trending")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors whitespace-nowrap ${
                sortMode === "trending" ? "bg-white text-slate-900 shadow-2xs border border-slate-300" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              📈 Trending Feed
            </button>
            <button
              onClick={() => setSortMode("most_viewed")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors whitespace-nowrap ${
                sortMode === "most_viewed" ? "bg-white text-slate-900 shadow-2xs border border-slate-300" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              👁️ Most Viewed
            </button>
            <button
              onClick={() => setSortMode("most_commented")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors whitespace-nowrap ${
                sortMode === "most_commented" ? "bg-white text-slate-900 shadow-2xs border border-slate-300" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              💬 Most Commented
            </button>
            <button
              onClick={() => setSortMode("most_reposted")}
              className={`px-2.5 py-1 text-[10px] font-bold rounded transition-colors whitespace-nowrap ${
                sortMode === "most_reposted" ? "bg-white text-slate-900 shadow-2xs border border-slate-300" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              🔁 Most Reposted
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 overflow-x-auto no-scrollbar">
            {FEED_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value as FeedFilterCategory)}
                className={activeCategory === cat.value ? "fr8x-tab-active" : "fr8x-tab-inactive"}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Feed Posts */}
          {isLoadingPosts ? (
            <div className="fr8x-card p-6 flex items-center justify-center gap-2 bg-white">
              <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
              <span className="text-[11px] text-foreground-muted">Loading posts...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyFeed />
          ) : (
            <div className="space-y-2">
              {filteredPosts.slice(0, visibleCount).map((post, idx) => (
                <div key={post.id} className="space-y-2">
                  <PostCard
                    post={post}
                    currentUserId={user?.uid || ""}
                    onHide={handleHidePost}
                  />
                  {(idx + 1) % 4 === 0 && <AdBanner adIndex={Math.floor(idx / 4)} />}
                </div>
              ))}

              {filteredPosts.length > visibleCount && (
                <div className="pt-2 text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 15)}
                    className="w-full py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-800 font-bold text-xs rounded-xl shadow-2xs transition-colors"
                  >
                    Load More Network Updates ({filteredPosts.length - visibleCount} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </main>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <aside className="hidden xl:block w-[220px] shrink-0 space-y-2">
          {/* Industry Job Posts Section */}
          <JobPostsSection />

          {/* Trending Tags */}
          <div className="fr8x-card p-2.5 bg-white text-left">
            <p className="text-[11px] font-semibold text-[var(--fr8x-jet)] mb-1.5 flex items-center gap-1">
              <TagIcon className="h-3.5 w-3.5 text-amber-500" />
              <span>Trending Topics</span>
            </p>
            <ul className="space-y-2">
              {trendingTags.map((t) => {
                const isFollowing = followedTags.includes(t.name);
                return (
                  <li key={t.name} className="text-[10px] text-foreground-secondary border-b border-slate-50 pb-1.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between">
                      <span
                        onClick={() => setPostContent((prev) => `#${t.name} ` + prev)}
                        className="font-semibold text-[var(--fr8x-jet)] hover:underline cursor-pointer"
                        title="Append tag to post"
                      >
                        #{t.name}
                      </span>
                      <button
                        onClick={() => handleToggleFollowTag(t.name)}
                        className={`text-[8px] px-1.5 rounded font-semibold transition-all ${
                          isFollowing
                            ? "bg-slate-200 text-slate-700"
                            : "bg-[var(--fr8x-mist)] text-[var(--fr8x-periwinkle)] border border-[var(--fr8x-dimgrey)]"
                        }`}
                      >
                        {isFollowing ? "Following" : "+ Follow"}
                      </button>
                    </div>
                    <div className="text-[8px] text-foreground-muted mt-0.5">Related: {t.related}</div>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Ads */}
          <AdBanner adIndex={0} />
          <AdBanner adIndex={1} />
        </aside>
      </div>
    </div>
  );
}
