import { app, ipcMain, dialog, shell, BrowserWindow, globalShortcut } from 'electron'
import fs from 'fs'
import path from 'path'
import { scanLibrary, getMusicDirectory, getLyricsForTrack } from './library-scanner'
import { getDB } from './db'

function rebindGlobalShortcuts(): void {
  try {
    globalShortcut.unregisterAll()
    const db = getDB()
    const win = BrowserWindow.getAllWindows()[0]
    if (!win) return

    const getShortcut = (key: string, defaultValue: string) => {
      const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined
      return row ? row.value : defaultValue
    }

    const shortcutPlayPause = getShortcut('shortcut_play_pause', 'MediaPlayPause')
    const shortcutNext = getShortcut('shortcut_next', 'MediaNextTrack')
    const shortcutPrev = getShortcut('shortcut_prev', 'MediaPreviousTrack')

    console.log(`[Shortcut] Binding shortcuts: PlayPause=${shortcutPlayPause}, Next=${shortcutNext}, Prev=${shortcutPrev}`)

    if (shortcutPlayPause && shortcutPlayPause !== 'none') {
      try {
        globalShortcut.register(shortcutPlayPause, () => {
          win.webContents.send('global-media-play-pause')
        })
      } catch (e) {
        console.error(`Failed to bind shortcut: ${shortcutPlayPause}`, e)
      }
    }
    if (shortcutNext && shortcutNext !== 'none') {
      try {
        globalShortcut.register(shortcutNext, () => {
          win.webContents.send('global-media-next')
        })
      } catch (e) {
        console.error(`Failed to bind shortcut: ${shortcutNext}`, e)
      }
    }
    if (shortcutPrev && shortcutPrev !== 'none') {
      try {
        globalShortcut.register(shortcutPrev, () => {
          win.webContents.send('global-media-prev')
        })
      } catch (e) {
        console.error(`Failed to bind shortcut: ${shortcutPrev}`, e)
      }
    }
  } catch (err) {
    console.error('Failed to rebind shortcuts:', err)
  }
}

function getMainWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows()
  const main = windows.find(w => {
    try {
      const url = w.webContents.getURL()
      return url && !url.includes('view=widget')
    } catch {
      return false
    }
  })
  return main || windows[0] || null
}

function getWidgetWindow(): BrowserWindow | null {
  const windows = BrowserWindow.getAllWindows()
  return windows.find(w => {
    try {
      const url = w.webContents.getURL()
      return url && url.includes('view=widget')
    } catch {
      return false
    }
  }) || null
}

let widgetWindow: BrowserWindow | null = null
let currentActiveTrack: any = null
let isPlayingState = false

export function exitMiniPlayerMode(): boolean {
  const widget = getWidgetWindow()
  if (widget) {
    try {
      widget.close()
    } catch (e) {
      console.error(e)
    }
    widgetWindow = null
  }

  const mainWindow = getMainWindow()
  if (mainWindow) {
    try {
      mainWindow.setResizable(true)
      mainWindow.setMenuBarVisibility(false)
      mainWindow.setMinimumSize(800, 600)
      mainWindow.setSize(1200, 800)
      mainWindow.center()
      mainWindow.setAlwaysOnTop(false)
      mainWindow.show()
      mainWindow.focus()
      mainWindow.webContents.send('mini-player-status', false)
      console.log('[IPC] Exited Mini Player mode via helper')
      return true
    } catch (err) {
      console.error('[IPC] Failed to exit mini player via helper:', err)
      return false
    }
  }
  return false
}

