import { useEffect, useRef, useState } from 'react';
import Header from '../Header.jsx';
import { fill } from '../storage.js';
import { courseIndex, courseHoles, hereOnce, metres } from '../geo.js';

const X_ICON = (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

// Shown on the selected course so it's clear that tapping again removes it.
const CHIP_X = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true">
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export default function Setup({ courses, you, onTeeOff, onCancel, onRemoveCourse }) {
  const [d, setD] = useState({ courseId: null, courseRef: null, course: '', pars: fill(18, 4), format: 'stroke', players: [you || 'You', ''] });
  const [error, setError] = useState('');
  // The South African course list, and the courses near you once you ask.
  const [list, setList] = useState([]);
  const [near, setNear] = useState(null);
  const [finding, setFinding] = useState(false);
  // Edit mode puts a remove button on each saved course.
  const [editing, setEditing] = useState(false);
  // A removed course can't stay picked.
  useEffect(() => {
    if (d.courseId && !courses.some((c) => c.id === d.courseId)) set({ courseId: null, courseRef: null, course: '', pars: fill(18, 4) });
    if (!courses.length) setEditing(false);
  }, [courses]);
  useEffect(() => { courseIndex().then(setList); }, []);
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
  // Tapping the selected course again clears it, back to a blank 18-hole course.
  function pickCourse(c) {
    if (d.courseId === c.id) set({ courseId: null, courseRef: null, course: '', pars: fill(18, 4) });
    else set({ courseId: c.id, courseRef: c.courseRef || null, course: c.name, pars: c.pars.slice() });
    setError('');
  }
  // A course from the list: its pars come from the map where the map has them, hole by hole.
  function pickListed(c) {
    set({ courseId: null, courseRef: c.id, course: c.name });
    setNear(null);
    setError('');
    courseHoles(c.id).then((holes) => setD((old) => (old.courseRef !== c.id ? old : {
      ...old, pars: old.pars.map((p, i) => holes[String(i + 1)]?.par ?? p),
    })));
  }
  async function findNear() {
    setFinding(true);
    const here = await hereOnce();
    setFinding(false);
    if (!here) { setError('Couldn’t get your location. Search by name instead.'); return; }
    setNear(list.map((c) => ({ ...c, away: metres(here, [c.lat, c.lon]) }))
      .filter((c) => c.away < 50000).sort((a, b) => a.away - b.away).slice(0, 5));
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
  const listed = d.courseRef ? list.find((c) => c.id === d.courseRef) : null;
  const q = d.course.trim().toLowerCase();
  const matches = !d.courseRef && !d.courseId && q.length >= 2
    ? list.filter((c) => c.name.toLowerCase().includes(q)).slice(0, 6) : [];

  return (
    <>
      <Header />
      <div className="stack">
        <h1>New round</h1>
        {courses.length > 0 && (
          <div className="stack">
            <div className="row-between">
              <p className="hint">{editing ? 'Tap a course to remove it.' : d.courseId ? 'Saved courses. Tap it again to start a new course instead.' : 'Saved courses'}</p>
              <button className="btn-text" type="button" onClick={() => setEditing(!editing)}>{editing ? 'Done' : 'Edit'}</button>
            </div>
            <div className="chips">
              {courses.map((c) => (editing ? (
                <button key={c.id} className="chip chip-remove" type="button" aria-label={'Remove ' + c.name}
                  onClick={() => onRemoveCourse(c)}>
                  {c.name}
                  {CHIP_X}
                </button>
              ) : (
                <button key={c.id} className="chip" type="button" aria-pressed={d.courseId === c.id}
                  onClick={() => pickCourse(c)}>
                  {c.name}
                  {d.courseId === c.id && CHIP_X}
                </button>
              )))}
            </div>
          </div>
        )}
        <label className="field">Course name
          <input type="text" autoComplete="off" placeholder="Search or type your course" value={d.course}
            onChange={(e) => set({ course: e.target.value, courseId: null, courseRef: null })} />
        </label>
        {listed && (
          <p className="hint">{listed.greens
            ? 'Distances to the green on ' + listed.greens + (listed.greens === 1 ? ' hole.' : ' holes.')
            : 'On the course list. No greens mapped yet, so no distances.'}</p>
        )}
        {matches.length > 0 && (
          <div className="list" aria-label="Courses on the list">
            {matches.map((c) => <CourseItem key={c.id} c={c} onPick={pickListed} />)}
          </div>
        )}
        {!d.courseRef && !matches.length && (
          near ? (
            <div className="stack">
              <p className="hint">{near.length ? 'Courses near you' : 'No courses on the list within 50 km. Type the name instead.'}</p>
              {near.length > 0 && <div className="list">{near.map((c) => <CourseItem key={c.id} c={c} onPick={pickListed} />)}</div>}
            </div>
          ) : (
            <button className="btn btn-ghost" type="button" disabled={finding || !list.length} onClick={findNear}>
              {finding ? 'Finding you…' : 'Courses near me'}
            </button>
          )
        )}
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

function CourseItem({ c, onPick }) {
  return (
    <button className="item" type="button" onClick={() => onPick(c)}>
      <span>
        <strong>{c.name}</strong>
        <small>{c.away != null ? (c.away / 1000).toFixed(1) + ' km away' : ''}{c.away != null && c.greens ? ', ' : ''}{c.greens ? 'distances on ' + c.greens + ' holes' : ''}</small>
      </span>
    </button>
  );
}
