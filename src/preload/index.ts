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
  getRecentlyPlayed: () => ipcRenderer.invoke('get-recently-played'),
  deleteTrackFile: (trackId) => ipcRenderer.invoke('delete-track-file', trackId),
  openMusicFolder: () => ipcRenderer.invoke('open-music-folder'),
  getMusicDirectory: () => ipcRenderer.invoke('get-music-directory'),
  selectMusicDirectory: () => ipcRenderer.invoke('select-music-directory'),
  resetMusicDirectory: () => ipcRenderer.invoke('reset-music-directory'),
  onGlobalShortcut: (channel, callback) => {
    const subscription = (_event: any) => callback()
    ipcRenderer.on(channel, subscription)
    return () => {
      ipcRenderer.removeListener(channel, subscription)
    }
  },
  enterMiniPlayer: () => ipcRenderer.invoke('enter-mini-player'),
  exitMiniPlayer: () => ipcRenderer.invoke('exit-mini-player'),
  getGlobalShortcuts: () => ipcRenderer.invoke('get-global-shortcuts'),
  updateGlobalShortcut: (key, value) => ipcRenderer.invoke('update-global-shortcut', { key, value }),
  setActiveTrack: (track, isPlaying) => ipcRenderer.invoke('set-active-track', { track, isPlaying }),
  getCurrentActiveTrack: () => ipcRenderer.invoke('get-current-active-track'),
  onWidgetTrackUpdate: (callback) => {
    const subscription = (_event: any, data: any) => callback(data)
    ipcRenderer.on('widget-track-update', subscription)
    return () => {
      ipcRenderer.removeListener('widget-track-update', subscription)
    }
  },
  widgetControlPlayPause: () => ipcRenderer.invoke('widget-control-play-pause'),
  widgetControlNext: () => ipcRenderer.invoke('widget-control-next'),
  widgetControlPrev: () => ipcRenderer.invoke('widget-control-prev'),
  onMiniPlayerStatus: (callback) => {
    const subscription = (_event: any, isMini: any) => callback(isMini)
    ipcRenderer.on('mini-player-status', subscription)
    return () => {
      ipcRenderer.removeListener('mini-player-status', subscription)
    }
  },
  getListeningAnalytics: () => ipcRenderer.invoke('get-listening-analytics'),
  selectCoverImage: () => ipcRenderer.invoke('select-cover-image'),
  updateTrackMetadata: (trackId, data) => ipcRenderer.invoke('update-track-metadata', trackId, data),
  downloadYoutubeMusic: (url, options) => ipcRenderer.invoke('download-youtube-music', { url, options }),
  onDownloadProgress: (callback) => {
    const subscription = (_event: any, data: any) => callback(data)
    ipcRenderer.on('download-progress-event', subscription)
    return () => {
      ipcRenderer.removeListener('download-progress-event', subscription)
    }
  },
  
  gd: {
    getDemons: (forceRefresh?: boolean) => ipcRenderer.invoke('gd:get-demons', forceRefresh),
    getChangelog: (forceRefresh?: boolean) => ipcRenderer.invoke('gd:get-changelog', forceRefresh),
    getDemonDetail: (uuid: string) => ipcRenderer.invoke('gd:get-demon-detail', uuid)
  },
  tft: {
    getTierList: (rankTier?: string, days?: number) => ipcRenderer.invoke('tft:get-tierlist', rankTier, days),
    getCompDetails: (clusterId: string) => ipcRenderer.invoke('tft:get-comp-details', clusterId),
    refreshData: (rankTier?: string, days?: number) => ipcRenderer.invoke('tft:refresh-data', rankTier, days)
  }
}

contextBridge.exposeInMainWorld('api', api)
