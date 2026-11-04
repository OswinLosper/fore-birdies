import { useEffect, useRef } from 'react';
import mascot from './assets/mascot.svg';
import { label } from './scoring.js';

export default function Celebrate({ heroes, par, hole, onClose }) {
  const btn = useRef(null);
  useEffect(() => { btn.current?.focus(); }, []);

  const best = heroes.reduce((a, b) => (b.s < a.s ? b : a));
  const title = label(best.s, par);
  const names = heroes.map((x) => x.name);
  const who = names.length === 1 ? names[0] : names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1];
  const what = heroes.length === 1 ? 'a ' + title.toLowerCase() : 'it under par';

  return (
    <div className="celebrate" role="dialog" aria-modal="true" aria-labelledby="celebrate-title">
      <div className="mascot"><img src={mascot} alt="" /></div>
      <h2 id="celebrate-title">{title}!</h2>
      <p>{who} made {what} on hole {hole + 1}. Time to rub it in.</p>
      <button ref={btn} className="btn btn-accent" type="button" onClick={onClose}>Keep playing</button>
    </div>
  );
}
