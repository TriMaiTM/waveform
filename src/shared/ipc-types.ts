import { GdDemonLevel, GdChangelogItem } from './types'
import { TftComp, TftCompDetail } from './tft-types'
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
  onGlobalShortcut: (channel: string, callback: () => void) => () => void;
  enterMiniPlayer: () => Promise<boolean>;
  exitMiniPlayer: () => Promise<boolean>;
  getGlobalShortcuts: () => Promise<{ playPause: string, next: string, prev: string, miniPlayerType: string }>;
  updateGlobalShortcut: (key: string, value: string) => Promise<boolean>;
  setActiveTrack: (track: any, isPlaying: boolean) => Promise<boolean>;
  getCurrentActiveTrack: () => Promise<{ track: any, isPlaying: boolean }>;
  onWidgetTrackUpdate: (callback: (data: { track: any, isPlaying: boolean }) => void) => () => void;
  widgetControlPlayPause: () => Promise<void>;
  widgetControlNext: () => Promise<void>;
  widgetControlPrev: () => Promise<void>;
  onMiniPlayerStatus: (callback: (isMini: boolean) => void) => () => void;
  getListeningAnalytics: () => Promise<{
    totalHours: number;
    topArtists: Array<{ artist: string, count: number }>;
    topTracks: Array<{ id: number, title: string, artist: string, count: number, coverPath: string | null }>;
    hourlyStats: Array<{ hour: number, count: number }>;
  }>;
  selectCoverImage: () => Promise<string | null>;
  updateTrackMetadata: (
    trackId: number,
    data: {
      title: string;
      artist: string;
      album: string;
      genre: string;
      year: number | null;
      coverPath: string | null;
    }
  ) => Promise<boolean>;
  downloadYoutubeMusic: (
    url: string,
    options: {
      yesPlaylist: boolean;
      embedThumbnail: boolean;
      addMetadata: boolean;
      ytdlpPath: string;
    }
  ) => Promise<{ success: boolean; error?: string; tracks?: Track[] }>;
  onDownloadProgress: (
    callback: (data: { percentage: number; speed: string; eta: string; log: string }) => void
  ) => () => void;

  
  // Geometry Dash Demonlist Module
  gd: {
    getDemons: (forceRefresh?: boolean) => Promise<GdDemonLevel[]>;
    getChangelog: (forceRefresh?: boolean) => Promise<GdChangelogItem[]>;
    getDemonDetail: (uuid: string) => Promise<any>;
  };

  // TFT Tactics Module
  tft: {
    getTierList: (rankTier?: string, days?: number) => Promise<TftComp[]>;
    getCompDetails: (clusterId: string) => Promise<TftCompDetail>;
    refreshData: (rankTier?: string, days?: number) => Promise<TftComp[]>;
  };
}

declare global {
  interface Window {
    api: IPCBridge;
  }
}
