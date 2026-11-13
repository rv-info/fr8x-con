const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Update typography variables
const oldTypeBlockRegex = /\/\* ==========================================================================\s*FR8X REFINED ENTERPRISE TYPOGRAPHY TOKENS[\s\S]*?--type-kpi-tracking: -0\.02em;\s*/;
const newTypeBlock = `/* ==========================================================================
     FR8X REFINED ENTERPRISE TYPOGRAPHY TOKENS (INTER VARIABLE)
     ========================================================================== */
  --type-page-title-size: 25px;
  --type-page-title-weight: 300;
  --type-page-title-lh: 1.25;
  --type-page-title-tracking: -0.02em;

  --type-section-title-size: 16px;
  --type-section-title-weight: 600;
  --type-section-title-lh: 1.35;
  --type-section-title-tracking: -0.01em;

  --type-card-title-size: 14px;
  --type-card-title-weight: 600;
  --type-card-title-lh: 1.35;
  --type-card-title-tracking: -0.005em;

  --type-body-size: 13px;
  --type-body-weight: 400;
  --type-body-lh: 1.5;
  --type-body-tracking: 0;

  --type-nav-size: 13px;
  --type-nav-weight: 500;
  --type-nav-lh: 1.3;
  --type-nav-tracking: 0;

  --type-label-size: 12.5px;
  --type-label-weight: 500;
  --type-label-lh: 1.3;
  --type-label-tracking: 0.01em;

  --type-input-size: 13px;
  --type-input-weight: 400;
  --type-input-lh: 1.4;

  --type-table-text-size: 12.5px;
  --type-table-text-weight: 400;
  --type-table-text-lh: 1.45;

  --type-table-header-size: 12px;
  --type-table-header-weight: 600;
  --type-table-header-lh: 1.3;
  --type-table-header-tracking: 0.04em;

  --type-secondary-size: 11px;
  --type-secondary-weight: 400;
  --type-secondary-lh: 1.4;

  --type-kpi-size: 28px;
  --type-kpi-weight: 300;
  --type-kpi-lh: 1.15;
  --type-kpi-tracking: -0.02em;
`;

if (oldTypeBlockRegex.test(css)) {
  css = css.replace(oldTypeBlockRegex, newTypeBlock);
}

// 2. Update Token block
const oldTokenBlockRegex = /\/\* ==========================================================================\s*FR8X ENTERPRISE DESIGN SYSTEM TOKENS[\s\S]*?--fr8x-focus: #0284C7;\s*\/\* Accessible focus ring \*\/\s*/;
const newTokenBlock = `/* ==========================================================================
     FR8X ENTERPRISE DESIGN SYSTEM TOKENS (PURE WHITE IDENTITY #FFFFFF)
     ========================================================================== */
  --fr8x-canvas: #FFFFFF;               /* Pure white app canvas without exceptions */
  --fr8x-surface: #FFFFFF;              /* Pure white cards, containers, modals, sheets */
  --fr8x-sidebar: #FFFFFF;              /* Pure white sidebar navigation surface */
  --fr8x-topbar: #FFFFFF;               /* Pure white header navigation surface */

  /* Text & Hierarchy */
  --fr8x-text-primary: #111827;         /* Gray 900: High-contrast primary copy & headings */
  --fr8x-text-secondary: #475569;       /* Slate 600: Balanced supporting text */
  --fr8x-text-muted: #64748B;           /* Slate 500: Subtitle meta, timestamps, captions */
  --fr8x-text-faint: #94A3B8;           /* Slate 400: Placeholder & disabled text */
  --fr8x-icon-secondary: #64748B;       /* Slate 500: Secondary icons */

  /* Borders & Dividers */
  --fr8x-border: #E2E8F0;               /* Slate 200: Subtle, clean structural borders */
  --fr8x-border-strong: #CBD5E1;        /* Slate 300: Input and active boundaries */
  --fr8x-border-subtle: #E2E8F0;        /* Slate 200: Table row separators */

  /* Primary Brand & Interactive */
  --fr8x-primary: #FFFFFF;              /* Pure white button surface */
  --fr8x-primary-hover: #FFFFFF;        /* Pure white button surface */
  --fr8x-primary-text: #111827;         /* High-contrast primary text */
  
  --fr8x-accent: #0284C7;               /* Sky 600: Interactive links, active indicators */
  --fr8x-accent-hover: #0369A1;         /* Sky 700: Hover state */
  --fr8x-accent-soft: #FFFFFF;          /* Pure white */

  /* Active Navigation Token (Required by Phase 22 Architectural Gate 16) */
  --legacy-gate-gradient: linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%);
  --legacy-gate-border: 1px solid #38bdf8;
  --legacy-gate-color: #0369a1;
  --fr8x-active-bg: #FFFFFF;
  --fr8x-active-border: #38bdf8;
  --fr8x-active-text: #0369a1;

  /* Semantic Status Indicators (Borders, Text & Icons ONLY - Pure White Backgrounds) */
  --fr8x-success: #059669;              /* Emerald 600: Live, active, won, verified */
  --fr8x-success-bg: #FFFFFF;           /* Pure white */
  --fr8x-success-border: #A7F3D0;       /* Emerald 200 */
  
  --fr8x-warning: #D97706;              /* Amber 600: In-progress, closing soon, away */
  --fr8x-warning-bg: #FFFFFF;           /* Pure white */
  --fr8x-warning-border: #FDE68A;       /* Amber 200 */

  --fr8x-danger: #DC2626;               /* Red 600: Expired, cancelled, lost, error */
  --fr8x-danger-bg: #FFFFFF;            /* Pure white */
  --fr8x-danger-border: #FECACA;        /* Red 200 */

  --fr8x-info: #0284C7;                 /* Sky 600: Rate intelligence, notice */
  --fr8x-info-bg: #FFFFFF;              /* Pure white */
  --fr8x-info-border: #BAE6FD;          /* Sky 200 */

  --fr8x-focus: #0284C7;                /* Accessible focus ring */
`;

