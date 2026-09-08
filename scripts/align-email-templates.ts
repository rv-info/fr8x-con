import fs from 'fs';
import path from 'path';

const emailTemplatesPath = path.resolve('lib/email-templates.ts');
let content = fs.readFileSync(emailTemplatesPath, 'utf8');

// 1. Check Sovereign in lib/email-templates.ts
console.log('--- Checking Sovereign in lib/email-templates.ts ---');
const beforeMatches = content.match(/sovereign/gi);
console.log('Found sovereign count before:', beforeMatches ? beforeMatches.length : 0);

// 2. Modernize wrapEmailHtml
const oldWrapPattern = /function wrapEmailHtml\(content: string, preheader = ''\): string \{[\s\S]*?^}/m;

const newWrapEmailHtml = `function wrapEmailHtml(content: string, preheader = ''): string {
  return \`<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>FR8X</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff !important;
      color: #0f172a;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
      line-height: 1.6;
    }
    table {
      border-collapse: collapse;
      mso-table-lspace: 0pt;
      mso-table-rspace: 0pt;
    }
    .email-container {
      max-width: 600px;
      margin: 32px auto;
      background-color: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .email-header {
      padding: 28px 36px;
      background-color: #ffffff;
      border-bottom: 1px solid #f1f5f9;
    }
    .brand-title {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      font-size: 26px;
      font-weight: 900;
      color: #0f172a;
      margin: 0;
      letter-spacing: -0.03em;
      line-height: 1;
    }
    .brand-accent {
      color: #0284c7;
    }
    .brand-tag {
      display: inline-block;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: #0284c7;
      margin-top: 6px;
    }
    .email-body {
      padding: 36px;
      background-color: #ffffff;
      color: #334155;
      font-size: 15px;
      line-height: 1.7;
    }
    .email-footer {
      padding: 28px 36px;
      background-color: #ffffff;
      border-top: 1px solid #f1f5f9;
      font-size: 12px;
      color: #64748b;
      text-align: center;
      line-height: 1.6;
    }
    .btn-primary {
      display: inline-block;
      background-color: #0f172a;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin: 22px 0;
      box-shadow: 0 2px 4px rgba(15, 23, 42, 0.15);
    }
    .btn-danger {
      display: inline-block;
      background-color: #be123c;
      color: #ffffff !important;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 13px;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      margin: 22px 0;
      box-shadow: 0 2px 4px rgba(190, 18, 60, 0.2);
    }
    .code-box {
      background-color: #f8fafc;
      border: 1px solid #cbd5e1;
      border-radius: 10px;
      padding: 24px;
      text-align: center;
      margin: 24px 0;
    }
    .code-digits {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 38px;
      font-weight: 800;
      letter-spacing: 10px;
      color: #0f172a;
    }
    .section-title {
      font-size: 11px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      margin: 24px 0 10px 0;
    }
    .detail-card {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 18px 22px;
      margin: 16px 0;
      color: #334155;
      font-size: 14px;
      line-height: 1.6;
    }
    .detail-row {
      margin: 8px 0;
    }
    .detail-label {
      font-weight: 700;
      color: #0f172a;
    }
    .detail-value {
      color: #334155;
    }
    .warning-box {
      background-color: #fff1f2;
      border-left: 4px solid #e11d48;
      padding: 16px 20px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 13px;
      color: #9f1239;
      line-height: 1.6;
    }
    .info-box {
      background-color: #f0fdf4;
      border-left: 4px solid #16a34a;
      padding: 16px 20px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 13px;
      color: #166534;
      line-height: 1.6;
    }
    .security-notice {
      background-color: #fefce8;
      border-left: 4px solid #ca8a04;
      padding: 16px 20px;
      border-radius: 6px;
      margin: 20px 0;
      font-size: 13px;
      color: #854d0e;
      line-height: 1.6;
    }
    p {
      margin: 14px 0;
      color: #334155;
    }
    a {
      color: #0284c7;
      text-decoration: none;
    }
    a:hover {
      text-decoration: underline;
    }
  </style>
</head>
<body style="background-color: #ffffff; margin: 0; padding: 0;">
  \${preheader ? \`<span style="display:none;font-size:1px;color:#ffffff;max-height:0px;max-width:0px;opacity:0;overflow:hidden;">\${preheader}</span>\` : ''}
  <table width="100%" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff;">
    <tr>
      <td align="center" style="padding: 24px 12px; background-color: #ffffff;">
        <div class="email-container">
          <div class="email-header">
            <div class="brand-title">FR<span class="brand-accent">8</span>X</div>
            <div class="brand-tag">FR8X TEAM</div>
          </div>
          <div class="email-body">
            \${content}
          </div>
          <div class="email-footer">
            <div style="font-weight: 700; color: #0f172a; font-size: 12px; letter-spacing: 0.05em; margin-bottom: 4px;">FR8X TEAM</div>
            <div>This is an official communication from FR8X (<a href="https://fr8x.in" style="color: #0284c7; text-decoration: none; font-weight: 600;">fr8x.in</a>).</div>
            <div style="margin-top: 6px; color: #94a3b8; font-size: 11px;">&copy; \${new Date().getFullYear()} FR8X. All rights reserved.</div>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>\`;
}`;

content = content.replace(oldWrapPattern, newWrapEmailHtml);

// 3. Replace all team variations with strictly "FR8X Team"
// In HTML sign-offs:
content = content.replace(
  /<strong style="color: #111827;">FR8X (?:Security|Support|Technical) Team<\/strong><br>\s*<a href="mailto:[^"]+" style="color: #0284c7;">[^<]+<\/a>/g,
  `<strong style="color: #0f172a; font-size: 15px;">FR8X Team</strong><br>\n      <a href="https://fr8x.in" style="color: #0284c7; text-decoration: none; font-weight: 600;">fr8x.in</a>`
);

// In Text sign-offs:
content = content.replace(
  /FR8X (?:Security|Support|Technical) Team\r?\n[a-z0-9._%+-]+@fr8x\.in/g,
  `FR8X Team\nhttps://fr8x.in`
);

// In "contact FR8X Support" in body:
content = content.replace(/contact FR8X Support/g, 'contact FR8X Team');

// Any remaining "FR8X Security Team" or "FR8X Support Team" or "FR8X Technical Team":
content = content.replace(/FR8X Security Team/g, 'FR8X Team');
content = content.replace(/FR8X Support Team/g, 'FR8X Team');
content = content.replace(/FR8X Technical Team/g, 'FR8X Team');

// Any remaining Sovereign in email-templates.ts
content = content.replace(/Sovereign\s*/gi, '');

fs.writeFileSync(emailTemplatesPath, content, 'utf8');
console.log('Successfully updated lib/email-templates.ts');

// Check Sovereign again in lib/email-templates.ts
const afterMatches = content.match(/sovereign/gi);
console.log('Remaining sovereign in lib/email-templates.ts:', afterMatches ? afterMatches.length : 0);

// Check remaining Team occurrences:
const teamMatches = content.match(/FR8X \w+ Team/g);
console.log('Non-standard team matches in lib/email-templates.ts:', teamMatches || 'None (all FR8X Team)');
