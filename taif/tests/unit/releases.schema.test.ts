import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { maxNotesLength, parseReleases, selectLatest } from "@/lib/releases/schema";
import { releasesDownloadPrefix } from "@/config/site";
import type { Release } from "@/lib/releases/schema";

function fixture(name: string): unknown {
  const url = new URL(`../fixtures/github/${name}`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8"));
}

function single(fixtures: string): Release {
  const parsed = parseReleases(fixture(fixtures));
  expect(parsed).toHaveLength(1);
  return parsed[0]!;
}

describe("releases schema", () => {
  it("parses the full fixture and keeps only mappable assets", () => {
    const release = single("release-full.json");
    expect(release.tag).toBe("v1.2.0");
    const fileNames = release.assets.map((asset) => asset.fileName);
    expect(fileNames).toEqual([
      "TaifVisual_1.2.0_x64.msi",
      "TaifVisual_1.2.0_amd64.deb",
      "TaifVisual_1.2.0_arm64-v8a.apk",
      "TaifVisual_1.2.0.apk",
    ]);
    for (const asset of release.assets) {
      expect(asset.downloadUrl.startsWith(releasesDownloadPrefix)).toBe(true);
      expect(Number.isSafeInteger(asset.sizeBytes)).toBe(true);
      expect(asset.sizeBytes).toBeGreaterThan(0);
    }
  });

  it("drops drafts and pre-releases", () => {
    expect(parseReleases(fixture("only-draft.json"))).toEqual([]);
    expect(parseReleases(fixture("only-prerelease.json"))).toEqual([]);
  });

  it("rejects a release with an invalid published_at", () => {
    const payload = fixture("release-full.json") as Array<Record<string, unknown>>;
    const invalid = { ...payload[0], published_at: "not-a-date" };
    expect(parseReleases([invalid])).toEqual([]);
  });

  it("rejects releases whose page URL does not point at github.com", () => {
    const payload = fixture("release-full.json") as Array<Record<string, unknown>>;
    const invalid = { ...payload[0], html_url: "https://evil.example.com/releases/tag/v1.2.0" };
    expect(parseReleases([invalid])).toEqual([]);
  });

  it("drops assets with a wrong download URL host", () => {
    const release = single("bad-url-host.json");
    expect(release.assets.map((asset) => asset.fileName)).toEqual([
      "TaifVisual_1.2.0_arm64-v8a.apk",
    ]);
  });

  it("drops a zero-size asset", () => {
    const release = single("zero-size-asset.json");
    expect(release.assets.map((asset) => asset.fileName)).not.toContain(
      "TaifVisual_1.2.0_x64.msi",
    );
  });

  it("drops an asset that is not uploaded", () => {
    const release = single("asset-not-uploaded.json");
    expect(release.assets.map((asset) => asset.fileName)).toEqual([
      "TaifVisual_1.2.0_arm64-v8a.apk",
    ]);
  });

  it("ignores a non-array payload", () => {
    expect(parseReleases(fixture("malformed-shape.json"))).toEqual([]);
  });

  it("limits notes to 4000 characters", () => {
    const release = single("hostile-notes.json");
    expect(release.notes.length).toBeLessThanOrEqual(maxNotesLength);
  });

  it("selects the newest release by published_at", () => {
    const a = single("release-windows-only.json");
    const newer = { ...a, tag: "v2.0.0", publishedAt: "2027-01-01T00:00:00Z" };
    expect(selectLatest([a, newer])?.tag).toBe("v2.0.0");
    expect(selectLatest([a, newer])?.tag).not.toBe("v1.2.0");
  });
});
