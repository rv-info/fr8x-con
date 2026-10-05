/**
 * lib/db/reviews.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Authoritative Supabase PostgreSQL Database Module for Company Ratings & Reviews.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { getDbClient } from '@/lib/supabase/server';
import { ReviewRow } from '@/lib/supabase/types';

export async function getReviews(companyId: string): Promise<ReviewRow[]> {
  const supabase = getDbClient();
  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('target_company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[lib/db/reviews] getReviews error:', error.message);
    throw new Error(`Failed to get reviews: ${error.message}`);
  }
  return data || [];
}

export async function saveReview(review: any): Promise<ReviewRow> {
  const supabase = getDbClient();
  const payload = {
    id: review.id || `rev_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    target_company_id: review.targetCompanyId || review.target_company_id,
    reviewer_id: review.reviewerId || review.reviewer_id || null,
    reviewer_name: review.reviewerName || review.reviewer_name || 'Anonymous',
    reviewer_company: review.reviewerCompany || review.reviewer_company || null,
    rating: Math.max(1, Math.min(5, Number(review.rating) || 5)),
    comment: review.comment || '',
  };

  const { data, error } = await supabase
    .from('reviews')
    .upsert(payload, { onConflict: 'id' })
    .select()
    .single();

  if (error) {
    console.error('[lib/db/reviews] saveReview error:', error.message);
    throw new Error(`Failed to save review: ${error.message}`);
  }
  return data;
}
