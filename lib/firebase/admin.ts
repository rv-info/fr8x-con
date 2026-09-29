/**
 * lib/firebase/admin.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Firebase Admin SDK — SERVER-SIDE ONLY.
 * Never import this file from client components, pages, or hooks.
 * This module is tree-shaken by Next.js when `typeof window !== 'undefined'`.
 *
 * Exports: adminDb, adminAuth, adminStorage, verifyIdToken, setCustomClaims
 * ─────────────────────────────────────────────────────────────────────────────
 */

import type { App } from 'firebase-admin/app';
import type { Auth, DecodedIdToken } from 'firebase-admin/auth';
import type { Firestore } from 'firebase-admin/firestore';
import type { Storage } from 'firebase-admin/storage';

// ─── Environment validation ───────────────────────────────────────────────────
let _app: App | null = null;
let _db: Firestore | null = null;
let _auth: Auth | null = null;
let _storage: Storage | null = null;

function getAdminApp(): App | null {
  if (_app) return _app;

  // Dynamic import keeps firebase-admin OUT of client bundles
  const { initializeApp, getApps, cert } = require('firebase-admin/app');

  if (getApps().length > 0) {
    _app = getApps()[0];
    return _app!;
  }

  const projectId =
    process.env.FIREBASE_ADMIN_PROJECT_ID ||
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ||
    'fr8x-con';
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

  // If emulator is active, initialize without credentials
  if (process.env.FIREBASE_AUTH_EMULATOR_HOST || process.env.FIRESTORE_EMULATOR_HOST) {
    _app = initializeApp({ projectId });
    return _app;
  }

  if (!clientEmail || !rawPrivateKey) {
    if (process.env.NODE_ENV === 'development') {
      console.warn(
        '[FR8X Admin] FIREBASE_ADMIN_CLIENT_EMAIL or FIREBASE_ADMIN_PRIVATE_KEY is not set. ' +
        'Firebase Admin operations will operate in mock/degraded mode.'
      );
    }
    return null;
  }

  const privateKey = rawPrivateKey.replace(/\\n/g, '\n');

  _app = initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    projectId,
  });

  return _app!;
}

// ─── Public exports ───────────────────────────────────────────────────────────

/** Server-side Firestore instance with full Admin privileges */
export function getAdminDb(): Firestore {
  if (_db) return _db;
  const app = getAdminApp();
  if (!app) return {} as Firestore;
  const { getFirestore } = require('firebase-admin/firestore');
  _db = getFirestore(app);
  _db!.settings({ ignoreUndefinedProperties: true });
  return _db!;
}

/** Server-side Auth instance */
export function getAdminAuth(): Auth | null {
  if (_auth) return _auth;
  const app = getAdminApp();
  if (!app) return null;
  const { getAuth } = require('firebase-admin/auth');
  _auth = getAuth(app);
  return _auth;
}

/** Server-side Storage instance */
export function getAdminStorage(): Storage | null {
  if (_storage) return _storage;
  const app = getAdminApp();
  if (!app) return null;
  const { getStorage } = require('firebase-admin/storage');
  _storage = getStorage(app);
  return _storage;
}

// Convenience named exports (lazy properties — initialized on first access)
export const adminDb      = new Proxy({} as Firestore, { get: (_, k) => (getAdminDb() as any)?.[k] });
export const adminAuth    = new Proxy({} as Auth,      { get: (_, k) => (getAdminAuth() as any)?.[k] });
export const adminStorage = new Proxy({} as Storage,   { get: (_, k) => (getAdminStorage() as any)?.[k] });

// ─── Auth Utilities ───────────────────────────────────────────────────────────

/**
 * Mint a Firebase Custom Auth Token for client-side signInWithCustomToken().
 * Bridges server session tokens / cookies to client Firebase Auth SDK,
 * granting auth.currentUser and populating custom claims for Firestore Security Rules.
 */
export async function createCustomToken(
  uid: string,
  claims?: Partial<FR8XCustomClaims>
): Promise<string | null> {
  try {
    const auth = getAdminAuth();
    if (!auth) return null;
    return await auth.createCustomToken(uid, claims as any);
  } catch (err: any) {
    console.warn('[FR8X Admin] Failed to create custom token for uid:', uid, err.message);
    return null;
  }
}

