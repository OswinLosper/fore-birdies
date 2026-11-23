import flag from './assets/flag.svg';

import { initials } from './mates.js';

// The logo, and on Home your initials, which open your account.
export default function Header({ user, onMe }) {
  return (
    <div className="bar">
      <img src={flag} width="38" height="38" alt="" />
      <p className="brand">Fore Birdies</p>
      {onMe && <button className="me" type="button" aria-label="Your account" onClick={onMe}>{initials(user.name)}</button>}
    </div>
  );
}
