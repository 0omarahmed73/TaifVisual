/**
 * Hero primary action. Server-renders the honest default ("Download" → the
 * download center). When the download center has validated release data and the
 * visitor's platform is recognised with exactly one unambiguous asset, it
 * becomes a direct link to that real asset. Never invents a URL: the href is
 * always a validated `downloadUrl` from the shared state.
 */
import { useEffect, useState } from "react";
import type { Locale } from "@/content/types";
import { suggestCurrentPlatform } from "@/lib/platform-detect";
import type { MappedAsset, Platform } from "@/lib/releases/map";
import { readDownloadState, subscribeDownloadState } from "@/lib/releases/bus";

/** Only the strings this island needs (not the whole dictionary) to keep the HTML small. */
interface Props {
  locale: Locale;
  primaryLabel: string;
  downloadFor: string;
  platformNames: Record<Platform, string>;
}

interface Pick {
  platform: Platform;
  asset: MappedAsset;
  tag: string;
}

const classes =
  "inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-primary px-6 text-sm font-semibold text-primary-foreground shadow-sm transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

function pickAsset(): Pick | null {
  const state = readDownloadState();
  if (!state?.release || !state.platforms || state.status === "error") return null;
  let platform: Platform | null = null;
  try {
    platform = suggestCurrentPlatform();
  } catch {
    platform = null;
  }
  if (!platform) return null;
  const entry = state.platforms.find((p) => p.platform === platform && p.status === "available");
  if (!entry) return null;
  // Only an unambiguous choice becomes a one-click download.
  const asset =
    entry.assets.length === 1
      ? entry.assets[0]
      : platform === "android" && entry.assets.filter((a) => a.arch === "arm64-v8a").length === 1
        ? entry.assets.find((a) => a.arch === "arm64-v8a")
        : undefined;
  return asset ? { platform, asset, tag: state.release.tag } : null;
}

function formatSize(bytes: number): string {
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}

export default function HeroDownload({ locale, primaryLabel, downloadFor, platformNames }: Props) {
  const [pick, setPick] = useState<Pick | null>(null);

  useEffect(() => {
    const update = (): void => setPick(pickAsset());
    update();
    return subscribeDownloadState(update);
  }, []);

  if (!pick) {
    return (
      <a href={locale === "ar" ? "/ar#downloads" : "/#downloads"} className={classes}>
        {primaryLabel}
      </a>
    );
  }

  const label = downloadFor.replace("{platform}", platformNames[pick.platform]);
  return (
    <a
      href={pick.asset.downloadUrl}
      rel="noopener noreferrer"
      className={classes}
      data-testid="hero-download"
    >
      {label}
      <span className="text-xs font-medium opacity-70">
        <bdi dir="ltr">
          {pick.tag} · {formatSize(pick.asset.sizeBytes)}
        </bdi>
      </span>
    </a>
  );
}
