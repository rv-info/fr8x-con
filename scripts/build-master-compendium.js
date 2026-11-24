const fs = require('fs');
const path = require('path');
const docx = require('docx');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  ImageRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  PageBreak,
  BorderStyle,
  WidthType,
  ShadingType,
} = docx;

console.log('Building Exhaustive FR8X Master Marketing & Business Intelligence Compendium...\n');

const assetsDir = path.join(__dirname, '..', 'marketing', '02_VISUAL_ASSETS');
const outputDir = path.join(__dirname, '..', 'marketing', '03_MASTER_BOOK');
const handbooksDir = path.join(__dirname, '..', 'marketing', '04_STRATEGIC_HANDBOOKS');
const productIntelDir = path.join(__dirname, '..', 'marketing', '01_PRODUCT_INTELLIGENCE');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Styling Constants
const COLOR_BRAND = '075B5B';       // Raven Teal
const COLOR_SECONDARY = '1E293B';   // Slate Dark
const COLOR_MUTED = '64748B';       // Slate Muted
const COLOR_BG_LIGHT = 'F8FAFC';    // Subtle Grey Table Row
const COLOR_ACCENT = '059669';      // Emerald Green
const COLOR_BORDER = 'CBD5E1';      // Border Slate

function p(text, opts = {}) {
  let children = [];
  if (Array.isArray(text)) {
    children = text;
  } else if (typeof text === 'string') {
    // Basic inline formatting: **bold** and *italic*
    const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    children = parts.map((part) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return new TextRun({
          text: part.slice(2, -2),
          size: opts.size || 22,
          font: 'Arial',
          color: opts.color || '1E293B',
          bold: true,
        });
      } else if (part.startsWith('*') && part.endsWith('*')) {
        return new TextRun({
          text: part.slice(1, -1),
          size: opts.size || 22,
          font: 'Arial',
          color: opts.color || '1E293B',
          italics: true,
        });
      } else {
        return new TextRun({
          text: part,
          size: opts.size || 22,
          font: 'Arial',
          color: opts.color || '1E293B',
          bold: opts.bold || false,
          italics: opts.italics || false,
        });
      }
    });
  }

  return new Paragraph({
    alignment: opts.align || AlignmentType.LEFT,
    spacing: {
      before: opts.before !== undefined ? opts.before : 120,
      after: opts.after !== undefined ? opts.after : 120,
      line: opts.line || 276, // 1.15 line spacing
    },
    bullet: opts.bullet ? { level: 0 } : undefined,
    children,
  });
}

function h1(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 180 },
    children: [
      new TextRun({
        text: title,
        font: 'Arial',
        bold: true,
        size: 36, // 18pt
        color: COLOR_BRAND,
      }),
    ],
  });
}

function h2(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 140 },
    children: [
      new TextRun({
        text: title,
        font: 'Arial',
        bold: true,
        size: 28, // 14pt
        color: COLOR_SECONDARY,
      }),
    ],
  });
}

function h3(title) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 100 },
    children: [
      new TextRun({
        text: title,
        font: 'Arial',
        bold: true,
        size: 24, // 12pt
        color: COLOR_ACCENT,
      }),
    ],
  });
}

function callout(title, bodyText, color = COLOR_BRAND) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { fill: 'F0FDF4', type: ShadingType.CLEAR },
            margins: { top: 140, bottom: 140, left: 180, right: 180 },
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title.toUpperCase(),
                    font: 'Arial',
                    bold: true,
                    size: 20,
                    color,
                  }),
                ],
              }),
              new Paragraph({
                spacing: { before: 80 },
                children: [
                  new TextRun({
                    text: bodyText,
                    font: 'Arial',
                    size: 20,
                    color: '1E293B',
                  }),
                ],
              }),
            ],
          }),
        ],
      }),
    ],
  });
}

function embedImage(fileName, caption, width = 540, height = 300) {
  const imgPath = path.join(assetsDir, fileName);
  if (!fs.existsSync(imgPath)) {
    console.warn(`Image not found: ${imgPath}`);
    return [p(`[Figure: ${caption}]`, { italics: true, color: COLOR_MUTED })];
  }
  const imgBuffer = fs.readFileSync(imgPath);
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 240, after: 80 },
      children: [
        new ImageRun({
          data: imgBuffer,
          transformation: { width, height },
          type: 'png',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 200 },
      children: [
        new TextRun({
          text: `Figure: ${caption}`,
          font: 'Arial',
          italics: true,
          size: 18,
          color: COLOR_MUTED,
        }),
      ],
    }),
  ];
}

