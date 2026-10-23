/**
 * T073: accessibility suite (Phase 9).
 * run: npm run test:e2e -- a11y
 *
 * - axe on / and /ar in light AND dark mode: zero critical/serious violations.
 * - Keyboard traversal reaches the mobile menu button, language switch,
 *   download buttons (with a mocked ready state) and the FAQ.
 * - Reduced-motion emulation yields zero *running* animations.
 *
 * Should a violation ever be silenced, an exception requires a written
 * justification next to the assertion — assertions are never weakened.
 */
import { readFileSync } from "node:fs";
import AxeBuilder from "@axe-core/playwright";
import { expect, test, type Page } from "@playwright/test";

function fixture(name: string): string {
  return readFileSync(new URL(`../fixtures/github/${name}`, import.meta.url), "utf8");
}

const REDUCED_PROJECT = "chromium-1280-reduced-motion";
const DESKTOP_PROJECT = "chromium-1280";

/** Run a test only on the named projects (keeps the suite off 4× duplication). */
function runOn(...projects: string[]): void {
  test.skip(
    () => !projects.includes(test.info().project.name),
    `runs only on ${projects.join(", ")}`,
  );
}

/** Stable marker for the currently focused element. */
const FOCUS_MARKER = `
  (el) => {
    if (!el || el === document.body) return null;
    const attrs = { id: el.id, testid: el.getAttribute('data-testid'), lang: el.getAttribute('data-lang-switch') };
    if (attrs.testid) return 'testid:' + attrs.testid;
    if (attrs.lang) return 'langswitch:' + attrs.lang;
    if (attrs.id) return 'id:' + attrs.id;
    return 'tag:' + el.tagName.toLowerCase();
  }
`;

/** Collect axe critical/serious impacts (dark mode forced via the app's class strategy). */
async function seriousViolations(a11yPage: Page, mode: "light" | "dark"): Promise<string[]> {
  if (mode === "dark") {
    await a11yPage.evaluate(() => {
      document.documentElement.classList.add("dark");
      document.documentElement.style.colorScheme = "dark";
    });
  } else {
    await a11yPage.evaluate(() => {
      document.documentElement.classList.remove("dark");
      document.documentElement.style.colorScheme = "light";
    });
  }
  const results = await new AxeBuilder({ page: a11yPage }).analyze();
  return results.violations
    .filter((violation) => ["critical", "serious"].includes(violation.impact ?? ""))
    .map(
      (violation) =>
        `${violation.id} (${violation.impact}): ${violation.nodes.map((n) => n.html).join(" | ")}`,
    );
}

test.describe("axe scans (light + dark, both locales)", () => {
  runOn(DESKTOP_PROJECT);

  for (const path of ["/", "/ar"]) {
    for (const mode of ["light", "dark"] as const) {
      test(`no critical/serious violations on ${path} (${mode})`, async ({ page }) => {
        await page.goto(path);
        await page.getByTestId("download-center").waitFor();
        // Never scan a page mid-hydration: wait for the download center to
        // leave `loading` and for styles/scripts to settle.
        await page
          .getByTestId("download-center")
          .waitFor({ state: "attached" });
        await page.waitForFunction(
          () => document.querySelector('[data-testid="download-center"]')?.getAttribute("data-state") !== "loading",
        );
        await page.evaluate(() => document.fonts.ready);
        await page.waitForTimeout(1500);
        const violations = await seriousViolations(page, mode);
        expect(violations).toEqual([]);
      });
    }
  }
});

/** Mock the GitHub API so the download center reaches the `ready` state deterministically. */
async function mockReadyRelease(page: Page): Promise<void> {
  await page.route("https://api.github.com/**", (route) =>
    route.fulfill({ body: fixture("release-full.json") }),
  );
}

test.describe("keyboard traversal", () => {
  runOn(DESKTOP_PROJECT);
  // The mobile menu button only exists below the md breakpoint; use a phone viewport.
  test.use({ viewport: { width: 375, height: 812 } });

  test("Tab order reaches menu, language switch, download buttons, FAQ", async ({ page }) => {
    await mockReadyRelease(page);
    await page.goto("/ar");
    await page.getByTestId("download-center").waitFor();
    await page.getByTestId("download-button").first().waitFor();

    const seen: string[] = [];
    for (let i = 0; i < 150; i++) {
      await page.keyboard.press("Tab");
      const marker = (await page.evaluate(`(${FOCUS_MARKER})(document.activeElement)`)) as
        | string
        | null;
      if (marker === null) break; // focus left the document (wrapped past last element)
      seen.push(marker);
    }
    expect(seen.length, "at least a handful of focus stops").toBeGreaterThan(4);
    expect(seen.includes("id:menu-button"), "mobile menu button focusable").toBe(true);
    expect(
      [...seen].some((marker) => marker.startsWith("langswitch:")),
      "language switch focusable",
    ).toBe(true);
    expect(
      seen.includes("testid:download-button"),
      "download button focusable",
    ).toBe(true);
    expect(
      seen.includes("tag:summary"),
      "FAQ <summary> focusable",
    ).toBe(true);
  });
});

test.describe("reduced motion", () => {
  runOn(REDUCED_PROJECT);

  test("with reduced-motion emulation no animations are running", async ({ page }) => {
    await page.goto("/");
    await page.getByTestId("download-center").waitFor();
    // Let any hydration settle, then inspect live animations.
    await page.waitForTimeout(500);
    const running = await page.evaluate(() => {
      const root = document as unknown as {
        getAnimations(options?: { subtree?: boolean }): Animation[];
      };
      return root
        .getAnimations({ subtree: true })
        .filter((animation) => animation.playState === "running").length;
    });
    expect(running, "no running animations under prefers-reduced-motion").toBe(0);
  });
});
