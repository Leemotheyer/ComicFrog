import { Router } from 'express';
import { fetchLocgComic } from '../locg.js';

export function createLocgRouter() {
  const router = Router();

  router.post('/import', async (req, res) => {
    try {
      const { url } = req.body;
      if (!url?.trim()) {
        return res.status(400).json({ error: 'LOCG URL is required' });
      }

      const comic = await fetchLocgComic(url);
      res.json(comic);
    } catch (error) {
      const status = error.message.includes('Invalid') || error.message.includes('must be')
        ? 400
        : 502;
      res.status(status).json({ error: error.message });
    }
  });

  return router;
}
