async function request(path, options = {}) {
  const response = await fetch(path, {
    headers: { 'Content-Type': 'application/json' },
    ...options
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.message ?? 'Request failed');
  }

  return response.json();
}

export const analyzeVideo = (url) => request('/api/analyze-video', { method: 'POST', body: JSON.stringify({ url }) });
export const analyzeTranscript = (text, title) => request('/api/analyze-transcript', { method: 'POST', body: JSON.stringify({ text, title }) });
export const fetchClips = (videoId) => request(`/api/videos/${videoId}/clips`);
export const approveClip = (clipId) => request(`/api/clips/${clipId}/approve`, { method: 'POST' });
export const exportVideo = (videoId) => request(`/api/export/${videoId}`, { method: 'POST' });
export const enqueueBatch = (urls) => request('/api/batch', { method: 'POST', body: JSON.stringify({ urls }) });
export const getBatchJob = (jobId) => request(`/api/jobs/${jobId}`);
export const renderVideo = (videoId, options) => request(`/api/render/${videoId}`, { method: 'POST', body: JSON.stringify(options) });
