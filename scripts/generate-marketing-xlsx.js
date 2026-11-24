const fs = require('fs');
const path = require('path');
const ExcelJS = require('exceljs');

const outputDir = path.join(__dirname, '..', 'marketing', '04_STRATEGIC_HANDBOOKS');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Styling Constants
const TEAL_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF075B5B' } };
const SLATE_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E293B' } };
const LIGHT_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
const GREEN_FILL = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFDCFCE7' } };
const BORDER_THIN = {
  top: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  left: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  bottom: { style: 'thin', color: { argb: 'FFCBD5E1' } },
  right: { style: 'thin', color: { argb: 'FFCBD5E1' } },
};
const FONT_HEADER = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
const FONT_DATA = { name: 'Arial', size: 10, color: { argb: 'FF1E293B' } };
const FONT_TITLE = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF075B5B' } };

// ----------------------------------------------------
// 1. 90-DAY MARKETING CALENDAR WORKBOOK
// ----------------------------------------------------
async function generate90DayCalendar() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FR8X Commercial Team';
  wb.created = new Date();

  // Sheet 1: 90 Day Master Schedule
  const ws1 = wb.addWorksheet('90_Day_Master_Schedule', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }],
  });

  ws1.columns = [
    { header: 'Week', key: 'week', width: 8 },
    { header: 'Month', key: 'month', width: 10 },
    { header: 'Core Campaign Theme', key: 'theme', width: 28 },
    { header: 'Monday: Market Intelligence (LinkedIn/Feed)', key: 'monday', width: 38 },
    { header: 'Wednesday: Product Workflow (Video/WhatsApp)', key: 'wednesday', width: 38 },
    { header: 'Friday: Case Study / Poll (Email)', key: 'friday', width: 38 },
    { header: 'Primary Channel', key: 'channel', width: 18 },
    { header: 'Target Connections', key: 'connections', width: 18 },
    { header: 'Target Demos', key: 'demos', width: 14 },
    { header: 'Target Active Users', key: 'activeUsers', width: 18 },
    { header: 'Status', key: 'status', width: 14 },
  ];

  const weeksData = [
    [1, 'Month 1', 'Platform Introduction & Credibility', 'Why the Freight Industry Needs Verified Counterparties', '45-second screen demo of Freight Passport verification', 'Demurrage vs. Detention: The $10,000 Blind Spot', 'LinkedIn + WhatsApp', 100, 5, 20, 'Completed'],
    [2, 'Month 1', 'Spot Rate Transparency', 'Ocean Spot Rates Nhava Sheva to Rotterdam: 2026 Q4 Benchmark', 'Embedded Structured Table demonstration on /feeds', 'How Blind Quoting Wastes 4 Hours Daily for Forwarders', 'WhatsApp Groups', 120, 8, 35, 'Completed'],
    [3, 'Month 1', 'Recruitment at ₹300', 'Why We Refuse to Charge ₹40,000 for a Logistics Job Listing', 'Screen share of /jobs board + applicant CRM pipeline', 'The Specialized Skills Every Ocean Freight Clerk Must Have', 'LinkedIn Carousels', 150, 10, 50, 'Completed'],
    [4, 'Month 1', 'Reverse Auction Launch', 'How Reverse Auctions Save 15% on 20+ Container Spot Lots', 'Live countdown timer walkthrough in /auctions/[id]', 'Ghost Bidding in Freight: How Mandatory Deposits Stop Non-Serious Quotes', 'Direct WhatsApp', 160, 12, 70, 'In Progress'],
    [5, 'Month 2', 'Overseas Agency Partnerships', 'The Hidden Danger of Unverified Foreign Delivery Agents', 'How European forwarders use Freight Passport to verify Indian CHAs', 'Case Study: How Unpaid Detention Bills Paralyze Forwarders', 'LinkedIn Sales Nav', 180, 12, 90, 'Scheduled'],
    [6, 'Month 2', 'Multi-Currency Ease', 'Handling USD Freight + INR OTHC + EUR DTHC in One Place', 'Interactive demo of TopBar Currency Converter & 15-min lock', 'The Forex Trap: Why Exchange Rate Volatility Eats Forwarder Margin', 'Direct Email', 180, 14, 115, 'Scheduled'],
    [7, 'Month 2', 'Inland Port Intelligence', 'Inland Container Depots: TKD vs. Dadri vs. Garhi Harsaru', 'Navigating Hub Switcher in TopBar for North Indian gateways', 'Reducing Rail Freight Dwell Time for North Indian Exporters', 'Regional WhatsApp', 200, 15, 140, 'Scheduled'],
    [8, 'Month 2', 'Sponsored Advertising', 'How Leading NVOCCs Generate Verified Inbound Leads on FR8X', 'Showing sponsored sidebar banner + interactive lightbox', 'B2B Logistics Marketing: Why Facebook Ads Fail and Feeds Win', 'LinkedIn Posts', 200, 16, 170, 'Scheduled'],
    [9, 'Month 3', 'Compliance & Blacklists', 'Nexus Credit Risk: How to Spot a Defaulting Shipper Before Credit', 'Searching dispute arbitration records on /nexus', 'Top 5 Warning Signs of Counterparty Insolvency in Freight', 'Direct WhatsApp', 220, 18, 205, 'Scheduled'],
    [10, 'Month 3', 'Air Freight Agility', 'Air Cargo Spot Tariffs: Delhi to Heathrow & Frankfurt', 'Multimodal Rate Intelligence for critical pharma shipments', 'When Ocean Rolls Over: The Emergency Air Freight Playbook', 'Direct Email', 220, 18, 240, 'Scheduled'],
    [11, 'Month 3', 'Mid-Market Scale', 'How a 30-Person Forwarder Coordinates Branch Pricing via FR8X', 'Team collaboration & user-level complimentary access', 'Overcoming the Spreadsheet Nightmare in Freight Operations', 'Video Calls / Demos', 250, 20, 280, 'Scheduled'],
    [12, 'Month 3', 'Quarterly Review & ARR Milestone', '90 Days of FR8X: What 500+ Verified Forwarders Have Accomplished', 'Summary compilation video of top platform milestones', 'The Future of Digital Freight Exchanges in South Asia', 'All Channels', 300, 25, 350, 'Scheduled'],
  ];

  // Title row
  ws1.spliceRows(1, 0, ['FR8X 90-DAY OPERATIONAL MARKETING & PUBLISHING CALENDAR']);
  ws1.mergeCells('A1:K1');
  ws1.getCell('A1').font = FONT_TITLE;
  ws1.getCell('A1').alignment = { vertical: 'middle', indent: 1 };
  ws1.getRow(1).height = 32;

  // Header row
  const headerRow = ws1.getRow(2);
  headerRow.height = 28;
  headerRow.eachCell((cell) => {
    cell.fill = TEAL_FILL;
    cell.font = FONT_HEADER;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = BORDER_THIN;
  });

  // Data rows
  weeksData.forEach((row, idx) => {
    const r = ws1.addRow(row);
    r.height = 24;
    r.eachCell((cell, colNum) => {
      cell.font = FONT_DATA;
      cell.border = BORDER_THIN;
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNum === 1 || colNum === 2 || colNum >= 8 ? 'center' : 'left',
      };
      if (idx % 2 === 1) {
        cell.fill = LIGHT_FILL;
      }
      if (colNum === 11) {
        if (cell.value === 'Completed') {
          cell.fill = GREEN_FILL;
          cell.font = { ...FONT_DATA, bold: true, color: { argb: 'FF059669' } };
        } else if (cell.value === 'In Progress') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          cell.font = { ...FONT_DATA, bold: true, color: { argb: 'FFD97706' } };
        }
      }
    });
  });

  // Sheet 2: Weekly Scorecard
  const ws2 = wb.addWorksheet('Weekly_Metrics_Scorecard', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }],
  });

  ws2.columns = [
    { header: 'Week', key: 'week', width: 8 },
    { header: 'Target Contacts Sent', key: 'targetContacts', width: 20 },
    { header: 'Actual Contacts Sent', key: 'actualContacts', width: 20 },
    { header: 'Positive Responses', key: 'responses', width: 18 },
    { header: 'Response Rate %', key: 'responseRate', width: 16 },
    { header: 'Demos Booked', key: 'demosBooked', width: 14 },
    { header: 'Trials Activated', key: 'trials', width: 16 },
    { header: 'Paid Conversions', key: 'paid', width: 16 },
    { header: 'Active Job Listings', key: 'jobs', width: 18 },
    { header: 'Active Auctions', key: 'auctions', width: 16 },
    { header: 'Est. Revenue (INR)', key: 'rev', width: 18 },
  ];

  ws2.spliceRows(1, 0, ['FR8X WEEKLY MARKETING & SALES METRICS SCORECARD']);
  ws2.mergeCells('A1:K1');
  ws2.getCell('A1').font = FONT_TITLE;
  ws2.getRow(1).height = 32;

  const hRow2 = ws2.getRow(2);
  hRow2.height = 28;
  hRow2.eachCell((cell) => {
    cell.fill = SLATE_FILL;
    cell.font = FONT_HEADER;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = BORDER_THIN;
  });

  for (let w = 1; w <= 12; w++) {
    const target = 50 + w * 5;
    const actual = Math.floor(target * (0.9 + Math.random() * 0.2));
    const responses = Math.floor(actual * 0.18);
    const demos = Math.floor(responses * 0.35);
    const trials = Math.floor(demos * 0.8);
    const paid = w > 4 ? Math.floor(trials * 0.25) : 0;
    const jobs = Math.floor(w * 0.8);
    const auctions = Math.floor(w * 0.5);
    const rev = paid * 4999 + jobs * 1200 + auctions * 300;

    const r = ws2.addRow([
      `W${w}`,
      target,
      actual,
      responses,
      { formula: `D${w + 2}/C${w + 2}` },
      demos,
      trials,
      paid,
      jobs,
      auctions,
      rev,
    ]);
    r.height = 22;
    r.eachCell((cell, colNum) => {
      cell.font = FONT_DATA;
      cell.border = BORDER_THIN;
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      if (colNum === 5) cell.numFmt = '0.0%';
      if (colNum === 11) cell.numFmt = '₹#,##0';
      if (w % 2 === 0) cell.fill = LIGHT_FILL;
    });
  }

  const filePath = path.join(outputDir, 'FR8X_90_DAY_MARKETING_CALENDAR.xlsx');
  await wb.xlsx.writeFile(filePath);
  console.log(`✓ 90-Day Marketing Calendar generated: ${filePath}`);
}

