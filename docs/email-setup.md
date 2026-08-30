# FR8X Official Zoho Mail Configuration & DNS Architecture

This document defines the production domain verification, DNS record architecture, mailbox provisioning model, and server-side SMTP configuration for **FR8X (`fr8x.in`)** using **Zoho Mail**.

---

## 1. Domain & DNS Verification Records

All records must be configured in the registrar DNS management console (e.g. Cloudflare / Route53 / GoDaddy) and verified green in the **Zoho Mail Admin Console** prior to production deployment.

### 1.1 MX (Mail Exchanger) Records
Deliver all incoming mail to Zoho Mail India/Global routing clusters:

| Host / Name | Record Type | Value / Destination | Priority | TTL |
| :--- | :--- | :--- | :--- | :--- |
| `@` (`fr8x.in`) | `MX` | `mx.zoho.com` | `10` | `300` (Auto) |
| `@` (`fr8x.in`) | `MX` | `mx2.zoho.com` | `20` | `300` (Auto) |
| `@` (`fr8x.in`) | `MX` | `mx3.zoho.com` | `50` | `300` (Auto) |

---

### 1.2 SPF (Sender Policy Framework) Record
Authorizes Zoho Mail servers to send emails on behalf of `@fr8x.in`, preventing spoofing:

| Host / Name | Record Type | Value / Content | TTL |
| :--- | :--- | :--- | :--- |
| `@` (`fr8x.in`) | `TXT` | `v=spf1 include:zohomail.com -all` | `300` |

---

### 1.3 DKIM (DomainKeys Identified Mail) Record
Provides cryptographic signature validation on outbound emails.
1. In Zoho Mail Admin Console, navigate to: **Domains → Email Configuration → DKIM**.
2. Add selector: `zoho`
3. Publish the generated public key TXT record:

| Host / Name | Record Type | Value / Content | TTL |
| :--- | :--- | :--- | :--- |
| `zoho._domainkey.fr8x.in` | `TXT` | `v=DKIM1; k=rsa; p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQ...` | `300` |

---

### 1.4 DMARC (Domain-based Message Authentication) Policy
Guarantees message deliverability and reporting against phishing attempts:

| Host / Name | Record Type | Value / Content | TTL |
| :--- | :--- | :--- | :--- |
| `_dmarc.fr8x.in` | `TXT` | `v=DMARC1; p=quarantine; rua=mailto:tech@fr8x.in; ruf=mailto:tech@fr8x.in; fo=1; pct=100` | `300` |

> [!TIP]
> **DMARC Rollout Strategy**: Start with `p=quarantine` during deliverability validation. Once deliverability reports at `tech@fr8x.in` show 100% SPF/DKIM alignment, upgrade to `p=reject`.

---

## 2. Mailbox Architecture & Role Delegation

To maintain security boundaries and cost efficiency, FR8X utilizes 3 dedicated mailboxes with aliases:

| Mailbox Address | Platform Role | Operational Policy | Security Controls |
| :--- | :--- | :--- | :--- |
| **`password@fr8x.in`** | **System & Auth Engine** | Automated sending of OTPs, password resets, email verification, and security challenges. Never used manually by a human operator in webmail UI. | App-Password authenticated over TLS/SSL port 465. Stored in Vercel/Firebase Secrets as `ZOHO_SMTP_PASSWORD`. |
| **`support@fr8x.in`** | **Customer & Member Support** | Inbound customer enquiries, platform support ticket ingestion, automated acknowledgements. | Shared mailbox with delegated support specialists. Optional Zoho Desk integration. |
| **`tech@fr8x.in`** | **GODFATHER Operator & Alerts** | Human-controlled super-admin identity, GODFATHER account provisioning, Step-Up verification challenges, and automated security event alerts. | Mandatory Hardware FIDO2 / TOTP MFA. Monitored 24/7 for brute-force lockouts and KYC alerts. |

### 2.1 Aliases Configuration (No Extra Paid Seats)
The following addresses are configured as aliases under `support@fr8x.in` or `password@fr8x.in`:
- `billing@fr8x.in` (points to `support@fr8x.in` / Finance)
- `noreply@fr8x.in` (points to `password@fr8x.in` / Automated)
- `alerts@fr8x.in` (points to `tech@fr8x.in` / Security)

---

## 3. Application SMTP & ZeptoMail Backend Configuration

### 3.1 Standard Transactional SMTP (Zoho India Data Center)
- **Host**: `smtp.zoho.in` (or `smtp.zoho.com` based on account DC)
- **Port**: `465` (SSL) or `587` (TLS / STARTTLS)
- **Authentication**: `LOGIN` / `PLAIN`
- **Username**: `password@fr8x.in`
- **Password**: Zoho App Password (Generated in Zoho Account → Security → App Passwords)

### 3.2 High-Volume Transactional Failover (Zoho ZeptoMail)
If transactional notifications or auction broadcast volumes exceed standard mailbox sending limits (1,000 emails/day), traffic automatically fails over to **Zoho ZeptoMail API** via `send_mail_token` using the identical sender identity `FR8X <password@fr8x.in>`.

---

## 4. Immutable Delivery Logging
Every outbound email dispatched by the system generates an append-only audit record in Firestore collection `emailLogs/{logId}` containing:
- `recipient`: Anonymized / verified email
- `templateId`: e.g. `TMPL_OTP_CHALLENGE`, `TMPL_AUCTION_INVITE`
- `correlationId`: `GF-EML-XXXX-XXXX`
- `status`: `queued` | `sent` | `delivered` | `bounced` | `failed`
- `timestamp`: UTC ISO string
- `actorUid`: Originating operator or system trigger
