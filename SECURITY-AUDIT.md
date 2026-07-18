# Security Audit — Person A platform layer

**Date:** 2026-07-18 · **Scope:** all code on `main` (A1–A5: auth, GitHub client, sync engine, activity/metrics/standups APIs, Prisma schema) · **Method:** manual line-by-line review against SPEC §15 (security & privacy) plus OWASP API-security categories; every fixable finding landed with a failing test first (`tests/security.test.ts`).

## Findings

| # | Severity | Finding | Status |
|---|----------|---------|--------|
| F1 | Medium | **GitHub API path injection.** `owner`/`name` accepted by `POST /api/repos/selection` were client-controlled and interpolated raw into GitHub API paths during sync (`/repos/{owner}/{name}/...`), letting a crafted value like `acme/other-repo` or `..` redirect sync reads to unintended endpoints. | **Fixed** — strict `^[A-Za-z0-9_.-]+$` validation (dot-only segments rejected) at the API boundary, plus `encodeURIComponent` on every path segment in `src/lib/github.ts` as defense in depth. Regression-tested. |
| F2 | Low | **Unbounded standup edits.** `PATCH /api/standups/:id` accepted unlimited `contentMd` and arbitrary `contentJson` (`z.unknown()`), allowing multi-MB blobs into Postgres. | **Fixed** — `contentMd` capped at 200k chars; `contentJson` validated against a bounded `StandupContent` zod schema. Regression-tested. |
| F3 | Info | **CSRF posture.** State-changing routes (`/api/sync`, selection, standups) rely on Auth.js session cookies, which default to `SameSite=Lax` — cross-site POSTs are blocked by modern browsers. Acceptable for MVP; revisit if cookie settings change. | Accepted (documented) |
| F4 | Info | **Markdown/content injection via GitHub titles.** PR/commit titles flow into generated markdown. Data at rest is inert; the risk is at render time. Person B's UI must render standup markdown as text/sanitized markdown, never `dangerouslySetInnerHTML`. | Handed to Person B (B5) |
| F5 | Info | **Token handling.** OAuth tokens are AES-256-GCM encrypted at rest with a random 96-bit IV and auth tag (`src/lib/crypto.ts`); key comes from `TOKEN_ENCRYPTION_KEY` (32-byte, base64, length-checked). Tokens never enter the JWT, responses, or logs; decryption happens only inside `getGitHubToken` at call time. | Verified by tests |

## Verified-safe checklist

- **AuthN/AuthZ:** every non-auth route checks the session; standup fetch/edit is ownership-scoped (404 for non-owners — no existence oracle); activity/metrics/repos queries are filtered by `userId` server-side (no IDOR).
- **Input validation:** all mutating routes parse bodies with zod `safeParse` and return 400 on failure; malformed JSON is caught (`.catch(() => null)`).
- **SPEC §15 privacy:** sync stores only metadata (title, stats, URL, timestamps) — never diffs or file contents; enforced by the acceptance test that whitelists normalized-event fields.
- **Injection:** no raw SQL (Prisma parameterized), no `eval`/`exec`, no template rendering of user input server-side.
- **Secrets:** `.env` is gitignored; `.env.example` contains placeholders only; test key in `vitest.config.ts` is test-only and documented as such.
- **OAuth scopes:** minimum viable per SPEC §13 (`read:user user:email repo`); no write scopes.
- **Grounding (SPEC §4/§10):** `validateGrounding` strips uncited bullets, so generated output cannot claim work without a matching stored event.

## Deferred (out of MVP scope, revisit before production)

1. Rate limiting on `/api/sync` and `/api/standups/generate` (cost/abuse control).
2. Token refresh/rotation and revocation on disconnect ("clear delete-data path" from SPEC §15 is a Phase-2+ item).
3. ManagerInvite tokens (Phase 2): must be cryptographically random (`crypto.randomBytes`), with expiry + revocation checks on every portal request.
4. Audit logging for manager-portal access.

## Test evidence

`npm test` — 90 tests, all offline-deterministic (mocked Prisma/GitHub, pinned clocks, no randomness in assertions):
- `tests/security.test.ts` — F1/F2 regression suite (red-then-green in git history: `test(audit)` → `fix(audit)`).
- `tests/spec-acceptance.test.ts` — SPEC invariants on a pinned synthetic summer dataset (§7.3 canonical types, §12 exact metric counts, §15 metadata-only storage + token encryption, §7.4 ranges, §10 grounding, §20 deterministic template fallback).
