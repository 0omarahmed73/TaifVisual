# Data Model: TAIF Official Website

No database. Types are TypeScript definitions; "Source" says where the data comes from.

## SiteConfig (source: `src/config/site.ts`, hand-verified)

| Field | Value / rule |
|-------|--------------|
| `repo.owner`, `repo.name` | `0omarahmed73`, `TaifVisual` (verified remote and API) |
| `releasesUrl` | derived `https://github.com/{owner}/{name}/releases` |
| `license` | `GPL-3.0` |
| `locales` | `en` (default), `ar` |
| `developer` | `{ name: "Omar A. Saeed", role: "Full Stack Developer", links: { website, github, linkedin } }` with `https://www.omarasaeed.dev/`, `https://github.com/0omarahmed73`, `https://linkedin.com/in/0omarahmed73` |
| `assetRules[]` | `{ ext, platform, packageType }` for `.msi`/`.deb`/`.apk`; `archTokens` map |
| `cache` | `{ freshMinutes: 10, staleMaxDays: 7, requestTimeoutMs: 8000 }` |

## Release (source: GitHub API, validated)

`tag` (string), `name` (string|null), `publishedAt` (ISO date), `url` (https GitHub release page), `notes` (string, untrusted, length-bounded), `prerelease=false`, `draft=false`, `assets: ReleaseAsset[]`.

Rules: must pass schema; `url` host `github.com`; otherwise dropped.

## ReleaseAsset (derived)

`fileName`, `sizeBytes` (positive integer), `downloadUrl` (must match the repo's `releases/download/` prefix), `platform` (`windows|linux|android`), `packageType` (`installer|deb|apk`), `arch` (`arm64-v8a|x86_64|null`), `isSuggested` (client-side, derived).

Rules: dropped if `state != uploaded`, size missing/≤ 0, URL invalid, or extension not in `assetRules`.

## PlatformEntry (view model, per Windows/Linux/Android)

`platform`, `assets: ReleaseAsset[]`, `status: available | unavailable`.
Transitions: built from the selected Release; platforms with zero valid assets → `unavailable`.

## DownloadCenterState (state machine)

`loading → ready | partial | no-release | error`; `error → loading` (retry); `ready|partial` may show `stale` flag when sourced from cache; `stale` only when cache age ≤ 7 days.

Attributes: `release?`, `platforms[]`, `source: live | cache`, `fetchedAt?`, `errorKind?: network | timeout | rate-limit | http | invalid-data`, `rateLimitResetAt?`.

## CachedRelease (browser storage `taif.releases.v1`)

`{ fetchedAt: number, release: Release }`. Re-validated on read; invalid → discarded.

## Operation (source: `src/content/operations.ts`, verified in research §1)

`id` (`remove-music|trim|cut|compress|convert|quality`), `icon`, `appliesTo: (audio|video|image)[]`, `availability` (e.g. not-on-macos), localized `name`, `summary`, `description`, optional `details[]` (e.g. quality levels, formats).

## Screenshot (source: `src/content/screenshots.ts`)

`file`, `width`, `height`, `platform: desktop|android`, `screen` (import|tools|configure|result), `alt: {en, ar}`, `capturedFrom` (app version string supplied with the capture). Entry exists only for genuine captures.

## Dictionary (source: `src/content/en.ts`, `ar.ts`)

Typed with one `Dictionary` interface; Arabic must satisfy the same type, so a missing key is a compile error. Includes state messages, metadata, FAQ, aria labels.

## FaqItem

`id`, `question`, `answer` per locale; each answer cites its source in a code comment (README, source file, or release data).

## LanguagePreference (browser storage `taif.lang`)

`"en" | "ar"`, written only on explicit switch; read once on `/`.
