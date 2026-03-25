import { ChampionProfile, getProfile } from './profiles.js';

export type DraftState = {
  role: string;
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

function hasCounterMatch(profile: ChampionProfile, enemies: string[], champions: any, enemyRoles: Record<string, string>): boolean {
  for (const enemyId of enemies) {
    const c = champions[enemyId];
    if (!c) continue;
    const enemy = getProfile(c, enemyRoles[enemyId] || 'Unknown');
    for (const counter of profile.counters || []) {
      if (enemy.traits?.includes(counter) || enemy.style?.includes(counter) || enemy.damageType === counter) {
        return true;
      }
    }
  }
  return false;
}

export function scoreDraftOrder(profile: ChampionProfile, state: DraftState, champions: any): number {
  let score = 0;
  const isRedSide = state.side === 'red';
  const pickPosition = state.allies.length + state.enemies.length + 1;
  const remainingEnemyPicks = 5 - state.enemies.length;

  if (pickPosition <= 3) {
    // Early pick (1-3)
    if (profile.safeBlind) score += 20;
    if (profile.flex) score += 10;
    if (profile.weaknesses?.includes('Easily countered') || profile.counterReliant) score -= 20;
  } else if (pickPosition <= 7) {
    // Mid pick (4-7)
    if (profile.safeBlind) score += 5;
  } else {
    // Late pick (8-10)
    const countersEnemy = hasCounterMatch(profile, state.enemies, champions, state.enemyRoles);

    if (profile.counterReliant && countersEnemy) score += 15;
    if (profile.safeBlind) score += 5;

    // Red side counter-pick advantage
    if (isRedSide && pickPosition === 10) {
      if (profile.counterReliant && countersEnemy) score += 15;
    }
  }

  if (profile.counterReliant && remainingEnemyPicks > 0) {
    score -= remainingEnemyPicks * 5;
  }

  return score;
}

export type CompStyle = 'Dive' | 'Teamfight' | 'Poke' | 'SplitPush' | 'Protect' | 'Unknown';

export function detectCompIdentity(allies: string[], champions: any, allyRoles: Record<string, string>): CompStyle {
  let dive = 0, teamfight = 0, poke = 0, split = 0, protect = 0;

  for (const champId of allies) {
    const c = champions[champId];
    if (!c) continue;
    const p = getProfile(c, allyRoles[champId] || 'Unknown');
    if (p.traits?.includes('Dive') || p.style?.includes('Dive')) dive++;
    if (p.style?.includes('Frontline') || p.style?.includes('Teamfight')) teamfight++;
    if (p.style?.includes('Poke') || p.style?.includes('Zone')) poke++;
    if (p.style?.includes('Splitpush')) split++;
    if (p.style?.includes('Peel') || p.traits?.includes('Enchanter')) protect++;
  }

  const scores = { Dive: dive, Teamfight: teamfight, Poke: poke, SplitPush: split, Protect: protect };
  let maxScore = 0;
  let identity: CompStyle = 'Unknown';
  for (const [key, val] of Object.entries(scores)) {
    if (val > maxScore) {
      maxScore = val;
      identity = key as CompStyle;
    }
  }
  return identity;
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

  const identity = detectCompIdentity(allies, champions, allyRoles);

  let targetAP = 2, targetAD = 2;
  let targetFrontline = 1.5, targetEngage = 1.5, targetPeel = 1.5, targetScaling = 2, targetEarly = 1.5;

  switch (identity) {
    case 'Dive':
      targetEngage = 2; targetFrontline = 1; targetPeel = 0.5;
      break;
    case 'Protect':
      targetPeel = 2; targetFrontline = 1; targetEngage = 0.5;
      break;
    case 'Poke':
      targetPeel = 2; targetFrontline = 1; targetEngage = 0.5; targetScaling = 2.5;
      break;
    case 'SplitPush':
      targetFrontline = 1; targetEngage = 1; targetPeel = 1;
      break;
    case 'Teamfight':
      targetFrontline = 2; targetEngage = 1.5; targetPeel = 1;
      break;
  }

  return {
    stats: { ap, ad, frontline, engage, peel, scaling, early },
    needsAP: targetAP - ap,
    needsAD: targetAD - ad,
    needsFrontline: targetFrontline - frontline,
    needsEngage: targetEngage - engage,
    needsPeel: targetPeel - peel,
    needsScaling: targetScaling - scaling,
    needsEarlyGame: targetEarly - early
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

  // Removed explicit overriding penalties to avoid distortion, mathematical continuous deficit properly handles anti-synergy

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
        score += 5;
      }
    }
    for (const hCounter of profile.hardCounters || []) {
      if (enemy.traits?.includes(hCounter) || enemy.style?.includes(hCounter) || enemy.damageType === hCounter) {
        score += 15;
      }
    }

    for (const w of profile.weakInto || []) {
      if (enemy.traits?.includes(w) || enemy.style?.includes(w) || enemy.damageType === w) {
        score -= 5;
      }
    }
    for (const hw of profile.hardWeakInto || []) {
      if (enemy.traits?.includes(hw) || enemy.style?.includes(hw) || enemy.damageType === hw) {
        score -= 15;
      }
    }
  }

  return score;
}

export function scoreMeta(profile: ChampionProfile): number {
  return (profile.metaScore - 5) * 5;
}
