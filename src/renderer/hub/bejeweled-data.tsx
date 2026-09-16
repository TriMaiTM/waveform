import React from 'react'

export type GemCategory = 
  | 'quartz'
  | 'topaz'
  | 'onyx'
  | 'amethyst'
  | 'ruby'
  | 'emerald'
  | 'opal'
  | 'sapphire'
  | 'diamond'
  | 'blitzer'
  | 'master'
  | 'magus'
  | 'knight'
  | 'bejewelian'
  | 'elder';

export type BadgeTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'crystal' | 'cosmic' | 'mythic';

export interface BejeweledLevelInfo {
  level: number;
  title: string;
  minutesReq: number;
  timeFormatted: string;
  gemType: GemCategory;
  tier: BadgeTier;
  color: string;
  description: string;
}

const ALL_131_TITLES: string[] = [
  'Novice', 'Apprentice', 'Trainee', 'Beginner', 'Amateur', 'Jr. Appraiser', 'Appraiser', 'Gem Polisher', 'Gem Scraper', 'Gem Grinder',
  'Jewel Thief', 'Jewel Scavenger', 'Gem Scrounger', 'Jr. Gemfinder', 'Gemfinder', 'Master Gemfinder', 'Jr. Jewelkeep', 'Jewelkeep', 'Master Jewelkeeper', 'Gemhunter Lv 1',
  'Gemhunter Lv 2', 'Gemhunter Lv 3', 'Gemhunter Lv 4', 'Gemhunter Lv 5', 'Gemcrafter Lv 1', 'Gemcrafter Lv 2', 'Gemcrafter Lv 3', 'Gemcrafter Lv 4', 'Gemcrafter Lv 5', 'Jr. Gemstalker',
  'Gemstalker', 'Sr. Gemstalker', 'Topaz Hunter', 'Onyx Hunter', 'Amethyst Hunter', 'Ruby Hunter', 'Emerald Hunter', 'Opal Hunter', 'Sapphire Hunter', 'Diamond Hunter',
  'Topaz Blaster', 'Onyx Blaster', 'Amethyst Blaster', 'Ruby Blaster', 'Emerald Blaster', 'Opal Blaster', 'Sapphire Blaster', 'Diamond Blaster', 'Topaz Hoarder', 'Onyx Hoarder',
  'Amethyst Hoarder', 'Ruby Hoarder', 'Emerald Hoarder', 'Opal Hoarder', 'Sapphire Hoarder', 'Diamond Hoarder', 'Topaz Master', 'Onyx Master', 'Amethyst Master', 'Ruby Master',
  'Emerald Master', 'Opal Master', 'Sapphire Master', 'Diamond Master', 'Lapidary Lv 1', 'Lapidary Lv 2', 'Lapidary Lv 3', 'Lapidary Lv 4', 'Lapidary Lv 5', 'Master Lapidary',
  'Supreme Lapidary', 'Ruby Wizard', 'Emerald Wizard', 'Opal Wizard', 'Sapphire Wizard', 'Diamond Wizard', 'Jeweled Wizard', 'Jeweled Mage', 'Jeweled Archmage', 'Jewelcrafter',
  'Jewelforger', 'Bronze Blitzer', 'Silver Blitzer', 'Gold Blitzer', 'Platinum Blitzer', 'Bronze Master', 'Silver Master', 'Gold Master', 'Platinum Master', 'Jr.Bejeweler',
  'Bejeweler', 'Sr. Bejeweler', 'Master Bejeweler', 'Mega Bejeweler', 'Hyper Bejeweler', 'Ultra Bejeweler', 'Prime Bejeweler', 'Ultimate Bejeweler', 'Bejeweled Regent', 'Bejeweled Demigod',
  'Supreme Bejeweler', 'Jewelmagus Lv 1', 'Jewelmagus Lv 2', 'Jewelmagus Lv 3', 'Jewelmagus Lv 4', 'Jewelmagus Lv 5', 'Jewelmagus Lv 6', 'Jewelmagus Lv 7', 'Jewelmagus Lv 8', 'Jewelmagus Lv 9',
  'Elder Jewelmagus', 'Jewelknight Lv 1', 'Jewelknight Lv 2', 'Jewelknight Lv 3', 'Jewelknight Lv 4', 'Jewelknight Lv 5', 'Jewelknight Lv 6', 'Jewelknight Lv 7', 'Jewelknight Lv 8', 'Jewelknight Lv 9',
  'Elder Jewelknight', 'Bejewelian Lv 1', 'Bejewelian Lv 2', 'Bejewelian Lv 3', 'Bejewelian Lv 4', 'Bejewelian Lv 5', 'Bejewelian Lv 6', 'Bejewelian Lv 7', 'Bejewelian Lv 8', 'Bejewelian Lv 9',
  'Elder Bejewelian'
];

