# Starter Prompt

Use this as the first message to the coding agent (e.g. in Antigravity /
Claude Code) once `design.md` (from `npx getdesign@latest add spotify`) and
`AGENTS.md` are both in the repo root.

---

I'm building a desktop music player app. Read `AGENTS.md` and `design.md` in
this repo before writing any code — they define the tech stack, folder
structure, IPC rules, and visual design tokens. Follow them exactly; don't
introduce new libraries or restructure folders without asking me first.

**Goal of this first task**: scaffold the project skeleton, nothing more.

1. Init an Electron + Vite + React + TypeScript project matching the folder
   structure in `AGENTS.md`.
2. Set up the main process with `contextIsolation: true`, a typed
   `preload.ts`, and one working IPC round-trip as a smoke test: renderer
   calls `pickMusicFolder`, main process opens a native folder-picker dialog
   and returns the chosen path.
3. Set up `better-sqlite3` with a minimal schema: a `tracks` table
   (id, file_path, title, artist, album, duration_seconds, cover_path) and a
   `playlists` table (id, name) + `playlist_tracks` join table. Just create
   the schema and a `db.ts` init function — no queries beyond that yet.
4. Wire up `music-metadata` in the main process: given a folder path, scan
   for `.mp3/.flac/.wav/.m4a` files recursively, extract title/artist/
   album/duration/cover art, and insert into the `tracks` table. Expose this
   as an IPC handler `scanLibrary(folderPath)`.
5. Basic renderer UI: a "Select Music Folder" button that triggers the
   picker, then triggers the scan, then renders the resulting track list
   (title + artist only for now) in a plain list — styling can be minimal at
   this stage, just enough structure to confirm data flows end to end.
6. `npm run dev` should launch the app with hot reload working for the
   renderer.

Don't implement playback, playlists UI, or SQLite queries beyond the schema
yet — this task is just "folder picker → scan → store → list on screen"
working end to end. Confirm each step compiles and runs before moving to the
next.

After this works, I'll ask for: playback (Howler.js), queue/now-playing bar,
playlist CRUD, and favorites — one at a time.
