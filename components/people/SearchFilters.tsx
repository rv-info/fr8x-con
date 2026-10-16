'use client';

/**
 * SearchFilters — collapsible filter panel for people search.
 * Accessible keyboard navigation, ARIA attributes.
 */

import React, { useState, useCallback } from 'react';
import { SlidersHorizontal, X, ChevronDown, ChevronUp, Search } from 'lucide-react';

export interface PeopleSearchFilters {
  q:        string;
  country?: string;
  city?:    string;
  industry?: string;
  company?: string;
  skills?:  string;
  verified?: boolean;
}

interface SearchFiltersProps {
  filters:   PeopleSearchFilters;
  onChange:  (filters: PeopleSearchFilters) => void;
  disabled?: boolean;
}

const COUNTRIES = [
  'India', 'United States', 'United Kingdom', 'Singapore', 'UAE',
  'Germany', 'China', 'Japan', 'South Korea', 'Australia',
  'Canada', 'Netherlands', 'Hong Kong', 'Malaysia', 'Thailand',
];

const INDUSTRIES = [
  'Freight Forwarding', 'NVOCC', 'Shipping Line', 'Customs Brokerage',
  'Logistics & Supply Chain', 'Warehousing & Distribution', 'Project Cargo',
  'Bulk Cargo', 'Air Freight', 'Cold Chain', 'Trade Finance',
  'Port Operations', 'Ship Broking', 'Insurance',
];

