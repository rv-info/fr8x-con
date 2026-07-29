// FR8X-CON GodMode Enterprise Global System Settings & Control Center
"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Mail,
  Send,
  CheckCircle2,
  ShieldCheck,
  Key,
  Server,
  RefreshCw,
  ShieldAlert,
  Plus,
  Trash2,
  Lock,
  UserCheck,
  FileCode,
  Activity,
  Database,
  Sliders,
  History,
  Info,
  Layers,
  Cpu,
  AlertTriangle,
} from "lucide-react";
import {
  getGodModeEmailSettings,
  saveGodModeEmailSettings,
  type GodModeEmailSettings,
  type EmailServiceProvider,
} from "@/lib/utils/email-config";
import {
  sendCustomerPasswordResetEmail,
  sendSubscriptionNotification,
  getStoredEmailTemplates,
  saveStoredEmailTemplates,
  type EmailTemplateId,
  type EmailTemplateDoc,
} from "@/lib/email/service";
import {
  getFeatureToggles,
  saveFeatureToggles,
  type SystemFeatureToggles,
} from "@/lib/config/featureToggles";
import {
  DEFAULT_AUTH_SETTINGS,
  DEFAULT_REGISTRATION_SETTINGS,
  SAMPLE_SECURITY_EVENTS,
  INITIAL_SYSTEM_MONITORING,
  type AuthenticationSettingsDoc,
  type UserRegistrationSettingsDoc,
} from "@/lib/config/securityAndMonitoring";
import { logAuditAction, getStoredAuditLogs } from "@/lib/utils/auditLogger";

type SettingsTab =
  | "auth"
  | "registration"
  | "email"
  | "templates"
  | "toggles"
  | "monitoring"
  | "security"
  | "backups"
  | "audit"
  | "general";

