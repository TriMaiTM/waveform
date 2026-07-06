export interface Track {
  id: number;
  filePath: string;
  title: string | null;
  artist: string | null;
  album: string | null;
  durationSeconds: number | null;
  coverPath: string | null;
  isFavorite: number; // 0 or 1
}

export interface Playlist {
  id: number;
  name: string;
  coverPath?: string | null;
}
