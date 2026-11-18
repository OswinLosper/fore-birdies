import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { toGreen, inUnits, metres, centre, courseIndex } from './geo.js';

// Esri satellite photos. The key only works from fore-birdies.vercel.app and localhost, and
// pay-as-you-go is off, so going over the free tier stops the map rather than billing.
const KEY = import.meta.env.VITE_ESRI_KEY;
const TILES = 'https://ibasemaps-api.arcgis.com/arcgis/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}?token=' + KEY;
const IMAGERY_CREDIT = 'Esri, Vantor, GeoEye, Earthstar Geographics, CNES/Airbus DS, USDA, USGS, AeroGRID, IGN, and the GIS User Community';

// Further than this and you're not playing this hole, so the map frames the hole without you.
const NEAR = 1500;
const ll = ([lat, lon]) => [lon, lat];
const rad = Math.PI / 180;
function bearing([a, b], [c, d]) {
  const y = Math.sin((d - b) * rad) * Math.cos(c * rad);
  const x = Math.cos(a * rad) * Math.sin(c * rad) - Math.sin(a * rad) * Math.cos(c * rad) * Math.cos((d - b) * rad);
  return Math.atan2(y, x) / rad;
}
const el = (cls, html = '') => { const d = document.createElement('div'); d.className = cls; d.innerHTML = html; return d; };
const FLAG = '<svg width="34" height="44" viewBox="0 0 34 44" aria-hidden="true"><ellipse cx="6" cy="41" rx="6" ry="3" fill="rgba(0,0,0,.45)"/><path d="M6 41V3" stroke="#fff" stroke-width="3"/><path d="M7 3l24 7-24 7z" fill="#F2C230"/></svg>';

