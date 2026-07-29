// FR8X-CON Security Center, Authentication Policy & System Monitoring Engine
"use client";

export interface AuthenticationSettingsDoc {
  minPasswordLength: number;
  requireUppercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  sessionTimeoutMinutes: number;
  maxConcurrentSessions: number;
  mfaEnabled: boolean;
  googleLoginEnabled: boolean;
  microsoftLoginEnabled: boolean;
  passkeySupportReady: boolean;
}

export interface UserRegistrationSettingsDoc {
  emailVerificationRequired: boolean;
  approvalMode: "auto" | "manual";
  allowedCountries: string[];
  blockedCountries: string[];
  allowedDomains: string[];
  blockedDomains: string[];
  allowedBusinessTypes: string[];
}

export interface SecurityEventRecord {
  id: string;
  type: "failed_login" | "blocked_ip" | "suspicious_activity" | "locked_account" | "admin_action";
  ipAddress: string;
  location: string;
  targetUser?: string;
  details: string;
  timestamp: string;
  severity: "low" | "medium" | "high" | "critical";
}

export interface SystemMonitoringSnapshot {
  authUsersCount: number;
  firestoreReadsToday: number;
  firestoreWritesToday: number;
  storageUsageMB: number;
  emailQueuePending: number;
  paymentQueuePending: number;
  scheduledJobsActive: number;
  failedJobsCount: number;
  cpuUsagePct: number;
  memoryUsagePct: number;
  systemStatus: "healthy" | "degraded" | "maintenance";
  lastCheckTimestamp: string;
}

export const DEFAULT_AUTH_SETTINGS: AuthenticationSettingsDoc = {
  minPasswordLength: 8,
  requireUppercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  sessionTimeoutMinutes: 60,
  maxConcurrentSessions: 1,
  mfaEnabled: false,
  googleLoginEnabled: true,
  microsoftLoginEnabled: true,
  passkeySupportReady: true,
};

export const DEFAULT_REGISTRATION_SETTINGS: UserRegistrationSettingsDoc = {
  emailVerificationRequired: true,
  approvalMode: "auto",
  allowedCountries: ["India", "UAE", "Singapore", "United States", "United Kingdom", "Netherlands", "Germany"],
  blockedCountries: [],
  allowedDomains: [],
  blockedDomains: ["tempmail.com", "dispostable.com", "mailinator.com", "10minutemail.com"],
  allowedBusinessTypes: [
    "Freight Forwarder",
    "Shipping Line / MLO",
    "Exporter",
    "Importer",
    "Customs Broker",
    "CHA",
    "Transporter",
    "Warehouse Operator",
    "NVOCC",
  ],
};

export const SAMPLE_SECURITY_EVENTS: SecurityEventRecord[] = [
  {
    id: "sec_101",
    type: "failed_login",
    ipAddress: "185.220.101.5",
    location: "Frankfurt, Germany",
    targetUser: "admin@fr8x.in",
    details: "Failed admin login attempt — invalid password",
    timestamp: new Date(Date.now() - 1800000).toISOString(),
    severity: "medium",
  },
  {
    id: "sec_102",
    type: "blocked_ip",
    ipAddress: "194.26.29.112",
    location: "Moscow, Russia",
    details: "Automated rate scraping attempt blocked by firewall",
    timestamp: new Date(Date.now() - 7200000).toISOString(),
    severity: "high",
  },
  {
    id: "sec_103",
    type: "admin_action",
    ipAddress: "103.21.124.8",
    location: "Mumbai, India",
    targetUser: "support@fr8x.in",
    details: "GodMode updated payment gateway settings",
    timestamp: new Date(Date.now() - 14400000).toISOString(),
    severity: "low",
  },
];

export const INITIAL_SYSTEM_MONITORING: SystemMonitoringSnapshot = {
  authUsersCount: 1480,
  firestoreReadsToday: 42100,
  firestoreWritesToday: 3840,
  storageUsageMB: 4820,
  emailQueuePending: 0,
  paymentQueuePending: 1,
  scheduledJobsActive: 4,
  failedJobsCount: 0,
  cpuUsagePct: 18,
  memoryUsagePct: 34,
  systemStatus: "healthy",
  lastCheckTimestamp: new Date().toISOString(),
};
