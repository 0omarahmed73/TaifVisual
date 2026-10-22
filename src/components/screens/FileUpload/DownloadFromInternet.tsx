import { join } from "@tauri-apps/api/path";
import { ytDlp } from "@/utils/command";
import { getDownloadTempDir } from "@/utils/platformPaths";
import { readDir, stat } from "@tauri-apps/plugin-fs";

import { getIsAudio, getIsImage, formatFileSize } from "@/utils/fsUtils";
import {
  extractPreviewImage,
  getMediaDuration,
} from "@/utils/ffmpegHelperUtils";

import { useState, useRef } from "react";
import { useFileStore } from "@/stores/useFileStore";
import { useOperationStore } from "@/stores/useOperationStore";
import { MediaType } from "@/stores/useFileStore";
import { useTranslation } from "react-i18next";
import { cn } from "@/utils/cn";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import { Btn, Eyebrow } from "@/components/ui/Stage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { Label } from "@/components/ui/Label";
import { ChevronRight, Link2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const supportedDomains = [
  "youtube.com",
  "youtu.be",
  "x.com",
  "twitter.com",
  "instagram.com",
  "facebook.com",
  "linkedin.com",
  "soundcloud.com",
];

/**
 * Pasting links from RTL (Arabic) contexts often carries invisible
 * bidirectional control characters that break the domain check and the
 * downstream command; strip them before anything else.
 */
function sanitizeUrl(rawUrl: string): string {
  return rawUrl
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g, "")
    .trim();
}

const intQualityMap = {
  high: "192",
  medium: "128",
  low: "96",
};

type YtDlpMediaType = "video" | "audio";
type QualityType = "high" | "medium" | "low";

