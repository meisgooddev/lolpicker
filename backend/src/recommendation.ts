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

export function getRecommendation(state: DraftState) {
  const picked = new Set([...state.allies, ...state.enemies]);

  // 1. Filter: Ensure champion is viable for the requested role
  // We use the strict whitelist defined in rolePool.ts
  const viablePool = rolePool[state.role] || [];
  
  const viableChamps = Object.values(champions).filter((c: any) => {
    // If it's not explicitly confirmed as viable for this role, drop it.
    if (!viablePool.includes(c.id)) return false;
    // Reject already picked champions
    if (picked.has(c.id)) return false;
    return true;
  });

  // 2. Analyze Current Team Composition Needs
  const needs = analyzeTeamNeeds(state.allies, champions);

  // 3. Score all valid champions
  const scored = viableChamps.map((c: any) => {
    const profile = getProfile(c, state.role);

    const roleScore = 100; // Base score, since it survived the whitelist filter
    const draftScore = scoreDraftOrder(profile, state);
    const teamCompScore = scoreTeamComp(profile, needs);
    const synergyScore = scoreSynergy(profile, state.allies, champions);
    const counterScore = scoreCounters(profile, state.enemies, champions);
    const metaScore = scoreMeta(profile);

    const total = 
      roleScore + 
      draftScore + 
      teamCompScore + 
      synergyScore + 
      counterScore + 
      metaScore;

    return {
      id: c.id,
      name: c.name,
      tags: c.tags,
      image: `https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/champion/${c.image.full}`,
      scores: {
        roleScore,
        draftScore,
        teamCompScore,
        synergyScore,
        counterScore,
        metaScore
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
