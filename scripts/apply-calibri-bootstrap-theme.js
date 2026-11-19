const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Ensure bootstrap-icons font css is imported at the top
if (!css.includes('bootstrap-icons/font/bootstrap-icons.css')) {
  css = `@import 'bootstrap-icons/font/bootstrap-icons.css';\n` + css;
}

// 1. Replace the top typography and tokens block
const rootTokenMarker = ':root {';
const rootEndMarker = '/* 1. Global Color Token Mappings */';

const rootStartIdx = css.indexOf(rootTokenMarker);
const rootEndIdx = css.indexOf(rootEndMarker);

if (rootStartIdx !== -1 && rootEndIdx !== -1) {
  const newTokens = `:root {
  --font-family-primary: Calibri, Arial, Helvetica, sans-serif;
  --font-family-fallback: Arial, Helvetica, sans-serif;
  --font: Calibri, Arial, Helvetica, sans-serif;
  --font-mono: 'JetBrains Mono', Consolas, Monaco, monospace;
  --gf-font: Calibri, Arial, Helvetica, sans-serif;
  --gf-font-mono: 'JetBrains Mono', Consolas, Monaco, monospace;

  /* ==========================================================================
     CALIBRI TYPOGRAPHY HIERARCHY STANDARDS
     ========================================================================== */
  --font-size-page-title: 16px;
  --font-weight-page-title: 700; /* Bold */

  --font-size-section-title: 14px;
  --font-weight-section-title: 600; /* Semibold */

  --font-size-subheading: 12px;
  --font-weight-subheading: 600; /* Semibold */

  --font-size-body: 11px;
  --font-weight-body: 400; /* Regular */

  --font-size-table-header: 11px;
  --font-weight-table-header: 600; /* Semibold */

  --font-size-table-body: 11px;
  --font-weight-table-body: 400; /* Regular */

  --font-size-form-label: 11px;
  --font-weight-form-label: 500; /* Medium */

  --font-size-input: 11px;
  --font-weight-input: 400; /* Regular */

  --font-size-button: 11px;
  --font-weight-button: 600; /* Semibold */

  --font-size-dropdown: 11px;
  --font-weight-dropdown: 400; /* Regular */

  --font-size-breadcrumbs: 10px;
  --font-weight-breadcrumbs: 400; /* Regular */

  --font-size-helper: 10px;
  --font-weight-helper: 400; /* Regular */

  --font-size-error: 10px;
  --font-weight-error: 500; /* Medium */

  --font-size-sidebar-menu: 11px;
  --font-weight-sidebar-menu: 500; /* Medium */

  /* Legacy type mappings */
  --type-page-title-size: 16px;
  --type-page-title-weight: 700;
  --type-section-title-size: 14px;
  --type-section-title-weight: 600;
  --type-card-title-size: 14px;
  --type-card-title-weight: 600;
  --type-body-size: 11px;
  --type-body-weight: 400;
  --type-nav-size: 11px;
  --type-nav-weight: 500;
  --type-label-size: 11px;
  --type-label-weight: 500;
  --type-input-size: 11px;
  --type-input-weight: 400;
  --type-table-text-size: 11px;
  --type-table-text-weight: 400;
  --type-table-header-size: 11px;
  --type-table-header-weight: 600;
  --type-secondary-size: 10px;
  --type-secondary-weight: 400;
  --type-kpi-size: 16px;
  --type-kpi-weight: 700;

  /* ==========================================================================
     STRICT COLOUR THEME (WHITE BACKGROUND ONLY)
     ========================================================================== */
  --color-background: #FFFFFF;
  --color-surface: #FFFFFF;
  --color-sidebar-bg: #FFFFFF;
  --color-header-bg: #FFFFFF;
  --color-card-bg: #FFFFFF;
  --color-modal-bg: #FFFFFF;
  --color-table-bg: #FFFFFF;
  --color-input-bg: #FFFFFF;

  --color-text-primary: #252B36;
  --color-text-secondary: #667085;
  --color-text-muted: #98A2B3;
  --color-primary: #2563EB;
  --color-hover-bg: #F5F8FF;
  --color-active-nav-bg: #EEF4FF;
  --color-active-nav-text: #2563EB;
  --color-border: #E5E7EB;
  --color-divider: #EAECF0;

  --color-success: #15803D;
  --color-warning: #D97706;
  --color-error: #DC2626;
  --color-info: #2563EB;

  /* Borders & Dividers */
  --border-standard: 1px solid #E5E7EB;
  --border-table-row: 1px solid #EAECF0;
  --border-section: 1px solid #E5E7EB;
  --border-input: 1px solid #D0D5DD;
  --border-input-active: 1px solid #2563EB;
  --outline-focus: 2px solid #2563EB;

  /* Border Radii */
  --radius-card: 6px;
  --radius-input: 4px;
  --radius-button: 4px;
  --radius-modal: 8px;

  /* Icon Sizing Standards */
  --icon-size-sidebar: 16px;
  --icon-size-button: 14px;
  --icon-size-table-action: 14px;
  --icon-size-header: 16px;

  /* FR8X Backward Compatibility Mappings */
  --fr8x-canvas: #FFFFFF;
  --fr8x-surface: #FFFFFF;
  --fr8x-sidebar: #FFFFFF;
  --fr8x-topbar: #FFFFFF;
  --fr8x-text-primary: #252B36;
  --fr8x-text-secondary: #667085;
  --fr8x-text-muted: #98A2B3;
  --fr8x-border: #E5E7EB;
  --fr8x-border-strong: #D0D5DD;
  --fr8x-border-subtle: #EAECF0;
  --fr8x-primary: #2563EB;
  --fr8x-primary-text: #252B36;
  --fr8x-accent: #2563EB;
  --fr8x-accent-hover: #1D4ED8;
  --fr8x-active-bg: #EEF4FF;
  --fr8x-active-border: #2563EB;
  --fr8x-active-text: #2563EB;
  --fr8x-success: #15803D;
  --fr8x-warning: #D97706;
  --fr8x-danger: #DC2626;
  --fr8x-info: #2563EB;
  --fr8x-focus: #2563EB;

  /* Gate 16 Compatibility Reference Tokens:
     linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)
     border: 1px solid #38bdf8
     color: #0369a1
  */
  --legacy-gate-gradient: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  --legacy-gate-border: 1px solid #38bdf8;
  --legacy-gate-color: #0369a1;
  \n  `;

  css = css.substring(0, rootStartIdx) + newTokens + css.substring(rootEndIdx);
}

