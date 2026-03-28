import { champions, latestPatch } from './data.js';
import { rolePool } from './rolePool.js';
import { getProfile } from './profiles.js';
import {
  DraftState,
  analyzeTeamNeeds,
  analyzeTemporalProfile,
  scoreDraftOrder,
  scoreTeamComp,
  scoreSynergy,
  scoreCounters,
  scoreTemporalFit,
  scoreMeta,
  analyzeExecutionComplexity,
  scoreExecutionReliability,
  scorePlayerAffinity,
  scoreOpggMeta
} from './scoring.js';
import { getOpggChampionData, getOpggSummonerData, getOpggLaneMeta } from './opggService.js';

const weightsByRole: Record<string, Record<string, number>> = {
  Top: { draft: 1.4, comp: 0.9, synergy: 0.8, counter: 1.5, meta: 0.8, temporal: 1.2, execution: 1.0, player: 1.5, opggMeta: 0.6 },
  Jungle: { draft: 1.0, comp: 1.2, synergy: 1.2, counter: 1.0, meta: 1.0, temporal: 1.3, execution: 1.2, player: 1.5, opggMeta: 0.6 },
  Mid: { draft: 1.1, comp: 1.1, synergy: 1.0, counter: 1.1, meta: 1.0, temporal: 1.0, execution: 1.0, player: 1.5, opggMeta: 0.6 },
  ADC: { draft: 0.9, comp: 1.2, synergy: 1.3, counter: 0.9, meta: 1.1, temporal: 1.2, execution: 1.1, player: 1.5, opggMeta: 0.6 },
  Support: { draft: 1.0, comp: 1.2, synergy: 1.5, counter: 1.0, meta: 0.9, temporal: 0.8, execution: 1.0, player: 1.5, opggMeta: 0.6 }
};

const defaultWeights = { draft: 1.0, comp: 1.0, synergy: 1.0, counter: 1.0, meta: 1.0, temporal: 1.0, execution: 1.0, player: 1.0, opggMeta: 0.5 };

function normalize(val: number, min: number, max: number) {
  const scaled = ((val - min) / (max - min)) * 100;
  return Math.max(0, Math.min(100, scaled));
}