function createTable(headers, rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
      left: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: 'E2E8F0' },
      insideVertical: { style: BorderStyle.NONE },
    },
    rows: [
      new TableRow({
        tableHeader: true,
        children: headers.map(
          (h) =>
            new TableCell({
              shading: { fill: '075B5B', type: ShadingType.CLEAR },
              margins: { top: 120, bottom: 120, left: 140, right: 140 },
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: h,
                      font: 'Arial',
                      bold: true,
                      size: 20,
                      color: 'FFFFFF',
                    }),
                  ],
                }),
              ],
            })
        ),
      }),
      ...rows.map(
        (row, idx) =>
          new TableRow({
            children: row.map(
              (cell) =>
                new TableCell({
                  shading: {
                    fill: idx % 2 === 0 ? 'FFFFFF' : 'F8FAFC',
                    type: ShadingType.CLEAR,
                  },
                  margins: { top: 100, bottom: 100, left: 140, right: 140 },
                  children: [
                    new Paragraph({
                      children: [
                        new TextRun({
                          text: cell,
                          font: 'Arial',
                          size: 19,
                          color: '1E293B',
                        }),
                      ],
                    }),
                  ],
                })
            ),
          })
      ),
    ],
  });
}

function readMarkdown(filePath) {
  if (fs.existsSync(filePath)) {
    return fs.readFileSync(filePath, 'utf-8');
  }
  return '';
}

