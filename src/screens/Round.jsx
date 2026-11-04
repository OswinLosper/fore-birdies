import Header from '../Header.jsx';
import { label, totalText, holeDone, stablefordPoints } from '../scoring.js';

// A score of null means "not entered yet". It shows as par, but is only saved when the
// player taps + or -, or when the group moves on with "Next hole" / "Finish round".
// Jumping around the hole strip never fills in scores.
export default function Round({ round: r, onChange, onNext, onExit }) {
  const h = r.hole, par = r.pars[h];
  const last = h === r.pars.length - 1;

  function step(p, delta) {
    onChange((x) => {
      const s = x.scores[p][h] ?? par;
      x.scores[p][h] = Math.min(15, Math.max(1, s + delta));
      if (x.cheered) x.cheered[h] = false;
    });
  }
  const goTo = (i) => { onChange((x) => { x.hole = i; }); window.scrollTo(0, 0); };

  return (
    <>
      <Header />
      <div className="hole-head">
        <div>
          <p className="muted" style={{ fontWeight: 700 }}>{r.course}</p>
          <p className="hole-num">Hole {h + 1}</p>
        </div>
        <p style={{ fontWeight: 800, fontSize: 20 }}>Par {par}</p>
      </div>
      <nav className="strip" aria-label="Holes">
        {r.pars.map((_, i) => (
          <button key={i} type="button" className={holeDone(r, i) ? 'done' : ''} aria-current={i === h ? 'true' : undefined}
            aria-label={'Hole ' + (i + 1)} onClick={() => goTo(i)}>
            {i + 1}
          </button>
        ))}
      </nav>
      <div className="stack">
        {r.players.map((name, p) => {
          const pending = r.scores[p][h] == null;
          const s = pending ? par : r.scores[p][h];
          return (
            <div key={p} className="prow">
              <div>
                <div className="pname">{name}</div>
                <div className="ptotal">Total {totalText(r, p)}</div>
              </div>
              <div className="stepper">
                <button type="button" aria-label={'One less stroke for ' + name} onClick={() => step(p, -1)}>{'−'}</button>
                <span className={'score' + (pending ? ' pending' : '')} aria-label={name + (pending ? ' not entered, showing par ' : ' scored ') + s}>{s}</span>
                <button type="button" aria-label={'One more stroke for ' + name} onClick={() => step(p, 1)}>+</button>
              </div>
              <div className={'tag' + (!pending && s < par ? ' good' : '')}>
                {pending
                  ? 'Par unless you change it'
                  : label(s, par) + (r.format === 'stableford' ? ', ' + stablefordPoints(s, par) + ' pts' : '')}
              </div>
            </div>
          );
        })}
      </div>
      <div className="nav">
        <button className="btn btn-ghost" type="button" disabled={h === 0} onClick={() => goTo(h - 1)}>Back</button>
        <button className="btn btn-primary" type="button" onClick={onNext}>{last ? 'Finish round' : 'Next hole'}</button>
      </div>
      <p style={{ textAlign: 'center', marginTop: 10 }}>
        <button className="btn-text" type="button" onClick={onExit}>Save and exit</button>
      </p>
    </>
  );
}
