# Diet Tracking MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the approved diet-tracking MVP so a user can authenticate, manage foods and meals, plan one day, log actual intake, set targets, and see authoritative daily totals on desktop and mobile.

**Architecture:** An npm workspaces monorepo contains a Next.js App Router frontend, a NestJS REST API, and a deliberately small shared contracts package. NestJS and PostgreSQL are authoritative for ownership, timezone boundaries, decimal-safe macro calculations, snapshots, and dashboard aggregation; the frontend provides previews and refreshes server data after every mutation.

**Tech Stack:** npm 11 workspaces, Node.js 22 LTS, Next.js 16, React 19, NestJS 11, PostgreSQL 17, Prisma, Tailwind CSS 4, TanStack Query 5, React Hook Form 7, Luxon, decimal.js, Vitest/Jest, Supertest, Testing Library, and Playwright.

---

## Locked policies

- Scope is auth, foods, meals, one single-date plan per user, logs, targets, daily dashboard, and responsive usability only.
- Editing a `FoodLog` recalculates and replaces every snapshot from the edited source, quantity, and time.
- Decimal inputs and outputs are canonical base-10 strings: no JSON numbers, exponent notation, leading plus sign, or unnecessary trailing fractional zeroes (`"165"`, `"0.5"`, `"3.625"`). Database decimal columns use `numeric(12,3)` and persistence rounds half-up to three places.
- `MealPlan.date` is PostgreSQL `DATE`; `(userId, date)` is unique.
- Referenced foods and meals cannot be deleted. Archive/soft-delete behavior is outside the MVP.
- JWT refresh rotation and server-side session revocation are documented post-MVP hardening.

## File map

```text
apps/api/prisma/{schema.prisma,seed.ts,migrations/...}
apps/api/src/common/{auth,errors,http,origin,decimal,time}/...
apps/api/src/domain/macros/...
apps/api/src/{auth,users,foods,meals,meal-plans,food-logs,targets,dashboard}/...
apps/api/test/{helpers,*.e2e-spec.ts}
apps/web/app/(auth)/{login,signup}/...
apps/web/app/(protected)/{dashboard,foods,meals,plans,log,settings}/...
apps/web/components/{layout,ui,macros,foods,meals,plans,logs,dashboard}/...
apps/web/lib/{api,auth,query,decimal,date}/...
packages/shared/src/{contracts,enums,decimal,index}.ts
```

### Task 1: Scaffold the pnpm workspace

**Files:**
- Create: `package.json`, `pnpm-workspace.yaml`, `.npmrc`, `.gitignore`, `.env.example`, `docker-compose.yml`
- Create: `scripts/check-workspace.mjs`
- Create: `apps/api/**`, `apps/web/**`, `packages/shared/**`

- [ ] **Step 1: Write the failing workspace check**

```js
import { existsSync } from 'node:fs';
const required = ['apps/api/package.json', 'apps/web/package.json', 'packages/shared/package.json', 'docker-compose.yml'];
const missing = required.filter((path) => !existsSync(path));
if (missing.length) throw new Error(`Missing workspace files: ${missing.join(', ')}`);
```

- [ ] **Step 2: Run `node scripts/check-workspace.mjs`**

Expected: FAIL listing missing workspace files.

- [ ] **Step 3: Scaffold and configure**

```powershell
corepack enable
corepack prepare pnpm@11.8.0 --activate
pnpm dlx @nestjs/cli@11 new apps/api --package-manager pnpm --skip-git
pnpm create next-app@16.2.9 apps/web --ts --tailwind --eslint --app --src-dir=false --import-alias "@/*" --use-pnpm
```

Root scripts are `dev`, `build`, `lint`, `typecheck`, `test`, `db:migrate`, `db:seed`, and `db:validate`. Rename packages to `@diet/api`, `@diet/web`, and `@diet/shared`; connect them with `workspace:*`. Configure PostgreSQL 17 database `diet_tracking`, user `diet`, port `5432`, and a healthcheck in Docker Compose.

- [ ] **Step 4: Run `pnpm install && pnpm check:workspace && pnpm typecheck`**

