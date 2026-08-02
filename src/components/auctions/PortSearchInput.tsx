"use client";

import { useState, useRef, useEffect } from "react";
import { Anchor, MapPin, Search } from "lucide-react";

export interface PortItem {
  code: string;
  name: string;
  country: string;
  type: "sea" | "air" | "inland";
}

const GLOBAL_PORTS: PortItem[] = [
  { code: "INNSA", name: "Nhava Sheva (JNP)", country: "India", type: "sea" },
  { code: "INMAA", name: "Chennai Port", country: "India", type: "sea" },
  { code: "INMUN", name: "Mundra Port", country: "India", type: "sea" },
  { code: "INKOK", name: "Kolkata Port", country: "India", type: "sea" },
  { code: "INCOK", name: "Cochin (Vallarpadam)", country: "India", type: "sea" },
  { code: "CNSHA", name: "Shanghai Port", country: "China", type: "sea" },
  { code: "CNNBO", name: "Ningbo-Zhoushan", country: "China", type: "sea" },
  { code: "SGSIN", name: "Singapore Port", country: "Singapore", type: "sea" },
  { code: "NLRTM", name: "Rotterdam", country: "Netherlands", type: "sea" },
  { code: "DEHAM", name: "Hamburg", country: "Germany", type: "sea" },
  { code: "USNYC", name: "New York / New Jersey", country: "United States", type: "sea" },
  { code: "USLAX", name: "Los Angeles", country: "United States", type: "sea" },
  { code: "AEDXB", name: "Jebel Ali (Dubai)", country: "United Arab Emirates", type: "sea" },
  { code: "MYPKG", name: "Port Klang", country: "Malaysia", type: "sea" },
  { code: "DELHR", name: "Indira Gandhi Int Airport (DEL)", country: "India", type: "air" },
  { code: "BOMHR", name: "Chhatrapati Shivaji Airport (BOM)", country: "India", type: "air" },
];

interface PortSearchInputProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  className?: string;
  label?: string;
  required?: boolean;
}

export function PortSearchInput({
  value,
  onChange,
  placeholder = "Search port or city (e.g. Nhava Sheva, Shanghai)...",
  className = "",
  label,
  required = false,
}: PortSearchInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState(value);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setSearch(value);
  }, [value]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filtered = GLOBAL_PORTS.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase()) ||
      p.country.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={containerRef} className="relative w-full">
      {label && (
        <label className="fr8x-label text-[11px] font-semibold flex items-center gap-1 mb-1">
          <Anchor className="h-3 w-3 text-slate-500" />
          <span>{label}</span>
          {required && <span className="text-red-500">*</span>}
        </label>
      )}

      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            onChange(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className={`fr8x-input pl-7 text-[11px] ${className}`}
        />
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 mt-1 z-50 max-h-48 overflow-y-auto rounded-lg bg-white border border-border shadow-xl py-1 text-[11px]">
          {filtered.length === 0 ? (
            <div className="p-2 text-slate-500 text-[10px]">
              Custom Location: &quot;{search}&quot;
            </div>
          ) : (
            filtered.map((p) => (
              <button
                key={p.code}
                type="button"
                onClick={() => {
                  const val = `${p.name} (${p.code}), ${p.country}`;
                  setSearch(val);
                  onChange(val);
                  setIsOpen(false);
                }}
                className="flex w-full items-center justify-between px-3 py-1.5 hover:bg-[var(--fr8x-mist)] text-left transition-colors"
              >
                <div className="flex items-center gap-1.5 truncate">
                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800 truncate">{p.name}</span>
                  <span className="text-[9px] text-slate-500">({p.country})</span>
                </div>
                <span className="font-mono text-[9px] bg-slate-100 text-slate-700 px-1 py-0.2 rounded font-bold shrink-0">
                  {p.code}
                </span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
