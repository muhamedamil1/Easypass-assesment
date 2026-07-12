# EasyPass take-home implementation

## Goal

Deliver a reproducible Next.js + Supabase service-request tracker with proven company isolation and a deterministic, idempotent mock-ERP invoice sync.

## Scope and non-goals

Included:

- project foundation and environment boundaries;
- SQL schema, grants, RLS, and atomic sync function;
- repeatable seed;
- email/password auth;
- required company/request UI;
- mock ERP route and trusted sync command;
- unit, RLS, sync, build, secret, and browser verification;
- README, NOTES, evidence, and final audit.

Excluded until required checks pass:

- public signup/password reset;
- company/member administration;
- request edit/delete/history;
- invoice UI;
- scheduled jobs, queue/retry infrastructure;
- fuzzy matching and auto-created companies;
- design-system or deployment polish.

## Source of truth

- `docs/PRODUCT.md`
- `docs/ARCHITECTURE.md`
- `docs/IMPLEMENTATION.md`
- `docs/DATABASE.md`
- `docs/SECURITY.md`
- `docs/SYNC.md`
- `docs/FLOWS.md`
- `docs/TESTING.md`
- `docs/DECISIONS.md`
- `docs/ACCEPTANCE.md`
- `docs/TRACEABILITY.md`

## Time budget

Target total active work: 4-6 hours.

Suggested guardrails:

- Task 00 inspection/plan: 15-30 min
- Task 01 foundation/clients: 30-40 min
- Task 02 database/RLS/seed: 75-90 min
- Task 03 auth/request app: 75-90 min
- Task 04 invoice sync: 60-75 min
- Task 05 audit/docs/final evidence: 45-60 min

When time is exhausted, stop optional work, preserve proof, and document unfinished items honestly.

Actual start: 2026-07-12T12:31:00+05:30
Task 00 inspection stop: 2026-07-12T12:59:59+05:30
Task 00 active time: about 29 minutes
Actual stop:
Actual active time so far: about 79 minutes

## Progress

- [x] Task 00 - Inspect and validate plan/traceability.
- [x] Task 01 - Foundation, dependencies, environment, Supabase clients.
- [x] Task 02 - Schema, grants, RLS, seed, RLS verification.
- [ ] Task 03 - Authentication and request application.
- [ ] Task 04 - Mock ERP and invoice synchronization.
- [ ] Task 05 - Adversarial release audit, documentation, and evidence.

## Decisions and discoveries

Record actual findings here. Do not invent an AI mistake in advance.

