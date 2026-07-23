// FR8X-CON Feeds Page — Spec Page 3 (Ultra-compact, perf-optimized)
// 3-column layout: user card + connections | feed + composer | suggested + trending + jobs

"use client";

import { useState, useEffect, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { ROUTES, FEED_CATEGORIES, COLLECTIONS } from "@/lib/utils/constants";
import {
  queryDocuments,
  setDocument,
  getDocRef,
  getDocument,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { formatRelativeTime } from "@/lib/utils/format";
import type { FeedFilterCategory } from "@/lib/types/feed";
import {
  ThumbsUp,
  ThumbsDown,
  Repeat2,
  Bookmark,
  Share2,
  Briefcase,
  Loader2,
} from "lucide-react";

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

type JobData = {
  id: string;
  title: string;
  salary: string;
  currency: string;
  postedBy: string;
};

// ─── Memoized sub-components ───
const PostCard = memo(function PostCard({ post }: { post: PostData }) {
  const timeAgo = post.createdAt
    ? formatRelativeTime(post.createdAt.seconds * 1000)
    : "";

  return (
    <article className="fr8x-card p-2.5">
      {/* Author header */}
      <div className="flex items-start gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-full bg-[var(--fr8x-frozen)] flex items-center justify-center text-[10px] font-semibold text-[var(--fr8x-jet)] shrink-0">
          {post.authorName?.charAt(0) || "?"}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-[var(--fr8x-jet)]">{post.authorName}</span>
            <span className="text-[10px] text-foreground-secondary">{post.authorCompany}{post.authorLocation ? `, ${post.authorLocation}` : ""}</span>
          </div>
          <p className="text-[10px] text-foreground-muted">{timeAgo}{post.category ? ` • ${post.category}` : ""}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-[11px] text-[var(--fr8x-jet)] mb-1.5 leading-snug">{post.content}</p>

      {/* Interaction bar */}
      <div className="flex items-center gap-3 text-[10px] text-foreground-secondary">
        <button className="flex items-center gap-0.5 hover:text-[var(--fr8x-jet)] transition-colors">
          <ThumbsUp className="h-3 w-3" /> {post.likesCount || 0}
        </button>
        <button className="flex items-center gap-0.5 hover:text-[var(--fr8x-jet)] transition-colors">
          <ThumbsDown className="h-3 w-3" /> {post.dislikesCount || 0}
        </button>
        <button className="flex items-center gap-0.5 hover:text-[var(--fr8x-jet)] transition-colors">
          <Repeat2 className="h-3 w-3" /> {post.repostsCount || 0}
        </button>
        <button className="flex items-center gap-0.5 hover:text-[var(--fr8x-jet)] transition-colors">
          <Bookmark className="h-3 w-3" /> {post.bookmarksCount || 0}
        </button>
        <button className="flex items-center gap-0.5 hover:text-[var(--fr8x-jet)] transition-colors">
          <Share2 className="h-3 w-3" /> Share
        </button>
      </div>
    </article>
  );
});

const EmptyFeed = memo(function EmptyFeed() {
  return (
    <div className="fr8x-card p-6 text-center">
      <p className="text-[11px] text-foreground-secondary mb-1">No posts yet</p>
      <p className="text-[10px] text-foreground-muted">Be the first to share an update with your logistics network!</p>
    </div>
  );
});

// ─── Component ───
export default function FeedsPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<FeedFilterCategory>("all");
  const [postContent, setPostContent] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [posts, setPosts] = useState<PostData[]>([]);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const displayName = user?.displayName || "User";

  // Fetch user profile
  useEffect(() => {
    if (!user?.uid) return;
    getDocument<ProfileData>(COLLECTIONS.PROFILES, user.uid).then((data) => {
      if (data) setProfile(data);
    });
  }, [user?.uid]);

  // Fetch posts from Firestore
  useEffect(() => {
    async function fetchPosts() {
      setIsLoadingPosts(true);
      try {
        const constraints = [
          where("isDeleted", "!=", true),
          orderBy("isDeleted"),
          orderBy("createdAt", "desc"),
          limit(20),
        ];
        const data = await queryDocuments<PostData>(COLLECTIONS.POSTS, constraints);
        setPosts(data);
      } catch (err) {
        console.error("Error fetching posts:", err);
        // If the compound query fails (index not ready), try simple query
        try {
          const data = await queryDocuments<PostData>(COLLECTIONS.POSTS, [
            orderBy("createdAt", "desc"),
            limit(20),
          ]);
          setPosts(data.filter(p => !p.isDeleted));
        } catch {
          setPosts([]);
        }
      } finally {
        setIsLoadingPosts(false);
      }
    }
    fetchPosts();
  }, []);

  // Fetch jobs
  useEffect(() => {
    queryDocuments<JobData>(COLLECTIONS.JOBS, [
      orderBy("createdAt", "desc"),
      limit(15),
    ]).then(setJobs).catch(() => setJobs([]));
  }, []);

  const filteredPosts = useMemo(() => {
    if (activeCategory === "all") return posts;
    return posts.filter((p) =>
      (p.category || "").toLowerCase().includes(activeCategory.replace("_", " "))
    );
  }, [activeCategory, posts]);

  const handlePost = useCallback(async () => {
    if (!postContent.trim() || !user) return;
    setIsPosting(true);
    try {
      const docRef = getDocRef(COLLECTIONS.POSTS);
      await setDocument(COLLECTIONS.POSTS, docRef.id, {
        authorId: user.uid,
        authorName: user.displayName || "User",
        authorCompany: profile?.companyName || "",
        authorLocation: profile?.location ? `${profile.location}, ${profile.country || ""}` : "",
        content: postContent.trim(),
        category: selectedTag === "all" ? "" : selectedTag,
        likesCount: 0,
        dislikesCount: 0,
        repostsCount: 0,
        bookmarksCount: 0,
        commentsCount: 0,
        isDeleted: false,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });
      setPostContent("");
      // Refresh posts
      const data = await queryDocuments<PostData>(COLLECTIONS.POSTS, [
        orderBy("createdAt", "desc"),
        limit(20),
      ]);
      setPosts(data.filter(p => !p.isDeleted));
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setIsPosting(false);
    }
  }, [postContent, user, profile, selectedTag]);

  const handleCategoryChange = useCallback((cat: FeedFilterCategory) => {
    setActiveCategory(cat);
  }, []);

  return (
    <div className="min-h-0">
      {/* Page title */}
      <h1 className="text-[11px] font-semibold text-[var(--fr8x-jet)] mb-2">Feeds</h1>

      {/* 3-column layout */}
      <div className="flex gap-3 items-start">
        {/* ═══ LEFT SIDEBAR ═══ */}
        <aside className="hidden lg:block w-[180px] shrink-0 space-y-2">
          {/* User Card */}
          <div className="fr8x-card p-2">
            <div className="w-9 h-9 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center text-[11px] text-[var(--fr8x-jet)] font-semibold mb-1">
              {displayName.charAt(0)}
            </div>
            <p className="text-[11px] font-semibold text-[var(--fr8x-jet)]">{displayName}</p>
            <p className="text-[10px] text-foreground-secondary">{profile?.companyName || ""}</p>
            <p className="text-[10px] text-foreground-secondary">
              {profile?.location ? `${profile.location}, ${profile.country || ""}` : ""}
            </p>
            {profile?.industryTags && profile.industryTags.length > 0 && (
              <p className="text-[10px] text-foreground-secondary mt-0.5">
                {profile.industryTags.slice(0, 3).join(", ")}
              </p>
            )}
          </div>

          {/* Navigation */}
          <nav className="fr8x-card p-1.5 space-y-0.5">
            <button className="fr8x-nav-item w-full text-left">Saved Posts</button>
            <button className="fr8x-nav-item w-full text-left">My RFQs</button>
            <button className="fr8x-nav-item w-full text-left">Followed Tags</button>
            <button className="fr8x-nav-item w-full text-left">Company Page</button>
            <Link href={ROUTES.PROFILE} className="fr8x-nav-item w-full">View Profile</Link>
          </nav>
        </aside>

        {/* ═══ CENTER FEED ═══ */}
        <main className="flex-1 min-w-0 space-y-2">
          {/* Post Composer */}
          <div className="fr8x-card p-2">
            <div className="flex items-center gap-2 mb-1.5">
              <div className="w-7 h-7 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center text-[10px] font-semibold text-[var(--fr8x-jet)] shrink-0">
                {displayName.charAt(0)}
              </div>
              <p className="text-[11px] font-medium text-[var(--fr8x-jet)]">{displayName}</p>
            </div>

            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Share an update with your logistics network..."
              className="fr8x-input min-h-[56px] resize-none mb-1.5 text-[10px]"
            />

            <div className="flex items-center justify-between">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="fr8x-input w-auto text-[10px] py-0.5 h-6"
              >
                <option value="all">Select category</option>
                {FEED_CATEGORIES.filter(c => c.value !== "all").map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <button
                onClick={handlePost}
                className="fr8x-btn-primary"
                disabled={!postContent.trim() || isPosting}
              >
                {isPosting ? "Posting..." : "POST"}
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-1 overflow-x-auto no-scrollbar">
            {FEED_CATEGORIES.map((cat) => (
              <button
                key={cat.value}
                onClick={() => handleCategoryChange(cat.value as FeedFilterCategory)}
                className={activeCategory === cat.value ? "fr8x-tab-active" : "fr8x-tab-inactive"}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Feed Posts */}
          {isLoadingPosts ? (
            <div className="fr8x-card p-6 flex items-center justify-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
              <span className="text-[11px] text-foreground-muted">Loading posts...</span>
            </div>
          ) : filteredPosts.length === 0 ? (
            <EmptyFeed />
          ) : (
            <div className="space-y-2">
              {filteredPosts.map((post) => (
                <PostCard key={post.id} post={post} />
              ))}
            </div>
          )}
        </main>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <aside className="hidden xl:block w-[200px] shrink-0 space-y-2">
          {/* Trending Tags */}
          <div className="fr8x-card p-2">
            <p className="text-[11px] font-semibold text-[var(--fr8x-jet)] mb-1">Trending Tags</p>
            <ul className="space-y-0.5">
              {["Ocean Freight", "Air Freight", "FCL", "LCL", "NVOCC"].map((tag) => (
                <li key={tag} className="text-[10px] text-foreground-secondary hover:text-[var(--fr8x-jet)] cursor-pointer transition-colors">
                  #{tag}
                </li>
              ))}
            </ul>
          </div>

          {/* Advertise */}
          <div className="fr8x-card p-2 text-center">
            <p className="text-[11px] font-semibold text-[var(--fr8x-jet)]">Advertise</p>
            <p className="text-[9px] text-foreground-muted mt-0.5">Reach logistics professionals</p>
          </div>

          {/* Jobs Section */}
          <div className="fr8x-card p-2">
            <div className="flex items-center gap-1 mb-1.5">
              <Briefcase className="h-3.5 w-3.5 text-[var(--fr8x-jet)]" />
              <p className="text-[11px] font-semibold text-[var(--fr8x-jet)]">Jobs</p>
            </div>
            {jobs.length === 0 ? (
              <p className="text-[10px] text-foreground-muted py-2 text-center">No job listings yet</p>
            ) : (
              <div className="max-h-[240px] overflow-y-auto space-y-1 pr-0.5">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="text-[10px] text-foreground-secondary hover:text-[var(--fr8x-jet)] cursor-pointer transition-colors py-0.5 border-b border-border last:border-0"
                  >
                    <span className="font-medium">{job.title}</span>
                    {job.salary && (
                      <>
                        {" • "}
                        <span className="text-[9px]">{job.salary} {job.currency}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
