# NourishTrack

Production-structured diet tracking MVP built as an npm workspaces monorepo.

## Stack

- Next.js 16, React 19, TypeScript, Tailwind CSS
- NestJS 11 REST API
- PostgreSQL 17 and Prisma ORM
- HTTP-only cookie JWT authentication with Argon2id passwords

## Prerequisites

- Node.js 22 (`node --version` should print `v22.x.x`)
- npm 11 (`npm --version` should print `11.x.x`)
- Docker Desktop (for local PostgreSQL)

## Local setup

```powershell
# 1. Clone and enter the repo, then copy the example env file
Copy-Item .env.example .env

# 2. Install all workspace dependencies (API, web, shared)
npm install

# 3. Start PostgreSQL in Docker
docker compose up -d postgres

# 4. Run database migration (creates all tables)
npm run db:migrate

# 5. Seed system foods
npm run db:seed

# 6. Start API (port 3001) and web (port 3000) together
#    The dev script builds the shared package first automatically
npm run dev
```

Open `http://localhost:3000`. The API runs on `http://localhost:3001`.

## Root scripts

```powershell
npm run dev          # Start API + web in watch mode
npm run build        # Build all workspaces
npm run lint         # Lint all workspaces
npm run typecheck    # Type-check all workspaces
npm test             # Run all unit tests (API: jest, shared: vitest)
npm run db:migrate   # Run Prisma migrations
npm run db:seed      # Seed system foods
npm run db:validate  # Validate Prisma schema
```

## Environment variables

| Variable | Required | Default | Description |
|---|---|---|---|
| `DATABASE_URL` | Yes | — | PostgreSQL connection string |
| `POSTGRES_DB` | Yes | — | DB name (used by Docker Compose) |
| `POSTGRES_USER` | Yes | — | DB user (used by Docker Compose) |
| `POSTGRES_PASSWORD` | Yes | — | DB password (used by Docker Compose) |
| `JWT_SECRET` | Yes in production | dev fallback | Must be ≥ 32 random characters. API refuses to start in production without it. |
| `AUTH_COOKIE_NAME` | No | `diet_session` | Name of the auth cookie |
| `API_PORT` | No | `3001` | API listen port |
| `WEB_ORIGIN` | No | `http://localhost:3000` | Allowed CORS origin for the web client |
| `NEXT_PUBLIC_API_URL` | No | — | API base URL injected into the Next.js build |
| `COOKIE_MAX_AGE_MS` | No | `604800000` (7 days) | Cookie lifetime in milliseconds |
| `COOKIE_DOMAIN` | No | — | Cookie domain (e.g. `.example.com` for cross-subdomain auth) |

## Security notes

**JWT secret:** Set `JWT_SECRET` to at least 32 cryptographically random characters before any production deployment. The API will log a fatal error and exit at startup if this is missing or too short when `NODE_ENV=production`. In development it logs a warning and uses an insecure fallback.

**Session hardening (deferred):** The MVP JWT expires after seven days. Refresh-token rotation and server-side session revocation are intentionally deferred. Logout clears the browser cookie but does not revoke a copied token before expiry.

**Cookie settings:** Cookies use `HttpOnly`, `SameSite=Lax`, `Secure=false` locally and `Secure=true` in production. All state-changing requests require the `Origin` header to match `WEB_ORIGIN`.

## Troubleshooting

### Reset the database

```powershell
# Stop and remove the Postgres container and volume, then recreate
docker compose down -v
docker compose up -d postgres

# Re-apply migration and seed
npm run db:migrate
npm run db:seed
```

### Migration already applied / out of sync

If Prisma reports the migration is already applied but the schema is out of sync:

```powershell
# Inside the API workspace
cd apps/api
npx prisma migrate reset   # drops and recreates the DB, runs all migrations, seeds
cd ../..
```

### Port conflicts

If ports 3000 or 3001 are in use, set `API_PORT` in `.env` and `NEXT_PUBLIC_API_URL` to match, then restart.

### node_modules issues

```powershell
Remove-Item -Recurse -Force node_modules, apps/api/node_modules, apps/web/node_modules, packages/shared/node_modules
npm install
```

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
