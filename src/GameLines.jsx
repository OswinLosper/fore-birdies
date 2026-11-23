import { on, skins, nassau, sides, matchText, betterBall, closest, NASSAU } from './games.js';

const total = (r, x) => (r.format === 'stableford' ? x + (x === 1 ? ' pt' : ' pts') : x);

// How each side game stands on this hole, plus the closest-to-the-pin picker on par 3s.
export default function GameLines({ round: r, hole: h, onCtp }) {
  if (!r.games) return null;
  const lines = [];
  if (on(r, 'skins')) {
    const k = skins(r);
    const done = k.holes[h];
    lines.push(['Skins', done
      ? (done.winner >= 0 ? r.players[done.winner] + ' won ' + done.value + (done.value === 1 ? ' skin' : ' skins') : 'Tied, carried over')
      : k.settled === h ? k.riding + (k.riding === 1 ? ' skin' : ' skins') + ' on this hole'
        : 'Waiting for scores on hole ' + (k.settled + 1)]);
  }
  if (on(r, 'nassau')) {
    const s = sides(r);
    const segs = nassau(r);
    const show = h < 9 ? [segs[0]] : [segs[1], segs[2]];
    show.forEach((seg) => lines.push(['Nassau ' + seg.name.toLowerCase(), seg.match
      ? matchText(seg, s)
      : !seg.thru ? 'Not started' : 'Thru ' + seg.thru + ': ' + s.map((x, i) => x.name + ' ' + total(r, seg.totals[i])).join(', ')]));
  }
  if (on(r, 'better') && r.teams) {
    lines.push(['Better ball', betterBall(r).map((x) => x.name + ' ' + total(r, x.total)).join(', ')]);
  }
  const par3 = on(r, 'ctp') && r.pars[h] === 3;
  if (!lines.length && !par3) return null;
  const pick = r.ctp?.[h];
  return (
    <div className="card games" aria-label="Side games">
      {lines.map(([name, text]) => <p key={name}><b>{name}:</b> {text}</p>)}
      {par3 && (
        <div className="ctp">
          <p><b>Closest to the pin</b>{pick == null ? '' : pick < 0 ? ': nobody on the green' : ': ' + r.players[pick]}</p>
          <div className="chips">
            {r.players.map((name, p) => (
              <button key={p} className="chip" type="button" aria-pressed={pick === p} onClick={() => onCtp(pick === p ? null : p)}>{name}</button>
            ))}
            <button className="chip" type="button" aria-pressed={pick === -1} onClick={() => onCtp(pick === -1 ? null : -1)}>Nobody on the green</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Results under the leaderboard.
export function GameResults({ round: r }) {
  if (!r.games) return null;
  const s = sides(r);
  const stab = r.format === 'stableford';
  return (
    <section className="section stack">
      <h2>Side games</h2>
      {on(r, 'skins') && (() => {
        const k = skins(r);
        return (
          <div className="card game-card">
            <h3>Skins</h3>
            {r.players.map((n, p) => <p key={p} className="gline"><span>{n}</span><b>{k.won[p]}</b></p>)}
            {k.unclaimed > 0 && <p className="hint">{k.unclaimed} {k.unclaimed === 1 ? 'skin' : 'skins'} not won (tied on the last hole).</p>}
            {k.settled < r.pars.length && <p className="hint">Settled up to hole {k.settled}.</p>}
          </div>
        );
      })()}
      {on(r, 'nassau') && (
        <div className="card game-card">
          <h3>Nassau</h3>
          {nassau(r).map((seg, i) => (
            <p key={NASSAU[i].key} className="gline"><span>{seg.name}</span>
              <b>{seg.match ? matchText(seg, s)
                : seg.winner === null ? 'Not finished' : seg.winner === -1 ? 'Halved' : s[seg.winner].name + ', ' + total(r, seg.totals[seg.winner])}</b>
            </p>
          ))}
        </div>
      )}
      {on(r, 'better') && r.teams && (
        <div className="card game-card">
          <h3>Better ball</h3>
          {betterBall(r).map((x) => (
            <p key={x.t} className="gline"><span>{x.name}</span><b>{stab ? total(r, x.total) : x.holes ? x.total + ' (' + (x.diff > 0 ? '+' : '') + (x.diff || 'E') + ')' : '–'}</b></p>
          ))}
        </div>
      )}
      {on(r, 'ctp') && (() => {
        const c = closest(r);
        return (
          <div className="card game-card">
            <h3>Closest to the pin</h3>
            {r.players.map((n, p) => <p key={p} className="gline"><span>{n}</span><b>{c.won[p]}</b></p>)}
            {c.open > 0 && <p className="hint">{c.open} par {c.open === 1 ? '3 not set yet' : '3s not set yet'}.</p>}
          </div>
        );
      })()}
    </section>
  );
}
