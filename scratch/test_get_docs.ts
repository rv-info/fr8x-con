import { collection, getDocs, getFirestore } from 'firebase/firestore';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { firebaseConfig } from '../lib/firebase/client';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function test() {
  console.log('Signing in...');
  await signInWithEmailAndPassword(auth, 'diagnostic.browser@fr8x.in', 'DiagBrowser@2026');
  console.log('Signed in. Testing collection queries:');
  try {
    const snap = await getDocs(collection(db, 'users'));
    console.log('getDocs(users) count:', snap.size);
  } catch (e: any) {
    console.log('getDocs(users) error:', e.code, '|', e.message);
  }

  try {
    const compSnap = await getDocs(collection(db, 'companies'));
    console.log('getDocs(companies) count:', compSnap.size);
  } catch (e: any) {
    console.log('getDocs(companies) error:', e.code, '|', e.message);
  }
}

test().catch(console.error);
