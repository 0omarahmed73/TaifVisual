/**
 * US2 content tests (T038): verified facts only, per research.md §1.
 * run: npm run test -- content
 */
import { describe, expect, it } from "vitest";
import { operations } from "@/content/operations";
import { en } from "@/content/en";
import { ar } from "@/content/ar";

const EXPECTED_IDS = [
  "remove-music",
  "trim",
  "cut",
  "compress",
  "convert",
  "quality",
] as const;

describe("operations (verified against app source)", () => {
  it("has exactly six operations with the expected ids in order", () => {
    expect(operations.map((op) => op.id)).toEqual(EXPECTED_IDS);
  });

  it("Compress applies to video only", () => {
    const compress = operations.find((op) => op.id === "compress")!;
    expect(compress.appliesTo).toEqual(["video"]);
  });

  it("Trim and Cut apply to audio and video only (images get neither)", () => {
    for (const id of ["trim", "cut"] as const) {
      expect(operations.find((op) => op.id === id)!.appliesTo).toEqual([
        "audio",
        "video",
      ]);
    }
  });

  it("Remove Music is not available on macOS", () => {
    const removeMusic = operations.find((op) => op.id === "remove-music")!;
    expect(removeMusic.availability).toBe("not-on-macos");
  });

  it("Convert and Downgrade quality are offered everywhere", () => {
    for (const id of ["convert", "quality"] as const) {
      expect(operations.find((op) => op.id === id)!.availability).toBeNull();
    }
  });
});

describe("Trim vs Cut semantics", () => {
  it("English descriptions differ and carry keep / remove-the-middle semantics", () => {
    const trim = en.features.operations.trim.description;
    const cut = en.features.operations.cut.description;
    expect(trim).not.toBe(cut);
    expect(trim).toMatch(/keep/i);
    expect(cut).toMatch(/remove/i);
    expect(cut).toMatch(/middle|section/i);
    expect(cut).toMatch(/join|remainder/i);
  });

  it("Arabic descriptions differ and carry the equivalent semantics", () => {
    const trim = ar.features.operations.trim.description;
    const cut = ar.features.operations.cut.description;
    expect(trim).not.toBe(cut);
    expect(trim).toContain("احتفظ");
    expect(cut).toContain("أزل");
    expect(cut).toContain("الأوسط");
  });
});

describe("quality levels and convert formats (research.md §1)", () => {
  it("mentions video 1080p→144p, audio 320/128/64 kbps, image 90/60/30%", () => {
    const description = en.features.operations.quality.description;
    expect(description).toContain("1080p");
    expect(description).toContain("144p");
    for (const rate of ["320", "128", "64"]) {
      expect(description).toContain(rate);
    }
    for (const pct of ["90", "60", "30"]) {
      expect(description).toContain(pct);
    }
  });

  it("mentions the verified Convert formats", () => {
    const description = en.features.operations.convert.description;
    for (const format of ["PNG", "JPEG", "WebP", "MP3", "AAC", "OGG", "WAV", "MP4", "WebM", "MOV", "AVI", "MKV"]) {
      expect(description).toContain(format);
    }
  });
});

describe("Remove Music notices and Compress claim (FR-009, FR-011)", () => {
  it("English notices cover AI, mistakes, noise and no length limit", () => {
    const text = en.features.removeMusicNotices.join(" ");
    expect(text).toMatch(/AI/i);
    expect(text).toMatch(/on your device/i);
    expect(text).toMatch(/mistakes/i);
    expect(text).toMatch(/noise/i);
    expect(text).toMatch(/no length limit/i);
  });

  it("Arabic notices cover the same verified facts", () => {
    const text = ar.features.removeMusicNotices.join(" ");
    expect(text).toContain("الذكاء الاصطناعي");
    expect(text).toContain("جهازك");
    expect(text).toContain("تخطئ");
    expect(text).toContain("الضوضاء");
    expect(text).toContain("لا يوجد حدّ");
  });

  it("Compress claims similar quality and contrasts with Downgrade Quality", () => {
    expect(en.features.operations.compress.description).toMatch(/similar quality/i);
    expect(en.features.operations.compress.description).toMatch(/Downgrade Quality/i);
    expect(ar.features.operations.compress.description).toContain("جودة مشابهة");
  });

  it("FAQ Remove Music answer includes the accuracy notice", () => {
    const item = en.faq.items.find((entry) => entry.id === "remove-music");
    expect(item?.answer).toMatch(/can make mistakes/i);
    const arItem = ar.faq.items.find((entry) => entry.id === "remove-music");
    expect(arItem?.answer).toContain("تخطئ");
  });

  it("URL-import FAQ lists only the verified sites", () => {
    const item = en.faq.items.find((entry) => entry.id === "url-imports");
    for (const site of [
      "YouTube",
      "X",
      "Instagram",
      "Facebook",
      "LinkedIn",
      "SoundCloud",
    ]) {
      expect(item?.answer).toContain(site);
    }
    expect(item?.answer).not.toMatch(/TikTok|Vimeo|Reddit/i);
  });
});

describe("forbidden-claims scan over en/ar dictionaries", () => {
  function matchers(): { violations: string[]; walk: (value: unknown, key?: string) => void } {
    const violations: string[] = [];
    const walk = (value: unknown, key = ""): void => {
      if (typeof value === "string") return;
      if (typeof value === "number" || value === null) return;
      if (typeof value !== "object") return;
      for (const [childKey, child] of Object.entries(value)) {
        if (typeof child === "string") {
          const path = key ? `${key}.${childKey}` : childKey;
          for (const claim of ["iOS", "App Store", "Play Store", "Windows ARM"]) {
            if (child.includes(claim)) violations.push(`${path}: claims "${claim}"`);
          }
          // macOS may only appear in the verified not-on-macos availability note.
          if (child.includes("macOS") && !path.endsWith("availability.not-on-macos")) {
            violations.push(`${path}: claims "macOS" outside the availability note`);
          }
        } else {
          walk(child, key ? `${key}.${childKey}` : childKey);
        }
      }
    };
    return { violations, walk };
  }

  for (const { name, dict } of [
    { name: "en", dict: en },
    { name: "ar", dict: ar },
  ] as const) {
    it(`"${name}" free of forbidden platform/store claims`, () => {
      const { violations, walk } = matchers();
      walk(dict);
      expect(violations).toEqual([]);
    });
  }
});
