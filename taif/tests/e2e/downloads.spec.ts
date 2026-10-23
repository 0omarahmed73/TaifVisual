import { readFileSync } from "node:fs";
import { expect, test, type Page } from "@playwright/test";

/** Fixture JSON as a string, for network-layer mocking. */
function fixture(name: string): string {
  return readFileSync(new URL(`../fixtures/github/${name}`, import.meta.url), "utf8");
}

const rateLimit = JSON.parse(fixture("rate-limit-headers.json")) as {
  status: number;
  headers: Record<string, string>;
};

/** Serve a GitHub-API stub for the given page. */
async function mockGithub(page: Page, handler: Parameters<Page["route"]>[1]): Promise<void> {
  await page.route("https://api.github.com/**", handler);
}

const fullPath = "release-full.json";
const DOWNLOAD_PREFIX = "https://github.com/0omarahmed73/TaifVisual/releases/download/";
const CACHE_KEY = "taif.releases.v1";

/** A schema-valid cached release derived from the full fixture. */
function cachedEntry(fetchedAt: number): unknown {
  const release = JSON.parse(fixture(fullPath))[0] as {
    tag_name: string;
    name: string | null;
    published_at: string;
    html_url: string;
    body: string;
    assets: { name: string; size: number; browser_download_url: string }[];
  };
  return {
    fetchedAt,
    release: {
      tag: release.tag_name,
      name: release.name,
      publishedAt: release.published_at,
      url: release.html_url,
      notes: release.body,
      assets: release.assets
        .filter((asset) => /\.(msi|deb|apk)$/i.test(asset.name))
        .map((asset) => ({
          fileName: asset.name,
          sizeBytes: asset.size,
          downloadUrl: asset.browser_download_url,
        })),
    },
  };
}

/** Seed localStorage before any page script runs. */
async function seedCache(page: Page, fetchedAt: number): Promise<void> {
  await page.addInitScript(
    ([key, value]) => window.localStorage.setItem(key, value),
    [CACHE_KEY, JSON.stringify(cachedEntry(fetchedAt))],
  );
}

