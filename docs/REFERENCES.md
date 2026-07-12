# Primary reference guidance

Use current official primary documentation while implementing APIs that may have changed.

Relevant authorities:

- OpenAI Codex `AGENTS.md` guidance and Codex best practices.
- OpenAI ExecPlan and harness-engineering guidance.
- Current Next.js App Router, Server Actions, and `proxy.ts` documentation.
- Current Supabase Next.js SSR client guidance, Auth, RLS, API keys, and column privileges.
- Current PostgreSQL RLS, `INSERT ... ON CONFLICT`, functions, grants, and transaction behavior.

Rules:

- Prefer official documentation over tutorials.
- Record a reference in the active ExecPlan when it changes an implementation choice.
- Do not paste large external documentation into `AGENTS.md`.
- Repository contracts remain the system of record; update them when a verified API change requires it.
