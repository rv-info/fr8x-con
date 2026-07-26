// FR8X-CON Autocomplete Location Search Input with Manual Location Unblocking & MDM
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
  PlusCircle,
  AlertCircle,
  CheckCircle2,
  Clock,
} from "lucide-react";
import { LocationDoc, TransportMode, LocationType } from "@/lib/types/location";

interface LocationSearchInputProps {
  value: string;
  onChange: (value: string, locationObj?: LocationDoc) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  isPlaceOfReceiptOrDelivery?: boolean;
  mode?: string;
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
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [focusedIndex, setFocusedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Manual Creation Modal state
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualName, setManualName] = useState("");
  const [manualCity, setManualCity] = useState("");
  const [manualCountry, setManualCountry] = useState("India");
  const [manualType, setManualType] = useState<LocationType>("sea");
  const [manualUnlocode, setManualUnlocode] = useState("");
  const [manualIata, setManualIata] = useState("");
  const [isSubmittingManual, setIsSubmittingManual] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);

  // Sync internal query state with parent value prop
  useEffect(() => {
    setQuery(value);
  }, [value]);

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
    const displayName = `${loc.name} (${loc.code || loc.unlocode || loc.iataCode || "LOC"}) - ${loc.city || ""}, ${loc.country}`;
    setQuery(displayName);
    onChange(displayName, loc);
    setIsOpen(false);
  };

  const handleOpenManualModal = () => {
    setManualName(query);
    setManualCity("");
    setManualCountry("India");
    setDuplicateWarning(null);
    setShowManualModal(true);
    setIsOpen(false);
  };

  const handleCheckDuplicates = async () => {
    if (!manualName || !manualCity) return;

    try {
      const res = await fetch("/api/locations/check-duplicate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualName,
          city: manualCity,
          country: manualCountry,
          unlocode: manualUnlocode,
          iataCode: manualIata,
        }),
      });
      const data = await res.json();
      if (data.hasDuplicate && data.duplicates.length > 0) {
        const dup = data.duplicates[0];
        setDuplicateWarning(`Warning: Similar location "${dup.name}" (${dup.city}, ${dup.country}) already exists.`);
      } else {
        setDuplicateWarning(null);
      }
    } catch (err) {
      console.error("Duplicate check failed:", err);
    }
  };

  const handleSubmitManual = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualName || !manualCity || !manualCountry) return;

    setIsSubmittingManual(true);
    try {
      const res = await fetch("/api/locations/create-manual", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: manualName,
          city: manualCity,
          country: manualCountry,
          type: manualType,
          transportModes: [mode || "multimodal"],
          unlocode: manualUnlocode,
          iataCode: manualIata,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        handleSelect(data.data);
        setShowManualModal(false);
      } else {
        alert(data.error || "Failed to add manual location");
      }
    } catch (err) {
      console.error("Error creating manual location:", err);
      alert("Error submitting manual location");
    } finally {
      setIsSubmittingManual(false);
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
            setQuery(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
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

      {/* Autocomplete Dropdown */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-64 overflow-y-auto text-xs">
          {results.length > 0 ? (
            <div>
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
                        {loc.name}
                        {loc.status === "pending_verification" && (
                          <span className="bg-amber-100 text-amber-800 text-[9px] px-1 rounded font-normal flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> Pending
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-gray-500 truncate">
                        {loc.city}, {loc.country} {loc.unlocode ? `[UN: ${loc.unlocode}]` : loc.iataCode ? `[IATA: ${loc.iataCode}]` : ""}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono font-semibold text-[var(--fr8x-periwinkle)] shrink-0 ml-2">
                    {loc.code || loc.unlocode || loc.iataCode}
                  </span>
                </div>
              ))}
            </div>
          ) : !isLoading && query.trim().length >= 2 ? (
            <div className="p-3 text-center text-gray-500">
              <p className="text-[11px] mb-2">No matching master location found.</p>
              <button
                type="button"
                onClick={handleOpenManualModal}
                className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--fr8x-periwinkle)] hover:underline"
              >
                <PlusCircle className="w-3.5 h-3.5" /> Location Not Found? Add Manually
              </button>
            </div>
          ) : null}

          {/* Always available bottom option */}
          {results.length > 0 && (
            <div className="p-1.5 bg-gray-50 border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={handleOpenManualModal}
                className="text-[10px] font-medium text-[var(--fr8x-periwinkle)] hover:underline flex items-center justify-center gap-1 mx-auto"
              >
                <PlusCircle className="w-3 h-3" /> Location Not Found? Add Manually
              </button>
            </div>
          )}
        </div>
      )}

      {/* Manual Location Creation Modal */}
      {showManualModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-4 text-xs">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <h3 className="font-semibold text-sm text-[var(--fr8x-jet)] flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-[var(--fr8x-periwinkle)]" /> Add Location Manually
              </h3>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitManual} className="space-y-3">
              {duplicateWarning && (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded text-amber-800 text-[10px] flex items-start gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                  <div>{duplicateWarning}</div>
                </div>
              )}

              <div>
                <label className="block font-medium mb-1 text-gray-700">Location / Facility Name *</label>
                <input
                  type="text"
                  required
                  value={manualName}
                  onChange={(e) => setManualName(e.target.value)}
                  onBlur={handleCheckDuplicates}
                  placeholder="e.g. Nhava Sheva Terminal 4"
                  className="fr8x-input"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">City *</label>
                  <input
                    type="text"
                    required
                    value={manualCity}
                    onChange={(e) => setManualCity(e.target.value)}
                    onBlur={handleCheckDuplicates}
                    placeholder="e.g. Mumbai"
                    className="fr8x-input"
                  />
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Country *</label>
                  <input
                    type="text"
                    required
                    value={manualCountry}
                    onChange={(e) => setManualCountry(e.target.value)}
                    placeholder="e.g. India"
                    className="fr8x-input"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium mb-1 text-gray-700">Location Type</label>
                  <select
                    value={manualType}
                    onChange={(e) => setManualType(e.target.value as LocationType)}
                    className="fr8x-input"
                  >
                    <option value="sea">Port (Sea)</option>
                    <option value="air">Airport</option>
                    <option value="icd">ICD / Inland Container Depot</option>
                    <option value="cfs">CFS / Container Freight Station</option>
                    <option value="rail">Rail Terminal</option>
                    <option value="road">Logistics Hub / Road</option>
                    <option value="warehouse">Warehouse</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium mb-1 text-gray-700">UN/LOCODE or IATA Code</label>
                  <input
                    type="text"
                    value={manualUnlocode || manualIata}
                    onChange={(e) => {
                      setManualUnlocode(e.target.value.toUpperCase());
                      setManualIata(e.target.value.toUpperCase());
                    }}
                    placeholder="e.g. INNSA or BOM"
                    className="fr8x-input uppercase"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="fr8x-btn-secondary px-3 py-1.5"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingManual}
                  className="fr8x-btn-primary px-4 py-1.5 flex items-center gap-1.5"
                >
                  {isSubmittingManual ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  Submit & Use Location
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
