// Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { myPlayer, myRounds, myStats, recordText } from './stats.js';

const me = { uid: 'u1', name: 'Saver' };
const NOW = new Date('2026-11-23T10:00:00').getTime();
let n = 0;
const round = (players, scores, extra = {}) => ({
  id: 'r' + n++, ownerId: 'u1', claims: { u1: 0 }, course: 'Bellville', format: 'stroke', done: true,
  date: NOW - 1000, players, pars: scores[0].map(() => 4), scores, ...extra,
});

test('which player is you', () => {
  assert.equal(myPlayer(round(['Lee', 'Saver'], [[4], [4]], { claims: { u1: 1 } }), me), 1);
  // Started it without picking: matched by name.
  assert.equal(myPlayer(round(['Lee', 'saver '], [[4], [4]], { claims: {} }), me), 1);
  // Someone else's round you only keep score for.
  assert.equal(myPlayer(round(['Lee'], [[4]], { ownerId: 'u2', claims: {} }), me), null);
});

test('only finished rounds you played count, and this year only when asked', () => {
  const rounds = [
    round(['Saver'], [[4, 5]]),
    round(['Saver'], [[4, 5]], { done: false }),
    round(['Saver'], [[4, null]]),
    round(['Saver'], [[4, 5]], { date: new Date('2025-06-01').getTime() }),
  ];
  assert.equal(myRounds(rounds, me, 'all', NOW).length, 2);
  assert.equal(myRounds(rounds, me, 'year', NOW).length, 1);
});

test('averages keep 18 and 9 holes apart, and hole kinds add up', () => {
  const r18 = round(['Saver'], [[2, 3, 4, 5, 6, ...Array(13).fill(4)]]);
  const r9 = round(['Saver'], [Array(9).fill(5)]);
  const s = myStats([r18, r9], me, 'all', NOW);
  assert.equal(s.rounds, 2);
  assert.equal(s.avg18, 72);
  assert.equal(s.avg9, 45);
  assert.deepEqual(s.kinds, { eagle: 1, birdie: 1, par: 14, bogey: 10, double: 1 });
  assert.equal(s.birdies, 2);
  assert.equal(s.holes, 27);
  assert.equal(s.best.strokes, 72);
});

test('best Stableford and average by par', () => {
  const a = round(['Saver'], [[3, 4]], { format: 'stableford', pars: [3, 4] });
  const b = round(['Saver'], [[4, 6]], { format: 'stableford', pars: [3, 4] });
  const s = myStats([a, b], me, 'all', NOW);
  assert.equal(s.bestStab.pts, 4);
  assert.deepEqual(s.byPar, { 3: 3.5, 4: 5 });
});

test('head to head: points, net, gross, and the record text', () => {
  const rounds = [
    round(['Saver', 'Lee'], [[4, 4], [5, 4]]),
    round(['Saver', 'Lee'], [[5, 5], [4, 4]]),
    round(['Saver', 'Lee', 'Max'], [[4, 4], [4, 4], [3, 4]], { format: 'stableford' }),
    // Net: Saver gets a stroke on both holes.
    round(['Saver', 'lee'], [[5, 5], [4, 4]], { hcps: [2, 0], si: [1, 2] }),
  ];
  const [lee, max] = myStats(rounds, me, 'all', NOW).h2h;
  assert.equal(lee.name, 'Lee');
  assert.deepEqual([lee.won, lee.lost, lee.tied], [1, 1, 2]);
  assert.equal(recordText(lee), '1 – 1 · 2 ties');
  assert.equal(max.lost, 1);
  assert.equal(recordText(max), 'You 0 – 1');
  assert.ok(lee.rounds.some((x) => x.me === 'net 8'));
});

test('form: last 10 rounds of 18, oldest first, and last 5 against your usual', () => {
  const rounds = [90, 92, 94, 96, 98, 100].map((total, i) => round(['Saver'], [[total - 17 * 5, ...Array(17).fill(5)]], { date: NOW - 1000 * (10 - i) }));
  const f = myStats(rounds, me, 'all', NOW).form;
  assert.deepEqual(f.last10, [90, 92, 94, 96, 98, 100]);
  assert.equal(f.usual, 95);
  assert.equal(f.last5, 96);
  // Too few rounds of 18 to compare.
  assert.equal(myStats(rounds.slice(0, 1), me, 'all', NOW).form, null);
  assert.equal(myStats(rounds.slice(0, 3), me, 'all', NOW).form.last5, null);
});

test('front 9 against back 9, blow-up holes and streaks', () => {
  const r = round(['Saver'], [[4, 4, 3, 4, 7, 4, 4, 4, 4, 5, 5, 5, 5, 5, 5, 5, 5, 9]], { course: 'Bellville' });
  const s = myStats([r], me, 'all', NOW);
  assert.deepEqual(s.halves.front, { strokes: 38, diff: 2 });
  assert.deepEqual(s.halves.back, { strokes: 49, diff: 13 });
  // Holes 5 (+3) and 18 (+5): one in 9, costing 1 + 3 shots over a double.
  assert.deepEqual(s.blowups, { count: 2, oneIn: 9, perRound: 4 });
  assert.equal(s.streak.holes, 4);
  assert.equal(s.mostBirdies.birdies, 1);
});

test('by course: rounds, average, best and best and worst holes', () => {
  const a = round(['Saver'], [[3, 5, 6, 4, 4, 4, 4, 4, 4]], { course: 'Bellville', date: NOW - 2000 });
  const b = round(['Saver'], [[3, 5, 4, 4, 4, 4, 4, 4, 4]], { course: 'bellville ', date: NOW - 1000 });
  const c = round(['Saver'], [Array(9).fill(5)], { course: 'Milnerton' });
  const [bell, miln] = myStats([a, b, c], me, 'all', NOW).courses;
  assert.equal(bell.name, 'bellville');
  assert.equal(bell.rounds, 2);
  assert.equal(bell.avg, 37);
  assert.equal(bell.best.strokes, 36);
  assert.deepEqual(bell.topBirdie, { hole: 1, count: 2 });
  assert.equal(bell.bestHoles[0].hole, 1);
  assert.deepEqual(bell.worstHoles.map((x) => x.hole), [3, 2, 9]);
  assert.equal(miln.rounds, 1);
});
