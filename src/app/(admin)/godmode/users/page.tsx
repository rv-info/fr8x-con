// FR8X-CON GodMode Users & Members Management

"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Shield, Loader2 } from "lucide-react";
import { queryDocuments, limit } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";

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
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState<UserAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchUsers() {
      setIsLoading(true);
      try {
        const data = await queryDocuments<UserAdmin>(COLLECTIONS.USERS, [
          limit(100),
        ]);
        setUsers(data);
      } catch (err) {
        console.error("Error fetching admin users:", err);
        setUsers([]);
      } finally {
        setIsLoading(false);
      }
    }
    fetchUsers();
  }, []);

  const filtered = useMemo(() => {
    if (!search) return users;
    const q = search.toLowerCase();
    return users.filter(
      (u) =>
        (u.fullName || "").toLowerCase().includes(q) ||
        (u.email || "").toLowerCase().includes(q) ||
        (u.companyName || "").toLowerCase().includes(q)
    );
  }, [users, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Users & Members</h1>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Manage user accounts, roles, membership tiers, and permissions
          </p>
        </div>
      </div>

      <div className="fr8x-card p-4 flex items-center gap-4 bg-white">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search users by name, email, or company..."
            className="fr8x-input pl-9"
          />
        </div>
      </div>

      <div className="fr8x-card bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-8">
            <Loader2 className="h-4 w-4 animate-spin text-foreground-muted" />
            <span className="text-[11px] text-foreground-muted">Loading users...</span>
          </div>
        ) : filtered.length === 0 ? (
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
                {filtered.map((u) => (
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
    </div>
  );
}
