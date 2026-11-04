import { useEffect, useState } from 'react';

const DISMISSED = 'fore-birdies-install-dismissed';

function isInstalled() {
  return window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
}
function isIOS() {
  const ua = navigator.userAgent;
  return /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
}
function wasDismissed() {
  try { return localStorage.getItem(DISMISSED) === '1'; } catch (e) { return false; }
}

// Android/Chrome offers a real install prompt; iPhone only installs via Safari's Share menu,
// so there we show the steps instead.
export default function InstallTip() {
  const [prompt, setPrompt] = useState(null);
  const [hidden, setHidden] = useState(() => isInstalled() || wasDismissed());

  useEffect(() => {
    const onPrompt = (e) => { e.preventDefault(); setPrompt(e); };
    const onInstalled = () => setHidden(true);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (hidden || (!prompt && !isIOS())) return null;

  function dismiss() {
    try { localStorage.setItem(DISMISSED, '1'); } catch (e) {}
    setHidden(true);
  }

  return (
    <section className="section card install">
      <h2>Put it on your home screen</h2>
      {prompt ? (
        <>
          <p>Install Fore Birdies so it opens like an app and works without signal.</p>
          <button className="btn btn-primary" type="button"
            onClick={async () => { prompt.prompt(); await prompt.userChoice; setPrompt(null); }}>
            Install app
          </button>
        </>
      ) : (
        <p>In Safari, tap the <strong>Share</strong> button, then <strong>Add to Home Screen</strong>. It opens like an app and works without signal.</p>
      )}
      <button className="btn-text" type="button" onClick={dismiss}>Not now</button>
    </section>
  );
}
