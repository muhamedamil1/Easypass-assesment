# Security contract and threat model

## Security objective

A malicious authenticated user may alter URLs, submit forms directly, call Supabase with their JWT, or bypass UI controls. The database must still enforce the access matrix.

## Access matrix

| Resource / operation | Company admin | Company viewer | Non-member | Privileged sync/seed |
|---|---:|---:|---:|---:|
| Read member company | Allow | Allow | Deny | Controlled |
| Read own membership row | Allow | Allow | Deny | Controlled |
| Read company requests | Allow | Allow | Deny | Controlled |
| Create request | Allow | Deny | Deny | Not normal path |
| Update request status | Allow | Deny | Deny | Not normal path |
| Update request title/company/creator | Deny | Deny | Deny | Not required |
| Delete request | Deny | Deny | Deny | Not required |
| Create/update memberships | Deny | Deny | Deny | Seed only |
| Read/write invoices via user client | Deny | Deny | Deny | Allow |

## Authentication controls

- Use Supabase email/password authentication.
- Use cookie-based SSR clients from `@supabase/ssr`.
- Use `auth.getClaims()` for protected pages and Server Actions.
- Do not trust `getSession()` as authorization proof in server code.
- Proxy refresh is session plumbing, not row authorization.
- Login errors must not reveal whether an email exists.

## Authorization controls

- Every Server Action validates identity and input independently.
- Server-side role checks may select the UI state but do not replace RLS.
- RLS helper functions use `auth.uid()` and a restricted search path.
- Minimal grants prevent unauthorized operations before row policies are considered.
- Column-level update permission prevents changing immutable request fields.
- Inaccessible company/request IDs return no protected data and should not reveal existence.

## Privileged credential boundary

The service-role key bypasses normal RLS behavior.

Required protections:

- only in `.env.local`/deployment secrets;
- never `NEXT_PUBLIC_*`;
- parsed only by server environment module;
- `admin.ts` imports `server-only`;
- no import from Client Components or normal protected pages/actions;
- no inclusion in logs, error objects, evidence, screenshots, or README examples;
- no user-controlled arbitrary SQL/source URL passed to privileged operations.

## External input controls

Validate:

- login fields;
- route UUIDs;
- request title and status;
- complete ERP envelope and every invoice;
- source timestamps and decimal precision;
- duplicate/source-conflict rules.

Never infer company identity through fuzzy similarity.

## Error controls

User-facing errors are stable and generic. Server logs may include a generated correlation/run ID and sanitized technical context, but never secrets or auth tokens.

Expected application codes:

- `AUTH_REQUIRED`
- `INVALID_CREDENTIALS`
- `INVALID_INPUT`
- `RESOURCE_NOT_AVAILABLE`
- `REQUEST_WRITE_DENIED`
- `INVALID_ERP_PAYLOAD`
- `CONFLICTING_SOURCE_VERSIONS`
- `UNMATCHED_COMPANY`
- `INVOICE_SYNC_FAILED`

Do not make the UI dependent on raw PostgreSQL error strings.

## Required adversarial checks

- User A cannot list or fetch Oasis/Marina data.
- Viewer cannot insert a Falcon request directly.
- Viewer cannot update a Falcon request directly.
- Known company/request UUIDs do not bypass RLS.
- User cannot write `company_members` or promote their role.
- User cannot modify request `company_id`, title, creator, or timestamps.
- User cannot read invoices.
- Normal user paths do not import the privileged client.
- Browser bundles and tracked files contain no server secrets.
- Sync cannot write a partial batch after unmatched/conflicting input.