Expected: PASS.

- [ ] **Step 5: Commit**

```powershell
git add package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc .gitignore .env.example docker-compose.yml scripts apps packages
git commit -m "chore: scaffold diet tracking monorepo"
```

### Task 2: Define shared enums, contracts, and decimal policy

**Files:**
- Create: `packages/shared/src/enums.ts`, `decimal.ts`, `contracts/common.ts`, `contracts/auth.ts`, `contracts/domain.ts`
- Modify: `packages/shared/src/index.ts`
- Test: `packages/shared/src/decimal.test.ts`

- [ ] **Step 1: Write failing serialization tests**

```ts
it.each([['165.000', '165'], ['0.500', '0.5'], ['3.625', '3.625'], ['-0.000', '0']])(
  'serializes %s as %s', (input, expected) => expect(canonicalDecimal(input)).toBe(expected),
);
```

- [ ] **Step 2: Run `pnpm --filter @diet/shared test`**

Expected: FAIL because `canonicalDecimal` is absent.

- [ ] **Step 3: Implement contracts**

```ts
export type DecimalString = string;
export const DECIMAL_PATTERN = /^(0|[1-9]\d*)(\.\d{1,3})?$/;
export function canonicalDecimal(value: string): DecimalString {
  const [whole, fraction = ''] = value.split('.');
  const trimmed = fraction.replace(/0+$/, '');
  const normalizedWhole = whole === '-0' ? '0' : whole;
  return trimmed ? `${normalizedWhole}.${trimmed}` : normalizedWhole;
}
```

Define `FoodSource`, `ServingUnit`, `MealLabel`, `MacroValues`, `ApiSuccess<T>`, `ApiFailure`, public user/session, food, meal, plan, log, target, dashboard, and search contracts. Input contracts never expose `userId`.

- [ ] **Step 4: Run `pnpm --filter @diet/shared test && pnpm --filter @diet/shared typecheck`**

Expected: PASS.

- [ ] **Step 5: Commit with `git commit -m "feat: define shared diet contracts"`**

### Task 3: Add Prisma schema, migration, adapter, and seed

**Files:**
- Create: `apps/api/prisma/schema.prisma`, `seed.ts`, `apps/api/prisma.config.ts`
- Create: `apps/api/src/database/prisma.service.ts`, `database.module.ts`, `src/config/env.validation.ts`
- Modify: `apps/api/package.json`
- Test: `apps/api/prisma/schema.spec.ts`

- [ ] **Step 1: Write a schema-contract test**

Read `schema.prisma` and assert `FoodSource`, nullable `Food.userId`, `@@unique([userId, date])`, unique nullable `FoodLog.mealPlanItemId`, and `@db.Decimal(12, 3)` quantity/snapshot fields.

- [ ] **Step 2: Run `pnpm --filter @diet/api test -- schema.spec.ts`**

Expected: FAIL because the schema is absent.

- [ ] **Step 3: Implement the normalized schema**

Create `User`, `MacroTarget`, `Food`, `Meal`, `MealItem`, `MealPlan`, `MealPlanItem`, and `FoodLog`. Add migration SQL checks for food source/owner consistency and food/meal XOR references. Use restrictive source foreign keys and cascade only aggregate-owned children. Configure Prisma 7 with `@prisma/adapter-pg`; validate database, JWT, cookie, origin, and environment configuration at startup.

- [ ] **Step 4: Implement idempotent seed data**

Upsert stable system-food slugs for chicken breast, cooked white rice, egg, cottage cheese 5%, tahini, Bulgarian cheese, lean minced beef, banana, and whey protein. Use decimal strings, `source=SYSTEM`, and `userId=null`.

- [ ] **Step 5: Validate database artifacts**

```powershell
docker compose up -d postgres
pnpm db:validate
pnpm db:migrate -- --name init
pnpm db:seed
pnpm --filter @diet/api test -- schema.spec.ts
```

Expected: migration succeeds, nine system foods exist, and tests pass.

- [ ] **Step 6: Commit with `git commit -m "feat: add diet tracking database schema"`**

