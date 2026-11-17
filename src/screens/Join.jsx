import { useState } from 'react';
import Header from '../Header.jsx';
import { signInGuest, setGuestName, authMessage } from '../auth.js';
import { joinByCode, claimPlayer, cleanCode } from '../data.js';

// Join someone else's round with their code, then pick which player you are.
// Works without an account: you join as a guest.
export default function Join({ user, initialCode, onJoined, onCancel }) {
  const [code, setCode] = useState(cleanCode(initialCode || ''));
  const [round, setRound] = useState(null);
  const [me, setMe] = useState(user);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function find(e) {
    e.preventDefault();
    if (code.length !== 6) { setError('Codes are 6 letters and numbers, like K7MP2Q.'); return; }
    setError(''); setBusy(true);
    try {
      const u = user || await signInGuest();
      setMe(u);
      const r = await joinByCode(u, code);
      if (!r) { setError('No round with that code. Check it with whoever started the round.'); return; }
      if (u.uid in r.claims) { onJoined(r.id); return; }
      setRound(r);
    } catch (err) {
      if (err.code?.startsWith('auth/')) setError(authMessage(err));
      else if (err.code === 'unavailable' || !navigator.onLine) setError('Joining needs signal. Try again when you have some.');
      else setError('Couldn’t join that round. Check the code and try again.');
    } finally { setBusy(false); }
  }

  async function pick(p) {
    claimPlayer(me, round, p);
    if (me.guest) await setGuestName(round.players[p]).catch(() => {});
    onJoined(round.id);
  }

  if (round) {
    const taken = Object.values(round.claims);
    return (
      <>
        <Header />
        <div className="stack">
          <h1>You’re in</h1>
          <p className="muted">{round.course}, {round.players.length} players. Which one are you?</p>
          <div className="list">
            {round.players.map((name, p) => (
              <button key={p} className="item" type="button" disabled={taken.includes(p)} onClick={() => pick(p)}>
                <span><strong>{name}</strong></span>
                {taken.includes(p) && <span className="pill">Taken</span>}
              </button>
            ))}
          </div>
          <p className="hint">Picking your name links your scores to you. Anyone in the round can still enter scores for anyone.</p>
          <button className="btn-text" type="button" onClick={() => onJoined(round.id)}>I’m not on the card, just keeping score</button>
        </div>
      </>
    );
  }

  return (
    <>
      <Header />
      <form className="stack" onSubmit={find} noValidate>
        <h1>Join a round</h1>
        <p className="muted">Ask whoever started the round for their 6-character code.</p>
        <label className="field">Round code
          <input type="text" className="code-input" autoComplete="off" autoCapitalize="characters" spellCheck="false"
            placeholder="K7MP2Q" value={code} onChange={(e) => setCode(cleanCode(e.target.value))} />
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn btn-primary btn-block" type="submit" disabled={busy}>{busy ? 'Finding the round…' : 'Join round'}</button>
        {!user && <p className="hint">No account needed. You can make one later to keep your rounds.</p>}
        <button className="btn-text" type="button" onClick={onCancel}>Cancel</button>
      </form>
    </>
  );
}
