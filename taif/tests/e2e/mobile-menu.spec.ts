import { expect, test } from "@playwright/test";

/**
 * Mobile menu behaviour (T048): opens from the header button, closes on a
 * link tap, on Escape, and — the owner-reported bug — on any pointer press
 * outside the panel, including elements underneath the overlay.
 */
test.describe("mobile menu", () => {
  test.use({ viewport: { width: 375, height: 720 } });

  test("closes when tapping outside the panel", async ({ page }) => {
    await page.goto("/");
    const button = page.locator("#menu-button");
    const nav = page.locator("#site-nav");

    await button.click();
    await expect(button).toHaveAttribute("aria-expanded", "true");
    await expect(nav).toBeVisible();

    // Press on the lower part of the hero heading: below the open panel, outside the toggle.
    await page.locator("#hero h1").click({ position: { x: 10, y: 110 } });

    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(nav).toBeHidden();
  });

  test("closes on Escape and returns focus to the button", async ({
    page,
  }) => {
    await page.goto("/");
    const button = page.locator("#menu-button");
    await button.click();
    await expect(page.locator("#site-nav")).toBeVisible();

    await page.keyboard.press("Escape");

    await expect(button).toHaveAttribute("aria-expanded", "false");
    await expect(button).toBeFocused();
  });

  test("closes after choosing a section link", async ({ page }) => {
    await page.goto("/");
    const button = page.locator("#menu-button");
    await button.click();

    await page.locator("#site-nav a").first().click();

    await expect(button).toHaveAttribute("aria-expanded", "false");
  });
});
