import { received, stablefordPoints } from './scoring.js';

// Side games played on top of the main format. A round carries:
//   games = { skins, nassau, better, ctp }   which ones are on
//   teams = [[p, p], ...]                     better ball pairs (player indexes)
//   ctp   = { [hole]: p }                     closest to the pin per par 3, -1 = nobody on the green
// Everything else is worked out from the scores. A hole only counts once every player
// involved has a score on it: nothing is decided on a guess.

export const GAMES = ['skins', 'nassau', 'better', 'ctp'];
export const GAME_NAMES = { skins: 'Skins', nassau: 'Nassau', better: 'Better ball', ctp: 'Closest to the pin' };

export const par3s = (r) => r.pars.map((p, h) => (p === 3 ? h : -1)).filter((h) => h >= 0);

// Why a game can't be played with this setup, or null when it can.
export function unavailable(game, { players, holes, pars }) {
  if (players < 2) return 'Needs 2 or more players.';
  if (game === 'nassau' && holes !== 18) return 'Needs an 18-hole round.';
  if (game === 'better' && (players < 4 || players % 2)) return 'Needs 4, 6 or 8 players.';
  if (game === 'ctp' && !pars.includes(3)) return 'Needs a par 3.';
  return null;
}

export const on = (r, game) => !!r.games?.[game];
const usesTeams = (r) => on(r, 'better') && r.teams?.length >= 2;

// Score after handicap strokes on this hole (the plain score without a full stroke index).
export function netScore(r, p, h) {
  const s = r.scores[p][h];
  return s == null ? null : s - received(r, p, h);
}

// A side is one player, or a better ball team. Its value on a hole is lower-is-better:
// the best net score, or in Stableford the best points (negated).
export function sides(r) {
  if (usesTeams(r)) return r.teams.map((t) => ({ name: t.map((p) => r.players[p]).join(' & '), players: t }));
  return r.players.map((name, p) => ({ name, players: [p] }));
}
function sideValue(r, side, h) {
  if (side.players.some((p) => r.scores[p][h] == null)) return null;
  if (r.format === 'stableford') {
    return -Math.max(...side.players.map((p) => stablefordPoints(r.scores[p][h], r.pars[h], received(r, p, h))));
  }
  return Math.min(...side.players.map((p) => netScore(r, p, h)));
}

// Skins, always player against player. Holes are settled in order, because a tie carries
// the skin to the next hole: a hole after an unscored one waits until that one is in.
export function skins(r) {
  const won = r.players.map(() => 0);
  const holes = [];
  let carry = 0, settled = 0;
  for (let h = 0; h < r.pars.length; h++) {
    const nets = r.players.map((_, p) => netScore(r, p, h));
    if (nets.some((x) => x == null)) break;
    const best = Math.min(...nets);
    const at = nets.filter((x) => x === best).length === 1 ? nets.indexOf(best) : -1;
    const value = carry + 1;
    holes.push({ h, winner: at, value });
    if (at >= 0) { won[at] += value; carry = 0; } else carry = value;
    settled = h + 1;
  }
  const finished = settled === r.pars.length;
  // riding: skins on the next hole to settle. unclaimed: still carrying after the last hole.
  return { won, holes, settled, riding: finished ? 0 : carry + 1, unclaimed: finished ? carry : 0 };
}

export const NASSAU = [
  { key: 'front', name: 'Front 9', from: 0, to: 9 },
  { key: 'back', name: 'Back 9', from: 9, to: 18 },
  { key: 'all', name: 'Overall', from: 0, to: 18 },
];

// Two sides: match play, holes won. Three or more: lowest total over the stretch.
// winner: side index, -1 halved, null not finished.
export function nassau(r) {
  const s = sides(r);
  return NASSAU.map((seg) => {
    const vals = [];
    for (let h = seg.from; h < seg.to; h++) vals.push(s.map((side) => sideValue(r, side, h)));
    const done = vals.filter((v) => v.every((x) => x != null));
    const finished = done.length === seg.to - seg.from;
    if (s.length === 2) {
      // up > 0: the first side is ahead.
      const up = done.reduce((a, [x, y]) => a + (x < y ? 1 : x > y ? -1 : 0), 0);
      return { ...seg, match: true, up, thru: done.length, winner: !finished ? null : up > 0 ? 0 : up < 0 ? 1 : -1 };
    }
    const totals = s.map((_, i) => done.reduce((a, v) => a + v[i], 0));
    const best = Math.min(...totals);
    const leaders = totals.map((t, i) => (t === best ? i : -1)).filter((i) => i >= 0);
    return {
      ...seg, match: false, thru: done.length,
      // Shown the right way up: strokes, or Stableford points.
      totals: totals.map((t) => (r.format === 'stableford' ? -t : t)),
      winner: !finished ? null : leaders.length === 1 ? leaders[0] : -1,
    };
  });
}

// "Sam 2 up thru 6", "All square thru 4".
export function matchText(seg, s) {
  if (!seg.thru) return 'Not started';
  const state = seg.up === 0 ? 'All square' : s[seg.up > 0 ? 0 : 1].name + ' ' + Math.abs(seg.up) + ' up';
  if (seg.winner === null) return state + ' thru ' + seg.thru;
  return seg.winner === -1 ? 'Halved' : s[seg.winner].name + ' won, ' + Math.abs(seg.up) + ' up';
}

// Better ball team totals: points in Stableford, net strokes otherwise. Best first.
export function betterBall(r) {
  const stab = r.format === 'stableford';
  return sides(r).map((side, t) => {
    let total = 0, holes = 0, par = 0;
    r.pars.forEach((p, h) => {
      const v = sideValue(r, side, h);
      if (v == null) return;
      total += stab ? -v : v; par += p; holes++;
    });
    return { t, name: side.name, total, holes, diff: total - par };
  }).sort((a, b) => (stab ? b.total - a.total : a.total - b.total));
}

// Closest to the pin wins per player, and how many par 3s are still to be set.
export function closest(r) {
  const won = r.players.map(() => 0);
  let open = 0;
  par3s(r).forEach((h) => {
    const p = r.ctp?.[h];
    if (p == null) open++;
    else if (p >= 0) won[p]++;
  });
  return { won, open };
}

// Lines for the share message.
export function gamesText(r) {
  const lines = [];
  if (on(r, 'skins')) {
    const k = skins(r);
    lines.push('Skins: ' + r.players.map((n, p) => n + ' ' + k.won[p]).join(', ')
      + (k.unclaimed ? ' (' + k.unclaimed + ' not won)' : ''));
  }
  if (on(r, 'nassau')) {
    const s = sides(r);
    lines.push('Nassau: ' + nassau(r).map((seg) => seg.name + ' '
      + (seg.winner === null ? 'not finished' : seg.winner === -1 ? 'halved' : s[seg.winner].name)).join(', '));
  }
  if (usesTeams(r)) {
    const stab = r.format === 'stableford';
    lines.push('Better ball: ' + betterBall(r).map((x) => x.name + ' ' + x.total + (stab ? ' pts' : '')).join(', '));
  }
  if (on(r, 'ctp')) {
    const c = closest(r);
    lines.push('Closest to the pin: ' + (c.won.some((x) => x)
      ? r.players.map((n, p) => (c.won[p] ? n + ' ' + c.won[p] : null)).filter(Boolean).join(', ') : 'nobody yet'));
  }
  return lines;
}
