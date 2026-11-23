// A golf bag with three clubs in it, for the Golf bag tile and the club on the course.
export default function BagIcon({ size = 40 }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} fill="none" stroke="currentColor" strokeWidth="1.7"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M8.5 9.5h7v11.2a1.3 1.3 0 0 1-1.3 1.3h-4.4a1.3 1.3 0 0 1-1.3-1.3z" />
      <path d="M8.5 9.5c0-1 7-1 7 0" />
      <path d="M10 13.5h4v4h-4z" />
      <path d="M10 8.8L8 3.6" />
      <ellipse cx="7.4" cy="2.9" rx="1.9" ry="1.2" fill="currentColor" stroke="none" transform="rotate(-20 7.4 2.9)" />
      <path d="M12 8.6V3" />
      <path d="M12 3h2" strokeWidth="2.4" />
      <path d="M14 8.8l2.2-4.6" />
      <path d="M16.2 4.2l1.8.6" strokeWidth="2.4" />
      <path d="M15.5 11c2.6.6 2.6 7 0 7.6" />
    </svg>
  );
}
