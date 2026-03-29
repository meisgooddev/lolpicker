"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getOpggChampionData = getOpggChampionData;
exports.getOpggSummonerData = getOpggSummonerData;
exports.getOpggLaneMeta = getOpggLaneMeta;
const axios_1 = __importDefault(require("axios"));
const META_SERVICE_URL = (process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8001') + '/mcp';
const championCache = {};
const summonerCache = {};
async function getOpggChampionData(champion, position) {
    const key = `${champion}:${position}`;
    if (championCache[key])
        return championCache[key];
    try {
        const response = await axios_1.default.get(`${META_SERVICE_URL}/champion`, {
            params: { champion, position },
            timeout: 10000
        });
        if (response.data.success && response.data.data) {
            championCache[key] = response.data.data;
            return response.data.data;
        }
    }
    catch (error) {
        console.error(`[OPGG] Error fetching champion data for ${champion} ${position}:`, error);
    }
    return null;
}
async function getOpggSummonerData(gameName, tagLine, region = 'euw') {
    const key = `${gameName}#${tagLine}:${region}`;
    if (summonerCache[key])
        return summonerCache[key];
    try {
        const response = await axios_1.default.get(`${META_SERVICE_URL}/summoner`, {
            params: { gameName, tagLine, region },
            timeout: 10000
        });
        if (response.data.success && response.data.data) {
            summonerCache[key] = response.data.data;
            return response.data.data;
        }
    }
    catch (error) {
        console.error(`[OPGG] Error fetching summoner data for ${gameName}#${tagLine}:`, error);
    }
    return null;
}
const laneMetaCache = {};
async function getOpggLaneMeta(position) {
    const key = position.toLowerCase();
    if (laneMetaCache[key])
        return laneMetaCache[key];
    try {
        const response = await axios_1.default.get(`${META_SERVICE_URL}/lane-meta`, {
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
    }
    catch (error) {
        console.error(`[OPGG] Error fetching lane meta for ${position}:`, error);
    }
    return null;
}
