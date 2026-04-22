export function createBatchQueue({ analyzer }) {
  const jobs = new Map();
  let running = false;

  async function processQueue() {
    if (running) return;
    running = true;

    try {
      const next = [...jobs.values()].find((job) => job.status === 'queued');
      if (!next) return;
      next.status = 'processing';

      for (const url of next.urls) {
        try {
          const result = await analyzer.analyze(url);
          next.results.push({ url, ok: true, videoId: result.video.id, clipCount: result.clips.length });
        } catch (error) {
          next.results.push({ url, ok: false, error: error.message });
        }
      }

      next.status = 'completed';
      next.completedAt = new Date().toISOString();
    } finally {
      running = false;
      const pending = [...jobs.values()].some((job) => job.status === 'queued');
      if (pending) setTimeout(processQueue, 50);
    }
  }

  return {
    enqueue(urls) {
      const id = `job_${Math.random().toString(36).slice(2, 10)}`;
      jobs.set(id, {
        id,
        status: 'queued',
        urls,
        results: [],
        createdAt: new Date().toISOString(),
        completedAt: null
      });
      void processQueue();
      return jobs.get(id);
    },
    getJob(id) {
      return jobs.get(id) ?? null;
    }
  };
}
