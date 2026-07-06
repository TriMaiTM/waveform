import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { app } from 'electron'
import { getDB } from './db'
import { Track } from '../shared/types'

const SUPPORTED_EXTENSIONS = ['.mp3', '.flac', '.wav', '.m4a']

export function normalizePath(p: string): string {
  let resolved = path.resolve(p)
  if (process.platform === 'win32' && resolved.length > 1 && resolved[1] === ':') {
    resolved = resolved[0].toUpperCase() + resolved.slice(1)
  }
  return resolved.replace(/\\/g, '/')
}

export function getMusicDirectory(): string {
  // If app is packaged, store next to executable. Otherwise, in project root.
  const baseDir = app.isPackaged
    ? path.dirname(app.getPath('exe'))
    : app.getAppPath()
  return normalizePath(path.join(baseDir, 'music'))
}

function getAudioFilesRecursively(dir: string, fileList: string[] = []): string[] {
  try {
    const normalizedDir = normalizePath(dir)
    if (!fs.existsSync(normalizedDir)) {
      fs.mkdirSync(normalizedDir, { recursive: true })
    }
    const files = fs.readdirSync(normalizedDir, { withFileTypes: true })
    for (const file of files) {
      const fullPath = normalizePath(path.join(normalizedDir, file.name))
      if (file.isDirectory()) {
        getAudioFilesRecursively(fullPath, fileList)
      } else if (file.isFile()) {
        const ext = path.extname(file.name).toLowerCase()
        if (SUPPORTED_EXTENSIONS.includes(ext)) {
          fileList.push(fullPath)
        }
      }
    }
  } catch (err) {
    console.error(`Error reading directory ${dir}:`, err)
  }
  return fileList
}

export async function scanLibrary(folderPath: string = getMusicDirectory()): Promise<Track[]> {
  const normalizedFolderPath = normalizePath(folderPath)
  const audioFiles = getAudioFilesRecursively(normalizedFolderPath)
  const db = getDB()
  
  // Dynamically import music-metadata
  const { parseFile } = await import('music-metadata')
  
  // Setup covers directory
  const userDataPath = app.getPath('userData')
  const coversDir = path.join(userDataPath, 'covers')
  if (!fs.existsSync(coversDir)) {
    fs.mkdirSync(coversDir, { recursive: true })
  }

  const parsedDataList: Array<{
    filePath: string;
    title: string | null;
    artist: string | null;
    album: string | null;
    durationSeconds: number | null;
    coverPath: string | null;
  }> = []

  for (const filePath of audioFiles) {
    try {
      const stats = fs.statSync(filePath)
      
      // If the file is extremely small (e.g. less than 5KB), it's likely a test/mock text file.
      // music-metadata will crash (EINVAL) trying to parse its audio headers.
      if (stats.size < 5120) {
        console.log(`[Scanner] Skipping metadata parsing for tiny file: ${path.basename(filePath)} (using filename fallback)`)
        parsedDataList.push({
          filePath,
          title: path.basename(filePath, path.extname(filePath)),
          artist: 'Unknown Artist',
          album: 'Unknown Album',
          durationSeconds: null,
          coverPath: null
        })
        continue
      }

      const metadata = await parseFile(filePath)
      const title = metadata.common.title || path.basename(filePath, path.extname(filePath))
      const artist = metadata.common.artist || 'Unknown Artist'
      const album = metadata.common.album || 'Unknown Album'
      const durationSeconds = metadata.format.duration || null
      
      let coverPath: string | null = null
      const picture = metadata.common.picture?.[0]
      if (picture) {
        const coverHash = crypto.createHash('md5').update(picture.data).digest('hex')
        const ext = picture.format.split('/')[1] || 'jpg'
        const coverFileName = `${coverHash}.${ext}`
        const fullCoverPath = path.join(coversDir, coverFileName)
        
        if (!fs.existsSync(fullCoverPath)) {
          fs.writeFileSync(fullCoverPath, picture.data)
        }
        coverPath = fullCoverPath
      }

      parsedDataList.push({
        filePath,
        title,
        artist,
        album,
        durationSeconds,
        coverPath
      })
    } catch (err) {
      console.warn(`[Scanner] Failed to parse metadata for ${path.basename(filePath)}:`, (err as Error).message)
      // Fallback
      parsedDataList.push({
        filePath,
        title: path.basename(filePath, path.extname(filePath)),
        artist: 'Unknown Artist',
        album: 'Unknown Album',
        durationSeconds: null,
        coverPath: null
      })
    }
  }

  // Statements for DB
  const selectStmt = db.prepare('SELECT id FROM tracks WHERE file_path = ?')
  const insertStmt = db.prepare(`
    INSERT INTO tracks (file_path, title, artist, album, duration_seconds, cover_path)
    VALUES (?, ?, ?, ?, ?, ?)
  `)
  const updateStmt = db.prepare(`
    UPDATE tracks 
    SET title = ?, artist = ?, album = ?, duration_seconds = ?, cover_path = ?
    WHERE id = ?
  `)

  // Run in a synchronous transaction
  const runTransaction = db.transaction(() => {
    for (const data of parsedDataList) {
      const existing = selectStmt.get(data.filePath) as { id: number } | undefined
      if (existing) {
        updateStmt.run(
          data.title,
          data.artist,
          data.album,
          data.durationSeconds,
          data.coverPath,
          existing.id
        )
      } else {
        insertStmt.run(
          data.filePath,
          data.title,
          data.artist,
          data.album,
          data.durationSeconds,
          data.coverPath
        )
      }
    }
  })

  runTransaction()

  // Clean up tracks in DB whose files no longer exist on disk
  const allTracksInDB = db.prepare('SELECT id, file_path FROM tracks').all() as Array<{ id: number, file_path: string }>
  const deleteTrackStmt = db.prepare('DELETE FROM tracks WHERE id = ?')
  const deletePlaylistTracksStmt = db.prepare('DELETE FROM playlist_tracks WHERE track_id = ?')
  
  const cleanTransaction = db.transaction(() => {
    for (const track of allTracksInDB) {
      if (!fs.existsSync(track.file_path)) {
        console.log(`[Scanner] Cleaning up deleted track from database: ${track.file_path}`)
        deletePlaylistTracksStmt.run(track.id)
        deleteTrackStmt.run(track.id)
      }
    }
  })
  cleanTransaction()

  // Return all tracks
  const allTracksStmt = db.prepare('SELECT * FROM tracks')
  const rows = allTracksStmt.all() as any[]
  
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
}

