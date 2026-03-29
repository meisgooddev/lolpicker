"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const data_js_1 = require("./data.js");
const recommendation_js_1 = require("./recommendation.js");
const app = (0, express_1.default)();
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post('/api/recommend', async (req, res) => {
    const { role, side, allies = [], enemies = [], allyRoles = {}, enemyRoles = {}, gameName, tagLine, region } = req.body;
    try {
        for (const a of allies) {
            if (!allyRoles[a])
                throw new Error(`Missing role mapping for ally ID: ${a}`);
        }
        for (const e of enemies) {
            if (!enemyRoles[e])
                throw new Error(`Missing role mapping for enemy ID: ${e}`);
        }
        const recs = await (0, recommendation_js_1.getRecommendation)({ role, side, allies, enemies, allyRoles, enemyRoles }, gameName, tagLine, region);
        res.json(recs);
    }
    catch (e) {
        console.error(`[DraftEngine] Validation Error: ${e.message}`);
        res.status(400).json({ error: e.message });
    }
});
app.get('/api/champions', (req, res) => {
    // Return minimal list
    Promise.resolve().then(() => __importStar(require('./data.js'))).then(m => {
        res.json(Object.values(m.champions).map((c) => ({
            id: c.id,
            name: c.name,
            tags: c.tags,
            image: `https://ddragon.leagueoflegends.com/cdn/${m.latestPatch}/img/champion/${c.image.full}`
        })));
    });
});
const PORT = process.env.PORT || 3001;
(0, data_js_1.loadChampionData)().then(() => {
    app.listen(PORT, () => {
        console.log(`Backend running on http://localhost:${PORT}`);
    });
});
