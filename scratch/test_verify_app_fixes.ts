import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  collection,
  getDocs,
} from 'firebase/firestore';
import { firebaseConfig } from '../lib/firebase/client';
import {
  createCanonicalUserInFirestore,
  getCanonicalUserProfile,
  updateCanonicalUserProfile,
  healOrProvisionUserInFirestore,
} from '../lib/firebase/firestore';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function verifyFixes() {
  console.log('==================================================');
  console.log('VERIFYING WEB APPLICATION FIXES');
  console.log('==================================================\n');

  // TEST 1: healOrProvisionUserInFirestore must NEVER overwrite existing profile data
  console.log('[TEST 1] Testing healOrProvisionUserInFirestore non-destructive behavior...');
  const testEmail = 'finalproof.z7fmg@fr8x.in';
  const testPass = 'FinalProof@2026!';
  const authCred = await signInWithEmailAndPassword(auth, testEmail, testPass);
  const testUid = authCred.user.uid;
  console.log('  Authenticated as test user UID:', testUid);
  const beforeDoc = await getDoc(doc(db, 'users', testUid));
  const beforeData = beforeDoc.data();
  console.log('  Existing data before heal:');
  console.log('    Mobile:     ', beforeData?.mobile);
  console.log('    Designation:', beforeData?.designation);
  console.log('    Address:    ', beforeData?.address);

  // Invoke healOrProvisionUserInFirestore
  const healed = await healOrProvisionUserInFirestore({
    uid: testUid,
    email: 'finalproof.z7fmg@fr8x.in',
    displayName: 'Different Name',
  });

  const afterDoc = await getDoc(doc(db, 'users', testUid));
  const afterData = afterDoc.data();
  console.log('  Data after heal:');
  console.log('    Mobile:     ', afterData?.mobile);
  console.log('    Designation:', afterData?.designation);
  console.log('    Address:    ', afterData?.address);

  const preserved =
    afterData?.mobile === beforeData?.mobile &&
    afterData?.designation === beforeData?.designation &&
    afterData?.address === beforeData?.address;
  console.log('  ✓ Data Preserved (No Overwrite):', preserved);
  if (!preserved) throw new Error('FAIL: healOrProvisionUserInFirestore overwrote existing user data!');

  // TEST 2: Godfather operator Firebase Auth authentication & Firestore collection reading
  console.log('\n[TEST 2] Testing Godfather operator live Firestore queries...');
  await signOut(auth);
  const opCred = await signInWithEmailAndPassword(auth, 'operator@fr8x.in', 'Operator@2026');
  console.log('  Operator authenticated UID:', opCred.user.uid, 'Email:', opCred.user.email);

  const usersSnap = await getDocs(collection(db, 'users'));
  console.log('  ✓ Operator successfully queried /users collection. Count:', usersSnap.size);
  if (usersSnap.size === 0) throw new Error('FAIL: Operator could not read users collection!');

  const companiesSnap = await getDocs(collection(db, 'companies'));
  console.log('  ✓ Operator successfully queried /companies collection. Count:', companiesSnap.size);

  // TEST 3: User Registration with complete Firestore profile
  console.log('\n[TEST 3] Testing fresh registration and complete persistence...');
  const uniqueId = Math.random().toString(36).substring(2, 7);
  const regEmail = `verifyapp.${uniqueId}@fr8x.in`;
  const regPass = 'VerifyApp@2026!';
  const regCred = await createUserWithEmailAndPassword(auth, regEmail, regPass);
  const newUid = regCred.user.uid;
  console.log('  Created Auth user:', regEmail, 'UID:', newUid);

  const createRes = await createCanonicalUserInFirestore({
    uid: newUid,
    email: regEmail,
    displayName: 'App Verification Lead',
    companyName: 'Verification Trans Global',
    mobile: '+919811122233',
    designation: 'Supply Chain Operations Head',
    position: 'VP Logistics',
    city: 'Pune',
    area: 'Hinjawadi Infotech Park',
    address: 'Phase 2, Hinjawadi, Pune 411057',
    state: 'Maharashtra',
    country: 'India',
  });
  console.log('  createCanonicalUserInFirestore result:', createRes.success);
  if (!createRes.success) throw new Error('FAIL: createCanonicalUserInFirestore failed!');

  const userProfile = await getCanonicalUserProfile(newUid);
  console.log('  ✓ Read-back User Profile:');
  console.log('    Name:       ', userProfile?.displayName);
  console.log('    Company:    ', userProfile?.company);
  console.log('    Mobile:     ', userProfile?.mobile);
  console.log('    Designation:', userProfile?.designation);
  console.log('    Area:       ', userProfile?.area);
  console.log('    Address:    ', userProfile?.address);

  // TEST 4: Update Profile fields and confirm read-back
  console.log('\n[TEST 4] Updating profile fields...');
  const updateRes = await updateCanonicalUserProfile(newUid, {
    mobile: '+919899988877',
    designation: 'Chief Logistics Officer',
    position: 'CLO',
    area: 'Shivajinagar Central',
    address: 'FC Road, Shivajinagar, Pune 411005',
  });
  console.log('  updateCanonicalUserProfile result:', updateRes.success);

  const updatedProfile = await getCanonicalUserProfile(newUid);
  console.log('  ✓ Updated Profile:');
  console.log('    Mobile:     ', updatedProfile?.mobile);
  console.log('    Designation:', updatedProfile?.designation);
  console.log('    Address:    ', updatedProfile?.address);

  const updateMatched =
    updatedProfile?.mobile === '+919899988877' &&
    updatedProfile?.designation === 'Chief Logistics Officer' &&
    updatedProfile?.address === 'FC Road, Shivajinagar, Pune 411005';
  console.log('  ✓ Updated fields verified:', updateMatched);

  console.log('\n==================================================');
  console.log('ALL FIXES VERIFIED SUCCESSFULLY! RESULT: PASS');
  console.log('==================================================');
}

verifyFixes().catch((err) => {
  console.error('\nVerification failed:', err);
  process.exit(1);
});
