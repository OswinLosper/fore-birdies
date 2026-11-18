// "1 pt", "3 pts".
export const pts = (n) => n + (n === 1 ? ' pt' : ' pts');

export function toPar(n) {
  return n === 0 ? 'E' : n > 0 ? '+' + n : '−' + Math.abs(n);
}

// Stableford: 2 for a net par, +1 per stroke under, never below 0. `extra` is the handicap
// strokes this player gets on the hole (0 without handicaps).
export function stablefordPoints(s, par, extra = 0) {
  return Math.max(0, 2 + par + extra - s);
}

// Handicaps: r.hcps[p] is each player's playing handicap, r.si[h] each hole's stroke index.
export const hasHcp = (r) => !!r.hcps?.some((x) => x > 0);

// Handicap strokes a player gets on a hole: the hardest holes (lowest stroke index among the
// holes being played) get one first, then round again past the number of holes.
export function received(r, p, h) {
  const hcp = r.hcps?.[p] || 0;
  if (!hcp || r.si?.[h] == null) return 0;
  const n = r.pars.length;
  const rank = r.si.filter((x) => x != null && x < r.si[h]).length;
  return Math.floor(hcp / n) + (rank < hcp % n ? 1 : 0);
}

export function stats(r, p) {
  let strokes = 0, diff = 0, pts = 0, played = 0, net = 0;
  r.pars.forEach((par, h) => {
    const s = r.scores[p][h];
    if (s != null) {
      const extra = received(r, p, h);
      strokes += s; diff += s - par; net += s - extra - par; pts += stablefordPoints(s, par, extra); played++;
    }
  });
  // netDiff: to par after handicap strokes on the holes played so far.
  return { strokes, diff, pts, played, netDiff: net, netStrokes: strokes - (diff - net) };
}

export function label(s, par) {
  if (s === 1) return 'Hole in one';
  const d = s - par;
  const names = { '-3': 'Albatross', '-2': 'Eagle', '-1': 'Birdie', '0': 'Par', '1': 'Bogey', '2': 'Double bogey', '3': 'Triple bogey' };
  if (names[d]) return names[d];
  return d < -3 ? 'Unreal' : '+' + d;
}

export function totalText(r, p) {
  const st = stats(r, p);
  if (r.format === 'stableford') return pts(st.pts);
  if (!st.played) return '–';
  if (hasHcp(r)) return 'net ' + toPar(st.netDiff) + ' (gross ' + st.strokes + ')';
  return st.strokes + ' (' + toPar(st.diff) + ')';
}

export function holeDone(r, h) {
  return r.scores.every((row) => row[h] != null);
}

export function leaderboard(r) {
  const stab = r.format === 'stableford';
  const rows = r.players.map((name, p) => ({ name, p, st: stats(r, p) }));
  const net = hasHcp(r);
  rows.sort((a, b) => (stab ? b.st.pts - a.st.pts : net ? a.st.netDiff - b.st.netDiff : a.st.diff - b.st.diff));
  return rows;
}

export function shareText(r) {
  const stab = r.format === 'stableford';
  const net = hasHcp(r);
  const lines = ['Fore Birdies: ' + r.course + ' (' + (stab ? 'Stableford' : 'stroke play') + (net ? ', with handicaps' : '') + ')'];
  leaderboard(r).forEach((x, i) => {
    const hcp = net ? ' [' + (r.hcps[x.p] || 0) + ']' : '';
    lines.push((i + 1) + '. ' + x.name + hcp + ': ' + (stab ? pts(x.st.pts)
      : net ? 'net ' + toPar(x.st.netDiff) + ', gross ' + x.st.strokes
        : x.st.strokes + ' (' + toPar(x.st.diff) + ')'));
  });
  return lines.join('\n');
}

export function fmtDate(t) {
  try { return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); } catch (e) { return ''; }
}
