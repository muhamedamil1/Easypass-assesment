# Definition of done

The project is complete only when every required behavior has objective proof.

## Foundation

- Current stable Next.js App Router/TypeScript scaffold runs.
- Environment parsing separates public/server values.
- Authenticated and privileged Supabase clients are isolated.
- Package scripts named in the implementation contract exist.

## Database

- Four required tables exist through migrations.
- Enums, FKs, checks, indexes, unique constraints, and update trigger exist.
- RLS enabled on all public tables.
- Grants and policies match the access matrix.
- Invoice sync function is executable only by the trusted role.
- Fresh migration and repeat seed instructions are documented.

## Authentication and UI

- Seeded users sign in and sign out.
- User sees only member companies.
- User sees only requests for visible companies.
- Admin creates requests and updates status.
- Viewer gets read-only UI.
- Direct viewer writes fail at PostgreSQL.
- Direct non-member URLs expose no protected data.

## Invoice sync

- Mock payload route returns the canonical fixture.
- `npm run sync:invoices` works without the dev server making a self-request.
- Eight source objects reduce to six identities.
- Latest versions of `INV-2026-002` and `INV-2026-005` are stored.
- Second identical sync leaves six and affects zero.
- Stale versions do not roll back data.
- Equal-time conflicts fail.
- Unmatched companies fail without partial writes.

## Verification

All pass:

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

Manual two-user smoke is recorded.

## Documentation and evidence

- `README.md` starts from a fresh clone and new Supabase project.
- `.env.example` has placeholders only.
- `NOTES.md` contains time box, actual prompts, a real AI error, correction, RLS proof, sync proof, escalation question, and remaining work.
- Evidence files contain sanitized actual output.
- Active ExecPlan progress/results are current.
- Harness files reflect the workflow actually used.
- No secret appears in tracked files or Git history.

## Submission gate

Do not claim completion when:

- a required verification command was not run;
- RLS was inferred from SQL inspection only;
- sync idempotency was not run twice;
- documentation claims exceed evidence;
- optional UI/deployment work displaced security or sync verification.
