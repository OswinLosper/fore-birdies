import { useState } from 'react';
import Header from '../Header.jsx';
import { newId, saveMate, deleteMate, saveCrew, deleteCrew, setInCrew } from '../data.js';
import { crewMates, initials, nameTaken } from '../mates.js';

// The Mates tab: your crews, then your mates. Tapping one opens it to change it.
// page = null (the lists), { crew: id | 'new' }, { mate: id | 'new' }.
export default function Mates({ user, mates, crews, onAsk }) {
  const [page, setPage] = useState(null);
  const open = (p) => { setPage(p); window.scrollTo(0, 0); };
  const back = () => open(null);

  if (page?.crew) {
    const crew = crews.find((c) => c.id === page.crew);
    if (crew || page.crew === 'new') return <CrewPage key={page.crew} user={user} crew={crew} mates={mates} onAsk={onAsk} onBack={back} />;
  }
  if (page?.mate) {
    const mate = mates.find((m) => m.id === page.mate);
    if (mate || page.mate === 'new') return <MatePage key={page.mate} user={user} mate={mate} mates={mates} crews={crews} onAsk={onAsk} onBack={back} />;
  }

  return (
    <>
      <Header />
      <div className="stack">
        <h1>Your mates</h1>
        <div className="row-between">
          <h2 className="section-h">Crews</h2>
          <button className="btn-text" type="button" onClick={() => open({ crew: 'new' })}>+ New crew</button>
        </div>
        {!crews.length ? (
          <p className="muted">A crew is a group you often play with, like your Saturday four-ball. Starting a round, tap the crew to add everyone in it.</p>
        ) : (
          <div className="list">
            {crews.map((c) => {
              const names = crewMates(c, mates).map((m) => m.name);
              return (
                <button key={c.id} className="item" type="button" onClick={() => open({ crew: c.id })}>
                  <span className="item-l">
                    <span className="crew-dot" aria-hidden="true">{initials(c.name)}</span>
                    <span>
                      <strong>{c.name}</strong>
                      <small>{names.length ? names.join(', ') : 'No one in it yet'}</small>
                    </span>
                  </span>
                  <span className="chev" aria-hidden="true">›</span>
                </button>
              );
            })}
          </div>
        )}
        <div className="row-between">
          <h2 className="section-h">Mates</h2>
          <button className="btn-text" type="button" onClick={() => open({ mate: 'new' })}>+ Add a mate</button>
        </div>
        {!mates.length ? (
          <p className="muted">Add the people you play with and their handicaps, then pick them when you start a round.</p>
        ) : (
          <div className="list">
            {mates.map((m) => {
              const in_ = crews.filter((c) => c.members.includes(m.id)).map((c) => c.name);
              return (
                <button key={m.id} className="item" type="button" onClick={() => open({ mate: m.id })}>
                  <span>
                    <strong>{m.name}</strong>
                    <small>Handicap {m.hcp || 0}{in_.length ? ' · ' + in_.join(', ') : ''}</small>
                  </span>
                  <span className="chev" aria-hidden="true">›</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

function Switch({ label, on, onChange }) {
  return (
    <label className="switch-row">
      <span>{label}</span>
      <span className="switch">
        <input type="checkbox" role="switch" aria-label={label} checked={on} onChange={(e) => onChange(e.target.checked)} />
        <span aria-hidden="true" />
      </span>
    </label>
  );
}

const hcpOf = (v) => { const n = parseInt(v, 10); return n >= 0 ? Math.min(54, n) : 0; };

function CrewPage({ user, crew, mates, onAsk, onBack }) {
  const [name, setName] = useState(crew?.name || '');
  const [members, setMembers] = useState(crew?.members || []);
  const [error, setError] = useState('');

  function save() {
    if (!name.trim()) { setError('Give the crew a name.'); return; }
    saveCrew(user.uid, { id: crew?.id || newId(user.uid, 'crews'), name: name.trim(), members });
    onBack();
  }
  function remove() {
    onAsk({
      title: 'Delete ' + crew.name + '?', text: 'The crew goes. The mates in it stay.', yes: 'Delete',
      then: () => { deleteCrew(user.uid, crew.id); onBack(); },
    });
  }

  return (
    <>
      <Header />
      <div className="stack">
        <p><button className="btn-text" type="button" style={{ paddingLeft: 0 }} onClick={onBack}>‹ Mates</button></p>
        <h1>{crew ? crew.name : 'New crew'}</h1>
        <label className="field">Crew name
          <input type="text" autoComplete="off" placeholder="Saturday four-ball" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <div className="card">
          <p className="hint">Who’s in it</p>
          {!mates.length && <p className="muted" style={{ marginTop: 8 }}>Add some mates first, then put them in the crew.</p>}
          {mates.map((m) => (
            <Switch key={m.id} label={m.name} on={members.includes(m.id)}
              onChange={(on) => setMembers(on ? [...members, m.id] : members.filter((x) => x !== m.id))} />
          ))}
        </div>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" type="button" onClick={save}>{crew ? 'Save' : 'Make crew'}</button>
        {crew && (
          <p style={{ textAlign: 'center' }}>
            <button className="btn-text" type="button" onClick={remove}>Delete crew</button>
          </p>
        )}
      </div>
    </>
  );
}

function MatePage({ user, mate, mates, crews, onAsk, onBack }) {
  const [name, setName] = useState(mate?.name || '');
  const [hcp, setHcp] = useState(mate?.hcp || 0);
  const [inCrews, setInCrews] = useState(() => crews.filter((c) => mate && c.members.includes(mate.id)).map((c) => c.id));
  const [error, setError] = useState('');

  function save() {
    if (!name.trim()) { setError('Add their name.'); return; }
    const taken = nameTaken(mates, name, user.name, mate?.id);
    if (taken) { setError(taken); return; }
    const id = mate?.id || newId(user.uid, 'mates');
    saveMate(user.uid, { id, name: name.trim(), hcp });
    crews.forEach((c) => {
      const want = inCrews.includes(c.id);
      if (want !== c.members.includes(id)) setInCrew(user.uid, c.id, id, want);
    });
    onBack();
  }
  function remove() {
    onAsk({
      title: 'Remove ' + mate.name + '?', text: 'They come off your mates and your crews. Your old rounds with them stay.', yes: 'Remove',
      then: () => { deleteMate(user.uid, mate.id, crews); onBack(); },
    });
  }

  return (
    <>
      <Header />
      <div className="stack">
        <p><button className="btn-text" type="button" style={{ paddingLeft: 0 }} onClick={onBack}>‹ Mates</button></p>
        <h1>{mate ? mate.name : 'Add a mate'}</h1>
        <label className="field">Name
          <input type="text" autoComplete="off" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">Playing handicap
          <input type="text" className="hcp" inputMode="numeric" maxLength={2} placeholder="0"
            value={hcp || ''} onChange={(e) => setHcp(hcpOf(e.target.value))} />
        </label>
        {crews.length > 0 && (
          <div className="card">
            <p className="hint">{mate ? 'Crews' : 'Add to a crew'}</p>
            {crews.map((c) => (
              <Switch key={c.id} label={c.name} on={inCrews.includes(c.id)}
                onChange={(on) => setInCrews(on ? [...inCrews, c.id] : inCrews.filter((x) => x !== c.id))} />
            ))}
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" type="button" onClick={save}>{mate ? 'Save' : 'Add mate'}</button>
        {mate && (
          <p style={{ textAlign: 'center' }}>
            <button className="btn-text" type="button" onClick={remove}>Remove from my mates</button>
          </p>
        )}
      </div>
    </>
  );
}
