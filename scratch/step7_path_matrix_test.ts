import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { firebaseConfig } from '../lib/firebase/client';

const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

async function testSecurityRuleMatrix() {
  console.log('Signing in test user...');
  await signInWithEmailAndPassword(auth, 'diagnostic.browser@fr8x.in', 'DiagBrowser@2026');
  const uid = auth.currentUser!.uid;
  console.log('Authenticated UID:', uid);

  const tests = [
    // 1. /users/{uid}
    {
      name: 'READ /users/{uid}',
      op: () => getDoc(doc(db, 'users', uid)),
    },
    {
      name: 'CREATE/SET /users/{uid}',
      op: () => setDoc(doc(db, 'users', uid), {
        uid,
        email: 'diagnostic.browser@fr8x.in',
        displayName: 'Diagnostic Browser',
        mobile: '+919876543210',
        designation: 'Freight Logistics Specialist',
        position: 'Logistics Operations Lead',
        area: 'Port Terminal Zone',
        address: 'Harbor Gateway 101, Port Area',
        updatedAt: new Date().toISOString()
      }, { merge: true }),
    },
    {
      name: 'UPDATE /users/{uid} (profile fields)',
      op: () => updateDoc(doc(db, 'users', uid), {
        mobile: '+919999988888',
        designation: 'Senior Freight Logistics Lead',
        position: 'Operations VP',
        area: 'Navi Mumbai Hub',
        address: 'Sector 15, Vashi, Navi Mumbai',
        updatedAt: new Date().toISOString()
      }),
    },
    {
      name: 'UPDATE /users/{uid} (forbidden key: role)',
      op: () => updateDoc(doc(db, 'users', uid), {
        role: 'godfather'
      }),
    },

    // 2. /profiles/{uid} (Root)
    {
      name: 'SET root /profiles/{uid}',
      op: () => setDoc(doc(db, 'profiles', uid), {
        uid,
        displayName: 'Diagnostic Browser Profile',
        updatedAt: serverTimestamp()
      }),
    },
    {
      name: 'READ root /profiles/{uid}',
      op: () => getDoc(doc(db, 'profiles', uid)),
    },

    // 3. /companies/{companyId}
    {
      name: 'CREATE root /companies/{companyId}',
      op: () => setDoc(doc(db, 'companies', 'CMP-DIAG-TEST-001'), {
        id: 'CMP-DIAG-TEST-001',
        name: 'Diag Test Company Ltd',
        createdById: uid,
        adminUids: [uid],
        createdAt: new Date().toISOString()
      }),
    },
    {
      name: 'READ root /companies/{companyId}',
      op: () => getDoc(doc(db, 'companies', 'CMP-DIAG-TEST-001')),
    },

    // 4. KYC: Root vs Subcollection
    {
      name: 'SET ROOT /kyc/{uid}',
      op: () => setDoc(doc(db, 'kyc', uid), {
        uid,
        kycStatus: 'PENDING_KYC',
        submittedAt: serverTimestamp()
      }),
    },
    {
      name: 'READ ROOT /kyc/{uid}',
      op: () => getDoc(doc(db, 'kyc', uid)),
    },
    {
      name: 'SET SUBCOLLECTION /users/{uid}/kyc/main',
      op: () => setDoc(doc(db, 'users', uid, 'kyc', 'main'), {
        uid,
        kycStatus: 'PENDING_KYC',
        submittedAt: serverTimestamp()
      }),
    },
    {
      name: 'READ SUBCOLLECTION /users/{uid}/kyc/main',
      op: () => getDoc(doc(db, 'users', uid, 'kyc', 'main')),
    },

    // 5. APPROVAL: Root vs Subcollection
    {
      name: 'SET ROOT /approval/{uid}',
      op: () => setDoc(doc(db, 'approval', uid), {
        uid,
        approvalStatus: 'PENDING_APPROVAL',
        requestedAt: serverTimestamp()
      }),
    },
    {
      name: 'READ ROOT /approval/{uid}',
      op: () => getDoc(doc(db, 'approval', uid)),
    },
    {
      name: 'SET SUBCOLLECTION /users/{uid}/approval/main',
      op: () => setDoc(doc(db, 'users', uid, 'approval', 'main'), {
        uid,
        approvalStatus: 'PENDING_APPROVAL',
        requestedAt: serverTimestamp()
      }),
    },
    {
      name: 'READ SUBCOLLECTION /users/{uid}/approval/main',
      op: () => getDoc(doc(db, 'users', uid, 'approval', 'main')),
    },

    // 6. NOTIFICATIONS: Root
    {
      name: 'CREATE root /notifications/{id}',
      op: () => setDoc(doc(db, 'notifications', `notif_${uid}_1`), {
        recipientUid: uid,
        userId: uid,
        title: 'Diagnostic Test Notification',
        message: 'Security test',
        createdAt: serverTimestamp()
      }),
    },
    {
      name: 'READ root /notifications/{id}',
      op: () => getDoc(doc(db, 'notifications', `notif_${uid}_1`)),
    },

    // 7. ISOLATED TEST PATH /_debug/firebaseTest
    {
      name: 'WRITE root /_debug/firebaseTest',
      op: () => setDoc(doc(db, '_debug', 'firebaseTest'), {
        uid,
        test: true
      }),
    },
  ];

  console.log('\n========================================================================================');
  console.log('| Operation / Path                                  | Result | Error Code / Message     |');
  console.log('========================================================================================');

  for (const t of tests) {
    try {
      await t.op();
      console.log(`| ${t.name.padEnd(50)} | PASS   |                          |`);
    } catch (err: any) {
      const errMsg = `${err.code || 'error'}: ${(err.message || '').slice(0, 30)}`;
      console.log(`| ${t.name.padEnd(50)} | FAIL   | ${errMsg.padEnd(24)} |`);
    }
  }
  console.log('========================================================================================');
}

testSecurityRuleMatrix().catch(console.error);
