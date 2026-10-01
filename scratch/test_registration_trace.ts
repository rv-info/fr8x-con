import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { firebaseConfig } from '../lib/firebase/client';
import { createCanonicalUserInFirestore } from '../lib/firebase/firestore';

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testRegistrationFlow() {
  const runId = Math.random().toString(36).slice(2, 7);
  const testEmail = `regtrace.${runId}@fr8x.in`;
  const testPassword = `TestPass@${Date.now()}`;
  const companyName = `Trace Logistics ${runId.toUpperCase()} Ltd`;

  console.log('==================================================');
  console.log('TESTING REGISTRATION FLOW TRACE');
  console.log(`Email:    ${testEmail}`);
  console.log(`Company:  ${companyName}`);
  console.log('==================================================');

  // Step 1: Create Auth user
  console.log('\n[1] Executing createUserWithEmailAndPassword...');
  let cred;
  try {
    cred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    console.log('    ✓ Auth user created. UID:', cred.user.uid);
  } catch (err: any) {
    console.error('    ✗ Failed to create auth user:', err.code, err.message);
    return;
  }

  const uid = cred.user.uid;

  // Step 2: Update Profile
  console.log('\n[2] Executing updateProfile...');
  try {
    await updateProfile(cred.user, { displayName: 'Trace Test User' });
    console.log('    ✓ updateProfile passed');
  } catch (err: any) {
    console.warn('    ✗ updateProfile warning:', err.code, err.message);
  }

  // Step 3: createCanonicalUserInFirestore
  console.log('\n[3] Executing createCanonicalUserInFirestore...');
  const res = await createCanonicalUserInFirestore({
    uid,
    email: testEmail,
    displayName: 'Trace Test User',
    firstName: 'Trace',
    lastName: 'User',
    companyName,
    mobile: '+919876543210',
    designation: 'Freight Director',
    role: 'company_admin',
    plan: 'trial',
  });

  console.log('    createCanonicalUserInFirestore result:', res);

  // Step 4: Verify in Firestore directly
  console.log('\n[4] Verifying document in Firestore directly (/users/' + uid + ')...');
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    console.log('    Document exists in Firestore:', snap.exists());
    if (snap.exists()) {
      console.log('    Document email:', snap.data()?.email);
      console.log('    Document company:', snap.data()?.company);
    }
  } catch (err: any) {
    console.error('    Error reading document from Firestore:', err.code, err.message);
  }

  // Step 5: Verify Company in Firestore (/companies/...)
  console.log('\n[5] Checking companies collection...');
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    const compId = userDoc.data()?.companyId;
    if (compId) {
      const compSnap = await getDoc(doc(db, 'companies', compId));
      console.log('    Company doc exists:', compSnap.exists());
    }
  } catch (err: any) {
    console.warn('    Error checking company doc:', err.message);
  }
}

testRegistrationFlow().catch(console.error);
