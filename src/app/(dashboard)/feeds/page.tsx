// FR8X-CON Feeds Page — Spec Page 3 (Ultra-compact, perf-optimized)
// 3-column layout: user card + connections | feed + composer | suggested + trending + jobs

"use client";

import { useState, useMemo, useCallback, memo } from "react";
import Link from "next/link";
import { useAuth } from "@/providers/AuthProvider";
import { ROUTES, FEED_CATEGORIES } from "@/lib/utils/constants";
import type { FeedFilterCategory } from "@/lib/types/feed";
import {
  ThumbsUp,
  ThumbsDown,
  Repeat2,
  Bookmark,
  Share2,
  Bold,
  Italic,
  Underline,
  Briefcase,
} from "lucide-react";

// ─── Static mock data (outside component → no re-creation on render) ───
const mockConnections = [
  { id: "c0", name: "Connection 1", company: "Company A", location: "Mumbai", country: "India" },
  { id: "c1", name: "Connection 2", company: "Company B", location: "Dubai", country: "UAE" },
  { id: "c2", name: "Connection 3", company: "Company C", location: "Singapore", country: "Singapore" },
  { id: "c3", name: "Connection 4", company: "Company D", location: "Shanghai", country: "China" },
  { id: "c4", name: "Connection 5", company: "Company E", location: "Rotterdam", country: "Netherlands" },
  { id: "c5", name: "Connection 6", company: "Company F", location: "Hamburg", country: "Germany" },
];

const mockSuggested = [
  { id: "s0", name: "Suggested User 1", company: "Logistics Co 1", location: "Delhi", country: "India" },
  { id: "s1", name: "Suggested User 2", company: "Logistics Co 2", location: "London", country: "UK" },
  { id: "s2", name: "Suggested User 3", company: "Logistics Co 3", location: "Hong Kong", country: "China" },
  { id: "s3", name: "Suggested User 4", company: "Logistics Co 4", location: "Sydney", country: "Australia" },
  { id: "s4", name: "Suggested User 5", company: "Logistics Co 5", location: "Tokyo", country: "Japan" },
];

const trendingTags = ["Ocean Freight", "Air Freight", "LAND Freight"];

const mockJobs = [
  { id: "j0",  package: "4.0 LPA",  currency: "INR", poster: "User 1",  title: "Logistics Manager" },
  { id: "j1",  package: "4.5 LPA",  currency: "INR", poster: "User 2",  title: "Logistics Executive" },
  { id: "j2",  package: "5.0 LPA",  currency: "INR", poster: "User 3",  title: "Logistics Analyst" },
  { id: "j3",  package: "5.5 LPA",  currency: "INR", poster: "User 4",  title: "Logistics Coordinator" },
  { id: "j4",  package: "6.0 LPA",  currency: "INR", poster: "User 5",  title: "Logistics Specialist" },
  { id: "j5",  package: "6.5 LPA",  currency: "INR", poster: "User 6",  title: "Logistics Manager" },
  { id: "j6",  package: "7.0 LPA",  currency: "INR", poster: "User 7",  title: "Logistics Executive" },
  { id: "j7",  package: "7.5 LPA",  currency: "INR", poster: "User 8",  title: "Logistics Analyst" },
  { id: "j8",  package: "8.0 LPA",  currency: "INR", poster: "User 9",  title: "Logistics Coordinator" },
  { id: "j9",  package: "8.5 LPA",  currency: "INR", poster: "User 10", title: "Logistics Specialist" },
  { id: "j10", package: "9.0 LPA",  currency: "INR", poster: "User 11", title: "Logistics Manager" },
  { id: "j11", package: "9.5 LPA",  currency: "INR", poster: "User 12", title: "Logistics Executive" },
  { id: "j12", package: "10.0 LPA", currency: "INR", poster: "User 13", title: "Logistics Analyst" },
  { id: "j13", package: "10.5 LPA", currency: "INR", poster: "User 14", title: "Logistics Coordinator" },
  { id: "j14", package: "11.0 LPA", currency: "INR", poster: "User 15", title: "Logistics Specialist" },
];

