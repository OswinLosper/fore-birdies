export function toPar(n) {
  return n === 0 ? 'E' : n > 0 ? '+' + n : '−' + Math.abs(n);
}

// Gross Stableford: 2 for par, +1 per stroke under, never below 0.
export function stablefordPoints(s, par) {
  return Math.max(0, 2 + par - s);
}

export function stats(r, p) {
  let strokes = 0, diff = 0, pts = 0, played = 0;
  r.pars.forEach((par, h) => {
    const s = r.scores[p][h];
    if (s != null) { strokes += s; diff += s - par; pts += stablefordPoints(s, par); played++; }
  });
  return { strokes, diff, pts, played };
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
  if (r.format === 'stableford') return st.pts + ' pts';
  return st.played ? st.strokes + ' (' + toPar(st.diff) + ')' : '–';
}

export function holeDone(r, h) {
  return r.scores.every((row) => row[h] != null);
}

export function leaderboard(r) {
  const stab = r.format === 'stableford';
  const rows = r.players.map((name, p) => ({ name, p, st: stats(r, p) }));
  rows.sort((a, b) => (stab ? b.st.pts - a.st.pts : a.st.diff - b.st.diff));
  return rows;
}

export function shareText(r) {
  const stab = r.format === 'stableford';
  const lines = ['Fore Birdies: ' + r.course + ' (' + (stab ? 'Stableford' : 'stroke play') + ')'];
  leaderboard(r).forEach((x, i) => {
    lines.push((i + 1) + '. ' + x.name + ': ' + (stab ? x.st.pts + ' pts' : x.st.strokes + ' (' + toPar(x.st.diff) + ')'));
  });
  return lines.join('\n');
}

export function fmtDate(t) {
  try { return new Date(t).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }); } catch (e) { return ''; }
}
