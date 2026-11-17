import { useCallback, useEffect, useRef, useState } from 'react';
import { watchUser, finishLinkSignIn, logOut } from './auth.js';
import { load, uid } from './storage.js';
import {
  watchRounds, watchCourses, saveCourse, newRoundId, newCode, createRound, saveRoundChanges, deleteRoundDoc,
  importLocal, saveUi, leaveRound,
} from './data.js';
import Home from './screens/Home.jsx';
import Setup from './screens/Setup.jsx';
import Round from './screens/Round.jsx';
import Summary from './screens/Summary.jsx';
import SignIn from './screens/SignIn.jsx';
import Join from './screens/Join.jsx';
import Celebrate from './Celebrate.jsx';
import Confirm from './Confirm.jsx';

// A shared link looks like https://fore-birdies.vercel.app/?join=K7MP2Q
function codeFromLink() {
  const code = new URLSearchParams(location.search).get('join');
  if (code) history.replaceState(null, '', '/');
  return code;
}

export default function App() {
  // undefined while Firebase checks whether this phone is already signed in.
  const [user, setUser] = useState(undefined);
  const [rounds, setRounds] = useState([]);
  const [courses, setCourses] = useState([]);
  // Latest rounds, so callbacks that run later (after the birdie screen) never work on a stale copy.
  const roundsRef = useRef(rounds);
  const [joinCode] = useState(codeFromLink);
  const [view, setView] = useState(joinCode ? 'join' : 'home');
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
    const stopRounds = watchRounds(user.uid, (rs) => { roundsRef.current = rs; setRounds(rs); });
    if (user.guest) return stopRounds;
    // Guests have no saved courses and nothing to import.
    importLocal(user, load());
    const stopCourses = watchCourses(user.uid, setCourses);
    return () => { stopRounds(); stopCourses(); };
  }, [user?.uid, user?.guest]);

  const round = roundId ? rounds.find((r) => r.id === roundId) : null;
  const starter = !!(round && user && round.ownerId === user.uid);

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
    // The starter is the first player when that's their own name.
    const claims = players[0] === user.name ? { [user.uid]: 0 } : {};
    const r = {
      id: newRoundId(), code: newCode(), ownerId: user.uid, claims, memberNames: { [user.uid]: user.name },
      course: name, pars: d.pars.slice(), format: d.format, players,
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
  // then celebrates birdie-or-better once per hole. Only the starter finishes the round;
  // everyone else goes to the leaderboard from the last hole.
  function leaveHole() {
    const h = round.hole;
    const r = updateRound((r) => {
      r.scores.forEach((row) => { if (row[h] == null) row[h] = r.pars[h]; });
    });
    const par = r.pars[h];
    const last = h === r.pars.length - 1;
    const proceed = () => {
      updateRound((x) => { if (last) x.done = x.done || starter; else x.hole = h + 1; });
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
        deleteRoundDoc(round);
        roundsRef.current = roundsRef.current.filter((x) => x.id !== roundId);
        setRounds(roundsRef.current);
        setRoundId(null);
        go('home');
      },
    });
  }

  function leaveNow() {
    setAsking({
      title: 'Leave this round?', text: 'It disappears from your rounds. The others keep playing.', yes: 'Leave',
      then: () => {
        leaveRound(user, roundId);
        roundsRef.current = roundsRef.current.filter((x) => x.id !== roundId);
        setRounds(roundsRef.current);
        setRoundId(null);
        go('home');
      },
    });
  }

  function openJoined(id) {
    setRoundId(id);
    go('round');
  }

  function signOutNow() {
    setAsking({
      title: 'Sign out?',
      text: user.guest
        ? 'You’re a guest, so you’ll lose these rounds on this phone. Create an account first to keep them.'
        : 'Your rounds stay saved in your account.',
      yes: 'Sign out',
      then: () => { setRoundId(null); setView('home'); logOut(); },
    });
  }

  if (user === undefined) return <main className="wrap" />;

  let screen;
  if (view === 'join') {
    screen = <Join user={user} initialCode={joinCode} onJoined={openJoined} onCancel={() => go('home')} />;
  } else if (!user) {
    screen = <SignIn onJoin={() => go('join')} />;
  } else if (view === 'upgrade' && user.guest) {
    screen = <SignIn upgrade guestName={user.name} onCancel={() => go('home')} />;
  } else if (view === 'setup' && !user.guest) {
    screen = <Setup courses={courses} you={user.name} onTeeOff={teeOff} onCancel={() => go('home')} />;
  } else if (view === 'round' && round) {
    screen = <Round round={round} me={user} onChange={updateRound} onNext={leaveHole} onExit={() => go('home')} />;
  } else if (view === 'summary' && round) {
    screen = (
      <Summary
        round={round}
        starter={starter}
        onEdit={() => { updateRound((r) => { r.done = false; r.hole = 0; }); go('round'); }}
        onBack={() => go('round')}
        onDone={() => go('home')}
        onDelete={deleteRound}
        onLeave={leaveNow}
      />
    );
  } else {
    screen = (
      <Home
        rounds={rounds}
        user={user}
        onNew={() => go('setup')}
        onJoin={() => go('join')}
        onUpgrade={() => go('upgrade')}
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
