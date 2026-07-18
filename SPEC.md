# ShipLog — Intern Performance & Standup Tool

**Working name:** ShipLog  
**Tagline:** *Your commits already tell the story. We write the review.*  
**One-liner for hackathons:** The dream way to earn your return offer — auto standup docs, manager-ready contribution proof, and resume metrics from your GitHub/GitLab. No more scrambling at the end of summer.

---

## 1. Vision

Interns and early-career engineers are told to “keep a doc of what you did” for performance reviews and return-offer decisions. Most don’t — until the night before. Meanwhile managers want accurate proof of contribution, not vibes.

**ShipLog** connects to GitHub (and later GitLab), turns real contribution activity into daily/weekly/summer standup narratives, gives managers a clear contribution dashboard, and exports polished review + resume artifacts.

**Positioning:** Fan-favorite for hackathon attendees and interns — not another Jira clone. Fun, fast, slightly cocky, still grounded in real git data.

---

## 2. Problem

| Who | Pain |
|-----|------|
| Intern | Scrambles to remember what they shipped; standup feels awkward; review season is stressful; hard to quantify impact for resume |
| Manager | Hard to see what an intern actually did across repos; reviews take forever; reliance on memory/self-report |
| Both | Work is already in git — but nobody turns it into a story until it’s too late |

---

## 3. Goals

### Product goals
1. Auto-generate standup documents for selectable ranges: **yesterday**, **past week**, **past month**, **whole internship/summer**.
2. Give managers **read access to contribution summaries** (not raw credentials) with clear proof links (PRs, commits, issues).
3. Surface **metrics** useful for reviews and resumes (PRs merged, reviews given, repos touched, streak, impact highlights).
4. Help users **improve** with gentle coaching (gaps, review participation, PR size, consistency) — not just celebrate.
5. Make presentation **beautiful** — shareable review pages and exportable PDF/Markdown.

### Business / hackathon goals
- Be the tool people demo in 90 seconds and say “I need this for my internship.”
- Memorable brand + delight moments so it becomes a fan favorite.
- Clear path from demo → real OAuth → useful first standup in under 2 minutes.

### Non-goals (v1)
- Replacing company HRIS / formal performance systems (Workday, Lattice, etc.).
- Fabricating work that didn’t happen. Framing and highlighting are fine; inventing commits is not.
- Full project management (tickets, sprints, time tracking).
- Monitoring private org activity without explicit OAuth + repo access consent.
- Mobile-native apps (responsive web is enough for MVP).

---

## 4. Ethics & “polish, not fiction”

The pitch can be playful (“maybe polish a bit 😉”) but the product must stay honest:

- **Allowed:** Better titles, clearer impact language, grouping related commits, emphasizing merged PRs and reviews, soft-skill framing from real activity.
- **Not allowed:** Fake commits, inflated numbers, claiming others’ PRs, hiding authorship, or AI text that invents features never shipped.
- **UI copy:** Prefer “Make it review-ready” / “Highlight impact” over “lie.”
- **Transparency:** Every claim links back to a PR, commit, or issue. Managers always see the receipts.

---

## 5. Personas

### A. Intern / New grad — “Maya”
- Summer intern, 2–3 repos, wants a return offer.
- Hates writing standups; lives in GitHub.
- Needs: morning standup in 30 seconds; end-of-summer packet; resume bullets.

### B. Manager — “Chris”
- Manages 3–6 interns; reviews are painful.
- Needs: per-intern timeline, PR quality signals, what they owned vs rubber-stamped merges.
- Wants shareable links, not another login if possible (invite + view).

### C. Hackathon builder — “Jay”
- Building for fun / prize; wants a tool that looks demoable.
- Needs: fast OAuth, pretty dashboard, viral share card.

---

## 6. Core product pillars

1. **Ingest** — GitHub (MVP), GitLab (phase 2): commits, PRs, reviews, issues, comments.
2. **Narrate** — AI + templates → standup / weekly / summer story grounded in events.
3. **Prove** — Every bullet links to source activity.
4. **Share** — Manager view + export (Markdown, PDF, share link).
5. **Coach** — Metrics + “what to improve” suggestions.
6. **Delight** — Resume bullets, share cards, return-offer confidence meter (playful, data-backed).

---

## 7. Feature specification

### 7.1 Authentication & accounts
- Sign up / login via **GitHub OAuth** (primary).
- Optional email for manager invites.
- Roles: `intern` (default), `manager`, later `org_admin`.
- Session: secure cookies / JWT; store OAuth tokens encrypted at rest.