export default function GodModeSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>("auth");
  const [isSaved, setIsSaved] = useState(false);

  // 1. Auth & Registration Policy State
  const [authSettings, setAuthSettings] = useState<AuthenticationSettingsDoc>(DEFAULT_AUTH_SETTINGS);
  const [regSettings, setRegSettings] = useState<UserRegistrationSettingsDoc>(DEFAULT_REGISTRATION_SETTINGS);
  const [newBlockedDomain, setNewBlockedDomain] = useState("");
  const [newAllowedDomain, setNewAllowedDomain] = useState("");

  // 2. Email & Templates State
  const [emailSettings, setEmailSettings] = useState<GodModeEmailSettings>(getGodModeEmailSettings());
  const [emailTemplates, setEmailTemplates] = useState<Record<EmailTemplateId, EmailTemplateDoc>>(getStoredEmailTemplates());
  const [selectedTemplateId, setSelectedTemplateId] = useState<EmailTemplateId>("registration");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testStatus, setTestStatus] = useState<{ message: string; type: "success" | "error" } | null>(null);

  // 3. Feature Toggles
  const [featureToggles, setFeatureToggles] = useState<SystemFeatureToggles>(getFeatureToggles());

  // 4. Monitoring & Backup State
  const [monitoring, setMonitoring] = useState(INITIAL_SYSTEM_MONITORING);
  const [securityLogs, setSecurityLogs] = useState(SAMPLE_SECURITY_EVENTS);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // 5. General Settings
  const [appName, setAppName] = useState("FR8X-CON");
  const [currencyTtl, setCurrencyTtl] = useState("300");

  useEffect(() => {
    setEmailSettings(getGodModeEmailSettings());
    setFeatureToggles(getFeatureToggles());
    setEmailTemplates(getStoredEmailTemplates());
    setAuditLogs(getStoredAuditLogs());
  }, []);

  const handleSaveAll = () => {
    saveGodModeEmailSettings(emailSettings);
    saveFeatureToggles(featureToggles);
    saveStoredEmailTemplates(emailTemplates);

    logAuditAction({
      action: "UPDATE_SYSTEM_SETTINGS",
      module: "Global System Settings",
      details: "GodMode updated system authentication, registration policies, email adapters, and feature toggles.",
    });

    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleToggleModule = (key: keyof SystemFeatureToggles) => {
    const updated = { ...featureToggles, [key]: !featureToggles[key] };
    setFeatureToggles(updated);
    saveFeatureToggles(updated);
  };

  const addBlockedDomain = () => {
    if (!newBlockedDomain.trim()) return;
    const clean = newBlockedDomain.trim().toLowerCase().replace("@", "");
    if (!regSettings.blockedDomains.includes(clean)) {
      setRegSettings((prev) => ({
        ...prev,
        blockedDomains: [...prev.blockedDomains, clean],
      }));
    }
    setNewBlockedDomain("");
  };

  const removeBlockedDomain = (domain: string) => {
    setRegSettings((prev) => ({
      ...prev,
      blockedDomains: prev.blockedDomains.filter((d) => d !== domain),
    }));
  };

  const handleTestEmailDispatch = async () => {
    setIsTesting(true);
    setTestStatus(null);
    try {
      const res = await sendCustomerPasswordResetEmail("customer.test@fr8x.in");
      if (res.success) {
        setTestStatus({
          message: `Email dispatched successfully via ${emailSettings.emailServiceProvider.toUpperCase()} (${emailSettings.passwordResetFromEmail})!`,
          type: "success",
        });
      } else {
        setTestStatus({
          message: res.error || "Failed to dispatch test email",
          type: "error",
        });
      }
    } catch (e: any) {
      setTestStatus({ message: e.message || "Error testing email dispatcher", type: "error" });
    } finally {
      setIsTesting(false);
    }
  };

  const currentTemplate = emailTemplates[selectedTemplateId];

  return (
    <div className="space-y-6 max-w-full pb-12 text-left">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-display-sm font-bold text-[var(--fr8x-jet)]">
              GodMode Global System Administration Console
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-100 text-amber-800 rounded-full flex items-center gap-1 border border-amber-300">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" /> SUPER ADMIN
            </span>
          </div>
          <p className="text-body-sm text-foreground-secondary mt-1">
            Manage security policies, Zoho Free email adapters, email templates, feature flags, backups, monitoring, and audit logs.
          </p>
        </div>

        <button
          type="button"
          onClick={handleSaveAll}
          className="fr8x-btn-primary bg-[#56C5F0] hover:bg-[#3ABFF0] px-5 py-2 flex items-center gap-1.5 text-body-sm font-bold shadow-xs"
        >
          <Save className="h-4 w-4" /> Save System Settings
        </button>
      </div>

      {isSaved && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-3 text-emerald-800 text-body-sm font-medium animate-fadeIn">
          <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
          GodMode enterprise policies, feature flags, and email configurations updated successfully!
        </div>
      )}

      {/* 10 Enterprise Tabs Bar */}
      <div className="flex items-center gap-1 overflow-x-auto no-scrollbar bg-white p-1.5 rounded-xl border border-border text-[11px]">
        <button
          onClick={() => setActiveTab("auth")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === "auth" ? "bg-[var(--fr8x-periwinkle)] text-white shadow-xs" : "text-foreground-secondary hover:bg-slate-100"
          }`}
        >
          <Lock className="h-3.5 w-3.5" /> 1. Authentication
        </button>

        <button
          onClick={() => setActiveTab("registration")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === "registration" ? "bg-[var(--fr8x-periwinkle)] text-white shadow-xs" : "text-foreground-secondary hover:bg-slate-100"
          }`}
        >
          <UserCheck className="h-3.5 w-3.5" /> 2. Registration Policy
        </button>

        <button
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === "email" ? "bg-[var(--fr8x-periwinkle)] text-white shadow-xs" : "text-foreground-secondary hover:bg-slate-100"
          }`}
        >
          <Mail className="h-3.5 w-3.5" /> 3. Zoho Email Setup
        </button>

        <button
          onClick={() => setActiveTab("templates")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === "templates" ? "bg-[var(--fr8x-periwinkle)] text-white shadow-xs" : "text-foreground-secondary hover:bg-slate-100"
          }`}
        >
          <FileCode className="h-3.5 w-3.5" /> 4. Email Templates
        </button>

        <button
          onClick={() => setActiveTab("toggles")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === "toggles" ? "bg-[var(--fr8x-periwinkle)] text-white shadow-xs" : "text-foreground-secondary hover:bg-slate-100"
          }`}
        >
          <Sliders className="h-3.5 w-3.5" /> 5. Feature Toggles
        </button>

        <button
          onClick={() => setActiveTab("monitoring")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === "monitoring" ? "bg-[var(--fr8x-periwinkle)] text-white shadow-xs" : "text-foreground-secondary hover:bg-slate-100"
          }`}
        >
          <Activity className="h-3.5 w-3.5" /> 6. System Monitoring
        </button>

        <button
          onClick={() => setActiveTab("security")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === "security" ? "bg-[var(--fr8x-periwinkle)] text-white shadow-xs" : "text-foreground-secondary hover:bg-slate-100"
          }`}
        >
          <ShieldAlert className="h-3.5 w-3.5" /> 7. Security Center
        </button>

        <button
          onClick={() => setActiveTab("backups")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === "backups" ? "bg-[var(--fr8x-periwinkle)] text-white shadow-xs" : "text-foreground-secondary hover:bg-slate-100"
          }`}
        >
          <Database className="h-3.5 w-3.5" /> 8. Backups & Restore
        </button>

        <button
          onClick={() => setActiveTab("audit")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === "audit" ? "bg-[var(--fr8x-periwinkle)] text-white shadow-xs" : "text-foreground-secondary hover:bg-slate-100"
          }`}
        >
          <History className="h-3.5 w-3.5" /> 9. Audit Log
        </button>

        <button
          onClick={() => setActiveTab("general")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-bold transition-all whitespace-nowrap ${
            activeTab === "general" ? "bg-[var(--fr8x-periwinkle)] text-white shadow-xs" : "text-foreground-secondary hover:bg-slate-100"
          }`}
        >
          <Layers className="h-3.5 w-3.5" /> 10. General Defaults
        </button>
      </div>

      {/* TAB 1: AUTHENTICATION SETTINGS */}
      {activeTab === "auth" && (
        <div className="fr8x-card p-6 bg-white space-y-4">
          <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] border-b border-border pb-2 flex items-center gap-2">
            <Lock className="h-5 w-5 text-[var(--fr8x-periwinkle)]" /> Authentication & Session Security Policy
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-body-sm">
            <div>
              <label className="fr8x-label block mb-1 text-xs">Minimum Password Length</label>
              <input
                type="number"
                value={authSettings.minPasswordLength}
                onChange={(e) => setAuthSettings({ ...authSettings, minPasswordLength: parseInt(e.target.value) || 8 })}
                className="fr8x-input"
              />
            </div>

            <div>
              <label className="fr8x-label block mb-1 text-xs">Session Timeout (Minutes)</label>
              <input
                type="number"
                value={authSettings.sessionTimeoutMinutes}
                onChange={(e) => setAuthSettings({ ...authSettings, sessionTimeoutMinutes: parseInt(e.target.value) || 60 })}
                className="fr8x-input"
              />
            </div>

            <div>
              <label className="fr8x-label block mb-1 text-xs">Max Concurrent Sessions</label>
              <input
                type="number"
                value={authSettings.maxConcurrentSessions}
                onChange={(e) => setAuthSettings({ ...authSettings, maxConcurrentSessions: parseInt(e.target.value) || 1 })}
                className="fr8x-input font-bold"
              />
            </div>
          </div>

          <div className="pt-2 grid grid-cols-2 sm:grid-cols-4 gap-3 text-caption">
            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={authSettings.requireUppercase}
                onChange={(e) => setAuthSettings({ ...authSettings, requireUppercase: e.target.checked })}
              />
              Require Uppercase
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={authSettings.requireNumbers}
                onChange={(e) => setAuthSettings({ ...authSettings, requireNumbers: e.target.checked })}
              />
              Require Numbers
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={authSettings.mfaEnabled}
                onChange={(e) => setAuthSettings({ ...authSettings, mfaEnabled: e.target.checked })}
              />
              Enable MFA (2FA)
            </label>

            <label className="flex items-center gap-2 cursor-pointer font-semibold">
              <input
                type="checkbox"
                checked={authSettings.passkeySupportReady}
                onChange={(e) => setAuthSettings({ ...authSettings, passkeySupportReady: e.target.checked })}
              />
              Passkey Support Ready
            </label>
          </div>
        </div>
      )}

      {/* TAB 2: USER REGISTRATION SETTINGS */}
      {activeTab === "registration" && (
        <div className="fr8x-card p-6 bg-white space-y-4">
          <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] border-b border-border pb-2 flex items-center gap-2">
            <UserCheck className="h-5 w-5 text-emerald-600" /> User Registration & Corporate Verification Policy
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-body-sm">
            <div>
              <label className="fr8x-label block mb-1 text-xs">Account Approval Mode</label>
              <select
                value={regSettings.approvalMode}
                onChange={(e) => setRegSettings({ ...regSettings, approvalMode: e.target.value as any })}
                className="fr8x-input font-bold"
              >
                <option value="auto">Automatic Immediate Approval</option>
                <option value="manual">Manual Admin Review Required</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-body-sm font-semibold">
                <input
                  type="checkbox"
                  checked={regSettings.emailVerificationRequired}
                  onChange={(e) => setRegSettings({ ...regSettings, emailVerificationRequired: e.target.checked })}
                />
                Require Mandatory Email Verification Link
              </label>
            </div>
          </div>

          {/* Blocked Domains */}
          <div className="space-y-2 pt-2">
            <label className="fr8x-label block font-semibold">Blocked Email Domains</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newBlockedDomain}
                onChange={(e) => setNewBlockedDomain(e.target.value)}
                placeholder="e.g. mailinator.com"
                className="fr8x-input flex-1 text-xs"
              />
              <button onClick={addBlockedDomain} className="fr8x-btn-primary bg-amber-600 text-xs py-1 px-3">
                Add Blocked Domain
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {regSettings.blockedDomains.map((d) => (
                <span key={d} className="px-2 py-0.5 bg-rose-100 text-rose-800 rounded font-mono text-[10px] flex items-center gap-1">
                  @{d} <button onClick={() => removeBlockedDomain(d)} className="hover:text-rose-950">×</button>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ZOHO EMAIL SETUP */}
      {activeTab === "email" && (
        <div className="fr8x-card p-6 bg-white space-y-5 border-l-4 border-l-[#56C5F0]">
          <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] border-b border-border pb-2 flex items-center gap-2">
            <Mail className="h-5 w-5 text-[#56C5F0]" /> Zoho Mail Free Ready Email Dispatcher Setup
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-body-sm">
            <div>
              <label className="fr8x-label block mb-1 text-xs">Email Adapter Provider</label>
              <select
                value={emailSettings.emailServiceProvider}
                onChange={(e) => setEmailSettings({ ...emailSettings, emailServiceProvider: e.target.value as EmailServiceProvider })}
                className="fr8x-input font-bold"
              >
                <option value="smtp">Zoho Mail Free (SMTP Adapter)</option>
                <option value="resend">Resend API (Adapter)</option>
                <option value="sendgrid">SendGrid API (Adapter)</option>
                <option value="custom_api">Custom Webhook Adapter</option>
              </select>
            </div>

            <div>
              <label className="fr8x-label block mb-1 text-xs">SMTP Host</label>
              <input
                type="text"
                value={emailSettings.smtpHost}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpHost: e.target.value })}
                className="fr8x-input font-mono"
                placeholder="smtppro.zoho.com"
              />
            </div>

            <div>
              <label className="fr8x-label block mb-1 text-xs">SMTP Port</label>
              <input
                type="text"
                value={emailSettings.smtpPort}
                onChange={(e) => setEmailSettings({ ...emailSettings, smtpPort: e.target.value })}
                className="fr8x-input font-mono"
                placeholder="465"
              />
            </div>

            <div>
              <label className="fr8x-label block mb-1 text-xs">Password Reset Sender (tech@fr8x.in)</label>
              <input
                type="email"
                value={emailSettings.passwordResetFromEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, passwordResetFromEmail: e.target.value })}
                className="fr8x-input font-mono"
              />
            </div>

            <div>
              <label className="fr8x-label block mb-1 text-xs">Support Channel Sender (support@fr8x.in)</label>
              <input
                type="email"
                value={emailSettings.subscriptionEmail}
                onChange={(e) => setEmailSettings({ ...emailSettings, subscriptionEmail: e.target.value })}
                className="fr8x-input font-mono"
              />
            </div>

            <div>
              <label className="fr8x-label block mb-1 text-xs">API Key / SMTP Password (Encrypted)</label>
              <div className="relative">
                <input
                  type={showApiKey ? "text" : "password"}
                  value={emailSettings.apiKey}
                  onChange={(e) => setEmailSettings({ ...emailSettings, apiKey: e.target.value })}
                  className="fr8x-input font-mono pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-blue-600"
                >
                  {showApiKey ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>

          {testStatus && (
            <div className={`p-3 text-caption font-semibold rounded flex items-center gap-2 ${testStatus.type === "success" ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
              {testStatus.message}
            </div>
          )}

          <div className="flex justify-start">
            <button
              onClick={handleTestEmailDispatch}
              disabled={isTesting}
              className="fr8x-btn-secondary text-xs py-1.5 px-3 flex items-center gap-1.5"
            >
              <Send className="h-3.5 w-3.5 text-blue-600" /> Test Zoho SMTP Dispatcher Connection
            </button>
          </div>
        </div>
      )}

      {/* TAB 4: EDITABLE EMAIL TEMPLATES */}
      {activeTab === "templates" && (
        <div className="fr8x-card p-6 bg-white space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] flex items-center gap-2">
              <FileCode className="h-5 w-5 text-purple-600" /> 4. Editable HTML System Email Templates
            </h2>
            <select
              value={selectedTemplateId}
              onChange={(e) => setSelectedTemplateId(e.target.value as EmailTemplateId)}
              className="fr8x-input text-xs font-bold w-64 bg-slate-50"
            >
              {Object.values(emailTemplates).map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {currentTemplate && (
            <div className="space-y-3">
              <div>
                <label className="fr8x-label block mb-1 text-xs">Subject Line Pattern</label>
                <input
                  type="text"
                  value={currentTemplate.subject}
                  onChange={(e) => {
                    const updated = { ...currentTemplate, subject: e.target.value };
                    setEmailTemplates({ ...emailTemplates, [selectedTemplateId]: updated });
                  }}
                  className="fr8x-input font-bold"
                />
              </div>

              <div>
                <label className="fr8x-label block mb-1 text-xs">Available Placeholders</label>
                <div className="flex flex-wrap gap-1.5">
                  {currentTemplate.placeholders.map((ph) => (
                    <span key={ph} className="px-2 py-0.5 bg-purple-100 text-purple-800 rounded font-mono text-[10px]">
                      {ph}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <label className="fr8x-label block mb-1 text-xs">HTML Email Template Code</label>
                <textarea
                  rows={6}
                  value={currentTemplate.htmlTemplate}
                  onChange={(e) => {
                    const updated = { ...currentTemplate, htmlTemplate: e.target.value };
                    setEmailTemplates({ ...emailTemplates, [selectedTemplateId]: updated });
                  }}
                  className="fr8x-input font-mono text-xs"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: LIVE FEATURE TOGGLES */}
      {activeTab === "toggles" && (
        <div className="fr8x-card p-6 bg-white space-y-4">
          <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] border-b border-border pb-2 flex items-center gap-2">
            <Sliders className="h-5 w-5 text-indigo-600" /> 5. Dynamic Module Feature Flags (No Redeploy)
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {(
              [
                ["feedModule", "Feed & Logistics Network"],
                ["reverseAuctionsModule", "Reverse Auctions Module"],
                ["messagingModule", "Enterprise Real-Time Chat"],
                ["contactsModule", "Approved Contacts Panel"],
                ["jobsModule", "Logistics Jobs Board"],
                ["aiAnalyticsModule", "AI Rate Intelligence"],
                ["advertisementsModule", "Promoted Ad Engine"],
                ["userRegistration", "New User Registrations"],
                ["maintenanceMode", "Platform Maintenance Mode"],
              ] as const
            ).map(([key, label]) => (
              <div key={key} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between">
                <span className="font-bold text-[11px] text-[var(--fr8x-jet)]">{label}</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={featureToggles[key as keyof SystemFeatureToggles] as boolean}
                    onChange={() => handleToggleModule(key as keyof SystemFeatureToggles)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: SYSTEM MONITORING */}
      {activeTab === "monitoring" && (
        <div className="fr8x-card p-6 bg-white space-y-4">
          <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] border-b border-border pb-2 flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-600" /> 6. System Monitoring & Health Metrics
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3 bg-slate-50 border rounded-xl">
              <p className="text-caption text-foreground-secondary">Auth Users</p>
              <p className="text-heading-lg font-bold text-[var(--fr8x-jet)]">{monitoring.authUsersCount}</p>
            </div>
            <div className="p-3 bg-slate-50 border rounded-xl">
              <p className="text-caption text-foreground-secondary">Firestore Reads Today</p>
              <p className="text-heading-lg font-bold text-blue-600">{monitoring.firestoreReadsToday.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50 border rounded-xl">
              <p className="text-caption text-foreground-secondary">Firestore Writes Today</p>
              <p className="text-heading-lg font-bold text-emerald-600">{monitoring.firestoreWritesToday.toLocaleString()}</p>
            </div>
            <div className="p-3 bg-slate-50 border rounded-xl">
              <p className="text-caption text-foreground-secondary">Storage Used</p>
              <p className="text-heading-lg font-bold text-purple-600">{monitoring.storageUsageMB} MB</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: SECURITY CENTER */}
      {activeTab === "security" && (
        <div className="fr8x-card p-6 bg-white space-y-4">
          <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] border-b border-border pb-2 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-red-600" /> 7. Security Center & Threat Monitoring
          </h2>

          <div className="divide-y divide-slate-100">
            {securityLogs.map((sec) => (
              <div key={sec.id} className="py-2.5 flex items-center justify-between text-body-sm">
                <div>
                  <p className="font-bold text-[var(--fr8x-jet)]">{sec.details}</p>
                  <p className="text-caption text-foreground-secondary">IP: {sec.ipAddress} • {sec.location}</p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800 uppercase">
                  {sec.severity}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 8: BACKUP & RESTORE */}
      {activeTab === "backups" && (
        <div className="fr8x-card p-6 bg-white space-y-4">
          <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] border-b border-border pb-2 flex items-center gap-2">
            <Database className="h-5 w-5 text-blue-600" /> 8. Firestore Snapshot Backups & Restore
          </h2>
          <p className="text-body-sm text-foreground-secondary">Daily automated backups at 12:00 AM IST. Trigger manual snapshot creation below.</p>
          <button className="fr8x-btn-primary bg-blue-600 text-white text-xs py-2 px-4">Trigger Manual Snapshot Backup</button>
        </div>
      )}

      {/* TAB 9: AUDIT LOG */}
      {activeTab === "audit" && (
        <div className="fr8x-card p-6 bg-white space-y-4">
          <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] border-b border-border pb-2 flex items-center gap-2">
            <History className="h-5 w-5 text-amber-600" /> 9. Immutable Admin Audit Trail Log
          </h2>

          <div className="divide-y divide-slate-100 text-body-sm max-h-96 overflow-y-auto">
            {auditLogs.length === 0 ? (
              <p className="py-4 text-center text-foreground-muted">No audit logs recorded yet.</p>
            ) : (
              auditLogs.map((log, idx) => (
                <div key={log.id || idx} className="py-2">
                  <div className="flex items-center justify-between font-bold text-[11px] text-[var(--fr8x-jet)]">
                    <span>{log.action} ({log.module})</span>
                    <span className="text-foreground-muted text-[10px]">{new Date(log.timestamp).toLocaleString()}</span>
                  </div>
                  <p className="text-caption text-foreground-secondary mt-0.5">{log.details}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 10: GENERAL DEFAULTS */}
      {activeTab === "general" && (
        <div className="fr8x-card p-6 bg-white space-y-4">
          <h2 className="text-heading-md font-bold text-[var(--fr8x-jet)] border-b border-border pb-2">10. General Defaults</h2>
          <div className="grid grid-cols-2 gap-4 text-body-sm">
            <div>
              <label className="fr8x-label block mb-1">Platform Name</label>
              <input type="text" value={appName} onChange={(e) => setAppName(e.target.value)} className="fr8x-input font-bold" />
            </div>
            <div>
              <label className="fr8x-label block mb-1">Currency Cache TTL (Sec)</label>
              <input type="number" value={currencyTtl} onChange={(e) => setCurrencyTtl(e.target.value)} className="fr8x-input font-bold" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
