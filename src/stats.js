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
    form: form(full),
    halves: halves(full),
    blowups: blowups(mine),
    streak: streak(mine),
    mostBirdies: mostBirdies(mine),
    courses: byCourse(mine),
  };
}

const where = ({ r }) => ({ course: r.course, date: r.date });

// Your last 10 rounds of 18 holes, oldest first, and the last 5 against your usual
// (once there are more than 5 to compare with).
function form(full) {
  if (full.length < 2) return null;
  const all = full.map((x) => x.st.strokes);
  const usual = avg(all);
  return {
    last10: full.slice(0, 10).reverse().map((x) => x.st.strokes),
    usual,
    last5: full.length > 5 ? avg(all.slice(0, 5)) : null,
  };
}

// Front 9 against back 9, averaged over rounds of 18 holes.
function halves(full) {
  if (!full.length) return null;
  const half = (from) => {
    const strokes = avg(full.map(({ r, p }) => r.scores[p].slice(from, from + 9).reduce((a, b) => a + b, 0)));
    const par = avg(full.map(({ r }) => r.pars.slice(from, from + 9).reduce((a, b) => a + b, 0)));
    return { strokes, diff: strokes - par };
  };
  return { front: half(0), back: half(9) };
}

// Triple bogey or worse: how often, and the shots a round they cost over a double bogey.
function blowups(mine) {
  let holes = 0, count = 0, extra = 0;
  mine.forEach(({ r, p }) => r.pars.forEach((par, h) => {
    const over = r.scores[p][h] - par;
    holes++;
    if (over >= 3) { count++; extra += over - 2; }
  }));
  return { count, oneIn: count ? Math.round(holes / count) : null, perRound: mine.length ? extra / mine.length : 0 };
}

// Most holes in a row at par or better, within one round.
function streak(mine) {
  let top = null;
  mine.forEach((x) => {
    let run = 0;
    x.r.pars.forEach((par, h) => {
      run = x.r.scores[x.p][h] <= par ? run + 1 : 0;
      if (run > 0 && (!top || run > top.holes)) top = { holes: run, ...where(x) };
    });
  });
  return top;
}

function mostBirdies(mine) {
  return mine.reduce((top, x) => {
    const n = x.r.pars.filter((par, h) => x.r.scores[x.p][h] < par).length;
    return n > 0 && (!top || n > top.birdies) ? { birdies: n, ...where(x) } : top;
  }, null);
}

// Each course you've played, most rounds first. Averages and best use 18-hole rounds
// where there are any, otherwise all of them. Holes are ranked by average strokes to par.
function byCourse(mine) {
  const groups = new Map();
  mine.forEach((x) => {
    const key = x.r.course.trim().toLowerCase();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(x);
  });
  return [...groups.values()].map((list) => {
    const full = list.filter((x) => x.r.pars.length === 18);
    const scored = (full.length ? full : list).map((x) => ({ ...x, st: roundStats(x.r, x.p) }));
    const holes = [];
    list.forEach(({ r, p }) => r.pars.forEach((par, h) => {
      holes[h] = holes[h] || { hole: h + 1, par, s: [], d: [] };
      holes[h].s.push(r.scores[p][h]);
      holes[h].d.push(r.scores[p][h] - par);
    }));
    const ranked = holes.map((x) => ({ hole: x.hole, par: x.par, avg: avg(x.s), diff: avg(x.d) }))
      .sort((a, b) => a.diff - b.diff || a.hole - b.hole);
    const birdieHoles = {};
    list.forEach(({ r, p }) => r.pars.forEach((par, h) => { if (r.scores[p][h] < par) birdieHoles[h + 1] = (birdieHoles[h + 1] || 0) + 1; }));
    const topBirdie = Object.entries(birdieHoles).sort((a, b) => b[1] - a[1])[0];
    const bestRound = best(scored, (a, b) => a.st.strokes < b.st.strokes);
    return {
      name: list[0].r.course.trim(),
      rounds: list.length,
      last: list[0].r.date,
      holes: full.length ? 18 : scored[0].r.pars.length,
      avg: avg(scored.map((x) => x.st.strokes)),
      avgDiff: avg(scored.map((x) => x.st.diff)),
      best: { strokes: bestRound.st.strokes, date: bestRound.r.date },
      birdies: Object.values(birdieHoles).reduce((a, b) => a + b, 0),
      topBirdie: topBirdie && topBirdie[1] > 1 ? { hole: Number(topBirdie[0]), count: topBirdie[1] } : null,
      bestHoles: ranked.slice(0, 3),
      worstHoles: ranked.slice(-3).reverse(),
    };
  }).sort((a, b) => b.rounds - a.rounds || a.name.localeCompare(b.name));
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
