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
import PostJobDialog from "@/components/jobs/PostJobDialog";
import type { JobPosting } from "@/lib/types/job";
import {
  ThumbsUp,
  ThumbsDown,
  Repeat2,
  Bookmark,
  Share2,
  Briefcase,
  Loader2,
  Plus,
  Building2,
  CheckCircle2,
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
  companyName?: string;
  city?: string;
};

// ─── Layered Avatar Component (Person Avatar with Company Badge/Logo behind) ───
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

  return (
    <div className={`relative flex items-center justify-center ${outerSizeClass} shrink-0`}>
      {/* Background Company Logo / Badge */}
      <div className="absolute top-0 left-0 w-full h-full rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border border-slate-600 flex items-center justify-center text-white font-bold shadow-sm overflow-hidden">
        <span className="opacity-80 text-[10px] uppercase font-semibold tracking-tighter">
          {cInitial}
        </span>
      </div>

      {/* Foreground Person Avatar Overlaid */}
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
const PostCard = memo(function PostCard({ post }: { post: PostData }) {
  const timeAgo = post.createdAt
    ? formatRelativeTime(post.createdAt.seconds * 1000)
    : "Just now";

  return (
    <article className="fr8x-card p-3 bg-white">
      {/* Author header with Layered Person & Company Avatar */}
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
      </div>

      {/* Content */}
      <p className="text-[11px] text-[var(--fr8x-jet)] mb-2 leading-relaxed whitespace-pre-line">{post.content}</p>

      {/* Interaction bar */}
      <div className="flex items-center gap-4 text-[10px] text-foreground-secondary pt-1 border-t border-border">
        <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)] transition-colors">
          <ThumbsUp className="h-3 w-3" /> {post.likesCount || 0}
        </button>
        <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)] transition-colors">
          <ThumbsDown className="h-3 w-3" /> {post.dislikesCount || 0}
        </button>
        <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)] transition-colors">
          <Repeat2 className="h-3 w-3" /> {post.repostsCount || 0}
        </button>
        <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)] transition-colors">
          <Bookmark className="h-3 w-3" /> {post.bookmarksCount || 0}
        </button>
        <button className="flex items-center gap-1 hover:text-[var(--fr8x-jet)] transition-colors">
          <Share2 className="h-3 w-3" /> Share
        </button>
      </div>
    </article>
  );
});

const EmptyFeed = memo(function EmptyFeed() {
  return (
    <div className="fr8x-card p-6 text-center bg-white">
      <p className="text-[11px] text-foreground-secondary mb-1">No posts yet</p>
      <p className="text-[10px] text-foreground-muted">Be the first to share an update or post a job requirement with your network!</p>
    </div>
  );
});

