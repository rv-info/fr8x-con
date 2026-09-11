import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

// Parse .env.local if present
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

async function testSmtp() {
  const rawKey = (process.env.ZEPTO_MAIL_API_KEY || process.env.ZOHO_SMTP_PASSWORD || '').trim();
  const token = rawKey.replace(/^zoho-enczapikey\s+/i, '').trim();

  if (!token) {
    console.error('❌ ZEPTO_MAIL_API_KEY is not configured.');
    return;
  }
  
  const transporter = nodemailer.createTransport({
    host: 'smtp.zeptomail.in',
    port: 587,
    secure: false,
    auth: {
      user: 'emailapikey',
      pass: token,
    },
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: true,
    },
  });

  console.log('Testing connection to ZeptoMail SMTP (smtp.zeptomail.in:587)...');
  try {
    await transporter.verify();
    console.log('✅ ZeptoMail SMTP connection verified successfully!');

    console.log('Sending test email via ZeptoMail SMTP...');
    const info = await transporter.sendMail({
      from: '"FR8X Security" <password@fr8x.in>',
      to: 'tech@fr8x.in',
      subject: 'ZeptoMail SMTP Test',
      text: 'Test email sent via ZeptoMail SMTP relay.',
      html: '<div><b>Test email sent via ZeptoMail SMTP relay.</b></div>',
    });
    console.log('✅ Email successfully sent via SMTP!', info.messageId);
  } catch (err: any) {
    console.error('❌ ZeptoMail SMTP error:', err.message);
  }
}

testSmtp();
