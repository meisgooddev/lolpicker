import axios from 'axios';
import { rolePool } from './rolePool.js';
import { fetchMetaStats } from './metaService.js';

export let champions: Record<string, any> = {};
export let latestPatch = '13.24.1';

export function validateRolePool(champs: Record<string, any>, pool: Record<string, string[]>) {
  for (const [role, ids] of Object.entries(pool)) {
    for (const id of ids) {
      if (!champs[id]) {
        console.warn(`[rolePool] Invalid champion id in ${role}: ${id}`);
      }
    }
  }
}

export async function loadChampionData() {
  try {
    const vRes = await axios.get('https://ddragon.leagueoflegends.com/api/versions.json');
    latestPatch = vRes.data[0];
    const res = await axios.get(`https://ddragon.leagueoflegends.com/cdn/${latestPatch}/data/en_US/champion.json`);
    champions = res.data.data;
    console.log(`Loaded ${Object.keys(champions).length} champions from patch ${latestPatch}`);

    // Validate the statically defined rolePool against actual Riot IDs to catch typos
    validateRolePool(champions, rolePool);

    // Fetch meta data (Role/Elo statistics) from external aggregator
    await fetchMetaStats(latestPatch);
  } catch (e) {
    console.error("Failed to load champ data", e);
  }
}
