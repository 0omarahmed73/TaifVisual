import type { Locale } from "@/content/types";

/**
 * Locale helpers per contracts/locale-routing.md.
 * English is the default locale with no URL prefix; Arabic lives under /ar.
 * Trailing-slash policy (T093): clean URLs without a trailing slash everywhere
 * (links, canonical, hreflang and sitemap); `trailingSlash: "ignore"` still
 * accepts `/ar/` in dev/preview.
 */

export function localePath(locale: Locale, path = "/"): string {
  const clean = path === "/" ? "/" : `/${path.replace(/^\/+|\/+$/g, "")}`;
  return locale === "en" ? clean : `/ar${clean === "/" ? "" : clean}`;
}

export function isRtl(locale: Locale): boolean {
  return locale === "ar";
}

export function otherLocale(locale: Locale): Locale {
  return locale === "en" ? "ar" : "en";
}

interface Alternate {
  hreflang: "en" | "ar" | "x-default";
  href: string;
}

/**
 * Reciprocal hreflang alternates for a page. When `siteUrl` is undefined
 * (SITE_URL unset) returns an empty array — never a guessed domain.
 */
export function alternateUrls(path = "/", siteUrl: string | undefined): Alternate[] {
  if (!siteUrl) return [];
  const base = siteUrl.replace(/\/+$/, "");
  return [
    { hreflang: "en", href: `${base}${localePath("en", path)}` },
    { hreflang: "ar", href: `${base}${localePath("ar", path)}` },
    { hreflang: "x-default", href: `${base}${localePath("en", path)}` },
  ];
}
