import { useEffect, useState } from 'react';
import { watchCode } from './data.js';

// The starter's join code, and a WhatsApp link so mates can tap straight in.
export default function CodeBar({ round: r }) {
  const [live, setLive] = useState(false);
  useEffect(() => watchCode(r.code, setLive), [r.code]);

  const link = location.origin + '/?join=' + r.code;
  const text = 'Join my round at ' + r.course + ' on Fore Birdies: ' + link + ' (code ' + r.code + ')';
  return (
    <div className="code-bar">
      <div>
        <small>Mates join with</small>
        <b>{r.code}</b>
        {!live && <small>Works once you have signal</small>}
      </div>
      <a href={'https://wa.me/?text=' + encodeURIComponent(text)} target="_blank" rel="noopener">Share on WhatsApp</a>
    </div>
  );
}
