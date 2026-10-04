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

async function testWrite() {
  const app = getApps().length > 0 ? getApp() : initializeApp(CFG);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const cred = await signInWithEmailAndPassword(auth, 'rajat.rai@cogoport.com', 'QWERTY@123a');
  console.log('Signed in as:', cred.user.uid);

  // 1. Try to write to users/u-rajat (which is what app/profile/page.tsx was doing!)
  try {
    console.log('Attempting write to users/u-rajat...');
    await updateDoc(doc(db, 'users', 'u-rajat'), { designation: 'Test Designation' });
    console.log('SUCCESS writing to users/u-rajat');
  } catch (err: any) {
    console.log('FAILED writing to users/u-rajat:', err.code, err.message);
  }

  // 2. Try to write to users/{firebaseUid} (which is the actual authenticated UID!)
  try {
    console.log('Attempting write to users/' + cred.user.uid + '...');
    const originalDoc = await getDoc(doc(db, 'users', cred.user.uid));
    const origData = originalDoc.data();
    console.log('Current Firestore designation:', origData?.designation);
    console.log('Current Firestore mobile:', origData?.mobile);
    console.log('Current Firestore phone:', origData?.phone);

    await updateDoc(doc(db, 'users', cred.user.uid), {
      designation: origData?.designation, // keep same for now
      updatedAt: new Date().toISOString()
    });
    console.log('SUCCESS writing to users/' + cred.user.uid);
  } catch (err: any) {
    console.log('FAILED writing to users/' + cred.user.uid + ':', err.code, err.message);
  }
}

testWrite().catch(console.error);
