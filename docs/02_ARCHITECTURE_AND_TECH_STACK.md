# FR8X — Architecture & Technology Stack

## 1. High-Level Architecture Overview
FR8X is architected as a modern, high-performance, full-stack Next.js web application deployed to Vercel, integrated with Google Firebase services for authentication, real-time data persistence, file storage, and serverless compute functions.

```
+-------------------------------------------------------------------------------+
|                                CLIENT LAYER                                   |
|   Next.js 14 App Router (React 18 / TypeScript / Vanilla CSS Design Tokens)   |
|   Lucide Icons | Google Maps Places & JS API | Real-time Firestore Listeners   |
+---------------------------------------+---------------------------------------+
                                        |
                 +----------------------+----------------------+
                 |                                             |
                 v                                             v
+-----------------------------------+     +-----------------------------------+
|       VERCEL / EDGE RUNTIME       |     |        FIREBASE ECOSYSTEM         |
|  - Next.js SSR / Static Cache     |     |  - Firebase Authentication        |
|  - Secure API Routes (/api/*)     |     |  - Cloud Firestore (Real-time DB) |
|  - Rate Limiting & Edge Headers   |     |  - Firebase Cloud Storage         |
|  - CSP & Security Headers         |     |  - Firebase Cloud Functions v2    |
+-----------------------------------+     +-----------------------------------+
                 |                                             |
                 +----------------------+----------------------+
                                        |
                                        v
+-------------------------------------------------------------------------------+
|                         LOCAL OPERATIONS & CI/CD                              |
|   Docker Multi-Stage Build (Node 20 Alpine) | Firebase Emulator Suite         |
|   GitHub Actions CI/CD Pipeline | Zero-Trust Firestore Security Rules         |
+-------------------------------------------------------------------------------+
```

---

## 2. Technology Stack Selection & Rationales

| Layer | Technology | Rationale |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js 14 (App Router) + React 18 | High-efficiency server components, ultra-fast client-side routing, and production-grade API routes. |
| **Styling & Design System** | Vanilla CSS + CSS Custom Properties Design Tokens | Maximum precision, strict adherence to FR8X compact screen-wide design language, zero CSS runtime overhead. |
| **Typography** | Calibre with fallback stack (`Calibre, Inter, "Segoe UI", Arial, sans-serif`) | Professional freight enterprise aesthetics, dense tabular readability. |
| **Icons** | Lucide Icons (`lucide-react` / `@lucide/lab`) | Function-matched, clean 1.9px stroke vector icons. |
| **Authentication** | Firebase Authentication + Custom Claims | Multi-provider support, custom user claims for role/plan tier (`trial`, `pro`, `premium`, `admin`). |
| **Database** | Google Cloud Firestore | Low-latency document store with real-time listeners for live auctions, chat, and notification feeds. |
| **File Storage** | Firebase Cloud Storage | Secure object storage with strict MIME/size validation rules for Ad creatives and KYC documents. |
| **Geolocation & Maps** | Google Maps JavaScript & Places Autocomplete API | Standardized address resolution, UN/LOCODE geocoding, and IANA timezone resolution. |
| **Serverless Backend** | Next.js API Routes / Firebase Functions v2 | Atomic transaction handling, OTP verification, bidding rank computations, and payment webhooks. |
| **Local Operations** | Docker & Docker Compose + Firebase Emulator Suite | Fully isolated local development environment simulating Auth, Firestore, Storage, and Functions. |
| **Hosting & CI/CD** | Vercel + GitHub Actions | Instant global edge deployment, preview branches, and automated lint/test validation. |

---

