---

description: "Task list for the TAIF official website"
---

# Tasks: TAIF Official Website

**Input**: Design documents from `specs/001-taif-website/` (plan.md, spec.md, research.md, data-model.md, contracts/, quickstart.md)

**Prerequisites**: plan.md, spec.md (both read). Constitution: `.specify/memory/constitution.md`.

**Tests**: INCLUDED. The plan's Verification Strategy and spec Success Criteria require unit, integration (release handling), accessibility, RTL/LTR and responsive checks.

**Organization**: Grouped by user story. All paths are relative to the website project root `taif/` (not the app root). **No task may modify files outside `taif/`** (FR-042); the app's `src/`, `src-tauri/`, `locales/`, `.github/` are read-only references.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: parallelizable (different files, no dependency on unfinished tasks)
- **[Story]**: US1–US6 from spec.md
- Every task names exact file paths

---

## Phase 1: Setup

**Purpose**: Self-contained project scaffold.

- [x] T001 Create `package.json` (name `taif-website`, `"private": true`, scripts `dev`, `build`, `preview`, `lint`, `typecheck`, `test`, `test:e2e`, engines Node >=20) and install Astro, `@astrojs/react`, `@astrojs/sitemap`, React 18, Tailwind CSS 3.4 + PostCSS + autoprefixer, `zod`, `lucide-react`, `@fontsource/manrope`, `@fontsource/noto-sans-arabic`, TypeScript, Vitest, `@playwright/test`, `@axe-core/playwright`, ESLint, Prettier; pin exact versions after confirming they work together (do not assume compatibility); generate `package-lock.json` in `taif/`
- [x] T002 [P] Create `tsconfig.json` (strict, path alias `@/*` → `src/*`) and `astro.config.mjs` (static output; i18n `defaultLocale: "en"`, `locales: ["en","ar"]`, no prefix for default; React and sitemap integrations; `site` from `process.env.SITE_URL` only when set)
- [x] T003 [P] Create `tailwind.config.cjs` and `postcss.config.cjs` mapping the app's token names (`background`, `foreground`, `primary`, `secondary`, `muted`, `border`, `ring`, `success`, `warning`, `destructive`, `spectra-*`) to CSS variables, `darkMode: "class"`; copy values (do not import) from `../src/index.css`
- [x] T004 [P] Create `eslint.config.js`/`.eslintrc.cjs` and `.prettierrc` for TypeScript + Astro + React, no `any`; add `.gitignore` entries (`node_modules`, `dist`, `.astro`, `.vercel`, `test-results`, `playwright-report`)
- [x] T005 [P] Create `.env.example` documenting `SITE_URL` (production domain, currently unknown) and nothing else; no secrets
- [x] T006 [P] Create `vitest.config.ts` (unit tests in `tests/unit`) and `playwright.config.ts` (webServer = `npm run build && npm run preview`, projects: Chromium at 375, 768, 1280 widths; reduced-motion variant)
- [x] T007 Copy `../public/taif-mark.svg` unmodified to `public/taif-mark.svg` and create `public/favicon.svg` from the same mark; confirm byte-identical with `cmp ../public/taif-mark.svg public/taif-mark.svg`

---

## Phase 2: Foundational (blocks all user stories)

**Purpose**: Verified facts, typed content scaffold, layout, tokens, routing skeleton.

