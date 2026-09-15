import { app } from 'electron'
import * as fs from 'fs'
import * as path from 'path'
import { 
  TftComp, 
  TftCompDetail, 
  TftUnit, 
  TftTrait, 
  TftItem, 
  TftTraitEffect, 
  TftTraitUnit, 
  TftOption, 
  TftEarlyOption, 
  TftPosition 
} from '../shared/tft-types'

const METATFT_BASE = 'https://api-hc.metatft.com/tft-comps-api'
const CDRAGON_VI = 'https://raw.communitydragon.org/latest/cdragon/tft/vi_vn.json'
const CDRAGON_EN = 'https://raw.communitydragon.org/latest/cdragon/tft/en_us.json'

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json, text/plain, */*'
}

const DEFAULT_RANKS = 'PLATINUM,EMERALD,DIAMOND,MASTER,GRANDMASTER,CHALLENGER'

interface StaticTrait {
  name: string;
  desc: string;
  effects: Array<{ minUnits: number; maxUnits: number; style: number; variables: Record<string, any> }>;
  unitIds: string[];
}

interface StaticDict {
  champions: Record<string, { name: string; cost: number; traits: string[]; splashUrl?: string }>;
  items: Record<string, { name: string }>;
  traits: Record<string, StaticTrait>;
}

function fnv1a(text: string): string {
  let h = 0x811c9dc5;
  const buf = Buffer.from(text.toLowerCase(), 'utf-8');
  for (let i = 0; i < buf.length; i++) {
    h = (h ^ buf[i]) * 0x01000193;
    h = h >>> 0;
  }
  return `{${h.toString(16).padStart(8, '0')}}`;
}

export class TftService {
  private static instance: TftService;
  private cacheDir: string;
  private staticDict: StaticDict | null = null;
  private latestClusterId: string = '422';

  private constructor() {
    this.cacheDir = path.join(app.getPath('userData'), 'tft_cache');
    if (!fs.existsSync(this.cacheDir)) {
      try {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      } catch (err) {
        console.error('[TftService] Failed to create cache dir:', err);
      }
    }
  }

  public static getInstance(): TftService {
    if (!TftService.instance) {
      TftService.instance = new TftService();
    }
    return TftService.instance;
  }

  private getUnitIconUrl(unitId: string): string {
    return `https://cdn.metatft.com/file/metatft/champions/${unitId.toLowerCase()}.png`;
  }

  private getUnitSplashUrl(unitId: string, dict?: StaticDict): string {
    const champ = dict?.champions?.[unitId];
    if (champ?.splashUrl) {
      return champ.splashUrl;
    }
    return `https://cdn.metatft.com/file/metatft/championsplashes/${unitId.toLowerCase()}.png`;
  }

  private getItemIconUrl(itemId: string): string {
    return `https://cdn.metatft.com/file/metatft/items/${itemId.toLowerCase()}.png`;
  }

  private getTraitIconUrl(traitKey: string): string {
    return `https://cdn.metatft.com/file/metatft/traits/${traitKey.toLowerCase()}.png`;
  }

  private cleanHtml(raw: string): string {
    if (!raw) return '';
    return raw
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<row>/gi, '\n')
      .replace(/<\/row>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/@([a-zA-Z0-9_]+)\*100@/g, '$1%')
      .replace(/@([a-zA-Z0-9_]+)@/g, '$1')
      .trim();
  }

  private parseTraitDetails(desc: string, rawEffects: any[]): { innate?: string; generalDesc: string; effects: TftTraitEffect[] } {
    if (!desc) {
      return { generalDesc: '', effects: [] };
    }

    const parts = desc.split(/<row>/i);
    let header = parts[0] || '';
    header = header.replace(/<br\s*\/?>/gi, '\n').replace(/<[^>]+>/g, '').trim();

    let innate: string | undefined;
    let generalDesc = header;

    if (header.toLowerCase().startsWith('innate:')) {
      const headerLines = header.split('\n\n');
      innate = headerLines[0].replace(/^innate:\s*/i, '').trim();
      generalDesc = headerLines.slice(1).join('\n\n').trim();
    }

    const rowMatches = desc.match(/<row>([\s\S]*?)<\/row>/gi) || [];
    const effects: TftTraitEffect[] = [];

    for (let i = 0; i < rawEffects.length; i++) {
      const eff = rawEffects[i];
      let rowTemplate = rowMatches[i] ? rowMatches[i].replace(/<\/?row>/gi, '') : `(${eff.minUnits}) Active`;
      rowTemplate = rowTemplate.replace(/@MinUnits@/gi, String(eff.minUnits));

      const vars = eff.variables || {};

      rowTemplate = rowTemplate.replace(/@([^@]+)@/g, (_m: string, expr: string) => {
        const isPct = expr.includes('*100');
        const varName = expr.replace('*100', '').trim();
        let val = vars[varName];
        if (val === undefined) {
          val = vars[fnv1a(varName)];
        }
        if (val !== undefined && typeof val === 'number') {
          if (isPct) {
            return `${Math.round(val * 100)}%`;
          } else {
            const rounded = Math.round(val * 10) / 10;
            return String(rounded);
          }
        }
        return '';
      });

      // Icon mappings
      rowTemplate = rowTemplate
        .replace(/%i:scaleHealth%/gi, '💚 HP')
        .replace(/%i:scaleAS%/gi, '⚡ AS')
        .replace(/%i:scaleAD%/gi, '🗡️ AD')
        .replace(/%i:scaleAP%/gi, '🪄 AP')
        .replace(/%i:scaleArmor%/gi, '🛡️ Armor')
        .replace(/%i:scaleMR%/gi, '✨ MR')
        .replace(/%i:scaleMana%/gi, '💧 Mana')
        .replace(/<br\s*\/?>/gi, ' ')
        .replace(/<[^>]+>/g, '')
        .replace(/\s+/g, ' ')
        .trim();

      effects.push({
        minUnits: eff.minUnits,
        style: eff.style || 1,
        text: rowTemplate
      });
    }

    return { innate, generalDesc, effects };
  }

  private async getStaticDictionary(): Promise<StaticDict> {
    if (this.staticDict) return this.staticDict;

    const dictCachePath = path.join(this.cacheDir, 'static_dict.json');
    if (fs.existsSync(dictCachePath)) {
      try {
        const stat = fs.statSync(dictCachePath);
        if (Date.now() - stat.mtimeMs < 24 * 60 * 60 * 1000) {
          const raw = fs.readFileSync(dictCachePath, 'utf-8');
          this.staticDict = JSON.parse(raw);
          return this.staticDict!;
        }
      } catch (e) {
        console.warn('[TftService] Cache read error, fetching fresh dictionary:', e);
      }
    }

    try {
      console.log('[TftService] Fetching CommunityDragon dictionary...');
      let res = await fetch(CDRAGON_VI, { headers: HEADERS });
      if (!res.ok) {
        res = await fetch(CDRAGON_EN, { headers: HEADERS });
      }
      const data = await res.json();

      const dict: StaticDict = {
        champions: {},
        items: {},
        traits: {}
      };

      // Items
      if (Array.isArray(data.items)) {
        for (const item of data.items) {
          if (item.apiName && item.name) {
            dict.items[item.apiName] = {
              name: item.name
            };
          }
        }
      }

      // Sets, Champions & Traits
      const sets = data.setData || [];
      const traitUnitsMap: Record<string, Set<string>> = {};

      for (const s of sets) {
        if (Array.isArray(s.traits)) {
          for (const t of s.traits) {
            if (t.apiName && t.name) {
              dict.traits[t.apiName] = {
                name: t.name,
                desc: t.desc || '',
                effects: t.effects || [],
                unitIds: []
              };
            }
          }
        }

        if (Array.isArray(s.champions)) {
          for (const c of s.champions) {
            if (c.apiName && c.name) {
              let splashUrl: string | undefined = undefined;
              if (c.icon && !c.icon.toLowerCase().includes('none')) {
                splashUrl = 'https://raw.communitydragon.org/latest/game/' + c.icon.toLowerCase().replace('.tex', '.png');
              }
              dict.champions[c.apiName] = {
                name: c.name,
                cost: c.cost || 1,
                traits: c.traits || [],
                splashUrl
              };

              // Map champions to traits
              for (const tr of c.traits || []) {
                if (!traitUnitsMap[tr]) traitUnitsMap[tr] = new Set();
                traitUnitsMap[tr].add(c.apiName);
              }
            }
          }
        }
      }

      // Assign unitIds to traits
      for (const [tr, unitSet] of Object.entries(traitUnitsMap)) {
        if (dict.traits[tr]) {
          dict.traits[tr].unitIds = Array.from(unitSet);
        }
      }

      this.staticDict = dict;

      try {
        fs.writeFileSync(dictCachePath, JSON.stringify(dict), 'utf-8');
      } catch (err) {
        console.warn('[TftService] Failed to cache static dictionary:', err);
      }

      return dict;
    } catch (err) {
      console.error('[TftService] Failed to fetch static dictionary:', err);
      return { champions: {}, items: {}, traits: {} };
    }
  }

  private resolveItem(rawItemName: string, dict: StaticDict): TftItem {
    let cleanId = rawItemName;
    if (cleanId.startsWith('TFT_Item_')) {
      cleanId = cleanId.replace('TFT_Item_', '');
    } else if (cleanId.startsWith('TFT13_Item_')) {
      cleanId = cleanId.replace('TFT13_Item_', '');
    }

    const matched = dict.items[rawItemName] || dict.items[cleanId];
    return {
      id: rawItemName,
      name: matched?.name || this.prettifyName(cleanId),
      iconUrl: this.getItemIconUrl(rawItemName)
    };
  }

  private prettifyName(id: string): string {
    return id
      .replace(/^TFT\d*_/i, '')
      .replace(/^DA_\d*_/i, '')
      .replace(/_AD$/i, '')
      .replace(/_AP$/i, '')
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .trim();
  }


  private async getAugmentsList(dict: StaticDict): Promise<TftAugment[]> {
    const cacheFile = path.join(this.cacheDir, 'augments_tiers.json');
    let json: any = null;

    if (fs.existsSync(cacheFile)) {
      try {
        const stat = fs.statSync(cacheFile);
        if (Date.now() - stat.mtimeMs < 12 * 60 * 60 * 1000) {
          json = JSON.parse(fs.readFileSync(cacheFile, 'utf-8'));
        }
      } catch (e) {
        console.warn('[TftService] Augment cache read failed:', e);
      }
    }

    if (!json) {
      try {
        const res = await fetch('https://api-hc.metatft.com/tft-stat-api/augments_tiers?queue=1100', { headers: HEADERS });
        if (res.ok) {
          json = await res.json();
          fs.writeFileSync(cacheFile, JSON.stringify(json), 'utf-8');
        }
      } catch (err) {
        console.warn('[TftService] Failed to fetch augments_tiers:', err);
      }
    }

    const tierList = json?.content?.content?.tierList || [];
    const tierNames: Array<'S' | 'A' | 'B' | 'C' | 'D'> = ['S', 'A', 'B', 'C', 'D'];
    const results: TftAugment[] = [];

    for (let tIdx = 0; tIdx < Math.min(2, tierList.length); tIdx++) {
      const t = tierList[tIdx];
      const tierName = tierNames[tIdx] || 'S';
      for (const item of (t.content || [])) {
        if (!item.id) continue;
        const cleanId = item.id.replace(/^DA_/i, '');
        const matched = dict.items[item.id] || dict.items[cleanId] || (dict as any).augments?.[item.id];
        const name = matched?.name || this.prettifyName(cleanId);
        const desc = (matched as any)?.desc ? (matched as any).desc.replace(/<[^>]+>/g, ' ').replace(/@[^@]+@/g, '').trim() : '';
        const iconUrl = `https://cdn.metatft.com/file/metatft/augments/${item.id.toLowerCase()}.png`;

        results.push({
          id: item.id,
          name,
          desc,
          tier: tierName,
          iconUrl
        });
      }
    }

    return results;
  }

  private resolveCompName(info: any, dict: StaticDict): string {
    const rawName = info.name;
    if (typeof rawName === 'string' && rawName.trim()) {
      return rawName.trim();
    }
    if (Array.isArray(rawName) && rawName.length > 0) {
      const parts: string[] = [];
      for (const item of rawName) {
        if (item && typeof item === 'object' && item.name) {
          const itemKey = item.name;
          const translated = item.type === 'trait' 
            ? (dict.traits[itemKey]?.name || this.prettifyName(itemKey))
            : (dict.champions[itemKey]?.name || this.prettifyName(itemKey));
          parts.push(translated);
        } else if (typeof item === 'string') {
          parts.push(this.prettifyName(item));
        }
      }
      if (parts.length > 0) return parts.join(' ');
    }

    const nameStr = info.name_string;
    if (typeof nameStr === 'string' && nameStr.trim()) {
      const parts = nameStr.split(',').map((p: string) => {
        const clean = p.trim();
        return dict.champions[clean]?.name || dict.traits[clean]?.name || this.prettifyName(clean);
      });
      return parts.join(' ');
    }

    return `Comp ${info.Cluster || ''}`;
  }

  public async getTierList(
    rankTierString: string = DEFAULT_RANKS, 
    days: number = 1, 
    forceRefresh: boolean = false
  ): Promise<TftComp[]> {
    const rankQuery = rankTierString && rankTierString.trim() ? rankTierString.trim() : DEFAULT_RANKS;
    const validDays = [1, 3, 7].includes(days) ? days : 1;
    const cacheKey = rankQuery.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 40);
    const cacheFile = path.join(this.cacheDir, `tierlist_${cacheKey}_days${validDays}.json`);

    if (!forceRefresh && fs.existsSync(cacheFile)) {
      try {
        const stat = fs.statSync(cacheFile);
        if (Date.now() - stat.mtimeMs < 2 * 60 * 60 * 1000) {
          const raw = fs.readFileSync(cacheFile, 'utf-8');
          return JSON.parse(raw);
        }
      } catch (e) {
        console.warn('[TftService] Tierlist cache read failed:', e);
      }
    }

    const dict = await this.getStaticDictionary();

    // 1. Fetch Comps Cluster Structure (queue=1100 RANKED ALWAYS)
    console.log('[TftService] Fetching fresh comps cluster from MetaTFT (queue=1100)...');
    const compsRes = await fetch(`${METATFT_BASE}/comps_data?queue=1100`, { headers: HEADERS });
    if (!compsRes.ok) {
      throw new Error(`MetaTFT comps_data API error: ${compsRes.status}`);
    }

    const compsJson = await compsRes.json();
    const data = compsJson.results?.data;
    if (!data || !data.cluster_details) {
      throw new Error('Invalid MetaTFT cluster data');
    }

    this.latestClusterId = String(data.cluster_id || '422');
    const clusterDetails = data.cluster_details;

    // 2. Fetch Comps Stats for the selected Ranks and Days (queue=1100 RANKED ALWAYS)
    console.log(`[TftService] Fetching comps stats (rank=${rankQuery}, days=${validDays})...`);
    const statsUrl = `${METATFT_BASE}/comps_stats?queue=1100&rank=${encodeURIComponent(rankQuery)}&days=${validDays}`;
    let rankStatsMap: Record<string, { avg: number; pickRate: number; winRate: number; top4Rate: number; games: number }> = {};

    try {
      const statsRes = await fetch(statsUrl, { headers: HEADERS });
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        const statsList = statsJson.results;
        if (Array.isArray(statsList) && statsList.length > 0) {
          const totalLobbies = (statsList[0]?.places?.[0] || 8000000) / 8;

          for (const item of statsList) {
            const cId = String(item.cluster);
            const places = item.places;
            if (!cId || !Array.isArray(places) || places.length < 9) continue;

            const total = places[8];
            if (total <= 0) continue;

            let weightedSum = 0;
            for (let i = 0; i < 8; i++) {
              weightedSum += (i + 1) * (places[i] || 0);
            }
            const avg = weightedSum / total;
            const top4Count = (places[0] || 0) + (places[1] || 0) + (places[2] || 0) + (places[3] || 0);
            const top4Rate = (top4Count / total) * 100;
            const winRate = ((places[0] || 0) / total) * 100;
            const pickRate = total / totalLobbies;

            rankStatsMap[cId] = {
              avg,
              pickRate,
              winRate,
              top4Rate,
              games: total
            };
          }
        }
      }
    } catch (e) {
      console.warn('[TftService] Failed to load rank stats, falling back to overall:', e);
    }

    const comps: TftComp[] = [];

    for (const [clusterId, info] of Object.entries<any>(clusterDetails)) {
      const rankStat = rankStatsMap[clusterId];
      const overall = info.overall || {};
      const avg = rankStat ? rankStat.avg : overall.avg;
      const count = rankStat ? rankStat.games : (overall.count || 0);
      const pickRate = rankStat ? rankStat.pickRate : (count / 1000000);
      const winRate = rankStat ? rankStat.winRate : 12.5;
      const top4Rate = rankStat ? rankStat.top4Rate : 50.0;

      if (typeof avg !== 'number') continue;

      // Extract item builds for ALL units from info.builds
      const unitItemMap: Record<string, TftItem[]> = {};
      let carryUnitId: string | undefined;

      if (Array.isArray(info.builds) && info.builds.length > 0) {
        const sortedBuilds = [...info.builds].sort((a, b) => (b.count || 0) - (a.count || 0));
        carryUnitId = sortedBuilds[0]?.unit;

        for (const b of sortedBuilds) {
          if (b.unit && Array.isArray(b.buildName) && b.buildName.length > 0) {
            if (!unitItemMap[b.unit]) {
              unitItemMap[b.unit] = b.buildName.slice(0, 3).map((rawItem: string) => this.resolveItem(rawItem, dict));
            }
          }
        }
      }

      // Star 3 candidates from info.stars (array of unit id strings)
      const star3Candidates: string[] = Array.isArray(info.stars) ? info.stars.slice(0, 8) : [];

      // Units
      const rawUnits = (info.units_string || '')
        .split(',')
        .map((u: string) => u.trim())
        .filter(Boolean);

      const units: TftUnit[] = rawUnits.map((uId: string) => {
        const champ = dict.champions[uId];
        const isCarry = uId === carryUnitId;
        const items = unitItemMap[uId] || [];
        const is3Star = star3Candidates.includes(uId);
        const iconUrl = this.getUnitIconUrl(uId);
        const splashUrl = this.getUnitSplashUrl(uId, dict);

        return {
          id: uId,
          name: champ?.name || this.prettifyName(uId),
          cost: champ?.cost || 1,
          iconUrl,
          splashUrl,
          items,
          isCarry,
          tier: is3Star ? 3 : 2
        };
      });

      // SORT UNITS:
      // 1. Tướng CÓ TRANG BỊ lên trước, tướng KHÔNG CÓ TRANG BỊ xếp sau
      // 2. Trong cùng nhóm: Giá vàng giảm dần (5 -> 4 -> 3 -> 2 -> 1)
      // 3. Cùng giá vàng: Tướng Carry chính lên trước
      units.sort((a, b) => {
        const aHasItems = (a.items && a.items.length > 0) ? 1 : 0;
        const bHasItems = (b.items && b.items.length > 0) ? 1 : 0;
        if (aHasItems !== bHasItems) {
          return bHasItems - aHasItems; // Có đồ lên trước
        }
        if (b.cost !== a.cost) {
          return b.cost - a.cost; // Giá vàng cao hơn lên trước (5 -> 4 -> 3 -> 2 -> 1)
        }
        if (a.isCarry) return -1;
        if (b.isCarry) return 1;
        return 0;
      });

      // TRAITS RESOLUTION WITH FULL BREAKPOINTS AND DETAILED EFFECTS
      const rawTraits = (info.traits_string || '')
        .split(',')
        .map((t: string) => t.trim())
        .filter(Boolean);

      const traits: TftTrait[] = rawTraits.map((tStr: string) => {
        const parts = tStr.split('_');
        const activeTierIndex = parseInt(parts[parts.length - 1], 10) || 1;
        const traitKey = parts.slice(0, -1).join('_');
        const traitInfo = dict.traits[traitKey] || dict.traits[tStr];

        // Determine active effect & true minUnits
        const effectsList = traitInfo?.effects || [];
        const activeEffect = effectsList[activeTierIndex - 1];
        const minUnits = activeEffect?.minUnits || activeTierIndex;
        const style = activeEffect?.style || 1;

        // Parse detailed effects for hover tooltip
        const parsed = this.parseTraitDetails(traitInfo?.desc || '', effectsList);

        // Find champions belonging to this trait
        const unitIds = traitInfo?.unitIds || [];
        const traitUnits: TftTraitUnit[] = unitIds.map((uId: string) => {
          const c = dict.champions[uId];
          return {
            id: uId,
            name: c?.name || this.prettifyName(uId),
            cost: c?.cost || 1,
            iconUrl: this.getUnitIconUrl(uId)
          };
        }).sort((a, b) => b.cost - a.cost);

        const iconUrl = this.getTraitIconUrl(traitKey);

        return {
          id: tStr,
          name: traitInfo?.name || this.prettifyName(traitKey),
          iconUrl,
          style,
          activeTierIndex,
          count: minUnits, // Số tướng kích mốc chính xác (3 cho Adaptor, 5 cho Sprykin)
          innate: parsed.innate,
          description: parsed.generalDesc || traitInfo?.name || 'Tộc/Hệ TFT',
          effects: parsed.effects,
          units: traitUnits
        };
      });

      // Sort traits: Mốc kích cao nhất -> thấp nhất (Prismatic 5 -> Gold 4 -> Silver 3 -> Bronze 1), sau đó đến số tướng count giảm dần
      traits.sort((a, b) => {
        if (b.style !== a.style) {
          return b.style - a.style;
        }
        return b.count - a.count;
      });

      // Top Items
      const topItems: TftItem[] = [];
      if (Array.isArray(info.top_items)) {
        for (const it of info.top_items.slice(0, 4)) {
          if (it.item) {
            topItems.push(this.resolveItem(it.item, dict));
          }
        }
      }

      // Tier Classification
      let tier: 'S' | 'A' | 'B' | 'C' | 'D' | '?' = '?';
      if (avg <= 4.25) tier = 'S';
      else if (avg <= 4.45) tier = 'A';
      else if (avg <= 4.65) tier = 'B';
      else if (avg <= 4.85) tier = 'C';
      else tier = 'D';

      // Difficulty mapping from numeric diff to Easy / Medium / Hard
      let difficulty: 'Easy' | 'Medium' | 'Hard' = 'Medium';
      if (typeof info.difficulty === 'number') {
        if (info.difficulty < -0.05) difficulty = 'Easy';
        else if (info.difficulty > 0.05) difficulty = 'Hard';
        else difficulty = 'Medium';
      } else if (typeof info.difficulty === 'string') {
        difficulty = info.difficulty as any;
      }

      comps.push({
        clusterId,
        name: this.resolveCompName(info, dict),
        tier,
        avgPlacement: Math.round(avg * 100) / 100,
        games: count,
        levelling: info.levelling || 'Standard',
        difficulty,
        pickRate: Math.round(pickRate * 100) / 100,
        winRate: Math.round(winRate * 10) / 10,
        top4Rate: Math.round(top4Rate * 10) / 10,
        units,
        traits,
        topItems,
        carryUnitId,
        carrySplashUrl: (units.find(u => u.isCarry) || units[0])?.splashUrl || (units.find(u => u.isCarry) || units[0])?.iconUrl || ''
      });
    }

    // Sort comps by avgPlacement ascending (tốt nhất lên đầu)
    comps.sort((a, b) => a.avgPlacement - b.avgPlacement);

    try {
      fs.writeFileSync(cacheFile, JSON.stringify(comps), 'utf-8');
    } catch (err) {
      console.warn('[TftService] Failed to cache tierlist:', err);
    }

    return comps;
  }

  public async getCompDetails(clusterId: string, rankTierString: string = DEFAULT_RANKS): Promise<TftCompDetail> {
    const rankQuery = rankTierString && rankTierString.trim() ? rankTierString.trim() : DEFAULT_RANKS;
    const cacheKey = rankQuery.replace(/[^a-zA-Z0-9]/g, '_').slice(0, 30);
    const cacheFile = path.join(this.cacheDir, `comp_${clusterId}_${cacheKey}.json`);

    if (fs.existsSync(cacheFile)) {
      try {
        const stat = fs.statSync(cacheFile);
        if (Date.now() - stat.mtimeMs < 4 * 60 * 60 * 1000) {
          const raw = fs.readFileSync(cacheFile, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && parsed.options && parsed.positioning && parsed.augments && parsed.augments.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn('[TftService] Detail cache read failed:', e);
      }
    }

    const dict = await this.getStaticDictionary();
    const targetCluster = this.latestClusterId || '422';
    const url = `${METATFT_BASE}/comp_details?comp=${clusterId}&cluster_id=${targetCluster}&queue=1100&rank=${encodeURIComponent(rankQuery)}`;
    console.log(`[TftService] Fetching comp details from: ${url}`);

    const res = await fetch(url, { headers: HEADERS });
    if (!res.ok) {
      throw new Error(`MetaTFT comp_details API error: ${res.status}`);
    }

    const json = await res.json();
    const result = json.results && typeof json.results === 'object' && !Array.isArray(json.results)
      ? json.results
      : (Array.isArray(json.results) ? json.results[0] : null);

    if (!result) {
      throw new Error(`No detail results for cluster ${clusterId}`);
    }

    const mapUnitInfo = (uId: string) => {
      const champ = dict?.champions?.[uId];
      return {
        id: uId,
        name: champ?.name || this.prettifyName(uId),
        cost: champ?.cost || 1,
        iconUrl: this.getUnitIconUrl(uId)
      };
    };

    const parseClusterOptions = (rawRecord: any): Record<string, TftOption[]> => {
      const out: Record<string, TftOption[]> = {};
      if (!rawRecord || typeof rawRecord !== 'object') return out;
      for (const [k, v] of Object.entries<any>(rawRecord)) {
        if (!Array.isArray(v)) continue;
        out[k] = v.map((item: any) => {
          const totalGames = item.places?.[8] || item.count || 1;
          let weightedSum = 0;
          if (Array.isArray(item.places)) {
            for (let i = 0; i < 8; i++) {
              weightedSum += (i + 1) * (item.places[i] || 0);
            }
          }
          const avg = weightedSum > 0 && totalGames > 0 ? weightedSum / totalGames : (item.avg || 4.5);

          let rawUnits: string[] = [];
          if (Array.isArray(item.units)) {
            rawUnits = item.units;
          } else if (typeof item.units_list === 'string') {
            rawUnits = item.units_list.split('&').filter(Boolean);
          } else if (typeof item.unit_list === 'string') {
            rawUnits = item.unit_list.split('&').filter(Boolean);
          }

          const units = rawUnits.map(mapUnitInfo);

          return {
            units,
            traits: Array.isArray(item.traits) ? item.traits : [],
            count: totalGames,
            avg: Math.round(avg * 100) / 100
          };
        }).sort((a, b) => a.avg - b.avg);
      }
      return out;
    };

    const parseEarlyOptions = (rawRecord: any): Record<string, TftEarlyOption[]> => {
      const out: Record<string, TftEarlyOption[]> = {};
      if (!rawRecord || typeof rawRecord !== 'object') return out;
      for (const [k, v] of Object.entries<any>(rawRecord)) {
        if (!Array.isArray(v)) continue;
        out[k] = v.map((item: any) => {
          const totalGames = item.places?.[8] || item.count || 1;
          let weightedSum = 0;
          let wins = 0;
          if (Array.isArray(item.places)) {
            for (let i = 0; i < 8; i++) {
              weightedSum += (i + 1) * (item.places[i] || 0);
            }
            wins = item.places[0] || 0;
          }
          const avg = weightedSum > 0 && totalGames > 0 ? weightedSum / totalGames : (item.avg || 4.5);
          const winRate = item.win !== undefined ? (item.win > 1 ? item.win : item.win * 100) : (totalGames > 0 ? (wins / totalGames) * 100 : 0);

          let rawUnits: string[] = [];
          if (Array.isArray(item.units)) {
            rawUnits = item.units;
          } else if (typeof item.unit_list === 'string') {
            rawUnits = item.unit_list.split('&').filter(Boolean);
          } else if (typeof item.units_list === 'string') {
            rawUnits = item.units_list.split('&').filter(Boolean);
          }

          const units = rawUnits.map(mapUnitInfo);

          return {
            units,
            count: totalGames,
            avg: Math.round(avg * 100) / 100,
            win: Math.round(winRate * 10) / 10
          };
        }).sort((a, b) => a.avg - b.avg);
      }
      return out;
    };

    const parsePositioning = (rawRecord: any): Record<string, TftPosition[]> => {
      const out: Record<string, TftPosition[]> = {};
      const unitRecords = rawRecord?.units || rawRecord;
      if (!unitRecords || typeof unitRecords !== 'object') return out;

      for (const [rawUnitId, v] of Object.entries<any>(unitRecords)) {
        if (!v || rawUnitId === 'positions' || rawUnitId === 'units') continue;
        const posArray = Array.isArray(v) ? v : (Array.isArray(v.positions) ? v.positions : []);
        
        const displayName = dict?.champions?.[rawUnitId]?.name || this.prettifyName(rawUnitId);

        out[displayName] = posArray.map((cellObj: any) => ({
          cell: cellObj.cell || cellObj.name || '',
          count: cellObj.count || cellObj.games || 0
        })).sort((a: any, b: any) => b.count - a.count);

        // Also map by rawUnitId so lookup by id works too
        out[rawUnitId] = out[displayName];
      }
      return out;
    };

    const rawItems = Array.isArray(result.itemNames) 
      ? result.itemNames 
      : (Array.isArray(result.items) ? result.items : (Array.isArray(result.item_stats) ? result.item_stats : []));
    
    const itemStats = rawItems.map((it: any) => {
      const rawName = it.itemNames || it.itemName || it.name || it.item || '';
      const resolved = this.resolveItem(rawName, dict);
      return {
        itemName: resolved.name || this.prettifyName(rawName),
        iconUrl: resolved.iconUrl || this.getItemIconUrl(rawName),
        avg: typeof it.avg === 'number' ? Math.round(it.avg * 100) / 100 : 4.5,
        count: it.count || 0
      };
    }).filter((x: any) => x.itemName);

    // Fetch rich Tier S & A Augments from MetaTFT + CDragon
    const augments = await this.getAugmentsList(dict);

    const detail: TftCompDetail = {
      clusterId,
      options: parseClusterOptions(result.options),
      earlyOptions: parseEarlyOptions(result.early_options),
      positioning: parsePositioning(result.positioning),
      unitStats: Array.isArray(result.unit_stats) ? result.unit_stats : [],
      itemStats,
      augments,
      placements: Array.isArray(result.placements) ? result.placements : []
    };

    try {
      fs.writeFileSync(cacheFile, JSON.stringify(detail), 'utf-8');
    } catch (err) {
      console.warn('[TftService] Failed to cache comp details:', err);
    }

    return detail;
  }
}