export function registerIPCHandlers(): void {
  setTimeout(rebindGlobalShortcuts, 2000)
  ipcMain.handle('get-library-tracks', async () => {
    const db = getDB()
    const rows = db.prepare('SELECT * FROM tracks').all() as any[]
    return rows.map(row => ({
      id: row.id,
      filePath: row.file_path,
      title: row.title,
      artist: row.artist,
      album: row.album,
      durationSeconds: row.duration_seconds,
      coverPath: row.cover_path,
      isFavorite: row.is_favorite || 0,
      genre: row.genre || '',
      year: row.year || null
    }))
  })

  ipcMain.handle('get-listening-analytics', async () => {
    const db = getDB()
    
    // 1. Calculate total listening hours
    const durationRow = db.prepare(`
      SELECT SUM(t.duration_seconds) as total_duration 
      FROM recently_played rp 
      JOIN tracks t ON rp.track_id = t.id
    `).get() as { total_duration: number | null } | undefined
    
    const totalHours = durationRow?.total_duration 
      ? Number((durationRow.total_duration / 3600).toFixed(2)) 
      : 0
      
    // 2. Top 5 artists by play count
    const topArtists = db.prepare(`
      SELECT t.artist, COUNT(*) as count 
      FROM recently_played rp 
      JOIN tracks t ON rp.track_id = t.id 
      GROUP BY t.artist 
      ORDER BY count DESC 
      LIMIT 5
    `).all() as Array<{ artist: string, count: number }>
    
    // 3. Top 5 tracks by play count
    const topTracks = db.prepare(`
      SELECT t.id, t.title, t.artist, t.cover_path as coverPath, COUNT(*) as count 
      FROM recently_played rp 
      JOIN tracks t ON rp.track_id = t.id 
      GROUP BY t.id 
      ORDER BY count DESC 
      LIMIT 5
    `).all() as Array<{ id: number, title: string, artist: string, count: number, coverPath: string | null }>
    
    // 4. Hourly listening stats (0-23 hours)
    const times = db.prepare('SELECT played_at FROM recently_played').all() as Array<{ played_at: number }>
    const hourlyCounts = Array.from({ length: 24 }, (_, i) => ({ hour: i, count: 0 }))
    
    for (const time of times) {
      const date = new Date(time.played_at)
      const hour = date.getHours()
      if (hour >= 0 && hour < 24) {
        hourlyCounts[hour].count++
      }
    }
    
    return {
      totalHours,
      topArtists,
      topTracks,
      hourlyStats: hourlyCounts
    }
  })

  ipcMain.handle('scan-library', async () => {
    return await scanLibrary()
  })

  ipcMain.handle('add-music-files', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile', 'multiSelections'],
      filters: [
        { name: 'Audio Files', extensions: ['mp3', 'flac', 'wav', 'm4a'] }
      ]
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return await scanLibrary()
    }
    
    const musicDir = getMusicDirectory()
    if (!fs.existsSync(musicDir)) {
      fs.mkdirSync(musicDir, { recursive: true })
    }
    
    for (const srcPath of result.filePaths) {
      const destPath = path.join(musicDir, path.basename(srcPath))
      try {
        fs.copyFileSync(srcPath, destPath)
        console.log(`[IPC] Successfully copied: ${path.basename(srcPath)} -> ${destPath}`)
      } catch (err) {
        console.error(`[IPC] Failed to copy file ${srcPath} to ${destPath}:`, err)
      }
    }
    
    // Rescan library and return updated tracks list
    return await scanLibrary()
  })

  // Favorites: toggleFavorite
  ipcMain.handle('toggle-favorite', async (_event, trackId: number) => {
    const db = getDB()
    const track = db.prepare('SELECT is_favorite FROM tracks WHERE id = ?').get(trackId) as { is_favorite: number } | undefined
    if (!track) throw new Error('Track not found')
    const newVal = track.is_favorite === 1 ? 0 : 1
    db.prepare('UPDATE tracks SET is_favorite = ? WHERE id = ?').run(newVal, trackId)
    return newVal === 1
  })

  // Playlists: createPlaylist
  ipcMain.handle('create-playlist', async (_event, name?: string) => {
    const db = getDB()
    const tempName = `TEMP_${Date.now()}_${Math.random()}`
    const result = db.prepare('INSERT INTO playlists (name) VALUES (?)').run(tempName)
    const id = result.lastInsertRowid as number
    const finalName = name && name.trim() ? name.trim() : `Playlist #${id}`
    db.prepare('UPDATE playlists SET name = ? WHERE id = ?').run(finalName, id)
    return {
      id,
      name: finalName,
      coverPath: null
    }
  })

  // Playlists: updatePlaylistName
  ipcMain.handle('update-playlist-name', async (_event, id: number, name: string) => {
    const db = getDB()
    db.prepare('UPDATE playlists SET name = ? WHERE id = ?').run(name, id)
  })

  // Playlists: selectAndSetPlaylistCover
  ipcMain.handle('select-and-set-playlist-cover', async (_event, playlistId: number) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
    })
    
    if (canceled || filePaths.length === 0) return null
    
    const sourcePath = filePaths[0]
    const db = getDB()
    const dbPath = db.name
    const appDir = path.dirname(dbPath)
    const coversDir = path.join(appDir, 'playlist_covers')
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true })
    }
    
    const ext = path.extname(sourcePath)
    const targetFileName = `${playlistId}_${Date.now()}${ext}`
    const targetPath = path.join(coversDir, targetFileName)
    
    fs.copyFileSync(sourcePath, targetPath)
    
    db.prepare('UPDATE playlists SET cover_path = ? WHERE id = ?').run(targetPath, playlistId)
    
    return targetPath
  })

  // Playlists: deletePlaylist
  ipcMain.handle('delete-playlist', async (_event, playlistId: number) => {
    const db = getDB()
    db.prepare('DELETE FROM playlists WHERE id = ?').run(playlistId)
  })

  // Playlists: getPlaylists
  ipcMain.handle('get-playlists', async () => {
    const db = getDB()
    const list = db.prepare('SELECT * FROM playlists').all() as any[]
    return list.map(p => ({
      id: p.id,
      name: p.name,
      coverPath: p.cover_path
    }))
  })

  // Playlists: addTrackToPlaylist
  ipcMain.handle('add-track-to-playlist', async (_event, playlistId: number, trackId: number) => {
    const db = getDB()
    try {
      db.prepare('INSERT INTO playlist_tracks (playlist_id, track_id) VALUES (?, ?)').run(playlistId, trackId)
    } catch (err) {
      console.warn(`[IPC] Track ${trackId} already in playlist ${playlistId}`)
    }
  })

  // Playlists: removeTrackFromPlaylist
  ipcMain.handle('remove-track-from-playlist', async (_event, playlistId: number, trackId: number) => {
    const db = getDB()
    db.prepare('DELETE FROM playlist_tracks WHERE playlist_id = ? AND track_id = ?').run(playlistId, trackId)
  })

  // Playlists: getPlaylistTracks
  ipcMain.handle('get-playlist-tracks', async (_event, playlistId: number) => {
    const db = getDB()
    const rows = db.prepare(`
      SELECT t.* 
      FROM tracks t
      JOIN playlist_tracks pt ON t.id = pt.track_id
      WHERE pt.playlist_id = ?
    `).all(playlistId) as any[]
    return rows.map(row => ({
      id: row.id,
      filePath: row.file_path,
      title: row.title,
      artist: row.artist,
      album: row.album,
      durationSeconds: row.duration_seconds,
      coverPath: row.cover_path,
      isFavorite: row.is_favorite || 0,
      genre: row.genre || '',
      year: row.year || null
    }))
  })

  // Get lyrics for a specific track
  ipcMain.handle('get-lyrics', async (_event, trackId: number) => {
    return await getLyricsForTrack(trackId)
  })

  // Add a track to recently played history (limit to top 50, update played_at if already exists)
  ipcMain.handle('add-to-recently-played', async (_event, trackId: number) => {
    const db = getDB()
    const now = Date.now()
    try {
      db.transaction(() => {
        // Delete older history entry of the same track to bring it to the top
        db.prepare('DELETE FROM recently_played WHERE track_id = ?').run(trackId)
        // Insert new entry
        db.prepare('INSERT INTO recently_played (track_id, played_at) VALUES (?, ?)').run(trackId, now)
        // Clean up history, keeping only top 50
        db.prepare(`
          DELETE FROM recently_played 
          WHERE played_at NOT IN (
            SELECT played_at FROM recently_played 
            ORDER BY played_at DESC LIMIT 50
          )
        `).run()
      })()
    } catch (err) {
      console.error('[DB] Failed to update recently played:', err)
    }
  })

  // Get recently played history tracks list (top 50)
  ipcMain.handle('get-recently-played', async () => {
    const db = getDB()
    try {
      const rows = db.prepare(`
        SELECT t.* 
        FROM tracks t
        JOIN recently_played rp ON t.id = rp.track_id
        ORDER BY rp.played_at DESC
        LIMIT 50
      `).all() as any[]
      return rows.map(row => ({
        id: row.id,
        filePath: row.file_path,
        title: row.title,
        artist: row.artist,
        album: row.album,
        durationSeconds: row.duration_seconds,
        coverPath: row.cover_path,
        isFavorite: row.is_favorite || 0,
        genre: row.genre || '',
        year: row.year || null
      }))
    } catch (err) {
      console.error('[DB] Failed to get recently played:', err)
      return []
    }
  })

  // Delete track: delete file from disk and remove from DB
  ipcMain.handle('delete-track-file', async (_event, trackId: number) => {
    const db = getDB()
    const track = db.prepare('SELECT file_path FROM tracks WHERE id = ?').get(trackId) as { file_path: string } | undefined
    if (track) {
      try {
        if (fs.existsSync(track.file_path)) {
          fs.unlinkSync(track.file_path)
          console.log(`[IPC] Successfully deleted track file: ${track.file_path}`)
        }
      } catch (err) {
        console.error(`[IPC] Failed to delete physical file ${track.file_path}:`, err)
      }
      // Delete database entries
      db.transaction(() => {
        db.prepare('DELETE FROM playlist_tracks WHERE track_id = ?').run(trackId)
        db.prepare('DELETE FROM recently_played WHERE track_id = ?').run(trackId)
        db.prepare('DELETE FROM tracks WHERE id = ?').run(trackId)
      })()
    }
    
    // Return remaining tracks in library
    const rows = db.prepare('SELECT * FROM tracks').all() as any[]
    return rows.map(row => ({
      id: row.id,
      filePath: row.file_path,
      title: row.title,
      artist: row.artist,
      album: row.album,
      durationSeconds: row.duration_seconds,
      coverPath: row.cover_path,
      isFavorite: row.is_favorite || 0,
      genre: row.genre || '',
      year: row.year || null
    }))
  })

  // Open music folder in Windows Explorer
  ipcMain.handle('open-music-folder', async () => {
    const musicDir = getMusicDirectory()
    if (!fs.existsSync(musicDir)) {
      fs.mkdirSync(musicDir, { recursive: true })
    }
    await shell.openPath(musicDir)
    return true
  })

  // Get current music library directory path
  ipcMain.handle('get-music-directory', async () => {
    return getMusicDirectory()
  })

  // Select custom music folder
  ipcMain.handle('select-music-directory', async () => {
    const result = await dialog.showOpenDialog({
      title: 'Chọn thư mục chứa thư viện nhạc của bạn',
      properties: ['openDirectory', 'createDirectory']
    })
    
    if (result.canceled || result.filePaths.length === 0) {
      return null
    }

    const selectedPath = result.filePaths[0]
    const db = getDB()
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES ('music_directory', ?)")
        .run(selectedPath)
      console.log(`[IPC] Music library folder changed to: ${selectedPath}`)
      return selectedPath
    } catch (err) {
      console.error('[DB] Failed to save custom music_directory:', err)
      return null
    }
  })

  // Reset music library folder to default
  ipcMain.handle('reset-music-directory', async () => {
    const db = getDB()
    try {
      db.prepare("DELETE FROM settings WHERE key = 'music_directory'").run()
      console.log('[IPC] Music library folder reset to default.')
    } catch (err) {
      console.error('[DB] Failed to delete custom music_directory setting:', err)
    }
    return getMusicDirectory()
  })

  // Toggle Mini Player Mode
  ipcMain.handle('enter-mini-player', async () => {
    const db = getDB()
    const getVal = (key: string, def: string) => {
      const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined
      return row ? row.value : def
    }
    const miniPlayerType = getVal('mini_player_type', 'standard')
    const mainWindow = BrowserWindow.getAllWindows()[0]
    if (!mainWindow) return false

    if (miniPlayerType === 'standard') {
      try {
        mainWindow.setResizable(true)
        mainWindow.setMenuBarVisibility(false)
        mainWindow.setMinimumSize(360, 195)
        mainWindow.setSize(360, 195)
        mainWindow.setAlwaysOnTop(true)
        mainWindow.setResizable(false)
        mainWindow.webContents.send('mini-player-status', true)
        console.log('[IPC] Entered Standard Mini Player mode')
        return true
      } catch (err) {
        console.error('[IPC] Failed to enter standard mini player:', err)
        return false
      }
    } else {
      // Chế độ widget ảnh bìa 60x60 không viền
      try {
        mainWindow.hide()
        mainWindow.webContents.send('mini-player-status', true)
        
        if (widgetWindow) {
          widgetWindow.close()
          widgetWindow = null
        }

        widgetWindow = new BrowserWindow({
          width: 240,
          height: 60,
          frame: false,
          transparent: true,
          alwaysOnTop: true,
          resizable: false,
          skipTaskbar: true,
          focusable: false, // Ngăn widget cướp focus làm tab-out hoặc khựng game Valorant khi click
          webPreferences: {
            preload: path.join(__dirname, '../preload/index.js'),
            contextIsolation: true,
            nodeIntegration: false
          }
        })

        // Nâng cấp mức độ Always On Top lên cao nhất và cho phép hiển thị đè lên Fullscreen Window
        widgetWindow.setAlwaysOnTop(true, 'screen-saver')
        widgetWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })

        const isDev = process.env.VITE_DEV_SERVER_URL
        if (isDev) {
          widgetWindow.loadURL(`${isDev}?view=widget`)
        } else {
          widgetWindow.loadFile(path.join(__dirname, '../renderer/index.html'), { query: { view: 'widget' } })
        }

        widgetWindow.on('closed', () => {
          widgetWindow = null
        })

        widgetWindow.webContents.on('did-finish-load', () => {
          if (widgetWindow) {
            widgetWindow.webContents.send('widget-track-update', {
              track: currentActiveTrack,
              isPlaying: isPlayingState
            })
            console.log('[IPC] Broadcasted initial active track to Widget Window')
          }
        })

        console.log('[IPC] Entered Cover-only Widget mode')
        return true
      } catch (err) {
        console.error('[IPC] Failed to enter cover-only widget mode:', err)
        mainWindow.show()
        return false
      }
    }
  })

  ipcMain.handle('exit-mini-player', async () => {
    return exitMiniPlayerMode()
  })

  // Sync active track from primary window
  ipcMain.handle('set-active-track', async (_event, { track, isPlaying }) => {
    currentActiveTrack = track
    isPlayingState = isPlaying
    
    // Broadcast updates only to widgetWindow
    const widget = getWidgetWindow()
    if (widget) {
      widget.webContents.send('widget-track-update', { track, isPlaying })
    }
    return true
  })

  ipcMain.handle('get-current-active-track', async () => {
    return { track: currentActiveTrack, isPlaying: isPlayingState }
  })

  // Get current global shortcuts
  ipcMain.handle('get-global-shortcuts', async () => {
    const db = getDB()
    const getVal = (key: string, def: string) => {
      const row = db.prepare("SELECT value FROM settings WHERE key = ?").get(key) as { value: string } | undefined
      return row ? row.value : def
    }
    return {
      playPause: getVal('shortcut_play_pause', 'MediaPlayPause'),
      next: getVal('shortcut_next', 'MediaNextTrack'),
      prev: getVal('shortcut_prev', 'MediaPreviousTrack'),
      miniPlayerType: getVal('mini_player_type', 'standard')
    }
  })

  // Update a specific global shortcut setting
  ipcMain.handle('update-global-shortcut', async (_event, { key, value }: { key: string, value: string }) => {
    const db = getDB()
    try {
      db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)")
        .run(key, value)
      rebindGlobalShortcuts()
      return true
    } catch (err) {
      console.error('[DB] Failed to update global shortcut setting:', err)
      return false
    }
  })

  // Widget control forward handlers
  ipcMain.handle('widget-control-play-pause', async () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.webContents.send('global-media-play-pause')
    }
  })

  ipcMain.handle('widget-control-next', async () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.webContents.send('global-media-next')
    }
  })

  ipcMain.handle('widget-control-prev', async () => {
    const mainWindow = getMainWindow()
    if (mainWindow) {
      mainWindow.webContents.send('global-media-prev')
    }
  })

  // Tracks: selectCoverImage
  ipcMain.handle('select-cover-image', async () => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp'] }]
    })
    
    if (canceled || filePaths.length === 0) return null
    
    const sourcePath = filePaths[0]
    const db = getDB()
    const dbPath = db.name
    const appDir = path.dirname(dbPath)
    const coversDir = path.join(appDir, 'covers')
    if (!fs.existsSync(coversDir)) {
      fs.mkdirSync(coversDir, { recursive: true })
    }
    
    const ext = path.extname(sourcePath)
    const targetFileName = `custom_${Date.now()}${ext}`
    const targetPath = path.join(coversDir, targetFileName)
    
    fs.copyFileSync(sourcePath, targetPath)
    
    return targetPath
  })

  // Tracks: updateTrackMetadata
  ipcMain.handle('update-track-metadata', async (_event, trackId: number, data: { title: string, artist: string, album: string, genre: string, year: number | null, coverPath: string | null }) => {
    const db = getDB()
    console.log(`[IPC] update-track-metadata request for trackId ${trackId} with data:`, data)
    try {
      const result = db.prepare(`
        UPDATE tracks 
        SET title = ?, artist = ?, album = ?, genre = ?, year = ?, cover_path = ? 
        WHERE id = ?
      `).run(data.title, data.artist, data.album, data.genre, data.year, data.coverPath, trackId)
      
      console.log(`[DB] UPDATE success. Rows affected: ${result.changes}`)
      
      const verified = db.prepare('SELECT title, artist, album, genre, year, cover_path FROM tracks WHERE id = ?').get(trackId)
      console.log('[DB] Verified row state in DB after update:', verified)
      
      return true
    } catch (err) {
      console.error('[DB] Failed to update track metadata:', err)
      return false
    }
  })

  // Download YouTube Music using yt-dlp
  ipcMain.handle('download-youtube-music', async (_event, { url, options }: { url: string, options: { yesPlaylist: boolean, embedThumbnail: boolean, addMetadata: boolean, ytdlpPath: string } }) => {
    const { spawn } = await import('child_process')
    const musicDir = getMusicDirectory()
    
    // Determine the path to yt-dlp executable and ffmpeg
    let spawnCmd = 'yt-dlp'
    let envPath = process.env.PATH || ''
    let ffmpegLoc = '.'
    
    // Auto-discover directories
    const exeDir = path.dirname(app.getPath('exe'))
    const cwdDir = process.cwd()
    
    if (options.ytdlpPath) {
      const customPath = path.resolve(options.ytdlpPath)
      if (fs.existsSync(customPath)) {
        const stat = fs.statSync(customPath)
        if (stat.isFile()) {
          spawnCmd = customPath
          ffmpegLoc = path.dirname(customPath)
          envPath = `${ffmpegLoc}${path.delimiter}${envPath}`
        } else {
          envPath = `${customPath}${path.delimiter}${envPath}`
          const localExe = path.join(customPath, 'yt-dlp.exe')
          if (fs.existsSync(localExe)) {
            spawnCmd = localExe
          }
          ffmpegLoc = customPath
        }
      }
    } else {
      // 1. Try App's exe folder (where packed Electron app is installed and user copied yt-dlp & ffmpeg)
      const exeLocalYtdlp = path.join(exeDir, 'yt-dlp.exe')
      const exeLocalFfmpeg = path.join(exeDir, 'ffmpeg.exe')
      
      // 2. Try current working directory (usually root folder of the project in dev mode)
      const cwdLocalYtdlp = path.join(cwdDir, 'yt-dlp.exe')
      const cwdLocalFfmpeg = path.join(cwdDir, 'ffmpeg.exe')
      
      if (fs.existsSync(exeLocalYtdlp) && fs.existsSync(exeLocalFfmpeg)) {
        spawnCmd = exeLocalYtdlp
        ffmpegLoc = exeDir
        envPath = `${exeDir}${path.delimiter}${envPath}`
        console.log(`[Download] Auto-discovered yt-dlp & ffmpeg in App exe directory: ${exeDir}`)
      } else if (fs.existsSync(cwdLocalYtdlp) && fs.existsSync(cwdLocalFfmpeg)) {
        spawnCmd = cwdLocalYtdlp
        ffmpegLoc = cwdDir
        envPath = `${cwdDir}${path.delimiter}${envPath}`
        console.log(`[Download] Auto-discovered yt-dlp & ffmpeg in Current Working directory: ${cwdDir}`)
      } else if (fs.existsSync(exeLocalYtdlp)) {
        spawnCmd = exeLocalYtdlp
        ffmpegLoc = exeDir
        envPath = `${exeDir}${path.delimiter}${envPath}`
        console.log(`[Download] Auto-discovered yt-dlp in App exe directory (using system ffmpeg): ${exeDir}`)
      } else if (fs.existsSync(cwdLocalYtdlp)) {
        spawnCmd = cwdLocalYtdlp
        ffmpegLoc = cwdDir
        envPath = `${cwdDir}${path.delimiter}${envPath}`
        console.log(`[Download] Auto-discovered yt-dlp in CWD directory: ${cwdDir}`)
      } else {
        console.log(`[Download] No local yt-dlp found. Falling back to system global commands.`)
      }
    }
    
    console.log(`[Download] Starting download of: ${url}`)
    console.log(`[Download] yt-dlp command: ${spawnCmd}, ffmpeg location: ${ffmpegLoc}, destination: ${musicDir}`)

    const args: string[] = []
    
    // Extract audio format mp3
    args.push('-x')
    args.push('--audio-format', 'mp3')
    args.push('--audio-quality', '0')
    
    // Playlist or single video
    if (options.yesPlaylist) {
      args.push('--yes-playlist')
    } else {
      args.push('--no-playlist')
    }
    
    // Embed thumbnail as cover art
    if (options.embedThumbnail) {
      args.push('--embed-thumbnail')
    }
    
    // Add metadata
    if (options.addMetadata) {
      args.push('--add-metadata')
    }
    
    // Ffmpeg location
    args.push('--ffmpeg-location', `"${ffmpegLoc}"`)
    
    // Output template
    const outputTemplate = path.join(musicDir, '%(title)s.%(ext)s')
    args.push('-o', `"${outputTemplate}"`)
    
    // Input url
    args.push(`"${url}"`)

    return new Promise((resolve) => {
      try {
        const processEnv = { ...process.env, PATH: envPath }
        const child = spawn(spawnCmd, args, { env: processEnv, shell: true })
        
        let errorLog = ''
        
        const parseProgress = (line: string) => {
          const progressRegex = /\[download\]\s+(\d+\.\d+)%\s+of\s+([^\s]+)\s+at\s+([^\s]+)\s+ETA\s+([^\s]+)/i
          const match = line.match(progressRegex)
          if (match) {
            const percentage = parseFloat(match[1])
            const size = match[2]
            const speed = match[3]
            const eta = match[4]
            return { percentage, speed: `${speed} (${size})`, eta }
          }
          
          const itemRegex = /\[download\]\s+Downloading\s+item\s+(\d+)\s+of\s+(\d+)/i
          const itemMatch = line.match(itemRegex)
          if (itemMatch) {
            const currentItem = parseInt(itemMatch[1], 10)
            const totalItems = parseInt(itemMatch[2], 10)
            const percentage = Math.round((currentItem - 1) / totalItems * 100)
            return { percentage, speed: `Tải bài ${currentItem}/${totalItems}`, eta: '...' }
          }
          
          return null
        }

        child.stdout.on('data', (data) => {
          const chunk = data.toString()
          const win = getMainWindow()
          if (win) {
            const lines = chunk.split('\n')
            for (const line of lines) {
              if (!line.trim()) continue
              const progress = parseProgress(line)
              win.webContents.send('download-progress-event', {
                percentage: progress ? progress.percentage : 0,
                speed: progress ? progress.speed : '',
                eta: progress ? progress.eta : '',
                log: line.trim()
              })
            }
          }
        })

        child.stderr.on('data', (data) => {
          const chunk = data.toString()
          errorLog += chunk
          const win = getMainWindow()
          if (win) {
            win.webContents.send('download-progress-event', {
              percentage: -1,
              speed: '',
              eta: '',
              log: chunk.trim()
            })
          }
        })

        child.on('close', async (code) => {
          if (code === 0) {
            console.log('[Download] yt-dlp completed successfully.')
            try {
              const updatedTracks = await scanLibrary(musicDir)
              resolve({ success: true, tracks: updatedTracks })
            } catch (scanErr) {
              console.error('[Download] Failed to scan library after download:', scanErr)
              resolve({ success: true, error: 'Tải nhạc thành công nhưng cập nhật thư viện lỗi: ' + (scanErr as Error).message })
            }
          } else {
            console.error(`[Download] yt-dlp exited with code ${code}`)
            resolve({ success: false, error: errorLog || `Tiến trình tải thất bại với mã lỗi: ${code}` })
          }
        })
      } catch (spawnErr) {
        console.error('[Download] Failed to spawn yt-dlp process:', spawnErr)
        resolve({ success: false, error: 'Không thể chạy yt-dlp: ' + (spawnErr as Error).message })
      }
    })
  })
}
