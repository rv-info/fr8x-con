// FR8X-CON GodMode Email Services Configuration Helper

export type EmailServiceProvider = "resend" | "sendgrid" | "smtp" | "custom_api";

export type GodModeEmailSettings = {
  // Password Reset Service
  passwordResetFromEmail: string;
  passwordResetEnabled: boolean;

  // Subscription Service
  subscriptionEmail: string;
  subscriptionEnabled: boolean;

  // Online Email Service Setup
  emailServiceProvider: EmailServiceProvider;
  apiKey: string;
  smtpHost: string;
  smtpPort: string;
  smtpUser: string;
  smtpPass: string;
  smtpSecure: boolean;
  customApiUrl: string;

  // Email Content Templates
  resetSubject: string;
  subscriptionSubject: string;
};

export const DEFAULT_GODMODE_EMAIL_SETTINGS: GodModeEmailSettings = {
  passwordResetFromEmail: "tech@fr8x.in",
  passwordResetEnabled: true,

  subscriptionEmail: "support@fr8x.in",
  subscriptionEnabled: true,

  emailServiceProvider: "resend",
  apiKey: "",
  smtpHost: "smtp.gmail.com",
  smtpPort: "587",
  smtpUser: "tech@fr8x.in",
  smtpPass: "",
  smtpSecure: true,
  customApiUrl: "",

  resetSubject: "Reset Your Password - FR8X-CON",
  subscriptionSubject: "Welcome to FR8X-CON Updates",
};

const STORAGE_KEY = "fr8x_godmode_email_settings";

export function getGodModeEmailSettings(): GodModeEmailSettings {
  if (typeof window === "undefined") return DEFAULT_GODMODE_EMAIL_SETTINGS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return { ...DEFAULT_GODMODE_EMAIL_SETTINGS, ...JSON.parse(saved) };
    }
  } catch (e) {
    console.error("Failed to read email settings from localStorage:", e);
  }
  return DEFAULT_GODMODE_EMAIL_SETTINGS;
}

export function saveGodModeEmailSettings(settings: GodModeEmailSettings): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (e) {
    console.error("Failed to save email settings to localStorage:", e);
  }
}