### Task 4: Build API cross-cutting foundations

**Files:**
- Create: `apps/api/src/common/http/response.interceptor.ts`
- Create: `apps/api/src/common/errors/{api-exception.filter,domain.exception}.ts`
- Create: `apps/api/src/common/{decimal/decimal,time/local-day,origin/origin.guard}.ts`
- Create: `apps/api/src/domain/macros/macro-calculator.ts`
- Modify: `apps/api/src/main.ts`
- Test: corresponding `*.spec.ts` files

- [ ] **Step 1: Write failing tests** for half-up multiplication (`165 × 1.5 = "247.5"`), meal summation, canonical serialization, invalid zones, and Jerusalem DST day boundaries.

- [ ] **Step 2: Run focused tests**

Expected: FAIL because utilities are absent.

- [ ] **Step 3: Implement decimal and date utilities**

Use decimal.js precision 24 and `ROUND_HALF_UP`. Expose `multiplyMacros`, `sumMacros`, `roundPersisted`, and `serializeDecimal`. Use Luxon:

```ts
const start = DateTime.fromISO(date, { zone }).startOf('day');
if (!start.isValid || start.toISODate() !== date) throw new InvalidTimezoneOrDate();
return { start: start.toUTC().toJSDate(), end: start.plus({ days: 1 }).toUTC().toJSDate() };
```

- [ ] **Step 4: Configure global HTTP behavior**

Enable whitelist/forbid-non-whitelisted validation, cookie parsing, exact-origin credentialed CORS, mutation-origin validation, success wrapping, and the stable error envelope.

- [ ] **Step 5: Run focused tests; expect PASS including a DST-short/long day**

- [ ] **Step 6: Commit with `git commit -m "feat: add API domain foundations"`**

### Task 5: Implement cookie JWT authentication and profile access

**Files:**
- Create: `apps/api/src/auth/{auth.module,auth.controller,auth.service,jwt.strategy,jwt-auth.guard,current-user.decorator}.ts`
- Create: `apps/api/src/auth/dto/{signup,login}.dto.ts`
- Create: `apps/api/src/users/{users.module,users.service,users.controller}.ts`, `dto/update-profile.dto.ts`
- Test: `apps/api/test/auth.e2e-spec.ts`

- [ ] **Step 1: Write failing Supertest cases** for signup cookie flags, duplicate email, login failure, protected `/auth/me`, valid/invalid timezone updates, mutation-origin rejection, and logout cookie clearing.

- [ ] **Step 2: Run `pnpm --filter @diet/api test:e2e -- auth.e2e-spec.ts`**

Expected: FAIL with missing routes.

- [ ] **Step 3: Implement auth/profile**

Normalize email, hash with Argon2id, sign `{sub:userId}` for seven days, read JWT only from the configured cookie, and set local/production cookie options from validated config. Return only public user fields. Validate IANA zones with Luxon.

- [ ] **Step 4: Rerun auth integration tests; expect PASS**

- [ ] **Step 5: Commit with `git commit -m "feat: add secure cookie authentication"`**

### Task 6: Implement food search, CRUD, protection, and duplication

**Files:**
- Create: `apps/api/src/foods/{foods.module,foods.controller,foods.service,food.mapper}.ts`
- Create: `apps/api/src/foods/dto/{create-food,update-food,search-food}.dto.ts`
- Test: `apps/api/test/foods.e2e-spec.ts`

- [ ] **Step 1: Write failing integration tests**

Assert search returns system plus current-user foods but never another user's; ownership input is rejected; only owned user foods change; system mutations return `SYSTEM_FOOD_READ_ONLY`; duplication creates a USER copy; referenced deletion returns `FOOD_IN_USE`; decimals are canonical strings.

- [ ] **Step 2: Run `pnpm --filter @diet/api test:e2e -- foods.e2e-spec.ts`**

Expected: FAIL with missing routes.

- [ ] **Step 3: Implement food behavior**

