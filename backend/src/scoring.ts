import { ChampionProfile, getContextProfile } from './profiles.js';

export type DraftState = {
  role: string;
  pickPosition: number;
  side: 'blue' | 'red';
  allies: string[];
  enemies: string[];
};

export type TeamNeeds = {
  needsAP: boolean;
  needsAD: boolean;
  needsFrontline: boolean;
  needsEngage: boolean;
  needsPeel: boolean;
  needsScaling: boolean;
  needsEarlyGame: boolean;
};

export function scoreDraftOrder(profile: ChampionProfile, state: DraftState): number {
  let score = 0;

  if (state.pickPosition <= 3) {
    // Early pick (1-3)
    if (profile.safeBlind) score += 20;
    if (profile.flex) score += 10;
    if (profile.weaknesses?.includes('Easily countered')) score -= 20;
  } else if (state.pickPosition <= 7) {
    // Mid pick (4-7)
    if (profile.safeBlind) score += 5;
  } else {
    // Late pick (8-10)
    if (profile.counterReliant) score += 15;
    if (profile.safeBlind) score += 5;
  }

  return score;
}

export function analyzeTeamNeeds(allies: string[], champions: any): TeamNeeds {
  let ap = 0, ad = 0, frontline = 0, engage = 0, peel = 0, scaling = 0, early = 0;

  for (const champId of allies) {
    const c = champions[champId];
    if (!c) continue;

    const p = getContextProfile(c);

    if (p.damageType === 'AP') ap++;
    if (p.damageType === 'AD') ad++;
    if (p.style?.includes('Frontline')) frontline++;
    if (p.style?.includes('Engage') || p.provides.includes('Engage')) engage++;
    if (p.style?.includes('Peel') || p.provides.includes('Peel')) peel++;
    if (p.style?.includes('Scaling')) scaling++;
    if (p.style?.includes('Early')) early++;
  }

  return {
    needsAP: ap < 2,
    needsAD: ad < 2,
    needsFrontline: frontline < 1,
    needsEngage: engage < 1,
    needsPeel: peel < 1,
    needsScaling: scaling < 2,
    needsEarlyGame: early < 1
  };
}

export function scoreTeamComp(profile: ChampionProfile, needs: TeamNeeds): number {
  let score = 0;
  if (needs.needsAP && profile.damageType === 'AP') score += 25;
  if (needs.needsAD && profile.damageType === 'AD') score += 25;
  if (needs.needsFrontline && profile.style.includes('Frontline')) score += 25;
  if (needs.needsEngage && (profile.style.includes('Engage') || profile.provides.includes('Engage'))) score += 15;
  if (needs.needsPeel && profile.provides.includes('Peel')) score += 15;
  if (needs.needsScaling && profile.style.includes('Scaling')) score += 10;
  if (needs.needsEarlyGame && profile.style.includes('Early')) score += 10;
  return Math.min(score, 45);
}

export function scoreSynergy(profile: ChampionProfile, allies: string[], champions: any): number {
  let score = 0;

  for (const allyId of allies) {
    const c = champions[allyId];
    if (!c) continue;
    const ally = getContextProfile(c);

    for (const need of profile.wants || []) {
      if (ally.provides?.includes(need) || ally.style?.includes(need)) score += 8;
    }

    for (const offer of profile.provides || []) {
      if (ally.wants?.includes(offer)) score += 8;
    }
  }

  return score;
}

export function scoreCounters(profile: ChampionProfile, enemies: string[], champions: any): number {
  let score = 0;

  for (const enemyId of enemies) {
    const c = champions[enemyId];
    if (!c) continue;
    const enemy = getContextProfile(c);

    for (const counter of profile.counters || []) {
      if (enemy.traits?.includes(counter) || enemy.style?.includes(counter)) score += 10;
    }

    for (const w of profile.weakInto || []) {
      if (enemy.traits?.includes(w) || enemy.style?.includes(w)) score -= 10;
    }
  }

  return score;
}

export function scoreMeta(profile: ChampionProfile): number {
  return (profile.metaScore || 5) * 3;
}
