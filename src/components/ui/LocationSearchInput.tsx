// FR8X-CON Autocomplete Location Search Input
// Clean, direct typing, code-first formatting, auto-resolving on blur, and keyboard navigation.
"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Loader2,
  Anchor,
  Plane,
  Compass,
  X,
  Train,
  MapPin,
  Building,
  Boxes,
  Clock,
} from "lucide-react";
import { LocationDoc } from "@/lib/types/location";

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string, locationObj?: LocationDoc) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  isPlaceOfReceiptOrDelivery?: boolean;
  mode?: string;
}

const queryCache = new Map<string, LocationDoc[]>();

export default function LocationSearchInput({
  value,
  onChange,
  placeholder = "Search location...",
  className = "",
  label,
  mode = "multimodal",
}: LocationSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal state with prop changes
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Click outside to close dropdown and auto-resolve
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        resolveOnBlur();
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [query, results]);

  const performSearch = async (searchVal: string) => {
    const trimmed = searchVal.trim();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const cacheKey = `${trimmed}_${mode}`;
    if (queryCache.has(cacheKey)) {
      setResults(queryCache.get(cacheKey) || []);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const modeParam = mode ? `&mode=${encodeURIComponent(mode)}` : "";
      const res = await fetch(`/api/locations/search?q=${encodeURIComponent(trimmed)}` + modeParam);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        queryCache.set(cacheKey, data.data);
        setResults(data.data);
      } else {
        setResults([]);
      }
    } catch (err) {
      console.error("Location search API error:", err);
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== value) {
        performSearch(query);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, value, mode]);

  const handleSelect = (loc: LocationDoc) => {
    const code = loc.code || loc.unlocode || loc.iataCode || "LOC";
    // Code-first formatting: "INNSA - Nhava Sheva Port (Mumbai, India)"
    const displayName = `${code.toUpperCase()} - ${loc.name} (${loc.city}, ${loc.country})`;
    setQuery(displayName);
    onChange(displayName, loc);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  // Auto-resolve typed input if it matches any code or name in suggestions
  const resolveOnBlur = () => {
    if (results.length > 0 && query.trim() !== "") {
      const qLower = query.trim().toLowerCase();
      // Try to find exact code match first
      const exactCodeMatch = results.find(
        (r) =>
          (r.code || "").toLowerCase() === qLower ||
          (r.unlocode || "").toLowerCase() === qLower ||
          (r.iataCode || "").toLowerCase() === qLower
      );

      if (exactCodeMatch) {
        handleSelect(exactCodeMatch);
        return;
      }

      // Fallback to auto-selecting the first suggestion if query is a prefix of its code or name
      const first = results[0];
      if (first) {
        const firstName = first.name.toLowerCase();
        const firstCode = (first.code || "").toLowerCase();
        if (
          firstCode.startsWith(qLower) ||
          firstName.startsWith(qLower) ||
          firstName.includes(qLower)
        ) {
          handleSelect(first);
        }
      }
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen) {
      if (e.key === "ArrowDown") {
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setFocusedIndex((prev) => (prev + 1 < results.length ? prev + 1 : 0));
        break;
      case "ArrowUp":
        e.preventDefault();
        setFocusedIndex((prev) => (prev - 1 >= 0 ? prev - 1 : results.length - 1));
        break;
      case "Enter":
        e.preventDefault();
        if (focusedIndex >= 0 && focusedIndex < results.length) {
          const selectedLoc = results[focusedIndex];
          if (selectedLoc) handleSelect(selectedLoc);
        } else if (results.length > 0) {
          const selectedLoc = results[0];
          if (selectedLoc) handleSelect(selectedLoc);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setFocusedIndex(-1);
        break;
      case "Tab":
        resolveOnBlur();
        setIsOpen(false);
        break;
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "sea": return <Anchor className="w-3.5 h-3.5 text-blue-600" />;
      case "air": return <Plane className="w-3.5 h-3.5 text-indigo-600" />;
      case "rail": return <Train className="w-3.5 h-3.5 text-amber-600" />;
      case "road": return <MapPin className="w-3.5 h-3.5 text-emerald-600" />;
      case "icd": return <Building className="w-3.5 h-3.5 text-purple-600" />;
      case "cfs": return <Boxes className="w-3.5 h-3.5 text-orange-600" />;
      default: return <Compass className="w-3.5 h-3.5 text-gray-500" />;
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={wrapperRef}>
      {label && <label className="block text-[11px] font-medium text-[var(--fr8x-jet)] mb-1">{label}</label>}

      <div className="relative flex items-center">
        <input
          type="text"
          value={query}
          onChange={(e) => {
            const val = e.target.value;
            setQuery(val);
            onChange(val);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="fr8x-input pl-7 pr-8 py-1.5 text-xs text-[var(--fr8x-jet)] placeholder:text-gray-400 bg-white border border-[var(--fr8x-lavender)] rounded focus:outline-none focus:border-[var(--fr8x-periwinkle)] transition-colors w-full"
        />

        <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 pointer-events-none" />

        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 text-[var(--fr8x-periwinkle)] animate-spin absolute right-2.5" />
        ) : query ? (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              onChange("");
              setResults([]);
            }}
            className="absolute right-2.5 text-gray-400 hover:text-gray-600"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        ) : null}
      </div>

      {/* Autocomplete Suggestions Dropdown */}
      {isOpen && results.length > 0 && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto text-xs">
          {results.map((loc, idx) => (
            <div
              key={loc.id || idx}
              onClick={() => handleSelect(loc)}
              className={`px-3 py-2 cursor-pointer border-b border-gray-100 flex items-center justify-between hover:bg-[var(--fr8x-mist)] ${
                idx === focusedIndex ? "bg-[var(--fr8x-mist)]" : ""
              }`}
            >
              <div className="flex items-center space-x-2 overflow-hidden">
                <span className="shrink-0">{getIcon(loc.type)}</span>
                <div className="truncate">
                  <div className="font-medium text-gray-900 truncate flex items-center gap-1.5">
                    <span className="font-mono font-bold text-[var(--fr8x-periwinkle)]">
                      {loc.code || loc.unlocode || loc.iataCode}
                    </span>
                    <span className="text-gray-400">|</span>
                    <span>{loc.name}</span>
                    {loc.status === "pending_verification" && (
                      <span className="bg-amber-100 text-amber-800 text-[9px] px-1 rounded font-normal flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> Pending
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-gray-500 truncate pl-1">
                    {loc.city}, {loc.country}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
