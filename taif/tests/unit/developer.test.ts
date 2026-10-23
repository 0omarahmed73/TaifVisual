/**
 * T058 (US4): the developer section shows exactly the three verified links
 * and nothing personal (FR-033). Runs against built HTML
 * (`npm run build` before `npm run test`); skips cleanly when dist is absent.
 */
import { describe, expect, it } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { siteConfig, repoUrl, releasesUrl, licenseUrl } from "@/config/site";

const pages = [
  { name: "en", file: "dist/index.html" },
  { name: "ar", file: "dist/ar/index.html" },
] as const;

const VERIFIED_LINKS = [
  siteConfig.developer.links.website,
  siteConfig.developer.links.github,
  siteConfig.developer.links.linkedin,
];

function hrefs(html: string): string[] {
  return [...html.matchAll(/\shref="([^"]*)"/g)].map((m) => m[1]);
}

describe.each([...pages])("developer section ($name)", ({ file }) => {
  let html: string | null = null;
  if (existsSync(join(process.cwd(), file))) {
    html = readFileSync(join(process.cwd(), file), "utf8");
  }

  const skip = !html;
  it.skipIf(skip)(`${file} parses`, () => {});

  if (!html) return;
  const doc = html;

  function developerBlock(): string {
    const start = doc.indexOf('id="developer"');
    const end = doc.indexOf("</section>", start);
    return doc.slice(start, end);
  }

  it("contains the developer name and role from SiteConfig", () => {
    expect(doc).toContain(siteConfig.developer.name);
    expect(doc).toContain(siteConfig.developer.role);
  });

  it("links exactly the three verified URLs", () => {
    for (const link of VERIFIED_LINKS) {
      expect(doc, link).toContain(link);
    }
    const abs = developerBlock().match(/https?:\/\/[^"']+/g) ?? [];
    for (const raw of abs) {
      if (raw.startsWith("http://www.w3.org/")) continue; // SVG namespaces
      expect(VERIFIED_LINKS, raw).toContain(raw);
    }
  });

  it("has no mailto: and no personal details (FR-033)", () => {
    expect(doc).not.toContain("mailto:");
    for (const needle of ["@gmail.", "@outlook.", "@hotmail."]) {
      expect(doc).not.toContain(needle);
    }
  });

  it("shows no photo (initials badge instead)", () => {
    expect(developerBlock()).not.toMatch(/<img\b/);
  });

  it(`every external anchor in the page carries rel="noopener noreferrer"`, () => {
    const tags = [
      ...doc.matchAll(/<a\b[^>]*href="https?:\/\/[^"]*"[^>]*>/g),
    ].map((m) => m[0]);
    expect(tags.length).toBeGreaterThan(0);
    for (const tag of tags) {
      expect(tag, tag).toMatch(/rel="noopener\s?noreferrer"/);
    }
  });

  it("footer links ⊆ {repository, releases, license, developer links, anchors}", () => {
    const footer = doc.slice(doc.lastIndexOf("<footer"));
    const allowed: Array<string | RegExp> = [
      repoUrl,
      releasesUrl,
      licenseUrl,
      ...VERIFIED_LINKS,
      /^#[a-z-]+$/,
      /^\/$/,
      /^\/ar$/,
    ];
    for (const href of hrefs(footer)) {
      expect(
        allowed.some((a) => (typeof a === "string" ? href === a : a.test(href))),
        `unexpected footer link ${href}`,
      ).toBe(true);
    }
  });
});
