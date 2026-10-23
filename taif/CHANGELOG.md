# Changelog — taif-website

All changes made during the `001-taif-website` spec-kit feature and post-implement design work, organized by file. Newest first.

---

## 2026-10-23 — 2026-10-24 · UX polish + splash + lightbox

### New files
- `src/components/SplashPreview.astro` — faithful, decorative recreation of the app splash inside a phone frame in the hero (three spectral bands, `.splash-glow`, `TAIF · طَيْف` lockup, one-shot spectral progress line). After the splash (~1.9 s) it crossfades to the genuine mobile home-screen capture (`/screenshots/home-android.webp`) and stays there. Fully `aria-hidden`, no focusables, reduced-motion shows the home screen immediately.
- `src/components/SiteSplash.astro` — site-level splash overlay shown on every page load before the page reveals (app-style glow, mark, lockup, progress line). CSS-driven, `aria-hidden`, `pointer-events: none` (never intercepts clicks), no-JS auto-hide fallback, 1.5 s visible + 450 ms fade, hidden under `prefers-reduced-motion`.
- `src/scripts/site-splash.ts` — removes the overlay after the progress completes; no session-skip flag (shows every load, per owner).
- `src/scripts/lightbox.ts` — accessible `<dialog>` controller for the showcase: Escape/backdrop/X close, RTL-aware Arrow navigation, focus enters on open and returns to the trigger, scroll lock made shift-free.
- `tests/e2e/showcase-lightbox.spec.ts`, `tests/e2e/splash-preview.spec.ts`, `tests/e2e/mobile-menu.spec.ts`, `tests/e2e/anchor-offset.spec.ts`, `tests/unit/showcase-copy.test.ts`.

### Modified — components
- `src/layouts/Base.astro` — dark-first (`<html class="dark scroll-smooth">`), locale-aware `<html>`; now mounts `<SiteSplash />` at the top of `<body>`.
- `src/components/Header.astro` — sticky translucent app bar (`bg-appbar/90 backdrop-blur-md`), app Brand lockup (mark + tracked `TAIF` + divider + `طَيْف`, locale-aware home link), desktop nav pills, mobile menu converted to a **floating rounded panel** (`absolute start-3 end-3 z-50` overlay above content, 260 ms fade+scale entrance from `global.css`, ≥44 px touch targets).
- `src/scripts/mobile-menu.ts` — now also closes on any pointer press outside the panel and on Escape anywhere (regression tests added).
- `src/components/Hero.astro` — app-home-style hero: glow backdrop, icon-badge mark → mark badge, tracked heading, 44px-height CTAs; two-column at `lg` with the splash preview on the right; body copy constrained to `max-w-[68ch]`.
- `src/components/Showcase.astro` — desktop captures as window-framed cards (traffic-light bar) in a 2-col grid; Android captures as a 5-across phone gallery; empty manifest → dashed dropzone notice; every capture is a button opening the lightbox `<dialog>`; closing fades while still `[open]` (top layer) so the image never jumps sideways; whole overlay (dim + blur) painted by the dialog so it fades as one unit (WebP images, focus rings on triggers).
- `src/components/Features.astro` — app `Workspace` tool-card anatomy (12px radius, `bg-card`, hover lift, cyan-tinted 40px icon badges, `bg-field` media pills, `not-on-macos` note).
- `src/components/HowItWorks.astro` — 4-col step cards with mono `01`–`04` badges (`aria-hidden`).
- `src/components/Downloads.astro` + `src/components/DownloadCenter.tsx` — studio panel framing; release metadata bar; package-type label per asset (Installer / Debian package / APK); retry + Releases link whenever cached data is stale (any status); correct Release-page vs All-releases labels; English release notes marked `lang="en" dir="ltr"` + localized notice; Android arch guidance whenever multiple APKs; verified arch wording (ARM64 = most phones/tablets, x86_64 = Chromebooks/emulators, both Android 10+); stale warning reworded (cached, may be out of date + real last-checked date); localized rate-limit reset time; inline SVG icons (fixes a dev-mode 504 hydration failure); focus rings; ≥44px touch sizes.
- `src/components/About.astro`, `src/components/Developer.astro` — gradient studio surface cards; developer initials badge on the spectral gradient with `text-[#0d1017]`.
- `src/components/Faq.astro` — rounded `<details>` cards with rotating chevron, smooth open/close height+opacity transitions, 68ch answers.
- `src/components/Footer.astro` — `bg-appbar` footer, brand lockup, three columns, `LanguageSwitch direction="up"` (dropdown opens upward).
- `src/components/LanguageSwitch.astro` — dropdown menu (globe + current language + chevron) with click-outside/Escape close, hash-preserving target rewrite, footer opens upward, ≥44px options on mobile.
- `src/components/Page.astro` — FR-001 section order (header → hero → showcase → features → how-it-works → downloads → about → developer → FAQ → footer).