const mockPosts = [
  { id: "p0", authorName: "User 1", authorCompany: "Company A", authorLocation: "Mumbai, India",             timePosted: "1hr",  tags: "FCL",           content: "Industry update: New shipping routes announced between Asia and Europe", likesCount: 12, dislikesCount: 1, repostsCount: 3, bookmarksCount: 8,  sharesCount: 2 },
  { id: "p1", authorName: "User 2", authorCompany: "Company B", authorLocation: "Singapore",                 timePosted: "2hr",  tags: "Ocean Freight", content: "Industry update: Container rates stabilizing in Q3 2025",                      likesCount: 28, dislikesCount: 2, repostsCount: 7, bookmarksCount: 15, sharesCount: 4 },
  { id: "p2", authorName: "User 3", authorCompany: "Company C", authorLocation: "Dubai, UAE",                timePosted: "3hr",  tags: "NVOCC",         content: "Industry update: Major port expansion project in progress",                      likesCount: 9,  dislikesCount: 0, repostsCount: 2, bookmarksCount: 5,  sharesCount: 1 },
  { id: "p3", authorName: "User 4", authorCompany: "Company D", authorLocation: "Shanghai, China",           timePosted: "4hr",  tags: "Air Freight",   content: "Industry update: Digital documentation initiative launched",                    likesCount: 35, dislikesCount: 3, repostsCount: 11, bookmarksCount: 22, sharesCount: 6 },
  { id: "p4", authorName: "User 5", authorCompany: "Company E", authorLocation: "Rotterdam, Netherlands",    timePosted: "5hr",  tags: "LCL",           content: "Industry update: Green shipping corridor proposal gains traction",             likesCount: 17, dislikesCount: 1, repostsCount: 5, bookmarksCount: 12, sharesCount: 3 },
  { id: "p5", authorName: "User 6", authorCompany: "Company F", authorLocation: "Hamburg, Germany",          timePosted: "6hr",  tags: "Customs",       content: "Industry update: Cross-border trade regulations updated",                      likesCount: 42, dislikesCount: 4, repostsCount: 14, bookmarksCount: 30, sharesCount: 8 },
];