- Direct `npx create-next-app@latest .` cannot run in the assessment root because the repository already contains required harness files. Used a temporary scaffold at `C:\tmp\easypass-next-scaffold` and copied only generated app/config files into root.
- The generated `next/font/google` imports made `npm run build` depend on fetching Google Fonts. Removed those imports from `src/app/layout.tsx` so the baseline build is reproducible offline.
- `npm install` and one `npm run build` attempt hit Windows/sandbox `EPERM` issues; rerunning those exact commands with approval passed.
- Task 00 inspection on 2026-07-12 found the repository at scaffold-only state: EasyPass v3 harness, docs, task files, active plan, fixture, evidence bootstrap note, and minimal Next.js app/config exist; no Supabase integration, migrations, seed, auth pages/actions, product UI, scripts, tests, `.env.example`, or invoice sync exist.
- Current installed top-level versions from `npm ls --depth=0`: Next.js 16.2.10, React 19.2.4, React DOM 19.2.4, TypeScript 5.9.3, ESLint 9.39.5, eslint-config-next 16.2.10, `@types/node` 20.19.43, `@types/react` 19.2.17, `@types/react-dom` 19.2.3. `@emnapi/runtime@1.11.2` appears extraneous.
- Task 00 found package scripts only included `dev`, `build`, `start`, `lint`, and `typecheck`; Task 01 added the required script entry points. Later-phase verification scripts are placeholders until their implementation tasks.
- Task 00 found the starter page was broken by missing `page.module.css`, `/next.svg`, and `/vercel.svg`; Task 01 replaced it with a minimal temporary foundation page and scoped CSS. `next.config.ts` remains the empty scaffold config because no Task 01 option is needed.
- Existing `fixtures/mock-erp-invoices.json` is present and contains the canonical eight mock ERP invoices; it must remain unchanged during Task 04 except for verification that route/adapter serve it exactly.
- Task 01 expected dependencies: `@supabase/supabase-js` and `@supabase/ssr` for authenticated SSR and privileged server clients; `server-only` to guard privileged imports; `zod` for env/form/external runtime validation; `vitest` for unit tests; `tsx` for TypeScript scripts; `dotenv` or equivalent explicit env loader for scripts. Avoid ORM, global state, form framework, query library, component system, and job framework.
- Expected Task 01 files: `.env.example`, package scripts/dependencies, `src/lib/env/public.ts`, `src/lib/env/server.ts`, `src/lib/supabase/server.ts`, `src/lib/supabase/proxy.ts`, `src/lib/supabase/admin.ts`, root `proxy.ts`, Vitest config/setup as needed, and placeholder script entry points only where required to keep named commands available without implementing later behavior.
- Expected Task 02 files: `supabase/migrations/001_extensions_types_tables.sql`, `002_functions_triggers_indexes.sql`, `003_grants_and_rls.sql`, `004_invoice_sync_function.sql`, `scripts/seed.ts`, `scripts/verify-rls.ts`, and `evidence/rls-verification.txt`.
- Expected Task 03 files: `src/app/(auth)/login/page.tsx`, `src/app/(auth)/login/actions.ts`, `src/app/(protected)/layout.tsx`, `src/app/(protected)/companies/page.tsx`, `src/app/(protected)/companies/[companyId]/page.tsx`, `src/app/(protected)/companies/[companyId]/actions.ts`, auth/company/request components, and feature query/mutation/schema/type modules for companies and service requests.
- Expected Task 04 files: `src/app/api/mock-erp/invoices/route.ts`, `src/features/erp/invoice-source.ts`, `src/features/erp/mock-erp-source.ts`, `src/features/erp/types.ts`, `src/features/invoices/schemas.ts`, `deduplicate.ts`, `sync-service.ts`, `types.ts`, `scripts/sync-invoices.ts`, `scripts/verify-sync.ts`, and tests under `tests/invoices/`.
- Expected Task 05 files: `README.md`, completed `NOTES.md`, `scripts/check-secrets.ts`, final evidence files under `evidence/`, and updates to this ExecPlan/results. Root `README.md` does not exist yet; only `evidence/README.md` exists.
- Version-sensitive APIs requiring official-doc verification before implementation: Next.js 16 `proxy.ts` file convention, matcher syntax, Server Actions/revalidate behavior, App Router redirects/notFound; Supabase `@supabase/ssr` cookie API with Next.js async cookies, `auth.getClaims()`, service-role client options and key naming; Supabase/PostgREST column grants/RPC execution behavior; PostgreSQL 18 RLS policy/default-deny/security-definer/search-path behavior and `INSERT ... ON CONFLICT DO UPDATE ... WHERE` semantics. Task 00 checked official Next.js, Supabase, and PostgreSQL docs; apply the exact current examples during implementation.
- Official reference check notes: Next.js docs report latest version 16.2.10 and confirm `middleware` is deprecated in favor of `proxy.ts`, with static matcher constants and negative matching for assets; Supabase docs confirm `auth.getClaims()` verifies JWT claims and is preferred over `getUser` when JWKS can be used; PostgreSQL docs confirm RLS default-deny when enabled without policies and `ON CONFLICT DO UPDATE ... WHERE` atomic upsert behavior with skipped rows not returned.
- No contradiction requiring a `Proposed` decision was found during Task 00. Current blockers are implementation absence only: Task 01 must add required dependencies/config/scripts/env/Supabase boundaries, and the starter page currently cannot be treated as product UI.
- Task 01 completed on 2026-07-12T13:22:24+05:30. Added `@supabase/supabase-js`, `@supabase/ssr`, `server-only`, `zod`, `vitest`, `tsx`, and `dotenv`; npm reported 2 moderate audit findings after install, not addressed in this task because no safe non-breaking fix was requested or required by the Task 01 contract.
- Added separate lazy env readers in `src/lib/env/public.ts` and `src/lib/env/server.ts`. Server env imports `server-only`; no module parses secrets at import time.
- Added authenticated cookie-bound server Supabase client in `src/lib/supabase/server.ts`, proxy refresh helper in `src/lib/supabase/proxy.ts`, root `proxy.ts`, and service-role-only lazy admin client in `src/lib/supabase/admin.ts`. No browser Supabase client was created because Task 01 has no real Client Component requiring it.
- Added required package script entry points. `verify:rls`, `verify:sync`, `seed`, `sync:invoices`, and `check:secrets` are explicit placeholders for later tasks and must not be treated as acceptance proof yet.
- Replaced broken starter root page with a minimal static foundation page and removed missing `page.module.css`, `/next.svg`, and `/vercel.svg` dependencies without adding product UI.
- `npm ls --depth=0` still reports optional native/wasm packages such as `@emnapi/runtime` as extraneous in `node_modules` after npm install. The lockfile and package metadata were updated only through npm; no manual cleanup was done because this appears to be a local install-tree artifact and npm also warned about an EPERM cleanup path under `@unrs/resolver-binding-wasm32-wasi`.
- Task 01 validation: `npm run lint` passed; `npm run typecheck` passed; `npm test` initially failed with sandbox `spawn EPERM` then passed with approval; `npm run build` initially failed with sandbox/OneDrive `.next` unlink `EPERM` then passed with approval; `npm run verify:rls`, `npm run verify:sync`, and `npm run check:secrets` initially hit `tsx`/esbuild `spawn EPERM` then placeholder commands passed with approval; `git diff --check` passed.
- Task 01 added `!.env.example` to `.gitignore` so the required placeholder env file is commit-visible while real `.env*` files remain ignored.
- Task 02 completed on 2026-07-12T14:28:35+05:30. Added four ordered Supabase migrations using timestamped filenames: `20260712130000_extensions_types_tables.sql`, `20260712130100_functions_triggers_indexes.sql`, `20260712130200_grants_and_rls.sql`, and `20260712130300_invoice_sync_function.sql`.
- The migration application used `psql` against ignored `SUPABASE_DB_URL`. A first malformed `psql` argument order connected but ignored file options; a sanitized schema check showed 0 required tables, so it was not treated as applied. A second path-resolution attempt also stopped before SQL execution. The corrected absolute-path invocation applied all four migrations successfully, followed by a sanitized schema check showing all 4 required public tables.
- Task 02 seed uses script-local Supabase clients and explicitly loads ignored `.env.local`. It seeds `admin@easypass.test` and `viewer@easypass.test` without logging passwords, plus Falcon Trading LLC, Oasis Foods FZE, Marina Tech DMCC, memberships, and deterministic service requests. `npm run seed` passed twice.
- `npm run verify:rls` is no longer a placeholder. It signs in with authenticated publishable-key clients for both seed users; the privileged client is used only to delete fixed verification rows before/after assertions. All RLS assertions passed, including cross-company denial, viewer write denial, membership write denial, immutable request-column denial, service-request delete denial, and invoice select denial.
- Task 02 intentionally did not implement auth pages, protected company pages, request Server Actions, mock ERP route, invoice sync orchestration, invoice UI, optional features, or final secret scanning.
## Milestones

