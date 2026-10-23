/**
 * Sticky-header anchor offset (UX polish).
 *
 * The header is sticky, so every in-page anchor must land below it. The
 * sections carry `scroll-mt-[84px]`; this spec checks the rendered result at
 * phone and desktop widths in both locales, and that smooth scrolling is on.
 *
 * run: npx playwright test anchor-offset
 */
import { expect, test, type Page } from "@playwright/test";

const PROJECTS = ["chromium-375", "chromium-1280"];
const PAGES = ["/", "/ar"] as const;
const ANCHORS = ["features", "downloads"] as const;

function runOn(...projects: string[]): void {
  test.skip(
    () => !projects.includes(test.info().project.name),
    `runs only on ${projects.join(", ")}`,
  );
}

async function headerHeight(page: Page): Promise<number> {
  const box = await page.locator("header").boundingBox();
  return box?.height ?? 0;
}

test.describe("sticky header anchor offset", () => {
  runOn(...PROJECTS);

  for (const path of PAGES) {
    for (const anchor of ANCHORS) {
      test(`${path}#${anchor} heading lands below the sticky header`, async ({ page }) => {
        await page.goto(`${path}#${anchor}`);

        const heading = page.locator(`#${anchor} h2`).first();
        await expect(heading).toBeVisible();

        // The section itself must clear the sticky header (proving the scroll
        // margin took effect), and the heading must be fully visible below it.
        await expect
          .poll(
            async () => {
              const chrome = await headerHeight(page);
              const sectionBox = await page.locator(`#${anchor}`).boundingBox();
              const box = await heading.boundingBox();
              if (!sectionBox || !box) return false;
              return sectionBox.y >= chrome + 8 && box.y >= chrome;
            },
            { message: `#${anchor} heading hidden under the sticky header`, timeout: 5000 },
          )
          .toBe(true);

        const behavior = await page
          .locator("html")
          .evaluate((el) => getComputedStyle(el).scrollBehavior);
        expect(behavior).toBe("smooth");
      });
    }
  }
});
