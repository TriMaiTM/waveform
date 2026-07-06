import { app, BrowserWindow, protocol, net } from 'electron'
import path from 'path'
import { pathToFileURL } from 'url'
import { initDB } from './db'
import { registerIPCHandlers } from './ipc-handlers'
import { getMusicDirectory } from './library-scanner'
import fs from 'fs'
import { Readable } from 'stream'

// Helper function to map file extension to MIME type
function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  if (ext === '.mp3') return 'audio/mpeg'
  if (ext === '.wav') return 'audio/wav'
  if (ext === '.ogg') return 'audio/ogg'
  if (ext === '.flac') return 'audio/flac'
  if (ext === '.m4a') return 'audio/mp4'
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg'
  if (ext === '.png') return 'image/png'
  return 'application/octet-stream'
}

// Register custom scheme as privileged BEFORE app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'media', privileges: { bypassCSP: true, stream: true, corsEnabled: true } }
])

let mainWindow: BrowserWindow | null = null

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  // Load the app depending on dev/prod server
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(() => {
  // Ensure the default music directory exists
  const musicDir = getMusicDirectory()
  if (!fs.existsSync(musicDir)) {
    fs.mkdirSync(musicDir, { recursive: true })
  }

  // Initialize Database
  initDB()

  // Register IPC handlers
  registerIPCHandlers()

  // Register custom media protocol to serve local assets with manual HTTP 206 Range Requests support
  protocol.handle('media', async (request) => {
    try {
      const url = new URL(request.url)
      const filePath = url.searchParams.get('path')
      if (!filePath) {
        return new Response('Missing path parameter', { 
          status: 400,
          headers: { 'Access-Control-Allow-Origin': '*' }
        })
      }
      
      // Check if file exists to avoid crashes
      if (!fs.existsSync(filePath)) {
        return new Response('File Not Found', { 
          status: 404,
          headers: { 'Access-Control-Allow-Origin': '*' }
        })
      }

      const stat = fs.statSync(filePath)
      const totalSize = stat.size
      const mimeType = getMimeType(filePath)
      const range = request.headers.get('range')

      const corsHeaders = new Headers({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS, HEAD',
        'Access-Control-Allow-Headers': '*',
        'Accept-Ranges': 'bytes',
        'Content-Type': mimeType
      })

      if (range) {
        // Parse range bytes (e.g. "bytes=1000-2000" or "bytes=1000-")
        const parts = range.replace(/bytes=/, "").split("-")
        const start = parseInt(parts[0], 10)
        const end = parts[1] ? parseInt(parts[1], 10) : totalSize - 1

        const chunkSize = (end - start) + 1
        const fileStream = fs.createReadStream(filePath, { start, end })
        const webStream = Readable.toWeb(fileStream)

        corsHeaders.set('Content-Range', `bytes ${start}-${end}/${totalSize}`)
        corsHeaders.set('Content-Length', chunkSize.toString())

        return new Response(webStream as any, {
          status: 206,
          statusText: 'Partial Content',
          headers: corsHeaders
        })
      } else {
        // Normal 200 OK request
        const fileStream = fs.createReadStream(filePath)
        const webStream = Readable.toWeb(fileStream)

        corsHeaders.set('Content-Length', totalSize.toString())

        return new Response(webStream as any, {
          status: 200,
          statusText: 'OK',
          headers: corsHeaders
        })
      }
    } catch (err) {
      console.error('Error serving media protocol:', err)
      return new Response('Internal Server Error', { 
        status: 500,
        headers: { 'Access-Control-Allow-Origin': '*' }
      })
    }
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})
