import { open } from "@tauri-apps/plugin-dialog";
import { stat } from "@tauri-apps/plugin-fs";

import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFileStore } from "@/stores/useFileStore";
import { MediaType } from "@/stores/useFileStore";

import {
  getIsAudio,
  getIsImage,
  getIsVideo,
} from "@/utils/fsUtils";
import {
  extractPreviewImage,
  getMediaDuration,
} from "@/utils/ffmpegHelperUtils";
import { toast } from "sonner";

import { Upload } from "lucide-react";
import { cn } from "@/utils/cn";

import { useTauriDragDrop } from "@/hooks/useTauriDragDrop";
import { Eyebrow } from "@/components/ui/Stage";
import OnBoardDialog from "./OnBoardDialog";
import DownloadFromInternet from "./DownloadFromInternet";

function FileUpload() {
  const { t } = useTranslation();
  const { setDuration, setFilePath, setMediaType, setPreviewImage, setSize } =
    useFileStore();
  const [isDragOver, setIsDragOver] = useState(false);

  /** Shared import flow: media detection, size, preview and duration. */
  const handleImportPath = useCallback(
    async (selectedFile: string) => {
      if (
        !getIsAudio(selectedFile) &&
        !getIsImage(selectedFile) &&
        !getIsVideo(selectedFile)
      ) {
        toast.error(t("uploadPage.unsupportedFileErr"));
        return;
      }

      let determinedMediaType: MediaType | null = null;

      if (getIsAudio(selectedFile)) {
        determinedMediaType = MediaType.AUDIO;
      } else if (getIsImage(selectedFile)) {
        determinedMediaType = MediaType.IMAGE;
      } else {
        determinedMediaType = MediaType.VIDEO;
      }

      try {
        const { size } = await stat(selectedFile);
        const previewImage = await extractPreviewImage(
          selectedFile,
          determinedMediaType,
        );
        const duration = await getMediaDuration(selectedFile);

        // Commit only once everything resolved so a failure can't leave
        // the app on an operation screen with half-loaded media.
        setMediaType(determinedMediaType);
        setSize(size);
        setPreviewImage(previewImage);
        setDuration(duration);
        setFilePath(selectedFile);
      } catch (err) {
        console.error("Failed to import file:", err);
        toast.error(t("uploadPage.importFailedErr"));
      }
    },
    [t, setFilePath, setDuration, setMediaType, setPreviewImage, setSize],
  );

  // Existing file-picker flow (also available via Ctrl/Cmd + O).
  const onFileUpload = useCallback(async function onFileUpload() {
    const selectedFile = await open({
      multiple: false,
      filters: [
        {
          name: "Video/Audio/Image",
          extensions: [
            "mp4",
            "avi",
            "mov",
            "mkv",
            "wmv",
            "flv",
            "webm",
            "aac",
            "mp3",
            "ogg",
            "wav",
            "m4a",
            "png",
            "webp",
            "jpg",
            "jpeg",
          ],
        },
      ],
    });
    if (selectedFile === undefined || selectedFile === null) return;

    await handleImportPath(selectedFile);
  }, [handleImportPath]);

  const onDroppedFiles = useCallback(
    (paths: string[]) => {
      if (paths.length === 0) return;
      handleImportPath(paths[0]);
    },
    [handleImportPath],
  );

  useTauriDragDrop(true, {
    onDrop: onDroppedFiles,
    onDragStateChange: setIsDragOver,
  });

  return (
    <main>
      <OnBoardDialog />
      <div className="flex min-h-screen flex-col items-center justify-center px-9 pb-[29px] pt-[61px] text-center">
        <Eyebrow>{t("uploadPage.eyebrow")}</Eyebrow>
        <h1 className="mt-2 text-[32px] font-extrabold leading-[1.15] tracking-[-0.04em] [&:lang(ar)]:tracking-normal">
          {t("uploadPage.title")}
        </h1>
        <p className="mt-2 max-w-[500px] text-sm leading-relaxed text-muted-foreground">
          {t("uploadPage.subtitle")}
        </p>

        {/* Import dropzone */}
        <button
          onClick={onFileUpload}
          className={cn(
            "group mt-5 flex h-[168px] w-[520px] max-w-full cursor-pointer flex-col items-center justify-center rounded-[14px] border border-dashed border-input bg-card/40 transition-colors duration-200",
            "hover:border-[hsl(var(--spectra-end))] hover:bg-[hsl(var(--spectra-end)/0.04)]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            isDragOver &&
              "border-[hsl(var(--spectra-end))] bg-[hsl(var(--spectra-end)/0.06)] ring-2 ring-ring",
          )}
        >
          <span className="mb-3.5 flex h-[46px] w-[46px] items-center justify-center rounded-[13px] bg-secondary text-[hsl(var(--spectra-end))]">
            <Upload className="h-[22px] w-[22px]" strokeWidth={1.8} />
          </span>
          <b className="text-[15px] font-bold">
            {isDragOver ? t("uploadPage.dropNow") : t("uploadPage.dropTitle")}
          </b>
          <small className="mt-1.5 max-w-[400px] truncate px-4 text-xs text-muted-foreground">
            {t("uploadPage.dropSub")}
          </small>
          <em className="mt-4 text-[10px] font-semibold not-italic tracking-[0.12em] text-muted-foreground/70 [&:lang(ar)]:tracking-normal">
            {t("uploadPage.formats")}
          </em>
        </button>

        <DownloadFromInternet />
      </div>
    </main>
  );
}

export default FileUpload;
