import flag from './assets/flag.svg';

export default function Header() {
  return (
    <div className="bar">
      <img src={flag} width="38" height="38" alt="" />
      <p className="brand">Fore Birdies</p>
    </div>
  );
}
