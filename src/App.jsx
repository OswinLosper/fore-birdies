import { useCallback, useEffect, useRef, useState } from 'react';
import { watchUser, finishLinkSignIn, logOut } from './auth.js';
import { load, uid } from './storage.js';
import {
  watchRounds, watchCourses, saveCourse, newRoundId, createRound, saveRoundChanges, deleteRoundDoc, importLocal, saveUi,
} from './data.js';
import Home from './screens/Home.jsx';
import Setup from './screens/Setup.jsx';
import Round from './screens/Round.jsx';
import Summary from './screens/Summary.jsx';
import SignIn from './screens/SignIn.jsx';
import Celebrate from './Celebrate.jsx';
import Confirm from './Confirm.jsx';

export default function App() {
  // undefined while Firebase checks whether this phone is already signed in.
  const [user, setUser] = useState(undefined);
  const [rounds, setRounds] = useState([]);
  const [courses, setCourses] = useState([]);
  // Latest rounds, so callbacks that run later (after the birdie screen) never work on a stale copy.
  const roundsRef = useRef(rounds);
  const [view, setView] = useState('home');
  const [roundId, setRoundId] = useState(null);
  const [celebration, setCelebration] = useState(null);
  const [asking, setAsking] = useState(null);
  const closeAsk = useCallback(() => setAsking(null), []);

  useEffect(() => {
    finishLinkSignIn().catch((err) => console.error('email link', err));
    return watchUser(setUser);
  }, []);

  useEffect(() => {
    if (!user) { setRounds([]); setCourses([]); roundsRef.current = []; return undefined; }
    importLocal(user, load());
    const stopRounds = watchRounds(user.uid, (rs) => { roundsRef.current = rs; setRounds(rs); });
    const stopCourses = watchCourses(user.uid, setCourses);
    return () => { stopRounds(); stopCourses(); };
  }, [user?.uid]);

  const round = roundId ? rounds.find((r) => r.id === roundId) : null;

  function go(v) { setView(v); window.scrollTo(0, 0); }

  // Copy, change, then save only what changed. The new copy is used straight away,
  // before Firebase reports it back.
  function updateRound(fn) {
    const before = roundsRef.current.find((x) => x.id === roundId);
    const after = structuredClone(before);
    fn(after);
    saveRoundChanges(user, before, after);
    roundsRef.current = roundsRef.current.map((x) => (x.id === roundId ? after : x));
    setRounds(roundsRef.current);
    return after;
  }

  function teeOff(d) {
    const name = d.course.trim();
    const players = d.players.map((p) => p.trim()).filter(Boolean);
    const existing = courses.find((c) => c.name.toLowerCase() === name.toLowerCase());
    saveCourse(user.uid, { id: existing ? existing.id : uid(), name, pars: d.pars.slice() });
    const r = {
      id: newRoundId(), ownerId: user.uid, course: name, pars: d.pars.slice(), format: d.format, players,
      scores: players.map(() => d.pars.map(() => null)), by: players.map(() => d.pars.map(() => null)),
      hole: 0, done: false, date: Date.now(), cheered: {},
    };
    createRound(user, r);
    saveUi(r.id, { hole: 0, cheered: {} });
    roundsRef.current = [...roundsRef.current, r];
    setRounds(roundsRef.current);
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
    updateRound((x) => { x.cheered = { ...x.cheered, [h]: true }; });
    setCelebration({ heroes, par, hole: h, then: proceed });
  }

  function deleteRound() {
    setAsking({
      title: 'Delete this round?', text: 'This can’t be undone.', yes: 'Delete',
      then: () => {
        deleteRoundDoc(roundId);
        roundsRef.current = roundsRef.current.filter((x) => x.id !== roundId);
        setRounds(roundsRef.current);
        setRoundId(null);
        go('home');
      },
    });
  }

  function signOutNow() {
    setAsking({
      title: 'Sign out?', text: 'Your rounds stay saved in your account.', yes: 'Sign out',
      then: () => { setRoundId(null); setView('home'); logOut(); },
    });
  }

  if (user === undefined) return <main className="wrap" />;

  let screen;
  if (!user) {
    screen = <SignIn />;
  } else if (view === 'setup') {
    screen = <Setup courses={courses} you={user.name} onTeeOff={teeOff} onCancel={() => go('home')} />;
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
        rounds={rounds}
        user={user}
        onNew={() => go('setup')}
        onOpen={(r) => { setRoundId(r.id); go(r.done ? 'summary' : 'round'); }}
        onSignOut={signOutNow}
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
      {asking && (
        <Confirm {...asking} onNo={closeAsk} onYes={() => { const then = asking.then; setAsking(null); then(); }} />
      )}
    </>
  );
}
