import { champions, latestPatch } from './data.js';
import { rolePool } from './rolePool.js';
import { getProfile } from './profiles.js';
import {
  DraftState,
  analyzeTeamNeeds,
  scoreDraftOrder,
  scoreTeamComp,
  scoreSynergy,
  scoreCounters,
  scoreMeta
} from './scoring.js';

const weightsByRole: Record<string, Record<string, number>> = {
  Top: { draft: 1.4, comp: 0.9, synergy: 0.8, counter: 1.5, meta: 0.8 },
  Jungle: { draft: 1.0, comp: 1.2, synergy: 1.2, counter: 1.0, meta: 1.0 },
  Mid: { draft: 1.1, comp: 1.1, synergy: 1.0, counter: 1.1, meta: 1.0 },
  ADC: { draft: 0.9, comp: 1.2, synergy: 1.3, counter: 0.9, meta: 1.1 },
  Support: { draft: 1.0, comp: 1.2, synergy: 1.5, counter: 1.0, meta: 0.9 }
};

const defaultWeights = { draft: 1.0, comp: 1.0, synergy: 1.0, counter: 1.0, meta: 1.0 };

function normalize(val: number, min: number, max: number) {
  const scaled = ((val - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, scaled));
}

export function getRecommendation(state: DraftState) {
  const picked = new Set([...state.allies, ...state.enemies]);

  // 1. Filter: Ensure champion is viable for the requested role
  const viablePool = rolePool[state.role] || [];

  const viableChamps = Object.values(champions).filter((c: any) => {
    // If it's not explicitly confirmed as viable for this role, drop it.
    if (!viablePool.includes(c.id)) return false;
    // Reject already picked champions
    if (picked.has(c.id)) return false;
    return true;
  });

  // 2. Analyze Current Team Composition Needs
  const needs = analyzeTeamNeeds(state.allies, champions, state.allyRoles || {});

  const weights = weightsByRole[state.role] || defaultWeights;

  // 3. Score all valid champions
  const scored = viableChamps.map((c: any) => {
    const profile = getProfile(c, state.role);

    const draftScore = scoreDraftOrder(profile, state);
    const teamCompScore = scoreTeamComp(profile, needs);
    const synergyScore = scoreSynergy(profile, state.allies, champions, state.allyRoles || {});
    const counterScore = scoreCounters(profile, state.enemies, champions, state.enemyRoles || {});
    const metaScore = scoreMeta(profile);

    const normDraft = normalize(draftScore, -20, 35);
    const normComp = normalize(teamCompScore, -40, 70);
    const normSynergy = normalize(synergyScore, 0, 30);
    const normCounter = normalize(counterScore, -30, 30);
    const normMeta = normalize(metaScore, -15, 15);

    const weightedDraftScore = Math.round(normDraft * weights.draft);
    const weightedTeamCompScore = Math.round(normComp * weights.comp);
    const weightedSynergyScore = Math.round(normSynergy * weights.synergy);
    const weightedCounterScore = Math.round(normCounter * weights.counter);
    const weightedMetaScore = Math.round(normMeta * weights.meta);

    const total =
      weightedDraftScore +
      weightedTeamCompScore +
      weightedSynergyScore +
      weightedCounterScore +
      weightedMetaScore;

    return {
      id: c.id,
      name: c.name,
      tags: c.tags,
      image: `https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/champion/${c.image.full}`,
      scores: {
        draftScore: weightedDraftScore,
        teamCompScore: weightedTeamCompScore,
        synergyScore: weightedSynergyScore,
        counterScore: weightedCounterScore,
        metaScore: weightedMetaScore
      },
      score: total
    };
  });

  // Sort descending
  scored.sort((a, b) => b.score - a.score);

  return {
    best: scored[0] || null,
    alternatives: scored.slice(1, 4)
  };
}