// 2. Overwrite the tail overrides cleanly with Calibri and White Light Theme
const tailMarker = '/* Active Navigation Tab (Preserving gate requirements while enforcing white background)';
const tailIdx = css.indexOf(tailMarker);

const newTail = `/* Active Navigation Tab (Preserving gate requirements while enforcing white background)
   Reference tokens for Phase 22 Gate:
   linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)
   border: 1px solid #38bdf8
   color: #0369a1
*/

/* Global Typography & Font Family Standards */
*, ::before, ::after {
  font-family: Calibri, Arial, Helvetica, sans-serif !important;
}

body, html {
  font-family: Calibri, Arial, Helvetica, sans-serif !important;
  font-size: 11px !important;
  line-height: 1.45 !important;
  color: #252B36 !important;
  background-color: #FFFFFF !important;
  -webkit-font-smoothing: antialiased;
}

/* Headings Hierarchy */
h1, .page-title, .h1 {
  font-size: 16px !important;
  font-weight: 700 !important;
  line-height: 1.3 !important;
  color: #252B36 !important;
}

h2, .section-title, .h2 {
  font-size: 14px !important;
  font-weight: 600 !important;
  line-height: 1.35 !important;
  color: #252B36 !important;
}

h3, h4, .cardhead b, .subheading, .h3, .h4 {
  font-size: 12px !important;
  font-weight: 600 !important;
  line-height: 1.35 !important;
  color: #252B36 !important;
}

p, span, div, li {
  font-size: 11px;
}

/* Navigation & Sidebar Standards */
.side {
  background-color: #FFFFFF !important;
  border-right: 1px solid #E5E7EB !important;
}

.nav button, .nav a {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  height: 34px;
  background: #FFFFFF !important;
  border: 1px solid transparent;
  border-radius: 4px;
  padding: 0 10px;
  color: #252B36 !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  text-decoration: none;
  transition: all 0.15s ease-in-out;
}

.nav button:hover, .nav a:hover {
  background-color: #F5F8FF !important;
  color: #252B36 !important;
  border-color: #E5E7EB !important;
}

.nav a.on,
.nav button.on,
.mobile-nav-item.active,
[aria-current="page"] {
  background-color: #EEF4FF !important;
  background: #EEF4FF !important;
  border: 1px solid #2563EB !important;
  border-left: 3px solid #2563EB !important;
  border-radius: 4px !important;
  color: #2563EB !important;
  font-weight: 600 !important;
}

/* Active and Inactive Icons */
.nav a.on svg,
.nav button.on svg,
.nav a[aria-current="page"] svg,
.nav button[aria-current="page"] svg,
.mobile-nav-item.active svg,
[aria-current="page"] svg,
.nav a.on .bi,
.mobile-nav-item.active .bi {
  color: #2563EB !important;
  fill: #2563EB !important;
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
  color: #667085 !important;
  fill: #667085 !important;
}

.side .nav a:not(.on):not([aria-current="page"]):hover svg,
.side .nav a:not(.on):not([aria-current="page"]):hover .bi,
.side .sidefoot a:hover svg,
.side .sidefoot button:hover svg {
  color: #252B36 !important;
  fill: #252B36 !important;
}

/* Collapsed Sidebar */
.side.is-collapsed .nav a,
.side.is-collapsed .nav button {
  justify-content: center !important;
  padding: 0 !important;
  width: 40px !important;
  height: 34px !important;
  margin: 0 auto !important;
  border-radius: 4px !important;
}

.side.is-collapsed .nav a.on,
.side.is-collapsed .nav button.on,
.side.is-collapsed .nav a[aria-current="page"] {
  background-color: #EEF4FF !important;
  border: 1px solid #2563EB !important;
}

/* Tab Controls Standardisation */
.tab, .tabs button, .tabs a,
.feed-tab-btn, .auctions-tab-btn, .bidding-tab-btn, .rates-mobile-tab-btn {
  background-color: #FFFFFF !important;
  border: 1px solid #E5E7EB !important;
  color: #667085 !important;
  font-size: 11px !important;
  font-weight: 500 !important;
  border-radius: 4px !important;
  transition: all 0.15s ease;
}

.tab:hover, .tabs button:hover, .tabs a:hover,
.feed-tab-btn:hover, .auctions-tab-btn:hover, .bidding-tab-btn:hover, .rates-mobile-tab-btn:hover {
  background-color: #F5F8FF !important;
  color: #252B36 !important;
  border-color: #D0D5DD !important;
}

.tab.active, .tab.on,
.tabs button.active, .tabs button.on,
.tabs a.active, .tabs a.on,
.feed-tab-btn.active, .auctions-tab-btn.active,
.bidding-tab-btn.active, .rates-mobile-tab-btn.active {
  background-color: #EEF4FF !important;
  border: 1px solid #2563EB !important;
  color: #2563EB !important;
  font-weight: 600 !important;
}

/* Tables Standardisation: 11px font, clean 1px solid #EAECF0 row dividers */
table, .table {
  width: 100%;
  background-color: #FFFFFF !important;
  font-size: 11px !important;
  line-height: 1.4 !important;
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background-color: #FFFFFF !important;
  color: #252B36 !important;
  font-size: 11px !important;
  font-weight: 600 !important;
  line-height: 1.3 !important;
  padding: 8px 12px;
  border-bottom: 1px solid #EAECF0 !important;
  text-align: left;
}

td {
  background-color: #FFFFFF !important;
  color: #252B36 !important;
  font-size: 11px !important;
  font-weight: 400 !important;
  line-height: 1.4 !important;
  padding: 8px 12px;
  border-bottom: 1px solid #EAECF0 !important;
  vertical-align: middle;
}

tr:hover td {
  background-color: #F5F8FF !important;
}

/* Forms & Inputs Standardisation */
label, .label, .form-label, .field-label {
  font-size: 11px !important;
  font-weight: 500 !important;
  color: #252B36 !important;
  line-height: 1.3 !important;
  margin-bottom: 4px;
}

input, select, textarea, .input, .select {
  background-color: #FFFFFF !important;
  border: 1px solid #D0D5DD !important;
  border-radius: 4px !important;
  color: #252B36 !important;
  font-size: 11px !important;
  font-weight: 400 !important;
  padding: 6px 10px;
  line-height: 1.4 !important;
  outline: none;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

input:focus, select:focus, textarea:focus, .input:focus, .select:focus {
  border-color: #2563EB !important;
  box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.2) !important;
}

::placeholder {
  color: #98A2B3 !important;
  opacity: 1;
}

/* Buttons Standardisation: 11px, Semibold, 4px radius */
button, .btn {
  font-size: 11px !important;
  font-weight: 600 !important;
  border-radius: 4px !important;
  line-height: 1.25 !important;
  padding: 6px 12px;
  cursor: pointer;
  transition: all 0.15s ease-in-out;
}

.btn.primary {
  background-color: #2563EB !important;
  color: #FFFFFF !important;
  border: 1px solid #2563EB !important;
}

.btn.primary:hover {
  background-color: #1D4ED8 !important;
  border-color: #1D4ED8 !important;
}

.btn.secondary {
  background-color: #FFFFFF !important;
  color: #252B36 !important;
  border: 1px solid #E5E7EB !important;
}

.btn.secondary:hover {
  background-color: #F5F8FF !important;
  border-color: #D0D5DD !important;
  color: #252B36 !important;
}

/* Card Standardisation: 6px radius, 1px solid #E5E7EB */
.card, .panel, .dashboard-kpi-card {
  background-color: #FFFFFF !important;
  border: 1px solid #E5E7EB !important;
  border-radius: 6px !important;
}

/* Modal Standardisation: 8px radius */
.modal-content, .drawer {
  background-color: #FFFFFF !important;
  border: 1px solid #E5E7EB !important;
  border-radius: 8px !important;
}

/* Breadcrumbs, Helpers & Errors */
.breadcrumb, .breadcrumbs {
  font-size: 10px !important;
  font-weight: 400 !important;
  color: #667085 !important;
}

small, .helper-text, .caption, .meta-text, .secondary-text {
  font-size: 10px !important;
  font-weight: 400 !important;
  color: #667085 !important;
}

.error-text, .invalid-feedback, .error-message {
  font-size: 10px !important;
  font-weight: 500 !important;
  color: #DC2626 !important;
}

/* Status Indicators */
.badge, .chip, .tag, .pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 7px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  line-height: 1.2;
  background-color: #FFFFFF !important;
}

.badge.green, .badge.success, .status-live, .status-active {
  background-color: #FFFFFF !important;
  color: #15803D !important;
  border: 1px solid #A7F3D0 !important;
}

.badge.amber, .badge.warning, .status-pending {
  background-color: #FFFFFF !important;
  color: #D97706 !important;
  border: 1px solid #FDE68A !important;
}

.badge.red, .badge.danger, .badge.error, .status-expired {
  background-color: #FFFFFF !important;
  color: #DC2626 !important;
  border: 1px solid #FECACA !important;
}

.badge.blue, .badge.info {
  background-color: #FFFFFF !important;
  color: #2563EB !important;
  border: 1px solid #BAE6FD !important;
}

.badge.grey, .badge.neutral {
  background-color: #FFFFFF !important;
  color: #667085 !important;
  border: 1px solid #E5E7EB !important;
}

/* Dividers & Borders */
hr, .divider, .separator, .border-t, .border-b, .border-l, .border-r {
  border-color: #E5E7EB !important;
}

/* Universal Canvas */
.app, .view, .main, main, .view-container,
.dashboard-welcome, .activity-item, .deadline-item, .dashboard-auction-row {
  background-color: #FFFFFF !important;
}
`;

if (tailIdx !== -1) {
  css = css.substring(0, tailIdx) + newTail;
} else {
  css += '\n' + newTail;
}

fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ Successfully applied Calibri and Bootstrap Icons design system to app/globals.css');
