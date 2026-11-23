import { useState } from 'react';
import Header from '../Header.jsx';
import { saveClub } from '../data.js';
import { getUnits, inUnits } from '../geo.js';
import { CLUBS, CLUB_NAMES, MAX_CLUBS } from '../bag.js';

// Your golf bag: a club per row with how far you hit it. Tapping one opens it to change it.
export default function Bag({ user, bag, onBack }) {
  const [club, setClub] = useState(null);
  const u = getUnits();
  const unit = u === 'yd' ? 'yd' : 'm';
  const open = (k) => { setClub(k); window.scrollTo(0, 0); };
  const carried = CLUBS.filter(([k]) => bag[k]?.on).length;

  if (club) return <ClubPage key={club} user={user} k={club} club={bag[club]} units={u} carried={carried} onBack={() => open(null)} />;

  return (
    <>
      <Header />
      <div className="stack">
        <p><button className="btn-text" type="button" style={{ paddingLeft: 0 }} onClick={onBack}>‹ Home</button></p>
        <h1>Your golf bag</h1>
        <p className="hint">How far you usually hit each club on a normal shot, roll and all. On the course the app picks the club for the distance to the green.</p>
        <div className="card">
          {CLUBS.map(([k, name]) => {
            const c = bag[k];
            return (
              <button key={k} className="row" type="button" onClick={() => open(k)}>
                <span>{name}{!c?.on && <span className="muted" style={{ fontWeight: 600 }}> · not in your bag</span>}</span>
                <span>{c?.on ? (c.m ? inUnits(c.m, u) + ' ' + unit + ' ›' : 'Add distance ›') : 'Add ›'}</span>
              </button>
            );
          })}
        </div>
        <p className="hint">
          {carried ? carried + (carried === 1 ? ' club' : ' clubs') + ' in your bag, plus your putter. ' : ''}
          The rules allow {MAX_CLUBS} clubs, putter included.
        </p>
        {!carried && <p className="hint">Not sure? Start with your 7 iron: most clubs are about 10 m apart.</p>}
      </div>
    </>
  );
}

function ClubPage({ user, k, club, units, carried, onBack }) {
  const unit = units === 'yd' ? 'yards' : 'metres';
  const [on, setOn] = useState(club ? club.on : true);
  const [dist, setDist] = useState(club?.m ? String(inUnits(club.m, units)) : '');

  function save() {
    const n = parseInt(dist, 10);
    const m = n > 0 ? Math.round(units === 'yd' ? n * 0.9144 : n) : null;
    saveClub(user.uid, k, { on, m });
    onBack();
  }

  return (
    <>
      <Header />
      <div className="stack">
        <p><button className="btn-text" type="button" style={{ paddingLeft: 0 }} onClick={onBack}>‹ Golf bag</button></p>
        <h1>{CLUB_NAMES[k]}</h1>
        <div className="card">
          <label className="switch-row">
            <span>In my bag</span>
            <span className="switch">
              <input type="checkbox" role="switch" aria-label="In my bag" checked={on} onChange={(e) => setOn(e.target.checked)} />
              <span aria-hidden="true" />
            </span>
          </label>
        </div>
        {on && !club?.on && carried >= MAX_CLUBS - 1 && (
          <p className="hint" role="status">That makes more than {MAX_CLUBS} clubs with your putter. Fine for practice, not for a competition.</p>
        )}
        <label className="field">How far you hit it ({unit})
          <input type="text" className="club-in" inputMode="numeric" maxLength={3} placeholder="–" value={dist}
            onChange={(e) => setDist(e.target.value.replace(/\D/g, ''))} />
        </label>
        <p className="hint">A normal, full swing. Not your best one.</p>
        <button className="btn btn-primary btn-block" type="button" onClick={save}>Save</button>
      </div>
    </>
  );
}
