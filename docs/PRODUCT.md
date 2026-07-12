# Product contract

## Objective

Build a miniature company service-request tracker that demonstrates the core EasyPass engineering problems:

- authenticated users;
- multi-company membership;
- database-enforced tenant isolation;
- `admin` versus `viewer` permissions;
- idempotent import of flaky, overlapping ERP invoice data.

## Actors and capabilities

### Company admin

- Signs in and signs out.
- Reads only companies where they have a membership.
- Reads requests belonging to those companies.
- Creates a request for an administered company.
- Changes a request status for an administered company.

### Company viewer

- Signs in and signs out.
- Reads member companies and their requests.
- Cannot create or update requests, even with a direct database/API call.

### Non-member

- Cannot discover or read the company through application data paths.
- Cannot read or write its requests even when a UUID is known.

### Sync operator

- Runs a trusted server-side command to import the canonical mock ERP payload.
- Does not access the sync through the normal authenticated-user client.

## Required UI

### `/login`

- Email and password fields.
- Sign-in action.
- Generic invalid-credentials error.

### `/companies`

- Protected route.
- Shows only member companies.
- Shows current membership role.
- Links to company request page.
- Sign-out action.

### `/companies/[companyId]`

- Protected route.
- Returns not-found/generic unavailable when RLS yields no accessible company.
- Shows company requests newest first.
- Admin: create-request form and status control.
- Viewer: read-only message and no mutation controls.

## Required statuses

Service request:

- `submitted`
- `in_progress`
- `completed`

Invoice:

- `paid`
- `unpaid`

No transition state machine is required; an admin may choose any allowed request status.

## Required mock ERP behavior

- Keep the supplied payload unchanged in `fixtures/mock-erp-invoices.json`.
- Expose it from `GET /api/mock-erp/invoices`.
- Provide `npm run sync:invoices` to import it.
- The eight input objects produce six final invoices.
- Repeating the same sync does not create rows or alter business data.
- A later source version updates the existing invoice.
- An older source version cannot roll an invoice backward.

## Required repository deliverables

- Next.js application.
- Supabase SQL migrations.
- Repeatable TypeScript seed script.
- Mock ERP fixture.
- Sync script and shared sync service.
- RLS and sync verification scripts.
- Unit tests for pure sync behavior.
- `.env.example`.
- `README.md` with fresh-clone setup.
- `NOTES.md` with actual AI use and proof.
- Real `AGENTS.md`/harness used during development.

## Explicit non-goals

Do not implement before all required checks pass:

- public signup;
- password reset;
- company creation or editing;
- membership administration;
- request editing or deletion;
- request comments, files, assignment, or history;
- invoice UI;
- cron, queue, webhook, retry worker, or dead-letter queue;
- fuzzy company matching or automatic ERP company creation;
- multiple ERP providers beyond a small source interface;
- elaborate styling, global state, or a design system.

## Success standard

Correct isolation and deterministic sync behavior are more important than feature count or visual polish. A verified, explainable partial implementation is preferable to unverified breadth.
