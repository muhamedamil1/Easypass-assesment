# Task 02 — Database, RLS, seed, and isolation proof

## Goal

Implement the exact database contract and prove company isolation with authenticated user sessions.

## Context

Read `docs/DATABASE.md`, `docs/SECURITY.md`, `docs/PRODUCT.md`, `docs/TESTING.md`, `docs/DECISIONS.md`, `docs/ACCEPTANCE.md`, and the active ExecPlan.

## Constraints

- Implement ordered migrations exactly through explicit constraints, grants, private helpers, RLS, and sync-function privilege boundary.
- Implement repeatable seed users/companies/memberships/requests.
- Authorization assertions must use actual user-authenticated clients, never service-role results.
- Privileged client is allowed only for seed and controlled test cleanup.
- Do not build application UI or sync orchestration.
- Do not weaken grants/RLS to make verification pass.

## Done when

- Fresh migrations and repeat seed are documented and execute.
- `npm run verify:rls` covers every required access-matrix assertion and exits non-zero on failure.
- Viewer writes, membership writes, non-member reads, immutable request-column updates, and invoice reads fail.
- Admin allowed operations succeed.
- Evidence is sanitized and current.
- Relevant static/build/diff checks pass.
