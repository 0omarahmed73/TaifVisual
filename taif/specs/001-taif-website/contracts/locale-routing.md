# Contract: Locale routing and metadata

| Locale | URL | `<html lang dir>` | Canonical | Alternates |
|--------|-----|-------------------|-----------|------------|
| English (default) | `/` | `en` `ltr` | `{SITE_URL}/` | `hreflang=en` → `/`, `ar` → `/ar`, `x-default` → `/` |
| Arabic | `/ar` | `ar` `rtl` | `{SITE_URL}/ar` | same set (reciprocal) |

Trailing-slash policy: clean URLs without a trailing slash everywhere — links,
canonical, hreflang and sitemap (Vercel `cleanUrls` + `trailingSlash: false`).
Astro uses `trailingSlash: "ignore"`, so `/ar/` still resolves in dev/preview.

Rules:
- `SITE_URL` is required for production builds (build fails otherwise); when absent in preview/local, absolute tags (canonical, hreflang, OG url, sitemap) are omitted with a console warning. No guessed domain.
- Language switch: link to the same section in the other locale (`/#downloads` ↔ `/ar/#downloads`), `hreflang` and `lang` attributes on the link, accessible name in the target language ("العربية", "English").
- Preference: on explicit switch store `taif.lang`. On `/`, if stored value is `ar`, `location.replace('/ar' + hash)`. No other automatic redirect. `/ar` never redirects.
- Each locale page has localized `<title>`, `meta description`, `og:title/description/locale`, `og:locale:alternate`, `twitter:card`, JSON-LD `SoftwareApplication` limited to verified fields (name, operatingSystem list only for platforms in `SiteConfig`, license, `applicationCategory`), no price/rating claims.
- Sitemap: both URLs with alternates. `robots.txt` allows all and points to sitemap only when `SITE_URL` exists.
- Unknown paths → a localized 404 page that links to `/` and `/ar/`.
