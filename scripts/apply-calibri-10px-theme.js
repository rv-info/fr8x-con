const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// 1. REVISE components/ui/BootstrapIcons.tsx to fix the mismatching icons
console.log('Refining icons in components/ui/BootstrapIcons.tsx...');
const iconsPath = path.join(ROOT, 'components', 'ui', 'BootstrapIcons.tsx');
let iconsCode = fs.readFileSync(iconsPath, 'utf8');

// Replace BiRss with an open outline RSS icon WITHOUT the outer square frame
const openRssSvg = `// rss (Refined Open Outline Wave - No Box Frame)
export const BiRss = createIcon(
  'rss',
  <>
    <circle cx="3.5" cy="12.5" r="1.5" />
    <path d="M2 7.5a6 6 0 0 1 6 6" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    <path d="M2 3a10.5 10.5 0 0 1 10.5 10.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </>
);`;

iconsCode = iconsCode.replace(
  /\/\/ rss\s*export const BiRss = createIcon\([\s\S]*?\n\);\n/m,
  openRssSvg + '\n\n'
);

// Add BiGavel (Authentic Legal Auction Gavel Outline)
const legalGavelSvg = `// gavel (Authentic Legal Auction Gavel Outline - Matching Outline Weight)
export const BiGavel = createIcon(
  'gavel',
  <>
    <path d="M14.5 2.1a1 1 0 0 0-1.4 0L11.7 3.5 13 4.8l1.4-1.4a1 1 0 0 0 0-1.3z" />
    <path d="m11 4.2-2.3-2.3a.7.7 0 0 0-1 0l-.8.8a.7.7 0 0 0 0 1l.6.6-5.8 5.8a1 1 0 0 0 0 1.4l1.4 1.4a1 1 0 0 0 1.4 0l5.8-5.8.6.6a.7.7 0 0 0 1 0l.8-.8a.7.7 0 0 0 0-1L11 5.6z" />
    <path d="M1 14.5a.6.6 0 0 1 .6-.5h6.8a.6.6 0 0 1 0 1.2H1.6a.6.6 0 0 1-.6-.6z" />
  </>
);`;

if (!iconsCode.includes('BiGavel')) {
  iconsCode = iconsCode.replace(
    /\/\/ hammer\s*export const BiHammer = createIcon\([\s\S]*?\n\);\n/m,
    `$&` + legalGavelSvg + '\n\n'
  );
} else {
  iconsCode = iconsCode.replace(
    /\/\/ gavel[\s\S]*?\n\);\n/m,
    legalGavelSvg + '\n\n'
  );
}

// Update compatibility aliases in BootstrapIcons.tsx
// Map Gavel to BiGavel, LayoutDashboard to BiColumnsGap
iconsCode = iconsCode.replace(/export const Gavel = BiHammer;/g, 'export const Gavel = BiGavel;');
iconsCode = iconsCode.replace(/export const LayoutDashboard = BiSpeedometer2;/g, 'export const LayoutDashboard = BiColumnsGap;');

fs.writeFileSync(iconsPath, iconsCode, 'utf8');
console.log('✅ components/ui/BootstrapIcons.tsx updated with matching icons.');

// 2. REVISE app/globals.css for Calibri 10px (beside headings) & dark visible text
console.log('Updating app/globals.css for Calibri 10px (beside headings) & dark text...');
const globalsPath = path.join(ROOT, 'app', 'globals.css');
let globalsCss = fs.readFileSync(globalsPath, 'utf8');

