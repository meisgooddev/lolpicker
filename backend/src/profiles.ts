export interface ChampionProfile {
  roles: string[];
  damageType: 'AP' | 'AD' | 'Mixed';
  frontline: number;
  engage: number;
  peel: number;
  scaling: number;
  earlyGame: number;
  safeBlind: boolean;
  flex: boolean;
  counterReliant: boolean;
  provides: string[];
  wants: string[];
  counters: string[];
  weakInto: string[];
  weaknesses: string[];
  metaScore: number;
  style: string[];
  traits: string[];
}

// Static snapshot, roughly models patch 16.6 metadata defaults
const metaTierMap: Record<string, number> = {
  Jinx: 9, Ahri: 8, LeeSin: 9, Aatrox: 8, Kaisa: 10, Nautilus: 9, Thresh: 8, Viego: 8,
  Sylas: 8, Yone: 9, Yasuo: 7, Jhin: 8, Ezreal: 9, Ashe: 8,
  Darius: 7, Garen: 7, Hecarim: 6, Lux: 7, Karma: 7, Rakan: 7,
  Teemo: 3, Shaco: 3, Yuumi: 2, Ryze: 3, Azir: 4,
  Aurora: 9, Smolder: 8, Ambessa: 8, Skarner: 7, Rell: 8,
};

export const champArchetypes: Record<string, Partial<ChampionProfile>> = {
  Jinx: { damageType: 'AD', scaling: 3, style: ['Scaling'], traits: ['Hypercarry'], wants: ['Peel', 'Frontline'] },
  Samira: { damageType: 'AD', style: ['Early'], traits: ['Dive'], wants: ['Engage', 'CC'] },
  Malphite: { damageType: 'AP', frontline: 3, engage: 3, style: ['Frontline', 'Engage'], traits: ['AntiAD'], provides: ['Engage', 'Frontline', 'CC'], counters: ['AD'], counterReliant: true },
  Poppy: { damageType: 'AD', frontline: 2, style: ['Frontline', 'Peel'], traits: ['AntiDash'], provides: ['Peel', 'Frontline', 'CC'], counters: ['Dive'], counterReliant: true },
  Lulu: { damageType: 'AP', peel: 3, style: ['Peel'], traits: ['Enchanter'], provides: ['Peel'], wants: ['Hypercarry'] },
  Orianna: { damageType: 'AP', safeBlind: true, style: ['Scaling'], provides: ['CC'], wants: ['Engage'] },
  JarvanIV: { damageType: 'AD', engage: 3, frontline: 2, style: ['Engage', 'Early'], provides: ['Engage', 'Frontline', 'CC'] },
  Yasuo: { damageType: 'AD', style: ['Scaling', 'Skirmish'], wants: ['CC', 'Engage'] },
  Xerath: { safeBlind: false, style: ['Scaling'], traits: ['Immobile'], wants: ['Peel', 'Frontline'] },
  Veigar: { safeBlind: false, style: ['Scaling'], traits: ['Immobile'], wants: ['Peel', 'Frontline'] },
  Kassadin: { safeBlind: false, style: ['Scaling'], counterReliant: true },
  Ornn: { safeBlind: true, style: ['Frontline', 'Engage'], provides: ['Engage', 'Frontline', 'CC'] },
  Shen: { safeBlind: true, style: ['Frontline', 'Peel'], provides: ['Peel', 'Frontline', 'CC'] },
  Sion: { safeBlind: true, style: ['Frontline', 'Engage'], provides: ['Engage', 'Frontline', 'CC'] },
  Vayne: { counterReliant: true, style: ['Scaling'], traits: ['Hypercarry'], wants: ['Peel'] },
  Nilah: { counterReliant: true, style: ['Skirmish'], traits: ['Dive'], wants: ['Engage', 'Peel', 'CC'] },
  Braum: { counterReliant: true, style: ['Frontline', 'Peel'], provides: ['Peel', 'Frontline', 'CC'], counters: ['Poke'] },
  Rammus: { counterReliant: true, style: ['Frontline', 'Engage'], provides: ['Engage', 'Frontline', 'CC'], counters: ['AD'] },
  Kaisa: { traits: ['Dive', 'Hypercarry'], wants: ['Engage', 'CC'] },
  Lucian: { wants: ['Engage', 'Peel', 'CC'] },
  Draven: { wants: ['Engage', 'Peel', 'CC'] },
  KogMaw: { traits: ['Hypercarry'], wants: ['Peel', 'Frontline'] },
  Viego: { wants: ['Engage'] },
  MasterYi: { wants: ['Engage'] },
  Sejuani: { provides: ['Engage', 'Frontline', 'CC'] },
  Zac: { provides: ['Engage', 'Frontline', 'CC'] },
  Alistar: { provides: ['Engage', 'Frontline', 'CC', 'Peel'] },
  Leona: { provides: ['Engage', 'Frontline', 'CC'] },
  Nautilus: { provides: ['Engage', 'Frontline', 'CC', 'Peel'] },
  Thresh: { provides: ['Engage', 'CC', 'Peel'] },
};

