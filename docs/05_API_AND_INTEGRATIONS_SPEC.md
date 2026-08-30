# FR8X — API & Integrations Specification

## 1. REST API Endpoints Overview (Next.js App Router / Firebase Functions)

All state mutations enforce JSON payloads, bearer token authorization, strict input validation (Zod/Joi), and audit log creation.

### 1.1 Authentication & KYC
- `POST /api/auth/domain-check`: Checks if an email domain is in the consumer/free email blacklist.
  - **Request**: `{ "email": "arjun@atlaslogistics.com" }`
  - **Response**: `{ "allowed": true, "domain": "atlaslogistics.com" }`
- `POST /api/auth/otp/send`: Generates a secure 6-digit OTP and dispatches it via SMS/Email.
  - **Request**: `{ "email": "arjun@atlaslogistics.com", "mobile": "+919876543210" }`
  - **Response**: `{ "success": true, "resendCooldown": 60 }`
- `POST /api/auth/otp/verify`: Validates the OTP before activating the account.
  - **Request**: `{ "email": "arjun@atlaslogistics.com", "otp": "492815" }`
  - **Response**: `{ "verified": true, "sessionToken": "..." }`
- `POST /api/auth/register`: Creates the corporate user profile, assigns plan tier, stores KYC documents, and records terms acceptance timestamp + IP.

### 1.2 Auctions & Bid Engine
- `POST /api/auctions/create`:
  - Validates shipment criteria, container rows, Incoterms, and selected bidders.
  - Generates immutable ID (`RA-YYYY-######`).
  - Dispatches structured system notifications to invited bidders.
- `POST /api/auctions/bid`:
  - Validates user verification, plan status, and bid limit.
  - Deducts/creates fee record (₹300 for standard, ₹180 for verified Premium).
  - Atomically calculates bid rank against current lowest offer.
  - Appends immutable audit entry to `/auctions/{id}/audit`.

### 1.3 Rate Intelligence & Bulk CSV Import
- `POST /api/rates/create`: Creates a single i-Rate record with an `IRT-######` unique ID.
- `POST /api/rates/bulk-validate`:
  - Parses uploaded CSV/XLSX file buffer.
  - Validates ports (UN/LOCODE matches), validity dates, rate amounts.
  - Returns validation report with invalid line numbers and errors before final commit.
- `POST /api/rates/bulk-commit`: Atomically inserts validated rows into the `rates` collection.

### 1.4 Trade Chat
- `POST /api/chat/send`: Appends message to conversation, updates unread counts, and updates last message preview.

### 1.5 Advertisements
- `POST /api/ads/book`:
  - Validates dimensions (`237x299 px`), format (`PNG` / `GIF`), and file size (< 2MB).
  - Processes duration fee (₹1,000 for 2 days / ₹5,000 for 10 days).
  - Sets initial state to `pending_moderation`.

---

## 2. External Third-Party Integrations

### 2.1 Google Maps Places & Geolocation API
- **Places Autocomplete**: Attached to address input fields across Profile, Port selection, and Origin/Destination local charges.
- **Geocoding & Timezone Service**: Converts latitude/longitude into standard IANA Timezone identifier (e.g. `Asia/Kolkata`) for accurate local time calculation.
- **Client Script**: Loaded asynchronously with restricted API key.

### 2.2 Payment Gateway Integration
- Webhook endpoints handling Indian GST invoicing and USD international payments.
- Automatic custom claims updates upon plan upgrade (`trial` -> `professional` -> `premium`).
