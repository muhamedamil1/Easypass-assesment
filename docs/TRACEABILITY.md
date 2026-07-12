# Requirement traceability matrix

| Assessment requirement | Locked design | Implementation area | Required proof |
|---|---|---|---|
| Next.js App Router + TypeScript | D001-D002 | scaffold, `src/app` | `npm run lint`, `npm run typecheck`, `npm run build` in `evidence/full-validation.txt` |
| Supabase database and auth | D003-D005 | SSR clients, login actions | seeded login smoke in `evidence/task03-manual-smoke.txt` |
| Companies table | Database contract | migration 001 | migration/schema review and RLS verification |
| Membership with admin/viewer | Database + Security | migration/RLS/seed | `npm run verify:rls` and `evidence/rls-verification.txt` |
| Service requests and statuses | Product + Database | migration, feature module | UI smoke plus RLS script |
| User sees only member companies | D006-D008 | companies RLS/query | cross-company RLS proof |
| User sees only member-company requests | D006-D008 | request SELECT policy | known-UUID denial proof |
| Admin creates request | D006/D009 | insert policy + action | admin success in RLS and smoke proof |
| Viewer read-only | D006/D009 | no insert/update policy | direct viewer failures in RLS proof |
| Database-level RLS | D006-D007 | grants/helpers/policies | authenticated clients, not service role |
| Seed two users/companies/requests | D020 | `scripts/seed.ts` | repeat seed behavior documented in `NOTES.md` |
| Add invoices table | D010-D017 | migration 001 | schema plus sync proof |
| Serve/read mock payload | D019 | fixture + route + adapter | route/fixture implementation and sync tests |
| Import invoices | D017-D018 | sync service/script/RPC | first sync evidence |
| No duplicates on rerun | D011-D013/D017 | unique key + reducer + upsert | second sync evidence |
| Newer invoice updates existing | D012/D017 | timestamp condition | duplicate value assertions |
| README and `.env.example` | Acceptance | `README.md`, `.env.example` | fresh-clone walkthrough documented and reviewed |
| NOTES AI log | Evidence harness | `NOTES.md` | actual prompts, tooling error, proof, and limitations |
| RLS proof | Testing contract | `verify-rls.ts` | `evidence/rls-verification.txt` |
| Sync idempotency proof | Testing contract | `verify-sync.ts` | `evidence/sync-run-1.txt`, `sync-run-2.txt`, `sync-edge-cases.txt` |
| Escalation question | D015/D016 | `NOTES.md` | production ERP company-ID mapping discussion |
| Agent file | Harness | `AGENTS.md`, tasks, plan | repo review |
| No committed secrets | Security | env split/check script | `npm run check:secrets`, `evidence/secret-scan.txt`, scanner tests |
| Honest 4-6 hour time box | ExecPlan/NOTES | progress tracking | recorded start, active-time caveat, scope, and limitations |
| Optional deployment/test/recording | Non-core | only after gate | not required; browser automation limitation recorded |

## Architecture coverage checklist

- [x] Runtime routes and commands defined.
- [x] Trust and credential boundaries defined.
- [x] Exact table/column/constraint/index blueprint defined.
- [x] Exact grants and RLS policy behavior defined.
- [x] Auth refresh/protection workflow defined.
- [x] Server Action inputs and responsibilities defined.
- [x] Seed identities/membership matrix defined.
- [x] Sync validation, reduction, company matching, transaction, and recency defined.
- [x] Failure/no-partial-write behavior defined.
- [x] Unit, RLS, sync, browser, build, and secret verification implemented and evidenced.
- [x] Documentation/evidence/submission gate completed for accepted Task 05 findings.
