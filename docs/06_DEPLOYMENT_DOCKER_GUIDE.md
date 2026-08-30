# FR8X — Deployment, Docker & Emulator Guide

## 1. Multi-Stage Docker Setup
For reliable local testing, staging, and containerized cloud hosting, a multi-stage Docker build is provided for Next.js:

```dockerfile
# syntax=docker/dockerfile:1

# Stage 1: Base & Dependencies
FROM node:20-alpine AS deps
WORKDIR /app
RUN apk add --no-cache libc6-compat
COPY package.json package-lock.json* ./
RUN npm ci

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

---

## 2. Docker Compose with Firebase Emulator Suite
Local development does not touch production Firebase databases. `docker-compose.yml` provides full emulator support:

```yaml
version: '3.8'

services:
  app:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=development
      - NEXT_PUBLIC_FIREBASE_EMULATOR=true
      - NEXT_PUBLIC_FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099
      - NEXT_PUBLIC_FIRESTORE_EMULATOR_HOST=localhost:8080
      - NEXT_PUBLIC_FIREBASE_STORAGE_EMULATOR_HOST=localhost:9199
    depends_on:
      - firebase-emulators

  firebase-emulators:
    image: spine3/firebase-tools:latest
    ports:
      - "4000:4000" # Emulator UI
      - "8080:8080" # Firestore
      - "9099:9099" # Auth
      - "9199:9199" # Storage
      - "5001:5001" # Functions
    volumes:
      - ./:/app
    command: firebase emulators:start --project=fr8x-local --import=/app/.emulator-data --export-on-exit
```

---

## 3. Vercel & Production Environment Configuration
In production on Vercel:
1. Link GitHub repository `fr8x-con`.
2. Configure Custom Domain: `con.fr8x.in`.
3. Set Production Environment Variables:
   - `NEXT_PUBLIC_FIREBASE_API_KEY`
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
   - `NEXT_PUBLIC_FIREBASE_APP_ID`
   - `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY`
   - `FIREBASE_ADMIN_PRIVATE_KEY`
   - `FIREBASE_ADMIN_CLIENT_EMAIL`
