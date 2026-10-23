# Research: TAIF Official Website

All "unknowns" from Technical Context are resolved here. Evidence paths are relative to the app
repository root (`basset-2.0.0/`), inspected on 2026-10-23.

## 1. Product facts verified against app source

| Claim | Evidence | Result |
|-------|----------|--------|
| Remove Music offered only when platform is known and not macOS, and media is audio/video | `src/components/screens/Workspace/index.tsx:153-155` (`platformName !== null && platformName !== "macos" && isAvMedia`) | Spec correct. Note: Android reports `android` through the Tauri OS plugin, so it is offered there (on-device ONNX engine, `HANDOFF.md`, verified on a Galaxy S24 FE). No macOS release exists anyway. |
| Trim and Cut: audio/video only | Same file, line 156 (`isAvMedia ? [TRIM, CUT]`) | Spec correct. Images get neither. |
| Compress: video only | Same file, line 157 (`mediaType === VIDEO`); `Operations/Compress.tsx` runs `-crf` = slider value + 20 | Spec correct. Audio and images do not get Compress. |
| Downgrade Quality and Convert always available | Same file, lines 152, 158 | Spec correct. |
| Trim ≠ Cut | `locales/en.json` `opDetails.trim` = "Keep only the range between the start and end points."; `opDetails.cut` = "Remove the selected middle section and join the remainder." Separate components `Operations/Trim.tsx`, `Cut.tsx` | Spec correct. Trim defaults to the whole file; Cut defaults to a 25–50% range (`HANDOFF.md`). |
| Quality options | `src/components/ui/QualitySelect.tsx`: video 1080p/720p/480p/360p/240p/144p; audio 320/128/64 kbps; image 90/60/30% | Spec correct. |
| Convert formats | `src/components/ui/FormatSelect.tsx`: image PNG/JPEG/WebP; audio MP3/AAC/OGG/WAV/MP4; video MP3/AAC/OGG/WAV/MP4/WebM/MOV/AVI/MKV; plus "Audio to Video" with a still image (`operations.convertToVideoOperation`) | Spec correct. |
| Importable file types | `src/components/screens/FileUpload/index.tsx:94-111`: mp4, avi, mov, mkv, wmv, flv, webm, aac, mp3, ogg, wav, m4a, png, webp, jpg, jpeg | **New detail, added to spec assumptions.** |
| URL download sites | `DownloadFromInternet.tsx:38-47`: YouTube, youtu.be, X/Twitter, Instagram, Facebook, LinkedIn, SoundCloud | Matches `uploadPage.urlDesc`. Site may name these seven only. |
| Local-first | `README.md` "Everything runs on your device. No servers, no accounts."; URL downloader contacts requested platforms directly | Site may state this, with the downloader exception. |
| License | `package.json` `GPL-3.0-only`; `LICENSE` is GPLv3 | Footer states GPL-3.0. |
| Platforms released | GitHub API 2026-10-23: v2.0.0 assets `.msi`, `.deb`, two `.apk` (arm64-v8a, x86_64) | Site data is still fetched live. |
| Android requirements | `HANDOFF.md`: minSdk 29 | State "Android 10 or newer". |
| Linux requirement | `HANDOFF.md`: sidecar built against glibc ≤ 2.34, works on Ubuntu 22.04; README says Debian/Ubuntu `.deb` | State Debian/Ubuntu package, verified on Ubuntu 22.04. |
| macOS | `tauri.conf.json` lists `app`/`dmg` targets but no macOS asset is released | Site does not claim macOS. |

**Conclusion**: no spec assumption was inaccurate. Two additions: Remove Music is available on
Android, and the importable-format list. `README.md` Download section is stale (omits Android) — the
website is the correction; the README is out of scope for this feature.

## 2. Existing stack, brand and conventions (reuse)

