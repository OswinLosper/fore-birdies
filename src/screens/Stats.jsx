import { useState } from 'react';
import Header from '../Header.jsx';
import { toPar, fmtDate } from '../scoring.js';
import { myStats, recordText, PERIODS, KINDS, KIND_NAMES } from '../stats.js';

const one = (x) => (Math.round(x * 10) / 10).toFixed(1);
const signed = (x) => (x > 0 ? '+' : x < 0 ? '−' : '') + one(Math.abs(x));
const PAR_NAMES = { 3: 'Par 3s', 4: 'Par 4s', 5: 'Par 5s' };

export default function Stats({ rounds, user }) {
  const [period, setPeriod] = useState('all');
  const [mate, setMate] = useState(null);
  const s = myStats(rounds, user, period);
  const picked = mate && s.h2h.find((m) => m.name === mate);

  if (picked) return <HeadToHead mate={picked} onBack={() => { setMate(null); window.scrollTo(0, 0); }} />;

  const worstPar = Object.entries(s.byPar).sort((a, b) => (b[1] - b[0]) - (a[1] - a[0]))[0];

  return (
    <>
      <Header />
      <div className="stack stats">
        <h1>Your stats</h1>
        <div className="seg" role="group" aria-label="Which rounds">
          {Object.entries(PERIODS).map(([k, name]) => (
            <button key={k} type="button" aria-pressed={period === k} onClick={() => setPeriod(k)}>{name}</button>
          ))}
        </div>
        {!s.rounds ? (
          <p className="muted">
            {period === 'year' ? 'No finished rounds this year yet.' : 'Your stats show up here once you finish a round.'}
          </p>
        ) : (
          <>
            <p className="hint">
              From {s.rounds} finished {s.rounds === 1 ? 'round' : 'rounds'} you played. Rounds where you only kept score don’t count.
            </p>
            <div className="tiles">
              <div className="tile"><span className="lbl">Rounds</span><b>{s.rounds}</b><small>{s.thisMonth} this month</small></div>
              {s.avg18 != null ? (
                <div className="tile"><span className="lbl">Average, 18 holes</span><b>{Math.round(s.avg18)}</b>
                  <small>{toPar(Math.round(s.avg18Par))}{s.avg9 != null && ' · 9 holes ' + Math.round(s.avg9)}</small></div>
              ) : (
                <div className="tile"><span className="lbl">Average, 9 holes</span><b>{Math.round(s.avg9)}</b><small>No 18-hole rounds yet</small></div>
              )}
              <div className="tile"><span className="lbl">Best round{s.best.holes === 9 ? ', 9 holes' : ''}</span><b>{s.best.strokes}</b>
                <small>{s.best.course}, {fmtDate(s.best.date)}</small></div>
              {s.bestStab && (
                <div className="tile"><span className="lbl">Best Stableford{s.bestStab.holes === 9 ? ', 9 holes' : ''}</span><b>{s.bestStab.pts} pts</b>
                  <small>{s.bestStab.course}, {fmtDate(s.bestStab.date)}</small></div>
              )}
            </div>

            <div className="card stack">
              <h3>How your holes go</h3>
              <div className="kinds">
                {KINDS.filter((k) => k !== 'eagle' || s.kinds.eagle).map((k) => {
                  const pct = Math.round((s.kinds[k] / s.holes) * 100);
                  return (
                    <div key={k} className="kind">
                      <span>{KIND_NAMES[k]}</span>
                      <span className="track" aria-hidden="true"><span className={'fill ' + k} style={{ width: pct + '%' }} /></span>
                      <span className="pct">{pct}%</span>
                    </div>
                  );
                })}
              </div>
              <p className="hint">Strokes to par, before handicaps.</p>
            </div>

            {Object.keys(s.byPar).length > 0 && (
              <>
                <div className="tiles tiles-3">
                  {Object.entries(s.byPar).map(([par, a]) => (
                    <div key={par} className="tile centre"><span className="lbl">{PAR_NAMES[par]}</span><b>{one(a)}</b><small>{signed(a - par)}</small></div>
                  ))}
                </div>
                {worstPar && worstPar[1] - worstPar[0] > 0 && Object.keys(s.byPar).length > 1 && (
                  <p className="hint">{PAR_NAMES[worstPar[0]]} cost you the most shots.</p>
                )}
              </>
            )}

            <h2 className="section-h">Bragging rights</h2>
            <div className="tiles">
              <div className="tile"><span className="lbl">Birdies</span><b>{s.birdies}</b>
                <small>{s.eagles ? 'including ' + s.eagles + (s.eagles === 1 ? ' eagle' : ' eagles') : 'birdie or better'}</small></div>
            </div>
            <h3>Head to head</h3>
            {!s.h2h.length ? (
              <p className="muted">Play a round with a mate and your record against them shows up here.</p>
            ) : (
              <>
                <p className="hint">Who did better when you played the same round: Stableford points, net scores with handicaps, otherwise strokes.</p>
                <div className="list">
                  {s.h2h.map((m) => (
                    <button key={m.name} className="item" type="button" onClick={() => { setMate(m.name); window.scrollTo(0, 0); }}>
                      <span>
                        <strong>{m.name}</strong>
                        <small>{m.rounds.length} {m.rounds.length === 1 ? 'round' : 'rounds'} together</small>
                      </span>
                      <span className={'pill' + (m.won > m.lost ? ' live' : '')}>{recordText(m)}</span>
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
}

function HeadToHead({ mate: m, onBack }) {
  return (
    <>
      <Header />
      <div className="stack stats">
        <p><button className="btn-text" type="button" style={{ paddingLeft: 0 }} onClick={onBack}>‹ Stats</button></p>
        <h1>You v {m.name}</h1>
        <div className="card vs">
          <div><b>{m.won}</b><span className="hint">You</span></div>
          <span className="hint">{m.rounds.length} {m.rounds.length === 1 ? 'round' : 'rounds'}{m.tied ? <><br />{m.tied} {m.tied === 1 ? 'tie' : 'ties'}</> : null}</span>
          <div><b>{m.lost}</b><span className="hint">{m.name}</span></div>
        </div>
        <h2 className="section-h">Rounds together</h2>
        <div className="card">
          {m.rounds.map((x) => (
            <div key={x.id} className="vs-round">
              <span>{fmtDate(x.date)} · {x.course}</span>
              <span>
                <span className={x.outcome === 'won' ? 'w' : ''}>You {x.me}</span>
                {' v '}
                <span className={x.outcome === 'lost' ? 'w' : ''}>{x.them}</span>
              </span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
