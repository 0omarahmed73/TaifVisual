import { platform } from "@tauri-apps/plugin-os";
import { Command } from "@tauri-apps/plugin-shell";

import { AndroidCommand } from "@/engine/android";
import type { ToolCommand } from "@/engine/types";
import { isAndroid } from "./platform";

// Desktop sidecars and the Android engine share the ToolCommand contract.
const desktop = (command: unknown) => command as ToolCommand;

export const ffmpeg = (cmd: string[]): ToolCommand => {
  if (isAndroid()) return new AndroidCommand("ffmpeg", cmd);
  if (platform() === "linux") return desktop(Command.create("ffmpeg", cmd));
  return desktop(Command.sidecar("bin/ffmpeg", cmd));
};

export const ffprobe = (cmd: string[]): ToolCommand => {
  if (isAndroid()) return new AndroidCommand("ffprobe", cmd);
  if (platform() === "linux") return desktop(Command.create("ffprobe", cmd));
  return desktop(Command.sidecar("bin/ffprobe", cmd));
};

export const ytDlp = (cmd: string[]): ToolCommand => {
  if (isAndroid()) return new AndroidCommand("ytdlp", cmd);
  return desktop(Command.sidecar("bin/ytDlp", cmd));
};

export const spleeter = (cmd: string[]): ToolCommand => {
  if (isAndroid()) return new AndroidCommand("spleeter", cmd);
  return desktop(Command.sidecar("bin/SpleeterExe", cmd));
};
