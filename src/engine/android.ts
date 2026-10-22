import type {
  ProcessHandle,
  TerminatedPayload,
  ToolCommand,
  ToolName,
} from "./types";

/** Methods exposed by the Kotlin `TaifBridge` (`window.TaifAndroid`). */
interface TaifAndroidBridge {
  run(id: string, tool: string, argsJson: string): void;
  kill(id: string): void;
  pickMedia(id: string, kind: string): void;
  saveOutput(id: string, path: string): void;
  openUri(uri: string, mime: string, share: boolean): void;
  openUrl(url: string): void;
  appReady(): void;
  info(): string;
}

declare global {
  interface Window {
    TaifAndroid?: TaifAndroidBridge;
    __taifEngine?: (json: string) => void;
    /** Called by the Android Back button; returns true when the app handled it. */
    __taifBack?: () => boolean;
  }
}

type EngineEvent = {
  id: string;
  type: string;
  data?: string;
  code?: number | null;
  signal?: number | null;
  message?: string;
  path?: string | null;
  name?: string;
  uri?: string | null;
  mime?: string;
  location?: string;
};

type Listener = (event: EngineEvent) => void;
const listeners = new Map<string, Listener>();

function bridge(): TaifAndroidBridge {
  if (!window.TaifAndroid) throw new Error("Android engine is not available");
  return window.TaifAndroid;
}

// Single entry point the Kotlin side calls for every event.
if (typeof window !== "undefined") {
  window.__taifEngine = (json: string) => {
    try {
      const event = JSON.parse(json) as EngineEvent;
      listeners.get(event.id)?.(event);
    } catch (err) {
      console.error("Bad engine event", err);
    }
  };
}

let counter = 0;
const nextId = (prefix: string) => `${prefix}-${Date.now()}-${counter++}`;

class Emitter<T> {
  private handlers: ((value: T) => void)[] = [];
  on(_event: "data", handler: (value: T) => void) {
    this.handlers.push(handler);
    return this;
  }
  emit(value: T) {
    this.handlers.forEach((handler) => handler(value));
  }
}

/** Drop-in replacement for the desktop sidecar `Command`. */
export class AndroidCommand implements ToolCommand {
  stdout = new Emitter<string>();
  stderr = new Emitter<string>();
  private closeHandlers: ((payload: TerminatedPayload) => void)[] = [];
  private errorHandlers: ((error: string) => void)[] = [];

  constructor(
    private tool: ToolName,
    private args: string[],
  ) {}

  on(event: "close", handler: (payload: TerminatedPayload) => void): this;
  on(event: "error", handler: (error: string) => void): this;
  on(event: string, handler: (arg: never) => void): this {
    if (event === "close")
      this.closeHandlers.push(handler as (payload: TerminatedPayload) => void);
    else this.errorHandlers.push(handler as (error: string) => void);
    return this;
  }

  async spawn(): Promise<ProcessHandle> {
    const id = nextId(this.tool);
    let finished = false;

    const finish = () => {
      finished = true;
      listeners.delete(id);
    };

    listeners.set(id, (event) => {
      if (event.type === "stdout") this.stdout.emit(event.data ?? "");
      else if (event.type === "stderr") this.stderr.emit(event.data ?? "");
      else if (event.type === "close") {
        finish();
        this.closeHandlers.forEach((h) =>
          h({ code: event.code ?? null, signal: event.signal ?? null }),
        );
      } else if (event.type === "error") {
        finish();
        this.errorHandlers.forEach((h) => h(event.message ?? "Engine error"));
      }
    });

    try {
      bridge().run(id, this.tool, JSON.stringify(this.args));
    } catch (err) {
      finish();
      throw err;
    }

    return {
      kill: async () => {
        if (!finished) bridge().kill(id);
      },
    };
  }
}

// ---- file helpers ---------------------------------------------------------

function request<T extends EngineEvent>(
  prefix: string,
  start: (id: string) => void,
): Promise<T> {
  const id = nextId(prefix);
  return new Promise<T>((resolve) => {
    listeners.set(id, (event) => {
      listeners.delete(id);
      resolve(event as T);
    });
    start(id);
  });
}

/** Opens the system picker. Resolves with a path in app cache, or null if cancelled. */
export async function pickMediaFile(
  kind: "media" | "image" = "media",
): Promise<string | null> {
  const event = await request("pick", (id) => bridge().pickMedia(id, kind));
  return event.path ?? null;
}

export type SavedOutput = {
  uri: string;
  mime: string;
  location: string;
  name: string;
};

/** Publishes a finished file to Movies/Music/Pictures ▸ TAIF. */
export async function saveOutputFile(path: string): Promise<SavedOutput> {
  const event = await request("save", (id) => bridge().saveOutput(id, path));
  if (!event.uri) throw new Error(event.message || "Could not save the file");
  return {
    uri: event.uri,
    mime: event.mime ?? "",
    location: event.location ?? "",
    name: event.name ?? "",
  };
}

export function openSavedOutput(output: SavedOutput, share = false) {
  bridge().openUri(output.uri, output.mime, share);
}
