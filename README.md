# EasyPass take-home

EasyPass is a small Next.js App Router and Supabase application for the assessment. It demonstrates authenticated company-scoped service requests, database-enforced tenant isolation, admin/viewer permissions, and a deterministic mock ERP invoice import.

## Architecture overview

- Next.js App Router renders the login, protected company list, company request pages, and the read-only mock ERP route.
- Normal application reads and writes use the cookie-bound Supabase SSR client in `src/lib/supabase/server.ts` so PostgreSQL grants and RLS enforce authorization.
- The service-role Supabase client is server-only and limited to seed, invoice sync, and verification scripts.
- SQL migrations under `supabase/migrations/` define tables, constraints, grants, RLS policies, private membership helpers, and the trusted `public.sync_invoices(jsonb)` RPC.
- Invoice sync loads `fixtures/mock-erp-invoices.json`, validates it with Zod, reduces duplicate source versions deterministically, and persists through one trusted database function.

## Prerequisites

- Node.js compatible with the installed Next.js version.
- npm.
- Git.
- A hosted Supabase project.
- `psql` available on your PATH for applying the SQL migration files.

## Clone and install

```powershell
git clone YOUR_REPOSITORY_URL
cd easypass-assesment
npm install
```

## Supabase setup

Create a new hosted Supabase project. From the Supabase dashboard, collect these values without committing them:

- Project URL: used as `NEXT_PUBLIC_SUPABASE_URL`.
- Publishable key: used as `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
- Service role key: used as `SUPABASE_SERVICE_ROLE_KEY` for trusted local scripts only.
- Direct database connection string: used locally as `SUPABASE_DB_URL` for migrations.

Create `.env.local` in the repository root. Do not commit it.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SEED_ADMIN_PASSWORD=
SEED_VIEWER_PASSWORD=
SUPABASE_DB_URL=
```

Use disposable assessment passwords for the seed accounts. Never paste real keys, passwords, JWTs, connection strings, or authorization headers into tracked files, screenshots, or evidence.

## Apply migrations

Run the migration files against a new Supabase project in timestamp order. This command uses `SUPABASE_DB_URL` from your local shell environment and applies every file under `supabase/migrations/`.

```powershell
$env:SUPABASE_DB_URL="<DATABASE_CONNECTION_STRING>"
Get-ChildItem supabase\migrations\*.sql | Sort-Object Name | ForEach-Object { psql $env:SUPABASE_DB_URL -v ON_ERROR_STOP=1 -f $_.FullName }
```

The migration files are:

- `supabase/migrations/20260712130000_extensions_types_tables.sql`
- `supabase/migrations/20260712130100_functions_triggers_indexes.sql`
- `supabase/migrations/20260712130200_grants_and_rls.sql`
- `supabase/migrations/20260712130300_invoice_sync_function.sql`

## Seed data

Seed is repeatable and uses the service-role key locally.

```powershell
npm run seed
```

Seeded accounts:

- `admin@easypass.test`: admin of Falcon Trading LLC only.
- `viewer@easypass.test`: viewer of Falcon Trading LLC and admin of Oasis Foods FZE.

Passwords come only from `SEED_ADMIN_PASSWORD` and `SEED_VIEWER_PASSWORD` in `.env.local`.

## Run the app

```powershell
npm run dev
```

Open the local URL printed by Next.js.

Flow:

- `/login`: email/password sign-in.
- `/companies`: protected list of companies visible to the signed-in user.
- `/companies/[companyId]`: protected company service-request page.
- Admins can create service requests and update request status.
- Viewers can read company requests but cannot create or update them; PostgreSQL grants and RLS enforce this even if a form or API call is manipulated.

## Mock ERP and invoice sync

The mock ERP route returns the fixed fixture unchanged:

```text
GET /api/mock-erp/invoices
```

Run the trusted invoice import from the CLI:

```powershell
npm run sync:invoices
```

The sync imports eight source objects into six final invoice identities. A repeat sync is idempotent, stale versions do not roll data back, equal-timestamp conflicts fail, and unmatched companies fail without partial writes.

## Verification

Run focused checks:

```powershell
npm run verify:rls
npm run verify:sync
```

Run the complete release validation sequence:

```powershell
npm run lint
npm run typecheck
npm test
npm run build
npm run verify:rls
npm run verify:sync
npm run check:secrets
git diff --check
```

`npm run check:secrets` scans tracked files, untracked non-ignored workspace files, and practical Git-history content, writes sanitized output to `evidence/secret-scan.txt`, and exits non-zero if it finds likely secrets.

## Manual two-user smoke

After `npm run verify:rls` passes and the dev server is running:

1. Sign in as `admin@easypass.test`.
2. Confirm only Falcon Trading LLC is visible.
3. Open Falcon, create a request, update its status, and sign out.
4. Sign in as `viewer@easypass.test`.
5. Confirm Falcon is visible as viewer and Oasis Foods FZE is visible as admin.
6. Confirm Falcon is read-only and has no write controls.
7. Open Oasis, create a request, update its status, and sign out.
8. Navigate directly to `/companies/33333333-3333-4333-8333-333333333333` and confirm no Marina company or request data is exposed.

The recorded smoke evidence is in `evidence/task03-manual-smoke.txt`.

## Known limitations

- No public signup, password reset, company/member administration, request deletion, invoice UI, scheduler, queue, webhook, or deployment polish is included.
- Mock ERP company matching uses normalized exact company names because the supplied payload has no stable external company ID. A production system should use a stable ERP company identifier, explicit mapping, and a reconciliation policy.
- Browser smoke was manually confirmed and recorded; automated browser tooling was blocked in the local environment.
- npm reported two moderate audit findings during setup; they were not remediated because no safe non-breaking fix was part of the assessment scope.

## AI-assisted development

The repository includes `AGENTS.md`, task files, an active ExecPlan, `NOTES.md`, and sanitized evidence showing the Codex-assisted workflow. Verification scripts and PostgreSQL policies are the proof of behavior; UI state and AI claims are not treated as authorization evidence.

## Security warning

Do not commit `.env.local`, Supabase keys, seed passwords, JWTs, database connection strings, private keys, access tokens, refresh tokens, or authorization headers. Keep `.env.example` as empty placeholders only.
