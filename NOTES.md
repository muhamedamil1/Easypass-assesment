# Development notes

Complete with actual work only. Do not fabricate prompts, errors, commands, or results.

## Time box

- Started:
- Stopped:
- Approximate active time:
- Required scope completed:
- Intentionally omitted:

## AI usage log

Tool: Codex

| Stage | Actual prompt/task | Important agent output or assumption | Human review/action |
|---|---|---|---|
| Planning |  |  |  |
| Database/RLS |  |  |  |
| App |  |  |  |
| Sync |  |  |  |
| Audit |  |  |  |

## AI error and durable correction

- What the AI got wrong:
- Why it was risky/incorrect:
- How I detected it:
- Immediate correction:
- Durable protection added (constraint, RLS, test, script, lint, or contract):

## RLS verification

Test accounts/memberships:

```text
Add actual seeded setup.
```

Command:

```text
Add actual command.
```

Observed results:

```text
Summarize actual results and link evidence/rls-verification.txt.
```

## Sync idempotency and recency proof

First run:

```text
Add actual received/unique/affected/final count and evidence path.
```

Second identical run:

```text
Add actual affected/final count and evidence path.
```

Latest-version assertions:

```text
Add actual INV-2026-002 and INV-2026-005 values.
```

Stale/conflict/unmatched assertions:

```text
Add actual results and evidence path.
```

## Production escalation question

Recommended topic: the ERP provides only `company_name`. Explain why stable external company identity, unmatched handling, and reconciliation policy require senior/product/ERP-owner agreement before a real financial launch.

Final answer:

```text
Write the actual question/decision and reasoning.
```

## What I would do with more time

-

## Bootstrap foundation - 2026-07-12

Prompt/task:
- The user showed `npx create-next-app@latest .` failing because the assessment root already contained harness and evidence files.

Actions:
- Preserved the existing repository files and scaffolded in `C:\tmp\easypass-next-scaffold`.
- Copied official Next.js app/config files into the root.
- Added `typecheck`, renamed the package, and removed `next/font/google` to keep builds independent of Google Fonts fetches.

