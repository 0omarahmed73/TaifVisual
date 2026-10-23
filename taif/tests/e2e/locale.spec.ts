/**
 * US3 e2e (T051): locale routing/switching contract per
 * contracts/locale-routing.md.
 * run: npm run test:e2e -- locale
 *
 * Runs only on the 1280 reduced-motion-free projects would triple the work;
 * instead each project runs it (they differ only in viewport), which also
 * re-checks the switch at every width.
 */
import { test, expect, type Page } from "@playwright/test";

const LANG_KEY = "taif.lang";

async function switchToOtherLocale(page: Page, targetLang: string): Promise<void> {
  const dropdown = page.locator("details[data-lang-dropdown]").first();
  const isOpen = await dropdown.evaluate((el) => el.hasAttribute("open"));
  if (!isOpen) {
    await dropdown.locator("summary").click();
  }
  const link = dropdown.locator(`a[data-lang-switch="${targetLang}"]`).first();
  await link.click();
}

test.describe("locale routing (T051)", () => {
  test("English home has lang=en, dir=ltr", async ({ page }) => {
    await page.goto("/");
    const attrs = await page.locator("html").evaluate((html) => ({
      lang: html.getAttribute("lang"),
      dir: html.getAttribute("dir"),
    }));
    expect(attrs).toEqual({ lang: "en", dir: "ltr" });
  });

  test("Arabic home has lang=ar, dir=rtl", async ({ page }) => {
    const res = await page.goto("/ar");
    expect(res?.status()).toBe(200);
    const attrs = await page.locator("html").evaluate((html) => ({
      lang: html.getAttribute("lang"),
      dir: html.getAttribute("dir"),
    }));
    expect(attrs).toEqual({ lang: "ar", dir: "rtl" });

    const resSlash = await page.goto("/ar/#downloads");
    expect(resSlash?.status()).toBe(200);
    await expect(page.locator("#downloads")).toBeVisible();
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("switching keeps the URL hash", async ({ page }) => {
    await page.goto("/#downloads");
    await expect(page.locator("#downloads")).toBeVisible();
    await switchToOtherLocale(page, "ar");
    await expect(page).toHaveURL(/\/ar\/?#downloads$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");

    await switchToOtherLocale(page, "en");
    await expect(page).toHaveURL(/\/#downloads$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "ltr");
  });

  test("taif.lang=ar persists: visiting / lands on /ar/", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(([key]) => window.localStorage.setItem(key, "ar"), [LANG_KEY]);
    await page.goto("/");
    await expect(page).toHaveURL(/\/ar\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });

  test("Accept-Language: ar on first visit still stays on English /", async ({ browser }) => {
    const context = await browser.newContext({
      extraHTTPHeaders: { "Accept-Language": "ar,ar-SA;q=0.9" },
    });
    const page = await context.newPage();
    await page.goto("/");
    // No Accept-Language logic: the default locale page is served.
    await expect(page).toHaveURL(/^https?:\/\/[^/]+\/(\?.*)?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await context.close();
  });

  test("blocked localStorage still allows switching", async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new Error("localStorage blocked");
        },
      });
    });
    await page.goto("/");
    await switchToOtherLocale(page, "ar");
    await expect(page).toHaveURL(/\/ar\/?$/);
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("/ar/ never redirects (no chained locale redirect)", async ({ page }) => {
    await page.goto("/ar");
    await page.waitForTimeout(500);
    await expect(page).toHaveURL(/\/ar\/?$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
  });
});
