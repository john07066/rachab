# Elite AI Video Clipper

A full-stack platform for extracting viral short-form clips from long-form content in the **wealth, mindset, and ultra-wealth psychology** niche.

## What is now finished

- YouTube URL analysis endpoint with best-effort transcript fetch fallback
- Manual transcript ingestion endpoint for deterministic analysis
- Viral scoring for 5-7 best moments
- Auto-generated title, hook, caption, emotion, and viral rationale
- Review/approval UX and export payload generation
- SQL schema baseline for videos/transcripts/clips

## Quick start

```bash
npm install
npm run dev
```

- Web app: `http://localhost:5173`
- API: `http://localhost:8787`

## API

- `POST /api/analyze-video` with `{ "url": "..." }`
- `POST /api/analyze-transcript` with `{ "title": "...", "text": "line1\nline2" }`
- `GET /api/videos/:videoId/clips`
- `POST /api/clips/:clipId/approve`
- `POST /api/export/:videoId`

## Notes

- Transcript fetch from YouTube is a best-effort call and may fail for private videos or regional blocks.
- Use manual transcript mode when you need guaranteed analysis behavior.