export interface LyricLine {
  time: number;
  text: string;
}

export function parseLrc(content: string): LyricLine[] {
  const lines = content.split(/\r?\n/)
  const result: LyricLine[] = []
  const timeRegex = /\[(\d{2}):(\d{2})(?:\.(\d{2,3}))?\]/g

  for (const line of lines) {
    const matches = [...line.matchAll(timeRegex)]
    const text = line.replace(/\[\d{2}:\d{2}(?:\.\d{2,3})?\]/g, '').trim()

    for (const match of matches) {
      const mins = parseInt(match[1], 10)
      const secs = parseInt(match[2], 10)
      const msStr = match[3] || '0'
      const ms = parseFloat(`0.${msStr}`)
      const time = mins * 60 + secs + ms
      result.push({ time, text })
    }
  }

  return result.sort((a, b) => a.time - b.time)
}

export async function getLyricsForTrack(trackId: number): Promise<{ synced: boolean, lyrics: LyricLine[] | string }> {
  const db = getDB()
  const row = db.prepare('SELECT file_path FROM tracks WHERE id = ?').get(trackId) as { file_path: string } | undefined
  if (!row) {
    return { synced: false, lyrics: 'Không tìm thấy thông tin bài hát.' }
  }

  const trackPath = row.file_path
  const parsedPath = path.parse(trackPath)
  const lrcPath = path.join(parsedPath.dir, `${parsedPath.name}.lrc`)

  if (fs.existsSync(lrcPath)) {
    try {
      const content = fs.readFileSync(lrcPath, 'utf-8')
      const syncedLyrics = parseLrc(content)
      if (syncedLyrics.length > 0) {
        return { synced: true, lyrics: syncedLyrics }
      }
    } catch (err) {
      console.warn(`[Lyrics] Failed to read or parse LRC file for ${parsedPath.name}:`, err)
    }
  }

  try {
    const { parseFile } = await import('music-metadata')
    const metadata = await parseFile(trackPath)
    const lyricsList = metadata.common.lyrics
    if (lyricsList && lyricsList.length > 0) {
      const plainLyrics = typeof lyricsList[0] === 'string' 
        ? lyricsList[0] 
        : (lyricsList[0] as any).text
      if (plainLyrics && plainLyrics.trim()) {
        return { synced: false, lyrics: plainLyrics.trim() }
      }
    }
  } catch (err) {
    console.warn(`[Lyrics] Failed to extract metadata lyrics for ${parsedPath.name}:`, err)
  }

  return { synced: false, lyrics: 'Chưa có lời bài hát cho bài này.' }
}

