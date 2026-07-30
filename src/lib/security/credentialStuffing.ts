// FR8X-CON Credential Stuffing & Automated Bot Attack Detector
// Tracks authentication probes per IP across sliding time windows.

export interface CredentialStuffingAssessment {
  isRisk: boolean;
  score: number; // 0 to 100
  reason?: string;
  action: "allow" | "challenge" | "block";
}

interface IpAuthTracker {
  attempts: number;
  targetedAccounts: Set<string>;
  windowStart: number;
  lastAttemptAt: number;
}

const STUFFING_WINDOW_MS = 5 * 60 * 1000; // 5 minutes window
const MAX_ACCOUNTS_PER_IP = 4; // Max 4 different emails per IP in 5 min
const MAX_ATTEMPTS_PER_WINDOW = 12;

// In-memory store for Edge/Middleware tracking
const stuffingTrackerStore = new Map<string, IpAuthTracker>();

// Known bot User-Agent substrings
const BOT_USER_AGENTS = [
  "curl",
  "python",
  "postman",
  "httpx",
  "go-http-client",
  "wget",
  "headlesschrome",
  "puppeteer",
  "selenium",
  "playwright",
  "phantomjs",
];

/**
 * Evaluate credential stuffing risk for an authentication request
 */
export function evaluateCredentialStuffingRisk(
  ip: string,
  targetedAccount?: string,
  userAgent?: string
): CredentialStuffingAssessment {
  const now = Date.now();
  const ua = (userAgent || "").toLowerCase();

  let score = 0;
  const reasons: string[] = [];

  // 1. Check for automated bot signatures in User-Agent
  if (!userAgent || ua.trim().length === 0) {
    score += 35;
    reasons.push("Missing User-Agent header");
  } else if (BOT_USER_AGENTS.some((bot) => ua.includes(bot))) {
    score += 55;
    reasons.push(`Automated bot client detected (${ua.slice(0, 30)})`);
  }

  // 2. Track multi-account probing per IP
  let tracker = stuffingTrackerStore.get(ip);
  if (!tracker || now - tracker.windowStart > STUFFING_WINDOW_MS) {
    tracker = {
      attempts: 0,
      targetedAccounts: new Set<string>(),
      windowStart: now,
      lastAttemptAt: now,
    };
  }

  tracker.attempts += 1;
  tracker.lastAttemptAt = now;
  if (targetedAccount) {
    tracker.targetedAccounts.add(targetedAccount.toLowerCase().trim());
  }

  stuffingTrackerStore.set(ip, tracker);

  // Check unique account probing threshold
  const uniqueAccountCount = tracker.targetedAccounts.size;
  if (uniqueAccountCount >= MAX_ACCOUNTS_PER_IP) {
    score += 50;
    reasons.push(`Probing multiple accounts (${uniqueAccountCount} emails targeted from same IP)`);
  }

  // Check overall authentication attempt frequency
  if (tracker.attempts >= MAX_ATTEMPTS_PER_WINDOW) {
    score += 35;
    reasons.push(`High auth velocity burst (${tracker.attempts} attempts in 5m)`);
  }

  // Determine mitigation action
  const isRisk = score >= 50;
  let action: "allow" | "challenge" | "block" = "allow";
  if (score >= 75) {
    action = "block";
  } else if (score >= 40) {
    action = "challenge";
  }

  return {
    isRisk,
    score,
    reason: reasons.join(" | ") || "Normal user activity",
    action,
  };
}

/**
 * Cleanup expired tracker records periodically
 */
export function cleanupStuffingTrackerStore(): void {
  const now = Date.now();
  for (const [ip, tracker] of stuffingTrackerStore.entries()) {
    if (now - tracker.windowStart > STUFFING_WINDOW_MS) {
      stuffingTrackerStore.delete(ip);
    }
  }
}
