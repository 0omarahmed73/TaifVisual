# Launch manual-review checklist

Manual items that cannot be verified by the automated task list. Nothing here
is claimed done unless it was actually performed.

- [x] **Genuine screenshots added** — DONE: eight genuine captures were
  provided by the project owner on **2026-10-23**, live in
  `taif/public/screenshots/` and wired into the showcase manifest
  `taif/src/content/screenshots.ts` (platform, screen, intrinsic width/height,
  localized alt text and `capturedFrom: "2.0.1"` recorded per capture).
- [ ] **Arabic copy reviewed by the owner** — PENDING: the Arabic strings in
  `taif/src/content/ar.ts` were written and are parity-checked by tests, but a
  fluent human review before launch has not yet happened.
- [ ] **`SITE_URL` set to the production domain** — PENDING: all builds so far
  were rehearsals with `SITE_URL=https://example.invalid`; the real domain must
  be set by the owner at deploy time.
- [ ] **Lighthouse run manually on both locales, results noted** — PENDING:
  automated accessibility/axe checks ran and passed (see
  `taif/tests/e2e/a11y.spec.ts`), but a recorded Lighthouse run for `/` and
  `/ar` (performance + audit scores) has not been done.
- [ ] **Link audit against the live Releases page** — PENDING: download links
  are validated against mocked GitHub fixtures in tests; a manual audit against
  the live `https://github.com/0omarahmed73/TaifVisual/releases` data (including
  asset names/sizes once a real release is published) has not been performed.
- [ ] **Vercel project configured by the owner** — PENDING (config and
  documented steps exist in `taif/vercel.json` and `taif/README.md`; no deploy
  has been performed by this task list and none will be).

**Visible-browser review note**: real-Chromium full-page renders of `/` and
`/ar` at 375/768/1280 (light + dark) were produced and inspected as rendered
HTML (see `checklists/visual/`), but a human design review of the PNGs is still
pending alongside this checklist.

## Verification record (2026-10-24, actually run)

| Check | Command | Result |
|-------|---------|--------|
| Lint | `npm run lint` | clean |
| Types | `npm run typecheck` | clean |
| Unit | `npm test` | 10 files, 90 tests passed |
| Build | `SITE_URL=https://example.invalid npm run build` | succeeded; e2e fixture routes removed from `dist/` |
| Budget | `npm run verify:budget` | OK (HTML <= 100 KB, JS 215 KB, CSS 43 KB) |
| CSP | `npm run verify:csp` | PASS under the literal `vercel.json` headers |
| e2e | `npx playwright test` (4 viewports, mocked GitHub) | 243 passed, 65 skipped (project-specific), 0 failed |

Not verified: Lighthouse scores, live GitHub link audit (this machine's IP was
at GitHub's 60 requests/hour unauthenticated limit during testing), a deployed
build on the production domain, Arabic copy review by a fluent reader.
