// FR8X-CON GodMode System Settings & Online Email Service Setup — Spec Page 11

"use client";

import { useState, useEffect } from "react";
import { Save, Mail, Send, CheckCircle2, ShieldCheck, Key, Server, RefreshCw } from "lucide-react";
import { getGodModeEmailSettings, saveGodModeEmailSettings, type GodModeEmailSettings, type EmailServiceProvider } from "@/lib/utils/email-config";
import { sendCustomerPasswordResetEmail, sendSubscriptionNotification } from "@/lib/email/service";

export default function GodModeSettingsPage() {
  const [appName, setAppName] = useState("FR8X-CON");
  const [currencyTtl, setCurrencyTtl] = useState("300");
  const [maxBids, setMaxBids] = useState("5");
  const [trialDays, setTrialDays] = useState("2");
  const [emailNotifications, setEmailNotifications] = useState(true);

  // GOD Mode Email Services Setup
  const [emailSettings, setEmailSettings] = useState<GodModeEmailSettings>(getGodModeEmailSettings());
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [testStatus, setTestStatus] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    setEmailSettings(getGodModeEmailSettings());
  }, []);

  const handleSaveAll = () => {
    saveGodModeEmailSettings(emailSettings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleTestResetEmail = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await sendCustomerPasswordResetEmail("customer.test@fr8x.in");
      if (res.success) {
        setTestStatus({
          message: `Password reset email dispatched successfully via ${emailSettings.passwordResetFromEmail}!`,
          type: "success",
        });
      } else {
        setTestStatus({
          message: res.error || "Failed to dispatch test password reset email",
          type: "error",
        });
      }
    } catch (e: unknown) {
      const errStr = e instanceof Error ? e.message : "Error testing email";
      setTestStatus({ message: errStr, type: "error" });
    } finally {
      setIsTesting(false);
    }
  };

  const handleTestSubscriptionEmail = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await sendSubscriptionNotification("subscriber.test@fr8x.in");
      if (res.success) {
        setTestStatus({
          message: `Subscription notification dispatched successfully via ${emailSettings.subscriptionEmail}!`,
          type: "success",
        });
      } else {
        setTestStatus({
          message: res.error || "Failed to dispatch test subscription email",
          type: "error",
        });
      }
    } catch (e: unknown) {
      const errStr = e instanceof Error ? e.message : "Error testing subscription";
      setTestStatus({ message: errStr, type: "error" });
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl pb-12">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">System Settings</h1>
          <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full flex items-center gap-1 border border-amber-300">
            <ShieldCheck className="h-3.5 w-3.5 text-amber-600" /> GOD MODE SETUP ONLY
          </span>
        </div>
        <p className="text-body-sm text-foreground-secondary mt-1">
          Configure global platform parameters, online email service dispatchers, and support channels
        </p>
      </div>

      {isSaved && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 font-medium animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          System settings & online email configuration updated successfully!
        </div>
      )}

      {/* GLOBAL CONFIGURATIONS CARD */}
      <div className="fr8x-card p-6 bg-white space-y-6">
        <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] border-b border-border pb-2">
          Global Platform Configurations
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
      </div>

      {/* GOD MODE EXCLUSIVE ONLINE EMAIL SERVICES SETUP */}
      <div className="fr8x-card p-6 bg-white space-y-6 border-l-4 border-l-[#56C5F0]">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div>
            <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <Mail className="h-5 w-5 text-[#56C5F0]" />
              Online Email Service Setup (GOD Login Exclusive)
            </h2>
            <p className="text-caption text-foreground-secondary mt-0.5">
              Manage email dispatchers for customer password resets and support subscription channels
            </p>
          </div>
        </div>

        {/* SECTION 1: Password Reset Email (tech@fr8x.in) */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-body-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <Key className="h-4 w-4 text-[#56C5F0]" />
              1. Customer Password Reset Service
            </h3>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={emailSettings.passwordResetEnabled}
                onChange={(e) => setEmailSettings({ ...emailSettings, passwordResetEnabled: e.target.checked })}
                className="accent-[#56C5F0]"
              />
              Active
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="fr8x-label block mb-1 text-xs">Customer Reset Sender Address</label>
              <input
                type="email"
                value={emailSettings.passwordResetFromEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, passwordResetFromEmail: e.target.value })}
                className="fr8x-input bg-white font-mono text-sm"
                placeholder="tech@fr8x.in"
              />
              <span className="text-[11px] text-foreground-muted block mt-1">
                Password reset emails to customers will be sent from <strong>tech@fr8x.in</strong>
              </span>
            </div>

            <div>
              <label className="fr8x-label block mb-1 text-xs">Password Reset Subject Line</label>
              <input
                type="text"
                value={emailSettings.resetSubject}
                onChange={(e) => setEmailSettings({ ...emailSettings, resetSubject: e.target.value })}
                className="fr8x-input bg-white text-sm"
                placeholder="Reset Your Password - FR8X-CON"
              />
            </div>
          </div>
        </div>

        {/* SECTION 2: Support Email Subscription (support@fr8x.in) */}
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-body-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <Mail className="h-4 w-4 text-emerald-600" />
              2. Support Email Subscription Option
            </h3>
            <label className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
              <input
                type="checkbox"
                checked={emailSettings.subscriptionEnabled}
                onChange={(e) => setEmailSettings({ ...emailSettings, subscriptionEnabled: e.target.checked })}
                className="accent-emerald-600"
              />
              Active
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="fr8x-label block mb-1 text-xs">Support & Subscription Contact Address</label>
              <input
                type="email"
                value={emailSettings.subscriptionEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, subscriptionEmail: e.target.value })}
                className="fr8x-input bg-white font-mono text-sm"
                placeholder="support@fr8x.in"
              />
              <span className="text-[11px] text-foreground-muted block mt-1">
                Email subscription options and inquiries are routed to <strong>support@fr8x.in</strong>
              </span>
            </div>

            <div>
              <label className="fr8x-label block mb-1 text-xs">Subscription Confirmation Subject</label>
              <input
                type="text"
                value={emailSettings.subscriptionSubject}
                onChange={(e) => setEmailSettings({ ...emailSettings, subscriptionSubject: e.target.value })}
                className="fr8x-input bg-white text-sm"
                placeholder="Welcome to FR8X-CON Updates"
              />
            </div>
          </div>
        </div>

        {/* SECTION 3: Online Service Provider Integration */}
        <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-lg space-y-4">
          <h3 className="text-body-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
            <Server className="h-4 w-4 text-blue-600" />
            3. Online Email Provider Setup
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="fr8x-label block mb-1 text-xs">Select Email Provider</label>
              <select
                value={emailSettings.emailServiceProvider}
                onChange={(e) => setEmailSettings({ ...emailSettings, emailServiceProvider: e.target.value as EmailServiceProvider })}
                className="fr8x-input bg-white text-sm font-medium"
              >
                <option value="resend">Resend API (Recommended)</option>
                <option value="sendgrid">SendGrid API</option>
                <option value="smtp">Standard SMTP Server</option>
                <option value="custom_api">Custom Webhook / HTTP API</option>
              </select>
            </div>

            <div>
              <label className="fr8x-label block mb-1 text-xs">API Key / Auth Secret</label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={emailSettings.apiKey}
                  onChange={(e) => setEmailSettings({ ...emailSettings, apiKey: e.target.value })}
                  placeholder="re_123456789... or SG.xxxx..."
                  className="fr8x-input bg-white pr-20 font-mono text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-blue-600 font-semibold px-2 py-1 hover:bg-blue-50 rounded"
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          {emailSettings.emailServiceProvider === "smtp" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="fr8x-label block mb-1 text-xs">SMTP Host</label>
                <input
                  type="text"
                  value={emailSettings.smtpHost}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                  className="fr8x-input bg-white text-sm"
                  placeholder="smtp.gmail.com"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1 text-xs">SMTP Port</label>
                <input
                  type="text"
                  value={emailSettings.smtpPort}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                  className="fr8x-input bg-white text-sm"
                  placeholder="587"
                />
              </div>
              <div>
                <label className="fr8x-label block mb-1 text-xs">SMTP Password</label>
                <input
                  type="password"
                  value={emailSettings.smtpPass}
                  onChange={(e) => setEmailSettings({ ...emailSettings, smtpPass: e.target.value })}
                  className="fr8x-input bg-white text-sm"
                  placeholder="••••••••"
                />
              </div>
            </div>
          )}

          {emailSettings.emailServiceProvider === "custom_api" && (
            <div>
              <label className="fr8x-label block mb-1 text-xs">Custom API Endpoint URL</label>
              <input
                type="url"
                value={emailSettings.customApiUrl}
                onChange={(e) => setEmailSettings({ ...emailSettings, customApiUrl: e.target.value })}
                className="fr8x-input bg-white text-sm font-mono"
                placeholder="https://api.fr8x.in/v1/send-email"
              />
            </div>
          )}
        </div>

        {testStatus && (
          <div
            className={`p-3 text-xs font-medium rounded-md border flex items-center gap-2 ${
              testStatus.type === "success"
                ? "bg-emerald-50 text-emerald-800 border-emerald-200"
                : "bg-rose-50 text-rose-800 border-rose-200"
            }`}
          >
            {testStatus.type === "success" ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <RefreshCw className="h-4 w-4 animate-spin text-rose-600" />}
            {testStatus.message}
          </div>
        )}

        {/* ACTION BUTTONS */}
        <div className="pt-4 border-t border-border flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleTestResetEmail}
              disabled={isTesting}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1.5 transition-colors"
            >
              <Send className="h-3.5 w-3.5 text-[#56C5F0]" /> Test Password Reset (tech@fr8x.in)
            </button>
            <button
              type="button"
              onClick={handleTestSubscriptionEmail}
              disabled={isTesting}
              className="px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1.5 transition-colors"
            >
              <Send className="h-3.5 w-3.5 text-emerald-600" /> Test Subscription (support@fr8x.in)
            </button>
          </div>

          <button
            type="button"
            onClick={handleSaveAll}
            className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] px-6 py-2.5 flex items-center gap-2 text-sm font-semibold"
          >
            <Save className="h-4 w-4" /> Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
