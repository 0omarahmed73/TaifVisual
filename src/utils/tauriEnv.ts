/**
 * Small guards so Tauri-only APIs degrade gracefully when the frontend
 * runs in a plain browser (dev previews, screenshots) instead of the
 * desktop webview. In the desktop app behavior is unchanged.
 */
export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** Resolves the OS platform via the Tauri OS plugin, or null outside Tauri. */
export async function getPlatformName(): Promise<string | null> {
  if (!isTauriRuntime()) return null;
  try {
    const { platform } = await import("@tauri-apps/plugin-os");
    return await platform();
  } catch {
    return null;
  }
}
