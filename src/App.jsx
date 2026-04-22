import { useState } from 'react';
import { analyzeVideo, approveClip, exportVideo, fetchClips } from './lib/api.js';
import { ClipList } from './components/ClipList.jsx';

export function App() {
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState(null);
  const [clips, setClips] = useState([]);
  const [error, setError] = useState('');
  const [exportJson, setExportJson] = useState('');

  async function handleAnalyze(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setExportJson('');

    try {
      const result = await analyzeVideo(url);
      setVideo(result.video);
      setClips(result.clips);
    } catch (analyzeError) {
      setError(analyzeError.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshClips(videoId) {
    const result = await fetchClips(videoId);
    setClips(result.clips);
  }

  async function handleApprove(clipId) {
    if (!video) return;
    await approveClip(clipId);
    await refreshClips(video.id);
  }

  async function handleExport() {
    if (!video) return;
    const data = await exportVideo(video.id);
    setExportJson(JSON.stringify(data, null, 2));
  }

  return (
    <main className="page">
      <header>
        <h1>Elite AI Video Clipper</h1>
        <p>Find the most viral Wealth/Mindset moments for Shorts, Reels, and TikTok.</p>
      </header>

      <form onSubmit={handleAnalyze} className="panel">
        <label htmlFor="videoUrl">YouTube URL</label>
        <div className="row">
          <input
            id="videoUrl"
            type="url"
            value={url}
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.youtube.com/watch?v=..."
            required
          />
          <button type="submit" disabled={loading}>{loading ? 'Analyzing…' : 'Analyze Video'}</button>
        </div>
      </form>

      {error && <p className="error">{error}</p>}

      {video && (
        <section className="panel">
          <h2>{video.title}</h2>
          <p>Video ID: <code>{video.id}</code></p>
          <button onClick={handleExport}>Export Approved Clips</button>
          {exportJson && <pre>{exportJson}</pre>}
        </section>
      )}

      <ClipList clips={clips} onApprove={handleApprove} />
    </main>
  );
}
