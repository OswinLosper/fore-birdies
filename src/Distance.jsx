import { lazy, Suspense, useEffect, useState } from 'react';
import { toGreen, getUnits, setUnits, inUnits, courseHoles, metres, centre } from './geo.js';
import { greenKey, watchGreens, saveGreen } from './data.js';

// The satellite hole map (and its map library) only downloads when someone opens it.
// With no signal the download fails, so say so instead of breaking the round screen.
const HoleMap = lazy(() => import('./HoleMap.jsx').catch(() => ({
  default: ({ onClose }) => (
    <div className="holemap">
      <p className="hm-banner">The map needs signal. Distances still work on the scores screen.</p>
      <div className="hm-bottom"><button className="btn hm-btn-ghost" type="button" onClick={onClose}>Back to scores</button></div>
    </div>
  ),
})));
const MAP = !!import.meta.env.VITE_ESRI_KEY;

// Distances turn on once per phone. After that the app follows your position while a round is open.
const GPS_ON = 'fore-birdies-gps';
const gpsWanted = () => { try { return localStorage.getItem(GPS_ON) === 'on'; } catch (e) { return false; } };

// Further than this from the green and you're not on this hole (or not on the course yet).
const TOO_FAR = 700;
// A fix worse than this would mislead more than it helps.
const ROUGH = 30;
// Saving a green needs a better fix, because everyone on the course will use it.
const SAVE_FIX = 15;
// Closer than this to another hole's green: probably the wrong green, so ask first.
const SAME_GREEN = 25;

