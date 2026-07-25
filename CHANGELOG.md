# Changelog

All notable changes to the FR8X-CON platform in this completion release are documented below.

---

## [1.1.0] - 2026-07-25

### Added
* **Image Cropping Component**: Introduced custom HTML5 Canvas-based cropping and resizing for profile photos and logos.
* **Unique Handles**: Users and companies now receive auto-generated handles (e.g. `@RAJAT001`, `@COMP-4819`) and support dynamic URL handle-based resolution.
* **Company Credentials Settings**: Added business verification tax fields (GSTN, PAN, CIN, IEC, established, type, region) to companies collection and forms.
* **Network Partners Relationships**: Implemented request, accept, reject, follow/unfollow, block/unblock, and matching metrics (Mutuals, Industry Match %).
* **Honors Registry Interactions**: Enhanced awards page with Up/Down voting, 4 reactions, subcollection comments (edit/delete/reply), and verification categories.
* **Sponsored Ad Blocks**: Embedded mock sponsored logistics ads inside feed lists and sidebar.
* **Hashtag Following**: Added follow/unfollow and filter feed triggers to trending tags.
* **Search Center**: Built universal search dashboard page with history log, autocomplete suggestions, and multi-field filters.
* **Curated Sub-pages**: Added `/saved-posts` feed, `/my-rfqs` table, and `/followed-tags` filtered lists.

### Changed
* **TopNav & Sidebar Layouts**: Added navigation links for Saved Posts, My RFQs, Followed Tags, and Company Page.
* **Mock User Profiles**: Auto-generate unique handles for mock users (`mock-uid-mgt`, `mock-uid-godmode`) on first login/view.

---

## [1.2.0] - 2026-07-25

### Added
* **Central Locations Directory**: Created standard ports and terminals database seeding over 20+ sea ports, airports, and inland ICD dry ports.
* **Location Autocomplete Search**: Implemented 3-character trigger location finder with parallel prefix matching, custom display, postal/PIN tags for receipt/delivery places, and caching.
* **Text Input Sanitizer**: Added `sanitizeText` utility blocking XSS HTML scripts, SQL injection tricks, path relative travel (`../`), and CSV formula triggers (`=+-@|`).
* **Signature Validations**: Magic bytes binary checks for JPEG, PNG, WEBP, PDF, and ZIP uploads to avoid execution of renamed shell scripts.
* **Antivirus Scanning**: Mock scanner blocking executable files and scanning files for the EICAR test string signature.
* **Daily Database Backups**: Automated background scheduler running every day at 12:00 AM IST. Employs compression, checks integrity, and logs audits.
* **GodMode Consoles**: Added `/godmode/locations` and `/godmode/backups` dashboards to inspect history, trigger downloads, execute rollbacks, and adjust daily/weekly/monthly retention policies.

