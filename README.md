# Elite AI Video Clipper

A full-stack platform for extracting viral short-form clips from long-form content in the **wealth, mindset, and ultra-wealth psychology** niche.

## Stack

- API/worker: Node + Express
- AI copy generation: Groq (optional via `GROQ_API_KEY`)
- Persistence: Supabase (optional via REST env vars)
- Rendering: `yt-dlp` + `ffmpeg`

## Features

- Generate up to 10 clip candidates per video
- Clip duration normalization to 20–59 seconds
- Viral title/hook/caption/description generation (Groq-backed with fallback)
- Batch queue processing (`POST /api/batch`)
- Render with subtitles and aspect ratio options (`9:16`, `16:9`)
- Auto b-roll style motion effect toggle

## Local quick start

```bash
npm install
npm run dev
```

- Web app: `http://localhost:5173`
- API: `http://localhost:8787`

## Railway deployment (single service: frontend + backend)

This repo is Docker-ready for Railway. The `Dockerfile`:
- installs `ffmpeg` + `yt-dlp`
- installs dependencies
- builds the Vite frontend
- runs the Express server that also serves `dist/`

### Railway environment variables

Set these in Railway (do not commit them):

- `GROQ_API_KEY`
- `GROQ_MODEL` (optional; default `llama-3.1-8b-instant`)
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (recommended)
- `SUPABASE_ANON_KEY` (optional)
- `PORT` (Railway usually sets this automatically)

> Security: if keys were ever shared publicly, rotate them immediately in provider dashboards.

## API

- `POST /api/analyze-video`
- `POST /api/analyze-transcript`
- `POST /api/batch`
- `GET /api/jobs/:jobId`
- `GET /api/videos/:videoId/clips`
- `POST /api/clips/:clipId/approve`
- `POST /api/export/:videoId`
- `POST /api/render/:videoId` body example:

```json
{
  "aspectRatio": "9:16",
  "burnSubtitles": true,
  "autoBroll": true
}
```