function formatTimeMinutes(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m === 0 ? `${h}h` : `${h}h ${m}m`;
}

function resolveGemType(title: string, level: number): { gemType: GemCategory; tier: BadgeTier; color: string } {
  const t = title.toLowerCase();
  if (level === 131 || t.includes('elder bejewelian')) {
    return { gemType: 'elder', tier: 'mythic', color: '#ffd700' };
  }
  if (t.includes('bejewelian')) {
    return { gemType: 'bejewelian', tier: 'cosmic', color: '#f43f5e' };
  }
  if (t.includes('jewelknight')) {
    return { gemType: 'knight', tier: 'crystal', color: '#06b6d4' };
  }
  if (t.includes('jewelmagus')) {
    return { gemType: 'magus', tier: 'crystal', color: '#8b5cf6' };
  }
  if (t.includes('demigod') || t.includes('regent') || t.includes('bejeweler')) {
    return { gemType: 'master', tier: 'crystal', color: '#ec4899' };
  }
  if (t.includes('blitzer')) {
    return { gemType: 'blitzer', tier: 'gold', color: '#eab308' };
  }
  if (t.includes('diamond')) {
    return { gemType: 'diamond', tier: 'crystal', color: '#38bdf8' };
  }
  if (t.includes('sapphire')) {
    return { gemType: 'sapphire', tier: 'platinum', color: '#3b82f6' };
  }
  if (t.includes('opal')) {
    return { gemType: 'opal', tier: 'platinum', color: '#2dd4bf' };
  }
  if (t.includes('emerald')) {
    return { gemType: 'emerald', tier: 'gold', color: '#10b981' };
  }
  if (t.includes('ruby')) {
    return { gemType: 'ruby', tier: 'gold', color: '#ef4444' };
  }
  if (t.includes('amethyst')) {
    return { gemType: 'amethyst', tier: 'silver', color: '#a855f7' };
  }
  if (t.includes('onyx')) {
    return { gemType: 'onyx', tier: 'silver', color: '#64748b' };
  }
  if (t.includes('topaz')) {
    return { gemType: 'topaz', tier: 'bronze', color: '#f59e0b' };
  }
  if (level <= 10) {
    return { gemType: 'quartz', tier: 'bronze', color: '#94a3b8' };
  }
  if (level <= 20) {
    return { gemType: 'topaz', tier: 'bronze', color: '#f59e0b' };
  }
  if (level <= 32) {
    return { gemType: 'amethyst', tier: 'silver', color: '#c084fc' };
  }
  return { gemType: 'master', tier: 'gold', color: '#eab308' };
}

// Generate the 131 Level Table with Balanced Time Curve (Total up to 500 Hours)
export const BEJEWELED_131_RANKS: BejeweledLevelInfo[] = ALL_131_TITLES.map((title, idx) => {
  const level = idx + 1;
  let minutes = 0;

  if (level === 1) {
    minutes = 0;
  } else if (level <= 10) {
    // 0 - 2.5 hours (first 10 levels)
    minutes = Math.round(5 * Math.pow(level - 1, 1.4));
  } else if (level <= 30) {
    // 3 - 12 hours
    minutes = 150 + Math.round((level - 10) * 28);
  } else if (level <= 65) {
    // 13 - 48 hours (hunter & hoarder series)
    minutes = 710 + Math.round((level - 30) * 62);
  } else if (level <= 90) {
    // 50 - 110 hours (masters & lapidaries)
    minutes = 2880 + Math.round((level - 65) * 145);
  } else if (level <= 110) {
    // 115 - 220 hours (bejewelers & magus)
    minutes = 6505 + Math.round((level - 90) * 320);
  } else if (level <= 130) {
    // 225 - 460 hours (knights & bejewelians)
    minutes = 12905 + Math.round((level - 110) * 715);
  } else {
    // Level 131: 500 Hours (30,000 minutes)
    minutes = 30000;
  }

  const { gemType, tier, color } = resolveGemType(title, level);

  return {
    level,
    title,
    minutesReq: minutes,
    timeFormatted: formatTimeMinutes(minutes),
    gemType,
    tier,
    color,
    description: `Cấp độ ${level} • Đạt mốc tích lũy ${formatTimeMinutes(minutes)} hoạt động`
  };
});

