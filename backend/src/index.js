import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { FroglogClient } from './froglog.js';
import { createComicsRouter } from './routes/comics.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const port = Number(process.env.PORT || 3000);
const froglogBaseUrl = process.env.FROGLOG_API_URL || 'https://api.froglog.co.uk/api';
const froglogUsername = process.env.FROGLOG_USERNAME;
const froglogPassword = process.env.FROGLOG_PASSWORD;

if (!froglogUsername || !froglogPassword) {
  console.error('FROGLOG_USERNAME and FROGLOG_PASSWORD are required');
  process.exit(1);
}

const froglog = new FroglogClient(froglogBaseUrl, froglogUsername, froglogPassword);
const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    await froglog.ensureAuth();
    res.json({ status: 'ok', froglog: froglogBaseUrl });
  } catch (error) {
    res.status(503).json({ status: 'error', error: error.message });
  }
});

app.use('/api/comics', createComicsRouter(froglog));

const frontendDist = path.join(__dirname, '../../frontend/dist');
app.use(express.static(frontendDist));
app.get('*', (_req, res) => {
  res.sendFile(path.join(frontendDist, 'index.html'));
});

app.listen(port, () => {
  console.log(`ComicFrog listening on http://localhost:${port}`);
});
