# Product Requirements Document (PRD) — Completion Release

This PRD specifies the functional requirements, validation, and layout structures implemented in the completed FR8X-CON platform.

---

## 1. Profile & Company Identity (Centralized Hub)

### User Profile Hub (`/profile`)
* **Centralized Hub Architecture**: The Profile section serves as the single centralized hub for all networking, company details, posts, enterprise contacts, contact requests, messaging, saved posts, followed tags, awards, and blacklist management.
* **Navigation Slimming**: Left navigation (`Sidebar.tsx`) trimmed down to core platform modules (`Feeds`, `Auctions`, `Rates`, `Profile`, and `Admin`), moving all secondary networking tabs into Profile.
* **Profile Tabs**:
  * **Profile Overview**: Picture upload, public handles (`@HANDLE`), designation, About/Bio, Work Experience list, and Education list.
  * **Company Profile**: Logo, corporate info, credentials, and member team.
  * **My Posts**: Complete feed history of user's published updates with soft deletion.
  * **Contacts & Blocked**: Approved contacts list and blacklisted members tabs (`[ Contacts ] [ Blocked ]`).
  * **Contact Requests**: Received pending requests and sent requests.
  * **Messages**: Real-time enterprise chat.
  * **Saved Posts**: Bookmarked posts.
  * **Followed Tags**: Followed industry tags.
  * **Awards & Certifications**: Verifications and awards.
  * **Blacklist**: Blacklisted members and unblock controls.

---

## 2. Enterprise Contact Management & Messaging System

* **Contact Management**: Search users & companies directory, Send Contact Request, Cancel Sent Request, Accept, Reject, Block, and Remove Contact.
* **Strict Communication Rules**: Only approved contacts are eligible for 1-to-1 instant messaging.
* **Contacts Panel**: Left-side Contacts Panel in Feeds and Profile displaying profile pictures, company names, user names, online/offline status (future-ready), last active timestamps, and Quick Chat launcher buttons.
* **Contact Search Inside Chat**: Top of chat panel contact search bar with live filtering by Name, Company Name, or Username. Selecting a contact opens existing conversation or automatically initializes a new conversation without leaving the current page.
* **Floating Chat Launcher**: Floating widget fixed in the bottom-right corner of every page allowing instant real-time messaging, file sharing, rate quote sharing, and auction card sharing from anywhere on the platform.

---

## 5. Feed Layout & Advertisement Management

* **Feed 3-Column Layout**:
  * **Left Panel**: User Summary Card + Approved Contacts Panel.
  * **Center Panel**: Feed Composer + Feed Timeline (Reverse Auction updates, Company posts, Logistics updates).
  * **Right Panel (Strict Order)**:
    1. **Logistics Jobs** (Fixed height container)
    2. **Trending Tags** (Positioned directly below Logistics Jobs, fixed position, no ads above)
    3. **Advertisement Block 1**
    4. **Advertisement Block 2**
* **GodMode Advertisement Management (`/godmode/ads`)**:
  * Campaign CRUD, activate/deactivate, preview, schedule, banner image uploads, HTML uploads, CTA button configuration, internal/external links, impression/click analytics (CTR %), and asset specification guidelines (Recommended size 300×250 / 1200×300, formats JPG/PNG/WEBP/SVG/HTML5, max file size 2MB, resolution 72 DPI minimum).

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

