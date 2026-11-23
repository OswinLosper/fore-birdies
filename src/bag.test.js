// Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hitting, pickClub } from './bag.js';

const bag = {
  driver: { on: true, m: 210 }, '5w': { on: false, m: 185 }, '7i': { on: true, m: 145 },
  '8i': { on: true, m: 135 }, pw: { on: true, m: 110 }, lw: { on: true, m: null },
};

test('only clubs in the bag with a distance count, longest first', () => {
  assert.deepEqual(hitting(bag).map((c) => c.k), ['driver', '7i', '8i', 'pw']);
  assert.deepEqual(hitting({}), []);
});

test('the closest club, and the next one past the distance', () => {
  const p = pickClub(bag, 142);
  assert.equal(p.club.k, '7i');
  assert.equal(p.other.k, '8i');
  assert.equal(pickClub(bag, 138).club.k, '8i');
  assert.equal(pickClub(bag, 138).other.k, '7i');
  assert.equal(p.tooFar, false);
});

test('past the longest club or short of the shortest', () => {
  assert.equal(pickClub(bag, 260).club.k, 'driver');
  assert.equal(pickClub(bag, 260).tooFar, true);
  assert.equal(pickClub(bag, 60).club.k, 'pw');
  assert.equal(pickClub(bag, 60).tooShort, true);
  assert.equal(pickClub({}, 100), null);
});
