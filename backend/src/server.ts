import express from 'express';
import cors from 'cors';
import { loadChampionData } from './data.js';
import { getRecommendation } from './recommendation.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/recommend', async (req, res) => {
  const { role, side, allies = [], enemies = [], allyRoles = {}, enemyRoles = {}, gameName, tagLine, region } = req.body;
  try {
    for (const a of allies) {
      if (!allyRoles[a]) throw new Error(`Missing role mapping for ally ID: ${a}`);
    }
    for (const e of enemies) {
      if (!enemyRoles[e]) throw new Error(`Missing role mapping for enemy ID: ${e}`);
    }
    const recs = await getRecommendation({ role, side, allies, enemies, allyRoles, enemyRoles }, gameName, tagLine, region);
    res.json(recs);
  } catch (e: any) {
    console.error(`[DraftEngine] Validation Error: ${e.message}`);
    res.status(400).json({ error: e.message });
  }
});

app.get('/api/champions', (req, res) => {
  // Return minimal list
  import('./data.js').then(m => {
    res.json(Object.values(m.champions).map((c: any) => ({
      id: c.id,
      name: c.name,
      tags: c.tags,
      image: `https://ddragon.leagueoflegends.com/cdn/${m.latestPatch}/img/champion/${c.image.full}`
    })));
  });
});

const PORT = process.env.PORT || 3001;

loadChampionData().then(() => {
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);
  });
});
