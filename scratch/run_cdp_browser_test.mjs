// scratch/run_cdp_browser_test.mjs
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log('[CDP TEST] Connecting to Chrome DevTools Protocol...');
  
  // 1. Create a new tab
  const newTabRes = await fetch('http://127.0.0.1:9222/json/new?http://localhost:3000/r/diagnostic', {
    method: 'PUT',
  });
  const tab = await newTabRes.json();
  console.log('[CDP TEST] Opened tab:', tab.id, tab.url);

  const ws = new WebSocket(tab.webSocketDebuggerUrl);

  let idCounter = 1;
  const pending = new Map();
  const networkRequests = [];
  const consoleLogs = [];

  function send(method, params = {}) {
    return new Promise((resolve, reject) => {
      const id = idCounter++;
      pending.set(id, { resolve, reject });
      ws.send(JSON.stringify({ id, method, params }));
    });
  }

  await new Promise((resolve, reject) => {
    ws.onopen = resolve;
    ws.onerror = reject;
  });
  console.log('[CDP TEST] WebSocket connected!');

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id);
      pending.delete(msg.id);
      if (msg.error) reject(msg.error);
      else resolve(msg.result);
    } else if (msg.method) {
      if (msg.method === 'Runtime.consoleAPICalled') {
        const text = msg.params.args.map((a) => a.value || JSON.stringify(a)).join(' ');
        consoleLogs.push(`[CONSOLE ${msg.params.type}] ${text}`);
      } else if (msg.method === 'Network.requestWillBeSent') {
        const url = msg.params.request.url;
        if (url.includes('google') || url.includes('firebase') || url.includes('firestore') || url.includes('identitytoolkit')) {
          networkRequests.push({
            requestId: msg.params.requestId,
            url,
            method: msg.params.request.method,
            status: 'PENDING',
          });
        }
      } else if (msg.method === 'Network.responseReceived') {
        const req = networkRequests.find((r) => r.requestId === msg.params.requestId);
        if (req) {
          req.status = msg.params.response.status;
          req.statusText = msg.params.response.statusText;
        }
      } else if (msg.method === 'Network.loadingFailed') {
        const req = networkRequests.find((r) => r.requestId === msg.params.requestId);
        if (req) {
          req.status = 'BLOCKED/FAILED';
          req.errorText = msg.params.errorText;
        }
      }
    }
  };

  await send('Page.enable');
  await send('Runtime.enable');
  await send('Network.enable');

  async function evalJs(expr) {
    const res = await send('Runtime.evaluate', {
      expression: expr,
      returnByValue: true,
      awaitPromise: true,
    });
    return res.result?.value;
  }

  console.log('[CDP TEST] Waiting for automated diagnostic completion...');
  let isDone = false;
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const finished = await evalJs('Boolean(document.getElementById("diagnostic-finished"))');
    const statusText = await evalJs('document.getElementById("diag-status-text")?.innerText');
    if (i % 4 === 0) {
      console.log(`[CDP TEST] Current status: ${statusText}`);
    }
    if (finished) {
      isDone = true;
      break;
    }
  }

  console.log('\n==================================================');
  console.log('STEP 1 — PROVE WHICH FIREBASE PROJECT THE BROWSER USES');
  console.log('==================================================');
  const pId = await evalJs('document.getElementById("diag-step1-project")?.innerText');
  const aId = await evalJs('document.getElementById("diag-step1-appid")?.innerText');
  const aDomain = await evalJs('document.getElementById("diag-step1-authdomain")?.innerText');
  const sBucket = await evalJs('document.getElementById("diag-step1-bucket")?.innerText');
  console.log('projectId:    ', pId);
  console.log('appId:        ', aId);
  console.log('authDomain:   ', aDomain);
  console.log('storageBucket:', sBucket);

  console.log('\n==================================================');
  console.log('STEP 2 — PROVE FIREBASE INITIALIZATION');
  console.log('==================================================');
  const appInit = await evalJs('document.getElementById("diag-step2-app")?.innerText');
  const authInit = await evalJs('document.getElementById("diag-step2-auth")?.innerText');
  const firestoreInit = await evalJs('document.getElementById("diag-step2-firestore")?.innerText');
  const appsCount = await evalJs('document.getElementById("diag-step2-count")?.innerText');
  console.log('Firebase App initialized:', appInit);
  console.log('Auth initialized:        ', authInit);
  console.log('Firestore initialized:   ', firestoreInit);
  console.log('Competing App instances: ', appsCount === '1' ? 'NO (exactly 1 canonical instance)' : `YES (${appsCount} instances)`);

  console.log('\n==================================================');
  console.log('STEP 3 — PROVE AUTHENTICATION');
  console.log('==================================================');
  const authStatus = await evalJs('document.getElementById("diag-step3-status")?.innerText');
  const authUid = await evalJs('document.getElementById("diag-step3-uid")?.innerText');
  const authEmail = await evalJs('document.getElementById("diag-step3-email")?.innerText');
  const authVerified = await evalJs('document.getElementById("diag-step3-verified")?.innerText');
  console.log('Auth Status:                   ', authStatus);
  console.log('auth.currentUser.uid:          ', authUid);
  console.log('auth.currentUser.email:        ', authEmail);
  console.log('auth.currentUser.emailVerified:', authVerified);

  console.log('\n==================================================');
  console.log('STEP 4 & 5 — FIRESTORE REAL-DOCUMENT TEST SUITE');
  console.log('==================================================');
  const write3seg = await evalJs('document.getElementById("diag-step4-3seg-write")?.innerText');
  const errCode3seg = await evalJs('document.getElementById("diag-step4-3seg-error-code")?.innerText');
  const errMsg3seg = await evalJs('document.getElementById("diag-step4-3seg-error-msg")?.innerText');

  console.log('A) Requested 3-segment path /_debug/firebaseConnection/' + authUid + ':');
  console.log('   WRITE:         ', write3seg);
  if (errCode3seg) {
    console.log('   ERROR CODE:    ', errCode3seg);
    console.log('   ERROR MESSAGE: ', errMsg3seg);
  }

  const write2seg = await evalJs('document.getElementById("diag-step4-2seg-write")?.innerText');
  const read2seg = await evalJs('document.getElementById("diag-step4-2seg-read")?.innerText');
  const update2seg = await evalJs('document.getElementById("diag-step4-2seg-update")?.innerText');
  const readAfter2seg = await evalJs('document.getElementById("diag-step4-2seg-readafter")?.innerText');
  const errCode2seg = await evalJs('document.getElementById("diag-step4-2seg-error-code")?.innerText');
  const errMsg2seg = await evalJs('document.getElementById("diag-step4-2seg-error-msg")?.innerText');

  console.log('\nB) 2-segment path /_debug/' + authUid + ':');
  console.log('   WRITE:             ', write2seg);
  console.log('   READ:              ', read2seg);
  console.log('   UPDATE:            ', update2seg);
  console.log('   READ AFTER UPDATE: ', readAfter2seg);
  if (errCode2seg) {
    console.log('   ERROR CODE:        ', errCode2seg);
    console.log('   ERROR MESSAGE:     ', errMsg2seg);
  }

  const canonWrite = await evalJs('document.getElementById("diag-step4-canon-write")?.innerText');
  const canonRead = await evalJs('document.getElementById("diag-step4-canon-read")?.innerText');
  const canonUpdate = await evalJs('document.getElementById("diag-step4-canon-update")?.innerText');
  const canonReadAfter = await evalJs('document.getElementById("diag-step4-canon-readafter")?.innerText');
  const canonErrCode = await evalJs('document.getElementById("diag-step4-canon-error-code")?.innerText');
  const canonErrMsg = await evalJs('document.getElementById("diag-step4-canon-error-msg")?.innerText');

  console.log('\nC) Canonical application path /users/' + authUid + ':');
  console.log('   WRITE:             ', canonWrite);
  console.log('   READ:              ', canonRead);
  console.log('   UPDATE:            ', canonUpdate);
  console.log('   READ AFTER UPDATE: ', canonReadAfter);
  if (canonErrCode) {
    console.log('   ERROR CODE:        ', canonErrCode);
    console.log('   ERROR MESSAGE:     ', canonErrMsg);
  }

  console.log('\n==================================================');
  console.log('STEP 10 — BROWSER NETWORK REQUESTS TO FIRESTORE / GOOGLE');
  console.log('==================================================');
  for (const req of networkRequests) {
    console.log(`${req.method} [${req.status}] ${req.url}${req.errorText ? ` (${req.errorText})` : ''}`);
  }

  console.log('\n==================================================');
  console.log('BROWSER CONSOLE OUTPUT');
  console.log('==================================================');
  for (const log of consoleLogs) {
    console.log(log);
  }

  const logsText = await evalJs('document.getElementById("diagnostic-logs")?.innerText');
  console.log('\n==================================================');
  console.log('IN-PAGE FORENSIC EXECUTION LOGS');
  console.log('==================================================');
  console.log(logsText);

  // Close tab
  await fetch(`http://127.0.0.1:9222/json/close/${tab.id}`);
  ws.close();
  console.log('\n[CDP TEST] Diagnostic test completed successfully.');
}

main().catch((err) => {
  console.error('[CDP TEST] Error:', err);
  process.exit(1);
});
