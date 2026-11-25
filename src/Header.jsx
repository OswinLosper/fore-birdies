import flag from './assets/flag.svg';
import Avatar from './Avatar.jsx';

// The logo, and on Home your photo or initials, which open your account.
export default function Header({ user, photo, onMe }) {
  return (
    <div className="bar">
      <img src={flag} width="38" height="38" alt="" />
      <p className="brand">Fore Birdies</p>
      {onMe && <button className="me" type="button" aria-label="Your account" onClick={onMe}><Avatar name={user.name} photo={photo} /></button>}
    </div>
  );
}
