# Development notes

These notes record actual work only. Secrets, passwords, JWTs, connection strings, and authorization headers are intentionally omitted.

## Time box

- Started: 2026-07-12T12:31:00+05:30.
- Stopped: 2026-07-12 after Task 05 release validation.
- Approximate active time: the active ExecPlan records Task 00 at about 29 minutes and active implementation time at about 79 minutes before later Task 02-05 updates; final work exceeded the original 4-6 hour target because verification, evidence, and Windows sandbox reruns were preserved rather than skipped.
- Required scope completed: Next.js foundation, Supabase SSR clients, hosted schema migrations, grants/RLS, seed, auth UI, protected company/request UI, mock ERP route, invoice validation/reduction/sync, RLS verification, sync verification, secret scan, README, NOTES, and release evidence.
- Intentionally omitted: public signup, password reset, company/member administration, request deletion, invoice UI, cron/queue/webhook/retry worker, fuzzy matching, automatic ERP company creation, deployment polish, and optional browser automation.

## AI usage log

Tool: Codex

| Stage | Actual prompt/task | Important agent output or assumption | Human review/action |
|---|---|---|---|
| Planning | `tasks/00-inspect-and-plan.md` plus the repository contracts in `AGENTS.md` and `docs/`. | Read the source-of-truth files first, identified the scaffold-only starting state, and recorded expected files and verification gates in the active ExecPlan. | Reviewed the phase plan before implementation advanced. |
| Foundation | `tasks/01-foundation-and-clients.md`. | Added Supabase SSR/admin boundaries, env parsing, required package scripts, and kept later verification scripts clearly marked as placeholders. | Placeholder verification was not accepted as final proof. |
| Database/RLS | `tasks/02-database-rls-and-seed.md`. | Added migrations, private RLS helpers, minimal grants, seed, and real authenticated RLS verification. | Hosted Supabase migration/seed results were checked with sanitized evidence. |
| App | `tasks/03-auth-and-request-app.md`. | Added login/sign-out, protected company pages, admin create/status actions, viewer read-only UI, and no normal-path privileged-client imports. | Manual two-user smoke was completed by the user and recorded in `evidence/task03-manual-smoke.txt`. |
| Sync | `tasks/04-invoice-sync.md`. | Added mock ERP route, runtime validation, deterministic duplicate reduction, trusted CLI sync, and edge-case verification. | Reviewed generated evidence and required final counters. |
| Audit | `tasks/05-adversarial-release-audit.md` and accepted findings. | First pass found the placeholder secret scan, missing root README, incomplete NOTES, and missing final evidence. | Accepted all four findings and requested the smallest durable corrections. |

## AI/tooling error and durable correction

- What went wrong: the first `psql` migration invocation used malformed argument ordering; it connected but ignored the migration file options.
- Why it was risky: it could have produced a false belief that the database schema existed while zero required tables were present.
- How it was detected: a sanitized schema check after the attempt showed 0 required public tables.
- Immediate correction: reran migration application with corrected absolute-path invocation in timestamp order.
- Durable protection added: `npm run verify:rls` now signs in as real seeded users and proves the RLS access matrix against the hosted database; README documents the ordered migration process; release validation requires the verification scripts, not migration claims alone.

A second release-gate issue was also caught during Task 05: early placeholder commands for `verify:rls`, `verify:sync`, and `check:secrets` existed before their implementation phases. The active plan and evidence explicitly marked them as placeholders, and Task 05 replaced the remaining placeholder secret scanner with a real failing gate and regression tests.

## RLS verification

Test accounts and memberships:

```text
admin@easypass.test: Falcon Trading LLC admin only.
viewer@easypass.test: Falcon Trading LLC viewer and Oasis Foods FZE admin.
Marina Tech DMCC: no members.
```

Command:

```text
npm run verify:rls
```

Observed results:

```text
Result: PASS (all RLS assertions passed)
Evidence: evidence/rls-verification.txt
Authorization proof used authenticated publishable-key sessions for the seed users.
The privileged client was used only for fixed verification-row cleanup.
```

Important assertions passed: admin lists Falcon only; admin cannot read Oasis by known ID; viewer reads Falcon and Oasis memberships; viewer cannot insert or update Falcon requests; viewer as Oasis admin can insert and update Oasis requests; neither user reads Marina company or a known Marina request; users cannot manage memberships, update immutable request columns, delete requests, or select invoices.

## Browser smoke proof

Evidence: `evidence/task03-manual-smoke.txt`.

The user-confirmed manual run passed for admin Falcon-only access/create/update, viewer Falcon read-only plus Oasis admin create/update, sign-out, hidden Marina, and unauthorized direct company URL no-data behavior.

