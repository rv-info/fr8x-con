import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, limit, query } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCTFPoToXBfIk4BFTc13a3x5geBTZlWwjk",
  authDomain: "fr8x-con.firebaseapp.com",
  projectId: "fr8x-con",
  storageBucket: "fr8x-con.firebasestorage.app",
  messagingSenderId: "238702195734",
  appId: "1:238702195734:web:3f41aafdea91007747f137",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function inspectData() {
  console.log('--- Inspecting live Firestore data in fr8x-con ---');
  try {
    const snap = await getDocs(query(collection(db, 'users'), limit(15)));
    console.log(`Found ${snap.size} user documents in /users:`);
    snap.docs.forEach((doc) => {
      const data = doc.data();
      console.log(`- UID: ${doc.id} | Email: ${data.email} | Name: ${data.displayName} | Company: ${data.companyName || data.company} | Status: ${data.accountStatus}/${data.approvalStatus}`);
    });
  } catch (err) {
    console.error('Error reading /users:', err.code, err.message);
  }
}

inspectData().catch(console.error);
