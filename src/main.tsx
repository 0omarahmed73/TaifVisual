import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./i18n.tsx";
import "./index.css";

// Dev-only handles so screens can be previewed in a plain browser (no Tauri).
if (import.meta.env.DEV) {
  Promise.all([
    import("./stores/useFileStore"),
    import("./stores/useOperationStore"),
  ]).then(([file, operation]) => {
    Object.assign(window, {
      __taif: { file: file.useFileStore, operation: operation.useOperationStore, ...file, ...operation },
    });
  });
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