// Greens come from the course list (OpenStreetMap outlines, with front and back) and, for holes
// the map doesn't have, from players who saved them by standing on them (middle only).
export default function Distance({ round, hole, me }) {
  const key = greenKey(round);
  const [mapped, setMapped] = useState(null);
  const [saved, setSaved] = useState({});
  const [on, setOn] = useState(gpsWanted);
  const [fix, setFix] = useState(null);
  const [problem, setProblem] = useState('');
  const [units, setU] = useState(getUnits);
  const [saving, setSaving] = useState(false);
  const [warn, setWarn] = useState('');
  // Set when the save is next to another hole's green and needs a second tap.
  const [nearOther, setNearOther] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);

  useEffect(() => {
    let live = true;
    setMapped(null);
    courseHoles(round.courseRef).then((h) => { if (live) setMapped(h); });
    return () => { live = false; };
  }, [round.courseRef]);

  useEffect(() => {
    setSaved({});
    return key ? watchGreens(key, setSaved) : undefined;
  }, [key]);

  useEffect(() => { setSaving(false); setWarn(''); setNearOther(false); setMapOpen(false); }, [hole]);

  useEffect(() => {
    if (!on) return undefined;
    if (!navigator.geolocation) { setProblem('This phone can’t share its location with the app.'); return undefined; }
    const id = navigator.geolocation.watchPosition(
      (p) => { setProblem(''); setFix({ at: [p.coords.latitude, p.coords.longitude], acc: p.coords.accuracy }); },
      (err) => setProblem(err.code === 1
        ? 'Location is switched off for Fore Birdies. Allow it in your phone’s settings to see distances.'
        : 'Looking for GPS…'),
      { enableHighAccuracy: true, maximumAge: 2000, timeout: 20000 },
    );
    return () => navigator.geolocation.clearWatch(id);
  }, [on]);

  if (!mapped || !key) return null;

  const n = String(hole + 1);
  const fromMap = mapped[n];
  const fromPlayer = !fromMap && saved[n];
  const green = (fromMap || fromPlayer)?.green;
  const canSave = !me.guest && !fromMap;
  const u = units === 'yd' ? 'yd' : 'm';
  const flip = () => { const next = units === 'yd' ? 'm' : 'yd'; setUnits(next); setU(next); };
  const turnOn = () => { try { localStorage.setItem(GPS_ON, 'on'); } catch (e) {} setOn(true); };
  const good = fix && fix.acc <= ROUGH;

  // Another hole's green right next to this spot, if any: probably the wrong green.
  function nextTo(at) {
    const all = { ...saved, ...mapped };
    return Object.keys(all).find((h) => h !== n && metres(at, centre(all[h].green)) < SAME_GREEN) || null;
  }
  // Saved by standing on the green or by tapping it on the hole map. Newest save wins.
  function store(at) {
    saveGreen(me, key, hole + 1, at);
    setSaved((s) => ({ ...s, [n]: { green: [at], by: me.uid, byName: me.name } }));
  }

  function save(force) {
    if (!fix || fix.acc > SAVE_FIX) {
      setWarn('Wait for a better GPS fix (±' + inUnits(SAVE_FIX, units) + ' ' + u + ' or better), then save.');
      return;
    }
    if (!force) {
      const near = nextTo(fix.at);
      if (near) { setWarn('That’s right next to hole ' + near + '’s green. Is it the same green?'); setNearOther(true); return; }
    }
    store(fix.at);
    setSaving(false);
    setWarn('');
    setNearOther(false);
  }

  let body;
  if (!on) {
    body = (
      <button className="btn btn-ghost btn-block" type="button" onClick={turnOn}>
        {green ? 'Show distances to the green' : 'Turn on GPS distances'}
      </button>
    );
  } else if (problem) {
    body = <p className="muted">{problem}</p>;
  } else if (saving) {
    body = (
      <div className="stack">
        <p>Stand in the middle of the green{fix ? ' (GPS ±' + inUnits(fix.acc, units) + ' ' + u + ')' : ''}, then tap Save. Everyone who plays this course will use it.</p>
        {warn && <p className="error" role="alert">{warn}</p>}
        <button className="btn btn-primary btn-block" type="button" onClick={() => save(nearOther)}>
          {nearOther ? 'Yes, save it' : 'Save this green'}
        </button>
        <button className="btn-text" type="button" onClick={() => { setSaving(false); setWarn(''); setNearOther(false); }}>Cancel</button>
      </div>
    );
  } else if (!green) {
    body = <p className="muted">No green saved for this hole yet.{canSave ? ' Save it when you get there.' : ''}</p>;
  } else if (!fix) {
    body = <p className="muted">Looking for GPS…</p>;
  } else if (!good) {
    body = <p className="muted">Waiting for a better GPS fix (now ±{inUnits(fix.acc, units)} {u}).</p>;
  } else {
    const d = toGreen(fix.at, green);
    body = d.middle > TOO_FAR
      ? (
        <p className="muted">
          You’re {d.middle >= 1000 ? (d.middle / 1000).toFixed(1) + ' km' : inUnits(d.middle, units) + ' ' + u} from this green.
          {' '}Distances show once you’re on the course.
        </p>
      )
      : (
        <div className="dist-row" aria-label="Distance to the green">
          {d.front != null && <div><span>Front</span><b>{inUnits(d.front, units)}</b></div>}
          <div className="mid"><span>Middle</span><b>{inUnits(d.middle, units)}</b></div>
          {d.back != null && <div><span>Back</span><b>{inUnits(d.back, units)}</b></div>}
        </div>
      );
  }

  return (
    <section className="dist" aria-live="polite">
      <div className="dist-head">
        <p style={{ fontWeight: 700 }}>To the green</p>
        <button className="btn-text" type="button" onClick={flip} aria-label={'Showing ' + (u === 'm' ? 'metres' : 'yards') + '. Switch'}>
          {u === 'm' ? 'metres' : 'yards'} ⇄
        </button>
      </div>
      {body}
      {MAP && !saving && (
        <button className="btn btn-ghost btn-block" type="button" style={{ marginTop: 8 }}
          onClick={() => { if (!on) turnOn(); setMapOpen(true); }}>
          Hole map
        </button>
      )}
      {on && canSave && !saving && (
        <button className="btn-text" type="button" onClick={() => setSaving(true)}>
          {fromPlayer ? 'Fix this green' : 'Save this green'}
        </button>
      )}
      {mapOpen && (
        <Suspense fallback={<div className="holemap"><p className="hm-banner">Loading the map…</p></div>}>
          <HoleMap
            round={round} hole={hole} par={round.pars[hole]} fix={fix} units={units} canSave={canSave}
            data={{ green, tee: fromMap?.tee, len: fromMap?.len, fromMap: !!fromMap }}
            nearOther={nextTo} onSave={store} onClose={() => setMapOpen(false)}
          />
        </Suspense>
      )}
      <p className="hint">
        {good && green && !saving && <>GPS ±{inUnits(fix.acc, units)} {u}. </>}
        {fromPlayer && <>Saved by {fromPlayer.by === me.uid ? 'you' : fromPlayer.byName}. </>}
        {fromMap && <>Green © <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors.</>}
      </p>
    </section>
  );
}