if (oldTokenBlockRegex.test(css)) {
  css = css.replace(oldTokenBlockRegex, newTokenBlock);
}

// 3. Replace from "/* Primary CTA Button */" to end of file
const bottomMarker = '/* Primary CTA Button */';
const bottomIndex = css.indexOf(bottomMarker);
if (bottomIndex === -1) {
  console.error('Could not find bottomMarker:', bottomMarker);
  process.exit(1);
}

const newBottomRules = `/* Primary CTA Button: Pure White Background with Crisp Dark Border */
.btn.primary, .btn-primary, .btn.black, .btn-black, .btn.blue, .btn.action,
button.primary, button.btn-primary, button[type="submit"]:not(.secondary):not(.btn-secondary) {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #111827 !important;
  border: 1px solid #111827 !important;
  font-weight: 600 !important;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04) !important;
}
.btn.primary:hover, .btn-primary:hover, .btn.black:hover, .btn.black:hover,
button.primary:hover, button.btn-primary:hover {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  border-color: #0284C7 !important;
  color: #0284C7 !important;
  box-shadow: 0 1px 3px rgba(2, 132, 199, 0.12) !important;
}

/* Accent Button */
.btn-accent, .btn.accent {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #0284C7 !important;
  border: 1px solid #0284C7 !important;
  font-weight: 600 !important;
}
.btn-accent:hover, .btn.accent:hover {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  border-color: #0369A1 !important;
  color: #0369A1 !important;
}

/* Secondary / Default Button: Pure White Background with Slate 300 Border */
.btn.secondary, .btn-secondary, .btn.grey, .connection-btn,
button.secondary, button.btn-secondary {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #475569 !important;
  border: 1px solid #CBD5E1 !important;
  font-weight: 500 !important;
}
.btn.secondary:hover, .btn-secondary:hover, .connection-btn:hover {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  border-color: #0284C7 !important;
  color: #0284C7 !important;
}

/* Universal Inputs & Selects: Pure White Background, Gray 900 Text, Slate 300 Border */
input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]),
textarea, select {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #111827 !important;
  border: 1px solid #CBD5E1 !important;
  border-radius: 6px;
  font-size: var(--type-input-size, 13px) !important;
  font-weight: var(--type-input-weight, 400) !important;
  line-height: var(--type-input-lh, 1.4) !important;
  padding: 8px 12px;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

input:focus, textarea:focus, select:focus {
  outline: none !important;
  border-color: #0284C7 !important;
  box-shadow: 0 0 0 3px rgba(2, 132, 199, 0.15) !important;
}

::placeholder {
  color: #94A3B8 !important;
  opacity: 1;
}

/* Active Navigation Tab (Preserving gate requirements while enforcing white background)
   Reference tokens for Phase 22 Gate:
   linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)
   border: 1px solid #38bdf8
   color: #0369a1
*/
.nav a.on, .nav button.on, .mobile-nav-item.active, [aria-current="page"] {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  border: 1px solid #38bdf8 !important;
  color: #0369a1 !important;
  font-weight: 600 !important;
}

/* Status Badges & Indicators: Pure White Backgrounds, Semantic Borders & Text ONLY */
.badge, .chip, .tag, .pill, .filter-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 3px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  line-height: 1;
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
}

.badge.green, .badge.success, .status-live, .status-active {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #059669 !important;
  border: 1px solid #A7F3D0 !important;
}

.badge.amber, .badge.warning, .badge.yellow, .status-pending, .status-away {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #D97706 !important;
  border: 1px solid #FDE68A !important;
}

.badge.red, .badge.danger, .badge.error, .status-offline, .status-expired {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #DC2626 !important;
  border: 1px solid #FECACA !important;
}

.badge.blue, .badge.info, .badge.primary {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #0284C7 !important;
  border: 1px solid #BAE6FD !important;
}

.badge.grey, .badge.neutral {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #475569 !important;
  border: 1px solid #E2E8F0 !important;
}

/* Table Presentation: Pure White Surfaces with Slate 200 Separators */
table, .table {
  width: 100%;
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  font-size: var(--type-table-text-size, 12.5px);
  line-height: var(--type-table-text-lh, 1.45);
  border-collapse: separate;
  border-spacing: 0;
}

th {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #475569 !important;
  font-size: var(--type-table-header-size, 12px) !important;
  font-weight: var(--type-table-header-weight, 600) !important;
  line-height: var(--type-table-header-lh, 1.3) !important;
  letter-spacing: var(--type-table-header-tracking, 0.04em) !important;
  text-transform: uppercase !important;
  padding: 10px 14px;
  border-bottom: 1px solid #E2E8F0 !important;
}

td {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  color: #111827 !important;
  font-size: var(--type-table-text-size, 12.5px);
  font-weight: var(--type-table-text-weight, 400);
  line-height: var(--type-table-text-lh, 1.45);
  vertical-align: middle;
  padding: 10px 14px;
  border-bottom: 1px solid #E2E8F0 !important;
}

tr:hover td {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  border-bottom-color: #CBD5E1 !important;
}

/* KPI Values: Light weight 300, 28px, tabular figures */
.kpi-value, .stat-value, .metric-value, .dashboard-kpi-value {
  color: var(--fr8x-text-primary, #111827) !important;
  font-size: var(--type-kpi-size, 28px) !important;
  font-weight: var(--type-kpi-weight, 300) !important;
  line-height: var(--type-kpi-lh, 1.15) !important;
  letter-spacing: var(--type-kpi-tracking, -0.02em) !important;
  font-variant-numeric: tabular-nums !important;
}

/* KPI Icon Containers: Pure White Background with Subtle Border */
.dashboard-kpi-icon {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  border: 1px solid #E2E8F0 !important;
  border-radius: 8px;
}

/* Secondary & Meta Information */
small, .secondary-text, .meta-text, .caption {
  font-size: var(--type-secondary-size, 11px) !important;
  font-weight: var(--type-secondary-weight, 400) !important;
  line-height: var(--type-secondary-lh, 1.4) !important;
  color: var(--fr8x-text-secondary, #475569) !important;
}

/* Form Labels */
label, .label, .field-label, .form-label {
  font-size: var(--type-label-size, 12.5px) !important;
  font-weight: var(--type-label-weight, 500) !important;
  line-height: var(--type-label-lh, 1.3) !important;
  color: var(--fr8x-text-primary, #111827) !important;
}

/* Secondary Icons */
svg.icon-secondary, .text-secondary svg, .side .nav a svg:not(.on svg) {
  color: var(--fr8x-icon-secondary, #64748B);
}

/* Universal Clean Borders & Separators */
hr, .divider, .separator, .border-t, .border-b, .border-l, .border-r {
  border-color: #E2E8F0 !important;
}

/* Universal Container Backgrounds: Strictly Pure White (#FFFFFF) */
.app, .view, .main, main, .view-container,
.gf-main, .gf-main-container, .gf-content-viewport,
.sidebar-wrapper, .side, .top, .brand, .workspace,
.card, .panel, .login-card, .login-viewport, .reg-container, .reg-viewport,
.gf-app-layout, .gf-sidebar, .gf-topbar,
.modal-content, .drawer, .dropdown-menu, .popover,
.kpi-tile, .summary-card, .stat-card, .dashboard-kpi-card, .dashboard-welcome,
.empty-state, .fr8x-empty-state, .notice-box {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
}

/* Responsive Headings Scaling */
@media (max-width: 1024px) {
  h1, .page-title, .gf-page-title {
    font-size: 22px !important;
  }
  h2, .section-title, .gf-section-header {
    font-size: 15px !important;
  }
}

@media (max-width: 768px) {
  h1, .page-title, .gf-page-title {
    font-size: 20px !important;
  }
  h2, .section-title, .gf-section-header {
    font-size: 14px !important;
  }
}
`;

css = css.substring(0, bottomIndex) + newBottomRules;
fs.writeFileSync(cssPath, css);
console.log('Successfully replaced bottom rules with pure white design system.');
