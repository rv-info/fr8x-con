// FR8X-CON Test Credentials Configuration File
// This file provides dummy test credentials for testing both Standard User and GodMode Super Admin access.
// DELETION / DISABLE RULE: If this file is deleted or ENABLED is set to false, demo authentication is disabled.
// EDIT PERMISSION: GodMode Super Administrator only.

export const DEMO_CREDENTIALS_CONFIG = {
  ENABLED: true,
  USERS: [
    {
      id: "demo-user-01",
      email: "user@fr8x.in",
      password: "User@123456",
      displayName: "Demo Freight Forwarder",
      companyName: "RAIVEGA Logistics Ltd",
      role: "freight_forwarder",
      isGodMode: false,
      membershipTier: "basic" as const,
      status: "active" as const,
    },
    {
      id: "demo-godmode-01",
      email: "admin@fr8x.in",
      password: "Admin@123456",
      displayName: "GodMode Super Administrator",
      companyName: "FR8X Enterprise Admin",
      role: "admin",
      isGodMode: true,
      membershipTier: "premium" as const,
      status: "active" as const,
    },
  ],
};

export function isDemoCredentialMatch(email: string, pass: string) {
  if (!DEMO_CREDENTIALS_CONFIG.ENABLED) return null;
  const cleanEmail = email.trim().toLowerCase();
  const found = DEMO_CREDENTIALS_CONFIG.USERS.find(
    (u) => u.email.toLowerCase() === cleanEmail && u.password === pass
  );
  return found || null;
}

export function getDemoUserSession(email: string) {
  if (!DEMO_CREDENTIALS_CONFIG.ENABLED) return null;
  const cleanEmail = email.trim().toLowerCase();
  return (
    DEMO_CREDENTIALS_CONFIG.USERS.find((u) => u.email.toLowerCase() === cleanEmail) || null
  );
}
