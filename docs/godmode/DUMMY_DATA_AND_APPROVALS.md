# Pre-Approved Dummy Data & GodMode Test Suite Catalog

## 📦 Overview
To ensure seamless local testing without permission blocks or missing record errors, the FR8X-CON application comes pre-packaged with a complete set of pre-approved dummy entities across all major database schemas.

---

## 👤 Pre-Provisioned Accounts

### 1. GodMode Administrator
- **Email**: `support@fr8x.in`
- **Password**: `QWERTY@123x`
- **Role**: `admin` (`isGodMode: true`)
- **KYC Status**: `verified` (Approved by `SYSTEM_GODMODE`)
- **Tier**: `premium`
- **Privileges**: System-wide administrative override, user management, billing, moderation, audit log inspection.

### 2. Rai Vega Freight Forwarder
- **Email**: `mgt@raivega.in`
- **Password**: `QWERTY@123x`
- **Role**: `freight_forwarder`
- **Company**: Rai Vega Logistics Pvt Ltd (`comp_raivega_001`)
- **KYC Status**: `verified` (Tier-3 Enterprise Gold Verified)
- **GSTIN**: `27AAACR9821K1ZM` | **PAN**: `AAACR9821K` | **IEC**: `0304018291`

### 3. ACME Global Exports Shipper
- **Email**: `shipper@acme.com`
- **Password**: `QWERTY@123x`
- **Role**: `shipper`
- **Company**: ACME Global Exports Ltd (`comp_acme_002`)
- **KYC Status**: `verified` (Tier-3 Enterprise Gold Verified)

### 4. FastTrack Express Transporter
- **Email**: `transporter@express.com`
- **Password**: `QWERTY@123x`
- **Role**: `transporter`
- **Company**: FastTrack Fleet Systems (`comp_fasttrack_003`)
- **KYC Status**: `verified` (Tier-2 Verified Cargo Partner)

---

## 🏢 Pre-Approved Companies & Verification Status

| Company ID | Company Name | Verification Level | KYC Status | Approval Status |
| :--- | :--- | :--- | :--- | :--- |
| `comp_godmode_000` | FR8X System Operations | GodMode System Core | `verified` | ✅ Pre-Approved |
| `comp_raivega_001` | Rai Vega Logistics Pvt Ltd | Tier-3 Enterprise Gold | `verified` | ✅ Pre-Approved |
| `comp_acme_002` | ACME Global Exports Ltd | Tier-3 Enterprise Gold | `verified` | ✅ Pre-Approved |
| `comp_fasttrack_003` | FastTrack Fleet Systems | Tier-2 Cargo Partner | `verified` | ✅ Pre-Approved |

---

## 🚢 Seeded Auctions, Bids & Freight Rates

- **Auction `auc_demo_101`**: Spot Freight 20x40FT Containers - JNPT to Hamburg (`$2,320` current bid, 14 bids) — Status: `approved` & `active`.
- **Auction `auc_demo_102`**: Reefer Cargo Cold Chain - Mundra to Jebel Ali (`$1,720` winning bid) — Status: `approved` & `awarded`.
- **Ports & Locations**: JNPT (Nhava Sheva - INNSA), Mundra (INMUN), Hazira (INHZA), Chennai (INMAA), Vizag (INVTZ). All pre-verified.

---

## 🔁 How to Re-Seed or Reset Dummy Data

At any time, run:
```bash
node scripts/seed-dummy-data.js
```
Or execute an HTTP POST request to:
```
POST /api/admin/seed-dummy-data
```
This guarantees that all collections are populated with pre-approved records and GodMode privileges are fully intact.
