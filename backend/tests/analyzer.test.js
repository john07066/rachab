import test from 'node:test';
import assert from 'node:assert/strict';
import { scoreSegment } from '../services/analyzer.js';

test('scoreSegment rewards money-specific and contrarian statements', () => {
  const high = scoreSegment('I lost 40 million dollars and most people ignore cash flow.');
  const low = scoreSegment('This is a normal sentence without special hooks.');

  assert.ok(high > low);
  assert.ok(high >= 8);
});
