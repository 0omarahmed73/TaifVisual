import {
  isPermissionGranted,
  sendNotification,
} from "@tauri-apps/plugin-notification";
import {
  appLocalDataDir,
  audioDir,
  extname,
  join,
  videoDir,
  basename,
  pictureDir,
} from "@tauri-apps/api/path";
import { open } from "@tauri-apps/plugin-shell";

import { useTranslation } from "react-i18next";
import useFFmpeg from "@/hooks/useFFmpeg";
import useSpleeter from "@/hooks/useSpleeter";
import useImage from "@/hooks/useImage";
import { useFileStore } from "@/stores/useFileStore";
import { useOperationStore } from "@/stores/useOperationStore";
import { useEffect, useState } from "react";
import type { OperationType } from "@/stores/useOperationStore";

import { ensureDir, getIsAudio } from "@/utils/fsUtils";

import { createPortal } from "react-dom";
import { toast } from "sonner";
import { Check, FileText, FolderOpen, RefreshCw, TriangleAlert } from "lucide-react";

import { makeOutputUniqueId, operationMeta } from "@/utils/operations";
import { fileTitleSync, extNameSync } from "@/utils/fsUtils";
import { resetWorkspace } from "@/utils/resetWorkspace";
import { getOutputDirPref } from "@/utils/outputDirPref";
import { TaifMark } from "./Brand";
import { Btn, Eyebrow } from "./Stage";

interface ExecuteBtnProps {
  command?: string[];
  isSpleeter?: boolean;
  isImage?: boolean;
  text?: string;
  outputFormat?: string;
  customFunction?: () => Promise<void>;
  validation?: () => void;
}

