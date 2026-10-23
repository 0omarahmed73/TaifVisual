/**
 * US3 e2e (T052): visual RTL/LTR sanity. Captures full-page screenshots of
 * both locales in light and dark at whatever viewport each project defines
 * (375/768/1280) and asserts there is no horizontal overflow.
 * run: npm run test:e2e -- rtl-visual
 *
 * The screenshots themselves are reviewed MANUALLY (mirroring, overflow,
 * typography) — this file only asserts the mechanical no-scroll invariant and
 * produces the artifacts for that manual review.
 */
import { test, expect } from "@playwright/test";

for (const localePath of ["/", "/ar"]) {
  const locale = localePath.includes("/ar") ? "ar" : "en";
  for (const theme of ["light", "dark"] as const) {
    test(`no horizontal scroll: ${locale} ${theme}`, async ({
      page,
    }) => {
      await page.goto(localePath);
      if (theme === "dark") {
        await page.evaluate(() => document.documentElement.classList.add("dark"));
      } else {
        await page.evaluate(() => document.documentElement.classList.remove("dark"));
      }
      await page.waitForTimeout(300); // fonts/islands settle
      const overflow = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(
        overflow.scrollWidth,
        `${locale} ${theme}: horizontal overflow`,
      ).toBeLessThanOrEqual(overflow.innerWidth);
      await page.screenshot({
        fullPage: true,
        path: `test-results/rtl-visual/${locale}-${theme}-${viewportName()}.png`,
      });
    });
  }
}

function viewportName(): string {
  const width = test.info().project.use?.viewport?.width;
  return String(width ?? test.info().project.name);
}
