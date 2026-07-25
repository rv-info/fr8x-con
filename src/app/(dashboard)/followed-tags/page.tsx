// FR8X-CON Followed Tags Page
// Manages followed tags and filters social feed posts containing those tags.

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Tag, Loader2, MessageSquare, ThumbsUp, ThumbsDown, Repeat2, Bookmark, Share2, Building2, Plus, Check } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { COLLECTIONS, INDUSTRY_TAGS } from "@/lib/utils/constants";
import { getDocument, setDocument, queryDocuments, where, limit } from "@/lib/firebase/firestore";
import { formatRelativeTime } from "@/lib/utils/format";

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
};

type UserProfile = {
  userId: string;
  followedTags?: string[];
};

export default function FollowedTagsPage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [followedTags, setFollowedTags] = useState<string[]>([]);
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [isUpdatingTag, setIsUpdatingTag] = useState(false);

  const fetchDetails = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      const prof = await getDocument<UserProfile>(COLLECTIONS.PROFILES, user.uid);
      setProfile(prof);
      setFollowedTags(prof?.followedTags || []);
    } catch (err) {
      console.error("Error loading followed tags profile:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Load feed posts matching followed tags
  const fetchMatchingPosts = useCallback(async () => {
    if (followedTags.length === 0) {
      setPosts([]);
      return;
    }
    setIsLoadingPosts(true);
    try {
      // Query posts collection
      const feedPosts = await queryDocuments<PostData>(COLLECTIONS.POSTS, [limit(100)]);
      // Filter posts that contain any of the followed tags (case insensitive match)
      const filtered = feedPosts.filter((p) => {
        const cat = (p.category || "").toLowerCase();
        const content = p.content.toLowerCase();
        return followedTags.some((t) => {
          const lowerT = t.toLowerCase();
          return cat.includes(lowerT) || content.includes(`#${lowerT.replace(/\s+/g, "")}`) || content.includes(lowerT);
        });
      });

      // Sort by latest
      filtered.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
      setPosts(filtered);
    } catch (err) {
      console.error("Error fetching tag posts:", err);
    } finally {
      setIsLoadingPosts(false);
    }
  }, [followedTags]);

  useEffect(() => {
    fetchMatchingPosts();
  }, [fetchMatchingPosts]);

  const handleToggleTag = async (tag: string) => {
    if (!user?.uid || isUpdatingTag) return;
    setIsUpdatingTag(true);
    try {
      const updated = followedTags.includes(tag)
        ? followedTags.filter((t) => t !== tag)
        : [...followedTags, tag];

      await setDocument(COLLECTIONS.PROFILES, user.uid, { followedTags: updated }, true);
      setFollowedTags(updated);
    } catch (err) {
      console.error("Error updating followed tag:", err);
    } finally {
      setIsUpdatingTag(false);
    }
  };

  return (
    <div className="space-y-4 py-3 min-h-screen bg-[var(--fr8x-bg)]">
      <div>
        <h1 className="text-heading-md font-semibold text-[var(--fr8x-jet)]">Followed Tags</h1>
        <p className="text-caption text-foreground-secondary">Customize your logistics feed by following industry tags</p>
      </div>

      {/* Tags manager */}
      <div className="fr8x-card p-4 bg-white space-y-3">
        <h3 className="text-body-sm font-semibold text-[var(--fr8x-jet)] border-b border-border pb-1">
          Select Tags to Follow
        </h3>
        {isLoading ? (
          <div className="flex justify-center py-2">
            <Loader2 className="h-4 w-4 animate-spin text-slate-400" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {INDUSTRY_TAGS.map((tag) => {
              const isFollowing = followedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => handleToggleTag(tag)}
                  disabled={isUpdatingTag}
                  className={`text-[10px] px-2.5 py-0.5 rounded-full border transition-all duration-100 flex items-center gap-1 ${
                    isFollowing
                      ? "bg-[var(--fr8x-periwinkle)] text-white border-[var(--fr8x-periwinkle)] font-medium"
                      : "bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100"
                  }`}
                >
                  {isFollowing ? <Check className="h-2.5 w-2.5" /> : <Plus className="h-2.5 w-2.5" />}
                  <span>#{tag}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Matching Posts Feed */}
      <div className="space-y-2 max-w-2xl mx-auto">
        <h3 className="text-body-sm font-bold text-[var(--fr8x-jet)] text-left">Matching Tag Feed</h3>
        {isLoadingPosts ? (
          <div className="fr8x-card bg-white p-12 text-center flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin text-[var(--fr8x-periwinkle)]" />
            <span className="text-body-sm text-foreground-secondary">Filtering network updates...</span>
          </div>
        ) : followedTags.length === 0 ? (
          <div className="fr8x-card bg-white p-10 text-center space-y-1">
            <Tag className="h-8 w-8 text-slate-300 mx-auto" />
            <p className="text-body-sm font-bold text-[var(--fr8x-jet)]">You aren&apos;t following any tags yet</p>
            <p className="text-caption text-foreground-muted">
              Select one or more tags above to curate matching posts from the logistics network.
            </p>
          </div>
        ) : posts.length === 0 ? (
          <div className="fr8x-card bg-white p-10 text-center text-foreground-secondary text-caption">
            No active posts match your followed tags yet. Posts using these tags will appear here.
          </div>
        ) : (
          posts.map((post) => {
            const timeAgo = post.createdAt ? formatRelativeTime(post.createdAt.seconds * 1000) : "Just now";
            return (
              <article key={post.id} className="fr8x-card p-3 bg-white space-y-2 text-left animate-fadeIn">
                <div className="flex items-start gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center text-body-sm font-bold text-[var(--fr8x-jet)] shrink-0">
                    {post.authorName.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[11px] font-semibold text-[var(--fr8x-jet)]">{post.authorName}</span>
                      {post.authorCompany && (
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium border border-slate-200 flex items-center gap-0.5">
                          <Building2 className="h-2.5 w-2.5" />
                          {post.authorCompany}
                        </span>
                      )}
                    </div>
                    <p className="text-[9px] text-foreground-muted leading-none mt-0.5">
                      {timeAgo}{post.category ? ` • ${post.category}` : ""}
                    </p>
                  </div>
                </div>

                <p className="text-[11px] text-[var(--fr8x-jet)] leading-relaxed whitespace-pre-line">
                  {post.content}
                </p>

                {/* Interaction */}
                <div className="flex items-center gap-4 text-[10px] text-foreground-secondary pt-1 border-t border-border">
                  <span className="flex items-center gap-1">
                    <ThumbsUp className="h-3 w-3" /> {post.likesCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <ThumbsDown className="h-3 w-3" /> {post.dislikesCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Repeat2 className="h-3 w-3" /> {post.repostsCount || 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <Bookmark className="h-3 w-3" /> {post.bookmarksCount || 0}
                  </span>
                </div>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