export function buildAutoProfile(champion: any, role: string): ChampionProfile {
  const tags: string[] = champion.tags || [];

  let damageType: 'AP' | 'AD' | 'Mixed' = 'Mixed';
  if (tags.includes('Mage')) {
    damageType = 'AP';
  } else if (['Diana', 'Gragas', 'Galio', 'Amumu', 'Maokai', 'Singed', 'Mordekaiser', 'Gwen', 'Sylas', 'Akali', 'Katarina', 'Evelynn', 'Elise', 'Nidalee', 'Zac', 'Sejuani', 'Nunu', 'Fiddlesticks', 'Karthus', 'Fizz', 'Lillia', 'Ekko', 'Kennen', 'Rumble', 'Teemo'].includes(champion.id)) {
    damageType = 'AP';
  } else if (tags.includes('Marksman') || tags.includes('Assassin') || tags.includes('Fighter')) {
    damageType = 'AD';
  }

  const profile: ChampionProfile = {
    roles: [role],
    damageType,
    frontline: tags.includes('Tank') ? 2 : (tags.includes('Fighter') ? 1 : 0),
    engage: tags.includes('Tank') || tags.includes('Fighter') ? 1 : 0,
    peel: tags.includes('Support') ? 2 : (tags.includes('Tank') ? 1 : 0),
    scaling: tags.includes('Marksman') || tags.includes('Mage') ? 2 : 1,
    earlyGame: tags.includes('Assassin') || tags.includes('Fighter') ? 2 : 1,
    safeBlind: tags.includes('Tank') || ['Orianna', 'Ahri', 'Karma'].includes(champion.id),
    flex: false,
    counterReliant: tags.includes('Assassin'),
    provides: [],
    wants: [],
    counters: [],
    weakInto: [],
    weaknesses: [],
    metaScore: metaTierMap[champion.id] ?? 5,
    style: [],
    traits: []
  };

  // Populate implicit synergetic wants directly based on tags
  if (tags.includes('Marksman') || tags.includes('Mage')) profile.wants.push('Frontline');
  if (tags.includes('Marksman')) profile.wants.push('Peel');
  if (tags.includes('Assassin') || tags.includes('Fighter')) profile.wants.push('Engage');

  if (tags.includes('Tank')) {
    profile.style.push('Frontline', 'Engage');
    profile.provides.push('Frontline', 'Engage');
  }
  if (tags.includes('Fighter')) {
    profile.style.push('Skirmish');
    profile.provides.push('Engage');
  }
  if (tags.includes('Mage')) {
    profile.style.push('Scaling');
    profile.traits.push('AP');
  }
  if (tags.includes('Marksman')) {
    profile.style.push('Scaling');
  }
  if (tags.includes('Support')) {
    profile.style.push('Peel');
    profile.provides.push('Peel');
  }
  if (tags.includes('Assassin')) {
    profile.style.push('Early');
    profile.traits.push('Dive');
    profile.wants.push('Engage');
    profile.counters.push('Immobile', 'Mage', 'Marksman');
    profile.weakInto.push('Tank', 'Frontline', 'Peel');
  }

  if (tags.includes('Tank') || tags.includes('Support')) {
    profile.provides.push('CC');
    profile.counters.push('Assassin', 'Dive');
  }

  if (tags.includes('Mage')) {
    profile.provides.push('CC');
    profile.traits.push('Immobile');
  }

  if (tags.includes('Marksman')) {
    profile.weakInto.push('Assassin', 'Dive');
    profile.counters.push('Tank');
    profile.traits.push('Immobile');
  }

  return profile;
}

export function getProfile(champion: any, role: string): ChampionProfile {
  const base = buildAutoProfile(champion, role);
  const override = champArchetypes[champion.id] || {};
  return {
    ...base,
    ...override,
    provides: [...new Set([...base.provides, ...(override.provides || [])])],
    wants: [...new Set([...base.wants, ...(override.wants || [])])],
    style: [...new Set([...base.style, ...(override.style || [])])],
    traits: [...new Set([...base.traits, ...(override.traits || [])])],
    counters: [...new Set([...base.counters, ...(override.counters || [])])],
    weakInto: [...new Set([...base.weakInto, ...(override.weakInto || [])])],
    weaknesses: [...new Set([...base.weaknesses, ...(override.weaknesses || [])])]
  };
}