### Task 00 - Inspection and plan confirmation

Expected:

- map current scaffold to target structure;
- confirm dependency and migration approach;
- verify every brief requirement has implementation and proof;
- record blockers/proposed decisions without feature coding.

Actual proof:

- read `AGENTS.md`, all `docs/*.md`, `.agent/PLANS.md`, active ExecPlan, `tasks/00` through `tasks/05`, scaffold/config files, fixture, bootstrap evidence, notes/setup/harness, package metadata, file inventory, and Git state;
- compared current tree against `docs/IMPLEMENTATION.md` target structure and `docs/TRACEABILITY.md`;
- plan updated with actual repository state, expected phase files, dependencies, API documentation risks, and current blockers;
- no unresolved critical architecture decision found.

### Task 01 - Foundation

Actual:

- Installed required foundation dependencies and dev tooling with npm-managed lockfile updates.
- Added placeholder-only environment example, lazy public/server env parsing, authenticated server/proxy Supabase clients, and server-only privileged client.
- Added Next.js 16 root `proxy.ts` session-refresh foundation.
- Added Vitest config and one foundation harness test.
- Added required package script entry points, with later-phase scripts explicitly placeholder-only.
- Cleaned broken create-next-app starter page into a minimal compiling temporary page.

Proof:

- `evidence/foundation-validation.txt`
- `npm run lint` passed.
- `npm run typecheck` passed.
- `npm test` passed after approved rerun for sandbox `spawn EPERM`.
- `npm run build` passed after approved rerun for `.next` cleanup `EPERM`.
- `git diff --check` passed.

