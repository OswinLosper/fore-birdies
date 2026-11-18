// Builds the South African course list from OpenStreetMap into public/courses/.
//   index.json   every named course: { id, name, lat, lon, greens }
//   <id>.json    courses with mapped greens: { id, name, holes: { "1": { par?, tee, green: [[lat, lon], ...] } } }
//                tee is where the hole line starts, so the hole map can turn tee-to-green.
// Run with: npm run courses. The free OSM servers are often busy, so it retries.
// The raw download is kept in scripts/.osm-za.json; `npm run courses -- --cached` rebuilds from it.
// A green is only kept when OSM says which hole it belongs to; never guessed.
import { mkdir, writeFile, readFile, readdir, rm } from 'node:fs/promises';

const CACHE = 'scripts/.osm-za.json';

const SERVERS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  'https://maps.mail.ru/osm/tools/overpass/api/interpreter',
];
const QUERY = `[out:json][timeout:600];
area["ISO3166-1"="ZA"][admin_level=2]->.za;
(way["leisure"="golf_course"](area.za);relation["leisure"="golf_course"](area.za););out geom;
way["golf"="hole"](area.za);out tags geom;
(way["golf"="green"](area.za);relation["golf"="green"](area.za););out geom;`;

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
      if (res.ok && text.startsWith('{')) {
        const data = JSON.parse(text);
        // Backup servers can lag weeks behind, so say how fresh this copy of the map is.
        console.log(`Map data from ${url}, as of ${data.osm3s?.timestamp_osm_base}.`);
        return data.elements;
      }
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

// Inside an outline drawn in several pieces (a multipolygon's member ways): count edge crossings
// across all the pieces together, which works whatever order the pieces come in.
function insideParts([y, x], parts) {
  let hit = false;
  for (const p of parts) {
    for (let i = 1; i < p.length; i++) {
      const [yi, xi] = p[i], [yj, xj] = p[i - 1];
      if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
    }
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

const elements = process.argv.includes('--cached')
  ? JSON.parse(await readFile(CACHE, 'utf8'))
  : await fetchOsm();
await writeFile(CACHE, JSON.stringify(elements));
const courses = elements.filter((e) => e.tags?.leisure === 'golf_course' && e.tags?.name)
  .map((e) => ({ id: e.type[0] + e.id, name: e.tags.name.trim(), rings: rings(e) }))
  .filter((c) => c.rings.length);
const holes = elements.filter((e) => e.tags?.golf === 'hole' && e.tags?.ref && e.geometry?.length > 1);
const greens = elements.filter((e) => e.tags?.golf === 'green').flatMap(rings).filter((r) => r.length > 2);

const out = new Map(courses.map((c) => [c.id, {}]));
const seen = new Map(courses.map((c) => [c.id, new Map()]));
for (const h of holes) {
  const end = pt(h.geometry.at(-1));
  const course = courses.find((c) => insideParts(end, c.rings));
  if (!course) continue;
  // The hole line ends on its green: the green it ends inside, or one within 30 m.
  const green = greens.find((g) => inside(end, g))
    || greens.map((g) => [g, metres(end, centre(g))]).filter(([, d]) => d < 30).sort((a, b) => a[1] - b[1])[0]?.[0];
  if (!green) continue;
  const ref = h.tags.ref.trim();
  const refs = seen.get(course.id);
  refs.set(ref, (refs.get(ref) || 0) + 1);
  const par = parseInt(h.tags.par, 10);
  out.get(course.id)[ref] = { ...(par >= 3 && par <= 6 ? { par } : {}), tee: pt(h.geometry[0]), green: slim(green) };
}

for (const c of courses) {
  // Two holes with the same number on one course (e.g. 27-hole clubs): we can't tell them apart.
  for (const [ref, n] of seen.get(c.id)) if (n > 1) delete out.get(c.id)[ref];
  c.mid = centre(c.rings.flat());
}

// OSM sometimes draws one course as several areas with the same name (Bellville, split by a road).
// Join them into one course when they're close together, each has numbered greens, and no hole
// number appears in two of them, so two different courses that share a name are never mixed up.
const groups = [];
for (const c of courses) {
  const g = seen.get(c.id).size && groups.find((x) => x[0].name.toLowerCase() === c.name.toLowerCase()
    && seen.get(x[0].id).size
    && x.some((y) => metres(y.mid, c.mid) < 2000)
    && !x.some((y) => [...seen.get(y.id).keys()].some((ref) => seen.get(c.id).has(ref))));
  if (g) g.push(c); else groups.push([c]);
}

// The last list, so ids that rounds and saved courses already point at keep working.
const before = await readFile('public/courses/index.json', 'utf8').then(JSON.parse).catch(() => []);
// Old ids already pointing at another course (file name -> the course id inside it).
const aliases = new Map();
for (const f of await readdir('public/courses').catch(() => [])) {
  if (f === 'index.json') continue;
  const inside = JSON.parse(await readFile(`public/courses/${f}`, 'utf8')).id;
  if (inside !== f.replace('.json', '')) aliases.set(f.replace('.json', ''), inside);
}
await rm('public/courses', { recursive: true, force: true });
await mkdir('public/courses', { recursive: true });
const index = [];
let full = 0, joined = 0;
for (const g of groups) {
  // The part with the most greens gives the course its id; the others' ids still work, so
  // saved courses and rounds that point at them keep their distances.
  g.sort((a, b) => Object.keys(out.get(b.id)).length - Object.keys(out.get(a.id)).length);
  const h = Object.assign({}, ...g.map((c) => out.get(c.id)));
  const greensCount = Object.keys(h).length;
  const [lat, lon] = centre(g.map((c) => c.mid));
  index.push({ id: g[0].id, name: g[0].name, lat: round(lat), lon: round(lon), greens: greensCount });
  if (g.length > 1) joined++;
  if (greensCount) {
    for (const c of g) await writeFile(`public/courses/${c.id}.json`, JSON.stringify({ id: g[0].id, name: g[0].name, holes: h }));
    if (greensCount >= 18) full++;
  }
}
// A course OSM redrew gets a new id. Point the old id at the new course, but only when exactly
// one course with greens is within 1.5 km, so it's never pointed at the wrong club.
let kept = 0;
const written = new Set((await readdir('public/courses')).map((f) => f.replace('.json', '')));
for (const [oldId, target] of aliases) {
  if (written.has(oldId) || !written.has(target)) continue;
  await writeFile(`public/courses/${oldId}.json`, await readFile(`public/courses/${target}.json`, 'utf8'));
  kept++;
}
for (const c of before) {
  if (!c.greens || index.some((x) => x.id === c.id)) continue;
  const near = index.filter((x) => x.greens && metres([c.lat, c.lon], [x.lat, x.lon]) < 1500);
  if (near.length !== 1) continue;
  const holes = JSON.parse(await readFile(`public/courses/${near[0].id}.json`, 'utf8'));
  await writeFile(`public/courses/${c.id}.json`, JSON.stringify(holes));
  kept++;
}
if (kept) console.log(`${kept} old course ids now point at their redrawn course.`);
index.sort((a, b) => a.name.localeCompare(b.name));
await writeFile('public/courses/index.json', JSON.stringify(index));
console.log(`${index.length} named courses (${joined} joined from split areas), ${index.filter((c) => c.greens).length} with greens, ${full} with 18 or more.`);
