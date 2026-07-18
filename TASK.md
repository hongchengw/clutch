# TASK.md — ShipLog MVP Build Plan

Source of truth: [SPEC.md](./SPEC.md). Scope is the **Phase 0 + Phase 1 MVP** (SPEC §17, §19, §21). Two workstreams, split so each person can build independently after the shared foundation (Task 0) lands, and integrate at the dashboard/standup boundary.

- **Person A — Platform & Data** (auth, GitHub sync, data model, API routes)
- **Person B — Product UI & AI** (landing, dashboard, standup generator, demo mode)

MVP is done when all items in **§Acceptance Criteria** at the bottom are checked off (mirrors SPEC §21).

---

## Task 0 — Shared foundation (both, do first, ~1–2 hrs)

1. Scaffold Next.js (App Router) + TypeScript + Tailwind app per SPEC §22 repo layout.
2. Set up Prisma + Postgres (Neon/Supabase) with the schema in SPEC §11: `User`, `Account`/`Session` (Auth.js), `RepoSelection`, `ActivityEvent`, `StandupDoc`, `ManagerInvite`, `ManagerNote`. (`ManagerInvite`/`ManagerNote` tables can be created now even though the manager portal itself is Phase 2 — no schema churn later.)
3. Agree on and commit `.env.example` (GitHub OAuth client id/secret, `DATABASE_URL`, `NEXTAUTH_SECRET`, AI API key var).
4. Push an initial commit so both people branch from the same base.

**Owner:** whoever is faster to set up; the other reviews. Do not proceed to Task A1/B1 until this merges.

---

## Person A — Platform & Data

### A1. GitHub OAuth (SPEC §7.1, §13)
- Wire up NextAuth (Auth.js) with the GitHub provider.
- Request scopes: `read:user`, `user:email`, `repo`.
- On first login, create/update `User` row (`githubId`, `githubUsername`, default `role: intern`).
- Encrypt OAuth access tokens at rest before storing (SPEC §15) — do not store plaintext tokens in the DB.
- Store `internshipStartDate` on the user (settings page will let Person B collect it; for MVP, default to "today" if unset, editable via API).

**Done when:** a user can click "Connect GitHub" and land back in the app authenticated, with a `User` row and encrypted token persisted.

### A2. Repo listing & selection (SPEC §7.2)
- `GET /api/repos` — list repos accessible to the authenticated user (personal + org, respecting granted scope).
- `POST /api/repos/selection` — persist which repos are `included` as `RepoSelection` rows.
- Support re-fetching this list without re-running OAuth.

**Done when:** authenticated user can retrieve their repo list and mark ≥1 repo as included, persisted in `RepoSelection`.

### A3. Activity sync engine (SPEC §7.3, §13)
- `POST /api/sync` — for each included `RepoSelection`, pull from GitHub:
  - Commits (author-matched via GitHub login or verified email; SPEC §13 authorship matching)
  - Pull requests (opened/merged/closed/draft, with additions/deletions/filesChanged)
  - Reviews (approved/changes-requested/commented)
- Normalize each into an `ActivityEvent` row with canonical `type` (SPEC §11), `occurredAt`, `url`, and summary fields — no full file contents or diffs stored (SPEC §15).
- Incremental sync: track `lastSyncedAt` per `RepoSelection`, only pull events since then on repeat syncs.
- Update `lastSyncedAt` after each successful sync; surface sync status/timestamp in the API response so the UI can show "Last synced."

**Done when:** hitting `/api/sync` for a connected user with ≥1 included repo populates `ActivityEvent` rows queryable by date range, and a second call only pulls new events.

### A4. Activity & metrics API (SPEC §7.5, §12)
- `GET /api/activity?start=&end=` — return `ActivityEvent`s in range for the current user, sorted by `occurredAt`.
- `GET /api/metrics?start=&end=` — compute and return: PRs opened, PRs merged, reviews given, commits, active repos (distinct repos with ≥1 event), consistency (% of working days with ≥1 event). Follow definitions in SPEC §12 exactly.
- These two endpoints are the contract Person B's dashboard and standup generator consume — keep response shapes stable and share the TypeScript types via a common `src/lib/types.ts`.

**Done when:** both endpoints return correct, range-filtered data for a seeded/synced user, matching SPEC §12 metric definitions.

