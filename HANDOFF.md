# TAIF — Handoff (updated 2026-10-23)

# RELEASE STATE (latest)
- Local repo is a clean orphan history (`main`), `.git` ~208 MB (committed Windows assets).
- **GitHub push saga (resolved)**: user's repo `0omarahmed73/TaifVisual`, remote was empty (earlier pushes were all rejected — stale state / OAuth `workflow` scope). Fixed by `gh auth refresh -h github.com -s workflow` device flow (account **omarahmedpl**), `gh auth setup-git`, then push as that account.
- **CI asset-fetch failures (resolved)**: the workflow's curl-fetch step 404'd upstream (`models/2stems/variables/variables.data…` not on upstream LFS media server) and Windows runner needs `shell: bash` for bash blocks. **Final design: no fetch step at all** — all Windows-facing assets are committed in the repo (each < GitHub's 100 MB limit): `bin/{ffmpeg,ffprobe,SpleeterExe,ytDlp}-x86_64-pc-windows-msvc.*`, `models/2stems/**` (real files), and the real 86 MB `resources-windows/tensorflow.dll` (replaced the 133-byte LFS pointer). Still untracked/too big: `resources-linux/libtensorflow*.so.1` (205 MB) and macOS binaries.
- Workflow is **Windows-only** matrix for now (windows-latest); runs on tags `v*`. Tag `v2.0.0` currently points at `13dc62a` ("CI: commit Windows bundled assets directly"), run **#39857048511 in_progress**.
- Before CI, push must touch `main` first (tag alone is enough; contents are on `13dc62a`).
- **Linux deb already built + verified locally**: `src-tauri/target/release/bundle/deb/TAIF_2.0.0_amd64.deb` (sidecars + libtensorflow + model all in place). CI Linux job can be re-added later — it would need `resources-linux/*` fetched again (single 205 MB URL) or committed via LFS.
- After a green run: **draft release "TAIF v2.0.0"** with `.msi`/NSIS `.exe` → user publishes.

## Previous state notes

Rebrand + redesign of basset-2.0.0 (Tauri 2 + React 18 + Vite + Tailwind + Radix, i18n EN/AR/PT).
Design source: Figma Make "Complete Brand Identity Design". Window: 900×600 min (450), **starts maximized**.

State: `npx tsc --noEmit` clean, `npm run build` passes, ESLint clean on all changed files (3 pre-existing findings in untouched files: `tailwind.config.js` CJS no-undef ×2, `ThemeProvider.tsx` react-refresh warning).

## DONE (all verified in-browser at the real window size + in the desktop app)
- **Brand**: TAIF · طَيْف everywhere — window title, GNOME app id (`com.taif.app`), Cargo/package names, release workflow, updater endpoint (now `…/mohammadmansour200/taif/…` placeholder — update checks fail **silently** by design until a TAIF releases repo exists; this also protects the rebrand from upstream updates overwriting it).
- **Tokens**: dark-first charcoal + full light theme in `src/index.css` (`--appbar --field --success --warning --spectra-*`), Manrope + Noto Sans Arabic bundled locally, RTL-safe tracking.
- **Screens**: import (dropzone + URL entry), review (video/audio/image), tool grid (gating: Spleeter non-macOS + A/V only; Compress video-only; Convert/Quality always), configure screens for all six tools, settings dialog (**new: Output location row**), operations-log dialog, onboarding dialog.
- **Flow**: empty → review → tools → configure → processing/success/error (full-window overlays, no dialogs); shared design-system building blocks in `components/ui/Stage.tsx`.
- **Bugs fixed**: shared output-file name (`utils/operations.ts makeOutputUniqueId` + store `outputId`) so the summary and the real file always match; Trim/Cut start from the real duration (Cut defaults 25–50%); cut concat escaping for `'` and Windows paths; import commits only on success (+import-failed toast); updater/notification/version calls guarded outside Tauri; `ErrorBoundary` now **shows the error message** on the recovery card; ErrorBoundary/locale gaps fixed; RTL dialog close button + aria-labels.
- **Media playback on Linux (WebKitGTK)**: WebKitGTK cannot load media via custom protocols (upstream tauri #3725 — GStreamer has no `asset://` handler → `NotSupportedError: The operation is not supported`). Workaround implemented in `AVPlayer`: on Linux the file is read via the fs plugin and played through a `blob:` URL (revoked on unmount/change); other platforms keep `convertFileSrc`. Caveat: whole file is loaded into memory — fine for typical clips, heavy for >500 MB sources (long-term fix: tiny Rust-side HTTP server).
- **Settings → Output location**: stored in localStorage (`output_dir`), honored by `ExecuteBtn`, `useOutputDir` (summary) **and** `fsUtils.copyTmpMediaToMediaDir` (the copy step was the missing piece); fs scope includes `$DOWNLOAD/**/*` for URL-downloaded imports. Reset rows appear only when a custom dir is set.
- **URL download**: works (verified with real YouTube downloads). Loading UX: live `%` parsed from yt-dlp `[download]` lines on **both** streams (`--newline` forces clean line events), plus an independent `.part` size-poll fallback (`[size poll]` lines), and a working **Cancel** (kills the sidecar; no false error toast). URL is sanitized of invisible bidi characters (Arabic-context paste artifacts; fixes false "unsupported domain").
- **Remove Music (Spleeter) end-to-end**: the release archive shipped git-LFS pointer stubs for `bin/SpleeterExe-*linux*`, `resources-linux/libtensorflow*.so.1` and `models/2stems/saved_model.pb` (variables were real). Real binaries were pulled from the GitHub LFS media server and verified against the pointer SHA-256s. The v2.0.0 sidecar requires GLIBC ≥ 2.36/2.38 → **replaced with the v1.1.0 build (needs ≤ 2.34, works on Ubuntu 22.04)**; full pipeline (PCM → separation → wav) verified standalone. If binaries turn into `ASCII text` again, re-download via `https://media.githubusercontent.com/media/mohammadmansour200/basset/refs/heads/main/<path>`.
- **Dependencies**: `react-ripple-click` removed (last use in AVControls restyled away); `@fontsource/ibm-plex-sans-arabic` still in package.json — **uninstall** (unused; fonts are Manrope/Noto now).

## REMAINING (suggested order for Phase 2)
1. Remove `@fontsource/ibm-plex-sans-arabic` from package.json (`npm uninstall`), confirm `src/index.css` imports stay Manrope/Noto only.
2. Exercise the image flows on real device (Quality/Convert/Compress with images via `useImage`) and Audio→Video (`ImageFileUploader`) — renderer verified, live run not yet done in the rebranded build (requires desktop + a real image pick).
3. Production bundling check: `npm run tauri build` on Linux must stage `resources-linux/*` into `$ORIGIN/lib/` (RUNPATH expectation; config maps them to `"lib/"`) and keep sidecar next to libs. Verify the deb layout after the first real build.
4. Decide the update story: point the updater at your own repo + generate `latest.json` on release, or remove the updater button.
5. AVPlayer timeline: optionally replace the ticks pattern with real waveform peaks (needs a decoded-peaks util — ffmpeg → array of bar heights) for the design's true waveform.
6. README screenshots + project-root `taif-*.png` / `sw-*.png` files are build-time artifacts; refresh after the final look and clean the old ones.
