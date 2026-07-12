# Invoice synchronization contract

## Purpose

Import an overlapping, changing external ERP snapshot into the local `invoices` table while preserving one correct row per external invoice.

## Required entry points

- Canonical source fixture: `fixtures/mock-erp-invoices.json`.
- Read-only demonstration route: `GET /api/mock-erp/invoices`.
- Trusted import command: `npm run sync:invoices`.
- Shared implementation: `src/features/invoices/sync-service.ts`.

The script and mock route reuse the same source adapter/fixture. The sync script should not make a fragile HTTP call back into its own Next.js server.

## Runtime source schema

Envelope:

- `source`: trimmed, non-empty string;
- `invoices`: array.

Invoice:

- `external_id`: trimmed, non-empty string;
- `company_name`: trimmed, non-empty string;
- `amount_aed`: finite, non-negative, at most two decimal places;
- `status`: `paid | unpaid`;
- `updated_at`: valid ISO timestamp with a resolvable instant.

Reject the entire payload on validation failure. TypeScript compile-time types are not runtime validation.

## Identity and version

```text
identity = (source, external_id)
version  = updated_at
```

The internal UUID is stable local identity. The source key recognizes future versions.

## Incoming reduction algorithm

Use a map keyed by `(source, external_id)`.

For each record:

1. No retained record: retain it.
2. Newer timestamp: replace retained record.
3. Older timestamp: ignore it.
4. Equal timestamp and identical company/amount/status: exact duplicate; keep one.
5. Equal timestamp and different company/amount/status: fail with `CONFLICTING_SOURCE_VERSIONS`.

Do not use array order as the tie-breaker.

Expected supplied-payload reduction:

```text
received = 8
unique   = 6
```

Latest retained duplicates:

```text
INV-2026-002 -> paid, 820.50, 2026-06-15T09:00:00Z
INV-2026-005 -> unpaid, 1049.99, 2026-06-16T13:40:00Z
```

## Company resolution

The assessment source provides `company_name`, not a stable external company ID.

Required assessment behavior:

- preserve the exact original source name;
- database-match through `lower(btrim(company_name))` to the unique normalized company name;
- never fuzzy-match, guess, or auto-create;
- if any retained invoice cannot resolve exactly, raise `UNMATCHED_COMPANY` and commit no invoice changes.

In a production ERP, use a stable `external_company_id` and explicit mapping table. Name matching is a documented assessment compromise and the recommended escalation topic.

## Persistence state machine

| Existing local row | Retained incoming version | Database result |
|---|---|---|
| Missing | Valid | Insert one row |
| Exists | Incoming newer | Update the same local row |
| Exists | Same timestamp | No business-data or sync-timestamp mutation |
| Exists | Incoming older | Skip; preserve local row |
| Any | Invalid/conflicting/unmatched | Fail without partial writes |

The unique `(source, external_id)` constraint prevents duplicate local identities. PostgreSQL conditional `ON CONFLICT DO UPDATE ... WHERE` prevents stale rollback under concurrent attempts.

## Orchestration flow

```text
load fixture/source
  -> runtime parse
  -> reduce incoming duplicates
  -> call trusted RPC with retained rows
       -> verify unique input keys
       -> resolve every company
       -> abort on unresolved company
       -> conditional atomic upsert
       -> return result
  -> produce sanitized log/evidence
```

## Result contract

Return a typed result containing at least:

- `source`;
- `received`;
- `unique`;
- `affected` (inserted + newer updates);
- `unchangedOrStale`;
- `finalInvoiceCount`;
- `runId`.

Exact inserted-versus-updated counts are useful only if implemented without weakening correctness. Final persisted values and row counts are the authoritative proof.

## Required verification sequence

1. Reset assessment invoice rows with the privileged test path.
2. First sync: final count six; latest duplicate values correct.
3. Second identical sync: count remains six; affected zero; stored timestamps/business data unchanged.
4. Submit a stale source version: stored newer version remains.
5. Test equal timestamp with different business data: error and no writes.
6. Test unmatched company: error and no writes.
7. Optional concurrency check: two identical sync invocations still produce six correct rows.

## Logging

Log one structured sanitized event per run:

```json
{
  "event": "invoice_sync_completed",
  "runId": "...",
  "source": "mock-erp",
  "received": 8,
  "unique": 6,
  "affected": 6,
  "unchangedOrStale": 0,
  "finalInvoiceCount": 6,
  "durationMs": 0
}
```

Do not log credentials, JWTs, connection strings, or source data beyond what is necessary for assessment proof.
