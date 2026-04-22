import { getTranscriptForVideo, transcriptFromText } from './transcript.js';
import { generateClipCopyWithGroq } from './groq.js';

const emotionLexicon = {
  shock: ['lost', 'never', 'poor', 'pain', 'collapse', 'broke'],
  inspiration: ['taught', 'master', 'deep work', 'discipline', 'focus'],
  controversy: ['most people', 'wrong', 'mock', 'nobody talks about'],
  revelation: ['secret', 'hidden', 'disguise', 'thermostat', 'truth'],
  motivation: ['before', 'start', 'scale', 'ambition', 'daily']
};

const MIN_CLIP_DURATION = 20;
const MAX_CLIP_DURATION = 59;
const DEFAULT_CLIP_COUNT = 10;

export function createAnalyzerService() {
  const store = new Map();
  const clipIndex = new Map();

  function saveVideo(video, clips) {
    const payload = { video, clips };
    store.set(video.id, payload);
    for (const clip of clips) {
      clipIndex.set(clip.id, { videoId: video.id, clipId: clip.id });
    }
    return payload;
  }

  return {
    async analyze(url) {
      const { video, segments } = await getTranscriptForVideo(url);
      const clips = await generateClips(segments, video.id);
      return saveVideo(video, clips);
    },
    async analyzeTranscript(input) {
      const { video, segments } = transcriptFromText(input);
      const clips = await generateClips(segments, video.id);
      return saveVideo(video, clips);
    },
    getVideo(videoId) {
      return store.get(videoId) ?? null;
    },
    approveClip(clipId) {
      const ref = clipIndex.get(clipId);
      if (!ref) throw new Error('Clip not found');
      const video = store.get(ref.videoId);
      const clip = video?.clips.find((item) => item.id === ref.clipId);
      if (!clip) throw new Error('Clip not found');
      clip.status = 'approved';
      return clip;
    },
    exportApproved(videoId) {
      const video = store.get(videoId);
      if (!video) throw new Error('Video not found');

      const approvedClips = video.clips.filter((clip) => clip.status === 'approved');
      return { video: video.video, approvedCount: approvedClips.length, clips: approvedClips };
    }
  };
}

async function generateClips(segments, videoId) {
  const candidates = await Promise.all(segments.map((segment) => buildClip(segment, videoId)));
  return candidates.sort((a, b) => b.viralScore - a.viralScore).slice(0, DEFAULT_CLIP_COUNT);
}

async function buildClip(segment, videoId) {
  const normalized = normalizeDuration(segment.start, segment.end);
  const score = scoreSegment(segment.text);
  const emotion = detectEmotion(segment.text);
  const amounts = extractMoneyClaims(segment.text);

  const fallback = {
    title: createTitle(segment.text, amounts),
    hook: createHook(segment.text),
    caption: createCaption(segment.text),
    emotion,
    rationale: createRationale(segment.text, amounts)
  };

  const ai = await generateClipCopyWithGroq({ text: segment.text });
  const packaged = {
    title: ai?.title?.slice(0, 60) || fallback.title,
    hook: ai?.hook || fallback.hook,
    caption: ai?.caption || fallback.caption,
    emotion: capitalize((ai?.emotion || fallback.emotion).toLowerCase()),
    rationale: ai?.rationale || fallback.rationale
  };

  return {
    id: randomId(),
    videoId,
    timestamp: `${formatSecond(normalized.start)} → ${formatSecond(normalized.end)}`,
    startSecond: normalized.start,
    endSecond: normalized.end,
    viralScore: score,
    ...packaged,
    status: 'pending'
  };
}

function normalizeDuration(start, end) {
  let clipStart = Math.max(0, Math.floor(start));
  let clipEnd = Math.max(clipStart + 1, Math.ceil(end));
  let duration = clipEnd - clipStart;

  if (duration < MIN_CLIP_DURATION) {
    clipEnd = clipStart + MIN_CLIP_DURATION;
    duration = MIN_CLIP_DURATION;
  }

  if (duration > MAX_CLIP_DURATION) {
    clipEnd = clipStart + MAX_CLIP_DURATION;
  }

  return { start: clipStart, end: clipEnd };
}

export function scoreSegment(text) {
  const value = text.toLowerCase();
  let score = 4;
  if (/\$\s?\d+|million|billion|cash flow|net worth/.test(value)) score += 3;
  if (/most people|never|wrong|mock|opposite/.test(value)) score += 1;
  if (/lost|pain|secret|hidden|thermostat|truth/.test(value)) score += 1;
  if (/deep work|discipline|morning|environment|focus/.test(value)) score += 1;
  return Math.max(1, Math.min(10, score));
}

function detectEmotion(text) {
  const value = text.toLowerCase();
  let best = 'motivation';
  let maxHits = -1;
  for (const [emotion, keywords] of Object.entries(emotionLexicon)) {
    const hits = keywords.filter((keyword) => value.includes(keyword)).length;
    if (hits > maxHits) {
      maxHits = hits;
      best = emotion;
    }
  }
  return capitalize(best);
}

function createTitle(text, amounts) {
  if (amounts.length) return `He Lost ${amounts[0]} and Said THIS...`;
  if (text.toLowerCase().includes('most people')) return 'The #1 Reason Poor People Stay Poor';
  if (text.toLowerCase().includes('morning')) return 'Billionaires Do THIS Every Morning';
  return 'What the Ultra-Wealthy Know That You Don’t';
}

function createHook(text) {
  if (text.toLowerCase().includes('most people')) return 'Most people will never be rich because...';
  if (text.toLowerCase().includes('lost')) return 'He lost everything and then did THIS...';
  return 'The wealth psychology nobody teaches...';
}

function createCaption(text) {
  return `Wealth is built in your mind before your bank account 💰\n\n${text}\n\nBillionaires think in leverage, time, and identity.\nMost people stay stuck chasing appearance over assets.\nChange your default patterns and results follow.\n\nWhat part hit you the hardest? 👇\n\n#wealth #mindset #billionaire #success #motivation #money #rich #entrepreneur #financialfreedom #hustle`;
}

function createRationale(text, amounts) {
  if (amounts.length) return 'Specific dollar references plus emotional stakes create stop-scroll attention.';
  if (/most people|poor/.test(text.toLowerCase())) return 'Contrarian framing triggers debate and comments.';
  return 'A concise mindset one-liner with authority tone drives retention.';
}

function extractMoneyClaims(text) {
  const matches = text.match(/\$\s?\d+[\d,.]*\s?[MBK]?|\d+[\d,.]*\s?(million|billion)/gi);
  return matches ? matches.slice(0, 2) : [];
}

function formatSecond(total) {
  const minute = Math.floor(total / 60).toString().padStart(2, '0');
  const second = (total % 60).toString().padStart(2, '0');
  return `${minute}:${second}`;
}

function capitalize(value) {
  if (!value) return 'Motivation';
  return value[0].toUpperCase() + value.slice(1);
}

function randomId() {
  return `clip_${Math.random().toString(36).slice(2, 10)}`;
}
