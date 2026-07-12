# EasyPass repository instructions

## Mission and priority

Build the EasyPass take-home as a small, secure, explainable Next.js + Supabase application.

Priority order:

1. Database-enforced company isolation.
2. Correct `admin` and `viewer` permissions.
3. Safe, repeatable invoice synchronization.
4. Reproducible setup and objective verification.
5. Plain functional UI.
6. Bonus work only after all required checks pass.

## Repository map

Always start with:

- `docs/PRODUCT.md` — required behavior, actors, scope, and non-goals.
- `docs/ARCHITECTURE.md` — system boundaries, entry points, and component interactions.
- `docs/DECISIONS.md` — locked choices and the escalation protocol.

Read the closest detailed contract for the task:

- Foundation or application work: `docs/IMPLEMENTATION.md`
- Schema, SQL, migrations, or RLS: `docs/DATABASE.md` and `docs/SECURITY.md`
- Auth or request workflows: `docs/FLOWS.md` and `docs/SECURITY.md`
- ERP or invoice work: `docs/SYNC.md` and `docs/DATABASE.md`
- Tests or completion claims: `docs/TESTING.md` and `docs/ACCEPTANCE.md`
- Requirement coverage: `docs/TRACEABILITY.md`

For multi-step work, follow `.agent/PLANS.md` and update the active plan under `.agent/exec-plans/active/`.

## Non-negotiable invariants

- PostgreSQL grants and RLS are the authorization boundary. Hidden UI controls are not authorization.
- Normal user reads and writes use an authenticated, cookie-bound Supabase server client.
- Privileged Supabase credentials are server-only and limited to seed, sync, cleanup, and controlled verification.
- A user reads only companies and requests for companies they belong to.
- Only a company `admin` creates requests or changes request status.
- A `viewer` must be rejected by PostgreSQL when attempting writes.
- Authenticated users cannot manage memberships, delete requests, or access invoices.
- Invoice identity is `(source, external_id)`.
- Existing invoice business data changes only when incoming `updated_at` is strictly newer.
- Duplicate versions in one source payload are reduced before persistence; payload order is not authority.
- Equal timestamp with conflicting business data is an error.
- Assessment company matching is normalized exact-name matching. Never fuzzy-match, guess, or auto-create a company.
- Invalid, conflicting, unmatched, or ambiguous invoice input must not cause partial invoice writes.
- Secrets, passwords, tokens, connection strings, and privileged keys must not be committed or logged.

## Working method

For each bounded task:

1. Read only the relevant source-of-truth documents plus the active ExecPlan.
2. Inspect existing code, migrations, tests, and configuration before editing.
3. State the intended files, approach, assumptions, and security/data risks.
4. Implement the smallest complete change within the task scope.
5. Run the relevant checks from `docs/TESTING.md` and `docs/ACCEPTANCE.md`.
6. Review the diff for requirement drift, unsafe privileges, secret exposure, stale-sync risk, and unnecessary complexity.
7. Update the active ExecPlan, `NOTES.md`, and sanitized evidence with actual results.
8. Report changed files, commands run, outcomes, and unresolved risks.

## Decision boundary

You may choose local names and small implementation details only when they preserve the documented contracts.

Do not silently change:

- authentication or authorization semantics;
- RLS helpers, access matrix, grants, or allowed request columns;
- invoice identity, recency, atomicity, or company-resolution behavior;
- privileged-client boundaries;
- destructive migration behavior;
- required routes, scripts, tests, or evidence;
- dependencies that materially alter the architecture or time box.

For a missing or conflicting security, financial-data, destructive, or scope decision, add a `Proposed` entry to `docs/DECISIONS.md` and stop that part until a human resolves it.

## Scope control

Do not add signup, company/member administration, request deletion, invoice UI, cron, queues, fuzzy matching, automatic ERP company creation, a global state library, or design-system work before all required acceptance checks pass.

## Validation contract

Never claim a check passed without running it. The finished repository must provide and pass:

- `npm run lint`
- `npm run typecheck`
- `npm test`
- `npm run build`
- `npm run verify:rls`
- `npm run verify:sync`
- `npm run check:secrets`
- `git diff --check`

## Final response format

Finish implementation work with:

- Summary
- Files changed
- Verification commands and actual outcomes
- Security and data-integrity review
- Evidence updated
- Known limitations or unresolved decisions
