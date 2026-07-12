# First-time setup

Use these steps for a new empty GitHub repository on Windows PowerShell.

## 1. Clone and enter the repository

```powershell
git clone YOUR_REPOSITORY_URL
cd YOUR_REPOSITORY_NAME
```

## 2. Scaffold Next.js before copying the harness

Run from the empty repository root:

```powershell
npx create-next-app@latest . --ts --eslint --tailwind --app --src-dir --use-npm --import-alias "@/*" --empty --no-agents-md --disable-git
```

This prevents `create-next-app` from generating a competing `AGENTS.md`.

Confirm the scaffold:

```powershell
npm run dev
```

Open `http://localhost:3000`, then stop the server with `Ctrl+C`.

Commit the clean scaffold:

```powershell
git add .
git commit -m "chore: scaffold Next.js application"
```

## 3. Copy the harness into the same repository root

Copy the **contents** of this harness directory, including hidden `.agent`, beside `package.json` and `src/`.

Correct:

```text
repository/
  AGENTS.md
  package.json
  src/
  docs/
  tasks/
  .agent/
```

Incorrect:

```text
repository/
  package.json
  src/
  easypass-codex-harness-v3/
    AGENTS.md
```

Verify hidden files:

```powershell
Get-ChildItem -Force
```

Commit the harness:

```powershell
git add .
git commit -m "chore: add EasyPass Codex harness"
```

## 4. Start Codex from the repository root

The terminal directory must contain `AGENTS.md` and `package.json`.

First prompt:

```text
List the project instruction and source-of-truth files you loaded. Summarize the mission, security invariants, sync invariants, decision boundary, execution phases, and required validation. Do not modify files.
```

Confirm that Codex identifies the root `AGENTS.md` and the detailed contracts it references.

## 5. Begin the gated implementation

Run:

```text
Execute tasks/00-inspect-and-plan.md. Do not implement product behavior. Update the active ExecPlan using the actual repository state and report blockers or proposed decisions.
```

Review the plan before running Task 01.

## 6. Environment files

Never commit `.env.local`.

The implementation must generate `.env.example` with placeholders for:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SEED_ADMIN_PASSWORD=
SEED_VIEWER_PASSWORD=
```

The seed passwords are disposable assessment credentials, not real personal passwords. Do not deploy them to a long-lived production project.