- [x] T008 Create `src/config/site.ts` per data-model `SiteConfig`: repo `0omarahmed73`/`TaifVisual`, derived `releasesUrl`, license `GPL-3.0`, locales, developer `{ name: "Omar A. Saeed", role: "Full Stack Developer", links: website "https://www.omarasaeed.dev/", github "https://github.com/0omarahmed73", linkedin "https://linkedin.com/in/0omarahmed73" }`, `assetRules` (`.msi`→windows/installer, `.deb`→linux/deb, `.apk`→android/apk), `archTokens`, cache `{ freshMinutes: 10, staleMaxDays: 7, requestTimeoutMs: 8000 }`
- [x] T009 Create `src/content/types.ts` defining one `Dictionary` interface (sections: nav, hero, showcase, features, howItWorks, downloads incl. every state message, about, developer, faq, footer, meta, aria, notFound) and `Locale = "en" | "ar"`
- [x] T010 [P] Create `src/content/en.ts` implementing `Dictionary` (structure complete; strings filled by each story's tasks)
- [x] T011 [P] Create `src/content/ar.ts` implementing the same `Dictionary` so a missing key is a compile error
- [x] T012 Create `src/content/operations.ts` with exactly six `Operation` entries (`remove-music`, `trim`, `cut`, `compress`, `convert`, `quality`), `appliesTo` and `availability` exactly as verified in research §1 (Remove Music: audio+video, not macOS; Trim/Cut: audio+video; Compress: video only; Convert and Quality: audio, video, image), with an evidence comment per entry citing the app source file and line
- [x] T013 Create `src/lib/i18n.ts` (locale helpers: `localePath`, `alternateUrls`, `isRtl`, `otherLocale`) respecting contracts/locale-routing.md
- [x] T014 Create `src/styles/global.css` with Tailwind layers, `@fontsource` imports (Manrope 400–800, Noto Sans Arabic 400/600/700), light/dark token variables copied from `../src/index.css`, logical-property base styles, visible `:focus-visible` ring using `--ring`, and `@media (prefers-reduced-motion: reduce)` disabling transitions/animations
- [x] T015 Create `src/layouts/Base.astro`: sets `<html lang dir>` from locale, charset/viewport, localized `<title>`/description from dictionary, favicon, skip-to-content link, slot; emits canonical, `hreflang` (en, ar, x-default) and OG/Twitter absolute URLs **only when `SITE_URL` is set**; production build (`NODE_ENV=production` and not preview) throws a clear error if `SITE_URL` is missing; otherwise console warning
- [x] T016 [P] Create `src/pages/index.astro` (English) and `src/pages/ar/index.astro` (Arabic) as thin pages composing section components from a shared `src/components/Page.astro` taking `locale`
- [x] T017 [P] Create `src/pages/404.astro` with a localized message and links to `/` and `/ar/`
- [x] T018 Create `src/lib/storage.ts`: safe `getItem/setItem/removeItem` wrappers around `localStorage` with try/catch (returns null/no-op when blocked)
- [x] T019 [P] Create unit test `tests/unit/i18n.test.ts`: `alternateUrls` produce reciprocal `/` and `/ar/`; `isRtl("ar")` true, `isRtl("en")` false; no guessed domain when `SITE_URL` absent
- [x] T020 Verify scaffold: run `npm run typecheck` and `npm run build` with `SITE_URL=https://example.invalid`; record real results (do not claim success unless run)

**Checkpoint**: both empty locale pages build; layout sets `lang`/`dir`.

---

## Phase 3: User Story 1 — Download the right build (Priority: P1) 🎯 MVP

**Goal**: Reliable, honest download center driven by live GitHub Releases.

**Independent Test**: With mocked GitHub fixtures, each outcome in contracts/github-releases.md renders the right state; every download `href` equals a validated asset URL.

### Tests for US1 (write first, expect failure)

- [x] T021 [P] [US1] Create fixtures in `tests/fixtures/github/`: `release-full.json` (msi, deb, 2 apk, plus a `.zip`, `.sig`, `.blockmap` to be ignored), `release-windows-only.json`, `empty.json` (`[]`), `only-draft.json`, `only-prerelease.json`, `malformed-shape.json`, `bad-url-host.json`, `zero-size-asset.json`, `asset-not-uploaded.json`, `hostile-notes.json` (script tags, javascript: links), `rate-limit-headers.json`
- [x] T022 [P] [US1] Create `tests/unit/releases.schema.test.ts`: zod validation drops drafts, invalid `published_at`, assets with `size` not a positive integer, `state != "uploaded"`, `browser_download_url` not starting with `https://github.com/0omarahmed73/TaifVisual/releases/download/`; notes truncated to max 4000 chars
- [x] T023 [P] [US1] Create `tests/unit/releases.map.test.ts`: `.msi`→Windows installer, `.deb`→Linux Debian package, `.apk`→Android APK; arch from `arm64-v8a`/`x86_64`/`amd64`/`x64` tokens only when present; unmappable files are never returned; two same-platform/arch assets yield no suggested highlight
- [x] T024 [P] [US1] Create `tests/unit/releases.cache.test.ts`: fresh <10 min reused without fetch; failure with cache ≤7 days → state `stale` with `fetchedAt`; failure with cache >7 days or corrupt JSON → `error`; cached URLs re-validated on read
- [x] T025 [P] [US1] Create `tests/unit/releases.state.test.ts` covering every row of the outcome table in `contracts/github-releases.md` (ready, partial, no-release, invalid-data, rate-limit with/without reset header, http 404/500, timeout, network)
- [x] T026 [P] [US1] Create `tests/e2e/downloads.spec.ts` using `page.route("https://api.github.com/**")` with the fixtures: asserts states, text-only rendering of hostile notes, no download button for unavailable platforms, retry works, link audit (each download `href` ∈ validated asset URLs), Releases-page fallback link present on every failure state

### Implementation for US1

- [x] T027 [P] [US1] Create `src/lib/releases/schema.ts` (zod) per data-model `Release`/`ReleaseAsset`: `size` positive integer, `state` = `uploaded`, URL prefix rule, `body` max 4000 chars, drafts/pre-releases excluded from "latest"
- [x] T028 [P] [US1] Create `src/lib/releases/map.ts`: extension→platform/packageType via `SiteConfig.assetRules`, arch parsing, returns `PlatformEntry[]` for windows, linux, android (`unavailable` when no valid asset)
- [x] T029 [P] [US1] Create `src/lib/releases/cache.ts` using `src/lib/storage.ts`, key `taif.releases.v1`, `{ fetchedAt, release }`, fresh 10 min, stale max 7 days, re-validation on read
- [x] T030 [US1] Create `src/lib/releases/fetch.ts`: `GET https://api.github.com/repos/0omarahmed73/TaifVisual/releases?per_page=10` with `Accept: application/vnd.github+json`, 8 s `AbortController` timeout, classify errors (`network|timeout|rate-limit|http|invalid-data`, parse `x-ratelimit-remaining`/`x-ratelimit-reset`), owner/name only from `SiteConfig`
- [x] T031 [US1] Create `src/lib/releases/state.ts`: pure `resolveState(...)` producing `DownloadCenterState` (`loading|ready|partial|no-release|error` + `stale`), combining fetch result and cache per FR-019, FR-020, FR-020a, FR-021; selects newest non-draft non-pre-release by `published_at`
- [x] T032 [US1] Create `src/lib/platform-detect.ts`: suggest Android/Windows/Linux from `navigator.userAgentData`/`userAgent`; return `null` for macOS, iOS, unknown (no false suggestion)
- [x] T033 [US1] Fill the `downloads` section strings (every state, platform names, package types, "last checked", outdated warning, rate-limit and retry wording, "not in this release", arch guidance for APKs, size/date labels) in `src/content/en.ts` and `src/content/ar.ts`
- [x] T034 [US1] Create React island `src/components/DownloadCenter.tsx`: reserved min-height skeleton (no layout shift), platform cards, per-asset button whose `href` is the validated `downloadUrl`, file size (format with `Intl.NumberFormat`), published date (`Intl.DateTimeFormat` by locale), version in `<bdi dir="ltr">`, notes as text nodes in a collapsed `<details>` with link to the release page, `aria-live="polite"` status region, retry button, Releases-page link on every non-ready state, suggested badge only from `platform-detect`
- [x] T035 [US1] Create `src/components/Downloads.astro` wrapper section (`id="downloads"`, heading, `<noscript>` text with plain link to the Releases page only), mount island with `client:load`, locale passed as prop; add to `src/components/Page.astro`
- [x] T036 [US1] Add a hero primary action in `src/components/Hero.astro` linking to `#downloads` (hero copy filled in US2)
- [x] T037 [US1] Run `npm run test` and `npm run test:e2e -- downloads`; record actual results; fix failures

**Checkpoint**: Download center fully works and degrades honestly with no fabricated links (SC-002, SC-003, SC-009).

---

## Phase 4: User Story 2 — Understand what TAIF is and does (Priority: P1)

**Goal**: Hero, showcase, features, How It Works, About TAIF — accurate in both languages.

**Independent Test**: A reviewer can name all six operations and explain Trim vs Cut; no unverifiable claim appears.

### Tests for US2

- [x] T038 [P] [US2] Create `tests/unit/content.test.ts`: exactly six operations with the expected ids; Trim and Cut descriptions differ and contain "keep"/"remove the middle" semantics in en and the Arabic equivalents; Compress `appliesTo` = video only; Remove Music not available on macOS; forbidden-claims scan (no "macOS", "iOS", "App Store", "Play Store", "Windows ARM" etc.) over en/ar
- [x] T039 [P] [US2] Create `tests/e2e/content.spec.ts`: sections render in the FR-001 order; showcase with empty manifest shows the labeled notice and zero `<img>` inside the showcase; with a test manifest entry renders image with width/height/alt and `loading="lazy"` (below the fold)

### Implementation for US2

- [x] T040 [P] [US2] Create `src/content/screenshots.ts` exporting a typed `Screenshot[]` (empty array; fields per data-model, `alt: {en, ar}`, `capturedFrom`) with a header comment: genuine captures only, no mock-ups
- [x] T041 [P] [US2] Write hero, features (six operations incl. quality levels 1080p–144p, 320/128/64 kbps, 90/60/30%, and Convert formats exactly per research §1), How It Works (choose file or supported URL → choose operation → configure → new output, original unchanged), About TAIF (free and open source, local-first, no account, GPL-3.0; URL downloader contacts requested platforms) into `src/content/en.ts`; each claim with an evidence comment
- [x] T042 [P] [US2] Write natural Arabic equivalents of the same copy in `src/content/ar.ts` (brand shown as "TAIF · طَيْف"; keep diacritics in طَيْف); flag in a top comment that user review of Arabic copy is required before launch
- [x] T043 [US2] Create `src/components/Hero.astro` (name, purpose, primary action to `#downloads`, secondary to features; logo via `/taif-mark.svg` with explicit width/height)
- [x] T044 [P] [US2] Create `src/components/Features.astro` rendering the six operations from `operations.ts` with `lucide` icons (same icons as app: `AudioLines`, `Scissors`, `Slice`, `Minimize2`, `ArrowRightLeft`, `MonitorDown`), availability notes only where verified
- [x] T045 [P] [US2] Create `src/components/HowItWorks.astro` as an ordered list (`<ol>`) with 4 steps
- [x] T046 [P] [US2] Create `src/components/Showcase.astro` driven by `screenshots.ts`: `<figure>` with `<img width height loading="lazy" decoding="async">` and localized alt; empty manifest → notice "Screenshots are coming soon" (localized) with no imagery
- [x] T047 [P] [US2] Create `src/components/About.astro` (verified facts only)
- [x] T048 [US2] Create `src/components/Header.astro` with section links, collapsible mobile menu (button with `aria-expanded`/`aria-controls`, Escape closes, focus returns to button), and language switch slot (filled in US3); wire `Page.astro` section order per FR-001: header, hero, showcase, features, how it works, downloads, about, developer, FAQ, footer
- [x] T049 [US2] Run `npm run test` and `npm run test:e2e -- content`; record results

**Checkpoint**: Product story is complete and truthful in both languages (SC-006, SC-011).

---

## Phase 5: User Story 3 — Arabic and English experience (Priority: P1)

**Goal**: Complete RTL/LTR behavior, switching, persistence.

**Independent Test**: Switch to Arabic, scroll all sections, reload and revisit `/`; everything is Arabic/RTL and the choice is remembered; `/ar/` direct visit always Arabic.

### Tests for US3

- [x] T050 [P] [US3] Create `tests/unit/dictionary-parity.test.ts`: runtime deep key-parity between `en.ts` and `ar.ts`, no empty strings, no `TODO`/placeholder text
- [x] T051 [P] [US3] Create `tests/e2e/locale.spec.ts`: `/` has `lang=en dir=ltr`; `/ar/` has `lang=ar dir=rtl`; switch keeps hash; storing `taif.lang=ar` then visiting `/` lands on `/ar/`; first visit with `Accept-Language: ar` still stays on `/`; blocked `localStorage` still allows switching; `/ar/` never redirects
- [x] T052 [P] [US3] Create `tests/e2e/rtl-visual.spec.ts`: screenshots of both locales at 375/768/1280 in light and dark with `fullPage`; assert `document.documentElement.scrollWidth <= innerWidth` (no horizontal scroll)

### Implementation for US3

- [x] T053 [US3] Create `src/components/LanguageSwitch.astro`: link to equivalent section of other locale, `hreflang` and `lang` on the link, accessible name in target language, writes `taif.lang` on click via a small module script (`src/scripts/lang-pref.ts`) using `src/lib/storage.ts`
- [x] T054 [US3] Create `src/scripts/lang-redirect.ts` and include it only in `src/pages/index.astro`: if `taif.lang === "ar"` then `location.replace("/ar/" + location.hash)`; no Accept-Language logic; placed as an external module (not inline) to keep CSP strict
- [x] T055 [US3] Audit all components for logical properties (`ms-/me-/ps-/pe-/start-/end-`, `text-start`), mirror directional icons in RTL via `[dir="rtl"]` utilities, isolate versions/file names/sizes with `<bdi dir="ltr">`, and apply `font-family` Noto Sans Arabic for `:lang(ar)`; fix issues found
- [x] T056 [US3] Add the language switch to `Header.astro` and the footer slot; ensure available at every width
- [x] T057 [US3] Run `npm run test` and `npm run test:e2e -- locale rtl-visual`; review screenshots for mirroring/overflow; record results (screenshot review is manual and must be reported as such)

**Checkpoint**: Complete bilingual site (SC-004, SC-005).

---

## Phase 6: User Story 4 — Developer profile (Priority: P2)

**Goal**: Verified, minimal developer section.

**Independent Test**: Name, role and three links equal `SiteConfig`; nothing else appears.

- [x] T058 [P] [US4] Create `tests/unit/developer.test.ts`: rendered developer data equals `SiteConfig.developer`; links are exactly the three verified URLs; no `mailto:`; all external anchors have `rel="noopener noreferrer"`
- [x] T059 [P] [US4] Fill developer section strings (heading, role label, link labels) in `src/content/en.ts` and `src/content/ar.ts`; no biography, location, employer, photo or contact details (FR-033)
- [x] T060 [US4] Create `src/components/Developer.astro` showing initials badge using brand spectrum gradient (no photo), name in `<bdi dir="ltr">`, role, and the three links with `lucide` icons (`Globe`, `Github`, `Linkedin`), opening with `target="_blank" rel="noopener noreferrer"`; add to `Page.astro`
- [x] T061 [US4] Run `npm run test -- developer`; record results

---

## Phase 7: User Story 5 — FAQ and footer (Priority: P2)

**Goal**: Sourced answers and verified footer links.

**Independent Test**: Every FAQ answer cites a source comment; keyboard toggles work; footer has only verified links.

- [x] T062 [P] [US5] Create `tests/e2e/faq-footer.spec.ts`: FAQ items toggle by Enter/Space with correct `aria-expanded` state, footer links ⊆ {repository, releases, developer links, license} plus anchors
- [x] T063 [P] [US5] Write FAQ (privacy/local-first, cost/open source, supported platforms and requirements: Android 10+, Debian/Ubuntu `.deb` verified on Ubuntu 22.04, Windows MSI; where files are saved; supported import formats; URL download sites; Remove Music accuracy notice) and footer strings in `src/content/en.ts` and `src/content/ar.ts`, each with source comment (README, app source path, or release data)
- [x] T064 [US5] Create `src/components/Faq.astro` using native `<details>/<summary>` (keyboard + screen-reader accessible without custom JS)
- [x] T065 [US5] Create `src/components/Footer.astro` with repository, Releases, license (GPL-3.0 linking to the repo `LICENSE` blob URL built from `SiteConfig`), developer links, language switch
- [x] T066 [US5] Run `npm run test:e2e -- faq-footer`; record results

---

## Phase 8: User Story 6 — Search and sharing metadata (Priority: P3)

**Goal**: Correct SEO and previews per locale without guessed domains.

**Independent Test**: Built HTML for each locale has correct title, description, canonical, reciprocal hreflang, OG and JSON-LD (with `SITE_URL` set) and none of the absolute tags without it.

- [x] T067 [P] [US6] Create `tests/unit/seo.test.ts` (parses built `dist/index.html` and `dist/ar/index.html`): titles/descriptions localized; canonical self-referencing; hreflang reciprocal plus `x-default`; JSON-LD contains only verified fields; build without `SITE_URL` in preview mode has no absolute canonical; production-mode build without `SITE_URL` fails with the documented error
- [x] T068 [P] [US6] Fill `meta` strings (titles, descriptions, OG text) in `src/content/en.ts` and `src/content/ar.ts`
- [x] T069 [US6] Extend `src/layouts/Base.astro` with `og:*`, `twitter:card`, `og:locale` and `og:locale:alternate`, and JSON-LD `SoftwareApplication` (name, applicationCategory, license, `operatingSystem` limited to Windows, Linux, Android, no ratings/prices)
- [x] T070 [P] [US6] Create `public/robots.txt` (allow all; sitemap line only when `SITE_URL` exists, generated at build) and verify sitemap output lists both locales with alternates
- [x] T071 [P] [US6] Create OG images `public/og-en.png` and `public/og-ar.png` (1200×630) composed only from the brand mark, name and tagline text; no app imagery; compress
- [x] T072 [US6] Run `npm run build` (with `SITE_URL=https://example.invalid` rehearsal) and `npm run test -- seo`; record results

---

## Phase 9: Polish and Cross-Cutting

- [x] T073 [P] Create `tests/e2e/a11y.spec.ts`: axe on `/` and `/ar/` (light, dark, loading and each download state) asserts zero critical/serious violations; keyboard traversal reaches menu, language switch, download buttons, FAQ; reduced-motion emulation yields no running animations
- [x] T074 [P] Create `vercel.json` with headers: `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options: DENY`, empty `Permissions-Policy`, and CSP (`default-src 'self'`; `script-src 'self'`; `style-src 'self' 'unsafe-inline'` only if the build needs it; `img-src 'self' data:`; `font-src 'self'`; `connect-src 'self' https://api.github.com`); `cleanUrls: true`; no rewrites; verify the page works under this CSP
- [x] T075 [P] Create `README.md`: purpose, boundary rule (do not edit outside `taif/`), setup/dev/build/test commands, how to update verified content, how to add screenshots (capture guidance and manifest fields), how to set `SITE_URL`, Vercel steps (Root Directory `taif/`, build `npm run build`, output `dist`, Ignored Build Step `git diff --quiet HEAD^ HEAD -- .`), note that `.specify/` and `.claude/` live in this folder and should be reviewed before committing
- [x] T076 Optimize assets: ensure all images have intrinsic width/height, WebP/AVIF where applicable, fonts limited to used weights/subsets; run `npm run build` and report `dist` size
- [x] T077 Run full verification from `taif/`: `npm run lint`, `npm run typecheck`, `npm run build`, `npm run test`, `npm run test:e2e`; report each command's real result and list anything not run (Principle IX)
- [x] T078 From the app repo root (`..`) run `git status --short` and confirm changes are confined to `taif/`; compare `git diff --stat -- . ':!taif'` is empty (SC-010)
- [x] T079 Manual review checklist recorded in `specs/001-taif-website/checklists/launch.md`: Arabic copy reviewed by owner; genuine screenshots added; `SITE_URL` set; Lighthouse run manually on both locales and results noted (not claimed in advance); link audit vs live Releases; Vercel project configured by owner (no deploy performed by this task list)

> Phase 9 completion notes: T079 is complete in that the checklist exists — the
> Arabic review, real `SITE_URL`, Lighthouse runs, live-Releases link audit and
> Vercel configuration remain OWNER-pending (recorded in the checklist).
> Screenshots stay PNG owner captures (kept as-is, sizes in launch notes).
> T074 CSP verification: two Astro runtime inline scripts cannot be externalized,
> so `scripts/patch-csp.mjs` (npm postbuild) pins their content-derived sha256
> hashes into `vercel.json`; `scripts/csp-check.mjs` drives real Chromium against
> a Content-Length-accurate server with those exact headers: 0 CSP violations.

---

## Dependencies and Order

- Setup (P1) → Foundational (P2) → all stories. Phases 3–8 are independent after Foundational; recommended order US1 → US2 → US3 → US4 → US5 → US6 (P1 first).
- Within a story: tests first (expected to fail), then lib/content, then components, then run.
- Shared-file note: `src/content/en.ts`, `ar.ts`, `Page.astro`, `Header.astro` are touched by several stories, so tasks editing the same file are not marked [P] against each other.
- Polish after all desired stories. T079 requires external inputs (screenshots, domain).

## Parallel Examples

- **US1 tests**: T021–T026 together; **US1 lib**: T027, T028, T029 together, then T030 → T031.
- **US2**: T041/T042 (copy) with T044–T047 (components) together after T040.
- **Cross-story** (after Foundational): one person on US1 (download lib), another on US2 content, another on US3 switch.

## Implementation Strategy

- **MVP**: Phase 1 + Phase 2 + US1 (T001–T037): a working, honest download center in both locales' shell. Not launch-ready without US2/US3 and screenshots.
- **Launch scope**: US1–US3 (P1) + US4–US5; US6 can follow but SEO metadata is cheap and recommended before launch.
- **Blocked-by-external**: screenshots (US2 showcase final state), production domain (US6 absolute tags, deploy), Arabic copy review (US3 launch), developer approval for any extra profile content (US4).
- Every completion claim must cite the command actually run.

---

## Phase 10: Convergence

Appended by `/speckit.converge` (2026-10-23) after assessment of the current `taif/` implementation against spec.md, plan.md, the constitution, and all T001–T079. Findings below trace to their source; completing them is the job of `/speckit-implement`.

- [x] T080 CRITICAL: Resolve repo tracking for `taif/` per spec Clarifications Q1 (owner-approved exception to FR-042): remove the `/taif/` entry from the repo-root `.gitignore`, add and commit `taif/` (site + specs), then verify `git ls-files taif` is non-empty and `git diff --stat -- . ':!taif'` remains empty (contradicts)
- [x] T081 [US1] Render the localized `packageType` label (Installer / Debian package / APK) on each download asset in `src/components/DownloadCenter.tsx` and add a `tests/e2e/downloads.spec.ts` assertion for it per FR-016, US1/AC1 (partial)
- [x] T082 [US2] Add the verified Remove Music notices to `src/content/en.ts` and `src/content/ar.ts` (on-device AI separation, can make mistakes, can also reduce background noise, no length limit) with evidence comments, and add the accuracy notice to the FAQ item per FR-009, US2 (partial)
- [x] T083 [US1] Render the retry button and Releases-page link whenever `state.stale` is true regardless of status in `src/components/DownloadCenter.tsx`, and add a Playwright stale-cache test per FR-020a, SC-003 (partial)
- [x] T084 [US3] Mark release notes as English (`lang="en" dir="ltr"`) and add a localized "release notes are in English" label in `src/components/DownloadCenter.tsx`; test the `/ar/` page per US3/AC4, FR-026 (partial)
- [x] T085 [US2] Use the bidi-safe "TAIF · طَيْف" as the English `hero.name` in `src/content/en.ts` (keeping JSON-LD name derivation correct) per FR-003, US2/AC1 (partial)
- [x] T086 [US1] Detect the current platform before the fresh-cache branch in `src/components/DownloadCenter.tsx` and pass the suggestion into `resolveState` so returning visitors see the "Suggested" badge; add an e2e assertion per US1/AC2 (partial)
- [x] T087 [US1] Fix release link labels in `src/components/DownloadCenter.tsx`: label the specific release URL as the release page and always render the verified all-releases link in the ready state per FR-024 (partial)
- [x] T088 [US2] Add the verified "similar quality" Compress claim and a short Compress vs Downgrade Quality comparison (verified against app copy) to both dictionaries per FR-011 (partial)
- [x] T089 [US1] Show architecture guidance whenever the Android card has multiple APK assets (keeping each arch token visible) in `src/components/DownloadCenter.tsx` per Edge Cases (partial)
- [x] T090 [US1] Reword the stale-cache warning in `src/content/en.ts` and `src/content/ar.ts` so it states the data is cached and may be out of date with the actual last-checked date, without claiming it is over a week old, per FR-020a (contradicts)
- [x] T091 [US5] Add a sourced FAQ item listing only the verified URL-import sites (YouTube, X, Instagram, Facebook, LinkedIn, SoundCloud) in both dictionaries per T063, research §1 (missing)
- [x] T092 [US6] Pass the `i18n` option to `sitemap()` in `astro.config.mjs` so both locale URLs emit `<xhtml:link>` alternates, and add a sitemap assertion per T070, contracts/locale-routing.md (partial)
- [x] T093 [US6] Choose one trailing-slash policy and align `src/layouts/Base.astro`, `src/lib/i18n.ts`, `src/components/LanguageSwitch.astro`, `vercel.json`, sitemap output, and `tests/unit/seo.test.ts` (canonical currently `/ar/` while links serve `/ar`) per FR-039, contracts/locale-routing.md (partial)
- [x] T094 [US2] Keep the `/showcase-test` and `/ar/showcase-test` fixture routes out of the production surface (dev-only/component fixture, or at minimum `noindex` + sitemap exclusion + supplied image) per plan/tasks scope (unrequested)
- [x] T095 [US2] Restore coverage for the empty-showcase notice (test-only empty manifest case) or update T039/plan to state the notice path is intentionally unreachable per T039, T046 (partial)
- [x] T096 [US1] Render the localized rate-limit reset time when `rateLimitResetAt` is present in `src/components/DownloadCenter.tsx` and add a test per contracts/github-releases.md (partial)
- [x] T097 [Docs] Add a "How release data is discovered" section to `taif/README.md` (endpoint, `per_page`, validation, platform mapping, 10-minute fresh cache, 7-day stale limit) or link explicitly to `contracts/github-releases.md` per FR-043 (partial)

## Phase 11: Convergence

Appended by `/speckit.converge` (2026-10-24). Assessed `taif/` against spec.md, plan.md, the constitution, and T001–T097. Evidence this pass: `npm run lint`, `npm run typecheck` clean; `npm test` 90/90 passed; `SITE_URL=https://example.invalid npm run build` + `postbuild` succeeded. Playwright e2e was NOT run in this pass. Owner-only launch items (Arabic review, `SITE_URL`, Lighthouse record, live link audit, Vercel project) are already tracked in `checklists/launch.md` and are not duplicated here.

- [x] T098 [US2] Stop shipping the `showcase-test`, `showcase-test-empty` (and `/ar/`) fixture routes and `public/e2e/screens-demo.png` in the production build: generate them only for dev/e2e (e.g. env-gated routes or test-only server) and confirm `dist/` has no `showcase-test*` or `e2e/` after `npm run build`, per FR-005, T094 (unrequested)
- [x] T099 Define a measurable performance budget (JS bytes, total image weight, LCP/CLS targets, throttling profile) in `taif/README.md` and add a script or e2e check that fails when `dist/` assets exceed it, per SC-008, FR-038 (partial)
- [x] T100 [P] Add a site-wide Playwright/unit assertion that every external `<a>` on `/` and `/ar/` has `rel="noopener noreferrer"` and an `https://` URL, not only footer/developer links, per FR-034 (partial)
- [x] T101 [P] Add `taif/.vercelignore` excluding `.claude`, `.opencode`, `.specify`, `specs`, `tests`, `test-results` so the deployment upload contains only the site, per FR-042, plan: Vercel (missing)
- [x] T102 [P] Add a "Reporting verification" section to `taif/README.md` stating that changes must list the commands actually run and what was not verified, per Constitution IX and Development Workflow (missing)
- [x] T103 Run `npm run test:e2e` against a fresh `SITE_URL=https://example.invalid` build and record the real result (pass/fail counts, any failures) in `specs/001-taif-website/checklists/launch.md`, per Constitution IX, T037/T049/T057/T066/T073 (partial)
