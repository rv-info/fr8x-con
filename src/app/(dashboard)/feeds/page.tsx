// FR8X-CON Feeds — Production
// All DB-backed. No seed posts. Interactions persist in Firestore feedInteractions collection.
// Hidden posts persist per user in feedHidden collection.
// Premium enterprise-grade feed with professional sort tabs.

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
  Building2,
  CheckCircle2,
  Tag as TagIcon,
  EyeOff,
  ChevronDown,
  ChevronUp,
  Send,
  TrendingUp,
  Clock,
  Eye,
  BarChart3,
} from "lucide-react";
import { validateContentModeration } from "@/lib/security/contentModeration";
import { JobPostsSection } from "@/components/jobs/JobPostsSection";
import { ContactsPanel } from "@/components/contacts/ContactsPanel";
import { calculateTrendingScore } from "@/lib/utils/feedRanking";
import { subscribeToQuery } from "@/lib/firebase/firestore";

// ─── Types ────────────────────────────────────────────────────────────────────

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

type FeedSortMode = "newest" | "trending" | "most_viewed" | "most_commented" | "most_reposted";

// ─── Layered Avatar ───────────────────────────────────────────────────────────

const LayeredAvatar = memo(function LayeredAvatar({
  personName,
  companyName,
  photoURL,
  size = "md",
}: {
  personName: string;
  companyName?: string;
  photoURL?: string;
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
    size === "lg" ? "w-6 h-6 text-[10px]" : size === "md" ? "w-5 h-5 text-[9px]" : "w-4 h-4 text-[8px]";

  if (photoURL) {
    return (
      <div className={`relative flex items-center justify-center ${outerSizeClass} shrink-0`}>
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
    <div className={`relative flex items-center justify-center ${outerSizeClass} shrink-0`}>
      <div className="absolute top-0 left-0 w-full h-full rounded-xl bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden">
        <span className="opacity-70 text-[11px] uppercase font-semibold tracking-tighter">{cInitial}</span>
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

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({
  post,
  currentUserId,
  onHide,
  initialInteraction,
}: {
  post: PostData;
  currentUserId: string;
  onHide: (id: string) => void;
  initialInteraction?: FeedInteraction | null;
}) {
  const timeAgo = post.createdAt
    ? formatRelativeTime(post.createdAt.seconds * 1000)
    : "Just now";

  const [isExpanded, setIsExpanded] = useState(false);
  const [needsCollapse, setNeedsCollapse] = useState(false);
  const contentRef = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    if (el.scrollHeight > el.offsetHeight + 2) {
      setNeedsCollapse(true);
    }
  }, [post.content]);

  const [likes, setLikes] = useState(post.likesCount || 0);
  const [dislikes, setDislikes] = useState(post.dislikesCount || 0);
  const [reposts, setReposts] = useState(post.repostsCount || 0);
  const [saved, setSaved] = useState(initialInteraction?.saved ?? false);
  const [userLiked, setUserLiked] = useState(initialInteraction?.liked ?? false);
  const [userDisliked, setUserDisliked] = useState(initialInteraction?.disliked ?? false);
  const [userReposted, setUserReposted] = useState(initialInteraction?.reposted ?? false);
  const [showComment, setShowComment] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [isPostingComment, setIsPostingComment] = useState(false);

  const interactionDocId = `${currentUserId}_${post.id}`;

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
        // Non-critical
      }
    },
    [currentUserId, interactionDocId, post.id]
  );

  const handleLike = async () => {
    if (userLiked) return;
    const newLikes = likes + 1;
    const newDislikes = userDisliked ? dislikes - 1 : dislikes;
    setLikes(newLikes);
    if (userDisliked) setDislikes(newDislikes);
    setUserLiked(true);
    setUserDisliked(false);
    await persistInteraction({ liked: true, disliked: false });
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
    await persistInteraction({ disliked: true, liked: false });
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
    await persistInteraction({ reposted: true });
    try {
      await updateDocument(COLLECTIONS.POSTS, post.id, { repostsCount: newReposts });
    } catch { /* non-critical */ }
  };

  const handleSave = async () => {
    const next = !saved;
    setSaved(next);
    await persistInteraction({ saved: next });
    try {
      await updateDocument(COLLECTIONS.POSTS, post.id, {
        bookmarksCount: next ? (post.bookmarksCount || 0) + 1 : Math.max(0, (post.bookmarksCount || 0) - 1),
      });
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
        createdBy: currentUserId,
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
    <article className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-3">
      {/* Author header */}
      <div className="flex items-start gap-3">
        <LayeredAvatar
          personName={post.authorName}
          companyName={post.authorCompany}
          size="md"
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[12px] font-bold text-[var(--fr8x-jet)]">{post.authorName}</span>
            <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-semibold border border-slate-200 flex items-center gap-1">
              <Building2 className="h-2.5 w-2.5" />
              {post.authorCompany || "Freight Network Member"}
            </span>
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
          </p>
        </div>
        <button
          onClick={() => onHide(post.id)}
          title="Hide this post"
          className="text-foreground-muted hover:text-slate-600 transition-colors p-1 rounded hover:bg-slate-100 shrink-0"
        >
          <EyeOff className="h-3.5 w-3.5" />
        </button>
      </div>

      {/* Content */}
      <div>
        <p
          ref={contentRef}
          className={`text-[12px] text-[var(--fr8x-jet)] leading-relaxed whitespace-pre-line ${
            !isExpanded && needsCollapse ? "line-clamp-3" : ""
          }`}
        >
          {post.content}
        </p>
        {needsCollapse && (
          <button
            onClick={() => setIsExpanded((v) => !v)}
            className="flex items-center gap-0.5 text-[10px] text-[var(--fr8x-periwinkle)] font-semibold mt-1 hover:underline"
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
      <div className="flex items-center gap-4 text-[10px] text-foreground-secondary pt-2 border-t border-slate-100">
        <button
          onClick={handleLike}
          className={`flex items-center gap-1.5 transition-colors ${userLiked ? "text-emerald-600 font-bold" : "hover:text-emerald-600"}`}
          title="Like"
        >
          <ThumbsUp className="h-3.5 w-3.5" /> <span>{likes}</span>
        </button>
        <button
          onClick={handleDislike}
          className={`flex items-center gap-1.5 transition-colors ${userDisliked ? "text-red-500 font-bold" : "hover:text-red-500"}`}
          title="Dislike"
        >
          <ThumbsDown className="h-3.5 w-3.5" /> <span>{dislikes}</span>
        </button>
        <button
          onClick={() => setShowComment((v) => !v)}
          className="flex items-center gap-1.5 hover:text-[var(--fr8x-periwinkle)] transition-colors"
          title="Comment"
        >
          <MessageSquare className="h-3.5 w-3.5" /> <span>{post.commentsCount || 0}</span>
        </button>
        <button
          onClick={handleRepost}
          className={`flex items-center gap-1.5 transition-colors ${userReposted ? "text-[var(--fr8x-periwinkle)] font-bold" : "hover:text-[var(--fr8x-periwinkle)]"}`}
          title="Repost"
        >
          <Repeat2 className="h-3.5 w-3.5" /> <span>{reposts}</span>
        </button>
        <button
          onClick={handleSave}
          className={`flex items-center gap-1.5 transition-colors ml-auto ${saved ? "text-amber-500" : "hover:text-amber-500"}`}
          title={saved ? "Saved" : "Save post"}
        >
          <Bookmark className={`h-3.5 w-3.5 ${saved ? "fill-amber-500" : ""}`} />
        </button>
      </div>

      {/* Inline comment */}
      {showComment && (
        <div className="flex items-start gap-2 pt-1">
          <textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a professional comment..."
            rows={2}
            className="fr8x-input flex-1 text-[11px] resize-none"
            maxLength={500}
          />
          <button
            onClick={handlePostComment}
            disabled={isPostingComment || !commentText.trim()}
            className="px-3 py-1.5 bg-[var(--fr8x-periwinkle)] text-white rounded-lg text-[10px] font-bold hover:bg-[#3ABFF0] disabled:opacity-40 flex items-center gap-1 mt-0.5 transition-colors shrink-0"
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
    <div className="bg-white rounded-xl border border-slate-200 p-10 text-center shadow-sm">
      <div className="w-12 h-12 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-3">
        <BarChart3 className="h-6 w-6 text-slate-400" />
      </div>
      <p className="text-[13px] font-semibold text-[var(--fr8x-jet)] mb-1">No posts yet</p>
      <p className="text-[11px] text-foreground-muted">
        Be the first to share an industry update, rate, or insight with your network.
      </p>
    </div>
  );
});

// ─── Sort Tabs Config ─────────────────────────────────────────────────────────

const SORT_TABS: { value: FeedSortMode; label: string; icon: React.ReactNode }[] = [
  { value: "newest", label: "Latest", icon: <Clock className="h-3 w-3" /> },
  { value: "trending", label: "Trending", icon: <TrendingUp className="h-3 w-3" /> },
  { value: "most_viewed", label: "Most Viewed", icon: <Eye className="h-3 w-3" /> },
  { value: "most_commented", label: "Most Discussed", icon: <MessageSquare className="h-3 w-3" /> },
  { value: "most_reposted", label: "Most Shared", icon: <Repeat2 className="h-3 w-3" /> },
];

// ─── Main Feeds Page ──────────────────────────────────────────────────────────

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
  const [trendingTags, setTrendingTags] = useState<{ name: string; related: string }[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isPosting, setIsPosting] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [followedTags, setFollowedTags] = useState<string[]>([]);
  const [postError, setPostError] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(15);
  const [interactions, setInteractions] = useState<Record<string, FeedInteraction>>({});

  const displayName = user?.displayName || "User";

  function showToast(msg: string) {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }

  // Load hidden post IDs from Firestore (per user, not sessionStorage)
  useEffect(() => {
    if (!user?.uid) return;
    queryDocuments<{ postId: string }>(
      COLLECTIONS.FEED_HIDDEN,
      [where("userId", "==", user.uid), limit(500)]
    ).then((data) => {
      setHiddenPostIds(new Set(data.map((d) => d.postId)));
    }).catch(() => undefined);
  }, [user?.uid]);

  // Load feed interactions for current user (likes/reposts/saves)
  useEffect(() => {
    if (!user?.uid) return;
    queryDocuments<FeedInteraction>(
      COLLECTIONS.FEED_INTERACTIONS,
      [where("userId", "==", user.uid), limit(500)]
    ).then((data) => {
      const map: Record<string, FeedInteraction> = {};
      data.forEach((i) => { map[i.postId] = i; });
      setInteractions(map);
    }).catch(() => undefined);
  }, [user?.uid]);

  // Fetch trending tags
  useEffect(() => {
    queryDocuments<{ name: string; related: string }>("tags", [orderBy("name"), limit(10)])
      .then((data) => { if (data.length > 0) setTrendingTags(data); })
      .catch(() => undefined);
  }, []);

  // Fetch followed tags
  useEffect(() => {
    if (!user?.uid) return;
    getDocument<{ followedTags?: string[] }>(COLLECTIONS.PROFILES, user.uid).then((data) => {
      if (data?.followedTags) setFollowedTags(data.followedTags);
    });
  }, [user?.uid]);

  // Fetch blocked user IDs
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

  // Real-time Firestore subscription to posts
  useEffect(() => {
    setIsLoadingPosts(true);
    const unsubscribe = subscribeToQuery<PostData>(
      COLLECTIONS.POSTS,
      [where("isDeleted", "!=", true), limit(100)],
      (remotePosts) => {
        // Filter out deleted, sort will happen in filteredPosts memo
        const valid = remotePosts.filter((p) => !p.isDeleted);
        setPosts(valid);
        setIsLoadingPosts(false);
      }
    );
    return () => unsubscribe();
  }, []);

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

  const handleHidePost = useCallback(async (postId: string) => {
    if (!user?.uid) return;
    setHiddenPostIds((prev) => new Set([...prev, postId]));
    // Persist to Firestore
    try {
      const docId = `${user.uid}_${postId}`;
      await setDocument(COLLECTIONS.FEED_HIDDEN, docId, {
        userId: user.uid,
        postId,
        hiddenAt: serverTimestamp(),
      });
    } catch { /* non-critical */ }
  }, [user?.uid]);

  // Ranked & sorted posts
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
        const tA = a.createdAt ? a.createdAt.seconds : 0;
        const tB = b.createdAt ? b.createdAt.seconds : 0;
        return tB - tA;
      }
      if (sortMode === "trending") {
        return calculateTrendingScore(b) - calculateTrendingScore(a);
      }
      if (sortMode === "most_viewed") {
        return (b.viewsCount || 0) - (a.viewsCount || 0);
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
      setPostError("Post content exceeds the 1000-word limit.");
      return;
    }

    const modResult = validateContentModeration(postContent);
    if (!modResult.isClean) {
      setPostError(modResult.flaggedReason || "Post blocked due to prohibited content.");
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
      const activeAuthorName = profile?.fullName || user.displayName || "Logistics Professional";
      // No default company fallback — use only real profile data
      const activeCompany = profile?.companyName || "";
      const activeLocation = profile?.location
        ? `${profile.location}${profile.country ? `, ${profile.country}` : ""}`
        : "";

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
        viewsCount: 0,
        isDeleted: false,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
        updatedAt: serverTimestamp(),
      };

      await setDocument(COLLECTIONS.POSTS, docRef.id, newPostPayload);
      setPostContent("");
      showToast("Post published to your network.");
    } catch (err: any) {
      console.error("Error creating post:", err);
      setPostError(err?.message || "Failed to publish post. Please try again.");
    } finally {
      setIsPosting(false);
    }
  }, [postContent, user, profile, selectedTag, wordCount]);

  return (
    <div className="min-h-0">
      {/* Header & Toast */}
      <div className="flex items-center justify-between mb-3">
        <h1 className="text-[13px] font-bold text-[var(--fr8x-jet)] tracking-tight">Network Feed</h1>
        {toastMsg && (
          <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1.5">
            <CheckCircle2 className="h-3.5 w-3.5" />
            {toastMsg}
          </span>
        )}
      </div>

      {/* 3-column layout */}
      <div className="flex gap-4 items-start">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside className="hidden lg:block w-[210px] shrink-0 space-y-3">
          <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm space-y-3">
            <div className="flex items-center gap-3 border-b border-slate-100 pb-3">
              <LayeredAvatar personName={displayName} companyName={profile?.companyName} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-bold text-[var(--fr8x-jet)] truncate">{displayName}</p>
                <p className="text-[10px] text-emerald-600 font-medium truncate flex items-center gap-0.5">
                  <Building2 className="h-2.5 w-2.5" />
                  {profile?.companyName || "Freight Network"}
                </p>
              </div>
            </div>
            {profile?.location && (
              <p className="text-[10px] text-foreground-secondary">
                {profile.location}{profile.country ? `, ${profile.country}` : ""}
              </p>
            )}
            {profile?.industryTags && profile.industryTags.length > 0 && (
              <p className="text-[9px] text-foreground-muted">
                {profile.industryTags.slice(0, 3).join(" · ")}
              </p>
            )}
          </div>

          <ContactsPanel compact maxDisplay={6} />

          {/* Trending Tags */}
          {trendingTags.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-sm">
              <h3 className="text-[11px] font-bold text-[var(--fr8x-jet)] mb-2">Industry Topics</h3>
              <div className="space-y-1.5">
                {trendingTags.slice(0, 5).map((tag) => (
                  <button
                    key={tag.name}
                    onClick={() => handleToggleFollowTag(tag.name)}
                    className={`block w-full text-left p-1.5 rounded-lg text-[10px] transition-colors ${
                      followedTags.includes(tag.name)
                        ? "bg-[var(--fr8x-mist)] text-[var(--fr8x-periwinkle)] font-semibold"
                        : "hover:bg-slate-50 text-foreground-secondary"
                    }`}
                  >
                    <span className="font-bold">{tag.name}</span>
                    <span className="text-foreground-muted ml-1">· {tag.related}</span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>

        {/* ═══ CENTER FEED ═══ */}
        <main className="flex-1 min-w-0 space-y-3">
          {/* Post Composer */}
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
                onClick={() => setActiveCategory(cat.value as FeedFilterCategory)}
                className={activeCategory === cat.value ? "fr8x-tab-active" : "fr8x-tab-inactive"}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Feed Posts */}
          {isLoadingPosts ? (
            <div className="bg-white rounded-xl border border-slate-200 p-8 flex items-center justify-center gap-2 shadow-sm">
              <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
              <span className="text-[11px] text-foreground-muted">Loading network feed...</span>
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
                    onHide={handleHidePost}
                    initialInteraction={interactions[post.id] ?? null}
                  />
                  {(idx + 1) % 4 === 0 && <AdBanner adIndex={Math.floor(idx / 4)} />}
                </div>
              ))}

              {filteredPosts.length > visibleCount && (
                <div className="text-center">
                  <button
                    onClick={() => setVisibleCount((prev) => prev + 15)}
                    className="w-full py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-semibold text-[11px] rounded-xl shadow-sm transition-colors"
                  >
                    Load More Updates ({filteredPosts.length - visibleCount} remaining)
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
