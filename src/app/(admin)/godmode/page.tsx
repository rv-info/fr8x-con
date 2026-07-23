// FR8X-CON GodMode Dashboard

"use client";

import { Users, Gavel, TrendingUp, ShieldAlert, Award, Activity } from "lucide-react";

const stats = [
  { label: "Total Users", value: "1,247", change: "+12%", icon: Users, color: "bg-brand-50 text-brand-600" },
  { label: "Active Auctions", value: "89", change: "+5%", icon: Gavel, color: "bg-success-light text-success-dark" },
  { label: "Rates Submitted", value: "3,456", change: "+18%", icon: TrendingUp, color: "bg-brand-50 text-brand-600" },
  { label: "Blacklisted", value: "7", change: "0%", icon: ShieldAlert, color: "bg-danger-light text-danger-dark" },
  { label: "Awards Given", value: "23", change: "+2", icon: Award, color: "bg-warning-light text-warning-dark" },
  { label: "API Health", value: "99.9%", change: "Healthy", icon: Activity, color: "bg-success-light text-success-dark" },
];

export default function GodModePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-display-sm text-foreground">GodMode Dashboard</h1>
        <p className="mt-1 text-body-md text-foreground-secondary">
          Platform administration and oversight
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="fr8x-card p-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-body-sm text-foreground-secondary">{stat.label}</p>
                  <p className="text-display-sm text-foreground mt-1">{stat.value}</p>
                  <p className="text-caption text-success mt-1">{stat.change}</p>
                </div>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent audit log */}
      <div className="fr8x-card">
        <div className="px-6 py-4 border-b border-border">
          <h2 className="text-heading-lg text-foreground">Recent Audit Log</h2>
        </div>
        <div className="divide-y divide-border">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-6 py-3 flex items-center gap-4 text-body-sm">
              <span className="text-foreground-muted text-caption w-32">
                {new Date(Date.now() - i * 3600000).toLocaleString()}
              </span>
              <span className="fr8x-badge-info">
                {["user.create", "auction.create", "bid.submit", "rate.approve", "user.login"][i]}
              </span>
              <span className="text-foreground flex-1">
                {["New user registered", "Auction created", "Bid submitted", "Rate approved", "Admin login"][i]}
              </span>
              <span className="text-foreground-muted text-caption">
                user-{100 + i}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
