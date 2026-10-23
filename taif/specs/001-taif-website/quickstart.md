# Quickstart: validating the TAIF website

Run from `taif/` unless stated. Nothing here deploys or touches production.

## Prerequisites
- Node.js ≥ 20, npm. Network access for the live-release smoke test (optional).
- Genuine screenshots in `public/screenshots/` + manifest entries (needed for launch, not for dev).
- `SITE_URL` set to the production domain for a production-mode build (unknown today; use a placeholder only for local rehearsal and never deploy it).

## Install and run
```bash
npm ci
npm run dev        # http://localhost:4321 (/ and /ar/)
```

## Verification commands
```bash
npm run lint
npm run typecheck
npm run build                 # SITE_URL=https://example.invalid only for a local rehearsal
npm run test                  # unit: mapping, validation, cache TTL, i18n parity
npm run test:e2e              # Playwright, GitHub mocked via fixtures
```

## Scenarios to confirm (map to spec)
1. `/` loads English LTR; `/ar/` loads Arabic RTL; switch keeps the section; preference redirects only `/` (US3, FR-025..028).
2. Download center for each fixture in `contracts/github-releases.md` outcome table (US1, FR-015..024, SC-002/003).
3. Hostile release notes (script tags, links) appear as text (SC-009).
4. Link audit: every download `href` equals a validated asset URL (SC-002).
5. Axe: no critical/serious; tab through header, menu, language switch, download buttons, FAQ (SC-007).
6. Screenshots at 375/768/1280 px × en/ar × light/dark; review mirroring and overflow (SC-004).
7. `prefers-reduced-motion` emulation disables animation (FR-037).
8. Empty screenshot manifest shows the labeled notice, never imagery (FR-005).
9. Optional live smoke: with network, the page shows what `curl https://api.github.com/repos/0omarahmed73/TaifVisual/releases` returns at that moment.
10. Boundary check from repo root: `git status` shows changes only under `taif/`; app `npm run build` result is unchanged (run only if you want confirmation, SC-010).

## Vercel (document-only; do not execute without approval)
Root Directory `taif/`, Framework Astro, build `npm run build`, output `dist`, env `SITE_URL`, Ignored Build Step `git diff --quiet HEAD^ HEAD -- .`. Domain/DNS handled by the owner.
