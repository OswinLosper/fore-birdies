// Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { centreSquare } from './photo.js';

test('a photo is cut to the biggest centred square', () => {
  assert.deepEqual(centreSquare(4000, 3000), { x: 500, y: 0, size: 3000 });
  assert.deepEqual(centreSquare(1080, 1920), { x: 0, y: 420, size: 1080 });
  assert.deepEqual(centreSquare(500, 500), { x: 0, y: 0, size: 500 });
});