Expected files:

- package/dependencies/scripts;
- `.env.example` and env parsing;
- authenticated server/proxy and privileged Supabase clients;
- Vitest/tsx setup;
- placeholder script entry points only as needed to expose required commands before later phases.

Proof:

- dev app boots;
- lint, typecheck, test runner, and build execute;
- no product behavior or secret committed.

### Task 02 - Database and RLS

Expected files:

- four ordered migrations;
- seed script;
- RLS verification script;
- evidence output.

Proof:

- repeat migration/seed documented;
- all access-matrix integration checks pass with real user sessions;
- invoice/user access defaults closed.

### Task 03 - Required application

Expected:

- login/sign-out;
- protected layout;
- company list/detail;
- request create/status actions;
- admin/viewer presentation.

Proof:

- two-user browser smoke;
- direct non-member URL exposes no data;
- no normal path imports privileged client;
- build/static checks pass.

### Task 04 - Invoice sync

Expected:

- canonical fixture and mock route;
- source adapter;
- Zod schema;
- duplicate reducer;
- trusted RPC and sync service/script;
- unit and sync verification.

Proof:

- six correct final rows;
- second run affects zero;
- stale/conflict/unmatched tests pass without partial writes.

### Task 05 - Release proof

Expected:

- fresh-thread findings-first audit;
- accepted fixes plus regression checks;
- README and NOTES completed from actual evidence;
- secret/history check;
- full validation evidence regenerated.

Proof:

- every acceptance and traceability item has evidence;
- limitations and production escalation are explicit.

## Validation

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run verify:rls
npm run verify:sync
npm run check:secrets
git diff --check
```

Manual:

- two-user browser smoke;
- inspect normal user imports for privileged client;
- fresh-clone setup review;
- tracked files and Git history secret review.

## Results

Complete during development:

- Delivered behavior: Task 01 foundation, env validation boundaries, Supabase server/proxy/admin clients, required scripts, test runner, and temporary compiling root page are in place. Task 02 database schema, grants, RLS, seed, and authenticated RLS proof are also in place.
- Evidence paths: `evidence/bootstrap-foundation.txt`, `evidence/foundation-validation.txt`, `evidence/rls-verification.txt`
- AI error caught: None requiring a contract change. The local tool editor failed under the Windows sandbox, so the same planned edits were applied with a repository-local script; validation caught no behavior drift.
- Durable correction: Keep using npm for lockfile/dependency changes; do not manually clean extraneous optional native packages from `node_modules`.
- Known limitations: Auth UI, service-request application behavior, invoice sync, real sync verification, and final secret scan remain later tasks. `verify:sync` and `check:secrets` are placeholders only. npm audit reports 2 moderate findings.
- Production escalation:
