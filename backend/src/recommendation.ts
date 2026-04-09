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
  const picked = new Set([...state.allies, ...state.enemies, ...(state.bans || [])]);

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

    // Based on empirical tests:
    // Draft: ranges from about -10 to 45 (first pick blind vs counter pick)
    const normDraft = normalize(draftScore, -15, 45);
    // Comp: highly dependent on size of team, usually 0 to 70
    const normComp = normalize(teamCompScore, -20, 70);
    // Synergy: from 0 to about 40
    const normSynergy = normalize(synergyScore, 0, 55);
    // Counter: ranges wildly from -40 up to 100+ when OP.GG data combines with heuristics
    const normCounter = normalize(counterScore, -30, 90);
    const normMeta = normalize(metaScore, -20, 30);
    const normTemporal = normalize(temporalScore, -20, 30);
    const normExecution = normalize(executionScore, -20, 20);
    // Player and OPGG meta stays mostly same
    const normPlayer = normalize(playerScore, -25, 30);
    const normOpggMeta = normalize(opggMetaScore, -15, 20);
    const playerWeight = opggSummonerData ? (weights.player ?? 1.5) : 0;

    const weightedDraftScore = Math.round(normDraft * weights.draft);
    const weightedTeamCompScore = Math.round(normComp * weights.comp);
    const weightedSynergyScore = Math.round(normSynergy * weights.synergy);
    const weightedCounterScore = Math.round(normCounter * weights.counter);
    const weightedMetaScore = Math.round(normMeta * weights.meta);
    const weightedTemporalScore = Math.round(normTemporal * (weights.temporal ?? 1.0));
    const weightedExecutionScore = Math.round(normExecution * (weights.execution ?? 1.0));
    const weightedPlayerScore = Math.round(normPlayer * playerWeight);
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

    // 1. Specific Counter Matchups
    const hardCounteredEnemies = state.enemies.filter(eid => {
      const ep = getProfile(champions[eid], state.enemyRoles[eid] || 'Unknown');
      return profile.hardCounters?.some(hc => ep.traits?.includes(hc) || ep.style?.includes(hc) || ep.damageType === hc);
    }).map(eid => champions[eid]?.name);

    if (hardCounteredEnemies.length > 0) {
      reasons.push(`Hard counters ${hardCounteredEnemies.join(', ')}`);
    } else if (weightedCounterScore > 65) {
      reasons.push(`Strong statistical matchup against enemy picks`);
    }

    // 2. Exact Comp Gaps
    const profileStyle = profile.style || [];
    if (needs.needsFrontline > 0.6 && (profileStyle.includes('Frontline') || profile.traits?.includes('Tank'))) {
      reasons.push(`Fills frontline gap — team currently lacks a solid anchor`);
    } else if (needs.needsEngage > 0.6 && profileStyle.includes('Engage')) {
      reasons.push(`Provides the primary engage tool your team desperately needs`);
    } else if (needs.needsAP > 0.6 && profile.damageType === 'AP') {
      reasons.push(`Crucial AP damage source to prevent enemies stacking Armor`);
    } else if (needs.needsAD > 0.6 && profile.damageType === 'AD') {
      reasons.push(`Essential physical damage source to balance team composition`);
    } else if (weightedTeamCompScore > 70) {
      reasons.push(`Excellent fit for team's overall identity and scaling needs`);
    }

    // 3. Exact Synergy Matchups
    if (weightedSynergyScore > 65) {
      reasons.push(`High trait/wombo-combo synergy with locked allies`);
    }

    // 4. Power Spike / Temporal
    if (state.allies.length > 0 && profile.peakPhase && temporal.intendedTiming !== 'flex' && profile.peakPhase === temporal.intendedTiming) {
      reasons.push(`Power spike gracefully aligns with team's ${profile.peakPhase}-game window`);
    }

    // 5. Execution Complexity
    if (weightedExecutionScore > 65) {
      reasons.push(`Stabilises draft by providing an easy-to-execute 'GO' button`);
    }

    // 6. Player Comfort
    const poolEntry = opggSummonerData?.champion_pool.find(p => p.champion_name === profile.name);
    if (poolEntry) {
      if (poolEntry.play >= 20 && poolEntry.win / poolEntry.play > 0.5) {
        reasons.push(`${poolEntry.play} games played with ${(poolEntry.win / poolEntry.play * 100).toFixed(0)}% WR — proven comfort pick`);
      } else if (poolEntry.play >= 10) {
        reasons.push(`Part of your active champion pool (${poolEntry.play} games)`);
      }
    }

    // 7. Meta / Draft Safety
    if (reasons.length < 3 && weightedDraftScore > 60) {
      reasons.push(`Exceptionally safe blind pick for this draft position`);
    }
    if (reasons.length < 3 && weightedOpggMetaScore > 50) {
      reasons.push(`Currently dominant in the OP.GG meta for this role`);
    }

    if (reasons.length === 0) reasons.push('Solid all-round tactical pick');

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
      playerWeight + (weights.opggMeta ?? 0.5)
    );
    const scoreRatio = total / maxPossibleScore; // 0 to ~1
    const draftShift = (scoreRatio - 0.4) * 12.5; // centers around 40% → 0 shift, 80% → +5
    const estimatedWR = Math.round(Math.max(35, Math.min(65, baseWR + draftShift)));

    let draftAdvantage: 'unfavourable' | 'neutral' | 'favourable';
    if (estimatedWR >= 53) draftAdvantage = 'favourable';
    else if (estimatedWR <= 47) draftAdvantage = 'unfavourable';
    else draftAdvantage = 'neutral';

    let laneDifficulty: 'Favourable' | 'Even' | 'Difficult' | 'Unknown' = 'Unknown';
    const searchRole = state.role.toLowerCase();
    const directEnemyIndex = state.enemies.findIndex(e => (state.enemyRoles[e] || '').toLowerCase() === searchRole);
    if (directEnemyIndex !== -1) {
      const eData = opggEnemyData[directEnemyIndex];
      const enemyC = champions[state.enemies[directEnemyIndex]];
      const enemyP = getProfile(enemyC, state.role);

      let matchedReal = false;
      if (eData) {
        const strongMatch = eData.strong_counters.find(x => x.champion_id.toString() === profile.id || x.champion_name === profile.name);
        const weakMatch = eData.weak_counters.find(x => x.champion_id.toString() === profile.id || x.champion_name === profile.name);

        if (strongMatch && strongMatch.play >= 50 && strongMatch.win_rate >= 0.51) {
          laneDifficulty = 'Difficult';
          matchedReal = true;
        } else if (weakMatch && weakMatch.play >= 50 && weakMatch.win_rate >= 0.51) {
          laneDifficulty = 'Favourable';
          matchedReal = true;
        }
      }

      if (!matchedReal) {
        // Fallback to heuristic
        const isEnemyCountering = enemyP.hardCounters?.some(hc => profile.traits?.includes(hc) || profile.style?.includes(hc) || profile.damageType === hc);
        const isCandidateCountering = profile.hardCounters?.some(hc => enemyP.traits?.includes(hc) || enemyP.style?.includes(hc) || enemyP.damageType === hc);

        if (isEnemyCountering && !isCandidateCountering) laneDifficulty = 'Difficult';
        else if (isCandidateCountering && !isEnemyCountering) laneDifficulty = 'Favourable';
        else laneDifficulty = 'Even';
      }
    }

    return {
      id: c.id,
      name: c.name,
      tags: c.tags,
      image: `https://ddragon.leagueoflegends.com/cdn/${latestPatch}/img/champion/${c.image.full}`,
      scores: {
        draftScore: Math.round(normDraft),
        teamCompScore: Math.round(normComp),
        synergyScore: Math.round(normSynergy),
        counterScore: Math.round(normCounter),
        metaScore: Math.round(normMeta),
        temporalScore: Math.round(normTemporal),
        executionScore: Math.round(normExecution),
        playerAffinityScore: opggSummonerData ? Math.round(normPlayer) : 0,
        opggMetaScore: Math.round(normOpggMeta)
      },
      reasons,
      estimatedWR,
      draftAdvantage,
      laneDifficulty,
      score: total,
      rawScores: {
        draftScore, teamCompScore,
        synergyScore, counterScore, metaScore, temporalScore,
        executionScore, playerScore, opggMetaScore
      }
    };
  });

  // Sort descending
  scored.sort((a, b) => b.score - a.score);

  return {
    best: scored[0] || null,
    alternatives: scored.slice(1, 4),
    allScored: scored
  };
}