import express from 'express';
import cors from 'cors';
import { createAnalyzerService } from './services/analyzer.js';

const app = express();
const port = process.env.PORT || 8787;
const analyzer = createAnalyzerService();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, name: 'elite-ai-video-clipper-api' });
});

app.post('/api/analyze-video', async (req, res) => {
  try {
    const { url } = req.body;
    const result = await analyzer.analyze(url);
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.post('/api/analyze-transcript', (req, res) => {
  try {
    const { text, title } = req.body;
    const result = analyzer.analyzeTranscript({ text, title });
    res.json(result);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

app.get('/api/videos/:videoId/clips', (req, res) => {
  const video = analyzer.getVideo(req.params.videoId);

  if (!video) {
    return res.status(404).json({ message: 'Video not found' });
  }

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

app.post('/api/export/:videoId', (req, res) => {
  try {
    const payload = analyzer.exportApproved(req.params.videoId);
    res.json(payload);
  } catch (error) {
    res.status(404).json({ message: error.message });
  }
});

app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});
