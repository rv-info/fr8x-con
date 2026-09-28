/**
 * features/feed/services/feedService.ts
 * Domain Service for Freight Community Feeds & Posts
 *
 * Implements authoritative feed query, post creation, and moderation filtering
 * per Directive Section 10 & 42.
 */

import { FeedPost } from '@/lib/types';
import {
  getPostsFromDB,
  upsertPostInDB,
  deletePostInDB,
} from '@/lib/firebase/firestore';

export const DUMMY_PERSONAS = new Set([
  'Captain Rajesh Sharma',
  'Elena Rostova',
  'Vikramaditya Singhania',
  'Zara Chen',
  'Marcus Vance',
  'Priya Sundaram',
]);

export function isDummyPost(p: any): boolean {
  if (!p) return true;
  const id = String(p.id || '');
  const author = String(p.author || '');
  if (/^post-(?:[1-9]|1[0-9]|2[0-2])$/.test(id)) return true;
  if (DUMMY_PERSONAS.has(author)) return true;
  return false;
}

export const feedService = {
  /**
   * Fetches active feed posts from Firestore.
   */
  async getPosts(options?: {
    limitCount?: number;
    tradeLane?: string;
    authorUid?: string;
  }): Promise<FeedPost[]> {
    try {
      const res = await getPostsFromDB(options);
      if (res && Array.isArray(res.posts)) {
        return res.posts.filter((p) => !isDummyPost(p));
      }
      return [];
    } catch (err) {
      console.warn('[FeedService] Error fetching posts:', err);
      return [];
    }
  },

  /**
   * Saves or updates a feed post.
   */
  async savePost(post: FeedPost): Promise<void> {
    if (isDummyPost(post)) return;
    await upsertPostInDB(post);
  },

  /**
   * Soft deletes a post.
   */
  async deletePost(postId: string): Promise<void> {
    await deletePostInDB(postId);
  },

  /**
   * Filters a post list to remove dummy seeds.
   */
  sanitizePosts(posts: FeedPost[]): FeedPost[] {
    return posts.filter((p) => !isDummyPost(p));
  },
};
