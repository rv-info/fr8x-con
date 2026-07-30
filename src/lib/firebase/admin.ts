// FR8X-CON Firebase Admin SDK — Server-Side Only
// Used exclusively in API routes and server actions.
// Never import this in client components.

import { initializeApp, getApps, cert, type App } from "firebase-admin/app";
import { getAuth, type Auth } from "firebase-admin/auth";
import { getFirestore, type Firestore, FieldValue } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

export { FieldValue };

function getAdminApp(): App {
  const existingApps = getApps();
  if (existingApps.length > 0) {
    return existingApps[0]!;
  }

  const projectId =
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fr8x-mock-project";
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL || "mock@fr8x.iam.gserviceaccount.com";
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n") || "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n";

  try {
    return initializeApp({
      credential: cert({ projectId, clientEmail, privateKey }),
      projectId,
    });
  } catch {
    return initializeApp({}, "fallback");
  }
}

export const adminApp: App = getAdminApp();
export const adminAuth: Auth = getApps().length > 0 ? getAuth(adminApp) : ({} as Auth);
export const adminDb: Firestore = getApps().length > 0 ? getFirestore(adminApp) : ({} as Firestore);
export const adminStorage: Storage = getApps().length > 0 ? getStorage(adminApp) : ({} as Storage);

