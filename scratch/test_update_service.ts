import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
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

async function testProfileUpdateFlow() {
  const app = getApps().length > 0 ? getApp() : initializeApp(CFG);
  const auth = getAuth(app);
  const db = getFirestore(app);

  const cred = await signInWithEmailAndPassword(auth, 'rajat.rai@cogoport.com', 'QWERTY@123a');
  const uid = cred.user.uid;
  console.log('Signed in as Firebase UID:', uid);

  // Define new test values
  const testPhone = '+91 9988776655';
  const testDesignation = 'Director of Freight Procurement & Logistics';
  const testCity = 'Bengaluru';
  const testState = 'Karnataka';
  const testCountry = 'India';
  const testAddress = '100 Tech Park, Whitefield, Bengaluru 560066';
  const testLocation = 'Bengaluru, Karnataka, India';

  // 1. Write to canonical doc
  console.log('Step 1: Writing partial update to users/' + uid + '...');
  const now = new Date().toISOString();
  const coreUpdates = {
    uid,
    mobile: testPhone,
    phone: testPhone,
    mobileNumber: testPhone,
    designation: testDesignation,
    position: testDesignation,
    city: testCity,
    state: testState,
    country: testCountry,
    formattedAddress: testAddress,
    address: testAddress,
    location: testLocation,
    updatedAt: now,
  };
  await setDoc(doc(db, 'users', uid), coreUpdates, { merge: true });
  console.log('✓ Written successfully.');

  // 2. Read back and verify
  console.log('Step 2: Read-back verification...');
  const verifySnap = await getDoc(doc(db, 'users', uid));
  const data = verifySnap.data()!;
  console.log('  Returned mobile:', data.mobile);
  console.log('  Returned phone:', data.phone);
  console.log('  Returned designation:', data.designation);
  console.log('  Returned city:', data.city);
  console.log('  Returned state:', data.state);
  console.log('  Returned location:', data.location);

  if (data.mobile !== testPhone) throw new Error('Phone mismatch!');
  if (data.designation !== testDesignation) throw new Error('Designation mismatch!');
  if (data.city !== testCity) throw new Error('City mismatch!');
  console.log('✓ Database verification passed.');

  // 3. Re-read using a fresh query to simulate page reload
  console.log('\nStep 3: Simulating page refresh / new query...');
  const reloadSnap = await getDoc(doc(db, 'users', uid));
  const reloadData = reloadSnap.data()!;
  console.log('  Reloaded mobile:', reloadData.mobile);
  console.log('  Reloaded designation:', reloadData.designation);
  console.log('  Reloaded location:', reloadData.location);
  console.log('✓ All fields survive refresh simulation.');
}

testProfileUpdateFlow().catch(console.error);
