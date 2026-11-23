// The bar along the bottom of Home and Stats.
const TABS = [
  { view: 'home', name: 'Rounds', icon: <><path d="M6 21V4" /><path d="M6 4l11 4-11 4" /><path d="M3 21h8" /></> },
  { view: 'stats', name: 'Stats', icon: <><path d="M5 20v-8" /><path d="M12 20V5" /><path d="M19 20v-6" /></> },
];

export default function Tabs({ view, onGo }) {
  return (
    <nav className="tabs" aria-label="Main">
      {TABS.map((t) => (
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
