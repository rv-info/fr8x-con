// FR8X-CON Saved Posts Page
// Queries bookmarks collection for current user, resolves post documents, and displays them.

"use client";

import { useState, useEffect, useCallback } from "react";
import { Bookmark, Loader2, MessageSquare, ThumbsUp, ThumbsDown, Repeat2, Share2, Building2 } from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { COLLECTIONS, ROUTES } from "@/lib/utils/constants";
import { queryDocuments, getDocument, where, orderBy, limit } from "@/lib/firebase/firestore";
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

type BookmarkData = {
  id: string;
  userId: string;
  postId: string;
};

export default function SavedPostsPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState<PostData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchSavedPosts = useCallback(async () => {
    if (!user?.uid) return;
    setIsLoading(true);
    try {
      // 1. Fetch user bookmarks
      const bookmarks = await queryDocuments<BookmarkData>(COLLECTIONS.BOOKMARKS, [
        where("userId", "==", user.uid),
      ]);

      if (bookmarks.length === 0) {
        setPosts([]);
        setIsLoading(false);
        return;
      }

      // 2. Fetch corresponding posts (we fetch them in parallel)
      const postPromises = bookmarks.map((b) => getDocument<PostData>(COLLECTIONS.POSTS, b.postId));
      const resolvedPosts = await Promise.all(postPromises);

      // Filter out nulls and deleted posts
      const activePosts = resolvedPosts.filter((p): p is PostData => p !== null);
      
      // Sort by latest (we can sort them client-side)
      activePosts.sort((a, b) => {
        const timeA = a.createdAt?.seconds || 0;
        const timeB = b.createdAt?.seconds || 0;
        return timeB - timeA;
      });

      setPosts(activePosts);
    } catch (err) {
      console.error("Error fetching saved posts:", err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    fetchSavedPosts();
  }, [fetchSavedPosts]);

  return (
    <div className="space-y-4 py-3 min-h-screen bg-[var(--fr8x-bg)]">
      <div>
        <h1 className="text-heading-md font-semibold text-[var(--fr8x-jet)]">Saved Posts</h1>
        <p className="text-caption text-foreground-secondary">Your curated bookmarks and logistics insights</p>
      </div>

      {isLoading ? (
        <div className="fr8x-card bg-white p-12 text-center flex items-center justify-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--fr8x-periwinkle)]" />
          <span className="text-body-sm text-foreground-secondary">Loading your bookmarks...</span>
        </div>
      ) : posts.length === 0 ? (
        <div className="fr8x-card bg-white p-10 text-center space-y-2">
          <Bookmark className="h-10 w-10 text-slate-300 mx-auto" />
          <p className="text-body-sm font-bold text-[var(--fr8x-jet)]">No saved posts found</p>
          <p className="text-caption text-foreground-muted">
            Bookmark rate requests, cargo details, or discussions in the feed to refer to them here later.
          </p>
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl mx-auto">
          {posts.map((post) => {
            const timeAgo = post.createdAt ? formatRelativeTime(post.createdAt.seconds * 1000) : "Just now";
            return (
              <article key={post.id} className="fr8x-card p-3 bg-white space-y-2 text-left">
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
                  <span className="flex items-center gap-1 text-[var(--fr8x-periwinkle)] font-semibold">
                    <Bookmark className="h-3 w-3 fill-[var(--fr8x-periwinkle)]" /> Saved
                  </span>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
