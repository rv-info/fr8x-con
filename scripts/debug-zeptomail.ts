import fs from 'fs';
import path from 'path';
import https from 'https';

// Load .env.local manually
function loadEnv() {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx !== -1) {
        const key = trimmed.substring(0, eqIdx).trim();
        let val = trimmed.substring(eqIdx + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val;
      }
    }
  }
}

loadEnv();

interface ZeptoResponse {
  statusCode: number;
  headers: Record<string, string | string[] | undefined>;
  body: any;
}

function sendRawZeptoRequest(urlStr: string, authHeader: string, fromAddr: string, toAddr: string, subject: string, content: string): Promise<ZeptoResponse> {
  return new Promise((resolve, reject) => {
    const url = new URL(urlStr);
    const payload = JSON.stringify({
      from: {
        address: fromAddr,
        name: 'FR8X Diagnostic',
      },
      to: [
        {
          email_address: {
            address: toAddr,
            name: 'FR8X Test Recipient',
          },
        },
      ],
      subject,
      htmlbody: `<p>${content}</p>`,
      textbody: content,
    });

    const options: https.RequestOptions = {
      hostname: url.hostname,
      port: 443,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Authorization': authHeader,
        'Content-Length': Buffer.byteLength(payload),
      },
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(data);
        } catch {
          parsed = data;
        }
        resolve({
          statusCode: res.statusCode || 0,
          headers: res.headers,
          body: parsed,
        });
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

async function debugZeptoMail() {
  console.log('================================================================================');
  console.log('         FR8X — ZOHO ZEPTOMAIL FORENSIC DEBUG & TEST SUITE');
  console.log('================================================================================');

  const apiKey = (process.env.ZEPTO_MAIL_API_KEY || process.env.ZOHO_ZEPTOMAIL_TOKEN || '').trim();
  const endpoint = (process.env.ZEPTO_MAIL_API_URL || 'https://api.zeptomail.in/v1.1/email').trim();
  const testRecipient = 'password@fr8x.in';

  console.log(`[CONFIG] Endpoint:        ${endpoint}`);
  console.log(`[CONFIG] Has API Key:     ${Boolean(apiKey)}`);
  console.log(`[CONFIG] Key Prefix:      ${apiKey ? apiKey.substring(0, 20) + '...' : 'NONE'}`);
  console.log(`[CONFIG] Key Length:      ${apiKey.length} chars`);
  console.log(`[CONFIG] Test Recipient:  ${testRecipient}`);
  console.log('--------------------------------------------------------------------------------');

  if (!apiKey) {
    console.error('ERROR: ZEPTO_MAIL_API_KEY is not set in .env.local');
    process.exit(1);
  }

  const authHeader = apiKey.startsWith('Zoho-enczapikey') ? apiKey : `Zoho-enczapikey ${apiKey}`;

  // Test 1: Test against configured endpoint (api.zeptomail.in)
  console.log('\n--- Test 1: Querying Primary Regional Endpoint (api.zeptomail.in) ---');
  try {
    const res = await sendRawZeptoRequest(
      endpoint,
      authHeader,
      'password@fr8x.in',
      testRecipient,
      'FR8X DIAGNOSTIC TEST',
      'Diagnostic test to verify ZeptoMail send status.'
    );

    console.log(`HTTP Status Code: ${res.statusCode}`);
    console.log('Response Payload:', JSON.stringify(res.body, null, 2));

    if (res.statusCode === 201 || res.statusCode === 200) {
      console.log('\n>>> SUCCESS: ZeptoMail API is OPERATIONAL and delivered the test email! <<<');
    } else {
      console.log('\n>>> REJECTION / ERROR DETECTED <<<');
      const errCode = res.body?.error?.code;
      const details = res.body?.error?.details || [];

      console.log(`Error Code: ${errCode}`);
      console.log(`Error Message: ${res.body?.error?.message}`);

      for (const d of details) {
        console.log(`- Detail Code: ${d.code} | Message: ${d.message} ${d.target_value ? `(Target Value: ${d.target_value})` : ''}`);
      }

      console.log('\n--------------------------------------------------------------------------------');
      console.log('ROOT CAUSE ANALYSIS:');
      if (errCode === 'TM_3601' || details.some((d: any) => d.code === 'SM_151')) {
        console.log('👉 CAUSE: The Mail Agent "agent_1" in your Zoho ZeptoMail account has exceeded its Daily Mail Limit.');
        console.log(`👉 LIMIT VALUE: ${details[1]?.target_value ?? 3} emails per day.`);
        console.log('👉 EXPLANATION: Free / trial / newly created ZeptoMail Mail Agents start with a security throttle of 3 emails/day.');
        console.log('👉 RESOLUTION:');
        console.log('   1. Log into your Zoho ZeptoMail Console at https://mailagent.zoho.in');
        console.log('   2. Navigate to "Mail Agents" in the left navigation sidebar.');
        console.log('   3. Click on "agent_1" (Agent Alias: 39ba0e6ce46905b2).');
        console.log('   4. Go to "Limits" / "Settings" -> Increase the "Per Day Limit" or allocate credit balance.');
        console.log('   5. Verify that domain "fr8x.in" has all DNS records (SPF, DKIM, CNAME) marked verified.');
      } else if (errCode === 'TM_4001') {
        console.log('👉 CAUSE: Authentication failure / invalid API token or wrong region.');
        console.log('👉 RESOLUTION: Verify token in Zoho ZeptoMail Console under Mail Agents -> agent_1 -> Setup Info -> Send Mail Token.');
      } else if (errCode === 'TM_3301') {
        console.log('👉 CAUSE: Sender address not configured or domain not verified for agent_1.');
        console.log('👉 RESOLUTION: Add sender address to Mail Agent in ZeptoMail Console.');
      }
      console.log('--------------------------------------------------------------------------------');
    }
  } catch (err: any) {
    console.error('Network Request Failed:', err.message);
  }

  // Test 2: Check Sender Routing
  console.log('\n--- Test 2: Checking Mail Identities (password, support, tech) ---');
  const senders = ['password@fr8x.in', 'support@fr8x.in', 'tech@fr8x.in'];
  for (const s of senders) {
    try {
      const res = await sendRawZeptoRequest(
        endpoint,
        authHeader,
        s,
        testRecipient,
        `FR8X Sender Test: ${s}`,
        `Testing identity ${s}`
      );
      console.log(`Sender [${s}]: HTTP ${res.statusCode} - ${res.body?.error?.details?.[0]?.message || (res.statusCode === 201 ? 'DELIVERED' : JSON.stringify(res.body))}`);
    } catch (err: any) {
      console.log(`Sender [${s}]: Network Error - ${err.message}`);
    }
  }
}

debugZeptoMail().catch(console.error);