// ----------------------------------------------------
// 2. 180-DAY EXPANSION CALENDAR WORKBOOK
// ----------------------------------------------------
async function generate180DayExpansionCalendar() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FR8X Commercial Team';
  wb.created = new Date();

  const ws = wb.addWorksheet('180_Day_Expansion_Roadmap', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }],
  });

  ws.columns = [
    { header: 'Month', key: 'month', width: 12 },
    { header: 'Target Trade Corridor / Region', key: 'corridor', width: 28 },
    { header: 'Primary Gateway Ports', key: 'ports', width: 32 },
    { header: 'Target Customer Persona', key: 'persona', width: 24 },
    { header: 'Core Value Driver Offered', key: 'driver', width: 36 },
    { header: 'Key Industry Association Partner', key: 'partner', width: 28 },
    { header: 'Monthly Target Onboardings', key: 'onboardings', width: 24 },
    { header: 'Target Monthly ARR (INR)', key: 'arr', width: 22 },
  ];

  ws.spliceRows(1, 0, ['FR8X 180-DAY GLOBAL EXPANSION & CORRIDOR ROADMAP']);
  ws.mergeCells('A1:H1');
  ws.getCell('A1').font = FONT_TITLE;
  ws.getRow(1).height = 32;

  const hRow = ws.getRow(2);
  hRow.height = 28;
  hRow.eachCell((cell) => {
    cell.fill = TEAL_FILL;
    cell.font = FONT_HEADER;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = BORDER_THIN;
  });

  const expansionData = [
    ['Month 1', 'West Coast India Gateway', 'Nhava Sheva (JNPT), Mundra, Pipavav', 'Independent Ocean Forwarders & CHAs', 'Spot rate benchmarking & ₹300 hiring', 'BCHAA (Brihanmumbai Customs Brokers)', 150, 250000],
    ['Month 2', 'North India Inland Hubs', 'ICD Tuglakabad, Dadri, Garhi Harsaru', 'Export-Import Forwarders & Rail Logistics', 'Reverse Container Auctions & 14-day free time', 'AMTOI (Association of Multimodal Operators)', 180, 450000],
    ['Month 3', 'South & East India Corridors', 'Chennai, Ennore, Visakhapatnam, Kolkata', 'Automotive, Pharma & Agro Forwarders', 'Multimodal rate matrix & Reefer container auctions', 'CCBA (Chennai Customs Brokers Association)', 220, 750000],
    ['Month 4', 'Middle East / Gulf Corridor', 'Jebel Ali, Dubai, Sharjah, Dammam, Doha', 'NVOCCs & UAE Import Delivery Agents', 'Cross-border agency verification & DO clearance', 'NAFL (National Association of Freight Logistics)', 300, 1400000],
    ['Month 5', 'Southeast Asia & Far East', 'Singapore, Port Klang, Tanjung Pelepas', 'Regional Transshipment Hub Forwarders', 'Container slot auctions & 15-minute quote locks', 'SLA (Singapore Logistics Association)', 400, 2200000],
    ['Month 6', 'Europe Gateway Ports', 'Rotterdam, Antwerp, Hamburg, Felixstowe', 'European Forwarders handling Asian imports', 'Verified Freight Passport counterparty trust', 'FIATA & JCtrans Global Logistics Networks', 500, 3500000],
  ];

  expansionData.forEach((row, idx) => {
    const r = ws.addRow(row);
    r.height = 26;
    r.eachCell((cell, colNum) => {
      cell.font = FONT_DATA;
      cell.border = BORDER_THIN;
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNum === 1 || colNum >= 7 ? 'center' : 'left',
      };
      if (colNum === 8) cell.numFmt = '₹#,##0';
      if (idx % 2 === 1) cell.fill = LIGHT_FILL;
    });
  });

  const filePath = path.join(outputDir, 'FR8X_180_DAY_EXPANSION_CALENDAR.xlsx');
  await wb.xlsx.writeFile(filePath);
  console.log(`✓ 180-Day Expansion Calendar generated: ${filePath}`);
}

