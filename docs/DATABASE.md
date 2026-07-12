# Database and migration contract

## Migration ownership

Versioned files under `supabase/migrations/` are the database source of truth. Dashboard changes must be copied into migrations before completion.

Recommended order:

1. `001_extensions_types_tables.sql`
2. `002_functions_triggers_indexes.sql`
3. `003_grants_and_rls.sql`
4. `004_invoice_sync_function.sql`

Migrations must be repeatable from a fresh Supabase project and must not contain project secrets or real user credentials.

## Extensions and enums

Use `gen_random_uuid()` from the available Supabase/PostgreSQL setup.

```text
public.company_member_role = admin | viewer
public.service_request_status = submitted | in_progress | completed
public.invoice_status = paid | unpaid
```

## Table blueprint

### `public.companies`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `name` | `text` | required, trimmed length 1–200 |
| `created_at` | `timestamptz` | required, default `now()` |

Indexes/constraints:

- unique expression index on `lower(btrim(name))`;
- this deterministic uniqueness is an assessment-specific company-matching constraint.

### `public.company_members`

| Column | Type | Rules |
|---|---|---|
| `company_id` | `uuid` | FK `companies(id)`, `on delete cascade` |
| `user_id` | `uuid` | FK `auth.users(id)`, `on delete cascade` |
| `role` | `company_member_role` | required |
| `created_at` | `timestamptz` | required, default `now()` |

Key/indexes:

- primary key `(company_id, user_id)`;
- index `(user_id, company_id)`;
- optional role lookup index only if query plans justify it.

### `public.service_requests`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `company_id` | `uuid` | FK `companies(id)`, required, no user delete capability |
| `title` | `text` | trimmed length 1–200 |
| `status` | `service_request_status` | default `submitted` |
| `created_by` | `uuid` | FK `auth.users(id)`, required |
| `created_at` | `timestamptz` | required, default `now()` |
| `updated_at` | `timestamptz` | required, default `now()` |

Index:

- `(company_id, created_at desc)`.

Trigger:

- a `before update` trigger sets `updated_at = now()`;
- the trigger function is narrowly scoped and uses explicit schema references.

### `public.invoices`

| Column | Type | Rules |
|---|---|---|
| `id` | `uuid` | PK, default `gen_random_uuid()` |
| `source` | `text` | non-blank |
| `external_id` | `text` | non-blank |
| `company_id` | `uuid` | required FK `companies(id)` |
| `source_company_name` | `text` | required original ERP name |
| `amount_aed` | `numeric(14,2)` | required, `>= 0` |
| `status` | `invoice_status` | required |
| `source_updated_at` | `timestamptz` | required |
| `first_synced_at` | `timestamptz` | required, default `now()` |
| `last_synced_at` | `timestamptz` | required, default `now()` |
| `raw_payload` | `jsonb` | required latest retained source object |

Constraints/indexes:

- unique `(source, external_id)`;
- index `(company_id)`;
- index `(source, source_updated_at desc)`.

`last_synced_at` changes only when a row is inserted or a strictly newer version is applied. An identical/stale sync must not mutate it.

## Private RLS helpers

Create a non-exposed `private` schema.

### `private.is_company_member(p_company_id uuid)`

- returns whether `company_members` contains `(p_company_id, auth.uid())`;
- `language sql`, `stable`, `security definer`;
- `set search_path = ''`;
- fully qualify every object;
- revoke execute from `public`;
- grant schema usage and function execute only as needed by `authenticated`.

### `private.is_company_admin(p_company_id uuid)`

Same hardening, additionally requires role `admin`.

Do not implement a `company_members` RLS policy that recursively selects from the same RLS table.

## Grants

Explicitly revoke broad defaults from `anon` and `authenticated`, then grant the minimum:

### `anon`

No table access.

### `authenticated`

- `companies`: `select`;
- `company_members`: `select`;
- `service_requests`: `select`, `insert`;
- `service_requests`: `update(status)` only;
- no delete privileges;
- no invoice privileges.

Grant required enum/schema usage explicitly when needed.

### `service_role`

Trusted server operations only. Do not broaden user-facing grants because the service role already has privileged behavior.

## RLS policies

Enable RLS on all four public tables.

### Companies

`SELECT TO authenticated USING (private.is_company_member(id))`

No authenticated insert, update, or delete policy.

### Company members

`SELECT TO authenticated USING (user_id = auth.uid())`

No authenticated insert, update, or delete policy. A user cannot self-promote or add memberships.

### Service requests

Select:

```text
USING private.is_company_member(company_id)
```

Insert:

```text
WITH CHECK private.is_company_admin(company_id)
           AND created_by = auth.uid()
```

Update:

```text
USING     private.is_company_admin(company_id)
WITH CHECK private.is_company_admin(company_id)
```

Column-level grant limits the client to `status`. No delete policy.

### Invoices

RLS enabled, but no `anon` or `authenticated` grants/policies. Required synchronization uses the trusted server path.

## Invoice sync function

Create `public.sync_invoices(p_rows jsonb)` with these properties:

- callable through Supabase RPC by the trusted server client;
- revoke execute from `public`, `anon`, and `authenticated`;
- grant execute to the trusted role used by the server client;
- `security invoker` unless implementation evidence proves a definer is required;
- accepts one already runtime-validated and incoming-deduplicated JSON array;
- confirms there are no duplicate `(source, external_id)` keys in the input;
- resolves `source_company_name` using `lower(btrim(name))`;
- raises before writes when any company cannot be resolved;
- inserts new invoices;
- on `(source, external_id)` conflict, updates only where `excluded.source_updated_at > invoices.source_updated_at`;
- never replaces `first_synced_at`;
- sets `last_synced_at` only on actual insert/newer update;
- stores the retained object in `raw_payload`;
- returns structured counts including affected and final row count.

A single function invocation is the required database transaction boundary. A raised exception rolls back its writes.

Conceptual persistence clause:

```sql
on conflict (source, external_id)
do update set
  company_id = excluded.company_id,
  source_company_name = excluded.source_company_name,
  amount_aed = excluded.amount_aed,
  status = excluded.status,
  source_updated_at = excluded.source_updated_at,
  last_synced_at = now(),
  raw_payload = excluded.raw_payload
where excluded.source_updated_at > public.invoices.source_updated_at;
```

Do not send duplicate conflict keys in the same insert statement; PostgreSQL cannot deterministically update one target row twice in one command.

## Seed design

`scripts/seed.ts` uses the privileged client and fixed, clearly named assessment records.

Users:

- `admin@easypass.test`: admin of Falcon only.
- `viewer@easypass.test`: viewer of Falcon and admin of Oasis.

Companies:

- Falcon Trading LLC
- Oasis Foods FZE
- Marina Tech DMCC

Marina intentionally has no member and supports non-member isolation tests.

Seed passwords come from `SEED_ADMIN_PASSWORD` and `SEED_VIEWER_PASSWORD`.

The script must:

- create or locate users through `auth.admin`;
- mark test emails confirmed;
- use deterministic IDs or safe lookup/upsert logic;
- upsert companies, memberships, and sample requests;
- avoid multiplying data on repeated runs;
- print only sanitized identifiers/status, never passwords or tokens.
