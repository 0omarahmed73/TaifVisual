# Implementation Plan: TAIF Official Website

**Branch**: `001-taif-website` | **Date**: 2026-10-23 | **Spec**: [spec.md](spec.md)

**Input**: Feature specification from `/specs/001-taif-website/spec.md`

## Summary

A static, bilingual (English `/`, Arabic `/ar/`) marketing site for TAIF, built as a self-contained
project in `taif/` of the existing `TaifVisual` repository. Pages are pre-rendered for speed and SEO.
Only the download center is interactive: it fetches GitHub Releases for `0omarahmed73/TaifVisual` in
the visitor's browser, validates the response, maps assets to platforms by file extension, and falls
back honestly (stale cache ≤ 7 days, then error state). All product facts live in one typed content
module verified against app source (see `research.md` §1). No app code is touched.

## Technical Context

**Language/Version**: TypeScript (strict), Node.js ≥ 20 LTS (dev machine: Node 24.15)

**Primary Dependencies**: Astro (static output, built-in i18n routing, sitemap integration), one React island for the download center, Tailwind CSS 3.4 (matches the app so brand tokens copy verbatim), `@fontsource/manrope` + `@fontsource/noto-sans-arabic` (same fonts as the app), `lucide` icons, `zod` for response validation. Exact versions are pinned at install and checked for mutual compatibility then (registry currently shows newer majors than the app uses; do not assume compatibility).

**Storage**: None server-side. Browser `localStorage` for language preference and the release cache (both optional; wrapped in try/catch).

**Testing**: Vitest (unit + fixture-driven integration of release handling), Playwright (+ `@axe-core/playwright`) for end-to-end, RTL/LTR, responsive screenshots and accessibility, with GitHub requests mocked at the network layer.

**Target Platform**: Modern evergreen browsers on phone/tablet/desktop; hosted on Vercel as static files.

**Project Type**: Static web site (single project, no backend).

**Performance Goals**: Main content visible < 3 s on mid-range phone/mobile network (SC-008); no layout shift from download center (reserved space); JS limited to the download center, language switch and menu.

**Constraints**: No secrets; no tracking; no server functions required; no changes outside `taif/`; production domain unknown (build must degrade, see research §7).

**Scale/Scope**: 1 page × 2 locales, ~10 sections, 4 current assets, ≤ ~6 screenshots.

## Constitution Check

*GATE: passed before Phase 0 and re-checked after Phase 1.*

| Principle | How the plan satisfies it | Status |
|-----------|---------------------------|--------|
| I Brand Integrity | Reuses `taif-mark.svg` unmodified and the app's color/typography tokens (research §2) | Pass |
| II Product Accuracy | Facts verified in source with file evidence (research §1); single content module; gating statements only as verified | Pass |
| III Bilingual Quality | Separate `/` and `/ar/` routes, `lang`/`dir` set per page, typed dictionaries with key-parity test, Noto Sans Arabic | Pass |
| IV Download Reliability | Live GitHub Releases only; no hard-coded versions/URLs; unmapped assets never offered | Pass |
| V Security First | zod validation, release notes rendered as escaped text, no secrets, CSP/security headers, minimal deps | Pass |
| VI Accessibility & Performance | Semantic HTML, keyboard menu/FAQ, axe checks, reduced-motion CSS, optimized images with dimensions | Pass |
| VII Maintainability | Centralized `config` + `content` modules, typed models, README setup | Pass |
| VIII Deployment Safety | Separate `package.json` in `taif/`, Vercel root dir `taif/`, ignored-build-step rule, nothing in app files changes | Pass |
| IX Evidence-Based Verification | Quickstart lists exact commands; reporting rules in tasks | Pass |
| X Scope Discipline | Static site; one island; no CMS, analytics, backend proxy or blog | Pass |

No violations; Complexity Tracking not needed.

## Project Structure

### Documentation (this feature)

```text
specs/001-taif-website/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
├── contracts/
│   ├── github-releases.md
│   ├── locale-routing.md
│   └── site-content.md
├── checklists/requirements.md
└── tasks.md            # created later by /speckit-tasks
```

### Source Code (repository root: `taif/`)

