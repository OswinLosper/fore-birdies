import { useEffect, useRef, useState } from 'react';
import Header from '../Header.jsx';
import { fill } from '../storage.js';

const X_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export default function Setup({ courses, onTeeOff, onCancel }) {
  const [d, setD] = useState({ courseId: null, course: '', pars: fill(18, 4), format: 'stroke', players: ['You', ''] });
  const [error, setError] = useState('');
  const set = (patch) => setD((old) => ({ ...old, ...patch }));
  const focusNew = useRef(false);
  useEffect(() => {
    if (!focusNew.current) return;
    focusNew.current = false;
    document.getElementById('pl' + (d.players.length - 1))?.focus();
  }, [d.players.length]);

  function setHoles(n) {
    set({ pars: n === 9 ? d.pars.slice(0, 9) : d.pars.concat(fill(18 - d.pars.length, 4)).slice(0, 18) });
  }
  function cyclePar(i) {
    const pars = d.pars.slice();
    pars[i] = pars[i] >= 5 ? 3 : pars[i] + 1;
    set({ pars });
  }
  function setPlayer(i, v) {
    const players = d.players.slice(); players[i] = v; set({ players });
  }
  function teeOff() {
    if (!d.course.trim()) { setError('Add a course name to tee off.'); return; }
    if (!d.players.some((p) => p.trim())) { setError('Add at least one player to tee off.'); return; }
    onTeeOff(d);
  }

  const totalPar = d.pars.reduce((a, b) => a + b, 0);

  return (
    <>
      <Header />
      <div className="stack">
        <h1>New round</h1>
        {courses.length > 0 && (
          <div className="stack">
            <p className="hint">Saved courses</p>
            <div className="chips">
              {courses.map((c) => (
                <button key={c.id} className="chip" type="button" aria-pressed={d.courseId === c.id}
                  onClick={() => { set({ courseId: c.id, course: c.name, pars: c.pars.slice() }); setError(''); }}>
                  {c.name}
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="field">Course name
          <input type="text" autoComplete="off" placeholder="e.g. your home club" value={d.course}
            onChange={(e) => set({ course: e.target.value, courseId: null })} />
        </label>
        <div className="stack">
          <p style={{ fontWeight: 700 }}>Holes</p>
          <div className="seg" role="group" aria-label="Number of holes">
            <button type="button" aria-pressed={d.pars.length === 9} onClick={() => setHoles(9)}>9 holes</button>
            <button type="button" aria-pressed={d.pars.length === 18} onClick={() => setHoles(18)}>18 holes</button>
          </div>
        </div>
        <div className="stack">
          <p style={{ fontWeight: 700 }}>Par for each hole</p>
          <p className="hint">Tap a hole to switch between par 3, 4 and 5. Total par: {totalPar}.</p>
          <div className="pars">
            {d.pars.map((p, i) => (
              <button key={i} className="par" type="button" data-par={p} aria-label={'Hole ' + (i + 1) + ', par ' + p} onClick={() => cyclePar(i)}>
                <span>{i + 1}</span><b>{p}</b>
              </button>
            ))}
          </div>
        </div>
        <div className="stack">
          <p style={{ fontWeight: 700 }}>Format</p>
          <div className="seg" role="group" aria-label="Scoring format">
            <button type="button" aria-pressed={d.format === 'stroke'} onClick={() => set({ format: 'stroke' })}>Stroke play</button>
            <button type="button" aria-pressed={d.format === 'stableford'} onClick={() => set({ format: 'stableford' })}>Stableford</button>
          </div>
          {d.format === 'stableford' && (
            <p className="hint">Points per hole: 2 for par, 3 for a birdie, 4 for an eagle, 1 for a bogey. Handicaps come in a later version.</p>
          )}
        </div>
        <div className="stack">
          <p style={{ fontWeight: 700 }}>Players</p>
          {d.players.map((name, i) => (
            <div key={i} className="player-row">
              <label className="sr" htmlFor={'pl' + i}>Player {i + 1}</label>
              <input type="text" id={'pl' + i} autoComplete="off" placeholder={'Player ' + (i + 1)} value={name}
                onChange={(e) => setPlayer(i, e.target.value)} />
              {d.players.length > 1 && (
                <button className="icon-btn" type="button" aria-label={'Remove player ' + (i + 1)}
                  onClick={() => set({ players: d.players.filter((_, j) => j !== i) })}>
                  {X_ICON}
                </button>
              )}
            </div>
          ))}
          {d.players.length < 8 && (
            <button className="btn btn-ghost" type="button" onClick={() => { focusNew.current = true; set({ players: d.players.concat('') }); }}>Add player</button>
          )}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" type="button" onClick={teeOff}>Tee off</button>
        <button className="btn-text" type="button" onClick={onCancel}>Cancel</button>
      </div>
    </>
  );
}
