import { getTranscriptForVideo } from './transcript.js';

const emotionLexicon = {
  shock: ['lost', 'never', 'poor', 'pain'],
  inspiration: ['taught', 'master', 'deep work', 'discipline'],
  controversy: ['most people', 'wrong', 'mock'],
  revelation: ['secret', 'hidden', 'disguise', 'thermostat'],
  motivation: ['before', 'start', 'scale', 'ambition']
};

export function createAnalyzerService() {
  const store = new Map();
  const clipIndex = new Map();

  return {
    async analyze(url) {
      const { video, segments } = await getTranscriptForVideo(url);
      const clips = generateClips(segments, video.id);
      const payload = {
        video: {
          id: video.id,
          title: video.title,
          sourceUrl: video.sourceUrl,
          durationSeconds: video.durationSeconds
        },
        clips
      };

      store.set(video.id, payload);
      for (const clip of clips) {
        clipIndex.set(clip.id, { videoId: video.id, clipId: clip.id });
      }

      return payload;
    },
    getVideo(videoId) {
      return store.get(videoId) ?? null;
    },
    approveClip(clipId) {
      const ref = clipIndex.get(clipId);
      if (!ref) {
        throw new Error('Clip not found');
      }

      const video = store.get(ref.videoId);
      const clip = video?.clips.find((item) => item.id === ref.clipId);
      if (!clip) {
        throw new Error('Clip not found');
      }
      clip.status = 'approved';
      return clip;
    },
    exportApproved(videoId) {
      const video = store.get(videoId);
      if (!video) {
        throw new Error('Video not found');
      }

      const approvedClips = video.clips.filter((clip) => clip.status === 'approved');
      return {
        video: video.video,
        approvedCount: approvedClips.length,
        clips: approvedClips
      };
    }
  };
}

function generateClips(segments, videoId) {
  return segments
    .map((segment) => buildClip(segment, videoId))
    .sort((a, b) => b.viralScore - a.viralScore)
    .slice(0, 7);
}

function buildClip(segment, videoId) {
  const score = scoreSegment(segment.text);
  const emotion = detectEmotion(segment.text);

  return {
    id: randomId(),
    videoId,
    timestamp: `${formatSecond(segment.start)} → ${formatSecond(segment.end)}`,
    startSecond: segment.start,
    endSecond: segment.end,
    viralScore: score,
    title: createTitle(segment.text),
    hook: createHook(segment.text),
    caption: createCaption(segment.text),
    emotion,
    rationale: createRationale(segment.text),
    status: 'pending'
  };
}

export function scoreSegment(text) {
  const value = text.toLowerCase();
  let score = 5;

  if (/\$|million|billion|cash flow/.test(value)) score += 2;
  if (/most people|never|wrong|mock/.test(value)) score += 1;
  if (/lost|pain|secret|hidden|thermostat/.test(value)) score += 1;
  if (/deep work|discipline|morning|environment/.test(value)) score += 1;

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

function createTitle(text) {
  if (text.includes('Most people')) return 'The #1 Reason Most People Stay Broke';
  if (text.includes('billionaire')) return 'A Billionaire Told Him THIS About Time';
  if (text.includes('lost 40 million')) return 'He Lost $40M and Learned This Rule';
  if (text.includes('self-image')) return 'Your Income Follows THIS Hidden Thermostat';
  return 'Ultra-Wealthy Habit Most People Ignore';
}

function createHook(text) {
  if (text.includes('Most people')) return 'Most people will never be rich because...';
  if (text.includes('lost 40 million')) return 'He lost $40M and this changed everything...';
  if (text.includes('self-image')) return 'Your money ceiling is in your mind...';
  return 'Billionaires think about money differently...';
}

function createCaption(text) {
  return `Wealth is a psychology game before it is a money game 💸\n\n${text}\n\nMost people ignore this and wonder why income stalls.\nShift identity, environment, and focus — then results follow.\n\nDo you agree with this take? 👇\n\n#wealth #mindset #billionaire #success #motivation #money #rich #entrepreneur #financialfreedom #hustle`;
}

function createRationale(text) {
  if (/lost|million|billion/.test(text.toLowerCase())) {
    return 'Specific money claims plus pain-driven lessons trigger high retention and comments.';
  }

  return 'Contrarian framing with a clean one-liner creates stop-scroll momentum and shareability.';
}

function formatSecond(total) {
  const minute = Math.floor(total / 60).toString().padStart(2, '0');
  const second = (total % 60).toString().padStart(2, '0');
  return `${minute}:${second}`;
}

function capitalize(value) {
  return value[0].toUpperCase() + value.slice(1);
}

function randomId() {
  return `clip_${Math.random().toString(36).slice(2, 10)}`;
}
