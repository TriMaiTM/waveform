import { Track, Playlist } from './types'

export interface IPCBridge {
  getLibraryTracks: () => Promise<Track[]>;
  scanLibrary: () => Promise<Track[]>;
  addMusicFiles: () => Promise<Track[]>;
  
  // Favorites
  toggleFavorite: (trackId: number) => Promise<boolean>;
  
  // Playlists
  createPlaylist: (name?: string) => Promise<Playlist>;
  updatePlaylistName: (playlistId: number, name: string) => Promise<void>;
  selectAndSetPlaylistCover: (playlistId: number) => Promise<string | null>;
  deletePlaylist: (playlistId: number) => Promise<void>;
  getPlaylists: () => Promise<Playlist[]>;
  addTrackToPlaylist: (playlistId: number, trackId: number) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: number, trackId: number) => Promise<void>;
  getPlaylistTracks: (playlistId: number) => Promise<Track[]>;
  getLyrics: (trackId: number) => Promise<{ synced: boolean, lyrics: any[] | string }>;
  addToRecentlyPlayed: (trackId: number) => Promise<void>;
  getRecentlyPlayed: () => Promise<Track[]>;
  deleteTrackFile: (trackId: number) => Promise<Track[]>;
  openMusicFolder: () => Promise<boolean>;
  getMusicDirectory: () => Promise<string>;
  selectMusicDirectory: () => Promise<string | null>;
  resetMusicDirectory: () => Promise<string>;
}

declare global {
  interface Window {
    api: IPCBridge;
  }
}
