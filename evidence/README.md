# Verification evidence

Store sanitized actual outputs supporting `NOTES.md`.

Expected final files:

- `foundation-validation.txt`
- `rls-verification.txt`
- `sync-run-1.txt`
- `sync-run-2.txt`
- `sync-edge-cases.txt`
- `full-validation.txt`
- `secret-scan.txt`
- `manual-smoke.md`

Rules:

- Capture real output only.
- Remove passwords, JWTs, API keys, project connection strings, and personal data.
- Keep evidence concise and reviewer-readable.
- Regenerate affected evidence after the final code change.
- Executable scripts remain the source of proof; evidence is a review artifact.