// Full-screen satellite view of one hole. Tap for distances; on holes without a green (or with a
// player-saved one), signed-in players drop a pin on the green and save it for everyone.
export default function HoleMap({ round, hole, par, data, fix, units, canSave, nearOther, onSave, onClose }) {
  const box = useRef(null);
  const map = useRef(null);
  const marks = useRef({});
  const [ready, setReady] = useState(false);
  const [offline, setOffline] = useState(!navigator.onLine);
  const [tap, setTap] = useState(null);
  const [placing, setPlacing] = useState(!data.green && canSave);
  const [pin, setPin] = useState(null);
  const [warn, setWarn] = useState('');
  // The click handler is set up once, so it reads placing through a ref.
  const placingRef = useRef(placing);
  placingRef.current = placing;
  const green = data.green;
  const mid = green && (green.length === 1 ? green[0] : centre(green));
  const u = units === 'yd' ? 'yd' : 'm';
  const here = fix && fix.acc <= 30 ? fix.at : null;

  // Build the map once, framed on the hole: tee at the bottom and green at the top when we know the tee.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      let view;
      if (green && data.tee) {
        const b = new maplibregl.LngLatBounds();
        [data.tee, ...green].forEach((p) => b.extend(ll(p)));
        if (here && metres(here, mid) < NEAR) b.extend(ll(here));
        view = { bounds: b, bearing: bearing(data.tee, mid) };
      } else if (green) {
        const b = new maplibregl.LngLatBounds();
        green.forEach((p) => b.extend(ll(p)));
        if (here && metres(here, mid) < NEAR) b.extend(ll(here)); else view = { center: ll(mid), zoom: 17.5 };
        view ||= { bounds: b };
      } else {
        const listed = round.courseRef && (await courseIndex()).find((c) => c.id === round.courseRef);
        const spot = here && (!listed || metres(here, [listed.lat, listed.lon]) < 3000) ? here : listed && [listed.lat, listed.lon];
        view = spot ? { center: ll(spot), zoom: here === spot ? 17.5 : 15.5 } : { center: [25, -29], zoom: 4.5 };
      }
      if (cancelled) return;
      const m = new maplibregl.Map({
        container: box.current,
        attributionControl: false,
        dragRotate: false,
        pitchWithRotate: false,
        style: {
          version: 8,
          sources: { photo: { type: 'raster', tiles: [TILES], tileSize: 256, maxzoom: 19 } },
          layers: [{ id: 'photo', type: 'raster', source: 'photo' }],
        },
        center: view.center || view.bounds.getCenter(),
        zoom: view.zoom || 16,
        bearing: view.bearing || 0,
        maxZoom: 20,
      });
      map.current = m;
      m.on('error', (e) => { if (e?.sourceId === 'photo' || e?.tile) setOffline(true); });
      m.on('load', () => {
        // Frame the hole once the map knows its own size.
        m.resize();
        if (view.bounds) {
          try {
            m.fitBounds(view.bounds, { bearing: view.bearing || 0, padding: { top: 170, bottom: 130, left: 40, right: 40 }, duration: 0, maxZoom: 18.5 });
          } catch (e) { m.jumpTo({ center: view.bounds.getCenter(), zoom: 17, bearing: view.bearing || 0 }); }
        }
        m.addSource('lines', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
        m.addLayer({ id: 'outline', type: 'line', source: 'lines', filter: ['==', ['get', 'kind'], 'outline'], paint: { 'line-color': '#fff', 'line-width': 2, 'line-opacity': 0.85 } });
        m.addLayer({ id: 'to-tap', type: 'line', source: 'lines', filter: ['==', ['get', 'kind'], 'me'], paint: { 'line-color': '#fff', 'line-width': 3, 'line-dasharray': [2, 1.5] } });
        m.addLayer({ id: 'to-green', type: 'line', source: 'lines', filter: ['==', ['get', 'kind'], 'green'], paint: { 'line-color': '#F2C230', 'line-width': 3, 'line-dasharray': [2, 1.5] } });
        setReady(true);
      });
      m.on('click', (e) => {
        const p = [e.lngLat.lat, e.lngLat.lng];
        setWarn('');
        if (placingRef.current) setPin(p); else setTap(p);
      });
    })();
    return () => { cancelled = true; map.current?.remove(); map.current = null; };
  }, []);

  useEffect(() => {
    const on = () => setOffline(false), off = () => setOffline(true);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Markers and lines follow your position, the tapped spot and the pin.
  useEffect(() => {
    const m = map.current;
    if (!m || !ready) return;
    const put = (name, at, make, opts = {}) => {
      if (!at) { marks.current[name]?.remove(); delete marks.current[name]; return; }
      if (!marks.current[name]) marks.current[name] = new maplibregl.Marker({ element: make(), ...opts }).setLngLat(ll(at)).addTo(m);
      else marks.current[name].setLngLat(ll(at));
    };
    const target = placing ? null : tap;
    put('me', here, () => el('hm-me'));
    put('flag', placing ? null : mid, () => el('hm-flag', FLAG), { anchor: 'bottom-left', offset: [-6, 0] });
    put('tap', target, () => el('hm-tap'));
    if (placing) {
      put('pin', pin, () => el('hm-pin-wrap', '<div class="hm-pin"></div>'), { anchor: 'bottom', draggable: true });
      marks.current.pin?.off('dragend');
      marks.current.pin?.on('dragend', () => { const q = marks.current.pin.getLngLat(); setPin([q.lat, q.lng]); setWarn(''); });
    } else put('pin', null);
    const half = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const end = placing ? pin : target || (here && mid && metres(here, mid) < NEAR ? mid : null);
    const fromMe = here && end && metres(here, end) < NEAR ? here : null;
    put('chip-me', fromMe && end && half(fromMe, end), () => el('hm-chip'), { offset: [52, 0] });
    if (marks.current['chip-me']) marks.current['chip-me'].getElement().textContent = fromMe && inUnits(metres(fromMe, end), units) + ' ' + u + (placing ? ' to the pin' : '');
    put('chip-green', !placing && target && mid && half(target, mid), () => el('hm-chip hm-chip-green'), { offset: [66, 0] });
    if (marks.current['chip-green']) marks.current['chip-green'].getElement().textContent = target && mid && inUnits(metres(target, mid), units) + ' ' + u + ' to green';
    const line = (kind, pts) => ({ type: 'Feature', properties: { kind }, geometry: { type: 'LineString', coordinates: pts.map(ll) } });
    const feats = [];
    if (!placing && green?.length > 2) feats.push(line('outline', [...green, green[0]]));
    if (fromMe && end) feats.push(line('me', [fromMe, end]));
    if (!placing && target && mid) feats.push(line('green', [target, mid]));
    m.getSource('lines')?.setData({ type: 'FeatureCollection', features: feats });
  }, [ready, here?.[0], here?.[1], tap, pin, placing, units]);

  function save(force) {
    const near = !force && nearOther(pin);
    if (near) { setWarn('That’s right next to hole ' + near + '’s green. Is it the same green?'); return; }
    onSave(pin);
    setPlacing(false);
    setPin(null);
    setWarn('');
  }

  let card;
  if (placing) {
    card = <div className="hm-card hm-note"><b>{green ? 'Fixing this green' : 'No green saved yet'}</b><small>Tap the middle of the green on the photo</small></div>;
  } else if (!green) {
    card = <div className="hm-card hm-note"><b>No green saved yet</b><small>{canSave ? 'Tap below to save it' : 'Someone with an account can save it'}</small></div>;
  } else if (here) {
    const d = toGreen(here, green);
    card = d.middle > 700
      ? <div className="hm-card hm-note"><b>{d.middle >= 1000 ? (d.middle / 1000).toFixed(1) + ' km' : inUnits(d.middle, units) + ' ' + u}</b><small>from this green</small></div>
      : (
        <div className="hm-card hm-dist" aria-label="Distance to the green">
          {d.front != null && <div className="hm-fb"><span>Front<b>{inUnits(d.front, units)}</b></span><span>Back<b>{inUnits(d.back, units)}</b></span></div>}
          <div className="hm-mid">{inUnits(d.middle, units)}</div>
          <small>{u === 'm' ? 'metres' : 'yards'} to the middle</small>
        </div>
      );
  } else {
    card = <div className="hm-card hm-note"><b>Looking for GPS…</b><small>Tap the photo for distances to the green</small></div>;
  }

  return (
    <div className="holemap" role="dialog" aria-label={'Map of hole ' + (hole + 1)}>
      <div ref={box} className="hm-map" />
      <div className="hm-top">
        <div className="hm-card hm-hole"><span>{round.course}</span><b>Hole {hole + 1}</b><span>Par {par}</span></div>
        {card}
      </div>
      {offline && <p className="hm-banner">The map needs signal. Distances still work on the scores screen.</p>}
      {!offline && placing && (
        <p className="hm-banner">{warn || (pin ? 'Drag the pin to the middle of the green if it’s not quite right, then save.' : 'Tap the middle of the green to drop a pin.')}</p>
      )}
      <p className="hm-credit">
        Powered by Esri · {IMAGERY_CREDIT}
        {data.fromMap && <> · Green © OpenStreetMap contributors</>}
      </p>
      <div className="hm-bottom">
        {placing ? (
          <>
            <button className="btn hm-btn-ghost" type="button" onClick={() => { setPlacing(false); setPin(null); setWarn(''); if (!green) onClose(); }}>Cancel</button>
            <button className="btn btn-primary" type="button" disabled={!pin} onClick={() => save(!!warn)}>
              {warn ? 'Yes, save it' : 'Save green here'}
            </button>
          </>
        ) : (
          <>
            <button className="btn hm-btn-ghost" type="button" onClick={onClose}>Back to scores</button>
            {canSave && (
              <button className="btn btn-primary" type="button" onClick={() => { setTap(null); setPlacing(true); }}>
                {green ? 'Fix this green' : 'Save the green'}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
