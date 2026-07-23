# FR8X-CON Project Overview

> **Purpose**: Comprehensive project reference to avoid re-reading the entire codebase each session.

## Tech Stack
- **Framework**: Next.js 15.1 (App Router) + React 19 + TypeScript 5.7
- **Styling**: Tailwind CSS 3.4 + tailwindcss-animate + class-variance-authority
- **Backend**: Firebase (Auth, Firestore, Storage) — client-side SDK v11.1
- **State**: @tanstack/react-query v5, react-hook-form v7 + zod v3
- **UI**: Radix UI primitives, lucide-react icons, framer-motion animations
- **Data Grid**: ag-grid-community + ag-grid-react v32
- **Deploy**: Vercel (Next.js optimized) — region `bom1` (Mumbai)

## Architecture
```
src/
├── app/
│   ├── (auth)/          # Public: login, register, forgot-password
│   ├── (dashboard)/     # Authenticated: feeds, auctions, rates, profile, awards, blacklist
│   ├── (admin)/         # GodMode only: godmode/* (users, auctions, awards, blacklist, settings)
│   ├── globals.css
│   ├── layout.tsx       # Root layout with AuthProvider + QueryProvider + CurrencyProvider
│   └── page.tsx         # Root redirect: → /login (unauth) or /feeds (auth) or /godmode (admin)
├── components/layout/   # Sidebar, TopNav, CurrencyTicker
├── lib/
│   ├── firebase/        # config.ts, auth.ts, firestore.ts, storage.ts
│   ├── types/           # auction.ts, auth.ts, award.ts, bid.ts, common.ts, currency.ts, feed.ts, rate.ts, user.ts
│   ├── utils/           # cn.ts, constants.ts, format.ts, sanitize.ts
│   └── validators/      # auction.ts, auth.ts
├── middleware.ts         # CSRF, CORS, rate-limit headers, security
└── providers/           # AuthProvider.tsx, CurrencyProvider.tsx, QueryProvider.tsx
```

## Route Map
| Route | Page | fr8x-9 Page |
|-------|------|------------|
| `/login` | Login | Page 1 |
| `/register` | Register + membership + payment | Page 2 |
| `/forgot-password` | Password reset | — |
| `/feeds` | Social feed (3-column: profile, posts, suggestions) | Page 3 |
| `/profile` | Own profile (edit mode) | Page 4 |
| `/profile/[userId]` | View another user's profile | Page 5 |
| `/auctions` | Auction list | — |
| `/auctions/create` | Create reverse auction | Page 8 |
| `/auctions/[auctionId]` | Live bidding | Page 9 |
| `/rates` | Rate center | Page 10 |
| `/awards` | Awards list | — |
| `/blacklist` | Blacklist registry | — |
| `/godmode` | Admin dashboard | Page 11 |
| `/godmode/users` | User management | — |
| `/godmode/auctions` | Auction oversight | — |
| `/godmode/awards` | Award management | — |
| `/godmode/blacklist` | Blacklist management | — |
| `/godmode/settings` | System settings | — |

## Firestore Collections
`users`, `profiles`, `companies`, `posts`, `comments`, `likes`, `bookmarks`, `auctions`, `auctionParticipants`, `bids`, `liveRanks`, `rates`, `awards`, `blacklists`, `currencies`, `notifications`, `audit`, `logs`, `settings`

## Mock Login Credentials
| Email | Password | Role |
|-------|----------|------|
| `support@fr8x.in` | `QWERTY@123x` | GodMode Admin |
| `mgt@raivega.in` | `QWERTY@123x` | Freight Forwarder (Management) |

Mock users bypass Firebase Auth and use localStorage persistence. Mock UIDs: `mock-uid-godmode`, `mock-uid-mgt`.

## Environment Variables (.env.local)
```
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
NEXT_PUBLIC_RECAPTCHA_SITE_KEY=
NEXT_PUBLIC_CURRENCY_API_BASE_URL=
CURRENCY_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=FR8X-CON
```

## Theme Colors (fr8x-9 Page 13)
| Token | Hex | Name |
|-------|-----|------|
| Background | `#F7F7FF` | Ghost White |
| Active text box border | `#535657` | Charcoal |
| Input accent border | `#E5D9F2` | Lavender Veil |
| Nav bar / tab background | `#A594F9` | Soft Periwinkle |
| Active button background | `#EDE6F2` | Lavender Mist |
| Active button border | `#746D75` | Dim Grey |
| Text color | `#253031` | Jet Black |
| Feeds textbox background | `#C5E7E2` | Frozen Water |
| Text box color | `#E5D9F2` | Lavender Veil |

## Key Design Decisions
- **Compact layout**: Collapsed sidebar by default (56px), 48px topnav, 28px ticker, tight card padding
- **Information density**: Tables and lists prioritized over cards; smaller fonts for data views
- **Membership tiers**: Trial (₹0/2d), Basic (₹1,499/mo or $25/mo), Premium (custom, coming soon)
- **Bidding**: Max 5 bid submissions per auction. Bids are write-protected (Cloud Functions only)
- **Currency**: Live FX ticker at top; 10 pairs (USD/INR, EUR/INR, etc.)
- **Security**: CSRF on mutations, CSP headers, RBAC via Firestore rules, GodMode superuser pattern
