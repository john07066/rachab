import test from 'node:test';
import assert from 'node:assert/strict';
import { createAnalyzerService, scoreSegment } from '../services/analyzer.js';

test('scoreSegment rewards money-specific and contrarian statements', () => {
  const high = scoreSegment('I lost 40 million dollars and most people ignore cash flow.');
  const low = scoreSegment('This is a normal sentence without special hooks.');

  assert.ok(high > low);
  assert.ok(high >= 8);
});

test('manual transcript analysis returns 5-7 clips', () => {
  const analyzer = createAnalyzerService();
  const result = analyzer.analyzeTranscript({
    title: 'Demo',
    text: [
      'Most people stay poor because they chase status.',
      'I lost 12 million and rebuilt from scratch.',
      'Billionaires buy time first and protect focus.',
      'Your self-image controls your income ceiling.',
      'Cash flow discipline beats ego spending.',
      'Your environment can tax your ambition.',
      'The morning deep work block changes everything.',
      'Master one income engine before scaling.'
    ].join('\n')
  });

  assert.ok(result.clips.length >= 5 && result.clips.length <= 7);
  assert.equal(result.video.title, 'Demo');
});
