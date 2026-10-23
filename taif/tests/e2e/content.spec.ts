/**
 * US2 e2e (T039): FR-001 section order and the showcase contract.
 * run: npm run test:e2e -- content
 *
 * `showcase-test` renders the declared test-only screenshot fixture from
 * src/content/screenshots.ts (E2E_TEST_SCREENSHOT) via a test-only route; its image request is
 * fulfilled via page.route so no binary asset is needed.
 */
import { test, expect } from "@playwright/test";

const SECTION_ORDER = [
  "hero",
  "showcase",
  "features",
  "how-it-works",
  "downloads",
  "about",
  "developer",
  "faq",
];

const PAGE_PATHS = ["/", "/ar"];

const FIXTURE_URLS: Record<string, string> = {
  "/": "/showcase-test",
  "/ar": "/ar/showcase-test",
};

const EMPTY_FIXTURE_URLS: Record<string, string> = {
  "/": "/showcase-test-empty",
  "/ar": "/ar/showcase-test-empty",
};

for (const path of PAGE_PATHS) {
  test.describe(`content (${path})`, () => {
    test("sections render in the FR-001 order", async ({ page }) => {
      await page.goto(path);
      const ids = await page
        .locator("main > section")
        .evaluateAll((sections) =>
          sections.map((section) => (section as HTMLElement).id),
        );
      expect(ids.filter((id) => id.length > 0)).toEqual(SECTION_ORDER);
    });

    test("shipped real screenshots render as figures with dimensions, alt and lazy loading", async ({
      page,
    }) => {
      await page.goto(path);
      const showcase = page.locator("#showcase");
      const imgs = showcase.locator("figure img");
      const count = await imgs.count();
      // The manifest ships genuine captures (taif/src/content/screenshots.ts).
      expect(count).toBeGreaterThanOrEqual(6);
      const first = imgs.first();
      await expect(first).toHaveAttribute("loading", "lazy");
      await expect(first).toHaveAttribute("decoding", "async");
      const alt = await first.getAttribute("alt");
      expect(alt && alt.length > 0).toBe(true);
      const sized = await first.evaluate((el) =>
        el.getAttribute("width") !== null && el.getAttribute("height") !== null,
      );
      expect(sized).toBe(true);
    });

    test("declared test manifest entry renders img with dimensions, alt and lazy loading", async ({
      page,
    }) => {
      await page.goto(FIXTURE_URLS[path]);
      const img = page.locator("#showcase img");
      await expect(img).toHaveCount(1);
      await expect(img).toHaveAttribute("width", "640");
      await expect(img).toHaveAttribute("height", "400");
      await expect(img).toHaveAttribute("loading", "lazy");
      await expect(img).toHaveAttribute("decoding", "async");
      const alt = await img.getAttribute("alt");
      expect(alt && alt.length > 0).toBe(true);
      // T094: the fixture PNG really ships (no routed placeholder).
      const loaded = await img.evaluate(
        (el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth > 0,
      );
      expect(loaded).toBe(true);
      // T094: test-only route carries noindex.
      await expect(page.locator('meta[name="robots"]')).toHaveAttribute(
        "content",
        /noindex/,
      );
    });

    test("empty manifest shows the localized coming-soon notice", async ({ page }) => {
      // T095: the empty-manifest path stays covered via a static fixture route.
      await page.goto(EMPTY_FIXTURE_URLS[path]);
      await expect(page.locator("#showcase img")).toHaveCount(0);
      await expect(page.locator("#showcase")).toContainText(
        path === "/ar" ? "ستتوفر لقطات الشاشة قريبًا" : "Screenshots are coming soon",
      );
    });
  });
}
