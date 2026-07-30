# ComicFrog

An unconventional comic pull list app that uses [Froglog](https://froglog.co.uk/) as its database. Comics are stored as Froglog games, with a mobile-friendly web GUI for managing your pull list and Docker support for easy deployment.

## Features

- Mobile-first UI with bottom navigation, list/grid views, and touch-friendly controls
- In-app **Settings** page to connect your Froglog account (no `.env` required)
- Search, filter, and sort your collection
- Add comics with cover and variant cover support
- Mark issues as purchased with price tracking
- Edit existing entries
- Pull-to-refresh on mobile
- Remembers your last publisher/series and auto-suggests the next issue number

## How it works

ComicFrog maps comic book data onto Froglog's game model:

| Comic concept | Froglog field | Notes |
|---------------|---------------|-------|
| Comic title | `title` | e.g. "Amazing Spider-Man #42" |
| Publisher | `dev` | Marvel, DC, Image, etc. |
| Series | `genre` | Series name |
| Issue number | `platform` | Issue # |
| Release date | `rel_date` | Store release date |
| Cover art | `cover_image` | Primary cover URL |
| Variant cover | `title_img` / `img` | Alternate cover art URL |
| Variant name | `description` | Stored in description metadata |
| On pull list | Live service `active` | `POST /api/live-service` with `live_service_status: active` |
| Purchased | Completed game | `POST /api/games` with `end_date` set |
| Purchase price | `hours_played` | Price stored as decimal hours (e.g. $4.99 → `4.99`) |

Comics are tagged with a `[comicfrog]` marker in the description so they can be distinguished from actual games in your Froglog account.

### Status flow

1. **Add to pull list** — Creates a live service game with status `active`
2. **Mark purchased** — Moves the comic to a completed game (with purchase date and price), then removes it from live service

## Quick start with Docker

### Pull and run (recommended)

After the GitHub Action has published an image (on merge to `main`), pull and start ComicFrog:

```bash
docker compose pull
docker compose up -d
```

Open [http://localhost:3000](http://localhost:3000), go to **Settings**, and enter your Froglog username and password.

Credentials are saved to the `comicfrog-data` Docker volume and persist across restarts and image upgrades.

### Build locally

```bash
docker compose up -d --build
```

### Pre-seed credentials (optional)

```bash
cp .env.example .env
# Edit FROGLOG_USERNAME and FROGLOG_PASSWORD if desired
docker compose up -d
```

### Container image

Images are built and published to GitHub Container Registry on pushes to `main` and version tags (`v*`):

```
ghcr.io/leemotheyer/comicfrog:latest
```

To use a specific tag, set the image in `docker-compose.yml` or override when running:

```bash
COMICFROG_IMAGE=ghcr.io/leemotheyer/comicfrog:main docker compose up -d
```

> **Note:** GHCR packages are private by default for user accounts. After the first publish, set the package visibility to **Public** under GitHub → Packages → comicfrog → Package settings, or authenticate with `docker login ghcr.io` before pulling.

## Local development

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

In a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The Vite dev server runs on port 5173 and proxies API requests to the backend on port 3000.

On first launch, open **Settings** in the app to connect Froglog.

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check and Froglog connectivity |
| `GET` | `/api/auth/status` | Check if Froglog is configured |
| `POST` | `/api/auth/login` | Save Froglog credentials |
| `POST` | `/api/auth/test` | Test Froglog connection |
| `POST` | `/api/auth/logout` | Clear saved credentials |
| `GET` | `/api/comics` | List all comics (pull list + purchased) |
| `POST` | `/api/comics` | Add a comic to the pull list |
| `POST` | `/api/comics/:id/purchase` | Mark a pull-list comic as purchased |
| `PUT` | `/api/comics/:id` | Update a comic |
| `DELETE` | `/api/comics/:id?source=pull-list\|purchased` | Remove a comic |

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FROGLOG_USERNAME` | No | — | Optional seed; can configure in Settings UI |
| `FROGLOG_PASSWORD` | No | — | Optional seed; can configure in Settings UI |
| `FROGLOG_API_URL` | No | `https://api.froglog.co.uk/api` | Froglog API base URL |
| `PORT` | No | `3000` | Port the app listens on |
| `DATA_DIR` | No | `backend/data` | Where settings are stored |

## Froglog API reference

- [API Documentation](https://wiki.froglog.co.uk/Api/Documentation)
- [API Examples](https://wiki.froglog.co.uk/Api/Examples)

## License

MIT
