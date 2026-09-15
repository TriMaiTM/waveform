export interface TftItem {
  id: string;
  name: string;
  iconUrl: string;
}

export interface TftUnit {
  id: string;
  name: string;
  cost: number;
  iconUrl: string;
  splashUrl?: string;
  items?: TftItem[];
  isCarry?: boolean;
  tier?: number; // 2 or 3 stars
}

export interface TftCompUnit {
  id: string;
  name: string;
  cost: number;
  iconUrl: string;
}

export interface TftTraitEffect {
  minUnits: number;
  style: number; // 1: bronze, 3: silver, 4: gold, 5: prismatic
  text: string;
}

export interface TftTraitUnit {
  id: string;
  name: string;
  cost: number;
  iconUrl: string;
}

export interface TftTrait {
  id: string;
  name: string;
  iconUrl: string;
  style: number; // 1: bronze, 3: silver, 4: gold, 5: prismatic
  activeTierIndex: number; // 1-based active effect index
  count: number; // e.g. 3 for 3 Adaptor, 5 for 5 Sprykin
  innate?: string;
  description: string;
  effects: TftTraitEffect[];
  units: TftTraitUnit[];
}

export interface TftComp {
  clusterId: string;
  name: string;
  tier: 'S' | 'A' | 'B' | 'C' | 'D' | '?';
  avgPlacement: number;
  games: number;
  levelling: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  pickRate: number; // e.g. 0.53
  winRate: number; // e.g. 15.0 (%)
  top4Rate: number; // e.g. 58.9 (%)
  units: TftUnit[];
  traits: TftTrait[];
  topItems: TftItem[];
  carryUnitId?: string;
  carrySplashUrl?: string;
}

export interface TftPosition {
  cell: string; // e.g. "cell_1" .. "cell_28"
  count: number;
}

export interface TftEarlyOption {
  units: Array<TftCompUnit | string>;
  count: number;
  avg: number;
  win: number;
}

export interface TftOption {
  units: Array<TftCompUnit | string>;
  traits: string[];
  count: number;
  avg: number;
}

export interface TftAugment {
  id?: string;
  name: string;
  desc?: string;
  iconUrl?: string;
  tier?: 'S' | 'A' | 'B' | 'C' | 'D';
  avg?: number;
  count?: number;
}

export interface TftCompDetail {
  clusterId: string;
  options: Record<string, TftOption[]>;
  earlyOptions: Record<string, TftEarlyOption[]>;
  positioning: Record<string, TftPosition[]>;
  unitStats: Array<{
    unit: string;
    avg: number;
    count: number;
    tiers?: Array<{ tier: number; avg: number; count: number }>;
    numItems?: Array<{ num_items: number; avg: number; count: number }>;
  }>;
  itemStats: Array<{
    itemName: string;
    avg: number;
    count: number;
    iconUrl?: string;
    units?: Array<{ unit: string; avg: number; count: number; place_change: number }>;
  }>;
  augments: TftAugment[];
  placements: Array<{
    count: number;
    avg: number;
  }>;
}
