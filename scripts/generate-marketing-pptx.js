const fs = require('fs');
const path = require('path');
const pptxgen = require('pptxgenjs');

const outputDir = path.join(__dirname, '..', 'marketing', '05_PRESENTATIONS');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Brand Colors
const TEAL = '075B5B';
const DARK_SLATE = '1E293B';
const MUTED_SLATE = '64748B';
const LIGHT_BG = 'F8FAFC';
const WHITE = 'FFFFFF';
const EMERALD = '059669';
const AMBER = 'D97706';

async function generateInvestorDeck() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'FR8X Investor Presentation Deck';
  pptx.author = 'FR8X Freight Exchange Private Limited';

  // Helper for slide base
  function createStandardSlide(title, subtitle) {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };

    // Top Header Banner
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 1.1,
      fill: { color: TEAL },
    });

    slide.addText(title, {
      x: 0.6,
      y: 0.15,
      w: 12.0,
      h: 0.45,
      fontSize: 22,
      fontFace: 'Arial',
      color: WHITE,
      bold: true,
    });

    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.6,
        y: 0.62,
        w: 12.0,
        h: 0.35,
        fontSize: 13,
        fontFace: 'Arial',
        color: 'A7F3D0',
      });
    }

    // Bottom Footer
    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 7.15,
      w: '100%',
      h: 0.35,
      fill: { color: WHITE },
      line: { color: 'E2E8F0', width: 1 },
    });

    slide.addText('FR8X FREIGHT EXCHANGE  |  CONFIDENTIAL INVESTOR PRESENTATION  |  https://fr8x.in', {
      x: 0.6,
      y: 7.2,
      w: 9.0,
      h: 0.25,
      fontSize: 9,
      fontFace: 'Arial',
      color: MUTED_SLATE,
    });

    slide.addText('FR8X · 2026', {
      x: 11.5,
      y: 7.2,
      w: 1.2,
      h: 0.25,
      fontSize: 9,
      fontFace: 'Arial',
      color: MUTED_SLATE,
      align: 'right',
    });

    return slide;
  }

  // ----------------------------------------------------
  // SLIDE 1: Title Slide (Full Dark Brand Background)
  // ----------------------------------------------------
  const slide1 = pptx.addSlide();
  slide1.background = { color: TEAL };

  slide1.addText('FR8X FREIGHT EXCHANGE', {
    x: 1.0,
    y: 1.6,
    w: 11.3,
    h: 0.5,
    fontSize: 18,
    fontFace: 'Arial',
    color: '34D399',
    bold: true,
    tracking: 3,
  });

  slide1.addText('The Digital Commercial Trading Floor for Global Freight Forwarders', {
    x: 1.0,
    y: 2.2,
    w: 11.3,
    h: 1.6,
    fontSize: 36,
    fontFace: 'Arial',
    color: WHITE,
    bold: true,
  });

  slide1.addText(
    'Unifying Spot Rate Discovery, Reverse Container Auctions, Verified Counterparty KYC, and Logistics Talent Recruitment',
    {
      x: 1.0,
      y: 4.0,
      w: 11.3,
      h: 0.8,
      fontSize: 18,
      fontFace: 'Arial',
      color: 'E2E8F0',
    }
  );

  slide1.addShape(pptx.ShapeType.line, {
    x: 1.0,
    y: 5.1,
    w: 11.3,
    h: 0,
    line: { color: '059669', width: 2 },
  });

  slide1.addText('Seed & Growth Capital Investment Underwriting Deck  ·  Authoritative Edition 2026', {
    x: 1.0,
    y: 5.4,
    w: 11.3,
    h: 0.4,
    fontSize: 13,
    fontFace: 'Arial',
    color: '94A3B8',
  });

  slide1.addText('Founder & Executive Directorate  |  tech@fr8x.in  |  https://fr8x.in', {
    x: 1.0,
    y: 5.8,
    w: 11.3,
    h: 0.4,
    fontSize: 12,
    fontFace: 'Arial',
    color: 'CBD5E1',
  });

  // ----------------------------------------------------
  // SLIDE 2: The Problem
  // ----------------------------------------------------
  const slide2 = createStandardSlide(
    'THE PROBLEM: $200B MARKET RUNNING ON WHATSAPP & SPREADSHEETS',
    'Independent and Mid-Market Freight Forwarders Face Severe Commercial & Operational Friction'
  );

  const problemCards = [
    {
      title: '4–8 Hour Quoting Latency',
      desc: 'Pricing desks spend half their working day chasing carriers and co-loaders via fragmented emails and WhatsApp for non-binding spot rates.',
      icon: '⏱️',
    },
    {
      title: 'High Tender Loss in Spot FCL',
      desc: 'Volume container tenders (20+ TEUs) are lost due to uncompetitive rates, non-binding slot allocations, and punitive demurrage risk.',
      icon: '📉',
    },
    {
      title: 'Unverified Overseas Agents',
      desc: 'Foreign cargo abandonment and uncollectible demurrage bills cost forwarders millions annually due to zero statutory cross-border KYC.',
      icon: '⚠️',
    },
    {
      title: 'Exorbitant Talent Hiring Fees',
      desc: 'Logistics recruitment agencies charge ₹40,000+ per hire for basic ocean documentation clerks and freight pricing analysts.',
      icon: '💸',
    },
  ];

  problemCards.forEach((card, idx) => {
    const xPos = 0.8 + (idx % 2) * 5.9;
    const yPos = 1.5 + Math.floor(idx / 2) * 2.6;

    slide2.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 5.6,
      h: 2.3,
      fill: { color: WHITE },
      line: { color: 'CBD5E1', width: 1 },
      rectRadius: 0.1,
    });

    slide2.addText(`${card.icon}  ${card.title}`, {
      x: xPos + 0.3,
      y: yPos + 0.25,
      w: 5.0,
      h: 0.4,
      fontSize: 16,
      fontFace: 'Arial',
      color: DARK_SLATE,
      bold: true,
    });

    slide2.addText(card.desc, {
      x: xPos + 0.3,
      y: yPos + 0.75,
      w: 5.0,
      h: 1.3,
      fontSize: 13,
      fontFace: 'Arial',
      color: MUTED_SLATE,
      lineSpacing: 18,
    });
  });

  // ----------------------------------------------------
  // SLIDE 3: The Solution
  // ----------------------------------------------------
  const slide3 = createStandardSlide(
    'THE SOLUTION: FR8X PURPOSE-BUILT B2B FREIGHT EXCHANGE',
    'A Modular, Unbundled Digital Trading Floor That Empowers Forwarders Without Competing With Them'
  );

  const solutionCols = [
    {
      title: 'Multimodal Rate Matrix',
      route: '/rates',
      bullet1: 'Instant spot benchmark discovery across Ocean FCL, LCL & Air Freight.',
      bullet2: 'Granular POL/POD filters, carrier selection, and validity windows.',
      bullet3: 'Origin & destination THC breakdown with live currency conversion.',
    },
    {
      title: 'Reverse Tender Auctions',
      route: '/auctions',
      bullet1: 'Live synchronous tender rooms for 10 to 500 TEU spot volumes.',
      bullet2: 'Mandatory free-time guarantees (14–21 days) enforced at bidding.',
      bullet3: 'Binding 48-hour container slot allocation backed by escrow.',
    },
    {
      title: 'Freight Passport & Nexus',
      route: '/network · /nexus',
      bullet1: 'Statutory government credentials: GSTN, PAN, MTO, IATA, FMC.',
      bullet2: 'Verified corporate credentials and global agency trust scores.',
      bullet3: 'Public dispute arbitration ledger preventing counterparty defaults.',
    },
    {
      title: 'Trade Careers Board',
      route: '/jobs',
      bullet1: 'Specialized logistics recruitment board starting at just ₹300.',
      bullet2: 'Direct applicant CRM pipeline (Shortlisted, Interview, Hired).',
      bullet3: 'Over 10x cheaper than generic job boards and agency recruiters.',
    },
  ];

  solutionCols.forEach((col, idx) => {
    const xPos = 0.6 + idx * 2.95;
    const yPos = 1.5;

    slide3.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 2.8,
      h: 5.2,
      fill: { color: WHITE },
      line: { color: 'E2E8F0', width: 1 },
      rectRadius: 0.1,
    });

    slide3.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: yPos,
      w: 2.8,
      h: 0.8,
      fill: { color: idx === 1 ? TEAL : 'F1F5F9' },
    });

    slide3.addText(col.title, {
      x: xPos + 0.15,
      y: yPos + 0.1,
      w: 2.5,
      h: 0.35,
      fontSize: 13,
      fontFace: 'Arial',
      color: idx === 1 ? WHITE : DARK_SLATE,
      bold: true,
      align: 'center',
    });

    slide3.addText(col.route, {
      x: xPos + 0.15,
      y: yPos + 0.45,
      w: 2.5,
      h: 0.25,
      fontSize: 10,
      fontFace: 'Arial',
      color: idx === 1 ? 'A7F3D0' : MUTED_SLATE,
      align: 'center',
    });

    slide3.addText(
      [
        { text: `• ${col.bullet1}\n\n`, options: { fontSize: 11, color: DARK_SLATE } },
        { text: `• ${col.bullet2}\n\n`, options: { fontSize: 11, color: DARK_SLATE } },
        { text: `• ${col.bullet3}`, options: { fontSize: 11, color: DARK_SLATE } },
      ],
      {
        x: xPos + 0.2,
        y: yPos + 1.0,
        w: 2.4,
        h: 4.0,
        fontFace: 'Arial',
      }
    );
  });

  // ----------------------------------------------------
  // SLIDE 4: Architecture & Engineering Rigor
  // ----------------------------------------------------
  const slide4 = createStandardSlide(
    'PRODUCT VALIDATION & ENTERPRISE ARCHITECTURE',
    'Production-Grade Engineering Stack Verified With Zero Regressions'
  );

  const archSpecs = [
    ['Frontend Architecture', 'Next.js 14 App Router, React 18, Tailwind CSS, Lucide Icons'],
    ['Database & Security', 'Supabase PostgreSQL, Strict Row Level Security (RLS), Edge Auth'],
    ['Presence Engine', 'Synchronized Online/Away/Offline telemetry with low-bandwidth adaptation'],
    ['Billing Architecture', 'ISO 4217 Currency Engine (120+ Currencies) + Minor Units Calculation'],
    ['Quote Integrity', '15-Minute Cryptographic HMAC-SHA256 TTL Quote Signature Verification'],
    ['Godfather Engine', 'Sovereign Free Access Control (Global PAID vs FREE Mode + Audit Trail)'],
    ['Quality Gate Baseline', '17 of 17 Master Engineering Quality Gates Passing Verified Clean'],
  ];

  slide4.addTable(
    [
      [
        { text: 'Architecture Vector', options: { fill: TEAL, color: WHITE, bold: true, fontSize: 12 } },
        { text: 'Verified Production Specification', options: { fill: TEAL, color: WHITE, bold: true, fontSize: 12 } },
      ],
      ...archSpecs.map((row, i) => [
        { text: row[0], options: { fill: i % 2 === 0 ? WHITE : 'F8FAFC', bold: true, fontSize: 11, color: DARK_SLATE } },
        { text: row[1], options: { fill: i % 2 === 0 ? WHITE : 'F8FAFC', fontSize: 11, color: MUTED_SLATE } },
      ]),
    ],
    {
      x: 1.0,
      y: 1.5,
      w: 11.3,
      h: 4.8,
      border: { pt: 1, color: 'CBD5E1' },
      rowH: 0.55,
    }
  );

  // ----------------------------------------------------
  // SLIDE 5: Monetization & Revenue Model
  // ----------------------------------------------------
  const slide5 = createStandardSlide(
    'BUSINESS MODEL: 4 DIVERSIFIED REVENUE STREAMS',
    'High Gross Margins Powered by SaaS Subscriptions and Transactional Event Monetization'
  );

  const revStreams = [
    {
      title: 'SaaS Subscriptions',
      margin: '92% Margin',
      price: '₹1,500 – ₹9,999/mo',
      desc: 'Tiered monthly/annual subscriptions granting unlimited rate lookups, advanced market analytics, and priority tender rooms.',
    },
    {
      title: 'Trade Careers Job Listings',
      margin: '95% Margin',
      price: '₹300 – ₹5,340/listing',
      desc: 'Transparent recruitment tariffs for 2 to 30 days duration. Over 10x cheaper than generic job portals, delivering high conversion.',
    },
    {
      title: 'Sponsored Feed Advertising',
      margin: '98% Margin',
      price: '₹1,000 – ₹5,000/slot',
      desc: 'Targeted visual banner placements in the trade feed with verified sponsor badging and interactive popover lightboxes.',
    },
    {
      title: 'Reverse Auction Bidding Fees',
      margin: '90% Margin',
      price: '₹180 – ₹300/bid',
      desc: 'Micro-transaction fees on bid submissions in high-volume spot container tenders (20+ TEUs) with slot security guarantees.',
    },
  ];

  revStreams.forEach((s, idx) => {
    const xPos = 0.8 + (idx % 2) * 5.9;
    const yPos = 1.5 + Math.floor(idx / 2) * 2.6;

    slide5.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 5.6,
      h: 2.3,
      fill: { color: WHITE },
      line: { color: 'CBD5E1', width: 1 },
      rectRadius: 0.1,
    });

    slide5.addText(s.title, {
      x: xPos + 0.3,
      y: yPos + 0.2,
      w: 3.5,
      h: 0.35,
      fontSize: 16,
      fontFace: 'Arial',
      color: DARK_SLATE,
      bold: true,
    });

    slide5.addShape(pptx.ShapeType.roundRect, {
      x: xPos + 4.0,
      y: yPos + 0.2,
      w: 1.3,
      h: 0.3,
      fill: { color: 'DCFCE7' },
      line: { color: '86EFAC', width: 1 },
      rectRadius: 0.05,
    });

    slide5.addText(s.margin, {
      x: xPos + 4.0,
      y: yPos + 0.22,
      w: 1.3,
      h: 0.25,
      fontSize: 10,
      fontFace: 'Arial',
      color: EMERALD,
      bold: true,
      align: 'center',
    });

    slide5.addText(`Tariff: ${s.price}`, {
      x: xPos + 0.3,
      y: yPos + 0.6,
      w: 5.0,
      h: 0.3,
      fontSize: 13,
      fontFace: 'Arial',
      color: TEAL,
      bold: true,
    });

    slide5.addText(s.desc, {
      x: xPos + 0.3,
      y: yPos + 0.95,
      w: 5.0,
      h: 1.1,
      fontSize: 12,
      fontFace: 'Arial',
      color: MUTED_SLATE,
      lineSpacing: 16,
    });
  });

  // ----------------------------------------------------
  // SLIDE 6: Market Opportunity (TAM / SAM / SOM)
  // ----------------------------------------------------
  const slide6 = createStandardSlide(
    'TOTAL ADDRESSABLE MARKET (TAM / SAM / SOM)',
    'Capturing the Critical Digital Infrastructure Layer Across International Freight Corridors'
  );

  const marketSegments = [
    {
      level: 'TAM: $215B+',
      sub: 'Global Freight Forwarding Market',
      desc: 'Total annual revenue generated by ocean, air, and multimodal freight intermediaries globally across 120,000+ forwarding enterprises.',
      color: '0F172A',
    },
    {
      level: 'SAM: $24B+',
      sub: 'South Asia & Middle East Maritime Corridors',
      desc: 'Active containerized spot freight flows across India, UAE (Jebel Ali), Singapore, and European gateway ports.',
      color: TEAL,
    },
    {
      level: 'SOM: $180M ARR',
      sub: 'Target Software & Exchange Serviceable Market',
      desc: '15,000 forwarders, NVOCCs, and regional logistics providers at a blended annual ARPU of $1,000 across SaaS, jobs, and auction fees.',
      color: EMERALD,
    },
  ];

  marketSegments.forEach((seg, idx) => {
    const xPos = 0.8 + idx * 3.9;
    const yPos = 1.6;

    slide6.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 3.7,
      h: 4.8,
      fill: { color: WHITE },
      line: { color: 'CBD5E1', width: 1 },
      rectRadius: 0.1,
    });

    slide6.addShape(pptx.ShapeType.rect, {
      x: xPos,
      y: yPos,
      w: 3.7,
      h: 1.2,
      fill: { color: seg.color },
    });

    slide6.addText(seg.level, {
      x: xPos + 0.2,
      y: yPos + 0.2,
      w: 3.3,
      h: 0.45,
      fontSize: 20,
      fontFace: 'Arial',
      color: WHITE,
      bold: true,
      align: 'center',
    });

    slide6.addText(seg.sub, {
      x: xPos + 0.2,
      y: yPos + 0.7,
      w: 3.3,
      h: 0.35,
      fontSize: 11,
      fontFace: 'Arial',
      color: 'E2E8F0',
      align: 'center',
    });

    slide6.addText(seg.desc, {
      x: xPos + 0.3,
      y: yPos + 1.6,
      w: 3.1,
      h: 2.8,
      fontSize: 13,
      fontFace: 'Arial',
      color: DARK_SLATE,
      lineSpacing: 20,
    });
  });

  // ----------------------------------------------------
  // SLIDE 7: 3-Year Financial Model
  // ----------------------------------------------------
  const slide7 = createStandardSlide(
    '3-YEAR ILLUSTRATIVE FINANCIAL MODEL',
    'Scalable Growth Projections Driven by Expanding Network Liquidity and Corridors'
  );

  const finData = [
    ['Commercial Operating Metric', 'Year 1 (Foundation)', 'Year 2 (Scale)', 'Year 3 (Global Corridors)'],
    ['Registered Forwarders / Companies', '1,200', '4,500', '12,500'],
    ['Paid Active Subscribers (15% - 25%)', '180', '900', '3,125'],
    ['SaaS Subscription ARR', '₹32.4 Lakhs ($39K)', '₹1.89 Crores ($227K)', '₹7.42 Crores ($890K)'],
    ['Trade Careers Job Board Revenue', '₹14.4 Lakhs ($17K)', '₹64.8 Lakhs ($78K)', '₹2.25 Crores ($270K)'],
    ['Sponsored Feed Banner Revenue', '₹12.0 Lakhs ($14K)', '₹45.0 Lakhs ($54K)', '₹1.50 Crores ($180K)'],
    ['Reverse Auction Bidding Fees', '₹7.2 Lakhs ($9K)', '₹36.0 Lakhs ($43K)', '₹1.25 Crores ($150K)'],
    ['Total Gross Revenue', '₹66.0 Lakhs ($79K)', '₹3.35 Crores ($402K)', '₹12.42 Crores ($1.49M)'],
    ['Blended Gross Margin %', '88%', '90%', '92%'],
  ];

  slide7.addTable(
    finData.map((row, i) =>
      row.map((cell, j) => ({
        text: cell,
        options: {
          fill: i === 0 ? TEAL : i === 7 ? 'DCFCE7' : i % 2 === 0 ? WHITE : 'F8FAFC',
          color: i === 0 ? WHITE : i === 7 ? EMERALD : DARK_SLATE,
          bold: i === 0 || i === 7 || j === 0,
          fontSize: i === 0 ? 11 : 10,
          align: j === 0 ? 'left' : 'center',
        },
      }))
    ),
    {
      x: 0.8,
      y: 1.5,
      w: 11.7,
      h: 5.0,
      border: { pt: 1, color: 'CBD5E1' },
      rowH: 0.48,
    }
  );

  // ----------------------------------------------------
  // SLIDE 8: The Ask & Capital Allocation
  // ----------------------------------------------------
  const slide8 = createStandardSlide(
    'THE INVESTMENT ASK & STRATEGIC USE OF CAPITAL',
    'Accelerating Corridor Liquidity Across South Asia, the Middle East, and Europe'
  );

  const fundingPillars = [
    {
      pct: '50%',
      title: 'Sales & Regional BD',
      desc: 'Deploy field sales reps in major maritime clusters: Mumbai (Nhava Sheva), Delhi NCR (ICDs), Dubai (Jebel Ali), and Chennai to drive founder onboarding.',
    },
    {
      pct: '30%',
      title: 'Carrier Integrations & Tech',
      desc: 'Deepen direct container tracking APIs, automated Bill of Lading parsers, liner schedules, and automated KYC verification infrastructure.',
    },
    {
      pct: '20%',
      title: 'Marketing & Associations',
      desc: 'Strategic partnerships with freight forwarding federations (FFFAI, WCA, FIATA), sponsored corridor webinars, and targeted digital acquisition.',
    },
  ];

  fundingPillars.forEach((p, idx) => {
    const xPos = 0.8 + idx * 3.9;
    const yPos = 1.6;

    slide8.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 3.7,
      h: 4.8,
      fill: { color: WHITE },
      line: { color: 'CBD5E1', width: 1 },
      rectRadius: 0.1,
    });

    slide8.addText(p.pct, {
      x: xPos + 0.2,
      y: yPos + 0.4,
      w: 3.3,
      h: 0.8,
      fontSize: 38,
      fontFace: 'Arial',
      color: TEAL,
      bold: true,
      align: 'center',
    });

    slide8.addText(p.title, {
      x: xPos + 0.2,
      y: yPos + 1.3,
      w: 3.3,
      h: 0.4,
      fontSize: 16,
      fontFace: 'Arial',
      color: DARK_SLATE,
      bold: true,
      align: 'center',
    });

    slide8.addShape(pptx.ShapeType.line, {
      x: xPos + 0.5,
      y: yPos + 1.85,
      w: 2.7,
      h: 0,
      line: { color: 'E2E8F0', width: 1 },
    });

    slide8.addText(p.desc, {
      x: xPos + 0.3,
      y: yPos + 2.1,
      w: 3.1,
      h: 2.3,
      fontSize: 13,
      fontFace: 'Arial',
      color: MUTED_SLATE,
      lineSpacing: 18,
    });
  });

  const pptxPath = path.join(outputDir, 'FR8X_INVESTOR_PITCH_DECK.pptx');
  await pptx.writeFile({ fileName: pptxPath });
  console.log(`✓ Investor Pitch Deck generated: ${pptxPath}`);
}

