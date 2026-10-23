/**
 * Vitest global setup (SEO task T067 support): ensure a built dist/ exists
 * with the SITE_URL rehearsal values before any spec that parses built HTML
 * runs (developer.test.ts, seo.test.ts). Rebuilt when missing/stale.
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const SITE = "https://example.invalid/";

export default function globalSetup(): void {
  const html = join(process.cwd(), "dist/index.html");
  const needsBuild =
    !existsSync(html) ||
    !readFileSync(html, "utf8").includes('href="https://example.invalid/"');
  if (needsBuild) {
    execFileSync("npx", ["astro", "build"], {
      cwd: process.cwd(),
      env: { ...process.env, SITE_URL: SITE },
      stdio: "inherit",
      timeout: 300_000,
    });
  }
}
