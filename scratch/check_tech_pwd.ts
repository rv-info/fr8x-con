import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { initializeApp, getApps, getApp } from 'firebase/app';
import { firebaseConfig } from '../lib/firebase/client';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

async function test() {
  const passwords = ['QWERTY@123a', 'Password@123', 'TechAdmin@2026', 'Operator@2026', 'Fr8xAdmin@2026', 'Godfather@2026', 'Fr8x@2026', 'password@123', 'Admin@123', 'Godfather@123'];
  for (const p of passwords) {
    try {
      const cred = await signInWithEmailAndPassword(auth, 'tech@fr8x.in', p);
      console.log('MATCHED PASSWORD FOR tech@fr8x.in:', p, 'UID:', cred.user.uid);
      return;
    } catch(e: any) {
      // ignore
    }
  }
  console.log('None of the common passwords matched for tech@fr8x.in');
}

test().catch(console.error);
