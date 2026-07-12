# Development notes

Complete with actual work only. Do not fabricate prompts, errors, commands, or results.

## Time box

- Started:
- Stopped:
- Approximate active time:
- Required scope completed:
- Intentionally omitted:

## AI usage log

Tool: Codex

| Stage | Actual prompt/task | Important agent output or assumption | Human review/action |
|---|---|---|---|
| Planning |  |  |  |
| Database/RLS |  |  |  |
| App |  |  |  |
| Sync |  |  |  |
| Audit |  |  |  |

## AI error and durable correction

- What the AI got wrong:
- Why it was risky/incorrect:
- How I detected it:
- Immediate correction:
- Durable protection added (constraint, RLS, test, script, lint, or contract):

## RLS verification

Test accounts/memberships:

```text
Add actual seeded setup.
```

Command:

```text
Add actual command.
```

Observed results:

```text
Summarize actual results and link evidence/rls-verification.txt.
```

## Sync idempotency and recency proof

First run:

```text
Add actual received/unique/affected/final count and evidence path.
```

Second identical run:

```text
Add actual affected/final count and evidence path.
```

Latest-version assertions:

```text
Add actual INV-2026-002 and INV-2026-005 values.
```

Stale/conflict/unmatched assertions:

```text
Add actual results and evidence path.
```

## Production escalation question

Recommended topic: the ERP provides only `company_name`. Explain why stable external company identity, unmatched handling, and reconciliation policy require senior/product/ERP-owner agreement before a real financial launch.

Final answer:

```text
Write the actual question/decision and reasoning.
```

## What I would do with more time

-

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
- Full application, Supabase schema/RLS, sync, seed, and final acceptance scripts are not implemented yet.
