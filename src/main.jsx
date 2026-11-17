import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';

const root = createRoot(document.getElementById('root'));

// Without the Firebase keys the app can't start, and Firebase only says so in the console.
// Say it on screen instead of showing a blank page.
if (!import.meta.env.VITE_FIREBASE_API_KEY || !import.meta.env.VITE_FIREBASE_PROJECT_ID) {
  root.render(
    <main className="wrap stack">
      <h1>Fore Birdies isn’t set up yet</h1>
      <p className="muted">This copy of the app was built without its Firebase keys. Add the VITE_FIREBASE_ settings (see .env.example) and build it again.</p>
    </main>
  );
} else {
  import('./App.jsx').then(({ default: App }) => {
    root.render(
      <StrictMode>
        <App />
      </StrictMode>
    );
  });
}
