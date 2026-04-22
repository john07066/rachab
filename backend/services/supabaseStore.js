const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

function enabled() {
  return Boolean(SUPABASE_URL && SUPABASE_KEY);
}

async function request(path, payload) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method: 'POST',
    headers: {
      apikey: SUPABASE_KEY,
      Authorization: `Bearer ${SUPABASE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Supabase write failed: ${text}`);
  }
}

export async function persistAnalysis({ video, clips }) {
  if (!enabled()) return;

  await request('videos', {
    id: video.id,
    source_url: video.sourceUrl,
    title: video.title,
    duration_seconds: video.durationSeconds,
    niche: 'wealth'
  });

  await request('clip_candidates', clips.map((clip) => ({
    id: clip.id,
    video_id: video.id,
    start_second: clip.startSecond,
    end_second: clip.endSecond,
    viral_score: clip.viralScore,
    title: clip.title,
    hook: clip.hook,
    caption: clip.caption,
    emotion: clip.emotion,
    rationale: clip.rationale,
    status: clip.status
  })));
}

export async function persistExport({ videoId, approvedCount, payload }) {
  if (!enabled()) return;
  await request('exports', {
    video_id: videoId,
    approved_count: approvedCount,
    payload
  });
}
