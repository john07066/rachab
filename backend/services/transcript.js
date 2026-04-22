const mockTranscript = [
  { start: 12, end: 38, text: 'Most people stay poor because they optimize for looking rich, not becoming rich.' },
  { start: 40, end: 72, text: 'A billionaire taught me this: your calendar is your bank account in disguise.' },
  { start: 77, end: 102, text: 'I lost 40 million dollars in one year, and that pain taught me cash flow beats ego.' },
  { start: 110, end: 145, text: 'The ultra-wealthy buy time first. They hire before they feel ready.' },
  { start: 160, end: 189, text: 'If your friends mock your ambition, your environment is silently taxing your income.' },
  { start: 196, end: 226, text: 'My morning starts with 90 minutes of deep work before I touch my phone.' },
  { start: 230, end: 265, text: 'Most people chase seven streams of income. Millionaires master one before scaling.' },
  { start: 270, end: 302, text: 'Your self-image sets your financial thermostat. Until it changes, your income snaps back.' }
];

export async function getTranscriptForVideo(url) {
  if (!url || typeof url !== 'string') {
    throw new Error('A valid YouTube URL is required');
  }

  const videoId = extractVideoId(url);

  if (videoId) {
    const transcript = await tryFetchYouTubeTranscript(videoId);
    if (transcript.length > 0) {
      return {
        video: {
          id: videoId,
          title: `YouTube Video ${videoId}`,
          durationSeconds: transcript[transcript.length - 1].end,
          sourceUrl: url
        },
        segments: transcript
      };
    }
  }

  const id = videoId ?? `local-${Math.abs(hashString(url))}`;
  return {
    video: {
      id,
      title: 'Psychology of Ultra-Wealth: Hidden Rules',
      durationSeconds: 302,
      sourceUrl: url
    },
    segments: mockTranscript
  };
}

export function transcriptFromText({ text, title = 'Manual Transcript', sourceUrl = 'manual://transcript' }) {
  if (!text || typeof text !== 'string') {
    throw new Error('Transcript text is required');
  }

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 3) {
    throw new Error('Provide at least 3 transcript lines');
  }

  const segments = lines.map((line, index) => {
    const start = index * 28;
    const end = start + 24;
    return { start, end, text: line.replace(/^\[?\d\d:\d\d\]?\s*/, '') };
  });

  return {
    video: {
      id: `manual-${Math.abs(hashString(text)).toString(36)}`,
      title,
      durationSeconds: segments[segments.length - 1].end,
      sourceUrl
    },
    segments
  };
}

function extractVideoId(url) {
  const watchMatch = url.match(/[?&]v=([\w-]{6,})/);
  if (watchMatch) return watchMatch[1];

  const shortMatch = url.match(/youtu\.be\/([\w-]{6,})/);
  if (shortMatch) return shortMatch[1];

  return null;
}

async function tryFetchYouTubeTranscript(videoId) {
  try {
    const endpoint = `https://youtubetranscript.com/?server_vid2=${videoId}`;
    const response = await fetch(endpoint);
    if (!response.ok) return [];
    const payload = await response.json();
    if (!Array.isArray(payload?.transcript)) return [];

    return payload.transcript
      .map((item) => ({
        start: Math.max(0, Math.floor(Number(item.start) || 0)),
        end: Math.max(1, Math.ceil((Number(item.start) || 0) + (Number(item.duration) || 4))),
        text: String(item.text || '').replace(/\s+/g, ' ').trim()
      }))
      .filter((item) => item.text.length > 0);
  } catch {
    return [];
  }
}

function hashString(value) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
