import axios from 'axios';

const META_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8001';

export interface MCPChampionData {
  weak_counters: Array<{ champion_id: number; champion_name: string; play: number; win: number; win_rate: number }>;
  strong_counters: Array<{ champion_id: number; champion_name: string; play: number; win: number; win_rate: number }>;
  stats: { ban_rate: number; kda: number; pick_rate: number; play: number; rank: number; tier: number; win_rate: number };
}

export interface MCPSummonerData {
  league_stats: Array<{ tier_info: { tier: string | null; division: number | null; lp: number | null }; win: number | null; lose: number | null }>;
  champion_pool: Array<{ champion_name: string; play: number; win: number; lose: number }>;
}

const championCache: Record<string, MCPChampionData> = {};
const summonerCache: Record<string, MCPSummonerData> = {};

export async function getOpggChampionData(champion: string, position: string): Promise<MCPChampionData | null> {
  const key = `${champion}:${position}`;
  if (championCache[key]) return championCache[key];

  try {
    const response = await axios.get(`${META_SERVICE_URL}/champion`, {
      params: { champion, position },
      timeout: 10000
    });
    if (response.data.success && response.data.data) {
      championCache[key] = response.data.data;
      return response.data.data;
    }
  } catch (error) {
    console.error(`[OPGG] Error fetching champion data for ${champion} ${position}:`, error);
  }
  return null;
}

export async function getOpggSummonerData(gameName: string, tagLine: string, region: string = 'euw'): Promise<MCPSummonerData | null> {
  const key = `${gameName}#${tagLine}:${region}`;
  if (summonerCache[key]) return summonerCache[key];

  try {
    const response = await axios.get(`${META_SERVICE_URL}/summoner`, {
      params: { gameName, tagLine, region },
      timeout: 10000
    });
    if (response.data.success && response.data.data) {
      summonerCache[key] = response.data.data;
      return response.data.data;
    }
  } catch (error) {
    console.error(`[OPGG] Error fetching summoner data for ${gameName}#${tagLine}:`, error);
  }
  return null;
}

// Lane meta: keyed by position -> champion_name -> stats
export interface OpggLaneMetaEntry {
  champion: string;
  tier: number;
  win_rate: number;
  pick_rate: number;
  ban_rate: number;
  is_rip: boolean;
}

const laneMetaCache: Record<string, Record<string, OpggLaneMetaEntry>> = {};

export async function getOpggLaneMeta(position: string): Promise<Record<string, OpggLaneMetaEntry> | null> {
  const key = position.toLowerCase();
  if (laneMetaCache[key]) return laneMetaCache[key];

  try {
    const response = await axios.get(`${META_SERVICE_URL}/lane-meta`, {
      params: { position: key },
      timeout: 15000
    });
    if (response.data.success && response.data.data) {
      // The MCP returns {top: {...}, jungle: {...}, ...} — extract the relevant position
      const posData = response.data.data[key] || response.data.data;
      if (posData && typeof posData === 'object') {
        laneMetaCache[key] = posData;
        return posData;
      }
    }
  } catch (error) {
    console.error(`[OPGG] Error fetching lane meta for ${position}:`, error);
  }
  return null;
}
