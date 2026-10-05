/**
 * lib/supabase/pagination.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable, Strongly-Typed Pagination Helpers for FR8X.
 * Supports both Offset Pagination and Keyset/Cursor Pagination.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export interface PaginationParams {
  page?: number;
  pageSize?: number;
  cursor?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasMore: boolean;
  nextCursor?: string;
}

/**
 * Calculates SQL range boundaries from page and pageSize.
 */
export function getPaginationRange(page: number = 1, pageSize: number = 20): { from: number; to: number } {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, Math.min(pageSize, 100)); // Cap at 100 items per request
  const from = (safePage - 1) * safeSize;
  const to = from + safeSize - 1;
  return { from, to };
}

/**
 * Wraps raw dataset with structured pagination metadata.
 */
export function buildPaginatedResult<T>(
  data: T[],
  total: number,
  page: number = 1,
  pageSize: number = 20,
  getCursor?: (item: T) => string
): PaginatedResult<T> {
  const totalPages = Math.ceil(total / pageSize) || 1;
  const hasMore = page < totalPages;
  const nextCursor = hasMore && getCursor && data.length > 0 ? getCursor(data[data.length - 1]) : undefined;

  return {
    data,
    total,
    page,
    pageSize,
    totalPages,
    hasMore,
    nextCursor,
  };
}
