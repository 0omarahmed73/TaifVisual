import { Child } from "@tauri-apps/plugin-shell";
import { create } from "zustand";

export enum OperationType {
  TEST,
  CUT,
  TRIM,
  COMPRESS,
  QUALITY_DOWNGRADE,
  CONVERT,
  SPLEETER,
}

type State = {
  operationType: OperationType | null;
  cmdProcessing: boolean;
  logs: string[];
  process: Child | null;
  workspaceStep: "review" | "tools";
  /** Destination format chosen on the Convert screen (for the summary). */
  outputFormat: string | null;
  /** Unique suffix shared by the summary and the real output file name. */
  outputId: string | null;
};

type Action = {
  setOperationType: (type: State["operationType"]) => void;
  setCmdProcessing: (cmdProcessing: State["cmdProcessing"]) => void;
  setLogs: (logs: State["logs"] | string) => void;
  setProcess: (process: State["process"]) => void;
  setWorkspaceStep: (step: State["workspaceStep"]) => void;
  setOutputFormat: (format: State["outputFormat"]) => void;
  setOutputId: (id: State["outputId"]) => void;
};

export const useOperationStore = create<State & Action>((set) => ({
  operationType: null,
  mediaType: null,
  cmdProcessing: false,
  logs: [],
  process: null,
  workspaceStep: "review",
  outputFormat: null,
  outputId: null,
  setOutputFormat: (format) => set(() => ({ outputFormat: format })),
  setOutputId: (id) => set(() => ({ outputId: id })),
  setWorkspaceStep: (step) => set(() => ({ workspaceStep: step })),
  setOperationType: (type) => set(() => ({ operationType: type })),
  setCmdProcessing: (cmdProcessing) =>
    set(() => ({ cmdProcessing: cmdProcessing })),
  setLogs: (logs) =>
    set((state) => ({
      logs: Array.isArray(logs) ? logs : [...state.logs, logs],
    })),
  setProcess: (process) => set(() => ({ process: process })),
}));
