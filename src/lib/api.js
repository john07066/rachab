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

export function analyzeVideo(url) {
  return request('/api/analyze-video', {
    method: 'POST',
    body: JSON.stringify({ url })
  });
}

export function fetchClips(videoId) {
  return request(`/api/videos/${videoId}/clips`);
}

export function approveClip(clipId) {
  return request(`/api/clips/${clipId}/approve`, {
    method: 'POST'
  });
}

export function exportVideo(videoId) {
  return request(`/api/export/${videoId}`, {
    method: 'POST'
  });
}
