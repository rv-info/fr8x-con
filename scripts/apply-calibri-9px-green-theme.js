const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

// 1. UPDATE app/globals.css
console.log('Updating app/globals.css...');
const globalsPath = path.join(ROOT, 'app', 'globals.css');
let globalsCss = fs.readFileSync(globalsPath, 'utf8');

// Replace the :root design tokens and global styles
const newRootAndTheme = `
@property --border-angle {
  syntax: '<angle>';
  inherits: false;
  initial-value: 0deg;
}

:root {
  /* ==========================================================================
     MANDATORY CALIBRI 9PX DESIGN SYSTEM TOKENS
     ========================================================================== */
  --font-family-primary: Calibri, sans-serif;
  --font-family-fallback: sans-serif;
  --font: Calibri, sans-serif;
  --font-mono: 'JetBrains Mono', Consolas, Monaco, monospace;
  --gf-font: Calibri, sans-serif;
  --gf-font-mono: 'JetBrains Mono', Consolas, Monaco, monospace;

  /* Typography Hierarchy - All Strict 9px Without Exception */
  --font-size-base: 9px;
  --font-size-page-title: 9px;
  --font-weight-page-title: 700; /* Bold */

  --font-size-section-title: 9px;
  --font-weight-section-title: 600; /* Semibold */

  --font-size-subheading: 9px;
  --font-weight-subheading: 600; /* Semibold */

  --font-size-body: 9px;
  --font-weight-body: 400; /* Regular */

  --font-size-table-header: 9px;
  --font-weight-table-header: 600; /* Semibold */

  --font-size-table-body: 9px;
  --font-weight-table-body: 400; /* Regular */

  --font-size-form-label: 9px;
  --font-weight-form-label: 500; /* Medium */

  --font-size-input: 9px;
  --font-weight-input: 400; /* Regular */

  --font-size-button: 9px;
  --font-weight-button: 600; /* Semibold */

  --font-size-dropdown: 9px;
  --font-weight-dropdown: 400; /* Regular */

  --font-size-breadcrumbs: 9px;
  --font-weight-breadcrumbs: 400; /* Regular */

  --font-size-helper: 9px;
  --font-weight-helper: 400; /* Regular */

  --font-size-error: 9px;
  --font-weight-error: 500; /* Medium */

  --font-size-sidebar-menu: 9px;
  --font-weight-sidebar-menu: 500; /* Medium */

  --font-size-kpi: 9px;
  --font-weight-kpi: 700;

  /* Legacy type mappings mapped strictly to 9px */
  --type-page-title-size: 9px;
  --type-page-title-weight: 700;
  --type-section-title-size: 9px;
  --type-section-title-weight: 600;
  --type-card-title-size: 9px;
  --type-card-title-weight: 600;
  --type-body-size: 9px;
  --type-body-weight: 400;
  --type-nav-size: 9px;
  --type-nav-weight: 500;
  --type-label-size: 9px;
  --type-label-weight: 500;
  --type-input-size: 9px;
  --type-input-weight: 400;
  --type-table-text-size: 9px;
  --type-table-text-weight: 400;
  --type-table-header-size: 9px;
  --type-table-header-weight: 600;
  --type-secondary-size: 9px;
  --type-secondary-weight: 400;
  --type-kpi-size: 9px;
  --type-kpi-weight: 700;

  /* ==========================================================================
     APPROVED 5-COLOUR ENTERPRISE PALETTE
     ========================================================================== */
  --color-deep-green: #12372A;
  --color-money-green: #3FA66B;
  --color-pale-mint: #E8F7EF;
  --color-off-white: #FAFBF7;
  --color-neutral-gray: #66736D;

  /* Semantic Color Application */
  --color-background: #FAFBF7;
  --color-page-bg: #FAFBF7;
  --color-surface: #FFFFFF;
  --color-card-bg: #FFFFFF;
  --color-table-bg: #FFFFFF;
  --color-input-bg: #FFFFFF;
  --color-modal-bg: #FFFFFF;
  --color-sidebar-bg: #FFFFFF;
  --color-header-bg: #FFFFFF;

  --color-text-primary: #12372A;
  --color-text-secondary: #66736D;
  --color-text-muted: #66736D;

  --color-primary: #3FA66B;
  --color-primary-hover: #348E5B;
  --color-hover-bg: #E8F7EF;
  --color-active-nav-bg: #E8F7EF;
  --color-active-nav-text: #12372A;
  --color-active-nav-accent: #3FA66B;

  --color-border: #DDE7E1;
  --color-divider: #E3ECE7;
  --color-focus: #3FA66B;

  /* Status Colors */
  --color-success: #3FA66B;
  --color-warning: #C07A00;
  --color-error: #DC2626;
  --color-info: #12372A;

  /* Component Borders & Radii */
  --border-standard: 1px solid #DDE7E1;
  --border-table-row: 1px solid #E3ECE7;
  --border-section: 1px solid #DDE7E1;
  --border-input: 1px solid #DDE7E1;
  --border-input-active: 1px solid #3FA66B;
  --outline-focus: 2px solid #3FA66B;

  --radius-card: 6px;
  --radius-input: 4px;
  --radius-button: 4px;
  --radius-modal: 8px;

  /* Icon Sizing Standards */
  --icon-size-sidebar: 16px;
  --icon-size-button: 13px;
  --icon-size-table-action: 13px;
  --icon-size-header: 16px;

  /* Compatibility & Legacy Aliases */
  --fr8x-canvas: #FAFBF7;
  --fr8x-surface: #FFFFFF;
  --fr8x-sidebar: #FFFFFF;
  --fr8x-topbar: #FFFFFF;
  --fr8x-text-primary: #12372A;
  --fr8x-text-secondary: #66736D;
  --fr8x-text-muted: #66736D;
  --fr8x-border: #DDE7E1;
  --fr8x-border-strong: #DDE7E1;
  --fr8x-border-subtle: #E3ECE7;
  --fr8x-primary: #3FA66B;
  --fr8x-primary-text: #12372A;
  --fr8x-accent: #3FA66B;
  --fr8x-accent-hover: #348E5B;
  --fr8x-active-bg: #E8F7EF;
  --fr8x-active-border: #3FA66B;
  --fr8x-active-text: #12372A;
  --fr8x-success: #3FA66B;
  --fr8x-warning: #C07A00;
  --fr8x-danger: #DC2626;
  --fr8x-info: #12372A;
  --fr8x-focus: #3FA66B;

  /* Gate 16 Compatibility Reference Tokens:
     linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)
     border: 1px solid #38bdf8
     color: #0369a1
  */
  --legacy-gate-gradient: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  --legacy-gate-border: 1px solid #38bdf8;
  --legacy-gate-color: #0369a1;

  --color-bg-app: var(--fr8x-canvas);
  --color-nav-active-bg: var(--fr8x-active-bg);
  --color-nav-active-text: var(--fr8x-active-text);
  --bg: var(--fr8x-canvas);
  --card: var(--fr8x-surface);
  --ink: var(--fr8x-text-primary);
  --ink-secondary: var(--fr8x-text-secondary);
  --mut: var(--fr8x-text-secondary);
  --faint: var(--fr8x-text-muted);
  --line: var(--fr8x-border);
  --line-light: var(--fr8x-border-subtle);
  --brand: var(--fr8x-accent);
  --brand2: var(--fr8x-accent-hover);
  --primary: var(--fr8x-primary);
  --nav: var(--fr8x-sidebar);
  --navhi: var(--fr8x-active-bg);
  --nav-border: var(--fr8x-border);
  --green: var(--fr8x-success);
  --amber: #C07A00;
  --red: #DC2626;

  --r-xs: 4px;
  --r-sm: 6px;
  --r-md: 8px;
  --r-lg: 12px;
  --r-xl: 16px;
  --r: 6px;

  --sidebar-width: 240px;
  --sidebar-collapsed-width: 64px;
  --header-height: 56px;
}
`;

