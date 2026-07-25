# FR8X-CON — Enterprise Logistics Auction & Network Platform

FR8X-CON is a modern, high-density reverse-auction and professional collaboration platform tailored for freight forwarders, NVOCCs, MLOs, exporters, and customs brokers.

## Key Features

1. **Enterprise Auctions & Live Bidding**: Dynamic reverse-auction engine with live rankings and container-wise rate submission.
2. **Rate Center**: High-density bulk rate upload, filtering, and carrier search tool.
3. **Professional Network Partners**: Connect, follow, and build alliances with logistics stakeholders.
4. **Interactive Feed & Ad Placements**: Real-time posts, cargo notifications, and target-audience sponsored ads.
5. **Interactive Honors Registry**: Vote, comment, and verify network partner achievements.
6. **Universal Search Dashboard**: Instantly query users, companies, RFQs, and tags with autocomplete and category-based filtering.
7. **Identity Registry**: Unique handles (`@handle`), verified badges, and business tax identity (GSTN, PAN, CIN, IEC).

## Tech Stack

* **Frontend**: Next.js 15 (App Router), React 19, TypeScript 5.7, Tailwind CSS 3
* **Backend**: Firebase 11 (Auth, Firestore DB, Storage)
* **Design**: Radix UI Primitives, Lucide icons, Framer Motion, AG-Grid Community
* **Build / Deploy**: Vercel

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Set up environment variables in `.env.local` (copy from `.env.example`).
3. Run development server:
   ```bash
   npm run dev
   ```
4. Build for production:
   ```bash
   npm run build
   ```

## Mock Test Credentials

| Email | Password | Role / Verticals |
|---|---|---|
| `support@fr8x.in` | `QWERTY@123x` | GodMode Super Admin |
| `mgt@raivega.in` | `QWERTY@123x` | Freight Forwarder Manager |
