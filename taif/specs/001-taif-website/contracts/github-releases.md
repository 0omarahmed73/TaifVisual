# Contract: GitHub Releases consumption

## Request

`GET https://api.github.com/repos/0omarahmed73/TaifVisual/releases?per_page=10`
Headers: `Accept: application/vnd.github+json`. No auth. Timeout 8 s. Owner/name come from `SiteConfig` only.

## Accepted response shape (per release; extra fields ignored)

| Field | Type | Rule |
|-------|------|------|
| `tag_name` | string | non-empty |
| `name` | string \| null | |
| `draft` | boolean | `true` → skipped |
| `prerelease` | boolean | `true` → skipped for "latest" |
| `published_at` | ISO string \| null | null → skipped |
| `html_url` | string | `https://github.com/0omarahmed73/TaifVisual/releases/tag/...` |
| `body` | string \| null | untrusted; max 4000 chars kept |
| `assets[]` | array | each: `name`, `size` (int > 0), `state == "uploaded"`, `browser_download_url` |

`browser_download_url` MUST start with `https://github.com/0omarahmed73/TaifVisual/releases/download/`.

## Mapping rules

| Extension | Platform | Package type |
|-----------|----------|--------------|
| `.msi` | Windows | Installer (MSI) |
| `.deb` | Linux | Debian package |
| `.apk` | Android | APK |

Arch tokens in file name (case-insensitive): `arm64-v8a`, `x86_64`, `amd64`, `x64`. Unknown → no arch label.
Anything else → not a download; never shown as a button.

## Outcome table (each MUST have a test)

| Situation | Result state | UI |
|-----------|--------------|----|
| Valid latest release, all three platforms | `ready` | three platform cards with buttons |
| Valid release, some platforms missing | `partial` | missing ones show "not in this release", no button |
| `[]`, only drafts, or only pre-releases | `no-release` | honest message + Releases link |
| Release valid but zero mappable assets | `partial` (all platforms unavailable) | message + release page link |
| Malformed JSON / wrong shape / invalid URL | `error(invalid-data)` | error + retry + Releases link |
| HTTP 403/429 with remaining = 0 | `error(rate-limit)` or stale | rate-limit message (+ reset time) |
| HTTP 404/5xx | `error(http)` or stale | error + retry |
| Timeout/offline | `error(network\|timeout)` or stale | error + retry |
| Failure and cache ≤ 7 d | `stale` | cached data, "last checked", outdated warning |
| Failure and cache > 7 d or corrupt | error | error only |

## Safety invariants

1. Notes rendered only as text nodes.
2. `href` of any download button equals a validated `downloadUrl`; there is no other source of download hrefs.
3. No hard-coded version or file name in code, content, or tests other than named fixtures.
