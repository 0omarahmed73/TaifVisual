/**
 * Asset mapping to platform view models (contracts/github-releases.md mapping
 * rules; data-model.md ReleaseAsset/PlatformEntry) and suggestions.
 */
import { siteConfig } from "@/config/site";
import type { MappableAsset } from "@/lib/releases/schema";

export type Platform = "windows" | "linux" | "android";
export type Arch = "arm64-v8a" | "x86_64";

export interface MappedAsset {
  fileName: string;
  sizeBytes: number;
  downloadUrl: string;
  platform: Platform;
  packageType: "installer" | "deb" | "apk";
  arch: Arch | null;
  /** Client-side derived highlight; false until markSuggested runs. */
  isSuggested: boolean;
}

export interface PlatformEntry {
  platform: Platform;
  assets: MappedAsset[];
  status: "available" | "unavailable";
}

/** Map an arch token (case-insensitive) to a normalized arch, or null. */
export function detectArch(fileName: string): Arch | null {
  const lower = fileName.toLowerCase();
  if (lower.includes("arm64-v8a")) return "arm64-v8a";
  if (lower.includes("x86_64") || lower.includes("amd64") || lower.includes("x64")) {
    return "x86_64";
  }
  return null;
}

function ruleFor(fileName: string) {
  const lower = fileName.toLowerCase();
  return siteConfig.assetRules.find((rule) => lower.endsWith(rule.ext));
}

/** Map schema-validated mappable assets to per-platform entries. */
export function mapAssets(assets: MappableAsset[]): PlatformEntry[] {
  const platforms: Platform[] = ["windows", "linux", "android"];
  return platforms.map((platform) => {
    const mapped: MappedAsset[] = [];
    for (const asset of assets) {
      const rule = ruleFor(asset.fileName);
      // A mappable asset always matched a rule in the schema, but re-check:
      // an asset that cannot be mapped is never returned.
      if (!rule || rule.platform !== platform) continue;
      mapped.push({
        fileName: asset.fileName,
        sizeBytes: asset.sizeBytes,
        downloadUrl: asset.downloadUrl,
        platform,
        packageType: rule.packageType,
        arch: detectArch(asset.fileName),
        isSuggested: false,
      });
    }
    return {
      platform,
      assets: mapped,
      status: mapped.length > 0 ? ("available" as const) : ("unavailable" as const),
    };
  });
}

/**
 * Highlight the one asset matching the detected platform — only when the
 * platform has exactly one asset for the matching arch group. Two assets for
 * the same platform/arch yield no suggestion.
 */
export function markSuggested(
  platforms: PlatformEntry[],
  suggestedPlatform: Platform | null,
): PlatformEntry[] {
  if (!suggestedPlatform) return platforms;
  return platforms.map((entry) => {
    if (entry.platform !== suggestedPlatform) return entry;
    return { ...entry, assets: markAssets(entry, suggestedPlatform) };
  });
}

function markAssets(entry: PlatformEntry, platform: Platform): MappedAsset[] {
  return entry.assets.map((asset) => ({
    ...asset,
    isSuggested:
      platform === entry.platform &&
      entry.assets.filter((candidate) => candidate.arch === asset.arch).length === 1,
  }));
}
