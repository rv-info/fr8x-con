"use client";

// FR8X-CON CommentThread — Real-time inline comment display
// Subscribes live to Firestore comments for a given postId.
// Features: avatars, timestamps, per-comment likes, reply-to, load-more.

import React, { useState, useEffect, useCallback, memo } from "react";
import { ThumbsUp, Send, Loader2, ChevronDown } from "lucide-react";
import {
  subscribeToQuery,
  setDocument,
  updateDocument,
  getDocRef,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { formatRelativeTime } from "@/lib/utils/format";
import { sanitizePostContent } from "@/lib/utils/sanitize";
import { renderPostContent } from "@/lib/utils/postUtils";

// ─── Types ────────────────────────────────────────────────────────────────────

type CommentData = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorCompany?: string;
  content: string;
  likesCount?: number;
  parentCommentId?: string | null;
  isDeleted?: boolean;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

// ─── Mini Avatar ──────────────────────────────────────────────────────────────

const MiniAvatar = memo(function MiniAvatar({
  name,
  photoURL,
}: {
  name: string;
  photoURL?: string | null;
}) {
  const initial = (name || "U").charAt(0).toUpperCase();
  if (photoURL) {
    return (
      <img
        src={photoURL}
        alt={name}
        className="w-7 h-7 rounded-full object-cover border border-slate-200 shrink-0"
      />
    );
  }
  return (
    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[var(--fr8x-periwinkle)] to-slate-700 flex items-center justify-center text-white text-[10px] font-bold shrink-0 border border-white shadow-sm">
      {initial}
    </div>
  );
});

// ─── Single Comment ───────────────────────────────────────────────────────────

const CommentItem = memo(function CommentItem({
  comment,
  currentUserId,
  onReply,
}: {
  comment: CommentData;
  currentUserId: string;
  onReply: (authorName: string) => void;
}) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(comment.likesCount || 0);
  const timeAgo = comment.createdAt
    ? formatRelativeTime(comment.createdAt.seconds * 1000)
    : "Just now";

  const handleLike = async () => {
    if (!currentUserId) return;
    const next = !liked;
    setLiked(next);
    setLikes((prev) => prev + (next ? 1 : -1));
    try {
      await updateDocument(COLLECTIONS.COMMENTS, comment.id, {
        likesCount: likes + (next ? 1 : -1),
      });
    } catch {
      // revert
      setLiked(!next);
      setLikes((prev) => prev + (next ? -1 : 1));
    }
  };

  return (
    <div className="flex gap-2 items-start group">
      <MiniAvatar name={comment.authorName} />
      <div className="flex-1 min-w-0">
        <div className="bg-slate-50 rounded-xl px-3 py-2 border border-slate-100">
          <div className="flex items-baseline gap-1.5 mb-0.5 flex-wrap">
            <span className="text-[11px] font-bold text-[var(--fr8x-jet)]">
              {comment.authorName}
            </span>
            {comment.authorCompany && (
              <span className="text-[9px] text-slate-500 font-medium">
                · {comment.authorCompany}
              </span>
            )}
          </div>
          <div className="text-[11px] text-[var(--fr8x-jet)] leading-relaxed break-words">
            {renderPostContent(comment.content)}
          </div>
        </div>

        {/* Comment actions */}
        <div className="flex items-center gap-3 px-1 mt-1">
          <span className="text-[9px] text-slate-400">{timeAgo}</span>
          <button
            type="button"
            onClick={handleLike}
            className={`text-[9px] font-semibold flex items-center gap-1 transition-colors ${
              liked ? "text-emerald-600" : "text-slate-400 hover:text-emerald-600"
            }`}
          >
            <ThumbsUp className="h-3 w-3" />
            {likes > 0 && <span>{likes}</span>}
            Like
          </button>
          <button
            type="button"
            onClick={() => onReply(comment.authorName)}
            className="text-[9px] font-semibold text-slate-400 hover:text-[var(--fr8x-periwinkle)] transition-colors"
          >
            Reply
          </button>
        </div>
      </div>
    </div>
  );
});

// ─── CommentThread ────────────────────────────────────────────────────────────

const BATCH_SIZE = 5;

interface CommentThreadProps {
  postId: string;
  currentUserId: string;
  currentUserName: string;
  currentUserCompany?: string;
  currentUserPhotoURL?: string | null;
  totalCount: number;
}

