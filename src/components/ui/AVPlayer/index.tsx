import { convertFileSrc } from "@tauri-apps/api/core";
import { appCacheDir, join } from "@tauri-apps/api/path";
import { mkdir } from "@tauri-apps/plugin-fs";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";

import { getIsAudio } from "@/utils/fsUtils";
import { getPercentage } from "@/utils/getPercentage";
import { getMediaMimeType } from "@/utils/mediaMime";
import formatTimestamp from "@/utils/timestampFormatter";
import { getPlatformName } from "@/utils/tauriEnv";
import { cn } from "@/utils/cn";
import { toast } from "sonner";
import { ffmpeg, ffprobe } from "@/utils/command";
import { extractFFmpegProgress } from "@/utils/ffmpegHelperUtils";
import { isAndroid } from "@/utils/platform";
import { fileTitleSync } from "@/utils/fsUtils";

import AVControls from "./AVControls";
import CutSlider from "./CutSlider";
import CurrTimeIndicator from "./CurrTimeIndicator";
import { useFileStore } from "@/stores/useFileStore";

export interface AVPlayerProps {
  cutType: "trim" | "cut";
  cutTimestamps: [number, number];
  setCutTimestamps: React.Dispatch<React.SetStateAction<[number, number]>>;
}

export default function AVPlayer({
  cutType,
  cutTimestamps,
  setCutTimestamps,
}: AVPlayerProps) {
  const [AVPaused, setAVPaused] = useState(true);
  const [AVCurrDurationPer, setAVCurrDurationPer] = useState(0);
  const [playerSrc, setPlayerSrc] = useState<string>("");
  const [previewState, setPreviewState] = useState<"idle" | "working" | "failed">("idle");
  const [previewPercent, setPreviewPercent] = useState(0);
  const proxyTried = useRef(false);

  const { t } = useTranslation();
  const { duration: initialAVDuration, filePath } = useFileStore();
  const isAudio = getIsAudio(filePath);

  const AVElRef = useRef<HTMLVideoElement | HTMLAudioElement>(null);
  const sliderElRef = useRef<HTMLInputElement>(null);
  const startTimestampElRef = useRef<HTMLInputElement>(null);
  const endTimestampElRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    /** 
     * WebKitGTK cannot load media elements from custom protocols like the
     * `asset://` one (GStreamer has no handler for them, tauri #3725), so on
     * Linux the file is read through the fs plugin and handed to the player
     * as a blob: URL. On other platforms the asset protocol works fine.
     */
    let objectUrl: string | null = null;
    let cancelled = false;
    proxyTried.current = false;
    setPreviewState("idle");

    async function resolvePlayerSource() {
      setPlayerSrc("");
      try {
        const platform = await getPlatformName();
        if (platform === "linux") {
          const { readFile } = await import("@tauri-apps/plugin-fs");
          const data = await readFile(filePath);
          const buffer =
            data instanceof Uint8Array ? data : new Uint8Array(data as ArrayBuffer);
          const blob = new Blob([buffer], { type: getMediaMimeType(filePath) });
          objectUrl = URL.createObjectURL(blob);
          if (!cancelled) setPlayerSrc(objectUrl);
        } else {
          if (!cancelled) setPlayerSrc(convertFileSrc(filePath));
        }
      } catch (err) {
        console.error("Failed to load media preview source:", err);
        if (!cancelled) {
          toast.error(
            `Preview failed: ${err instanceof Error ? err.message : String(err)}`,
          );
        }
      }
    }

    resolvePlayerSource();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [filePath]);

  /**
   * Android's WebView cannot decode some codecs (notably the HEVC/H.265 clips
   * phones record). Build a small H.264 copy used only for the preview; the
   * edit itself still runs on the original file.
   */
  async function buildPreviewProxy() {
    if (!isAndroid() || proxyTried.current) return;
    proxyTried.current = true;
    setPreviewState("working");
    try {
      const dir = await join(await appCacheDir(), "previews");
      await mkdir(dir, { recursive: true }).catch(() => undefined);
      const out = await join(dir, `${fileTitleSync(filePath)}_${Date.now()}.mp4`);
      const command = ffmpeg([
        "-y", "-i", filePath,
        "-vf", "scale=-2:480",
        "-c:v", "libx264", "-preset", "ultrafast", "-crf", "30",
        "-pix_fmt", "yuv420p",
        "-c:a", "aac", "-b:a", "96k",
        "-movflags", "+faststart",
        out,
      ]);
      setPreviewPercent(0);
      command.stderr.on("data", (line) => {
        const percent = extractFFmpegProgress(line, initialAVDuration);
        if (percent !== undefined) setPreviewPercent(Math.min(99, Math.trunc(percent)));
      });
      command.on("close", ({ code }) => {
        if (code === 0) {
          setPlayerSrc(convertFileSrc(out));
          setPreviewState("idle");
        } else setPreviewState("failed");
      });
      command.on("error", () => setPreviewState("failed"));
      await command.spawn();
    } catch (err) {
      console.error("Preview copy failed:", err);
      setPreviewState("failed");
    }
  }

  // Probe the codec first so unsupported videos get their preview copy right away
  useEffect(() => {
    if (!isAndroid() || isAudio) return;
    let stopped = false;
    const probe = ffprobe([
      "-v", "error", "-select_streams", "v:0",
      "-show_entries", "stream=codec_name", "-of", "csv=p=0", filePath,
    ]);
    probe.stdout.on("data", (line) => {
      const codec = line.trim().toLowerCase();
      // Codecs Android's WebView decodes everywhere
      const playable = ["h264", "vp8", "vp9", "mpeg4", "av1"].includes(codec);
      if (!stopped && codec && !playable) void buildPreviewProxy();
    });
    probe.spawn().catch(() => undefined);
    return () => {
      stopped = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filePath]);

  useEffect(() => {
    function setInputsValue() {
      if (
        startTimestampElRef &&
        startTimestampElRef.current &&
        endTimestampElRef &&
        endTimestampElRef.current
      ) {
        startTimestampElRef.current.value = formatTimestamp(cutTimestamps[0]);
        endTimestampElRef.current.value = formatTimestamp(cutTimestamps[1]);
      }
    }
    setInputsValue();
  }, [cutTimestamps]);

  function handleAVDurationAndIndicator() {
    if (!AVElRef.current) return;
    if (!sliderElRef.current) return;

    const currentTime = AVElRef.current.currentTime;

    if (cutType === "cut") {
      // For trimming, prevent entering the cut region
      if (currentTime > cutTimestamps[0] && currentTime < cutTimestamps[1]) {
        // If coming from left, snap to left boundary
        if (AVElRef.current.currentTime <= cutTimestamps[0]) {
          AVElRef.current.currentTime = cutTimestamps[0];
          const startPercentage =
            (cutTimestamps[0] / AVElRef.current.duration) * 100;
          setAVCurrDurationPer(startPercentage);

          sliderElRef.current.value = `${startPercentage}`;
        } else {
          // If coming from right, snap to right boundary
          AVElRef.current.currentTime = cutTimestamps[1];
          const endPercentage =
            (cutTimestamps[1] / AVElRef.current.duration) * 100;
          setAVCurrDurationPer(endPercentage);

          sliderElRef.current.value = `${endPercentage}`;
        }
        return;
      }
    } else {
      // For cutting, keep within the boundaries
      if (currentTime < cutTimestamps[0]) {
        AVElRef.current.currentTime = cutTimestamps[0];
        const startPercentage =
          (cutTimestamps[0] / AVElRef.current.duration) * 100;
        setAVCurrDurationPer(startPercentage);

        sliderElRef.current.value = `${startPercentage}`;

        return;
      }

      if (currentTime > cutTimestamps[1]) {
        AVElRef.current.currentTime = cutTimestamps[0];
        const endPercentage =
          (cutTimestamps[1] / AVElRef.current.duration) * 100;
        setAVCurrDurationPer(endPercentage);

        sliderElRef.current.value = `${endPercentage}`;

        return;
      }
    }

    // If within allowed region, proceed normally
    const durationPer =
      getPercentage(currentTime, AVElRef.current.duration) || 0;
    setAVCurrDurationPer(durationPer);

    sliderElRef.current.value = `${durationPer}`;
  }

  return (
    <>
      <div
        className={cn(
          "flex flex-col sm:w-auto",
          isAudio
            ? "h-full w-full items-center justify-center gap-3"
            : "w-full",
        )}
      >
        {isAudio ? (
          <audio
            preload="none"
            src={playerSrc || undefined}
            ref={AVElRef as React.RefObject<HTMLAudioElement>}
            onTimeUpdate={() => {
              handleAVDurationAndIndicator();
            }}
            loop
            onPlay={() => {
              setAVPaused(false);
            }}
            onPause={() => setAVPaused(true)}
          />
        ) : (
          <div className="group relative mb-1 inline-flex h-full w-full flex-col items-center justify-center overflow-hidden rounded-lg">
            <video
              preload="none"
              loop
              src={playerSrc || undefined}
              playsInline
              onTimeUpdate={() => {
                handleAVDurationAndIndicator();
              }}
              className="aspect-video h-full w-full rounded-lg border border-border bg-black"
              ref={AVElRef as React.RefObject<HTMLVideoElement>}
              controls={false}
              onPlay={() => {
                setAVPaused(false);
              }}
              onPause={() => setAVPaused(true)}
              onError={(e) => {
                console.error("Video load failed:", e.currentTarget.error, e.currentTarget.currentSrc);
                void buildPreviewProxy();
              }}
            />
            {previewState !== "idle" && (
              <div
                role="status"
                className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/75 p-4 text-center text-sm text-white"
              >
                {previewState === "working" && (
                  <>
                    <span className="h-6 w-6 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    <span>{t("workspace.preparingPreview")}</span>
                    <span className="h-1.5 w-40 overflow-hidden rounded-full bg-white/20">
                      <span
                        className="block h-full rounded-full bg-spectra transition-[width] duration-300"
                        style={{ width: `${previewPercent}%` }}
                      />
                    </span>
                    <span className="text-xs text-white/70">{previewPercent}%</span>
                  </>
                )}
                {previewState === "failed" && t("workspace.previewUnavailable")}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="relative mb-6 w-full">
        <AVControls
          setAVCurrDurationPer={setAVCurrDurationPer}
          AVCurrDurationPer={AVCurrDurationPer}
          sliderElRef={sliderElRef}
          AVElRef={AVElRef as React.RefObject<HTMLVideoElement>}
          AVPaused={AVPaused}
          cutType={cutType}
          cutTimestamps={cutTimestamps}
          setCutTimestamps={setCutTimestamps}
          startTimestampElRef={startTimestampElRef}
          endTimestampElRef={endTimestampElRef}
        />
        <CutSlider
          AVEl={AVElRef.current}
          cutType={cutType}
          setCutTimestamps={setCutTimestamps}
          cutTimestamps={cutTimestamps}
          initialAVDuration={initialAVDuration}
        />
        <CurrTimeIndicator
          sliderElRef={sliderElRef}
          AVElRef={AVElRef}
          AVCurrDurationPer={AVCurrDurationPer}
        />
      </div>
      <p className="mt-1 self-start text-xs text-muted-foreground">
        {t("operations.cutOutputDuration")}:{" "}
        {formatTimestamp(
          cutType === "cut"
            ? Math.max(
                0,
                initialAVDuration - (cutTimestamps[1] - cutTimestamps[0]),
              )
            : Math.max(0, cutTimestamps[1] - cutTimestamps[0]),
        )}
      </p>
    </>
  );
}