### 7.2 Repo & org connection
- After OAuth, list accessible repos (user + orgs with grant).
- User selects which repos to include in ShipLog (privacy control).
- Sync settings: auto-sync daily + manual “Refresh now.”
- Scope principle: **minimum scopes** needed (read user, read repos/PRs; no write to code).

### 7.3 Activity sync engine
Ingest and normalize:
- Commits (author match, message, files touched count, date)
- Pull requests (opened, merged, closed, draft, size: additions/deletions/files)
- Reviews (approved, changes requested, commented)
- Issues (opened, closed, commented) — optional toggle
- Optionally: discussion comments

Store as **ActivityEvents** with canonical types so GitLab can plug in later.

### 7.4 Standup generator
**Inputs**
- Time range: Today’s standup (yesterday), Last 7 days, Last 30 days, Custom, Full internship (start date → now)
- Tone: Casual standup / Professional review / Resume bullets
- Length: Short / Standard / Detailed
- “Highlight mode”: emphasize merged PRs & impact (still truthful)

**Outputs**
- Structured doc:
  - What I did
  - What I’m doing next (editable / optional AI suggestion from open PRs)
  - Blockers (user-editable; AI can suggest from failed CI / long-open PRs if detectable)
  - Proof links
- Formats: in-app view, Markdown copy, PDF export, share URL

**UX**
- One primary CTA: **Generate standup**
- Editable rich text before share/export
- History of past standups

### 7.5 Contribution dashboard (intern)
- Hero: streak, PRs merged, reviews given, repos active (range-aware)
- Timeline of activity
- Top PRs by impact (heuristic: files × discussion × merged)
- Language / area breakdown (from file paths / languages)
- “Resume metrics” panel with copy buttons

### 7.6 Manager access
- Intern generates **invite link** or invites manager by email
- Manager sees:
  - Selected intern’s summary for a date range
  - Contribution chart + PR list with links
  - Auto-generated performance brief (manager tone)
  - Notes field (private to manager)
- Permissions: manager sees only what intern opted to share (repos + date range)
- No requirement for manager to connect their own GitHub for v1 (view-only portal)

### 7.7 Performance review pack
One-click “End of internship pack”:
1. Executive summary (1 page)
2. Highlights (top contributions with links)
3. Metrics snapshot
4. Growth / coaching notes
5. Suggested talking points for the review meeting
6. Export PDF + share link

### 7.8 Coaching & improvement
Signals (MVP heuristics):
- Few code reviews → suggest reviewing teammates’ PRs
- Huge PRs → suggest smaller PRs
- Long gaps → consistency nudge
- Many draft PRs never merged → finish or close
- High commit / low PR ratio → encourage opening PRs earlier

Display as friendly cards, not scores that feel like surveillance.

### 7.9 Browser extension (phase 1.5 / stretch for hackathon wow)
**Chrome/Edge extension** that:
- Shows a ShipLog popup on GitHub: “Yesterday’s standup” quick view
- One-click copy standup
- Optional overlay badge on profile/contribution graph: “Open in ShipLog”

Web app is the source of truth; extension is a convenience layer.

### 7.10 Hackathon / viral delight
- **Return Offer Radar** — playful gauge from consistency + merged PRs + reviews (clearly labeled as fun, not official)
- **Share card** — OG image: “12 PRs merged · 34 reviews · Summer ’26”
- **Demo mode** — seeded fake-but-realistic data so judges don’t need OAuth
- Landing page pitch aimed at interns & hackathon crowd

---

## 8. User flows

### Flow A — Intern first run (< 2 min)
1. Land → “Connect GitHub”
2. OAuth → select repos
3. Set internship start date
4. Auto-sync → dashboard populated
5. Click **Generate standup (yesterday)** → edit → copy / share

### Flow B — Morning standup
1. Open app (or extension)
2. Range = Yesterday
3. Generate → skim → paste into Slack / say in standup

### Flow C — Manager review
1. Intern invites manager
2. Manager opens link, views summer brief
3. Clicks through to GitHub PRs for proof
4. Leaves note / exports PDF for HR conversation

### Flow D — End of summer
1. Intern picks Full internship range
2. Generate Review Pack + Resume bullets
3. Share with manager; paste bullets into resume/LinkedIn

---

## 9. Information architecture

### Public
- `/` Landing
- `/demo` Demo dashboard
- `/login`

### Authenticated (intern)
- `/app` Dashboard
- `/app/standups` List + generator
- `/app/standups/[id]`
- `/app/metrics`
- `/app/review-pack`
- `/app/settings` (repos, dates, tone defaults, invites)

