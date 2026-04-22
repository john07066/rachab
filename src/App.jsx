import { useState } from 'react';
import { analyzeTranscript, analyzeVideo, approveClip, exportVideo, fetchClips } from './lib/api.js';
import { ClipList } from './components/ClipList.jsx';

export function App() {
  const [mode, setMode] = useState('youtube');
  const [url, setUrl] = useState('');
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
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
      const result = mode === 'youtube'
        ? await analyzeVideo(url)
        : await analyzeTranscript(transcript, title || 'Manual Transcript');

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
        <p>Generate viral-ready clips for Wealth, Mindset, and Ultra-Wealth psychology content.</p>
      </header>

      <form onSubmit={handleAnalyze} className="panel">
        <label>Input mode</label>
        <div className="row modeRow">
          <button type="button" className={mode === 'youtube' ? 'active' : ''} onClick={() => setMode('youtube')}>YouTube URL</button>
          <button type="button" className={mode === 'transcript' ? 'active' : ''} onClick={() => setMode('transcript')}>Raw Transcript</button>
        </div>

        {mode === 'youtube' ? (
          <>
            <label htmlFor="videoUrl">YouTube URL</label>
            <input
              id="videoUrl"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.youtube.com/watch?v=..."
              required
            />
          </>
        ) : (
          <>
            <label htmlFor="transcriptTitle">Transcript Title</label>
            <input
              id="transcriptTitle"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Episode title"
            />
            <label htmlFor="transcript">Transcript (one line per sentence)</label>
            <textarea
              id="transcript"
              rows={8}
              value={transcript}
              onChange={(event) => setTranscript(event.target.value)}
              placeholder="Paste transcript lines here..."
              required
            />
          </>
        )}

        <button type="submit" disabled={loading}>{loading ? 'Analyzing…' : 'Analyze'}</button>
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
