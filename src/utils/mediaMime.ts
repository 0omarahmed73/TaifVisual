/**
 * Best-effort MIME type for the media player source.
 * WebKitGTK is picky about blob: content types for media elements.
 */
export function getMediaMimeType(filePath: string): string {
  const ext = filePath.split(".").pop()?.toLowerCase() ?? "";
  return (
    {
      mp4: "video/mp4",
      webm: "video/webm",
      mkv: "video/x-matroska",
      mov: "video/quicktime",
      avi: "video/x-msvideo",
      wmv: "video/x-ms-wmv",
      flv: "video/x-flv",
      mp3: "audio/mpeg",
      ogg: "audio/ogg",
      oga: "audio/ogg",
      wav: "audio/wav",
      aac: "audio/aac",
      m4a: "audio/mp4",
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      webp: "image/webp",
    }[ext] ?? "application/octet-stream"
  );
}
