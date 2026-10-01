import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

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

async function runComprehensiveAudit() {
  const runId = Date.now().toString(36);
  const testEmail = `audit.rules.${runId}@fr8x.in`;
  const testPassword = `AuditPass@${Date.now()}`;

  console.log('============================================================');
  console.log('MANDATORY LIVE FIRESTORE RULES AUDIT & PENETRATION TEST');
  console.log(`Database: (default) | Project: fr8x-con`);
  console.log(`Auth Email: ${testEmail}`);
  console.log('============================================================\n');

  const cred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
  const uid = cred.user.uid;
  console.log(`Active Auth UID: ${uid}\n`);

  const auditOperations = [
    // 1. Master user document operations
    { path: `users/${uid}`, op: 'CREATE', fn: () => setDoc(doc(db, 'users', uid), { uid, email: testEmail, role: 'user', createdAt: new Date().toISOString() }) },
    { path: `users/${uid}`, op: 'READ', fn: () => getDoc(doc(db, 'users', uid)) },
    { path: `users/${uid}`, op: 'UPDATE', fn: () => updateDoc(doc(db, 'users', uid), { updatedAt: new Date().toISOString(), mobileNumber: '+919876543210' }) },
    { path: `users/${uid}`, op: 'DELETE', fn: () => deleteDoc(doc(db, 'users', uid)) },

    // 2. User canonical subcollections
    { path: `users/${uid}/profile/main`, op: 'CREATE', fn: () => setDoc(doc(db, 'users', uid, 'profile', 'main'), { uid, bio: 'Live Audit Bio', skills: ['Ocean Freight'] }) },
    { path: `users/${uid}/profile/main`, op: 'READ', fn: () => getDoc(doc(db, 'users', uid, 'profile', 'main')) },
    { path: `users/${uid}/kyc/main`, op: 'CREATE', fn: () => setDoc(doc(db, 'users', uid, 'kyc', 'main'), { uid, kycStatus: 'SUBMITTED', gstNumber: '27AAACA1234Q1Z8' }) },
    { path: `users/${uid}/kyc/main`, op: 'READ', fn: () => getDoc(doc(db, 'users', uid, 'kyc', 'main')) },
    { path: `users/${uid}/approval/main`, op: 'CREATE', fn: () => setDoc(doc(db, 'users', uid, 'approval', 'main'), { uid, approvalStatus: 'PENDING_APPROVAL' }) },
    { path: `users/${uid}/approval/main`, op: 'READ', fn: () => getDoc(doc(db, 'users', uid, 'approval', 'main')) },
    { path: `users/${uid}/security/main`, op: 'CREATE', fn: () => setDoc(doc(db, 'users', uid, 'security', 'main'), { uid, mfaEnabled: false }) },
    { path: `users/${uid}/preferences/main`, op: 'CREATE', fn: () => setDoc(doc(db, 'users', uid, 'preferences', 'main'), { uid, theme: 'dark' }) },

    // 3. Company document & subcollections
    { path: `companies/CMP-${runId}`, op: 'CREATE', fn: () => setDoc(doc(db, 'companies', `CMP-${runId}`), { companyId: `CMP-${runId}`, legalName: 'Apex Freight Ltd', adminUids: [uid] }) },
    { path: `companies/CMP-${runId}`, op: 'READ', fn: () => getDoc(doc(db, 'companies', `CMP-${runId}`)) },
    { path: `companies/CMP-${runId}/members/${uid}`, op: 'CREATE', fn: () => setDoc(doc(db, 'companies', `CMP-${runId}`, 'members', uid), { uid, role: 'company_admin' }) },
    { path: `companies/CMP-${runId}/kyc/main`, op: 'CREATE', fn: () => setDoc(doc(db, 'companies', `CMP-${runId}`, 'kyc', 'main'), { companyId: `CMP-${runId}`, kycStatus: 'SUBMITTED' }) },
    { path: `companies/CMP-${runId}/approval/main`, op: 'CREATE', fn: () => setDoc(doc(db, 'companies', `CMP-${runId}`, 'approval', 'main'), { companyId: `CMP-${runId}`, approvalStatus: 'PENDING_APPROVAL' }) },
    { path: `companies/CMP-${runId}/audit/aud-${runId}`, op: 'CREATE', fn: () => setDoc(doc(db, 'companies', `CMP-${runId}`, 'audit', `aud-${runId}`), { auditId: `aud-${runId}`, action: 'TEST_CREATE' }) },

    // 4. Legacy root collections
    { path: `profiles/${uid}`, op: 'CREATE', fn: () => setDoc(doc(db, 'profiles', uid), { uid, bio: 'Legacy bio' }) },
    { path: `kyc/${uid}`, op: 'CREATE', fn: () => setDoc(doc(db, 'kyc', uid), { uid, status: 'pending' }) },
    { path: `approval/${uid}`, op: 'CREATE', fn: () => setDoc(doc(db, 'approval', uid), { uid, status: 'pending' }) },

    // 5. Business modules
    { path: `posts/POST-${runId}`, op: 'CREATE', fn: () => setDoc(doc(db, 'posts', `POST-${runId}`), { id: `POST-${runId}`, authorUid: uid, content: 'Audit post' }) },
    { path: `rates/RATE-${runId}`, op: 'CREATE', fn: () => setDoc(doc(db, 'rates', `RATE-${runId}`), { id: `RATE-${runId}`, ownerUid: uid, origin: 'INNSA', destination: 'NLRTM' }) },
    { path: `auctions/AUC-${runId}`, op: 'CREATE', fn: () => setDoc(doc(db, 'auctions', `AUC-${runId}`), { id: `AUC-${runId}`, creatorUid: uid, title: 'Live Audit Auction' }) },
    { path: `auctions/AUC-${runId}/bids/BID-${runId}`, op: 'CREATE', fn: () => setDoc(doc(db, 'auctions', `AUC-${runId}`, 'bids', `BID-${runId}`), { id: `BID-${runId}`, bidderUid: uid, amount: 1500 }) },
    { path: `notifications/NOT-${runId}`, op: 'CREATE', fn: () => setDoc(doc(db, 'notifications', `NOT-${runId}`), { id: `NOT-${runId}`, recipientUid: uid, title: 'Audit Alert' }) },
    { path: `contacts/CON-${runId}`, op: 'CREATE', fn: () => setDoc(doc(db, 'contacts', `CON-${runId}`), { id: `CON-${runId}`, uid, contactName: 'Logistics Desk' }) },
    { path: `adminActions/ACT-${runId}`, op: 'CREATE', fn: () => setDoc(doc(db, 'adminActions', `ACT-${runId}`), { actionId: `ACT-${runId}`, action: 'SYSTEM_AUDIT' }) },
  ];

  const failedReports = [];
  const passedReports = [];

  for (const item of auditOperations) {
    try {
      await item.fn();
      passedReports.push(item);
      console.log(`[PASS] ${item.op.padEnd(6)} -> /${item.path}`);
    } catch (err) {
      const report = {
        path: `/${item.path}`,
        operation: item.op,
        authUid: uid,
        ruleResult: 'DENIED',
        errorCode: err.code || 'unknown',
        errorMessage: err.message || String(err),
      };
      failedReports.push(report);
      console.log(`[FAIL] ${item.op.padEnd(6)} -> /${item.path} [${report.errorCode}]`);
    }
  }

  // Cleanup Auth user
  try {
    await deleteUser(cred.user);
    console.log(`\n✓ Auth test user ${testEmail} cleaned up successfully`);
  } catch (e) {
    console.log(`Auth cleanup note: ${e.message}`);
  }

  console.log('\n============================================================');
  console.log(`AUDIT COMPLETE: ${passedReports.length} PASSED | ${failedReports.length} FAILED`);
  console.log('============================================================\n');

  console.log('=== DETAILED FAILED OPERATIONS LEDGER ===\n');
  failedReports.forEach((f, idx) => {
    console.log(`FAILED ITEM #${idx + 1}:`);
    console.log(`PATH:          ${f.path}`);
    console.log(`OPERATION:     ${f.operation}`);
    console.log(`AUTH UID:      ${f.authUid}`);
    console.log(`RULE RESULT:   ${f.ruleResult}`);
    console.log(`ERROR CODE:    ${f.errorCode}`);
    console.log(`ERROR MESSAGE: ${f.errorMessage}\n`);
  });
}

runComprehensiveAudit().catch(console.error);
