# FR8X — ZeptoMail Transactional Email Service Integration Guide

This document describes the production implementation of Zoho ZeptoMail REST API within the FR8X application and Godfather Authentication System.

---

## 1. How FR8X Connects to ZeptoMail

FR8X communicates with ZeptoMail strictly via the server-side REST Email Sending API.

### Architecture

```
FR8X Frontend (Next.js Client Components)
       │
       ▼ (Internal HTTPS API Calls / Cookies / Headers)
FR8X Backend (Next.js API Route Handlers)
       │
       ▼ (Strict Type Validation, Non-leaking Errors, Server-side Mapping)
Central Email Service (lib/email-service.ts & lib/mailer.ts)
       │
       ▼ (HTTPS POST with Authorization: Zoho-enczapikey <SERVER_TOKEN>)
ZeptoMail REST API (https://api.zeptomail.in/v1.1/email)
       │
       ▼
Recipient Mailbox
```

### Security Isolation
- The browser/client never interacts with ZeptoMail directly.
- The ZeptoMail Send Mail Token is only read in server-side processes via `process.env.ZEPTO_MAIL_API_KEY`.
- No client-side bundle, Next.js public variable, HTML, or cookie ever contains or references the token.

---

## 2. Required Environment Variables

The following variables should be added to your deployment environment (Vercel, Cloud Run, VPS, or `.env.local` for local development):

| Variable Name | Required | Default / Recommended Value | Description |
| :--- | :---: | :--- | :--- |
| `ZEPTO_MAIL_API_URL` | Optional | `https://api.zeptomail.in/v1.1/email` | Regional ZeptoMail REST API endpoint (India DC: `.in`, Global DC: `.com`) |
| `ZEPTO_MAIL_API_KEY` | **Required** | *(Entered securely via dashboard / secrets manager)* | ZeptoMail Send Mail Token for `agent_1` |
| `ZEPTO_MAIL_FROM_NAME` | Optional | `FR8X` | Display sender name |
| `ZEPTO_MAIL_PASSWORD_FROM` | Optional | `password@fr8x.in` | Dedicated identity for password and security notifications |
| `ZEPTO_MAIL_SUPPORT_FROM` | Optional | `support@fr8x.in` | Dedicated identity for customer support and tickets |
| `ZEPTO_MAIL_TECH_FROM` | Optional | `tech@fr8x.in` | Dedicated identity for infrastructure & system maintenance |
| `ZEPTO_MAIL_BOUNCE_ADDRESS` | Optional | *(Omit unless custom bounce domain is configured)* | Custom return-path address |
| `APP_URL` | **Required** | `https://con.fr8x.in` | Public URL used to build verification and password-reset links |

Template values are committed in `.env.example`. Never commit the actual `.env` or any production secrets to Git.

---

## 3. How to Configure the Send Mail Token Securely

1. In the ZeptoMail Web Console:
   - Navigate to **Mail Agents** &rarr; Select `agent_1`.
   - Verify that `fr8x.in` is active and marked as **Verified**.
   - Go to **SMTP / API** &rarr; **API** tab.
   - Click **Generate Token** (or use existing agent Send Mail Token).
2. Copy the token into your secrets management provider:
   - **Local Development**: Add `ZEPTO_MAIL_API_KEY=<TOKEN>` into `.env.local` (which is in `.gitignore`).
   - **Vercel / Cloud Run / Kubernetes / AWS**: Add `ZEPTO_MAIL_API_KEY` as a production Server Environment Variable.
3. **DO NOT** prefix the value with `NEXT_PUBLIC_`.

---

## 4. Sender Address Mapping

FR8X enforces strict server-side sender isolation. The frontend cannot specify or spoof the `from` email address.

| Purpose | Sender Mailbox | Allowed Events |
| :--- | :--- | :--- |
| **Password & Security** | `password@fr8x.in` | Registration email verification, OTP login challenges, Forgot password, Password reset confirmation, Account lockout alert |
| **Customer Support** | `support@fr8x.in` | Support ticket creation acknowledgement, Member support requests, Operational assistance |
| **Technical Notifications** | `tech@fr8x.in` | System maintenance windows, Scheduled downtime alerts, Platform incident reports, Service restoration notices |

All customer-facing transactional emails configure `support@fr8x.in` as the default `Reply-To`.

---

## 5. Authentication Email Flow

### Registration & Verification
1. User submits registration via `POST /api/auth/register`.
2. Backend creates user in `pending_verification` state.
3. Cryptographically secure single-use token and 6-digit OTP are generated (expires in 24 hours).
4. `EmailService.sendVerificationEmail` sends message from `password@fr8x.in`:
   - Subject: `VERIFY YOUR FR8X EMAIL ADDRESS`
   - Primary action: `${APP_URL}/verify-email/<TOKEN>`
   - Also displays 6-digit code.
5. User verifies via `POST /api/auth/verify-email`. Status transitions to `active` and token is invalidated.

