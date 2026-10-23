# TAIF Official Website

Static bilingual (English/Arabic) website for **TAIF · طَيْف** — free and open
source media tools. Built with Astro + React + Tailwind, deployed on Vercel.
The download center is driven by live GitHub Releases data, never fabricated.

## Boundary rule

**Never edit anything outside `taif/` in this repository.** The app's `src/`,
`src-tauri/`, `locales/` and `.github/` are read-only references.

## Commands (run from `taif/`)

```sh
npm install
npm run dev        # local dev server
npm run build      # static build into dist/ (set SITE_URL for absolute URLs)
npm run preview    # serve the built dist/
npm run lint
npm run typecheck
npm run test       # unit tests (Vitest)
npm run test:e2e   # full Playwright suite (builds + previews first)
```

A full verification rehearsal uses
`SITE_URL=https://example.invalid npm run build`; production must set the real
domain (below).

## Updating verified content

- Copy: `src/content/en.ts` and `src/content/ar.ts` (every new claim needs an
  evidence comment citing its source; the dictionaries must stay key-identical).
- Operations/availability data: `src/content/operations.ts`.
- Repo, license, developer links: `src/config/site.ts`.

## Adding screenshots (genuine app captures only)

1. Place the PNG in `public/screenshots/` (real TAIF captures only — never
   mock-ups or renders).
2. Register it in `src/content/screenshots.ts` with the exact manifest fields:
   `file` (path under `/public`), `width`/`height` (intrinsic pixels),
   `platform` (`desktop` | `android`), `screen`, `alt: { en, ar }` (localized
   alt text) and `capturedFrom` (the app version the capture came from).

## How release data is discovered

The download center is a client-side React island; nothing is hard-coded.
Full contract: [`specs/001-taif-website/contracts/github-releases.md`](specs/001-taif-website/contracts/github-releases.md).

- **Request**: `GET https://api.github.com/repos/0omarahmed73/TaifVisual/releases?per_page=10`
  with `Accept: application/vnd.github+json`, no auth, 8 s timeout.
- **Validation**: the JSON array and every release/asset are validated with
  `zod` (`src/lib/releases/schema.ts`). Drafts and pre-releases are dropped;
  releases with a malformed shape, invalid `html_url` or assets whose
  `browser_download_url` is outside
  `https://github.com/0omarahmed73/TaifVisual/releases/download/` are never
  shown. Release notes are untrusted text, length-bounded and rendered as
  text only.
- **Mapping** (`src/lib/releases/map.ts`): `.msi` → Windows installer,
  `.deb` → Linux Debian package, `.apk` → Android APK. Anything else never
  becomes a download button. Arch tokens `arm64-v8a`, `x86_64`, `amd64`, `x64`
  in the file name are shown next to the asset.
- **Cache** (`src/lib/releases/cache.ts`): the latest validated release is kept
  in `localStorage` for 10 minutes and reused without a network call. On a
  failed lookup, cached data up to 7 days old may be shown as stale with its
  real "last checked" date and a retry link; older data is never shown.

## Setting `SITE_URL`

- Rehearsal/local: `SITE_URL=https://example.invalid npm run build`.
- Production: set `SITE_URL` in the Vercel project environment. It is what
  enables canonical URLs, `hreflang`, OG tags, JSON-LD and the sitemap.

## Vercel deployment (project owner performs the deploy)

1. Import the repository; set **Root Directory** to `taif/`.
2. Build command: `npm run build`; output directory: `dist`.
3. Set `SITE_URL` as an environment variable.
4. **Ignored Build Step** (skip builds when nothing under `taif/` changed):
   `git diff --quiet HEAD^ HEAD -- .`
5. `vercel.json` pins the security headers (CSP, nosniff, referrer, framing)
   and `cleanUrls`; no rewrites.

### CSP and inline scripts

Astro always emits two tiny inline scripts (runtime loader + `astro-island`
definition), which cannot be externalized. The `postbuild` script
(`scripts/patch-csp.mjs`) pins their content-derived sha256 hashes into the
`script-src` directive of `vercel.json` — deterministic and automatically
recomputed on every build. Verify with `npm run verify:csp`, which serves
`dist/` with the literal `vercel.json` headers and asserts in real Chromium
that scripts/CSS/images/fonts/API fetches load with zero CSP violations.

## Performance budget

`npm run verify:budget` (after `npm run build`) fails if raw build output
exceeds: any HTML page 100 KB, total JS 260 KB, total CSS 60 KB, any image
referenced by a page 60 KB. Targets measured manually with Lighthouse on both
locales (mid-range mobile profile) and recorded in
`specs/001-taif-website/checklists/launch.md`: LCP <= 2.5 s, CLS <= 0.1; the
spec goal is main content visible in under 3 s (SC-008). Lighthouse results are
not claimed until recorded.

## Reporting verification

Every change summary must list the commands actually run (for example
`npm run lint`, `npm run typecheck`, `npm test`, `npm run build`,
`npm run test:e2e`) with their real result, and say what was not run or not
verified. Do not state a check passed unless its output was observed
(constitution, Principle IX).

## Note for reviewers

`.specify/` and `.claude/` live inside this folder and should be reviewed
before committing/publishing to avoid shipping workflow artifacts publicly.
`.vercelignore` keeps them (and `specs/`, `tests/`) out of the deployment upload.
e2e fixture routes (`/showcase-test*`) are built only when `TAIF_E2E=1` and are
removed from `dist/` otherwise.