Use visibility `OR: [{source:'SYSTEM'}, {userId}]`, case-insensitive name/brand search, deterministic ordering, and bounded pagination. Validate positive serving amount, nonnegative macros, units, and decimal precision. Duplicate only visible system foods into the current user's namespace.

- [ ] **Step 4: Rerun food integration tests; expect PASS**

- [ ] **Step 5: Commit with `git commit -m "feat: add private and system foods"`**

### Task 7: Implement reusable meals

**Files:**
- Create: `apps/api/src/meals/{meals.module,meals.controller,meals.service,meal.mapper}.ts`
- Create: `apps/api/src/meals/dto/{create-meal,update-meal}.dto.ts`
- Test: `apps/api/test/meals.e2e-spec.ts`

- [ ] **Step 1: Write failing tests** for system/owned food use, foreign-user rejection, decimal quantities, calculated totals, transactional replacement, duplication, ownership isolation, and `MEAL_IN_USE` deletion.

- [ ] **Step 2: Run `pnpm --filter @diet/api test:e2e -- meals.e2e-spec.ts`**

Expected: FAIL with missing routes.

- [ ] **Step 3: Implement meal services**

Batch-load requested foods with the visibility predicate and reject count mismatches. Calculate through `macro-calculator.ts`. Create/update parent and item rows in one Prisma transaction. Return calculated totals through the mapper and never persist meal totals.

- [ ] **Step 4: Rerun meal integration tests; expect PASS**

- [ ] **Step 5: Commit with `git commit -m "feat: add reusable meals"`**

### Task 8: Implement one-per-date plans

**Files:**
- Create: `apps/api/src/meal-plans/{meal-plans.module,meal-plans.controller,meal-plans.service,meal-plan.mapper}.ts`
- Create: `apps/api/src/meal-plans/dto/{create-meal-plan,update-meal-plan,meal-plan-item}.dto.ts`
- Test: `apps/api/test/meal-plans.e2e-spec.ts`

- [ ] **Step 1: Write failing tests** for unique `(user,date)`, source XOR validation, source access, optional time/label/notes, totals, atomic item replacement, isolation, and linked-log eaten state.

- [ ] **Step 2: Run `pnpm --filter @diet/api test:e2e -- meal-plans.e2e-spec.ts`**

Expected: FAIL with missing routes.

- [ ] **Step 3: Implement plans**

Validate strict `YYYY-MM-DD` strings. Resolve foods/meals in batches, calculate each item and aggregate totals, and map `isEaten` from linked-log existence. Convert Prisma unique failures to `PLAN_ALREADY_EXISTS`. Replace child rows atomically.

- [ ] **Step 4: Rerun plan integration tests; expect PASS**

- [ ] **Step 5: Commit with `git commit -m "feat: add single-date meal plans"`**

### Task 9: Implement historical logs and mark-as-eaten

**Files:**
- Create: `apps/api/src/food-logs/{food-logs.module,food-logs.controller,food-logs.service,log-snapshot.service,food-log.mapper}.ts`
- Create: `apps/api/src/food-logs/dto/{create-food-log,update-food-log,search-food-log,mark-eaten}.dto.ts`
- Modify: `apps/api/src/meal-plans/meal-plans.controller.ts`
- Test: `apps/api/test/food-logs.e2e-spec.ts`

- [ ] **Step 1: Write failing log tests**

Cover source XOR, UTC timestamps, user-timezone date queries, food/meal snapshots, source display snapshots, isolation, source edits not changing old logs, and log edits recalculating every snapshot from edited source/quantity/time. Cover transactional mark-as-eaten, `PLAN_ITEM_ALREADY_LOGGED`, and linked-log deletion returning `isEaten=false`.

- [ ] **Step 2: Run `pnpm --filter @diet/api test:e2e -- food-logs.e2e-spec.ts`**

Expected: FAIL with missing routes.

- [ ] **Step 3: Implement one snapshot builder**

```ts
buildSnapshot(input: { userId: string; foodId?: string; mealId?: string; quantity: string }): Promise<{
  caloriesSnapshot: Decimal; proteinSnapshot: Decimal; carbsSnapshot: Decimal; fatSnapshot: Decimal;
  sourceNameSnapshot: string; servingDescriptionSnapshot: string;
}>;
```

