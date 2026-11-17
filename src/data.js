import {
  collection, doc, query, where, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { fill } from './storage.js';

// Firestore layout
//   rounds/{id}                 { ownerId, memberIds[], course, pars[], format, players[], scores{}, done, date }
//   users/{uid}/courses/{id}    { name, pars[] }
// Each score is its own field, "scores.p{player}h{hole}" = { s, by, byName }, so two phones
// changing different scores never clash, and the same score resolves to the last save.
// Which hole you're on and which birdies were cheered belong to this phone only (localStorage).

const UI_KEY = 'fore-birdies-ui';
const scoreKey = (p, h) => 'p' + p + 'h' + h;

function loadUi() {
  try { return JSON.parse(localStorage.getItem(UI_KEY)) || {}; } catch (e) { return {}; }
}
export function saveUi(roundId, patch) {
  const all = loadUi();
  all[roundId] = { ...all[roundId], ...patch };
  try { localStorage.setItem(UI_KEY, JSON.stringify(all)); } catch (e) {}
}

// Firestore document -> the round shape the screens already use.
function toRound(id, d, ui) {
  const scores = d.players.map((_, p) => d.pars.map((__, h) => d.scores?.[scoreKey(p, h)]?.s ?? null));
  const by = d.players.map((_, p) => d.pars.map((__, h) => d.scores?.[scoreKey(p, h)]?.byName ?? null));
  return {
    id, ownerId: d.ownerId, course: d.course, pars: d.pars, format: d.format, players: d.players,
    scores, by, done: !!d.done, date: d.date,
    hole: Math.min(ui?.hole ?? 0, d.pars.length - 1), cheered: ui?.cheered || {},
  };
}

export function watchRounds(uid, onRounds) {
  const q = query(collection(db, 'rounds'), where('memberIds', 'array-contains', uid));
  return onSnapshot(q, (snap) => {
    const ui = loadUi();
    onRounds(snap.docs.map((x) => toRound(x.id, x.data(), ui[x.id])));
  }, (err) => console.error('rounds', err));
}

export function watchCourses(uid, onCourses) {
  return onSnapshot(collection(db, 'users', uid, 'courses'), (snap) => {
    onCourses(snap.docs.map((x) => ({ id: x.id, ...x.data() })));
  }, (err) => console.error('courses', err));
}

function scoreEntries(scores, user) {
  const out = {};
  scores.forEach((row, p) => row.forEach((s, h) => {
    if (s != null) out[scoreKey(p, h)] = { s, by: user.uid, byName: user.name };
  }));
  return out;
}

// Writes never wait for the server: with no signal they queue on the phone and sync later.
const queued = (promise) => { promise.catch((err) => console.error('save', err)); };

export function saveCourse(uid, course) {
  queued(setDoc(doc(db, 'users', uid, 'courses', course.id), { name: course.name, pars: course.pars }));
}

export function newRoundId() {
  return doc(collection(db, 'rounds')).id;
}

export function createRound(user, r) {
  queued(setDoc(doc(db, 'rounds', r.id), {
    ownerId: user.uid, memberIds: [user.uid], course: r.course, pars: r.pars, format: r.format,
    players: r.players, scores: {}, done: false, date: r.date, createdAt: serverTimestamp(),
  }));
}

// Save only what changed between two versions of a round.
export function saveRoundChanges(user, before, after) {
  const patch = {};
  after.scores.forEach((row, p) => row.forEach((s, h) => {
    if (s != null && s !== before.scores[p][h]) patch['scores.' + scoreKey(p, h)] = { s, by: user.uid, byName: user.name };
  }));
  if (after.done !== before.done) patch.done = after.done;
  if (Object.keys(patch).length) queued(updateDoc(doc(db, 'rounds', after.id), patch));
  if (after.hole !== before.hole || after.cheered !== before.cheered) {
    saveUi(after.id, { hole: after.hole, cheered: after.cheered });
  }
}

export function deleteRoundDoc(id) {
  queued(deleteDoc(doc(db, 'rounds', id)));
}

// The first time anyone signs in on this phone, copy the rounds and courses the app kept
// on the phone before accounts existed into that account. Only once per phone, so a second
// account on the same phone doesn't get them too. The old copy is left in place as a backup.
export function importLocal(user, local) {
  const flag = 'fore-birdies-imported';
  try { if (localStorage.getItem(flag)) return 0; } catch (e) { return 0; }
  const { courses, rounds } = local;
  if (!courses.length && !rounds.length) return 0;
  const batch = writeBatch(db);
  courses.forEach((c) => batch.set(doc(db, 'users', user.uid, 'courses', c.id), { name: c.name, pars: c.pars }));
  rounds.forEach((r) => {
    batch.set(doc(db, 'rounds', r.id), {
      ownerId: user.uid, memberIds: [user.uid], course: r.course, pars: r.pars, format: r.format,
      players: r.players, scores: scoreEntries(r.scores || r.players.map(() => fill(r.pars.length, null)), user),
      done: !!r.done, date: r.date, createdAt: serverTimestamp(),
    });
    saveUi(r.id, { hole: r.hole || 0, cheered: r.cheered || {} });
  });
  queued(batch.commit());
  try { localStorage.setItem(flag, String(Date.now())); } catch (e) {}
  return rounds.length;
}
