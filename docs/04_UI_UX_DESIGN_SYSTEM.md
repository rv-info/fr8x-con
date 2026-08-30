# FR8X — UI/UX Design System & Style Guide

## 1. Visual Language & Design Tokens
FR8X adopts a compact, screen-wide, data-dense, enterprise logistics aesthetic. Every screen is engineered for maximum utility, rapid scanning of tabular data, and zero visual fluff.

### 1.1 CSS Custom Properties
```css
:root {
  /* Typography */
  --font: Calibre, Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
  --font-mono: "Consolas", "Courier New", monospace;

  /* Color System */
  --bg: #f4f7fb;              /* Workspace light gray background */
  --card: #ffffff;            /* Pure white container cards */
  --ink: #17243a;             /* Deep slate primary text */
  --ink-secondary: #394b61;   /* Medium slate body text */
  --mut: #68788f;             /* Muted metadata and subtext */
  --line: #dce5ef;            /* Subtle card & table border lines */
  --line-light: #edf1f5;      /* Sub-item separators */

  /* Brand Palette */
  --brand: #1168d7;           /* Primary royal blue */
  --brand-hover: #0d53ad;     /* Darker blue hover state */
  --brand-soft: #e8f1fd;      /* Soft blue badge / selection fill */
  --teal: #099889;            /* Secondary freight cyan/teal */
  --teal-soft: #e8f8f5;       /* Soft teal badge fill */

  /* Navigation Dark Theme */
  --nav: #0d1d31;             /* Sidebar midnight navy */
  --nav-hover: #17304b;       /* Sidebar item active/hover */
  --nav-border: #ffffff14;    /* Sidebar separator line */
  --nav-text: #b9c7d8;        /* Sidebar inactive label */
  --nav-active: #2dd4bf;      /* Sidebar active indicator highlight */

  /* Semantic Alerts */
  --green: #16834e;           /* Confirmed / Active status */
  --green-soft: #e7f7ed;
  --amber: #a85b05;           /* Warning / Pending status */
  --amber-soft: #fdf3e3;
  --red: #c43b4e;             /* Critical / Blacklist / Local Time outline */
  --red-soft: #fff0f1;
  --gold: #d97706;            /* Premium Golden Verified Badge */

  /* Elevation & Geometry */
  --r: 10px;                  /* Standard container border radius */
  --r-sm: 6px;                /* Inner component / button radius */
  --sh: 0 2px 12px rgba(24, 54, 89, 0.07);  /* Card soft shadow */
  --sh-lg: 0 16px 42px rgba(12, 31, 59, 0.22); /* Floating modal / chat shadow */
}
```

---

## 2. Global Layout & Component Guidelines

### 2.1 Screen-Wide Responsive Grid
- **Desktop (>1180px)**: 224px sticky sidebar + full viewport workspace view.
- **Tablet (768px – 1180px)**: Collapsible compact sidebar + responsive 2-column card layouts.
- **Mobile (<760px)**: Off-canvas hamburger drawer, single-column stacked view, bottom-docked chat triggers.

### 2.2 Top Navigation & Dynamic Location Bar
- **Location Display**: `Location: Mumbai, India` dynamically resolved from profile + geocoding.
- **Currency Converter**: Header pill displaying active conversion (e.g. `CR · USD $` or `CR · INR ₹`) with instant dropdown for global freight quotes.
- **Notifications Hub**: Badge counter and dropdown for reverse auction alerts and bid invites.

### 2.3 Local Time Dynamic Badge
Whenever a professional contact or profile is searched or viewed, a compact, red-bordered badge displays their live local time computed dynamically from their IANA timezone:
```html
<span class="local-time-badge">
  17:30 IST
</span>
```
```css
.local-time-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 700;
  color: var(--red);
  border: 1px solid var(--red);
  background: #fff;
  border-radius: 4px;
  padding: 2px 6px;
  white-space: nowrap;
}
```

### 2.4 Golden Verified Tick
Users on the **Premium** tier receive a high-visibility golden verified badge next to their names across Feeds, Nexus, Auctions, Bid Rooms, Rates, and Chat:
```html
<span class="golden-tick" title="Premium Verified Entity">✓</span>
```
```css
.golden-tick {
  display: inline-grid;
  place-items: center;
  width: 14px;
  height: 14px;
  background: linear-gradient(135deg, #f59e0b, #d97706);
  color: #fff;
  font-size: 9px;
  font-weight: 900;
  border-radius: 50%;
  margin-left: 4px;
}
```

### 2.5 Tabular Design & Compact Forms
- High density 8px vertical padding on table cells.
- Monospace numerals for rates, weights, containers, and monetary values.
- Explicit visual states for Hover, Active, Disabled, Loading Spinner, and Read-Only.