// Replace from "@property --border-angle" down to "--header-height: 56px;\n}"
const propertyIndex = globalsCss.indexOf('@property --border-angle');
const headerHeightIndex = globalsCss.indexOf('--header-height: 56px;', propertyIndex);
if (propertyIndex !== -1 && headerHeightIndex !== -1) {
  const closingBraceIndex = globalsCss.indexOf('}', headerHeightIndex);
  globalsCss = globalsCss.slice(0, propertyIndex) + newRootAndTheme.trim() + globalsCss.slice(closingBraceIndex + 1);
}

// Global tail CSS rules for strict Calibri 9px, white cards, off-white canvas, green palette
const globalTailRules = `
/* ==========================================================================
   STRICT GLOBAL MANDATORY CALIBRI 9PX & APPROVED 5-COLOUR PALETTE
   Palette: DEEP GREEN #12372A, MONEY GREEN #3FA66B, PALE MINT #E8F7EF,
            OFF WHITE #FAFBF7, NEUTRAL GRAY #66736D
   ========================================================================== */

/* 1. Global Typography: Strict Calibri 9px for ALL text elements */
*, ::before, ::after {
  font-family: Calibri, sans-serif !important;
}

body, html,
h1, h2, h3, h4, h5, h6,
p, span, div, li, ul, ol,
button, input, select, textarea, optgroup, option,
label, td, th, b, strong, em, small, a,
.h1, .h2, .h3, .h4, .page-title, .section-title,
.btn, .input, .select, .label, .card, .panel,
.badge, .chip, .tag, .pill, .breadcrumb, .breadcrumbs,
.nav a, .nav button, .mobile-nav-label,
.tab, .tabs button, .tabs a,
.kpi-value, .stat-value, .metric-value, .dashboard-kpi-value,
.helper-text, .secondary-text, .meta-text, .caption,
.error-text, .invalid-feedback, .error-message {
  font-family: Calibri, sans-serif !important;
  font-size: 9px !important;
}

/* Page canvas: Off-white #FAFBF7 */
body, html,
.app, .view, .main, main, .view-container,
.gf-main, .gf-main-container, .gf-content-viewport,
.login-viewport, .reg-viewport,
.dashboard-welcome, .activity-item, .deadline-item, .dashboard-auction-row {
  background-color: #FAFBF7 !important;
  color: #12372A !important;
  line-height: 1.35 !important;
  -webkit-font-smoothing: antialiased;
}

/* Headings Hierarchy - Distinct Weights, Strict 9px, Deep Green #12372A */
h1, .page-title, .h1 {
  font-size: 9px !important;
  font-weight: 700 !important;
  line-height: 1.25 !important;
  color: #12372A !important;
  letter-spacing: -0.01em;
}

h2, .section-title, .h2 {
  font-size: 9px !important;
  font-weight: 600 !important;
  line-height: 1.3 !important;
  color: #12372A !important;
  letter-spacing: -0.005em;
}

h3, h4, h5, h6, .subheading, .cardhead b, .h3, .h4 {
  font-size: 9px !important;
  font-weight: 600 !important;
  line-height: 1.35 !important;
  color: #12372A !important;
}

b, strong, .strong {
  font-weight: 700 !important;
  color: #12372A !important;
}

p, span, div, li {
  line-height: 1.4 !important;
}

/* Secondary & Muted Text: Neutral Gray #66736D */
small, .secondary-text, .meta-text, .caption, .helper-text,
.breadcrumb, .breadcrumbs, .text-secondary, .text-muted, .subtext {
  font-size: 9px !important;
  font-weight: 400 !important;
  color: #66736D !important;
  line-height: 1.35 !important;
}

/* Error & Validation: Red #DC2626 */
.error-text, .invalid-feedback, .error-message, .validation-error {
  font-size: 9px !important;
  font-weight: 500 !important;
  color: #DC2626 !important;
  line-height: 1.3 !important;
}

/* 2. Navigation & Sidebar Standards: White background, subtle 1px border */
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
  height: 30px;
  background: #FFFFFF !important;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0 10px;
  color: #12372A !important;
  font-size: 9px !important;
  font-weight: 500 !important;
  text-decoration: none;
  transition: all 0.15s ease-in-out;
}

.nav button:hover, .nav a:hover {
  background-color: #E8F7EF !important;
  color: #12372A !important;
  border-color: #DDE7E1 !important;
}

/* Active Navigation State: Pale Mint #E8F7EF background, Money Green #3FA66B border & icon */
.nav a.on,
.nav button.on,
.mobile-nav-item.active,
[aria-current="page"] {
  background-color: #E8F7EF !important;
  background: #E8F7EF !important;
  border: 1px solid #3FA66B !important;
  border-left: 3px solid #3FA66B !important;
  border-radius: 4px !important;
  color: #12372A !important;
  font-weight: 600 !important;
}

/* Navigation Icons */
.nav a.on svg,
.nav button.on svg,
.nav a[aria-current="page"] svg,
.nav button[aria-current="page"] svg,
.mobile-nav-item.active svg,
[aria-current="page"] svg,
.nav a.on .bi,
.mobile-nav-item.active .bi {
  color: #3FA66B !important;
  fill: #3FA66B !important;
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
  color: #66736D !important;
  fill: #66736D !important;
}

.side .nav a:not(.on):not([aria-current="page"]):hover svg,
.side .nav a:not(.on):not([aria-current="page"]):hover .bi,
.side .sidefoot a:hover svg,
.side .sidefoot button:hover svg {
  color: #12372A !important;
  fill: #12372A !important;
}

/* Mobile Bottom Navigation */
.mobile-bottom-nav {
  background-color: #FFFFFF !important;
  border-top: 1px solid #DDE7E1 !important;
}

.mobile-nav-item {
  color: #66736D !important;
  font-size: 9px !important;
}

.mobile-nav-item.active {
  color: #12372A !important;
  background-color: #E8F7EF !important;
}

.mobile-nav-active-dot {
  background-color: #3FA66B !important;
}

/* Tab Controls Standardisation */
.tab, .tabs button, .tabs a,
.feed-tab-btn, .auctions-tab-btn, .bidding-tab-btn, .rates-mobile-tab-btn {
  background-color: #FFFFFF !important;
  border: 1px solid #DDE7E1 !important;
  color: #66736D !important;
  font-size: 9px !important;
  font-weight: 500 !important;
  border-radius: 4px !important;
  padding: 4px 10px !important;
  transition: all 0.15s ease;
}

.tab:hover, .tabs button:hover, .tabs a:hover,
.feed-tab-btn:hover, .auctions-tab-btn:hover, .bidding-tab-btn:hover, .rates-mobile-tab-btn:hover {
  background-color: #E8F7EF !important;
  color: #12372A !important;
  border-color: #3FA66B !important;
}

.tab.active, .tab.on,
.tabs button.active, .tabs button.on,
.tabs a.active, .tabs a.on,
.feed-tab-btn.active, .auctions-tab-btn.active,
.bidding-tab-btn.active, .rates-mobile-tab-btn.active {
  background-color: #E8F7EF !important;
  border: 1px solid #3FA66B !important;
  color: #12372A !important;
  font-weight: 600 !important;
}

/* 3. Tables Standardisation: Pure White #FFFFFF background, 9px text, 1px solid #E3ECE7 row dividers */
table, .table {
  width: 100%;
  background-color: #FFFFFF !important;
  font-size: 9px !important;
  line-height: 1.4 !important;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background-color: #FFFFFF !important;
  color: #12372A !important;
  font-size: 9px !important;
  font-weight: 600 !important;
  line-height: 1.3 !important;
  padding: 6px 10px;
  border-bottom: 1px solid #E3ECE7 !important;
  text-align: left;
}

td {
  background-color: #FFFFFF !important;
  color: #12372A !important;
  font-size: 9px !important;
  font-weight: 400 !important;
  line-height: 1.4 !important;
  padding: 6px 10px;
  border-bottom: 1px solid #E3ECE7 !important;
  vertical-align: middle;
}

tr:hover td {
  background-color: #E8F7EF !important;
}

/* 4. Forms & Inputs Standardisation: Pure White, 9px, 1px solid #DDE7E1, Focus: #3FA66B */
label, .label, .form-label, .field-label {
  font-size: 9px !important;
  font-weight: 500 !important;
  color: #12372A !important;
  line-height: 1.3 !important;
  margin-bottom: 3px;
  display: block;
}

input, select, textarea, .input, .select, .reg-input, .login-card input {
  background-color: #FFFFFF !important;
  border: 1px solid #DDE7E1 !important;
  border-radius: 4px !important;
  color: #12372A !important;
  font-size: 9px !important;
  font-weight: 400 !important;
  padding: 5px 8px !important;
  line-height: 1.35 !important;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input:focus, select:focus, textarea:focus, .input:focus, .select:focus, .reg-input:focus, .login-card input:focus {
  border-color: #3FA66B !important;
  box-shadow: 0 0 0 2px rgba(63, 166, 107, 0.22) !important;
}

::placeholder {
  color: #66736D !important;
  opacity: 0.8;
}

/* 5. Buttons Standardisation: 9px, Semibold, 4px radius */
button, .btn {
  font-size: 9px !important;
  font-weight: 600 !important;
  border-radius: 4px !important;
  line-height: 1.25 !important;
  padding: 5px 10px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.btn.primary, button.primary-btn {
  background-color: #3FA66B !important;
  color: #FFFFFF !important;
  border: 1px solid #3FA66B !important;
}

.btn.primary:hover, button.primary-btn:hover {
  background-color: #348E5B !important;
  border-color: #348E5B !important;
}

.btn.secondary {
  background-color: #FFFFFF !important;
  color: #12372A !important;
  border: 1px solid #DDE7E1 !important;
}

.btn.secondary:hover {
  background-color: #E8F7EF !important;
  border-color: #3FA66B !important;
  color: #12372A !important;
}

/* 6. Card & Container Standardisation: Pure White, 6px radius, 1px solid #DDE7E1 */
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
  box-shadow: 0 4px 12px rgba(18, 55, 42, 0.08) !important;
}

/* Status Indicators */
.badge, .chip, .tag, .pill {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 9px !important;
  font-weight: 500 !important;
  line-height: 1.2;
  background-color: #FFFFFF !important;
}

.badge.green, .badge.success, .status-live, .status-active {
  background-color: #FFFFFF !important;
  color: #3FA66B !important;
  border: 1px solid #A8E5C4 !important;
}

.badge.amber, .badge.warning, .status-pending {
  background-color: #FFFFFF !important;
  color: #C07A00 !important;
  border: 1px solid #FDE68A !important;
}

.badge.red, .badge.danger, .badge.error, .status-expired {
  background-color: #FFFFFF !important;
  color: #DC2626 !important;
  border: 1px solid #FECACA !important;
}

.badge.blue, .badge.info {
  background-color: #FFFFFF !important;
  color: #12372A !important;
  border: 1px solid #DDE7E1 !important;
}

.badge.grey, .badge.neutral {
  background-color: #FFFFFF !important;
  color: #66736D !important;
  border: 1px solid #DDE7E1 !important;
}

/* KPI Values: 9px, Bold 700, Deep Green */
.kpi-value, .stat-value, .metric-value, .dashboard-kpi-value {
  color: #12372A !important;
  font-size: 9px !important;
  font-weight: 700 !important;
  line-height: 1.2 !important;
}

.dashboard-kpi-label {
  color: #66736D !important;
  font-size: 9px !important;
  font-weight: 400 !important;
}

/* KPI Icon Containers */
.dashboard-kpi-icon {
  background-color: #FFFFFF !important;
  border: 1px solid #DDE7E1 !important;
  border-radius: 4px;
}

/* Dividers & Borders */
hr, .divider, .separator, .border-t, .border-b, .border-l, .border-r {
  border-color: #DDE7E1 !important;
}

/* Print Styles: Clean formatting on standard white paper */
@media print {
  body, html {
    background: #FFFFFF !important;
    background-color: #FFFFFF !important;
    color: #12372A !important;
    font-family: Calibri, sans-serif !important;
    font-size: 9px !important;
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
    border-bottom: 1px solid #E3ECE7 !important;
    font-size: 9px !important;
  }
}
`;

