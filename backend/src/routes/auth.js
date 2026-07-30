import { Router } from 'express';

export function createAuthRouter(settings) {
  const router = Router();

  router.get('/status', (_req, res) => {
    res.json(settings.getStatus());
  });

  router.post('/login', async (req, res) => {
    try {
      const status = await settings.configure(req.body);
      res.json(status);
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  });

  router.post('/test', async (req, res) => {
    try {
      await settings.testConnection(req.body);
      res.json({ ok: true });
    } catch (error) {
      res.status(401).json({ error: error.message });
    }
  });

  router.post('/logout', async (_req, res) => {
    await settings.logout();
    res.json({ configured: false });
  });

  return router;
}
