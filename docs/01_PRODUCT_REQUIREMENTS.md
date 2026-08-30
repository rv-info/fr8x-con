# FR8X — Product Requirements Document (PRD)

## 1. Executive Summary & Vision
**FR8X** (`con.fr8x.in`) is an enterprise-grade, compact, screen-wide, global freight forwarding and digital logistics platform. It bridges shippers, freight forwarders, NVOCCs, carriers, and customs agents into a unified, high-efficiency digital workspace.

FR8X unifies:
1. **Live Feeds & Professional Network**: Real-time industry intelligence, peer updates, rich-text posts, multi-tier nested comments, jobs board, and targeted freight advertising.
2. **Nexus Intelligence Engine**: Freight community forums, verified 5-star bucket company ratings, and moderated risk/blacklist case reporting.
3. **Reverse Auctions & Live Bidding Engine**: Precision RFQ reverse auction creation, multi-container dynamic equipment staging, conditional origin/destination local charge configurations, invite-only vs open-to-all biddings, live bidding rooms with real-time rank computation, and immutable historical archives.
4. **Rate Intelligence & Management (i-Rates)**: Unified standard rate schema, market rate discovery, proprietary i-Rates inventory management, shareable quotes (WhatsApp/Email/Copy), and validated bulk CSV/Excel imports.
5. **Personal & Professional Profiles**: Verified freight identity, IANA timezone-based live local time indicator, Google Maps Places integrated primary address, experience/education/certifications cards, and fine-grained privacy controls.
6. **Trade Chat**: Fast, text-only, auditable real-time business communication linked to auctions, rates, jobs, and companies with participant-only Firestore security.
7. **Enterprise Authentication, KYC & Subscriptions**: Domain-verified professional email registration, legal business KYC verification, OTP verification, and multi-tier subscription plans (Trial, Professional, Premium with golden verification badge and 40% bidding discount).

---

## 2. Target Users & Personas
- **Freight Forwarders & NVOCCs**: Source market rates, publish company rate sheets (i-Rates), participate in reverse auctions, and discover lane inquiries.
- **Shippers & BCOs (Beneficial Cargo Owners)**: Create spot and contractual reverse auctions, select eligible verified bidders, compare freight and local charge components.
- **Carriers & Consolidators**: Publish direct and transshipment schedules and benchmark lane pricing.
- **Logistics Professionals**: Network, discover job opportunities, evaluate counterpart credibility via Nexus ratings and blacklist records.
- **Platform Administrators & Moderators**: Verify KYC compliance, moderate risk/blacklist submissions, approve advertisement campaigns, and maintain platform integrity.

---

## 3. Core Modules & Detailed Specifications

### 3.1 Authentication, KYC & Plan Management
- **Domain Verification**: Strict server-side blacklist of consumer/free email domains (`gmail.com`, `yahoo.com`, `outlook.com`, `hotmail.com`, `live.com`, `icloud.com`, `aol.com`, `proton.me`, etc.). Only corporate/business domains allowed.
- **Registration Cards**:
  1. *Account & Contact*: Name, designation, business email, mobile number, contact availability, IANA timezone, country/state/city.
  2. *Legal Business*: Legal company name, system-generated Company ID, registered address, country, GSTN, PAN, IEC code, MTO license, compliance documents.
  3. *Plan Selection*:
     - **Trial**: Free for 2 days (enforced strictly 1 trial per verified entity/company per calendar year).
     - **Professional**: ₹1,500/month (India incl. GST) / USD $27/month (Global incl. tax). Full standard platform access.
     - **Premium**: ₹3,000/month (India incl. GST) / USD $50/month (Global incl. tax). Verified Golden Badge (`✓`) + 40% discount on bidding fees (₹180 vs standard ₹300).
  4. *OTP Verification*: 6-digit server-generated OTP with countdown timer, resend rate-limiting, and brute-force protection.
  5. *Legal Terms Acceptance*: Explicit checkbox recording version, timestamp, user ID, and IP address.

### 3.2 Global Header & Currency Conversion
- **Location Badge**: Displays `Location: City, Country` synced with profile and browser/Google Maps geolocation.
- **Currency Converter**: Dynamic conversion utility supporting commercial currencies (USD, INR, EUR, GBP, AED, SGD, CNY, JPY) with real-time conversion rates.
- **Collapsible Sidebar**: Accessible compact navigation retaining tooltips and icons when collapsed.