// ─── Main Feeds Component ───
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
  const [isPostJobOpen, setIsPostJobOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const displayName = user?.displayName || "User";

  // Fetch user profile
  useEffect(() => {
    if (!user?.uid) return;
    getDocument<ProfileData>(COLLECTIONS.PROFILES, user.uid).then((data) => {
      if (data) setProfile(data);
    });
  }, [user?.uid]);

  // Fetch posts from Firestore
  const fetchPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    try {
      const constraints = [
        where("isDeleted", "!=", true),
        orderBy("isDeleted"),
        orderBy("createdAt", "desc"),
        limit(30),
      ];
      const data = await queryDocuments<PostData>(COLLECTIONS.POSTS, constraints);
      setPosts(data);
    } catch (err) {
      console.error("Error fetching posts with compound constraint:", err);
      try {
        const data = await queryDocuments<PostData>(COLLECTIONS.POSTS, [
          orderBy("createdAt", "desc"),
          limit(30),
        ]);
        setPosts(data.filter((p) => !p.isDeleted));
      } catch {
        setPosts([]);
      }
    } finally {
      setIsLoadingPosts(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Fetch jobs
  const fetchJobs = useCallback(() => {
    queryDocuments<JobData>(COLLECTIONS.JOBS, [
      orderBy("createdAt", "desc"),
      limit(15),
    ]).then(setJobs).catch(() => setJobs([]));
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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
        authorCompany: profile?.companyName || "RV-Info Member",
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
      fetchPosts();
      setToastMsg("Post published to network feed!");
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error("Error creating post:", err);
    } finally {
      setIsPosting(false);
    }
  }, [postContent, user, profile, selectedTag, fetchPosts]);

  // Handle Job Post Creation & Cross-posting to Feed
  const handleJobSubmitted = async (jobPayload: Partial<JobPosting>) => {
    if (!user) return;
    try {
      // 1. Save Job to COLLECTIONS.JOBS
      const jobDocRef = getDocRef(COLLECTIONS.JOBS);
      await setDocument(COLLECTIONS.JOBS, jobDocRef.id, {
        title: jobPayload.jobTitle || "Logistics Role",
        companyName: jobPayload.companyName || profile?.companyName || "Logistics Company",
        salary: jobPayload.salaryMin ? `${jobPayload.salaryMin}-${jobPayload.salaryMax}` : "Competitive",
        currency: "INR",
        postedBy: user.uid,
        city: jobPayload.city || "",
        createdAt: serverTimestamp(),
        ...jobPayload,
      });

      // 2. Cross-post automatically to Feed (COLLECTIONS.POSTS) as job_vacancy post
      const feedPostDocRef = getDocRef(COLLECTIONS.POSTS);
      const postText = `🚨 JOB VACANCY: ${jobPayload.jobTitle || "Logistics Requirement"}\n` +
        `Company: ${jobPayload.companyName || profile?.companyName || "Logistics Firm"}\n` +
        `Location: ${jobPayload.city || "India"}, ${jobPayload.country || "India"}\n` +
        `Salary Range: ₹${jobPayload.salaryMin || 0} - ₹${jobPayload.salaryMax || 0} LPA\n` +
        `Required Skills: ${jobPayload.requiredSkills || "Freight Negotiation, Documentation"}\n` +
        `Apply Email: ${jobPayload.email || jobPayload.officialEmail || user.email}`;

      await setDocument(COLLECTIONS.POSTS, feedPostDocRef.id, {
        authorId: user.uid,
        authorName: user.displayName || "Recruiter",
        authorCompany: jobPayload.companyName || profile?.companyName || "Logistics Corp",
        authorLocation: jobPayload.city ? `${jobPayload.city}, India` : "",
        content: postText,
        category: "job_vacancy",
        likesCount: 0,
        dislikesCount: 0,
        repostsCount: 0,
        bookmarksCount: 0,
        isDeleted: false,
        createdAt: serverTimestamp(),
        createdBy: user.uid,
      });

      fetchJobs();
      fetchPosts();
      setToastMsg("Job posted successfully & cross-published to network feeds!");
      setTimeout(() => setToastMsg(null), 3000);
    } catch (err) {
      console.error("Error cross-posting job:", err);
    }
  };

  return (
    <div className="min-h-0">
      {/* Job Popup Dialog */}
      <PostJobDialog
        isOpen={isPostJobOpen}
        onClose={() => setIsPostJobOpen(false)}
        onSubmit={handleJobSubmitted}
      />

      {/* Header & Toast */}
      <div className="flex items-center justify-between mb-2">
        <h1 className="text-[11px] font-semibold text-[var(--fr8x-jet)]">Feeds & Logistics Network</h1>
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
          {/* User Card with Layered Avatar */}
          <div className="fr8x-card p-3 bg-white space-y-2">
            <div className="flex items-center gap-2.5 border-b border-border pb-2">
              <LayeredAvatar personName={displayName} companyName={profile?.companyName} size="lg" />
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-bold text-[var(--fr8x-jet)] truncate">{displayName}</p>
                <p className="text-[10px] text-emerald-600 font-medium truncate flex items-center gap-0.5">
                  <Building2 className="h-2.5 w-2.5" />
                  {profile?.companyName || "RV-Info Logistics"}
                </p>
              </div>
            </div>
            <p className="text-[10px] text-foreground-secondary">
              {profile?.location ? `${profile.location}, ${profile.country || ""}` : "Verified Logistics Member"}
            </p>
            {profile?.industryTags && profile.industryTags.length > 0 && (
              <p className="text-[9px] text-foreground-muted">
                Tags: {profile.industryTags.slice(0, 3).join(", ")}
              </p>
            )}
          </div>

          {/* Navigation */}
          <nav className="fr8x-card p-1.5 space-y-0.5 bg-white">
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
          <div className="fr8x-card p-2.5 bg-white">
            <div className="flex items-center gap-2 mb-1.5">
              <LayeredAvatar personName={displayName} companyName={profile?.companyName} size="sm" />
              <p className="text-[11px] font-medium text-[var(--fr8x-jet)]">{displayName}</p>
            </div>

            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="Share an update or rate inquiry with your logistics network..."
              className="fr8x-input min-h-[56px] resize-none mb-1.5 text-[10px]"
            />

            <div className="flex items-center justify-between">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="fr8x-input w-auto text-[10px] py-0.5 h-6"
              >
                <option value="all">Select category</option>
                {FEED_CATEGORIES.filter((c) => c.value !== "all").map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPostJobOpen(true)}
                  className="fr8x-btn-secondary text-[10px] py-1 px-2.5 flex items-center gap-1"
                >
                  <Briefcase className="h-3 w-3" /> Post Job Requirement
                </button>

                <button
                  onClick={handlePost}
                  className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] text-[10px] py-1 px-3"
                  disabled={!postContent.trim() || isPosting}
                >
                  {isPosting ? "Posting..." : "POST"}
                </button>
              </div>
            </div>
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
              <span className="text-[11px] text-foreground-muted">Loading network posts...</span>
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
        <aside className="hidden xl:block w-[220px] shrink-0 space-y-2">
          {/* Jobs Utility Section */}
          <div className="fr8x-card p-2.5 bg-white space-y-2 border border-blue-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Briefcase className="h-4 w-4 text-[#56C5F0]" />
                <p className="text-[11px] font-bold text-[var(--fr8x-jet)]">Logistics Jobs</p>
              </div>
              <button
                onClick={() => setIsPostJobOpen(true)}
                className="text-[9px] bg-[#56C5F0] hover:bg-[#3ABFF0] text-white px-2 py-0.5 rounded font-semibold flex items-center gap-0.5 shadow-sm"
              >
                <Plus className="h-2.5 w-2.5" /> POST JOB
              </button>
            </div>

            {jobs.length === 0 ? (
              <div className="text-center py-2">
                <p className="text-[10px] text-foreground-muted">No active job posts</p>
                <button
                  onClick={() => setIsPostJobOpen(true)}
                  className="text-[10px] text-[var(--fr8x-periwinkle)] font-medium hover:underline mt-1 block w-full text-center"
                >
                  Create job requirement
                </button>
              </div>
            ) : (
              <div className="max-h-[260px] overflow-y-auto space-y-1.5 pr-0.5">
                {jobs.map((job) => (
                  <div
                    key={job.id}
                    className="p-1.5 bg-slate-50 hover:bg-slate-100 rounded border border-slate-200 transition-colors"
                  >
                    <p className="text-[10px] font-bold text-[var(--fr8x-jet)] truncate">{job.title}</p>
                    <p className="text-[9px] text-foreground-secondary truncate">{job.companyName || "Logistics Provider"}</p>
                    <div className="flex items-center justify-between text-[9px] text-emerald-700 font-semibold mt-1">
                      <span>{job.salary ? `₹${job.salary} LPA` : "Best in Industry"}</span>
                      <span className="text-[8px] bg-emerald-100 px-1 rounded">Active</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trending Tags */}
          <div className="fr8x-card p-2.5 bg-white">
            <p className="text-[11px] font-semibold text-[var(--fr8x-jet)] mb-1">Trending Tags</p>
            <ul className="space-y-1">
              {["Ocean Freight", "Air Freight", "FCL", "LCL", "NVOCC"].map((tag) => (
                <li key={tag} className="text-[10px] text-foreground-secondary hover:text-[var(--fr8x-jet)] cursor-pointer transition-colors flex items-center justify-between">
                  <span>#{tag}</span>
                  <span className="text-[9px] text-foreground-muted">Popular</span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
