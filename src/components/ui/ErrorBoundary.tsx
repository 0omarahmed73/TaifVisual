import { Component, type ErrorInfo, type ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

import i18n from "@/i18n";
import { useFileStore } from "@/stores/useFileStore";
import { useOperationStore } from "@/stores/useOperationStore";

type Props = { children: ReactNode };
type State = { hasError: boolean; message: string };

/**
 * Keeps a render crash from blanking the whole window: shows a calm
 * recovery card and returns to the import screen on demand.
 */
class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: "" };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message ?? String(error) };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled UI error:", error, info.componentStack);
  }

  reset = () => {
    useOperationStore.getState().setOperationType(null);
    useFileStore.getState().setFilePath("");
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div
        role="alert"
        dir={i18n.dir()}
        className="flex h-screen flex-col items-center justify-center gap-3 px-8 text-center"
      >
        <span className="flex h-14 w-14 items-center justify-center rounded-2xl border border-destructive/30 bg-destructive/10 text-destructive">
          <TriangleAlert className="h-7 w-7" />
        </span>
        <h1 className="text-xl font-semibold">
          {i18n.t("errorBoundary.title")}
        </h1>
        <p className="max-w-sm text-sm text-muted-foreground">
          {i18n.t("errorBoundary.desc")}
        </p>
        <code
          dir="ltr"
          className="max-w-md overflow-x-auto whitespace-pre-wrap break-all rounded-lg border border-border bg-field p-3 text-start font-mono text-[11px] text-muted-foreground"
        >
          {this.state.message}
        </code>
        <button
          onClick={this.reset}
          className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
          {i18n.t("errorBoundary.reset")}
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