### Forgot Password & Anti-Account-Enumeration
1. User requests password reset via `POST /api/auth/forgot-password`.
2. Backend generates random 32-byte cryptographic token and 6-digit OTP (expires in 15 minutes).
3. If the account exists, `EmailService.sendPasswordResetEmail` is dispatched from `password@fr8x.in`:
   - Subject: `RESET YOUR FR8X PASSWORD`
   - Primary action: `${APP_URL}/reset-password/<TOKEN>`
4. **Anti-Enumeration Guard**: Regardless of whether the email exists in the database, the API returns the exact same response:
   > *"If an account exists for this email address, password reset instructions have been sent."*
5. No account metadata, existence flag, or user ID is exposed in the API response or application logs.

### Password Changed Security Notice
1. Once a password is reset via `POST /api/auth/reset-password`, the token is immediately consumed.
2. `EmailService.sendPasswordChangedEmail` dispatches confirmation from `password@fr8x.in`:
   - Subject: `YOUR FR8X PASSWORD WAS CHANGED`
   - Includes timestamp, masked email, origin IP, and "SECURE MY ACCOUNT" action button.

### Multi-Factor OTP Login
1. Operator initiates MFA challenge via `POST /api/godfather/auth/send-otp`.
2. CSPRNG generates 6-digit OTP (valid for 10 minutes).
3. `EmailService.sendOtpEmail` dispatches from `password@fr8x.in`:
   - Subject: `YOUR FR8X VERIFICATION CODE`
4. Code is hashed before storing; never logged, never returned in API response.

---

## 6. Support Email Flow

1. Support requests received via `/api/support` or admin ticketing.
2. `EmailService.sendSupportEmail` dispatches from `support@fr8x.in`:
   - Subject: `FR8X SUPPORT TICKET CREATED — {{TICKET_ID}}`
   - Includes Ticket ID, user details, request summary, and timestamp.
   - Reply-To routes to `support@fr8x.in`.

---

## 7. Technical Email Flow

1. Platform maintenance or incident events triggered from Godfather system controls.
2. `EmailService.sendTechnicalEmail` dispatches from `tech@fr8x.in`:
   - Subject variants:
     - `FR8X SYSTEM MAINTENANCE NOTIFICATION`
     - `FR8X SYSTEM INCIDENT — {{INCIDENT_ID}}`
     - `FR8X SYSTEM SERVICE RESTORED — {{INCIDENT_ID}}`
   - Isolated from customer support and password authentication.

---

## 8. How to Test the Integration

### Automated Verification Suite
Run the comprehensive test suite covering all 18 security and functional points:
```bash
npm run test:auth-email
```

### Protected Diagnostic Endpoint
Only authorized operators (with active Godfather session or admin credentials) can trigger diagnostic test dispatches:
```bash
POST /api/admin/email/test-send
Headers:
  Authorization: Bearer <ADMIN_API_KEY>
  Content-Type: application/json
Body:
{
  "recipient": "operator@fr8x.in",
  "testType": "zeptomail",
  "reason": "Production verification of ZeptoMail REST API connection"
}
```
This sends an email from `password@fr8x.in` with subject `FR8X ZEPTOMAIL TEST` and body `FR8X ZeptoMail integration test successful.`.

---

## 9. How to Rotate the Send Mail Token

If a token is suspected of being exposed or during scheduled rotation:

1. Log in to ZeptoMail Console &rarr; **Mail Agents** &rarr; `agent_1`.
2. Go to **SMTP / API** &rarr; **API** &rarr; Generate a **NEW** token.
3. Update the deployment environment variable `ZEPTO_MAIL_API_KEY` with the new token.
4. Redeploy the server application or restart container processes.
5. Verify connectivity with `npm run test:auth-email` or via `/api/admin/email/test-send`.
6. Once verified, delete the old token in ZeptoMail Console.

---

## 10. Troubleshooting ZeptoMail API Errors

| HTTP Status / Code | Probable Cause | Corrective Action |
| :--- | :--- | :--- |
| `401 Unauthorized` | Invalid or expired Send Mail Token | Check `ZEPTO_MAIL_API_KEY`. Regenerate token in `agent_1` API settings. Ensure no leading/trailing spaces. |
| `400 Bad Request` (`INVALID_SENDER`) | Sender address not added to `agent_1` | Ensure sender address is one of `password@fr8x.in`, `support@fr8x.in`, or `tech@fr8x.in`. |
| `400 Bad Request` (`BOUNCE_ADDRESS_INVALID`) | Invalid bounce domain | Remove `ZEPTO_MAIL_BOUNCE_ADDRESS` from environment unless custom bounce domain CNAME is verified in ZeptoMail. |
| `429 Too Many Requests` | Account or agent rate limit exceeded | The service automatically backs off and retries transient rate limits. Check account credits in Zoho console. |
| `5xx Server Error` | Transient ZeptoMail upstream issue | Built-in exponential backoff handles transient 5xx errors up to 2 retries automatically. |
| `Network Timeout (AbortError)` | Connectivity or firewall blocking HTTPS | Verify outbound HTTPS port 443 traffic to `api.zeptomail.in` is permitted by your hosting provider. |