```text
taif/
├── package.json                 # website-only; NOT a workspace member of the app
├── astro.config.mjs             # i18n (en default, ar), sitemap, site from SITE_URL
├── tailwind.config.cjs          # tokens mapped from the app (copied, not imported)
├── tsconfig.json
├── vercel.json                  # security headers, cleanUrls; no rewrites to app
├── .env.example                 # SITE_URL, (optional) PUBLIC_GITHUB_REPO override documented
├── README.md                    # setup, content-update, deploy instructions
├── public/
│   ├── taif-mark.svg            # copy of app logo, unmodified
│   ├── favicon.svg, og-*.png    # derived from the mark; og images per locale
│   └── screenshots/             # genuine captures only (see dependency)
├── src/
│   ├── config/site.ts           # repo owner/name, developer links, license, asset rules
│   ├── content/                 # en.ts, ar.ts (typed Dictionary), operations.ts, faq
│   ├── lib/
│   │   ├── releases/            # fetch, validate (zod), select, map, cache, state
│   │   └── i18n.ts              # locale helpers, alternate URLs
│   ├── components/              # Header, Hero, Showcase, Features, HowItWorks,
│   │                            # DownloadCenter (React island), About, Developer,
│   │                            # Faq, Footer, LanguageSwitch
│   ├── layouts/Base.astro       # <html lang dir>, meta, canonical/hreflang, JSON-LD
│   ├── pages/index.astro        # English
│   ├── pages/ar/index.astro     # Arabic
│   └── styles/global.css        # fonts, tokens, reduced-motion
└── tests/
    ├── unit/                    # mapping, validation, cache TTL, i18n parity
    ├── fixtures/github/         # real-shaped release payloads incl. failures
    └── e2e/                     # Playwright: states, RTL, a11y, responsive
```

**Structure Decision**: single self-contained static project in `taif/`. The existing `.specify/`, `.claude/`, `specs/` folders stay beside it. The app's `tsconfig.json` only includes `src` and `LiteSpleeter.ts`, and its Tailwind `content` globs target `./src`, so a sibling `taif/` is not picked up by the app's build (verified in repo). The app's `.gitignore` already ignores `node_modules`/`dist`; the website adds its own ignores for `.vercel`, `test-results`.

## Key Decisions

1. **Boundary**: subfolder of `TaifVisual` (user-confirmed), with its own manifest and lockfile — functionally independent project, no shared code or imports with the app. Rationale and rejected options: research §3.
2. **Static + one island**: pre-render everything; only the download center runs in the browser. Rationale: best SEO/performance, no server or secrets. Rejected: SPA, SSR, serverless proxy (research §4).
3. **Release data in the browser, unauthenticated**: 60 requests/hour/IP is ample for a visitor-facing page when cached (10 min fresh TTL; 7-day stale limit per FR-020a).
4. **Locale routing**: `/` = en, `/ar/` = ar; saved preference may redirect `/` → `/ar/` client-side; no Accept-Language redirects (research §5).
5. **Own i18n dictionaries**, not the app's `locales/*.json`: the app's strings are UI-state oriented and include Portuguese; coupling would violate independence.
6. **Screenshots as a data-driven slot**: showcase renders only entries present in a manifest; with an empty manifest it shows a labeled "screenshots coming" state and no fake imagery (research §6).

## Unresolved Dependencies (explicit)

| Item | Needed for | Plan handling |
|------|------------|---------------|
| Production domain | canonical/hreflang/sitemap/OG URLs | `SITE_URL` env; production build fails fast if unset; previews omit absolute SEO tags |
| Vercel project + repo connection | deploy | documented steps only; nothing executed |
| Genuine TAIF screenshots (desktop + Android) | showcase (US2, FR-005) | manifest-driven; blocks launch, not development |
| Developer biography/contact approval | developer profile | none shown unless provided |
| OG preview images per locale | sharing | generated from brand mark; no app imagery implied |

## Verification Strategy (summary; details in quickstart.md)

- `npm run lint`, `npm run typecheck`, `npm run build` (must pass), `npm run test` (unit), `npm run test:e2e` (Playwright with mocked GitHub).
- Release scenarios from fixtures: normal, no releases, only draft, only pre-release, missing platform, unmappable asset, malformed JSON/shape, HTTP 403 rate limit, 404, timeout/offline, stale cache < 7 d, stale cache > 7 d, hostile release notes.
- Visual/responsive: 375, 768, 1280 px × en/ar, light/dark; RTL mirroring review.
- Accessibility: axe (no critical/serious), keyboard-only walkthrough, reduced-motion emulation.
- Link audit: every rendered download href equals a validated asset URL.
- Not verified until actually run; results are reported with command output (Principle IX).
