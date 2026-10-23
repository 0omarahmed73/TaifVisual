/**
 * Showcase lightbox e2e: open/enlarge, keyboard navigation, focus return,
 * backdrop dismissal, RTL locale support, mobile overflow and axe cleanliness.
 *
 * run: npx playwright test showcase-lightbox
 */
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

const DESKTOP = "chromium-1280";
const PHONE = "chromium-375";

function runOn(...projects: string[]): void {
  test.skip(
    () => !projects.includes(test.info().project.name),
    `runs only on ${projects.join(", ")}`,
  );
}

const LOCALES = ["/", "/ar"] as const;

function dialogFor(page: Page) {
  return page.locator("[data-showcase-lightbox]");
}

function triggersFor(page: Page) {
  return page.locator("#showcase [data-showcase-trigger]");
}

function lightboxImage(page: Page) {
  return page.locator("[data-lightbox-image]");
}

async function openFirst(page: Page): Promise<void> {
  const trigger = triggersFor(page).first();
  await trigger.scrollIntoViewIfNeeded();
  await trigger.click();
  await expect(dialogFor(page)).toBeVisible();
}

test.describe("showcase lightbox", () => {
  runOn(DESKTOP);

  for (const path of LOCALES) {
    test(`opens on click and shows an enlarged, captioned image (${path})`, async ({
      page,
    }) => {
      await page.goto(path);
      // The last screenshot lives in the Android group, hidden until its tab is chosen.
      await page.getByRole("tab").last().click();
      const trigger = triggersFor(page).last();
      await trigger.scrollIntoViewIfNeeded();
      const thumbBox = await trigger.locator("img").boundingBox();
      const alt = await trigger.locator("img").getAttribute("alt");

      await trigger.click();
      const dialog = dialogFor(page);
      await expect(dialog).toBeVisible();
      await expect(dialog).toHaveAttribute("aria-modal", "true");
      await expect(dialog).toHaveAttribute("aria-label", /.+/);

      const image = lightboxImage(page);
      await expect(image).toBeVisible();
      await expect(image).toHaveAttribute("src", /\/screenshots\/.+\.webp$/);
      await expect(page.locator("[data-lightbox-caption]")).toHaveText(alt ?? "");

      const largeBox = await image.boundingBox();
      expect(thumbBox).not.toBeNull();
      expect(largeBox).not.toBeNull();
      expect(largeBox!.width).toBeGreaterThan(thumbBox!.width);

      // >1 real screenshot → both navigation buttons are present and labelled.
      await expect(page.locator("[data-lightbox-prev]")).toBeVisible();
      await expect(page.locator("[data-lightbox-next]")).toBeVisible();
      await expect(page.locator("[data-lightbox-prev]")).toHaveAttribute(
        "aria-label",
        /.+/,
      );
      await expect(page.locator("[data-lightbox-next]")).toHaveAttribute(
        "aria-label",
        /.+/,
      );
    });

    test(`Escape closes and returns focus to the trigger (${path})`, async ({ page }) => {
      await page.goto(path);
      const trigger = triggersFor(page).first();
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      await expect(dialogFor(page)).toBeVisible();
      await expect(page.locator("[data-lightbox-close]")).toBeFocused();

      await page.keyboard.press("Escape");
      await expect(dialogFor(page)).toBeHidden();
      await expect(trigger).toBeFocused();
    });

    test(`arrow keys and buttons navigate without leaving the dialog (${path})`, async ({
      page,
    }) => {
      await page.goto(path);
      await openFirst(page);
      const image = lightboxImage(page);
      const firstSrc = await image.getAttribute("src");

      await page.keyboard.press("ArrowLeft");
      await expect
        .poll(() => image.getAttribute("src"), { message: "ArrowLeft changes image" })
        .not.toBe(firstSrc);

      await page.keyboard.press("ArrowRight");
      await expect
        .poll(() => image.getAttribute("src"), { message: "ArrowRight returns" })
        .toBe(firstSrc);

      await page.locator("[data-lightbox-next]").click();
      await expect
        .poll(() => image.getAttribute("src"), { message: "next button changes image" })
        .not.toBe(firstSrc);

      await page.locator("[data-lightbox-prev]").click();
      await expect
        .poll(() => image.getAttribute("src"), { message: "previous button returns" })
        .toBe(firstSrc);
    });

    test(`clicking the backdrop closes the dialog (${path})`, async ({ page }) => {
      await page.goto(path);
      await openFirst(page);
      await page.mouse.click(5, 5);
      await expect(dialogFor(page)).toBeHidden();
    });
  }

  test("a single-image manifest renders no prev/next controls", async ({ page }) => {
    await page.goto("/showcase-test");
    await expect(page.locator("#showcase [data-showcase-trigger]")).toHaveCount(1);
    await expect(page.locator("[data-lightbox-prev]")).toHaveCount(0);
    await expect(page.locator("[data-lightbox-next]")).toHaveCount(0);
  });

  for (const mode of ["light", "dark"] as const) {
    test(`axe finds no critical/serious violations with the dialog open (${mode})`, async ({
      page,
    }) => {
      await page.goto("/");
      await page.getByTestId("download-center").waitFor();
      await page.waitForFunction(
        () =>
          document
            .querySelector('[data-testid="download-center"]')
            ?.getAttribute("data-state") !== "loading",
      );
      await page.evaluate((theme) => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.documentElement.style.colorScheme = theme;
      }, mode);
      await openFirst(page);
      await page.waitForTimeout(300);
      const results = await new AxeBuilder({ page }).analyze();
      const violations = results.violations
        .filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))
        .map(
          (violation) =>
            `${violation.id} (${violation.impact}): ${violation.nodes
              .map((node) => node.html)
              .join(" | ")}`,
        );
      expect(violations).toEqual([]);
    });
  }
});

test.describe("showcase lightbox at 375px", () => {
  runOn(PHONE);

  for (const path of LOCALES) {
    test(`no horizontal overflow while open or closed (${path})`, async ({ page }) => {
      await page.goto(path);
      await openFirst(page);

      const viewport = page.viewportSize();
      expect(viewport).not.toBeNull();

      const openOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(openOverflow, "overflow while dialog is open").toBeLessThanOrEqual(0);

      const box = await lightboxImage(page).boundingBox();
      expect(box).not.toBeNull();
      expect(box!.x).toBeGreaterThanOrEqual(0);
      expect(box!.y).toBeGreaterThanOrEqual(0);
      expect(box!.width).toBeLessThanOrEqual(viewport!.width);
      expect(box!.height).toBeLessThanOrEqual(viewport!.height);

      await page.keyboard.press("Escape");
      await expect(dialogFor(page)).toBeHidden();
      const closedOverflow = await page.evaluate(
        () => document.documentElement.scrollWidth - window.innerWidth,
      );
      expect(closedOverflow, "overflow after dialog closes").toBeLessThanOrEqual(0);
    });
  }
});
