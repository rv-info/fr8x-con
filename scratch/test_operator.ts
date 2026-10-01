import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '../lib/firebase/client';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testOperator() {
  let cred;
  try {
    cred = await signInWithEmailAndPassword(auth, 'operator@fr8x.in', 'Operator@2026');
    console.log('Signed in as operator@fr8x.in, UID:', cred.user.uid);
  } catch (err: any) {
    console.log('signIn err:', err.code, err.message);
    try {
      cred = await createUserWithEmailAndPassword(auth, 'operator@fr8x.in', 'Operator@2026');
      console.log('Created operator@fr8x.in, UID:', cred.user.uid);
    } catch (e2: any) {
      console.log('create err:', e2.code, e2.message);
      return;
    }
  }

  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log('operator@fr8x.in getDocs(users) count:', snap.size);
    snap.forEach((d) => console.log('User doc:', d.id, d.data().email));
  } catch (e: any) {
    console.log('operator@fr8x.in getDocs(users) error:', e.code, '|', e.message);
  }
}

testOperator().catch(console.error);
