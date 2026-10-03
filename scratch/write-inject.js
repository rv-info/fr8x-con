const fs = require('fs');
const path = require('path');

const content = `/**
 * scripts/inject-users-to-firebase.ts
 * FR8X Firebase User Injection Script
 *
 * Creates Firebase Auth accounts and writes Firestore profile documents for:
 *   1. Rajat RAI  - rajat.rai@cogoport.com  (COGOPORT, company_admin)
 *   2. Management - mgt@raivega.in           (RAIVEGA, company_admin)
 *
 * Safe to re-run - signs in if account already exists.
 * Run: npx tsx scripts/inject-users-to-firebase.ts
 */

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables from .env.local
function loadEnv() {
  const ep = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(ep)) return;
  const raw = fs.readFileSync(ep, 'utf8');
  for (const line of raw.split('\\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i > 0) {
      const k = t.slice(0, i).trim();
      let v = t.slice(i + 1).trim();
      if (v.length >= 2 && ((v[0] === '"' && v[v.length - 1] === '"') || (v[0] === "'" && v[v.length - 1] === "'"))) {
        v = v.slice(1, -1);
      }
      if (!process.env[k]) process.env[k] = v;
    }
  }
}
loadEnv();

const CFG = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyCTFPoToXBfIk4BFTc13a3x5geBTZlWwjk',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'fr8x-con.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'fr8x-con',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'fr8x-con.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '238702195734',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:238702195734:web:3f41aafdea91007747f137',
};

// Attempt sign-in; create account if user does not exist
async function authUpsert(auth: any, email: string, password: string, displayName: string): Promise<any> {
  try {
    const c = await signInWithEmailAndPassword(auth, email, password);
    console.log('   [AUTH] Signed in existing account: ' + email + ' -> ' + c.user.uid);
    return c;
  } catch (e: any) {
    if (['auth/user-not-found', 'auth/invalid-credential', 'auth/wrong-password'].includes(e.code)) {
      try {
        const c = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(c.user, { displayName });
        console.log('   [AUTH] Created new account: ' + email + ' -> ' + c.user.uid);
        return c;
      } catch (_: any) {
        // race condition: already exists — retry sign-in
        const c = await signInWithEmailAndPassword(auth, email, password);
        console.log('   [AUTH] Signed in (retry): ' + email + ' -> ' + c.user.uid);
        return c;
      }
    }
    throw e;
  }
}

async function main() {
  console.log('');
  console.log('================================================================');
  console.log('FR8X -- Firebase User Injection Script');
  console.log('   Project: ' + CFG.projectId);
  console.log('================================================================');

  const app = getApps().length > 0 ? getApp() : initializeApp(CFG);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const USERS = [
    {
      email: 'rajat.rai@cogoport.com',
      password: 'QWERTY@123a',
      displayName: 'Rajat RAI',
      canonicalUid: 'u-rajat',
      profile: {
        uid: 'u-rajat',
        email: 'rajat.rai@cogoport.com',
        displayName: 'Rajat RAI',
        firstName: 'Rajat',
        lastName: 'RAI',
        company: 'COGOPORT',
        companyId: 'CMP-COGOPORT-001',
        role: 'company_admin',
        status: 'active',
        plan: 'trial',
        mobile: '+91 9620012345',
        phone: '+91 9620012345',
        isdCode: '+91',
        whatsappSameAsMobile: true,
        designation: 'Senior Freight Procurement Manager',
        department: 'Ocean and Multimodal Freight Operations',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        location: 'Mumbai, Maharashtra, India',
        formattedAddress: '42 Freight Lane, Port Area, Mumbai 400001',
        address: '42 Freight Lane, Port Area, Mumbai 400001',
        timezone: 'Asia/Kolkata',
        operatingCorridors: 'IN-WCI -> AE-DXB, IN-NSA -> NL-RTM',
        isVerified: true,
        email_verified: true,
        hasGoldenTick: false,
        firstLoginCompleted: true,
        failedLoginAttempts: 0,
        avatarUrl: '',
        companyLogoUrl: '',
        companyTransferStatus: 'none',
        experiences: [
          {
            id: 'exp-1',
            title: 'ASM',
            company: 'COGOPORT',
            location: 'Gurugram (Sikanderpur), India',
            type: 'Full-time',
            period: 'Jan 2022 - Present',
            description: 'Forwarding career milestones, freight volume managed, and liner contract leadership.',
            skills: ['Ocean Freight', 'Reverse Auctions', 'Container Logistics'],
          },
        ],
        educations: [],
        certifications: [],
        profileCompleteness: 100,
        privacySettings: {
          emailVisibility: 'public',
          phoneVisibility: 'public',
          statutoryVisibility: 'public',
          companyVisibility: 'public',
          tradeLanesVisibility: 'public',
          bioVisibility: 'public',
          allowConnectionRequests: true,
        },
        createdAt: '2026-10-03T09:02:44.428Z',
      },
    },
    {
      email: 'mgt@raivega.in',
      password: 'QWERTY@123a',
      displayName: 'Management RAIVEGA',
      canonicalUid: 'usr_raivega_mgt',
      profile: {
        uid: 'usr_raivega_mgt',
        email: 'mgt@raivega.in',
        displayName: 'Management RAIVEGA',
        firstName: 'Management',
        lastName: 'RAIVEGA',
        company: 'RAIVEGA',
        companyId: 'CMP-RAIVEGA-01',
        role: 'company_admin',
        status: 'active',
        plan: 'premium',
        mobile: '+91 9820012345',
        phone: '+91 9820012345',
        isdCode: '+91',
        whatsappSameAsMobile: true,
        designation: 'Managing Director and Procurement Head',
        department: 'Executive Management',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        location: 'Mumbai, Maharashtra, India',
        formattedAddress: 'RAIVEGA Corporate Logistics Terminal, Mumbai Port Area, India',
        address: 'RAIVEGA Corporate Logistics Terminal, Mumbai Port Area, India',
        timezone: 'Asia/Kolkata',
        isVerified: true,
        email_verified: true,
        hasGoldenTick: true,
        firstLoginCompleted: true,
        failedLoginAttempts: 0,
        avatarUrl: '',
        companyLogoUrl: '',
        companyTransferStatus: 'none',
        experiences: [],
        educations: [],
        certifications: [],
        profileCompleteness: 100,
        privacySettings: {
          emailVisibility: 'public',
          phoneVisibility: 'public',
          statutoryVisibility: 'public',
          companyVisibility: 'public',
          tradeLanesVisibility: 'public',
          bioVisibility: 'public',
          allowConnectionRequests: true,
        },
        createdAt: '2026-10-01T08:00:00.000Z',
      },
    },
  ];

  let ok = 0;
  let fail = 0;

  for (const u of USERS) {
    console.log('');
    console.log('----------------------------------------------------------------');
    console.log('Processing: ' + u.displayName + ' <' + u.email + '>');
    console.log('----------------------------------------------------------------');

    try {
      // Step A: Authenticate (sign in or create)
      console.log('Step A: Firebase Auth...');
      const cred = await authUpsert(auth, u.email, u.password, u.displayName);
      const fbUid = cred.user.uid;

      // Step B: Build and write Firestore documents
      console.log('Step B: Writing Firestore documents...');
      const now = new Date().toISOString();
      const payload = {
        ...u.profile,
        uid: u.canonicalUid,
        firebaseUid: fbUid,
        userId: fbUid,
        syncedAt: now,
        updatedAt: now,
      };

      // Primary document keyed by Firebase UID
      await setDoc(doc(db, 'users', fbUid), payload, { merge: true });
      console.log('   [FS] Written: users/' + fbUid);

      // Canonical alias document for backward compatibility
      if (u.canonicalUid !== fbUid) {
        await setDoc(doc(db, 'users', u.canonicalUid), payload, { merge: true });
        console.log('   [FS] Written: users/' + u.canonicalUid + ' (canonical alias)');
      }

      // Step C: Read-back verification
      console.log('Step C: Read-back verification...');
      const snap = await getDoc(doc(db, 'users', fbUid));
      if (!snap.exists()) throw new Error('Read-back FAILED for users/' + fbUid);
      const d = snap.data() as Record<string, any>;
      console.log('   [OK] ' + d.displayName + ' | ' + d.designation + ' | ' + d.city);

      // Sign out before processing next user
      await signOut(auth);

      console.log('SUCCESS: ' + u.email + ' injected (Firebase UID: ' + fbUid + ')');
      ok++;
    } catch (e: any) {
      console.error('FAILED: ' + u.email + ' -> ' + (e.message || String(e)));
      fail++;
    }
  }

  console.log('');
  console.log('================================================================');
  console.log('INJECTION COMPLETE');
  console.log('  OK:     ' + ok + ' / ' + USERS.length);
  console.log('  FAILED: ' + fail + ' / ' + USERS.length);
  console.log('================================================================');
  console.log('');

  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error('Unhandled error:', e);
  process.exit(1);
});
`;

const outPath = path.resolve(__dirname, '..', 'scripts', 'inject-users-to-firebase.ts');
fs.writeFileSync(outPath, content, 'utf8');
console.log('Written: ' + outPath + ' (' + content.length + ' bytes)');
