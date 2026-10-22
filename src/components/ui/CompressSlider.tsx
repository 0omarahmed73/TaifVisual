import { useTranslation } from "react-i18next";

import { getPercentage } from "@/utils/getPercentage";

import { Slider } from "./Slider";
import { FieldLabel, Notice } from "./Stage";

interface CompressSliderProps {
  setCompressRate: React.Dispatch<React.SetStateAction<number>>;
  compressRate: number;
}

function CompressSlider({
  setCompressRate,
  compressRate,
}: CompressSliderProps) {
  const { t } = useTranslation();

  const compressPercentage = Math.trunc(getPercentage(compressRate, 25));

  return (
    <>
      <FieldLabel
        hint={
          <span className="rounded-md border border-border bg-field px-2 py-1 text-xs font-bold text-foreground">
            {compressPercentage}%
          </span>
        }
      >
        {t("workspace.compressField")}
      </FieldLabel>
      <div dir="ltr" className="px-1 py-2">
        <Slider
          aria-label={t("workspace.compressField")}
          onValueChange={(value) => setCompressRate(Number(value))}
          min={0}
          step={0.2}
          max={25}
          defaultValue={[8]}
        />
      </div>
      <Notice>{t("operations.compressTip")}</Notice>
    </>
  );
}

export default CompressSlider;