// ─── Memoized sub-components for performance ───
const PostCard = memo(function PostCard({ post }: { post: typeof mockPosts[number] }) {
  return (
    <article className="fr8x-card p-2.5">
      {/* Author header */}
      <div className="flex items-start gap-2 mb-1.5">
        <div className="w-7 h-7 rounded-full bg-[var(--fr8x-frozen)] flex items-center justify-center text-[10px] font-semibold text-[var(--fr8x-jet)] shrink-0">
          {post.authorName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-[var(--fr8x-jet)]">{post.authorName}</span>
            <span className="text-[10px] text-foreground-secondary">{post.authorCompany}, {post.authorLocation}</span>
          </div>
          <p className="text-[10px] text-foreground-muted">{post.timePosted} • {post.tags}</p>
        </div>
      </div>

      {/* Content */}
      <p className="text-[11px] text-[var(--fr8x-jet)] mb-1.5 leading-snug">{post.content}</p>

      {/* Interaction bar */}
      <div className="flex items-center gap-3 text-[10px] text-foreground-secondary">
        <button className="flex items-center gap-0.5 hover:text-[var(--fr8x-jet)] transition-colors">
          <ThumbsUp className="h-3 w-3" /> likes [{post.likesCount}]
        </button>
        <button className="flex items-center gap-0.5 hover:text-[var(--fr8x-jet)] transition-colors">
          <ThumbsDown className="h-3 w-3" /> Dislike [{post.dislikesCount}]
        </button>
        <button className="flex items-center gap-0.5 hover:text-[var(--fr8x-jet)] transition-colors">
          <Repeat2 className="h-3 w-3" /> Repost [{post.repostsCount}]
        </button>
        <button className="flex items-center gap-0.5 hover:text-[var(--fr8x-jet)] transition-colors">
          <Bookmark className="h-3 w-3" /> Save [{post.bookmarksCount}]
        </button>
        <button className="flex items-center gap-0.5 hover:text-[var(--fr8x-jet)] transition-colors">
          <Share2 className="h-3 w-3" /> Share [{post.sharesCount}]
        </button>
      </div>
    </article>
  );
});

// ─── Component ───
export default function FeedsPage() {
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<FeedFilterCategory>("all");
  const [postContent, setPostContent] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");

  const displayName = user?.displayName || "User";

  const filteredPosts = useMemo(() => {
    if (activeCategory === "all") return mockPosts;
    return mockPosts.filter((p) =>
      p.tags.toLowerCase().includes(activeCategory.replace("_", " "))
    );
  }, [activeCategory]);

  const handlePost = useCallback(() => {
    if (!postContent.trim()) return;
    setPostContent("");
  }, [postContent]);

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
            <p className="text-[10px] text-foreground-secondary">[COMPANY NAME]</p>
            <p className="text-[10px] text-foreground-secondary">[LOCATION, COUNTRY]</p>
            <p className="text-[10px] text-foreground-secondary mt-0.5">[TAGS]</p>
            <p className="text-[10px] text-foreground-secondary">[BATCH]</p>
          </div>

          {/* Navigation */}
          <nav className="fr8x-card p-1.5 space-y-0.5">
            <button className="fr8x-nav-item w-full text-left">Saved Posts</button>
            <button className="fr8x-nav-item w-full text-left">My RFQs</button>
            <button className="fr8x-nav-item w-full text-left">Followed Tags</button>
            <button className="fr8x-nav-item w-full text-left">Company Page</button>
            <Link href={ROUTES.PROFILE} className="fr8x-nav-item w-full">{"{view profile}"}</Link>
            <Link href={ROUTES.PROFILE} className="fr8x-nav-item w-full">{"{edit profile}"}</Link>
          </nav>

          {/* Connections */}
          <div className="fr8x-card p-2">
            <p className="text-[11px] font-semibold text-[var(--fr8x-jet)] mb-1.5">Connections</p>
            <div className="space-y-1.5">
              {mockConnections.map((c) => (
                <div key={c.id} className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[var(--fr8x-mist)] flex items-center justify-center text-[9px] font-medium shrink-0">
                    {c.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-[var(--fr8x-jet)] truncate">{c.name}</p>
                    <p className="text-[9px] text-foreground-secondary truncate">{c.company}, {c.location}, {c.country}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
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

            {/* Composer toolbar */}
            <div className="flex items-center gap-0.5 mb-1">
              <button className="p-1 rounded hover:bg-[var(--fr8x-mist)] transition-colors" title="Bold"><Bold className="h-3 w-3 text-foreground-secondary" /></button>
              <button className="p-1 rounded hover:bg-[var(--fr8x-mist)] transition-colors" title="Italic"><Italic className="h-3 w-3 text-foreground-secondary" /></button>
              <button className="p-1 rounded hover:bg-[var(--fr8x-mist)] transition-colors" title="Underline"><Underline className="h-3 w-3 text-foreground-secondary" /></button>
              <div className="flex items-center gap-0.5 ml-1">
                <button className="w-3 h-3 rounded-sm bg-red-500"   title="Red"   />
                <button className="w-3 h-3 rounded-sm bg-blue-500"  title="Blue"  />
                <button className="w-3 h-3 rounded-sm bg-green-500" title="Green" />
                <button className="w-3 h-3 rounded-sm bg-black"     title="Black" />
              </div>
            </div>

            <textarea
              value={postContent}
              onChange={(e) => setPostContent(e.target.value)}
              placeholder="[NAME] [Text] (have only one option for text/ italic/ underline/ and color for red / blue / green/ black)"
              className="fr8x-input min-h-[56px] resize-none mb-1.5 text-[10px]"
            />

            <div className="flex items-center justify-between">
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="fr8x-input w-auto text-[10px] py-0.5 h-6"
              >
                <option value="all">tags (drop down)</option>
                {FEED_CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <button
                onClick={handlePost}
                className="fr8x-btn-primary"
                disabled={!postContent.trim()}
              >
                POST
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

          {/* Feed note */}
          <p className="text-[9px] text-foreground-muted italic">
            [Feeds below only from the acquainted people or people with premium memberships and some random feeds based on the cache memory of browsers]
          </p>
          <p className="text-[9px] text-foreground-muted italic">
            Feeds based on the cache memory of browsers
          </p>

          {/* Feed Posts */}
          <div className="space-y-2">
            {filteredPosts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
            <p className="text-center text-[10px] text-foreground-muted py-2">read more on scrolling</p>
          </div>
        </main>

        {/* ═══ RIGHT SIDEBAR ═══ */}
        <aside className="hidden xl:block w-[200px] shrink-0 space-y-2">
          {/* Suggested Connections */}
          <div className="fr8x-card p-2">
            <p className="text-[11px] font-semibold text-[var(--fr8x-jet)] mb-1.5">Suggested Connections</p>
            <div className="space-y-1.5">
              {mockSuggested.map((s) => (
                <div key={s.id} className="flex items-center gap-1.5">
                  <div className="w-5 h-5 rounded-full bg-[var(--fr8x-mist)] flex items-center justify-center text-[9px] font-medium shrink-0">
                    {s.name.charAt(0)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-medium text-[var(--fr8x-jet)] truncate">{s.name}</p>
                    <p className="text-[9px] text-foreground-secondary truncate">{s.company}, {s.location}, {s.country}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Trending Tags */}
          <div className="fr8x-card p-2">
            <p className="text-[11px] font-semibold text-[var(--fr8x-jet)] mb-1">Trending Tags</p>
            <ul className="space-y-0.5">
              {trendingTags.map((tag) => (
                <li key={tag} className="text-[10px] text-foreground-secondary hover:text-[var(--fr8x-jet)] cursor-pointer transition-colors">
                  {tag}
                </li>
              ))}
            </ul>
          </div>

          {/* Advertise */}
          <div className="fr8x-card p-2 text-center">
            <p className="text-[11px] font-semibold text-[var(--fr8x-jet)]">Advertise</p>
          </div>

          {/* Jobs Section */}
          <div className="fr8x-card p-2">
            <div className="flex items-center gap-1 mb-1.5">
              <Briefcase className="h-3.5 w-3.5 text-[var(--fr8x-jet)]" />
              <p className="text-[11px] font-semibold text-[var(--fr8x-jet)]">Jobs</p>
            </div>
            <div className="max-h-[240px] overflow-y-auto space-y-1 pr-0.5">
              {mockJobs.map((job) => (
                <div
                  key={job.id}
                  className="text-[10px] text-foreground-secondary hover:text-[var(--fr8x-jet)] cursor-pointer transition-colors py-0.5 border-b border-border last:border-0"
                >
                  <span className="font-medium">{job.package}</span>{" "}
                  <span className="text-[9px]">({job.currency})</span>{" • "}
                  <span className="text-[9px]">leads to JOBs post by {job.poster}</span>
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
