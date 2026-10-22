import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { convertFileSrc } from "@tauri-apps/api/core";
import { ChevronRight, RefreshCw } from "lucide-react";

import { MediaType, useFileStore } from "@/stores/useFileStore";
import { OperationType, useOperationStore } from "@/stores/useOperationStore";
import { extNameSync, fileTitleSync, formatFileSize } from "@/utils/fsUtils";
import formatTimestamp from "@/utils/timestampFormatter";
import { operationMeta } from "@/utils/operations";
import { getPlatformName, isTauriRuntime } from "@/utils/tauriEnv";
import { resetWorkspace } from "@/utils/resetWorkspace";
import { cn } from "@/utils/cn";

import { Btn, Eyebrow, MiniFile, StageHead } from "@/components/ui/Stage";

const mediaTypeKey = {
  [MediaType.VIDEO]: "workspace.video",
  [MediaType.AUDIO]: "workspace.audio",
  [MediaType.IMAGE]: "workspace.image",
} as const;

/** File review (step 1) and tool picker (step 2). */
function Workspace() {
  const step = useOperationStore((s) => s.workspaceStep);
  return (
    <main className="mx-auto min-h-screen w-full max-w-[920px] px-[45px] pb-[61px] pt-[calc(61px+34px)]">
      {step === "review" ? <Review /> : <Tools />}
    </main>
  );
}

function Thumb() {
  const { previewImage, duration, mediaType } = useFileStore();
  return (
    <div
      dir="ltr"
      className="relative flex h-[88px] w-[145px] shrink-0 items-end justify-center gap-1.5 overflow-hidden rounded-lg bg-gradient-to-br from-[#2a1d41] to-[#162a3a] pb-[18px]"
    >
      {previewImage ? (
        <img
          src={isTauriRuntime() ? convertFileSrc(previewImage) : previewImage}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        [20, 38, 55, 38, 20].map((height, i) => (
          <i
            key={i}
            style={{ height }}
            className="w-[9px] rounded-lg bg-gradient-to-b from-[hsl(var(--spectra-start))] to-[hsl(var(--spectra-end))]"
          />
        ))
      )}
      {mediaType !== MediaType.IMAGE && duration > 0 && (
        <span className="absolute bottom-[5px] right-[5px] rounded bg-black/70 px-1 py-0.5 text-[10px] font-semibold text-white">
          {formatTimestamp(duration)}
        </span>
      )}
    </div>
  );
}

function Review() {
  const { t } = useTranslation();
  const { filePath, size, duration, mediaType } = useFileStore();
  const setStep = useOperationStore((s) => s.setWorkspaceStep);

  const ext = extNameSync(filePath).toUpperCase();
  const typeLabel = mediaType !== null ? t(mediaTypeKey[mediaType]) : "—";
  const metadata = [
    [
      t("workspace.duration"),
      mediaType === MediaType.IMAGE || duration <= 0
        ? "—"
        : formatTimestamp(duration),
    ],
    [t("workspace.size"), formatFileSize(size)],
    [t("workspace.format"), ext],
    [t("workspace.type"), typeLabel],
  ];

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <StageHead
        step={t("workspace.reviewStep")}
        title={t("workspace.reviewTitle")}
        desc={t("workspace.reviewDesc")}
        extra={
          <Btn
            kind="quiet"
            icon={<RefreshCw className="h-[15px] w-[15px]" strokeWidth={1.8} />}
            onClick={resetWorkspace}
          >
            {t("workspace.replaceFile")}
          </Btn>
        }
      />
      <div className="flex items-center gap-4 rounded-[13px] border border-border bg-gradient-to-br from-card to-background p-3">
        <Thumb />
        <div className="flex min-w-0 flex-col items-start gap-1.5 text-start">
          <Eyebrow className="text-[10px]">
            {typeLabel} · {ext}
          </Eyebrow>
          <b className="max-w-full truncate text-base font-bold" dir="auto">
            {fileTitleSync(filePath)}.{extNameSync(filePath)}
          </b>
        </div>
      </div>
      <dl className="mt-2.5 grid grid-cols-2 rounded-[10px] border border-border sm:grid-cols-4">
        {metadata.map(([label, value]) => (
          <div
            key={label}
            className="flex flex-col gap-1.5 border-e border-border p-3 text-start last:border-e-0"
          >
            <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground [&:lang(ar)]:tracking-normal">
              {label}
            </dt>
            <dd className="text-[13px] font-bold">{value}</dd>
          </div>
        ))}
      </dl>
      <aside className="mt-[22px] flex justify-end">
        <Btn
          onClick={() => setStep("tools")}
          icon={undefined}
          className="gap-2"
        >
          {t("workspace.chooseOperation")}
          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" strokeWidth={2} />
        </Btn>
      </aside>
    </div>
  );
}

function Tools() {
  const { t } = useTranslation();
  const { filePath, size, mediaType } = useFileStore();
  const { setOperationType, setWorkspaceStep } = useOperationStore();
  const [platformName, setPlatformName] = useState<string | null>(null);

  useEffect(() => {
    getPlatformName().then(setPlatformName);
  }, []);

  const isAvMedia =
    mediaType === MediaType.AUDIO || mediaType === MediaType.VIDEO;

  // Operation availability is unchanged from the original tool dialog.
  const available: OperationType[] = [
    OperationType.QUALITY_DOWNGRADE,
    ...(platformName !== null && platformName !== "macos" && isAvMedia
      ? [OperationType.SPLEETER]
      : []),
    ...(isAvMedia ? [OperationType.TRIM, OperationType.CUT] : []),
    ...(mediaType === MediaType.VIDEO ? [OperationType.COMPRESS] : []),
    OperationType.CONVERT,
  ];

  return (
    <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
      <StageHead
        step={t("workspace.toolsStep")}
        title={t("workspace.toolsTitle")}
        desc={t("workspace.toolsDesc")}
        extra={
          <MiniFile
            name={`${fileTitleSync(filePath)}.${extNameSync(filePath)}`}
            meta={formatFileSize(size)}
          />
        }
      />
      <div className="grid grid-cols-2 gap-[9px] md:grid-cols-3">
        {available.map((type) => {
          const meta = operationMeta[type]!;
          return (
            <button
              key={type}
              onClick={() => setOperationType(type)}
              className={cn(
                "grid min-h-[96px] grid-cols-[36px_1fr_14px] items-center gap-[9px] rounded-[10px] border border-border bg-card p-3 text-start transition-all duration-150",
                "hover:-translate-y-px hover:border-muted-foreground/50 hover:bg-secondary",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              )}
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[hsl(var(--spectra-end)/0.08)] text-[hsl(var(--spectra-end))]">
                <meta.Icon className="h-5 w-5" strokeWidth={1.8} />
              </span>
              <span className="flex min-w-0 flex-col gap-1">
                <b className="text-[13px] font-bold">{t(meta.labelKey)}</b>
                <small className="text-xs leading-snug text-muted-foreground">
                  {t(meta.cardDescKey)}
                </small>
              </span>
              <ChevronRight
                className="h-3.5 w-3.5 text-muted-foreground rtl:rotate-180"
                strokeWidth={1.8}
              />
            </button>
          );
        })}
      </div>
      <div className="mt-5">
        <Btn kind="secondary" onClick={() => setWorkspaceStep("review")}>
          {t("workspace.back")}
        </Btn>
      </div>
    </div>
  );
}

export default Workspace;
