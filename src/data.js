import {
  collection, doc, query, where, onSnapshot, setDoc, updateDoc, deleteDoc, writeBatch, serverTimestamp,
  getDoc, getDocFromServer, arrayUnion, arrayRemove,
} from 'firebase/firestore';
import { db } from './firebase.js';
import { fill } from './storage.js';

// Firestore layout
//   rounds/{id}                 { ownerId, memberIds[], memberNames{uid:name}, claims{uid:player},
//                                 code, course, courseRef?, pars[], format, players[], scores{}, done, date }
//   codes/{CODE}                { roundId, ownerId }   so mates can find a round by its join code
//   users/{uid}/courses/{id}    { name, pars[], courseRef? }
// courseRef is the course's id on the South African course list (public/courses), for distances.
//   greens/{courseKey}/holes/{n} { lat, lon, by, byName, at }   a green a player saved by standing on it,
//                                 shared with everyone who plays that course (see greenKey)
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
// by[p][h] = { uid, name } of whoever last changed that score.
// pending = some changes are saved on this phone but haven't reached the server yet.
function toRound(id, d, ui, pending = false) {
  const cell = (p, h) => d.scores?.[scoreKey(p, h)];
  const scores = d.players.map((_, p) => d.pars.map((__, h) => cell(p, h)?.s ?? null));
  const by = d.players.map((_, p) => d.pars.map((__, h) => (cell(p, h) ? { uid: cell(p, h).by, name: cell(p, h).byName } : null)));
  return {
    id, ownerId: d.ownerId, code: d.code || null, claims: d.claims || {}, memberNames: d.memberNames || {},
    course: d.course, courseRef: d.courseRef || null, pars: d.pars, format: d.format, players: d.players,
    scores, by, pending, done: !!d.done, date: d.date,
    hole: Math.min(ui?.hole ?? 0, d.pars.length - 1), cheered: ui?.cheered || {},
  };
}

export function watchRounds(uid, onRounds) {
  const q = query(collection(db, 'rounds'), where('memberIds', 'array-contains', uid));
  return onSnapshot(q, { includeMetadataChanges: true }, (snap) => {
    const ui = loadUi();
    onRounds(snap.docs.map((x) => toRound(x.id, x.data(), ui[x.id], x.metadata.hasPendingWrites)));
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
  queued(setDoc(doc(db, 'users', uid, 'courses', course.id), { name: course.name, pars: course.pars, courseRef: course.courseRef || null }));
}

// Only takes it off your saved courses: rounds played there and saved greens stay.
export function deleteCourse(uid, id) {
  queued(deleteDoc(doc(db, 'users', uid, 'courses', id)));
}

export function newRoundId() {
  return doc(collection(db, 'rounds')).id;
}

// Letters and digits that can't be mixed up when read out on the tee (no O/0, I/1).
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export function newCode() {
  return Array.from(crypto.getRandomValues(new Uint32Array(6)), (n) => CODE_CHARS[n % CODE_CHARS.length]).join('');
}

// Works with no signal: the round and its code queue on the phone and go up together.
export function createRound(user, r) {
  const batch = writeBatch(db);
  batch.set(doc(db, 'rounds', r.id), {
    ownerId: user.uid, memberIds: [user.uid], memberNames: { [user.uid]: user.name }, claims: r.claims,
    code: r.code, course: r.course, courseRef: r.courseRef || null, pars: r.pars, format: r.format,
    players: r.players, scores: {}, done: false, date: r.date, createdAt: serverTimestamp(),
  });
  batch.set(doc(db, 'codes', r.code), { roundId: r.id, ownerId: user.uid });
  queued(batch.commit());
}

// Calls back with true once the code has reached the server, so mates can use it.
export function watchCode(code, onLive) {
  return onSnapshot(doc(db, 'codes', code), { includeMetadataChanges: true },
    (s) => onLive(s.exists() && !s.metadata.hasPendingWrites), () => onLive(false));
}

export function cleanCode(text) {
  return text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6);
}

// Joining needs signal: the code is looked up on the server. Returns the round, or null.
export async function joinByCode(user, code) {
  const c = await getDocFromServer(doc(db, 'codes', code));
  if (!c.exists()) return null;
  const roundId = c.data().roundId;
  const ref = doc(db, 'rounds', roundId);
  await updateDoc(ref, { memberIds: arrayUnion(user.uid), ['memberNames.' + user.uid]: user.name });
  const r = await getDoc(ref);
  return toRound(r.id, r.data(), loadUi()[r.id]);
}

export function claimPlayer(user, round, p) {
  queued(updateDoc(doc(db, 'rounds', round.id), {
    ['claims.' + user.uid]: p, ['memberNames.' + user.uid]: round.players[p],
  }));
}

export function leaveRound(user, id) {
  queued(updateDoc(doc(db, 'rounds', id), { memberIds: arrayRemove(user.uid) }));
}

// Save only what changed between two versions of a round. Also marks the changed scores
// as yours on `after`, so the screen is right before Firebase reports back.
export function saveRoundChanges(user, before, after) {
  const patch = {};
  after.scores.forEach((row, p) => row.forEach((s, h) => {
    if (s != null && s !== before.scores[p][h]) {
      patch['scores.' + scoreKey(p, h)] = { s, by: user.uid, byName: user.name };
      after.by[p][h] = { uid: user.uid, name: user.name };
    }
  }));
  if (Object.keys(patch).length) after.pending = true;
  if (after.done !== before.done) patch.done = after.done;
  if (Object.keys(patch).length) queued(updateDoc(doc(db, 'rounds', after.id), patch));
  if (after.hole !== before.hole || after.cheered !== before.cheered) {
    saveUi(after.id, { hole: after.hole, cheered: after.cheered });
  }
}

export function deleteRoundDoc(round) {
  queued(deleteDoc(doc(db, 'rounds', round.id)));
  if (round.code) queued(deleteDoc(doc(db, 'codes', round.code)));
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
      ownerId: user.uid, memberIds: [user.uid], memberNames: { [user.uid]: user.name }, claims: {},
      course: r.course, pars: r.pars, format: r.format,
      players: r.players, scores: scoreEntries(r.scores || r.players.map(() => fill(r.pars.length, null)), user),
      done: !!r.done, date: r.date, createdAt: serverTimestamp(),
    });
    saveUi(r.id, { hole: r.hole || 0, cheered: r.cheered || {} });
  });
  queued(batch.commit());
  try { localStorage.setItem(flag, String(Date.now())); } catch (e) {}
  return rounds.length;
}

// Which course saved greens belong to: its id on the course list, or else its typed name,
// so everyone who types the same name shares them.
export function greenKey(round) {
  if (round.courseRef) return round.courseRef;
  const name = round.course.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 80);
  return name ? 'n-' + name : null;
}

// { "7": { green: [[lat, lon]], by, byName }, ... }. Works offline from what this phone saw last.
export function watchGreens(key, onGreens) {
  return onSnapshot(collection(db, 'greens', key, 'holes'), (snap) => {
    const out = {};
    snap.docs.forEach((x) => {
      const g = x.data();
      out[x.id] = { green: [[g.lat, g.lon]], by: g.by, byName: g.byName };
    });
    onGreens(out);
  }, (err) => console.error('greens', err));
}

// Newest save wins. Queues on the phone with no signal.
export function saveGreen(user, key, hole, [lat, lon]) {
  queued(setDoc(doc(db, 'greens', key, 'holes', String(hole)), {
    lat, lon, by: user.uid, byName: user.name, at: serverTimestamp(),
  }));
}
