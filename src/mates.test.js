// Run with `npm test`.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mateNamed, crewMates, initials, strangers } from './mates.js';

const mates = [{ id: 'a', name: 'Lee', hcp: 12 }, { id: 'b', name: 'Max', hcp: 9 }];

test('a mate is found by name, ignoring case and spaces', () => {
  assert.equal(mateNamed(mates, ' lee ').id, 'a');
  assert.equal(mateNamed(mates, 'Jo'), null);
});

test('a crew lists its mates in order and skips removed ones', () => {
  assert.deepEqual(crewMates({ members: ['b', 'gone', 'a'] }, mates).map((m) => m.name), ['Max', 'Lee']);
});

test('initials for the crew badge', () => {
  assert.equal(initials('Saturday four-ball'), 'SF');
  assert.equal(initials('Work'), 'W');
});

test('after a round, only players who are not you and not mates are offered', () => {
  const user = { uid: 'u1', name: 'Saver' };
  const round = { players: ['Saver', 'Lee', 'Riaan', 'riaan', 'Sam'], hcps: [0, 12, 18, 18, 0], claims: { u1: 0 } };
  assert.deepEqual(strangers(round, mates, user), [{ p: 2, name: 'Riaan', hcp: 18 }, { p: 4, name: 'Sam', hcp: 0 }]);
});
