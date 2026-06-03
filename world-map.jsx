// world-map.jsx — dotted world map driven by a real-geography land mask
// (landmask.json), with hoverable city markers projected over it.

// View window — landmask.json is a clean full equirectangular grid generated
// from Natural Earth coastlines (288×144), so longitude/latitude map directly.
const __VIEW = { latMax: 90, latMin: -90, lngMin: -180, lngMax: 180 };

// Horizontal fraction (0..1) for a longitude, wrapped into the view window.
function __lngFrac(lng) {
  const { lngMin, lngMax } = __VIEW;
  return ((((lng - lngMin) % 360) + 360) % 360) / (lngMax - lngMin);
}

function __projectLngLat(lng, lat, w, h) {
  const { latMax, latMin } = __VIEW;
  const x = __lngFrac(lng) * w;
  const y = ((latMax - lat) / (latMax - latMin)) * h;
  return [x, y];
}

// Snap a lng/lat to the centre of the nearest land cell in the mask, so the
// city marker rests exactly on a rendered map dot instead of floating between
// dots (or just off a coarse coastline). Returns pixel coords in the W×H box.
function __snapToLand(lng, lat, mask, w, h) {
  const { latMax, latMin } = __VIEW;
  const cols = mask.cols, rows = mask.rows;
  const cellW = w / cols, cellH = h / rows;
  // Raw grid cell for this coordinate (longitude wrapped into the window).
  const col0 = Math.min(cols - 1, Math.floor(__lngFrac(lng) * cols));
  const row0 = Math.floor(((latMax - lat) / (latMax - latMin)) * rows);
  const isLand = (c, r) => {
    if (r < 0 || r >= rows || c < 0 || c >= cols) return false;
    return mask.rows_data[r].charCodeAt(c) === 49; // '1'
  };
  const center = (c, r) => [((c + 0.5) * cellW), ((r + 0.5) * cellH)];
  if (isLand(col0, row0)) return center(col0, row0);
  // Spiral outward to the nearest land cell (Chebyshev rings).
  for (let rad = 1; rad <= 8; rad++) {
    let best = null, bestD = Infinity;
    for (let dr = -rad; dr <= rad; dr++) {
      for (let dc = -rad; dc <= rad; dc++) {
        if (Math.max(Math.abs(dr), Math.abs(dc)) !== rad) continue; // ring only
        const c = col0 + dc, r = row0 + dr;
        if (!isLand(c, r)) continue;
        const d = dr * dr + dc * dc;
        if (d < bestD) { bestD = d; best = [c, r]; }
      }
    }
    if (best) return center(best[0], best[1]);
  }
  // No land found nearby — fall back to the raw projection.
  return __projectLngLat(lng, lat, w, h);
}

// ── Geocoder ────────────────────────────────────────────────────────
// Strategy:
//   1. Read geocache.json (file-backed cache shipped with the site → fast
//      cold load for visitors).
//   2. Layer localStorage cache on top (per-browser; for visitors who hit
//      Nominatim themselves on a fresh place).
//   3. Anything still missing → Nominatim (1 req/sec) → update state +
//      both caches. In the editor preview the file cache is rewritten via
//      window.omelette.writeFile so the resolved coords get checked in;
//      on a static deployment that write is a no-op (omelette absent) and
//      the localStorage cache covers repeat visitors.
const LS_CACHE_KEY = 'itsamod.geocache.v1';
const __GEO_HELP =
  "Auto-managed cache of place names → coordinates. Don't edit by hand — " +
  "the site geocodes new places from content.json via OpenStreetMap " +
  "(Nominatim) and stores results here. Safe to delete; it will re-resolve " +
  "on next load.";

async function __loadFileCache() {
  try {
    const r = await fetch('geocache.json', { cache: 'no-cache' });
    if (!r.ok) return {};
    const data = await r.json();
    return data.places || {};
  } catch (_) { return {}; }
}
function __loadLsCache() {
  try { return JSON.parse(localStorage.getItem(LS_CACHE_KEY) || '{}'); }
  catch (_) { return {}; }
}
function __saveLsCache(cache) {
  try { localStorage.setItem(LS_CACHE_KEY, JSON.stringify(cache)); }
  catch (_) {}
}
async function __saveFileCache(cache) {
  if (!window.omelette || !window.omelette.writeFile) return;
  try {
    const payload = { _help: __GEO_HELP, places: cache };
    await window.omelette.writeFile('geocache.json',
      JSON.stringify(payload, null, 2) + '\n');
  } catch (_) {}
}
async function __geocode(place) {
  const url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q='
            + encodeURIComponent(place);
  const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
  if (!r.ok) throw new Error('geocode HTTP ' + r.status);
  const data = await r.json();
  if (!data[0]) throw new Error('geocode no results for ' + place);
  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
  };
}

// ── Land mask ───────────────────────────────────────────────────────
// Cached so the world map renders the same grid for every WorldMap
// instance and React StrictMode double-mount doesn't refetch.
let __maskPromise = null;
function __loadMask() {
  if (!__maskPromise) {
    __maskPromise = fetch('landmask.json', { cache: 'force-cache' })
      .then((r) => r.json())
      .catch(() => null);
  }
  return __maskPromise;
}

