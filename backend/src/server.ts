import express from 'express';
import cors from 'cors';
import { loadChampionData } from './data.js';
import { getRecommendation } from './recommendation.js';

const app = express();
app.use(cors());
app.use(express.json());

app.post('/api/recommend', (req, res) => {
  const { role, pickPosition, side, allies, enemies } = req.body;
  try {
    const recs = getRecommendation({ role, pickPosition, side, allies, enemies });
    res.json(recs);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
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
