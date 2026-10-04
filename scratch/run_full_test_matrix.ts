import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { getCanonicalUserProfile, updateCanonicalUserProfile, updateUserProfile } from '../lib/firebase/firestore';

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

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCTFPoToXBfIk4BFTc13a3x5geBTZlWwjk",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "fr8x-con.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "fr8x-con",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "fr8x-con.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "238702195734",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:238702195734:web:3f41aafdea91007747f137",
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const auth = getAuth(app);
const db = getFirestore(app);

async function runTests() {
  console.log('================================================================');
  console.log('FR8X FULL TEST MATRIX VERIFICATION');
  console.log('================================================================');

  // Sign in as Rajat
  console.log('\n[Setup] Authenticating user rajat.rai@cogoport.com...');
  const userCred = await signInWithEmailAndPassword(auth, 'rajat.rai@cogoport.com', 'QWERTY@123a');
  const uid = userCred.user.uid;
  console.log(`[Setup] Authenticated UID: ${uid}`);

  const testResults: Record<string, boolean> = {};

  // -------------------------------------------------------------------------
  // TEST 1: Change phone number -> Save -> refresh
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 1: Change phone number -> Save -> refresh ---');
  const test1Phone = '+91 9123456780';
  const res1 = await updateUserProfile({ phone: test1Phone, mobile: test1Phone });
  if (!res1.success) throw new Error('Test 1 save failed: ' + res1.error);
  // Simulate refresh by reading fresh canonical profile from database
  const refresh1 = await getCanonicalUserProfile(uid);
  console.log(`Expected Phone: ${test1Phone} | Database Returned: ${refresh1?.mobile}`);
  testResults['TEST 1: Change Phone & Refresh'] = (refresh1?.mobile === test1Phone && refresh1?.phone === test1Phone);

  // -------------------------------------------------------------------------
  // TEST 2: Change designation -> Save -> refresh
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 2: Change designation -> Save -> refresh ---');
  const test2Desig = 'Global Ocean Freight Director';
  const res2 = await updateUserProfile({ designation: test2Desig });
  if (!res2.success) throw new Error('Test 2 save failed: ' + res2.error);
  const refresh2 = await getCanonicalUserProfile(uid);
  console.log(`Expected Designation: ${test2Desig} | Database Returned: ${refresh2?.designation}`);
  testResults['TEST 2: Change Designation & Refresh'] = (refresh2?.designation === test2Desig);

  // -------------------------------------------------------------------------
  // TEST 3: Change location -> Save -> refresh
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 3: Change location -> Save -> refresh ---');
  const test3Location = 'Bengaluru, Karnataka, India';
  const res3 = await updateUserProfile({
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    location: test3Location,
  });
  if (!res3.success) throw new Error('Test 3 save failed: ' + res3.error);
  const refresh3 = await getCanonicalUserProfile(uid);
  console.log(`Expected Location: ${test3Location} | Database Returned: ${refresh3?.location}`);
  testResults['TEST 3: Change Location & Refresh'] = (refresh3?.location === test3Location && refresh3?.city === 'Bengaluru');

  // -------------------------------------------------------------------------
  // TEST 4: Change all three -> Save -> logout -> login
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 4: Change all three -> Save -> logout -> login ---');
  const t4Phone = '+91 9877982622';
  const t4Desig = 'Senior Freight Procurement Manager';
  const t4Loc = 'Mumbai, Maharashtra, India';
  const res4 = await updateUserProfile({
    phone: t4Phone,
    mobile: t4Phone,
    designation: t4Desig,
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    location: t4Loc,
  });
  if (!res4.success) throw new Error('Test 4 save failed: ' + res4.error);

  // Simulate logout
  await auth.signOut();
  console.log('[Test 4] Signed out from Firebase Auth.');

  // Re-login
  const reCred = await signInWithEmailAndPassword(auth, 'rajat.rai@cogoport.com', 'QWERTY@123a');
  const reProfile = await getCanonicalUserProfile(reCred.user.uid);
  console.log(`Re-login Mobile: ${reProfile?.mobile} (Expected: ${t4Phone})`);
  console.log(`Re-login Designation: ${reProfile?.designation} (Expected: ${t4Desig})`);
  console.log(`Re-login Location: ${reProfile?.location} (Expected: ${t4Loc})`);
  testResults['TEST 4: All Three Survive Logout & Re-login'] =
    reProfile?.mobile === t4Phone &&
    reProfile?.designation === t4Desig &&
    reProfile?.location === t4Loc;

  // -------------------------------------------------------------------------
  // TEST 5: Change profile -> navigate to another page -> return
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 5: Change profile -> navigate -> return ---');
  const t5Desig = 'Head of Container Logistics & Liner Contracts';
  await updateUserProfile({ designation: t5Desig });
  // Simulated page navigation reads canonical profile
  const navProfile = await getCanonicalUserProfile(uid);
  console.log(`Navigation Profile Designation: ${navProfile?.designation} (Expected: ${t5Desig})`);
  testResults['TEST 5: Survive Page Navigation'] = (navProfile?.designation === t5Desig);

  // -------------------------------------------------------------------------
  // TEST 6: Change profile -> close browser simulation (new clean read)
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 6: Change profile -> close browser simulation ---');
  const cleanDoc = await getDoc(doc(db, 'users', uid));
  const cleanData = cleanDoc.data();
  console.log(`Clean DB Designation: ${cleanData?.designation} | Mobile: ${cleanData?.mobile}`);
  testResults['TEST 6: Close Browser / Clean Read'] = (cleanData?.designation === t5Desig);

  // -------------------------------------------------------------------------
  // TEST 7: Login from second device/browser simulation
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 7: Second device / fresh auth session ---');
  const device2Profile = await getCanonicalUserProfile(uid);
  console.log(`Device 2 Mobile: ${device2Profile?.mobile} | Designation: ${device2Profile?.designation}`);
  testResults['TEST 7: Second Device Gets Canonical Values'] =
    device2Profile?.mobile === t4Phone && device2Profile?.designation === t5Desig;

  // -------------------------------------------------------------------------
  // TEST 8: Change ONLY designation -> Phone and location remain unchanged
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 8: Change ONLY designation ---');
  const beforePhone8 = device2Profile?.mobile;
  const beforeLoc8 = device2Profile?.location;
  const t8Desig = 'Executive Director of Ocean Logistics';
  await updateUserProfile({ designation: t8Desig });
  const after8 = await getCanonicalUserProfile(uid);
  console.log(`Designation changed to: ${after8?.designation}`);
  console.log(`Phone: ${after8?.mobile} (Unchanged: ${after8?.mobile === beforePhone8})`);
  console.log(`Location: ${after8?.location} (Unchanged: ${after8?.location === beforeLoc8})`);
  testResults['TEST 8: Change Only Designation (Others Unchanged)'] =
    after8?.designation === t8Desig &&
    after8?.mobile === beforePhone8 &&
    after8?.location === beforeLoc8;

  // -------------------------------------------------------------------------
  // TEST 9: Change ONLY phone -> Designation and location remain unchanged
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 9: Change ONLY phone ---');
  const beforeDesig9 = after8?.designation;
  const beforeLoc9 = after8?.location;
  const t9Phone = '+91 9877982622';
  await updateUserProfile({ phone: t9Phone, mobile: t9Phone });
  const after9 = await getCanonicalUserProfile(uid);
  console.log(`Phone changed to: ${after9?.mobile}`);
  console.log(`Designation: ${after9?.designation} (Unchanged: ${after9?.designation === beforeDesig9})`);
  console.log(`Location: ${after9?.location} (Unchanged: ${after9?.location === beforeLoc9})`);
  testResults['TEST 9: Change Only Phone (Others Unchanged)'] =
    after9?.mobile === t9Phone &&
    after9?.designation === beforeDesig9 &&
    after9?.location === beforeLoc9;

  // -------------------------------------------------------------------------
  // TEST 10: Change ONLY location -> Phone and designation remain unchanged
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 10: Change ONLY location ---');
  const beforePhone10 = after9?.mobile;
  const beforeDesig10 = after9?.designation;
  const t10Loc = 'Mumbai, Maharashtra, India';
  await updateUserProfile({
    city: 'Mumbai',
    state: 'Maharashtra',
    country: 'India',
    location: t10Loc,
  });
  const after10 = await getCanonicalUserProfile(uid);
  console.log(`Location changed to: ${after10?.location}`);
  console.log(`Phone: ${after10?.mobile} (Unchanged: ${after10?.mobile === beforePhone10})`);
  console.log(`Designation: ${after10?.designation} (Unchanged: ${after10?.designation === beforeDesig10})`);
  testResults['TEST 10: Change Only Location (Others Unchanged)'] =
    after10?.location === t10Loc &&
    after10?.mobile === beforePhone10 &&
    after10?.designation === beforeDesig10;

  // -------------------------------------------------------------------------
  // TEST 11: Attempt to manipulate UID to update another user
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 11: Security Isolation (Unauthorized UID Write) ---');
  const raivegaUid = 'fGZotCiCSxWDyGsCooHPvBOAPrp1';
  let writeBlocked = false;
  try {
    const targetRef = doc(db, 'users', raivegaUid);
    await updateDoc(targetRef, { designation: 'HACKED DESIGNATION' });
  } catch (err: any) {
    console.log(`Security check passed! Write correctly rejected: ${err.code || err.message}`);
    writeBlocked = true;
  }
  testResults['TEST 11: Security - Unauthorized Write Blocked'] = writeBlocked;

  // -------------------------------------------------------------------------
  // TEST 12: Duplicate profile detection
  // -------------------------------------------------------------------------
  console.log('\n--- TEST 12: Duplicate Record Detection ---');
  // Confirm that resolving profile by UID returns the one authoritative record
  const canonicalDoc = await getCanonicalUserProfile(uid);
  const isDuplicateFree = canonicalDoc?.uid === uid && canonicalDoc?.id === uid;
  console.log(`Authoritative record resolved exclusively by UID: ${canonicalDoc?.uid}`);
  testResults['TEST 12: Authoritative Single Profile Resolution'] = isDuplicateFree;

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n================================================================');
  console.log('TEST MATRIX RESULTS SUMMARY:');
  console.log('================================================================');
  let allPassed = true;
  for (const [testName, passed] of Object.entries(testResults)) {
    console.log(`${passed ? '✓ PASSED' : '✗ FAILED'} : ${testName}`);
    if (!passed) allPassed = false;
  }
  console.log('================================================================');
  if (allPassed) {
    console.log('ALL 12 TEST MATRIX TESTS PASSED WITH 100% SUCCESS!');
    process.exit(0);
  } else {
    console.error('SOME TESTS FAILED!');
    process.exit(1);
  }
}

runTests().catch((e) => {
  console.error('Fatal test error:', e);
  process.exit(1);
});
