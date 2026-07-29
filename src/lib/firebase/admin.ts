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
    process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error(
      "Firebase Admin SDK is not configured. Please set FIREBASE_PROJECT_ID, " +
      "FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY in your environment variables."
    );
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
    projectId,
  });
}

export const adminApp: App = getAdminApp();
export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);
export const adminStorage: Storage = getStorage(adminApp);
