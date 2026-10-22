import { open } from "@tauri-apps/plugin-shell";

import { isAndroid } from "./platform";

/** Opens a web link in the system browser (desktop shell / Android intent). */
export async function openExternal(url: string): Promise<void> {
  if (!/^https?:\/\//i.test(url)) return;
  if (isAndroid() && window.TaifAndroid) {
    window.TaifAndroid.openUrl(url);
    return;
  }
  await open(url);
}
