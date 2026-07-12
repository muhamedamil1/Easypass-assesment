# Task 03 — Authentication and service-request application

## Goal

Implement the required sign-in/sign-out, company navigation, request listing, admin mutations, and viewer read-only experience on top of the verified RLS model.

## Context

Read `docs/PRODUCT.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION.md`, `docs/SECURITY.md`, `docs/FLOWS.md`, `docs/TESTING.md`, `docs/ACCEPTANCE.md`, and the active ExecPlan. Inspect completed migrations and RLS verification first.

## Constraints

- Use Server Components and Server Actions as defined.
- Normal operations use only the authenticated server client.
- Every action verifies claims and parses input.
- UI roles improve presentation but never replace RLS.
- Inaccessible company IDs expose no protected data.
- Do not add signup, administration, deletion, invoice UI, global state, or design-system work.

## Done when

- Seeded users complete their allowed browser flows.
- Admin request creation/status update succeeds.
- Viewer Falcon page is read-only; Oasis admin flow succeeds.
- Direct Marina/non-member URL exposes no data.
- No normal user module imports the privileged client.
- Lint, typecheck, unit tests, build, RLS verification, and browser smoke pass.
- Plan/NOTES/evidence are updated with real results.
