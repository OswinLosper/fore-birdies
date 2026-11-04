// Everything is kept on this phone only, under the same key the prototype used.
const KEY = 'fore-birdies-v1';

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      return { courses: d.courses || [], rounds: d.rounds || [] };
    }
  } catch (e) {}
  return { courses: [], rounds: [] };
}

export function save(db) {
  try { localStorage.setItem(KEY, JSON.stringify(db)); } catch (e) {}
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function fill(n, v) {
  return Array.from({ length: n }, () => v);
}
