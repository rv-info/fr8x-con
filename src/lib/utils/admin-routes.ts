// FR8X-CON Admin Routes — SERVER ONLY
// CRITICAL: Do NOT import this file from any client component or page.
// These route strings must never appear in the user-facing JS bundle.
// Only import from: (admin) layout, API route handlers, and server actions.

export const ADMIN_ROUTES = {
  GODMODE: "/godmode",
  GODMODE_LOGIN: "/godmode/login",
  GODMODE_USERS: "/godmode/users",
  GODMODE_COMPANIES: "/godmode/companies",
  GODMODE_AUCTIONS: "/godmode/auctions",
  GODMODE_ADS: "/godmode/ads",
  GODMODE_AWARDS: "/godmode/awards",
  GODMODE_BLACKLIST: "/godmode/blacklist",
  GODMODE_MODERATION: "/godmode/moderation",
  GODMODE_VERIFICATION: "/godmode/verification",
  GODMODE_BILLING: "/godmode/billing",
  GODMODE_AUDIT: "/godmode/audit",
  GODMODE_SETTINGS: "/godmode/settings",
  GODMODE_LOCATIONS: "/godmode/locations",
  GODMODE_BACKUPS: "/godmode/backups",
} as const;
