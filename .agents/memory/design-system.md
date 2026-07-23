# FR8X-CON Design System Reference

> **Purpose**: Quick reference for colors, typography, component classes, and compact design decisions.

## Color Palette

### Brand Colors (original)
| Token | Hex | Usage |
|-------|-----|-------|
| brand-50 | `#EBF8FF` | Hover backgrounds, active nav items |
| brand-100 | `#D1EEFC` | Avatar backgrounds |
| brand-400 | `#56C5F0` | Primary/CTA, focus rings |
| brand-500 | `#3ABFF0` | Primary hover |
| brand-700 | `#1E7BB0` | Active text |
| brand-950 | `#072D42` | Ticker background, admin sidebar |

### fr8x-9 Theme Colors (Page 13)
| CSS Variable | Hex | Tailwind Token | Usage |
|-------------|-----|----------------|-------|
| `--fr8x-bg` | `#F7F7FF` | `fr8x.bg` | Page background |
| `--fr8x-charcoal` | `#535657` | `fr8x.charcoal` | Active input borders |
| `--fr8x-lavender` | `#E5D9F2` | `fr8x.lavender` | Input accent, text box bg |
| `--fr8x-periwinkle` | `#A594F9` | `fr8x.periwinkle` | Nav bar, tab backgrounds |
| `--fr8x-mist` | `#EDE6F2` | `fr8x.mist` | Active button bg |
| `--fr8x-dimgrey` | `#746D75` | `fr8x.dimgrey` | Button borders |
| `--fr8x-jet` | `#253031` | `fr8x.jet` | Primary text |
| `--fr8x-frozen` | `#C5E7E2` | `fr8x.frozen` | Feed composer bg |

### Semantic Colors
| Token | Hex | Usage |
|-------|-----|-------|
| success | `#10B981` | Active badges, approved status |
| warning | `#F59E0B` | Pending badges, stale indicators |
| danger | `#EF4444` | Error states, delete actions |

## Typography Scale
| Class | Size | Weight | Line Height |
|-------|------|--------|-------------|
| `text-display-xl` | 3rem | 700 | 1.1 |
| `text-display-lg` | 2.25rem | 700 | 1.2 |
| `text-display-sm` | 1.5rem | 600 | 1.3 |
| `text-heading-lg` | 1.25rem | 600 | 1.4 |
| `text-heading-md` | 1.125rem | 600 | 1.4 |
| `text-heading-sm` | 1rem | 600 | 1.5 |
| `text-body-lg` | 1rem | 400 | 1.6 |
| `text-body-md` | 0.875rem | 400 | 1.6 |
| `text-body-sm` | 0.8125rem | 400 | 1.5 |
| `text-caption` | 0.75rem | 400 | 1.4 |

Font stack: Inter, system-ui, -apple-system, Segoe UI, Roboto, sans-serif

## Component Classes

### Cards
- `.fr8x-card` — bg-white, rounded-lg, border, shadow-card
- `.fr8x-card-hover` — same + hover shadow
- `.fr8x-card-compact` — reduced padding (p-2), smaller border-radius

### Buttons
- `.fr8x-btn-primary` — brand-400 bg, white text, hover → brand-500
- `.fr8x-btn-secondary` — white bg, border, hover → bg-background
- `.fr8x-btn-ghost` — no bg, hover → bg-background
- All: `disabled:opacity-50, active:scale-[0.98]`

### Inputs
- `.fr8x-input` — border, rounded-md, px-3 py-2, focus → brand-400 ring
- `.fr8x-label` — text-body-sm font-medium

### Tables
- `.fr8x-table` — full-width, text-body-md
- `.fr8x-table th` — uppercase, tracking-wider, text-body-sm, bg-background
- `.fr8x-table td` — px-4 py-3, border-b
- `.fr8x-table-compact` — smaller row height (py-1.5), text-body-sm on td

### Badges
- `.fr8x-badge` — pill shape, px-2.5 py-0.5, text-caption
- Variants: `-active` (green), `-pending` (yellow), `-danger` (red), `-info` (brand blue)

### Layout
- `.fr8x-ticker` — h-[28px], brand-950 bg, text-[11px]
- `.fr8x-container` — max-w-[1440px], px-4/6/8 responsive
- `.fr8x-nav-item` — flex, gap-3, rounded-lg, py-1.5

## Compact Design Rules
1. **Sidebar**: Collapsed (56px icons-only) by default, expands to 200px on hover
2. **TopNav**: 48px height (down from 64px)
3. **Ticker**: 28px height (down from 36px)
4. **Card padding**: p-2 to p-3 (down from p-4 to p-5)
5. **Table rows**: py-1.5 (down from py-3)
6. **Page container**: py-3 (down from py-6)
7. **Font in tables/data**: text-body-sm or text-caption
8. **Grid gaps**: gap-3 (down from gap-6)

## Responsive Breakpoints
| Name | Width |
|------|-------|
| sm | 640px |
| md | 768px |
| lg | 1024px |
| xl | 1280px |
| 2xl | 1536px |

Sidebar hidden below `lg`. Mobile menu via TopNav hamburger.
