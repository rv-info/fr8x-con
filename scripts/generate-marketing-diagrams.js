const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const outputDir = path.join(__dirname, '..', 'marketing', '02_VISUAL_ASSETS');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Helper to render SVG to PNG
async function renderSvgToPng(svgString, fileName, width = 1200, height = 675) {
  const filePath = path.join(outputDir, fileName);
  await sharp(Buffer.from(svgString))
    .resize(width, height)
    .png({ quality: 95 })
    .toFile(filePath);
  console.log(`✓ Generated: ${fileName}`);
}

async function main() {
  console.log('Generating master publication diagrams for FR8X Marketing Compendium...\n');

  // 1. FREIGHT INDUSTRY ECOSYSTEM DIAGRAM
  const svgEcosystem = `
  <svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="675" fill="#0B132B"/>
    <rect x="30" y="30" width="1140" height="615" rx="16" fill="#1C2541" stroke="#3A506B" stroke-width="2"/>
    
    <text x="600" y="75" fill="#E0FBFC" font-size="26" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      GLOBAL FREIGHT FORWARDING ECOSYSTEM &amp; COMMERCIAL INFORMATION FLOWS
    </text>
    <text x="600" y="105" fill="#98C1D9" font-size="14" font-family="Arial, sans-serif" text-anchor="middle">
      How B2B Logistics Relationships, Spot Rates, and Container Capacity Move in International Trade
    </text>

    <!-- Cargo Owners / B2B Shippers -->
    <rect x="70" y="150" width="220" height="180" rx="12" fill="#293241" stroke="#EE6C4D" stroke-width="2"/>
    <text x="180" y="185" fill="#EE6C4D" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">B2B CARGO OWNERS</text>
    <text x="180" y="210" fill="#E0FBFC" font-size="12" font-family="Arial, sans-serif" text-anchor="middle">Exporters &amp; Importers</text>
    <text x="180" y="235" fill="#98C1D9" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Need spot container rates</text>
    <text x="180" y="255" fill="#98C1D9" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Demurrage free time priority</text>
    <text x="180" y="275" fill="#98C1D9" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Custom regulatory filings</text>
    <text x="180" y="295" fill="#98C1D9" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Timely cargo dispatch</text>

    <!-- Arrow from Shippers to Forwarders -->
    <path d="M 290 240 L 480 240" stroke="#EE6C4D" stroke-width="3" marker-end="url(#arrow)" fill="none"/>
    <text x="385" y="230" fill="#EE6C4D" font-size="11" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">RFQs &amp; Spot Bookings</text>

    <!-- Freight Forwarders (FR8X Core Target) -->
    <rect x="490" y="130" width="280" height="220" rx="14" fill="#075B5B" stroke="#00F0FF" stroke-width="3"/>
    <text x="630" y="165" fill="#FFFFFF" font-size="18" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">FREIGHT FORWARDERS</text>
    <text x="630" y="190" fill="#E0FBFC" font-size="13" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">(Independent, Mid-Market &amp; 3PLs)</text>
    <line x1="510" y1="205" x2="750" y2="205" stroke="#00F0FF" stroke-width="1"/>
    <text x="630" y="225" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" text-anchor="middle">★ FR8X Platform Integration Point ★</text>
    <text x="630" y="250" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Reverse Container Auctions</text>
    <text x="630" y="270" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Ocean &amp; Air Spot Rate Intelligence</text>
    <text x="630" y="290" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Verified Global Agent Network</text>
    <text x="630" y="310" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Specialized Talent Recruitment</text>

    <!-- Arrow from Forwarders to Carriers -->
    <path d="M 770 240 L 930 240" stroke="#00F0FF" stroke-width="3" fill="none"/>
    <text x="850" y="230" fill="#00F0FF" font-size="11" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">Slot Allocation</text>

    <!-- Shipping Lines & Airlines -->
    <rect x="940" y="150" width="200" height="180" rx="12" fill="#293241" stroke="#3A506B" stroke-width="2"/>
    <text x="1040" y="185" fill="#00F0FF" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">MAINLINE CARRIERS</text>
    <text x="1040" y="210" fill="#E0FBFC" font-size="12" font-family="Arial, sans-serif" text-anchor="middle">Ocean Lines &amp; Air Freight</text>
    <text x="1040" y="235" fill="#98C1D9" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Container inventory (TEUs)</text>
    <text x="1040" y="255" fill="#98C1D9" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Vessel schedule integrity</text>
    <text x="1040" y="275" fill="#98C1D9" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Blank sailings management</text>
    <text x="1040" y="295" fill="#98C1D9" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Terminal cut-off deadlines</text>

    <!-- Bottom Layer: NVOCCs, Overseas Agents, CHAs -->
    <rect x="150" y="420" width="280" height="170" rx="10" fill="#1C2541" stroke="#5BC0BE" stroke-width="1.5"/>
    <text x="290" y="450" fill="#5BC0BE" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">OVERSEAS AGENTS &amp; NVOCCs</text>
    <text x="290" y="475" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Delivery Orders &amp; Destination DTHC</text>
    <text x="290" y="495" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Import customs bond handling</text>
    <text x="290" y="515" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Counterparty credit verification</text>
    <text x="290" y="535" fill="#5BC0BE" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">→ Solved by FR8X Freight Passport™</text>

    <rect x="470" y="420" width="260" height="170" rx="10" fill="#1C2541" stroke="#F4A261" stroke-width="1.5"/>
    <text x="600" y="450" fill="#F4A261" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">CUSTOMS BROKERS (CHAs)</text>
    <text x="600" y="475" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Bill of Entry / Shipping Bill</text>
    <text x="600" y="495" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Duty calculation &amp; assessment</text>
    <text x="600" y="515" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Phytosanitary &amp; Port Health</text>
    <text x="600" y="535" fill="#F4A261" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">→ Solved by FR8X Nexus Compliance</text>

    <rect x="760" y="420" width="280" height="170" rx="10" fill="#1C2541" stroke="#E76F51" stroke-width="1.5"/>
    <text x="900" y="450" fill="#E76F51" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">LOGISTICS WORKFORCE</text>
    <text x="900" y="475" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Experienced documentation clerks</text>
    <text x="900" y="495" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• Commercial freight pricing executives</text>
    <text x="900" y="515" fill="#E0FBFC" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">• B2B logistics sales representatives</text>
    <text x="900" y="535" fill="#E76F51" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">→ Solved by FR8X Trade Careers</text>

    <!-- Connectors -->
    <path d="M 630 350 L 630 420" stroke="#00F0FF" stroke-width="2" stroke-dasharray="4" fill="none"/>
    <path d="M 520 350 L 290 420" stroke="#5BC0BE" stroke-width="2" stroke-dasharray="4" fill="none"/>
    <path d="M 740 350 L 900 420" stroke="#E76F51" stroke-width="2" stroke-dasharray="4" fill="none"/>
  </svg>
  `;
  await renderSvgToPng(svgEcosystem, 'diagram-freight-ecosystem.png');

  // 2. FR8X ARCHITECTURE MAP
  const svgArch = `
  <svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="675" fill="#0A1128"/>
    <rect x="25" y="25" width="1150" height="625" rx="14" fill="#001F54" stroke="#034078" stroke-width="2"/>
    
    <text x="600" y="70" fill="#FEFCFB" font-size="24" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      FR8X MODULAR APPLICATION &amp; BILLING ENGINE ARCHITECTURE
    </text>
    <text x="600" y="98" fill="#1282A2" font-size="13" font-family="Arial, sans-serif" text-anchor="middle">
      Verified Component Map Connecting User Surfaces to Central Sovereign Billing &amp; Data Models
    </text>

    <!-- Column 1: Core Operational Modules -->
    <rect x="60" y="140" width="320" height="470" rx="12" fill="#0A1128" stroke="#1282A2" stroke-width="2"/>
    <text x="220" y="175" fill="#00F0FF" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">OPERATIONAL SURFACES</text>
    
    <rect x="80" y="200" width="280" height="55" rx="6" fill="#1C2541"/>
    <text x="95" y="225" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">B2B Trade Feed (/feeds)</text>
    <text x="95" y="242" fill="#98C1D9" font-size="10" font-family="Arial, sans-serif">Rich text + Structured Rate Table Editor</text>

    <rect x="80" y="270" width="280" height="55" rx="6" fill="#1C2541"/>
    <text x="95" y="295" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">Rate Intelligence (/rates)</text>
    <text x="95" y="312" fill="#98C1D9" font-size="10" font-family="Arial, sans-serif">Multimodal spot benchmark &amp; lane editor</text>

    <rect x="80" y="340" width="280" height="55" rx="6" fill="#1C2541"/>
    <text x="95" y="365" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">Reverse Auctions (/auctions)</text>
    <text x="95" y="382" fill="#98C1D9" font-size="10" font-family="Arial, sans-serif">Live container bidding room + timer</text>

    <rect x="80" y="410" width="280" height="55" rx="6" fill="#1C2541"/>
    <text x="95" y="435" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">Trade Careers (/jobs)</text>
    <text x="95" y="452" fill="#98C1D9" font-size="10" font-family="Arial, sans-serif">Verified recruitment board &amp; pipeline manager</text>

    <rect x="80" y="480" width="280" height="55" rx="6" fill="#1C2541"/>
    <text x="95" y="505" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">Logistics CRM &amp; KYC (/network)</text>
    <text x="95" y="522" fill="#98C1D9" font-size="10" font-family="Arial, sans-serif">Freight Passport™ &amp; Statutory credentials</text>

    <!-- Column 2: Central Engines -->
    <rect x="440" y="140" width="320" height="470" rx="12" fill="#0A1128" stroke="#075B5B" stroke-width="2"/>
    <text x="600" y="175" fill="#52B788" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">CENTRAL ENGINES &amp; BILLING</text>

    <rect x="460" y="200" width="280" height="75" rx="6" fill="#075B5B"/>
    <text x="475" y="225" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">Multi-Currency Billing Engine</text>
    <text x="475" y="243" fill="#D8F3DC" font-size="10" font-family="Arial, sans-serif">• 15-Minute HMAC-SHA256 locked quotes</text>
    <text x="475" y="259" fill="#D8F3DC" font-size="10" font-family="Arial, sans-serif">• ISO 4217 minor unit zero-drift precision</text>

    <rect x="460" y="290" width="280" height="75" rx="6" fill="#075B5B"/>
    <text x="475" y="315" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">Godfather Sovereign Free Access</text>
    <text x="475" y="333" fill="#D8F3DC" font-size="10" font-family="Arial, sans-serif">• Master Global Billing Switch (PAID/FREE)</text>
    <text x="475" y="349" fill="#D8F3DC" font-size="10" font-family="Arial, sans-serif">• Super Admin perk &amp; user overrides</text>

    <rect x="460" y="380" width="280" height="75" rx="6" fill="#075B5B"/>
    <text x="475" y="405" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">Unified Checkout API (/api/billing)</text>
    <text x="475" y="423" fill="#D8F3DC" font-size="10" font-family="Arial, sans-serif">• Free Entitlement: 0ms direct activation</text>
    <text x="475" y="439" fill="#D8F3DC" font-size="10" font-family="Arial, sans-serif">• Paid Tariff: Razorpay multi-currency rail</text>

    <rect x="460" y="470" width="280" height="65" rx="6" fill="#075B5B"/>
    <text x="475" y="495" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">Presence &amp; Bandwidth Adapter</text>
    <text x="475" y="513" fill="#D8F3DC" font-size="10" font-family="Arial, sans-serif">• 4G vs 2G adaptive telemetry throttling</text>

    <!-- Column 3: Persistence & Data Layer -->
    <rect x="820" y="140" width="320" height="470" rx="12" fill="#0A1128" stroke="#3A506B" stroke-width="2"/>
    <text x="980" y="175" fill="#FEFCFB" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">SUPABASE POSTGRESQL</text>

    <rect x="840" y="200" width="280" height="55" rx="6" fill="#1C2541"/>
    <text x="855" y="225" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">public.rates</text>
    <text x="855" y="242" fill="#98C1D9" font-size="10" font-family="Arial, sans-serif">Spot ocean/air lanes &amp; port pairs</text>

    <rect x="840" y="270" width="280" height="55" rx="6" fill="#1C2541"/>
    <text x="855" y="295" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">public.auctions &amp; public.bids</text>
    <text x="855" y="312" fill="#98C1D9" font-size="10" font-family="Arial, sans-serif">Container tender requisitions &amp; bids</text>

    <rect x="840" y="340" width="280" height="55" rx="6" fill="#1C2541"/>
    <text x="855" y="365" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">public.jobs &amp; job_applications</text>
    <text x="855" y="382" fill="#98C1D9" font-size="10" font-family="Arial, sans-serif">Recruitment requisitions &amp; candidate CRM</text>

    <rect x="840" y="410" width="280" height="55" rx="6" fill="#1C2541"/>
    <text x="855" y="435" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">public.transactions</text>
    <text x="855" y="452" fill="#98C1D9" font-size="10" font-family="Arial, sans-serif">Orders, currency quotes &amp; fee waivers</text>

    <rect x="840" y="480" width="280" height="55" rx="6" fill="#1C2541"/>
    <text x="855" y="505" fill="#FFFFFF" font-size="12" font-family="Arial, sans-serif" font-weight="bold">public.profiles &amp; public.nexus</text>
    <text x="855" y="522" fill="#98C1D9" font-size="10" font-family="Arial, sans-serif">Freight Passports &amp; credit dispute records</text>

    <!-- Connectors -->
    <line x1="380" y1="230" x2="440" y2="230" stroke="#00F0FF" stroke-width="2"/>
    <line x1="380" y1="365" x2="440" y2="365" stroke="#00F0FF" stroke-width="2"/>
    <line x1="380" y1="440" x2="440" y2="440" stroke="#00F0FF" stroke-width="2"/>
    <line x1="760" y1="230" x2="820" y2="230" stroke="#52B788" stroke-width="2"/>
    <line x1="760" y1="365" x2="820" y2="365" stroke="#52B788" stroke-width="2"/>
    <line x1="760" y1="440" x2="820" y2="440" stroke="#52B788" stroke-width="2"/>
  </svg>
  `;
  await renderSvgToPng(svgArch, 'diagram-fr8x-system-architecture.png');

  // 3. REVERSE AUCTION TENDER LIFECYCLE
  const svgAuction = `
  <svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="675" fill="#0D1B2A"/>
    <rect x="25" y="25" width="1150" height="625" rx="14" fill="#1B263B" stroke="#415A77" stroke-width="2"/>
    
    <text x="600" y="75" fill="#E0E1DD" font-size="24" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      FR8X REVERSE CONTAINER TENDER AUCTION LIFECYCLE
    </text>
    <text x="600" y="105" fill="#778DA9" font-size="13" font-family="Arial, sans-serif" text-anchor="middle">
      From Spot Requisition Publication to Real-Time Decrement Bidding and Legally Binding Award
    </text>

    <!-- Step 1 -->
    <rect x="60" y="160" width="230" height="380" rx="10" fill="#0D1B2A" stroke="#00F0FF" stroke-width="2"/>
    <circle cx="175" cy="205" r="24" fill="#00F0FF"/>
    <text x="175" y="213" fill="#0D1B2A" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">1</text>
    <text x="175" y="255" fill="#FFFFFF" font-size="15" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">TENDER CREATION</text>
    <text x="175" y="280" fill="#778DA9" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">Forwarder / Shipper</text>
    <line x1="80" y1="295" x2="270" y2="295" stroke="#415A77" stroke-width="1"/>
    <text x="85" y="325" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Origin &amp; Destination Ports</text>
    <text x="85" y="350" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Equipment: 20GP / 40HC</text>
    <text x="85" y="375" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Target Ceiling Price ($ USD)</text>
    <text x="85" y="400" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Free Days (Detention / Dem)</text>
    <text x="85" y="425" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Cargo Readiness Cut-off</text>
    <rect x="75" y="470" width="200" height="40" rx="6" fill="#075B5B"/>
    <text x="175" y="495" fill="#FFFFFF" font-size="11" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">Published to Global Feed</text>

    <!-- Arrow 1 to 2 -->
    <path d="M 290 350 L 340 350" stroke="#00F0FF" stroke-width="3" fill="none"/>

    <!-- Step 2 -->
    <rect x="340" y="160" width="230" height="380" rx="10" fill="#0D1B2A" stroke="#52B788" stroke-width="2"/>
    <circle cx="455" cy="205" r="24" fill="#52B788"/>
    <text x="455" y="213" fill="#0D1B2A" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">2</text>
    <text x="455" y="255" fill="#FFFFFF" font-size="15" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">VERIFIED ENTRY</text>
    <text x="455" y="280" fill="#778DA9" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">Carriers &amp; NVOCC Bidders</text>
    <line x1="360" y1="295" x2="550" y2="295" stroke="#415A77" stroke-width="1"/>
    <text x="365" y="325" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• KYC Accreditation Check</text>
    <text x="365" y="350" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Freight Passport Verified</text>
    <text x="365" y="375" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Bid Fee Security Deposit</text>
    <text x="365" y="400" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Zero Ghost Bidding Rule</text>
    <text x="365" y="425" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Bidder Identity Masked</text>
    <rect x="355" y="470" width="200" height="40" rx="6" fill="#075B5B"/>
    <text x="455" y="495" fill="#FFFFFF" font-size="11" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">Live Room Access Granted</text>

    <!-- Arrow 2 to 3 -->
    <path d="M 570 350 L 620 350" stroke="#52B788" stroke-width="3" fill="none"/>

    <!-- Step 3 -->
    <rect x="620" y="160" width="230" height="380" rx="10" fill="#0D1B2A" stroke="#F4A261" stroke-width="2"/>
    <circle cx="735" cy="205" r="24" fill="#F4A261"/>
    <text x="735" y="213" fill="#0D1B2A" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">3</text>
    <text x="735" y="255" fill="#FFFFFF" font-size="15" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">SPOT BIDDING ROOM</text>
    <text x="735" y="280" fill="#778DA9" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">Live Synchronous Room</text>
    <line x1="640" y1="295" x2="830" y2="295" stroke="#415A77" stroke-width="1"/>
    <text x="645" y="325" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Real-time Countdown Timer</text>
    <text x="645" y="350" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Lowest Qualifying Rate</text>
    <text x="645" y="375" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Automated Decrements</text>
    <text x="645" y="400" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Transparency &amp; Fairness</text>
    <text x="645" y="425" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Real-time Outbox Sync</text>
    <rect x="635" y="470" width="200" height="40" rx="6" fill="#075B5B"/>
    <text x="735" y="495" fill="#FFFFFF" font-size="11" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">Clock Runs to 00:00</text>

    <!-- Arrow 3 to 4 -->
    <path d="M 850 350 L 900 350" stroke="#F4A261" stroke-width="3" fill="none"/>

    <!-- Step 4 -->
    <rect x="900" y="160" width="240" height="380" rx="10" fill="#0D1B2A" stroke="#E76F51" stroke-width="2"/>
    <circle cx="1020" cy="205" r="24" fill="#E76F51"/>
    <text x="1020" y="213" fill="#0D1B2A" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">4</text>
    <text x="1020" y="255" fill="#FFFFFF" font-size="15" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">AWARD &amp; SLOT LOCK</text>
    <text x="1020" y="280" fill="#778DA9" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">Commercial Fulfillment</text>
    <line x1="920" y1="295" x2="1120" y2="295" stroke="#415A77" stroke-width="1"/>
    <text x="925" y="325" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• 48-Hour Container Slot Lock</text>
    <text x="925" y="350" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Binding Commercial Tariff</text>
    <text x="925" y="375" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Direct Shipping Order (SO)</text>
    <text x="925" y="400" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Performance Rating Impact</text>
    <text x="925" y="425" fill="#E0E1DD" font-size="11" font-family="Arial, sans-serif">• Nexus Compliance Verified</text>
    <rect x="920" y="470" width="200" height="40" rx="6" fill="#15803D"/>
    <text x="1020" y="495" fill="#FFFFFF" font-size="11" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">Booking Confirmed</text>
  </svg>
  `;
  await renderSvgToPng(svgAuction, 'diagram-reverse-auction-lifecycle.png');

  // 4. SALES CONVERSION FUNNEL
  const svgSales = `
  <svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="675" fill="#111827"/>
    <rect x="25" y="25" width="1150" height="625" rx="14" fill="#1F2937" stroke="#374151" stroke-width="2"/>
    
    <text x="600" y="70" fill="#F9FAFB" font-size="24" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      INTERNATIONAL B2B FREIGHT FORWARDER ACQUISITION FUNNEL
    </text>
    <text x="600" y="98" fill="#9CA3AF" font-size="13" font-family="Arial, sans-serif" text-anchor="middle">
      7-Stage Customer Journey from Unaware Forwarder to Retained Paid Enterprise Subscriber
    </text>

    <!-- Funnel Stage 1 -->
    <polygon points="150,140 1050,140 980,200 220,200" fill="#1E3A8A"/>
    <text x="600" y="175" fill="#FFFFFF" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      1. TARGETED INDUSTRY OUTREACH &amp; AWARENESS (LinkedIn, WhatsApp Business, Freight Associations)
    </text>

    <!-- Funnel Stage 2 -->
    <polygon points="220,205 980,205 920,265 280,265" fill="#1E40AF"/>
    <text x="600" y="240" fill="#FFFFFF" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      2. LOGISTICS LEAD MAGNET (Spot Benchmark Insights, Demurrage Calculator, Blank Sailing Alerts)
    </text>

    <!-- Funnel Stage 3 -->
    <polygon points="280,270 920,270 860,330 340,330" fill="#2563EB"/>
    <text x="600" y="305" fill="#FFFFFF" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      3. DISCOVERY INTERVIEW &amp; ROUTE PAIRING (Identifying forwarder lane volume &amp; agency pain points)
    </text>

    <!-- Funnel Stage 4 -->
    <polygon points="340,335 860,335 800,395 400,395" fill="#3B82F6"/>
    <text x="600" y="370" fill="#FFFFFF" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      4. LIVE INTERACTIVE DEMONSTRATION (Real-time Reverse Auction, Rates Editor, Recruitment Board)
    </text>

    <!-- Funnel Stage 5 -->
    <polygon points="400,400 800,400 740,460 460,460" fill="#0D9488"/>
    <text x="600" y="435" fill="#FFFFFF" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      5. SOVEREIGN COMPLIMENTARY ONBOARDING (Godfather Free Trial: ₹0.00 / Zero Friction)
    </text>

    <!-- Funnel Stage 6 -->
    <polygon points="460,465 740,465 690,525 510,525" fill="#059669"/>
    <text x="600" y="500" fill="#FFFFFF" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      6. VALUE REALIZATION &amp; HABIT FORMATION (Posting RFQs, Hiring Talent, Spot Tendering)
    </text>

    <!-- Funnel Stage 7 -->
    <polygon points="510,530 690,530 650,590 550,590" fill="#10B981"/>
    <text x="600" y="565" fill="#FFFFFF" font-size="14" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      7. PAID CONVERSION &amp; ANNUAL RETENTION
    </text>

    <!-- Side Metrics Callouts -->
    <rect x="40" y="240" width="160" height="120" rx="8" fill="#111827" stroke="#3B82F6" stroke-width="1.5"/>
    <text x="120" y="265" fill="#60A5FA" font-size="12" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">OUTREACH KPI</text>
    <text x="120" y="295" fill="#FFFFFF" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">50 Outreaches / Week</text>
    <text x="120" y="320" fill="#FFFFFF" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">15% Demo Booking Rate</text>
    <text x="120" y="345" fill="#10B981" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">7.5 Demos / Week</text>

    <rect x="1000" y="240" width="160" height="120" rx="8" fill="#111827" stroke="#10B981" stroke-width="1.5"/>
    <text x="1080" y="265" fill="#34D399" font-size="12" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">CONVERSION KPI</text>
    <text x="1080" y="295" fill="#FFFFFF" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">60% Trial Activation</text>
    <text x="1080" y="320" fill="#FFFFFF" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">25% Paid Conversion</text>
    <text x="1080" y="345" fill="#FBBF24" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">₹18,000 ARR / Forwarder</text>
  </svg>
  `;
  await renderSvgToPng(svgSales, 'diagram-sales-conversion-funnel.png');

  // 5. MARKETING CHANNELS MATRIX
  const svgChannels = `
  <svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="675" fill="#0F172A"/>
    <rect x="25" y="25" width="1150" height="625" rx="14" fill="#1E293B" stroke="#334155" stroke-width="2"/>
    
    <text x="600" y="70" fill="#F8FAFC" font-size="24" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      INTERNATIONAL B2B FREIGHT DISTRIBUTION CHANNEL RANKING &amp; ROI MATRIX
    </text>
    <text x="600" y="98" fill="#94A3B8" font-size="13" font-family="Arial, sans-serif" text-anchor="middle">
      Evaluated by Customer Acquisition Cost (CAC), Forwarder Density, Speed to Conversion, and Effort
    </text>

    <!-- Header Row -->
    <rect x="50" y="130" width="1100" height="40" rx="6" fill="#0F172A"/>
    <text x="150" y="155" fill="#38BDF8" font-size="12" font-family="Arial, sans-serif" font-weight="bold">MARKETING CHANNEL</text>
    <text x="380" y="155" fill="#38BDF8" font-size="12" font-family="Arial, sans-serif" font-weight="bold">TARGET AUDIENCE</text>
    <text x="590" y="155" fill="#38BDF8" font-size="12" font-family="Arial, sans-serif" font-weight="bold">PRIMARY CONTENT TYPE</text>
    <text x="830" y="155" fill="#38BDF8" font-size="12" font-family="Arial, sans-serif" font-weight="bold">CAC &amp; EFFORT</text>
    <text x="1030" y="155" fill="#38BDF8" font-size="12" font-family="Arial, sans-serif" font-weight="bold">RANK &amp; ROI</text>

    <!-- Row 1: WhatsApp Business Direct -->
    <rect x="50" y="180" width="1100" height="70" rx="6" fill="#1E293B" stroke="#334155"/>
    <text x="70" y="210" fill="#22C55E" font-size="14" font-family="Arial, sans-serif" font-weight="bold">1. WhatsApp Direct &amp; Groups</text>
    <text x="70" y="230" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">1-on-1 Founder outreach</text>
    <text x="380" y="210" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Indian &amp; Middle East Owners</text>
    <text x="380" y="230" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Managing Directors, Pricing Heads</text>
    <text x="590" y="210" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Spot Rate Tables &amp; 30s Video Clip</text>
    <text x="590" y="230" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Tender alert summaries</text>
    <text x="830" y="210" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Low Cost (₹0 - ₹2,000/mo)</text>
    <text x="830" y="230" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">High manual personalization</text>
    <rect x="1020" y="195" width="90" height="40" rx="6" fill="#15803D"/>
    <text x="1065" y="220" fill="#FFFFFF" font-size="13" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">#1 HIGHEST</text>

    <!-- Row 2: LinkedIn Sales Outreach -->
    <rect x="50" y="260" width="1100" height="70" rx="6" fill="#1E293B" stroke="#334155"/>
    <text x="70" y="290" fill="#38BDF8" font-size="14" font-family="Arial, sans-serif" font-weight="bold">2. LinkedIn B2B Thought Lead</text>
    <text x="70" y="310" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Content + Sales Navigator</text>
    <text x="380" y="290" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Overseas Forwarders (US/EU/SG)</text>
    <text x="380" y="310" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Global Agency Directors, NVOCCs</text>
    <text x="590" y="290" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Carousel Guides &amp; Market Audits</text>
    <text x="590" y="310" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Freight dispute resolution breakdowns</text>
    <text x="830" y="290" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Moderate (₹6,500/mo)</text>
    <text x="830" y="310" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">High authority building</text>
    <rect x="1020" y="275" width="90" height="40" rx="6" fill="#0369A1"/>
    <text x="1065" y="300" fill="#FFFFFF" font-size="13" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">#2 VERY HIGH</text>

    <!-- Row 3: Freight Forwarding Associations -->
    <rect x="50" y="340" width="1100" height="70" rx="6" fill="#1E293B" stroke="#334155"/>
    <text x="70" y="370" fill="#FBBF24" font-size="14" font-family="Arial, sans-serif" font-weight="bold">3. Freight Networks (WCA, FIATA)</text>
    <text x="70" y="390" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Directory partnership &amp; AGM</text>
    <text x="380" y="370" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Pre-Vetted International Agents</text>
    <text x="380" y="390" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Verified independent freight owners</text>
    <text x="590" y="370" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Sponsor Case Studies &amp; Demos</text>
    <text x="590" y="390" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Digital Freight Passport showcase</text>
    <text x="830" y="370" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">High upfront ($1.5k - $5k/yr)</text>
    <text x="830" y="390" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Instant institutional credibility</text>
    <rect x="1020" y="355" width="90" height="40" rx="6" fill="#B45309"/>
    <text x="1065" y="380" fill="#FFFFFF" font-size="13" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">#3 HIGH</text>

    <!-- Row 4: Cold Email Outreach -->
    <rect x="50" y="420" width="1100" height="70" rx="6" fill="#1E293B" stroke="#334155"/>
    <text x="70" y="450" fill="#A855F7" font-size="14" font-family="Arial, sans-serif" font-weight="bold">4. Cold Email Sequences</text>
    <text x="70" y="470" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Personalized 4-step sequence</text>
    <text x="380" y="450" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Regional Logistics Branch Heads</text>
    <text x="380" y="470" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Ocean Import/Export Managers</text>
    <text x="590" y="450" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Lane Specific Spot Analysis</text>
    <text x="590" y="470" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">"Nhava Sheva to Jebel Ali Spot Rate"</text>
    <text x="830" y="450" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Low Cost (₹3,000/mo tools)</text>
    <text x="830" y="470" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Spam filter discipline mandatory</text>
    <rect x="1020" y="435" width="90" height="40" rx="6" fill="#7E22CE"/>
    <text x="1065" y="460" fill="#FFFFFF" font-size="13" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">#4 MODERATE</text>

    <!-- Row 5: YouTube / Loom Video Demos -->
    <rect x="50" y="500" width="1100" height="70" rx="6" fill="#1E293B" stroke="#334155"/>
    <text x="70" y="530" fill="#EC4899" font-size="14" font-family="Arial, sans-serif" font-weight="bold">5. Video Walkthroughs &amp; Demos</text>
    <text x="70" y="550" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">3-minute feature overviews</text>
    <text x="380" y="530" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Tech-savvy Operations Clerks</text>
    <text x="380" y="550" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Next-generation forwarders</text>
    <text x="590" y="530" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Screen Share Workflow Demos</text>
    <text x="590" y="550" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">"How to win a 20-container tender"</text>
    <text x="830" y="530" fill="#F8FAFC" font-size="12" font-family="Arial, sans-serif">Zero Ad Spend (Founder Time)</text>
    <text x="830" y="550" fill="#94A3B8" font-size="11" font-family="Arial, sans-serif">Compounding evergreen value</text>
    <rect x="1020" y="515" width="90" height="40" rx="6" fill="#BE185D"/>
    <text x="1065" y="540" fill="#FFFFFF" font-size="13" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">#5 HIGH EFF</text>
  </svg>
  `;
  await renderSvgToPng(svgChannels, 'diagram-marketing-channel-ranking.png');

  // 6. INVESTOR UNIT ECONOMICS
  const svgInvestor = `
  <svg width="1200" height="675" viewBox="0 0 1200 675" xmlns="http://www.w3.org/2000/svg">
    <rect width="1200" height="675" fill="#030712"/>
    <rect x="25" y="25" width="1150" height="625" rx="14" fill="#111827" stroke="#1F2937" stroke-width="2"/>
    
    <text x="600" y="70" fill="#F9FAFB" font-size="24" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">
      FR8X MONETIZATION MODEL &amp; B2B REVENUE STREAMS
    </text>
    <text x="600" y="98" fill="#9CA3AF" font-size="13" font-family="Arial, sans-serif" text-anchor="middle">
      Authoritative Multi-Stream Commercial Architecture: SaaS Subscriptions, Recruitment, Ads &amp; Bidding Fees
    </text>

    <!-- Stream 1: Subscriptions -->
    <rect x="60" y="140" width="250" height="460" rx="10" fill="#1F2937" stroke="#3B82F6" stroke-width="2"/>
    <rect x="60" y="140" width="250" height="60" rx="10" fill="#1E3A8A"/>
    <text x="185" y="175" fill="#FFFFFF" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">1. SAAS SUBSCRIPTIONS</text>
    <text x="185" y="235" fill="#60A5FA" font-size="22" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">₹1,500 – ₹9,999</text>
    <text x="185" y="255" fill="#9CA3AF" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">Per forwarder / month</text>
    <line x1="80" y1="275" x2="290" y2="275" stroke="#374151" stroke-width="1"/>
    <text x="80" y="305" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• Trial Plan: ₹0 (30 Days)</text>
    <text x="80" y="335" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• Pro Plan: ₹1,500/mo ($18)</text>
    <text x="80" y="365" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• Premium: ₹3,000/mo ($35)</text>
    <text x="80" y="395" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• Enterprise: ₹9,999/mo ($115)</text>
    <text x="80" y="440" fill="#9CA3AF" font-size="11" font-family="Arial, sans-serif">Recurring MRR foundation with zero incremental marginal cost per forwarder seat.</text>
    <rect x="80" y="525" width="210" height="50" rx="6" fill="#1E3A8A"/>
    <text x="185" y="555" fill="#93C5FD" font-size="12" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">Recurring Annual ARR</text>

    <!-- Stream 2: Recruitment Tariffs -->
    <rect x="335" y="140" width="250" height="460" rx="10" fill="#1F2937" stroke="#10B981" stroke-width="2"/>
    <rect x="335" y="140" width="250" height="60" rx="10" fill="#064E3B"/>
    <text x="460" y="175" fill="#FFFFFF" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">2. CAREERS BOARD</text>
    <text x="460" y="235" fill="#34D399" font-size="22" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">₹300 – ₹5,340</text>
    <text x="460" y="255" fill="#9CA3AF" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">Per recruitment vacancy listing</text>
    <line x1="355" y1="275" x2="565" y2="275" stroke="#374151" stroke-width="1"/>
    <text x="355" y="305" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• 2 Days (Min): ₹300 ($3.50)</text>
    <text x="355" y="335" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• 7 Days: ₹1,200 ($14)</text>
    <text x="355" y="365" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• 15 Days: ₹2,640 ($31)</text>
    <text x="355" y="395" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• 30 Days: ₹5,340 ($62)</text>
    <text x="355" y="440" fill="#9CA3AF" font-size="11" font-family="Arial, sans-serif">10x cheaper than LinkedIn/Naukri. Captures active logistics job requisitions continuously.</text>
    <rect x="355" y="525" width="210" height="50" rx="6" fill="#064E3B"/>
    <text x="460" y="555" fill="#6EE7B7" font-size="12" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">High Velocity Transactional</text>

    <!-- Stream 3: Sponsored Ads -->
    <rect x="610" y="140" width="250" height="460" rx="10" fill="#1F2937" stroke="#F59E0B" stroke-width="2"/>
    <rect x="610" y="140" width="250" height="60" rx="10" fill="#78350F"/>
    <text x="735" y="175" fill="#FFFFFF" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">3. SPONSORED ADS</text>
    <text x="735" y="235" fill="#FBBF24" font-size="22" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">₹1,000 – ₹5,000</text>
    <text x="735" y="255" fill="#9CA3AF" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">Per banner campaign slot</text>
    <line x1="630" y1="275" x2="840" y2="275" stroke="#374151" stroke-width="1"/>
    <text x="630" y="305" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• 2-Day Placement: ₹1,000</text>
    <text x="630" y="335" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• 10-Day Placement: ₹5,000</text>
    <text x="630" y="365" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• Sidebar Feed Presence</text>
    <text x="630" y="395" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• Direct Verified Lead Generation</text>
    <text x="630" y="440" fill="#9CA3AF" font-size="11" font-family="Arial, sans-serif">Paid by NVOCCs, Shipping Lines, Container Depots and Marine Insurers.</text>
    <rect x="630" y="525" width="210" height="50" rx="6" fill="#78350F"/>
    <text x="735" y="555" fill="#FDE68A" font-size="12" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">B2B Ad Network Margin</text>

    <!-- Stream 4: Reverse Auction Bidding Fees -->
    <rect x="885" y="140" width="250" height="460" rx="10" fill="#1F2937" stroke="#EC4899" stroke-width="2"/>
    <rect x="885" y="140" width="250" height="60" rx="10" fill="#831843"/>
    <text x="1010" y="175" fill="#FFFFFF" font-size="16" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">4. BIDDING FEES</text>
    <text x="1010" y="235" fill="#F472B6" font-size="22" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">₹180 – ₹300</text>
    <text x="1010" y="255" fill="#9CA3AF" font-size="11" font-family="Arial, sans-serif" text-anchor="middle">Per tender bid submission</text>
    <line x1="905" y1="275" x2="1115" y2="275" stroke="#374151" stroke-width="1"/>
    <text x="905" y="305" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• Standard Bidder: ₹300</text>
    <text x="905" y="335" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• Premium Member: ₹180 (40% off)</text>
    <text x="905" y="365" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• Binds serious slot commitments</text>
    <text x="905" y="395" fill="#F9FAFB" font-size="12" font-family="Arial, sans-serif">• 48-Hour Container Slot Guarantee</text>
    <text x="905" y="440" fill="#9CA3AF" font-size="11" font-family="Arial, sans-serif">Eliminates ghost quotations and scales exponentially with platform liquidity.</text>
    <rect x="905" y="525" width="210" height="50" rx="6" fill="#831843"/>
    <text x="1010" y="555" fill="#FBCFE8" font-size="12" font-family="Arial, sans-serif" font-weight="bold" text-anchor="middle">Scales With Volume</text>
  </svg>
  `;
  await renderSvgToPng(svgInvestor, 'diagram-investor-unit-economics.png');

  console.log('\nAll master visual diagram assets successfully generated and ready for publishing!');
}

main().catch(console.error);
