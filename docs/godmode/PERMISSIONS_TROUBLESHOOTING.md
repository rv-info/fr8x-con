# Firestore & GodMode Permissions Diagnostics & Root-Cause Guide

## ❓ Why "Missing or Insufficient Permissions" Occurs

The error:
> `FirebaseError: [firestore/permission-denied]: Missing or insufficient permissions.`

occurs due to one or more of the following 4 technical reasons:

---

### 1. Unauthenticated Client Firestore Access
- **Cause**: Firestore Security Rules (`firestore.rules`) enforce `allow read, write: if isAuthenticated();`.
- **Why it happens**: If a user attempts to read or write to Firestore (e.g. fetching `/users`, `/companies`, `/rates`, `/auctions`) before logging in, `request.auth` is `null`. Firestore immediately rejects the request with a permission error.
- **Fix**: Log in with valid credentials (`support@fr8x.in` / `QWERTY@123x`), or ensure client queries are executed after `onAuthStateChanged` completes.

---

### 2. Missing GodMode Token in Cookies / Headers
- **Cause**: Next.js Middleware (`src/middleware.ts`) isolates all `/godmode/*` routes.
- **Why it happens**: If a request to `/godmode` lacks the `fr8x_godmode_token` cookie or `x-godmode-auth` header, Middleware returns a `404` or `403` security block.
- **Fix**: Log in via `/godmode/login` or run `node scripts/seed-dummy-data.js` which automatically provisions the GodMode token and cookie.

---

### 3. User Document `isGodMode` Flag Not Set in Firestore
- **Cause**: `AuthProvider.tsx` checks `user.isGodMode` from the user's Firestore document.
- **Why it happens**: If the logged-in user exists in Firebase Auth but has no corresponding document in the `/users/{uid}` collection with `isGodMode: true`, `hasRole()` returns `false`.
- **Fix**: Post to `/api/admin/seed-godmode` or run `node scripts/seed-dummy-data.js` to set `isGodMode: true` and `role: "admin"` in Firestore.

---

### 4. Firebase Storage Rules
- **Cause**: `storage.rules` restricts file uploads (avatars, KYC documents, tax certificates) to authenticated users.
- **Why it happens**: Uploading files unauthenticated is denied by default.
- **Fix**: Ensure the user is signed in before attempting uploads.

---

## 🛠️ Automated One-Click Permission Fix Procedure

To resolve any permission issues instantly:

1. **Run the Dummy Provisioner**:
   ```bash
   node scripts/seed-dummy-data.js
   ```

2. **Trigger API Provisioning**:
   ```bash
   curl -X POST http://localhost:3000/api/admin/seed-godmode
   curl -X POST http://localhost:3000/api/admin/seed-dummy-data
   ```

3. **Confirm Cookie Registration**:
   Ensure `fr8x_godmode_token` is present in browser developer tools under `Application > Cookies > http://localhost:3000`.

---

## 📊 Permission Matrix Reference

| Role | App Routes (`/dashboard`, `/rates`) | GodMode Routes (`/godmode/*`) | KYC Status | Pre-Approved |
| :--- | :--- | :--- | :--- | :--- |
| **GodMode Admin (`support@fr8x.in`)** | ✅ Full Access | ✅ Full GodMode Control | `verified` | ✅ Auto-Approved |
| **Freight Forwarder (`mgt@raivega.in`)**| ✅ Full Access | ❌ Restricted | `verified` | ✅ Auto-Approved |
| **Shipper (`shipper@acme.com`)** | ✅ Full Access | ❌ Restricted | `verified` | ✅ Auto-Approved |
| **Transporter (`transporter@express.com`)**| ✅ Full Access | ❌ Restricted | `verified` | ✅ Auto-Approved |
