import { useEffect, useRef } from 'react';
import { GAME_NAMES } from './games.js';

// "How it works" for each side game: the same rules as plans/side-games/BRIEF.md.
const HELP = {
  skins: (
    <>
      <p>Every hole is a prize, called a skin. Win the hole outright and you win the skin.</p>
      <h3>Winning a hole</h3>
      <p>The lowest score on the hole wins one skin, but only if it’s the lowest on its own. If two or more players tie for the lowest score, nobody wins it.</p>
      <h3>Carry-overs</h3>
      <p>When nobody wins a hole, its skin carries over. The next hole is then worth 2 skins, then 3, and so on, until someone wins a hole outright and takes all of them.</p>
      <h3>Handicaps</h3>
      <p>With handicaps and a stroke index on every hole, skins use net scores: your score minus the strokes you get on that hole. Otherwise they use the strokes you took.</p>
      <h3>End of the round</h3>
      <p>If the last hole is tied, the skins still carrying over aren’t won by anyone. Settle them however your group likes: a chip-off, split them, or leave them.</p>
      <h3>Example</h3>
      <p>Hole 1: Sam 4, Lee 4, Max 5. Sam and Lee tie, so the skin carries. Hole 2: everyone scores 5, so 2 skins carry. Hole 3: Sam 3, the others 4. <b>Sam takes 3 skins.</b></p>
    </>
  ),
  nassau: (
    <>
      <p>Three contests in one round: the <b>front 9</b>, the <b>back 9</b> and the <b>full 18</b>. Each one is won on its own, so a bad start doesn’t end your day.</p>
      <h3>Two players or two teams</h3>
      <p>It’s match play. On each hole the lower score wins the hole and a tie halves it. Whoever wins more holes over the stretch wins it. The app keeps the state like a club match: “Sam 2 up thru 6”, “All square”.</p>
      <p>With better ball on, the two teams play it, each counting its better score on every hole.</p>
      <h3>Three or more players</h3>
      <p>Match play needs two sides, so it’s the lowest total over each stretch instead. In Stableford it’s the most points.</p>
      <h3>Ties and handicaps</h3>
      <p>A stretch that ends level is halved: nobody wins it. Net scores are used when handicaps and a stroke index on every hole are entered.</p>
      <h3>Example</h3>
      <p>On the front 9, Sam wins 3 holes and Lee wins 2: <b>Sam wins the front, 1 up.</b> On the back 9, Lee wins 2 more holes than Sam: <b>Lee wins the back, 2 up</b>, and with that <b>the overall, 1 up.</b></p>
      <p className="muted">Only for 18-hole rounds.</p>
    </>
  ),
  better: (
    <>
      <p>You play in pairs. Each of you plays your own ball, but on every hole the team only counts the <b>better</b> of your two scores. If your partner has a shocker, your par saves the hole.</p>
      <h3>Scoring</h3>
      <p><b>Stableford</b> (the club “4BBB”): the team takes the higher of the two players’ points on each hole. Most points wins.</p>
      <p><b>Stroke play:</b> the team takes the lower of the two scores on each hole. Lowest total wins.</p>
      <h3>Handicaps</h3>
      <p>Each player gets their own strokes on their own holes before the better score is picked. Clubs often play better ball off a reduced handicap. The app uses each handicap exactly as you type it, so enter the reduced one if your group plays that way.</p>
      <h3>Example</h3>
      <p>Stableford, one hole: Sam scores 1 point and Lee 3. <b>The team scores 3.</b></p>
      <p className="muted">For 4, 6 or 8 players, in teams of two.</p>
    </>
  ),
  ctp: (
    <>
      <p>On every par 3, the player whose tee shot finishes closest to the flag wins that hole.</p>
      <h3>The usual rule</h3>
      <p>The ball must finish <b>on the green</b>. A ball nearer the flag but in the fringe or a bunker doesn’t count.</p>
      <h3>In the app</h3>
      <p>Each par 3 has a “Closest to the pin” line. Once you’ve had a look on the green, tap who won, or <b>Nobody on the green</b>. The app doesn’t measure it: your group decides. Anyone in the round can set it or change it.</p>
      <h3>At the end</h3>
      <p>A count per player, for example “Lee 2, Sam 1”.</p>
    </>
  ),
};

export default function GameHelp({ game, onClose }) {
  // Focus the box itself, so it opens at the top rather than scrolled down to the button.
  const box = useRef(null);
  useEffect(() => {
    box.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="confirm-back" onClick={onClose}>
      <div ref={box} tabIndex={-1} className="confirm card stack help" role="dialog" aria-modal="true" aria-labelledby="help-title"
        onClick={(e) => e.stopPropagation()}>
        <h2 id="help-title">{GAME_NAMES[game]}</h2>
        {HELP[game]}
        <p className="muted">The app keeps the count. Anything you play for is between you and your mates.</p>
        <button className="btn btn-primary btn-block" type="button" onClick={onClose}>Got it</button>
      </div>
    </div>
  );
}
