import { ipcMain, dialog, shell } from 'electron'
import fs from 'fs'
import path from 'path'
import { scanLibrary, getMusicDirectory, getLyricsForTrack } from './library-scanner'
import { getDB } from './db'

export function registerIPCHandlers(): void {
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
      isFavorite: row.is_favorite || 0
    }))
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
      isFavorite: row.is_favorite || 0
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
        isFavorite: row.is_favorite || 0
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
      isFavorite: row.is_favorite || 0
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
}
