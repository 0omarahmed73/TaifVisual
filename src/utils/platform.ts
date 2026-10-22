/** True inside the Android build, where the Kotlin engine bridge is injected. */
export function isAndroid(): boolean {
  return typeof window !== "undefined" && "TaifAndroid" in window;
}
