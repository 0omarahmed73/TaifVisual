import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useFileStore } from "@/stores/useFileStore";
import { MediaType } from "@/stores/useFileStore";

import ExecuteBtn from "@/components/ui/ExecuteBtn";
import QualitySelect from "@/components/ui/QualitySelect";
import { Notice } from "../Stage";

function Quality() {
  const { filePath, mediaType } = useFileStore();
  const { t } = useTranslation();
  const [quality, setQuality] = useState(
    mediaType === MediaType.VIDEO
      ? "1280:720"
      : mediaType === MediaType.AUDIO
        ? "128k"
        : "60",
  );

  return (
    <div className="flex flex-col">
      <QualitySelect setQuality={setQuality} quality={quality} />
      <Notice>
        <b className="block text-foreground">
          {t("qualitySelect.explanationTitle")}
        </b>
        {t("qualitySelect.explanation")}
      </Notice>
      <ExecuteBtn
        text={t("operations.startBtn")}
        command={
          mediaType === MediaType.AUDIO
            ? ["-i", `${filePath}`, "-b:a", `${quality}`]
            : mediaType === MediaType.VIDEO
              ? ["-i", `${filePath}`, "-vf", `scale=${quality}`]
              : [quality]
        }
        isImage={mediaType === MediaType.IMAGE}
      />
    </div>
  );
}

export default Quality;