Use it from create, update, and mark-as-eaten. Update writes source IDs, quantity, eaten time, notes, and replacement snapshots together.

- [ ] **Step 4: Implement mark-as-eaten atomically**

Fetch the owned plan item, merge permitted quantity/time/note edits, build the snapshot, create the linked log in a transaction, and translate the unique link violation to `PLAN_ITEM_ALREADY_LOGGED`.

- [ ] **Step 5: Rerun log integration tests; expect PASS**

- [ ] **Step 6: Commit with `git commit -m "feat: add snapshot-based daily logs"`**

### Task 10: Implement targets and dashboard aggregation

**Files:**
- Create: `apps/api/src/targets/{targets.module,targets.controller,targets.service}.ts`, `dto/upsert-target.dto.ts`
- Create: `apps/api/src/dashboard/{dashboard.module,dashboard.controller,dashboard.service,dashboard.mapper}.ts`, `dto/dashboard-query.dto.ts`
- Test: `apps/api/test/dashboard.e2e-spec.ts`

- [ ] **Step 1: Write failing tests** for target upsert, decimal response policy, DST-aware actual sums, optional planned sums, remaining values, timeline ordering, eaten state, and omitted planned comparison when no plan exists.

- [ ] **Step 2: Run `pnpm --filter @diet/api test:e2e -- dashboard.e2e-spec.ts`**

Expected: FAIL with missing routes.

- [ ] **Step 3: Implement targets/dashboard**

Upsert one target per user. Convert the requested local date to `[start,end)` UTC, fetch target/logs/plan concurrently, sum persisted snapshots, calculate current planned macros, and serialize canonical strings. Remaining values may be negative; progress clamping belongs to the frontend.

- [ ] **Step 4: Rerun dashboard integration tests; expect PASS**

- [ ] **Step 5: Run all API checks**

Run: `pnpm --filter @diet/api lint && pnpm --filter @diet/api typecheck && pnpm --filter @diet/api test && pnpm --filter @diet/api test:e2e`

Expected: PASS.

- [ ] **Step 6: Commit with `git commit -m "feat: add targets and daily dashboard"`**

### Task 11: Build frontend API/auth foundations and responsive shell

**Files:**
- Create: `apps/web/lib/api/{client,errors}.ts`, `lib/query/provider.tsx`, `lib/auth/use-session.ts`
- Create: `apps/web/components/ui/{button,input,card,field-error,empty-state,error-state,spinner,dialog}.tsx`
- Create: `apps/web/components/layout/{app-shell,sidebar,mobile-nav}.tsx`
- Create: `apps/web/app/(auth)/{login,signup}/page.tsx`, `app/(protected)/layout.tsx`
- Modify: `apps/web/app/layout.tsx`, `app/globals.css`
- Test: `apps/web/components/layout/app-shell.test.tsx`, `apps/web/app/(auth)/login/page.test.tsx`

- [ ] **Step 1: Write failing tests** for login validation, credentialed requests, API errors, protected navigation, desktop sidebar, and mobile navigation.

- [ ] **Step 2: Run `pnpm --filter @diet/web test -- login app-shell`**

Expected: FAIL because pages/components are absent.

- [ ] **Step 3: Implement data/auth foundations**

Create typed `apiFetch<T>` using `credentials:'include'`, `NEXT_PUBLIC_API_URL`, response-envelope parsing, and `ApiError`. Configure one QueryClient. Implement signup/login mutations, `/auth/me`, logout, protected redirects, and query-cache clearing.

- [ ] **Step 4: Implement shell and primitives**

Use neutral tokens, green macro accents, compact cards, 44px mobile controls, a sidebar at `md`, and fixed bottom navigation below `md`. Navigation contains Dashboard, Log, Foods, Meals, Plans, and Settings only.

- [ ] **Step 5: Run frontend tests and type-check; expect PASS**

- [ ] **Step 6: Commit with `git commit -m "feat: add frontend auth and app shell"`**

