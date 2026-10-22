import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";
import { isAndroid } from "@/utils/platform";
import { pickMediaFile } from "@/engine/android";
import { ImagePlus, X } from "lucide-react";

import { useTranslation } from "react-i18next";

interface ImageFileUploaderProps {
  setImageFilePath: React.Dispatch<React.SetStateAction<string>>;
  imageFilePath: string;
}

function ImageFileUploader({
  setImageFilePath,
  imageFilePath,
}: ImageFileUploaderProps) {
  const { t } = useTranslation();

  async function onUploadImageBtnClick() {
    if (isAndroid()) {
      const picked = await pickMediaFile("image");
      if (picked) setImageFilePath(picked);
      return;
    }
    const selectedImageFile = await open({
      multiple: false,
      filters: [
        {
          name: "Image",
          extensions: ["png", "webp", "jpg", "jpeg"],
        },
      ],
    });
    if (selectedImageFile && selectedImageFile !== undefined) {
      setImageFilePath(selectedImageFile);
    }
  }

  return (
    <div className="w-full">
      {imageFilePath === "" ? (
        <button
          type="button"
          onClick={onUploadImageBtnClick}
          className="flex h-[140px] w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-input bg-field text-center transition-colors hover:border-[hsl(var(--spectra-end))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="mb-1 flex h-10 w-10 items-center justify-center rounded-xl bg-secondary text-[hsl(var(--spectra-end))]">
            <ImagePlus className="h-5 w-5" strokeWidth={1.8} />
          </span>
          <b className="text-[13px] font-bold">
            {t("operations.uploadImageBtn")}
          </b>
          <span className="text-xs text-muted-foreground">
            {t("operations.uploadImageDescription")}
          </span>
        </button>
      ) : (
        <div className="flex flex-col gap-2">
          <div className="relative h-[180px] overflow-hidden rounded-xl border border-border bg-field">
            <img
              className="absolute inset-0 h-full w-full object-contain"
              src={convertFileSrc(imageFilePath)}
              alt={t("operations.previewImage")}
            />
            <button
              type="button"
              aria-label={t("workspace.replaceFile")}
              className="absolute end-2 top-2 flex h-7 w-7 items-center justify-center rounded-md bg-background/80 backdrop-blur hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              onClick={() => setImageFilePath("")}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <p className="truncate text-xs text-muted-foreground" dir="auto">
            {imageFilePath.split(/[\\/]/).pop()}
          </p>
        </div>
      )}
    </div>
  );
}

export default ImageFileUploader;
