# FR8X — PRODUCT FEATURE ENCYCLOPEDIA & PRACTICAL OPERATIONAL MANUAL
## Complete Technical Specification, Operational Procedures, Freight Examples & User Manual

> **DOCUMENT ID**: FR8X-OPMAN-2026-V1  
> **APPLICABILITY**: All Registered Logistics Members, Freight Forwarders, Carriers, Recruiters, and System Administrators  
> **INTENDED AUDIENCE**: Operations Executives, Commercial Pricing Managers, Logistics Directors, and Recruiters  

---

# VOLUME 1: GLOBAL PLATFORM WORKSPACE & HEADER CONTROLS

## MODULE 1.1: AVAILABILITY STATUS & TELEMETRY CONTROLS
- **Location in Interface**: Top navigation bar, far-right header cluster (next to location and currency).
- **Component Identifier**: `NetworkStatusPill.tsx` (Trigger) & Popover Window.
- **Intended User**: Commercial pricing managers, booking coordinators, freight operations agents.
- **Business Purpose**: In international freight forwarding, spot inquiries are time-critical. Shippers and overseas agents need to know immediately whether a forwarder's pricing desk is active and responsive to direct RFQs or away from their desk.

### Step-by-Step Operating Instructions:
1. Click the status trigger in the global header displaying your current state (e.g., `• Online ⚡ 4G / High-Speed`).
2. The availability popover opens directly below the trigger with a clean vertical alignment and 6–8px gap.
3. Select your desired operational availability status:
   - **Online (`#075B5B` Teal Indicator)**: Marks your account as active, responsive, and ready to accept instant freight quotation requests.
   - **Away (`#D97706` Amber Indicator)**: Informs network contacts that you have stepped away and will respond within 2–4 hours.
   - **Offline (`#64748B` Slate Indicator)**: Hides your live presence on public directory listings while allowing you to browse rates and auctions privately.
4. The popover automatically updates your presence in local storage and broadcasts to sibling browser tabs without page refresh.

### Freight Forwarding Operational Example:
*Scenario*: An export manager at Cogoport Private Limited in Gurugram is handling a 40HC container RFQ for hazardous chemicals from Nhava Sheva (INNSA) to Rotterdam (NLRTM). By switching status to **Online**, their profile is prioritized in the Enterprise Logistics Directory when European forwarders search for verified Indian DG cargo specialists.

---

## MODULE 1.2: ACTIVE LOGISTICS TRADING HUB SELECTOR
- **Location in Interface**: Global TopBar, central location pill (`Gurugram [Sikanderpur], India ⌄`).
- **Component Identifier**: Location Selector Popover (`TopBar.tsx`).
- **Business Purpose**: Freight operations depend heavily on regional port hubs and inland container depots (ICDs). Forwarders operate from specific hubs where they hold bonded warehouse space, port transport contracts, or customs house agency licenses.

### Step-by-Step Operating Instructions:
1. Click the location dropdown in the global header.
2. Select your active regional hub:
   - **Gurugram / Delhi NCR (Sikanderpur)**: Inland Container Depots (TKD, Dadri, Garhi Harsaru).
   - **Mumbai / Nhava Sheva (INNSA)**: Primary ocean gateway for Western India.
   - **Chennai / Ennore (INMAA)**: Primary ocean gateway for Southern manufacturing corridors.
   - **Singapore (SGSIN)**: Southeast Asian transshipment & regional pricing desk.
   - **Dubai / Jebel Ali (AEJEA)**: Middle East distribution and feeder network.
3. The platform instantly recalibrates the default origin recommendations in Rate Intelligence and Reverse Auctions.

---

## MODULE 1.3: MULTI-CURRENCY CONVERTER & WORKSPACE CURRENCY
- **Location in Interface**: Global TopBar, currency pill (e.g., `💱 CR · INR ⌄`).
- **Component Identifier**: Currency Popover (`TopBar.tsx`, lines 1770–1950) & `CurrencyContext.tsx`.
- **Business Purpose**: Freight forwarding is inherently multi-currency. Ocean freight is denominated in USD, origin local terminal handling charges (OTHC) are billed in INR, destination handling (DTHC) is billed in EUR or AED, and bunker fuel surcharges (BAF) fluctuate continuously. Forwarders require instant, transparent conversion without opening external websites.

