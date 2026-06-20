# NourishTrack

Production-structured diet tracking MVP built as an npm workspaces monorepo.

## Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS
- NestJS 11 REST API
- PostgreSQL 17 and Prisma ORM
- HTTP-only cookie JWT authentication with Argon2id passwords

## Prerequisites

- Node.js 22
- npm 11
- Docker Desktop (for local PostgreSQL)

## Setup

```powershell
Copy-Item .env.example .env
npm install
docker compose up -d postgres
npm run db:migrate -- --name init
npm run db:seed
npm run dev
```

Open `http://localhost:3000`. The API runs on `http://localhost:3001`.

## Root commands

```powershell
npm run dev
npm run build
npm run lint
npm run typecheck
npm test
npm run db:validate
npm run db:migrate
npm run db:seed
```

## Environment and security

Local development uses `SameSite=Lax`, HTTP-only cookies with `secure=false`, exact credentialed CORS for `WEB_ORIGIN`, and mutation-origin validation. Production automatically enables secure cookies. Set a unique `JWT_SECRET` of at least 32 random characters and configure exact production origins/domains.

The MVP JWT expires after seven days. Refresh-token rotation and server-side session revocation are intentionally deferred hardening work. Logout clears the browser cookie but does not revoke a copied token before expiry.

## Data policies

- Timestamps are stored in UTC. Daily ranges are derived with the user's IANA timezone and DST-aware Luxon boundaries.
- Plan dates are PostgreSQL `DATE` values, with one plan per user/date.
- API decimal fields are canonical strings (`"165"`, `"0.5"`, `"3.625"`) to avoid JSON floating-point ambiguity.
- Meals/plans calculate from current source foods. Logs store immutable macro/name/serving snapshots.
- Editing a log recalculates and replaces its snapshot from the edited source and quantity.
- System foods are global read-only records. Users can copy them into private foods.
- Foods/meals referenced by other records cannot be deleted. Archive/soft-delete behavior is deferred.

## Seed foods

Chicken breast, cooked white rice, egg, cottage cheese 5%, tahini, Bulgarian cheese, lean minced beef, banana, and whey protein.

## MVP boundary

Included: auth, foods, meals, single-date plans, logs, targets, dashboard, and responsive desktop/mobile navigation.

Deferred: weekly summary, copy-yesterday/copy-plan, recurring plans, advanced analytics, dark mode, and session hardening.
