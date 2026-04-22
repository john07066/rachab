import express from 'express';
import cors from 'cors';
import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createAnalyzerService } from './services/analyzer.js';
import { renderApprovedClips } from './services/renderer.js';
import { createBatchQueue } from './services/queue.js';
import { persistAnalysis, persistExport } from './services/supabaseStore.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

const app = express();
const port = process.env.PORT || 8787;
const analyzer = createAnalyzerService();
const queue = createBatchQueue({ analyzer });

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'elite-ai-video-clipper-api' });
});

app.post('/api/analyze-video', async (req, res) => {
  try {
    const { url } = req.body;
    const result = await analyzer.analyze(url);
    await persistAnalysis(result);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/analyze-transcript', async (req, res) => {
  try {
    const { text, title } = req.body;
    const result = await analyzer.analyzeTranscript({ text, title });
    await persistAnalysis(result);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/batch', (req, res) => {
  try {
    const { urls } = req.body;
    if (!Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ message: 'urls[] is required' });
    }

    const job = queue.enqueue(urls);
    return res.json(job);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.get('/api/jobs/:jobId', (req, res) => {
  const job = queue.getJob(req.params.jobId);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  return res.json(job);
});

app.get('/api/videos/:videoId/clips', (req, res) => {
  const video = analyzer.getVideo(req.params.videoId);
  if (!video) return res.status(404).json({ message: 'Video not found' });
  return res.json({ clips: video.clips });
});

app.post('/api/clips/:clipId/approve', (req, res) => {
  try {
    const clip = analyzer.approveClip(req.params.clipId);
    res.json({ clip });
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.post('/api/render/:videoId', async (req, res) => {
  try {
    const videoPayload = analyzer.getVideo(req.params.videoId);
    if (!videoPayload) return res.status(404).json({ message: 'Video not found' });

    const approvedClips = videoPayload.clips.filter((clip) => clip.status === 'approved');
    const rendered = await renderApprovedClips({
      video: videoPayload.video,
      clips: approvedClips,
      options: {
        aspectRatio: req.body?.aspectRatio || '9:16',
        burnSubtitles: req.body?.burnSubtitles ?? true,
        autoBroll: req.body?.autoBroll ?? true
      }
    });

    return res.json(rendered);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

app.post('/api/export/:videoId', async (req, res) => {
  try {
    const payload = analyzer.exportApproved(req.params.videoId);
    await persistExport({
      videoId: req.params.videoId,
      approvedCount: payload.approvedCount,
      payload
    });
    res.json(payload);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

if (existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    return res.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
