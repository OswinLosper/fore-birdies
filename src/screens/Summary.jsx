import Header from '../Header.jsx';
import { leaderboard, shareText, toPar, stats, fmtDate } from '../scoring.js';

export default function Summary({ round: r, onEdit, onDone, onDelete }) {
  const stab = r.format === 'stableford';
  const rows = leaderboard(r);
  const text = shareText(r);
  const hasShare = typeof navigator !== 'undefined' && !!navigator.share;

  return (
    <>
      <Header />
      <div className="stack">
        <h1>{r.done ? 'Round finished' : 'Leaderboard'}</h1>
        <p className="muted">{r.course}, {fmtDate(r.date)}, {stab ? 'Stableford' : 'stroke play'}</p>
        <div className="board">
          {rows.map((x, i) => (
            <div key={x.p} className={'brow' + (i === 0 ? ' first' : '')}>
              <span className="rank">{i + 1}</span>
              <span className="pname">{x.name}</span>
              <span className="bscore">
                {stab ? x.st.pts + ' pts' : x.st.played ? toPar(x.st.diff) : '–'}
                <small>{x.st.strokes} strokes</small>
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
              </thead>
              <tbody>
                {r.players.map((name, p) => (
                  <tr key={p}>
                    <td>{name}</td>
                    {r.pars.map((par, i) => {
                      const s = r.scores[p][i];
                      return <td key={i} className={s != null && s < par ? 'under' : undefined}>{s == null ? '–' : s}</td>;
                    })}
                    <td>{stats(r, p).strokes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <div className="nav">
          <button className="btn btn-ghost" type="button" onClick={onEdit}>Edit scores</button>
          <button className="btn btn-primary" type="button" onClick={onDone}>Done</button>
        </div>
        <p style={{ textAlign: 'center', marginTop: 6 }}>
          <button className="btn-text" type="button" onClick={onDelete}>Delete this round</button>
        </p>
      </div>
    </>
  );
}