export function getBejeweledLevelBySeconds(seconds: number): BejeweledLevelInfo {
  const totalMinutes = Math.floor(seconds / 60);
  for (let i = BEJEWELED_131_RANKS.length - 1; i >= 0; i--) {
    if (totalMinutes >= BEJEWELED_131_RANKS[i].minutesReq) {
      return BEJEWELED_131_RANKS[i];
    }
  }
  return BEJEWELED_131_RANKS[0];
}

export function getNextBejeweledLevel(currentLevel: number): BejeweledLevelInfo | null {
  if (currentLevel >= 131) return null;
  return BEJEWELED_131_RANKS[currentLevel];
}

// =========================================================================
// REAL VECTOR SVG GEMSTONE ASSETS (NO EMOJIS, AUTHENTIC FACETED CRYSTALS)
// =========================================================================

interface GemAssetProps {
  type: GemCategory;
  size?: number;
  className?: string;
}

export const GemAsset: React.FC<GemAssetProps> = ({ type, size = 24, className = '' }) => {
  const s = size;

  switch (type) {
    case 'ruby':
      // Radiant Octagonal Ruby Cut
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
          <polygon points="9,2 23,2 30,9 30,23 23,30 9,30 2,23 2,9" fill="#991b1b" stroke="#f87171" strokeWidth="1.5" />
          <polygon points="11,6 21,6 26,11 26,21 21,26 11,26 6,21 6,11" fill="#dc2626" />
          <polygon points="13,9 19,9 23,13 23,19 19,23 13,23 9,19 9,13" fill="#ef4444" />
          <polygon points="13,9 19,9 17,14 11,14" fill="#fca5a5" opacity="0.8" />
          <line x1="9" y1="2" x2="13" y2="9" stroke="#fecaca" strokeWidth="1" />
          <line x1="23" y1="2" x2="19" y2="9" stroke="#fecaca" strokeWidth="1" />
          <line x1="30" y1="9" x2="23" y2="13" stroke="#fecaca" strokeWidth="1" />
          <line x1="30" y1="23" x2="23" y2="19" stroke="#fecaca" strokeWidth="1" />
        </svg>
      );

    case 'sapphire':
      // Brilliant Oval Sapphire
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
          <polygon points="16,2 28,10 24,28 8,28 4,10" fill="#1e3a8a" stroke="#60a5fa" strokeWidth="1.5" />
          <polygon points="16,6 24,12 20,24 12,24 8,12" fill="#2563eb" />
          <polygon points="16,10 21,14 18,21 14,21 11,14" fill="#3b82f6" />
          <polygon points="16,6 24,12 16,14 8,12" fill="#93c5fd" opacity="0.85" />
          <line x1="16" y1="2" x2="16" y2="6" stroke="#bfdbfe" strokeWidth="1" />
          <line x1="28" y1="10" x2="24" y2="12" stroke="#bfdbfe" strokeWidth="1" />
          <line x1="4" y1="10" x2="8" y2="12" stroke="#bfdbfe" strokeWidth="1" />
        </svg>
      );

    case 'emerald':
      // Emerald Step Cut
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
          <polygon points="6,2 26,2 30,7 30,25 26,30 6,30 2,25 2,7" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
          <polygon points="8,5 24,5 27,9 27,23 24,27 8,27 5,23 5,9" fill="#059669" />
          <polygon points="10,8 22,8 24,11 24,21 22,24 10,24 8,21 8,11" fill="#10b981" />
          <polygon points="10,8 22,8 20,12 12,12" fill="#a7f3d0" opacity="0.85" />
        </svg>
      );

    case 'diamond':
      // Brilliant Star Diamond Cut
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
          <polygon points="8,4 24,4 30,12 16,30 2,12" fill="#0369a1" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="10,7 22,7 26,12 16,26 6,12" fill="#0284c7" />
          <polygon points="12,7 20,7 23,12 16,16 9,12" fill="#38bdf8" />
          <polygon points="12,7 20,7 16,12" fill="#f0f9ff" opacity="0.9" />
          <line x1="8" y1="4" x2="16" y2="12" stroke="#e0f2fe" strokeWidth="1" />
          <line x1="24" y1="4" x2="16" y2="12" stroke="#e0f2fe" strokeWidth="1" />
          <line x1="16" y1="16" x2="16" y2="30" stroke="#bae6fd" strokeWidth="1" />
        </svg>
      );

    case 'topaz':
      // Amber Cushion Topaz
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
          <polygon points="16,2 30,16 16,30 2,16" fill="#78350f" stroke="#fbbf24" strokeWidth="1.5" />
          <polygon points="16,6 26,16 16,26 6,16" fill="#d97706" />
          <polygon points="16,10 22,16 16,22 10,16" fill="#f59e0b" />
          <polygon points="16,6 26,16 16,16 6,16" fill="#fef3c7" opacity="0.85" />
        </svg>
      );

    case 'amethyst':
      // Hexagonal Royal Amethyst
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
          <polygon points="16,2 29,8 29,24 16,30 3,24 3,8" fill="#4a044e" stroke="#c084fc" strokeWidth="1.5" />
          <polygon points="16,5 26,10 26,22 16,27 6,22 6,10" fill="#7e22ce" />
          <polygon points="16,9 23,13 23,19 16,23 9,19 9,13" fill="#a855f7" />
          <polygon points="16,5 26,10 16,14 6,10" fill="#f5d0fe" opacity="0.85" />
        </svg>
      );

    case 'onyx':
      // Obsidian Dark Shield
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
          <polygon points="16,2 29,6 26,24 16,30 6,24 3,6" fill="#0f172a" stroke="#94a3b8" strokeWidth="1.5" />
          <polygon points="16,5 26,9 23,22 16,27 9,22 6,9" fill="#1e293b" />
          <polygon points="16,8 22,11 19,20 16,23 13,20 10,11" fill="#334155" />
          <line x1="16" y1="2" x2="16" y2="30" stroke="#cbd5e1" strokeWidth="1" />
        </svg>
      );

    case 'opal':
      // Iridescent Teal Opal
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="14" fill="#134e4a" stroke="#2dd4bf" strokeWidth="1.5" />
          <ellipse cx="16" cy="16" rx="10" ry="10" fill="#0f766e" />
          <ellipse cx="14" cy="13" rx="7" ry="5" fill="#2dd4bf" opacity="0.8" />
          <circle cx="13" cy="11" r="2.5" fill="#f0fdfa" />
        </svg>
      );

    case 'magus':
      // Arcane Jewelmagus Orb
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
          <circle cx="16" cy="16" r="14" fill="#312e81" stroke="#818cf8" strokeWidth="1.5" />
          <polygon points="16,4 28,16 16,28 4,16" stroke="#c7d2fe" strokeWidth="1" fill="none" />
          <polygon points="16,6 26,16 16,26 6,16" fill="#4f46e5" />
          <circle cx="16" cy="16" r="5" fill="#a5b4fc" />
          <circle cx="16" cy="16" r="2" fill="#ffffff" />
        </svg>
      );

    case 'knight':
      // Jewelknight Crowned Shield
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
          <polygon points="16,2 28,6 24,24 16,30 8,24 4,6" fill="#0e7490" stroke="#38bdf8" strokeWidth="1.5" />
          <polygon points="16,6 24,9 20,22 16,26 12,22 8,9" fill="#06b6d4" />
          <line x1="16" y1="6" x2="16" y2="26" stroke="#cffafe" strokeWidth="1.5" />
          <line x1="10" y1="14" x2="22" y2="14" stroke="#cffafe" strokeWidth="1.5" />
        </svg>
      );

    case 'bejewelian':
      // Hyper Prismatic Star
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
          <polygon points="16,0 20,11 31,11 22,18 25,29 16,22 7,29 10,18 1,11 12,11" fill="#881337" stroke="#fb7185" strokeWidth="1.5" />
          <polygon points="16,4 19,12 27,12 21,17 23,25 16,20 9,25 11,17 5,12 13,12" fill="#e11d48" />
          <circle cx="16" cy="16" r="4" fill="#ffe4e6" />
        </svg>
      );

    case 'elder':
    default:
      // Mythic Imperial Crowned Bejeweled Crest
      return (
        <svg width={s} height={s} viewBox="0 0 32 32" fill="none" className={className}>
          {/* Crown Spikes */}
          <polygon points="2,14 6,4 16,10 26,4 30,14 26,28 6,28" fill="#713f12" stroke="#facc15" strokeWidth="1.5" />
          <polygon points="5,15 8,7 16,12 24,7 27,15 24,25 8,25" fill="#ca8a04" />
          {/* Centered Diamond Inset */}
          <polygon points="16,13 22,19 16,25 10,19" fill="#ef4444" stroke="#fde047" strokeWidth="1" />
          <circle cx="6" cy="4" r="2" fill="#38bdf8" />
          <circle cx="26" cy="4" r="2" fill="#38bdf8" />
          <circle cx="16" cy="10" r="2" fill="#ffffff" />
        </svg>
      );
  }
};
