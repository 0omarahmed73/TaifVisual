import { appCacheDir, downloadDir, join } from "@tauri-apps/api/path";
import { mkdir } from "@tauri-apps/plugin-fs";

import { isAndroid } from "./platform";

/**
 * Folder yt-dlp downloads into. Desktop uses the user's Downloads folder;
 * Android has no such app-readable folder, so it uses app cache (the file is
 * published to the media library after processing).
 */
export async function getDownloadTempDir(): Promise<string> {
  if (!isAndroid()) return downloadDir();
  const dir = await join(await appCacheDir(), "downloads");
  await mkdir(dir, { recursive: true }).catch(() => undefined);
  return dir;
}
