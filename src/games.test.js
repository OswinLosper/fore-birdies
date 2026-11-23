// Run with `npm test`. The examples are the ones in plans/side-games/BRIEF.md.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { skins, nassau, betterBall, closest, matchText, sides, unavailable } from './games.js';

const round = (scores, extra = {}) => ({
  players: scores.map((_, i) => 'P' + i), pars: scores[0].map(() => 4), format: 'stroke', scores, ...extra,
});

test('skins: ties carry over, an outright win takes them all', () => {
  const r = round([[4, 5, 3, 5], [4, 5, 4, 4], [5, 5, 4, 6]]);
  const k = skins(r);
  assert.deepEqual(k.won, [3, 1, 0]);
  assert.deepEqual(k.holes.map((x) => x.winner), [-1, -1, 0, 1]);
  assert.equal(k.unclaimed, 0);
});

test('skins: a tied last hole leaves skins not won', () => {
  const k = skins(round([[4, 4], [5, 4]]));
  assert.deepEqual(k.won, [1, 0]);
  assert.equal(k.unclaimed, 1);
});

test('skins: an unscored hole holds up the ones after it', () => {
  const k = skins(round([[4, null, 3], [5, 4, 4]]));
  assert.equal(k.settled, 1);
  assert.equal(k.riding, 1);
  assert.deepEqual(k.won, [1, 0]);
});

test('skins: net scores with handicaps and a full stroke index', () => {
  const r = round([[5, 4], [4, 4]], { hcps: [2, 0], si: [1, 2] });
  // P0 gets a stroke on both holes: net 4 v 4 (tie), then net 3 v 4.
  assert.deepEqual(skins(r).won, [2, 0]);
});

test('nassau: the brief example, two players', () => {
  // Front 9: P0 wins 1, 3, 7; P1 wins 2, 9. Back 9: P1 wins 2 more holes.
  const a = [3, 5, 3, 4, 4, 4, 3, 4, 5, 4, 5, 4, 5, 4, 4, 4, 4, 4];
  const b = [4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4, 4];
  const r = round([a, b]);
  const [front, back, all] = nassau(r);
  assert.equal(front.winner, 0); assert.equal(front.up, 1);
  assert.equal(back.winner, 1); assert.equal(back.up, -2);
  assert.equal(all.winner, 1); assert.equal(all.up, -1);
  assert.equal(matchText(front, sides(r)), 'P0 won, 1 up');
});

test('nassau: running state and three players by total', () => {
  const r = round([[3, 4, ...Array(16).fill(null)], [4, 4, ...Array(16).fill(null)]]);
  assert.equal(matchText(nassau(r)[0], sides(r)), 'P0 1 up thru 2');
  const three = round([Array(18).fill(4), Array(18).fill(4), [...Array(17).fill(4), 3]]);
  const [front, back] = nassau(three);
  assert.equal(front.winner, -1);
  assert.equal(back.winner, 2);
  assert.deepEqual(back.totals, [36, 36, 35]);
});

test('better ball: Stableford takes the better points per hole', () => {
  // Par 4s. Team 0: P0 scores 5 (1 pt) and P1 scores 3 (3 pts) on hole 1.
  const r = round([[5, 4], [3, 6], [4, 4], [4, 4]], { format: 'stableford', games: { better: true }, teams: [[0, 1], [2, 3]] });
  const t = betterBall(r);
  assert.deepEqual(t.map((x) => [x.name, x.total]), [['P0 & P1', 5], ['P2 & P3', 4]]);
});

test('better ball: stroke play takes the lower score, and teams play the Nassau', () => {
  const r = round([[5, 4], [3, 6], [4, 4], [4, 5]], { games: { better: true }, teams: [[0, 1], [2, 3]] });
  assert.deepEqual(betterBall(r).map((x) => x.total), [7, 8]);
  assert.equal(sides(r).length, 2);
  assert.equal(nassau({ ...r, pars: Array(18).fill(4) })[0].up, 1);
});

test('closest to the pin counts par 3s, nobody, and ones not set', () => {
  const r = { players: ['A', 'B'], pars: [3, 4, 3, 3], ctp: { 0: 1, 2: -1 } };
  assert.deepEqual(closest(r), { won: [0, 1], open: 1 });
});

test('which games a setup allows', () => {
  const pars = [3, 4, 5];
  assert.equal(unavailable('nassau', { players: 2, holes: 9, pars }), 'Needs an 18-hole round.');
  assert.equal(unavailable('better', { players: 5, holes: 18, pars }), 'Needs 4, 6 or 8 players.');
  assert.equal(unavailable('ctp', { players: 3, holes: 9, pars: [4, 5] }), 'Needs a par 3.');
  assert.equal(unavailable('skins', { players: 1, holes: 18, pars }), 'Needs 2 or more players.');
  assert.equal(unavailable('better', { players: 4, holes: 9, pars }), null);
});
