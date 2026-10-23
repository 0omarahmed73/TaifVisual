/**
 * Download center island (T034). Fetches live GitHub Releases, validates via
 * zod, maps assets, and falls back honestly per contracts/github-releases.md.
 * Every download href equals a validated asset URL; notes render as text nodes.
 */
import { useCallback, useEffect, useState, type SVGProps } from "react";
import type { Dictionary, Locale } from "@/content/types";

function ArrowDownToLine(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 17V3" />
      <path d="m6 11 6 6 6-6" />
      <path d="M19 21H5" />
    </svg>
  );
}

function ExternalLink(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M15 3h6v6" />
      <path d="M10 14 21 3" />
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    </svg>
  );
}

function RefreshCcw(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
      <path d="M3 3v5h5" />
      <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
      <path d="M16 16h5v5" />
    </svg>
  );
}

function TriangleAlert(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </svg>
  );
}
import { releasesUrl } from "@/config/site";
import { fetchReleases, type FetchErrorKind, type FetchResult } from "@/lib/releases/fetch";
import {
  isCacheFresh,
  readCachedRelease,
  writeCachedRelease,
  type CachedRelease,
} from "@/lib/releases/cache";
import { resolveState, type DownloadCenterState } from "@/lib/releases/state";
import { suggestCurrentPlatform } from "@/lib/platform-detect";
import { publishDownloadState } from "@/lib/releases/bus";

interface Props {
  locale: Locale;
  dict: Dictionary;
}

function formatSize(bytes: number): string {
  return `${new Intl.NumberFormat("en", { maximumFractionDigits: 1 }).format(bytes / (1024 * 1024))} MB`;
}

function formatDate(value: number | Date, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "long",
  }).format(value);
}

