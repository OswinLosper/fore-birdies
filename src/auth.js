import {
  onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword,
  updateProfile, sendPasswordResetEmail, sendSignInLinkToEmail, isSignInWithEmailLink, signInWithEmailLink, signOut,
} from 'firebase/auth';
import { auth } from './firebase.js';

const LINK_EMAIL = 'fore-birdies-link-email';

// Firebase user -> the few things the app needs.
export function toUser(u) {
  if (!u || u.isAnonymous) return null;
  const name = u.displayName || (u.email ? u.email.split('@')[0] : 'You');
  return { uid: u.uid, name, email: u.email };
}

// Like onAuthStateChanged, but also fires when a new account gets its name, which Firebase
// saves a moment after the account is created.
const listeners = new Set();
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
    listeners.forEach((cb) => cb(toUser(cred.user)));
  }
  return cred;
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
    'auth/too-many-requests': 'Too many tries. Wait a few minutes and try again.',
    'auth/popup-closed-by-user': '',
    'auth/cancelled-popup-request': '',
    'auth/popup-blocked': 'Your browser blocked the Google window. Allow pop-ups and try again.',
    'auth/invalid-action-code': 'That sign-in link has expired or was already used. Ask for a new one.',
  };
  return code in msgs ? msgs[code] : 'Something went wrong. Try again.';
}
