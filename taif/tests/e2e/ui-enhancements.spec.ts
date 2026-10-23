import { expect, test } from "@playwright/test";
import { readFileSync } from "node:fs";

const releases = readFileSync("tests/fixtures/github/release-full.json", "utf8");
const windowsUa =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36";

test.describe("hero download button", () => {
  test.use({ userAgent: windowsUa });

  test("links straight to the validated asset for the visitor's platform", async ({ page }) => {
    await page.route("https://api.github.com/**", (route) =>
      route.fulfill({ status: 200, contentType: "application/json", body: releases }),
    );
    await page.goto("/");
    const button = page.getByTestId("hero-download");
    await expect(button).toBeVisible();
    await expect(button).toContainText("Windows");
    await expect(button).toHaveAttribute(
      "href",
      /^https:\/\/github\.com\/0omarahmed73\/TaifVisual\/releases\/download\/.+\.msi$/,
    );
  });

  test("falls back to the download center link when GitHub fails", async ({ page }) => {
    await page.route("https://api.github.com/**", (route) => route.abort());
    await page.goto("/");
    await expect(page.locator('#hero a[href$="#downloads"]')).toBeVisible();
    await expect(page.getByTestId("hero-download")).toHaveCount(0);
  });
});

test("showcase tabs show one group at a time", async ({ page }) => {
  await page.goto("/");
  const desktop = page.locator('[data-showcase-panel="desktop"]');
  const android = page.locator('[data-showcase-panel="android"]');
  await expect(desktop).toBeVisible();
  await expect(android).toBeHidden();
  await page.getByRole("tab", { name: "Android" }).click();
  await expect(android).toBeVisible();
  await expect(desktop).toBeHidden();
});
