import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { parseReleases } from "@/lib/releases/schema";
import { detectArch, mapAssets, markSuggested } from "@/lib/releases/map";
import type { PlatformEntry } from "@/lib/releases/map";

function fixture(name: string): unknown {
  const url = new URL(`../fixtures/github/${name}`, import.meta.url);
  return JSON.parse(readFileSync(url, "utf8"));
}

function platformsOf(name: string): PlatformEntry[] {
  const release = parseReleases(fixture(name))[0];
  if (!release) throw new Error(`${name} produced no release`);
  return mapAssets(release.assets);
}

describe("releases mapping", () => {
  it("maps msi, deb and apk to the right platforms and package types", () => {
    const platforms = platformsOf("release-full.json");
    const byPlatform = Object.fromEntries(platforms.map((p) => [p.platform, p]));
    expect(byPlatform["windows"]?.status).toBe("available");
    expect(byPlatform["windows"]?.assets[0]).toMatchObject({
      packageType: "installer",
      platform: "windows",
    });
    expect(byPlatform["linux"]?.assets[0]).toMatchObject({ packageType: "deb" });
    expect(byPlatform["linux"]?.status).toBe("available");
    expect(byPlatform["android"]?.assets).toHaveLength(2);
    expect(byPlatform["android"]?.assets.every((a) => a.packageType === "apk")).toBe(true);
  });

  it("returns all three platforms with unavailable when no asset maps", () => {
    const release = parseReleases(fixture("only-prerelease.json")); // dropped → simulate empty
    const platforms = mapAssets(release[0]?.assets ?? []);
    expect(platforms.map((p) => p.platform)).toEqual(["windows", "linux", "android"]);
    expect(platforms.every((p) => p.status === "unavailable" && p.assets.length === 0)).toBe(true);
  });

  it("extracts arch tokens only in their recognized forms", () => {
    expect(detectArch("TaifVisual_1.2.0_arm64-v8a.apk")).toBe("arm64-v8a");
    expect(detectArch("TaifVisual_1.2.0_amd64.deb")).toBe("x86_64");
    expect(detectArch("TaifVisual_1.2.0_x64.msi")).toBe("x86_64");
    expect(detectArch("TaifVisual_1.2.0.apk")).toBe(null);
  });

  it("never returns unmappable files (.zip, .sig, .blockmap)", () => {
    const platforms = platformsOf("release-full.json");
    const fileNames = platforms.flatMap((p) => p.assets.map((a) => a.fileName));
    expect(fileNames).not.toContain("TaifVisual_1.2.0.zip");
    expect(fileNames).not.toContain("TaifVisual_1.2.0.msi.sig");
    expect(fileNames).not.toContain("TaifVisual_1.2.0.msi.blockmap");
  });

  it("two same-platform/arch assets yield no suggested highlight", () => {
    const platforms = platformsOf("release-full.json");
    const marked = markSuggested(platforms, "windows");
    const windows = marked.find((p) => p.platform === "windows");
    // Windows has exactly one asset → the single candidate is suggested.
    expect(windows?.assets[0]?.isSuggested).toBe(true);
    // Android arm64-v8a group has one asset per arch, but none of the two
    // same-platform assets can be highlighted when duplicates share an arch.
    const duplicated = [
      ...platforms.map((p) => ({
        ...p,
        assets:
          p.platform === "windows"
            ? [
                { ...p.assets[0]! },
                { ...p.assets[0]!, fileName: "TaifVisual_1.2.0_x64_alt.msi" },
              ]
            : p.assets,
      })),
    ];
    const noHighlight = markSuggested(duplicated, "windows");
    const windowsDup = noHighlight.find((p) => p.platform === "windows");
    expect(windowsDup?.assets.every((a) => a.isSuggested === false)).toBe(true);
  });
});
