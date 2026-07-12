# EasyPass Codex harness

This harness separates **how Codex works** from **what the system must be**.

`AGENTS.md` is deliberately a compact map. Detailed, durable system truth is stored in focused documents so the agent reads only the contract relevant to the current task.

## Five layers

| Harness layer | Repository mechanism | Purpose |
|---|---|---|
| Context | `AGENTS.md`, product and architecture documents | Give Codex the correct project knowledge. |
| Decisions | `docs/DECISIONS.md` and locked contracts | Define what is fixed, locally flexible, or escalated. |
| Execution | `.agent/PLANS.md`, active ExecPlan, `tasks/` | Divide work into gated, bounded stages. |
| Verification | database constraints, tests, scripts, `docs/TESTING.md`, `docs/ACCEPTANCE.md` | Require objective proof instead of agent claims. |
| Evidence | `NOTES.md`, `evidence/`, ExecPlan logs | Preserve actual prompts, mistakes, commands, and results. |

## Entry points

### Human setup entry point

`SETUP.md`

Use it to scaffold Next.js, place the harness at the repository root, configure Git, and start Codex correctly.

### Codex instruction entry point

`AGENTS.md`

Codex discovers this file from the repository root. It routes the agent to the appropriate detailed contract.

### Planning and state entry point

`.agent/exec-plans/active/001-easypass-take-home.md`

This is the living implementation state. It must be updated after each phase.

### Task entry points

Run the files under `tasks/` in numeric order. Each task contains only goal, context, constraints, and done conditions.

### Runtime entry points after implementation

- `/login`
- `/companies`
- `/companies/[companyId]`
- `GET /api/mock-erp/invoices`
- `npm run seed`
- `npm run sync:invoices`
- `npm run verify:rls`
- `npm run verify:sync`

The required sync trigger is the CLI script. A network-accessible sync route is intentionally not required for this time-boxed assessment; the shared sync service can later be invoked by a protected job or route.

## Operating loop

1. Follow `SETUP.md` and commit the clean Next.js scaffold.
2. Copy this harness into the repository root and commit it separately.
3. Start Codex from the repository root and verify which instructions it loaded.
4. Run `tasks/00-inspect-and-plan.md`; review its plan before implementation.
5. Run tasks `01` through `04` in order. Do not advance when the current gate fails.
6. Run `tasks/05-adversarial-release-audit.md` in a fresh Codex thread.
7. Fix accepted findings, add regression protection, and rerun the complete validation suite.
8. Complete `README.md`, `NOTES.md`, evidence files, and the active ExecPlan.
9. Inspect tracked files and Git history for secrets before submission.

## Durable correction rule

When an agent makes a repeatable error, prefer the smallest durable correction:

- database constraint or grant;
- RLS policy or private helper;
- runtime schema;
- automated test;
- verification script;
- lint/secret check;
- focused source-of-truth update.

Do not respond to recurring errors by endlessly enlarging the prompt.
