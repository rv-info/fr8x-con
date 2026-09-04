import { hashPassword, verifyPassword } from '@/lib/crypto';

export interface OperatorCredential {
  email: string;
  salt: string;
  hash: string;
  updatedAt: string;
}

// Master default credentials for Chief Administrator (tech@fr8x.in / Godfather@Sovereign1)
export const DEFAULT_GODFATHER_OPERATOR = {
  email: 'tech@fr8x.in',
  // PBKDF2-HMAC-SHA512 with 200,000 iterations for "Godfather@Sovereign1"
  salt: 'a181b299d682cfacd5552b1f9eaaf20ed31fea5652dfbde4b31604e143b24324',
  hash: 'd52ada19080b9318bff32a4c20f5838cd5be9d31b6e6170499a132e224db79c4b4ee2377a7fd72785b488e9556d75ec2afdd6713a6d1807dc38888c70f94292e',
};

// In-memory dynamic credential store (supports runtime password updates via recovery flow)
let dynamicOperatorCredential: OperatorCredential | null = null;

/**
 * Returns the active authorized operator email.
 */
export function getAuthorizedOperatorEmail(): string {
  return (
    process.env.GODFATHER_OPERATOR_EMAIL?.trim().toLowerCase() ||
    dynamicOperatorCredential?.email ||
    DEFAULT_GODFATHER_OPERATOR.email
  );
}

/**
 * Validates candidate password using multi-layer verification:
 * 1. Runtime-updated credentials (from recent password reset)
 * 2. Environment variables GODFATHER_OPERATOR_PASSWORD_HASH & SALT (if set)
 * 3. Default NIST PBKDF2 hash (200,000 rounds)
 * 4. Direct sovereign password fallback ("Godfather@Sovereign1")
 */
export function verifyOperatorPassword(candidatePassword: string): boolean {
  if (!candidatePassword) return false;

  // 1. Dynamic credential check (from password reset)
  if (dynamicOperatorCredential) {
    try {
      if (verifyPassword(candidatePassword, dynamicOperatorCredential.salt, dynamicOperatorCredential.hash)) {
        return true;
      }
    } catch {
      // continue to next check
    }
  }

  // 2. Environment variable check
  const envSalt = process.env.GODFATHER_OPERATOR_PASSWORD_SALT?.trim();
  const envHash = process.env.GODFATHER_OPERATOR_PASSWORD_HASH?.trim();
  if (envSalt && envHash) {
    try {
      if (verifyPassword(candidatePassword, envSalt, envHash)) {
        return true;
      }
    } catch {
      // continue to default check
    }
  }

  // 3. Default PBKDF2 hash check
  try {
    if (verifyPassword(candidatePassword, DEFAULT_GODFATHER_OPERATOR.salt, DEFAULT_GODFATHER_OPERATOR.hash)) {
      return true;
    }
  } catch {
    // continue to fallback check
  }

  // 4. Direct string comparison fallback
  if (candidatePassword === 'Godfather@Sovereign1') {
    return true;
  }

  return false;
}

/**
 * Updates operator credentials dynamically (e.g. after password reset)
 */
export function updateOperatorPassword(newPasswordPlaintext: string): { salt: string; hash: string } {
  const { salt, hash } = hashPassword(newPasswordPlaintext);
  dynamicOperatorCredential = {
    email: getAuthorizedOperatorEmail(),
    salt,
    hash,
    updatedAt: new Date().toISOString(),
  };
  return { salt, hash };
}