function formatDateTime(value: number, locale: Locale): string {
  return new Intl.DateTimeFormat(locale === "ar" ? "ar" : "en", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function statusMessage(state: DownloadCenterState, dict: Dictionary): string {
  if (state.stale) return dict.downloads.states.stale;
  switch (state.status) {
    case "loading":
      return dict.downloads.states.loading;
    case "ready":
      return dict.downloads.states.ready;
    case "partial":
      return dict.downloads.states.partial;
    case "no-release":
      return dict.downloads.states["no-release"];
    case "error": {
      const kind = state.errorKind as FetchErrorKind | undefined;
      return kind ? dict.downloads.errors[kind] : dict.downloads.states.error;
    }
  }
}

export default function DownloadCenter({ locale, dict }: Props) {
  const [state, setState] = useState<DownloadCenterState>(() => ({
    status: "loading",
    stale: false,
  }));
  const [attempt, setAttempt] = useState(0);
  const [lastError, setLastError] = useState<FetchErrorKind | null>(null);

  useEffect(() => {
    let cancelled = false;

    const apply = (next: DownloadCenterState): void => {
      if (cancelled) return;
      setState(next);
      publishDownloadState(next);
    };

    const load = async (): Promise<void> => {
      apply({ status: "loading", stale: false });
      const now = Date.now();

      // Detect the platform first so the "Suggested" badge also appears when
      // the state is rebuilt from a fresh cache (T086, US1/AC2).
      let suggested: ReturnType<typeof suggestCurrentPlatform> = null;
      try {
        suggested = suggestCurrentPlatform();
      } catch {
        suggested = null; // never fabricate a suggestion on detection failure
      }

      // Fresh cache (< 10 min): reuse without a network request (FR-020).
      // Construct the state directly so the stale flag stays off.
      const fresh: CachedRelease | null = readCachedRelease(now);
      if (fresh && isCacheFresh(now, fresh.fetchedAt)) {
        const platformsState = resolveState(
          { ok: false, kind: "network" },
          now,
          fresh,
          suggested,
        );
        apply({ ...platformsState, stale: false, source: "cache" });
        return;
      }

      let result: FetchResult;
      try {
        result = await fetchReleases();
      } catch {
        result = { ok: false, kind: "network" };
      }
      if (cancelled) return;

      const after = Date.now();
      if (result.ok) {
        setLastError(null);
        const next = resolveState(result, after, readCachedRelease(after), suggested);
        if (next.release) writeCachedRelease(next.release, after);
        apply(next);
      } else {
        setLastError(result.kind);
        apply(resolveState(result, after, readCachedRelease(after), suggested));
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [locale, attempt]);

  const onRetry = useCallback(() => {
    setAttempt((current) => current + 1);
  }, []);

  const ready = state.release !== undefined && state.platforms !== undefined;

  const releasesLink = (
    <a
      href={releasesUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
      {dict.downloads.releasesPage}
    </a>
  );

  const retryButton =
    lastError !== null || state.stale ? (
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        <RefreshCcw className="size-4 shrink-0" aria-hidden="true" />
        {dict.downloads.retry}
      </button>
    ) : null;

  return (
    <div
      className={state.status === "loading" || ready ? "min-h-72" : undefined}
      data-testid="download-center"
      data-state={state.status}
      data-stale={state.stale ? "true" : "false"}
    >
      <p
        role="status"
        aria-live="polite"
        data-testid="download-status"
        className="mb-5 flex items-center gap-2 text-xs font-medium text-muted-foreground"
      >
        {state.status === "loading" && (
          <span
            aria-hidden="true"
            className="inline-block size-4 animate-spin rounded-full border-2 border-border border-t-foreground"
          />
        )}
        {statusMessage(state, dict)}
      </p>

      {state.status === "error" &&
        state.errorKind === "rate-limit" &&
        state.rateLimitResetAt !== undefined && (
          <p
            className="mb-4 text-xs text-muted-foreground"
            data-testid="rate-limit-reset"
          >
            {dict.downloads.rateLimitReset}{" "}
            <bdi dir="ltr">{formatDateTime(state.rateLimitResetAt, locale)}</bdi>
          </p>
        )}

      {/* Reserved skeleton: fixed min-height on the container prevents layout shift. */}
      {state.status === "loading" && (
        <ul aria-hidden="true" className="grid gap-4 md:grid-cols-3">
          <li className="h-32 rounded-[12px] border border-border bg-muted/50" />
          <li className="h-32 rounded-[12px] border border-border bg-muted/50" />
          <li className="h-32 rounded-[12px] border border-border bg-muted/50" />
        </ul>
      )}

      {state.stale && (
        <p className="mb-4 rounded-lg border border-border bg-secondary/70 px-4 py-3 text-xs text-foreground">
          <TriangleAlert className="me-2 inline size-4 align-[-2px] text-warning" aria-hidden="true" />
          {dict.downloads.outdatedWarning}{" "}
          {state.fetchedAt !== undefined && (
            <span>
              {dict.downloads.lastChecked} {formatDate(new Date(state.fetchedAt), locale)}.
            </span>
          )}
        </p>
      )}

      {ready && state.release && state.platforms && (
        <div data-testid="download-release">
          <div className="mb-5 flex flex-wrap items-center gap-2.5 rounded-lg border border-border bg-field px-3.5 py-2.5 text-xs text-muted-foreground">
            <span>{dict.downloads.versionLabel}</span>
            <bdi
              dir="ltr"
              className="inline-flex items-center rounded-md border border-border bg-card px-2.5 py-0.5 font-mono text-xs font-bold text-[hsl(var(--spectra-end))]"
            >
              {state.release.tag}
            </bdi>
            <span aria-hidden="true">·</span>
            <span>
              {dict.downloads.dateLabel} {formatDate(new Date(state.release.publishedAt), locale)}
            </span>
          </div>
          <ul className="mt-5 grid gap-4 md:grid-cols-3">
            {state.platforms.map((entry) => {
              const hasSuggested = entry.assets.some((asset) => asset.isSuggested);
              return (
                <li
                  key={entry.platform}
                  data-testid={`platform-${entry.platform}`}
                  data-status={entry.status}
                  className={`flex flex-col justify-between rounded-[12px] border p-5 transition-colors ${
                    hasSuggested
                      ? "border-[hsl(var(--spectra-end)/0.5)] bg-secondary/30"
                      : "border-border bg-card"
                  }`}
                >
                  <div>
                    <h3 className="flex flex-wrap items-center justify-between gap-2 text-sm font-bold text-foreground">
                      <span>{dict.downloads.platform[entry.platform]}</span>
                      {hasSuggested && (
                        <span className="inline-flex items-center rounded-md border border-[hsl(var(--spectra-end)/0.45)] bg-[hsl(var(--spectra-end)/0.14)] px-2 py-0.5 text-[11px] font-semibold text-[hsl(var(--spectra-end))]">
                          {dict.downloads.suggested}
                        </span>
                      )}
                    </h3>
                    {entry.assets.map((asset) => (
                      <a
                        key={asset.downloadUrl}
                        href={asset.downloadUrl}
                        className="mt-3 flex w-full items-center justify-between gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-xs font-semibold text-primary-foreground transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
                        data-testid="download-button"
                      >
                        <span className="flex min-w-0 flex-col gap-1">
                          <span className="flex items-center gap-2">
                            <ArrowDownToLine className="h-4 w-4 shrink-0" aria-hidden="true" />
                            <bdi dir="ltr" className="truncate">
                              {asset.fileName}
                            </bdi>
                          </span>
                          <span className="flex flex-wrap items-center gap-x-2 gap-y-0.5 ps-6 text-[10px] font-medium text-primary-foreground/80">
                            <span data-testid="package-type">
                              {dict.downloads.packageType[asset.packageType]}
                            </span>
                            {asset.arch && (
                              <bdi dir="ltr" data-testid="asset-arch">
                                {asset.arch}
                              </bdi>
                            )}
                          </span>
                        </span>
                        <span className="shrink-0 text-[11px] font-medium text-primary-foreground/90">
                          {formatSize(asset.sizeBytes)}
                        </span>
                      </a>
                    ))}
                  </div>
                  {entry.status === "unavailable" && (
                    <div className="mt-3 border-t border-border/60 pt-3">
                      <p className="text-xs text-muted-foreground" data-testid="not-in-release">
                        {dict.downloads.notInRelease}
                      </p>
                    </div>
                  )}
                  {/* Multiple APKs mean a real arch choice; keep guidance and
                      each arch token visible (T089, Edge Cases). */}
                  {entry.platform === "android" &&
                    (entry.status === "unavailable" || entry.assets.length > 1) && (
                      <p
                        data-testid="android-arch-guidance"
                        className={
                          entry.status === "unavailable"
                            ? "mt-1 text-[11px] text-muted-foreground"
                            : "mt-3 border-t border-border/60 pt-3 text-[11px] text-muted-foreground"
                        }
                      >
                        {dict.downloads.archGuidance}
                      </p>
                    )}
                </li>
              );
            })}
          </ul>
          {state.release.notes.length > 0 && (
            <details className="group mt-5 rounded-[10px] border border-border bg-field p-4 text-xs transition-all duration-200 open:bg-secondary/40">
              <summary className="cursor-pointer font-semibold text-foreground">
                {dict.downloads.notesLabel}
              </summary>
              <p
                className="mt-2 text-[11px] text-muted-foreground"
                data-testid="notes-language"
              >
                {dict.downloads.notesEnglish}
              </p>
              {/* Untrusted notes render as text nodes only (React escapes).
                  GitHub release notes are English-authored (T084). */}
              <pre
                lang="en"
                dir="ltr"
                data-testid="release-notes"
                className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-muted-foreground"
              >
                {state.release.notes}
              </pre>
              <a
                href={state.release.url}
                target="_blank"
                rel="noopener noreferrer"
                data-testid="release-page-link"
                className="mt-3 inline-flex items-center gap-2 text-xs font-semibold text-foreground underline underline-offset-4"
              >
                <ExternalLink className="size-4 shrink-0" aria-hidden="true" />
                {dict.downloads.releasePage}
              </a>
            </details>
          )}
          {/* The all-releases link is always present in the ready state
              (FR-024), independent of whether notes exist. */}
          <div className="mt-4 flex justify-end" data-testid="all-releases">
            {releasesLink}
          </div>
        </div>
      )}

      {/* Releases-page link whenever the state is stale (any status), and on
          every non-ready failure state; retry whenever a retry is possible. */}
      {(state.stale ||
        state.status === "partial" ||
        state.status === "no-release" ||
        state.status === "error") && (
        <div
          className="mt-6 flex flex-wrap items-center gap-3"
          data-testid="download-fallback"
          data-stale={state.stale ? "true" : "false"}
        >
          {retryButton}
          {releasesLink}
        </div>
      )}
    </div>
  );
}