export const CommentThread = memo(function CommentThread({
  postId,
  currentUserId,
  currentUserName,
  currentUserCompany,
  currentUserPhotoURL,
  totalCount,
}: CommentThreadProps) {
  const [comments, setComments] = useState<CommentData[]>([]);
  const [visibleCount, setVisibleCount] = useState(BATCH_SIZE);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // ── Real-time subscription ─────────────────────────────────────────────
  useEffect(() => {
    setIsLoading(true);
    const unsubscribe = subscribeToQuery<CommentData>(
      COLLECTIONS.COMMENTS,
      [
        where("postId", "==", postId),
        where("isDeleted", "!=", true),
        orderBy("createdAt", "asc"),
        limit(100),
      ],
      (data) => {
        const valid = data.filter((c) => !c.isDeleted);
        setComments(valid);
        setIsLoading(false);
      }
    );
    return () => unsubscribe();
  }, [postId]);

  // ── Reply handler ──────────────────────────────────────────────────────
  const handleReply = useCallback((authorName: string) => {
    setCommentText((prev) =>
      prev.startsWith(`@${authorName}`) ? prev : `@${authorName} ${prev}`
    );
  }, []);

  // ── Submit comment ─────────────────────────────────────────────────────
  const handleSubmit = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || isSubmitting || !currentUserId) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const sanitized = sanitizePostContent(trimmed);
    if (!sanitized) {
      setSubmitError("Comment contains invalid content.");
      setIsSubmitting(false);
      return;
    }

    try {
      const ref = getDocRef(COLLECTIONS.COMMENTS);
      await setDocument(COLLECTIONS.COMMENTS, ref.id, {
        postId,
        authorId: currentUserId,
        authorName: currentUserName,
        authorCompany: currentUserCompany || "",
        content: sanitized,
        likesCount: 0,
        parentCommentId: null,
        isDeleted: false,
        createdAt: serverTimestamp(),
        createdBy: currentUserId,
      });
      await updateDocument(COLLECTIONS.POSTS, postId, {
        commentsCount: totalCount + comments.length + 1,
      });
      setCommentText("");
    } catch {
      setSubmitError("Failed to post comment. Try again.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    commentText,
    isSubmitting,
    currentUserId,
    currentUserName,
    currentUserCompany,
    postId,
    totalCount,
    comments.length,
  ]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && !isSubmitting) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const visibleComments = comments.slice(0, visibleCount);
  const hasMore = comments.length > visibleCount;

  return (
    <div className="space-y-3 pt-2 border-t border-slate-100">
      {/* Comment list */}
      {isLoading ? (
        <div className="flex items-center gap-2 text-slate-400 text-[10px] py-1">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading comments…
        </div>
      ) : (
        <>
          {visibleComments.map((c) => (
            <CommentItem
              key={c.id}
              comment={c}
              currentUserId={currentUserId}
              onReply={handleReply}
            />
          ))}

          {hasMore && (
            <button
              type="button"
              onClick={() => setVisibleCount((v) => v + BATCH_SIZE)}
              className="flex items-center gap-1 text-[10px] text-[var(--fr8x-periwinkle)] font-semibold hover:underline"
            >
              <ChevronDown className="h-3 w-3" />
              View {comments.length - visibleCount} more comment
              {comments.length - visibleCount !== 1 ? "s" : ""}
            </button>
          )}
        </>
      )}

      {/* Compose new comment */}
      <div className="flex gap-2 items-start">
        <MiniAvatar name={currentUserName} photoURL={currentUserPhotoURL} />
        <div className="flex-1 space-y-1.5">
          <div className="relative">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Write a comment… (Ctrl+Enter to post)"
              rows={commentText.length > 80 ? 3 : 1}
              maxLength={1000}
              className="w-full text-[11px] text-[var(--fr8x-jet)] placeholder:text-slate-400 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 focus:outline-none focus:border-[var(--fr8x-periwinkle)] focus:ring-1 focus:ring-[var(--fr8x-periwinkle)] resize-none leading-relaxed transition-all"
            />
          </div>

          {submitError && (
            <p className="text-[9px] text-red-500">{submitError}</p>
          )}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting || !commentText.trim()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--fr8x-periwinkle)] hover:bg-[#3ABFF0] text-white rounded-lg text-[10px] font-bold disabled:opacity-40 transition-all active:scale-95"
            >
              {isSubmitting ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Send className="h-3 w-3" />
              )}
              Comment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
});