export function SearchFilters({ filters, onChange, disabled = false }: SearchFiltersProps) {
  const [expanded, setExpanded] = useState(false);

  const update = useCallback(
    (patch: Partial<PeopleSearchFilters>) => onChange({ ...filters, ...patch }),
    [filters, onChange]
  );

  const hasActiveFilters =
    filters.country || filters.city || filters.industry ||
    filters.company || filters.skills || filters.verified;

  const clearAll = useCallback(() => {
    onChange({ q: filters.q });
  }, [filters.q, onChange]);

  return (
    <div className="people-search-filters" aria-label="Search filters">
      {/* Main search bar */}
      <div className="people-search-bar-wrap">
        <label htmlFor="people-search-input" className="sr-only">Search people</label>
        <Search size={18} className="people-search-icon" aria-hidden="true" />
        <input
          id="people-search-input"
          type="search"
          className="people-search-input"
          placeholder="Search by name, company, role, skill…"
          value={filters.q}
          onChange={(e) => update({ q: e.target.value })}
          disabled={disabled}
          autoComplete="off"
          aria-label="Search people by name, company, role or skill"
        />
        {filters.q && (
          <button
            className="people-search-clear"
            onClick={() => update({ q: '' })}
            aria-label="Clear search"
            type="button"
          >
            <X size={14} />
          </button>
        )}

        <button
          className={`people-filter-toggle ${expanded ? 'active' : ''} ${hasActiveFilters ? 'has-filters' : ''}`}
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          aria-controls="people-filter-panel"
          type="button"
        >
          <SlidersHorizontal size={15} aria-hidden="true" />
          <span>Filters</span>
          {hasActiveFilters && <span className="filter-count-badge" aria-label="Filters active">●</span>}
          {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Expanded filter panel */}
      {expanded && (
        <div
          id="people-filter-panel"
          className="people-filter-panel"
          role="group"
          aria-label="Advanced filters"
        >
          <div className="people-filter-grid">
            {/* Country */}
            <div className="people-filter-field">
              <label htmlFor="filter-country" className="people-filter-label">Country</label>
              <select
                id="filter-country"
                className="people-filter-select"
                value={filters.country ?? ''}
                onChange={(e) => update({ country: e.target.value || undefined })}
                disabled={disabled}
                aria-label="Filter by country"
              >
                <option value="">All countries</option>
                {COUNTRIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* City */}
            <div className="people-filter-field">
              <label htmlFor="filter-city" className="people-filter-label">City</label>
              <input
                id="filter-city"
                type="text"
                className="people-filter-input"
                placeholder="e.g. Mumbai"
                value={filters.city ?? ''}
                onChange={(e) => update({ city: e.target.value || undefined })}
                disabled={disabled}
                aria-label="Filter by city"
              />
            </div>

            {/* Industry */}
            <div className="people-filter-field">
              <label htmlFor="filter-industry" className="people-filter-label">Industry</label>
              <select
                id="filter-industry"
                className="people-filter-select"
                value={filters.industry ?? ''}
                onChange={(e) => update({ industry: e.target.value || undefined })}
                disabled={disabled}
                aria-label="Filter by industry"
              >
                <option value="">All industries</option>
                {INDUSTRIES.map((i) => (
                  <option key={i} value={i}>{i}</option>
                ))}
              </select>
            </div>

            {/* Company */}
            <div className="people-filter-field">
              <label htmlFor="filter-company" className="people-filter-label">Company</label>
              <input
                id="filter-company"
                type="text"
                className="people-filter-input"
                placeholder="e.g. Maersk"
                value={filters.company ?? ''}
                onChange={(e) => update({ company: e.target.value || undefined })}
                disabled={disabled}
                aria-label="Filter by company name"
              />
            </div>

            {/* Skills */}
            <div className="people-filter-field">
              <label htmlFor="filter-skills" className="people-filter-label">Skills</label>
              <input
                id="filter-skills"
                type="text"
                className="people-filter-input"
                placeholder="e.g. customs, LCL, FCL"
                value={filters.skills ?? ''}
                onChange={(e) => update({ skills: e.target.value || undefined })}
                disabled={disabled}
                aria-label="Filter by skills (comma-separated)"
              />
              <span className="people-filter-hint">Comma-separated</span>
            </div>

            {/* Verified */}
            <div className="people-filter-field people-filter-checkbox">
              <label className="people-filter-check-label">
                <input
                  type="checkbox"
                  className="people-filter-check"
                  checked={filters.verified ?? false}
                  onChange={(e) => update({ verified: e.target.checked || undefined })}
                  disabled={disabled}
                  aria-label="Show only verified business members"
                />
                <span>Verified members only</span>
              </label>
            </div>
          </div>

          {/* Clear filters */}
          {hasActiveFilters && (
            <button
              className="people-filter-clear-btn"
              onClick={clearAll}
              type="button"
              aria-label="Clear all filters"
            >
              <X size={13} /> Clear all filters
            </button>
          )}
        </div>
      )}

      {/* Active filter chips */}
      {hasActiveFilters && !expanded && (
        <div className="people-filter-chips" role="list" aria-label="Active filters">
          {filters.country && (
            <span className="people-filter-chip" role="listitem">
              {filters.country}
              <button onClick={() => update({ country: undefined })} aria-label={`Remove ${filters.country} filter`}>
                <X size={10} />
              </button>
            </span>
          )}
          {filters.city && (
            <span className="people-filter-chip" role="listitem">
              {filters.city}
              <button onClick={() => update({ city: undefined })} aria-label={`Remove ${filters.city} filter`}>
                <X size={10} />
              </button>
            </span>
          )}
          {filters.industry && (
            <span className="people-filter-chip" role="listitem">
              {filters.industry}
              <button onClick={() => update({ industry: undefined })} aria-label={`Remove ${filters.industry} filter`}>
                <X size={10} />
              </button>
            </span>
          )}
          {filters.company && (
            <span className="people-filter-chip" role="listitem">
              {filters.company}
              <button onClick={() => update({ company: undefined })} aria-label={`Remove ${filters.company} filter`}>
                <X size={10} />
              </button>
            </span>
          )}
          {filters.verified && (
            <span className="people-filter-chip" role="listitem">
              Verified only
              <button onClick={() => update({ verified: undefined })} aria-label="Remove verified filter">
                <X size={10} />
              </button>
            </span>
          )}
          <button
            className="people-filter-chip-clear"
            onClick={clearAll}
            type="button"
            aria-label="Clear all filters"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