// Replace the tail rules at the end of app/globals.css with strict 10px (beside headings) and dark visible text
const newTailRules = `
/* ==========================================================================
   STRICT GLOBAL MANDATORY CALIBRI 10PX (BESIDE HEADINGS) & DARK VISIBLE TEXT
   - All general text: Strictly 10px (Calibri, sans-serif)
   - Headings: Prominent hierarchy (h1: 16px, h2: 13px, h3/h4: 11px)
   - Dark visible text: #111827 (Primary), #4B5563 (Secondary)
   - Clean matching outline iconography throughout
   ========================================================================== */

*, ::before, ::after {
  font-family: Calibri, sans-serif !important;
}

/* Universal Page Canvas & Default Text Standard */
body, html,
p, span, div, li, ul, ol,
button, input, select, textarea, optgroup, option,
label, td, th, b, strong, em, small, a,
.btn, .input, .select, .label, .card, .panel,
.badge, .chip, .tag, .pill, .breadcrumb, .breadcrumbs,
.nav a, .nav button, .mobile-nav-label,
.tab, .tabs button, .tabs a,
.helper-text, .secondary-text, .meta-text, .caption,
.error-text, .invalid-feedback, .error-message,
.dashboard-kpi-label {
  font-family: Calibri, sans-serif !important;
  font-size: 10px !important;
}

/* Canvas Background & Base Dark Visible Typography */
body, html,
.app, .view, .main, main, .view-container,
.gf-main, .gf-main-container, .gf-content-viewport,
.login-viewport, .reg-viewport,
.dashboard-welcome, .activity-item, .deadline-item, .dashboard-auction-row {
  background-color: #FAFBF7 !important;
  color: #111827 !important;
  line-height: 1.4 !important;
  -webkit-font-smoothing: antialiased;
}

/* Headings Hierarchy (Beside Headings Exception - Clear Prominent Scale) */
h1, .page-title, .h1 {
  font-family: Calibri, sans-serif !important;
  font-size: 16px !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
  color: #111827 !important;
  letter-spacing: -0.01em;
}

h2, .section-title, .h2 {
  font-family: Calibri, sans-serif !important;
  font-size: 13px !important;
  font-weight: 600 !important;
  line-height: 1.35 !important;
  color: #111827 !important;
  letter-spacing: -0.005em;
}

h3, h4, h5, h6, .subheading, .cardhead b, .h3, .h4 {
  font-family: Calibri, sans-serif !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  line-height: 1.35 !important;
  color: #111827 !important;
}

/* KPI Numbers: Prominent metric size */
.kpi-value, .stat-value, .metric-value, .dashboard-kpi-value {
  font-family: Calibri, sans-serif !important;
  font-size: 14px !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
  color: #111827 !important;
}

.dashboard-kpi-label {
  font-family: Calibri, sans-serif !important;
  font-size: 10px !important;
  font-weight: 400 !important;
  color: #4B5563 !important;
  margin-top: 2px;
}

/* Dark, Visible High-Contrast Text */
b, strong, .strong {
  font-weight: 700 !important;
  color: #111827 !important;
}

/* Secondary & Muted Text: Dark Slate Gray #4B5563 for sharp visibility */
small, .secondary-text, .meta-text, .caption, .helper-text,
.breadcrumb, .breadcrumbs, .text-secondary, .text-muted, .subtext {
  font-size: 10px !important;
  font-weight: 400 !important;
  color: #4B5563 !important;
  line-height: 1.35 !important;
}

/* Error & Validation Messages: Red #DC2626 */
.error-text, .invalid-feedback, .error-message, .validation-error {
  font-size: 10px !important;
  font-weight: 500 !important;
  color: #DC2626 !important;
  line-height: 1.3 !important;
}

/* Navigation & Sidebar: White surface, subtle 1px border */
.side, .sidebar-wrapper, .gf-sidebar {
  background-color: #FFFFFF !important;
  border-right: 1px solid #DDE7E1 !important;
}

.top, .gf-topbar, .topbar {
  background-color: #FFFFFF !important;
  border-bottom: 1px solid #DDE7E1 !important;
}

.nav button, .nav a {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 32px;
  background: #FFFFFF !important;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0 10px;
  color: #111827 !important;
  font-size: 10px !important;
  font-weight: 500 !important;
  text-decoration: none;
  transition: all 0.15s ease-in-out;
}

.nav button:hover, .nav a:hover {
  background-color: #E8F7EF !important;
  color: #111827 !important;
  border-color: #DDE7E1 !important;
}

/* Active Navigation State */
.nav a.on,
.nav button.on,
.mobile-nav-item.active,
[aria-current="page"] {
  background-color: #E8F7EF !important;
  background: #E8F7EF !important;
  border: 1px solid #15803D !important;
  border-left: 3px solid #15803D !important;
  border-radius: 4px !important;
  color: #111827 !important;
  font-weight: 600 !important;
}

/* Navigation Icons: Consistent sizing and alignment */
.nav a.on svg,
.nav button.on svg,
.nav a[aria-current="page"] svg,
.nav button[aria-current="page"] svg,
.mobile-nav-item.active svg,
[aria-current="page"] svg,
.nav a.on .bi,
.mobile-nav-item.active .bi {
  color: #15803D !important;
  fill: #15803D !important;
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.side .nav a:not(.on):not([aria-current="page"]) svg,
.side .nav a:not(.on):not([aria-current="page"]) .bi,
.side .sidefoot a:not(.on) svg,
.side .sidefoot button svg,
.mobile-nav-item:not(.active) svg,
.mobile-nav-item:not(.active) .bi {
  color: #4B5563 !important;
  fill: #4B5563 !important;
}

.side .nav a:not(.on):not([aria-current="page"]):hover svg,
.side .nav a:not(.on):not([aria-current="page"]):hover .bi,
.side .sidefoot a:hover svg,
.side .sidefoot button:hover svg {
  color: #111827 !important;
  fill: #111827 !important;
}

/* Mobile Bottom Navigation */
.mobile-bottom-nav {
  background-color: #FFFFFF !important;
  border-top: 1px solid #DDE7E1 !important;
}

.mobile-nav-item {
  color: #4B5563 !important;
  font-size: 10px !important;
}

.mobile-nav-item.active {
  color: #111827 !important;
  background-color: #E8F7EF !important;
}

.mobile-nav-active-dot {
  background-color: #15803D !important;
}

/* Tab Controls Standardisation */
.tab, .tabs button, .tabs a,
.feed-tab-btn, .auctions-tab-btn, .bidding-tab-btn, .rates-mobile-tab-btn {
  background-color: #FFFFFF !important;
  border: 1px solid #DDE7E1 !important;
  color: #4B5563 !important;
  font-size: 10px !important;
  font-weight: 500 !important;
  border-radius: 4px !important;
  padding: 5px 12px !important;
  transition: all 0.15s ease;
}

.tab:hover, .tabs button:hover, .tabs a:hover,
.feed-tab-btn:hover, .auctions-tab-btn:hover, .bidding-tab-btn:hover, .rates-mobile-tab-btn:hover {
  background-color: #E8F7EF !important;
  color: #111827 !important;
  border-color: #15803D !important;
}

.tab.active, .tab.on,
.tabs button.active, .tabs button.on,
.tabs a.active, .tabs a.on,
.feed-tab-btn.active, .auctions-tab-btn.active,
.bidding-tab-btn.active, .rates-mobile-tab-btn.active {
  background-color: #E8F7EF !important;
  border: 1px solid #15803D !important;
  color: #111827 !important;
  font-weight: 600 !important;
}

/* Tables Standardisation: 10px text, #111827 dark color, 1px solid #E5E7EB row dividers */
table, .table {
  width: 100%;
  background-color: #FFFFFF !important;
  font-size: 10px !important;
  line-height: 1.4 !important;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background-color: #FFFFFF !important;
  color: #111827 !important;
  font-size: 10px !important;
  font-weight: 600 !important;
  line-height: 1.3 !important;
  padding: 7px 10px;
  border-bottom: 1px solid #E5E7EB !important;
  text-align: left;
}

td {
  background-color: #FFFFFF !important;
  color: #111827 !important;
  font-size: 10px !important;
  font-weight: 400 !important;
  line-height: 1.4 !important;
  padding: 7px 10px;
  border-bottom: 1px solid #E5E7EB !important;
  vertical-align: middle;
}

tr:hover td {
  background-color: #E8F7EF !important;
}

/* Forms & Inputs Standardisation: Pure White, 10px, 1px solid #D1D5DB, Focus: #15803D */
label, .label, .form-label, .field-label {
  font-size: 10px !important;
  font-weight: 500 !important;
  color: #111827 !important;
  line-height: 1.3 !important;
  margin-bottom: 3px;
  display: block;
}

input, select, textarea, .input, .select, .reg-input, .login-card input {
  background-color: #FFFFFF !important;
  border: 1px solid #D1D5DB !important;
  border-radius: 4px !important;
  color: #111827 !important;
  font-size: 10px !important;
  font-weight: 400 !important;
  padding: 5px 8px !important;
  line-height: 1.35 !important;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input:focus, select:focus, textarea:focus, .input:focus, .select:focus, .reg-input:focus, .login-card input:focus {
  border-color: #15803D !important;
  box-shadow: 0 0 0 2px rgba(21, 128, 61, 0.22) !important;
}

::placeholder {
  color: #6B7280 !important;
  opacity: 0.9;
}

/* Buttons Standardisation: 10px, Semibold, 4px radius */
button, .btn {
  font-size: 10px !important;
  font-weight: 600 !important;
  border-radius: 4px !important;
  line-height: 1.25 !important;
  padding: 5px 12px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.btn.primary, button.primary-btn {
  background-color: #15803D !important;
  color: #FFFFFF !important;
  border: 1px solid #15803D !important;
}

.btn.primary:hover, button.primary-btn:hover {
  background-color: #166534 !important;
  border-color: #166534 !important;
}

.btn.secondary {
  background-color: #FFFFFF !important;
  color: #111827 !important;
  border: 1px solid #D1D5DB !important;
}

.btn.secondary:hover {
  background-color: #E8F7EF !important;
  border-color: #15803D !important;
  color: #111827 !important;
}

/* Card & Container Standardisation: Pure White, 6px radius, 1px solid #DDE7E1 */
.card, .panel, .dashboard-kpi-card, .login-card, .reg-container {
  background-color: #FFFFFF !important;
  border: 1px solid #DDE7E1 !important;
  border-radius: 6px !important;
  box-shadow: none !important;
}

/* Modal Standardisation: Pure White, 8px radius, 1px solid #DDE7E1 */
.modal-content, .drawer, .modal, .dialog {
  background-color: #FFFFFF !important;
  border: 1px solid #DDE7E1 !important;
  border-radius: 8px !important;
}

/* Dropdown Menus: Pure White, 4px radius, 1px solid #DDE7E1 */
.dropdown-menu, .select-options, .popover, .dropdown-content {
  background-color: #FFFFFF !important;
  border: 1px solid #DDE7E1 !important;
  border-radius: 4px !important;
  box-shadow: 0 4px 12px rgba(17, 24, 39, 0.08) !important;
}

/* Status Indicators */
.badge, .chip, .tag, .pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px !important;
  font-weight: 500 !important;
  line-height: 1.2;
  background-color: #FFFFFF !important;
}

.badge.green, .badge.success, .status-live, .status-active {
  background-color: #FFFFFF !important;
  color: #15803D !important;
  border: 1px solid #86EFAC !important;
}

.badge.amber, .badge.warning, .status-pending {
  background-color: #FFFFFF !important;
  color: #B45309 !important;
  border: 1px solid #FDE68A !important;
}

.badge.red, .badge.danger, .badge.error, .status-expired {
  background-color: #FFFFFF !important;
  color: #DC2626 !important;
  border: 1px solid #FECACA !important;
}

.badge.blue, .badge.info {
  background-color: #FFFFFF !important;
  color: #111827 !important;
  border: 1px solid #D1D5DB !important;
}

.badge.grey, .badge.neutral {
  background-color: #FFFFFF !important;
  color: #4B5563 !important;
  border: 1px solid #D1D5DB !important;
}

/* KPI Icon Containers */
.dashboard-kpi-icon {
  background-color: #FFFFFF !important;
  border: 1px solid #DDE7E1 !important;
  border-radius: 4px;
}

/* Dividers & Borders */
hr, .divider, .separator, .border-t, .border-b, .border-l, .border-r {
  border-color: #E5E7EB !important;
}

/* Print Styles */
@media print {
  body, html {
    background: #FFFFFF !important;
    background-color: #FFFFFF !important;
    color: #111827 !important;
    font-family: Calibri, sans-serif !important;
    font-size: 10px !important;
  }
  .side, .top, .mobile-bottom-nav, .desktop-only-collapse, nav {
    display: none !important;
  }
  .card, .panel, table, .modal-content {
    border: 1px solid #DDE7E1 !important;
    box-shadow: none !important;
    background-color: #FFFFFF !important;
  }
  th, td {
    border-bottom: 1px solid #E5E7EB !important;
    font-size: 10px !important;
  }
}
`;

