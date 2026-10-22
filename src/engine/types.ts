/** Handle to a running tool (desktop sidecar child or Android process). */
export interface ProcessHandle {
  kill(): Promise<void>;
}

export interface TerminatedPayload {
  code: number | null;
  signal: number | null;
}

/**
 * The subset of the Tauri shell `Command` API the app relies on. Both the
 * desktop sidecars and the Android engine implement it, so hooks stay
 * platform-agnostic.
 */
export interface ToolCommand {
  on(event: "close", handler: (payload: TerminatedPayload) => void): unknown;
  on(event: "error", handler: (error: string) => void): unknown;
  stdout: { on(event: "data", handler: (line: string) => void): unknown };
  stderr: { on(event: "data", handler: (line: string) => void): unknown };
  spawn(): Promise<ProcessHandle>;
}

export type ToolName = "ffmpeg" | "ffprobe" | "ytdlp" | "spleeter";
