# GodMode Standard Operating Procedure (SOP) & Access Control Guide

## 📌 Executive Overview
This document provides the standard operating procedures for confirming, granting, and operating **GodMode** administrative access on the **FR8X-CON** freight exchange platform.

---

## 🔑 GodMode Standard Credentials

| Field | Value / Details |
| :--- | :--- |
| **Admin Email** | `support@fr8x.in` |
| **Admin Password** | `QWERTY@123x` |
| **Access URL** | `http://localhost:3000/godmode` |
| **Login Endpoint** | `http://localhost:3000/godmode/login` |
| **Seeding Endpoint** | `POST http://localhost:3000/api/admin/seed-godmode` |
| **Dummy Data Endpoint**| `POST http://localhost:3000/api/admin/seed-dummy-data` |

---

## 🚀 Procedure for GodMode Confirmation & Activation

### Step 1: Execute User & GodMode Provisioning
Run the automated CLI seeding script from the project root:
```bash
node scripts/seed-dummy-data.js
```
*or trigger via curl / HTTP POST:*
```bash
curl -X POST http://localhost:3000/api/admin/seed-godmode
```

### Step 2: Set Browser GodMode Cookie / Session
When logging in via `/godmode/login`, the following authorization tokens are set automatically:
1. **Cookie**: `fr8x_godmode_token=godmode_admin_token_2026; path=/; max-age=604800; SameSite=Lax`
2. **Session Storage**: `sessionStorage.setItem("fr8x_godmode_admin", "true")`
3. **Firestore User Document**: `{ isGodMode: true, role: "admin", kycStatus: "verified" }`

### Step 3: Verify Admin Controls
Navigate to `http://localhost:3000/godmode` to confirm full administrative access:
- **Dashboard Overview**: Access system metrics, total revenue, active users.
- **Users & Members**: Inspect pre-approved users with `kycStatus: "verified"`.
- **Companies**: Verify Tier-3 Enterprise Gold status.
- **Moderation Queue**: Manage disputes & auto-approved listings.
- **Blacklist Registry**: Sanction or clear flagged entities.
- **Billing & Plans**: Adjust freight forwarder & shipper subscription tiers.

---

## 🔒 Permission & Authorization Checklist

- [x] **Middleware Authorization**: Validates `fr8x_godmode_token` cookie or `x-godmode-auth` header on all `/godmode/*` routes.
- [x] **Firestore Security Rules**: Rules allow `read, write` to authenticated users (`request.auth != null`).
- [x] **Local Fallback Auth**: Fallback state enables un-interrupted testing when running offline without live Firebase credentials.
- [x] **Auto-Approved Dummy Accounts**: `support@fr8x.in` and `mgt@raivega.in` are pre-provisioned with full permissions.

---

## 📞 Troubleshooting & Escalation
If you encounter `Missing or insufficient permissions`, refer to [PERMISSIONS_TROUBLESHOOTING.md](./PERMISSIONS_TROUBLESHOOTING.md) for step-by-step diagnostic and resolution procedures.