### Task 12: Build food and meal management UI

**Files:**
- Create: `apps/web/components/foods/{food-form,food-list,food-search}.tsx`
- Create: `apps/web/components/meals/{meal-form,meal-item-row,meal-list}.tsx`
- Create: `apps/web/app/(protected)/foods/{page.tsx,new/page.tsx,[id]/edit/page.tsx}`
- Create: `apps/web/app/(protected)/meals/{page.tsx,new/page.tsx,[id]/edit/page.tsx}`
- Test: `apps/web/components/foods/food-form.test.tsx`, `apps/web/components/meals/meal-form.test.tsx`

- [ ] **Step 1: Write failing tests** for decimal fields, system-food labels/duplication, dependency errors, search, meal row changes, quantity, and live totals.

- [ ] **Step 2: Run `pnpm --filter @diet/web test -- food-form meal-form`**

Expected: FAIL because components are absent.

- [ ] **Step 3: Implement food pages**

Use React Hook Form, debounced search, SYSTEM/USER labels, owner-only mutation actions, system duplication, and query invalidation. Render dependency conflicts inside the page/dialog.

- [ ] **Step 4: Implement meal pages**

Use `useFieldArray`, accessible-food search, quantity strings, decimal-safe preview helpers, and authoritative API totals after save. Label unsaved totals as previews.

- [ ] **Step 5: Run focused tests and type-check; expect PASS**

- [ ] **Step 6: Commit with `git commit -m "feat: add food and meal management UI"`**

### Task 13: Build single-date planning UI

**Files:**
- Create: `apps/web/components/plans/{plan-form,plan-item-row,plan-list,planned-item}.tsx`
- Create: `apps/web/components/shared/food-meal-selector.tsx`
- Create: `apps/web/app/(protected)/plans/{page.tsx,new/page.tsx,[id]/edit/page.tsx}`
- Test: `apps/web/components/plans/plan-form.test.tsx`, `apps/web/components/shared/food-meal-selector.test.tsx`

- [ ] **Step 1: Write failing tests** for Food/Meal result labels, XOR source selection, date/time/label/notes, preview totals, unique-date conflict, and authoritative saved totals.

- [ ] **Step 2: Run `pnpm --filter @diet/web test -- plan-form food-meal-selector`**

Expected: FAIL because components are absent.

- [ ] **Step 3: Implement selector and builder**

Normalize food/meal queries to `{kind:'food'|'meal', id, name, macros, subtitle}` and preserve the discriminant in requests. Use `useFieldArray`; permit exactly one source, positive decimal quantity, and optional planned metadata.

- [ ] **Step 4: Rerun plan tests and type-check; expect PASS**

- [ ] **Step 5: Commit with `git commit -m "feat: add single-date planning UI"`**

### Task 14: Build quick logging, settings, and dashboard UI

**Files:**
- Create: `apps/web/components/logs/{quick-add-dialog,log-form,log-timeline,log-row}.tsx`
- Create: `apps/web/components/macros/{macro-card,macro-progress,macro-grid}.tsx`
- Create: `apps/web/components/dashboard/{dashboard-view,today-plan,planned-vs-actual}.tsx`
- Create: `apps/web/app/(protected)/dashboard/page.tsx`, `log/page.tsx`, `settings/page.tsx`
- Create: `apps/web/lib/date/user-date.ts`
- Test: `apps/web/components/logs/quick-add-dialog.test.tsx`, `apps/web/components/dashboard/dashboard-view.test.tsx`

- [ ] **Step 1: Write failing tests** for combined selector labels, quantity/time, previews, close-on-success, dashboard/log invalidation, cards, negative remaining, no-plan state, eaten state, duplicate conflicts, log-edit refresh, and settings errors.

- [ ] **Step 2: Run `pnpm --filter @diet/web test -- quick-add-dialog dashboard-view`**

Expected: FAIL because components are absent.

- [ ] **Step 3: Implement quick-add/log UI**