- App: Tauri 2 + React 18 + Vite 5 + Tailwind 3.4 + Radix, `lucide-react`, i18next. Fonts: Manrope (Latin) and Noto Sans Arabic via `@fontsource`.
- Tokens (`src/index.css`): dark-first canvas `#0D1017`, surface `#141923`, elevated `#1A2130`, border `#2A3345`; HSL variables for `--background --foreground --primary --secondary --muted --border --ring --success --warning --destructive`; spectrum `--spectra-start/mid/end` (dark: violet→blue→cyan, light variants darker for contrast); `--radius: 0.75rem`. Full light theme exists. Primary actions are inverted text on canvas; the spectrum is reserved for brand mark, progress and focus.
- Logo: `public/taif-mark.svg` (48×48, rounded square #0D1017 with three bars in the #B69CFF→#7AA8FF→#64D8E8 gradient). Reuse unmodified (Principle I).
- Localization in app: i18next with `locales/{en,ar,pt}.json`. The website will **not** reuse these files (independence; strings differ in purpose; Portuguese is out of scope).
- Build tooling: npm; `tsc` strict; ESLint 8 + Prettier with the Tailwind plugin; no test runner in the app.
- Reuse decision: copy token values and the SVG into the website; do not import across the boundary.
- Frontend skills available in this environment: `frontend-design`, `ui-ux-pro-max`, `design:accessibility-review`, `design:ux-copy` — to be used at implementation for visual direction, accessibility and Arabic/English copy review. `headroom` was not needed (no oversized files).

## 3. Repository boundary

- **Decision**: `taif/` subfolder of `TaifVisual` with its own `package.json`/lockfile, no workspace link, no imports from `../src`.
- **Evidence it is safe**: app `tsconfig.json` includes only `src` and `LiteSpleeter.ts`; app Tailwind `content` is `./src/**`; the only workflow triggers on `v*` tags (`.github/workflows/main.yml`), so website commits cannot start app builds; the Vercel root directory can be `taif/`.
- **Rationale**: user-confirmed in clarification; one repo keeps README, releases and site content together.
- **Alternatives**: new repo (cleanest isolation, but extra repo and cross-repo upkeep, rejected by user); npm workspace (couples installs, rejected).
- **Residual risk**: `git status` shows `taif/` as untracked in the app's repo root; committing it is a user decision, and `.specify`/`.claude` inside it should be reviewed before committing (document in README).

## 4. Rendering and data strategy

- **Decision**: Astro static output + one React island (`client:load` or `client:visible`) for the download center.
- **Rationale**: pre-rendered HTML for both locales gives best SEO/performance with minimal JS; built-in i18n routing and sitemap; React matches the team's existing skills.
- **Alternatives**: Vite+React SPA (poor SEO/first paint; locale routing hand-rolled); Next.js (heavier, server runtime not needed); plain HTML+JS (viable, but typed components and tests are costlier by hand).
- **Release data**: client-side `fetch` to `https://api.github.com/repos/0omarahmed73/TaifVisual/releases` (public, CORS-enabled, unauthenticated). A serverless proxy with a token was rejected: needs a secret, adds a runtime, violates scope discipline. A build-time snapshot was rejected: can go stale and would be fabricated-by-age; only the 7-day browser cache of previously validated live data is used.
- **No-JS fallback**: static text and a plain link to the repository's Releases page (never asset links).

## 5. Locale routing and SEO

- **Decision**: `/` English (default), `/ar/` Arabic. Each page sets `<html lang dir>`, localized `<title>`, description, OG/Twitter tags; self-referencing canonical; `hreflang` en, ar and `x-default` → English; sitemap lists both with alternates.
- **Persistence**: `localStorage` key set when the visitor uses the switch. An inline script on `/` redirects to `/ar/` only when the saved choice is `ar`; crawlers and first-timers are never redirected. The switch preserves the hash (section) when changing locale.
- **Rejected**: Accept-Language auto-redirect (cache/crawler problems, surprises users), query-parameter or cookie-only switching (not indexable).
- **Absolute URLs**: require the production domain. See §7.
- **RTL**: logical CSS properties (`margin-inline`, `inset-inline`, `text-align: start`), icons that imply direction flipped via `[dir=rtl]`, version/file names isolated with `dir="ltr"`/`<bdi>`; brand "TAIF · طَيْف" kept as one bidi-safe unit.
- **Arabic copy**: natural, written not machine-translated; reviewed by the user before launch (no native-speaker review is claimed by the plan).

## 6. Screenshots dependency

- **Evidence**: no TAIF screenshots are tracked in the app repo; `~/Pictures/Screenshots/*` are dated before the rebrand (2025) and are not used.
- **Decision**: showcase reads a typed manifest (`src/content/screenshots.ts`): file, width, height, alt text per locale, operation/screen, platform (desktop/Android). Empty manifest → section shows a labeled "screenshots coming soon" notice with no imagery. No mock-ups or illustrations are used in the showcase.
- **Capture guidance** (for the user, in README): capture from the current build at real window size, dark theme (and one light), for: import, tool grid, one configure screen, processing/success, Android phone; Arabic variants if desired. The app can be run in a plain browser (`npm run dev`, README) for desktop-size captures, but Tauri-only features differ, so genuine desktop-app captures are preferred.

## 7. Deployment and unknown values

- Vercel: framework Astro (auto-detected), **Root Directory `taif/`**, install `npm ci`, build `npm run build`, output `dist`. No DNS or project changes are made by this work.
- Ignored Build Step: `git diff --quiet HEAD^ HEAD -- .` run inside `taif/`, so app-only commits do not redeploy the site.
- Env: `SITE_URL` (production domain, **unknown**). Behaviour: production build exits with a clear error if missing; local/preview builds omit absolute canonical/hreflang/OG URLs and log a warning, rather than guessing a domain.
- Headers (`vercel.json`): `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` empty, `X-Frame-Options: DENY`, CSP restricting `connect-src` to `'self' https://api.github.com`, `img-src 'self' data:`, `script-src 'self'` (inline script for the redirect hashed or moved to a file).
- Links to GitHub downloads are normal navigations, so CSP does not need them in `connect-src`.
- Domain also affects the developer's site `omarasaeed.dev` only as an outbound link; no dependency.

## 8. GitHub Releases handling (decisions)

- Request `/releases?per_page=10`, with 8 s timeout via `AbortController`.
- Validate with zod: array of objects with `tag_name`, `html_url`, `published_at`, `draft`, `prerelease`, `body`, `assets[]` (`name`, `size`, `browser_download_url`, `content_type`, `state`). Invalid releases/assets are dropped, not repaired.
- Select latest: first release with `draft=false`, `prerelease=false`, valid `published_at`, sorted by `published_at` desc.
- Asset download URL must start with `https://github.com/0omarahmed73/TaifVisual/releases/download/` (blocks look-alike hosts); asset `state` must be `uploaded`.
- Platform mapping by extension only: `.msi` → Windows (installer), `.deb` → Linux (Debian package), `.apk` → Android (APK). Arch hints from name tokens `arm64-v8a`, `x86_64`/`amd64`/`x64`; shown only if present. Any other file (zip, sha, blockmap, `.exe`, `.AppImage`, `.dmg`) → not offered as a download; release page link remains. Two assets of the same platform+arch → both shown, none highlighted as "suggested".
- Why `.exe` is not mapped: not in the spec rule and not in any current release; adding it later is a one-line config change plus a test.
- Suggested platform: from `navigator.userAgent`/`userAgentData` — Android, Windows, Linux (non-Android); otherwise none. Android suggestion with several APKs: highlight `arm64-v8a` only if the file name states it; explain `x86_64` as emulators/x86 devices.
- Release notes: plain text, collapsed by default, truncated to a bounded length with a link to the full notes; rendered via text nodes (framework escaping), never HTML/Markdown.
- Caching: key `taif.releases.v1` stores `{fetchedAt, release}` of the validated latest release only. Fresh < 10 min → no refetch. Failure + age ≤ 7 d → show with "last checked" and outdated warning. Failure + age > 7 d or corrupt → failure state. Cached URLs are re-validated on read.
- Rate limit: HTTP 403/429 with `x-ratelimit-remaining: 0` → "temporarily busy" wording; show retry time from `x-ratelimit-reset` if present; same stale-cache rules.
- States: `loading | ready | partial (some platforms missing) | no-release | stale | error`.

## 9. Testing tools

Vitest for pure logic with fixtures; Playwright for browser behaviour with `page.route` mocking `api.github.com`; `@axe-core/playwright` for accessibility; Playwright screenshot comparison for 375/768/1280 in en/ar and light/dark (baselines generated on first approved run; compared only locally/CI of the website). Lighthouse is run manually and reported, not claimed in advance.
