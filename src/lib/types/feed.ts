// FR8X-CON Feed & Post Types

import type { AuditFields } from "./common";

export type PostType = "text" | "table";

export type FeedTab = "smart_posts" | "posts";

export type FeedSortOption = "latest" | "popular" | "following" | "my_posts";

export type FeedFilterCategory =
  | "all"
  | "nvocc"
  | "freight_forwarding"
  | "project_cargo"
  | "fcl"
  | "lcl"
  | "air"
  | "ocean"
  | "road"
  | "customs"
  | "warehousing"
  | "cold_chain"
  | "multimodal"
  | "rig_to_destination";

export type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorCompany: string;
  authorDesignation: string;
  authorLocation: string;
  authorPhotoURL: string | null;
  content: string;
  type: PostType;
  tableData?: TablePostData;
  hashtags: string[];
  mentions: string[];
  likesCount: number;
  dislikesCount: number;
  commentsCount: number;
  repostsCount: number;
  bookmarksCount: number;
  isPinned: boolean;
  isRepost: boolean;
  originalPostId?: string;
  category: FeedFilterCategory;
} & AuditFields;

export type TablePostData = {
  headers: string[];
  rows: string[][];
};

export type Comment = {
  id: string;
  postId: string;
  authorId: string;
  authorName: string;
  authorCompany: string;
  authorPhotoURL: string | null;
  content: string;
  parentCommentId: string | null;
  likesCount: number;
  repliesCount: number;
} & AuditFields;

export type Like = {
  id: string;
  postId?: string;
  commentId?: string;
  userId: string;
  type: "up" | "down";
  createdAt: AuditFields["createdAt"];
};

export type Bookmark = {
  id: string;
  postId: string;
  userId: string;
  createdAt: AuditFields["createdAt"];
};
