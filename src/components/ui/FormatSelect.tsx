import { useTranslation } from "react-i18next";
import { MediaType, useFileStore } from "@/stores/useFileStore";

import { ChoiceGrid, FieldLabel, Notice } from "@/components/ui/Stage";

interface FormatSelectProps {
  format: string;
  setFormat: React.Dispatch<React.SetStateAction<string>>;
}

function FormatSelect({ format, setFormat }: FormatSelectProps) {
  const { t } = useTranslation();
  const { mediaType } = useFileStore();

  const media = (formats: string[]) =>
    formats.map((value) => ({
      value,
      label: value.toUpperCase(),
      hint: value === "mp3" ? t("formatSelect.recommended") : undefined,
    }));

  const options =
    mediaType === MediaType.IMAGE
      ? media(["png", "jpeg", "webp"])
      : mediaType === MediaType.AUDIO
        ? media(["mp3", "aac", "ogg", "wav", "mp4"])
        : media(["mp3", "aac", "ogg", "wav", "mp4", "webm", "mov", "avi", "mkv"]);

  return (
    <div>
      <FieldLabel>{t("formatSelect.label")}</FieldLabel>
      <ChoiceGrid
        label={t("formatSelect.label")}
        value={format}
        onChange={setFormat}
        options={options}
      />
      <Notice>
        <b className="block text-foreground">
          {t("formatSelect.explanationTitle")}
        </b>
        {t("formatSelect.explanation")}
      </Notice>
    </div>
  );
}

export default FormatSelect;
