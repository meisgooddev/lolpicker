import { loadChampionData } from './data.js';
import { getRecommendation } from './recommendation.js';

async function runTests() {
  await loadChampionData();

  console.log("=== SCENARIO 1: Top vs 3 AD (Expect Malphite top 3) ===");
  const rec1 = await getRecommendation({
    role: 'Top',
    side: 'blue',
    allies: [],
    enemies: ['Yasuo', 'Zed', 'Caitlyn'],
    allyRoles: {},
    enemyRoles: { 'Yasuo': 'Top', 'Zed': 'Mid', 'Caitlyn': 'ADC' }
  });
  printTop(rec1, 'Malphite');

  console.log("\n=== SCENARIO 2: Mid vs 3 AP (Expect Kassadin top 3) ===");
  const rec2 = await getRecommendation({
    role: 'Mid',
    side: 'blue',
    allies: [],
    enemies: ['Syndra', 'Elise', 'Kennen'],
    allyRoles: {},
    enemyRoles: { 'Syndra': 'Mid', 'Elise': 'Jungle', 'Kennen': 'Top' }
  });
  printTop(rec2, 'Kassadin');

  console.log("\n=== SCENARIO 3: ADC with Engage Support (Expect Jinx higher) ===");
  const rec3 = await getRecommendation({
    role: 'ADC',
    side: 'blue',
    allies: ['Leona'],
    enemies: [],
    allyRoles: { 'Leona': 'Support' },
    enemyRoles: {}
  });
  printTop(rec3, 'Jinx');

  console.log("\n=== SCENARIO 4: First pick mid (Expect safe blinds like Ahri/Orianna) ===");
  const rec4 = await getRecommendation({
    role: 'Mid',
    side: 'blue',
    allies: [],
    enemies: [],
    allyRoles: {},
    enemyRoles: {}
  });
  printTop(rec4, 'Ahri');
}

function printTop(rec: any, expectChamp: string) {
  const all = [rec.best, ...rec.alternatives];
  let found = false;
  all.forEach((c: any, i: number) => {
    if (c.name === expectChamp) found = true;
    console.log(`${i + 1}. ${c.name} (Total: ${c.score})`);
    console.log(`   Normed: Draft:${c.scores.draftScore} Comp:${c.scores.teamCompScore} Syn:${c.scores.synergyScore} Counter:${c.scores.counterScore} Meta:${c.scores.metaScore} Temp:${c.scores.temporalScore} Exec:${c.scores.executionScore} Player:${c.scores.playerAffinityScore} OPGG:${c.scores.opggMetaScore}`);
    console.log(`   RAW   : Draft:${c.rawScores.draftScore} Comp:${c.rawScores.teamCompScore.toFixed(1)} Syn:${c.rawScores.synergyScore} Counter:${c.rawScores.counterScore.toFixed(1)} Meta:${c.rawScores.metaScore.toFixed(1)} Temp:${c.rawScores.temporalScore} Exec:${c.rawScores.executionScore} Player:${c.rawScores.playerScore} OPGG:${c.rawScores.opggMetaScore}`);
  });
  if (!found) {
    console.log(`\n!!! Expected ${expectChamp} was not in the top 4 !!!`);
    const c = rec.allScored?.find((x: any) => x.name === expectChamp);
    if (c) {
      console.log(`   --> ${c.name} is rank ${rec.allScored.indexOf(c) + 1} with score ${c.score}`);
      console.log(`   Normed: Draft:${c.scores.draftScore} Comp:${c.scores.teamCompScore} Syn:${c.scores.synergyScore} Counter:${c.scores.counterScore} Meta:${c.scores.metaScore} Temp:${c.scores.temporalScore} Exec:${c.scores.executionScore} Player:${c.scores.playerAffinityScore} OPGG:${c.scores.opggMetaScore}`);
      console.log(`   RAW   : Draft:${c.rawScores.draftScore} Comp:${c.rawScores.teamCompScore.toFixed(1)} Syn:${c.rawScores.synergyScore} Counter:${c.rawScores.counterScore.toFixed(1)} Meta:${c.rawScores.metaScore.toFixed(1)} Temp:${c.rawScores.temporalScore} Exec:${c.rawScores.executionScore} Player:${c.rawScores.playerScore} OPGG:${c.rawScores.opggMetaScore}`);
    }
  }
}

runTests().catch(console.error);
