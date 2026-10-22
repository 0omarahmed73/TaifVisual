<div align="center">

# TAIF · طَيْف

**Audio & Video Toolkit — your media, your way.**

A free, local-first desktop utility for trimming, cutting, compressing, converting and downgrading the quality of your audio, video and image files — plus AI-powered vocal separation and URL downloads.

</div>

## Features

| Tool | What it does |
| --- | --- |
| Downgrade Quality | Reduce resolution / bitrate and size |
| Remove Music | Separate vocals from music (AI, runs locally) |
| Trim | Cut from the ends of the file |
| Cut | Remove a middle section |
| Compress | Shrink the file, similar quality |
| Convert | Change the output format (video ↔ audio ↔ image) |
| Download from URL | Fetch videos/audio via yt-dlp (YouTube, X, Soundcloud, …) |

Everything runs on your device. No servers, no accounts.

## Download

Installers for Windows and Linux are available on the [**Releases**](https://github.com/0omarahmed73/TaifVisual/releases) page:

- **Windows**: `TAIF_2.0.0_x64_en-US.msi`
- **Linux (Debian/Ubuntu)**: `TAIF_2.0.0_amd64.deb` — install with `sudo apt install ./TAIF_2.0.0_amd64.deb`

## Development

Requirements: Node.js 18+, Rust (via [rustup](https://rustup.rs)), and on Linux the Tauri system dependencies:

```sh
sudo apt install libwebkit2gtk-4.1-dev build-essential libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev
```

```sh
npm install

# development (vite + Rust watcher)
npm run tauri dev

# production build
npm run tauri build
```

The frontend alone can be previewed in a plain browser with `npm run dev` (port 1420); Tauri-only features (file dialogs, ffmpeg, notifications) need the desktop run.

Note for Linux: `ffmpeg`/`ffprobe` are used from your system installation. The bundled sidecar binaries (`SpleeterExe`, `ytDlp`) must be real binaries, not git-LFS pointer stubs — if a release/source checkout contains LFS stubs, download the real `src-tauri/bin/*` and `src-tauri/resources-linux/*` artifacts.

## Localization

English, Arabic (RTL) and Portuguese are supported out of the box. New languages are welcome via pull requests.

## Privacy

All processing happens on your device. The URL downloader contacts the platforms you request directly.

## Credits & License

TAIF is a rebrand and redesign of [Basset](https://github.com/mohammadmansour200/basset) by Mohammad Abdul-Tawab, released under the [GPL-3.0 license](https://www.gnu.org/licenses/gpl-3.0.html). Original code and design remain copyright of their authors; this fork continues under the same license.
