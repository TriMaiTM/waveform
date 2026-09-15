export interface ValorantPlayerCard {
  small?: string;
  large?: string;
  wide?: string;
}

export interface ValorantCurrentRank {
  tier: number;
  tier_name: string;
  rr: number;
  last_change: number;
  icon: string;
}

export interface ValorantPeakRank {
  tier_name: string;
  season?: string;
}

export interface ValorantPlayerStats {
  winrate: number;
  wins: number;
  losses: number;
  kd: number;
  headshot_pct: number;
  avg_acs: number;
  avg_adr: number;
  total_kills: number;
  total_deaths: number;
  avg_kills_per_match: number;
  games_analyzed: number;
}

export interface ValorantAgentStat {
  name: string;
  icon?: string;
  matches: number;
  wins: number;
  losses: number;
  winrate: number;
  kd: number;
  kills: number;
  deaths: number;
}

export interface ValorantMapStat {
  name: string;
  splash?: string;
  matches: number;
  wins: number;
  losses: number;
  winrate: number;
}

export interface ValorantWeaponStat {
  name: string;
  icon?: string;
  kills: number;
  headshots: number;
  hs_pct: number;
}

export interface ValorantMatchPlayer {
  puuid: string;
  name: string;
  tag: string;
  team: 'Blue' | 'Red';
  character: string;
  agent_icon?: string;
  rank_tier: number;
  rank_name: string;
  rank_icon?: string;
  stats: {
    score: number;
    kills: number;
    deaths: number;
    assists: number;
    headshots: number;
    bodyshots: number;
    legshots: number;
  };
  damage_made: number;
  damage_received: number;
  acs: number;
  adr: number;
  hs_pct: number;
  kd: number;
  diff: number; // kills - deaths
  is_match_mvp?: boolean;
  is_team_mvp?: boolean;
  is_current_player?: boolean;
}

export interface ValorantMatchTeam {
  team: 'Blue' | 'Red';
  has_won: boolean;
  rounds_won: number;
  rounds_lost: number;
  players: ValorantMatchPlayer[];
}

export interface ValorantMatch {
  match_id: string;
  map: string;
  mode: string;
  game_start: string;
  game_length_seconds?: number;
  server?: string;
  rounds_played: number;
  has_won: boolean;
  team_score: number;
  enemy_score: number;
  agent: {
    name: string;
    icon?: string;
  };
  kills: number;
  deaths: number;
  assists: number;
  score: number; // ACS
  headshot_pct: number;
  damage_made: number;
  is_match_mvp?: boolean;
  is_team_mvp?: boolean;
  teams?: {
    blue: ValorantMatchTeam;
    red: ValorantMatchTeam;
  };
  all_players?: ValorantMatchPlayer[];
}

export interface ValorantPlayerProfile {
  name: string;
  tag: string;
  puuid: string;
  region: string;
  account_level: number;
  card: ValorantPlayerCard;
  current_rank: ValorantCurrentRank;
  peak_rank: ValorantPeakRank;
  stats: ValorantPlayerStats;
  agent_stats: ValorantAgentStat[];
  map_stats: ValorantMapStat[];
  top_weapons?: ValorantWeaponStat[];
  recent_matches: ValorantMatch[];
}

export interface ValorantSearchItem {
  name: string;
  tag: string;
  region?: string;
  card_small?: string;
  tier_name?: string;
  tier_icon?: string;
  is_pinned?: boolean;
}
