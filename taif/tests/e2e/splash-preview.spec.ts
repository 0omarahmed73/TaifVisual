/**
 * Hero splash preview e2e (US2): decorative, accessible-hidden recreation of
 * the app launch splash. It must never introduce focus targets or duplicate
 * the page's accessible name.
 *
 * run: npx playwright test splash-preview
 */
import { expect, test } from "@playwright/test";

for (const path of ["/", "/ar"] as const) {
  test(`hero shows the app splash preview (${path})`, async ({ page }) => {
    await page.goto(path);
    const preview = page.getByTestId("splash-preview");
    await expect(preview).toBeVisible();
    await expect(page.locator("#hero").getByTestId("splash-preview")).toHaveCount(1);

    // Decorative-only: duplicated brand text must stay out of the a11y tree.
    await expect(preview).toHaveAttribute("aria-hidden", "true");
    await expect(preview).toContainText("TAIF");
    await expect(preview).toContainText("طَيْف");

    // No focusable elements inside the preview frame.
    await expect(
      preview.locator(
        "a, button, input, select, textarea, [tabindex]:not([tabindex='-1'])",
      ),
    ).toHaveCount(0);

    // The spectral progress line is present.
    await expect(preview.locator(".splash-preview-progress")).toHaveCount(1);
  });
}
