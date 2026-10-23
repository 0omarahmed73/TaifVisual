import { describe, it, expect } from "vitest";
import { alternateUrls, isRtl, localePath, otherLocale } from "@/lib/i18n";

describe("localePath", () => {
  it("gives the default locale no prefix", () => {
    expect(localePath("en")).toBe("/");
    expect(localePath("en", "downloads")).toBe("/downloads");
  });

  it("prefixes Arabic paths with /ar (no trailing slash)", () => {
    expect(localePath("ar")).toBe("/ar");
    expect(localePath("ar", "downloads")).toBe("/ar/downloads");
  });
});

describe("isRtl", () => {
  it("is true for Arabic and false for English", () => {
    expect(isRtl("ar")).toBe(true);
    expect(isRtl("en")).toBe(false);
  });
});

describe("otherLocale", () => {
  it("swaps locales", () => {
    expect(otherLocale("en")).toBe("ar");
    expect(otherLocale("ar")).toBe("en");
  });
});

describe("alternateUrls", () => {
  it("produces reciprocal / and /ar with an x-default fallback", () => {
    const alts = alternateUrls("/", "https://example.invalid");
    const byLang = Object.fromEntries(alts.map((a) => [a.hreflang, a.href]));
    expect(byLang["en"]).toBe("https://example.invalid/");
    expect(byLang["ar"]).toBe("https://example.invalid/ar");
    expect(byLang["x-default"]).toBe("https://example.invalid/");
  });

  it("never guesses a domain when SITE_URL is absent", () => {
    expect(alternateUrls("/", undefined)).toEqual([]);
  });

  it("trims trailing slashes from the configured site URL", () => {
    const alts = alternateUrls("/", "https://example.invalid//");
    expect(alts.every((a) => !a.href.includes("///"))).toBe(true);
  });
});
