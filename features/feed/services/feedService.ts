/**
 * features/feed/services/feedService.ts
 * Domain Service for Freight Community Feeds & Posts
 *
 * Implements authoritative feed query, post creation, and moderation filtering
 * via Supabase PostgreSQL per Directive Section 10 & 42.
 */

import { FeedPost } from '@/lib/types';
import { postDbService } from '@/lib/supabase/db';

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
  const author = String(p.author || p.authorName || '');
  if (/^post-(?:[1-9]|1[0-9]|2[0-2])$/.test(id)) return true;
  if (DUMMY_PERSONAS.has(author)) return true;
  return false;
}

export const feedService = {
  /**
   * Fetches active feed posts from Supabase PostgreSQL.
   */
  async getPosts(options?: {
    limitCount?: number;
    tradeLane?: string;
    authorUid?: string;
  }): Promise<FeedPost[]> {
    try {
      let posts = await postDbService.getPosts();
      if (options?.authorUid) {
        posts = posts.filter((p) => p.authorUid === options.authorUid);
      }
      const limit = options?.limitCount || 50;
      return posts.slice(0, limit).filter((p) => !isDummyPost(p));
    } catch (err) {
      console.warn('[FeedService] Error fetching posts:', err);
      return [];
    }
  },

  /**
   * Saves or updates a feed post in Supabase PostgreSQL.
   */
  async savePost(post: FeedPost): Promise<void> {
    if (isDummyPost(post)) return;
    await postDbService.upsertPost(post);
  },

  /**
   * Deletes a post in Supabase PostgreSQL.
   */
  async deletePost(postId: string): Promise<void> {
    await postDbService.deletePost(postId);
  },

  /**
   * Filters a post list to remove dummy seeds.
   */
  sanitizePosts(posts: FeedPost[]): FeedPost[] {
    return posts.filter((p) => !isDummyPost(p));
  },
};
