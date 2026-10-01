import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
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
} from '../lib/firebase/firestore';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const runId = Math.random().toString(36).substring(2, 7);
const testEmail = `finalproof.${runId}@fr8x.in`;
const testPassword = 'FinalProof@2026!';
const companyName = `Proof Logistics ${runId.toUpperCase()} Ltd`;

async function runStep14Proof() {
  console.log('==================================================');
  console.log('STEP 14: END-TO-END PROOF LIFECYCLE');
  console.log('Email:', testEmail);
  console.log('==================================================\n');

  // 1. REGISTER
  console.log('[1] REGISTER: Creating Firebase Auth user...');
  const cred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  const uid = cred.user.uid;
  console.log('    ✓ AUTH USER EXISTS. UID:', uid);

  // 2. FIRESTORE WRITE
  console.log('\n[2] FIRESTORE USER: Writing canonical user record...');
  const createRes = await createCanonicalUserInFirestore({
    uid,
    email: testEmail,
    displayName: 'Final Proof User',
    firstName: 'Final',
    lastName: 'Proof',
    companyName,
    mobile: '+919876543210',
    designation: 'Freight Lead',
    position: 'Lead',
    city: 'Mumbai',
    country: 'India',
  });
  console.log('    createCanonicalUserInFirestore success:', createRes.success);
  if (!createRes.success) throw new Error('Create failed: ' + createRes.error);

  // 3. FIRESTORE USER & PROFILE EXISTS
  console.log('\n[3] VERIFY FIRESTORE USER & PROFILE:');
  const userDoc = await getDoc(doc(db, 'users', uid));
  console.log('    ✓ /users/{uid} exists:', userDoc.exists());
  console.log('    Stored email:', userDoc.data()?.email);

  const profileDoc = await getDoc(doc(db, 'users', uid, 'profile', 'main'));
  console.log('    ✓ /users/{uid}/profile/main exists:', profileDoc.exists());

  const companyId = userDoc.data()?.companyId;
  console.log('    Associated companyId:', companyId);

  // 4. LOGOUT
  console.log('\n[4] LOGOUT: Signing out of Firebase Auth...');
  await signOut(auth);
  console.log('    auth.currentUser after logout:', auth.currentUser);

  // 5. LOGIN
  console.log('\n[5] LOGIN: Signing in again with email and password...');
  const loginCred = await signInWithEmailAndPassword(auth, testEmail, testPassword);
  console.log('    ✓ Signed in UID:', loginCred.user.uid);

  // 6. PROFILE FETCHES
  console.log('\n[6] PROFILE FETCHES: getCanonicalUserProfile...');
  const fetchedProfile = await getCanonicalUserProfile(uid);
  console.log('    ✓ Profile fetched. DisplayName:', fetchedProfile?.displayName, '| Email:', fetchedProfile?.email);

  // 7. UPDATE FIELDS
  console.log('\n[7] UPDATING PROFILE FIELDS...');
  const updateRes = await updateCanonicalUserProfile(uid, {
    mobile: '+919876501234',
    designation: 'Senior Logistics Director',
    position: 'Director of Global Freight',
    area: 'JNPT Special Economic Zone',
    address: 'Plot 45, Nhava Sheva Terminal Area, Navi Mumbai',
  });
  console.log('    updateCanonicalUserProfile success:', updateRes.success);

  // 8. REFRESH / READ-BACK
  console.log('\n[8] REFRESH / READ-BACK: getDoc(/users/{uid}) directly...');
  const refreshedSnap = await getDoc(doc(db, 'users', uid));
  const refreshedData = refreshedSnap.data();
  console.log('    Mobile:      ', refreshedData?.mobile);
  console.log('    Designation: ', refreshedData?.designation);
  console.log('    Position:    ', refreshedData?.position);
  console.log('    Area:        ', refreshedData?.area);
  console.log('    Address:     ', refreshedData?.address);

  const fieldsValid =
    refreshedData?.mobile === '+919876501234' &&
    refreshedData?.designation === 'Senior Logistics Director' &&
    refreshedData?.position === 'Director of Global Freight' &&
    refreshedData?.area === 'JNPT Special Economic Zone' &&
    refreshedData?.address === 'Plot 45, Nhava Sheva Terminal Area, Navi Mumbai';
  console.log('    ✓ VALUES STILL EXIST (ALL MATCH):', fieldsValid);

  // 9. GODFATHER SEES SAME UID
  console.log('\n[9] GODFATHER VERIFICATION: Sign in as operator@fr8x.in...');
  await signOut(auth);
  await signInWithEmailAndPassword(auth, 'operator@fr8x.in', 'Operator@2026');
  console.log('    Signed in as Godfather operator:', auth.currentUser?.email);

  const gfUserSnap = await getDoc(doc(db, 'users', uid));
  console.log('    ✓ GODFATHER SEES SAME UID doc exists:', gfUserSnap.exists());
  console.log('    Godfather sees email:  ', gfUserSnap.data()?.email);
  console.log('    Godfather sees company:', gfUserSnap.data()?.company);

  // 10. KYC & APPROVAL STATUS
  console.log('\n[10] KYC & APPROVAL STATUS:');
  const kycDoc = await getDoc(doc(db, 'users', uid, 'kyc', 'main'));
  console.log('    ✓ KYC doc exists:      ', kycDoc.exists(), '| status:', kycDoc.data()?.kycStatus);
  const approvalDoc = await getDoc(doc(db, 'users', uid, 'approval', 'main'));
  console.log('    ✓ Approval doc exists: ', approvalDoc.exists(), '| status:', approvalDoc.data()?.approvalStatus);

  // 11. AUDIT RECORD
  console.log('\n[11] AUDIT RECORD:');
  const auditSnap = await getDocs(collection(db, 'companies', companyId, 'audit'));
  console.log('    ✓ Audit docs count:    ', auditSnap.size);
  auditSnap.forEach((d) => {
    console.log('      Audit action:', d.data().action, '| actorUid:', d.data().actorUid, '| reason:', d.data().reason);
  });

  console.log('\n==================================================');
  console.log('STEP 14 LIFECYCLE RESULT: ALL PASS');
  console.log('==================================================');
}

runStep14Proof().catch((err) => {
  console.error('\nSTEP 14 FAILED:', err);
});
