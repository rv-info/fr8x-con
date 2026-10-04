import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, collection, getDocs } from 'firebase/firestore';
import * as fs from 'fs';
import * as path from 'path';

function loadEnv() {
  const ep = path.resolve(process.cwd(), '.env.local');
  if (!fs.existsSync(ep)) return;
  const raw = fs.readFileSync(ep, 'utf8');
  for (const line of raw.split('\n')) {
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

async function main() {
  const app = getApps().length > 0 ? getApp() : initializeApp(CFG);
  const auth = getAuth(app);
  const db = getFirestore(app);

  console.log('Signing in with rajat.rai@cogoport.com...');
  const cred = await signInWithEmailAndPassword(auth, 'rajat.rai@cogoport.com', 'QWERTY@123a');
  console.log('Firebase Auth UID:', cred.user.uid);
  console.log('Firebase Auth Email:', cred.user.email);
  console.log('Firebase Auth Phone:', cred.user.phoneNumber);

  // Check users/{firebaseUid}
  const authDocSnap = await getDoc(doc(db, 'users', cred.user.uid)).catch(e => { console.error('Error fetching users/{uid}:', e.message); return null; });
  if (authDocSnap && authDocSnap.exists()) {
    console.log('\n--- Document users/' + cred.user.uid + ' ---');
    console.log(JSON.stringify(authDocSnap.data(), null, 2));
  } else {
    console.log('\n--- Document users/' + cred.user.uid + ' DOES NOT EXIST ---');
  }

  // Check users/u-rajat
  const rajatDocSnap = await getDoc(doc(db, 'users', 'u-rajat')).catch(e => { console.error('Error fetching users/u-rajat:', e.message); return null; });
  if (rajatDocSnap && rajatDocSnap.exists()) {
    console.log('\n--- Document users/u-rajat ---');
    console.log(JSON.stringify(rajatDocSnap.data(), null, 2));
  } else {
    console.log('\n--- Document users/u-rajat DOES NOT EXIST ---');
  }

  // Check subdocs for users/{firebaseUid}
  const pSnap = await getDoc(doc(db, 'users', cred.user.uid, 'profile', 'main')).catch(() => null);
  if (pSnap && pSnap.exists()) console.log('\n--- users/' + cred.user.uid + '/profile/main ---', pSnap.data());
  const kSnap = await getDoc(doc(db, 'users', cred.user.uid, 'kyc', 'main')).catch(() => null);
  if (kSnap && kSnap.exists()) console.log('\n--- users/' + cred.user.uid + '/kyc/main ---', kSnap.data());

  // Also check mgt@raivega.in
  try {
    const cred2 = await signInWithEmailAndPassword(auth, 'mgt@raivega.in', 'QWERTY@123a');
    console.log('\nManagement RAIVEGA UID:', cred2.user.uid);
    const mgtSnap = await getDoc(doc(db, 'users', cred2.user.uid));
    console.log('users/' + cred2.user.uid + ' exists:', mgtSnap.exists());
    if (mgtSnap.exists()) console.log(JSON.stringify(mgtSnap.data(), null, 2));
  } catch (e: any) {
    console.log('Error checking mgt@raivega.in:', e.message);
  }
}

main().catch(console.error);
