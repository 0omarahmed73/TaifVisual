import { useEffect, useState } from "react";
import { audioDir, pictureDir, videoDir } from "@tauri-apps/api/path";

import { MediaType } from "@/stores/useFileStore";
import { isTauriRuntime } from "@/utils/tauriEnv";
import { getOutputDirPref, OUTPUT_DIR_CHANGED_EVENT } from "@/utils/outputDirPref";

/**
 * Folder the finished file is copied to: the user's configured output
 * location if set, otherwise the media-specific system folder (Videos /
 * Audios / Pictures), mirroring ExecuteBtn's choice.
 */
export function useOutputDir(
  mediaType: MediaType | null,
  outputIsAudio: boolean,
): string {
  const [dir, setDir] = useState("");
  const [prefVersion, setPrefVersion] = useState(0);

  useEffect(() => {
    const bump = () => setPrefVersion((v) => v + 1);
    window.addEventListener(OUTPUT_DIR_CHANGED_EVENT, bump);
    return () => window.removeEventListener(OUTPUT_DIR_CHANGED_EVENT, bump);
  }, []);

  const prefDir = getOutputDirPref();

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!isTauriRuntime() || prefDir) return;
      try {
        const path =
          outputIsAudio || mediaType === MediaType.AUDIO
            ? await audioDir()
            : mediaType === MediaType.IMAGE
              ? await pictureDir()
              : await videoDir();
        if (!cancelled) setDir(path);
      } catch {
        if (!cancelled) setDir("");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [mediaType, outputIsAudio, prefDir, prefVersion]);

  return prefDir || dir;
}
