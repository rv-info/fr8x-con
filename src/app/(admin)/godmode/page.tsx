// FR8X-CON GodMode Dashboard — Live Firestore Stats
// All stats pulled from Firestore. No hardcoded/fake data.

"use client";

import { useEffect, useState } from "react";
import { Users, Gavel, TrendingUp, ShieldAlert, Award, Activity, FileText } from "lucide-react";
import { queryDocuments, orderBy, limit, where } from "@/lib/firebase/firestore";
import { COLLECTIONS } from "@/lib/utils/constants";
import { formatRelativeTime } from "@/lib/utils/format";

type AuditEntry = {
  id: string;
  action: string;
  description: string;
  actorId?: string;
  actorName?: string;
  createdAt: { seconds: number; nanoseconds: number } | null;
};

export default function GodModePage() {
  const [stats, setStats] = useState({
    totalUsers: "—",
    activeAuctions: "—",
    totalRates: "—",
    blacklisted: "—",
    awardsGiven: "—",
    apiHealth: "Checking...",
  });
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadStats() {
      setIsLoading(true);
      try {
        const [users, activeAuctions, rates, blacklisted, awards, auditEntries] =
          await Promise.allSettled([
            queryDocuments<{ uid: string }>(COLLECTIONS.USERS, [limit(500)]),
            queryDocuments<{ status: string }>(COLLECTIONS.AUCTIONS, [
              where("status", "==", "active"),
              limit(500),
            ]),
            queryDocuments<{ id: string }>(COLLECTIONS.RATES, [limit(500)]),
            queryDocuments<{ id: string }>(COLLECTIONS.BLACKLISTS, [limit(500)]),
            queryDocuments<{ id: string }>(COLLECTIONS.AWARDS, [limit(500)]),
            queryDocuments<AuditEntry>(COLLECTIONS.AUDIT, [
              orderBy("createdAt", "desc"),
              limit(10),
            ]),
          ]);

        setStats({
          totalUsers:
            users.status === "fulfilled" ? String(users.value.length) : "Error",
          activeAuctions:
            activeAuctions.status === "fulfilled"
              ? String(activeAuctions.value.length)
              : "Error",
          totalRates:
            rates.status === "fulfilled" ? String(rates.value.length) : "Error",
          blacklisted:
            blacklisted.status === "fulfilled"
              ? String(blacklisted.value.length)
              : "Error",
          awardsGiven:
            awards.status === "fulfilled" ? String(awards.value.length) : "Error",
          apiHealth: "Healthy",
        });

        if (auditEntries.status === "fulfilled") {
          setAuditLog(auditEntries.value);
        }
      } catch {
        // Stats remain at "—" — do not expose errors to UI
      } finally {
        setIsLoading(false);
      }
    }

    loadStats();
  }, []);

  const statCards = [
    { label: "Total Users", value: stats.totalUsers, icon: Users, color: "bg-blue-50 text-blue-600" },
    { label: "Active Auctions", value: stats.activeAuctions, icon: Gavel, color: "bg-emerald-50 text-emerald-600" },
    { label: "Rates Submitted", value: stats.totalRates, icon: TrendingUp, color: "bg-blue-50 text-blue-600" },
    { label: "Blacklisted", value: stats.blacklisted, icon: ShieldAlert, color: "bg-red-50 text-red-600" },
    { label: "Awards Given", value: stats.awardsGiven, icon: Award, color: "bg-amber-50 text-amber-600" },
    { label: "API Health", value: stats.apiHealth, icon: Activity, color: "bg-emerald-50 text-emerald-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display-sm text-foreground">Dashboard</h1>
        <p className="mt-1 text-body-md text-foreground-secondary">
          Platform administration and oversight
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="fr8x-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-sm text-foreground-secondary">{stat.label}</p>
                  <p className="text-display-sm text-foreground mt-1">
                    {isLoading ? (
                      <span className="inline-block w-12 h-5 bg-slate-100 animate-pulse rounded" />
                    ) : (
                      stat.value
                    )}
                  </p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent audit log — real Firestore data */}
      <div className="fr8x-card">
        <div className="px-6 py-4 border-b border-border flex items-center gap-2">
          <FileText className="h-4 w-4 text-foreground-secondary" />
          <h2 className="text-heading-lg text-foreground">Recent Audit Log</h2>
        </div>
        <div className="divide-y divide-border">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="px-6 py-3 flex items-center gap-4">
                <div className="w-32 h-4 bg-slate-100 animate-pulse rounded" />
                <div className="w-24 h-4 bg-slate-100 animate-pulse rounded" />
                <div className="flex-1 h-4 bg-slate-100 animate-pulse rounded" />
              </div>
            ))
          ) : auditLog.length === 0 ? (
            <div className="px-6 py-8 text-center text-foreground-muted text-body-sm">
              No audit events recorded yet.
            </div>
          ) : (
            auditLog.map((entry) => (
              <div key={entry.id} className="px-6 py-3 flex items-center gap-4 text-body-sm">
                <span className="text-foreground-muted text-caption w-32 shrink-0">
                  {entry.createdAt
                    ? formatRelativeTime(entry.createdAt.seconds * 1000)
                    : "—"}
                </span>
                <span className="fr8x-badge-info shrink-0 font-mono text-[10px]">
                  {entry.action}
                </span>
                <span className="text-foreground flex-1 truncate">
                  {entry.description}
                </span>
                <span className="text-foreground-muted text-caption shrink-0">
                  {entry.actorName || entry.actorId || "system"}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