## 3. Application Directory Structure
```
fr8x/
├── app/                                 # Next.js App Router root
│   ├── layout.tsx                       # Global layout with providers, top bar & nav
│   ├── page.tsx                         # Root redirect to /auctions or /feeds
│   ├── (auth)/                          # Authentication route group
│   │   ├── login/page.tsx               # Professional corporate login screen
│   │   ├── register/page.tsx            # Multi-card KYC registration & OTP verification
│   │   └── forgot-password/page.tsx     # Password reset flow
│   ├── (workspace)/                     # Main authenticated workspace
│   │   ├── feeds/page.tsx               # Social freight feed, search, jobs, ads
│   │   ├── nexus/page.tsx               # Community discussions, reviews & blacklist
│   │   ├── auctions/page.tsx            # Reverse auctions dashboard & creation
│   │   ├── auctions/[id]/page.tsx       # Live bid room & audit snapshot
│   │   ├── rates/page.tsx               # Rates intelligence, i-Rates editor, CSV import
│   │   ├── profile/page.tsx             # Professional profile, maps & credentials
│   │   └── profile/[id]/page.tsx        # Public/restricted counterpart profile
│   └── api/                             # Secure backend API endpoints
│       ├── auth/otp/route.ts            # OTP generation, sending & verification
│       ├── auth/domain-check/route.ts   # Corporate email validation
│       ├── auctions/create/route.ts     # Server-side auction publishing
│       ├── auctions/bid/route.ts        # Atomic bid submission & ranking
│       ├── rates/import/route.ts        # Batch CSV rate validation
│       ├── ads/book/route.ts            # Ad space booking & image validation
│       └── webhooks/payment/route.ts    # Payment gateway & subscription renewal
├── components/                          # Reusable UI component modules
│   ├── layout/                          # AppShell, TopBar, Sidebar, ToastContainer
│   ├── ui/                              # Buttons, Cards, Inputs, Modals, Tabs, Badges
│   ├── feeds/                           # FeedPostCard, CommentTree, JobPostModal, AdForm
│   ├── nexus/                           # TopicCard, ReviewRatingBars, CaseRecord
│   ├── auctions/                        # AuctionFormWizard, DynamicContainerTable, BidRoom
│   ├── rates/                           # RateTable, IRatesEditor, BulkCSVModal
│   ├── profile/                         # AddressMapPicker, ExperienceCard, LocalTimeBadge
│   └── chat/                            # TradeChatFloatingPanel, ChatThread, ContextCards
├── lib/                                 # Core libraries & utilities
│   ├── firebase/                        # Firebase client & admin SDK configurations
│   │   ├── client.ts                    # Client-side Firebase App, Auth, Firestore, Storage
│   │   ├── admin.ts                     # Server-side Firebase Admin SDK
│   │   └── emulator.ts                  # Emulator connection helpers
│   ├── context/                         # React context providers (Auth, Currency, Chat, Toast)
│   ├── utils/                           # Currency converter, rich text parser, timezone math
│   └── types/                           # TypeScript definitions for all business entities
├── docs/                                # Project documentation
├── public/                              # Static assets, fonts, icons
├── firestore.rules                      # Production Firestore Security Rules
├── firestore.indexes.json               # Firestore composite indexing configuration
├── storage.rules                        # Firebase Storage Security Rules
├── Dockerfile                           # Production multi-stage Docker build
├── docker-compose.yml                   # Docker Compose for local Firebase Emulator
├── vercel.json                          # Vercel deployment and security headers
├── .env.example                         # Environment variables template
└── package.json                         # Project dependencies and build scripts
```

---

## 4. Key Architectural Patterns
1. **Server-Enforced Commercial Truth**: Client UI calculates live previews for instant feedback, but all persistent state mutations (bid amounts, ranks, plan discounts, auction validation) are processed through atomic Firestore transactions.
2. **Dynamic Timezone Computation**: Timezones are stored as standard IANA strings (`Asia/Kolkata`, `Europe/Rotterdam`, `America/New_York`) and evaluated using native `Intl.DateTimeFormat` on the fly to render dynamic red-outline local time badges.
3. **Currency Conversion Pipeline**: Base rate amounts are preserved in their native quoted currency (USD/EUR/INR) with a global currency toggle calculating converted amounts on-the-fly without database corruption.
4. **Zero-Trust Access Control**: Firestore security rules restrict read and write access strictly to authorized, verified, and role-permitted participants.
