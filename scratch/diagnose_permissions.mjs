import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCTFPoToXBfIk4BFTc13a3x5geBTZlWwjk",
  authDomain: "fr8x-con.firebaseapp.com",
  projectId: "fr8x-con",
  storageBucket: "fr8x-con.firebasestorage.app",
  messagingSenderId: "238702195734",
  appId: "1:238702195734:web:3f41aafdea91007747f137",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function runDiagnosis() {
  const testId = Date.now().toString(36);
  const email = `diag.${testId}@fr8x.in`;
  const password = `Diag@Pass${testId}`;
  console.log(`Diagnosing permissions for user: ${email}`);

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  console.log(`Auth UID: ${uid}`);

  const tests = [
    { name: `users/${uid}`, ref: doc(db, 'users', uid), data: { uid, email, displayName: 'Test', role: 'user' } },
    { name: `users/${uid}/profile/main`, ref: doc(db, 'users', uid, 'profile', 'main'), data: { uid, bio: 'Bio' } },
    { name: `users/${uid}/kyc/main`, ref: doc(db, 'users', uid, 'kyc', 'main'), data: { uid, kycStatus: 'PENDING_KYC' } },
    { name: `users/${uid}/approval/main`, ref: doc(db, 'users', uid, 'approval', 'main'), data: { uid, approvalStatus: 'PENDING_APPROVAL' } },
    { name: `companies/CMP-${testId}`, ref: doc(db, 'companies', `CMP-${testId}`), data: { companyId: `CMP-${testId}`, name: 'Diag Co' } },
    { name: `companies/CMP-${testId}/members/${uid}`, ref: doc(db, 'companies', `CMP-${testId}`, 'members', uid), data: { uid, role: 'user' } },
  ];

  for (const t of tests) {
    try {
      await setDoc(t.ref, t.data, { merge: true });
      const snap = await getDoc(t.ref);
      console.log(`✅ WRITE & READ SUCCEEDED: ${t.name} (exists: ${snap.exists()})`);
    } catch (err) {
      console.log(`❌ WRITE FAILED: ${t.name} -> Code: ${err.code}, Msg: ${err.message}`);
    }
  }

  // Cleanup auth user
  try {
    await deleteUser(cred.user);
    console.log(`Cleaned up auth user: ${uid}`);
  } catch (err) {
    console.log(`Cleanup auth user note: ${err.message}`);
  }
}

runDiagnosis().catch(console.error);