// Replace the tail rules at the end of app/globals.css
const lastMarker = globalsCss.indexOf('/* Gate 16 Compatibility Reference Tokens:');
if (lastMarker !== -1) {
  const tailStart = globalsCss.indexOf('/* ==========================================================================', lastMarker);
  if (tailStart !== -1) {
    globalsCss = globalsCss.slice(0, tailStart) + newTailRules.trim() + '\n';
  } else {
    globalsCss += '\n' + newTailRules.trim() + '\n';
  }
} else {
  globalsCss += '\n' + newTailRules.trim() + '\n';
}

fs.writeFileSync(globalsPath, globalsCss, 'utf8');
console.log('✅ app/globals.css updated with Calibri 10px standard and dark text.');

// 3. UPDATE app/dashboard/page.tsx
console.log('Updating app/dashboard/page.tsx with Calibri 10px & heading scale...');
const dashboardPath = path.join(ROOT, 'app', 'dashboard', 'page.tsx');
let dashboardTsx = fs.readFileSync(dashboardPath, 'utf8');

// Welcome heading: 16px Bold, dark color #111827
dashboardTsx = dashboardTsx.replace(
  /<h1 style=\{\{\s*fontSize:\s*['"]\d+px['"][^}]*\}\}>/g,
  `<h1 style={{ fontSize: '16px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#111827' }}>`
);

// Welcome subtext: 10px, dark slate #4B5563
dashboardTsx = dashboardTsx.replace(
  /<p style=\{\{\s*margin:\s*['"][^'"]*['"],\s*color:\s*['"][^'"]*['"],\s*fontSize:\s*['"]\d+px['"][^}]*\}\}>/g,
  `<p style={{ margin: '2px 0 0', color: '#4B5563', fontSize: '10px', fontWeight: 400 }}>`
);

// Section Title: 13px Semibold, color #111827
dashboardTsx = dashboardTsx.replace(
  /<span style=\{\{\s*fontSize:\s*['"]\d+px['"],\s*fontWeight:\s*600,\s*color:\s*['"][^'"]*['"]\s*\}\}\s*title="Operational Activity &amp; Financial Performance">/g,
  `<span style={{ fontSize: '13px', fontWeight: 600, color: '#111827' }} title="Operational Activity &amp; Financial Performance">`
);

// KPI Value: 14px Bold, color #111827
dashboardTsx = dashboardTsx.replace(
  /<div className="dashboard-kpi-value"[^>]*>\{kpi\.value\}<\/div>/g,
  `<div className="dashboard-kpi-value" style={{ fontSize: '14px', fontWeight: 700, color: '#111827', lineHeight: 1.2 }}>{kpi.value}</div>`
);

// KPI Label: 10px, color #4B5563
dashboardTsx = dashboardTsx.replace(
  /<div className="dashboard-kpi-label"[^>]*>\{kpi\.label\}<\/div>/g,
  `<div className="dashboard-kpi-label" style={{ fontSize: '10px', fontWeight: 400, color: '#4B5563', marginTop: '2px' }}>{kpi.label}</div>`
);

// Replace remaining hardcoded fontSizes in dashboardTsx with 10px (for links, small, etc.)
dashboardTsx = dashboardTsx.replace(/fontSize:\s*['"]9px['"]/g, `fontSize: '10px'`);
dashboardTsx = dashboardTsx.replace(/color:\s*['"]#12372A['"]/g, `color: '#111827'`);
dashboardTsx = dashboardTsx.replace(/color:\s*['"]#66736D['"]/g, `color: '#4B5563'`);

fs.writeFileSync(dashboardPath, dashboardTsx, 'utf8');
console.log('✅ app/dashboard/page.tsx updated.');

// 4. UPDATE components/layout/Sidebar.tsx
console.log('Updating components/layout/Sidebar.tsx...');
const sidebarPath = path.join(ROOT, 'components', 'layout', 'Sidebar.tsx');
let sidebarTsx = fs.readFileSync(sidebarPath, 'utf8');

// Ensure font sizes in sidebar are 10px (brand 10px Bold, labels 10px)
sidebarTsx = sidebarTsx.replace(/fontSize:\s*['"]9px['"]/g, `fontSize: '10px'`);
sidebarTsx = sidebarTsx.replace(/color:\s*['"]#12372A['"]/g, `color: '#111827'`);
sidebarTsx = sidebarTsx.replace(/color:\s*['"]#66736D['"]/g, `color: '#4B5563'`);

fs.writeFileSync(sidebarPath, sidebarTsx, 'utf8');
console.log('✅ components/layout/Sidebar.tsx updated.');

console.log('Standardisation of 10px Calibri & refined matching icons complete!');
