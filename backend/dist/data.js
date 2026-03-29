"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.latestPatch = exports.champions = void 0;
exports.validateRolePool = validateRolePool;
exports.loadChampionData = loadChampionData;
const axios_1 = __importDefault(require("axios"));
const rolePool_js_1 = require("./rolePool.js");
const metaService_js_1 = require("./metaService.js");
exports.champions = {};
exports.latestPatch = '13.24.1';
function validateRolePool(champs, pool) {
    for (const [role, ids] of Object.entries(pool)) {
        for (const id of ids) {
            if (!champs[id]) {
                console.warn(`[rolePool] Invalid champion id in ${role}: ${id}`);
            }
        }
    }
}
async function loadChampionData() {
    try {
        const vRes = await axios_1.default.get('https://ddragon.leagueoflegends.com/api/versions.json');
        exports.latestPatch = vRes.data[0];
        const res = await axios_1.default.get(`https://ddragon.leagueoflegends.com/cdn/${exports.latestPatch}/data/en_US/champion.json`);
        exports.champions = res.data.data;
        console.log(`Loaded ${Object.keys(exports.champions).length} champions from patch ${exports.latestPatch}`);
        // Validate the statically defined rolePool against actual Riot IDs to catch typos
        validateRolePool(exports.champions, rolePool_js_1.rolePool);
        // Fetch meta data (Role/Elo statistics) from external aggregator
        await (0, metaService_js_1.fetchMetaStats)(exports.latestPatch);
    }
    catch (e) {
        console.error("Failed to load champ data", e);
    }
}
