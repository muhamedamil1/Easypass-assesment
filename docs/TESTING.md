# Testing and verification contract

## Test strategy

Use three layers:

1. Pure unit tests for parsing and duplicate/version logic.
2. Real Supabase integration scripts for RLS and sync behavior.
3. Small manual browser smoke test for the required user flow.

Mocks cannot prove PostgreSQL RLS.

## Unit tests

### ERP schema

- valid canonical payload parses;
- invalid status fails;
- invalid timestamp fails;
- negative amount fails;
- more than two decimals fails;
- blank source/external/company fails.

### Incoming reduction

- unique rows retained;
- newer duplicate wins independent of order;
- older duplicate is discarded;
- equal identical version collapses;
- equal timestamp with changed status/amount/company fails.

### Sync service

Mock only the source/RPC boundaries to prove orchestration:

- parser called before RPC;
- conflict stops RPC;
- result counts are composed correctly;
- raw payload retained for selected version.

## Test users and memberships

| Account | Falcon | Oasis | Marina |
|---|---|---|---|
| `admin@easypass.test` | Admin | No membership | No membership |
| `viewer@easypass.test` | Viewer | Admin | No membership |

Passwords are supplied through server environment variables.

## `npm run verify:rls`

Use clients authenticated with each test user's email/password and the publishable key.

Required assertions:

- admin account lists Falcon, not Oasis or Marina;
- admin account reads Falcon requests;
- admin account cannot read Oasis requests;
- viewer account reads Falcon and Oasis memberships;
- viewer account reads Falcon requests;
- viewer insert into Falcon fails;
- viewer status update in Falcon fails;
- viewer/admin-of-Oasis insert into Oasis succeeds;
- viewer/admin-of-Oasis status update in Oasis succeeds;
- neither user reads Marina;
- user insert/update/delete on `company_members` fails;
- user cannot update request title/company/creator;
- user cannot select invoices.

A privileged client may clean up fixed verification rows after assertions, but it must not be used to decide whether user access succeeded.

Expected output is human-readable PASS/FAIL lines and non-zero process exit on failure.

## `npm run verify:sync`

Required assertions:

- reset test invoice state;
- first canonical sync receives eight and stores six;
- `INV-2026-002` is paid with June 15 timestamp;
- `INV-2026-005` is 1049.99 with June 16 timestamp;
- second identical sync leaves six and affects zero;
- second run does not alter business/source timestamps;
- stale version cannot overwrite newer row;
- equal-time conflicting version fails with no count/data change;
- unmatched company fails with no partial writes;
- unique `(source, external_id)` holds.

## Manual browser smoke

Admin account:

- login;
- only Falcon shown;
- create request;
- change status;
- sign out.

Viewer account:

- login;
- Falcon shown as viewer and Oasis as admin;
- Falcon read-only;
- Oasis create/update allowed;
- direct Marina URL exposes no data;
- sign out.

## Static/release checks

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

Review imports to confirm no protected user path imports `admin.ts`.

## Evidence files

Generate sanitized final outputs:

- `evidence/foundation-validation.txt`
- `evidence/rls-verification.txt`
- `evidence/sync-run-1.txt`
- `evidence/sync-run-2.txt`
- `evidence/sync-edge-cases.txt`
- `evidence/full-validation.txt`
- `evidence/secret-scan.txt`

Regenerate after the final code change. Evidence is not a substitute for executable scripts.
