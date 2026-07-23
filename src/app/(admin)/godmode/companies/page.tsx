// FR8X-CON GodMode Companies Management

"use client";

import { useState, useEffect, useMemo } from "react";
import { Building2, Search, CheckCircle, Plus, Loader2 } from "lucide-react";
import { queryDocuments, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

type CompanyAdmin = {
  id: string;
  name?: string;
  country?: string;
  region?: string;
  industry?: string;
  memberCount?: number;
  verified?: boolean;
  status?: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

export default function GodModeCompaniesPage() {
  const [search, setSearch] = useState("");
  const [companies, setCompanies] = useState<CompanyAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCompanies() {
      setIsLoading(true);
      try {
        const data = await queryDocuments<CompanyAdmin>(COLLECTIONS.COMPANIES, [limit(50)]);
        setCompanies(data);
      } catch (err) {
        console.error("Error fetching admin companies:", err);
        setCompanies([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchCompanies();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return companies;
    const q = search.toLowerCase();
    return companies.filter(
      (c) =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.country || "").toLowerCase().includes(q)
    );
  }, [companies, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Company Management</h1>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Oversee registered logistics companies and corporate memberships
          </p>
        </div>
        <button className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] flex items-center gap-1.5">
          <Plus className="h-4 w-4" />
          Add Company
        </button>
      </div>

      {/* Filters */}
      <div className="fr8x-card p-4 flex items-center gap-4 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search companies by name or country..."
            className="fr8x-input pl-9"
          />
        </div>
      </div>

      {/* Companies Table */}
      <div className="fr8x-card bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
            <span className="text-[11px] text-foreground-muted">Loading companies...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-8 text-center">
            <p className="text-body-sm text-foreground-secondary">
              {companies.length === 0 ? "No registered companies in system" : "No matching companies found"}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="fr8x-table">
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Country / Region</th>
                  <th>Industry</th>
                  <th>Members</th>
                  <th>Verification</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map((comp) => (
                  <tr key={comp.id} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                    <td className="font-semibold text-[var(--fr8x-jet)] flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-[var(--fr8x-periwinkle)]" />
                      {comp.name || "Company"}
                    </td>
                    <td>{comp.country || "—"} {comp.region ? `(${comp.region})` : ""}</td>
                    <td>{comp.industry || "—"}</td>
                    <td>{comp.memberCount || 0} users</td>
                    <td>
                      {comp.verified ? (
                        <span className="fr8x-badge-active flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" /> Verified
                        </span>
                      ) : (
                        <span className="fr8x-badge-pending w-fit">Unverified</span>
                      )}
                    </td>
                    <td>
                      <span className="fr8x-badge-active capitalize">{comp.status || "active"}</span>
                    </td>
                    <td>
                      <div className="flex items-center gap-2 text-caption">
                        <button className="text-[var(--fr8x-periwinkle)] hover:underline">Edit</button>
                        <button className="text-danger hover:underline">Suspend</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
