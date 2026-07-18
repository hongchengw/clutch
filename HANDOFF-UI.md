# UI Handoff — next steps for Clutch

**State as of 2026-07-18:** Person B's UI is merged (PR #1): landing, `/demo` suite, authenticated `/app` shell (dashboard, standups, settings, invite), and the manager portal `/m/[token]`. Design system lives in `src/app/globals.css` (Manrope/Newsreader/IBM Plex Mono, pale-accent tags, panel/btn/field primitives). Person A's APIs are live and unit-tested (90 tests); the UI currently falls back to seed data when the API is empty or unauthenticated.

Priorities below are ordered: correctness/wiring first, then polish, then delight.

## 1. Wire real data end-to-end (highest priority)

- **`src/components/AppDashboard.tsx` uses `demoIntern.internshipStartDate` even for authenticated users.** There's no `GET /api/user` yet — add one (Person A side, trivial mirror of the existing `PATCH`) and fetch the real internship start date; only fall back to demo data when truly unauthenticated.
- **Standup edits are not persisted.** `StandupGenerator.tsx` saves generated docs to `localStorage` only. After a successful `generateStandupApi` call, wire the textarea's edits to `PATCH /api/standups/:id` (debounced or on-blur "Save" button). The API is ready, ownership-checked, and caps `contentMd` at 200k chars.
- **Standup history.** `GET /api/standups` exists; make `/app/standups` list real history (with the range/tone badges) instead of only the generator, and `/app/standups/[id]` load via `GET /api/standups/:id`.
- **Custom range defaults are hardcoded** (`2026-07-01` / `2026-07-18` in `StandupGenerator.tsx`). Derive from "today" and "7 days ago" instead.
- **Surface API errors distinctly.** `onGenerate` silently falls back to local generation on any failure; keep the fallback but distinguish "not signed in" from "server error" in the status line so real failures aren't invisible.

## 2. Markdown preview + safe rendering

- The editor is a raw `<textarea>`; add a preview pane (or toggle) rendering the markdown.
- **Security requirement from SECURITY-AUDIT.md F4:** GitHub PR/commit titles flow into this markdown. Render with a sanitizing renderer (e.g. `react-markdown`, no raw-HTML plugins). Never `dangerouslySetInnerHTML`.

## 3. Performance & robustness

- **Move Google-Fonts `@import` (globals.css line 1) to `next/font`.** Current setup blocks first paint, flashes fallback fonts, and breaks the "demo works offline" requirement (SPEC §16) when there's no network.
- Replace the plain "Loading dashboard…" text with skeleton panels matching the `panel` primitive, so the layout doesn't jump.
- Add an error boundary around `/app` so a failed fetch doesn't blank the screen.

## 4. Accessibility & motion

- Add `@media (prefers-reduced-motion: reduce)` overrides for `.ambient` drift and the `anim-rise*` entrances.
- Audit keyboard flow: proof-link cards and the copy button are fine; verify the range/tone selects have visible focus rings (`.field:focus` exists — confirm it applies to `<select>`).
- Check contrast of `--muted` (#787774) on the gradient canvas for small text; bump to ~#6b6a67 if it fails AA.

## 5. Landing polish (SPEC §14)

- SPEC calls for a "full-bleed atmospheric hero — real imagery, not abstract blobs"; the current hero is gradient blobs. Either source a real image (office-night/shipping energy) or consciously keep the editorial-gradient look — decide, don't drift.
- The `os-chrome` mock panel is `hidden lg:block`; give mobile a compact stat strip so small screens aren't text-only.

## 6. UI tests (match the repo's test-first culture)

- Add `@testing-library/react` + a jsdom vitest project (current config is `environment: "node"` — use a second `vitest.config` project or per-file `// @vitest-environment jsdom`).
- Highest-value specs: StandupGenerator (generate → editor populated → copy button enables; custom range shows date inputs; API failure falls back with status), AppDashboard (fallback banner shows only when unauthenticated), CoachingCards heuristics rendering.

## 7. Delight (Phase 3, only after the above)

- Return Offer Radar gauge (playful, labeled as fun — SPEC §7.10) on the dashboard.
- OG share card for `/m/[token]` ("12 PRs merged · 34 reviews · Summer '26").
- Generate-button micro-animation and share-card reveal (SPEC §14 motion list).

## Working agreements

- Shared types come from `src/lib/types.ts` — don't fork DTO shapes in components.
- Keep the demo suite (`/demo/*`) zero-network: seed data from `src/data/demo.ts` only.
- Quality gates before every commit: `npm test`, `npm run lint`, `npm run typecheck`. Conventional Commits (`feat(ui): …`, `test(ui): …`).
