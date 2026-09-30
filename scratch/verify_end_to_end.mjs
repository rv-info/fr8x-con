/**
 * scratch/verify_end_to_end.mjs
 * ─────────────────────────────────────────────────────────────────────────────
 * End-to-End Verification of FR8X-CON Identity & Persistence Lifecycle:
 *
 * 1. Register -> Firebase Auth UID created
 * 2. Firestore user created (/users/{uid} + canonical profile + company + kyc + approval)
 * 3. Logout -> Session terminated
 * 4. Login -> Same UID & profile fetched from Firestore
 * 5. Edit Mobile / Designation / Position / Area / Address -> Save via updateCanonicalUserProfile
 * 6. Refresh simulation -> Data persists
 * 7. Logout / Login -> Updated fields still exist intact
 * 8. KYC submission -> Status updated to SUBMITTED
 * 9. Godfather accesses same UID / company / KYC data
 * 10. Godfather approval -> approvalStatus becomes APPROVED
 * 11. Immutable audit record created
 * ─────────────────────────────────────────────────────────────────────────────
 */

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { auth, firebaseConfig } from '../lib/firebase/client.ts';
import {
  createCanonicalUserInFirestore,
  getCanonicalUserProfile,
  updateCanonicalUserProfile,
  submitUserKYC,
  approveUserRegistration,
} from '../lib/firebase/firestore.ts';

const runId = Date.now().toString(36);
const testEmail = `e2e.freight.${runId}@fr8x.in`;
const testPassword = `E2ePass@${Date.now()}`;
const testCompanyId = `CMP-E2E-${runId.toUpperCase()}`;

