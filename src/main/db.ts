import Database from 'better-sqlite3'
import { app } from 'electron'
import path from 'path'
import fs from 'fs'

let db: Database.Database | null = null

export function initDB(): Database.Database {
  if (db) return db

  const userDataPath = app.getPath('userData')
  const dbName = app.isPackaged ? 'waveform.sqlite' : 'waveform-dev.sqlite'
  const dbPath = path.join(userDataPath, dbName)
  
  // Ensure the directory exists (it should, but good practice)
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true })
  }

  db = new Database(dbPath)
  
  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Upgrade check: drop tables to apply COLLATE NOCASE and clean duplicates if needed
  try {
    const tableInfo = db.prepare("SELECT sql FROM sqlite_master WHERE type='table' AND name='tracks'").get() as { sql: string } | undefined
    if (tableInfo && !tableInfo.sql.includes('NOCASE')) {
      console.log('[DB] Upgrading schema: Dropping tables to apply COLLATE NOCASE...')
      db.exec(`
        DROP TABLE IF EXISTS playlist_tracks;
        DROP TABLE IF EXISTS tracks;
      `)
    }
  } catch (err) {
    console.error('Error upgrading DB schema:', err)
  }

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS tracks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      file_path TEXT UNIQUE NOT NULL COLLATE NOCASE,
      title TEXT,
      artist TEXT,
      album TEXT,
      duration_seconds REAL,
      cover_path TEXT,
      is_favorite INTEGER DEFAULT 0,
      genre TEXT,
      year INTEGER
    );

    CREATE TABLE IF NOT EXISTS playlists (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS playlist_tracks (
      playlist_id INTEGER NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
      track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
      PRIMARY KEY (playlist_id, track_id)
    );

    CREATE TABLE IF NOT EXISTS recently_played (
      track_id INTEGER NOT NULL REFERENCES tracks(id) ON DELETE CASCADE,
      played_at INTEGER NOT NULL,
      PRIMARY KEY (track_id, played_at)
    );

    CREATE INDEX IF NOT EXISTS idx_recently_played_time ON recently_played(played_at DESC);

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
  `)

  // Add is_favorite, genre, and year columns to tracks if they don't exist (for existing databases)
  try {
    const columns = db.prepare("PRAGMA table_info(tracks)").all() as Array<{ name: string }>
    
    const hasFavorite = columns.some(col => col.name === 'is_favorite')
    if (!hasFavorite) {
      console.log('[DB] Adding is_favorite column to tracks table...')
      db.exec('ALTER TABLE tracks ADD COLUMN is_favorite INTEGER DEFAULT 0')
    }
    
    const hasGenre = columns.some(col => col.name === 'genre')
    if (!hasGenre) {
      console.log('[DB] Adding genre column to tracks table...')
      db.exec('ALTER TABLE tracks ADD COLUMN genre TEXT')
    }
    
    const hasYear = columns.some(col => col.name === 'year')
    if (!hasYear) {
      console.log('[DB] Adding year column to tracks table...')
      db.exec('ALTER TABLE tracks ADD COLUMN year INTEGER')
    }
  } catch (err) {
    console.error('Error adding columns (is_favorite/genre/year) to tracks table:', err)
  }

  // Add cover_path column to playlists if it doesn't exist
  try {
    const pColumns = db.prepare("PRAGMA table_info(playlists)").all() as Array<{ name: string }>
    const hasCoverPath = pColumns.some(col => col.name === 'cover_path')
    if (!hasCoverPath) {
      console.log('[DB] Adding cover_path column to playlists table...')
      db.exec('ALTER TABLE playlists ADD COLUMN cover_path TEXT')
    }
  } catch (err) {
    console.error('Error adding cover_path column to playlists:', err)
  }

  return db
}

export function getDB(): Database.Database {
  if (!db) {
    return initDB()
  }
  return db
}
