import { contextBridge, ipcRenderer } from 'electron'
import { IPCBridge } from '../shared/ipc-types'

const api: IPCBridge = {
  getLibraryTracks: () => ipcRenderer.invoke('get-library-tracks'),
  scanLibrary: () => ipcRenderer.invoke('scan-library'),
  addMusicFiles: () => ipcRenderer.invoke('add-music-files'),
  toggleFavorite: (trackId) => ipcRenderer.invoke('toggle-favorite', trackId),
  createPlaylist: (name) => ipcRenderer.invoke('create-playlist', name),
  updatePlaylistName: (playlistId, name) => ipcRenderer.invoke('update-playlist-name', playlistId, name),
  selectAndSetPlaylistCover: (playlistId) => ipcRenderer.invoke('select-and-set-playlist-cover', playlistId),
  deletePlaylist: (playlistId) => ipcRenderer.invoke('delete-playlist', playlistId),
  getPlaylists: () => ipcRenderer.invoke('get-playlists'),
  addTrackToPlaylist: (playlistId, trackId) => ipcRenderer.invoke('add-track-to-playlist', playlistId, trackId),
  removeTrackFromPlaylist: (playlistId, trackId) => ipcRenderer.invoke('remove-track-from-playlist', playlistId, trackId),
  getPlaylistTracks: (playlistId) => ipcRenderer.invoke('get-playlist-tracks', playlistId),
  getLyrics: (trackId) => ipcRenderer.invoke('get-lyrics', trackId),
  addToRecentlyPlayed: (trackId) => ipcRenderer.invoke('add-to-recently-played', trackId),
  getRecentlyPlayed: () => ipcRenderer.invoke('get-recently-played')
}

contextBridge.exposeInMainWorld('api', api)
