import { expect, test } from "@playwright/test";

// T100 (FR-034): every external link on both locales opens safely over https.
for (const path of ["/", "/ar"]) {
  test(`external links on ${path} use https and rel=noopener noreferrer`, async ({ page }) => {
    await page.goto(path);
    const links = await page.locator('a[href^="http"]').evaluateAll((els) =>
      els.map((a) => ({ href: a.getAttribute("href") ?? "", rel: a.getAttribute("rel") ?? "" })),
    );
    expect(links.length).toBeGreaterThan(0);
    for (const { href, rel } of links) {
      expect(href, href).toMatch(/^https:\/\//);
      expect(rel, href).toContain("noopener");
      expect(rel, href).toContain("noreferrer");
    }
  });
}
