import { useEffect, useRef } from 'react';

// The app's own "are you sure?" box. The browser's window.confirm is silently skipped
// in some in-app browsers, which made Sign out and Delete do nothing.
export default function Confirm({ title, text, yes, no = 'Cancel', onYes, onNo }) {
  const cancel = useRef(null);
  useEffect(() => {
    cancel.current?.focus();
    const onKey = (e) => { if (e.key === 'Escape') onNo(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onNo]);

  return (
    <div className="confirm-back" onClick={onNo}>
      <div className="confirm card stack" role="alertdialog" aria-modal="true" aria-labelledby="confirm-title"
        aria-describedby="confirm-text" onClick={(e) => e.stopPropagation()}>
        <h2 id="confirm-title">{title}</h2>
        <p id="confirm-text" className="muted">{text}</p>
        <div className="confirm-btns">
          <button ref={cancel} className="btn btn-ghost" type="button" onClick={onNo}>{no}</button>
          <button className="btn btn-primary" type="button" onClick={onYes}>{yes}</button>
        </div>
      </div>
    </div>
  );
}