## Sync idempotency and recency proof

First run:

```text
Command: npm run verify:sync
Observed: received=8, unique=6, affected=6, finalInvoiceCount=6.
Evidence: evidence/sync-run-1.txt
```

Second identical run:

```text
Command: npm run verify:sync
Observed: received=8, unique=6, affected=0, finalInvoiceCount=6; stored business/source/sync timestamps unchanged.
Evidence: evidence/sync-run-2.txt
```

Latest-version assertions:

```text
INV-2026-002: paid, source_updated_at=2026-06-15T09:00:00+00:00.
INV-2026-005: amount_aed=1049.99, source_updated_at=2026-06-16T13:40:00+00:00.
```

Stale/conflict/unmatched assertions:

```text
Stale input affected 0 rows and did not roll INV-2026-005 backward.
Equal-timestamp conflicting input was rejected with CONFLICTING_SOURCE_VERSIONS before RPC writes.
Unmatched company input was rejected with UNMATCHED_COMPANY through the RPC boundary.
Conflict and unmatched failures left count/data unchanged; no partial writes.
Evidence: evidence/sync-edge-cases.txt
```

## Production escalation question

Question: Can the ERP provide a stable external company identifier and can product/operations approve an explicit mapping and reconciliation policy before financial invoice sync is used in production?

Reason: the assessment payload only includes `company_name`, so this implementation uses normalized exact-name matching as a documented compromise. In production, names may change, collide, include legal suffix variations, or become ambiguous. Financial invoice matching should use a stable ERP company ID, an explicit mapping table, unmatched/ambiguous reconciliation workflow, and an owner-approved policy for changes and backfills.

## What I would do with more time

- Add automated browser smoke once local browser tooling is available.
- Add a migration status helper for fresh Supabase projects.
- Add production-grade ERP company mapping, sync-run audit records, retries, observability, and reconciliation UI after the assessment gate.
- Review and remediate npm audit findings only if a safe non-breaking update path is available.

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
- Full application, Supabase schema/RLS, sync, seed, and final acceptance scripts were not implemented yet at this stage.

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

Limitations then:
- RLS, seed data, auth UI, service requests, invoice sync, real RLS/sync verification, and final secret scan remained unimplemented.
- npm reported 2 moderate audit findings after dependency installation.

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

Browser smoke status:
- Local dev-server launch required approval because sandboxed `Start-Process` was denied.
- After approved launch, the `agent-browser` CLI was not available on PATH and the Node REPL browser fallback failed with a tool metadata error, so automated browser smoke was not completed in this run.
- Exact manual smoke steps were recorded in `evidence/task03-manual-smoke.txt`.
- User later confirmed the manual two-user browser smoke passed.

## Task 04 invoice sync - 2026-07-12

Prompt/task:
- Execute `tasks/04-invoice-sync.md` after Task 03, preserving the existing invoices table and trusted `public.sync_invoices(jsonb)` function unless a reproducible defect was found.

Actions:
- Added `GET /api/mock-erp/invoices` to serve the canonical fixture unchanged.
- Added fixture loading, Zod runtime ERP envelope/invoice validation, at-most-two-decimal amount validation, deterministic duplicate reduction, equal-timestamp conflict rejection, and a testable sync service.
- Replaced placeholder `sync:invoices` and `verify:sync` scripts with real trusted service-role CLI paths that call the existing database RPC.
- Added unit tests for schema validation, duplicate reduction, conflict rejection, and sync-service orchestration.
- Wrote sanitized sync evidence to `evidence/sync-run-1.txt`, `evidence/sync-run-2.txt`, and `evidence/sync-edge-cases.txt`.

Security/data review:
- Invoice identity remains `(source, external_id)`.
- The existing database function remains the transaction boundary and enforces strictly-newer `source_updated_at` updates.
- Payload order is not used as a winner; equal timestamp with conflicting business data rejects the batch.
- Company resolution remains normalized exact-name matching in PostgreSQL; no fuzzy matching or automatic company creation was added.
- Invalid/conflicting input stops before RPC; unmatched input raises through the RPC before persistence; failed edge cases produced no partial writes.
- Privileged credentials are loaded only in trusted scripts; no public privileged sync HTTP endpoint or invoice UI was added.

Important correction:
- One attempted parallel run of `npm run sync:invoices` and `npm run verify:sync` made the verifier's reset-first assertion observe rows inserted by the concurrent standalone sync, producing a false affected=0 first-run failure. The commands were rerun sequentially and passed; do not run those two sync commands concurrently against the same `mock-erp` source during verification.
