import { useState } from 'react';
import {
  analyzeTranscript,
  analyzeVideo,
  approveClip,
  enqueueBatch,
  exportVideo,
  fetchClips,
  getBatchJob,
  renderVideo
} from './lib/api.js';
import { ClipList } from './components/ClipList.jsx';

export function App() {
  const [mode, setMode] = useState('youtube');
  const [url, setUrl] = useState('');
  const [batchUrls, setBatchUrls] = useState('');
  const [batchJobId, setBatchJobId] = useState('');
  const [transcript, setTranscript] = useState('');
  const [title, setTitle] = useState('');
  const [aspectRatio, setAspectRatio] = useState('9:16');
  const [loading, setLoading] = useState(false);
  const [video, setVideo] = useState(null);
  const [clips, setClips] = useState([]);
  const [error, setError] = useState('');
  const [exportJson, setExportJson] = useState('');
  const [renderJson, setRenderJson] = useState('');

  async function handleAnalyze(event) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setExportJson('');
    setRenderJson('');

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

  async function handleBatch() {
    try {
      const urls = batchUrls.split('\n').map((line) => line.trim()).filter(Boolean);
      const job = await enqueueBatch(urls);
      setBatchJobId(job.id);
    } catch (batchError) {
      setError(batchError.message);
    }
  }

  async function checkBatch() {
    if (!batchJobId) return;
    try {
      const job = await getBatchJob(batchJobId);
      setRenderJson(JSON.stringify(job, null, 2));
    } catch (batchError) {
      setError(batchError.message);
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

  async function handleRender() {
    if (!video) return;

    try {
      const rendered = await renderVideo(video.id, {
        aspectRatio,
        burnSubtitles: true,
        autoBroll: true
      });
      setRenderJson(JSON.stringify(rendered, null, 2));
    } catch (renderError) {
      setError(renderError.message);
    }
  }

  return (
    <main className="page">
      <header>
        <h1>Elite AI Video Clipper</h1>
        <p>Groq + Supabase-ready clip engine with queue, subtitles, 9:16/16:9, and render pipeline.</p>
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
            <input id="videoUrl" type="url" value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://www.youtube.com/watch?v=..." required />
          </>
        ) : (
          <>
            <label htmlFor="transcriptTitle">Transcript Title</label>
            <input id="transcriptTitle" type="text" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Episode title" />
            <label htmlFor="transcript">Transcript (one line per sentence)</label>
            <textarea id="transcript" rows={8} value={transcript} onChange={(event) => setTranscript(event.target.value)} placeholder="Paste transcript lines here..." required />
          </>
        )}

        <button type="submit" disabled={loading}>{loading ? 'Analyzing…' : 'Analyze (10 clips, 20-59s)'}</button>
      </form>

      <section className="panel">
        <h3>Batch Queue</h3>
        <textarea rows={4} value={batchUrls} onChange={(event) => setBatchUrls(event.target.value)} placeholder="Paste one YouTube URL per line" />
        <div className="row">
          <button onClick={handleBatch}>Queue Batch</button>
          <button onClick={checkBatch}>Check Batch Status</button>
        </div>
        {batchJobId && <p>Job ID: <code>{batchJobId}</code></p>}
      </section>

      {error && <p className="error">{error}</p>}

      {video && (
        <section className="panel">
          <h2>{video.title}</h2>
          <p>Video ID: <code>{video.id}</code></p>
          <div className="row">
            <button onClick={handleExport}>Export Approved Clips</button>
            <select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>
              <option value="9:16">9:16</option>
              <option value="16:9">16:9</option>
            </select>
            <button onClick={handleRender}>Render Approved Clips</button>
          </div>
          {exportJson && <pre>{exportJson}</pre>}
          {renderJson && <pre>{renderJson}</pre>}
        </section>
      )}

      <ClipList clips={clips} onApprove={handleApprove} />
    </main>
  );
}
