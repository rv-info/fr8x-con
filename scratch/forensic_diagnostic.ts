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
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { firebaseConfig } from '../lib/firebase/client';

console.log('==================================================');
console.log('STEP 1: RUNTIME FIREBASE PROJECT CONFIGURATION');
console.log('==================================================');
console.log('projectId:    ', firebaseConfig.projectId);
console.log('appId:        ', firebaseConfig.appId);
console.log('authDomain:   ', firebaseConfig.authDomain);
console.log('storageBucket:', firebaseConfig.storageBucket);

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

console.log('\n==================================================');
console.log('STEP 2: FIREBASE INITIALIZATION');
console.log('==================================================');
console.log('Firebase App initialized:', Boolean(app) ? 'YES' : 'NO');
console.log('Auth initialized:        ', Boolean(auth) ? 'YES' : 'NO');
console.log('Firestore initialized:   ', Boolean(db) ? 'YES' : 'NO');
console.log('Apps count:              ', getApps().length);

async function runDiagnostic() {
  console.log('\n==================================================');
  console.log('STEP 3: AUTHENTICATION');
  console.log('==================================================');
  
  // Create or sign in a test diagnostic user
  const diagEmail = 'diagnostic.test@fr8x.in';
  const diagPass = 'DiagTestPass@2026';
  let userCred;
  try {
    userCred = await signInWithEmailAndPassword(auth, diagEmail, diagPass);
    console.log('Signed in as existing diagnostic user');
  } catch (err: any) {
    if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
      try {
        userCred = await createUserWithEmailAndPassword(auth, diagEmail, diagPass);
        console.log('Created new diagnostic user');
      } catch (createErr: any) {
        console.error('Failed to create diagnostic user:', createErr.code, createErr.message);
        throw createErr;
      }
    } else {
      console.error('Sign in error:', err.code, err.message);
      throw err;
    }
  }

  const currentUser = auth.currentUser;
  console.log('auth.currentUser.uid:          ', currentUser?.uid);
  console.log('auth.currentUser.email:        ', currentUser?.email);
  console.log('auth.currentUser.emailVerified:', currentUser?.emailVerified);

  if (!currentUser) {
    console.log('STOP. The problem is authentication/session persistence, NOT Firestore.');
    return;
  }

  const uid = currentUser.uid;

  console.log('\n==================================================');
  console.log('STEP 4: PROVE FIRESTORE WITH ONE REAL DOCUMENT');
  console.log('Path: /_debug/firebaseConnection/' + uid);
  console.log('==================================================');

  // First test the exact path requested by user: /_debug/firebaseConnection/{uid}
  let pathError = null;
  let docRef: any = null;
  try {
    docRef = doc(db, '_debug', 'firebaseConnection', uid);
  } catch (err: any) {
    pathError = err;
    console.log('Doc construction with 3 arguments (_debug, firebaseConnection, uid):');
    console.log('ERROR CODE: client-sdk-error');
    console.log('ERROR MESSAGE:', err.message);
  }

  try {
    docRef = doc(db, `_debug/firebaseConnection/${uid}`);
  } catch (err: any) {
    pathError = err;
    console.log('Doc construction with path string ("_debug/firebaseConnection/" + uid):');
    console.log('ERROR CODE: client-sdk-error');
    console.log('ERROR MESSAGE:', err.message);
  }

  // Also test 2-segment path: /_debug/{uid}
  console.log('\n--- Now testing WRITE with 2-segment path /_debug/' + uid + ' ---');
  try {
    const testDoc2 = doc(db, '_debug', uid);
    await setDoc(testDoc2, {
      test: true,
      uid: uid,
      timestamp: serverTimestamp(),
    });
    console.log('WRITE /_debug/' + uid + ': PASS');
  } catch (err: any) {
    console.log('WRITE /_debug/' + uid + ': FAIL');
    console.log('ERROR CODE:   ', err.code);
    console.log('ERROR MESSAGE:', err.message);
  }

  // Also test /users/{uid} (the canonical app path)
  console.log('\n--- Now testing WRITE with canonical path /users/' + uid + ' ---');
  try {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, {
      test: true,
      uid: uid,
      timestamp: serverTimestamp(),
    }, { merge: true });
    console.log('WRITE /users/' + uid + ': PASS');

    const readSnap = await getDoc(userRef);
    console.log('READ /users/' + uid + ':', readSnap.exists() ? 'PASS' : 'FAIL (not found)');

    await updateDoc(userRef, {
      updatedField: 'diagnostic_update',
    });
    console.log('UPDATE /users/' + uid + ': PASS');

    const readAfterSnap = await getDoc(userRef);
    console.log('READ AFTER UPDATE /users/' + uid + ':', readAfterSnap.data()?.updatedField === 'diagnostic_update' ? 'PASS' : 'FAIL');
  } catch (err: any) {
    console.log('CANONICAL TEST FAILED:');
    console.log('ERROR CODE:   ', err.code);
    console.log('ERROR MESSAGE:', err.message);
  }
}

runDiagnostic().catch((e) => console.error('DIAGNOSTIC ERROR:', e));