### Manager
- `/m/[shareId]` Manager portal (tokenized)
- `/m/[shareId]/brief`

### API (high level)
- `POST /api/auth/github`
- `GET /api/repos`
- `POST /api/repos/selection`
- `POST /api/sync`
- `GET /api/activity`
- `POST /api/standups/generate`
- `PATCH /api/standups/:id`
- `POST /api/invites`
- `GET /api/manager/:token/summary`
- `POST /api/exports/pdf`

---

## 10. Technical architecture

### Recommended stack (hackathon-friendly, shippable)
| Layer | Choice | Why |
|-------|--------|-----|
| Frontend | Next.js (App Router) + TypeScript + Tailwind | Fast UI, API routes, easy deploy |
| Auth | NextAuth (Auth.js) + GitHub provider | Standard OAuth |
| DB | PostgreSQL (Neon/Supabase) + Prisma | Solid relational model |
| Jobs | Inngest or simple cron / queue | Repo sync |
| AI | OpenAI / Anthropic API | Standup + review narrative |
| Hosting | Vercel + managed Postgres | Demo in one click |
| PDF | `@react-pdf/renderer` or HTML→PDF service | Review pack |
| Extension | Plasmo or vanilla MV3 (later) | GitHub companion |

### System diagram (logical)

```
GitHub API ──► Sync Worker ──► Postgres (ActivityEvents)
                                    │
User ──► Next.js App ──► Generate API ──► LLM (grounded on events)
                                    │
                         Standups / Metrics / Share links
                                    │
                         Manager Portal (token auth)
```

### Grounding rules for LLM
- Prompt includes **only** structured events for the selected range.
- Model must cite `pr_url` / `commit_sha` for claims.
- Post-validate: strip any bullet that has no matching event id.
- User edits always win over AI.

---

## 11. Data model (MVP)

### User
- id, email, name, image
- githubId, githubUsername
- role
- internshipStartDate, internshipEndDate (nullable)
- createdAt

### Account / Session
- Standard Auth.js tables

### RepoSelection
- id, userId, provider (`github`|`gitlab`)
- owner, name, fullName, githubRepoId
- private, included (bool)
- lastSyncedAt

### ActivityEvent
- id, userId, repoId
- provider, externalId
- type: `commit` | `pr_opened` | `pr_merged` | `pr_closed` | `review` | `issue_opened` | `issue_closed` | `comment`
- title, body/summary
- url
- additions, deletions, filesChanged (nullable)
- occurredAt
- rawJson (jsonb, optional)

### StandupDoc
- id, userId
- rangeStart, rangeEnd
- tone, length
- contentMd, contentJson
- eventIds[] (cited)
- createdAt, updatedAt

### ManagerInvite
- id, userId
- token, email (optional)
- expiresAt, revokedAt
- permissions: repos scope / date floor

### ManagerNote
- id, inviteId, body, createdAt

### MetricSnapshot (optional cache)
- userId, rangeStart, rangeEnd
- prsMerged, prsOpened, reviews, commits, reposActive, additions, deletions
- computedAt

---

## 12. Metrics definitions

| Metric | Definition |
|--------|------------|
| PRs opened | PRs authored by user in range |
| PRs merged | Authored PRs merged in range |
| Reviews given | Submitted reviews on others’ PRs |
| Commits | Commits authored (match by author email/login) |
| Active repos | Distinct repos with ≥1 event |
| Impact score (internal) | Weighted: merged PRs + reviews + issue closures; shown as playful radar, explained on hover |
| Consistency | Days with ≥1 event / working days in range |

Resume export examples:
- “Merged 14 pull requests across 3 production repositories”
- “Completed 22 code reviews for teammates”
- Always optional and user-editable

---

## 13. GitHub integration details

### OAuth scopes (MVP)
- `read:user`
- `user:email`
- `repo` (needed for private intern repos; document clearly)  
  Alternative for public-only demo: `public_repo` — but real internships need private access.

### APIs used
- List repos
- List PRs / PR detail
- List commits (per repo, author filter)
- List reviews
- Optional: search issues

### Rate limits
- Cache aggressively; sync incremental by `updated_at` / ETag
- Background sync; UI shows “Last synced”

### Authorship matching
- Prefer GitHub user id on PR/review
- For commits: match author login or verified emails from GitHub

---

## 14. UI / UX direction

**Brand vibe:** Ambitious intern energy — confident, clean, a little witty. Not enterprise gray. Not generic purple AI sludge.

