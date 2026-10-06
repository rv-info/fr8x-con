/**
 * lib/db/posts.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Social Feed & Discussions.
 * Handles logistics insights, freight demand posts, comments, and engagement.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { PostRow } from '@/lib/supabase/types';

export async function getPosts(): Promise<PostRow[]> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[lib/db/posts] getPosts error:', error.message);
    throw new Error(`Failed to get posts: ${error.message}`);
  }
  return data || [];
}

export async function getPostById(id: string): Promise<PostRow | null> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('posts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) {
    console.error('[lib/db/posts] getPostById error:', error.message);
    throw new Error(`Failed to get post by id: ${error.message}`);
  }
  return data;
}

export async function savePost(post: any): Promise<PostRow> {
  const supabase = getDbClient();
  const authorUid = post.authorUid || post.author_uid || post.authorId || post.author_id || 'u-system';
  const payload = {
    id: String(post.id || `post_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`),
    author_uid: authorUid,                            // FK → auth.users (required)
    author_id: authorUid,                             // Legacy alias column
    author_name: post.authorName || post.author_name || post.author || 'FR8X Member',
    author_company: post.authorCompany || post.author_company || post.company || 'Enterprise',
    author_avatar: post.authorAvatar || post.author_avatar || null,
    content: post.content || post.text || '',
    media_url: post.mediaUrl || post.media_url || null,
    media_type: post.mediaType || post.media_type || null,
    tags: Array.isArray(post.tags) ? post.tags : [],
    likes_count: Number(post.likesCount || post.likes_count || post.likes) || 0,
    comments_count: Number(post.commentsCount || post.comments_count || post.comments) || 0,
    is_published: post.isPublished !== false,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('posts')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/posts] savePost error:', error.message);
    throw new Error(`Failed to save post: ${error.message}`);
  }
  return data;
}

export async function deletePost(id: string | number): Promise<boolean> {
  const supabase = getDbClient();
  const { error } = await supabase
    .from('posts')
    .delete()
    .eq('id', String(id));

  if (error) {
    console.error('[lib/db/posts] deletePost error:', error.message);
    throw new Error(`Failed to delete post: ${error.message}`);
  }
  return true;
}
