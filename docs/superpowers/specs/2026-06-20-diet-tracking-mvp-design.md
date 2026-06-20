# Diet Tracking MVP Design

## Goal

Build a production-structured diet tracking MVP optimized for the daily loop: open the dashboard, add a food or meal, set quantity and time, save, and immediately see authoritative macro totals.

## MVP Scope

The MVP includes:

- Email/password signup, login, logout, and protected routes.
- Shared read-only system foods and private user foods.
- Reusable user-owned meals with calculated macros.
- One meal plan per user per local calendar date.
- Historical food and meal logs with immutable macro snapshots.
- Personal macro targets and profile timezone settings.
- A daily dashboard with targets, actual totals, remaining macros, today's timeline, and today's plan.
- Planned-versus-actual comparison only when a plan exists for the selected date.
- Responsive desktop sidebar and mobile bottom navigation.

The MVP excludes weekly summaries, copying logs or plans, recurring plans, advanced analytics, dark mode, refresh-token rotation, and server-side session revocation.

## Architecture

Use an npm workspaces monorepo:

- `apps/web`: Next.js App Router, React, TypeScript, and Tailwind CSS.
- `apps/api`: NestJS REST API and TypeScript.
- `packages/shared`: only enums, contracts, and validation helpers that clearly reduce duplication.
- PostgreSQL runs through Docker Compose during local development.
- Prisma owns the schema, migrations, and seed process.

NestJS is the source of truth for authentication, authorization, ownership, timezone-aware date ranges, writes, macro calculations, and dashboard aggregation. Next.js owns interface state, forms, search interactions, live previews, API mutations, and refreshing authoritative query data.

## Authentication and Request Security

- Hash passwords with Argon2id.
- Store a signed seven-day JWT only in an HTTP-only cookie.
- Set cookie path to `/` and `SameSite=Lax`.
- Use `secure: false` locally and `secure: true` in production.
- Make cookie domain and expiry configurable.
- Configure NestJS CORS for exactly the configured web origin with credentials enabled.
- Validate the `Origin` header on POST, PATCH, PUT, and DELETE requests.
- Reject missing or invalid mutation origins in production. Document the narrower local-development allowance.
- Logout clears the authentication cookie.
- Protected services derive `userId` from the authenticated request. Clients cannot provide ownership fields.

The README must state that refresh-token rotation and server-side session revocation are post-MVP security improvements.

## Response Contract

Successful responses use:

```json
{ "data": {}, "meta": {} }
```

The optional `meta` member is included only when needed. Errors use:

```json
{
  "error": {
    "code": "STABLE_MACHINE_CODE",
    "message": "Human-readable message",
    "details": {}
  }
}
```

NestJS DTOs use `class-validator`. Shared schemas must not replace backend validation.

## Data Model

### User

- Unique normalized email.
- Argon2id password hash.
- IANA timezone, defaulting to `Asia/Jerusalem`.
- Created and updated timestamps.

### MacroTarget

- One record per user.
- Daily calories, protein, carbs, and fat.
- Optional current weight, goal weight, and notes.
- Decimal fields for macros and weights.

### Food

- Nullable `userId`.
- Source enum: `SYSTEM` or `USER`.
- Name, optional brand, serving amount, serving unit, calories, protein, carbs, fat, optional notes, and timestamps.
- System foods have no owner and are read-only.
- User foods belong to the current user.
- Search returns system foods plus the authenticated user's foods.
- Users may duplicate a system food into an editable private food.
- Edit and delete operations apply only to owned user foods.

Database and service validation must enforce the relationship between source and owner.

### Meal and MealItem

- Meals are user-owned reusable definitions with a name and optional description.
- Each item references an accessible food and stores a positive decimal quantity multiplier.
- A meal's totals are calculated from current food values and are not persisted.
- Meal item replacement occurs in a Prisma transaction.

### MealPlan and MealPlanItem

- Meal plans are user-owned, named, and associated with a PostgreSQL `DATE`.
- `(userId, date)` is unique, allowing one plan per user per date.
- Each item references exactly one food or meal.
- Each item stores a positive decimal quantity, optional planned time, optional meal label (`BREAKFAST`, `LUNCH`, `DINNER`, `SNACK`, or `OTHER`), and optional notes.
- Planned totals are calculated from current foods and meals and are not persisted.
- Plan item replacement occurs in a Prisma transaction.

### FoodLog

- User-owned historical record.
- References exactly one food or meal.
- Optionally references a meal plan item; this reference is unique when present.
- Stores a positive decimal quantity and UTC `eatenAt` timestamp.
- Stores calories, protein, carbs, and fat snapshots calculated by the API.
- Stores optional source-name and serving-description snapshots plus notes.
- Logging a meal snapshots the meal totals at that moment multiplied by quantity.
- Logging a food snapshots its serving macros multiplied by quantity.
- Editing the referenced food or meal never changes previous logs.
- Deleting a linked log makes the associated plan item appear uneaten.

### Deletion Rules

- Reject deleting a user food referenced by meals, plans, or logs.
- Reject deleting a meal referenced by plans or logs.
- Return a stable dependency-conflict error with a clear message.
- Do not silently null references or rewrite historical records.

### Decimal and Index Policy

Use Prisma `Decimal` mapped to suitable PostgreSQL numeric columns for serving amounts, quantities, macros, and weights. API calculation utilities must use decimal-safe arithmetic and serialize decimal values consistently.

