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

Target total active work: 4–6 hours.

Suggested guardrails:

- Task 00 inspection/plan: 15–20 min
- Task 01 foundation/clients: 30–40 min
- Task 02 database/RLS/seed: 75–90 min
- Task 03 auth/request app: 75–90 min
- Task 04 invoice sync: 60–75 min
- Task 05 audit/docs/final evidence: 45–60 min

When time is exhausted, stop optional work, preserve proof, and document unfinished items honestly.

Actual start:
Actual stop:
Actual active time:

## Progress

- [ ] Task 00 — Inspect and validate plan/traceability.
- [ ] Task 01 — Foundation, dependencies, environment, Supabase clients.
- [ ] Task 02 — Schema, grants, RLS, seed, RLS verification.
- [ ] Task 03 — Authentication and request application.
- [ ] Task 04 — Mock ERP and invoice synchronization.
- [ ] Task 05 — Adversarial release audit, documentation, and evidence.

## Decisions and discoveries

Record actual findings here. Do not invent an AI mistake in advance.

- None yet.

## Milestones

### Task 00 — Inspection and plan confirmation

Expected:

- map current scaffold to target structure;
- confirm dependency and migration approach;
- verify every brief requirement has implementation and proof;
- record blockers/proposed decisions without feature coding.

Proof:

- plan updated with actual repository state;
- traceability remains complete;
- no unresolved critical architecture decision.

### Task 01 — Foundation

Expected files:

- package/dependencies/scripts;
- `.env.example` and env parsing;
- authenticated server/proxy and privileged Supabase clients;
- Vitest/tsx setup;
- placeholder directories only as needed.

Proof:

- dev app boots;
- lint, typecheck, test runner, and build execute;
- no product behavior or secret committed.

### Task 02 — Database and RLS

Expected files:

- four ordered migrations;
- seed script;
- RLS verification script;
- evidence output.

Proof:

- repeat migration/seed documented;
- all access-matrix integration checks pass with real user sessions;
- invoice/user access defaults closed.

### Task 03 — Required application

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

### Task 04 — Invoice sync

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

### Task 05 — Release proof

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

- Delivered behavior:
- Evidence paths:
- AI error caught:
- Durable correction:
- Known limitations:
- Production escalation:
