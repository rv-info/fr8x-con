// FR8X-CON GodMode Users & Members Management — Spec Page 11

"use client";

import { useState } from "react";
import { Users, Search, Shield, ShieldAlert, CheckCircle, Plus } from "lucide-react";

const mockUsers = Array.from({ length: 10 }, (_, i) => ({
  uid: `user-${100 + i}`,
  name: `Member ${i + 1}`,
  email: `user${i + 1}@company.com`,
  company: `Logistics ${String.fromCharCode(65 + (i % 5))}`,
  role: ["nvocc", "mlo", "freight_forwarder", "cha", "transporter"][i % 5],
  tier: ["trial", "basic", "premium"][i % 3],
  status: "active",
  isGodMode: i === 0,
}));

export default function GodModeUsersPage() {
  const [search, setSearch] = useState("");
  const [users, setUsers] = useState(mockUsers);

  const filtered = users.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.company.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">Users & Members</h1>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Manage user accounts, roles, membership tiers, and permissions
          </p>
        </div>
        <button className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] flex items-center gap-1.5">
          <Plus className="h-4 w-4" /> Add User
        </button>
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
                <tr key={u.uid} className="hover:bg-[var(--fr8x-mist)] transition-colors">
                  <td>
                    <div>
                      <p className="font-semibold text-[var(--fr8x-jet)] flex items-center gap-1">
                        {u.name}
                        {u.isGodMode && <Shield className="h-3.5 w-3.5 text-warning" />}
                      </p>
                      <p className="text-caption text-foreground-muted">{u.email}</p>
                    </div>
                  </td>
                  <td>{u.company}</td>
                  <td className="capitalize">{(u.role || "").replace("_", " ")}</td>
                  <td>
                    <span className="fr8x-badge-info capitalize">{u.tier}</span>
                  </td>
                  <td>
                    <span className="fr8x-badge-active capitalize">{u.status}</span>
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
      </div>
    </div>
  );
}
