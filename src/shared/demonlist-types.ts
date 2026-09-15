export interface GdDemonLevel {
  id: string;
  name: string;
  position: number;
  level_id: number;
  points?: number;
  publisher?: string;
  verifier?: string;
  thumbnail?: string | null;
  video_url?: string | null;
  tags?: string[];
  description?: string;
  gddl_tier?: number | null;
  edel_enjoyment?: number | null;
  status?: string;
}

export interface GdChangelogItem {
  id: string;
  action_type: 'Raised' | 'Lowered' | 'Placed' | 'Removed' | 'Unknown';
  old_position?: number;
  new_position: number;
  affected_level: {
    id: string;
    name: string;
    level_id: number;
  };
  level_above?: {
    id: string;
    name: string;
    level_id: number;
  } | null;
  level_below?: {
    id: string;
    name: string;
    level_id: number;
  } | null;
  created_at: string;
  author_name?: string;
  author_avatar?: string;
  reactions?: {
    thumbsUp: number;
    thumbsDown: number;
    angry: number;
    skull: number;
  };
}
