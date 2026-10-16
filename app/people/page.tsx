'use client';

/**
 * /people — Professional People Search page.
 *
 * Features:
 * - Debounced full-text + fuzzy search
 * - Filter panel: country, city, industry, company, skills, verified
 * - Cursor-based infinite scroll pagination
 * - Card / list view toggle
 * - Keyboard accessible (results announce count to screen readers)
 * - Empty, loading, error, and no-criteria states
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { LayoutGrid, List, Users } from 'lucide-react';
import { SearchFilters, PeopleSearchFilters } from '@/components/people/SearchFilters';
import { PersonCard, PersonCardSkeleton, PersonCardData } from '@/components/people/PersonCard';
import { ConnectionStatus } from '@/components/people/ConnectionButton';

const DEBOUNCE_MS = 350;
const PAGE_SIZE   = 20;

type ViewMode = 'card' | 'list';

interface SearchResponse {
  success:    boolean;
  results:    PersonCardData[];
  count:      number;
  hasMore:    boolean;
  nextCursor: string | null;
  error?:     string;
  code?:      string;
}

function buildSearchUrl(filters: PeopleSearchFilters, cursor?: string, limit = PAGE_SIZE): string {
  const p = new URLSearchParams();
  if (filters.q.trim())    p.set('q',        filters.q.trim());
  if (filters.country)     p.set('country',  filters.country);
  if (filters.city)        p.set('city',     filters.city);
  if (filters.industry)    p.set('industry', filters.industry);
  if (filters.company)     p.set('company',  filters.company);
  if (filters.skills)      p.set('skills',   filters.skills);
  if (filters.verified)    p.set('verified', 'true');
  p.set('limit', String(limit));
  if (cursor) p.set('cursor', cursor);
  return `/api/people/search?${p.toString()}`;
}

// ── Skeleton grid / list ───────────────────────────────────────────────────────
function SkeletonResults({ count, view }: { count: number; view: ViewMode }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <PersonCardSkeleton key={i} view={view} />
      ))}
    </>
  );
}

export default function PeoplePage() {
  const [filters, setFilters]      = useState<PeopleSearchFilters>({ q: '' });
  const [view, setView]            = useState<ViewMode>('card');
  const [results, setResults]      = useState<PersonCardData[]>([]);
  const [loading, setLoading]      = useState(false);
  const [loadingMore, setLoadMore] = useState(false);
  const [error, setError]          = useState<string | null>(null);
  const [hasMore, setHasMore]      = useState(false);
  const [cursor, setCursor]        = useState<string | null>(null);
  const [total, setTotal]          = useState<number | null>(null);
  const [searched, setSearched]    = useState(false);

  const debounceRef  = useRef<ReturnType<typeof setTimeout> | null>(null);
  const abortRef     = useRef<AbortController | null>(null);
  const loadMoreRef  = useRef<HTMLDivElement | null>(null);

  // Determine if there's enough criteria to actually search
  const hasCriteria = useMemo(() => {
    return (
      filters.q.trim().length >= 2 ||
      !!filters.country || !!filters.city || !!filters.industry ||
      !!filters.company || !!filters.skills || !!filters.verified
    );
  }, [filters]);

  // Core search function
  const doSearch = useCallback(async (searchFilters: PeopleSearchFilters, append = false) => {
    if (!hasCriteria && !append) {
      setResults([]);
      setSearched(false);
      return;
    }

    // Cancel any in-flight request
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    if (!append) {
      setLoading(true);
      setCursor(null);
    } else {
      setLoadMore(true);
    }
    setError(null);

    try {
      const url = buildSearchUrl(
        searchFilters,
        append ? (cursor ?? undefined) : undefined
      );

      const res = await fetch(url, {
        signal: abortRef.current.signal,
        headers: { 'Accept': 'application/json' },
      });

      const data: SearchResponse = await res.json();

      if (!res.ok || !data.success) {
        if (data.code === 'NO_SEARCH_CRITERIA') {
          setSearched(false);
          setResults([]);
        } else {
          setError(data.error ?? 'Search failed. Please try again.');
        }
        return;
      }

      const rows = (data.results ?? []).map((r) => ({
        ...r,
        connection_status: (r.connection_status ?? 'none') as ConnectionStatus,
        skills: Array.isArray(r.skills)
          ? r.skills
          : (r.skills && typeof r.skills === 'object')
            ? Object.values(r.skills as object)
            : [],
      }));

      if (append) {
        setResults((prev) => [...prev, ...rows]);
      } else {
        setResults(rows);
        setTotal(data.count);
        setSearched(true);
      }

      setHasMore(data.hasMore);
      setCursor(data.nextCursor);
    } catch (e: unknown) {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setError('Search failed. Please try again.');
    } finally {
      setLoading(false);
      setLoadMore(false);
    }
  }, [cursor, hasCriteria]);

  // Debounced search trigger
  const handleFiltersChange = useCallback((newFilters: PeopleSearchFilters) => {
    setFilters(newFilters);

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      doSearch(newFilters, false);
    }, DEBOUNCE_MS);
  }, [doSearch]);

  // Infinite scroll observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          doSearch(filters, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadingMore, filters, doSearch]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current)  clearTimeout(debounceRef.current);
      if (abortRef.current)     abortRef.current.abort();
    };
  }, []);

  const showSkeletons  = loading  && results.length === 0;
  const showEmpty      = searched && !loading && results.length === 0 && !error;
  const showNoCriteria = !searched && !loading && results.length === 0 && !hasCriteria;

  return (
    <div className="people-page">
      {/* Page header */}
      <div className="people-page-header">
        <div className="people-page-title-wrap">
          <Users size={22} aria-hidden="true" className="people-page-icon" />
          <div>
            <h1 className="people-page-title">People</h1>
            <p className="people-page-subtitle">
              Find and connect with freight professionals worldwide.
            </p>
          </div>
        </div>

        {/* View toggle */}
        <div className="people-view-toggle" role="group" aria-label="Results view">
          <button
            className={`people-view-btn ${view === 'card' ? 'active' : ''}`}
            onClick={() => setView('card')}
            aria-pressed={view === 'card'}
            aria-label="Card view"
          >
            <LayoutGrid size={16} />
          </button>
          <button
            className={`people-view-btn ${view === 'list' ? 'active' : ''}`}
            onClick={() => setView('list')}
            aria-pressed={view === 'list'}
            aria-label="List view"
          >
            <List size={16} />
          </button>
        </div>
      </div>

      {/* Search + Filters */}
      <SearchFilters
        filters={filters}
        onChange={handleFiltersChange}
        disabled={loading}
      />

      {/* Live region for screen readers */}
      <div aria-live="polite" aria-atomic="true" className="sr-only">
        {loading && 'Searching…'}
        {searched && !loading && results.length > 0 && `${results.length} result${results.length !== 1 ? 's' : ''} found.`}
        {showEmpty && 'No results found. Try adjusting your search.'}
      </div>

      {/* Results count */}
      {searched && !loading && results.length > 0 && (
        <p className="people-results-count" aria-live="off">
          {results.length}{hasMore ? '+' : ''} result{results.length !== 1 ? 's' : ''}
          {filters.q.trim() ? ` for "${filters.q.trim()}"` : ''}
        </p>
      )}

      {/* Error state */}
      {error && (
        <div className="people-error-banner" role="alert">
          <p>{error}</p>
          <button onClick={() => doSearch(filters, false)} className="people-retry-btn">
            Retry
          </button>
        </div>
      )}

      {/* No criteria state */}
      {showNoCriteria && (
        <div className="people-empty-state" aria-label="Start searching">
          <div className="people-empty-icon" aria-hidden="true">🔍</div>
          <h2 className="people-empty-title">Find freight professionals</h2>
          <p className="people-empty-body">
            Search by name, company, designation, skill, or location to discover
            verified freight professionals and connect with them.
          </p>
        </div>
      )}

      {/* Loading skeletons */}
      {showSkeletons && (
        <div
          className={view === 'card' ? 'people-grid' : 'people-list'}
          aria-label="Loading results"
          aria-busy="true"
        >
          <SkeletonResults count={PAGE_SIZE} view={view} />
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div
          className={view === 'card' ? 'people-grid' : 'people-list'}
          aria-label="Search results"
        >
          {results.map((person) => (
            <PersonCard
              key={person.id}
              person={person}
              view={view}
            />
          ))}

          {/* Inline loading more skeletons */}
          {loadingMore && <SkeletonResults count={4} view={view} />}
        </div>
      )}

      {/* Empty state after search */}
      {showEmpty && (
        <div className="people-empty-state" aria-label="No results">
          <div className="people-empty-icon" aria-hidden="true">👤</div>
          <h2 className="people-empty-title">No professionals found</h2>
          <p className="people-empty-body">
            Try a different name, company, or remove some filters.
          </p>
        </div>
      )}

      {/* Load more trigger (infinite scroll sentinel) */}
      {hasMore && !loadingMore && (
        <div
          ref={loadMoreRef}
          className="people-load-more-sentinel"
          aria-hidden="true"
          style={{ height: 40 }}
        />
      )}

      {/* No more results */}
      {searched && !hasMore && results.length > 0 && !loading && (
        <p className="people-end-of-results" aria-live="off">
          All results shown
        </p>
      )}
    </div>
  );
}
