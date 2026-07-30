# ComicFrog

An unconventional comic pull list app that uses [Froglog](https://froglog.co.uk/) as its database. Comics are stored as Froglog games, with a web GUI for managing your pull list and Docker support for easy deployment.

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

1. Copy the environment file and add your Froglog credentials:

```bash
cp .env.example .env
```

2. Edit `.env` with your Froglog username and password.

3. Start the app:

```bash
docker compose up --build
```

4. Open [http://localhost:3000](http://localhost:3000)

## Local development

### Backend

```bash
cd backend
cp ../.env.example ../.env   # if you haven't already
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

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/health` | Health check and Froglog connectivity |
| `GET` | `/api/comics` | List all comics (pull list + purchased) |
| `POST` | `/api/comics` | Add a comic to the pull list |
| `POST` | `/api/comics/:id/purchase` | Mark a pull-list comic as purchased |
| `PUT` | `/api/comics/:id` | Update a comic |
| `DELETE` | `/api/comics/:id?source=pull-list\|purchased` | Remove a comic |

## Environment variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `FROGLOG_USERNAME` | Yes | — | Your Froglog account username |
| `FROGLOG_PASSWORD` | Yes | — | Your Froglog account password |
| `FROGLOG_API_URL` | No | `https://api.froglog.co.uk/api` | Froglog API base URL |
| `PORT` | No | `3000` | Port the app listens on |

## Froglog API reference

- [API Documentation](https://wiki.froglog.co.uk/Api/Documentation)
- [API Examples](https://wiki.froglog.co.uk/Api/Examples)

## License

MIT
