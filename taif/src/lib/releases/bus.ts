/**
 * Page-wide handoff of the download center's resolved state so other islands
 * (hero button) reuse it instead of calling GitHub a second time.
 */
import type { DownloadCenterState } from "@/lib/releases/state";

const EVENT = "taif:downloads";

declare global {
  interface Window {
    __taifDownloads?: DownloadCenterState;
  }
}

export function publishDownloadState(state: DownloadCenterState): void {
  window.__taifDownloads = state;
  window.dispatchEvent(new Event(EVENT));
}

export function readDownloadState(): DownloadCenterState | undefined {
  return window.__taifDownloads;
}

export function subscribeDownloadState(listener: () => void): () => void {
  window.addEventListener(EVENT, listener);
  return () => window.removeEventListener(EVENT, listener);
}
