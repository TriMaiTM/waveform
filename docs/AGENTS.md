# AGENTS.md — Local Music Player (Desktop)

## Project Summary
A desktop application (Electron) that scans a local folder for audio files
(`.mp3`, `.flac`, `.wav`, `.m4a`), reads their metadata (title, artist,
album, cover art), and plays them fully offline. No cloud backend, no
account system, no streaming service integration. Single user, single
machine. Design language follows `design.md` (Spotify-style reference
generated via `npx getdesign@latest add spotify`).

## Tech Stack (locked — do not substitute without asking)
- **Shell**: Electron (main + renderer process split)
- **Bundler**: Vite
- **UI**: React + TypeScript (strict mode)
- **Audio playback**: Howler.js (renderer side) or native `<audio>` if Howler
  adds no value for a given feature — prefer the simplest option that works
- **Metadata parsing**: `music-metadata` (Node version, runs in main process)
- **Local persistence**: `better-sqlite3` (playlists, play history, favorites)
- **Packaging**: `electron-builder`
- **Design tokens/components**: read from `design.md` before styling anything

## Process Architecture Rules
- **Main process** owns: filesystem access, SQLite, native dialogs
  (folder picker), IPC handlers, window management.
- **Renderer process** owns: all UI, playback control, calling IPC to request
  data. Renderer must **never** touch `fs` or SQLite directly — always via
  IPC (`ipcRenderer.invoke` / `ipcMain.handle`), using `contextIsolation: true`
  and a typed `preload.ts` bridge. No `nodeIntegration: true` in
  `BrowserWindow`.
- Every IPC channel name and payload shape must be defined once in
  `src/shared/ipc-types.ts` and imported by both main and renderer — no
  untyped `any` across the IPC boundary.

## Folder Structure (create if missing, don't reorganize without asking)
```
src/
  main/           # Electron main process
    index.ts
    library-scanner.ts   # walks folder, extracts metadata
    db.ts                # better-sqlite3 setup + queries
    ipc-handlers.ts
  preload/
    index.ts             # typed contextBridge exposure
  renderer/
    App.tsx
    components/
    pages/
    player/              # Howler wrapper, queue logic, hooks
    styles/
  shared/
    ipc-types.ts
    types.ts             # Track, Playlist, PlaybackState, etc.
```

## Communication Language
- Always respond to me in **Vietnamese**, regardless of what language I
  write in (I may type in English, mix languages, or use technical jargon
  in English — that does not change the reply language).
- This applies to explanations, questions, summaries, and commit/PR
  descriptions written for me. It does **not** apply to code itself:
  variable names, function names, comments in source files, and commands
  stay in English as per normal convention.
- If a technical term has no natural Vietnamese equivalent (e.g. "hook",
  "IPC", "bundler"), keep the English term inline rather than forcing a
  translation — mixing is expected and fine.

## Coding Conventions
- TypeScript strict mode on, no implicit `any`.
- Functional React components + hooks only, no class components.
- One component per file, colocate a component's own hook if small.
- Naming: `camelCase` for functions/vars, `PascalCase` for components/types,
  `kebab-case` for filenames except component files (`PascalCase.tsx`).
- No inline styles for anything reusable — use the design tokens from
  `design.md`. If `design.md` doesn't cover a case, pick the closest token
  and flag it in the PR/commit message rather than inventing a new color.
- Typography: Bắt buộc sử dụng các font chữ hệ thống đã cài đặt: 'Spotify Mix UI' cho giao diện/văn bản chung, và 'Spotify Mix UI Title Extrabold' / 'Spotify Mix UI Title Var' / 'Spotify Mix UI Title' cho các tiêu đề chính (h1, h2, h3, logo, tab-title). Tránh sử dụng font mặc định khác.
- Icons: Bắt buộc sử dụng duy nhất bộ thư viện Ionicons 5 ('react-icons/io5') cho toàn bộ các biểu tượng trong ứng dụng. Tránh tuyệt đối sử dụng các bộ icon thô hoặc slop khác (như FontAwesome, Material Icons, v.v.).
- Keep main-process functions pure and testable where possible (scanner,
  metadata extraction) — separate I/O from parsing logic.

## Out of Scope (do not implement unless explicitly asked)
- Any cloud sync, remote database, or account/auth system
- YouTube download/convert features of any kind
- Mobile or web build targets
- Streaming from external services (Spotify API, SoundCloud, etc.)

## Commands
- `npm run dev` — start Vite + Electron in dev mode with hot reload
- `npm run build` — production build (renderer + main)
- `npm run package` — electron-builder, produces installer for current OS
- `npm run lint` — ESLint + TypeScript check, must pass before packaging

## Definition of Done for any feature
1. Types shared between main/renderer live in `shared/`.
2. No direct `fs`/`sqlite` calls from renderer.
3. UI matches tokens/components in `design.md`.
4. `npm run lint` passes.
5. Manually verified: works with zero internet connection.