export async function getRecommendation(state: DraftState, gameName?: string, tagLine?: string, region: string = 'euw') {
  const picked = new Set([...state.allies, ...state.enemies]);

  // 0. Prefetch OP.GG data via MCP
  const opggEnemyData = await Promise.all(
    state.enemies.map(eid => getOpggChampionData(champions[eid]?.name || eid, state.enemyRoles[eid] || 'TOP'))
  );

  let opggSummonerData = null;
  if (gameName && tagLine) {
    opggSummonerData = await getOpggSummonerData(gameName, tagLine, region);
  }

  // Fetch OP.GG lane meta for current role (cached after first call)
  const roleMap: Record<string, string> = { Top: 'top', Jungle: 'jungle', Mid: 'mid', ADC: 'adc', Support: 'support' };
  const opggLaneMeta = await getOpggLaneMeta(roleMap[state.role] || 'mid');

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
  const temporal = analyzeTemporalProfile(state.allies, champions, state.allyRoles || {});
  const executionCtx = analyzeExecutionComplexity(state.allies, champions, state.allyRoles || {});

  const weights = weightsByRole[state.role] || defaultWeights;

  // 3. Score all valid champions
  const scored = viableChamps.map((c: any) => {
    const profile = getProfile(c, state.role);

    const draftScore = scoreDraftOrder(profile, state, champions);
    const teamCompScore = scoreTeamComp(profile, needs);
    const synergyScore = scoreSynergy(profile, state.allies, champions, state.allyRoles || {});
    const counterScore = scoreCounters(profile, state.enemies, champions, state.enemyRoles || {}, opggEnemyData);
    const metaScore = scoreMeta(profile);
    const temporalScore = scoreTemporalFit(profile, temporal, state.allies);
    const executionScore = scoreExecutionReliability(profile, executionCtx, state.allies);
    const playerScore = scorePlayerAffinity(profile, opggSummonerData);
    const opggMetaScore = scoreOpggMeta(profile, opggLaneMeta);

    const normDraft = normalize(draftScore, -20, 35);
    const normComp = normalize(teamCompScore, -40, 70);
    const normSynergy = normalize(synergyScore, 0, 30);
    const normCounter = normalize(counterScore, -40, 50);
    const normMeta = normalize(metaScore, -25, 25);
    const normTemporal = normalize(temporalScore, -40, 35);
    const normExecution = normalize(executionScore, -30, 30);
    const normPlayer = normalize(playerScore, -25, 30);
    const normOpggMeta = normalize(opggMetaScore, -15, 20);

    const weightedDraftScore = Math.round(normDraft * weights.draft);
    const weightedTeamCompScore = Math.round(normComp * weights.comp);
    const weightedSynergyScore = Math.round(normSynergy * weights.synergy);
    const weightedCounterScore = Math.round(normCounter * weights.counter);
    const weightedMetaScore = Math.round(normMeta * weights.meta);
    const weightedTemporalScore = Math.round(normTemporal * (weights.temporal ?? 1.0));
    const weightedExecutionScore = Math.round(normExecution * (weights.execution ?? 1.0));
    const weightedPlayerScore = Math.round(normPlayer * (weights.player ?? 1.5));
    const weightedOpggMetaScore = Math.round(normOpggMeta * (weights.opggMeta ?? 0.5));

    const total =
      weightedDraftScore +
      weightedTeamCompScore +
      weightedSynergyScore +
      weightedCounterScore +
      weightedMetaScore +
      weightedTemporalScore +
      weightedExecutionScore +
      weightedPlayerScore +
      weightedOpggMetaScore;

    // ── Reason generation ──────────────────────────────────────────────────
    const reasons: string[] = [];
    if (weightedCounterScore > 70) reasons.push('Counters enemy composition\'s primary win condition');
    else if (weightedCounterScore > 50) reasons.push('Favourable matchup against enemy picks');
    if (weightedSynergyScore > 65) reasons.push('Strong synergy with allied picks');
    else if (weightedSynergyScore > 45) reasons.push('Good fit with team\'s strategic direction');
    if (weightedTemporalScore > 70) reasons.push('Power curve aligns with team\'s timing');
    else if (weightedTemporalScore > 50) reasons.push('Acceptable power timing for this comp');
    if (weightedTeamCompScore > 70) reasons.push('Fills critical composition gaps');
    else if (weightedTeamCompScore > 50) reasons.push('Strengthens overall team balance');
    if (weightedDraftScore > 60) reasons.push('Excellent pick for this draft position');
    if (weightedExecutionScore > 60) reasons.push('Stabilises team execution reliability');
    if (weightedPlayerScore > 70) reasons.push('High personal mastery — comfort pick');
    else if (weightedPlayerScore > 50) reasons.push('Part of your active champion pool');
    if (weightedOpggMetaScore > 50) reasons.push('Currently strong in the meta');
    if (weightedMetaScore > 60) reasons.push('Statistically overperforming this patch');

    if (reasons.length === 0) reasons.push('Solid all-round pick for this situation');

    // ── Draft advantage estimation ────────────────────────────────────────
    // Anchored by OP.GG champion win rate when available, offset by draft score.
    // Without real WR data, we derive a pure score-based assessment.
    let baseWR = 50;
    // Find the candidate's own OP.GG stats from lane meta if available
    if (opggLaneMeta) {
      const laneEntry = opggLaneMeta[c.name] || opggLaneMeta[c.id];
      if (laneEntry && typeof laneEntry === 'object' && 'win_rate' in laneEntry) {
        baseWR = (laneEntry as any).win_rate * 100;
      }
    }
    // Draft context shifts the WR estimate ±5 based on how well this pick fits
    const maxPossibleScore = 100 * (
      weights.draft + weights.comp + weights.synergy + weights.counter +
      weights.meta + (weights.temporal ?? 1) + (weights.execution ?? 1) +
      (weights.player ?? 1.5) + (weights.opggMeta ?? 0.5)
    );
    const scoreRatio = total / maxPossibleScore; // 0 to ~1
    const draftShift = (scoreRatio - 0.4) * 12.5; // centers around 40% → 0 shift, 80% → +5
    const estimatedWR = Math.round(Math.max(35, Math.min(65, baseWR + draftShift)));

    // Classification for the gauge
    let draftAdvantage: 'unfavourable' | 'neutral' | 'favourable';
    if (estimatedWR >= 53) draftAdvantage = 'favourable';
    else if (estimatedWR <= 47) draftAdvantage = 'unfavourable';
    else draftAdvantage = 'neutral';

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
        metaScore: weightedMetaScore,
        temporalScore: weightedTemporalScore,
        executionScore: weightedExecutionScore,
        playerAffinityScore: weightedPlayerScore,
        opggMetaScore: weightedOpggMetaScore
      },
      reasons,
      estimatedWR,
      draftAdvantage,
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