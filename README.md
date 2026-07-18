# ShipLog

*Your commits already tell the story. We write the review.*

ShipLog turns real GitHub activity into standup docs, review-ready summaries, and resume metrics — with receipts. See [SPEC.md](./SPEC.md) for the full product spec and [TASK.md](./TASK.md) for the MVP build plan.

**Status:** Person A's platform/data layer (auth, sync, metrics, standups APIs) is implemented and fully unit-tested. Person B's UI (landing, dashboard, generator UI, demo mode) is up next.

## Stack

Next.js 15 (App Router) · TypeScript · Tailwind v4 · Prisma + PostgreSQL · NextAuth v5 (GitHub OAuth) · Vitest · ESLint

## Setup

1. **Install** (Node 20+):

   ```bash
   npm install
   ```

2. **Environment** — copy `.env.example` to `.env` and fill in:

   | Var | What |
   |-----|------|
   | `DATABASE_URL` | PostgreSQL connection string (Neon/Supabase/local) |
   | `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | GitHub OAuth app (callback: `http://localhost:3000/api/auth/callback/github`) |
   | `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
   | `TOKEN_ENCRYPTION_KEY` | `openssl rand -base64 32` — encrypts OAuth tokens at rest |
   | `AI_API_KEY` | Optional; standups fall back to a template generator without it |

3. **Database**:

   ```bash
   npx prisma migrate dev
   ```

4. **Run**:

   ```bash
   npm run dev
   ```

## Tests & quality gates

The whole suite runs offline — no database, GitHub app, or network needed (Prisma and the GitHub client are injected/mocked):

```bash
npm test           # vitest (70 tests across A1–A5)
npm run lint       # eslint
npm run typecheck  # tsc --noEmit
```

The git history is test-first: each `test(aN): …` commit lands failing specs, and the following `feat(aN): …` commit makes them pass.

## API surface (Person A)

| Route | Purpose |
|-------|---------|
| `GET/POST /api/auth/[...nextauth]` | GitHub OAuth (scopes: `read:user user:email repo`) |
| `PATCH /api/user` | Set internship start/end dates |
| `GET /api/repos` | List accessible repos merged with saved selections |
| `POST /api/repos/selection` | Choose which repos ShipLog may read |
| `POST /api/sync` | Incremental sync of commits/PRs/reviews into ActivityEvents |
| `GET /api/activity?start=&end=` | Range-filtered events |
| `GET /api/metrics?start=&end=` | SPEC §12 metrics (PRs, reviews, commits, active repos, consistency) |
| `POST /api/standups/generate` | Generate + persist a grounded standup (every bullet cites events) |
| `GET /api/standups`, `GET/PATCH /api/standups/:id` | History, fetch, user edits |

## Demo mode

Planned as Person B's task B2 (`/demo`, seeded data, no OAuth) — not yet implemented.
