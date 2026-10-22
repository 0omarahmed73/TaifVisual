import { useEffect, useState } from "react";
import { useOperationStore } from "@/stores/useOperationStore";
import { useTranslation } from "react-i18next";
import { useFileStore } from "@/stores/useFileStore";
import { MediaType } from "@/stores/useFileStore";

import { getIsAudio } from "@/utils/fsUtils";

import { toast } from "sonner";
import ExecuteBtn from "@/components/ui/ExecuteBtn";
import FormatSelect from "@/components/ui/FormatSelect";
import ImageFileUploader from "../ImageFileUploader";

function Convert() {
  const [outputFormat, setOutputFormat] = useState("");
  const [imageFilePath, setImageFilePath] = useState("");

  const { t } = useTranslation();
  const { filePath, mediaType } = useFileStore();
  const setSummaryFormat = useOperationStore((s) => s.setOutputFormat);

  useEffect(() => {
    setSummaryFormat(outputFormat || null);
  }, [outputFormat, setSummaryFormat]);

  const isAudioToVideo =
    mediaType === MediaType.AUDIO && outputFormat === "mp4";

  return (
    <div className="flex flex-col gap-4">
      <FormatSelect format={outputFormat} setFormat={setOutputFormat} />
      {isAudioToVideo && (
        <ImageFileUploader
          setImageFilePath={setImageFilePath}
          imageFilePath={imageFilePath}
        />
      )}
      <ExecuteBtn
        validation={
          outputFormat === ""
            ? () => {
                toast.error(t("executeBtn.selectFormatErr"));
              }
            : isAudioToVideo && !imageFilePath
              ? () => {
                  toast.error(t("executeBtn.selectImageErr"));
                }
              : undefined
        }
        text={t("operations.convertBtn")}
        outputFormat={outputFormat}
        command={
          isAudioToVideo
            ? [
                "-i",
                `${imageFilePath}`,
                "-i",
                `${filePath}`,
                "-pix_fmt",
                "yuv420p",
                "-tune",
                "stillimage",
                "-vf",
                "scale=1280:720,pad=ceil(iw/2)*2:ceil(ih/2)*2",
              ]
            : getIsAudio(outputFormat)
              ? ["-i", `${filePath}`, "-vn"]
              : ["-i", `${filePath}`]
        }
        isImage={mediaType === MediaType.IMAGE}
      />
    </div>
  );
}

export default Convert;
