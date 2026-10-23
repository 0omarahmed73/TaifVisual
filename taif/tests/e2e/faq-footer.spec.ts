/**
 * US5 e2e (T062): FAQ toggling with the keyboard and the footer link set.
 * run: npm run test:e2e -- faq-footer
 */
import { test, expect } from "@playwright/test";

const V_LINK_PREFIXES = [
  "https://github.com/0omarahmed73/TaifVisual", // repo, releases, LICENSE blob
  "https://www.omarasaeed.dev/",
  "https://github.com/0omarahmed73",
  "https://linkedin.com/in/0omarahmed73",
];

for (const path of ["/", "/ar"]) {
  test.describe(`faq + footer (${path})`, () => {
    test("FAQ items toggle with Enter and Space", async ({ page }) => {
      await page.goto(path);
      const summary = page.locator("#faq details summary").first();
      const details = page.locator("#faq details").first();
      await summary.focus();
      await expect(details).not.toHaveAttribute("open");
      await page.keyboard.press("Enter");
      await expect(details).toHaveAttribute("open");
      await page.keyboard.press("Enter");
      await expect(details).not.toHaveAttribute("open");
      await page.keyboard.press("Space");
      await expect(details).toHaveAttribute("open");
      await page.keyboard.press("Escape");
      // Native details/summary: Escape is a no-op, state stays open.
      await expect(details).toHaveAttribute("open");
      await expect(page.locator("#faq details")).toHaveCount(7);
    });

    test("footer links are only verified links or in-page anchors", async ({
      page,
    }) => {
      await page.goto(path);
      const footer = page.locator("footer");
      const hrefs = await footer.locator("a").evaluateAll((anchors) =>
        anchors.map((a) => (a as HTMLAnchorElement).getAttribute("href")),
      );
      expect(hrefs.length).toBeGreaterThan(4);
      for (const href of hrefs) {
        if (href?.startsWith("#")) continue; // in-page anchor
        if (href === "/" || href === "/ar") continue; // language switch
        expect(
          V_LINK_PREFIXES.some((prefix) => href?.startsWith(prefix)),
          `unexpected footer link ${href}`,
        ).toBe(true);
      }
      // External links open safely.
      const external = await footer
        .locator('a[href^="https://"]')
        .evaluateAll((anchors) =>
          anchors.map((a) => (a as HTMLAnchorElement).getAttribute("rel")),
        );
      for (const rel of external) {
        expect(rel).toMatch(/noopener/);
      }
    });

    test("footer has a language switch to the other locale", async ({ page }) => {
      await page.goto(path);
      const target = path === "/" ? "ar" : "en";
      const footerSwitch = page.locator("footer").locator(`a[data-lang-switch="${target}"]`);
      await expect(footerSwitch).toHaveCount(1);
      await expect(footerSwitch).toHaveAttribute("hreflang", target);
    });
  });
}
