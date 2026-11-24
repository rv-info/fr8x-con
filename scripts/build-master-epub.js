const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');

console.log('Building Professional EPUB Edition of FR8X Master Marketing & Business Intelligence Compendium...\n');

const assetsDir = path.join(__dirname, '..', 'marketing', '02_VISUAL_ASSETS');
const outputDir = path.join(__dirname, '..', 'marketing', '03_MASTER_BOOK');
const handbooksDir = path.join(__dirname, '..', 'marketing', '04_STRATEGIC_HANDBOOKS');
const productIntelDir = path.join(__dirname, '..', 'marketing', '01_PRODUCT_INTELLIGENCE');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

function escapeXml(unsafe) {
  if (!unsafe) return '';
  return String(unsafe)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatInline(text) {
  if (!text) return '';
  let str = escapeXml(text);
  // Bold **text**
  str = str.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  // Italic *text*
  str = str.replace(/\*(.*?)\*/g, '<em>$1</em>');
  // Inline code `code`
  str = str.replace(/`(.*?)`/g, '<code>$1</code>');
  return str;
}

function markdownToXhtml(mdText) {
  const lines = mdText.split('\n');
  const out = [];
  let inList = false;
  let listType = 'ul';
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];
  let inCode = false;
  let codeBuffer = [];

  function closeList() {
    if (inList) {
      out.push(`</${listType}>`);
      inList = false;
    }
  }

  function flushTable() {
    if (inTable && tableHeaders.length > 0) {
      out.push('<div class="table-wrap"><table>');
      out.push('<thead><tr>');
      for (const h of tableHeaders) {
        out.push(`<th>${formatInline(h)}</th>`);
      }
      out.push('</tr></thead>');
      out.push('<tbody>');
      for (let r = 0; r < tableRows.length; r++) {
        const row = tableRows[r];
        const rowClass = r % 2 === 0 ? 'even' : 'odd';
        out.push(`<tr class="${rowClass}">`);
        for (const cell of row) {
          out.push(`<td>${formatInline(cell)}</td>`);
        }
        out.push('</tr>');
      }
      out.push('</tbody></table></div>');
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  }

  function flushCode() {
    if (inCode) {
      out.push('<pre class="code-block"><code>');
      out.push(escapeXml(codeBuffer.join('\n')));
      out.push('</code></pre>');
      inCode = false;
      codeBuffer = [];
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Code blocks
    if (line.startsWith('```')) {
      if (inCode) {
        flushCode();
      } else {
        closeList();
        flushTable();
        inCode = true;
        codeBuffer = [];
      }
      continue;
    }

    if (inCode) {
      codeBuffer.push(rawLine);
      continue;
    }

    // Tables
    if (line.startsWith('|') && line.endsWith('|')) {
      closeList();
      const cells = line.split('|').slice(1, -1).map(c => c.trim());
      // Skip separator row |:---|:---|
      if (cells.every(c => /^[:\s-]+$/.test(c))) {
        continue;
      }
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      continue;
    } else {
      flushTable();
    }

    if (!line) {
      closeList();
      continue;
    }

    // Headings
    if (line.startsWith('# ')) {
      closeList();
      out.push(`<h1>${formatInline(line.replace(/^#\s+/, ''))}</h1>`);
    } else if (line.startsWith('## ')) {
      closeList();
      out.push(`<h2>${formatInline(line.replace(/^##\s+/, ''))}</h2>`);
    } else if (line.startsWith('### ')) {
      closeList();
      out.push(`<h3>${formatInline(line.replace(/^###\s+/, ''))}</h3>`);
    } else if (line.startsWith('#### ')) {
      closeList();
      out.push(`<h4>${formatInline(line.replace(/^####\s+/, ''))}</h4>`);
    } else if (line.startsWith('> ')) {
      closeList();
      out.push(`<div class="callout"><div class="callout-title">OPERATIONAL DIRECTIVE</div><p>${formatInline(line.replace(/^>\s+/, ''))}</p></div>`);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (!inList || listType !== 'ul') {
        closeList();
        inList = true;
        listType = 'ul';
        out.push('<ul>');
      }
      out.push(`<li>${formatInline(line.replace(/^[-*]\s+/, ''))}</li>`);
    } else if (/^\d+\.\s+/.test(line)) {
      if (!inList || listType !== 'ol') {
        closeList();
        inList = true;
        listType = 'ol';
        out.push('<ol>');
      }
      out.push(`<li>${formatInline(line.replace(/^\d+\.\s+/, ''))}</li>`);
    } else if (line === '---' || line === '***') {
      closeList();
      out.push('<hr />');
    } else {
      closeList();
      out.push(`<p>${formatInline(line)}</p>`);
    }
  }

  closeList();
  flushTable();
  flushCode();

  return out.join('\n');
}

function readMarkdown(filePath) {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return '';
}

function buildXhtmlPage(title, bodyContent) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeXml(title)}</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
  ${bodyContent}
</body>
</html>`;
}

async function buildMasterEpub() {
  const zip = new JSZip();

  // 1. mimetype (Uncompressed STORE as required by EPUB specification)
  zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });

  // 2. META-INF/container.xml
  const containerXml = `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
  zip.file('META-INF/container.xml', containerXml);

  // 3. CSS Stylesheet
  const css = `
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  color: #1E293B;
  background-color: #FFFFFF;
  margin: 1.2em;
  padding: 0;
  line-height: 1.6;
  font-size: 1em;
}

h1 {
  color: #075B5B;
  font-size: 1.7em;
  font-weight: 800;
  margin-top: 1.6em;
  margin-bottom: 0.6em;
  border-bottom: 2px solid #075B5B;
  padding-bottom: 0.25em;
  page-break-before: always;
}

h2 {
  color: #1E293B;
  font-size: 1.35em;
  font-weight: 700;
  margin-top: 1.4em;
  margin-bottom: 0.5em;
}

h3 {
  color: #059669;
  font-size: 1.15em;
  font-weight: 600;
  margin-top: 1.2em;
  margin-bottom: 0.4em;
}

h4 {
  color: #475569;
  font-size: 1.05em;
  font-weight: 600;
  margin-top: 1em;
  margin-bottom: 0.3em;
}

p {
  margin: 0.7em 0;
  text-align: justify;
}

ul, ol {
  margin: 0.6em 0 0.8em 1.5em;
  padding: 0;
}

li {
  margin-bottom: 0.4em;
}

strong {
  color: #0F172A;
  font-weight: 700;
}

em {
  color: #334155;
  font-style: italic;
}

code {
  font-family: Consolas, "Courier New", monospace;
  background-color: #F1F5F9;
  color: #0F172A;
  padding: 0.15em 0.35em;
  border-radius: 3px;
  font-size: 0.9em;
}

pre.code-block {
  background-color: #0F172A;
  color: #F8FAFC;
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  font-size: 0.85em;
  line-height: 1.45;
  margin: 1em 0;
}
pre.code-block code {
  background: none;
  color: inherit;
  padding: 0;
}

.table-wrap {
  width: 100%;
  overflow-x: auto;
  margin: 1.2em 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.88em;
  margin: 0.5em 0;
}

th {
  background-color: #075B5B;
  color: #FFFFFF;
  text-align: left;
  padding: 8px 10px;
  font-weight: 700;
  border: 1px solid #075B5B;
}

td {
  padding: 7px 10px;
  border: 1px solid #CBD5E1;
  vertical-align: top;
}

tr.even td {
  background-color: #FFFFFF;
}

tr.odd td {
  background-color: #F8FAFC;
}

.callout {
  border-left: 4px solid #075B5B;
  background-color: #F0FDF4;
  padding: 10px 14px;
  margin: 1.2em 0;
  border-radius: 0 6px 6px 0;
}

.callout-title {
  color: #075B5B;
  font-weight: 800;
  font-size: 0.85em;
  letter-spacing: 0.05em;
  margin-bottom: 4px;
}

.callout p {
  margin: 0;
  font-size: 0.95em;
  color: #1E293B;
}

figure.fig-center {
  text-align: center;
  margin: 1.6em 0;
  page-break-inside: avoid;
}

figure.fig-center img {
  max-width: 100%;
  height: auto;
  border-radius: 6px;
  border: 1px solid #E2E8F0;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.08);
}

figcaption {
  font-size: 0.85em;
  color: #64748B;
  font-style: italic;
  margin-top: 6px;
}

.cover-wrapper {
  text-align: center;
  padding: 2em 1em;
}

.cover-title {
  font-size: 2.3em;
  font-weight: 900;
  color: #075B5B;
  margin-bottom: 0.2em;
  letter-spacing: 0.02em;
}

.cover-subtitle {
  font-size: 1.15em;
  color: #475569;
  margin-bottom: 1.5em;
  line-height: 1.45;
}

.cover-edition {
  display: inline-block;
  background-color: #075B5B;
  color: #FFFFFF;
  padding: 4px 14px;
  border-radius: 4px;
  font-size: 0.85em;
  font-weight: 700;
  margin: 1.2em 0;
}

.cover-publisher {
  font-size: 0.9em;
  color: #64748B;
  margin-top: 1.5em;
  line-height: 1.5;
}

hr {
  border: none;
  border-top: 1px solid #E2E8F0;
  margin: 1.8em 0;
}
`;
  zip.file('OEBPS/style.css', css);

  // 4. Ingest and Bundle All PNG Visual Diagrams
  const imageFiles = [
    'diagram-fr8x-system-architecture.png',
    'diagram-freight-ecosystem.png',
    'diagram-investor-unit-economics.png',
    'diagram-marketing-channel-ranking.png',
    'diagram-reverse-auction-lifecycle.png',
    'diagram-sales-conversion-funnel.png',
    'verified-notifications-desktop.png',
    'verified-profile-dropdown-desktop.png',
    'verified-table-modal.png',
    'verified-table-preview.png',
  ];

  for (const imgName of imageFiles) {
    const p = path.join(assetsDir, imgName);
    if (fs.existsSync(p)) {
      zip.file(`OEBPS/images/${imgName}`, fs.readFileSync(p));
    }
  }

  // 5. Structure Book Chapters & Volumes
  const chapters = [];

  // --- Chapter 1: Cover Page ---
  const coverHtml = `
<div class="cover-wrapper">
  <div class="cover-title">THE FR8X COMPENDIUM</div>
  <div class="cover-subtitle">
    The Authoritative Master Guide to Global B2B Freight Forwarding Architecture,<br />
    Digital Exchange Operations, International Marketing, and Venture Growth
  </div>
  <figure class="fig-center">
    <img src="images/diagram-fr8x-system-architecture.png" alt="FR8X Central Exchange System Architecture" />
    <figcaption>FR8X Central Exchange System Architecture</figcaption>
  </figure>
  <div class="cover-edition">AUTHORITATIVE REPOSITORY EDITION · 2026</div>
  <div class="cover-publisher">
    Published by FR8X Freight Exchange Engineering &amp; Commercial Directorate<br />
    <strong>https://fr8x.in</strong> · <em>tech@fr8x.in</em>
  </div>
</div>`;
  chapters.push({
    id: 'cover',
    title: 'Cover Page',
    filename: 'cover.xhtml',
    content: buildXhtmlPage('The FR8X Compendium - Cover', coverHtml),
  });

  // --- Chapter 2: Proclamation & Specifications ---
  const proclamationHtml = `
<h1>EXECUTIVE PROCLAMATION &amp; COMMERCIAL EVIDENCE REGISTER</h1>
<p>
  This compendium is the definitive operational encyclopedia, international marketing blueprint, sales enablement handbook, and investment underwriting compendium for <strong>FR8X</strong>. Unlike speculative software whitepapers, every functional capability, operational workflow, database relationship, and tariff structure documented within these pages is strictly verified against the production codebase of the FR8X freight platform.
</p>
<div class="callout">
  <div class="callout-title">STRICT COMMERCIAL TRUTH-IN-SOFTWARE DISCLOSURE</div>
  <p>
    FR8X is an inter-company digital trading floor, spot rate benchmark exchange, reverse container auction platform, and logistics talent network. It is not an internal enterprise accounting ERP or customs EDI electronic filing system. Features marked as "Verified Live" have passed comprehensive architectural quality gates with zero regressions.
  </p>
</div>

<h2>Master System Specifications &amp; Codebase Baseline</h2>
<div class="table-wrap">
  <table>
    <thead>
      <tr>
        <th>Architecture Vector</th>
        <th>Verified Specification</th>
        <th>Implementation Location in Codebase</th>
      </tr>
    </thead>
    <tbody>
      <tr class="even">
        <td>Frontend Framework</td>
        <td>Next.js 14 App Router (React 18), Tailwind CSS, Lucide Icons</td>
        <td><code>app/</code>, <code>components/</code></td>
      </tr>
      <tr class="odd">
        <td>Database &amp; Security</td>
        <td>Supabase PostgreSQL with Strict Row Level Security (RLS)</td>
        <td><code>lib/supabase/</code>, <code>lib/db/</code></td>
      </tr>
      <tr class="even">
        <td>Billing &amp; Currencies</td>
        <td>ISO 4217 Engine (120+ Currencies) + Minor Units Calculation</td>
        <td><code>lib/billing/currency-detector.ts</code></td>
      </tr>
      <tr class="odd">
        <td>Quote Locking</td>
        <td>15-Minute Cryptographic HMAC-SHA256 TTL Quote Signature Verification</td>
        <td><code>lib/billing/billing-engine.ts</code></td>
      </tr>
      <tr class="even">
        <td>Godfather Access</td>
        <td>Sovereign Free-Access Engine (PAID vs FREE Mode + Audit Trail)</td>
        <td><code>lib/billing/free-access-manager.ts</code></td>
      </tr>
      <tr class="odd">
        <td>Quality Assurance</td>
        <td>17 of 17 Master Architectural Quality Gates Passing Verified</td>
        <td><code>scripts/verify-all-gates.ts</code></td>
      </tr>
    </tbody>
  </table>
</div>`;
  chapters.push({
    id: 'proclamation',
    title: 'Executive Proclamation & System Specifications',
    filename: 'proclamation.xhtml',
    content: buildXhtmlPage('Executive Proclamation', proclamationHtml),
  });

  // --- Chapter 3: Chronological Table of Contents ---
  const tocHtml = `
<h1>DETAILED CHRONOLOGICAL MASTER TABLE OF CONTENTS</h1>
<p>
  The compendium is structured in an end-to-end chronological journey of commercial understanding, system architecture, user adoption, market promotion, sales acquisition, venture financing, and technical reference:
</p>
<ul>
  <li><strong>STAGE 1: THE FOUNDATIONAL REALITY (THE MARKET &amp; THE PROBLEM)</strong>
    <ul>
      <li>Volume 1: The Global Freight Forwarding Industry (Foundations &amp; Structure)
        <ul>
          <li>Chapter 1: Anatomy of Maritime, Air, and Multimodal Freight Forwarding</li>
          <li>Chapter 2: The Core Actors: Forwarders, NVOCCs, Carriers, CHAs &amp; Shippers</li>
          <li>Chapter 3: Commercial Tariffs: Ocean BAS, OTHC, DTHC, Demurrage &amp; Detention</li>
          <li>Chapter 4: Structural Crises Facing Small &amp; Mid-Market Freight Forwarders</li>
        </ul>
      </li>
    </ul>
  </li>
  <li><strong>STAGE 2: THE DIGITAL SOLUTION &amp; PRODUCT SPECIFICATION (WHAT WE BUILT)</strong>
    <ul>
      <li>Volume 2: FR8X Product Intelligence &amp; Complete Operational Encyclopedia
        <ul>
          <li>Chapter 5: Global Header &amp; Availability Status Popover Architecture</li>
          <li>Chapter 6: B2B Freight Intelligence Feed &amp; Structured Table Editor</li>
          <li>Chapter 7: Multimodal Rate Intelligence Matrix &amp; Unified Lane Editor</li>
          <li>Chapter 8: Reverse Container Tender Auctions &amp; Spot Bidding Rooms</li>
          <li>Chapter 9: Trade Careers &amp; Logistics Talent Recruitment Board</li>
          <li>Chapter 10: Enterprise Directory, Freight Passport™ &amp; Nexus Compliance</li>
          <li>Chapter 11: Multi-Currency Billing Engine &amp; Sovereign Free-Access Control</li>
        </ul>
      </li>
    </ul>
  </li>
  <li><strong>STAGE 3: CUSTOMER ADOPTION &amp; IMPLEMENTATION ROADMAP (HOW USERS USE IT)</strong>
    <ul>
      <li>Volume 3: Strategic Adoption Frameworks for Freight Forwarders
        <ul>
          <li>Chapter 12: The Small Independent Forwarder Playbook (1–15 Employees)</li>
          <li>Chapter 13: The Mid-Market Logistics Enterprise Playbook (16–100 Employees)</li>
          <li>Chapter 14: The Global Enterprise &amp; Carrier Playbook (100+ Employees)</li>
          <li>Chapter 15: What FR8X Is vs. What It Is Not (Truth-in-Tech Boundaries)</li>
        </ul>
      </li>
    </ul>
  </li>
  <li><strong>STAGE 4: GO-TO-MARKET &amp; MARKETING STRATEGY (HOW TO ATTRACT PROSPECTS)</strong>
    <ul>
      <li>Volume 4: International Marketing Fundamentals &amp; Channel Strategy
        <ul>
          <li>Chapter 16: Marketing Principles for Specialized Freight Forwarding Tech</li>
          <li>Chapter 17: Customer Personas: Founders, Operations, Agents &amp; Recruiters</li>
          <li>Chapter 18: B2B Channel Ranking Matrix (WhatsApp, LinkedIn, Networks)</li>
          <li>Chapter 19: Low-Budget Founder Execution vs. High-Budget Scale Strategy</li>
        </ul>
      </li>
    </ul>
  </li>
  <li><strong>STAGE 5: EXECUTION TIMELINE &amp; CHRONOLOGICAL CALENDARS (DAY-BY-DAY EXECUTION)</strong>
    <ul>
      <li>Volume 5: 90-Day &amp; 180-Day Chronological Execution Calendars
        <ul>
          <li>Chapter 20: 90-Day Week-by-Week Operational Publishing Schedule</li>
          <li>Chapter 21: 180-Day Global Expansion &amp; Association Integration Roadmap</li>
          <li>Chapter 22: Lead Tracking Sheets, KPI Scorecards &amp; Conversion Metrics</li>
        </ul>
      </li>
    </ul>
  </li>
  <li><strong>STAGE 6: COPYWRITING &amp; ASSET REPOSITORY (WHAT TO SAY &amp; PUBLISH)</strong>
    <ul>
      <li>Volume 6: Turn-Key Ready-to-Publish Marketing Content Library
        <ul>
          <li>Chapter 23: Direct 1-on-1 Outreach Scripts (WhatsApp &amp; SMS)</li>
          <li>Chapter 24: LinkedIn Thought Leadership, Carousel &amp; Problem Posts</li>
          <li>Chapter 25: 4-Touch Cold Email Outbound Sequences</li>
          <li>Chapter 26: 60-Second Video Demonstration &amp; Educational Scripts</li>
          <li>Chapter 27: Customer Onboarding, Product Announcements &amp; PR Releases</li>
        </ul>
      </li>
    </ul>
  </li>
  <li><strong>STAGE 7: SALES METHODOLOGY, PITCHES &amp; CONVERSION (HOW TO CLOSE CUSTOMERS)</strong>
    <ul>
      <li>Volume 7: International Customer Acquisition &amp; Sales Scripts
        <ul>
          <li>Chapter 28: The 5-Step Consultative Freight Sales Methodology</li>
          <li>Chapter 29: Spoken Pitches: 30-Second, 1-Minute, 3-Minute &amp; 5-Minute Demos</li>
          <li>Chapter 30: Realistic Customer Sales Dialogue &amp; Discovery Analysis</li>
          <li>Chapter 31: Comprehensive Objection Handling &amp; Value Defenses</li>
        </ul>
      </li>
    </ul>
  </li>
  <li><strong>STAGE 8: FINANCING, UNIT ECONOMICS &amp; INVESTOR UNDERWRITING (HOW TO FUND IT)</strong>
    <ul>
      <li>Volume 8: Angel Investor &amp; Venture Capital Presentation Handbook
        <ul>
          <li>Chapter 32: Macro Investment Thesis &amp; Market Opportunity ($200B+ TAM)</li>
          <li>Chapter 33: Multi-Stream Monetization Model &amp; Defensible Unit Economics</li>
          <li>Chapter 34: 3-Year Illustrative Financial Modeling Framework</li>
          <li>Chapter 35: Investor Presentation Script &amp; Tough Q&amp;A Defense</li>
        </ul>
      </li>
    </ul>
  </li>
  <li><strong>STAGE 9: REFERENCE COMPENDIUM &amp; AUDIT TRAIL (THE CANONICAL REFERENCE)</strong>
    <ul>
      <li>Volume 9: Technical &amp; Maritime Reference Compendium
        <ul>
          <li>Chapter 36: 100+ Essential Maritime Terms &amp; INCOTERMS 2020 Definitions</li>
          <li>Chapter 37: Master Feature Evidence Register &amp; Repository Code Links</li>
        </ul>
      </li>
    </ul>
  </li>
</ul>`;
  chapters.push({
    id: 'toc',
    title: 'Master Table of Contents',
    filename: 'toc.xhtml',
    content: buildXhtmlPage('Master Table of Contents', tocHtml),
  });

  // --- Chapter 4: Volume 1 ---
  const vol1Html = `
<h1>VOLUME 1: THE GLOBAL FREIGHT FORWARDING INDUSTRY (FOUNDATIONS &amp; MARKET STRUCTURE)</h1>
<p>
  To sell software to freight forwarders, one must speak their language, understand their operational bottlenecks, and feel the physical constraints of container logistics. Freight forwarding is not mere transportation brokerage; it is the legal, financial, and physical coordination of global international trade across maritime, air, road, rail, and customs domains.
</p>
<figure class="fig-center">
  <img src="images/diagram-freight-ecosystem.png" alt="The International Freight Forwarding Ecosystem" />
  <figcaption>Figure: The International Freight Forwarding Ecosystem &amp; Operational Flow</figcaption>
</figure>

<h2>Chapter 1: Anatomy of Maritime, Air, and Multimodal Transport</h2>
<p>
  International trade moves across four primary transportation modes: Ocean Freight (accounting for over 80% of global trade volume by weight), Air Freight (high-value, time-critical perishables, pharmaceuticals, and electronics), Inland Road/Rail Haulage (connecting inland container depots to gateway ports), and Multimodal Transport (covered under a single through Multimodal Bill of Lading).
</p>
<p>
  When an exporter in Delhi manufactures 1,000 cartons of cotton garments destined for Hamburg, the cargo does not simply teleport onto a ship. It must be packed into a 40ft High Cube container, sealed with an ISO 17712 high-security bolt seal, weighed for Verified Gross Mass (VGM) compliance, moved by rail from ICD Tuglakabad to Nhava Sheva port, cleared through Indian Customs by a licensed Customs House Agent (CHA), gated into the terminal before the strict vessel cut-off, and loaded onto an ultra-large container vessel.
</p>
<p>
  Vessel classes in modern ocean transport vary substantially: Feeder Vessels (500–2,500 TEU) serve regional hubs like Colombo or Port Klang; Panamax (3,000–5,000 TEU) and Post-Panamax (5,000–10,000 TEU) serve intermediate corridors; and Ultra Large Container Vessels (ULCV, up to 24,000 TEU) dominate the Asia-Europe mainline routes. Understanding vessel cascading and transit schedule reliability is vital for any freight technology provider.
</p>

<h2>Chapter 2: The Core Actors &amp; Commercial Intermediaries</h2>
<p>The global supply chain relies on five distinct commercial stakeholders:</p>
<ol>
  <li><strong>Cargo Owners (B2B Shippers &amp; Consignees)</strong>: The manufacturing exporters and commercial importers who own the cargo and require reliable transit schedules and transparent invoicing.</li>
  <li><strong>Freight Forwarders</strong>: The licensed architectural organizers of transport who act as agents or principals, assembling documentation, securing carrier allocations, and providing credit lines to shippers.</li>
  <li><strong>Non-Vessel Operating Common Carriers (NVOCCs)</strong>: Carriers that own or lease container fleets (TEUs) and issue their own House Bills of Lading without operating the ocean-going vessels.</li>
  <li><strong>Mainline Vessel Operating Carriers (VOCCs)</strong>: The global shipping lines (MSC, Maersk, CMA CGM, Hapag-Lloyd, COSCO, ONE) that own and operate the container ships and manage vessel space.</li>
  <li><strong>Customs Brokers (CHAs) &amp; Overseas Delivery Agents</strong>: Licensed entities handling statutory clearance, terminal delivery orders (DO), and destination container de-stuffing.</li>
</ol>

<h2>Chapter 3: Commercial Tariffs: Ocean BAS, OTHC, DTHC, Demurrage &amp; Detention</h2>
<p>
  Freight forwarders generate margin by arbitraging complex, floating tariff components. A typical quotation contains:
</p>
<ul>
  <li><strong>Base Ocean Freight (BAS)</strong>: The base carrying rate per container, quoted in US Dollars (USD).</li>
  <li><strong>Origin Terminal Handling Charge (OTHC)</strong>: Crane lifts, terminal movement, and stevedoring at the loading port, billed in local currency (e.g., INR).</li>
  <li><strong>Destination Terminal Handling Charge (DTHC)</strong>: Port discharge and yard movement at destination, billed in EUR, AED, or USD.</li>
  <li><strong>Bunker Adjustment Factor (BAF) &amp; Low Sulphur Surcharge (LSS)</strong>: Fuel price volatility compensation.</li>
  <li><strong>Currency Adjustment Factor (CAF)</strong>: Protection against exchange rate fluctuations between booking and sailing dates.</li>
  <li><strong>Container Demurrage &amp; Detention</strong>: The single largest source of billing disputes. Demurrage accrues while the container sits inside the marine terminal. Detention accrues when the importer holds the container outside the terminal past granted free days.</li>
</ul>

<div class="callout">
  <div class="callout-title">OPERATIONAL CASE EXAMPLE: THE DEMURRAGE CATASTROPHE</div>
  <p>
    An importer in Jebel Ali receives 5 containers with 7 days free time. Due to a customs documentation discrepancy, clearance takes 11 days (4 days overdue). The carrier levies detention penalties of $150 per container per day. In just 4 days, the importer incurs $3,000 in penalties—completely wiping out the forwarder’s commercial profit margin on the trade lane.
  </p>
</div>

<h2>Chapter 4: Structural Crises Facing Small &amp; Mid-Market Freight Forwarders</h2>
<p>
  Small and mid-market forwarders face four existential crises: Carrier Disintermediation (shipping lines launching direct-to-shipper booking portals), Working Capital Crunch (forwarders must prepay ocean freight in USD within 7 days while shippers take 60–90 days to settle INR invoices), Agency Fraud &amp; Default (overseas agents collecting cargo and refusing to remit ocean freight), and High Quoting Friction (pricing desks spending 4–8 hours daily chasing spot rates via email).
</p>`;
  chapters.push({
    id: 'vol1',
    title: 'Volume 1: The Global Freight Forwarding Industry',
    filename: 'vol1.xhtml',
    content: buildXhtmlPage('Volume 1: Global Freight Forwarding Industry', vol1Html),
  });

  // --- Chapter 5: Volume 2 ---
  let vol2Body = `
<h1>VOLUME 2: FR8X PRODUCT INTELLIGENCE &amp; COMPLETE OPERATIONAL ENCYCLOPEDIA</h1>
<p>
  This volume provides an exhaustive, screen-by-screen, module-by-module operational manual and architectural specification of every capability built and verified into FR8X.
</p>
<figure class="fig-center">
  <img src="images/verified-profile-dropdown-desktop.png" alt="Global Header and Profile Dropdown" />
  <figcaption>Figure: Global Header, Profile Dropdown, and Verified Statutory Credentials</figcaption>
</figure>`;

  const pManifesto = readMarkdown(path.join(productIntelDir, 'FR8X_PRODUCT_INTELLIGENCE_MANIFESTO.md'));
  if (pManifesto) {
    vol2Body += '\n' + markdownToXhtml(pManifesto);
  }

  vol2Body += `
<figure class="fig-center">
  <img src="images/verified-table-modal.png" alt="Structured Rate Table Insertion Dialog" />
  <figcaption>Figure: Structured Rate &amp; Commodity Table Insertion Configuration Dialog</figcaption>
</figure>
<figure class="fig-center">
  <img src="images/verified-table-preview.png" alt="Structured Rate Table in Feed Post" />
  <figcaption>Figure: Embedded Structured Rate Table Rendered in Live B2B Feed Post</figcaption>
</figure>
<figure class="fig-center">
  <img src="images/diagram-reverse-auction-lifecycle.png" alt="Reverse Container Auction Lifecycle" />
  <figcaption>Figure: Step-by-Step Reverse Container Tender Lifecycle</figcaption>
</figure>`;

  const pEncyclopedia = readMarkdown(path.join(handbooksDir, '01_PRODUCT_FEATURE_ENCYCLOPEDIA.md'));
  if (pEncyclopedia) {
    vol2Body += '\n' + markdownToXhtml(pEncyclopedia);
  }

  vol2Body += `
<figure class="fig-center">
  <img src="images/verified-notifications-desktop.png" alt="Interactive Global Notification Center" />
  <figcaption>Figure: Interactive Global Notification Center Popover with Category Tabs</figcaption>
</figure>`;

  chapters.push({
    id: 'vol2',
    title: 'Volume 2: Product Intelligence & Operational Encyclopedia',
    filename: 'vol2.xhtml',
    content: buildXhtmlPage('Volume 2: Product Intelligence', vol2Body),
  });

  // Remaining Volumes 3 to 9
  const remainingVolumes = [
    {
      id: 'vol3',
      title: 'Volume 3: Strategic Adoption Frameworks for Freight Forwarders',
      volTitle: 'VOLUME 3: STRATEGIC ADOPTION FRAMEWORKS FOR FREIGHT FORWARDERS',
      file: path.join(handbooksDir, '02_FREIGHT_FORWARDER_ADOPTION_GUIDE.md'),
      diagram: null,
    },
    {
      id: 'vol4',
      title: 'Volume 4: International Marketing Fundamentals & Channel Strategy',
      volTitle: 'VOLUME 4: INTERNATIONAL MARKETING FUNDAMENTALS & CHANNEL STRATEGY',
      file: path.join(handbooksDir, '03_INTERNATIONAL_MARKETING_STRATEGY.md'),
      diagram: 'diagram-marketing-channel-ranking.png',
    },
    {
      id: 'vol5',
      title: 'Volume 5: 90-Day & 180-Day Chronological Execution Calendars',
      volTitle: 'VOLUME 5: 90-DAY & 180-DAY CHRONOLOGICAL EXECUTION CALENDARS & TRACKING TEMPLATES',
      file: path.join(handbooksDir, '04_90_AND_180_DAY_PUBLISHING_CALENDARS.md'),
      diagram: 'diagram-sales-conversion-funnel.png',
    },
    {
      id: 'vol6',
      title: 'Volume 6: Turn-Key Ready-to-Publish Marketing Content Library',
      volTitle: 'VOLUME 6: TURN-KEY READY-TO-PUBLISH MARKETING CONTENT LIBRARY',
      file: path.join(handbooksDir, '05_READY_TO_PUBLISH_CONTENT_LIBRARY.md'),
      diagram: null,
    },
    {
      id: 'vol7',
      title: 'Volume 7: Customer Acquisition Playbook & Consultative Sales',
      volTitle: 'VOLUME 7: INTERNATIONAL CUSTOMER ACQUISITION PLAYBOOK & CONSULTATIVE SALES SCRIPTS',
      file: path.join(handbooksDir, '06_INTERNATIONAL_CUSTOMER_ACQUISITION_PLAYBOOK.md'),
      diagram: null,
    },
    {
      id: 'vol7b',
      title: 'Volume 7 (Part B): Spoken Pitches & 5-Minute Live Demos',
      volTitle: 'VOLUME 7 (PART B): SPOKEN PITCHES, ELEVATOR SCRIPTS & 5-MINUTE LIVE PRODUCT DEMOS',
      file: path.join(handbooksDir, '07_INTERNATIONAL_SALES_PITCH_SCRIPTS.md'),
      diagram: null,
    },
    {
      id: 'vol8',
      title: 'Volume 8: Angel Investor & Venture Capital Handbook',
      volTitle: 'VOLUME 8: ANGEL INVESTOR & VENTURE CAPITAL PRESENTATION HANDBOOK',
      file: path.join(handbooksDir, '08_ANGEL_INVESTOR_AND_VC_HANDBOOK.md'),
      diagram: 'diagram-investor-unit-economics.png',
    },
    {
      id: 'vol9',
      title: 'Volume 9: Maritime Terminology & INCOTERMS 2020 Glossary',
      volTitle: 'VOLUME 9: MARITIME TERMINOLOGY & INCOTERMS 2020 GLOSSARY',
      file: path.join(handbooksDir, '09_FREIGHT_FORWARDING_TERMINOLOGY_GLOSSARY.md'),
      diagram: null,
    },
    {
      id: 'vol9b',
      title: 'Volume 9 (Part B): Master Feature Evidence Register & Codebase Links',
      volTitle: 'VOLUME 9 (PART B): MASTER FEATURE EVIDENCE REGISTER & CODEBASE AUDIT MATRIX',
      file: path.join(productIntelDir, 'FEATURE_EVIDENCE_REGISTER.md'),
      diagram: null,
    },
  ];

  for (const v of remainingVolumes) {
    const md = readMarkdown(v.file);
    if (md) {
      let body = `<h1>${escapeXml(v.volTitle)}</h1>`;
      if (v.diagram) {
        body += `
<figure class="fig-center">
  <img src="images/${v.diagram}" alt="${escapeXml(v.volTitle)}" />
  <figcaption>Figure: ${escapeXml(v.volTitle)}</figcaption>
</figure>`;
      }
      body += '\n' + markdownToXhtml(md);
      chapters.push({
        id: v.id,
        title: v.title,
        filename: `${v.id}.xhtml`,
        content: buildXhtmlPage(v.title, body),
      });
    }
  }

  // Add XHTML Chapters to Zip
  for (const ch of chapters) {
    zip.file(`OEBPS/${ch.filename}`, ch.content);
  }

  // 6. Navigation Document (EPUB 3 nav.xhtml)
  let navHtml = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" xml:lang="en" lang="en">
<head>
  <meta charset="utf-8" />
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="style.css" />
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
`;
  for (const ch of chapters) {
    navHtml += `      <li><a href="${ch.filename}">${escapeXml(ch.title)}</a></li>\n`;
  }
  navHtml += `    </ol>
  </nav>
</body>
</html>`;
  zip.file('OEBPS/nav.xhtml', navHtml);

  // 7. NCX Document (EPUB 2 backward compatibility toc.ncx)
  let ncx = `<?xml version="1.0" encoding="UTF-8"?>
<ncx xmlns="http://www.daisy.org/z3986/2005/ncx/" version="2005-1">
  <head>
    <meta name="dtb:uid" content="urn:uuid:fr8x-global-compendium-2026"/>
    <meta name="dtb:depth" content="1"/>
    <meta name="dtb:totalPageCount" content="0"/>
    <meta name="dtb:maxPageNumber" content="0"/>
  </head>
  <docTitle>
    <text>THE FR8X COMPENDIUM: Global B2B Freight Forwarding Architecture &amp; Marketing</text>
  </docTitle>
  <docAuthor>
    <text>FR8X Engineering &amp; Commercial Directorate</text>
  </docAuthor>
  <navMap>
`;
  chapters.forEach((ch, idx) => {
    ncx += `    <navPoint id="navPoint-${idx + 1}" playOrder="${idx + 1}">
      <navLabel><text>${escapeXml(ch.title)}</text></navLabel>
      <content src="${ch.filename}"/>
    </navPoint>\n`;
  });
  ncx += `  </navMap>
</ncx>`;
  zip.file('OEBPS/toc.ncx', ncx);

  // 8. Package Document (OEBPS/content.opf)
  const modifiedDate = new Date().toISOString().replace(/\.\d+Z$/, 'Z');
  let opf = `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" unique-identifier="BookId" version="3.0">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:fr8x-global-compendium-2026</dc:identifier>
    <dc:title>THE FR8X COMPENDIUM: The Authoritative Master Guide to Global B2B Freight Forwarding Architecture, Digital Exchange Operations, International Marketing, and Venture Growth</dc:title>
    <dc:creator>FR8X Engineering &amp; Commercial Directorate</dc:creator>
    <dc:publisher>FR8X Freight Exchange</dc:publisher>
    <dc:language>en</dc:language>
    <dc:rights>Copyright © 2026 FR8X. Confidential &amp; Proprietary.</dc:rights>
    <meta property="dcterms:modified">${modifiedDate}</meta>
  </metadata>
  <manifest>
    <item id="style" href="style.css" media-type="text/css"/>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="ncx" href="toc.ncx" media-type="application/x-dtbncx+xml"/>
`;

  for (const ch of chapters) {
    opf += `    <item id="${ch.id}" href="${ch.filename}" media-type="application/xhtml+xml"/>\n`;
  }

  for (const imgName of imageFiles) {
    const idSafe = imgName.replace(/[^a-zA-Z0-9_-]/g, '_');
    opf += `    <item id="img-${idSafe}" href="images/${imgName}" media-type="image/png"/>\n`;
  }

  opf += `  </manifest>
  <spine toc="ncx">
`;
  for (const ch of chapters) {
    opf += `    <itemref idref="${ch.id}"/>\n`;
  }
  opf += `  </spine>
  <guide>
    <reference type="cover" title="Cover" href="cover.xhtml"/>
    <reference type="toc" title="Table of Contents" href="toc.xhtml"/>
  </guide>
</package>`;
  zip.file('OEBPS/content.opf', opf);

  // 9. Generate and Write .epub Archive
  console.log('Generating EPUB buffer with uncompressed STORE mimetype...');
  const epubBuffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: {
      level: 9,
    },
    mimeType: 'application/epub+zip',
  });

  const masterEpubPath = path.join(outputDir, 'FR8X_GLOBAL_MARKETING_AND_BUSINESS_INTELLIGENCE_COMPENDIUM.epub');
  fs.writeFileSync(masterEpubPath, epubBuffer);
  console.log(`✓ Master EPUB successfully created: ${masterEpubPath} (${(epubBuffer.length / (1024 * 1024)).toFixed(2)} MB)`);

  const rootEpubPath = path.join(__dirname, '..', 'marketing', 'FR8X_GLOBAL_MARKETING_AND_BUSINESS_INTELLIGENCE_COMPENDIUM.epub');
  fs.writeFileSync(rootEpubPath, epubBuffer);
  console.log(`✓ Copied directly to marketing root: ${rootEpubPath}`);
}

buildMasterEpub().catch(console.error);
