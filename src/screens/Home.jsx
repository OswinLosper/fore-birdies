import Header from '../Header.jsx';
import InstallTip from '../InstallTip.jsx';
import mascot from '../assets/mascot.svg';
import { totalText, fmtDate } from '../scoring.js';
import { myStats } from '../stats.js';

export default function Home({ rounds, user, onNew, onJoin, onOpen, onStats, onUpgrade, onSignOut }) {
  const sorted = rounds.slice().sort((a, b) => b.date - a.date);
  // Your numbers in the banner, once you've finished a round. Tapping them opens Stats.
  const s = myStats(rounds, user);
  const avg = s.avg18 ?? s.avg9;
  return (
    <>
      <Header />
      <section className="hero">
        <div className="mascot"><img src={mascot} alt="" /></div>
        <div className="hero-text stack">
          <h1>{user.guest ? 'Welcome, ' + user.name : 'Ready for a round?'}</h1>
          <p>{user.guest ? 'You’re playing as a guest.' : 'Keep score with your mates, hole by hole.'}</p>
        </div>
        {user.guest
          ? <button className="btn btn-accent" type="button" onClick={onJoin}>Join a round</button>
          : <button className="btn btn-accent" type="button" onClick={onNew}>Start a round</button>}
        {s.rounds > 0 && (
          <button className="strip" type="button" onClick={onStats} aria-label="Your stats">
            <span><b>{s.rounds}</b>{s.rounds === 1 ? 'round' : 'rounds'}</span>
            <span><b>{s.birdies}</b>{s.birdies === 1 ? 'birdie' : 'birdies'}</span>
            <span><b>{Math.round(avg)}</b>{s.avg18 != null ? 'average' : '9-hole avg'}</span>
            <span className="go" aria-hidden="true">›</span>
          </button>
        )}
      </section>
      {!user.guest && (
        <button className="btn btn-ghost btn-block" type="button" style={{ marginTop: 12 }} onClick={onJoin}>Join a mate’s round</button>
      )}
      {user.guest && (
        <section className="guest" style={{ marginTop: 14 }}>
          <p><strong>Keep your rounds.</strong> Make a free account on this phone and the rounds you joined come with you. You can also start your own rounds.</p>
          <button className="btn btn-primary" type="button" onClick={onUpgrade}>Create an account</button>
        </section>
      )}
      <InstallTip />
      <section className="section">
        <h2>Your rounds</h2>
        {!sorted.length ? (
          <p className="muted">No rounds yet. Your rounds will show up here once you tee off.</p>
        ) : (
          <div className="list">
            {sorted.map((r) => {
              const p = r.claims[user.uid] ?? 0;
              const lead = r.players[p] ? r.players[p] + ': ' + totalText(r, p) : '';
              return (
                <button key={r.id} className="item" type="button" onClick={() => onOpen(r)}>
                  <span>
                    <strong>{r.course}</strong>
                    <small>
                      {fmtDate(r.date)}, {r.players.length} {r.players.length === 1 ? 'player' : 'players'}
                      {lead ? ', ' + lead : ''}
                    </small>
                  </span>
                  {r.done ? <span className="pill">Finished</span> : <span className="pill live">Hole {r.hole + 1}</span>}
                </button>
              );
            })}
          </div>
        )}
      </section>
      <div className="account">
        <span>{user.guest ? 'Playing as ' + user.name + ' (guest)' : 'Signed in as ' + (user.email || user.name)}</span>
        <button className="btn-text" type="button" onClick={onSignOut}>Sign out</button>
      </div>
    </>
  );
}
