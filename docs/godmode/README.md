# 🛡️ FR8X-CON GodMode Procedure & Permissions Hub

Welcome to the **GodMode Administrative Control & Permissions Documentation Hub**.

This directory contains complete procedures, error diagnostic guides, credential listings, and pre-approved dummy data catalogs for GodMode operation and user verification.

---

## 📁 Documentation Folder Structure

```
docs/godmode/
├── README.md                          # Index & Overview (This file)
├── PROCEDURE.md                       # Standard Operating Procedure (SOP) for GodMode Access
├── PERMISSIONS_TROUBLESHOOTING.md     # Technical Root Causes & Fixes for Permission Errors
└── DUMMY_DATA_AND_APPROVALS.md        # Pre-Approved Accounts, Companies, & Seeded Data
```

---

## 🚀 Quick Reference & Credentials

- **GodMode Admin Email**: `support@fr8x.in`
- **GodMode Password**: `QWERTY@123x`
- **Management Account**: `mgt@raivega.in` / `QWERTY@123x`
- **GodMode Control Panel**: [http://localhost:3000/godmode](http://localhost:3000/godmode)
- **GodMode Login Page**: [http://localhost:3000/godmode/login](http://localhost:3000/godmode/login)

---

## ⚡ Instant CLI Commands

- **Seed All Accounts & Pre-Approved Dummy Data**:
  ```bash
  node scripts/seed-dummy-data.js
  ```
- **Trigger GodMode API Elevation**:
  ```bash
  curl -X POST http://localhost:3000/api/admin/seed-godmode
  ```
- **Trigger Full Dummy Data API Seeding**:
  ```bash
  curl -X POST http://localhost:3000/api/admin/seed-dummy-data
  ```
