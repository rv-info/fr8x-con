// Script to provision GodMode Admin account in Firebase Auth & Firestore
import fetch from "node-fetch";

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCTFPoToXBFIk4BFTcI3a3x5geBTZlWjk";
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fr8x-con";
const EMAIL = "support@fr8x.in";
const PASSWORD = "QWERTY@123x";

async function main() {
  console.log(`[SEED] Provisioning GodMode user: ${EMAIL}...`);

  let uid = "";
  let idToken = "";

  // 1. Try Signing In via Firebase Identity Toolkit REST API
  try {
    const signInRes = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
      }
    );

    const signInData = await signInRes.json();

    if (signInRes.ok && signInData.localId) {
      uid = signInData.localId;
      idToken = signInData.idToken;
      console.log(`[AUTH] Successfully signed in user ${EMAIL} (UID: ${uid})`);
    } else {
      console.log(`[AUTH] Sign-in notice (${signInData.error?.message}). Attempting account creation...`);

      // 2. Try Signing Up via Firebase Identity Toolkit REST API
      const signUpRes = await fetch(
        `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: EMAIL, password: PASSWORD, returnSecureToken: true }),
        }
      );

      const signUpData = await signUpRes.json();

      if (signUpRes.ok && signUpData.localId) {
        uid = signUpData.localId;
        idToken = signUpData.idToken;
        console.log(`[AUTH] Successfully created user ${EMAIL} in Firebase Auth (UID: ${uid})`);
      } else {
        console.error("[AUTH ERROR]", signUpData.error);
      }
    }
  } catch (err) {
    console.error("[NETWORK ERROR]", err);
  }

  // 3. Write User Document to Firestore REST API
  if (uid && idToken) {
    console.log(`[FIRESTORE] Writing user profile with isGodMode: true to Firestore...`);
    try {
      const firestoreUrl = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/users/${uid}?key=${FIREBASE_API_KEY}`;
      const patchRes = await fetch(firestoreUrl, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          fields: {
            email: { stringValue: EMAIL },
            displayName: { stringValue: "GodMode Administrator" },
            role: { stringValue: "admin" },
            isGodMode: { booleanValue: true },
            membershipTier: { stringValue: "premium" },
            status: { stringValue: "active" },
            emailVerified: { booleanValue: true },
            updatedAt: { stringValue: new Date().toISOString() },
          },
        }),
      });

      const patchData = await patchRes.json();
      if (patchRes.ok) {
        console.log(`[SUCCESS] Firestore document users/${uid} updated with isGodMode: true!`);
      } else {
        console.log(`[FIRESTORE NOTICE] ${JSON.stringify(patchData)}`);
      }
    } catch (fsErr) {
      console.error("[FIRESTORE ERROR]", fsErr);
    }
  }

  console.log("[COMPLETE] Provisioning script finished.");
}

main();