// Replace the tail rules at the end of app/globals.css
const lastMarker = globalsCss.indexOf('/* Gate 16 Compatibility Reference Tokens:');
if (lastMarker !== -1) {
  const tailStart = globalsCss.indexOf('/* Global Typography & Font Family Standards */', lastMarker);
  if (tailStart !== -1) {
    globalsCss = globalsCss.slice(0, tailStart) + globalTailRules.trim() + '\n';
  } else {
    globalsCss += '\n' + globalTailRules.trim() + '\n';
  }
} else {
  globalsCss += '\n' + globalTailRules.trim() + '\n';
}

fs.writeFileSync(globalsPath, globalsCss, 'utf8');
console.log('✅ app/globals.css updated successfully.');

// 2. UPDATE app/dashboard/page.tsx
console.log('Updating app/dashboard/page.tsx...');
const dashboardPath = path.join(ROOT, 'app', 'dashboard', 'page.tsx');
let dashboardTsx = fs.readFileSync(dashboardPath, 'utf8');

// Update KPIs array colors in dashboard/page.tsx
dashboardTsx = dashboardTsx.replace(
  /const kpis = \[\s*[\s\S]*?\];/m,
  `const kpis = [
    { label: 'Active Auctions', value: activeAuctions, icon: <Gavel size={13} />, color: '#3FA66B', href: '/auctions' },
    { label: 'My Posted', value: myPostedActive, icon: <Activity size={13} />, color: '#12372A', href: '/auctions' },
    { label: 'Bids Submitted', value: bidsParticipated, icon: <TrendingUp size={13} />, color: '#3FA66B', href: '/auctions' },
    { label: 'Bids Won', value: bidsWon, icon: <Award size={13} />, color: '#3FA66B', href: '/auctions' },
    { label: 'Drafts', value: myPostedDrafts, icon: <FileText size={13} />, color: '#66736D', href: '/auctions' },
    { label: 'Unread Alerts', value: unreadNotifs, icon: <Bell size={13} />, color: '#66736D', href: '/feeds' },
    { label: 'Saved Posts', value: savedPosts, icon: <Bookmark size={13} />, color: '#12372A', href: '/feeds' },
    { label: 'Active Jobs', value: jobs.filter((j) => j.status === 'active').length, icon: <Briefcase size={13} />, color: '#3FA66B', href: '/jobs' },
  ];`
);

