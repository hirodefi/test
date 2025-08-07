import express from 'express';
import { buildStats } from './aggregate';

const app = express();
const PORT = 3001;

app.get('/api/stats', async (_req, res) => {
  try {
    const stats = await buildStats();
    res.json(stats);
  } catch (e) {
    console.error(e);
    res.status(500).send('Error fetching stats');
  }
});

app.listen(PORT, () => console.log(`Server listening on ${PORT}`));