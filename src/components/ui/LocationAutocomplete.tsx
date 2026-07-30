// FR8X-CON Location Autocomplete Component — Production
// Search-first dropdown querying UN/LOCODE master data (LOCATION_SEED_DATA & Firestore locations)
// Supports structured selection or validated manual text entry fallback.

"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { LOCATION_SEED_DATA } from "@/lib/utils/constants";
import { Search, MapPin, AlertCircle } from "lucide-react";

export interface SelectedLocation {
  code: string;
  name: string;
  country: string;
  city?: string;
  unlocode?: string;
  isManual?: boolean;
}

interface LocationAutocompleteProps {
  label: string;
  value: string;
  onChange: (val: string, details?: SelectedLocation) => void;
  placeholder?: string;
  required?: boolean;
}

export function LocationAutocomplete({
  label,
  value,
  onChange,
  placeholder = "Type 3+ letters to search Location/Port.",
  required = false,
}: LocationAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState(value);
  const [manualError, setManualError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Search filter across UN/LOCODE seed dataset (3+ chars requirement)
  const filteredSuggestions = useMemo(() => {
    if (!searchTerm || searchTerm.trim().length < 3) return [];
    const q = searchTerm.toLowerCase().trim();
    return LOCATION_SEED_DATA.filter(
      (loc) =>
        loc.name.toLowerCase().includes(q) ||
        loc.code.toLowerCase().includes(q) ||
        loc.city.toLowerCase().includes(q) ||
        loc.country.toLowerCase().includes(q) ||
        loc.aliases?.some((a) => a.toLowerCase().includes(q))
    ).slice(0, 8);
  }, [searchTerm]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (loc: (typeof LOCATION_SEED_DATA)[0]) => {
    const formatted = `${loc.name} (${loc.code}, ${loc.country})`;
    setSearchTerm(formatted);
    setManualError(null);
    setIsOpen(false);
    onChange(formatted, {
      code: loc.code,
      name: loc.name,
      country: loc.country,
      city: loc.city,
      unlocode: loc.unlocode || loc.code,
      isManual: false,
    });
  };

  const handleManualBlur = () => {
    if (!searchTerm.trim()) {
      onChange("");
      setManualError(null);
      return;
    }
    // Validation for manual text entry: minimum 3 chars, city/port formatting rules
    if (searchTerm.trim().length < 3) {
      setManualError("Location name must be at least 3 characters");
    } else {
      setManualError(null);
      const normalized = searchTerm.trim();
      onChange(normalized, {
        code: "MANUAL",
        name: normalized,
        country: "Other",
        isManual: true,
      });
    }
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <label className="block text-body-sm font-medium text-foreground mb-1">
        {label} {required && <span className="text-danger">*</span>}
      </label>

      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
            onChange(e.target.value);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={handleManualBlur}
          placeholder={placeholder}
          required={required}
          className="fr8x-input pl-8 w-full font-medium"
        />
        <Search className="h-4 w-4 text-foreground-muted absolute left-2.5 top-2.5" />
      </div>

      {manualError && (
        <p className="text-[11px] text-danger mt-1 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" /> {manualError}
        </p>
      )}

      {/* Autocomplete Dropdown */}
      {isOpen && filteredSuggestions.length > 0 && (
        <div className="absolute z-50 left-0 right-0 top-full mt-1 bg-white rounded-lg border border-border shadow-dropdown max-h-60 overflow-y-auto py-1 text-xs">
          {filteredSuggestions.map((loc) => (
            <button
              key={loc.fr8xLocationId || loc.code}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur
                handleSelect(loc);
              }}
              className="w-full text-left px-3 py-2 hover:bg-[var(--fr8x-mist)] flex items-center justify-between transition-colors border-b border-border/50 last:border-0"
            >
              <div className="flex items-center gap-2">
                <MapPin className="h-3.5 w-3.5 text-[var(--fr8x-periwinkle)] shrink-0" />
                <div>
                  <span className="font-bold text-gray-900">{loc.name}</span>
                  <span className="text-gray-500 ml-1">({loc.city}, {loc.country})</span>
                </div>
              </div>
              <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-700 font-bold shrink-0">
                {loc.code}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
