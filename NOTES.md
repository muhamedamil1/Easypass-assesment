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

## Task 01 foundation - 2026-07-12

Prompt/task:
- Execute `tasks/01-foundation-and-clients.md` after Task 00, with official Next.js/Supabase docs checked for version-sensitive proxy and SSR client APIs.

Actions:
- Installed `@supabase/supabase-js`, `@supabase/ssr`, `server-only`, `zod`, `vitest`, `tsx`, and `dotenv` through npm.
- Added `.env.example` with placeholders only and updated `.gitignore` so it is not ignored.
- Added lazy public/server env parsing and Supabase authenticated server, proxy refresh, and privileged server-only clients.
- Added root `proxy.ts` for Next.js 16 session refresh plumbing.
- Added Vitest config, a foundation harness test, and required package script entry points.
- Replaced the broken starter root page with a minimal temporary foundation page.

Verification:
- `npm run lint`: passed.
- `npm run typecheck`: passed.
- `npm test`: sandbox run failed with `spawn EPERM`; approved rerun passed, 1 test file and 1 test.
- `npm run build`: sandbox run failed unlinking `.next/app-path-routes-manifest.json`; approved rerun passed.
- `npm run verify:rls`: sandbox run failed with `tsx`/esbuild `spawn EPERM`; approved rerun executed placeholder.
- `npm run verify:sync`: sandbox run failed with `tsx`/esbuild `spawn EPERM`; approved rerun executed placeholder.
- `npm run check:secrets`: sandbox run failed with `tsx`/esbuild `spawn EPERM`; approved rerun executed placeholder.
- `git diff --check`: passed.

Evidence:
- `evidence/foundation-validation.txt`

Limitations:
- RLS, seed data, auth UI, service requests, invoice sync, real RLS/sync verification, and final secret scan remain unimplemented. Placeholder script success is not acceptance proof.
- npm reported 2 moderate audit findings after dependency installation.
- `npm ls --depth=0` still reports optional native/wasm packages such as `@emnapi/runtime` as extraneous in `node_modules`; no manual lockfile or install-tree cleanup was performed.
