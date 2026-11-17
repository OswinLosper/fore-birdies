// Before accounts, everything was kept on the phone under this key. It's now only read once,
// to bring those rounds into the account at first sign-in (see importLocal in data.js).
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

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function fill(n, v) {
  return Array.from({ length: n }, () => v);
}
