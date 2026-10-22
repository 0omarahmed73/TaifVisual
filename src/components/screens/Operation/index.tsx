import { useEffect } from "react";
import { useTranslation } from "react-i18next";

import { OperationType, useOperationStore } from "@/stores/useOperationStore";
import { useFileStore } from "@/stores/useFileStore";
import { operationMeta } from "@/utils/operations";
import {
  extNameSync,
  fileTitleSync,
  formatFileSize,
  getIsAudio,
} from "@/utils/fsUtils";
import { useOutputDir } from "@/hooks/useOutputDir";
import { makeOutputUniqueId } from "@/utils/operations";

import Convert from "@/components/ui/Operations/Convert";
import Compress from "@/components/ui/Operations/Compress";
import Quality from "@/components/ui/Operations/Quality";
import Trim from "@/components/ui/Operations/Trim";
import Cut from "@/components/ui/Operations/Cut";
import RemoveMusic from "@/components/ui/Operations/RemoveMusic";
import { Btn, Eyebrow, MiniFile, Panel, StageHead } from "@/components/ui/Stage";

function Summary() {
  const { t } = useTranslation();
  const { filePath, mediaType } = useFileStore();
  const { operationType, outputFormat, outputId } = useOperationStore();
  const meta = operationMeta[operationType as OperationType]!;

  const ext = outputFormat || extNameSync(filePath);
  const dir = useOutputDir(mediaType, getIsAudio(`x.${ext}`));
  const rows: [string, string][] = [
    [t("workspace.destination"), dir || "—"],
    [t("workspace.preserved"), t("workspace.yes")],
  ];

  return (
    <Panel className="flex flex-col text-start">
      <Eyebrow className="text-[10px] text-muted-foreground">
        {t("workspace.summary")}
      </Eyebrow>
      <span className="my-3.5 flex h-10 w-10 items-center justify-center rounded-[9px] bg-[hsl(var(--spectra-end)/0.08)] text-[hsl(var(--spectra-end))]">
        <meta.Icon className="h-5 w-5" strokeWidth={1.8} />
      </span>
      <b className="break-words text-[13px] font-bold" dir="auto">
        {fileTitleSync(filePath)}_{outputId ?? makeOutputUniqueId()}.{ext}
      </b>
      {rows.map(([label, value]) => (
        <p
          key={label}
          className="mt-2.5 flex flex-col gap-1 border-t border-border pt-2.5"
        >
          <span className="text-[11px] text-muted-foreground">{label}</span>
          <strong
            className="break-all text-xs font-semibold"
            dir="ltr"
            title={value}
          >
            {value}
          </strong>
        </p>
      ))}
      <small className="mt-3 text-[11px] leading-snug text-muted-foreground">
        {t("workspace.summaryNote")}
      </small>
    </Panel>
  );
}

function Operation() {
  const { t } = useTranslation();
  const { filePath, size } = useFileStore();
  const { operationType, setOperationType, cmdProcessing, setOutputFormat, outputId, setOutputId } =
    useOperationStore();
  const meta = operationMeta[operationType as OperationType];

  // One unique id per config visit so the summary and the real output
  // file name (generated in ExecuteBtn) always match.
  useEffect(() => {
    if (outputId === null) {
      setOutputId(makeOutputUniqueId());
    }
    return () => setOutputId(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // The summary's output format only applies to the Convert screen
  useEffect(() => () => setOutputFormat(null), [setOutputFormat]);

  if (!meta) return null;

  return (
    <main className="mx-auto min-h-screen w-full max-w-[920px] px-[45px] pb-[61px] pt-[calc(61px+34px)]">
      <div className="animate-in fade-in-0 slide-in-from-bottom-1 duration-300">
        <StageHead
          step={t("workspace.configStep")}
          title={t(meta.labelKey)}
          desc={t(meta.detailKey)}
          extra={
            <MiniFile
              name={`${fileTitleSync(filePath)}.${extNameSync(filePath)}`}
              meta={formatFileSize(size)}
            />
          }
        />
        <div className="grid items-start gap-2.5 md:grid-cols-[1.5fr_0.65fr]">
          <Panel className="min-w-0 p-[18px]">
            {operationType === OperationType.TRIM && <Trim />}
            {operationType === OperationType.CUT && <Cut />}
            {operationType === OperationType.SPLEETER && <RemoveMusic />}
            {operationType === OperationType.COMPRESS && <Compress />}
            {operationType === OperationType.CONVERT && <Convert />}
            {operationType === OperationType.QUALITY_DOWNGRADE && <Quality />}
          </Panel>
          <Summary />
        </div>
        <aside className="mt-[22px] flex items-center justify-between gap-3 border-t border-border pt-4">
          <Btn
            kind="secondary"
            disabled={cmdProcessing}
            onClick={() => setOperationType(null)}
          >
            {t("workspace.back")}
          </Btn>
          {/* ExecuteBtn portals its start button here */}
          <div id="stage-actions" className="flex items-center gap-2" />
        </aside>
      </div>
    </main>
  );
}

export default Operation;