async function generateCustomerDemoDeck() {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'FR8X Customer Product Demonstration Deck';
  pptx.author = 'FR8X Freight Exchange Private Limited';

  function createStandardSlide(title, subtitle) {
    const slide = pptx.addSlide();
    slide.background = { color: LIGHT_BG };

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 0,
      w: '100%',
      h: 1.1,
      fill: { color: TEAL },
    });

    slide.addText(title, {
      x: 0.6,
      y: 0.15,
      w: 12.0,
      h: 0.45,
      fontSize: 22,
      fontFace: 'Arial',
      color: WHITE,
      bold: true,
    });

    if (subtitle) {
      slide.addText(subtitle, {
        x: 0.6,
        y: 0.62,
        w: 12.0,
        h: 0.35,
        fontSize: 13,
        fontFace: 'Arial',
        color: 'A7F3D0',
      });
    }

    slide.addShape(pptx.ShapeType.rect, {
      x: 0,
      y: 7.15,
      w: '100%',
      h: 0.35,
      fill: { color: WHITE },
      line: { color: 'E2E8F0', width: 1 },
    });

    slide.addText('FR8X FREIGHT EXCHANGE  |  CUSTOMER PRODUCT DEMONSTRATION  |  https://fr8x.in', {
      x: 0.6,
      y: 7.2,
      w: 9.0,
      h: 0.25,
      fontSize: 9,
      fontFace: 'Arial',
      color: MUTED_SLATE,
    });

    slide.addText('FR8X · 2026', {
      x: 11.5,
      y: 7.2,
      w: 1.2,
      h: 0.25,
      fontSize: 9,
      fontFace: 'Arial',
      color: MUTED_SLATE,
      align: 'right',
    });

    return slide;
  }

  // ----------------------------------------------------
  // SLIDE 1: Title Slide
  // ----------------------------------------------------
  const slide1 = pptx.addSlide();
  slide1.background = { color: TEAL };

  slide1.addText('WELCOME TO FR8X', {
    x: 1.0,
    y: 1.6,
    w: 11.3,
    h: 0.5,
    fontSize: 18,
    fontFace: 'Arial',
    color: '34D399',
    bold: true,
    tracking: 3,
  });

  slide1.addText('The Everyday Digital Commercial Companion for Modern Freight Forwarders', {
    x: 1.0,
    y: 2.2,
    w: 11.3,
    h: 1.6,
    fontSize: 34,
    fontFace: 'Arial',
    color: WHITE,
    bold: true,
  });

  slide1.addText('Quote Faster  ·  Procure Smarter  ·  Hire Cheaper  ·  Trade Safer', {
    x: 1.0,
    y: 4.0,
    w: 11.3,
    h: 0.8,
    fontSize: 20,
    fontFace: 'Arial',
    color: 'A7F3D0',
    bold: true,
  });

  slide1.addShape(pptx.ShapeType.line, {
    x: 1.0,
    y: 5.1,
    w: 11.3,
    h: 0,
    line: { color: '059669', width: 2 },
  });

  slide1.addText('Interactive Customer Demonstration & Commercial Walkthrough', {
    x: 1.0,
    y: 5.4,
    w: 11.3,
    h: 0.4,
    fontSize: 13,
    fontFace: 'Arial',
    color: 'CBD5E1',
  });

  slide1.addText('FR8X Solutions Engineering Team  |  support@fr8x.in  |  https://fr8x.in', {
    x: 1.0,
    y: 5.8,
    w: 11.3,
    h: 0.4,
    fontSize: 12,
    fontFace: 'Arial',
    color: '94A3B8',
  });

  // ----------------------------------------------------
  // SLIDE 2: Common Industry Headaches
  // ----------------------------------------------------
  const slide2 = createStandardSlide(
    'THE 3 BIGGEST HEADACHES IN DAILY FREIGHT OPERATIONS',
    'Why Established Forwarders Lose Valuable Margin and Time Every Single Day'
  );

  const headaches = [
    {
      num: '01',
      title: 'Waiting Hours for Carrier Quotes',
      desc: 'Your pricing desk spends 4–6 hours daily emailing shipping lines and co-loaders for spot rates, causing shippers to book with faster competitors.',
    },
    {
      num: '02',
      title: 'Losing Volume Container Tenders',
      desc: 'Clients demand 20+ boxes with 14–21 days container free time. Co-loaders offer high rates and zero binding slot guarantees.',
    },
    {
      num: '03',
      title: 'Paying ₹40,000+ for Each New Hire',
      desc: 'Headhunters charge astronomical fees to source experienced documentation staff, customs clerks, and pricing managers.',
    },
  ];

  headaches.forEach((h, idx) => {
    const xPos = 0.8 + idx * 3.9;
    const yPos = 1.6;

    slide2.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 3.7,
      h: 4.8,
      fill: { color: WHITE },
      line: { color: 'CBD5E1', width: 1 },
      rectRadius: 0.1,
    });

    slide2.addText(h.num, {
      x: xPos + 0.3,
      y: yPos + 0.3,
      w: 3.1,
      h: 0.6,
      fontSize: 28,
      fontFace: 'Arial',
      color: 'EF4444',
      bold: true,
    });

    slide2.addText(h.title, {
      x: xPos + 0.3,
      y: yPos + 1.1,
      w: 3.1,
      h: 0.8,
      fontSize: 16,
      fontFace: 'Arial',
      color: DARK_SLATE,
      bold: true,
    });

    slide2.addText(h.desc, {
      x: xPos + 0.3,
      y: yPos + 2.1,
      w: 3.1,
      h: 2.3,
      fontSize: 13,
      fontFace: 'Arial',
      color: MUTED_SLATE,
      lineSpacing: 18,
    });
  });

  // ----------------------------------------------------
  // SLIDE 3: What FR8X Is vs What It Is Not
  // ----------------------------------------------------
  const slide3 = createStandardSlide(
    'WHAT FR8X IS vs. WHAT IT IS NOT',
    'We Complement Your Internal ERP—We Do Not Replace It'
  );

  slide3.addShape(pptx.ShapeType.roundRect, {
    x: 0.8,
    y: 1.6,
    w: 5.7,
    h: 4.8,
    fill: { color: WHITE },
    line: { color: 'CBD5E1', width: 1 },
    rectRadius: 0.1,
  });

  slide3.addShape(pptx.ShapeType.rect, {
    x: 0.8,
    y: 1.6,
    w: 5.7,
    h: 0.8,
    fill: { color: 'EF4444' },
  });

  slide3.addText('WHAT FR8X IS NOT', {
    x: 1.0,
    y: 1.85,
    w: 5.3,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    color: WHITE,
    bold: true,
    align: 'center',
  });

  slide3.addText(
    [
      { text: '❌ NOT an Internal Accounting ERP\n', options: { bold: true, color: DARK_SLATE } },
      { text: 'We do not generate customer tax invoices or file GST returns.\n\n', options: { color: MUTED_SLATE } },
      { text: '❌ NOT a Customs EDI Filing Tool\n', options: { bold: true, color: DARK_SLATE } },
      { text: 'We do not transmit electronic shipping bills to ICEGATE.\n\n', options: { color: MUTED_SLATE } },
      { text: '❌ NOT a Competing Freight Broker\n', options: { bold: true, color: DARK_SLATE } },
      { text: 'We never solicit your shipper clients or touch your freight margin.', options: { color: MUTED_SLATE } },
    ],
    {
      x: 1.2,
      y: 2.7,
      w: 5.0,
      h: 3.4,
      fontFace: 'Arial',
      fontSize: 12,
    }
  );

  slide3.addShape(pptx.ShapeType.roundRect, {
    x: 6.8,
    y: 1.6,
    w: 5.7,
    h: 4.8,
    fill: { color: WHITE },
    line: { color: '86EFAC', width: 1 },
    rectRadius: 0.1,
  });

  slide3.addShape(pptx.ShapeType.rect, {
    x: 6.8,
    y: 1.6,
    w: 5.7,
    h: 0.8,
    fill: { color: EMERALD },
  });

  slide3.addText('WHAT FR8X DELIVERS', {
    x: 7.0,
    y: 1.85,
    w: 5.3,
    h: 0.4,
    fontSize: 16,
    fontFace: 'Arial',
    color: WHITE,
    bold: true,
    align: 'center',
  });

  slide3.addText(
    [
      { text: '✔ External Digital Trading Floor\n', options: { bold: true, color: DARK_SLATE } },
      { text: 'Benchmark ocean and air spot rates across global carriers instantly.\n\n', options: { color: MUTED_SLATE } },
      { text: '✔ Reverse Container Tender Auctions\n', options: { bold: true, color: DARK_SLATE } },
      { text: 'Procure 10 to 100+ TEUs with mandatory 14-day free-time guarantees.\n\n', options: { color: MUTED_SLATE } },
      { text: '✔ Verified Agency Directory & Hiring\n', options: { bold: true, color: DARK_SLATE } },
      { text: 'Verify overseas agents via Freight Passport and hire talent for ₹300.', options: { color: MUTED_SLATE } },
    ],
    {
      x: 7.2,
      y: 2.7,
      w: 5.0,
      h: 3.4,
      fontFace: 'Arial',
      fontSize: 12,
    }
  );

  // ----------------------------------------------------
  // SLIDE 4: Rate Intelligence Walkthrough
  // ----------------------------------------------------
  const slide4 = createStandardSlide(
    'FEATURE SPOTLIGHT 1: MULTIMODAL RATE INTELLIGENCE',
    'Instant Benchmarking Across Ocean FCL, LCL & Air Freight at /rates'
  );

  const rateFeatures = [
    {
      title: 'Real-Time Port-Pair Search',
      desc: 'Filter by Loading Port (Nhava Sheva, Mundra, Chennai) and Discharge Port (Jebel Ali, Rotterdam, Hamburg, Singapore).',
    },
    {
      title: 'Equipment & Line Specificity',
      desc: 'Compare rates across standard 20GP, 40HC, and Specialized Reefer boxes with specific shipping lines (Maersk, MSC, CMA CGM).',
    },
    {
      title: 'Full Surcharge Breakdown',
      desc: 'Inspect origin terminal handling (OTHC), destination terminal handling (DTHC), and documentation fees in exact local currencies.',
    },
    {
      title: 'Unified Rates Editor',
      desc: 'Publish your own agency export rates to our verified trade network with a single click, or export to Excel.',
    },
  ];

  rateFeatures.forEach((f, idx) => {
    const xPos = 0.8 + (idx % 2) * 5.9;
    const yPos = 1.6 + Math.floor(idx / 2) * 2.5;

    slide4.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 5.6,
      h: 2.2,
      fill: { color: WHITE },
      line: { color: 'CBD5E1', width: 1 },
      rectRadius: 0.1,
    });

    slide4.addText(f.title, {
      x: xPos + 0.3,
      y: yPos + 0.25,
      w: 5.0,
      h: 0.35,
      fontSize: 15,
      fontFace: 'Arial',
      color: TEAL,
      bold: true,
    });

    slide4.addText(f.desc, {
      x: xPos + 0.3,
      y: yPos + 0.7,
      w: 5.0,
      h: 1.2,
      fontSize: 12,
      fontFace: 'Arial',
      color: MUTED_SLATE,
      lineSpacing: 16,
    });
  });

  // ----------------------------------------------------
  // SLIDE 5: Reverse Auctions Walkthrough
  // ----------------------------------------------------
  const slide5 = createStandardSlide(
    'FEATURE SPOTLIGHT 2: REVERSE CONTAINER TENDER AUCTIONS',
    'Tender 10 to 100+ TEUs in Live Bidding Rooms with Binding Slot Allocations'
  );

  const auctionSteps = [
    { step: '1', title: 'Post Your Tender', desc: 'Specify container quantity, POL/POD, cargo readiness, and ceiling rate.' },
    { step: '2', title: 'Mandate Free Time', desc: 'Enforce mandatory 14 or 21 days detention free time directly in the tender spec.' },
    { step: '3', title: 'Live Decremental Bidding', desc: 'Carriers and NVOCCs enter your digital room and bid down the spot rate.' },
    { step: '4', title: '48-Hour Slot Lock', desc: 'Winning bidder is bound by contract to hold rate and equipment for 48 hours.' },
  ];

  auctionSteps.forEach((s, idx) => {
    const xPos = 0.6 + idx * 2.95;
    const yPos = 1.6;

    slide5.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 2.8,
      h: 4.8,
      fill: { color: WHITE },
      line: { color: 'CBD5E1', width: 1 },
      rectRadius: 0.1,
    });

    slide5.addShape(pptx.ShapeType.ellipse, {
      x: xPos + 0.95,
      y: yPos + 0.3,
      w: 0.9,
      h: 0.9,
      fill: { color: TEAL },
    });

    slide5.addText(s.step, {
      x: xPos + 0.95,
      y: yPos + 0.45,
      w: 0.9,
      h: 0.6,
      fontSize: 22,
      fontFace: 'Arial',
      color: WHITE,
      bold: true,
      align: 'center',
    });

    slide5.addText(s.title, {
      x: xPos + 0.15,
      y: yPos + 1.5,
      w: 2.5,
      h: 0.6,
      fontSize: 14,
      fontFace: 'Arial',
      color: DARK_SLATE,
      bold: true,
      align: 'center',
    });

    slide5.addText(s.desc, {
      x: xPos + 0.2,
      y: yPos + 2.3,
      w: 2.4,
      h: 2.2,
      fontSize: 12,
      fontFace: 'Arial',
      color: MUTED_SLATE,
      align: 'center',
      lineSpacing: 16,
    });
  });

  // ----------------------------------------------------
  // SLIDE 6: Trade Careers Walkthrough
  // ----------------------------------------------------
  const slide6 = createStandardSlide(
    'FEATURE SPOTLIGHT 3: LOGISTICS RECRUITMENT AT ₹300',
    'Hire Experienced Ocean Documentation & Pricing Staff at Transparent Flat Tariffs'
  );

  const jobTiers = [
    { name: '2 Days Quick Fill', price: '₹300', desc: 'Emergency vacancy coverage for customs clerks and port runners.' },
    { name: '7 Days Standard', price: '₹1,200', desc: 'Most popular for ocean pricing executives and documentation clerks.' },
    { name: '15 Days Extended', price: '₹2,640', desc: 'Ideal for branch sales executives and customs clearance managers.' },
    { name: '30 Days Comprehensive', price: '₹5,340', desc: 'Executive search for general managers, trade lane heads & directors.' },
  ];

  jobTiers.forEach((tier, idx) => {
    const xPos = 0.6 + idx * 2.95;
    const yPos = 1.6;

    slide6.addShape(pptx.ShapeType.roundRect, {
      x: xPos,
      y: yPos,
      w: 2.8,
      h: 4.8,
      fill: { color: WHITE },
      line: { color: idx === 1 ? TEAL : 'CBD5E1', width: idx === 1 ? 2 : 1 },
      rectRadius: 0.1,
    });

    if (idx === 1) {
      slide6.addShape(pptx.ShapeType.rect, {
        x: xPos,
        y: yPos,
        w: 2.8,
        h: 0.35,
        fill: { color: EMERALD },
      });
      slide6.addText('MOST POPULAR', {
        x: xPos,
        y: yPos + 0.05,
        w: 2.8,
        h: 0.25,
        fontSize: 10,
        fontFace: 'Arial',
        color: WHITE,
        bold: true,
        align: 'center',
      });
    }

    slide6.addText(tier.name, {
      x: xPos + 0.15,
      y: yPos + 0.6,
      w: 2.5,
      h: 0.5,
      fontSize: 14,
      fontFace: 'Arial',
      color: DARK_SLATE,
      bold: true,
      align: 'center',
    });

    slide6.addText(tier.price, {
      x: xPos + 0.15,
      y: yPos + 1.2,
      w: 2.5,
      h: 0.7,
      fontSize: 28,
      fontFace: 'Arial',
      color: TEAL,
      bold: true,
      align: 'center',
    });

    slide6.addText(tier.desc, {
      x: xPos + 0.2,
      y: yPos + 2.1,
      w: 2.4,
      h: 2.3,
      fontSize: 12,
      fontFace: 'Arial',
      color: MUTED_SLATE,
      align: 'center',
      lineSpacing: 16,
    });
  });

  // ----------------------------------------------------
  // SLIDE 7: Sovereign Free Access Offer
  // ----------------------------------------------------
  const slide7 = createStandardSlide(
    'GET STARTED TODAY: 100% COMPLIMENTARY 30-DAY ACCESS',
    'Under our Godfather Sovereign Access Initiative, Experience Full Enterprise Power'
  );

  slide7.addShape(pptx.ShapeType.roundRect, {
    x: 1.5,
    y: 1.8,
    w: 10.3,
    h: 4.5,
    fill: { color: WHITE },
    line: { color: '86EFAC', width: 2 },
    rectRadius: 0.15,
  });

  slide7.addText('EXCLUSIVE FORWARDER LAUNCH PRIVILEGES', {
    x: 1.8,
    y: 2.1,
    w: 9.7,
    h: 0.4,
    fontSize: 14,
    fontFace: 'Arial',
    color: EMERALD,
    bold: true,
    tracking: 2,
  });

  slide7.addText('Activate 30 Days of Enterprise Free Access For Your Team', {
    x: 1.8,
    y: 2.5,
    w: 9.7,
    h: 0.6,
    fontSize: 24,
    fontFace: 'Arial',
    color: DARK_SLATE,
    bold: true,
  });

  slide7.addText(
    [
      { text: '✔ Full Unrestricted Access to Multimodal Rate Intelligence Matrix\n', options: { bold: true } },
      { text: '✔ Host and Bid in Unlimited Live Reverse Container Tender Auctions\n', options: { bold: true } },
      { text: '✔ Verified Corporate Profile & Statutory Freight Passport™ Badging\n', options: { bold: true } },
      { text: '✔ Search Unlimited Dispute Records on Nexus Counterparty Directory\n', options: { bold: true } },
      { text: '✔ Zero Credit Card or Financial Commitment Required\n', options: { bold: true } },
    ],
    {
      x: 2.0,
      y: 3.3,
      w: 9.3,
      h: 2.0,
      fontFace: 'Arial',
      fontSize: 13,
      color: DARK_SLATE,
      lineSpacing: 22,
    }
  );

  slide7.addShape(pptx.ShapeType.roundRect, {
    x: 4.3,
    y: 5.3,
    w: 4.7,
    h: 0.7,
    fill: { color: TEAL },
    rectRadius: 0.1,
  });

  slide7.addText('Register Your Company: https://fr8x.in/register', {
    x: 4.3,
    y: 5.48,
    w: 4.7,
    h: 0.35,
    fontSize: 13,
    fontFace: 'Arial',
    color: WHITE,
    bold: true,
    align: 'center',
  });

  const pptxPath = path.join(outputDir, 'FR8X_CUSTOMER_PRODUCT_DEMO_DECK.pptx');
  await pptx.writeFile({ fileName: pptxPath });
  console.log(`✓ Customer Product Demo Deck generated: ${pptxPath}`);
}

async function main() {
  console.log('Generating PowerPoint Presentations with PPTXGenJS...\n');
  await generateInvestorDeck();
  await generateCustomerDemoDeck();
  console.log('\nAll PowerPoint decks generated successfully!');
}

main().catch(console.error);
