import {
  ArrowRightLeft,
  AudioLines,
  Minimize2,
  MonitorDown,
  Scissors,
  Slice,
  type LucideIcon,
} from "lucide-react";

import { OperationType } from "@/stores/useOperationStore";

/** Unique suffix used in generated output file names: `video_2026_12345_9.mp3`. */
export function makeOutputUniqueId(): string {
  const date = new Date();
  return `${date.getFullYear()}_${Math.random().toString().slice(2, 7)}_${date.getMonth()}`;
}

export type OperationMeta = {
  /** `operations.*` key for the short name. */
  labelKey: string;
  /** `operations.*` key for the one-line card description. */
  cardDescKey: string;
  /** `opDetails.*` key for the longer configure-screen description. */
  detailKey: string;
  Icon: LucideIcon;
};

export const operationMeta: Partial<Record<OperationType, OperationMeta>> = {
  [OperationType.QUALITY_DOWNGRADE]: {
    labelKey: "operations.qualityOperation",
    cardDescKey: "operations.qualityOperationDesc",
    detailKey: "opDetails.quality",
    Icon: MonitorDown,
  },
  [OperationType.SPLEETER]: {
    labelKey: "operations.spleeterOperation",
    cardDescKey: "operations.spleeterOperationDesc",
    detailKey: "opDetails.spleeter",
    Icon: AudioLines,
  },
  [OperationType.TRIM]: {
    labelKey: "operations.trimOperation",
    cardDescKey: "operations.trimOperationDesc",
    detailKey: "opDetails.trim",
    Icon: Scissors,
  },
  [OperationType.CUT]: {
    labelKey: "operations.cutOperation",
    cardDescKey: "operations.cutOperationDesc",
    detailKey: "opDetails.cut",
    Icon: Slice,
  },
  [OperationType.COMPRESS]: {
    labelKey: "operations.compressOperation",
    cardDescKey: "operations.compressOperationDesc",
    detailKey: "opDetails.compress",
    Icon: Minimize2,
  },
  [OperationType.CONVERT]: {
    labelKey: "operations.convertOperation",
    cardDescKey: "operations.convertOperationDesc",
    detailKey: "opDetails.convert",
    Icon: ArrowRightLeft,
  },
};