Verification:
- `npm install`: passed after rerun with approval due sandbox `EPERM` on install scripts.
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm run build`: passed after rerun with approval due sandbox/OneDrive `EPERM` on `.next` diagnostics.
- `git diff --check`: passed.

Evidence:
- `evidence/bootstrap-foundation.txt`

Limitation:
- Full application, Supabase schema/RLS, sync, seed, and final acceptance scripts are not implemented yet.

## Task 01 foundation - 2026-07-12

Prompt/task:
- Execute `tasks/01-foundation-and-clients.md` after Task 00, with official Next.js/Supabase docs checked for version-sensitive proxy and SSR client APIs.

Actions:
- Installed `@supabase/supabase-js`, `@supabase/ssr`, `server-only`, `zod`, `vitest`, `tsx`, and `dotenv` through npm.
- Added `.env.example` with placeholders only and updated `.gitignore` so it is not ignored.
- Added lazy public/server env parsing and Supabase authenticated server, proxy refresh, and privileged server-only clients.
- Added root `proxy.ts` for Next.js 16 session refresh plumbing.
- Added Vitest config, a foundation harness test, and required package script entry points.
- Replaced the broken starter root page with a minimal temporary foundation page.

Verification:
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: sandbox run failed with `spawn EPERM`; approved rerun passed, 1 test file and 1 test.
- `npm run build`: sandbox run failed unlinking `.next/app-path-routes-manifest.json`; approved rerun passed.
- `npm run verify:rls`: sandbox run failed with `tsx`/esbuild `spawn EPERM`; approved rerun executed placeholder.
- `npm run verify:sync`: sandbox run failed with `tsx`/esbuild `spawn EPERM`; approved rerun executed placeholder.
- `npm run check:secrets`: sandbox run failed with `tsx`/esbuild `spawn EPERM`; approved rerun executed placeholder.
- `git diff --check`: passed.

Evidence:
- `evidence/foundation-validation.txt`

Limitations:
- RLS, seed data, auth UI, service requests, invoice sync, real RLS/sync verification, and final secret scan remain unimplemented. Placeholder script success is not acceptance proof.
- npm reported 2 moderate audit findings after dependency installation.
- `npm ls --depth=0` still reports optional native/wasm packages such as `@emnapi/runtime` as extraneous in `node_modules`; no manual lockfile or install-tree cleanup was performed.

## Task 02 database/RLS - 2026-07-12

Prompt/task:
- Execute `tasks/02-database-rls-and-seed.md` after Task 01, using the hosted Supabase project configured through ignored `.env.local`.
- Continue after `SUPABASE_DB_URL` was added locally, without printing or storing the connection string.

Actions:
- Added four ordered migrations for enums, companies, memberships, service requests, invoices, constraints, indexes, timestamp trigger, private RLS helpers, grants, policies, and trusted `public.sync_invoices(jsonb)` execute boundary.
- Added repeatable `scripts/seed.ts` using script-local Supabase clients and ignored env values.
- Added real `scripts/verify-rls.ts` using authenticated publishable-key sessions for authorization assertions.
- Wrote sanitized RLS evidence to `evidence/rls-verification.txt`.

Migration application:
- Confirmed `SUPABASE_DB_URL` was present, nonempty, and Postgres-shaped without displaying it.
- A first malformed `psql` argument ordering connected but ignored migration file arguments; a sanitized schema check showed 0 required tables, so it was not treated as applied.
- A second path-resolution attempt stopped before SQL execution because the filename set was wrong for the actual timestamped files.
- Applied successfully in this order:
  - `supabase/migrations/20260712130000_extensions_types_tables.sql`
  - `supabase/migrations/20260712130100_functions_triggers_indexes.sql`
  - `supabase/migrations/20260712130200_grants_and_rls.sql`
  - `supabase/migrations/20260712130300_invoice_sync_function.sql`
- Sanitized schema check after migration found all 4 required public tables.

Seeded setup:
```text
Users: admin@easypass.test, viewer@easypass.test
Companies: Falcon Trading LLC, Oasis Foods FZE, Marina Tech DMCC
Memberships: admin=Falcon admin; viewer=Falcon viewer, Oasis admin; Marina has no members
Requests: Falcon=2, Oasis=1, Marina=1
Passwords/tokens/connection strings were not logged.
```

RLS verification:
```text
Command: npm run verify:rls
Result: PASS (all RLS assertions passed)
Evidence: evidence/rls-verification.txt
Authorization proof used authenticated test-user clients. The privileged client was used only for fixed verification-row cleanup.
```

Important RLS assertions passed:
- Admin lists Falcon only and cannot read Oasis requests by known ID.
- Viewer lists Falcon and Oasis, reads Falcon requests, but cannot insert or update Falcon requests.
- Viewer as Oasis admin can insert and update Oasis request status.
- Neither user reads Marina company or a known Marina request ID.
- Users cannot insert, update, delete, or self-promote memberships.
- Users cannot update immutable request columns or delete requests.
- Authenticated users cannot select invoices.

Task 02 omissions by design:
- No login/sign-out pages.
- No protected company pages.
- No service-request UI or Server Actions.
- No mock ERP route.
- No invoice sync orchestration, deduplication service, or invoice UI.
- No optional features.

## Task 03 auth/request app - 2026-07-12

Prompt/task:
- Execute `tasks/03-auth-and-request-app.md` after Task 02, preserving the verified hosted Supabase schema, grants, RLS policies, seed users, memberships, and RLS verification behavior.

Actions:
- Added root auth-based redirect, login page/action, protected layout, sign-out action, company list page, company detail page, request list, admin create form, admin status form, and viewer read-only presentation.
- Added company and service-request query/schema/type modules using the authenticated cookie-bound Supabase server client only.
- Server Actions call `auth.getClaims()` independently, Zod-parse form input, write through the authenticated client, and revalidate the affected company path after success.
- No migrations, grants, RLS policies, seed identities, or invoice behavior were changed.

Implemented routes:
```text
/ -> redirects authenticated users to /companies and unauthenticated users to /login
/login -> email/password sign-in
/companies -> protected member-company list with role
/companies/[companyId] -> protected company request page
```

Authenticated read and mutation flows:
```text
Company list: company_members filtered by current claims.sub, joined to companies, with RLS still authoritative.
Company detail: UUID validation, visible company lookup, self membership lookup, service_requests filtered by company_id newest first.
Create request: companyId UUID + title 1..200, status forced to submitted, created_by forced to claims.sub.
Update status: companyId UUID + requestId UUID + allowed status enum; update only service_requests.status with id and company_id filters.
```

Security review:
- Normal app pages/actions/components import `src/lib/supabase/server.ts`, not `src/lib/supabase/admin.ts`.
- `rg -n "supabase/admin|getSupabaseAdminClient|SUPABASE_SERVICE_ROLE_KEY" src/app src/components src/features src/lib/auth` returned no matches.
- UI role checks are presentation-only. PostgreSQL grants and RLS remain the authorization boundary.
- Inaccessible or invalid company IDs use `notFound()` and do not render protected company/request data.
- User-facing action errors are generic and do not expose raw PostgreSQL messages.

Verification:
- `npm run typecheck`: passed.
- `npm run lint`: passed.
- `npm test`: sandbox run failed with Vitest/Vite `spawn EPERM`; approved rerun passed, 1 test file and 1 test.
- `npm run build`: sandbox run failed unlinking `.next/app-path-routes-manifest.json`; approved rerun passed and listed `/`, `/login`, `/companies`, `/companies/[companyId]`.
- `npm run verify:rls`: passed, all RLS assertions still pass.

Browser smoke status:
- Local dev-server launch required approval because sandboxed `Start-Process` was denied.
- After approved launch, the `agent-browser` CLI was not available on PATH and the Node REPL browser fallback failed with a tool metadata error, so automated browser smoke was not completed in this run.
- Exact manual smoke steps were recorded in `evidence/task03-manual-smoke.txt`.