### Modified — styles / config / content
- `src/styles/global.css` — `* { border-color }` token rule, `.text-spectra`, `.bg-spectra`, `.splash-glow`, Bootstrap 5 `.container` scale (540/720/960/1140/1320px), `scrollbar-gutter: stable` (no horizontal shift when the modal scroll lock toggles), smooth `::details-content` accordion transitions (+ reduced-motion guards), mobile nav panel entrance keyframes, dark-mode token block kept out of `@layer base` (Tailwind was stripping it — dark mode genuinely renders now), AA-tuned light/dark tokens.
- `tailwind.config.cjs` — extra color tokens (`appbar`, `field`, `card`, `popover`…), custom `container` (Bootstrap scale), default `container` plugin disabled.
- `astro.config.mjs` — `trailingSlash: "ignore"` (`/ar`, `/ar/`, `/ar#downloads` all resolve), sitemap with i18n record (emits `<xhtml:link>` alternates), `vite.optimizeDeps` pre-bundling, `build.inlineStylesheets: "never"`.
- `src/content/screenshots.ts` — 8 genuine owner-provided captures wired with localized alt, intrinsic sizes, platform/screen metadata; paths now point at optimized `.webp`.
- `src/content/en.ts` / `ar.ts` — hero/features/how-it-works/about/downloads/FAQ/footer/meta copy with evidence comments; verified Remove Music notices; URL-import sites FAQ item; Compress "similar quality" + vs Downgrade Quality comparison; lightbox strings; English `hero.name` = "TAIF · طَيْف" in `<bdi>`.
- `src/content/types.ts` — dictionary additions (`showcase.lightbox`, shape updates).
- `src/content/operations.ts` — six operations with file/line evidence comments.

### Build / tooling / deploy
- `vercel.json` — security headers + CSP (`script-src 'self'` + content hashes, `style-src 'self' 'unsafe-inline'` for island boilerplate, `connect-src … https://api.github.com`), `trailingSlash: false` matching the no-slash policy.
- `scripts/patch-csp.mjs` — re-pins the full inline-script hash list post-build (now works when hashes already exist).
- `scripts/optimize-screenshots.mjs` + `npm run optimize:images` — sharp WebP q82: 1,612 KB → 245 KB (−84.8%), dimensions preserved, PNG sources kept, idempotent with `--force`.
- `scripts/generate-og.mjs` — per-locale 1200×630 OG images from brand mark + name + tagline only.
- `scripts/csp-check.mjs` + `npm run verify:csp` — serves `dist/` with the literal Vercel headers in headless Chromium; asserts scripts/CSS/fonts/images/api work under CSP.
- `playwright.config.ts` — `workers: 4`, 60 s timeout.
- `README.md` — boundary rule, commands, screenshot manifest how-to, SITE_URL, Vercel steps, "How release data is discovered" section.

### Convergence (Phase 10, T080–T097)
- All 18 findings fixed (tasks.md); commit intentionally left to the owner.

### Deployment (2026-10-23/24)
- Vercel project `taif` created (account `omarahmedpl`); `SITE_URL=https://taif-omarahmedpls-projects.vercel.app` set for Production/Preview; production deployment **Ready**.
- Pending (owner): final production redeploy with the latest splash/UX changes, Arabic copy review, Lighthouse runs, custom domain.

---

## 2026-10-23 · Initial implementation (T001–T079)
- Astro 5 + React 18 + Tailwind 3.4 + TS strict scaffold, typed bilingual dictionary, zod-validated GitHub Releases download center, accessories (404, 404 robots/sitemap/OG images/JSON-LD), a11y (axe light+dark zero critical/serious), RTL/LTR + reduced-motion e2e, launch checklist in `specs/001-taif-website/checklists/launch.md`. Full log: `specs/001-taif-website/tasks.md`.
