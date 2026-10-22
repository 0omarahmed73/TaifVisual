/** Persisted user preference for where processed files are saved. */
const STORAGE_KEY = "output_dir";
/** Fired whenever the preference changes so hooks re-read it. */
export const OUTPUT_DIR_CHANGED_EVENT = "taif-output-dir-changed";

/** The configured output folder, or "" when using the system default. */
export function getOutputDirPref(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

export function setOutputDirPref(dir: string): void {
  try {
    if (dir) localStorage.setItem(STORAGE_KEY, dir);
    else localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event(OUTPUT_DIR_CHANGED_EVENT));
  } catch {
    // Non-Tauri previews may block storage; the setting stays ephemeral.
  }
}
