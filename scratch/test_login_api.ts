import * as fs from 'fs';
import * as path from 'path';

function parseFirestoreFields(fields: any): any {
  function parseVal(val: any): any {
    if (!val || typeof val !== 'object') return val;
    if ('stringValue' in val) return val.stringValue;
    if ('booleanValue' in val) return val.booleanValue;
    if ('integerValue' in val) return parseInt(val.integerValue, 10);
    if ('doubleValue' in val) return parseFloat(val.doubleValue);
    if ('timestampValue' in val) return val.timestampValue;
    if ('nullValue' in val) return null;
    if ('mapValue' in val) {
      const res: any = {};
      const f = val.mapValue?.fields || {};
      for (const k of Object.keys(f)) res[k] = parseVal(f[k]);
      return res;
    }
    if ('arrayValue' in val) {
      return (val.arrayValue?.values || []).map(parseVal);
    }
    return val;
  }
  const out: any = {};
  for (const k of Object.keys(fields || {})) {
    out[k] = parseVal(fields[k]);
  }
  return out;
}

async function testLoginRouteSimulation() {
  const apiKey = "AIzaSyCTFPoToXBfIk4BFTc13a3x5geBTZlWwjk";

  // 1. Firebase Auth REST login (exact same as /api/auth/login)
  const fbRes = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'rajat.rai@cogoport.com',
        password: 'QWERTY@123a',
        returnSecureToken: true,
      }),
    }
  );
  const fbData = await fbRes.json();
  const localId = fbData.localId;
  const idToken = fbData.idToken;

  console.log('Login succeeded. localId:', localId);

  // 2. Fetch from Firestore REST API (exact same as /api/auth/login)
  const fsRes = await fetch(
    `https://firestore.googleapis.com/v1/projects/fr8x-con/databases/(default)/documents/users/${localId}`,
    {
      headers: { Authorization: `Bearer ${idToken}` },
    }
  );
  const fsDoc = await fsRes.json();
  const profile = parseFirestoreFields(fsDoc.fields);

  console.log('Login API returned:');
  console.log('  mobile:', profile.mobile);
  console.log('  phone:', profile.phone);
  console.log('  designation:', profile.designation);
  console.log('  location:', profile.location);
}

testLoginRouteSimulation().catch(console.error);
