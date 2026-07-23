// FR8X-CON GodMode System Settings — Spec Page 11

"use client";

import { useState } from "react";
import { Save } from "lucide-react";

export default function GodModeSettingsPage() {
  const [appName, setAppName] = useState("FR8X-CON");
  const [currencyTtl, setCurrencyTtl] = useState("300");
  const [maxBids, setMaxBids] = useState("5");
  const [trialDays, setTrialDays] = useState("2");
  const [emailNotifications, setEmailNotifications] = useState(true);

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">System Settings</h1>
        <p className="text-body-sm text-foreground-secondary mt-1">
          Configure global platform parameters, currency cache TTL, and operational rules
        </p>
      </div>

      <div className="fr8x-card p-6 bg-white space-y-6">
        <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] border-b border-border pb-2">
          Global Configurations
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className="fr8x-label block mb-1">Platform Name</label>
            <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)} className="fr8x-input" />
          </div>

          <div>
            <label className="fr8x-label block mb-1">Currency Cache TTL (seconds)</label>
            <input type="number" value={currencyTtl} onChange={(e) => setCurrencyTtl(e.target.value)} className="fr8x-input" />
          </div>

          <div>
            <label className="fr8x-label block mb-1">Max Submissions per Participant</label>
            <input type="number" value={maxBids} onChange={(e) => setMaxBids(e.target.value)} className="fr8x-input" />
          </div>

          <div>
            <label className="fr8x-label block mb-1">Trial Membership Duration (Days)</label>
            <input type="number" value={trialDays} onChange={(e) => setTrialDays(e.target.value)} className="fr8x-input" />
          </div>
        </div>

        <div className="pt-4 border-t border-border space-y-3">
          <h3 className="text-heading-sm font-semibold text-[var(--fr8x-jet)]">Notification Settings</h3>
          <label className="flex items-center gap-3 cursor-pointer text-body-sm text-[var(--fr8x-jet)]">
            <input
              type="checkbox"
              checked={emailNotifications}
              onChange={(e) => setEmailNotifications(e.target.checked)}
              className="accent-[var(--fr8x-periwinkle)]"
            />
            Enable automated system email notifications (GST Invoices, Bidding alerts, etc.)
          </label>
        </div>

        <div className="pt-4 border-t border-border flex justify-end">
          <button className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] px-6 flex items-center gap-2">
            <Save className="h-4 w-4" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
