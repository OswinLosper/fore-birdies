// Distances on the course. Positions are [lat, lon]; a green is its outline, a list of positions
// (or a single position when only the middle is known).

const R = 6371000;
const rad = Math.PI / 180;

export function metres([a, b], [c, d]) {
  const h = Math.sin(((c - a) * rad) / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin(((d - b) * rad) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function centre(ring) {
  return [ring.reduce((s, p) => s + p[0], 0) / ring.length, ring.reduce((s, p) => s + p[1], 0) / ring.length];
}

// Front, middle and back of the green as seen from where you stand: where the line from you
// through the middle of the green crosses its edge, nearest and furthest.
// A green with only its middle known gives { middle } alone.
export function toGreen(me, green) {
  const mid = green.length === 1 ? green[0] : centre(green);
  const middle = metres(me, mid);
  if (green.length < 3) return { middle };
  // Flat x/y in metres around where you stand: fine over a few hundred metres.
  const k = Math.cos(me[0] * rad);
  const xy = ([lat, lon]) => [(lon - me[1]) * rad * R * k, (lat - me[0]) * rad * R];
  const [mx, my] = xy(mid);
  const len = Math.hypot(mx, my) || 1;
  const [ux, uy] = [mx / len, my / len];
  const hits = [];
  const pts = green.map(xy);
  for (let i = 0; i < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
    const ex = bx - ax, ey = by - ay;
    const den = ux * ey - uy * ex;
    if (Math.abs(den) < 1e-9) continue;
    const t = (ax * ey - ay * ex) / den; // distance along your line
    const s = (ax * uy - ay * ux) / den; // where along this edge
    if (t > 0 && s >= 0 && s <= 1) hits.push(t);
  }
  if (hits.length < 2) return { middle };
  return { front: Math.min(...hits), middle, back: Math.max(...hits) };
}

// Metres or yards, remembered on this phone.
const UNITS = 'fore-birdies-units';
export function getUnits() {
  try { return localStorage.getItem(UNITS) === 'yd' ? 'yd' : 'm'; } catch (e) { return 'm'; }
}
export function setUnits(u) {
  try { localStorage.setItem(UNITS, u); } catch (e) {}
}
export const inUnits = (m, units) => Math.round(units === 'yd' ? m / 0.9144 : m);

// The South African course list, built from OpenStreetMap by scripts/build-courses.mjs and
// kept on the phone by the app's offline cache.
let indexPromise = null;
export function courseIndex() {
  indexPromise ||= fetch('/courses/index.json').then((r) => (r.ok ? r.json() : [])).catch(() => { indexPromise = null; return []; });
  return indexPromise;
}

// { "1": { par?, green: [[lat, lon], ...] }, ... } for a course on the list, or {} when it has no greens.
const holesCache = new Map();
export function courseHoles(ref) {
  if (!ref) return Promise.resolve({});
  if (!holesCache.has(ref)) {
    holesCache.set(ref, fetch('/courses/' + ref + '.json')
      .then((r) => (r.ok ? r.json() : { holes: {} }))
      .then((c) => c.holes || {})
      .catch(() => { holesCache.delete(ref); return {}; }));
  }
  return holesCache.get(ref);
}

// Where the phone is, once. Resolves to [lat, lon] or null (refused, no fix, or too slow).
export function hereOnce() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve([p.coords.latitude, p.coords.longitude]),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 5 * 60 * 1000 },
    );
  });
}
