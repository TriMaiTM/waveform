export interface WeaponDamageRange {
  rangeStartMeters: number;
  rangeEndMeters: number;
  headDamage: number;
  bodyDamage: number;
  legDamage: number;
}

export interface WeaponStats {
  fireRate: number;
  magazineSize: number;
  runSpeedMultiplier: number;
  equipTimeSeconds: number;
  reloadTimeSeconds: number;
  firstBulletAccuracy: number;
  wallPenetration: string;
  damageRanges: WeaponDamageRange[];
}

export interface WeaponShopData {
  cost: number;
  category: string;
  categoryText: string;
}

export interface ValorantWeapon {
  uuid: string;
  displayName: string;
  category: string;
  displayIcon: string;
  weaponStats?: WeaponStats;
  shopData?: WeaponShopData;
}

export interface AgentRole {
  uuid: string;
  displayName: string;
  description: string;
  displayIcon: string;
}

export interface AgentAbility {
  slot: string; // 'Ability1' | 'Ability2' | 'Grenade' | 'Ultimate' | 'Passive'
  displayName: string;
  description: string;
  displayIcon?: string;
}

export interface ValorantAgent {
  uuid: string;
  displayName: string;
  description: string;
  developerName?: string;
  displayIcon: string;
  fullPortrait?: string;
  fullPortraitV2?: string;
  background?: string;
  backgroundGradientColors?: string[];
  role?: AgentRole;
  abilities: AgentAbility[];
}