function DownloadFromInternet() {
  const [url, setUrl] = useState("");
  const [mediaType, setMediaType] = useState<YtDlpMediaType>("video");
  const [quality, setQuality] = useState<QualityType>("medium");

  const { t, i18n } = useTranslation();
  const {
    cmdProcessing,
    setCmdProcessing,
    setProcess,
    setLogs,
    process: runningProcess,
  } = useOperationStore();
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadedBytes, setDownloadedBytes] = useState(0);
  const cancelRequestedRef = useRef(false);
  const lastPolledSize = useRef(0);

  function parseDownloadProgress(rawData: string) {
    const matches = [...rawData.matchAll(/\[download\]\s+([\d.]+)%/g)];
    if (matches.length === 0) return;
    const value = parseFloat(matches[matches.length - 1][1]);
    if (Number.isNaN(value)) return;
    setDownloadProgress(Math.min(100, value));
    setLogs(`[download] progress sample received`);
  }
  const {
    setDuration,
    setFilePath,
    setMediaType: setProcessingMediaType,
    setPreviewImage,
    setSize,
  } = useFileStore();

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const cleanUrl = sanitizeUrl(url);
    if (!cleanUrl) return;

    const isValidUrl = supportedDomains.some((domain) => cleanUrl.includes(domain));
    if (!isValidUrl) {
      toast.error(t("uploadPage.wrongUrlDownloadErr"));
      return;
    }

    setCmdProcessing(true);
    setDownloadProgress(null);
    setDownloadedBytes(0);
    lastPolledSize.current = 0;
    cancelRequestedRef.current = false;

    const downloadPath = await getDownloadTempDir();

    // Independent progress source: poll the growing .part file yt-dlp
    // leaves in the downloads folder, in case stream events lag.
    const sizePoller = setInterval(async () => {
      if (!useOperationStore.getState().cmdProcessing) {
        clearInterval(sizePoller);
        return;
      }
      try {
        const entries = await readDir(downloadPath);
        let biggest = 0;
        for (const entry of entries) {
          if (!entry.isFile || !/\.(part|ytdl)$/.test(entry.name)) continue;
          const entryStat = await stat(await join(downloadPath, entry.name));
          biggest = Math.max(biggest, entryStat.size);
        }
        if (biggest > 0 && biggest !== lastPolledSize.current) {
          lastPolledSize.current = biggest;
          setDownloadedBytes(biggest);
          setLogs(`[size poll] ${biggest} bytes`);
        }
      } catch (err) {
        // Transient fs errors are fine (file replaced, scope); the next
        // tick retries — but log them so a permanent denial is visible.
        setLogs(`[size poll] failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }, 1200);

    const outputTemplate = await join(downloadPath, "%(id)s.%(ext)s");

    const ytDlpCmd = [
      // Newline-separated progress: one stream event per update, so the
      // percentage parser can see every [download] line cleanly.
      "--newline",
      "--update",
      "--no-playlist",
      "-o",
      outputTemplate,
      "-P",
      downloadPath,
      cleanUrl,
      "--print-json",
    ];

    if (mediaType === "audio")
      ytDlpCmd.push(
        "-f",
        `bestaudio[abr>=${intQualityMap[quality]}]/bestaudio`,
        "-x",
        "--audio-format",
        "mp3",
      );

    if (mediaType === "video" && quality !== "high")
      ytDlpCmd.push(
        "-f",
        quality == "medium"
          ? "bestvideo[height<=720]+bestaudio"
          : "bestvideo[height<=360]+bestaudio",
      );

    const ytDlpSidecar = ytDlp(ytDlpCmd);

    let downloadedFilePath: string | null = null;
    let isStdoutProcessed = false;
    ytDlpSidecar.on("close", async ({ code }) => {
      if (code === 0) {
        while (!isStdoutProcessed && downloadedFilePath === null) {
          await new Promise((resolve) => setTimeout(resolve, 10));
        }

        setCmdProcessing(false);

        let determinedMediaType: MediaType | null = null;

        if (downloadedFilePath) {
          if (getIsAudio(downloadedFilePath)) {
            determinedMediaType = MediaType.AUDIO;
          } else if (getIsImage(downloadedFilePath)) {
            determinedMediaType = MediaType.IMAGE;
          } else {
            determinedMediaType = MediaType.VIDEO;
          }

          try {
            const { size } = await stat(downloadedFilePath);
            const previewImage = await extractPreviewImage(
              downloadedFilePath,
              determinedMediaType,
            );
            const duration = await getMediaDuration(downloadedFilePath);

            // Commit only once everything resolved (see FileUpload import flow)
            setProcessingMediaType(determinedMediaType);
            setSize(size);
            setPreviewImage(previewImage);
            setDuration(duration);
            setFilePath(downloadedFilePath);
          } catch (err) {
            console.error("Failed to read downloaded file:", err);
            toast.error(t("uploadPage.importFailedErr"));
          }
        }
      } else {
        // A specific stderr error may already have been shown and reset the state;
        // a user-initiated cancel also skips the error toast.
        setDownloadProgress(null);
        if (!cancelRequestedRef.current && useOperationStore.getState().cmdProcessing) {
          toast.error(t("uploadPage.somethingWentWrongDownloadErr"));
        }
        setCmdProcessing(false);
      }
      clearInterval(sizePoller);
    });

    ytDlpSidecar.on("error", (error) => {
      console.log(error);
      setDownloadProgress(null);
      setCmdProcessing(false);
      toast.error(t("uploadPage.somethingWentWrongDownloadErr"));
      clearInterval(sizePoller);
    });

    ytDlpSidecar.stdout.on("data", async (data) => {
      setLogs(`stdout: ${String(data).slice(0, 120)}`);
      // Import progress can arrive on either stream, sometimes split by
      // the downloader's carriage-return redraws.
      parseDownloadProgress(data);
      try {
        const urlData = JSON.parse(data);
        const filename = `${urlData["id"]}.${mediaType === "audio" ? "mp3" : urlData["ext"]}`;
        console.log(urlData);
        const path = await join(downloadPath, filename);
        downloadedFilePath = path;
      } finally {
        isStdoutProcessed = true;
      }
    });

    ytDlpSidecar.stderr.on("data", (data) => {
      console.log(data);
      setLogs(`stderr: ${data}`);
      parseDownloadProgress(data);
      const errorPatterns = [
        {
          regex:
            /not available in your country|geo.?restricted|geographic.?restriction/i,
          key: "geoRestricted",
        },
        {
          regex: /sign in|login required|authentication/i,
          key: "loginRequired",
        },
        {
          regex: /rate.?limit|try again later|too many requests/i,
          key: "rateLimit",
        },
        { regex: /DRM protected|drm protection/i, key: "drmProtected" },
        {
          regex:
            /No video formats found|no formats available|format is not available/i,
          key: "noFormats",
        },
        {
          regex: /private video|video unavailable|video has been removed/i,
          key: "privateVideo",
        },
        {
          regex: /connection|timeout|network|ssl error|unable to download/i,
          key: "networkError",
        },
        { regex: /blob:|doesn't make any sense/i, key: "invalidUrl" },
      ];

      const matchedError = errorPatterns.find((pattern) =>
        data.match(pattern.regex),
      );

      if (matchedError) {
        setCmdProcessing(false);
        toast.error(t(`uploadPage.${matchedError.key}`));
      }
    });

    const child = await ytDlpSidecar.spawn();
    setProcess(child);
  }

  return (
    <Dialog open={cmdProcessing === true ? cmdProcessing : undefined}>
      <DialogTrigger className="group mt-2.5 flex h-10 w-[520px] max-w-full items-center gap-2 rounded-lg border border-border bg-card px-3.5 text-sm text-muted-foreground transition-colors hover:border-muted-foreground/50 hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <Link2 className="h-[15px] w-[15px] shrink-0" strokeWidth={1.8} />
        <span className="flex-1 text-start text-[13px]">
          {t("uploadPage.downloadFromInternetDialogBtn")}
        </span>
        <ChevronRight
          className="h-3.5 w-3.5 shrink-0 rtl:rotate-180"
          strokeWidth={1.8}
        />
      </DialogTrigger>
      <DialogContent className="max-w-[530px] gap-0 p-8" dir={i18n.dir()}>
        <form
          autoComplete="off"
          onSubmit={onSubmit}
          className="flex w-full flex-col items-center text-center"
        >
          <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-[15px] border border-[hsl(var(--spectra-mid)/0.35)] bg-[hsl(var(--spectra-mid)/0.08)] text-[hsl(var(--spectra-mid))]">
            <Link2 className="h-6 w-6" strokeWidth={1.8} />
          </span>
          <Eyebrow>{t("uploadPage.urlEyebrow")}</Eyebrow>
          <DialogTitle className="mt-2 text-[26px] font-extrabold leading-[1.15] tracking-[-0.04em] [&:lang(ar)]:tracking-normal">
            {t("uploadPage.urlTitle")}
          </DialogTitle>
          <DialogDescription className="mt-2 max-w-[400px] text-sm leading-relaxed">
            {t("uploadPage.urlDesc")}
          </DialogDescription>

          <div className="mt-5 flex w-full flex-col gap-2 text-start">
            <Label htmlFor="url" className="text-muted-foreground">
              {t("uploadPage.downloadFromInternetLabel")}
            </Label>
            <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-field px-3 text-muted-foreground transition-shadow focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/20">
              <Link2 className="h-[15px] w-[15px] shrink-0" strokeWidth={1.8} />
              <input
                disabled={cmdProcessing}
                onChange={(e) => setUrl(e.currentTarget.value)}
                type="url"
                id="url"
                dir="ltr"
                autoComplete="off"
                autoFocus
                placeholder={t("uploadPage.downloadFromInternetPlaceholder")}
                className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground/70"
              />
            </div>
          </div>

          <div className="mt-4 grid w-full grid-cols-2 gap-3 text-start">
            <div className="flex flex-col gap-2">
              <Label htmlFor="media-type" className="text-muted-foreground">
                {t("uploadPage.mediaTypeLabel")}
              </Label>
              <Select
                defaultValue={mediaType}
                onValueChange={(value) => setMediaType(value as YtDlpMediaType)}
              >
                <SelectTrigger id="media-type" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="video">
                    {t("uploadPage.videoOption")}
                  </SelectItem>
                  <SelectItem value="audio">
                    {t("uploadPage.audioOption")}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="download-quality" className="text-muted-foreground">
                {t("uploadPage.qualityLabel")}
              </Label>
              <Select
                defaultValue={quality}
                onValueChange={(value) => setQuality(value as QualityType)}
              >
                <SelectTrigger id="download-quality" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="high">
                    {t("uploadPage.highOption")}
                  </SelectItem>
                  <SelectItem value="medium">
                    {t("uploadPage.mediumOption")}
                  </SelectItem>
                  <SelectItem value="low">{t("uploadPage.lowOption")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Btn
            type="submit"
            disabled={cmdProcessing || !url}
            className="mt-6 w-full"
            icon={
              cmdProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : undefined
            }
          >
            {cmdProcessing
              ? t("uploadPage.downloadInProgress")
              : t("uploadPage.downloadFromInternetBtn")}
          </Btn>

          {cmdProcessing && (
            <div className="mt-4 w-full" aria-live="polite">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("uploadPage.downloadInProgress")}</span>
                <b dir="ltr" className="text-foreground">
                  {downloadProgress !== null
                    ? `${Math.min(100, Math.round(downloadProgress))}%`
                    : downloadedBytes > 0
                      ? formatFileSize(downloadedBytes)
                      : "…"}
                </b>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={
                  downloadProgress === null
                    ? undefined
                    : Math.min(100, Math.round(downloadProgress))
                }
                className="mt-2.5 h-[5px] w-full overflow-hidden rounded-full bg-secondary"
              >
                <div
                  className={cn(
                    "h-full rounded-full bg-spectra transition-[width] duration-300",
                    downloadProgress === null && "animate-pulse",
                  )}
                  style={{
                    width: `${downloadProgress === null ? 10 : Math.min(100, downloadProgress)}%`,
                  }}
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  cancelRequestedRef.current = true;
                  await runningProcess?.kill();
                }}
                className="mt-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                {t("executeBtn.cancelBtn")}
              </button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default DownloadFromInternet;
