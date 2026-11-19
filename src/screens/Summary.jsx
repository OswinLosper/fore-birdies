import Header from '../Header.jsx';
import { leaderboard, shareText, toPar, stats, fmtDate, hasHcp, received, pts, siComplete, stablefordPoints } from '../scoring.js';

// Only the starter re-opens or deletes a round. Everyone else can go back to scoring
// (while it's still being played) or leave it.
export default function Summary({ round: r, starter, onEdit, onBack, onDone, onDelete, onLeave }) {
  const stab = r.format === 'stableford';
  const net = hasHcp(r);
  const rows = leaderboard(r);
  const text = shareText(r);
  const hasShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <>
      <Header />
      <div className="stack">
        <h1>{r.done ? 'Round finished' : 'Leaderboard'}</h1>
        <p className="muted">{r.course}, {fmtDate(r.date)}, {stab ? 'Stableford' : 'stroke play'}{net ? ', with handicaps' : ''}</p>
        {net && !siComplete(r) && (
          <p className="hint">{stab
            ? 'No stroke index on every hole, so these Stableford points are without handicaps.'
            : 'No stroke index on every hole, so handicaps came off the total.'}</p>
        )}
        <div className="board">
          {rows.map((x, i) => (
            <div key={x.p} className={'brow' + (i === 0 ? ' first' : '')}>
              <span className="rank">{i + 1}</span>
              <span className="pname">{x.name}{net && <small className="muted"> ({r.hcps[x.p] || 0})</small>}</span>
              <span className="bscore">
                {stab ? pts(x.st.pts) : !x.st.played ? '–' : net ? 'net ' + toPar(x.st.netDiff) : toPar(x.st.diff)}
                <small>
                  {net && !stab ? 'gross ' + x.st.strokes : x.st.strokes + ' strokes'}
                  {!stab && x.st.played > 0 && ' · ' + pts(x.st.pts)}
                </small>
              </span>
            </div>
          ))}
        </div>
        <div className="stack">
          {hasShare && (
            <button className="btn btn-accent btn-block" type="button"
              onClick={() => navigator.share({ title: 'Fore Birdies', text }).catch(() => {})}>
              Share result
            </button>
          )}
          <a className={'btn btn-block ' + (hasShare ? 'btn-ghost' : 'btn-accent')}
            href={'https://wa.me/?text=' + encodeURIComponent(text)} target="_blank" rel="noopener">
            Send on WhatsApp
          </a>
        </div>
        <section className="section">
          <h2>Scorecard</h2>
          <div className="table-box">
            <table>
              <thead>
                <tr>
                  <th scope="col">Hole</th>
                  {r.pars.map((_, i) => <th key={i} scope="col">{i + 1}</th>)}
                  <th scope="col">Total</th>
                </tr>
                <tr>
                  <td>Par</td>
                  {r.pars.map((p, i) => <td key={i}>{p}</td>)}
                  <td>{r.pars.reduce((a, b) => a + b, 0)}</td>
                </tr>
                {r.si?.some((x) => x != null) && (
                  <tr>
                    <td>SI</td>
                    {r.pars.map((_, i) => <td key={i} className="muted">{r.si[i] ?? ''}</td>)}
                    <td />
                  </tr>
                )}
              </thead>
              <tbody>
                {r.players.map((name, p) => [
                  <tr key={p} className="strokes-row">
                    <td>{name}</td>
                    {r.pars.map((par, i) => {
                      const s = r.scores[p][i];
                      const extra = received(r, p, i);
                      return (
                        <td key={i} className={s != null && s < par ? 'under' : undefined}>
                          {s == null ? '–' : s}{extra > 0 && <sup className="dots">{'●'.repeat(extra)}</sup>}
                        </td>
                      );
                    })}
                    <td>{stats(r, p).strokes}</td>
                  </tr>,
                  // Stableford points under the strokes, like a club card, in any format.
                  <tr key={p + 'pts'} className="pts-row">
                    <td>Points</td>
                    {r.pars.map((par, i) => {
                      const s = r.scores[p][i];
                      return <td key={i}>{s == null ? '' : stablefordPoints(s, par, received(r, p, i))}</td>;
                    })}
                    <td>{stats(r, p).pts}</td>
                  </tr>,
                ])}
              </tbody>
            </table>
          </div>
        </section>
        <div className="nav">
          {starter ? (
            <button className="btn btn-ghost" type="button" onClick={onEdit}>Edit scores</button>
          ) : (
            <button className="btn btn-ghost" type="button" disabled={r.done} onClick={onBack}>Back to scores</button>
          )}
          <button className="btn btn-primary" type="button" onClick={onDone}>Done</button>
        </div>
        {!starter && !r.done && <p className="hint" style={{ textAlign: 'center' }}>The starter finishes the round.</p>}
        <p style={{ textAlign: 'center', marginTop: 6 }}>
          {starter
            ? <button className="btn-text" type="button" onClick={onDelete}>Delete this round</button>
            : <button className="btn-text" type="button" onClick={onLeave}>Leave this round</button>}
        </p>
      </div>
    </>
  );
}