### 3.3 Feeds & Social Freight Network
- **Feed Search**: Placed at upper-right of feed content area, searches posts, authors, topics, and company names with cursor pagination.
- **User Self-Profile Banner**: Displays logged-in user avatar, designation, company, timezone-calculated local time, and quick profile link.
- **Rich Text Syntax Parser**: Sanitized parser supporting `*bold*`, `_italic_`, `~strikethrough~`, `` `code` ``, ` ```block``` `, `> quotes`, and lists.
- **Author Controls**: Author-only edit/delete permissions. Non-owners can Save/Unsave, Copy Link, or Report.
- **Nested Comments**: Multi-level visual indented replies with 👍 like / 👎 dislike reactions and clickable profile hyperlinks.
- **Job Board**: Job posting with experience, compensation, requirements, and owner-managed closure/deletion.
- **Ad Booking**: 237×299px creative validation (PNG/GIF only), pricing tiers (₹1,000 for 2 days, ₹5,000 for 10 days), payment workflow, and moderation approval pipeline.

### 3.4 Nexus Intelligence
- **Community Forum**: Category-tagged discussion threads, geographical priority sorting, discussion reply threads.
- **Company Ratings**: Comprehensive 5-star bucket breakdown (5★, 4★, 3★, 2★, 1★ distribution), review submission by verified transacting parties.
- **Reported Cases & Blacklist**: Moderated risk registry with default reason, severity indicators, permitted public details, and private evidence references.

### 3.5 Reverse Auctions & Live Bid Room
- **Auction Creation Workflow**:
  - Step 1: Auction Details (Title, RFQ ID, Specific Bidder vs General Bidding, Start/End timing with auto-calculated duration, Timezone).
  - Step 2: Shipment & Cargo (POR, POL, POD, Final Destination with 3-character typeahead UN/LOCODE, Cargo Ready Date, Incoterms 2020, BL Type, Commodity, Gross Weight, CBM, Hazardous IMO/UN details).
  - Step 3: Dynamic Equipment Rows (20DV, 40DV, 40HC, Reefers, Open Top, Flat Rack, ISO Tanks with split pickups and empty return locations).
  - Step 4: Routing & Conditional Local Charges (Origin transport/clearance/stuffing, Destination destuffing/clearance/duty paid breakdown).
  - Step 5: Bidder Management (Assign verified bidders, blocklist bidders, enforce minimum 1 bidder for specific auctions).
  - Step 6: Preview & Publication with structured system notifications.
- **Live Bid Room**:
  - Comprehensive immutable auction specifications snapshot.
  - Multi-item charge breakdown: Ocean Freight, Surcharges, Origin Transport/Clearance/Local, Destination Transport/Clearance/Local.
  - Real-time client & server-side total and rank calculation against competition ceiling.
  - Transparent bid fee calculation (₹300 standard, ₹180 Premium).

### 3.6 Rate Intelligence (i-Rates)
- **Standard Unified Schema**: `Rate ID`, `Service Provider`, `Carrier`, `POR`, `POL`, `POD`, `FPOD`, `20DV USD`, `20 Type`, `40HC USD`, `40 Type`, `Free Time`, `Validity Date`, `Rate Type`, `Transit Time`, `Routing`, `Remarks`, `Actions`.
- **Ownership Partition**: Market Rates (`RT-######`, read-only for non-owners, share via WhatsApp/Email/Copy) vs i-Rates (`IRT-######`, fully editable by rate creator).
- **Bulk CSV/XLSX Engine**: Template download, schema validation, duplicate rate detection, review modal before Firestore batch commit.

### 3.7 Profiles & Local Time Intelligence
- **Profile Architecture**: Personal bio, designations, verified badges, company affiliation, contact settings.
- **Google Maps Places Address**: Places Autocomplete integration storing address, place ID, latitude, longitude, and IANA timezone.
- **Live Local Time Badge**: Dynamic red-outline badge calculated from user IANA timezone across all search/contact/profile views.
- **Professional Record Cards**: 3-card layout (Experience, Education, Certifications) with modal forms, verification URLs, and privacy settings.

### 3.8 Trade Chat
- **Text-Only Business Communication**: Designed for reliable commercial audit trails (no arbitrary file uploads per policy).
- **Multi-Conversation Management**: Fast switching, search, draft persistence, presence indicators (Online/Away), and unread badges.
- **Contextual Record Cards**: Link conversations directly to specific Auction IDs, Rates, Job Posts, or Companies.
