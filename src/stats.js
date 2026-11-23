import { stats as roundStats, hasHcp } from './scoring.js';

// Your stats across rounds. A round counts once it's finished and you're on its card:
// the player you picked when you joined, or, for a round you started without picking,
// the player with your name. Rounds you're only keeping score for don't count.
// Mates are matched by name (typed names have no account behind them).

export function myPlayer(r, user) {
  const p = r.claims?.[user.uid];
  if (p != null) return p;
  if (r.ownerId !== user.uid || !user.name) return null;
  const i = r.players.findIndex((n) => same(n, user.name));
  return i >= 0 ? i : null;
}

const same = (a, b) => a.trim().toLowerCase() === b.trim().toLowerCase();

export const PERIODS = { all: 'All time', year: 'This year' };
const inPeriod = (date, period, now) => period !== 'year' || new Date(date).getFullYear() === new Date(now).getFullYear();

// The finished rounds you played, newest first.
export function myRounds(rounds, user, period = 'all', now = Date.now()) {
  return rounds
    .filter((r) => r.done && inPeriod(r.date, period, now))
    .map((r) => ({ r, p: myPlayer(r, user) }))
    .filter((x) => x.p != null && roundStats(x.r, x.p).played === x.r.pars.length)
    .sort((a, b) => b.r.date - a.r.date);
}

const avg = (xs) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
const best = (xs, better) => xs.reduce((a, x) => (a == null || better(x, a) ? x : a), null);

// How one hole went, from strokes to par: eagle or better, birdie, par, bogey, double or worse.
export const KINDS = ['eagle', 'birdie', 'par', 'bogey', 'double'];
export const KIND_NAMES = { eagle: 'Eagle +', birdie: 'Birdie', par: 'Par', bogey: 'Bogey', double: 'Double +' };
const kind = (d) => (d <= -2 ? 'eagle' : d === -1 ? 'birdie' : d === 0 ? 'par' : d === 1 ? 'bogey' : 'double');

export function myStats(rounds, user, period = 'all', now = Date.now()) {
  const mine = myRounds(rounds, user, period, now);
  const played = mine.map(({ r, p }) => ({ r, p, st: roundStats(r, p), holes: r.pars.length }));
  const full = played.filter((x) => x.holes === 18);
  const nine = played.filter((x) => x.holes === 9);

  const kinds = Object.fromEntries(KINDS.map((k) => [k, 0]));
  const byPar = { 3: [], 4: [], 5: [] };
  let holes = 0;
  mine.forEach(({ r, p }) => r.pars.forEach((par, h) => {
    const s = r.scores[p][h];
    kinds[kind(s - par)]++;
    holes++;
    if (byPar[par]) byPar[par].push(s);
  }));

  const month = new Date(now);
  const stab = played.filter((x) => x.r.format === 'stableford');
  const bestOf = (list, key, better) => best(list, (a, b) => better(key(a), key(b)));
  const bestRound = bestOf(full.length ? full : nine, (x) => x.st.strokes, (a, b) => a < b);
  const bestStab = bestOf(stab.filter((x) => x.holes === 18).length ? stab.filter((x) => x.holes === 18) : stab, (x) => x.st.pts, (a, b) => a > b);

  return {
    rounds: played.length,
    thisMonth: played.filter((x) => {
      const d = new Date(x.r.date);
      return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
    }).length,
    avg18: avg(full.map((x) => x.st.strokes)),
    avg18Par: avg(full.map((x) => x.st.diff)),
    avg9: avg(nine.map((x) => x.st.strokes)),
    best: bestRound && { strokes: bestRound.st.strokes, diff: bestRound.st.diff, holes: bestRound.holes, course: bestRound.r.course, date: bestRound.r.date },
    bestStab: bestStab && { pts: bestStab.st.pts, holes: bestStab.holes, course: bestStab.r.course, date: bestStab.r.date },
    holes,
    kinds,
    byPar: Object.fromEntries(Object.entries(byPar).filter(([, xs]) => xs.length).map(([par, xs]) => [par, avg(xs)])),
    birdies: kinds.birdie + kinds.eagle,
    eagles: kinds.eagle,
    h2h: headToHead(mine),
  };
}

// The number each player is judged on in a round, lower is better: Stableford points
// (negated), net to par with handicaps, otherwise strokes to par.
function result(r, p) {
  const st = roundStats(r, p);
  if (r.format === 'stableford') return { v: -st.pts, text: st.pts + ' pts' };
  if (hasHcp(r)) return { v: st.netDiff, text: 'net ' + st.netStrokes, net: true };
  return { v: st.diff, text: String(st.strokes) };
}

// Your record against each mate you've played with, most rounds together first.
export function headToHead(mine) {
  const mates = new Map();
  mine.forEach(({ r, p }) => {
    const me = result(r, p);
    r.players.forEach((name, q) => {
      if (q === p || same(name, r.players[p])) return;
      const key = name.trim().toLowerCase();
      const m = mates.get(key) || { name: name.trim(), won: 0, lost: 0, tied: 0, rounds: [] };
      const them = result(r, q);
      const outcome = me.v < them.v ? 'won' : me.v > them.v ? 'lost' : 'tied';
      m[outcome]++;
      m.rounds.push({ id: r.id, course: r.course, date: r.date, me: me.text, them: them.text, outcome });
      mates.set(key, m);
    });
  });
  return [...mates.values()].sort((a, b) => b.rounds.length - a.rounds.length || a.name.localeCompare(b.name));
}

// "You 4 – 2 · 1 tie"
export function recordText(m) {
  return (m.won !== m.lost ? 'You ' : '') + m.won + ' – ' + m.lost + (m.tied ? ' · ' + m.tied + (m.tied === 1 ? ' tie' : ' ties') : '');
}
