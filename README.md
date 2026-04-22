# Elite AI Video Clipper

A full-stack platform for extracting viral short-form clips from long-form YouTube content focused on **wealth, mindset, and psychology of the ultra-wealthy**.

## Features

- YouTube URL intake + transcript ingestion (stubbed with local parsing helper)
- Niche-aware viral scoring engine
- Auto-generated titles, hooks, captions, emotion labels, and rationale
- Ranked clip candidates with review actions
- JSON export for posting pipelines
- REST API + React dashboard

## Quick start

```bash
npm install
npm run dev
```

- Web app: `http://localhost:5173`
- API: `http://localhost:8787`

## API

- `POST /api/analyze-video`
- `GET /api/videos/:videoId/clips`
- `POST /api/clips/:clipId/approve`
- `POST /api/export/:videoId`

## Database

See `db/schema.sql` for production-ready schema baseline.
