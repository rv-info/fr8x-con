// FR8X-CON Autocomplete Location Search Input
// Standardized format, 3-character trigger, top 5 results list, parallel queries, and caching.

"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Anchor, Plane, Compass, X } from "lucide-react";
import { COLLECTIONS } from "@/lib/utils/constants";
import { queryDocuments, where, limit } from "@/lib/firebase/firestore";

interface LocationDoc {
  id: string;
  code: string;
  name: string;
  country: string;
  countryCode: string;
  type: "sea" | "air" | "icd" | "dry" | "rail";
  postalCode?: string;
  status: "active" | "disabled";
  coordinates?: string;
}

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string, locationObj?: LocationDoc) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  isPlaceOfReceiptOrDelivery?: boolean; // if true, appends postalCode
}

// In-memory cache for query results
const queryCache = new Map<string, LocationDoc[]>();

export default function LocationSearchInput({
  value,
  onChange,
  placeholder = "Search location...",
  className = "",
  label,
  isPlaceOfReceiptOrDelivery = false,
}: LocationSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal query with parent value on initial load / parent changes
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = async (searchVal: string) => {
    const trimmed = searchVal.trim().toUpperCase();
    if (trimmed.length < 3) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    // 1. Check cache first
    if (queryCache.has(trimmed)) {
      setResults(queryCache.get(trimmed) || []);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      // 2. Query Firestore by Code Prefix and Name Prefix
      // Because Firestore does not support OR across different fields with prefix matches directly in client SDK,
      // we query both collections in parallel and merge results.
      
      const codeQueryPromise = queryDocuments<LocationDoc>(COLLECTIONS.LOCATIONS, [
        where("code", ">=", trimmed),
        where("code", "<=", trimmed + "\uf8ff"),
        where("status", "==", "active"),
        limit(10),
      ]);

      const nameQueryPromise = queryDocuments<LocationDoc>(COLLECTIONS.LOCATIONS, [
        where("name", ">=", searchVal.trim()), // Case sensitive prefix helper
        where("name", "<=", searchVal.trim() + "\uf8ff"),
        where("status", "==", "active"),
        limit(10),
      ]);

      const [codeRes, nameRes] = await Promise.all([codeQueryPromise, nameQueryPromise]);

      // Merge and remove duplicates
      const mergedMap = new Map<string, LocationDoc>();
      codeRes.forEach((loc) => mergedMap.set(loc.id, loc));
      nameRes.forEach((loc) => mergedMap.set(loc.id, loc));
      
      const mergedList = Array.from(mergedMap.values());

      // 3. Prioritization Sorting:
      // - Exact code match
      // - Exact prefix code match
      // - Name starts with query
      // - Country relevance / others
      mergedList.sort((a, b) => {
        const aCode = a.code.toUpperCase();
        const bCode = b.code.toUpperCase();
        const aName = a.name.toUpperCase();
        const bName = b.name.toUpperCase();

        if (aCode === trimmed) return -1;
        if (bCode === trimmed) return 1;

        if (aCode.startsWith(trimmed) && !bCode.startsWith(trimmed)) return -1;
        if (!aCode.startsWith(trimmed) && bCode.startsWith(trimmed)) return 1;

        if (aName.startsWith(trimmed) && !bName.startsWith(trimmed)) return -1;
        if (!aName.startsWith(trimmed) && bName.startsWith(trimmed)) return 1;

        return aCode.localeCompare(bCode);
      });

      // Slice to top 5 results
      const finalResults = mergedList.slice(0, 5);

      // Save to cache
      queryCache.set(trimmed, finalResults);
      setResults(finalResults);
    } catch (err) {
      console.error("Location search query error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== value) {
        performSearch(query);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, value]);

  const handleSelect = (loc: LocationDoc) => {
    // Standard format display value: "CODE"
    onChange(loc.code, loc);
    setQuery(loc.code);
    setIsOpen(false);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "sea":
        return <Anchor className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
      case "air":
        return <Plane className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
      default:
        return <Compass className="h-3.5 w-3.5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full text-left">
      {label && <label className="fr8x-label block mb-1">{label}</label>}
      <div className="relative">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            if (!e.target.value.trim()) {
              onChange("");
            }
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`fr8x-input pl-8.5 pr-8.5 ${className}`}
        />
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted pointer-events-none" />
        
        {isLoading && (
          <Loader2 className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-[var(--fr8x-periwinkle)]" />
        )}

        {query && !isLoading && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onChange("");
              setResults([]);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-foreground-muted hover:text-foreground hover:bg-slate-100 rounded"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && query.trim().length >= 3 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-[220px] overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
          {results.length === 0 && !isLoading ? (
            <div className="p-3 text-[10px] text-foreground-muted text-center italic">
              No matching verified locations found.
            </div>
          ) : (
            results.map((loc) => {
              // Standardized format:
              // Line 1: Port Code
              // Line 2: Port Name, Country (+ PIN if POR/FPOD and postal code is available)
              const postalDisplay = isPlaceOfReceiptOrDelivery && loc.postalCode ? ` (${loc.postalCode})` : "";
              
              return (
                <button
                  key={loc.id}
                  type="button"
                  onClick={() => handleSelect(loc)}
                  className="w-full text-left p-2 hover:bg-slate-50 transition-colors flex items-start gap-2.5"
                >
                  <div className="mt-0.5">{getIcon(loc.type)}</div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold text-[var(--fr8x-periwinkle)] font-mono leading-none">
                      {loc.code}
                    </p>
                    <p className="text-[9.5px] text-[var(--fr8x-jet)] font-semibold truncate mt-0.5">
                      {loc.name}, {loc.country}{postalDisplay}
                    </p>
                  </div>
                  <span className="text-[7.5px] uppercase tracking-wider font-extrabold text-foreground-muted ml-auto bg-slate-100 px-1 py-0.2 rounded shrink-0">
                    {loc.type}
                  </span>
                </button>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
