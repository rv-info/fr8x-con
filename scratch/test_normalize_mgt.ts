import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc } from 'firebase/firestore';
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

async function checkAndNormalizeMgt() {
  const app = getApps().length > 0 ? getApp() : initializeApp(CFG);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const cred = await signInWithEmailAndPassword(auth, 'mgt@raivega.in', 'QWERTY@123a');
  const fbUid = cred.user.uid;
  console.log('Signed in with UID:', fbUid);

  const userDocRef = doc(db, 'users', fbUid);
  const snap = await getDoc(userDocRef);
  if (!snap.exists()) {
    console.error('Doc does not exist!');
    return;
  }
  const data = snap.data();
  console.log('Before update:');
  console.log('  doc.id:', snap.id);
  console.log('  doc.data().uid:', data.uid);

  // Update uid to be fbUid, preserve canonicalUid
  await updateDoc(userDocRef, {
    uid: fbUid,
    canonicalUid: data.canonicalUid || data.uid || 'usr_raivega_mgt',
    phone: data.mobile || data.phone,
    updatedAt: new Date().toISOString(),
  });

  const snapAfter = await getDoc(userDocRef);
  const dataAfter = snapAfter.data();
  console.log('\nAfter update:');
  console.log('  doc.data().uid:', dataAfter?.uid);
  console.log('  doc.data().canonicalUid:', dataAfter?.canonicalUid);
  console.log('  doc.data().mobile:', dataAfter?.mobile);
}

checkAndNormalizeMgt().catch(console.error);
