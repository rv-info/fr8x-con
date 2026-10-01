import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, deleteDoc } from 'firebase/firestore';

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

async function probe() {
  const id = Date.now().toString(36);
  const email = `probe.${id}@fr8x.in`;
  const password = `Probe@123${id}`;

  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;
  console.log(`Probing with User UID: ${uid}`);

  const targets = [
    { desc: '/users/{uid}', ref: doc(db, 'users', uid), data: { uid, email, role: 'user' } },
    { desc: '/users/{uid}/profile/main', ref: doc(db, 'users', uid, 'profile', 'main'), data: { uid, bio: 'test' } },
    { desc: '/profiles/{uid}', ref: doc(db, 'profiles', uid), data: { uid, bio: 'test' } },
    { desc: '/kyc/{uid}', ref: doc(db, 'kyc', uid), data: { uid, status: 'pending' } },
    { desc: '/companies/{id}', ref: doc(db, 'companies', `CMP-${id}`), data: { companyId: `CMP-${id}`, name: 'Test' } },
    { desc: '/posts/{id}', ref: doc(db, 'posts', `POST-${id}`), data: { id: `POST-${id}`, authorUid: uid, content: 'Test post' } },
    { desc: '/rates/{id}', ref: doc(db, 'rates', `RATE-${id}`), data: { id: `RATE-${id}`, ownerUid: uid, origin: 'Mumbai', destination: 'Dubai' } },
    { desc: '/auctions/{id}', ref: doc(db, 'auctions', `AUC-${id}`), data: { id: `AUC-${id}`, creatorUid: uid, title: 'Test Auction' } },
    { desc: '/notifications/{id}', ref: doc(db, 'notifications', `NOTIF-${id}`), data: { id: `NOTIF-${id}`, recipientUid: uid, message: 'Test' } },
    { desc: '/contacts/{id}', ref: doc(db, 'contacts', `CON-${id}`), data: { id: `CON-${id}`, uid, name: 'Contact 1' } },
  ];

  for (const t of targets) {
    try {
      await setDoc(t.ref, t.data);
      const snap = await getDoc(t.ref);
      console.log(`PASS [WRITE/READ]: ${t.desc} (snap exists: ${snap.exists()})`);
      // clean up test document
      try { await deleteDoc(t.ref); } catch (e) {}
    } catch (err) {
      console.log(`FAIL [${err.code}]: ${t.desc} -> ${err.message}`);
    }
  }

  // Cleanup auth user
  try { await deleteUser(cred.user); } catch (e) {}
}

probe().catch(console.error);
