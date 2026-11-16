const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, '..', 'app', 'globals.css');
let css = fs.readFileSync(cssPath, 'utf8');

// 1. Fix line 811 and 822 in globals.css
css = css.replace(
  /border-left:\s*3px solid var\(--fr8x-primary,\s*#147DAB\)\s*!important;/,
  'border-left: 3px solid var(--fr8x-accent, #0284C7) !important;'
);

css = css.replace(
  /\.nav button\.on svg,\s*\.nav a\.on svg,\r?\n\s*\.nav button\[aria-current="page"\] svg,\s*\.nav a\[aria-current="page"\] svg,\r?\n\s*\.gf-nav-link\.active svg,\r?\n\s*\.gf-nav-link\.active \.lucide\s*\{\r?\n\s*color:\s*var\(--fr8x-primary,\s*#147DAB\)\s*!important;\r?\n\s*\}/,
  `.nav button.on svg, .nav a.on svg,\n.nav button[aria-current="page"] svg, .nav a[aria-current="page"] svg,\n.gf-nav-link.active svg,\n.gf-nav-link.active .lucide {\n  color: var(--fr8x-accent, #0284C7) !important;\n  stroke: var(--fr8x-accent, #0284C7) !important;\n}`
);

// 2. Locate the tail overrides and update them cleanly
const tailMarker = '/* Active Navigation Tab (Preserving gate requirements while enforcing white background)';
const tailIdx = css.indexOf(tailMarker);

const newTail = `/* Active Navigation Tab (Preserving gate requirements while enforcing white background)
   Reference tokens for Phase 22 Gate:
   linear-gradient(135deg, #e0f2fe 0%, #f0f9ff 100%)
   border: 1px solid #38bdf8
   color: #0369a1
*/
.nav a.on,
.nav button.on,
.mobile-nav-item.active,
[aria-current="page"],
.tab.active,
.tabs button.active,
.tabs a.active,
.feed-tab-btn.active,
.auctions-tab-btn.active,
.bidding-tab-btn.active,
.rates-mobile-tab-btn.active {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  border: 1px solid #38bdf8 !important;
  border-left: 3px solid #0284C7 !important;
  border-radius: 6px !important;
  color: #0369a1 !important;
  font-weight: 600 !important;
  box-shadow: 0 1px 3px rgba(2, 132, 199, 0.1) !important;
}

/* Selected Active Navigation Icons: High-Visibility Sky Blue Accent (#0284C7) */
.nav a.on svg,
.nav button.on svg,
.nav a[aria-current="page"] svg,
.nav button[aria-current="page"] svg,
.mobile-nav-item.active svg,
[aria-current="page"] svg,
.nav a.on .lucide,
.nav button.on .lucide,
.mobile-nav-item.active .lucide,
[aria-current="page"] .lucide,
.tab.active svg,
.tab.active .lucide,
.feed-tab-btn.active svg,
.feed-tab-btn.active .lucide,
.auctions-tab-btn.active svg,
.auctions-tab-btn.active .lucide {
  color: #0284C7 !important;
  stroke: #0284C7 !important;
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

/* Collapsed Sidebar Navigation Precision & Sizing */
.side.is-collapsed .nav a,
.side.is-collapsed .nav button {
  justify-content: center !important;
  padding: 0 !important;
  width: 44px !important;
  height: 38px !important;
  margin: 0 auto !important;
  border-radius: 6px !important;
}

.side.is-collapsed .nav a.on,
.side.is-collapsed .nav button.on,
.side.is-collapsed .nav a[aria-current="page"] {
  border: 1px solid #38bdf8 !important;
  border-left: 1px solid #38bdf8 !important;
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  box-shadow: 0 1px 3px rgba(2, 132, 199, 0.12) !important;
}

.side.is-collapsed .nav a.on svg,
.side.is-collapsed .nav a.on .lucide {
  color: #0284C7 !important;
  stroke: #0284C7 !important;
  width: 19px !important;
  height: 19px !important;
}

/* Inactive Sidebar & Navigation Icons: Crisp Slate-500 (#64748B) */
.side .nav a:not(.on):not([aria-current="page"]) svg,
.side .nav a:not(.on):not([aria-current="page"]) .lucide,
.side .sidefoot a:not(.on) svg,
.side .sidefoot button svg,
.side .sidefoot .lucide,
.mobile-nav-item:not(.active) svg,
.mobile-nav-item:not(.active) .lucide {
  color: #64748B !important;
  stroke: #64748B !important;
  display: inline-block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.side .nav a:not(.on):not([aria-current="page"]):hover svg,
.side .nav a:not(.on):not([aria-current="page"]):hover .lucide,
.side .sidefoot a:hover svg,
.side .sidefoot button:hover svg {
  color: #111827 !important;
  stroke: #111827 !important;
}

/* Inactive tabs across all modules: Pure White Background, Slate 200 Border, High Contrast */
.tab:not(.active):not(.on),
.tabs button:not(.active):not(.on),
.tabs a:not(.active):not(.on),
.feed-tab-btn:not(.active),
.auctions-tab-btn:not(.active),
.bidding-tab-btn:not(.active),
.rates-mobile-tab-btn:not(.active) {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  border: 1px solid #E2E8F0 !important;
  color: #475569 !important;
  font-weight: 500 !important;
}

.tab:not(.active):not(.on):hover,
.tabs button:not(.active):not(.on):hover,
.tabs a:not(.active):not(.on):hover,
.feed-tab-btn:not(.active):hover,
.auctions-tab-btn:not(.active):hover,
.bidding-tab-btn:not(.active):hover,
.rates-mobile-tab-btn:not(.active):hover {
  background-color: #FFFFFF !important;
  background: #FFFFFF !important;
  border-color: #CBD5E1 !important;
  color: #111827 !important;
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
svg.icon-secondary, .text-secondary svg {
  color: var(--fr8x-icon-secondary, #64748B);
}

/* Universal Clean Borders & Separators */
hr, .divider, .separator, .border-t, .border-b, .border-l, .border-r {
  border-color: #E2E8F0 !important;
}

/* Universal Container Backgrounds: Strictly Pure White (#FFFFFF) */
.app, .view, .main, main, .view-container,
.card, .panel, .dashboard-kpi-card, .dashboard-welcome,
.modal-content, .drawer, .dropdown-menu, .popover,
.side, .top, .brand, .workspace, .sidefoot,
.feed-card, .auction-card, .rate-card, .job-card, .profile-card,
.activity-item, .deadline-item, .dashboard-auction-row {
  background-color: #FFFFFF !important;
}

/* Universal Page Canvas */
body, html {
  background-color: #FFFFFF !important;
  color: #111827 !important;
}
`;

if (tailIdx !== -1) {
  css = css.substring(0, tailIdx) + newTail;
} else {
  css += '\n' + newTail;
}

fs.writeFileSync(cssPath, css, 'utf8');
console.log('✅ Successfully applied refined enterprise visual system to app/globals.css');
