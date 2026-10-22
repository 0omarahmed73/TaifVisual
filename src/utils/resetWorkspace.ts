import { useFileStore } from "@/stores/useFileStore";
import { useOperationStore } from "@/stores/useOperationStore";

/** Returns the app to the empty import screen. */
export function resetWorkspace() {
  const file = useFileStore.getState();
  file.setFilePath("");
  file.setMediaType(null);
  file.setPreviewImage(null);
  file.setDuration(0);
  file.setSize(0);
  const operation = useOperationStore.getState();
  operation.setOperationType(null);
  operation.setWorkspaceStep("review");
  operation.setOutputFormat(null);
  operation.setOutputId(null);
}
