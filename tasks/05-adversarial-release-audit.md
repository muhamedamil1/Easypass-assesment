# Task 05 — Adversarial release audit

## Goal

Find any remaining requirement, architecture, security, data-integrity, setup, or evidence gap before submission. Perform the first pass as findings-only in a fresh Codex thread.

## Context

Read the original task requirements represented in `docs/PRODUCT.md` and `docs/TRACEABILITY.md`, all architecture contracts, `AGENTS.md`, the active ExecPlan, complete Git diff/history, migrations, clients, actions, sync code, scripts, tests, README, NOTES, and evidence.

## Constraints

- Perform the first pass as review-only; do not edit files while discovering findings.
- Do not accept passing tests as proof that requirements, privileges, and evidence are complete.
- Do not weaken an invariant to resolve a finding.
- Keep fixes within the assessment scope and time box.
- Require a regression test, constraint, script, or focused contract update for repeatable defect classes.

## Review for

- a brief requirement without implementation or proof;
- architecture behavior implemented differently from locked decisions;
- cross-company data leakage;
- viewer/member privilege escalation;
- recursive/overbroad RLS or grants;
- service-role imports in normal paths;
- browser/log/repository secret exposure;
- reliance on UI checks as authorization;
- request-column updates beyond status;
- duplicate invoices or stale rollback;
- payload-order dependence;
- equal-time conflict mishandling;
- fuzzy/unmatched company misassignment;
- partial invoice writes;
- non-repeatable seed/migrations;
- README steps that do not work from scratch;
- NOTES/evidence claims unsupported by actual output;
- optional scope that displaced required verification.

## Done when

- First-pass findings are severity-ordered with file/line references, reproduction, impact, and recommended regression protection.
- Accepted findings are fixed only in a subsequent pass.
- The smallest durable protections are added.
- Full validation, two-user smoke, fresh-clone review, import-boundary review, and secret/history scans pass.
- `docs/TRACEABILITY.md`, active plan, README, NOTES, and evidence are current.
- Remaining limitations are explicit and no critical/high finding remains.
