# Runtime workflows

## 1. Sign-in

```text
GET /login
  -> user submits email/password
  -> login Server Action parses input
  -> authenticated server Supabase client calls signInWithPassword
  -> failure: generic invalid-credentials state
  -> success: cookies are updated and user redirects to /companies
```

## 2. Session refresh and route protection

```text
request
  -> root proxy.ts calls Supabase proxy helper
  -> helper refreshes/verifies token with getClaims and copies cookies
  -> protected layout calls getClaims
  -> invalid/missing claims: redirect /login
  -> valid claims: render protected tree
```

Proxy/session checks do not replace RLS.

## 3. Company list

```text
GET /companies
  -> protected layout verifies identity
  -> Server Component uses authenticated client
  -> query visible company_members with company details
  -> company_members RLS returns only auth.uid() rows
  -> companies RLS confirms membership
  -> render name + role + link
```

## 4. Company request page

```text
GET /companies/:companyId
  -> validate UUID
  -> query company by explicit ID through authenticated client
  -> query current user's membership for same company
  -> query service_requests by explicit company ID, newest first
  -> RLS evaluates every table
  -> no accessible company/membership: notFound or generic unavailable
  -> render admin or viewer presentation
```

## 5. Create request

```text
admin submits companyId + title
  -> Server Action verifies claims
  -> Zod validates UUID and title 1..200
  -> authenticated client inserts company_id, title, submitted, created_by
  -> insert grant + RLS WITH CHECK verify admin and creator
  -> denied: safe write-denied state
  -> success: revalidate company path
```

The server does not accept a submitted role or status for creation.

## 6. Update request status

```text
admin submits companyId + requestId + allowed status
  -> Server Action verifies claims and parses input
  -> authenticated client updates only status with explicit IDs
  -> column grant prevents other fields
  -> SELECT/UPDATE RLS verifies admin membership
  -> success: updated_at trigger fires and page revalidates
```

## 7. Sign-out

```text
sign-out form
  -> Server Action calls auth.signOut
  -> redirect /login
```

## 8. Seed

```text
npm run seed
  -> load server env
  -> privileged client creates/locates two test users
  -> upsert three companies
  -> upsert memberships
  -> upsert fixed sample requests
  -> print sanitized summary
```

Repeated execution must not multiply records.

## 9. RLS verification

```text
npm run verify:rls
  -> ensure seed exists
  -> sign in separately as admin and viewer using publishable key
  -> run reads/writes through those user-scoped clients
  -> assert allowed operations succeed
  -> assert denied operations return error/zero rows
  -> optionally use privileged client only for cleanup
  -> write sanitized evidence
```

## 10. Mock ERP route

```text
GET /api/mock-erp/invoices
  -> mock adapter loads canonical JSON
  -> route returns unchanged envelope
```

No privileged database client is needed.

## 11. Invoice sync

```text
npm run sync:invoices
  -> load privileged server environment
  -> mock adapter loads canonical payload
  -> Zod validates payload
  -> pure reducer selects latest unique versions
  -> trusted RPC resolves companies and atomically persists
  -> script prints structured result
```

## 12. Failure flows

### Viewer write

Database rejects operation. UI state is secondary. No row is created/updated.

### Non-member URL

Authenticated query returns no protected rows; page does not disclose whether the UUID exists.

### Invalid ERP payload

Parser fails before RPC; zero invoice writes.

### Equal-time source conflict

Reducer fails before RPC; zero invoice writes.

### Unmatched company

RPC raises before persistence or transaction rolls back; zero partial writes.

### Stale invoice

Conditional upsert skips update and preserves newer local data.
