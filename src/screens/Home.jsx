import Header from '../Header.jsx';
import InstallTip from '../InstallTip.jsx';
import mascot from '../assets/mascot.svg';
import { totalText, fmtDate } from '../scoring.js';

export default function Home({ rounds, onNew, onOpen }) {
  const sorted = rounds.slice().sort((a, b) => b.date - a.date);
  return (
    <>
      <Header />
      <section className="hero">
        <div className="mascot"><img src={mascot} alt="" /></div>
        <div className="hero-text stack">
          <h1>Ready for a round?</h1>
          <p>Keep score with your mates, hole by hole.</p>
        </div>
        <button className="btn btn-accent" type="button" onClick={onNew}>Start a round</button>
      </section>
      <InstallTip />
      <section className="section">
        <h2>Your rounds</h2>
        {!sorted.length ? (
          <p className="muted">No rounds yet. Your rounds will show up here once you tee off.</p>
        ) : (
          <div className="list">
            {sorted.map((r) => {
              const lead = r.players[0] ? r.players[0] + ': ' + totalText(r, 0) : '';
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
