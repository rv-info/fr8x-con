/**
 * lib/firebase/emulator.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * Firebase Local Suite Emulator Integration.
 * Allows deterministic, zero-cost, offline development and automated testing
 * without touching production Firestore, Auth, or Storage instances.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { Auth, connectAuthEmulator } from 'firebase/auth';
import { Firestore, connectFirestoreEmulator } from 'firebase/firestore';
import { FirebaseStorage, connectStorageEmulator } from 'firebase/storage';

export interface EmulatorConfig {
  authHost?: string;
  authPort?: number;
  firestoreHost?: string;
  firestorePort?: number;
  storageHost?: string;
  storagePort?: number;
}

const DEFAULT_EMULATOR_CONFIG: Required<EmulatorConfig> = {
  authHost: '127.0.0.1',
  authPort: 9099,
  firestoreHost: '127.0.0.1',
  firestorePort: 8080,
  storageHost: '127.0.0.1',
  storagePort: 9199,
};

let emulatorsConnected = false;

/**
 * Connects the Firebase client SDK to running local emulators if configured.
 * Safely guards against multi-connection crashes in Next.js Fast Refresh.
 */
export function connectFirebaseEmulators(
  auth: Auth,
  db: Firestore,
  storage: FirebaseStorage,
  customConfig?: EmulatorConfig
): boolean {
  if (emulatorsConnected) return true;

  const shouldConnect =
    process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === 'true' ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost' && process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === '1');

  if (!shouldConnect) return false;

  const cfg = { ...DEFAULT_EMULATOR_CONFIG, ...customConfig };

  try {
    if (auth && (auth as any).app) {
      connectAuthEmulator(auth, `http://${cfg.authHost}:${cfg.authPort}`, { disableWarnings: true });
    }
  } catch {
    // Emulator might already be connected in fast-refresh
  }

  try {
    if (db && (db as any).app) {
      connectFirestoreEmulator(db, cfg.firestoreHost, cfg.firestorePort);
    }
  } catch {
    // Emulator might already be connected
  }

  try {
    if (storage && (storage as any).app) {
      connectStorageEmulator(storage, cfg.storageHost, cfg.storagePort);
    }
  } catch {
    // Emulator might already be connected
  }

  emulatorsConnected = true;
  if (process.env.NODE_ENV === 'development') {
    console.info('[FR8X Firebase] Connected to local Firebase emulators successfully.');
  }
  return true;
}
