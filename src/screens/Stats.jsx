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
  const [course, setCourse] = useState(null);
  const s = myStats(rounds, user, period);
  const picked = mate && s.h2h.find((m) => m.name === mate);
  const place = course && s.courses.find((c) => c.name === course);
  const back = () => { setMate(null); setCourse(null); window.scrollTo(0, 0); };

  if (picked) return <HeadToHead mate={picked} onBack={back} />;
  if (place) return <Course c={place} onBack={back} />;

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

            {s.form && <Form f={s.form} />}

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

            <h2 className="section-h">Where you lose shots</h2>
            {s.halves && (
              <>
                <div className="tiles">
                  {[['Front 9', s.halves.front, s.halves.back], ['Back 9', s.halves.back, s.halves.front]].map(([name, h, other]) => (
                    <div key={name} className={'tile' + (h.strokes - other.strokes >= 0.5 ? ' worse' : '')}>
                      <span className="lbl">{name}</span><b>{one(h.strokes)}</b><small>{signed(h.diff)} on average</small>
                    </div>
                  ))}
                </div>
                {Math.abs(s.halves.back.strokes - s.halves.front.strokes) >= 0.5 && (
                  <p className="hint">
                    The {s.halves.back.strokes > s.halves.front.strokes ? 'back' : 'front'} 9 costs you {one(Math.abs(s.halves.back.strokes - s.halves.front.strokes))} more shots a round.
                  </p>
                )}
              </>
            )}
            <div className="tiles">
              <div className="tile"><span className="lbl">Blow-up holes</span>
                <b>{s.blowups.count ? '1 in ' + s.blowups.oneIn : 'None'}</b><small>triple bogey or worse</small></div>
              {s.blowups.count > 0 && (
                <div className="tile"><span className="lbl">Shots they cost</span><b>{one(s.blowups.perRound)}</b>
                  <small>a round, if they’d been doubles</small></div>
              )}
            </div>

            <h2 className="section-h">Bragging rights</h2>
            <div className="tiles">
              <div className="tile"><span className="lbl">Birdies</span><b>{s.birdies}</b>
                <small>{s.eagles ? 'including ' + s.eagles + (s.eagles === 1 ? ' eagle' : ' eagles') : 'birdie or better'}</small></div>
              {s.mostBirdies && (
                <div className="tile"><span className="lbl">Most birdies, one round</span><b>{s.mostBirdies.birdies}</b>
                  <small>{s.mostBirdies.course}, {fmtDate(s.mostBirdies.date)}</small></div>
              )}
              {s.streak && (
                <div className="tile"><span className="lbl">Par or better in a row</span>
                  <b>{s.streak.holes} {s.streak.holes === 1 ? 'hole' : 'holes'}</b>
                  <small>{s.streak.course}, {fmtDate(s.streak.date)}</small></div>
              )}
            </div>

            <h3>By course</h3>
            <div className="list">
              {s.courses.map((c) => (
                <button key={c.name} className="item" type="button" onClick={() => { setCourse(c.name); window.scrollTo(0, 0); }}>
                  <span>
                    <strong>{c.name}</strong>
                    <small>{c.rounds} {c.rounds === 1 ? 'round' : 'rounds'} · average {Math.round(c.avg)} · best {c.best.strokes}{c.holes !== 18 ? ' (' + c.holes + ' holes)' : ''}</small>
                  </span>
                  <span className="chev" aria-hidden="true">›</span>
                </button>
              ))}
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

