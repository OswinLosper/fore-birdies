// Builds the South African course list from OpenStreetMap into public/courses/.
//   index.json   every named course: { id, name, lat, lon, greens }
//   <id>.json    courses with mapped greens: { id, name, holes: { "1": { par?, green: [[lat, lon], ...] } } }
// Run with: npm run courses. The free OSM servers are often busy, so it retries.
// A green is only kept when OSM says which hole it belongs to; never guessed.
import { mkdir, writeFile, rm } from 'node:fs/promises';

const SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const QUERY = `[out:json][timeout:600];
area["ISO3166-1"="ZA"][admin_level=2]->.za;
(way["leisure"="golf_course"](area.za);relation["leisure"="golf_course"](area.za););out tags geom;
way["golf"="hole"](area.za);out tags geom;
(way["golf"="green"](area.za);relation["golf"="green"](area.za););out tags geom;`;

async function fetchOsm() {
  for (let attempt = 0; attempt < 12; attempt++) {
    const url = SERVERS[attempt % SERVERS.length];
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'User-Agent': 'fore-birdies-course-build/1.0', Accept: 'application/json' },
        body: new URLSearchParams({ data: QUERY }),
      });
      const text = await res.text();
      if (res.ok && text.startsWith('{')) return JSON.parse(text).elements;
      console.log(`${url}: ${res.status}, retrying`);
    } catch (err) {
      console.log(`${url}: ${err.message}, retrying`);
    }
    await new Promise((r) => setTimeout(r, Math.min(300, 15 * 2 ** attempt) * 1000));
  }
  throw new Error('OpenStreetMap servers stayed busy. Try again later.');
}

const round = (x) => Math.round(x * 1e6) / 1e6;
const pt = (p) => [round(p.lat), round(p.lon)];

// Outer rings of a way or multipolygon relation.
function rings(e) {
  if (e.type === 'way') return e.geometry ? [e.geometry.map(pt)] : [];
  return (e.members || []).filter((m) => m.role !== 'inner' && m.geometry).map((m) => m.geometry.map(pt));
}

function inside([y, x], ring) {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [yi, xi] = ring[i], [yj, xj] = ring[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function metres([a, b], [c, d]) {
  const r = Math.PI / 180;
  const h = Math.sin(((c - a) * r) / 2) ** 2 + Math.cos(a * r) * Math.cos(c * r) * Math.sin(((d - b) * r) / 2) ** 2;
  return 2 * 6371000 * Math.asin(Math.sqrt(h));
}

function centre(ring) {
  const n = ring.length;
  return [round(ring.reduce((s, p) => s + p[0], 0) / n), round(ring.reduce((s, p) => s + p[1], 0) / n)];
}

// Keep the outline small: at most 16 points is plenty for front and back.
function slim(ring) {
  const r = ring.length > 1 && ring[0][0] === ring.at(-1)[0] && ring[0][1] === ring.at(-1)[1] ? ring.slice(0, -1) : ring;
  if (r.length <= 16) return r;
  return Array.from({ length: 16 }, (_, i) => r[Math.floor((i * r.length) / 16)]);
}

const elements = await fetchOsm();
const courses = elements.filter((e) => e.tags?.leisure === 'golf_course' && e.tags?.name)
  .map((e) => ({ id: e.type[0] + e.id, name: e.tags.name.trim(), rings: rings(e) }))
  .filter((c) => c.rings.length);
const holes = elements.filter((e) => e.tags?.golf === 'hole' && e.tags?.ref && e.geometry?.length > 1);
const greens = elements.filter((e) => e.tags?.golf === 'green').flatMap(rings).filter((r) => r.length > 2);

const out = new Map(courses.map((c) => [c.id, {}]));
const seen = new Map(courses.map((c) => [c.id, new Map()]));
for (const h of holes) {
  const end = pt(h.geometry.at(-1));
  const course = courses.find((c) => c.rings.some((r) => inside(end, r)));
  if (!course) continue;
  // The hole line ends on its green: the green it ends inside, or one within 30 m.
  const green = greens.find((g) => inside(end, g))
    || greens.map((g) => [g, metres(end, centre(g))]).filter(([, d]) => d < 30).sort((a, b) => a[1] - b[1])[0]?.[0];
  if (!green) continue;
  const ref = h.tags.ref.trim();
  const refs = seen.get(course.id);
  refs.set(ref, (refs.get(ref) || 0) + 1);
  const par = parseInt(h.tags.par, 10);
  out.get(course.id)[ref] = { ...(par >= 3 && par <= 6 ? { par } : {}), green: slim(green) };
}

await rm('public/courses', { recursive: true, force: true });
await mkdir('public/courses', { recursive: true });
const index = [];
let full = 0;
for (const c of courses) {
  const h = out.get(c.id);
  // Two holes with the same number on one course (e.g. 27-hole clubs): we can't tell them apart.
  for (const [ref, n] of seen.get(c.id)) if (n > 1) delete h[ref];
  const greensCount = Object.keys(h).length;
  const [lat, lon] = centre(c.rings.flat());
  index.push({ id: c.id, name: c.name, lat, lon, greens: greensCount });
  if (greensCount) {
    await writeFile(`public/courses/${c.id}.json`, JSON.stringify({ id: c.id, name: c.name, holes: h }));
    if (greensCount >= 18) full++;
  }
}
index.sort((a, b) => a.name.localeCompare(b.name));
await writeFile('public/courses/index.json', JSON.stringify(index));
console.log(`${index.length} named courses, ${index.filter((c) => c.greens).length} with greens, ${full} with 18 or more.`);
