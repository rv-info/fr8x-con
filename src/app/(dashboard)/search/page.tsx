// FR8X-CON Universal Search System — Spec Page 10 & Features 6-9
// Unified search dashboard with autocomplete, history, filters, and direct result actions.

"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Search,
  Building2,
  User,
  Tag,
  Gavel,
  SlidersHorizontal,
  History,
  TrendingUp,
  MapPin,
  ShieldCheck,
  UserPlus,
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  Loader2,
  CheckCircle2,
  X,
} from "lucide-react";
import { useAuth } from "@/providers/AuthProvider";
import { COLLECTIONS, ROUTES } from "@/lib/utils/constants";
import { queryDocuments, getDocument, setDocument, deleteDocument, limit } from "@/lib/firebase/firestore";
import { Button } from "@/components/ui/Button";

// Results interfaces
interface ProfileResult {
  id: string;
  userId: string;
  fullName: string;
  designation: string;
  companyName: string;
  location: string;
  country: string;
  publicId?: string;
  photoURL?: string | null;
  verifiedBadge?: boolean;
  industryTags?: string[];
}

interface CompanyResult {
  id: string;
  name: string;
  publicId?: string;
  country: string;
  region: string;
  industry: string;
  verified?: boolean;
  logoURL?: string | null;
  gstn?: string;
  iec?: string;
  serviceTags?: string[];
}

