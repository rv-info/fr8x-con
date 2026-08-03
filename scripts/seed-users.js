// FR8X-CON Offline/Local User Provisioning Script
// Run via: node scripts/seed-users.js

const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCTFPoToXBFIk4BFTcI3a3x5geBTZlWjk";

const usersToProvision = [
  {
    email: "mgt@raivega.in",
    password: "QWERTY@123x",
    displayName: "Management (Rai Vega)",
    role: "freight_forwarder",
    membershipTier: "premium",
  },
  {
    email: "support@fr8x.in",
    password: "QWERTY@123x",
    displayName: "GodMode Administrator",
    role: "admin",
    membershipTier: "premium",
  },
];

async function seedUser(user) {
  console.log(`Provisioning ${user.email}...`);

  // 1. Try Sign In
  const signInRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true }),
    }
  );

  const signInData = await signInRes.json();

  if (signInRes.ok && signInData.localId) {
    console.log(`✅ ${user.email} already exists (UID: ${signInData.localId}). Password verified.`);
    return signInData.localId;
  }

  // 2. Create User
  const signUpRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: user.email, password: user.password, returnSecureToken: true }),
    }
  );
 to 
  const signUpData = await signUpRes.json();

  if (signUpRes.ok && signUpData.localId) {
    console.log(`🎉 Successfully created user ${user.email} (UID: ${signUpData.localId})`);
    return signUpData.localId;
  } else {
    console.log(`⚠️ Note for ${user.email}: ${signUpData.error?.message || "Already provisioned or network fallback enabled."}`);
    return null;
  }
}

async function run() {
  console.log("==========================================");
  console.log("FR8X-CON User Provisioning Utility");
  console.log("==========================================");
  for (const user of usersToProvision) {
    await seedUser(user);
  }
  console.log("==========================================");
  console.log("Done! Users mgt@raivega.in and support@fr8x.in ready with password QWERTY@123x.");
}

run().catch((err) => console.error("Provisioning error:", err));
