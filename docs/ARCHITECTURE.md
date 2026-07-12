# System architecture

## Architectural objective

Use one Next.js App Router application and one Supabase project. Keep normal user operations inside an authenticated RLS boundary and keep trusted import operations inside a separate server-only boundary.

## System diagram

```text
Untrusted browser
  |
  | HTTPS forms/navigation
  v
Next.js App Router
  |
  |-- Auth Server Actions
  |-- Protected Server Components
  |-- Request Server Actions
  |-- Mock ERP Route Handler
  |-- Trusted CLI scripts
  |
  +--> Authenticated cookie-bound Supabase client
  |      -> PostgREST/PostgreSQL grants
  |      -> Row Level Security
  |      -> companies / company_members / service_requests
  |
  +--> Server-only privileged Supabase client
         -> seed users and test data
         -> invoke invoice sync database function
         -> controlled verification cleanup
         -> invoices
```

## Trust boundaries

### Browser

Untrusted. URL parameters, form values, hidden controls, and client state may be manipulated. No browser behavior is accepted as proof of authorization.

### Next.js authenticated server path

Used for normal user pages and mutations. It reads the Supabase session from cookies and sends the user's JWT to Supabase. PostgreSQL decides row access through grants and RLS.

### Next.js Proxy

Refreshes/propagates Supabase auth cookies. It is not the sole authorization layer. Protected layouts and Server Actions verify identity with `auth.getClaims()`.

### Privileged server path

Used only by scripts and explicitly trusted modules. The service-role key bypasses normal RLS and therefore must never power company/request pages or user actions.

### External ERP boundary

The payload is untrusted external data even though this assessment uses a local fixture. Runtime validation and deterministic conflict handling are mandatory.

## Harness and runtime entry points

### Agent entry point

`AGENTS.md`

### Planning state

`.agent/exec-plans/active/001-easypass-take-home.md`

### Human task entry points

`tasks/00` through `tasks/05`

### Web entry points

- `/login`
- `/companies`
- `/companies/[companyId]`
- `GET /api/mock-erp/invoices`

### Command entry points

- `npm run seed`
- `npm run sync:invoices`
- `npm run verify:rls`
- `npm run verify:sync`
- `npm run verify`

### Database entry points

- versioned migrations under `supabase/migrations/`;
- private membership helpers used only by RLS;
- `public.sync_invoices(jsonb)` callable only by the trusted role.

## Component responsibilities

### App Router

- Server Components load user-visible data.
- Server Actions perform sign-in, sign-out, request creation, and status update.
- Route Handler exposes the canonical mock payload only.
- No normal browser request invokes the privileged invoice sync.

### Feature modules

- Companies: authenticated membership/company reads.
- Service requests: schemas, reads, create/update actions.
- ERP: source adapter and external payload types.
- Invoices: validation, batch reduction, sync orchestration, and result types.

### Database

- Constraints protect valid states.
- Grants restrict operations and mutable columns.
- RLS restricts rows.
- A database function atomically matches companies and conditionally inserts/updates invoices.

## Required data flow principles

- Apply explicit query filters for performance and clarity, while retaining RLS as security.
- Server Actions re-check identity and validate input on every invocation.
- Unauthorized company IDs return no protected data; avoid existence leaks.
- External input is parsed at runtime before persistence.
- Financial/source version ordering is enforced in PostgreSQL, not only TypeScript.
- Failure before the sync database call produces no writes; failure inside the function rolls back the function transaction.

## Deployment position

A hosted Supabase project is acceptable for submission. SQL migrations remain the source of truth. A Vercel deployment is optional and must not delay core verification.

## Production evolution, not assessment scope

A real financial integration would add external company IDs and mappings, scheduled jobs/webhooks, queue/retry/dead-letter behavior, sync-run audit tables, reconciliation UI, metrics, alerting, and explicit cancellation/reversal semantics.
