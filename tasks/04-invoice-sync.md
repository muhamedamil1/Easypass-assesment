# Task 04 — Mock ERP and invoice synchronization

## Goal

Implement the canonical mock source and atomic, safe-to-rerun invoice synchronization exactly as documented.

## Context

Read `docs/SYNC.md`, `docs/DATABASE.md`, `docs/ARCHITECTURE.md`, `docs/IMPLEMENTATION.md`, `docs/SECURITY.md`, `docs/FLOWS.md`, `docs/TESTING.md`, `docs/DECISIONS.md`, and the active ExecPlan.

## Constraints

- Keep `fixtures/mock-erp-invoices.json` unchanged.
- Validate source data at runtime.
- Reduce duplicates independently of payload order.
- Equal-time conflicting source versions fail.
- Company resolution is exact normalized database matching.
- Unmatched input causes no partial writes.
- Recency is enforced by the database conditional upsert.
- Required trigger is the trusted CLI script; do not expose a privileged HTTP sync endpoint.
- Keep route/script thin and core logic testable.

## Done when

- Mock route returns canonical payload.
- Unit tests cover validation and all reduction branches.
- First sync stores six correct rows.
- Second identical sync affects zero and leaves six.
- Latest duplicate values are correct.
- Stale, conflicting, and unmatched scenarios pass with no incorrect/partial writes.
- `npm run verify:sync` and relevant full checks pass.
- Plan/NOTES/evidence are updated.
