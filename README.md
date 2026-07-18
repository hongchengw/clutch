# ShipLog

Your commits already tell the story. We write the review.

Intern performance & standup tool — see [SPEC.md](./SPEC.md) and [TASK.md](./TASK.md).

## Quick start

```bash
npm install
cp .env.example .env
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

- Landing: `/`
- Demo (no OAuth): `/demo`
- App shell: `/app` (falls back to seed data until Person A’s APIs exist)

## Env vars

See [.env.example](./.env.example):

| Var | Who | Purpose |
|-----|-----|---------|
| `DATABASE_URL` | A | Postgres |
| `NEXTAUTH_*` / `GITHUB_*` | A | OAuth |
| `TOKEN_ENCRYPTION_KEY` | A | Encrypt GitHub tokens |
| `OPENAI_*` | B | Optional AI standups (template fallback if unset) |

## Work split

- **Person A** — auth, GitHub sync, API routes, Prisma wiring
- **Person B** — landing, demo, dashboard UI, standup generator (`src/lib/ai`), settings UI

Shared contracts live in `src/lib/types.ts`.