**Visual direction (high level)**
- Strong product name as hero signal on landing
- Full-bleed atmospheric hero (code / shipping / office-night energy — real imagery, not abstract blobs)
- One job per section on marketing page
- App UI: timeline + generator first; avoid dashboard card soup
- Motion: subtle entrance on hero, generate animation, share-card reveal

**Key screens to build**
1. Landing (hackathon pitch)
2. Dashboard
3. Standup generator + editor
4. Metrics / resume
5. Review pack
6. Manager portal
7. Settings

---

## 15. Security & privacy

- Encrypt OAuth tokens at rest
- Manager links are unguessable tokens; revoke anytime
- Interns choose included repos
- No training on private repo content for model providers if avoidable — send **summaries/metadata**, not full diffs, in MVP prompts
- Clear disconnect / delete data path
- Do not store full file contents — metadata + titles + stats only unless needed later

---

## 16. Success metrics

### Product
- Time-to-first-standup < 2 minutes after OAuth
- ≥ 50% of users generate a standup in first session
- Standup edit rate (shows usefulness) without full rewrites

### Hackathon demo
- Demo mode works offline of OAuth
- 90-second script lands the return-offer hook
- Judges can open manager portal from a share link

---

## 17. Build plan

### Phase 0 — Foundation (now)
- Repo setup, SPEC, README, env template
- Next.js app scaffold, design tokens, landing shell

### Phase 1 — MVP (core loop)
1. GitHub OAuth
2. Repo selection + sync (PRs, commits, reviews)
3. Dashboard metrics
4. Standup generation (AI + template fallback if no API key)
5. Edit / copy Markdown
6. Demo mode with seed data

### Phase 2 — Manager & review pack
1. Invite links
2. Manager portal
3. Review pack + PDF
4. Resume bullets export

### Phase 3 — Delight & extension
1. Return Offer Radar + share cards
2. Coaching cards
3. Browser extension popup
4. GitLab provider

### Phase 4 — Hardening
1. Incremental sync, rate-limit resilience
2. Org-level features
3. Better authorship edge cases
4. Tests + monitoring

---

## 18. Hackathon pitch (use this)

**Problem:** Interns scramble to prove their summer. Managers guess. Git already knows the truth.

**Solution:** ShipLog turns GitHub into standups, review packs, and resume metrics — with receipts.

**Why now:** Every intern has git history; almost none have a system that narrates it daily.

**Demo path:** Demo mode → generate summer standup → open manager link → show metrics → “return offer radar.”

**Ask:** We’re building the performance layer for early-career engineers.

---

## 19. MVP scope freeze (what we build first)

**In scope for first shippable product:**
- Next.js web app
- Landing page (intern/hackathon appeal)
- GitHub OAuth
- Repo pick + sync
- Activity dashboard
- Standup generator (yesterday / week / month / custom / internship-to-date)
- Markdown copy + save history
- Demo mode (no OAuth)
- Basic coaching cards
- Resume metrics panel

**Explicitly deferred after MVP:**
- GitLab
- Chrome extension
- PDF export (Markdown first)
- Real email invites (link-share first)
- Multi-intern manager org workspace

---

## 20. Open decisions (defaults chosen)

| Decision | Default | Alternative |
|----------|---------|-------------|
| Name | **ShipLog** | Contribly, OfferProof, StandupForge |
| Primary VCS | GitHub | GitLab phase 2 |
| AI | OpenAI-compatible API | Template-only offline mode as fallback |
| Manager auth | Magic share link | Full accounts later |
| Extension | After web MVP | Parallel if hackathon requires “extension” |
| Monorepo | Single Next.js app | Add `/extension` later |

---

## 21. Acceptance criteria (MVP done when)

1. New user can connect GitHub, select ≥1 repo, and see synced PRs/commits.
2. User can generate a standup for yesterday and for full internship range.
3. Generated content cites real PR/commit links from their data.
4. User can edit and copy Markdown.
5. Demo mode shows the full story without login.
6. Metrics panel shows PRs merged, reviews, commits, active repos.
7. Landing page communicates return-offer / hackathon value in one viewport composition.
8. README explains setup (env vars, run locally, demo).

---

## 22. Repo layout (planned)

```
/
├── SPEC.md                 # this document
├── README.md
├── package.json
├── prisma/
│   └── schema.prisma
├── src/
│   ├── app/                # Next.js routes
│   ├── components/
│   ├── lib/                # github, ai, metrics, auth
│   ├── data/               # demo seed
│   └── styles/
└── public/
```

---

## 23. Next step after this spec

Implement **Phase 0 + Phase 1 MVP**: scaffold the Next.js app, landing, auth, sync, dashboard, standup generator, and demo mode — matching this spec.
