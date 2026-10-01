import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '../lib/firebase/client';

console.log('==================================================');
console.log('STEP 1: RUNTIME FIREBASE CONFIG');
console.log('==================================================');
console.log('projectId:    ', firebaseConfig.projectId);
console.log('authDomain:   ', firebaseConfig.authDomain);
console.log('appId:        ', firebaseConfig.appId);
console.log('storageBucket:', firebaseConfig.storageBucket);
console.log('apiKey:       ', firebaseConfig.apiKey);

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('\nApp instance check:');
console.log('Auth app === Firestore app:', (auth as any).app === (db as any).app);
console.log('App name:                  ', app.name);

async function runStep4Test() {
  console.log('\n==================================================');
  console.log('AUTHENTICATION');
  console.log('==================================================');
  const testEmail = 'step4.isolated.test@fr8x.in';
  const testPass = 'Step4Pass@2026';
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, testEmail, testPass);
    console.log('AUTH: PASS (Signed in)');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        cred = await createUserWithEmailAndPassword(auth, testEmail, testPass);
        console.log('AUTH: PASS (Created new user)');
      } catch (createErr: any) {
        console.error('AUTH: FAIL -', createErr.code, createErr.message);
        return;
      }
    } else {
      console.error('AUTH: FAIL -', err.code, err.message);
      return;
    }
  }

  const uid = auth.currentUser?.uid;
  console.log('AUTH UID:', uid);

  console.log('\n==================================================');
  console.log('STEP 4: ISOLATED FIRESTORE TEST');
  console.log('Path: /_debug/firebaseTest');
  console.log('==================================================');

  const debugDocRef = doc(db, '_debug', 'firebaseTest');

  // 1. WRITE
  let writeResult = 'PENDING';
  let writeError: any = null;
  try {
    await setDoc(debugDocRef, {
      uid,
      test: true,
      timestamp: serverTimestamp(),
    });
    writeResult = 'PASS';
    console.log('WRITE: PASS');
  } catch (err: any) {
    writeResult = 'FAIL';
    writeError = err;
    console.log('WRITE: FAIL');
    console.log('ERROR CODE:   ', err.code);
    console.log('ERROR MESSAGE:', err.message);
  }

  // 2. READ
  let readResult = 'PENDING';
  let readData: any = null;
  let readError: any = null;
  try {
    const snap = await getDoc(debugDocRef);
    readResult = snap.exists() ? 'PASS' : 'FAIL (not exists)';
    readData = snap.data();
    console.log('READ: ', readResult, readData);
  } catch (err: any) {
    readResult = 'FAIL';
    readError = err;
    console.log('READ: FAIL');
    console.log('READ ERROR CODE:   ', err.code);
    console.log('READ ERROR MESSAGE:', err.message);
  }

  // 3. UPDATE
  let updateResult = 'PENDING';
  let updateError: any = null;
  try {
    await updateDoc(debugDocRef, {
      test: false,
      updated: true,
      updatedTimestamp: serverTimestamp(),
    });
    updateResult = 'PASS';
    console.log('UPDATE: PASS');
  } catch (err: any) {
    updateResult = 'FAIL';
    updateError = err;
    console.log('UPDATE: FAIL');
    console.log('UPDATE ERROR CODE:   ', err.code);
    console.log('UPDATE ERROR MESSAGE:', err.message);
  }

  // 4. READ-BACK
  let readBackResult = 'PENDING';
  let readBackData: any = null;
  let readBackError: any = null;
  try {
    const snap2 = await getDoc(debugDocRef);
    readBackResult = snap2.exists() && snap2.data()?.updated === true ? 'PASS' : 'FAIL';
    readBackData = snap2.data();
    console.log('READ-BACK: ', readBackResult, readBackData);
  } catch (err: any) {
    readBackResult = 'FAIL';
    readBackError = err;
    console.log('READ-BACK: FAIL');
    console.log('READ-BACK ERROR CODE:   ', err.code);
    console.log('READ-BACK ERROR MESSAGE:', err.message);
  }
}

runStep4Test().catch(console.error);
