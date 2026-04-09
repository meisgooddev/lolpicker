import express from 'express';
import cors from 'cors';
import { loadChampionData } from './data.js';
import { getRecommendation } from './recommendation.js';
import { generateGamePlan } from './gamePlanService.js';
import { GamePlanError, generateRequestId } from './gamePlanErrors.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/recommend', async (req: express.Request, res: express.Response) => {
  const { role, side, allies = [], enemies = [], allyRoles = {}, enemyRoles = {}, bans = [], gameName, tagLine, region } = req.body;
  try {
    for (const a of allies) {
      if (!allyRoles[a]) throw new Error(`Missing role mapping for ally ID: ${a}`);
    }
    for (const e of enemies) {
      if (!enemyRoles[e]) throw new Error(`Missing role mapping for enemy ID: ${e}`);
    }
    const recs = await getRecommendation({ role, side, allies, enemies, allyRoles, enemyRoles, bans }, gameName, tagLine, region);
    res.json(recs);
  } catch (e: any) {
    console.error(`[DraftEngine] Validation Error: ${e.message}`);
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/gameplan', async (req: express.Request, res: express.Response) => {
  const requestId = generateRequestId();
  const { playerChampion, playerRole, playerSummonerSpells, allies, enemies, alliedBans, enemyBans } = req.body;

  // ── Validate request payload ─────────────────────────────────────────
  if (!playerChampion || !playerRole || !allies || !enemies) {
    console.error(`[GamePlan:${requestId}] Validation error: missing required fields.`);
    return res.status(400).json({
      ok: false,
      error: {
        status: 400,
        code: 'VALIDATION_MISSING_FIELDS',
        source: 'validation',
        retryable: false,
        userMessage: 'The request sent by the app was incomplete or invalid.',
        debugMessage: 'Missing required fields: playerChampion, playerRole, allies, enemies',
        requestId,
      }
    });
  }

  try {
    const gamePlan = await generateGamePlan({
      playerChampion,
      playerRole,
      playerSummonerSpells,
      allies,
      enemies,
      alliedBans: alliedBans || [],
      enemyBans: enemyBans || [],
    }, requestId);

    console.log(`[GamePlan:${requestId}] Success — champion=${playerChampion}, role=${playerRole}`);
    return res.json({ ok: true, data: gamePlan });

  } catch (e: any) {
    if (e instanceof GamePlanError) {
      const p = e.payload;
      console.error(`[GamePlan:${requestId}] ${p.code} | source=${p.source} | status=${p.status} | retryable=${p.retryable} | debug=${p.debugMessage}`);
      return res.status(p.status).json({ ok: false, error: p });
    }

    // Truly unexpected error — should not happen if gamePlanService classifies correctly
    console.error(`[GamePlan:${requestId}] UNCLASSIFIED ERROR:`, e.message);
    return res.status(500).json({
      ok: false,
      error: {
        status: 500,
        code: 'INTERNAL_UNKNOWN',
        source: 'backend',
        retryable: false,
        userMessage: 'An unexpected internal error occurred while generating the strategic brief.',
        debugMessage: e.message || 'Unknown error',
        requestId,
      }
    });
  }
});

app.get('/api/champions', (req: express.Request, res: express.Response) => {
  // Return minimal list
  Promise.all([import('./data.js'), import('./rolePool.js')]).then(([m, rp]) => {
    res.json(Object.values(m.champions).map((c: any) => {
      const validRoles = ['Top', 'Jungle', 'Mid', 'ADC', 'Support'].filter(r => rp.rolePool[r]?.includes(c.id));
      return {
        id: c.id,
        key: parseInt(c.key, 10),
        name: c.name,
        tags: c.tags,
        validRoles,
        image: `https://ddragon.leagueoflegends.com/cdn/${m.latestPatch}/img/champion/${c.image.full}`
      };
    }));
  });
});

const PORT = process.env.PORT || 3001;

loadChampionData().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
});
