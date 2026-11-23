// The bar along the bottom of the main screens. Guests have no mates to keep.
const TABS = [
  { view: 'home', name: 'Rounds', icon: <><path d="M6 21V4" /><path d="M6 4l11 4-11 4" /><path d="M3 21h8" /></> },
  { view: 'mates', name: 'Mates', icon: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8" /><path d="M18 14.3c2.1.7 3.5 2.8 3.5 5.7" /></> },
  { view: 'stats', name: 'Stats', icon: <><path d="M5 20v-8" /><path d="M12 20V5" /><path d="M19 20v-6" /></> },
];

export default function Tabs({ view, guest, onGo }) {
  return (
    <nav className="tabs" aria-label="Main">
      {TABS.filter((t) => !guest || t.view !== 'mates').map((t) => (
        <button key={t.view} type="button" aria-current={view === t.view ? 'page' : undefined}
          onClick={() => onGo(t.view)}>
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2.2"
            strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{t.icon}</svg>
          {t.name}
        </button>
      ))}
    </nav>
  );
}
