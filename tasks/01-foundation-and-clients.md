# Task 01 — Foundation and Supabase boundaries

## Goal

Create the minimum application/tooling foundation required by the locked architecture without implementing product behavior.

## Context

Read `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION.md`, `docs/SECURITY.md`, `docs/DECISIONS.md`, `docs/TESTING.md`, and the active ExecPlan.

## Constraints

- Add only required dependencies.
- Implement environment parsing, authenticated server/proxy clients, and privileged server-only client.
- Do not add database tables, RLS, auth pages/actions, product UI, or invoice sync.
- Do not create an unused browser Supabase client.
- Preserve current stable Next.js conventions; verify version-sensitive APIs from official docs.

## Done when

- `.env.example` contains placeholders only.
- Public/server environment boundaries are enforced.
- Proxy/session helper compiles.
- Privileged client cannot enter browser code.
- Required npm script entry points exist, even if later verification scripts are added by their phase.
- Lint, typecheck, test runner, and build pass.
- Active plan and sanitized foundation evidence are updated.