Add indexes for ownership, food search, plan dates, log timestamps, and common compound filters. Add a unique index for `(userId, MealPlan.date)` and the nullable unique `FoodLog.mealPlanItemId`.

## Timezone Policy

- Store log timestamps in UTC.
- Store the user's IANA timezone on the user record.
- Treat `YYYY-MM-DD` query and plan values as local calendar dates, not UTC timestamps.
- Use a maintained timezone library for local-day-to-UTC boundary conversion and DST handling.
- Reject invalid or unsupported timezones.
- Do not persist a derived local log date in the MVP.

## API Surface

The API includes NestJS modules for auth, users/profile, foods, meals, meal plans, food logs, targets, and dashboard aggregation.

Core routes:

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/logout`
- `GET /auth/me`
- `GET /foods`
- `POST /foods`
- `PATCH /foods/:id`
- `DELETE /foods/:id`
- `POST /foods/:id/duplicate`
- `GET /meals`
- `GET /meals/:id`
- `POST /meals`
- `PATCH /meals/:id`
- `DELETE /meals/:id`
- `GET /plans`
- `GET /plans/:id`
- `POST /plans`
- `PATCH /plans/:id`
- `DELETE /plans/:id`
- `POST /plans/items/:id/mark-eaten`
- `GET /logs?date=YYYY-MM-DD`
- `POST /logs`
- `PATCH /logs/:id`
- `DELETE /logs/:id`
- `GET /targets`
- `PUT /targets`
- `GET /dashboard?date=YYYY-MM-DD`
- `PATCH /me` for timezone/profile settings

The exact route naming may be normalized during implementation, but behavior and ownership boundaries must remain unchanged.

## Domain Services and Transactions

- Keep controllers thin.
- Put ownership, access, system-food, and dependency-delete rules in services.
- Put decimal macro calculations in pure domain utilities.
- Validate food-versus-meal XOR references at the DTO and service layers.
- Use Prisma transactions when replacing meal items, replacing plan items, and marking a plan item eaten.
- Marking a plan item eaten creates a linked log using the plan item's defaults or submitted quantity/time edits.
- The unique plan-item link and transaction prevent accidental duplicate logging.

## Frontend Structure

Use Next.js App Router, Tailwind CSS, TanStack Query, React Hook Form, and reusable interface primitives. Protected pages share an authenticated application shell.

Routes:

- `/login`
- `/signup`
- `/dashboard`
- `/foods`
- `/foods/new`
- `/foods/[id]/edit`
- `/meals`
- `/meals/new`
- `/meals/[id]/edit`
- `/plans`
- `/plans/new`
- `/plans/[id]/edit`
- `/log`
- `/settings`

The visual direction is compact and modern: neutral surfaces, green macro accents, clean cards, a compact desktop sidebar, and mobile bottom navigation.

## Primary Daily Workflow

1. The user opens the dashboard.
2. The user selects “Add food or meal.”
3. A combined command-style selector searches accessible foods and owned meals.
4. Results clearly identify food versus meal; foods show serving information and macros, while meals show calculated totals.
5. The user enters a quantity and eaten time.
6. The frontend displays a live preview.
7. The API validates, calculates, and saves the log snapshot.
8. The form closes and dashboard/log queries are invalidated.
9. The UI renders refreshed authoritative totals.

## Page Behavior

The dashboard shows daily targets, progress cards, remaining macros, actual totals, today's timeline, and today's plan with eaten and uneaten states. Planned-versus-actual appears only when a plan exists.

The meal builder uses explicit food item rows with quantities and a live macro preview. The plan builder uses explicit rows that select either a food or meal and accept quantity, optional time, meal label, and notes. Both builders trust backend recalculation after save.

Important states receive dedicated presentation: loading, empty, form validation, authentication, duplicate/conflict, dependency-delete, and network/server errors. Important failures do not use generic browser alerts.

## Testing

### Unit Tests

- Macro and decimal quantity calculations.
- Food/meal and plan-item XOR validation.
- DST-sensitive timezone day boundaries.
- Authorization and ownership rules.
- System-food read-only behavior.
- User-food edit/delete behavior.
- Dependency-delete rejection.

### API Integration Tests

- Signup, login, logout, and current-user retrieval.
- System-food plus current-user-food visibility.
- Cross-user ownership isolation.
- Food CRUD and system-food duplication.
- Meal and plan writes with calculated totals.
- Food and meal logs with immutable snapshots.
- Marking a plan item eaten and duplicate prevention.
- Deleting a linked log returning a plan item to uneaten state.
- Dashboard targets, plans, actual totals, remaining macros, and timeline aggregation.

### Frontend Tests

- Key form rendering and validation.
- Macro preview rendering.
- Dashboard macro cards.
- Clear food/meal result labels.
- Dedicated error states.

### End-to-End Smoke Test

Playwright covers signup, target configuration, logging a food, and observing updated dashboard totals.

## Verification and Completion Criteria

Run build, lint, type-check, Prisma validation, migration, seed, unit, integration, frontend, and Playwright checks. Verify desktop and mobile layouts in a real browser.

The MVP is complete only when auth, foods, meals, date-specific plans, logs, targets, and the dashboard work reliably and the primary daily workflow updates authoritative totals without manual refresh.

## Post-MVP Order

After the MVP is stable, consider improvements in this order:

1. Weekly summary page.
2. Copy yesterday's log and copy a plan to another date.
3. Recurring weekly plans.
4. Advanced analytics.
5. Dark mode and session-hardening improvements as separate scoped work.
