"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.metaCache = void 0;
exports.fetchMetaStats = fetchMetaStats;
exports.getChampionMetaScore = getChampionMetaScore;
const axios_1 = __importDefault(require("axios"));
const data_js_1 = require("./data.js");
// Cache to hold meta statistics grouped by Patch -> Role -> Elo -> ChampionId
// e.g. metaData['14.6']['Top']['platinum_plus']['Aatrox'] = 8.5
exports.metaCache = {};
// Fallback tier lists in case the external API fails (to keep the engine running)
const fallbackMap = {
    Top: { Aatrox: 8, Darius: 7, Garen: 7, Fiora: 6, Camille: 6 },
    Jungle: { LeeSin: 9, Viego: 8, Hecarim: 6, Shaco: 3, Amumu: 5 },
    Mid: { Ahri: 8, Yone: 9, Yasuo: 7, Sylas: 8, Lux: 7, Azir: 4 },
    ADC: { Jinx: 9, Kaisa: 10, Jhin: 8, Ezreal: 9, Ashe: 8, Smolder: 8 },
    Support: { Nautilus: 9, Thresh: 8, Karma: 7, Rakan: 7, Yuumi: 2, Rell: 8 }
};
async function fetchMetaStats(patch = data_js_1.latestPatch) {
    try {
        console.log(`[MetaService] Fetching external meta statistics via Python microservice for patch ${patch}...`);
        if (!exports.metaCache[patch])
            exports.metaCache[patch] = {};
        const roles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'];
        for (const role of roles) {
            if (!exports.metaCache[patch][role])
                exports.metaCache[patch][role] = {};
            const elo = 'emerald_plus';
            if (!exports.metaCache[patch][role][elo])
                exports.metaCache[patch][role][elo] = {};
            try {
                const metaUrl = process.env.META_SERVICE_URL || 'http://127.0.0.1:8001';
                const response = await axios_1.default.get(`${metaUrl}/meta`, {
                    params: { role: role.toLowerCase(), elo: 'emerald', patch }
                });
                if (response.data && response.data.success) {
                    const dict = response.data.data;
                    exports.metaCache[patch][role][elo] = { ...exports.metaCache[patch][role][elo], ...dict };
                    console.log(`[MetaService] Loaded ${Object.keys(dict).length} stats for ${role} from microservice.`);
                }
                else {
                    console.warn(`[MetaService] Microservice error for ${role}:`, response.data.error);
                    throw new Error("Microservice returned success=False");
                }
            }
            catch (err) {
                console.warn(`[MetaService] Unreachable or failed for ${role}. Using generic fallback. (${err.message})`);
                // Fallback for missing/failed microservice logic
                Object.entries(fallbackMap[role] || {}).forEach(([champ, score]) => {
                    exports.metaCache[patch][role][elo][champ] = score;
                });
            }
        }
    }
    catch (error) {
        console.warn(`[MetaService] Critical failure fetching external stats.`, error);
    }
}
function getChampionMetaScore(championId, role, elo = 'emerald_plus', patch = data_js_1.latestPatch) {
    try {
        const roleStats = exports.metaCache[patch]?.[role]?.[elo];
        if (roleStats && roleStats[championId] !== undefined) {
            return roleStats[championId];
        }
    }
    catch (e) { }
    // Default to 5.0 (neutral) if no data or obscure off-meta pick
    return 5.0;
}
