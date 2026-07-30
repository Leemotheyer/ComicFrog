import { Router } from 'express';

export function createComicsRouter(getFroglog) {
  const router = Router();

  router.get('/', async (_req, res) => {
    try {
      const comics = await getFroglog().listComics();
      res.json(comics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/', async (req, res) => {
    try {
      const { title, publisher, series, issueNumber, releaseDate, coverImage, variantCoverImage, variantCover, notes } = req.body;

      if (!title?.trim()) {
        return res.status(400).json({ error: 'Title is required' });
      }

      const comic = await getFroglog().addToPullList({
        title: title.trim(),
        publisher: publisher?.trim() || '',
        series: series?.trim() || '',
        issueNumber: issueNumber?.trim() || '',
        releaseDate: releaseDate || null,
        coverImage: coverImage?.trim() || null,
        variantCoverImage: variantCoverImage?.trim() || null,
        variantCover: variantCover?.trim() || '',
        notes: notes?.trim() || '',
      });

      res.status(201).json(comic);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/sync-froglog-labels', async (_req, res) => {
    try {
      const result = await getFroglog().syncFroglogLabels();
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  router.post('/:id/purchase', async (req, res) => {
    try {
      const purchasePrice = Number(req.body.purchasePrice);
      if (Number.isNaN(purchasePrice) || purchasePrice < 0) {
        return res.status(400).json({ error: 'A valid purchase price is required' });
      }

      const comic = await getFroglog().markPurchased(
        req.params.id,
        purchasePrice,
        req.body.purchaseDate || null,
      );
      res.json(comic);
    } catch (error) {
      const status = error.message === 'Comic not found on pull list' ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  router.put('/:id', async (req, res) => {
    try {
      const { source, ...updates } = req.body;
      if (!['pull-list', 'purchased'].includes(source)) {
        return res.status(400).json({ error: 'Source must be pull-list or purchased' });
      }

      const comic = await getFroglog().updateComic(req.params.id, source, updates);
      res.json(comic);
    } catch (error) {
      const status = error.message === 'Comic not found' ? 404 : 500;
      res.status(status).json({ error: error.message });
    }
  });

  router.delete('/:id', async (req, res) => {
    try {
      const { source } = req.query;
      if (!['pull-list', 'purchased'].includes(source)) {
        return res.status(400).json({ error: 'Query param source must be pull-list or purchased' });
      }

      await getFroglog().deleteComic(req.params.id, source);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });

  return router;
}
