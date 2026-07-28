// FR8X-CON Welcome Email Template

export interface WelcomeEmailData {
  displayName: string;
  loginUrl: string;
  appName?: string;
}

export function generateWelcomeEmail(data: WelcomeEmailData) {
  const appName = data.appName || "FR8X-CON";
  const name = data.displayName || "Logistics Partner";
  const subject = `Welcome to ${appName} — You're all set! 🎉`;

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
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #e5d9f2; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.05);" border="0" cellspacing="0" cellpadding="0">
          
          <!-- Header Bar -->
          <tr>
            <td style="background: linear-gradient(135deg, #253031 0%, #0d4664 100%); padding: 32px 40px; text-align: center;">
              <div style="display: inline-block; background-color: rgba(255,255,255,0.15); padding: 8px 16px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.2);">
                <span style="color: #56C5F0; font-weight: 800; font-size: 24px; letter-spacing: 1.5px;">FR8X</span>
                <span style="color: #ffffff; font-weight: 600; font-size: 24px; letter-spacing: 1px;">-CON</span>
              </div>
              <p style="color: #a7d8f0; margin: 10px 0 0 0; font-size: 13px; font-weight: 500; letter-spacing: 0.5px;">
                Verified Logistics & Freight Intelligence Network
              </p>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td style="padding: 40px 40px 30px 40px;">
              <h1 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 700; color: #253031; line-height: 1.3;">
                Hi ${name}, welcome aboard! 👋
              </h1>
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #535657;">
                Thank you for registering with <strong>${appName}</strong>. Your enterprise account has been created and verified. Here's what you can do next:
              </p>

              <!-- Feature List -->
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="margin-bottom: 32px;">
                <tr>
                  <td style="padding: 12px 16px; background-color: #f7f7ff; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #56C5F0;">
                    <strong style="color: #253031; font-size: 14px; display: block; margin-bottom: 2px;">🚢 Real-Time Freight Intelligence</strong>
                    <span style="color: #746d75; font-size: 13px;">Explore verified ocean, air, and surface freight rate feeds globally.</span>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background-color: #f7f7ff; border-radius: 10px; margin-bottom: 10px; border-left: 4px solid #A594F9;">
                    <strong style="color: #253031; font-size: 14px; display: block; margin-bottom: 2px;">⚡ Digital Freight Auctions</strong>
                    <span style="color: #746d75; font-size: 13px;">Create, participate, and bid on transparent container auctions.</span>
                  </td>
                </tr>
                <tr><td style="height: 10px;"></td></tr>
                <tr>
                  <td style="padding: 12px 16px; background-color: #f7f7ff; border-radius: 10px; border-left: 4px solid #3ABFF0;">
                    <strong style="color: #253031; font-size: 14px; display: block; margin-bottom: 2px;">🛡️ Verified Enterprise B2B Network</strong>
                    <span style="color: #746d75; font-size: 13px;">Connect directly with verified forwarders, MLOs, NVOCCs, and shippers.</span>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <div style="text-align: center; margin: 36px 0 24px 0;">
                <a href="${data.loginUrl}" target="_blank" style="background-color: #56C5F0; color: #ffffff; padding: 14px 36px; font-weight: 700; font-size: 15px; text-decoration: none; border-radius: 10px; display: inline-block; box-shadow: 0 4px 12px rgba(86,197,240,0.35); transition: background-color 0.2s;">
                  Get Started &rarr;
                </a>
              </div>

              <p style="margin: 24px 0 0 0; font-size: 13px; color: #746d75; line-height: 1.5; text-align: center;">
                If the button above does not work, copy and paste this URL into your browser:<br>
                <a href="${data.loginUrl}" style="color: #2b9ed6; text-decoration: underline; word-break: break-all;">${data.loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f7f7ff; padding: 24px 40px; border-top: 1px solid #e5d9f2; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 12px; font-weight: 600; color: #535657;">
                ${appName} Operations Team
              </p>
              <p style="margin: 0 0 12px 0; font-size: 11px; color: #746d75; line-height: 1.4;">
                This email was sent to your registered address because you signed up for ${appName}.<br>
                If you did not create this account, please contact <a href="mailto:support@fr8x.in" style="color: #2b9ed6; text-decoration: none;">support@fr8x.in</a> immediately.
              </p>
              <p style="margin: 0; font-size: 11px; color: #94a3b8;">
                &copy; ${new Date().getFullYear()} FR8X-CON. All rights reserved. | <a href="${data.loginUrl}/terms" style="color: #94a3b8; text-decoration: underline;">Terms & Privacy Policy</a>
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
Hi ${name}, welcome aboard! 🎉

Thank you for registering with ${appName}. Your enterprise account is all set up.

Here's what you can do next:
- Ocean & Air Freight Intelligence: Access verified freight rate feeds globally.
- Digital Freight Auctions: Post and bid on transparent freight auctions.
- Verified Enterprise Network: Connect directly with freight forwarders, MLOs, NVOCCs, and shippers.

Get started by signing in here: ${data.loginUrl}

If you did not request this account, please contact support@fr8x.in.

© ${new Date().getFullYear()} ${appName}. All rights reserved.
  `.trim();

  return { subject, html, text };
}