function ExecuteBtn({
  command,
  isSpleeter = false,
  isImage = false,
  text,
  outputFormat,
  customFunction,
  validation,
}: ExecuteBtnProps) {
  const {
    runFFmpeg,
    killFFmpeg,
    cmdStatus: cmdStatusFFmpeg,
    progress: progressFFmpeg,
    errInfo: errInfoFFmpeg,
  } = useFFmpeg();
  const {
    runSpleeter,
    killSpleeter,
    cmdStatus: cmdStatusSpleeter,
    progress: progressSpleeter,
    errInfo: errInfoSpleeter,
  } = useSpleeter();
  const {
    cmdStatus: cmdStatusImage,
    errInfo: errInfoImage,
    progress: progressImage,
    compressImage,
  } = useImage();

  const cmdStatus = isSpleeter
    ? cmdStatusSpleeter
    : isImage
      ? cmdStatusImage
      : cmdStatusFFmpeg;
  const progress = isSpleeter
    ? progressSpleeter
    : isImage
      ? progressImage
      : progressFFmpeg;
  const errInfo = isSpleeter
    ? errInfoSpleeter
    : isImage
      ? errInfoImage
      : errInfoFFmpeg;
  const killProcess = isSpleeter ? killSpleeter : killFFmpeg;

  const [outputPath, setOutputPath] = useState("");
  const [outputDir, setOutputDir] = useState("");

  const [showResult, setShowResult] = useState(false)
  const [actionsSlot, setActionsSlot] = useState<HTMLElement | null>(null);

  const { t, i18n } = useTranslation();

  const { filePath } = useFileStore();
  const {
    cmdProcessing,
    operationType,
    logs,
    setCmdProcessing,
    setLogs,
    outputId,
    setOutputId,
  } = useOperationStore();

  useEffect(() => {
    setActionsSlot(document.getElementById("stage-actions"));
  }, []);

  async function onStartBtnClick() {
    if (validation !== undefined) {
      validation();
      return;
    }

    await ensureDir("inputTxtFiles");
    await ensureDir("output");

    if (customFunction !== undefined) await customFunction();

    const fileExt = await extname(filePath);
    const fileName = (await basename(filePath)).replace(`.${fileExt}`, "");

    // Reuse the id shown in the config summary (regenerate when missing).
    const id = outputId ?? (() => {
      const generated = makeOutputUniqueId();
      setOutputId(generated);
      return generated;
    })();

    const outputFileFormat =
      outputFormat === undefined ? fileExt : outputFormat;

    const outputFileBasename = `${fileName}_${id}.${outputFileFormat}`;

    const tempFilePath = await join(
      await appLocalDataDir(),
      "output",
      outputFileBasename,
    );
    const isAudio = getIsAudio(tempFilePath);
    const finalDir =
      getOutputDirPref() ||
      (isAudio
        ? await audioDir()
        : isImage
          ? await pictureDir()
          : await videoDir());

    const finalPath = await join(finalDir, outputFileBasename);

    setOutputPath(finalPath);
    setOutputDir(finalDir);

    if (!isImage) {
      isSpleeter
        ? await runSpleeter(outputFileBasename)
        : await runFFmpeg(command as string[], tempFilePath);
    } else {
      await compressImage(
        filePath,
        finalPath,
        outputFormat ? "100" : (command as string[])[0],
      );
    }
  }

  useEffect(() => {
    async function handleStatus() {
      if (cmdStatus === "success") setShowResult(true);
      if (cmdStatus === "error") {
        setShowResult(true);
        const permissionGranted = await isPermissionGranted();
        if (permissionGranted) {
          sendNotification({
            title: errInfo
              ? t(`executeBtn.${errInfo}Title`)
              : t(`executeBtn.unknownErrTitle`),
            body:
              errInfo && errInfo !== "unknownErr"
                ? t(`executeBtn.${errInfo}Desc`)
                : undefined,
          });
        }
      }
    }
    handleStatus();
  }, [errInfo, t, cmdStatus]);

  async function openOutputPath() {
    await open(outputPath);
  }

  async function openOutputDir() {
    await open(outputDir);
  }

  function onStartClick() {
    onStartBtnClick().catch((err) => {
      console.error("Failed to start operation:", err);
      setCmdProcessing(false);
      const detail = err instanceof Error ? err.message : String(err);
      // Surface the real cause in the toast and the operations log
      // instead of hiding it behind the generic title.
      toast.error(t("executeBtn.unknownErrTitle"), { description: detail });
      setLogs(`Failed to start operation: ${detail}`);
    });
  }

  const opName = t(operationMeta[operationType as OperationType]?.labelKey ?? "");
  const sourceName = `${fileTitleSync(filePath)}.${extNameSync(filePath)}`;
  const outputName = outputPath.split(/[\\/]/).pop() ?? "";
  const percent = Math.min(100, Math.trunc(progress));
  const isError = cmdStatus === "error";

  const startButton = (
    <Btn onClick={onStartClick} disabled={cmdProcessing}>
      {text}
    </Btn>
  );

  return (
    <>
      {actionsSlot ? createPortal(startButton, actionsSlot) : startButton}

      {cmdProcessing &&
        createPortal(
          <StageOverlay>
            <div className="relative mb-4 flex h-[100px] w-[100px] items-center justify-center">
              <TaifMark className="h-[66px] w-[66px] text-foreground" />
              <i className="absolute inset-0 animate-spin rounded-full border border-border border-t-[hsl(var(--spectra-end))] [animation-duration:1.6s]" />
            </div>
            <Eyebrow>{t("result.processingEyebrow")}</Eyebrow>
            <h1 className="mt-2 text-[32px] font-extrabold leading-[1.15] tracking-[-0.04em] [&:lang(ar)]:tracking-normal">
              {t("result.inProgress", { op: opName })}
            </h1>
            <p className="mt-2 max-w-[500px] text-sm leading-relaxed text-muted-foreground">
              {t("result.working", { name: sourceName })}
            </p>
            <div
              dir={i18n.dir()}
              className="mt-[22px] w-[490px] max-w-[80%] text-start"
            >
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{t("result.preparing")}</span>
                <b className="text-foreground">{percent}%</b>
              </div>
              <div
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={percent}
                className="my-4 h-[5px] overflow-hidden rounded-full bg-secondary"
              >
                <div
                  className="h-full rounded-full bg-spectra transition-[width] duration-200"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
            {!isImage && (
              <Btn
                kind="quiet"
                onClick={async () => {
                  await killProcess();
                  setOutputPath("");
                }}
              >
                {t("executeBtn.cancelBtn")}
              </Btn>
            )}
          </StageOverlay>,
          document.body,
        )}

      {!cmdProcessing &&
        showResult &&
        cmdStatus === "success" &&
        createPortal(
          <StageOverlay>
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-[15px] border border-success/25 bg-success/10 text-success">
              <Check className="h-7 w-7" strokeWidth={1.8} />
            </span>
            <Eyebrow>{t("result.completeEyebrow")}</Eyebrow>
            <h1 className="mt-2 text-[32px] font-extrabold leading-[1.15] tracking-[-0.04em] [&:lang(ar)]:tracking-normal">
              {t("result.readyTitle")}
            </h1>
            <p className="mt-2 max-w-[500px] text-sm leading-relaxed text-muted-foreground">
              {t("result.completedBody", { op: opName })}
            </p>
            <div
              dir={i18n.dir()}
              className="mb-2 mt-[22px] flex w-[590px] max-w-[90%] flex-wrap items-center gap-3 rounded-[11px] border border-border bg-card p-3"
            >
              <div className="flex min-w-0 flex-1 items-center gap-2.5 text-start">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-[hsl(var(--spectra-end))]">
                  <FileText className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <span className="flex min-w-0 flex-col gap-0.5">
                  <b className="truncate text-xs font-semibold" dir="auto">
                    {outputName}
                  </b>
                  <small
                    className="truncate text-[11px] text-muted-foreground"
                    dir="ltr"
                    title={outputDir}
                  >
                    {outputDir}
                  </small>
                </span>
              </div>
              <div className="flex gap-1.5">
                <Btn
                  onClick={openOutputDir}
                  icon={<FolderOpen className="h-[15px] w-[15px]" strokeWidth={1.8} />}
                >
                  {t("executeBtn.outputDir")}
                </Btn>
                <Btn kind="secondary" onClick={openOutputPath}>
                  {t("executeBtn.outputFile")}
                </Btn>
              </div>
            </div>
            <div className="flex gap-1">
              <Btn kind="quiet" onClick={() => setShowResult(false)}>
                {t("workspace.back")}
              </Btn>
              <Btn
                kind="quiet"
                icon={<RefreshCw className="h-[15px] w-[15px]" strokeWidth={1.8} />}
                onClick={() => {
                  setShowResult(false);
                  resetWorkspace();
                }}
              >
                {t("result.another")}
              </Btn>
            </div>
          </StageOverlay>,
          document.body,
        )}

      {!cmdProcessing &&
        showResult &&
        isError &&
        createPortal(
          <StageOverlay>
            <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-[15px] border border-destructive/25 bg-destructive/10 text-destructive">
              <TriangleAlert className="h-[27px] w-[27px]" strokeWidth={1.8} />
            </span>
            <Eyebrow>{t("result.errorEyebrow")}</Eyebrow>
            <h1 className="mt-2 text-[32px] font-extrabold leading-[1.15] tracking-[-0.04em] [&:lang(ar)]:tracking-normal">
              {errInfo
                ? t(`executeBtn.${errInfo}Title`)
                : t("executeBtn.unknownErrTitle")}
            </h1>
            {errInfo && errInfo !== "unknownErr" && (
              <p className="mt-2 max-w-[500px] text-sm leading-relaxed text-muted-foreground">
                {t(`executeBtn.${errInfo}Desc`)}
              </p>
            )}
            {logs.length > 0 && (
              <aside
                dir="ltr"
                className="my-[18px] flex w-[500px] max-w-[80%] flex-col rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-start"
              >
                <span className="text-[10px] font-bold tracking-[0.12em] text-muted-foreground">
                  {t("result.details")}
                </span>
                <code className="mt-1 max-h-[72px] overflow-auto whitespace-pre-wrap break-all font-mono text-[11px] text-destructive">
                  {logs.slice(-3).join("").trim().slice(-400)}
                </code>
              </aside>
            )}
            <div className="mt-4 flex gap-2">
              <Btn onClick={() => setShowResult(false)}>
                {t("result.tryAgain")}
              </Btn>
              <Btn
                kind="secondary"
                onClick={() => {
                  setShowResult(false);
                  resetWorkspace();
                }}
              >
                {t("result.backToStart")}
              </Btn>
            </div>
          </StageOverlay>,
          document.body,
        )}
    </>
  );
}

/** Full-window state view that sits between the app bar and footer strip. */
function StageOverlay({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-x-0 bottom-[29px] top-[61px] z-40 overflow-auto bg-background">
      <div className="flex min-h-full animate-in flex-col items-center justify-center p-9 text-center duration-200 fade-in-0">
        {children}
      </div>
    </div>
  );
}

export default ExecuteBtn;