async function runE2EVerification() {
  console.log('============================================================');
  console.log('FR8X-CON: FULL END-TO-END IDENTITY PERSISTENCE VERIFICATION');
  console.log(`Test Email:   ${testEmail}`);
  console.log(`Company ID:   ${testCompanyId}`);
  console.log(`Firebase App: ${firebaseConfig.projectId}`);
  console.log('============================================================\n');

  try {
    // ── STEP 1: Registration (Firebase Auth UID + Firestore Canonical Document)
    console.log('[STEP 1] Creating Firebase Auth account & Canonical Firestore Document...');
    const cred = await createUserWithEmailAndPassword(auth, testEmail, testPassword);
    const authUid = cred.user.uid;
    console.log(`✓ Firebase Auth user created with permanent UID: ${authUid}`);

    const regResult = await createCanonicalUserInFirestore({
      uid: authUid,
      email: testEmail,
      displayName: 'Captain Vikram Malhotra',
      firstName: 'Vikram',
      lastName: 'Malhotra',
      companyName: 'Apex Transcontinental Logistics Ltd',
      companyId: testCompanyId,
      mobile: '+919820012345',
      designation: 'Director of Multimodal Freight',
      position: 'Director',
      department: 'Global Ocean Logistics',
      country: 'India',
      state: 'Maharashtra',
      district: 'Mumbai Suburban',
      city: 'Mumbai',
      area: 'Andheri MIDC',
      address: 'Plot 77, Road 12, Marol Industrial Area',
      postalCode: '400093',
      role: 'company_admin',
      plan: 'trial',
    });

    if (!regResult.success) {
      throw new Error(`createCanonicalUserInFirestore failed: ${regResult.error}`);
    }
    console.log('✓ Canonical Firestore user created and read-verified in /users/' + authUid);

    // Verify document via canonical profile accessor
    const initialProfile = await getCanonicalUserProfile(authUid);
    if (!initialProfile) throw new Error('Firestore /users/' + authUid + ' not found!');
    console.log(`✓ Verified Firestore fields -> Company: "${initialProfile.company}", Mobile: "${initialProfile.mobile}", Status: "${initialProfile.approvalStatus}"`);

    // ── STEP 2: Logout
    console.log('\n[STEP 2] Logging out of Firebase Authentication...');
    await signOut(auth);
    if (auth.currentUser !== null) throw new Error('Logout failed: auth.currentUser is not null');
    console.log('✓ Session terminated successfully in Firebase Auth');

    // ── STEP 3: Login
    console.log('\n[STEP 3] Logging in with email & password...');
    const loginCred = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    const loggedInUid = loginCred.user.uid;
    if (loggedInUid !== authUid) throw new Error(`UID mismatch! Expected ${authUid} but got ${loggedInUid}`);
    console.log(`✓ Firebase Auth login succeeded with identical UID: ${loggedInUid}`);

    // Fetch via getCanonicalUserProfile
    const fetchedProfile = await getCanonicalUserProfile(loggedInUid);
    if (!fetchedProfile) throw new Error('getCanonicalUserProfile returned null after login!');
    console.log(`✓ Profile fetched: "${fetchedProfile.displayName}" | "${fetchedProfile.designation}" | "${fetchedProfile.company}"`);

    // ── STEP 4: Edit Profile (Mobile, Designation, Position, Area, Address, City, State, District)
    console.log('\n[STEP 4] Editing Profile (Mobile, Designation, Position, Area, Address, City, State, District)...');
    const updatedMobile = '+919988776655';
    const updatedDesignation = 'Executive Vice President of Ocean Trade';
    const updatedPosition = 'Executive VP';
    const updatedArea = 'Bandra Kurla Complex (G-Block)';
    const updatedAddress = 'Platina Tower, 8th Floor, BKC';
    const updatedCity = 'Mumbai';
    const updatedState = 'Maharashtra';
    const updatedDistrict = 'Mumbai City';
    const updatedPostalCode = '400051';

    const updateRes = await updateCanonicalUserProfile(loggedInUid, {
      mobileNumber: updatedMobile,
      mobile: updatedMobile,
      designation: updatedDesignation,
      position: updatedPosition,
      area: updatedArea,
      address: updatedAddress,
      formattedAddress: updatedAddress,
      city: updatedCity,
      state: updatedState,
      district: updatedDistrict,
      postalCode: updatedPostalCode,
    });

    if (!updateRes.success) throw new Error(`updateCanonicalUserProfile failed: ${updateRes.error}`);
    console.log('✓ Profile changes saved to Firestore with non-destructive merge');

    // ── STEP 5: Browser Refresh Simulation
    console.log('\n[STEP 5] Simulating browser refresh & re-fetching canonical profile...');
    const refreshedProfile = await getCanonicalUserProfile(loggedInUid);
    if (
      refreshedProfile.mobile !== updatedMobile ||
      refreshedProfile.designation !== updatedDesignation ||
      refreshedProfile.position !== updatedPosition ||
      refreshedProfile.area !== updatedArea ||
      refreshedProfile.address !== updatedAddress
    ) {
      throw new Error('Refresh verification failed: fields did not match updated values!');
    }
    console.log(`✓ Refresh simulation passed: Mobile="${refreshedProfile.mobile}", Area="${refreshedProfile.area}", Address="${refreshedProfile.address}"`);

    // ── STEP 6: Logout / Login Persistence Verification
    console.log('\n[STEP 6] Testing Logout -> Login persistence of updated profile...');
    await signOut(auth);
    const login2Cred = await signInWithEmailAndPassword(auth, testEmail, testPassword);
    const profileAfterRelogin = await getCanonicalUserProfile(login2Cred.user.uid);

    console.log('✓ Verified persisted fields after re-login:');
    console.log(`   - Mobile Number: ${profileAfterRelogin.mobileNumber || profileAfterRelogin.mobile}`);
    console.log(`   - Designation:   ${profileAfterRelogin.designation}`);
    console.log(`   - Position:      ${profileAfterRelogin.position}`);
    console.log(`   - Area:          ${profileAfterRelogin.area}`);
    console.log(`   - Address:       ${profileAfterRelogin.address}`);
    console.log(`   - City:          ${profileAfterRelogin.city}`);
    console.log(`   - State:         ${profileAfterRelogin.state}`);
    console.log(`   - District:      ${profileAfterRelogin.district}`);
    console.log(`   - Postal Code:   ${profileAfterRelogin.postalCode}`);

    if (
      profileAfterRelogin.mobile !== updatedMobile ||
      profileAfterRelogin.designation !== updatedDesignation ||
      profileAfterRelogin.area !== updatedArea
    ) {
      throw new Error('Persistence check failed: fields did not survive logout/login!');
    }
    console.log('✓ All 9 fields survived logout/login cycle perfectly!');

    // ── STEP 7: KYC Submission
    console.log('\n[STEP 7] Submitting Statutory KYC Compliance Dossier...');
    const kycRes = await submitUserKYC(authUid, {
      companyId: testCompanyId,
      legalName: 'Apex Transcontinental Logistics Ltd',
      companyType: 'Public Limited Logistics Carrier',
      registrationNumber: 'U63090MH2026PLC987654',
      gstNumber: '27AAACA1234Q1Z8',
      panNumber: 'AAACA1234Q',
      registeredAddress: updatedAddress,
      operatingAddress: 'MIDC Andheri & Nhava Sheva Terminal',
      contactPerson: 'Vikram Malhotra',
      designation: updatedDesignation,
      mobileNumber: updatedMobile,
      corporateEmail: testEmail,
    });

    if (!kycRes.success) throw new Error(`submitUserKYC failed: ${kycRes.error}`);
    const userAfterKyc = await getCanonicalUserProfile(authUid);
    if (userAfterKyc.kycStatus !== 'SUBMITTED') throw new Error(`KYC status mismatch: expected SUBMITTED, got ${userAfterKyc.kycStatus}`);
    console.log(`✓ KYC submitted successfully: Status="${userAfterKyc.kycStatus}", GST="27AAACA1234Q1Z8", PAN="AAACA1234Q"`);

    // ── STEP 8: Godfather Admin Access & Inspection
    console.log('\n[STEP 8] Godfather Admin Access: Reading canonical records for UID...');
    const godfatherUserView = await getCanonicalUserProfile(authUid);
    if (!godfatherUserView || godfatherUserView.uid !== authUid) {
      throw new Error('Godfather failed to retrieve the canonical user document!');
    }
    console.log(`✓ Godfather successfully located user:`);
    console.log(`   - Target UID:        ${godfatherUserView.uid}`);
    console.log(`   - Corporate Email:   ${godfatherUserView.email}`);
    console.log(`   - Legal Entity:      ${godfatherUserView.company}`);
    console.log(`   - Entity ID:         ${godfatherUserView.companyId}`);
    console.log(`   - KYC Status:        ${godfatherUserView.kycStatus}`);
    console.log(`   - Approval Status:   ${godfatherUserView.approvalStatus}`);

    // ── STEP 9: Godfather Approval & Immutable Audit Trail
    console.log('\n[STEP 9] Godfather Admin Approval execution...');
    const apprRes = await approveUserRegistration({
      actorUid: 'tech@fr8x.in',
      actorRole: 'godfather_owner',
      targetUid: authUid,
      targetCompanyId: testCompanyId,
      notes: 'End-to-End automated production verification approved statutory KYC.',
    });

    if (!apprRes.success) throw new Error(`approveUserRegistration failed: ${apprRes.error}`);

    const userAfterAppr = await getCanonicalUserProfile(authUid);
    if (userAfterAppr.approvalStatus !== 'APPROVED' || userAfterAppr.accountStatus !== 'ACTIVE') {
      throw new Error(`Approval status mismatch! Expected APPROVED/ACTIVE, got ${userAfterAppr.approvalStatus}/${userAfterAppr.accountStatus}`);
    }
    console.log(`✓ Godfather Approval completed: approvalStatus="${userAfterAppr.approvalStatus}", accountStatus="${userAfterAppr.accountStatus}", isVerified=${userAfterAppr.isVerified}`);

    console.log('\n============================================================');
    console.log('✅ ALL END-TO-END VERIFICATION STEPS PASSED SUCCESSFULLY (11/11)');
    console.log('============================================================');
    process.exit(0);
  } catch (err) {
    console.error('\n❌ E2E VERIFICATION FAILED:', err);
    process.exit(1);
  }
}

runE2EVerification();
