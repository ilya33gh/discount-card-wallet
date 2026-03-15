# Discount Card Wallet (PWA)

Mobile-first offline-first PWA for storing and displaying loyalty/discount cards on iPhone (iOS Safari Add to Home Screen).

## Live

- App: https://example.com
- Sync API: https://example.com

## Stack

- React + TypeScript + Vite
- Dexie (IndexedDB)
- JsBarcode + QRCode
- ZXing browser scanner
- PWA: `manifest.webmanifest` + custom service worker (cache-first)

## Run

```bash
npm install
npm run dev
```

Backend (optional cloud sync API):

```bash
cd server
npm install
copy .env.example .env
npm run prisma:push
npm run dev
```

If you test on iPhone, set your PC local IP in app settings (for example `http://192.168.1.10:8787`) instead of `localhost`.

Tombstone cleanup optimization (server):

- `TOMBSTONE_TTL_DAYS` - keep deleted cards for sync safety (default `60`)
- `TOMBSTONE_CLEANUP_INTERVAL_MINUTES` - cleanup interval (default `360`)

Build:

```bash
npm run build
```

## Architecture

Local DB is the source of truth. Layers:

1. UI Layer (`src/pages`, `src/components`)
2. Application Layer (`src/services/cards/cardService.ts`)
3. Data Access Layer (`src/services/database/cardRepository.ts`)
4. Optional Sync Layer (`src/services/sync`)
5. Local Database (`src/services/database/db.ts`, IndexedDB via Dexie)

Backend modules:

1. Auth (`server/src/modules/auth`) - register/login via JWT
2. Sync (`server/src/modules/sync`) - push/pull cards
3. Persistence (`server/prisma/schema.prisma`) - SQLite (can be swapped to PostgreSQL)

## Data Model

Card entity (`src/types/card.ts`):

- `id`, `name`, `number`, `barcodeType`
- `favorite`, `notes`, `logoDataUrl`
- `createdAt`, `updatedAt`, `deletedAt` (soft delete)

## IndexedDB Schema

Table: `cards`

Indexes:

- `id`
- `favorite`
- `createdAt`
- `updatedAt`
- `deletedAt`

## Core Features Implemented

- Add card (manual + camera scan)
- Edit card
- Soft delete card
- Favorite/unfavorite
- Search by name/number
- Home list with favorites section
- Card checkout view with large centered barcode/QR
- Offline installable PWA with cache-first service worker

## Folder Structure

```text
src/
  app/
  components/
    cards/
    common/
    forms/
  hooks/
  pages/
  pwa/
  services/
    barcode/
    cards/
    database/
    scanner/
    sync/
  styles/
  types/
  utils/
public/
  icons/
  manifest.webmanifest
  sw.js
```

## Cloud Sync Behavior

- Local IndexedDB stays the source of truth
- Account is optional (configured in Settings)
- Sync uses push/pull API with Last-Write-Wins conflict resolution by `updatedAt`
- Soft-deleted cards are synchronized via `deletedAt`