### A5. Standup persistence API (SPEC §7.4, §11)
- `POST /api/standups/generate` — accepts range + tone + length + highlightMode; internally calls the AI/template generator (Person B builds the generation logic, but this route owns fetching the grounding events via A4's query, invoking the generator, and persisting the result).
- `PATCH /api/standups/:id` — update `contentMd`/`contentJson` on user edit.
- `GET /api/standups` and `GET /api/standups/:id` — list history / fetch one.
- Persist `eventIds[]` cited by the generated doc (for the "every claim links to a receipt" rule, SPEC §4/§10).

**Done when:** a standup can be generated, saved with its cited event ids, listed in history, edited, and re-fetched.

---

## Person B — Product UI & AI

### B1. Landing page (SPEC §7.10, §14, §18)
- Build `/` with the hackathon pitch: hero using the tagline/one-liner from SPEC §1, "Connect GitHub" CTA, and a "Try demo" CTA into `/demo`.
- Follow brand vibe from SPEC §14 — confident/witty, not generic SaaS.
- One job per section; must communicate the return-offer/hackathon value in a single viewport (SPEC §21 acceptance criterion 7).

**Done when:** landing page has working CTAs to OAuth login and to `/demo`.

### B2. Demo mode (SPEC §7.10, §19)
- Create seed data in `src/data/` — a realistic fake intern's `ActivityEvent`s, repos, and a summer date range, matching the `ActivityEvent` shape from SPEC §11.
- `/demo` route renders the full dashboard + standup generator against this seed data, with **no login required** and no calls to real GitHub.
- Clearly label as demo mode in the UI (e.g., persistent banner).

**Done when:** `/demo` shows a populated dashboard and can generate a standup end-to-end with zero OAuth/network dependency.

### B3. Settings — repo picker & date range (SPEC §7.2, §9)
- `/app/settings`: list repos from `GET /api/repos`, checkboxes to toggle inclusion, save via `POST /api/repos/selection`.
- Field to set/edit `internshipStartDate` (and optional end date).
- "Refresh now" button that calls `POST /api/sync` and shows last-synced timestamp.

**Done when:** a real (non-demo) user can select repos, set a start date, and trigger a sync from this page.

### B4. Contribution dashboard (SPEC §7.5)
- `/app` dashboard: hero stats (streak, PRs merged, reviews given, active repos) for a selectable range, sourced from `GET /api/metrics`.
- Activity timeline sourced from `GET /api/activity`.
- Top PRs list (simple heuristic: sort by `additions+deletions+filesChanged`, cap at top 5 — full "discussion" weighting is post-MVP).
- Resume metrics panel with copy-to-clipboard buttons, using the example phrasing style in SPEC §12.

**Done when:** dashboard renders correctly against both demo data (B2) and real synced data (A4), matching SPEC §21 acceptance criterion 6.

### B5. Standup generator + editor (SPEC §7.4)
- `/app/standups`: range picker (Yesterday / Last 7 days / Last 30 days / Custom / Full internship), tone (Casual/Professional/Resume bullets), length (Short/Standard/Detailed), highlight-mode toggle.
- Generation logic (`src/lib/ai/`): build a prompt grounded **only** in the `ActivityEvent`s for the selected range (from A4); require the model to cite `pr_url`/`commit_sha` per bullet; post-validate and strip any bullet lacking a matching event id (SPEC §10 grounding rules). Implement a **template-only fallback** that works with no AI API key configured (SPEC §20 default).
- Output sections: What I did / What's next / Blockers / Proof links, each bullet linking to its source event.
- `/app/standups/[id]`: rich-text-editable view; edits always win over AI (SPEC §10) — persist edits via `PATCH /api/standups/:id`.
- Markdown copy button; standup history list.

**Done when:** user can generate a standup for "yesterday" and for "full internship," every generated bullet links to a real PR/commit, edits persist, and Markdown copy works — matching SPEC §21 acceptance criteria 2–4.

### B6. Coaching cards (SPEC §7.8)
- Simple client-side or API-derived heuristics computed from A4's metrics: few reviews given, large average PR size, long activity gaps, many stale drafts, high commit-to-PR ratio.
- Render as friendly, non-scored cards on the dashboard (not a survey/score UI).

**Done when:** at least 3 of the 5 SPEC §7.8 heuristics are implemented and visibly rendered when triggered by seed/demo data.

---

## Integration checkpoints

- **After A3 + A4 land:** Person B swaps demo-only dashboard (B4) over to real API data behind a feature flag / env check.
- **After A5 lands:** Person B's generator (B5) calls the real persistence endpoints instead of local state.
- Agree on shared types in `src/lib/types.ts` (event shape, metrics shape, standup shape) **before** A4/B4 start in parallel — write this file together as part of Task 0 if time allows.

---

## Acceptance criteria (MVP done when — mirrors SPEC §21)

- [ ] New user can connect GitHub, select ≥1 repo, and see synced PRs/commits. *(A1, A2, A3, B3)*
- [ ] User can generate a standup for yesterday and for full internship range. *(A5, B5)*
- [ ] Generated content cites real PR/commit links from their data. *(A5, B5 grounding)*
- [ ] User can edit and copy Markdown. *(B5)*
- [ ] Demo mode shows the full story without login. *(B2)*
- [ ] Metrics panel shows PRs merged, reviews, commits, active repos. *(A4, B4)*
- [ ] Landing page communicates return-offer/hackathon value in one viewport. *(B1)*
- [ ] README explains setup (env vars, run locally, demo). *(shared — whoever finishes first drafts it, other reviews)*
