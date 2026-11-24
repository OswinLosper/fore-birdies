import Header from '../Header.jsx';
import InstallTip from '../InstallTip.jsx';
import mascot from '../assets/mascot.svg';
import BagIcon from '../BagIcon.jsx';
import { totalText, fmtDate } from '../scoring.js';
import { myStats } from '../stats.js';

// A round still being played that started in the last 12 hours, so old unfinished rounds don't nag.
const LIVE = 12 * 60 * 60 * 1000;

export default function Home({ rounds, user, onNew, onJoin, onOpen, onStats, onUpgrade, onMe, onBag }) {
  const sorted = rounds.slice().sort((a, b) => b.date - a.date);
  const live = sorted.find((r) => !r.done && Date.now() - r.date < LIVE);
  // Your numbers in the banner, once you've finished a round. Tapping them opens Stats.
  const s = myStats(rounds, user);
  const avg = s.avg18 ?? s.avg9;
  return (
    <>
      <Header user={user} onMe={onMe} />
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
      {live && (
        <button className="live" type="button" style={{ marginTop: 12 }} onClick={() => onOpen(live)}>
          <span><small>Round in progress</small><strong>{live.course} · hole {live.hole + 1}</strong></span>
          <span className="go">Carry on ›</span>
        </button>
      )}
      {!user.guest && (
        <div className="duo" style={{ marginTop: 12 }}>
          <button type="button" onClick={onBag}><BagIcon />Golf bag</button>
          <button type="button" onClick={onJoin}>
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M10 17l5-5-5-5" /><path d="M15 12H3" /><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" />
            </svg>
            Join a mate’s round
          </button>
        </div>
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
    </>
  );
}
