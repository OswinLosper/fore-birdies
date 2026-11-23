import {
  onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInAnonymously, linkWithPopup, linkWithCredential,
  EmailAuthProvider, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut,
} from 'firebase/auth';
import { auth } from './firebase.js';

const LINK_EMAIL = 'fore-birdies-link-email';

// Firebase user -> the few things the app needs. A guest joined a round with a code and has
// no account (Firebase "anonymous" sign-in).
export function toUser(u) {
  if (!u) return null;
  if (u.isAnonymous) return { uid: u.uid, name: u.displayName || 'Guest', email: null, guest: true };
  const name = u.displayName || (u.email ? u.email.split('@')[0] : 'You');
  const via = u.providerData.some((p) => p.providerId === 'google.com') ? 'Google' : 'email';
  return { uid: u.uid, name, email: u.email, via, guest: false };
}

// Like onAuthStateChanged, but also fires when an account gets its name or a guest becomes
// a real account. Firebase doesn't report either of those itself.
const listeners = new Set();
const tell = (u) => listeners.forEach((cb) => cb(toUser(u)));
export function watchUser(cb) {
  listeners.add(cb);
  const stop = onAuthStateChanged(auth, (u) => cb(toUser(u)));
  return () => { listeners.delete(cb); stop(); };
}

export const signInGoogle = () => signInWithPopup(auth, new GoogleAuthProvider());

export const signInPassword = (email, password) => signInWithEmailAndPassword(auth, email.trim(), password);

export async function createAccount(name, email, password) {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  if (name.trim()) {
    await updateProfile(cred.user, { displayName: name.trim() });
    tell(cred.user);
  }
  return cred;
}

export async function signInGuest() {
  if (auth.currentUser) return toUser(auth.currentUser);
  return toUser((await signInAnonymously(auth)).user);
}

// A guest's name is the player they claimed on the card.
export async function setGuestName(name) {
  const u = auth.currentUser;
  if (!u?.isAnonymous) return;
  await updateProfile(u, { displayName: name });
  tell(u);
}

// The name your mates see. Rounds you already started keep the old one.
export async function setName(name) {
  const u = auth.currentUser;
  if (!u || !name.trim()) return;
  await updateProfile(u, { displayName: name.trim() });
  tell(u);
}

// Turning a guest into a real account keeps the same user, so their rounds come along.
export async function upgradeGoogle() {
  const cred = await linkWithPopup(auth.currentUser, new GoogleAuthProvider());
  tell(cred.user);
}

export async function upgradeEmail(name, email, password) {
  const cred = await linkWithCredential(auth.currentUser, EmailAuthProvider.credential(email.trim(), password));
  if (name.trim()) await updateProfile(cred.user, { displayName: name.trim() });
  tell(cred.user);
}

export const resetPassword = (email) => sendPasswordResetEmail(auth, email.trim());

export async function sendLink(email) {
  await sendSignInLinkToEmail(auth, email.trim(), { url: location.origin + '/', handleCodeInApp: true });
  try { localStorage.setItem(LINK_EMAIL, email.trim()); } catch (e) {}
}

// Called on start-up: finishes signing in when the app was opened from an emailed link.
export async function finishLinkSignIn() {
  if (!isSignInWithEmailLink(auth, location.href)) return;
  let email = null;
  try { email = localStorage.getItem(LINK_EMAIL); } catch (e) {}
  // Opened on a different phone or browser than the one that asked for the link.
  if (!email) email = window.prompt('Which email did you use for the sign-in link?');
  if (!email) return;
  try {
    await signInWithEmailLink(auth, email.trim(), location.href);
    try { localStorage.removeItem(LINK_EMAIL); } catch (e) {}
  } finally {
    history.replaceState(null, '', '/');
  }
}

export const logOut = () => signOut(auth);

// Firebase error codes -> plain words.
export function authMessage(err) {
  const code = err?.code || '';
  const msgs = {
    'auth/network-request-failed': 'No signal. Signing in needs signal the first time, so try at home or in the clubhouse.',
    'auth/invalid-email': 'That email doesn’t look right.',
    'auth/missing-email': 'Add your email first.',
    'auth/invalid-credential': 'Wrong email or password.',
    'auth/wrong-password': 'Wrong email or password.',
    'auth/user-not-found': 'Wrong email or password.',
    'auth/missing-password': 'Add your password.',
    'auth/weak-password': 'Use at least 6 characters for your password.',
    'auth/email-already-in-use': 'There’s already an account with that email. Sign in instead.',
    'auth/credential-already-in-use': 'That Google account already has a Fore Birdies account. Sign in with it instead.',
    'auth/provider-already-linked': 'You already have an account.',
    'auth/admin-restricted-operation': 'Joining as a guest is switched off. Ask the starter to check Fore Birdies settings.',
    'auth/unauthorized-domain': 'Sign-in isn’t switched on for this web address yet. Add it under Firebase → Authentication → Settings → Authorized domains.',
    'auth/operation-not-allowed': 'That way of signing in is switched off in Firebase. Try another one.',
    'auth/too-many-requests': 'Too many tries. Wait a few minutes and try again.',
    'auth/popup-closed-by-user': '',
    'auth/cancelled-popup-request': '',
    'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups and try again.',
    'auth/invalid-action-code': 'That sign-in link has expired or was already used. Ask for a new one.',
  };
  return code in msgs ? msgs[code] : 'Something went wrong. Try again.';
}
