/**
 * T067 (US6): SEO/parsing tests over built `dist/`.
 *
 * Needs three real builds, executed by the test suite itself:
 *  1. `SITE_URL=https://example.invalid npm run build` → absolute tags (cached
 *     when a previous run already produced this shape).
 *  2. a plain local build without SITE_URL → NO absolute canonical/hreflang/OG.
 *  3. a CI-style production build without SITE_URL → must FAIL with the
 *     documented error (never guess a domain).
 *
 * run: npm run test -- seo
 */
import { describe, expect, it, beforeAll } from "vitest";
import { execFileSync } from "node:child_process";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SITE = "https://example.invalid/";

function runBuild(extraEnv: Record<string, string | undefined> = {}): {
  status: number;
  stderr: string;
} {
  const env = { ...process.env, ...extraEnv };
  // Vitest populates process.env.PROD/DEV/... (an import.meta.env shim) which
  // breaks Astro's environment resolution in spawned builds — remove them
  // unless the caller set them explicitly.
  for (const key of ["PROD", "DEV", "MODE", "BASE_URL", "SSR"] as const) {
    if (!(key in extraEnv)) delete env[key];
  }
  if (!("SITE_URL" in extraEnv) || extraEnv["SITE_URL"] === undefined) {
    delete env["SITE_URL"];
  }
  try {
    const out = execFileSync("npx", ["astro", "build"], {
      cwd: ROOT,
      env,
      stdio: ["ignore", "pipe", "pipe"],
      timeout: 300_000,
    });
    return { status: 0, stderr: out.toString() };
  } catch (error) {
    const err = error as { status?: number; stderr?: Buffer };
    return { status: err.status ?? 1, stderr: err.stderr?.toString() ?? "" };
  }
}

function distFile(rel: string): string {
  return readFileSync(join(ROOT, "dist", rel), "utf8");
}

function hasSiteBuilt(): boolean {
  if (!existsSync(join(ROOT, "dist/index.html"))) return false;
  try {
    return distFile("index.html").includes(`href="${SITE}"`);
  } catch {
    return false;
  }
}

let en = "";
let ar = "";

beforeAll(() => {
  if (!hasSiteBuilt()) {
    const res = runBuild({ SITE_URL: SITE });
    expect(res.status, res.stderr).toBe(0);
  }
  en = distFile("index.html");
  ar = distFile("ar/index.html");
}, 600_000);

function meta(html: string): string | null {
  const m = html.match(/<meta\s+name="description"\s+content="([^"]*)"/);
  return m ? m[1] : null;
}

function title(html: string): string {
  return html.match(/<title>([^<]*)<\/title>/)?.[1] ?? "";
}

function canonical(html: string): string | null {
  return (
    html.match(/<link\s+rel="canonical"\s+href="([^"]*)"/)?.[1] ?? null
  );
}

