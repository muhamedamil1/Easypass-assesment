# Locked architecture decisions

Do not silently supersede these choices.

| ID | Status | Decision | Reason |
|---|---|---|---|
| D001 | Locked | Next.js App Router + TypeScript + Supabase. | Assessment requirement. |
| D002 | Locked | npm and a `src/`-based scaffold. | Reviewer simplicity and consistent entry points. |
| D003 | Locked | Email/password login; no public signup. | Reproducible seeded review flow. |
| D004 | Locked | `@supabase/ssr` cookie-based server client with Proxy token refresh. | Correct App Router SSR session model. |
| D005 | Locked | `auth.getClaims()` verifies identity in protected server paths. | Do not trust an unvalidated cookie session for authorization. |
| D006 | Locked | PostgreSQL grants + RLS are the authorization boundary. | App filtering alone is insufficient. |
| D007 | Locked | Private security-definer membership helpers avoid recursive RLS. | Clear, reusable policy evaluation. |
| D008 | Locked | User operations use the authenticated client; service role is limited to seed/sync/controlled cleanup. | Prevent accidental RLS bypass. |
| D009 | Locked | Authenticated users update only `service_requests.status`. | Requirement allows status changes, not arbitrary row editing. |
| D010 | Locked | Invoices are not exposed to authenticated users. | Invoice UI is optional and financial data should default closed. |
| D011 | Locked | Invoice identity is `(source, external_id)`. | Supports idempotency and multiple sources. |
| D012 | Locked | Invoice recency is `source_updated_at`; only strictly newer versions update. | Prevent stale rollback. |
| D013 | Locked | Incoming duplicate reduction happens before database insert. | PostgreSQL cannot update the same target row twice in one insert command. |
| D014 | Locked | Equal timestamp + different business data is a source conflict. | Array order is not a valid version signal. |
| D015 | Locked | Company matching is normalized exact-name matching with normalized uniqueness. | Payload lacks external company ID; deterministic assessment compromise. |
| D016 | Locked | Unmatched company fails the entire batch before/inside atomic persistence. | Do not guess or partially import financial data. |
| D017 | Locked | Core persistence uses one trusted PostgreSQL RPC/function and conditional upsert. | Transactional all-or-nothing behavior and concurrency-safe recency. |
| D018 | Locked | Required sync trigger is `npm run sync:invoices`; no public/internal sync HTTP route is required. | Smaller attack surface and fits 4–6 hour time box. |
| D019 | Locked | `GET /api/mock-erp/invoices` exposes only the fixed payload. | Satisfies mock source requirement without arbitrary URL input. |
| D020 | Locked | Seed users use environment-provided disposable passwords. | Avoid committing usable credentials. |
| D021 | Locked | Zod validates every external/form boundary. | TypeScript types do not validate runtime input. |
| D022 | Locked | Vitest + authenticated integration scripts + browser smoke. | Pure tests cannot prove RLS. |
| D023 | Locked | No ORM. Use Supabase client and SQL migrations directly. | Avoid unnecessary abstraction and dependency cost. |
| D024 | Locked | No sync-run table, queue, retry worker, or mapping UI in core scope. | Valuable in production but outside assessment time box. |

## Alternatives explicitly rejected for this task

- UI-only role enforcement.
- App-only `where user_id = ...` security.
- Plain unconditional upsert.
- `external_id` without source namespace.
- Company fuzzy matching.
- Auto-creating companies from invoices.
- Nullable unmatched invoice company relationship.
- Public or browser-triggered privileged sync.
- A single giant build prompt.
- Multiple artificial agent personas for every phase.

## Decision change protocol

For a missing decision affecting security, financial data, destructive migrations, or assessment scope:

1. Add a new entry with `Proposed` status.
2. Record context, options, recommendation, and verification impact.
3. Stop the affected implementation.
4. After human approval, mark it `Locked` and update all affected contracts/tasks.

Template:

```text
ID:
Status: Proposed | Locked | Superseded
Context:
Options:
Decision:
Reason:
Security/data impact:
Verification impact:
Supersedes:
```
