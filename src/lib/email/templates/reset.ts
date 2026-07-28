// FR8X-CON Password Reset Email Template

export interface ResetEmailData {
  resetLink: string;
  appName?: string;
}

export function generateResetEmail(data: ResetEmailData) {
  const appName = data.appName || "FR8X-CON";
  const subject = `Reset Your Password — ${appName}`;

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f7f7ff; font-family: 'Inter', system-ui, -apple-system, sans-serif; color: #253031;">
  <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f7f7ff; padding: 40px 10px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 580px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5d9f2; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #253031 0%, #0d4664 100%); padding: 28px 36px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255,255,255,0.15); padding: 6px 14px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
                <span style="color: #56C5F0; font-weight: 800; font-size: 22px; letter-spacing: 1.5px;">FR8X</span>
                <span style="color: #ffffff; font-weight: 600; font-size: 22px; letter-spacing: 1px;">-CON</span>
              </div>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 36px 40px 28px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 700; color: #253031; line-height: 1.3; text-align: center;">
                Reset Your Password
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #535657; text-align: center;">
                We received a request to reset your password for your <strong>${appName}</strong> account. Click the button below to continue and set a new password:
              </p>

              <!-- Reset Action Button -->
              <div style="text-align: center; margin: 32px 0 28px 0;">
                <a href="${data.resetLink}" target="_blank" style="background-color: #56C5F0; color: #ffffff; padding: 14px 36px; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(86,197,240,0.35);">
                  Reset Password
                </a>
              </div>

              <!-- Security Note -->
              <div style="padding: 14px 16px; background-color: #f7f7ff; border-radius: 8px; border: 1px solid #ede6f2; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 12px; color: #746d75; line-height: 1.5;">
                  🔒 <strong>Security Notice:</strong> This link is secure and will expire automatically per default security policy. If you didn't request a password reset, you can safely ignore this email — your account remains secure.
                </p>
              </div>

              <p style="margin: 0; font-size: 12px; color: #746d75; line-height: 1.5; text-align: center;">
                Having trouble with the button? Copy and paste the link below into your web browser:<br>
                <a href="${data.resetLink}" style="color: #2b9ed6; text-decoration: underline; word-break: break-all;">${data.resetLink}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7f7ff; padding: 20px 36px; border-top: 1px solid #e5d9f2; text-align: center;">
              <p style="margin: 0 0 4px 0; font-size: 12px; font-weight: 600; color: #535657;">
                ${appName} Security & Auth Services
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} FR8X-CON. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;

  const text = `
Reset Your Password — ${appName}

We received a request to reset your password for your ${appName} account.

To reset your password, visit the following link:
${data.resetLink}

This link is secure and will expire per standard security settings. If you didn't request this, you can safely ignore this email.

© ${new Date().getFullYear()} ${appName}. All rights reserved.
  `.trim();

  return { subject, html, text };
}