// The last 10 rounds of 18 holes as a line, oldest on the left. Fewer shots is higher up.
function Form({ f }) {
  const W = 320, H = 120, L = 28, R = 14, T = 14, B = 14;
  const lo = Math.min(...f.last10, f.usual) - 2, hi = Math.max(...f.last10, f.usual) + 2;
  const x = (i) => L + (i * (W - L - R)) / (f.last10.length - 1);
  const y = (v) => T + ((v - lo) * (H - T - B)) / (hi - lo);
  const last = f.last10.length - 1;
  const gap = f.last5 != null ? Math.round(f.usual) - Math.round(f.last5) : 0;
  return (
    <div className="card stack">
      <h3>Your form</h3>
      {f.last5 != null && (
        <>
          <p className="trend"><b>{Math.round(f.last5)}</b> <span className="muted">average of your last 5</span></p>
          <p className={gap > 0 ? 'better' : 'muted'}>
            {gap > 0 ? '▼ ' + gap + (gap === 1 ? ' shot' : ' shots') + ' better than your usual ' + Math.round(f.usual)
              : gap < 0 ? '▲ ' + -gap + (gap === -1 ? ' shot' : ' shots') + ' more than your usual ' + Math.round(f.usual)
                : 'Right on your usual ' + Math.round(f.usual)}
          </p>
        </>
      )}
      <svg className="spark" viewBox={'0 0 ' + W + ' ' + H} role="img"
        aria-label={'Your last ' + f.last10.length + ' rounds of 18 holes: ' + f.last10.join(', ')}>
        <line className="avg" x1={L} x2={W - R} y1={y(f.usual)} y2={y(f.usual)} />
        <text x="0" y={y(f.usual) + 4}>{Math.round(f.usual)}</text>
        <polyline className="ln" points={f.last10.map((v, i) => x(i) + ',' + y(v)).join(' ')} />
        {f.last10.map((v, i) => <circle key={i} className={i === last ? 'last' : 'dot'} cx={x(i)} cy={y(v)} r={i === last ? 6 : 3.5} />)}
        <text x={x(last) - 8} y={y(f.last10[last]) + (y(f.last10[last]) > H / 2 ? -12 : 22)}>{f.last10[last]}</text>
      </svg>
      <p className="hint">Your last {f.last10.length} rounds of 18 holes, oldest on the left. The dashed line is your average. Higher up means fewer shots.</p>
    </div>
  );
}

function Course({ c, onBack }) {
  const holes = (list) => (
    <div className="card">
      {list.map((h) => (
        <div key={h.hole} className="vs-round">
          <span>Hole {h.hole} · par {h.par}</span>
          <span><b>{one(h.avg)} · {signed(h.diff)}</b></span>
        </div>
      ))}
    </div>
  );
  return (
    <>
      <Header />
      <div className="stack stats">
        <p><button className="btn-text" type="button" style={{ paddingLeft: 0 }} onClick={onBack}>‹ Stats</button></p>
        <h1>{c.name}</h1>
        <div className="tiles">
          <div className="tile"><span className="lbl">Rounds here</span><b>{c.rounds}</b><small>last on {fmtDate(c.last)}</small></div>
          <div className="tile"><span className="lbl">Average{c.holes !== 18 ? ', ' + c.holes + ' holes' : ''}</span><b>{Math.round(c.avg)}</b><small>{toPar(Math.round(c.avgDiff))}</small></div>
          <div className="tile"><span className="lbl">Best round</span><b>{c.best.strokes}</b><small>{fmtDate(c.best.date)}</small></div>
          <div className="tile"><span className="lbl">Birdies here</span><b>{c.birdies}</b>
            <small>{c.topBirdie ? c.topBirdie.count + ' on hole ' + c.topBirdie.hole : 'birdie or better'}</small></div>
        </div>
        {c.bestHoles[0].diff === c.worstHoles[0].diff ? (
          <p className="muted">Every hole here averages the same so far, so there’s no best or worst hole yet.</p>
        ) : (
          <>
            <h2 className="section-h">Your best holes</h2>
            {holes(c.bestHoles)}
            <h2 className="section-h">Your worst holes</h2>
            {holes(c.worstHoles)}
            <p className="hint">Average strokes on each hole across your rounds here, before handicaps.</p>
          </>
        )}
      </div>
    </>
  );
}