interface RFQResult {
  id: string;
  title: string;
  status: string;
  origin: string;
  pol: string;
  pod: string;
  destination: string;
  shipmentType: string;
  creatorId: string;
  createdAt?: any;
}

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user: currentUser } = useAuth();

  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [activeTab, setActiveTab] = useState<"all" | "professionals" | "companies" | "rfqs" | "tags">("all");
  const [showFilters, setShowFilters] = useState(false);

  // Firestore DB lists
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [companies, setCompanies] = useState<CompanyResult[]>([]);
  const [rfqs, setRfqs] = useState<RFQResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [filterCountry, setFilterCountry] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterCompany, setFilterCompany] = useState("");
  const [filterIndustry, setFilterIndustry] = useState("");
  const [filterVerified, setFilterVerified] = useState<boolean | null>(null);

  // Search experiences (LocalStorage based)
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const popularSearches = ["Ocean Freight", "NVOCC", "Mumbai", "FCL", "Apex", "Customs"];

  // Load database dumps
  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      try {
        const profs = await queryDocuments<ProfileResult>(COLLECTIONS.PROFILES, [limit(100)]);
        const comps = await queryDocuments<CompanyResult>(COLLECTIONS.COMPANIES, [limit(100)]);
        const auctions = await queryDocuments<RFQResult>(COLLECTIONS.AUCTIONS, [limit(100)]);
        
        setProfiles(profs);
        setCompanies(comps);
        setRfqs(auctions);
      } catch (err) {
        console.error("Error loading search indices:", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();

    // Load recent searches
    if (typeof window !== "undefined") {
      const recents = localStorage.getItem("fr8x_recent_searches");
      if (recents) {
        setRecentSearches(JSON.parse(recents));
      }
    }
  }, []);

  // Update suggestions on query input
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }
    const q = query.toLowerCase();
    const suggestionsSet = new Set<string>();

    // Scan profiles
    profiles.forEach((p) => {
      if (p.fullName?.toLowerCase().includes(q)) suggestionsSet.add(p.fullName);
      if (p.publicId?.toLowerCase().includes(q)) suggestionsSet.add(p.publicId);
      if (p.designation?.toLowerCase().includes(q)) suggestionsSet.add(p.designation);
    });

    // Scan companies
    companies.forEach((c) => {
      if (c.name?.toLowerCase().includes(q)) suggestionsSet.add(c.name);
      if (c.publicId?.toLowerCase().includes(q)) suggestionsSet.add(c.publicId);
      if (c.gstn?.toLowerCase().includes(q)) suggestionsSet.add(c.gstn);
    });

    // Scan tags
    const tags = ["Ocean Freight", "Air Freight", "FCL", "LCL", "NVOCC", "Customs Clearance", "Warehousing", "Cold Chain", "Project Cargo", "Multimodal"];
    tags.forEach((t) => {
      if (t.toLowerCase().includes(q)) suggestionsSet.add(t);
    });

    setSuggestions(Array.from(suggestionsSet).slice(0, 5));
  }, [query, profiles, companies]);

  const addRecentSearch = (searchVal: string) => {
    const trimmed = searchVal.trim();
    if (!trimmed) return;
    const updated = [trimmed, ...recentSearches.filter((s) => s !== trimmed)].slice(0, 5);
    setRecentSearches(updated);
    if (typeof window !== "undefined") {
      localStorage.setItem("fr8x_recent_searches", JSON.stringify(updated));
    }
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== "undefined") {
      localStorage.removeItem("fr8x_recent_searches");
    }
  };

  const handleSearchSubmit = (searchVal: string) => {
    setQuery(searchVal);
    addRecentSearch(searchVal);
    // update url parameter
    const params = new URLSearchParams(window.location.search);
    if (searchVal) params.set("q", searchVal);
    else params.delete("q");
    router.replace(`${ROUTES.SEARCH}?${params.toString()}`);
  };

  // Profile sharing link copy
  const handleShareProfile = (id: string, isCompany = false) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const path = isCompany ? `/company/${id}` : `/profile/${id}`;
    navigator.clipboard.writeText(`${baseUrl}${path}`);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter Logic
  const filteredProfiles = useMemo(() => {
    const q = query.toLowerCase();
    return profiles.filter((p) => {
      // Query filter
      const matchesQuery =
        !q ||
        (p.fullName || "").toLowerCase().includes(q) ||
        (p.publicId || "").toLowerCase().includes(q) ||
        (p.companyName || "").toLowerCase().includes(q) ||
        (p.designation || "").toLowerCase().includes(q) ||
        (p.industryTags || []).some((t) => t.toLowerCase().includes(q));

      // Sidebar filters
      const matchesCountry = !filterCountry || (p.country || "").toLowerCase().includes(filterCountry.toLowerCase());
      const matchesCity = !filterCity || (p.location || "").toLowerCase().includes(filterCity.toLowerCase());
      const matchesCompany = !filterCompany || (p.companyName || "").toLowerCase().includes(filterCompany.toLowerCase());
      const matchesIndustry = !filterIndustry || (p.industryTags || []).some((t) => t.toLowerCase().includes(filterIndustry.toLowerCase()));
      const matchesVerified = filterVerified === null || p.verifiedBadge === filterVerified;

      return matchesQuery && matchesCountry && matchesCity && matchesCompany && matchesIndustry && matchesVerified;
    });
  }, [profiles, query, filterCountry, filterCity, filterCompany, filterIndustry, filterVerified]);

  const filteredCompanies = useMemo(() => {
    const q = query.toLowerCase();
    return companies.filter((c) => {
      const matchesQuery =
        !q ||
        (c.name || "").toLowerCase().includes(q) ||
        (c.publicId || "").toLowerCase().includes(q) ||
        (c.gstn || "").toLowerCase().includes(q) ||
        (c.iec || "").toLowerCase().includes(q) ||
        (c.country || "").toLowerCase().includes(q) ||
        (c.region || "").toLowerCase().includes(q) ||
        (c.industry || "").toLowerCase().includes(q);

      const matchesCountry = !filterCountry || (c.country || "").toLowerCase().includes(filterCountry.toLowerCase());
      const matchesCity = !filterCity || (c.region || "").toLowerCase().includes(filterCity.toLowerCase());
      const matchesIndustry = !filterIndustry || (c.industry || "").toLowerCase().includes(filterIndustry.toLowerCase());
      const matchesVerified = filterVerified === null || c.verified === filterVerified;

      return matchesQuery && matchesCountry && matchesCity && matchesIndustry && matchesVerified;
    });
  }, [companies, query, filterCountry, filterCity, filterIndustry, filterVerified]);

  const filteredRfqs = useMemo(() => {
    const q = query.toLowerCase();
    return rfqs.filter((r) => {
      const matchesQuery =
        !q ||
        (r.title || "").toLowerCase().includes(r.id.toLowerCase()) || // match rfq number
        (r.title || "").toLowerCase().includes(q) ||
        (r.origin || "").toLowerCase().includes(q) ||
        (r.pol || "").toLowerCase().includes(q) ||
        (r.pod || "").toLowerCase().includes(q) ||
        (r.destination || "").toLowerCase().includes(q) ||
        (r.shipmentType || "").toLowerCase().includes(q);

      const matchesCountry =
        !filterCountry ||
        (r.origin || "").toLowerCase().includes(filterCountry.toLowerCase()) ||
        (r.destination || "").toLowerCase().includes(filterCountry.toLowerCase());

      return matchesQuery && matchesCountry;
    });
  }, [rfqs, query, filterCountry]);

  // Extract tags matching search query
  const matchingTags = useMemo(() => {
    const q = query.toLowerCase();
    const allTags = ["Ocean Freight", "Air Freight", "FCL", "LCL", "NVOCC", "Customs Clearance", "Warehousing", "Cold Chain", "Project Cargo", "Multimodal"];
    return allTags.filter((t) => !q || t.toLowerCase().includes(q));
  }, [query]);

  const handleClearFilters = () => {
    setFilterCountry("");
    setFilterCity("");
    setFilterCompany("");
    setFilterIndustry("");
    setFilterVerified(null);
  };

  return (
    <div className="min-h-screen bg-[var(--fr8x-bg)] py-3">
      {/* Search Input Banner */}
      <div className="fr8x-card bg-white p-4 space-y-3 mb-4">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSearchSubmit(query);
          }}
          className="relative"
        >
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4.5 w-4.5 text-foreground-muted" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search professionals, companies, RFQs, or tags..."
            className="fr8x-input pl-10 pr-10 text-body-sm h-10 w-full"
          />
          {query && (
            <button
              type="button"
              onClick={() => handleSearchSubmit("")}
              className="absolute right-12 top-1/2 -translate-y-1/2 text-foreground-muted hover:text-foreground p-1"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded transition-colors ${
              showFilters ? "bg-[var(--fr8x-mist)] text-[var(--fr8x-periwinkle)]" : "text-foreground-secondary hover:bg-slate-50"
            }`}
            title="Toggle advanced filters"
          >
            <SlidersHorizontal className="h-4.5 w-4.5" />
          </button>
        </form>

        {/* Live suggestions overlay */}
        {suggestions.length > 0 && (
          <div className="bg-slate-50 border border-slate-100 rounded p-2 text-left space-y-1 animate-fadeIn">
            <p className="text-[9px] uppercase font-bold tracking-wider text-foreground-muted px-1.5">Suggestions</p>
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => handleSearchSubmit(s)}
                className="w-full text-left text-body-sm text-[var(--fr8x-jet)] hover:bg-[var(--fr8x-mist)] px-1.5 py-0.5 rounded transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {/* Quick searches & history */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[10px] text-foreground-secondary border-t border-border">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="flex items-center gap-0.5"><TrendingUp className="h-3 w-3" /> Popular:</span>
            {popularSearches.map((ps) => (
              <button
                key={ps}
                onClick={() => handleSearchSubmit(ps)}
                className="bg-slate-100 hover:bg-[var(--fr8x-mist)] text-[var(--fr8x-jet)] px-2 py-0.5 rounded transition-colors"
              >
                {ps}
              </button>
            ))}
          </div>

          {recentSearches.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap">
              <span className="flex items-center gap-0.5"><History className="h-3 w-3" /> Recents:</span>
              {recentSearches.map((rs) => (
                <button
                  key={rs}
                  onClick={() => handleSearchSubmit(rs)}
                  className="hover:underline text-[var(--fr8x-periwinkle)] font-medium"
                >
                  {rs}
                </button>
              ))}
              <button onClick={clearRecentSearches} className="text-red-500 hover:underline">
                Clear
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main search layout (Filters on left sidebar, Results in center) */}
      <div className="flex flex-col lg:flex-row gap-4 items-start">
        {/* Advanced Filters Drawer/Sidebar */}
        {(showFilters || window.innerWidth >= 1024) && (
          <aside className={`w-full lg:w-[240px] shrink-0 bg-white fr8x-card p-4 space-y-4 ${!showFilters ? "hidden lg:block" : "block"}`}>
            <div className="flex items-center justify-between border-b border-border pb-1.5">
              <h3 className="text-body-sm font-bold text-[var(--fr8x-jet)]">Filters</h3>
              <button onClick={handleClearFilters} className="text-[10px] text-[var(--fr8x-periwinkle)] hover:underline">
                Clear All
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-semibold text-[var(--fr8x-jet)] block mb-1">Country</label>
                <input
                  type="text"
                  value={filterCountry}
                  onChange={(e) => setFilterCountry(e.target.value)}
                  placeholder="e.g. India"
                  className="fr8x-input py-1 text-[10px]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--fr8x-jet)] block mb-1">City / Region</label>
                <input
                  type="text"
                  value={filterCity}
                  onChange={(e) => setFilterCity(e.target.value)}
                  placeholder="e.g. Mumbai"
                  className="fr8x-input py-1 text-[10px]"
                />
              </div>

              {activeTab === "professionals" && (
                <div>
                  <label className="text-[10px] font-semibold text-[var(--fr8x-jet)] block mb-1">Company</label>
                  <input
                    type="text"
                    value={filterCompany}
                    onChange={(e) => setFilterCompany(e.target.value)}
                    placeholder="e.g. Maersk"
                    className="fr8x-input py-1 text-[10px]"
                  />
                </div>
              )}

              <div>
                <label className="text-[10px] font-semibold text-[var(--fr8x-jet)] block mb-1">Industry / Specialization</label>
                <input
                  type="text"
                  value={filterIndustry}
                  onChange={(e) => setFilterIndustry(e.target.value)}
                  placeholder="e.g. NVOCC"
                  className="fr8x-input py-1 text-[10px]"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold text-[var(--fr8x-jet)] block mb-1">Verification Status</label>
                <div className="flex gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setFilterVerified(filterVerified === true ? null : true)}
                    className={`text-[9px] px-2 py-0.5 rounded border ${
                      filterVerified === true ? "bg-emerald-50 text-emerald-800 border-emerald-300 font-bold" : "bg-slate-50 border-slate-200"
                    }`}
                  >
                    Verified Only
                  </button>
                </div>
              </div>
            </div>
          </aside>
        )}

        {/* Results Block */}
        <main className="flex-1 min-w-0 space-y-3 w-full">
          {/* Tab Navigation */}
          <div className="flex border-b border-border bg-white rounded p-1 shadow-sm gap-1 overflow-x-auto no-scrollbar">
            {(["all", "professionals", "companies", "rfqs", "tags"] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-[11px] px-3.5 py-1 rounded capitalize shrink-0 font-medium transition-colors ${
                  activeTab === tab
                    ? "bg-[var(--fr8x-mist)] text-[var(--fr8x-jet)] font-semibold border border-[var(--fr8x-dimgrey)]"
                    : "text-foreground-secondary hover:bg-slate-50"
                }`}
              >
                {tab === "rfqs" ? "RFQs" : tab}
              </button>
            ))}
          </div>

          {/* Copied link toaster */}
          {copiedId && (
            <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] px-3 py-1 rounded w-fit flex items-center gap-1">
              <CheckCircle2 className="h-3 w-3" /> URL copied to clipboard!
            </div>
          )}

          {isLoading ? (
            <div className="fr8x-card bg-white p-12 text-center flex items-center justify-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin text-[var(--fr8x-periwinkle)]" />
              <span className="text-body-sm text-foreground-secondary">Searching database records...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Professionals Results */}
              {(activeTab === "all" || activeTab === "professionals") && filteredProfiles.length > 0 && (
                <div className="space-y-1.5">
                  {(activeTab === "all") && <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Professionals</h3>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredProfiles.map((p) => (
                      <div key={p.id} className="bg-white fr8x-card p-2.5 flex items-start justify-between gap-2.5">
                        <div
                          className="flex items-start gap-2 cursor-pointer text-left"
                          onClick={() => router.push(ROUTES.PROFILE_VIEW(p.userId))}
                        >
                          <div className="w-9 h-9 rounded-full bg-[var(--fr8x-lavender)] flex items-center justify-center text-body-sm font-semibold shrink-0 overflow-hidden border border-slate-200">
                            {p.photoURL ? <img src={p.photoURL} alt={p.fullName} className="w-full h-full object-cover" /> : p.fullName.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="text-[11px] font-bold text-[var(--fr8x-jet)] hover:underline truncate">{p.fullName}</p>
                              {p.verifiedBadge && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 fill-emerald-100" />}
                            </div>
                            {p.publicId && <p className="text-[9px] text-[var(--fr8x-periwinkle)] font-medium leading-none">{p.publicId}</p>}
                            <p className="text-[10px] text-foreground-secondary mt-0.5 truncate">{p.designation} at {p.companyName || "Logistics"}</p>
                            <p className="text-[9px] text-foreground-muted flex items-center gap-0.5 mt-0.5">
                              <MapPin className="h-2.5 w-2.5" /> {p.location ? `${p.location}, ` : ""}{p.country}
                            </p>
                          </div>
                        </div>

                        {/* Quick actions */}
                        <div className="flex flex-col gap-1 items-end shrink-0">
                          <button
                            onClick={() => router.push(ROUTES.PROFILE_VIEW(p.userId))}
                            className="text-[9px] bg-slate-100 hover:bg-[var(--fr8x-mist)] text-[var(--fr8x-jet)] px-1.5 py-0.5 rounded border border-slate-200 font-semibold"
                          >
                            Connect
                          </button>
                          <button
                            onClick={() => handleShareProfile(p.publicId || p.userId)}
                            className="text-[9px] text-foreground-muted hover:text-[var(--fr8x-jet)] flex items-center gap-0.5"
                          >
                            <Share2 className="h-2.5 w-2.5" /> Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Companies Results */}
              {(activeTab === "all" || activeTab === "companies") && filteredCompanies.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {(activeTab === "all") && <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Companies</h3>}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {filteredCompanies.map((c) => (
                      <div key={c.id} className="bg-white fr8x-card p-2.5 flex items-start justify-between gap-2.5">
                        <div
                          className="flex items-start gap-2 cursor-pointer text-left"
                          onClick={() => router.push(ROUTES.COMPANY_VIEW(c.publicId || c.id))}
                        >
                          <div className="w-9 h-9 rounded bg-slate-900 border border-slate-700 flex items-center justify-center text-white text-body-sm font-bold shrink-0 overflow-hidden">
                            {c.logoURL ? <img src={c.logoURL} alt={c.name} className="w-full h-full object-cover" /> : c.name.charAt(0)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <p className="text-[11px] font-bold text-[var(--fr8x-jet)] hover:underline truncate">{c.name}</p>
                              {c.verified && <ShieldCheck className="h-3.5 w-3.5 text-emerald-500 fill-emerald-100" />}
                            </div>
                            {c.publicId && <p className="text-[9px] text-[var(--fr8x-periwinkle)] font-medium leading-none">{c.publicId}</p>}
                            <p className="text-[10px] text-foreground-secondary mt-0.5 truncate">{c.industry}</p>
                            <p className="text-[9px] text-foreground-muted flex items-center gap-0.5 mt-0.5">
                              <MapPin className="h-2.5 w-2.5" /> {c.region ? `${c.region}, ` : ""}{c.country}
                            </p>
                          </div>
                        </div>

                        <div className="flex flex-col gap-1 items-end shrink-0">
                          <button
                            onClick={() => router.push(ROUTES.COMPANY_VIEW(c.publicId || c.id))}
                            className="text-[9px] bg-slate-100 hover:bg-[var(--fr8x-mist)] text-[var(--fr8x-jet)] px-1.5 py-0.5 rounded border border-slate-200 font-semibold"
                          >
                            View
                          </button>
                          <button
                            onClick={() => handleShareProfile(c.publicId || c.id, true)}
                            className="text-[9px] text-foreground-muted hover:text-[var(--fr8x-jet)] flex items-center gap-0.5"
                          >
                            <Share2 className="h-2.5 w-2.5" /> Share
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* RFQ Results */}
              {(activeTab === "all" || activeTab === "rfqs") && filteredRfqs.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {(activeTab === "all") && <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">RFQs & Auctions</h3>}
                  <div className="overflow-x-auto bg-white fr8x-card">
                    <table className="fr8x-table-compact w-full text-left">
                      <thead>
                        <tr className="bg-slate-50 border-b border-border text-[9px] font-bold uppercase text-foreground-muted">
                          <th className="p-2">RFQ Number</th>
                          <th className="p-2">Title</th>
                          <th className="p-2">Route</th>
                          <th className="p-2">Mode</th>
                          <th className="p-2">Status</th>
                          <th className="p-2 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border text-[10px]">
                        {filteredRfqs.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50">
                            <td className="p-2 font-mono font-bold text-[var(--fr8x-periwinkle)]">#{r.id.substring(0, 8).toUpperCase()}</td>
                            <td className="p-2 font-semibold text-[var(--fr8x-jet)]">{r.title}</td>
                            <td className="p-2">{r.pol} → {r.pod}</td>
                            <td className="p-2">{r.shipmentType}</td>
                            <td className="p-2">
                              <span className={`px-1 py-0.2 rounded font-semibold text-[8px] ${
                                r.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-700"
                              }`}>
                                {r.status}
                              </span>
                            </td>
                            <td className="p-2 text-right">
                              <button
                                onClick={() => router.push(`/auctions/${r.id}`)}
                                className="text-[9px] text-[var(--fr8x-periwinkle)] hover:underline font-bold"
                              >
                                View RFQ
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Tags Results */}
              {(activeTab === "all" || activeTab === "tags") && matchingTags.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  {(activeTab === "all") && <h3 className="text-[10px] font-bold uppercase tracking-wider text-foreground-muted">Tags</h3>}
                  <div className="bg-white fr8x-card p-3 flex flex-wrap gap-2">
                    {matchingTags.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => {
                          addRecentSearch(`#${tag}`);
                          router.push(`${ROUTES.FEEDS}?tag=${encodeURIComponent(tag)}`);
                        }}
                        className="bg-slate-50 border border-slate-200 rounded-full px-3 py-1 text-body-sm text-[var(--fr8x-jet)] hover:bg-[var(--fr8x-mist)] hover:border-[var(--fr8x-periwinkle)] transition-all flex items-center gap-1.5"
                      >
                        <Tag className="h-3.5 w-3.5 text-slate-400" />
                        <span>#{tag}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* No Results Fallback */}
              {!isLoading &&
                ((activeTab === "all" && filteredProfiles.length === 0 && filteredCompanies.length === 0 && filteredRfqs.length === 0 && matchingTags.length === 0) ||
                  (activeTab === "professionals" && filteredProfiles.length === 0) ||
                  (activeTab === "companies" && filteredCompanies.length === 0) ||
                  (activeTab === "rfqs" && filteredRfqs.length === 0) ||
                  (activeTab === "tags" && matchingTags.length === 0)) && (
                  <div className="fr8x-card bg-white p-12 text-center text-foreground-secondary">
                    <SlidersHorizontal className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                    <p className="text-body-sm font-bold">No results match your search parameters</p>
                    <p className="text-caption text-foreground-muted mt-0.5">Try adjusting query keywords or clearing filters.</p>
                  </div>
                )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
