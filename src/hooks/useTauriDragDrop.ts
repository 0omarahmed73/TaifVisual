import { useEffect, useRef } from "react";

import { isTauriRuntime } from "@/utils/tauriEnv";

type DragDropHandlers = {
  /** Called with the dropped file paths (first is what we import). */
  onDrop: (paths: string[]) => void;
  /** Called with true when a drag enters/hovers the window, false on leave/drop. */
  onDragStateChange: (isOver: boolean) => void;
};

/**
 * Registers the Tauri webview drag-and-drop listener so a file dragged
 * anywhere onto the window can be imported. No-ops in plain browsers.
 */
export function useTauriDragDrop(enabled: boolean, handlers: DragDropHandlers) {
  // Keep the latest handlers without re-registering the listener.
  const handlersRef = useRef(handlers);
  handlersRef.current = handlers;

  useEffect(() => {
    if (!enabled || !isTauriRuntime()) return;

    let unlisten: (() => void) | null = null;
    let cancelled = false;

    import("@tauri-apps/api/webview")
      .then(({ getCurrentWebview }) =>
        getCurrentWebview().onDragDropEvent((event) => {
          const { payload } = event;
          const h = handlersRef.current;
          if (payload.type === "enter" || payload.type === "over") {
            h.onDragStateChange(true);
          } else if (payload.type === "leave") {
            h.onDragStateChange(false);
          } else if (payload.type === "drop") {
            h.onDragStateChange(false);
            if (payload.paths.length > 0) h.onDrop(payload.paths);
          }
        }),
      )
      .then((stop) => {
        if (cancelled) stop();
        else unlisten = stop;
      })
      .catch(() => {
        // Listener failed to register; drag-and-drop stays unavailable.
      });

    return () => {
      cancelled = true;
      unlisten?.();
    };
  }, [enabled, handlers]);
}
