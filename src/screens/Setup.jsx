import { useEffect, useRef, useState } from 'react';
import Header from '../Header.jsx';
import { fill } from '../storage.js';
import { courseIndex, courseHoles, hereOnce, metres } from '../geo.js';
import { GAMES, GAME_NAMES, unavailable } from '../games.js';
import GameHelp from '../GameHelp.jsx';
import { sameName, mateNamed, crewMates, cardNamesClash } from '../mates.js';

// Each player's playing handicap, remembered by name on this phone so it's there next round.
const HCPS = 'fore-birdies-hcps';
const loadHcps = () => { try { return JSON.parse(localStorage.getItem(HCPS)) || {}; } catch (e) { return {}; } };
function rememberHcps(players, hcps) {
  const all = loadHcps();
  players.forEach((p, i) => { if (p.trim()) all[p.trim().toLowerCase()] = hcps[i] || 0; });
  try { localStorage.setItem(HCPS, JSON.stringify(all)); } catch (e) {}
}
// A stroke index typed in: a whole number 1-18, or nothing.
const siOf = (v) => { const n = parseInt(v, 10); return n >= 1 && n <= 18 ? n : null; };

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

export default function Setup({ courses, mates, crews, you, onTeeOff, onCancel, onRemoveCourse, onMates }) {
  const [d, setD] = useState(() => ({
    courseId: null, courseRef: null, course: '', pars: fill(18, 4), si: fill(18, null), format: 'stroke',
    players: [you || 'You', ''], hcps: [loadHcps()[(you || '').toLowerCase()] || 0, 0],
    // Side games switched on, and each player's better ball team (null = paired in order).
    games: {}, team: [null, null],
    // The crew picked last, so the end of the round can offer to add new faces to it.
    crew: null, saveNew: true,
  }));
  const [help, setHelp] = useState(null);
  const [error, setError] = useState('');
  // The South African course list, and the courses near you once you ask.
  const [list, setList] = useState([]);
  const [near, setNear] = useState(null);
  const [finding, setFinding] = useState(false);
  // Edit mode puts a remove button on each saved course.
  const [editing, setEditing] = useState(false);
  // A removed course can't stay picked.
  useEffect(() => {
    if (d.courseId && !courses.some((c) => c.id === d.courseId)) set({ courseId: null, courseRef: null, course: '', pars: fill(18, 4), si: fill(18, null) });
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
    set({
      pars: n === 9 ? d.pars.slice(0, 9) : d.pars.concat(fill(18 - d.pars.length, 4)).slice(0, 18),
      si: n === 9 ? d.si.slice(0, 9) : d.si.concat(fill(18 - d.si.length, null)).slice(0, 18),
    });
  }
  function cyclePar(i) {
    const pars = d.pars.slice();
    pars[i] = pars[i] >= 5 ? 3 : pars[i] + 1;
    set({ pars });
  }
  // Tapping the selected course again clears it, back to a blank 18-hole course.
  function pickCourse(c) {
    if (d.courseId === c.id) set({ courseId: null, courseRef: null, course: '', pars: fill(18, 4), si: fill(18, null) });
    else set({ courseId: c.id, courseRef: c.courseRef || null, course: c.name, pars: c.pars.slice(), si: c.si ? c.si.slice() : fill(c.pars.length, null) });
    setError('');
  }
  // A course from the list: its pars and stroke indexes come from the map where the map has them,
  // hole by hole.
  function pickListed(c) {
    set({ courseId: null, courseRef: c.id, course: c.name });
    setNear(null);
    setError('');
    courseHoles(c.id).then((holes) => setD((old) => (old.courseRef !== c.id ? old : {
      ...old,
      pars: old.pars.map((p, i) => holes[String(i + 1)]?.par ?? p),
      si: old.si.map((x, i) => holes[String(i + 1)]?.si ?? null),
    })));
  }
  function setSi(i, v) {
    const si = d.si.slice(); si[i] = siOf(v); set({ si });
  }
  function setHcp(i, v) {
    const n = parseInt(v, 10);
    const hcps = d.hcps.slice(); hcps[i] = n >= 0 ? Math.min(54, n) : 0; set({ hcps });
  }
  async function findNear() {
    setFinding(true);
    const here = await hereOnce();
    setFinding(false);
    if (!here) { setError('Couldn’t get your location. Search by name instead.'); return; }
    setNear(list.map((c) => ({ ...c, away: metres(here, [c.lat, c.lon]) }))
      .filter((c) => c.away < 50000).sort((a, b) => a.away - b.away).slice(0, 5));
  }
  // Typing a name this phone has seen before fills in that player's handicap.
  function setPlayer(i, v) {
    const players = d.players.slice(); players[i] = v;
    const known = loadHcps()[v.trim().toLowerCase()];
    const hcps = d.hcps.slice(); if (known != null) hcps[i] = known;
    set({ players, hcps });
  }
  // Mates and crews: tapping adds them to the players with their handicaps, tapping again takes them off.
  // You (the first row) are never added or taken off.
  const onCard = (name) => d.players.some((p, i) => i > 0 && sameName(p, name));
  function addPeople(old, people) {
    const players = old.players.slice(); const hcps = old.hcps.slice(); const team = old.team.slice();
    people.forEach((m) => {
      if (players.some((p, i) => i > 0 && sameName(p, m.name))) return;
      const empty = players.findIndex((p, i) => i > 0 && !p.trim());
      if (empty >= 0) { players[empty] = m.name; hcps[empty] = m.hcp || 0; return; }
      if (players.length < 8) { players.push(m.name); hcps.push(m.hcp || 0); team.push(null); }
    });
    return { ...old, players, hcps, team };
  }
  function takeOff(old, names) {
    const keep = old.players.map((p, i) => i === 0 || !names.some((n) => sameName(p, n)));
    const players = old.players.filter((_, i) => keep[i]);
    // Always leave an empty row to type someone into.
    if (players.length === 1) return { ...old, players: [players[0], ''], hcps: [old.hcps[0], 0], team: [null, null] };
    return { ...old, players, hcps: old.hcps.filter((_, i) => keep[i]), team: old.team.filter((_, i) => keep[i]) };
  }
  const yourMates = mates.filter((m) => !sameName(m.name, you || ''));
  const crewIn = (c) => {
    const ms = crewMates(c, yourMates);
    return ms.length > 0 && ms.every((m) => onCard(m.name));
  };
  function tapCrew(c) {
    const ms = crewMates(c, yourMates);
    if (crewIn(c)) { setD((old) => ({ ...takeOff(old, ms.map((m) => m.name)), crew: old.crew === c.id ? null : old.crew })); return; }
    setD((old) => ({ ...addPeople(old, ms), crew: c.id }));
    if (ms.filter((m) => !onCard(m.name)).length > 8 - d.players.filter((p, i) => i === 0 || p.trim()).length) setError('Only 8 players fit on a card, so not everyone in the crew was added.');
    else setError('');
  }
  function tapMate(m) {
    setD((old) => (onCard(m.name) ? takeOff(old, [m.name]) : addPeople(old, [m])));
    setError('');
  }
  const typedNew = d.players.filter((p, i) => i > 0 && p.trim() && !mateNamed(mates, p) && !sameName(p, you || ''));

  function teeOff() {
    if (!d.course.trim()) { setError('Add a course name to tee off.'); return; }
    if (!d.players.some((p) => p.trim())) { setError('Add at least one player to tee off.'); return; }
    const clash = cardNamesClash(d.players);
    if (clash) { setError(clash); return; }
    const games = Object.fromEntries(GAMES.filter((g) => d.games[g] && !unavailable(g, setup)).map((g) => [g, true]));
    if (games.better && teams.some((t) => t.length !== 2)) { setError('Each better ball team needs two players.'); return; }
    rememberHcps(d.players, d.hcps);
    const newMates = d.saveNew ? d.players.map((p, i) => ({ name: p.trim(), hcp: d.hcps[i] || 0 }))
      .filter((m, i, all) => i > 0 && typedNew.some((p) => sameName(p, m.name))
        // The same new name typed twice is saved once, so you never end up with two Lees.
        && all.findIndex((x) => sameName(x.name, m.name)) === i) : [];
    onTeeOff({ ...d, games, teams: games.better ? teams : null, newMates });
  }

  const totalPar = d.pars.reduce((a, b) => a + b, 0);
  const siGiven = d.si.filter((x) => x != null);
  const siDupe = new Set(siGiven).size !== siGiven.length;
  const siDone = siGiven.length === d.pars.length && !siDupe;
  // Teams are by position among the named players, the same order the round keeps them in.
  const named = d.players.map((p, i) => (p.trim() ? i : -1)).filter((i) => i >= 0);
  const setup = { players: named.length, holes: d.pars.length, pars: d.pars };
  const teamOf = (i) => (d.team[i] != null && d.team[i] < Math.floor(named.length / 2) ? d.team[i] : Math.floor(named.indexOf(i) / 2));
  const teams = Array.from({ length: Math.floor(named.length / 2) }, (_, t) => named.map((i, k) => (teamOf(i) === t ? k : -1)).filter((k) => k >= 0));
  function setTeam(i, t) { const team = d.team.slice(); team[i] = t; set({ team }); }
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
          <p style={{ fontWeight: 700 }}>Stroke index</p>
          <p className="hint">{d.si.every((x) => x != null)
            ? 'From the scorecard. Used to give handicap strokes on the hardest holes.'
            : 'Optional. With it, handicap strokes go on the hardest holes (1 is the hardest). It’s on the club’s scorecard.'}</p>
          <div className="pars si">
            {d.si.map((x, i) => (
              <label key={i} className="par">
                <span>{i + 1}</span>
                <input type="text" inputMode="numeric" maxLength={2} aria-label={'Hole ' + (i + 1) + ' stroke index'}
                  value={x ?? ''} onChange={(e) => setSi(i, e.target.value)} />
              </label>
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
            <p className="hint">Points per hole: 2 for a net par, 3 for a net birdie, 1 for a net bogey, after any handicap strokes on that hole.</p>
          )}
        </div>
        <div className="stack">
          <p style={{ fontWeight: 700 }}>Players</p>
          {crews.some((c) => crewMates(c, yourMates).length) && (
            <>
              <p className="hint">Your crews · tap to add everyone</p>
              <div className="chips">
                {crews.filter((c) => crewMates(c, yourMates).length).map((c) => (
                  <button key={c.id} className="chip crew" type="button" aria-pressed={crewIn(c)} onClick={() => tapCrew(c)}>
                    {c.name} <small>{crewMates(c, yourMates).length}</small>
                  </button>
                ))}
              </div>
            </>
          )}
          {yourMates.length > 0 ? (
            <>
              <div className="row-between">
                <p className="hint">Your mates · tap to add one</p>
                <button className="btn-text" type="button" onClick={onMates}>Edit</button>
              </div>
              <div className="chips">
                {yourMates.map((m) => (
                  <button key={m.id} className="chip" type="button" aria-pressed={onCard(m.name)} onClick={() => tapMate(m)}>
                    {m.name} <small>{m.hcp || 0}</small>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="hint">Players you add are saved to your mates, so next time you just tap them.</p>
          )}
          <p className="hint">
            Add each player’s playing handicap for this course, or leave it empty to play off scratch.
            {d.pars.length === 9 && ' For 9 holes, use the 9-hole playing handicap (about half the 18-hole one).'}
          </p>
          {d.players.map((name, i) => (
            <div key={i} className="player-row">
              <label className="sr" htmlFor={'pl' + i}>Player {i + 1}</label>
              <input type="text" id={'pl' + i} autoComplete="off" placeholder={'Player ' + (i + 1)} value={name}
                onChange={(e) => setPlayer(i, e.target.value)} />
              <input type="text" className="hcp" inputMode="numeric" maxLength={2} placeholder="Hcp"
                aria-label={'Playing handicap for ' + (name || 'player ' + (i + 1))}
                value={d.hcps[i] || ''} onChange={(e) => setHcp(i, e.target.value)} />
              {d.players.length > 1 && (
                <button className="icon-btn" type="button" aria-label={'Remove player ' + (i + 1)}
                  onClick={() => set({ players: d.players.filter((_, j) => j !== i), hcps: d.hcps.filter((_, j) => j !== i), team: d.team.filter((_, j) => j !== i) })}>
                  {X_ICON}
                </button>
              )}
            </div>
          ))}
          {d.players.length < 8 && (
            <button className="btn btn-ghost" type="button" onClick={() => { focusNew.current = true; set({ players: d.players.concat(''), hcps: d.hcps.concat(0), team: d.team.concat(null) }); }}>Add player</button>
          )}
          {typedNew.length > 0 && (
            <label className="toggle">
              <input type="checkbox" checked={d.saveNew} onChange={(e) => set({ saveNew: e.target.checked })} />
              Save {typedNew.length === 1 ? typedNew[0].trim() : 'new players'} to my mates
            </label>
          )}
        </div>
        {d.players.some((p, i) => p.trim() && d.hcps[i] > 0) && !siDone && (
          <p className="hint" role="status">
            {siDupe ? 'A stroke index is used twice, so ' : 'Without a stroke index on every hole, '}
            handicap strokes can’t go on particular holes. {d.format === 'stableford'
              ? 'Stableford points will be without handicaps.'
              : 'Handicaps come off each player’s total instead.'}
          </p>
        )}
        <div className="stack">
          <p style={{ fontWeight: 700 }}>Side games</p>
          <p className="hint">Optional, on top of the format. The app keeps the count, never money.</p>
          {GAMES.map((g) => {
            const why = unavailable(g, setup);
            return (
              <div key={g} className="game-row">
                <button className="chip" type="button" aria-pressed={!why && !!d.games[g]} disabled={!!why}
                  onClick={() => setD((old) => ({ ...old, games: { ...old.games, [g]: !old.games[g] } }))}>
                  {GAME_NAMES[g]}
                </button>
                <button className="btn-text" type="button" onClick={() => setHelp(g)}>How it works</button>
                {why && <p className="hint">{why}</p>}
              </div>
            );
          })}
          {d.games.better && !unavailable('better', setup) && (
            <div className="stack">
              <p className="hint">Better ball teams. Players are paired in order; tap a team to move someone.</p>
              {named.map((i) => (
                <div key={i} className="team-row">
                  <span>{d.players[i].trim()}</span>
                  <div className="chips">
                    {teams.map((_, t) => (
                      <button key={t} className="chip" type="button" aria-pressed={teamOf(i) === t}
                        aria-label={d.players[i].trim() + ' in team ' + (t + 1)} onClick={() => setTeam(i, t)}>
                        {t + 1}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
              {teams.some((t) => t.length !== 2) && <p className="hint" role="status">Each team needs two players.</p>}
            </div>
          )}
        </div>
        {help && <GameHelp game={help} onClose={() => setHelp(null)} />}
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