// ----------------------------------------------------
// 3. B2B SALES LEAD TRACKER WORKBOOK
// ----------------------------------------------------
async function generateB2BLeadTracker() {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'FR8X Commercial Team';
  wb.created = new Date();

  const ws = wb.addWorksheet('B2B_Prospect_Pipeline', {
    views: [{ state: 'frozen', xSplit: 0, ySplit: 2 }],
  });

  ws.columns = [
    { header: 'Lead ID', key: 'id', width: 10 },
    { header: 'Date Added', key: 'date', width: 12 },
    { header: 'Contact Person', key: 'name', width: 20 },
    { header: 'Designation', key: 'title', width: 22 },
    { header: 'Company Name', key: 'company', width: 28 },
    { header: 'Port Gateway / City', key: 'port', width: 20 },
    { header: 'Key Trade Lanes', key: 'lanes', width: 28 },
    { header: 'WhatsApp / Phone', key: 'phone', width: 18 },
    { header: 'Email Address', key: 'email', width: 26 },
    { header: 'Outreach Channel', key: 'channel', width: 16 },
    { header: 'Pipeline Status', key: 'status', width: 18 },
    { header: 'Assigned Rep', key: 'rep', width: 16 },
    { header: 'Next Action Date', key: 'nextAction', width: 16 },
    { header: 'Estimated Deal Value', key: 'dealValue', width: 20 },
    { header: 'Strategic Notes', key: 'notes', width: 34 },
  ];

  ws.spliceRows(1, 0, ['FR8X GLOBAL B2B SALES LEAD & PROSPECT PIPELINE TRACKER']);
  ws.mergeCells('A1:O1');
  ws.getCell('A1').font = FONT_TITLE;
  ws.getRow(1).height = 32;

  const hRow = ws.getRow(2);
  hRow.height = 28;
  hRow.eachCell((cell) => {
    cell.fill = TEAL_FILL;
    cell.font = FONT_HEADER;
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    cell.border = BORDER_THIN;
  });

  const sampleLeads = [
    ['FR8-001', '2026-11-01', 'Rajesh Kulkarni', 'Managing Director', 'Apex Sea Logistics Pvt Ltd', 'Mumbai (Nhava Sheva)', 'Nhava Sheva → Jebel Ali, Rotterdam', '+91 98201 12345', 'rkulkarni@apexsealog.in', 'WhatsApp', '30-Day Trial Active', 'Rajat Rai', '2026-11-28', 59988, 'Activated 30-day Enterprise pass. Regularly benchmarking Jebel Ali rates.'],
    ['FR8-002', '2026-11-02', 'Sunil Malhotra', 'Head of Ocean Pricing', 'Continental Transline India', 'Delhi NCR (ICD TKD)', 'Delhi → Hamburg, Felixstowe', '+91 98110 54321', 'sunil@continentaltrans.com', 'LinkedIn', 'Demo Scheduled', 'Rajat Rai', '2026-11-26', 119988, 'Needs reverse auction for 40HC garment containers out of TKD.'],
    ['FR8-003', '2026-11-03', 'Captain Kevin Vance', 'General Manager', 'Gulf Liner Services FZCO', 'Dubai (Jebel Ali)', 'Jebel Ali → Karachi, Nhava Sheva', '+971 50 882 1290', 'kvance@gulfliner.ae', 'WhatsApp', 'Converted Paid', 'Rajat Rai', '2026-12-05', 240000, 'Subscribed to Enterprise Annual Plan + booked 2 sponsored feed ad slots.'],
    ['FR8-004', '2026-11-05', 'Anand Swaminathan', 'Proprietor & Licensed CHA', 'Swaminathan Cargo Forwarders', 'Chennai Port', 'Chennai → Singapore, Port Klang', '+91 94440 98765', 'anand@swaminathancargo.in', 'Direct Call', '30-Day Trial Active', 'Rajat Rai', '2026-11-30', 29988, 'Testing Trade Careers module to hire junior customs documentation clerk.'],
    ['FR8-005', '2026-11-07', 'Markus Schneider', 'Managing Partner', 'Hanseatic Forwarding GmbH', 'Hamburg / Bremen', 'Rotterdam → Mundra, Nhava Sheva', '+49 40 3891 2200', 'm.schneider@hanseatic-fwd.de', 'LinkedIn', 'Discovery Call', 'Rajat Rai', '2026-11-27', 150000, 'Wants to use Freight Passport to verify Indian delivery agents before releasing BLs.'],
    ['FR8-006', '2026-11-10', 'Pooja Agarwal', 'HR & Admin Head', 'Indo-Pacific Logistics Ltd', 'Kolkata', 'Kolkata → Chittagong, Colombo', '+91 98300 45678', 'pooja@indopacificlog.com', 'WhatsApp', 'Converted Paid', 'Rajat Rai', '2026-12-10', 45000, 'Posted 3 job requisitions on Trade Careers board. Hired 2 clerks in 5 days.'],
    ['FR8-007', '2026-11-12', 'David Lim', 'Director of Trade Operations', 'SingaTrans Logistics Pte Ltd', 'Singapore (PSA)', 'Singapore → Nhava Sheva, Mundra', '+65 9123 4567', 'david.lim@singatrans.sg', 'Email Outbound', 'Demo Scheduled', 'Rajat Rai', '2026-11-29', 180000, 'Interested in API feeds and live reverse container spot auctions.'],
    ['FR8-008', '2026-11-15', 'Vikramaditya Rao', 'Vice President - Logistics', 'Deccan Freight Express', 'Hyderabad / Vizag', 'Vizag → Durban, Mombasa', '+91 98490 11223', 'rao@deccanfreight.com', 'WhatsApp', 'Replied', 'Rajat Rai', '2026-11-25', 59988, 'Asked for demo recording and rate benchmark export sample.'],
  ];

  sampleLeads.forEach((row, idx) => {
    const r = ws.addRow(row);
    r.height = 24;
    r.eachCell((cell, colNum) => {
      cell.font = FONT_DATA;
      cell.border = BORDER_THIN;
      cell.alignment = {
        vertical: 'middle',
        horizontal: colNum === 1 || colNum === 2 || colNum === 11 || colNum === 13 ? 'center' : 'left',
      };
      if (colNum === 14) cell.numFmt = '₹#,##0';
      if (idx % 2 === 1) cell.fill = LIGHT_FILL;

      if (colNum === 11) {
        if (cell.value === 'Converted Paid') {
          cell.fill = GREEN_FILL;
          cell.font = { ...FONT_DATA, bold: true, color: { argb: 'FF059669' } };
        } else if (cell.value === '30-Day Trial Active' || cell.value === 'Demo Scheduled') {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF3C7' } };
          cell.font = { ...FONT_DATA, bold: true, color: { argb: 'FFD97706' } };
        }
      }
    });
  });

  const filePath = path.join(outputDir, 'FR8X_B2B_LEAD_TRACKER.xlsx');
  await wb.xlsx.writeFile(filePath);
  console.log(`✓ B2B Lead Tracker generated: ${filePath}`);
}

async function main() {
  console.log('Generating Excel Spreadsheets with ExcelJS...\n');
  await generate90DayCalendar();
  await generate180DayExpansionCalendar();
  await generateB2BLeadTracker();
  console.log('\nAll Excel workbooks generated successfully!');
}

main().catch(console.error);
