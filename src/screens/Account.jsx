import { useState } from 'react';
import Header from '../Header.jsx';
import { setName } from '../auth.js';
import { initials } from '../mates.js';

// Everything about you: your name, your bag, your mates, and signing out.
export default function Account({ user, bagCount, mates, crews, onBag, onMates, onUpgrade, onSignOut, onBack }) {
  const [editing, setEditing] = useState(false);
  const [name, setNameText] = useState(user.name);
  const [error, setError] = useState('');

  async function saveName() {
    if (!name.trim()) { setError('Add your name.'); return; }
    try {
      await setName(name);
      setEditing(false);
      setError('');
    } catch (e) {
      setError('Couldn’t save your name. Changing it needs signal.');
    }
  }

  return (
    <>
      <Header />
      <div className="stack">
        <p><button className="btn-text" type="button" style={{ paddingLeft: 0 }} onClick={onBack}>‹ Home</button></p>
        <div className="avatar" aria-hidden="true">{initials(user.name)}</div>
        <h1 className="centre">{user.name}</h1>
        <p className="muted centre">{user.guest ? 'Playing as a guest on this phone' : user.email + ' · ' + user.via}</p>
        {user.guest ? (
          <section className="guest">
            <p><strong>Keep your rounds.</strong> Make a free account on this phone and the rounds you joined come with you.</p>
            <button className="btn btn-primary" type="button" onClick={onUpgrade}>Create an account</button>
          </section>
        ) : (
          <div className="card">
            {editing ? (
              <div className="stack" style={{ padding: '8px 0' }}>
                <label className="field">Your name
                  <input type="text" autoComplete="name" value={name} onChange={(e) => setNameText(e.target.value)} />
                </label>
                <p className="hint">What your mates see when you start or join a round. Rounds you already played keep the old name.</p>
                {error && <p className="error" role="alert">{error}</p>}
                <div className="prompt-btns">
                  <button className="btn btn-ghost" type="button" onClick={() => { setEditing(false); setNameText(user.name); setError(''); }}>Cancel</button>
                  <button className="btn btn-primary" type="button" onClick={saveName}>Save</button>
                </div>
              </div>
            ) : (
              <button className="row" type="button" onClick={() => setEditing(true)}>
                <span>Your name<small>What your mates see on the card</small></span>
                <span>{user.name} ›</span>
              </button>
            )}
            <button className="row" type="button" onClick={onBag}>
              <span>Golf bag</span>
              <span>{bagCount ? bagCount + (bagCount === 1 ? ' club' : ' clubs') : 'Set it up'} ›</span>
            </button>
            <button className="row" type="button" onClick={onMates}>
              <span>Mates and crews</span>
              <span>{mates.length} · {crews.length} ›</span>
            </button>
          </div>
        )}
        <button className="btn btn-ghost btn-block" type="button" onClick={onSignOut}>Sign out</button>
      </div>
    </>
  );
}
