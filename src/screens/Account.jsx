import { useRef, useState } from 'react';
import Header from '../Header.jsx';
import Avatar from '../Avatar.jsx';
import { setName } from '../auth.js';
import { savePhoto } from '../data.js';
import { shrinkPhoto } from '../photo.js';

// Everything about you: your photo, your name, your bag, your mates, and signing out.
export default function Account({ user, photo, bagCount, mates, crews, onBag, onMates, onUpgrade, onSignOut, onBack }) {
  const [editing, setEditing] = useState(false);
  const [name, setNameText] = useState(user.name);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const picker = useRef(null);

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

  async function pickPhoto(e) {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    try {
      savePhoto(user.uid, await shrinkPhoto(file));
      setPhotoError('');
    } catch (err) {
      setPhotoError('Couldn’t open that photo. Try another one.');
    }
  }

  return (
    <>
      <Header />
      <div className="stack">
        <p><button className="btn-text" type="button" style={{ paddingLeft: 0 }} onClick={onBack}>‹ Home</button></p>
        {user.guest ? (
          <div className="avatar" aria-hidden="true"><Avatar name={user.name} /></div>
        ) : (
          <>
            <button className="avatar" type="button" aria-label={photo ? 'Change your photo' : 'Add a photo'} onClick={() => picker.current.click()}>
              <Avatar name={user.name} photo={photo} />
            </button>
            <input ref={picker} type="file" accept="image/*" hidden onChange={pickPhoto} />
            <p className="photo-btns">
              <button className="btn-text" type="button" onClick={() => picker.current.click()}>{photo ? 'Change photo' : 'Add a photo'}</button>
              {photo && <button className="btn-text" type="button" onClick={() => savePhoto(user.uid, null)}>Remove</button>}
            </p>
            {photoError && <p className="error centre" role="alert">{photoError}</p>}
          </>
        )}
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
