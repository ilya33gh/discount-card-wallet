# Future Backend Design

This app is local-first today. The backend can be added later without rewriting UI components.

## Suggested Stack

- Node.js
- Fastify
- PostgreSQL
- Prisma ORM

## API Direction

Base path: `/api/v1`

- `POST /auth/register`
- `POST /auth/login`
- `GET /cards`
- `POST /cards`
- `PATCH /cards/:id`
- `DELETE /cards/:id` (soft delete)
- `POST /cards/sync` (push/pull delta sync)

## Core Tables

### users

- `id` (UUID, PK)
- `email` (unique)
- `passwordHash`
- `createdAt`
- `updatedAt`

### cards

- `id` (UUID, PK)
- `userId` (FK -> users.id)
- `name`
- `number`
- `barcodeType`
- `favorite`
- `notes`
- `logoUrl`
- `createdAt`
- `updatedAt`
- `deletedAt` (nullable)

## Sync Strategy

- Local DB remains source of truth during offline usage.
- Client pushes local changes based on `updatedAt`.
- Server returns server-side changes since client checkpoint.
- Conflict resolution: Last Write Wins (`updatedAt`), with server timestamp normalization.