### Step-by-Step Operating Instructions:
1. Click the currency trigger in the header to open the curated popover.
2. **Set Workspace Currency**: Select from the top 5 curated shortcuts (`INR`, `USD`, `EUR`, `GBP`, `AED`). All rate cards, job listings, and reverse auction tenders across the platform will immediately display in your chosen currency.
3. **Interactive Spot Calculator**:
   - Enter the transaction amount in the `Amount` field (or use quick chips: `100`, `500`, `1k`, `2.5k`, `5k`, `10k`).
   - Select the source currency in the `From` dropdown (supports 120+ ISO 4217 currencies).
   - Select the target currency in the `To` dropdown.
   - Click `⇄ Swap` to invert the conversion pair instantly.
   - Read the exact direct rate (e.g., `1 USD = 86.5000 INR`) and reciprocal rate (`1 INR = 0.0116 USD`).
4. Click `Sync` to refresh live interbank foreign exchange rates from the European Central Bank and interbank feeds.

---

# VOLUME 2: B2B FREIGHT INTELLIGENCE FEED (`/feeds`)

## MODULE 2.1: TRADE INTELLIGENCE COMPOSER & POSTING
- **Location in Interface**: `/feeds`, top central card.
- **Component Identifier**: `RichTextEditor.tsx`, `app/feeds/page.tsx`.
- **Intended User**: Commercial managers, logistics heads, route pricing analysts.
- **Business Purpose**: Enables logistics companies to publish operational advisories, port congestion notices, blank sailing announcements, and freight capacity availability directly to thousands of verified forwarders.

### Operational Workflow & Step-by-Step Guide:
1. Navigate to `/feeds`.
2. Select the post classification from the top-right dropdown:
   - `General Post`: Company updates, agency partnerships, new service routes.
   - `Blank Sailing Alert`: Notice of canceled vessel voyages by carrier alliances (2M, Ocean Alliance, THE Alliance).
   - `Port Congestion Notice`: Updates regarding berthing delays, gate-in restrictions, or strike notices.
   - `Rate Trend`: Market intelligence regarding GRI (General Rate Increase) or PSS (Peak Season Surcharge).
   - `Equipment Availability`: Surplus or shortage of specific container equipment (`20GP`, `40HC`, `Reefer`, `Open Top`).
3. Enter post body text in the rich-text editor using formatting controls (Bold `B`, Italic `I`, Underline `U`, Strikethrough `S`, Headings `H1-H3`, Bullet Lists, Numbered Lists, Blockquotes, Hyperlinks).
4. **Structured Rate Table Insertion**:
   - Click the `Table` button on the formatting toolbar.
   - The *Insert Structured Rate / Commodity Table* modal appears.
   - Configure columns (2 to 5) and data rows (1 to 10).
   - Enter column header titles (e.g., `Port / Terminal`, `Carrier / Line`, `Rate / Transit`, `Validity`).
   - Click `Insert Table into Post`.
   - The table renders directly inside the editor canvas where every cell is individually editable.
5. Click `Post Update` to distribute immediately across the global logistics feed.

---

# VOLUME 3: RATE INTELLIGENCE & SPOT BENCHMARKS (`/rates`)

## MODULE 3.1: SPOT BENCHMARK LOOKUP
- **Location in Interface**: `/rates`.
- **Business Purpose**: Eliminates the delay of manual email requests by providing a searchable matrix of ocean and air freight spot tariffs across major commercial trade lanes.

### Operational Workflow:
1. Enter Origin Port (e.g., `INNSA` - Nhava Sheva, India).
2. Enter Destination Port (e.g., `AEJEA` - Jebel Ali, UAE).
3. Select Container Equipment Type (`20GP`, `40GP`, `40HC`, `20RF`, `40RF`).
4. Review benchmark rates, transit durations (e.g., 4 Days Direct), shipping line allocation (e.g., *Maersk Line*, *MSC*, *Hapag-Lloyd*, *CMA CGM*), and tariff expiration dates.

