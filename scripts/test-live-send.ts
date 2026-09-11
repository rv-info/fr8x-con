import fs from 'fs';
import path from 'path';

// Parse .env.local
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

async function testLiveSend() {
  const apiKey = process.env.ZEPTO_MAIL_API_KEY || '';
  const url = process.env.ZEPTO_MAIL_API_URL || 'https://api.zeptomail.in/v1.1/email';
  const targetEmail = process.argv[2] || 'rajat.rai@cogoport.com';

  console.log('Sending live test to:', targetEmail);
  console.log('ZeptoMail URL:', url);
  console.log('ZeptoMail Token: CONFIGURED');

  const authHeader = apiKey.toLowerCase().startsWith('zoho-enczapikey')
    ? apiKey
    : `Zoho-enczapikey ${apiKey}`;

  const payload = {
    from: { address: 'password@fr8x.in', name: 'FR8X Security' },
    to: [{ email_address: { address: targetEmail, name: 'FR8X User' } }],
    subject: 'Live ZeptoMail Delivery Diagnostic Check',
    htmlbody: '<div style="background:#ffffff;padding:20px;font-family:sans-serif;color:#1e293b;"><h2>Live FR8X ZeptoMail Test</h2><p>This is a live transactional email sent from password@fr8x.in to verify mailbox delivery.</p><p>Timestamp: ' + new Date().toISOString() + '</p></div>',
    textbody: 'Live FR8X ZeptoMail Test from password@fr8x.in at ' + new Date().toISOString(),
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        Authorization: authHeader,
      },
      body: JSON.stringify(payload),
    });

    console.log('HTTP Status:', res.status, res.statusText);
    const data = await res.json();
    console.log('Response:', JSON.stringify(data, null, 2));
  } catch (err: any) {
    console.error('Fetch error:', err.message);
  }
}

testLiveSend();
