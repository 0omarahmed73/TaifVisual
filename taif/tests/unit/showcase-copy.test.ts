import { describe, expect, it } from "vitest";
import { en } from "@/content/en";
import { ar } from "@/content/ar";

describe("showcase lightbox copy", () => {
  const labels = ["close", "previous", "next", "enlarge", "dialogLabel"] as const;

  it("has every lightbox label in both locales", () => {
    for (const label of labels) {
      expect(en.showcase.lightbox[label].trim().length).toBeGreaterThan(0);
      expect(ar.showcase.lightbox[label].trim().length).toBeGreaterThan(0);
    }
  });

  it("uses an {alt} template for the trigger's accessible name", () => {
    expect(en.showcase.lightbox.enlarge).toContain("{alt}");
    expect(ar.showcase.lightbox.enlarge).toContain("{alt}");
    expect(en.showcase.lightbox.enlarge.replace("{alt}", "Example capture")).toContain(
      "Example capture",
    );
    expect(ar.showcase.lightbox.enlarge.replace("{alt}", "لقطة تجريبية")).toContain(
      "لقطة تجريبية",
    );
  });
});

describe("verified Android ABI guidance", () => {
  it("English names both ABIs and their audiences", () => {
    const text = en.downloads.archGuidance;
    expect(text).toContain("arm64-v8a");
    expect(text).toContain("x86_64");
    expect(text).toMatch(/phones and tablets/i);
    expect(text).toMatch(/ARM64/);
    expect(text).toMatch(/Chromebooks/i);
    expect(text).toMatch(/emulators/i);
    expect(text).toMatch(/Android 10 or newer/i);
  });

  it("Arabic names both ABIs and their audiences", () => {
    const text = ar.downloads.archGuidance;
    expect(text).toContain("arm64-v8a");
    expect(text).toContain("x86_64");
    expect(text).toContain("ARM64");
    expect(text).toContain("Chromebooks");
    expect(text).toContain("المحاكيات");
    expect(text).toContain("أندرويد 10");
  });

  it("never invents a per-ABI OS split or Android 12+", () => {
    for (const text of [en.downloads.archGuidance, ar.downloads.archGuidance]) {
      expect(text).not.toMatch(/Android 12|أندرويد 12/);
    }
    // Both ABIs share the same floor (minSdk 29 = Android 10).
    expect(en.downloads.archGuidance).toMatch(/Both require Android 10/i);
    expect(ar.downloads.archGuidance).toMatch(/كلاهما أندرويد 10/);
  });
});