describe("SEO with SITE_URL set (built dist)", () => {
  it("titles are localized", () => {
    expect(title(en)).toContain("TAIF");
    expect(title(ar)).toContain("طَيْف");
    expect(title(en)).not.toBe(title(ar));
  });

  it("descriptions are localized and non-empty", () => {
    const dEn = meta(en);
    const dAr = meta(ar);
    expect(dEn && dEn.length).toBeGreaterThan(20);
    expect(dAr && dAr.length).toBeGreaterThan(20);
    expect(dEn).not.toBe(dAr);
  });

  it("canonical is self-referencing per locale", () => {
    expect(canonical(en)).toBe(`${SITE}`);
    expect(canonical(ar)).toBe(`${SITE}ar`);
  });

  it("hreflang alternates are reciprocal on both pages with x-default", () => {
    const expected = [
      { hreflang: "en", href: `${SITE}` },
      { hreflang: "ar", href: `${SITE}ar` },
      { hreflang: "x-default", href: `${SITE}` },
    ];
    for (const html of [en, ar]) {
      for (const exp of expected) {
        const pattern = new RegExp(
          `<link\\s+rel="alternate"\\s+hreflang="${exp.hreflang}"\\s+href="${exp.href.replace(/[/]/g, "\\/")}"`,
        );
        expect(html, exp.hreflang).toMatch(pattern);
      }
    }
  });

  it("og:locale alternates are reciprocal", () => {
    expect(en).toMatch(/property="og:locale" content="en_US"/);
    expect(en).toMatch(/property="og:locale:alternate" content="ar"/);
    expect(ar).toMatch(/property="og:locale" content="ar"/);
    expect(ar).toMatch(/property="og:locale:alternate" content="en_US"/);
  });

  it("og:image points at the locale OG image only when SITE_URL is set", () => {
    expect(en).toMatch(/property="og:image" content="https:\/\/example\.invalid\/og-en\.png"/);
    expect(ar).toMatch(/property="og:image" content="https:\/\/example\.invalid\/og-ar\.png"/);
  });

  it("JSON-LD SoftwareApplication contains only verified fields", () => {
    const jsonLd = en.match(
      /<script type="application\/ld\+json">([^<]*)<\/script>/,
    )?.[1];
    expect(jsonLd).toBeTruthy();
    const obj = JSON.parse(jsonLd!) as Record<string, unknown>;
    expect(obj["@type"]).toBe("SoftwareApplication");
    expect(obj.name).toBe("TAIF");
    expect(obj.applicationCategory).toBeTruthy();
    expect(obj.license).toBe("GPL-3.0");
    expect(String(obj.operatingSystem)).toMatch(/Windows/i);
    expect(String(obj.operatingSystem)).toMatch(/Linux/i);
    expect(String(obj.operatingSystem)).toMatch(/Android/i);
    // Only verified fields — never ratings or prices.
    expect(obj).not.toHaveProperty("aggregateRating");
    expect(obj).not.toHaveProperty("offers");
    // No absolute URL in JSON-LD unless SITE_URL was used for canonical only.
    const serialized = JSON.stringify(obj);
    expect(serialized).not.toMatch(/"url"/);
  });
  it("sitemap lists clean locale URLs with xhtml alternates", () => {
    const indexRel = "sitemap-index.xml";
    let xml = "";
    if (existsSync(join(ROOT, "dist", indexRel))) {
      const index = distFile(indexRel);
      const child = index.match(/<loc>([^<]*sitemap-\d+\.xml)<\/loc>/)?.[1];
      if (child) xml = distFile(new URL(child).pathname.replace(/^\//, ""));
    }
    if (!xml) xml = distFile("sitemap-0.xml");
    // T092: xhtml:link alternates for both locales.
    expect(xml).toContain("xhtml:link");
    expect(xml).toContain('href="https://example.invalid/"');
    expect(xml).toContain('href="https://example.invalid/ar"');
    // T093: clean URLs, no trailing slash on the Arabic page.
    expect(xml).not.toContain("https://example.invalid/ar/");
    // T094: fixture routes never enter the sitemap.
    expect(xml).not.toContain("showcase-test");
  });
});
describe("SEO without SITE_URL", () => {
  it("local build emits NO absolute canonical/hreflang/og:url, then restores", async () => {
    // Build (2): plain local build without SITE_URL (CI forced off).
    const plain = runBuild({ CI: "" });
    expect(plain.status, plain.stderr).toBe(0);
    const plainEn = distFile("index.html");
    expect(plainEn).not.toMatch(/rel="canonical"/);
    expect(plainEn).not.toMatch(/rel="alternate"/);
    expect(plainEn).not.toMatch(/property="og:url"/);
    expect(plainEn).not.toMatch(/content="https?:\/\//);
    // Restore the SITE_URL build so subsequent e2e runs serve absolute tags.
    const restore = runBuild({ SITE_URL: SITE });
    expect(restore.status, restore.stderr).toBe(0);
    expect(distFile("index.html")).toMatch(/rel="canonical"/);
  }, 600_000);

  it("CI production build without SITE_URL fails with the documented error", async () => {
    const res = runBuild({ CI: "1", NODE_ENV: "production", VERCEL: undefined });
    expect(res.status).not.toBe(0);
    expect(res.stderr).toMatch(/SITE_URL is required for production builds/);
  }, 600_000);
});
