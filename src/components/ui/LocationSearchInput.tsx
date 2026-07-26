// FR8X-CON Autocomplete Location Search Input
// Standardized format, 2-3 character trigger, keyboard navigation, parallel queries, local recents/favorites, and caching.

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
  Star,
  History,
  Shield,
  HelpCircle,
} from "lucide-react";

interface LocationDoc {
  id: string;
  code: string;
  name: string;
  country: string;
  countryCode: string;
  type: string;
  postalCode?: string;
  status: "active" | "disabled";
  coordinates?: string;
  state?: string;
  city?: string;
}

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string, locationObj?: LocationDoc) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  isPlaceOfReceiptOrDelivery?: boolean; // if true, appends postalCode
  mode?: string; // active transport mode (fcl, lcl, air, road, rail, multimodal)
}

// In-memory cache for query results on the client side
const queryCache = new Map<string, LocationDoc[]>();

export default function LocationSearchInput({
  value,
  onChange,
  placeholder = "Search location...",
  className = "",
  label,
  isPlaceOfReceiptOrDelivery = false,
  mode = "multimodal",
}: LocationSearchInputProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<LocationDoc[]>([]);
  const [favorites, setFavorites] = useState<LocationDoc[]>([]);
  const [recents, setRecents] = useState<LocationDoc[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Sync internal query state with parent value prop
  useEffect(() => {
    setQuery(value);
  }, [value]);

  // Load favorites and recently used locations on mount & when dropdown opens
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        const savedFavs = localStorage.getItem("fr8x_favorite_locations");
        if (savedFavs) setFavorites(JSON.parse(savedFavs));

        const savedRecents = localStorage.getItem("fr8x_recent_locations");
        if (savedRecents) setRecents(JSON.parse(savedRecents));
      } catch (err) {
        console.error("Failed to load local storage locations:", err);
      }
    }
  }, [isOpen]);

  // Click outside listener to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setFocusedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const performSearch = async (searchVal: string) => {
    const trimmed = searchVal.trim().toUpperCase();
    if (trimmed.length < 2) {
      setResults([]);
      setIsLoading(false);
      return;
    }

    const cacheKey = `${trimmed}_${mode}`;
    // Check client-side query cache first
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
      if (data.success) {
        queryCache.set(cacheKey, data.results);
        setResults(data.results);
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

  // Debounced search trigger
  useEffect(() => {
    const timer = setTimeout(() => {
      if (query !== value) {
        performSearch(query);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query, value, mode]);

  const handleSelect = (loc: LocationDoc) => {
    // 1. Add to recently used locations (local storage cache)
    try {
      const savedRecents = localStorage.getItem("fr8x_recent_locations");
      let recentList: LocationDoc[] = savedRecents ? JSON.parse(savedRecents) : [];
      recentList = recentList.filter((item) => item.id !== loc.id);
      recentList.unshift(loc);
      recentList = recentList.slice(0, 5); // store top 5
      localStorage.setItem("fr8x_recent_locations", JSON.stringify(recentList));
      setRecents(recentList);
    } catch (err) {
      console.error("Error saving recent location:", err);
    }

    // 2. Increment search frequency in database asynchronously
    fetch("/api/locations/increment-frequency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ locationId: loc.id }),
    }).catch((err) => console.error("Error incrementing popularity:", err));

    onChange(loc.code, loc);
    setQuery(loc.code);
    setIsOpen(false);
    setFocusedIndex(-1);
  };

  const toggleFavorite = (e: React.MouseEvent, loc: LocationDoc) => {
    e.stopPropagation(); // Prevent selecting the location on star click
    try {
      const savedFavs = localStorage.getItem("fr8x_favorite_locations");
      let favList: LocationDoc[] = savedFavs ? JSON.parse(savedFavs) : [];
      const exists = favList.some((item) => item.id === loc.id);

      if (exists) {
        favList = favList.filter((item) => item.id !== loc.id);
      } else {
        favList.push(loc);
      }

      localStorage.setItem("fr8x_favorite_locations", JSON.stringify(favList));
      setFavorites(favList);
    } catch (err) {
      console.error("Error updating favorite locations:", err);
    }
  };

  // Keyboard navigation handler
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "ArrowUp") {
        setIsOpen(true);
      }
      return;
    }

    const activeList = !query.trim() ? [...favorites, ...recents] : results;
    if (activeList.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev + 1) % activeList.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedIndex((prev) => (prev - 1 + activeList.length) % activeList.length);
    } else if (e.key === "Enter") {
      if (focusedIndex >= 0 && focusedIndex < activeList.length) {
        e.preventDefault();
        const selectedLoc = activeList[focusedIndex];
        if (selectedLoc) {
          handleSelect(selectedLoc);
        }
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setFocusedIndex(-1);
    }
  };

  // Get custom Lucide icon matching the facility type
  const getIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case "sea":
        return <Anchor className="h-3.5 w-3.5 text-blue-500 shrink-0" />;
      case "air":
      case "air_terminal":
        return <Plane className="h-3.5 w-3.5 text-amber-500 shrink-0" />;
      case "rail":
        return <Train className="h-3.5 w-3.5 text-indigo-500 shrink-0" />;
      case "icd":
      case "cfs":
        return <Boxes className="h-3.5 w-3.5 text-orange-500 shrink-0" />;
      case "warehouse":
      case "distribution_center":
        return <Building className="h-3.5 w-3.5 text-emerald-500 shrink-0" />;
      case "city":
      case "customer_location":
        return <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />;
      case "border_crossing":
        return <Shield className="h-3.5 w-3.5 text-teal-500 shrink-0" />;
      default:
        return <Compass className="h-3.5 w-3.5 text-slate-500 shrink-0" />;
    }
  };

  // Render a dropdown suggestion row
  const renderRow = (loc: LocationDoc, index: number) => {
    const isFav = favorites.some((f) => f.id === loc.id);
    const postalDisplay = isPlaceOfReceiptOrDelivery && loc.postalCode ? ` (${loc.postalCode})` : "";
    const isFocused = index === focusedIndex;

    return (
      <div
        key={loc.id}
        onClick={() => handleSelect(loc)}
        onMouseEnter={() => setFocusedIndex(index)}
        className={`w-full text-left p-2 transition-colors flex items-start gap-2.5 cursor-pointer ${
          isFocused ? "bg-slate-50" : ""
        }`}
      >
        <div className="mt-0.5">{getIcon(loc.type)}</div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-[var(--fr8x-periwinkle)] font-mono leading-none">
              {loc.code}
            </span>
            <span className="text-[7.5px] uppercase tracking-wider font-extrabold text-foreground-muted bg-slate-100 px-1 py-0.2 rounded">
              {loc.type}
            </span>
          </div>
          <p className="text-[9.5px] text-[var(--fr8x-jet)] font-semibold truncate mt-1">
            {loc.name}, {loc.country}{postalDisplay}
          </p>
        </div>
        <button
          type="button"
          onClick={(e) => toggleFavorite(e, loc)}
          className="p-0.5 hover:bg-slate-200/60 rounded transition-colors text-amber-400 self-center"
          title={isFav ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Star
            className={`h-3.5 w-3.5 ${
              isFav ? "fill-amber-400 text-amber-400" : "text-slate-300 hover:text-amber-400"
            }`}
          />
        </button>
      </div>
    );
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
          onKeyDown={handleKeyDown}
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
              setFocusedIndex(-1);
            }}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-foreground-muted hover:text-foreground hover:bg-slate-100 rounded"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded shadow-lg max-h-[240px] overflow-y-auto divide-y divide-slate-100 animate-fadeIn">
          {!query.trim() ? (
            favorites.length === 0 && recents.length === 0 ? (
              <div className="p-3 text-[10px] text-foreground-muted text-center italic">
                Type to search verified international locations.
              </div>
            ) : (
              <div className="flex flex-col">
                {favorites.length > 0 && (
                  <div className="py-1">
                    <div className="px-2 py-0.5 text-[8px] font-extrabold text-amber-600 uppercase bg-amber-50/50 flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Favorites
                    </div>
                    {favorites.map((loc, idx) => renderRow(loc, idx))}
                  </div>
                )}
                {recents.length > 0 && (
                  <div className="py-1">
                    <div className="px-2 py-0.5 text-[8px] font-extrabold text-foreground-muted uppercase bg-slate-50 flex items-center gap-1">
                      <History className="h-3 w-3 text-slate-400" /> Recently Used
                    </div>
                    {recents.map((loc, idx) => renderRow(loc, idx + favorites.length))}
                  </div>
                )}
              </div>
            )
          ) : results.length === 0 && !isLoading ? (
            <div className="p-3 text-[10px] text-foreground-muted text-center italic">
              No matching verified locations found.
            </div>
          ) : (
            results.map((loc, idx) => renderRow(loc, idx))
          )}
        </div>
      )}
    </div>
  );
}