// Update Quick Actions
dashboardTsx = dashboardTsx.replace(
  /const quickActions = \[\s*[\s\S]*?\];/m,
  `const quickActions = [
    { label: 'Create Auction', href: '/auctions/create', icon: <Gavel size={12} />, primary: true },
    { label: 'Browse Rates', href: '/rates', icon: <BarChart3 size={12} />, primary: false },
    { label: 'View Nexus', href: '/nexus', icon: <Globe2 size={12} />, primary: false },
    { label: 'Browse Jobs', href: '/jobs', icon: <Briefcase size={12} />, primary: false },
  ];`
);

// Update Welcome Card in dashboard/page.tsx
dashboardTsx = dashboardTsx.replace(
  /<h1 style=\{\{\s*fontSize:\s*['"]\d+px['"][^}]*\}\}>/g,
  `<h1 style={{ fontSize: '9px', fontWeight: 700, margin: 0, display: 'flex', alignItems: 'center', gap: '6px', color: '#12372A' }}>`
);

dashboardTsx = dashboardTsx.replace(
  /<p style=\{\{\s*margin:\s*['"][^'"]*['"],\s*color:\s*['"][^'"]*['"],\s*fontSize:\s*['"]\d+px['"][^}]*\}\}>/g,
  `<p style={{ margin: '2px 0 0', color: '#66736D', fontSize: '9px', fontWeight: 400 }}>`
);

// Update any remaining fontSize: '11px', '12px', '14px', '16px', '10px' in dashboard/page.tsx
dashboardTsx = dashboardTsx.replace(/fontSize:\s*['"](?:10|10\.5|11|11\.5|12|12\.5|13|14|14\.5|15|16|18|20|22|24|28)px['"]/g, `fontSize: '9px'`);
dashboardTsx = dashboardTsx.replace(/border:\s*['"]1px solid #E5E7EB['"]/g, `border: '1px solid #DDE7E1'`);
dashboardTsx = dashboardTsx.replace(/color:\s*['"]#252B36['"]/g, `color: '#12372A'`);
dashboardTsx = dashboardTsx.replace(/color:\s*['"]#2563EB['"]/g, `color: '#3FA66B'`);

fs.writeFileSync(dashboardPath, dashboardTsx, 'utf8');
console.log('✅ app/dashboard/page.tsx updated successfully.');

// 3. UPDATE components/layout/Sidebar.tsx
console.log('Updating components/layout/Sidebar.tsx...');
const sidebarPath = path.join(ROOT, 'components', 'layout', 'Sidebar.tsx');
let sidebarTsx = fs.readFileSync(sidebarPath, 'utf8');

// Replace brand and user meta styling
sidebarTsx = sidebarTsx.replace(/fontSize:\s*collapsed \? '9px' : '12px'/g, `fontSize: '9px'`);
sidebarTsx = sidebarTsx.replace(/fontSize:\s*'11px'/g, `fontSize: '9px'`);
sidebarTsx = sidebarTsx.replace(/color:\s*'#000000'/g, `color: '#12372A'`);
sidebarTsx = sidebarTsx.replace(/border:\s*'1px solid #E2E8F0'/g, `border: '1px solid #DDE7E1'`);
sidebarTsx = sidebarTsx.replace(/color:\s*'#111827'/g, `color: '#12372A'`);

fs.writeFileSync(sidebarPath, sidebarTsx, 'utf8');
console.log('✅ components/layout/Sidebar.tsx updated successfully.');

// 4. UPDATE app/people-network.css
console.log('Updating app/people-network.css...');
const peopleCssPath = path.join(ROOT, 'app', 'people-network.css');
if (fs.existsSync(peopleCssPath)) {
  let peopleCss = fs.readFileSync(peopleCssPath, 'utf8');
  peopleCss = peopleCss.replace(/font-family:[^;]+;/g, `font-family: Calibri, sans-serif !important;`);
  peopleCss = peopleCss.replace(/#2563eb/gi, `#3FA66B`);
  peopleCss = peopleCss.replace(/#1d4ed8/gi, `#348E5B`);
  peopleCss = peopleCss.replace(/#002b66/gi, `#12372A`);
  peopleCss = peopleCss.replace(/#e2e8f0/gi, `#DDE7E1`);
  peopleCss = peopleCss.replace(/#cbd5e1/gi, `#DDE7E1`);
  fs.writeFileSync(peopleCssPath, peopleCss, 'utf8');
  console.log('✅ app/people-network.css updated successfully.');
}

console.log('Design system standardisation complete!');
