import { useTranslation } from "react-i18next";
import { MediaType, useFileStore } from "@/stores/useFileStore";

import { ChoiceGrid, FieldLabel } from "@/components/ui/Stage";

interface QualitySelectProps {
  setQuality: React.Dispatch<React.SetStateAction<string>>;
  quality: string;
}

function QualitySelect({ quality, setQuality }: QualitySelectProps) {
  const { t } = useTranslation();
  const { mediaType } = useFileStore();

  const options =
    mediaType === MediaType.VIDEO
      ? [
          { value: "1920:1080", label: "1080p" },
          { value: "1280:720", label: "720p" },
          { value: "640:480", label: "480p" },
          { value: "640:360", label: "360p" },
          { value: "320:240", label: "240p" },
          { value: "256:144", label: "144p" },
        ]
      : mediaType === MediaType.AUDIO
        ? [
            { value: "320k", label: t("qualitySelect.high"), hint: "320 kbps" },
            { value: "128k", label: t("qualitySelect.medium"), hint: "128 kbps" },
            { value: "64k", label: t("qualitySelect.low"), hint: "64 kbps" },
          ]
        : [
            { value: "90", label: t("qualitySelect.high"), hint: "90%" },
            { value: "60", label: t("qualitySelect.medium"), hint: "60%" },
            { value: "30", label: t("qualitySelect.low"), hint: "30%" },
          ];

  return (
    <div>
      <FieldLabel>{t("qualitySelect.selectLabel")}</FieldLabel>
      <ChoiceGrid
        label={t("qualitySelect.selectLabel")}
        value={quality}
        onChange={setQuality}
        options={options}
      />
    </div>
  );
}

export default QualitySelect;
