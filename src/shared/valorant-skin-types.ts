export interface SkinChroma {
  uuid: string;
  displayName: string;
  displayIcon?: string;
  fullRender?: string;
  swatch?: string;
  streamedVideo?: string;
}

export interface SkinLevel {
  uuid: string;
  displayName: string;
  levelItem?: string; // 'EEquippableSkinLevelItem::VFX' | 'Animation' | 'Finisher'
  displayIcon?: string;
  streamedVideo?: string;
}

export interface WeaponSkin {
  uuid: string;
  displayName: string;
  themeUuid?: string;
  contentTierUuid?: string;
  displayIcon?: string;
  wallpaper?: string;
  chromas: SkinChroma[];
  levels: SkinLevel[];
}

export interface WeaponWithSkins {
  uuid: string;
  displayName: string;
  category: string;
  displayIcon: string;
  skins: WeaponSkin[];
}
