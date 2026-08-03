// FR8X-CON Secure Cookie Helper — Non-Sensitive Preferences Only
// Never store authentication tokens or sensitive credentials in client-accessible cookies.

export type CookiePreference = {
  language?: string;
  theme?: "light";
  sessionPref?: string;
  recentlyViewedFilters?: Record<string, any>;
};

const PREFERENCE_COOKIE_NAME = "fr8x_user_preferences";

/** Set a non-sensitive preference cookie */
export function setPreferenceCookie(key: keyof CookiePreference, value: any, days = 365): void {
  if (typeof document === "undefined") return;
  try {
    const current = getPreferenceCookies();
    current[key] = value as never;
    const json = JSON.stringify(current);
    const encoded = encodeURIComponent(json);
    const expires = new Date(Date.now() + days * 86400 * 1000).toUTCString();
    document.cookie = `${PREFERENCE_COOKIE_NAME}=${encoded}; expires=${expires}; path=/; SameSite=Lax; Secure`;
  } catch (err) {
    console.warn("Failed to set preference cookie:", err);
  }
}

/** Get all non-sensitive preference cookies */
export function getPreferenceCookies(): CookiePreference {
  if (typeof document === "undefined") return {};
  try {
    const cookies = document.cookie.split("; ");
    for (const c of cookies) {
      const [name, val] = c.split("=");
      if (name === PREFERENCE_COOKIE_NAME && val) {
        return JSON.parse(decodeURIComponent(val));
      }
    }
  } catch {
    /* ignore malformed cookie */
  }
  return {};
}

/** Get a specific non-sensitive preference cookie value */
export function getPreferenceCookie<K extends keyof CookiePreference>(key: K): CookiePreference[K] | undefined {
  const prefs = getPreferenceCookies();
  return prefs[key];
}