function WorldMap({ cities = [] }) {
  // SVG units. Aspect ratio matches the mask exactly so dots align.
  const [mask, setMask] = React.useState(null);
  React.useEffect(() => {
    let m = true;
    __loadMask().then((m_) => { if (m) setMask(m_); });
    return () => { m = false; };
  }, []);

  // Compute the SVG box from mask dimensions if loaded; fall back to 2:1.
  const COLS = mask?.cols || 288;
  const ROWS = mask?.rows || 144;
  const W = 800;
  const H = 400;
  const cellW = W / COLS;
  const cellH = H / ROWS;

  // Derive the rendered dot positions from the mask. Each cell that's '1'
  // becomes a small circle. We build them as one static SVG string and inject
  // via dangerouslySetInnerHTML so React doesn't reconcile thousands of fibers.
  const dotsHTML = React.useMemo(() => {
    if (!mask) return '';
    const r2 = Math.min(cellW, cellH) * 0.42; // dot radius — leaves visible grid gaps
    const parts = [];
    for (let r = 0; r < ROWS; r++) {
      const row = mask.rows_data[r];
      const y = ((r + 0.5) * cellH).toFixed(2);
      for (let c = 0; c < COLS; c++) {
        if (row.charCodeAt(c) === 49 /* '1' */) {
          const x = ((c + 0.5) * cellW).toFixed(2);
          parts.push('<circle cx="' + x + '" cy="' + y + '" r="' + r2.toFixed(2) + '"/>');
        }
      }
    }
    return parts.join('');
  }, [mask, cellW, cellH]);

  const [hover, setHover] = React.useState(null);
  const wrapRef = React.useRef(null);
  const [tipPos, setTipPos] = React.useState({ x: 0, y: 0 });

  // Resolved cities — populated progressively as geocoder finishes.
  const [resolved, setResolved] = React.useState(() =>
    cities.map((c) => ({ ...c }))
  );

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      const fileCache = await __loadFileCache();
      const lsCache = __loadLsCache();
      // File cache wins over localStorage (it's the curated/checked-in copy).
      const cache = { ...lsCache, ...fileCache };

      const seeded = cities.map((c) => {
        if (c.lat != null && c.lng != null) return c;
        const hit = cache[c.place];
        return hit ? { ...c, lat: hit.lat, lng: hit.lng } : c;
      });
      if (!mounted) return;
      setResolved(seeded);

      const missing = seeded.filter((c) => c.lat == null || c.lng == null);
      if (!missing.length) return;

      // Throttled Nominatim (1 req/sec policy).
      for (const c of missing) {
        if (!mounted) return;
        try {
          const coords = await __geocode(c.place);
          cache[c.place] = coords;
          if (!mounted) return;
          setResolved((prev) => prev.map((x) =>
            x.place === c.place ? { ...x, ...coords } : x));
          __saveLsCache(cache);
          __saveFileCache(cache);
        } catch (err) {
          console.warn('[impact map] could not geocode', c.place, err);
        }
        await new Promise((r) => setTimeout(r, 1100));
      }
    })();
    return () => { mounted = false; };
  }, [JSON.stringify(cities.map((c) => c.place))]);

  const placed = resolved.filter((c) => c.lat != null && c.lng != null);

  // Snapped marker positions, with coincident markers fanned out. At this grid
  // resolution two nearby cities (e.g. Espoo & Helsinki, ~15km apart) snap to
  // the same cell centre; without this they'd render exactly on top of each
  // other and only one would be visible/hoverable.
  const placedPos = React.useMemo(() => {
    const base = placed.map((c) =>
      mask ? __snapToLand(c.lng, c.lat, mask, W, H)
           : __projectLngLat(c.lng, c.lat, W, H));
    const groups = new Map();
    base.forEach((p, i) => {
      const key = Math.round(p[0]) + ':' + Math.round(p[1]);
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(i);
    });
    const out = base.map((p) => [p[0], p[1]]);
    for (const idxs of groups.values()) {
      if (idxs.length < 2) continue;
      const R = 5.5; // viewBox units — separates dots while keeping them clustered
      idxs.forEach((idx, k) => {
        const ang = (2 * Math.PI * k) / idxs.length - Math.PI / 2;
        out[idx] = [base[idx][0] + R * Math.cos(ang), base[idx][1] + R * Math.sin(ang)];
      });
    }
    return out;
  }, [resolved, mask, W, H]);

  const showTip = (city, evt) => {
    setHover(city);
    if (!wrapRef.current) return;
    const r = wrapRef.current.getBoundingClientRect();
    setTipPos({
      x: evt.clientX - r.left,
      y: evt.clientY - r.top,
    });
  };

  return (
    <div className="map" ref={wrapRef}>
      <svg viewBox={`0 0 ${W} ${H}`} role="img"
           aria-label="World map showing places where I've worked or shipped">
        <g className="map__dots" dangerouslySetInnerHTML={{__html: dotsHTML}} />
        {placed.map((c, i) => {
          const [cx, cy] = placedPos[i] || (mask
            ? __snapToLand(c.lng, c.lat, mask, W, H)
            : __projectLngLat(c.lng, c.lat, W, H));
          return (
            <g key={c.place || i} className="map__city-group"
               onMouseEnter={(e) => showTip(c, e)}
               onMouseMove={(e) => showTip(c, e)}
               onMouseLeave={() => setHover(null)}>
              <circle className="map__ring" cx={cx} cy={cy} r="5" />
              <circle className="map__city" cx={cx} cy={cy} r="4" />
              <circle cx={cx} cy={cy} r="14" fill="transparent" />
            </g>
          );
        })}
      </svg>
      <div className={`map__tooltip${hover ? ' show' : ''}`}
           style={{ left: tipPos.x, top: tipPos.y }}>
        {hover && <b>{hover.place}</b>}
      </div>
    </div>
  );
}

window.WorldMap = WorldMap;
