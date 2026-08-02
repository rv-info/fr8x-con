// FR8X-CON Content Moderation Utility
// Scans post text, auction descriptions, comments for inappropriate or abusive content

const FORBIDDEN_PATTERNS = [
  // Profanity & Harassment
  /\b(hate|abuse|racist|bitch|bastard|idiot|scam|scammer|fraudster|cheat)\b/i,
  // Explicit / Pornographic terms
  /\b(porn|xxx|nude|sex|adult|erotic|escort|strip)\b/i,
  // Cyber threats / Malicious patterns
  /\b(hack|phishing|exploit|malware|virus|trojan)\b/i,
];

export interface ModerationResult {
  isClean: boolean;
  flaggedReason?: string;
  matchedTerm?: string;
}

export function validateContentModeration(text: string): ModerationResult {
  if (!text || !text.trim()) {
    return { isClean: true };
  }

  const normalized = text.toLowerCase();

  for (const pattern of FORBIDDEN_PATTERNS) {
    const match = normalized.match(pattern);
    if (match) {
      return {
        isClean: false,
        flaggedReason: "Content contains prohibited or offensive terms under platform safety rules.",
        matchedTerm: match[0],
      };
    }
  }

  return { isClean: true };
}
