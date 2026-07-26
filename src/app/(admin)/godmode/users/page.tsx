// FR8X-CON GodMode Users & Members Management

"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Shield, Loader2, ShieldAlert, CheckCircle2, RefreshCw } from "lucide-react";
import { queryDocuments, getDocument, setDocument, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import type { SupplierGovernanceProfile } from "@/lib/types/supplierGovernance";
import { logAuditEvent } from "@/lib/utils/auditLogger";

type UserAdmin = {
  id: string;
  uid?: string;
  fullName?: string;
  email?: string;
  companyName?: string;
  role?: string;
  membershipTier?: string;
  status?: string;
  isGodMode?: boolean;
};

export default function GodModeUsersPage() {
  const [activeTab, setActiveTab] = useState<"users" | "governance">("users");
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [governanceProfiles, setGovernanceProfiles] = useState<SupplierGovernanceProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const userData = await queryDocuments<UserAdmin>(COLLECTIONS.USERS, [limit(100)]);
        setUsers(userData);

        const govData = await queryDocuments<SupplierGovernanceProfile>("supplier_governance", [limit(100)]);
        setGovernanceProfiles(govData);
      } catch (err) {
        console.error("Error fetching admin users & governance:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, []);

  // Handle privilege restoration by GodMode Admin
  const handleRestorePrivileges = async (profile: SupplierGovernanceProfile) => {
    const reason = window.prompt(`Administrative Review: Enter mandatory reason for restoring Reverse Auction privileges for ${profile.supplierCompany}:`);
    if (!reason?.trim()) {
      alert("Privilege restoration requires a mandatory administrative review note.");
      return;
    }

    setIsRestoring(profile.supplierId);
    try {
      const now = new Date().toISOString();
      const updatedGov: Partial<SupplierGovernanceProfile> = {
        status: "active",
        poorPerformanceRecords: 0,
        restrictionReason: undefined,
        reviewNotes: reason,
        isRestoredByGodMode: true,
        restoredAt: now,
        restoredBy: "GodMode Administrative Authority",
      };

      await setDocument("supplier_governance", profile.supplierId, updatedGov, true);

      // Record audit log entry
      await logAuditEvent(
        "SUPPLIER_PRIVILEGES_RESTORED",
        `GodMode Restored Reverse Auction Privileges for Supplier [${profile.supplierCompany}]`,
        { uid: "godmode_admin", name: "GodMode Admin", role: "godmode_admin" },
        { reviewNotes: reason, previousStatus: profile.status, previousPoorRecords: profile.poorPerformanceRecords },
        undefined,
        undefined,
        profile.supplierId
      );

      setGovernanceProfiles((prev) =>
        prev.map((p) => (p.supplierId === profile.supplierId ? { ...p, status: "active", poorPerformanceRecords: 0, isRestoredByGodMode: true } : p))
      );

      alert(`Privileges restored successfully for ${profile.supplierCompany}! Account status set to ACTIVE.`);
    } catch (err) {
      console.error("Error restoring privileges:", err);
      alert("Failed to restore supplier privileges. Please try again.");
    } finally {
      setIsRestoring(null);
    }
  };

  const filteredUsers = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.fullName || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.companyName || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  const filteredGovernance = useMemo(() => {
    if (!search) return governanceProfiles;
    const q = search.toLowerCase();
    return governanceProfiles.filter(
      (g) =>
        (g.supplierCompany || "").toLowerCase().includes(q) ||
        (g.supplierName || "").toLowerCase().includes(q) ||
        (g.status || "").toLowerCase().includes(q)
    );
  }, [governanceProfiles, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Users & Supplier Governance Oversight</h1>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Manage user accounts, roles, membership tiers, and administrative supplier governance controls
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <button
          onClick={() => setActiveTab("users")}
          className={`px-4 py-1.5 rounded text-body-sm font-semibold flex items-center gap-2 ${
            activeTab === "users" ? "bg-[var(--fr8x-jet)] text-white" : "bg-white text-foreground-secondary hover:bg-gray-100"
          }`}
        >
          <Shield className="h-4 w-4" /> Users Registry ({users.length})
        </button>
        <button
          onClick={() => setActiveTab("governance")}
          className={`px-4 py-1.5 rounded text-body-sm font-semibold flex items-center gap-2 ${
            activeTab === "governance" ? "bg-[var(--fr8x-jet)] text-white" : "bg-white text-foreground-secondary hover:bg-gray-100"
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-amber-400" /> Supplier Governance & Administrative Review ({governanceProfiles.length})
        </button>
      </div>

      <div className="fr8x-card p-4 flex items-center gap-4 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search records by name, email, company, or governance status..."
            className="fr8x-input pl-9"
          />
        </div>
      </div>

      {/* TAB 1: USERS REGISTRY */}
      {activeTab === "users" && (
        <div className="fr8x-card bg-white overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 py-8">
              <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
              <span className="text-[11px] text-foreground-muted">Loading users...</span>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-body-sm text-foreground-secondary">
                {users.length === 0 ? "No registered users in system" : "No matching users found"}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="fr8x-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Company</th>
                    <th>Role</th>
                    <th>Membership</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                      <td>
                        <div>
                          <p className="font-semibold text-[var(--fr8x-jet)] flex items-center gap-1">
                            {u.fullName || "User"}
                            {u.isGodMode && <Shield className="h-3.5 w-3.5 text-warning" />}
                          </p>
                          <p className="text-caption text-foreground-muted">{u.email || "—"}</p>
                        </div>
                      </td>
                      <td>{u.companyName || "—"}</td>
                      <td className="capitalize">{(u.role || "member").replace("_", " ")}</td>
                      <td>
                        <span className="fr8x-badge-info capitalize">{u.membershipTier || "trial"}</span>
                      </td>
                      <td>
                        <span className="fr8x-badge-active capitalize">{u.status || "active"}</span>
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
      )}

      {/* TAB 2: SUPPLIER GOVERNANCE & PRIVILEGE RESTORATION PANEL */}
      {activeTab === "governance" && (
        <div className="fr8x-card bg-white overflow-hidden">
          <div className="p-3 bg-amber-50 border-b border-amber-200 text-[11px] text-amber-900 flex items-center justify-between">
            <span className="font-bold flex items-center gap-1.5">
              <ShieldAlert className="h-4 w-4 text-amber-600" />
              Supplier Governance Policy Control (1 Poor = Warning | 2 Poor = Selective Only | 3 Poor = Auto-Suspended)
            </span>
            <span>Only GodMode Administrative Authority may restore privileges.</span>
          </div>

          <div className="overflow-x-auto">
            <table className="fr8x-table">
              <thead>
                <tr>
                  <th>Supplier Company</th>
                  <th>Overall Rating</th>
                  <th>Poor Records</th>
                  <th>Governance Status</th>
                  <th>Restriction / Review Reason</th>
                  <th>Evaluations Count</th>
                  <th>Administrative Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredGovernance.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-6 text-foreground-muted">
                      No supplier governance profiles registered yet.
                    </td>
                  </tr>
                ) : (
                  filteredGovernance.map((gov) => (
                    <tr key={gov.supplierId || gov.supplierCompany} className="hover:bg-[var(--fr8x-mist)]">
                      <td className="font-bold text-[var(--fr8x-jet)]">{gov.supplierCompany || gov.supplierName}</td>
                      <td>⭐ {gov.overallRating ? gov.overallRating.toFixed(1) : "4.5"} / 5.0</td>
                      <td className="font-bold tabular-nums">{gov.poorPerformanceRecords || 0}</td>
                      <td>
                        <span className={`fr8x-badge uppercase font-extrabold ${
                          gov.status === "suspended" ? "bg-red-100 text-red-800 border-red-300" :
                          gov.status === "restricted" ? "bg-amber-100 text-amber-800 border-amber-300" :
                          gov.status === "warning" ? "bg-yellow-100 text-yellow-800 border-yellow-300" :
                          "bg-emerald-100 text-emerald-800 border-emerald-300"
                        }`}>
                          {gov.status || "active"}
                        </span>
                      </td>
                      <td className="text-caption text-foreground-secondary max-w-xs truncate">
                        {gov.restrictionReason || gov.reviewNotes || "Normal operations"}
                      </td>
                      <td className="tabular-nums">{gov.totalEvaluations || 0}</td>
                      <td>
                        {gov.status !== "active" ? (
                          <button
                            onClick={() => handleRestorePrivileges(gov)}
                            disabled={isRestoring === gov.supplierId}
                            className="fr8x-btn-primary bg-emerald-700 text-white hover:bg-emerald-800 text-[10px] py-1 px-3 flex items-center gap-1 font-bold"
                          >
                            {isRestoring === gov.supplierId ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                            Restore Bidding Privileges
                          </button>
                        ) : (
                          <span className="text-caption text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" /> Full Access Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