## MODULE 3.2: UNIFIED RATES EDITOR MODAL
- **Trigger**: Click `+ Add New Rate`, double-click any rate row, or click `▶ Show Rates Editor`.
- **Operational Guide**:
  - In the Rates Editor Modal, enter POL, POD, Container Type, Base Ocean Freight (BAS), Origin Terminal Handling (OTHC), Destination THC (DTHC), Documentation Fee, and validity date.
  - Click `Save Rate Tariff` to record in Supabase database immediately.

---

# VOLUME 4: REVERSE CONTAINER TENDER AUCTIONS (`/auctions`)

## MODULE 4.1: CONTAINER TENDER CREATION WIZARD (`/auctions/create`)
- **Business Purpose**: Allows cargo owners and volume forwarders to tender high-volume container shipments (10 to 500 TEUs) in a competitive, transparent digital auction room.

### Step-by-Step Configuration:
1. Navigate to `/auctions/create`.
2. **Lane Parameters**: Define Origin Port, Discharge Port, and optional Transshipment Port.
3. **Equipment & Volume**: Select container type (`40HC`), number of units (e.g., `25 Containers`), and total gross weight (Metric Tons).
4. **Target Ceiling Rate**: Specify maximum acceptable rate per container (e.g., `$1,850 USD / 40HC`). Bids exceeding this ceiling are rejected automatically.
5. **Mandatory Free Days**: Enter required combined demurrage and detention free days at destination (e.g., `14 Days Free Time`).
6. **Cargo Readiness Date**: Enter date cargo will be packed and cleared for gate-in.
7. Click `Publish Reverse Auction Tender`.

## MODULE 4.2: LIVE SPOT BIDDING ROOM (`/auctions/[id]`)
- **Operational Workflow**:
  - Registered forwarders enter the live auction room before the timer reaches `00:00:00`.
  - Qualified bidders submit bids with minimum automated decrements (e.g., `$25 USD` reduction per bid).
  - The real-time leaderboard displays the lowest qualifying bid without exposing bidder identities to maintain anti-collusion integrity.
  - Upon auction close, the lowest qualifying bidder is awarded the tender and enters an enforceable **48-hour container slot lock**.

---

# VOLUME 5: TRADE CAREERS & RECRUITMENT SUITE (`/jobs`)

## MODULE 5.1: RECRUITMENT BOARD & APPLICATION WORKFLOW
- **Location in Interface**: `/jobs`.
- **Business Purpose**: Provides specialized talent acquisition for freight forwarding roles at a fraction of mainstream recruitment fees.

### Candidate Application Process:
1. Job seeker browses filtered cards displaying verified company logos, designations, salary brackets, and skill tags (`FCL`, `Carrier Negotiations`, `INCOTERMS`, `Customs EDI`).
2. Click `SHOW JOB` on any listing to inspect the full job description popup.
3. Click `APPLY NOW`. The candidate modal verifies identity, checks for duplicate applications, and submits the candidate's Freight Passport profile to the recruiter.

## MODULE 5.2: EMPLOYER JOB POSTING & TARIFFS
- **Trigger**: Click `+ Post a Job` in `/jobs` or Quick Shortcuts.
- **Tariff Durations**:
  - `2 Days (Min)`: ₹300 ($3.47 USD).
  - `7 Days`: ₹1,200 ($13.87 USD).
  - `15 Days`: ₹2,640 ($30.52 USD).
  - `30 Days`: ₹5,340 ($61.73 USD).
  - Auto-renew listing option at ₹180/day thereafter until manually revoked.
- **Candidate Pipeline Manager**:
  - Employers can open the application manager per job and transition candidates across hiring stages: *Under Review* $\rightarrow$ *Shortlisted* $\rightarrow$ *Interview Scheduled* $\rightarrow$ *Rejected* $\rightarrow$ *Hired*.
