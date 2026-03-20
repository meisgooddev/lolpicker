import { ChampionProfile, getProfile } from './profiles.js';

export type DraftState = {
  role: string;
  pickPosition: number;
  side: 'blue' | 'red';
  allies: string[];
  enemies: string[];
  allyRoles: Record<string, string>;
  enemyRoles: Record<string, string>;
};

export type TeamStats = {
  ap: number;
  ad: number;
  frontline: number;
  engage: number;
  peel: number;
  scaling: number;
  early: number;
};

export type TeamNeeds = {
  stats: TeamStats;
  needsAP: number;
  needsAD: number;
  needsFrontline: number;
  needsEngage: number;
  needsPeel: number;
  needsScaling: number;
  needsEarlyGame: number;
};

export function scoreDraftOrder(profile: ChampionProfile, state: DraftState): number {
  let score = 0;
  const isRedSide = state.side === 'red';

  if (state.pickPosition <= 3) {
    // Early pick (1-3)
    if (profile.safeBlind) score += 20;
    if (profile.flex) score += 10;
    if (profile.weaknesses?.includes('Easily countered') || profile.counterReliant) score -= 20;
  } else if (state.pickPosition <= 7) {
    // Mid pick (4-7)
    if (profile.safeBlind) score += 5;
  } else {
    // Late pick (8-10)
    if (profile.counterReliant) score += 15;
    if (profile.safeBlind) score += 5;

    // Red side counter-pick advantage
    if (isRedSide && state.pickPosition === 10) {
      if (profile.counterReliant) score += 15;
    }
  }

  return score;
}

export function analyzeTeamNeeds(allies: string[], champions: any, allyRoles: Record<string, string>): TeamNeeds {
  let ap = 0, ad = 0, frontline = 0, engage = 0, peel = 0, scaling = 0, early = 0;

  for (const champId of allies) {
    const c = champions[champId];
    if (!c) continue;

    const actualRole = allyRoles[champId] || 'Unknown';
    const p = getProfile(c, actualRole);

    // Consider intensities or partial contributions
    if (p.damageType === 'AP') ap++;
    if (p.damageType === 'AD') ad++;
    if (p.style?.includes('Frontline')) frontline++;
    if (p.style?.includes('Engage') || p.provides.includes('Engage')) engage++;
    if (p.style?.includes('Peel') || p.provides.includes('Peel')) peel++;
    if (p.style?.includes('Scaling')) scaling++;
    if (p.style?.includes('Early')) early++;
  }

  // Linear target goals -> deficit becomes the raw multiplier
  return {
    stats: { ap, ad, frontline, engage, peel, scaling, early },
    needsAP: 2 - ap,
    needsAD: 2 - ad,
    needsFrontline: 1.5 - frontline,
    needsEngage: 1.5 - engage,
    needsPeel: 1.5 - peel,
    needsScaling: 2 - scaling,
    needsEarlyGame: 1.5 - early
  };
}

export function scoreTeamComp(profile: ChampionProfile, needs: TeamNeeds): number {
  let score = 0;

  // Continuous contribution based on intensity of need
  // if needsAP is mathematically negative, adding another AP subtracts score
  if (profile.damageType === 'AP') score += needs.needsAP * 12;
  if (profile.damageType === 'AD') score += needs.needsAD * 12;

  if (profile.style.includes('Frontline')) score += needs.needsFrontline * 20;
  if (profile.style.includes('Engage') || profile.provides.includes('Engage')) score += needs.needsEngage * 15;
  if (profile.provides.includes('Peel')) score += needs.needsPeel * 15;
  if (profile.style.includes('Scaling')) score += needs.needsScaling * 10;
  if (profile.style.includes('Early')) score += needs.needsEarlyGame * 10;

  // Additional explicitly enforced overarching penalties (so multiple ADs still punishes heavily on top of math)
  if (profile.damageType === 'AD' && needs.stats.ad >= 3) score -= 20;
  if (profile.damageType === 'AP' && needs.stats.ap >= 3) score -= 20;
  if (profile.style.includes('Scaling') && needs.stats.scaling >= 2) score -= 15;
  if (profile.style.includes('Frontline') && needs.stats.frontline >= 2) score -= 5;
  if (profile.style.includes('Engage') && needs.stats.engage >= 2) score -= 5;

  // Soft cap normalization
  if (score > 0) {
    score = 70 * (1 - Math.exp(-score / 35));
  } else if (score < 0) {
    score = -70 * (1 - Math.exp(score / 35));
  }

  return score;
}

export function scoreSynergy(profile: ChampionProfile, allies: string[], champions: any, allyRoles: Record<string, string>): number {
  let score = 0;
  let providedCount: Record<string, number> = {};
  let wantedCount: Record<string, number> = {};

  for (const allyId of allies) {
    const c = champions[allyId];
    if (!c) continue;

    // Explicit Role mapping!
    const actualRole = allyRoles[allyId] || 'Unknown';
    const ally = getProfile(c, actualRole);

    for (const need of profile.wants || []) {
      if (ally.provides?.includes(need) || ally.style?.includes(need)) {
        providedCount[need] = (providedCount[need] || 0) + 1;
        score += providedCount[need] === 1 ? 8 : 3;
      }
    }

    for (const offer of profile.provides || []) {
      if (ally.wants?.includes(offer)) {
        wantedCount[offer] = (wantedCount[offer] || 0) + 1;
        score += wantedCount[offer] === 1 ? 8 : 3;
      }
    }
  }

  return score;
}

export function scoreCounters(profile: ChampionProfile, enemies: string[], champions: any, enemyRoles: Record<string, string>): number {
  let score = 0;

  for (const enemyId of enemies) {
    const c = champions[enemyId];
    if (!c) continue;

    // Explicit Role mapping!
    const actualRole = enemyRoles[enemyId] || 'Unknown';
    const enemy = getProfile(c, actualRole);

    for (const counter of profile.counters || []) {
      if (enemy.traits?.includes(counter) || enemy.style?.includes(counter) || enemy.damageType === counter) {
        score += 10;
      }
    }

    for (const w of profile.weakInto || []) {
      if (enemy.traits?.includes(w) || enemy.style?.includes(w) || enemy.damageType === w) {
        score -= 10;
      }
    }
  }

  return score;
}

export function scoreMeta(profile: ChampionProfile): number {
  return (profile.metaScore - 5) * 3;
}