Default to current user-local time, convert selected local datetime to UTC with Luxon, submit source/quantity/time, and invalidate `dashboard(date)` plus `logs(date)` after success. Reuse the form for edit and display returned snapshots. Use inline delete confirmation and dedicated errors.

- [ ] **Step 4: Implement dashboard/settings UI**

Render four accessible cards with target, actual, remaining, and clamped progress. Render chronological logs, today's plan, and mark-as-eaten-with-edits. Render planned comparison only when a plan exists. Settings saves targets/timezone and invalidates session/dashboard queries.

- [ ] **Step 5: Rerun tests and type-check; expect PASS**

- [ ] **Step 6: Commit with `git commit -m "feat: complete daily tracking workflow"`**

### Task 15: Add browser coverage, documentation, and final verification

**Files:**
- Create: `apps/web/playwright.config.ts`, `apps/web/e2e/daily-loop.spec.ts`
- Create: `apps/api/test/helpers/test-database.ts`
- Create: `README.md`
- Modify: `.env.example`, `apps/api/package.json`, `apps/web/package.json`

- [ ] **Step 1: Write the failing smoke test**

```ts
test('signup, set targets, log food, and see authoritative totals', async ({ page }) => {
  await page.goto('/signup');
  await page.getByLabel('Email').fill(`user-${Date.now()}@example.com`);
  await page.getByLabel('Password').fill('Correct-Horse-42!');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.goto('/settings');
  await page.getByLabel('Daily calories').fill('2200');
  await page.getByRole('button', { name: 'Save targets' }).click();
  await page.goto('/dashboard');
  await page.getByRole('button', { name: 'Add food or meal' }).click();
  await page.getByPlaceholder('Search foods and meals').fill('Chicken breast');
  await page.getByRole('option', { name: /Chicken breast.*Food/ }).click();
  await page.getByLabel('Quantity').fill('1.5');
  await page.getByRole('button', { name: 'Save log' }).click();
  await expect(page.getByTestId('actual-calories')).toHaveText('247.5');
});
```

- [ ] **Step 2: Run `pnpm --filter @diet/web test:e2e`**

Expected: FAIL if server wiring, selectors, or authoritative refresh is incomplete.

- [ ] **Step 3: Repair only approved-flow failures**

Use accessible selectors and `data-testid` only for dynamic totals. Configure web/API servers, isolated test database reset, migration, and seed. Do not add summary, copying, recurrence, analytics, dark mode, or session refresh.

- [ ] **Step 4: Write README**

Document prerequisites, install, env, PostgreSQL, migration, seed, dev/build/test commands, app URLs, architecture, decimal-string policy, timezone handling, cookie/CORS/origin configuration, strict dependency deletion, archive/soft-delete deferral, and the two deferred session-hardening items.

- [ ] **Step 5: Run all verification**

```powershell
pnpm lint
pnpm typecheck
pnpm test
pnpm db:validate
pnpm --filter @diet/api test:e2e
pnpm build
pnpm --filter @diet/web test:e2e
git diff --check
```

Expected: every command exits 0 and Playwright proves the core daily loop.

- [ ] **Step 6: Perform responsive browser QA**

Inspect all MVP routes at 1440×900 and 390×844. Verify no overflow, navigation does not cover actions, forms are keyboard usable, progress has accessible names, all loading/empty/error states render, and totals update without manual reload.

- [ ] **Step 7: Commit with `git commit -m "test: verify diet tracking MVP flow"`**

## Final acceptance checklist

- Cookie auth works across local ports and has secure configurable production settings.
- Every protected operation derives ownership from JWT identity.
- Food visibility, system immutability, private duplication, and dependency rejection work.
- Meal and plan totals are calculated and not persisted.
- One plan exists per user/local date; each item has exactly one source.
- Logs preserve snapshots; editing a log replaces snapshots from edited inputs.
- Local-day queries use DST-aware UTC boundaries.
- Every API decimal follows the canonical string policy.
- Dashboard totals, remaining values, timeline, plan, and eaten state are authoritative.
- Desktop and mobile complete the daily loop without manual refresh.
- No post-MVP route, model, navigation item, or UI is present.
