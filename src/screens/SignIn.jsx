import { useState } from 'react';
import Header from '../Header.jsx';
import mascot from '../assets/mascot.svg';
import {
  signInGoogle, signInPassword, createAccount, resetPassword, sendLink, upgradeGoogle, upgradeEmail, authMessage,
} from '../auth.js';

const EYE = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" />
  </svg>
);
const EYE_OFF = (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M9.9 5.2A10.4 10.4 0 0 1 12 5c6.4 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.2M6.6 6.6A17.4 17.4 0 0 0 2 12s3.6 7 10 7a9.7 9.7 0 0 0 5.4-1.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2M2 2l20 20" />
  </svg>
);

// upgrade: a guest making an account. It keeps the same user, so their joined rounds come along.
export default function SignIn({ upgrade, guestName, onJoin, onCancel }) {
  const [mode, setMode] = useState(upgrade ? 'create' : 'signin');
  const [name, setName] = useState(guestName || '');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  async function run(fn, done) {
    setError(''); setNote(''); setBusy(true);
    try { await fn(); if (done) setNote(done); }
    catch (err) { setError(authMessage(err)); }
    finally { setBusy(false); }
  }

  function submit(e) {
    e.preventDefault();
    if (upgrade) run(() => upgradeEmail(name, email, password));
    else if (mode === 'create') run(() => createAccount(name, email, password));
    else run(() => signInPassword(email, password));
  }

  return (
    <>
      <Header />
      <section className="hero">
        <div className="mascot"><img src={mascot} alt="" /></div>
        <div className="hero-text stack">
          <h1>{upgrade ? 'Keep your rounds' : 'Sign in to keep score'}</h1>
          <p>{upgrade
            ? 'Make your free account. The rounds you joined as a guest come with you.'
            : 'Your rounds are saved to your account, so they’re safe even if you lose your phone.'}</p>
        </div>
      </section>
      <div className="stack" style={{ marginTop: 18 }}>
        {!upgrade && (
          <>
            <button className="btn btn-accent btn-block" type="button" onClick={onJoin}>Got a code? Join a mate’s round</button>
            <p className="hint">No account needed to join. To start your own rounds, sign in below.</p>
          </>
        )}
        <p className="hint">The first sign-in needs signal, so do it at home or in the clubhouse. After that the app works on the course without signal.</p>
        <button className="btn btn-ghost btn-block" type="button" disabled={busy} onClick={() => run(upgrade ? upgradeGoogle : signInGoogle)}>
          Continue with Google
        </button>
        <p className="muted or">or use your email</p>
        {!upgrade && <div className="seg" role="group" aria-label="Sign in or create an account">
          <button type="button" aria-pressed={mode === 'signin'} onClick={() => { setMode('signin'); setError(''); }}>Sign in</button>
          <button type="button" aria-pressed={mode === 'create'} onClick={() => { setMode('create'); setError(''); }}>Create account</button>
        </div>}
        <form className="stack" onSubmit={submit} noValidate>
          {mode === 'create' && (
            <label className="field">Your name
              <input type="text" autoComplete="name" placeholder="What your mates call you" value={name}
                onChange={(e) => setName(e.target.value)} />
            </label>
          )}
          <label className="field">Email
            <input type="email" autoComplete="email" inputMode="email" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </label>
          <div className="field">
            <label htmlFor="password">Password</label>
            <div className="pw">
              <input id="password" type={showPw ? 'text' : 'password'} autoComplete={mode === 'create' ? 'new-password' : 'current-password'}
                autoCapitalize="none" autoCorrect="off" spellCheck="false" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button className="pw-eye" type="button" aria-label={showPw ? 'Hide password' : 'Show password'} aria-pressed={showPw}
                onClick={() => setShowPw((v) => !v)}>
                {showPw ? EYE_OFF : EYE}
              </button>
            </div>
          </div>
          {error && <p className="error" role="alert">{error}</p>}
          {note && <p className="note" role="status">{note}</p>}
          <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
            {mode === 'create' ? 'Create account' : 'Sign in'}
          </button>
        </form>
        {upgrade ? (
          <button className="btn-text" type="button" onClick={onCancel}>Not now</button>
        ) : <div className="links">
          {mode === 'signin' && (
            <button className="btn-text" type="button" disabled={busy}
              onClick={() => run(() => resetPassword(email), 'Check your email for a link to reset your password.')}>
              Forgot password?
            </button>
          )}
          <button className="btn-text" type="button" disabled={busy}
            onClick={() => run(() => sendLink(email), 'Check your email and tap the link to sign in. Open it on this phone.')}>
            Email me a sign-in link instead
          </button>
        </div>}
      </div>
    </>
  );
}