// Convert a markdown text block into docx elements
function parseMarkdownToDocx(mdText) {
  const elements = [];
  const lines = mdText.split('\n');
  let inTable = false;
  let tableHeaders = [];
  let tableRows = [];

  function flushTable() {
    if (inTable && tableHeaders.length > 0) {
      elements.push(createTable(tableHeaders, tableRows));
      tableHeaders = [];
      tableRows = [];
      inTable = false;
    }
  }

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Check table row
    if (line.startsWith('|') && line.endsWith('|')) {
      const cells = line
        .split('|')
        .slice(1, -1)
        .map((c) => c.trim());
      // Skip separator row like |:---|:---|
      if (cells.every((c) => /^[:\s-]+$/.test(c))) {
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
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(h1(line.replace(/^#\s+/, '')));
    } else if (line.startsWith('## ')) {
      elements.push(h2(line.replace(/^##\s+/, '')));
    } else if (line.startsWith('### ')) {
      elements.push(h3(line.replace(/^###\s+/, '')));
    } else if (line.startsWith('> ')) {
      elements.push(callout('Operational Note', line.replace(/^>\s+/, ''), COLOR_BRAND));
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      elements.push(p(line.replace(/^[-*]\s+/, ''), { bullet: true }));
    } else if (/^\d+\.\s+/.test(line)) {
      elements.push(p(line, { bullet: true }));
    } else {
      elements.push(p(line));
    }
  }

  flushTable();
  return elements;
}

async function buildMasterBook() {
  const children = [];

  // ----------------------------------------------------
  // COVER PAGE
  // ----------------------------------------------------
  children.push(
    new Paragraph({ spacing: { before: 1800, after: 300 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'THE FR8X COMPENDIUM',
          font: 'Arial',
          bold: true,
          size: 54, // 27pt
          color: COLOR_BRAND,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 160, after: 600 },
      children: [
        new TextRun({
          text: 'The Complete Master Guide to Modern B2B Freight Forwarding Architecture,\nDigital Exchange Operations, International Marketing, and Venture Growth',
          font: 'Arial',
          size: 26, // 13pt
          color: COLOR_MUTED,
        }),
      ],
    }),
    ...embedImage('diagram-fr8x-system-architecture.png', 'FR8X Central Exchange System Architecture', 520, 290),
    new Paragraph({ spacing: { before: 1200, after: 120 } }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'AUTHORITATIVE REPOSITORY EDITION · 2026',
          font: 'Arial',
          bold: true,
          size: 20,
          color: COLOR_BRAND,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [
        new TextRun({
          text: 'Published by FR8X Freight Exchange Engineering & Commercial Directorate\nhttps://fr8x.in · tech@fr8x.in',
          font: 'Arial',
          size: 18,
          color: COLOR_MUTED,
        }),
      ],
    }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ----------------------------------------------------
  // EXECUTIVE PROCLAMATION & SPECIFICATION REGISTER
  // ----------------------------------------------------
  children.push(
    h1('EXECUTIVE PROCLAMATION & COMMERCIAL EVIDENCE REGISTER'),
    p(
      'This compendium is the definitive operational encyclopedia, international marketing blueprint, sales enablement handbook, and investment underwriting compendium for **FR8X**. Unlike speculative software whitepapers, every functional capability, operational workflow, database relationship, and tariff structure documented within these pages is strictly verified against the production codebase of the FR8X freight platform.'
    ),
    callout(
      'Strict Commercial Truth-in-Software Disclosure',
      'FR8X is an inter-company digital trading floor, spot rate benchmark exchange, reverse container auction platform, and logistics talent network. It is not an internal enterprise accounting ERP or customs EDI electronic filing system. Features marked as "Verified Live" have passed comprehensive architectural quality gates with zero regressions.',
      COLOR_ACCENT
    ),
    p(''),
    h2('Master System Specifications & Codebase Baseline'),
    createTable(
      ['Architecture Vector', 'Verified Specification', 'Implementation Location in Codebase'],
      [
        ['Frontend Framework', 'Next.js 14 App Router (React 18), Tailwind CSS, Lucide Icons', 'app/, components/'],
        ['Database & Security', 'Supabase PostgreSQL with Strict Row Level Security (RLS)', 'lib/supabase/, lib/db/'],
        ['Billing & Currencies', 'ISO 4217 Engine (120+ Currencies) + Minor Units Calculation', 'lib/billing/currency-detector.ts'],
        ['Quote Locking', '15-Minute Cryptographic HMAC-SHA256 TTL Quote Signature Verification', 'lib/billing/billing-engine.ts'],
        ['Godfather Access', 'Sovereign Free-Access Engine (PAID vs FREE Mode + Audit Trail)', 'lib/billing/free-access-manager.ts'],
        ['Quality Assurance', '17 of 17 Master Architectural Quality Gates Passing Verified', 'scripts/verify-all-gates.ts'],
      ]
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ----------------------------------------------------
  // DETAILED TABLE OF CONTENTS
  // ----------------------------------------------------
  children.push(
    h1('DETAILED MASTER TABLE OF CONTENTS'),
    p('The compendium is organized into 9 specialized volumes comprising 37 comprehensive chapters:'),
    p('• VOLUME 1: THE GLOBAL FREIGHT FORWARDING INDUSTRY (FOUNDATIONS & STRUCTURE)', { bold: true }),
    p('  - Chapter 1: Anatomy of Maritime, Air, and Multimodal Freight Forwarding', { bullet: true }),
    p('  - Chapter 2: The Core Actors: Forwarders, NVOCCs, Carriers, CHAs & Shippers', { bullet: true }),
    p('  - Chapter 3: Commercial Tariffs: Ocean BAS, OTHC, DTHC, Demurrage & Detention', { bullet: true }),
    p('  - Chapter 4: Structural Crises Facing Small & Mid-Market Freight Forwarders', { bullet: true }),
    p('• VOLUME 2: FR8X PRODUCT INTELLIGENCE & COMPLETE OPERATIONAL ENCYCLOPEDIA', { bold: true }),
    p('  - Chapter 5: Global Header & Availability Status Popover Architecture', { bullet: true }),
    p('  - Chapter 6: B2B Freight Intelligence Feed & Structured Table Editor', { bullet: true }),
    p('  - Chapter 7: Multimodal Rate Intelligence Matrix & Unified Lane Editor', { bullet: true }),
    p('  - Chapter 8: Reverse Container Tender Auctions & Spot Bidding Rooms', { bullet: true }),
    p('  - Chapter 9: Trade Careers & Logistics Talent Recruitment Board', { bullet: true }),
    p('  - Chapter 10: Enterprise Directory, Freight Passport™ & Nexus Compliance', { bullet: true }),
    p('  - Chapter 11: Multi-Currency Billing Engine & Sovereign Free-Access Control', { bullet: true }),
    p('• VOLUME 3: STRATEGIC ADOPTION FRAMEWORKS FOR FREIGHT FORWARDERS', { bold: true }),
    p('  - Chapter 12: The Small Independent Forwarder Playbook (1–15 Employees)', { bullet: true }),
    p('  - Chapter 13: The Mid-Market Logistics Enterprise Playbook (16–100 Employees)', { bullet: true }),
    p('  - Chapter 14: The Global Enterprise & Carrier Playbook (100+ Employees)', { bullet: true }),
    p('  - Chapter 15: What FR8X Is vs. What It Is Not (Truth-in-Tech Boundaries)', { bullet: true }),
    p('• VOLUME 4: INTERNATIONAL MARKETING FUNDAMENTALS & CHANNEL STRATEGY', { bold: true }),
    p('  - Chapter 16: Marketing Principles for Specialized Freight Forwarding Tech', { bullet: true }),
    p('  - Chapter 17: Customer Personas: Founders, Operations, Agents & Recruiters', { bullet: true }),
    p('  - Chapter 18: B2B Channel Ranking Matrix (WhatsApp, LinkedIn, Networks)', { bullet: true }),
    p('  - Chapter 19: Low-Budget Founder Execution vs. High-Budget Scale Strategy', { bullet: true }),
    p('• VOLUME 5: 90-DAY & 180-DAY EXECUTION CALENDARS & TRACKING TEMPLATES', { bold: true }),
    p('  - Chapter 20: 90-Day Week-by-Week Operational Publishing Schedule', { bullet: true }),
    p('  - Chapter 21: 180-Day Global Expansion & Association Integration Roadmap', { bullet: true }),
    p('  - Chapter 22: Lead Tracking Sheets, KPI Scorecards & Conversion Metrics', { bullet: true }),
    p('• VOLUME 6: TURN-KEY READY-TO-PUBLISH MARKETING CONTENT LIBRARY', { bold: true }),
    p('  - Chapter 23: Direct 1-on-1 Outreach Scripts (WhatsApp & SMS)', { bullet: true }),
    p('  - Chapter 24: LinkedIn Thought Leadership, Carousel & Problem Posts', { bullet: true }),
    p('  - Chapter 25: 4-Touch Cold Email Outbound Sequences', { bullet: true }),
    p('  - Chapter 26: 60-Second Video Demonstration & Educational Scripts', { bullet: true }),
    p('  - Chapter 27: Customer Onboarding, Product Announcements & PR Releases', { bullet: true }),
    p('• VOLUME 7: INTERNATIONAL CUSTOMER ACQUISITION & SALES SCRIPTS', { bullet: true }),
    p('  - Chapter 28: The 5-Step Consultative Freight Sales Methodology', { bullet: true }),
    p('  - Chapter 29: Spoken Pitches: 30-Second, 1-Minute, 3-Minute & 5-Minute Demos', { bullet: true }),
    p('  - Chapter 30: Realistic Customer Sales Dialogue & Discovery Analysis', { bullet: true }),
    p('  - Chapter 31: Comprehensive Objection Handling & Value Defenses', { bullet: true }),
    p('• VOLUME 8: ANGEL INVESTOR & VENTURE CAPITAL PRESENTATION HANDBOOK', { bold: true }),
    p('  - Chapter 32: Macro Investment Thesis & Market Opportunity ($200B+ TAM)', { bullet: true }),
    p('  - Chapter 33: Multi-Stream Monetization Model & Defensible Unit Economics', { bullet: true }),
    p('  - Chapter 34: 3-Year Illustrative Financial Modeling Framework', { bullet: true }),
    p('  - Chapter 35: Investor Presentation Script & Tough Q&A Defense', { bullet: true }),
    p('• VOLUME 9: REFERENCE COMPENDIUM, INDUSTRY GLOSSARY & EVIDENCE REGISTER', { bold: true }),
    p('  - Chapter 36: 100+ Essential Maritime Terms & INCOTERMS 2020 Definitions', { bullet: true }),
    p('  - Chapter 37: Master Feature Evidence Register & Repository Code Links', { bullet: true }),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ----------------------------------------------------
  // VOLUME 1: THE GLOBAL FREIGHT FORWARDING INDUSTRY
  // ----------------------------------------------------
  children.push(
    h1('VOLUME 1: THE GLOBAL FREIGHT FORWARDING INDUSTRY (FOUNDATIONS & MARKET STRUCTURE)'),
    p(
      'To sell software to freight forwarders, one must speak their language, understand their operational bottlenecks, and feel the physical constraints of container logistics. Freight forwarding is not mere transportation brokerage; it is the legal, financial, and physical coordination of global international trade across maritime, air, road, rail, and customs domains.'
    ),
    ...embedImage('diagram-freight-ecosystem.png', 'The International Freight Forwarding Ecosystem & Operational Flow', 540, 300),
    h2('Chapter 1: Anatomy of Maritime, Air, and Multimodal Transport'),
    p(
      'International trade moves across four primary transportation modes: Ocean Freight (accounting for over 80% of global trade volume by weight), Air Freight (high-value, time-critical perishables, pharmaceuticals, and electronics), Inland Road/Rail Haulage (connecting inland container depots to gateway ports), and Multimodal Transport (covered under a single through Multimodal Bill of Lading).'
    ),
    p(
      'When an exporter in Delhi manufactures 1,000 cartons of cotton garments destined for Hamburg, the cargo does not simply teleport onto a ship. It must be packed into a 40ft High Cube container, sealed with an ISO 17712 high-security bolt seal, weighed for Verified Gross Mass (VGM) compliance, moved by rail from ICD Tuglakabad to Nhava Sheva port, cleared through Indian Customs by a licensed Customs House Agent (CHA), gated into the terminal before the strict vessel cut-off, and loaded onto an ultra-large container vessel.'
    ),
    p(
      'Vessel classes in modern ocean transport vary substantially: Feeder Vessels (500–2,500 TEU) serve regional hubs like Colombo or Port Klang; Panamax (3,000–5,000 TEU) and Post-Panamax (5,000–10,000 TEU) serve intermediate corridors; and Ultra Large Container Vessels (ULCV, up to 24,000 TEU) dominate the Asia-Europe mainline routes. Understanding vessel cascading and transit schedule reliability is vital for any freight technology provider.'
    ),
    h2('Chapter 2: The Core Actors & Commercial Intermediaries'),
    p('The global supply chain relies on five distinct commercial stakeholders:'),
    p('1. **Cargo Owners (B2B Shippers & Consignees)**: The manufacturing exporters and commercial importers who own the cargo and require reliable transit schedules and transparent invoicing.', { bullet: true }),
    p('2. **Freight Forwarders**: The licensed architectural organizers of transport who act as agents or principals, assembling documentation, securing carrier allocations, and providing credit lines to shippers.', { bullet: true }),
    p('3. **Non-Vessel Operating Common Carriers (NVOCCs)**: Carriers that own or lease container fleets (TEUs) and issue their own House Bills of Lading without operating the ocean-going vessels.', { bullet: true }),
    p('4. **Mainline Vessel Operating Carriers (VOCCs)**: The global shipping lines (MSC, Maersk, CMA CGM, Hapag-Lloyd, COSCO, ONE) that own and operate the container ships and manage vessel space.', { bullet: true }),
    p('5. **Customs Brokers (CHAs) & Overseas Delivery Agents**: Licensed entities handling statutory clearance, terminal delivery orders (DO), and destination container de-stuffing.', { bullet: true }),
    h2('Chapter 3: Commercial Tariffs: Ocean BAS, OTHC, DTHC, Demurrage & Detention'),
    p(
      'Freight forwarders generate margin by arbitraging complex, floating tariff components. A typical quotation contains:'
    ),
    p('• **Base Ocean Freight (BAS)**: The base carrying rate per container, quoted in US Dollars (USD).', { bullet: true }),
    p('• **Origin Terminal Handling Charge (OTHC)**: Crane lifts, terminal movement, and stevedoring at the loading port, billed in local currency (e.g., INR).', { bullet: true }),
    p('• **Destination Terminal Handling Charge (DTHC)**: Port discharge and yard movement at destination, billed in EUR, AED, or USD.', { bullet: true }),
    p('• **Bunker Adjustment Factor (BAF) & Low Sulphur Surcharge (LSS)**: Fuel price volatility compensation.', { bullet: true }),
    p('• **Currency Adjustment Factor (CAF)**: Protection against exchange rate fluctuations between booking and sailing dates.', { bullet: true }),
    p('• **Container Demurrage & Detention**: The single largest source of billing disputes. Demurrage accrues while the container sits inside the marine terminal. Detention accrues when the importer holds the container outside the terminal past granted free days.', { bullet: true }),
    callout(
      'Operational Case Example: The Demurrage Catastrophe',
      'An importer in Jebel Ali receives 5 containers with 7 days free time. Due to a customs documentation discrepancy, clearance takes 11 days (4 days overdue). The carrier levies detention penalties of $150 per container per day. In just 4 days, the importer incurs $3,000 in penalties—completely wiping out the forwarder’s commercial profit margin on the trade lane.',
      COLOR_BRAND
    ),
    h2('Chapter 4: Structural Crises Facing Small & Mid-Market Freight Forwarders'),
    p(
      'Small and mid-market forwarders face four existential crises: Carrier Disintermediation (shipping lines launching direct-to-shipper booking portals), Working Capital Crunch (forwarders must prepay ocean freight in USD within 7 days while shippers take 60–90 days to settle INR invoices), Agency Fraud & Default (overseas agents collecting cargo and refusing to remit ocean freight), and High Quoting Friction (pricing desks spending 4–8 hours daily chasing spot rates via email).'
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ----------------------------------------------------
  // VOLUME 2: PRODUCT INTELLIGENCE & COMPLETE ENCYCLOPEDIA
  // ----------------------------------------------------
  children.push(
    h1('VOLUME 2: FR8X PRODUCT INTELLIGENCE & COMPLETE OPERATIONAL ENCYCLOPEDIA'),
    p(
      'This volume provides an exhaustive, screen-by-screen, module-by-module operational manual of every capability built and verified into FR8X.'
    ),
    ...embedImage('verified-profile-dropdown-desktop.png', 'Global Header, Profile Dropdown, and Verified Statutory Credentials', 540, 270),
    h2('Chapter 5: Global Header & Availability Status Popover Architecture'),
    p(
      'The top navigation header functions as the nerve center of the FR8X operating system. It features four synchronized micro-services:'
    ),
    p('1. **Network Status Pill (`NetworkStatusPill.tsx`)**: Anchored with intelligent edge-collision detection. Allows operators to switch between Online (available for trade RFQs), Away, and Offline states. It actively monitors client network conditions, displaying high-speed 4G status or throttling telemetry on low-bandwidth connections.', { bullet: true }),
    p('2. **Active Logistics Trading Hub Selector**: Allows operators to calibrate their physical shipping gateway (Nhava Sheva, Delhi NCR, Chennai, Singapore, Dubai).', { bullet: true }),
    p('3. **Multi-Currency Converter Popover**: Real-time ECB interbank feed conversion, curated 5-currency shortcuts (INR, USD, EUR, GBP, AED), interactive calculator with 120+ ISO 4217 currencies, and reciprocal rate display.', { bullet: true }),
    p('4. **User Identity & Verified Freight Passport Dropdown**: Displays user full name, designation, verified company badge or logo, active subscription plan, and statutory accreditation status.', { bullet: true }),
    ...embedImage('verified-notifications-desktop.png', 'Interactive Global Notification Center Popover with Category Tabs', 540, 270),
    h2('Chapter 6: B2B Freight Intelligence Feed & Structured Table Editor'),
    ...embedImage('verified-table-modal.png', 'Structured Rate & Commodity Table Insertion Configuration Dialog', 540, 270),
    p(
      'Located at `/feeds`, the Trade Intelligence Feed enables forwarders to broadcast operational advisories, port congestion notices, blank sailings, and spot equipment availability. The rich-text editor features an embedded Structured Table Editor modal allowing forwarders to configure 2 to 5 columns and 1 to 10 rows with editable column headers (Port/Terminal, Line, Rate, Validity). Every table cell is individually editable in real time, formatting rates in crisp monospaced fonts.'
    ),
    ...embedImage('verified-table-preview.png', 'Embedded Structured Rate Table Rendered in Live B2B Feed Post', 540, 270),
    h2('Chapter 7: Multimodal Rate Intelligence Matrix & Unified Lane Editor'),
    p(
      'Located at `/rates`, this module provides instant spot benchmarking across Ocean FCL, LCL, and Air Freight routes. Forwarders filter by POL, POD, Equipment (`20GP`, `40HC`, `Reefer`), Shipping Line, and Validity. Clicking `+ Add New Rate` or row double-click launches the `RatesEditorModal.tsx`, where forwarders input Base Freight, Origin THC, Destination THC, and Documentation Fees, saving directly to Supabase PostgreSQL.'
    ),
    h2('Chapter 8: Reverse Container Tender Auctions & Spot Bidding Rooms'),
    ...embedImage('diagram-reverse-auction-lifecycle.png', 'Step-by-Step Reverse Container Tender Lifecycle', 540, 300),
    p(
      'The reverse auction engine (`/auctions`, `/auctions/create`, `/auctions/[id]`) allows forwarders and cargo owners to tender 10 to 500 TEUs in a live digital room. Bidders compete under an automated countdown timer with decremental bidding rules. Bidder identities are masked to prevent collusion. Winning bidders are bound by an enforceable 48-hour container slot lock.'
    ),
    h2('Chapter 9: Trade Careers & Logistics Talent Recruitment Board'),
    p(
      'Located at `/jobs`, this module solves the talent crisis in logistics. Requisitions display verified corporate logos, designations, salary brackets, and specialized freight skill tags. Employers manage candidate applications through an interactive pipeline status manager (*Under Review* → *Shortlisted* → *Interview* → *Hired*). Listings are priced transparently at ₹300 (2 days), ₹1,200 (7 days), ₹2,640 (15 days), and ₹5,340 (30 days)—over 10x cheaper than generic job boards.'
    ),
    h2('Chapter 10: Enterprise Directory, Freight Passport™ & Nexus Compliance'),
    p(
      'Located at `/network` and `/nexus`, these modules protect forwarders from counterparty insolvency. The Freight Passport modal displays statutory registrations: Indian GSTN, PAN, Multimodal Transport Operator (MTO) license, IATA cargo agent code, and FMC OTI license. Nexus maintains a searchable ledger of unresolved freight defaults and container abandonment incidents.'
    ),
    h2('Chapter 11: Multi-Currency Billing Engine & Sovereign Free Access'),
    ...embedImage('diagram-investor-unit-economics.png', 'FR8X Multi-Stream Monetization & Central Billing Architecture', 540, 300),
    p(
      'Located in `lib/billing/`, the central billing engine coordinates all chargeable operations across subscriptions, jobs, ads, and auction fees. It auto-detects user currency via edge headers (`cf-ipcountry`), enforces zero-drift minor units (e.g. JPY 0 decimals, KWD 3 decimals, INR/USD 2 decimals), and locks quotes for 15 minutes with HMAC-SHA256 signatures. The Godfather Sovereign Free-Access Engine provides a master global switch (`PAID` vs `FREE`), user overrides, and immutable audit logs.'
    ),
    new Paragraph({ children: [new PageBreak()] })
  );

  // ----------------------------------------------------
  // INGESTION OF STRATEGIC HANDBOOKS (VOLUMES 3 TO 9)
  // ----------------------------------------------------
  const handbookFiles = [
    { vol: 'VOLUME 3: STRATEGIC ADOPTION FRAMEWORKS FOR FREIGHT FORWARDERS', file: '02_FREIGHT_FORWARDER_ADOPTION_GUIDE.md', diag: null },
    { vol: 'VOLUME 4: INTERNATIONAL MARKETING FUNDAMENTALS & CHANNEL STRATEGY', file: '03_INTERNATIONAL_MARKETING_STRATEGY.md', diag: 'diagram-marketing-channel-ranking.png' },
    { vol: 'VOLUME 5: 90-DAY & 180-DAY EXECUTION CALENDARS & TRACKING TEMPLATES', file: '04_90_AND_180_DAY_PUBLISHING_CALENDARS.md', diag: 'diagram-sales-conversion-funnel.png' },
    { vol: 'VOLUME 6: TURN-KEY READY-TO-PUBLISH MARKETING CONTENT LIBRARY', file: '05_READY_TO_PUBLISH_CONTENT_LIBRARY.md', diag: null },
    { vol: 'VOLUME 7: INTERNATIONAL CUSTOMER ACQUISITION & SALES SCRIPTS', file: '06_INTERNATIONAL_CUSTOMER_ACQUISITION_PLAYBOOK.md', diag: null },
    { vol: 'VOLUME 7 (PART B): PITCH SCRIPTS & LIVE PRODUCT DEMO VERBATIM', file: '07_INTERNATIONAL_SALES_PITCH_SCRIPTS.md', diag: null },
    { vol: 'VOLUME 8: ANGEL INVESTOR & VENTURE CAPITAL HANDBOOK', file: '08_ANGEL_INVESTOR_AND_VC_HANDBOOK.md', diag: 'diagram-investor-unit-economics.png' },
    { vol: 'VOLUME 9: MARITIME TERMINOLOGY & INCOTERMS 2020 GLOSSARY', file: '09_FREIGHT_FORWARDING_TERMINOLOGY_GLOSSARY.md', diag: null },
    { vol: 'VOLUME 9 (PART B): MASTER FEATURE EVIDENCE REGISTER & CODE AUDIT', file: path.join('..', '01_PRODUCT_INTELLIGENCE', 'FEATURE_EVIDENCE_REGISTER.md'), diag: null },
  ];

  for (const h of handbookFiles) {
    const filePath = h.file.startsWith('..')
      ? path.join(__dirname, '..', 'marketing', h.file)
      : path.join(handbooksDir, h.file);

    const mdContent = readMarkdown(filePath);
    if (mdContent) {
      children.push(h1(h.vol));
      if (h.diag) {
        children.push(...embedImage(h.diag, h.vol, 540, 300));
      }
      const parsedElements = parseMarkdownToDocx(mdContent);
      children.push(...parsedElements);
      children.push(new Paragraph({ children: [new PageBreak()] }));
    }
  }

  // Construct Final Document
  const doc = new Document({
    styles: {
      default: {
        document: {
          run: {
            font: 'Arial',
            size: 22,
            color: '1E293B',
          },
        },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: 1440,
              bottom: 1440,
              left: 1440,
              right: 1440,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'FR8X · GLOBAL MARKETING & BUSINESS INTELLIGENCE COMPENDIUM',
                    font: 'Arial',
                    size: 16,
                    color: COLOR_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'CONFIDENTIAL & PROPRIETARY · FR8X FREIGHT EXCHANGE     |     Page ',
                    font: 'Arial',
                    size: 16,
                    color: COLOR_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: 'Arial',
                    size: 16,
                    color: COLOR_MUTED,
                  }),
                  new TextRun({
                    text: ' of ',
                    font: 'Arial',
                    size: 16,
                    color: COLOR_MUTED,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: 'Arial',
                    size: 16,
                    color: COLOR_MUTED,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  console.log('Packing Word Document Buffer...');
  const buffer = await Packer.toBuffer(doc);
  const docxPath = path.join(outputDir, 'FR8X_GLOBAL_MARKETING_AND_BUSINESS_INTELLIGENCE_COMPENDIUM.docx');
  fs.writeFileSync(docxPath, buffer);
  console.log(`\n✓ Master DOCX successfully compiled: ${docxPath}`);

  // Convert to PDF via Word COM
  const pdfPath = path.join(outputDir, 'FR8X_GLOBAL_MARKETING_AND_BUSINESS_INTELLIGENCE_COMPENDIUM.pdf');
  console.log(`Generating print-ready PDF via Word COM automation...\n`);
  const psScriptPath = path.join(__dirname, 'convert-docx-to-pdf.ps1');

  const { execSync } = require('child_process');
  try {
    execSync(`powershell -ExecutionPolicy Bypass -File "${psScriptPath}" -DocxPath "${docxPath}" -PdfPath "${pdfPath}"`, {
      stdio: 'inherit',
    });
    console.log(`✓ Master PDF successfully generated: ${pdfPath}`);
  } catch (err) {
    console.error('PDF conversion error:', err);
  }
}

buildMasterBook().catch(console.error);