test.describe("download center", () => {
  test("renders ready state with platform cards and validates every link", async ({ page }) => {
    await mockGithub(page, (route) => route.fulfill({ body: fixture(fullPath) }));
    await page.goto("/");
    const center = page.getByTestId("download-center");
    await expect(center).toHaveAttribute("data-state", "ready");

    const buttons = page.getByTestId("download-button");
    await expect(buttons).toHaveCount(4);
    const assetUrls = JSON.parse(fixture(fullPath)).map((release: { assets: { browser_download_url: string }[] }) =>
      release.assets.map((asset) => asset.browser_download_url),
    )[0] as string[];
    // Link audit: each href equals a validated asset URL.
    const hrefs = await buttons.evaluateAll((nodes) => nodes.map((node) => (node as HTMLAnchorElement).href));
    expect(hrefs.length).toBeGreaterThan(0);
    for (const href of hrefs) {
      expect(assetUrls).toContain(href);
      expect(href.startsWith(DOWNLOAD_PREFIX)).toBe(true);
    }
    expect(page.getByTestId("platform-android")).toHaveAttribute("data-status", "available");
  });

  test("renders the localized package type for every asset (T081)", async ({ page }) => {
    await mockGithub(page, (route) => route.fulfill({ body: fixture(fullPath) }));
    await page.goto("/");
    await expect(page.getByTestId("download-center")).toHaveAttribute("data-state", "ready");
    const labels = page.getByTestId("package-type");
    await expect(labels).toHaveCount(4);
    await expect(labels.filter({ hasText: "Installer" })).toHaveCount(1);
    await expect(labels.filter({ hasText: "Debian package" })).toHaveCount(1);
    await expect(labels.filter({ hasText: "APK" })).toHaveCount(2);
  });

  test("multiple APKs keep arch tokens visible and show guidance (T089)", async ({ page }) => {
    await mockGithub(page, (route) => route.fulfill({ body: fixture(fullPath) }));
    await page.goto("/");
    const android = page.getByTestId("platform-android");
    await expect(android.getByTestId("asset-arch")).toContainText("arm64-v8a");
    await expect(android.getByTestId("android-arch-guidance")).toContainText(
      "arm64-v8a",
    );
  });

  test("fresh cache still shows the suggested badge (T086)", async ({ page }) => {
    await seedCache(page, Date.now() - 60_000);
    await mockGithub(page, (route) => route.abort("failed"));
    await page.goto("/");
    const center = page.getByTestId("download-center");
    await expect(center).toHaveAttribute("data-state", "ready");
    await expect(center).toHaveAttribute("data-stale", "false");
    // Desktop Chrome device UA is Windows, so the Windows card is suggested
    // without a network call; assert exactly one suggested card exists.
    await expect(
      page.getByTestId("download-center").getByText("Suggested for your device"),
    ).toHaveCount(1);
  });

  test("stale cache shows retry and releases link in any status (T083)", async ({ page }) => {
    await seedCache(page, Date.now() - 2 * 24 * 60 * 60 * 1000);
    await mockGithub(page, (route) => route.abort("failed"));
    await page.goto("/");
    const center = page.getByTestId("download-center");
    await expect(center).toHaveAttribute("data-state", "ready");
    await expect(center).toHaveAttribute("data-stale", "true");
    const fallback = page.getByTestId("download-fallback");
    await expect(fallback).toHaveAttribute("data-stale", "true");
    await expect(fallback.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(
      fallback.getByRole("link", { name: /releases on GitHub/i }),
    ).toBeVisible();
    // T090: cached data wording, actual last-checked date, no week claim.
    await expect(center).toContainText("cached copy");
    await expect(center).toContainText("Last checked");
    await expect(center).not.toContainText("more than a week");
  });

  test("release notes are marked English and the ready state always links both release destinations (T084, T087)", async ({
    page,
  }) => {
    await mockGithub(page, (route) => route.fulfill({ body: fixture(fullPath) }));
    await page.goto("/");
    const details = page.locator("#downloads details");
    await details.locator("summary").click();
    const notes = page.getByTestId("release-notes");
    await expect(notes).toHaveAttribute("lang", "en");
    await expect(notes).toHaveAttribute("dir", "ltr");
    await expect(page.getByTestId("notes-language")).toContainText(
      "written in English",
    );
    const releaseLink = page.getByTestId("release-page-link");
    await expect(releaseLink).toHaveText("Release page");
    await expect(releaseLink).toHaveAttribute(
      "href",
      "https://github.com/0omarahmed73/TaifVisual/releases/tag/v1.2.0",
    );
    const allRelease = page.getByTestId("all-releases").getByRole("link");
    await expect(allRelease).toHaveText(/All releases on GitHub/);
    await expect(allRelease).toHaveAttribute(
      "href",
      "https://github.com/0omarahmed73/TaifVisual/releases",
    );
  });

  test("Arabic release notes carry English lang/direction and a localized notice (T084)", async ({
    page,
  }) => {
    await mockGithub(page, (route) => route.fulfill({ body: fixture(fullPath) }));
    await page.goto("/ar");
    const details = page.locator("#downloads details");
    await details.locator("summary").click();
    await expect(page.getByTestId("release-notes")).toHaveAttribute("lang", "en");
    await expect(page.getByTestId("release-notes")).toHaveAttribute("dir", "ltr");
    await expect(page.getByTestId("notes-language")).toContainText(
      "مكتوبة بالإنجليزية",
    );
    await expect(page.getByTestId("release-page-link")).toHaveText(
      "صفحة الإصدار",
    );
  });

  test("hostile release notes render as text nodes only", async ({ page }) => {
    await mockGithub(page, (route) => route.fulfill({ body: fixture("hostile-notes.json") }));
    await page.goto("/");
    // Only the .msi maps → some platforms missing → partial, still with buttons.
    await expect(page.getByTestId("download-center")).toHaveAttribute("data-state", "partial");
    await expect(page.getByTestId("download-button")).toHaveCount(1);
    const details = page.locator("#downloads details");
    await expect(details).toBeVisible();
    // No script/img/link element survives the notes; everything is text.
    expect(await details.locator("script").count()).toBe(0);
    expect(await details.locator("img").count()).toBe(0);
    expect(await details.locator("a[href^='javascript']").count()).toBe(0);
    // And the page body has no executing script injected by the notes.
    expect(await page.locator("#downloads details script").count()).toBe(0);
  });

  test("partial state: missing platforms show a message, no button", async ({ page }) => {
    await mockGithub(page, (route) => route.fulfill({ body: fixture("release-windows-only.json") }));
    await page.goto("/");
    const center = page.getByTestId("download-center");
    await expect(center).toHaveAttribute("data-state", "partial");
    await expect(page.getByTestId("platform-windows")).toHaveAttribute("data-status", "available");
    for (const platform of ["linux", "android"]) {
      const card = page.getByTestId(`platform-${platform}`);
      await expect(card).toHaveAttribute("data-status", "unavailable");
      await expect(card.getByText("Not included in this release.")).toBeVisible();
      expect(await card.getByTestId("download-button").count()).toBe(0);
    }
    await expect(page.getByTestId("download-fallback")).toBeVisible();
  });

  for (const [fixtureName, state] of [
    ["empty.json", "no-release"],
    ["only-draft.json", "no-release"],
    ["only-prerelease.json", "no-release"],
    ["malformed-shape.json", "error"],
  ] as const) {
    test(`honest degraded state for ${fixtureName}`, async ({ page }) => {
      await mockGithub(page, (route) => route.fulfill({ body: fixture(fixtureName) }));
      await page.goto("/");
      await expect(page.getByTestId("download-center")).toHaveAttribute("data-state", state);
      expect(await page.getByTestId("download-button").count()).toBe(0);
      // Releases-page fallback link on every failure state.
      const fallback = page.getByTestId("download-fallback");
      await expect(fallback).toBeVisible();
      await expect(fallback.getByRole("link", { name: /releases on GitHub/i })).toBeVisible();
    });
  }

  test("rate-limit error with reset time and working retry", async ({ page }) => {
    let calls = 0;
    await mockGithub(page, (route) => {
      calls += 1;
      if (calls === 1) {
        return route.fulfill({
          status: rateLimit.status,
          headers: rateLimit.headers,
          body: JSON.stringify({ message: "API rate limit exceeded for IP." }),
        });
      }
      // After retry the limit has passed.
      return route.fulfill({ body: fixture(fullPath) });
    });
    await page.goto("/");
    await expect(page.getByTestId("download-center")).toHaveAttribute("data-state", "error");
    await expect(page.getByTestId("rate-limit-reset")).toContainText(
      "GitHub rate limit resets at",
    );
    await page.getByRole("button", { name: "Retry" }).click();
    await expect(page.getByTestId("download-center")).toHaveAttribute("data-state", "ready");
    expect(calls).toBe(2);
  });

  test("http 5xx shows error with retry and Releases link", async ({ page }) => {
    await mockGithub(page, (route) =>
      route.fulfill({ status: 500, body: JSON.stringify({ message: "boom" }) }),
    );
    await page.goto("/");
    await expect(page.getByTestId("download-center")).toHaveAttribute("data-state", "error");
    await expect(page.getByRole("button", { name: "Retry" })).toBeVisible();
    await expect(page.getByTestId("download-fallback")).toContainText("All releases on GitHub");
  });

  test("timeout shows the timeout error message", async ({ page }) => {
    test.setTimeout(20_000);
    await mockGithub(page, async (route) => {
      // Delay beyond the 8 s client timeout → AbortError → timeout classification.
      await new Promise((resolve) => setTimeout(resolve, 8_600));
      await route.fulfill({ body: fixture(fullPath) });
    });
    await page.goto("/");
    await expect(page.getByTestId("download-center")).toHaveAttribute("data-state", "error", {
      timeout: 15_000,
    });
    await expect(page.getByTestId("download-status")).toContainText("took too long");
  });

  test("offline network failure shows the network message", async ({ page }) => {
    await mockGithub(page, (route) => route.abort("failed"));
    await page.goto("/");
    await expect(page.getByTestId("download-center")).toHaveAttribute("data-state", "error");
    await expect(page.getByTestId("download-status")).toContainText("could not reach GitHub");
  });

  test("invalid asset variants never yield buttons", async ({ page }) => {
    for (const name of ["zero-size-asset.json", "asset-not-uploaded.json", "bad-url-host.json"]) {
      await mockGithub(page, (route) => route.fulfill({ body: fixture(name) }));
      await page.goto("/");
      const buttons = page.getByTestId("download-button");
      await expect(buttons).toHaveCount(1); // only the surviving valid apk
      const href = await buttons.getAttribute("href");
      expect(href).toContain(DOWNLOAD_PREFIX);
    }
  });

  test("release metadata renders as text (version in bdi, size, date)", async ({ page }) => {
    await mockGithub(page, (route) => route.fulfill({ body: fixture(fullPath) }));
    await page.goto("/");
    await expect(page.locator("#downloads bdi").first()).toContainText("v1.2.0");
    await expect(page.locator("#downloads")).toContainText("MB");
    await expect(page.getByTestId("download-status")).toContainText("ready to download");
  });
});
