import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { requireFroglogAuth } from './middleware/requireAuth.js';
import { createAuthRouter } from './routes/auth.js';
import { createComicsRouter } from './routes/comics.js';
import { SettingsManager } from './settings.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const settings = new SettingsManager();

await settings.init();

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  if (!settings.isConfigured()) {
    return res.json({ status: 'ok', froglog: 'not configured' });
  }

  try {
    await settings.getClient().ensureAuth();
    res.json({ status: 'ok', froglog: settings.getStatus().apiUrl });
  } catch (error) {
    res.status(503).json({ status: 'error', error: error.message });
  }
});

app.use('/api/auth', createAuthRouter(settings));
app.use('/api/comics', requireFroglogAuth(settings), createComicsRouter(() => settings.getClient()));

const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(port, () => {
  console.log(`ComicFrog listening on http://localhost:${port}`);
});
