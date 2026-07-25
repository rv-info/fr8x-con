# Product Requirements Document (PRD) — Completion Release

This PRD specifies the functional requirements, validation, and layout structures implemented in the completed FR8X-CON platform.

---

## 1. Profile & Company Identity

### User Profile
* **Picture Upload**: Interactive photo uploader with canvas crop/resize, file type check (`.jpg`, `.png`, `.webp`), and size limit validation (max 2MB).
* **Identity Handles**: Permanent unique handles (e.g., `@RAJAT001`) automatically generated upon profile save.

### Company Profile
* **Logo Management**: Logo upload, crop/resize, replace, and delete.
* **Credentials Forms**: Business fields: GSTN Number (validated, 15-digit), PAN (10-digit), CIN (21-digit), IEC, business registration number, company type selection, year established.
* **Public Visibility**: Displays in about sections, search results, and public company pages.

---

## 2. Professional Network Partners (Networking)

* **Relationship Model**: Replace traditional friendship with "Network Partners".
* **Connection Handlers**:
  * Send request, cancel request, accept, reject, block, unblock.
  * Follow / Unfollow toggle.
* **Proximity Metrics**:
  * Industry Match %: overlap of selected specialization tags.
  * Mutual connections count.
  * Shared company indicator.

---

## 3. Awards & Nominated Honors

* **Reactions**: Like, Celebrate, Recommend, Support.
* **Up/Down Voting**: Vote once, change vote, or remove vote. Displays recommendation score.
* **Comments**: Create, reply, edit, and delete comments on awards.
* **Tiers of Verification**:
  * Company Verification (by employees of the same company).
  * Community Verification (after receiving 3+ partner verifies).
  * Admin Verification (signed by GodMode administrators).

---

## 4. Universal Search System

* **Omni-Search Bar**: Auto-complete and suggestions drop-down on typing.
* **Dashboard Tab Selection**: All | Professionals | Companies | RFQs | Tags.
* **Sidebar Filters**: Country, City, Company Name, Industry Tag, Verification Status.
* **History**: Stores last 5 searches in local storage history.

---

## 5. Feed Advertising & Tag Follows

* **Ad Blocks**: Inject sponsored ads between feed posts and under trending tags.
* **Trending Tag Follows**: Follow/unfollow hashtags, appending hashtags to composer on click, showing related company contacts.

---

## 6. Global Location Master

* Centralized master list containing sea ports, airports, dry ports, and ICD terminals.
* Display standard format: `Code` (Line 1), `Name, Country` + postal/PIN code if POR/FPOD (Line 2).
* Autocomplete search starting after 3 characters, listing the top 5 sorted results with parallel code/name scans and caching.
* GodMode administrative controls to add, edit, toggle active/disabled states, seed, and bulk import/export locations.

## 7. Platform Security & Sanitization

* **Text Inputs**: Sanitized using `sanitizeText` to block HTML/XSS scripts, SQL injections, relative path traversal (`../`), and CSV/Excel formula injections (obfuscating `=+-@|`).
* **Image Uploads**: MIME signatures checked by magic bytes (PNG, JPEG, WEBP). Strips EXIF metadata using canvas-driven redrawing.
* **Malware Scanner**: Mock antivirus scans EICAR strings and blocks executable extensions (.exe, .sh, .bat).

## 8. Snapshot Database Backups

* Runs daily in the background at 12:00 AM IST.
* Encodes and compresses Firestore data, verifying integrity.
* Implements retention configs: Daily, Weekly, Monthly limits.
* Restore console restricted to GodMode, logging action details and reason to audit.

