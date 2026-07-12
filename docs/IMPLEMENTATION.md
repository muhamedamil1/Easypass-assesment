# Application implementation contract

## Technology choices

Required:

- Current stable Next.js with App Router and `src/` directory.
- TypeScript strict mode.
- npm.
- `@supabase/supabase-js` and `@supabase/ssr`.
- `server-only` for privileged module import protection.
- Zod for runtime validation.
- Vitest for pure/unit tests.
- `tsx` for TypeScript scripts.
- `dotenv` or an equivalent explicit script environment loader.

Avoid adding a form framework, global-state library, ORM, query library, component system, or background-job framework.

## Target repository structure

Equivalent small variations are allowed only when responsibilities remain clear.

```text
src/
  app/
    page.tsx
    (auth)/
      login/
        page.tsx
        actions.ts
    (protected)/
      layout.tsx
      companies/
        page.tsx
        [companyId]/
          page.tsx
          actions.ts
    api/
      mock-erp/
        invoices/
          route.ts

  components/
    auth/
      login-form.tsx
      sign-out-button.tsx
    companies/
      company-list.tsx
    service-requests/
      request-list.tsx
      create-request-form.tsx
      request-status-form.tsx

  features/
    companies/
      queries.ts
      types.ts
    service-requests/
      queries.ts
      mutations.ts
      schemas.ts
      types.ts
    erp/
      invoice-source.ts
      mock-erp-source.ts
      types.ts
    invoices/
      schemas.ts
      deduplicate.ts
      sync-service.ts
      types.ts

  lib/
    auth/
      require-user.ts
    env/
      public.ts
      server.ts
    errors/
      app-error.ts
    logging/
      logger.ts
    supabase/
      server.ts
      proxy.ts
      admin.ts
      client.ts        # create only if a Client Component actually needs Supabase

proxy.ts
fixtures/
  mock-erp-invoices.json
supabase/
  migrations/
    001_extensions_types_tables.sql
    002_functions_triggers_indexes.sql
    003_grants_and_rls.sql
    004_invoice_sync_function.sql
scripts/
  seed.ts
  sync-invoices.ts
  verify-rls.ts
  verify-sync.ts
  check-secrets.ts
tests/
  invoices/
    schemas.test.ts
    deduplicate.test.ts
    sync-service.test.ts
```

## Environment contract

`.env.example` must contain placeholders only:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SEED_ADMIN_PASSWORD=
SEED_VIEWER_PASSWORD=
```

Rules:

- Parse public and server variables separately.
- `SUPABASE_SERVICE_ROLE_KEY` and seed passwords are never imported by browser-reachable modules.
- `admin.ts` imports `server-only`.
- `.env.local` is ignored.
- Do not support many alias names unless the chosen Supabase project requires it; keep the reviewer setup unambiguous.

## Supabase clients

### Authenticated server client

`src/lib/supabase/server.ts`

- Uses `createServerClient` and Next.js cookies.
- Used by Server Components, Server Actions, and authenticated Route Handlers.
- Preserves the user's JWT so RLS applies.

### Proxy helper

`src/lib/supabase/proxy.ts` and root `proxy.ts`

- Refreshes tokens and copies refreshed cookies to request/response.
- Calls `auth.getClaims()`.
- Excludes static/image asset paths.

### Privileged client

`src/lib/supabase/admin.ts`

- Uses the service-role key.
- Disables persistence/auto-refresh.
- Used only in seed, sync, and controlled verification/cleanup.
- Never imported from `src/app/(protected)`, user actions, or presentation components.

### Browser client

Create only if needed by a real Client Component. The required app can be implemented with server-side clients and normal forms; unused client infrastructure should not be added.

## Auth implementation

### Login

- Server Action parses email/password.
- Calls `signInWithPassword` through the authenticated server client.
- Returns a generic error for failed credentials.
- Redirects successful login to `/companies`.

### Protected routes

- Protected layout calls `auth.getClaims()`.
- Missing/invalid claims redirect to `/login`.
- Do not use `getSession()` as the identity proof.

### Sign-out

- Server Action calls `auth.signOut()` and redirects to `/login`.

## Data access implementation

### Companies page

Query the current user's visible membership rows with company details. RLS remains authoritative. Show company name and role.

### Company page

1. Validate `companyId` as UUID.
2. Query the company with an explicit ID filter using the authenticated client.
3. Query the user's membership for that company.
4. Query requests with explicit `company_id` filter, ordered by `created_at desc`.
5. If the company/membership is not visible, call `notFound()` or render a generic unavailable state.

### Create request Server Action

Input:

- `companyId`: UUID;
- `title`: trimmed 1–200 characters.

Behavior:

- Verify identity with claims.
- Insert `company_id`, title, default `submitted`, and `created_by = user id` through the authenticated client.
- Do not use the privileged client or trust a submitted role.
- Convert expected RLS/validation failure into a safe action error.
- Revalidate `/companies/[companyId]` after success.

### Update status Server Action

Input:

- `companyId`: UUID;
- `requestId`: UUID;
- `status`: one allowed enum.

Behavior:

- Verify identity.
- Update only `status` with explicit request and company filters.
- PostgreSQL column grants and RLS enforce the mutation.
- Revalidate the company page after success.

## UI contract

- Plain, responsive, keyboard-usable forms.
- Visible validation/error messages.
- Disable pending submit controls to reduce duplicate submissions.
- Admin controls are rendered only when membership role is `admin`.
- Viewer state explains that access is read-only.
- No UI behavior is described as proof of security.

## Package scripts

The implemented `package.json` must provide:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "seed": "tsx scripts/seed.ts",
    "sync:invoices": "tsx scripts/sync-invoices.ts",
    "verify:rls": "tsx scripts/verify-rls.ts",
    "verify:sync": "tsx scripts/verify-sync.ts",
    "check:secrets": "tsx scripts/check-secrets.ts",
    "verify": "npm run lint && npm run typecheck && npm test && npm run build && npm run verify:rls && npm run verify:sync && npm run check:secrets"
  }
}
```

Adjust only for scaffolded ESLint command compatibility; preserve the named entry points.