/**
 * Verify a Firebase ID token from the Authorization header.
 * Returns null if token is invalid, expired, or revoked.
 */
export async function verifyIdToken(
  token: string,
  checkRevoked = true
): Promise<DecodedIdToken | null> {
  try {
    const auth = getAdminAuth();
    if (!auth) return null;
    return await auth.verifyIdToken(token, checkRevoked);
  } catch {
    return null;
  }
}

/**
 * FR8X Custom Claims Schema
 * These claims are embedded in the Firebase ID token and evaluated by
 * Firestore Security Rules. They are the authoritative source of truth for
 * user role and verification status.
 */
export interface FR8XCustomClaims {
  /** KYC verification status — only true after manual admin review */
  isVerified: boolean;
  /** User role, enforced by security rules */
  role: 'user' | 'company_admin' | 'billing_admin' | 'moderator' | 'super_admin' | 'godfather';
  /** Subscription plan */
  plan: 'trial' | 'professional' | 'premium';
  /** Golden Tick — awarded to verified premium users */
  hasGoldenTick: boolean;
  /** Godfather super-admin access flag */
  godfatherAccess?: boolean;
  /** Godfather sub-role for fine-grained access */
  subrole?: 'godfather_owner' | 'godfather_finance' | 'godfather_ops' | 'godfather_support';
  /** Company ID the user belongs to */
  companyId?: string;
  /** Plan expiry ISO string for server-side enforcement */
  planExpiresAt?: string;
}

/**
 * Atomically set custom claims on a user's Firebase Auth token.
 * Claims take effect on the user's NEXT token refresh (~1 hour).
 * For immediate effect, force token refresh on the client.
 *
 * @param uid     Firebase Auth UID
 * @param claims  Partial claims to merge (undefined fields are not removed)
 */
export async function setCustomClaims(
  uid: string,
  claims: Partial<FR8XCustomClaims>
): Promise<void> {
  const auth = getAdminAuth();
  if (!auth) return;
  // Fetch current claims to merge (never blindly overwrite)
  const user = await auth.getUser(uid);
  const existing = (user.customClaims ?? {}) as Partial<FR8XCustomClaims>;
  const merged   = { ...existing, ...claims };
  await auth.setCustomUserClaims(uid, merged);
}

/**
 * Revoke all refresh tokens for a user (force sign-out everywhere).
 * Use on account suspension, password change, or security incidents.
 */
export async function revokeAllSessions(uid: string): Promise<void> {
  const auth = getAdminAuth();
  if (!auth) return;
  await auth.revokeRefreshTokens(uid);
}

/**
 * Extract the Bearer token from an Authorization header.
 * Returns null if the header is absent or malformed.
 */
export function extractBearerToken(
  authHeader: string | null | undefined
): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7).trim();
  return token.length > 0 ? token : null;
}

/**
 * Server-side request authenticator — call at the top of every API route
 * that requires authentication.
 *
 * Usage:
 *   const decoded = await authenticateRequest(request);
 *   if (!decoded) return unauthorizedResponse();
 */
export async function authenticateRequest(
  request: Request | { headers: { get(name: string): string | null } }
): Promise<DecodedIdToken | null> {
  const authHeader =
    'headers' in request && typeof (request as any).headers.get === 'function'
      ? (request as any).headers.get('authorization')
      : null;
  const token = extractBearerToken(authHeader);
  if (!token) return null;
  return verifyIdToken(token);
}

/** Standardized 401 Unauthorized JSON response */
export function unauthorizedResponse(
  message = 'Authentication required'
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 401,
    headers: { 'Content-Type': 'application/json' },
  });
}

/** Standardized 403 Forbidden JSON response */
export function forbiddenResponse(
  message = 'Insufficient permissions'
): Response {
  return new Response(JSON.stringify({ error: message }), {
    status: 403,
    headers: { 'Content-Type': 'application/json' },
  });
}
