function scoreClass(score) {
  if (score >= 9) return 'high';
  if (score >= 7) return 'medium';
  return 'low';
}

export function ClipList({ clips, onApprove }) {
  if (!clips.length) {
    return (
      <section className="panel">
        <h2>Clip Candidates</h2>
        <p>No clips yet. Analyze a video to generate 5-7 candidates.</p>
      </section>
    );
  }

  return (
    <section className="panel">
      <h2>Clip Candidates</h2>
      <ul className="clipList">
        {clips.map((clip, index) => (
          <li key={clip.id}>
            <p><strong>CLIP {index + 1}</strong></p>
            <p>⏱ Timestamp: {clip.timestamp}</p>
            <p className={scoreClass(clip.viralScore)}>🔥 Viral Score: {clip.viralScore}/10</p>
            <p>🎬 Title: {clip.title}</p>
            <p>🪝 Hook: {clip.hook}</p>
            <p>😤 Emotion: {clip.emotion}</p>
            <p>💡 Why It'll Go Viral: {clip.rationale}</p>
            <details>
              <summary>Caption</summary>
              <pre>{clip.caption}</pre>
            </details>
            <button disabled={clip.status === 'approved'} onClick={() => onApprove(clip.id)}>
              {clip.status === 'approved' ? 'Approved' : 'Approve for Export'}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
