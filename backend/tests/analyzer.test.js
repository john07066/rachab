import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnalyzerService, scoreSegment } from '../services/analyzer.js';

test('scoreSegment rewards money-specific and contrarian statements', () => {
  const high = scoreSegment('I lost 40 million dollars and most people ignore cash flow.');
  const low = scoreSegment('This is a normal sentence without special hooks.');

  assert.ok(high > low);
  assert.ok(high >= 8);
});

test('manual transcript analysis returns <=10 clips in 20-59 second windows', async () => {
  const analyzer = createAnalyzerService();
  const result = await analyzer.analyzeTranscript({
    title: 'Demo',
    text: Array.from({ length: 12 }, (_, i) => `Most people ignore lesson ${i + 1} about money and focus.`).join('\n')
  });

  assert.ok(result.clips.length <= 10);
  assert.equal(result.video.title, 'Demo');

  for (const clip of result.clips) {
    const duration = clip.endSecond - clip.startSecond;
    assert.ok(duration >= 20 && duration <= 59);
  }
});
