import { useCallback, useEffect, useRef, useState } from 'react';
import { watchUser, finishLinkSignIn, logOut } from './auth.js';
import { load, uid } from './storage.js';
import {
  watchRounds, watchCourses, saveCourse, deleteCourse, newRoundId, newCode, createRound, saveRoundChanges, deleteRoundDoc,
  importLocal, saveUi, leaveRound, watchMates, watchCrews, saveMate, newId, setInCrew, watchBag, watchPhoto,
} from './data.js';
import Home from './screens/Home.jsx';
import Setup from './screens/Setup.jsx';
import Round from './screens/Round.jsx';
import Summary from './screens/Summary.jsx';
import SignIn from './screens/SignIn.jsx';
import Join from './screens/Join.jsx';
import Stats from './screens/Stats.jsx';
import Mates from './screens/Mates.jsx';
import Account from './screens/Account.jsx';
import Bag from './screens/Bag.jsx';
import { CLUBS } from './bag.js';
import Tabs from './Tabs.jsx';
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
  const [mates, setMates] = useState([]);
  const [crews, setCrews] = useState([]);
  const [bag, setBag] = useState({});
  const [photo, setPhoto] = useState(null);
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

  // Fade out the green splash from index.html once we know who you are.
  useEffect(() => {
    const splash = document.getElementById('splash');
    if (user === undefined || !splash) return;
    splash.classList.add('gone');
    setTimeout(() => splash.remove(), 300);
  }, [user]);

  useEffect(() => {
    if (!user) { setRounds([]); setCourses([]); setMates([]); setCrews([]); setBag({}); setPhoto(null); roundsRef.current = []; return undefined; }
    const stopRounds = watchRounds(user.uid, (rs) => { roundsRef.current = rs; setRounds(rs); });
    if (user.guest) return stopRounds;
    // Guests have no saved courses and nothing to import.
    importLocal(user, load());
    const stopCourses = watchCourses(user.uid, setCourses);
    const stopMates = watchMates(user.uid, setMates);
    const stopCrews = watchCrews(user.uid, setCrews);
    const stopBag = watchBag(user.uid, setBag);
    const stopPhoto = watchPhoto(user.uid, setPhoto);
    return () => { stopRounds(); stopCourses(); stopMates(); stopCrews(); stopBag(); stopPhoto(); };
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
    const kept = d.players.map((p, i) => [p.trim(), d.hcps[i] || 0]).filter(([p]) => p);
    const players = kept.map(([p]) => p);
    const hcps = kept.map(([, h]) => h);
    const existing = courses.find((c) => c.name.toLowerCase() === name.toLowerCase());
    // A 9-hole round only updates the front nine of a saved 18-hole course; the back nine stay.
    const keep = existing && existing.pars.length > d.pars.length ? existing.pars.length : d.pars.length;
    const pars = d.pars.concat((existing?.pars || []).slice(d.pars.length, keep));
    const si = d.si.concat((existing?.si || []).slice(d.pars.length, keep));
    while (si.length < pars.length) si.push(null);
    saveCourse(user.uid, {
      id: existing ? existing.id : uid(), name, pars, si: si.some((x) => x != null) ? si : null,
      courseRef: d.courseRef || existing?.courseRef || null,
    });
    // The starter is the first player when that's their own name.
    const claims = players[0] === user.name ? { [user.uid]: 0 } : {};
    const r = {
      id: newRoundId(), code: newCode(), ownerId: user.uid, claims, memberNames: { [user.uid]: user.name },
      course: name, courseRef: d.courseRef || null, pars: d.pars.slice(),
      si: d.si.some((x) => x != null) ? d.si.slice() : null, hcps: hcps.some((x) => x > 0) ? hcps : null,
      format: d.format, players,
      games: Object.keys(d.games).length ? d.games : null, teams: d.teams || null, ctp: {},
      scores: players.map(() => d.pars.map(() => null)), by: players.map(() => d.pars.map(() => null)),
      hole: 0, done: false, date: Date.now(), cheered: {},
    };
    createRound(user, r);
    d.newMates.forEach((m) => saveMate(user.uid, { id: newId(user.uid, 'mates'), ...m }));
    saveUi(r.id, { hole: 0, cheered: {}, crew: d.crew });
    r.crew = d.crew;
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

  function removeRound() {
    deleteRoundDoc(round);
    roundsRef.current = roundsRef.current.filter((x) => x.id !== roundId);
    setRounds(roundsRef.current);
    setRoundId(null);
    go('home');
  }

  function deleteRound() {
    setAsking({ title: 'Delete this round?', text: 'This can’t be undone.', yes: 'Delete', then: removeRound });
  }

  // Calling a round off before the end. Same as deleting it, but said for mid-round.
  function cancelRound() {
    const mates = Object.keys(round.memberNames).length > 1;
    setAsking({
      title: 'Cancel this round?',
      text: (mates ? 'It’s deleted for everyone who joined, scores and all.' : 'It’s deleted, scores and all.') + ' This can’t be undone.',
      yes: 'Cancel round', no: 'Keep playing', then: removeRound,
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

  function removeCourse(c) {
    setAsking({
      title: 'Remove ' + c.name + '?', text: 'It comes off your saved courses. Rounds you played there stay.', yes: 'Remove',
      then: () => deleteCourse(user.uid, c.id),
    });
  }

  // From the end of a round: a player you typed in becomes one of your mates, and maybe joins the crew.
  function addMate(m, crewId) {
    const id = newId(user.uid, 'mates');
    saveMate(user.uid, { id, name: m.name, hcp: m.hcp });
    if (crewId) setInCrew(user.uid, crewId, id, true);
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
    screen = <Setup courses={courses} mates={mates} crews={crews} you={user.name} onTeeOff={teeOff} onCancel={() => go('home')}
      onRemoveCourse={removeCourse} onMates={() => go('mates')} />;
  } else if (view === 'round' && round) {
    screen = <Round round={round} me={user} bag={bag} onChange={updateRound} onNext={leaveHole} onExit={() => go('home')}
      onCancel={cancelRound} onLeave={leaveNow} />;
  } else if (view === 'summary' && round) {
    screen = (
      <Summary
        round={round}
        starter={starter}
        user={user}
        mates={mates}
        crews={crews}
        onAddMate={addMate}
        onEdit={() => { updateRound((r) => { r.done = false; r.hole = 0; }); go('round'); }}
        onBack={() => go('round')}
        onDone={() => go('home')}
        onDelete={deleteRound}
        onLeave={leaveNow}
      />
    );
  } else if (view === 'account') {
    screen = (
      <Account user={user} photo={photo} bagCount={CLUBS.filter(([k]) => bag[k]?.on).length} mates={mates} crews={crews}
        onBag={() => go('bag')} onMates={() => go('mates')} onUpgrade={() => go('upgrade')} onSignOut={signOutNow}
        onBack={() => go('home')} />
    );
  } else if (view === 'bag' && !user.guest) {
    screen = <Bag user={user} bag={bag} onBack={() => go('home')} />;
  } else if (view === 'mates' && !user.guest) {
    screen = <Mates user={user} mates={mates} crews={crews} onAsk={setAsking} />;
  } else if (view === 'stats') {
    screen = <Stats rounds={rounds} user={user} />;
  } else {
    screen = (
      <Home
        rounds={rounds}
        user={user}
        photo={photo}
        onNew={() => go('setup')}
        onJoin={() => go('join')}
        onUpgrade={() => go('upgrade')}
        onOpen={(r) => { setRoundId(r.id); go(r.done ? 'summary' : 'round'); }}
        onStats={() => go('stats')}
        onMe={() => go('account')}
        onBag={() => go('bag')}
      />
    );
  }

  // The tab bar is only on the main screens, never while scoring or setting up.
  const tabs = !!user && [Stats, Mates, Home, Account, Bag].includes(screen.type);

  return (
    <>
      <main className={'wrap' + (tabs ? ' with-tabs' : '')} aria-live="polite">{screen}</main>
      {tabs && <Tabs view={screen.type === Home || screen.type === Account || screen.type === Bag ? 'home' : view} guest={user.guest} onGo={go} />}
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
