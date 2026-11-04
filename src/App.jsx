import { useRef, useState } from 'react';
import { load, save, uid, fill } from './storage.js';
import Home from './screens/Home.jsx';
import Setup from './screens/Setup.jsx';
import Round from './screens/Round.jsx';
import Summary from './screens/Summary.jsx';
import Celebrate from './Celebrate.jsx';

export default function App() {
  const [db, setDb] = useState(load);
  // Latest data, so callbacks that run later (after the birdie screen) never work on a stale copy.
  const dbRef = useRef(db);
  const [view, setView] = useState('home');
  const [roundId, setRoundId] = useState(null);
  const [celebration, setCelebration] = useState(null);

  const round = roundId ? db.rounds.find((r) => r.id === roundId) : null;

  function commit(next) { dbRef.current = next; save(next); setDb(next); }

  function go(v) { setView(v); window.scrollTo(0, 0); }

  // Copy, change one round, save. Data is small, so a full clone keeps this simple.
  function updateRound(fn) {
    const next = structuredClone(dbRef.current);
    const r = next.rounds.find((x) => x.id === roundId);
    fn(r);
    commit(next);
    return r;
  }

  function teeOff(d) {
    const name = d.course.trim();
    const players = d.players.map((p) => p.trim()).filter(Boolean);
    const next = structuredClone(dbRef.current);
    const course = next.courses.find((c) => c.name.toLowerCase() === name.toLowerCase());
    if (course) { course.name = name; course.pars = d.pars.slice(); }
    else next.courses.push({ id: uid(), name, pars: d.pars.slice() });
    const r = {
      id: uid(), course: name, pars: d.pars.slice(), format: d.format, players,
      scores: players.map(() => fill(d.pars.length, null)), hole: 0, done: false, date: Date.now(), cheered: {},
    };
    next.rounds.push(r);
    commit(next);
    setRoundId(r.id);
    go('round');
  }

  // Leaving a hole with "Next hole" / "Finish round" saves anyone left on the default par,
  // then celebrates birdie-or-better once per hole.
  function leaveHole() {
    const h = round.hole;
    const r = updateRound((r) => {
      r.scores.forEach((row) => { if (row[h] == null) row[h] = r.pars[h]; });
    });
    const par = r.pars[h];
    const last = h === r.pars.length - 1;
    const proceed = () => {
      updateRound((x) => { if (last) x.done = true; else x.hole = h + 1; });
      if (last) go('summary'); else window.scrollTo(0, 0);
    };
    const heroes = r.cheered?.[h] ? [] :
      r.players.map((name, p) => ({ name, s: r.scores[p][h] })).filter((x) => x.s < par);
    if (!heroes.length) { proceed(); return; }
    updateRound((x) => { x.cheered = x.cheered || {}; x.cheered[h] = true; });
    setCelebration({ heroes, par, hole: h, then: proceed });
  }

  function deleteRound() {
    if (!window.confirm('Delete this round? This can’t be undone.')) return;
    commit({ ...dbRef.current, rounds: dbRef.current.rounds.filter((x) => x.id !== roundId) });
    setRoundId(null);
    go('home');
  }

  let screen;
  if (view === 'setup') {
    screen = <Setup courses={db.courses} onTeeOff={teeOff} onCancel={() => go('home')} />;
  } else if (view === 'round' && round) {
    screen = <Round round={round} onChange={updateRound} onNext={leaveHole} onExit={() => go('home')} />;
  } else if (view === 'summary' && round) {
    screen = (
      <Summary
        round={round}
        onEdit={() => { updateRound((r) => { r.done = false; r.hole = 0; }); go('round'); }}
        onDone={() => go('home')}
        onDelete={deleteRound}
      />
    );
  } else {
    screen = (
      <Home
        rounds={db.rounds}
        onNew={() => go('setup')}
        onOpen={(r) => { setRoundId(r.id); go(r.done ? 'summary' : 'round'); }}
      />
    );
  }

  return (
    <>
      <main className="wrap" aria-live="polite">{screen}</main>
      {celebration && (
        <Celebrate
          {...celebration}
          onClose={() => { const then = celebration.then; setCelebration(null); then(); }}
        />
      )}
    </>
  );
}
